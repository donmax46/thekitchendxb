/* THE KITCHEN DXB - lightweight site interactions and conversion preparation */
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("active");
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  });
  navLinks.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    navLinks.classList.remove("active");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
  }));
}

const navbar = document.querySelector(".navbar");
window.addEventListener("scroll", () => {
  if (!navbar) return;
  navbar.style.background = window.scrollY > 50 ? "rgba(5,5,5,0.95)" : "rgba(5,5,5,0.75)";
  navbar.style.boxShadow = window.scrollY > 50 ? "0 10px 30px rgba(0,0,0,0.25)" : "none";
}, { passive: true });

const revealElements = document.querySelectorAll(".feature-card, .category-card, .selection-card, .community-cta, .article-card, .city-card, .knowledge-card");
function revealOnScroll() {
  const triggerBottom = window.innerHeight * 0.85;
  revealElements.forEach(element => {
    if (element.getBoundingClientRect().top < triggerBottom) element.classList.add("reveal", "active");
  });
}
window.addEventListener("scroll", revealOnScroll, { passive: true });
window.addEventListener("load", revealOnScroll);

window.addEventListener("load", () => {
  const hero = document.querySelector(".hero-content");
  if (hero) {
    hero.style.opacity = "0";
    hero.style.transform = "translateY(20px)";
    hero.style.transition = "opacity 1s ease, transform 1s ease";
    setTimeout(() => { hero.style.opacity = "1"; hero.style.transform = "translateY(0)"; }, 200);
  }
});

const yearElement = document.getElementById("year");
if (yearElement) yearElement.textContent = new Date().getFullYear();

// Keep conversion preparation identifiable without firing unconfigured conversions.
document.querySelectorAll('a[href*="t.me/"]').forEach(link => {
  if (link.href.includes("mawjud126")) link.href = "https://t.me/lastchriseae";
  link.dataset.conversion = link.dataset.conversion || "telegram_contact";
  link.addEventListener("click", () => {
    if (typeof window.gtag === "function") window.gtag("event", "telegram_click", { conversion_target: link.dataset.conversion });
  });
});
document.querySelectorAll('a[href*="knowledge.html"]').forEach(link => {
  link.dataset.conversion = link.dataset.conversion || "knowledge_library";
});

function injectKnowledgeButton() {
  if (document.querySelector(".knowledge-float")) return;
  const knowledgeButton = document.createElement("a");
  knowledgeButton.href = "/uae-dubai/knowledge.html";
  knowledgeButton.className = "knowledge-float";
  knowledgeButton.setAttribute("aria-label", "Open Knowledge Library");
  knowledgeButton.dataset.conversion = "knowledge_library";
  knowledgeButton.innerHTML = "<span>Knowledge</span><small>UAE Guides</small>";
  document.body.appendChild(knowledgeButton);
}
document.addEventListener("DOMContentLoaded", injectKnowledgeButton);
