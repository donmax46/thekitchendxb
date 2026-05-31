/* ====================================
   THE KITCHEN 2026
   Main JavaScript
==================================== */

/* =========================
   MOBILE MENU
========================= */

const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

if (menuToggle && navLinks) {

  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });

  document.querySelectorAll("#navLinks a").forEach(link => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("active");
    });
  });

}

/* =========================
   NAVBAR SCROLL EFFECT
========================= */

const navbar = document.querySelector(".navbar");

window.addEventListener("scroll", () => {

  if (!navbar) return;

  if (window.scrollY > 50) {
    navbar.style.background = "rgba(5,5,5,0.95)";
    navbar.style.boxShadow = "0 10px 30px rgba(0,0,0,0.25)";
  } else {
    navbar.style.background = "rgba(5,5,5,0.75)";
    navbar.style.boxShadow = "none";
  }

});

/* =========================
   REVEAL ON SCROLL
========================= */

const revealElements = document.querySelectorAll(
  ".feature-card, .category-card, .selection-card, .community-cta"
);

function revealOnScroll() {

  const triggerBottom = window.innerHeight * 0.85;

  revealElements.forEach(element => {

    const elementTop = element.getBoundingClientRect().top;

    if (elementTop < triggerBottom) {
      element.classList.add("reveal");

         setTimeout(() => {
            element.classList.add("active");
     }, 100);

  });

}

window.addEventListener("scroll", revealOnScroll);
window.addEventListener("load", revealOnScroll);

/* =========================
   SMOOTH SCROLL
========================= */

document.querySelectorAll('a[href^="#"]').forEach(anchor => {

  anchor.addEventListener("click", function (e) {

    const targetId = this.getAttribute("href");

    if (targetId === "#") return;

    const target = document.querySelector(targetId);

    if (target) {
      e.preventDefault();

      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }

  });

});

/* =========================
   HERO FADE-IN
========================= */

window.addEventListener("load", () => {

  const hero = document.querySelector(".hero-content");

  if (hero) {

    hero.style.opacity = "0";
    hero.style.transform = "translateY(20px)";
    hero.style.transition = "all 1s ease";

    setTimeout(() => {
      hero.style.opacity = "1";
      hero.style.transform = "translateY(0)";
    }, 200);

  }

});

/* =========================
   FUTURE COUNTERS
========================= */

function animateCounter(element, target) {

  let count = 0;

  const increment = target / 100;

  const timer = setInterval(() => {

    count += increment;

    if (count >= target) {
      element.textContent = target;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(count);
    }

  }, 15);

}

/* =========================
   CURRENT YEAR
========================= */

const yearElement = document.getElementById("year");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

/* =========================
   CONSOLE BRANDING
========================= */

console.log(
  "%cTHE KITCHEN",
  "color:#D4AF37;font-size:20px;font-weight:bold;"
);

console.log(
  "Private Network • Global Connections • Dubai Opportunities"
);
