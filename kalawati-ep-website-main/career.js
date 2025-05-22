document.addEventListener("DOMContentLoaded", function () {
  const jobsContainer = document.getElementById("jobs-container");
  const noJobsMessage = document.getElementById("no-jobs-message");
  const loadingSpinner = document.getElementById("loading-spinner");
  const jobCountElement = document.getElementById("job-count");

  if (noJobsMessage) noJobsMessage.style.display = "none";

  async function fetchJobs() {
    try {
      const response = await fetch("https://kalawati-web.onrender.com/api/jobs");
      if (!response.ok) throw new Error("Network response was not ok");
      return await response.json();
    } catch (error) {
      console.error("Error fetching jobs:", error);
      return [];
    } finally {
      if (loadingSpinner) loadingSpinner.style.display = "none";
    }
  }

  function createJobCard(job) {
    const jobCard = document.createElement("div");
    jobCard.className = "job-card";
    jobCard.dataset.jobId = job._id;
    jobCard.dataset.department = job.department;

    const shortDescription =
      job.description.length > 100
        ? job.description.substring(0, 100) + "..."
        : job.description;

    const tagsHtml =
      job.tags && job.tags.length > 0
        ? job.tags.map((tag) => `<span class="job-tag">${tag}</span>`).join("")
        : "";

    jobCard.innerHTML = `
            <div class="job-header">
                <div class="job-department">${job.department}</div>
                <h3 class="job-title">${job.title}</h3>
                <div class="job-type">${job.jobType}</div>
            </div>
            <div class="job-content">
                <div class="job-description">${shortDescription}</div>
                <div class="job-tags">${tagsHtml}</div>
                <div class="job-footer">
                    <div class="job-salary">${job.salary}</div>
                    <button class="apply-button" data-job-id="${job._id}">
                        Apply Now
                    </button>
                </div>
            </div>
        `;
    return jobCard;
  }
  function setupApplyButtons() {
    const applyButtons = document.querySelectorAll(
      ".apply-button:not([type='submit'])"
    );

    applyButtons.forEach((button) => {
      button.addEventListener("click", function (e) {
        e.preventDefault();
        console.log("Apply button clicked");

        const jobCard = this.closest(".job-card");
        if (!jobCard) {
          console.error("No job card found for apply button");
          return;
        }

        const jobTitle = jobCard.querySelector(".job-title");
        if (!jobTitle) {
          console.error("No job title found");
          return;
        }

        const positionField = document.getElementById("position-applied");
        const applyingForEl = document.getElementById("applying-for");
        const dateField = document.getElementById("date");
        const modal = document.getElementById("application-modal");

        if (positionField) positionField.value = jobTitle.textContent;
        if (applyingForEl)
          applyingForEl.textContent = `Applying for: ${jobTitle.textContent}`;
        if (dateField) dateField.valueAsDate = new Date();
        if (modal) modal.style.display = "block";
      });
    });
  }

  async function handleApplicationFormSubmit(e) {
    e.preventDefault();
    console.log("Form submission started");

    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const statusElement = document.getElementById("form-status");

    if (!submitButton || !statusElement) return;

    // Show loading state
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner"></span> Submitting...';
    statusElement.style.display = "none";

    try {
      const formData = new FormData(form);
      console.log("Form data prepared:", {
        position: formData.get("position"),
        fullName: formData.get("fullName"),
      });

      const response = await fetch(
        "https://kalawati-web.onrender.com/api/apply",
        {
          method: "POST",
          body: formData,
        }
      );

      console.log("Response received:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server responded with error:", errorData);
        throw new Error(errorData.error || "Failed to submit application");
      }

      const result = await response.json();
      console.log("Submission successful:", result);

      statusElement.className = "form-status success";
      statusElement.textContent =
        result.message || "Application submitted successfully!";
      statusElement.style.display = "block";

      setTimeout(() => {
        form.reset();
        const modal = document.getElementById("application-modal");
        if (modal) modal.style.display = "none";
      }, 2000);
    } catch (error) {
      console.error("Submission error:", error);
      statusElement.className = "form-status error";
      statusElement.textContent =
        error.message || "Error submitting application. Please try again.";
      statusElement.style.display = "block";
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Submit Application";
    }
  }

  async function initPage() {
    const jobs = await fetchJobs();

    if (jobs.length === 0) {
      if (noJobsMessage) noJobsMessage.style.display = "block";
      if (jobCountElement) jobCountElement.textContent = "0";
      return;
    }
    if (jobsContainer) {
      jobs.forEach((job) => {
        jobsContainer.appendChild(createJobCard(job));
      });
    }
    if (jobCountElement) jobCountElement.textContent = jobs.length;
    setupApplyButtons();

    const applicationForm = document.getElementById("application-form");
    if (applicationForm) {
      applicationForm.addEventListener("submit", handleApplicationFormSubmit);
    }
    document.querySelector(".close-modal")?.addEventListener("click", () => {
      const modal = document.getElementById("application-modal");
      if (modal) modal.style.display = "none";
    });

    window.addEventListener("click", (event) => {
      if (event.target === document.getElementById("application-modal")) {
        const modal = document.getElementById("application-modal");
        if (modal) modal.style.display = "none";
      }
    });
  }
  initPage();
});
