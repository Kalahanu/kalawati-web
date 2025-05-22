const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const bcrypt = require("bcrypt");
const path = require("path");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 3000;
const fs = require("fs");
const multer = require("multer");


require("dotenv").config();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only PDF, DOC, and DOCX files are allowed."
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, 
});

mongoose
  .connect("mongodb+srv://keplhr:kepl2025@cluster0.bjjn10n.mongodb.net/", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB", err));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(
  session({
    secret: "mfnjlasd%gnf43nfjlds",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 },
  })
);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "public", "views"));
app.use(cors());

app.use((req, res, next) => {
  res.locals.req = req;
  next();
});


const applicationSchema = new mongoose.Schema({
  position: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
  employmentType: { type: String, required: true },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  nationality: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  cityState: { type: String, required: true },
  zipcode: { type: String, required: true },
  maritalStatus: { type: String },
  drivingLicense: { type: String },
  resumePath: { type: String },
  status: { type: String, default: "Pending" },
  createdAt: { type: Date, default: Date.now },
});


const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  department: { type: String, required: true },
  jobType: { type: String, required: true, default: "Full-time" },
  description: { type: String, required: true },
  tags: [String],
  salary: { type: String, default: "Competitive Salary" },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const Job = mongoose.model("Job", jobSchema);
const User = mongoose.model("User", userSchema);
const Application = mongoose.model("Application", applicationSchema);

async function createDefaultAdmin() {
  try {
    const adminExists = await User.findOne({ username: "admin" });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await User.create({
        username: "admin",
        password: hashedPassword,
      });
      console.log("Default admin user created");
    }
  } catch (err) {
    console.error("Error creating default admin:", err);
  }
}
createDefaultAdmin();

function isAuthenticated(req, res, next) {
  if (req.session.isAuthenticated) {
    return next();
  }
  res.redirect("/admin/login");
}

app.get("/api/jobs", async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/admin/login", (req, res) => {
  res.render("login");
});

app.post("/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.render("login", { error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.render("login", { error: "Invalid credentials" });
    }

    req.session.isAuthenticated = true;
    res.redirect("/admin/dashboard");
  } catch (err) {
    res.render("login", { error: err.message });
  }
});
app.post("/api/apply", upload.single("resume"), async (req, res) => {
  try {
    const {
      position,
      date,
      employmentType,
      fullName,
      phone,
      nationality,
      email,
      address,
      cityState,
      zipcode,
      maritalStatus,
      drivingLicense,
    } = req.body;

    const newApplication = new Application({
      position,
      date: date || new Date(),
      employmentType,
      fullName,
      phone,
      nationality,
      email,
      address,
      cityState,
      zipcode,
      maritalStatus,
      drivingLicense,
      resumePath: req.file ? req.file.path : undefined,
      status: "Pending",
    });

    await newApplication.save();

    res.status(200).json({
      success: true,
      message: "Application submitted successfully!",
    });
  } catch (error) {
    console.error("Application error:", error);
    res.status(500).json({
      success: false,
      error: "Error submitting application. Please try again.",
    });
  }
});

app.get("/admin/applications", isAuthenticated, async (req, res) => {
  try {
    console.log("Fetching applications..."); 
    const applications = await Application.find()
      .sort({ createdAt: -1 })
      .lean();
    console.log(`Found ${applications.length} applications`);
    return res.render("applications", {
      applications,
      req: req,
    });
  } catch (err) {
    console.error("Applications route error:", err);
    res.status(500).render("error", {
      message: "Failed to load applications",
      error: process.env.NODE_ENV === "development" ? err : null,
    });
  }
});

app.get("/admin/application/:id", isAuthenticated, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    res.render("application-detail", {
      application,
      req: req,
    });
  } catch (err) {
    res.redirect("/admin/applications");
  }
});

app.get("/admin/application/resume/:id", isAuthenticated, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application || !application.resumePath) {
      return res.status(404).send("Resume not found");
    }
    res.download(application.resumePath);
  } catch (err) {
    res.status(500).send("Error downloading file");
  }
});

app.get("/admin/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/admin/login");
});

app.get("/admin/dashboard", isAuthenticated, async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    const activeTab = req.query.tab || "dashboard";

    const totalJobs = await Job.countDocuments();
    const activeJobs = await Job.countDocuments({ isActive: true });
    const totalApplications = await Application.countDocuments();
    const recentApplications = await Application.find()
      .sort({ createdAt: -1 })
      .limit(5);
    const recentJobs = await Job.find().sort({ createdAt: -1 }).limit(5);

    res.render("dashboard", {
      jobs,
      activeTab,
      req: req,
      stats: {
        totalJobs,
        totalApplications, 
        activeJobs,
        pendingApplications: await Application.countDocuments({
          status: "Pending",
        }), 
      },
      recentJobs,
      recentApplications, 
    });
  } catch (err) {
    res.render("dashboard", {
      jobs: [],
      error: err.message,
      req: req,
      stats: {
        totalJobs: 0,
        totalBrands: 0,
        activeJobs: 0,
        inactiveBrands: 0,
      },
      recentJobs: [],
      recentBrands: [],
    });
  }
});

app.get("/admin/job/add", isAuthenticated, (req, res) => {
  res.render("job-form", {
    job: null,
    action: "add",
    req: req,
  });
});

app.post("/admin/job/add", isAuthenticated, async (req, res) => {
  try {
    const { title, department, jobType, description, tags, salary } = req.body;
    const tagsArray = tags.split(",").map((tag) => tag.trim());

    const newJob = new Job({
      title,
      department,
      jobType,
      description,
      tags: tagsArray,
      salary,
    });

    await newJob.save();
    res.redirect("/admin/dashboard");
  } catch (err) {
    res.render("job-form", {
      job: req.body,
      action: "add",
      error: err.message,
    });
  }
});

app.get("/admin/job/edit/:id", isAuthenticated, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    res.render("job-form", {
      job,
      action: "edit",
      req: req,
    });
  } catch (err) {
    res.redirect("/admin/dashboard");
  }
});

app.post("/admin/job/edit/:id", isAuthenticated, async (req, res) => {
  try {
    const { title, department, jobType, description, tags, salary, isActive } =
      req.body;
    const tagsArray = tags.split(",").map((tag) => tag.trim());

    await Job.findByIdAndUpdate(req.params.id, {
      title,
      department,
      jobType,
      description,
      tags: tagsArray,
      salary,
      isActive: isActive === "on",
    });

    res.redirect("/admin/dashboard");
  } catch (err) {
    const job = await Job.findById(req.params.id);
    res.render("job-form", {
      job,
      action: "edit",
      error: err.message,
    });
  }
});

app.post("/admin/job/delete/:id", isAuthenticated, async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.redirect("/admin/dashboard");
  } catch (err) {
    console.error("Delete job error:", err);
    res.redirect("/admin/dashboard");
  }
});
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});