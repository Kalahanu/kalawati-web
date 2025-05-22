// Header scroll effect
window.addEventListener('scroll', function() {
  const header = document.querySelector('.main-header');
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
  
  if (mobileMenuToggle && mobileMenu && mobileMenuOverlay) {
    mobileMenuToggle.addEventListener('click', function() {
      this.classList.toggle('open');
      mobileMenu.classList.toggle('open');
      mobileMenuOverlay.classList.toggle('open');
      document.body.classList.toggle('no-scroll');
    });
    
    mobileMenuOverlay.addEventListener('click', function() {
      mobileMenuToggle.classList.remove('open');
      mobileMenu.classList.remove('open');
      this.classList.remove('open');
      document.body.classList.remove('no-scroll');
    });
  }
  
  // Close menu when clicking on a link
  const mobileMenuLinks = document.querySelectorAll('.mobile-menu a');
  mobileMenuLinks.forEach(link => {
    link.addEventListener('click', function() {
      mobileMenuToggle.classList.remove('open');
      mobileMenu.classList.remove('open');
      mobileMenuOverlay.classList.remove('open');
      document.body.classList.remove('no-scroll');
    });
  });
  
  // Intersection Observer for scroll animations
  const observerOptions = {
    threshold: 0.1
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, observerOptions);
  
  document.querySelectorAll('.scroll-section').forEach(section => {
    observer.observe(section);
  });
  
  // Video autoplay handling
  const videos = document.querySelectorAll('video');
  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.play().catch(e => console.log(e));
      } else {
        entry.target.pause();
      }
    });
  }, { threshold: 0.5 });
  
  videos.forEach(video => {
    videoObserver.observe(video);
    // Ensure videos are muted for autoplay
    video.muted = true;
  });
});