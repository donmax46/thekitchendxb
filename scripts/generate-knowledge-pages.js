const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const dataPath = path.join(rootDir, "data", "knowledge-pages.json");
const outputDir = path.join(rootDir, "uae-dubai");
const sitemapPath = path.join(rootDir, "sitemap.xml");

const SITE_URL = "https://thekitchendxb.com";
const DEFAULT_OG_IMAGE = `${SITE_URL}/assets/images/knowledge/knowledge.webp`;
const CATEGORY_ORDER = [
  "Awareness",
  "UAE Drug Laws",
  "Airport & Medication",
  "Travel & Safety",
  "Cannabis & UAE Law",
  "Vaping In Dubai"
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function readKnowledgeItems() {
  const raw = fs.readFileSync(dataPath, "utf8");
  return JSON.parse(raw);
}

function validateItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("knowledge-pages.json must contain at least one item.");
  }

  const requiredFields = [
    "title",
    "slug",
    "category",
    "seoTitle",
    "metaDescription",
    "canonicalUrl",
    "ogImage",
    "heroTag",
    "heroDescription",
    "bodySections",
    "keyTakeaways",
    "relatedSlugs"
  ];
  const slugs = new Set(items.map((item) => item.slug));

  for (const item of items) {
    for (const field of requiredFields) {
      if (!item[field]) {
        throw new Error(`Missing ${field} for item ${item.slug || item.title || "(unknown)"}.`);
      }
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug)) {
      throw new Error(`Invalid slug: ${item.slug}`);
    }

    if (!Array.isArray(item.bodySections) || item.bodySections.length === 0) {
      throw new Error(`${item.slug} must include bodySections.`);
    }

    for (const section of item.bodySections) {
      if (!section.heading || !Array.isArray(section.paragraphs) || section.paragraphs.length === 0) {
        throw new Error(`${item.slug} has an invalid body section.`);
      }
    }

    if (!Array.isArray(item.keyTakeaways) || item.keyTakeaways.length === 0) {
      throw new Error(`${item.slug} must include keyTakeaways.`);
    }

    if (!Array.isArray(item.relatedSlugs) || item.relatedSlugs.length !== 5) {
      throw new Error(`${item.slug} must include exactly 5 relatedSlugs.`);
    }

    const uniqueRelated = new Set(item.relatedSlugs);
    if (uniqueRelated.size !== 5) {
      throw new Error(`${item.slug} relatedSlugs must be unique.`);
    }

    for (const relatedSlug of item.relatedSlugs) {
      if (!slugs.has(relatedSlug)) {
        throw new Error(`${item.slug} references missing relatedSlug: ${relatedSlug}`);
      }
      if (relatedSlug === item.slug) {
        throw new Error(`${item.slug} cannot relate to itself.`);
      }
    }
  }
}

function navHtml() {
  return `<header class="navbar">
<div class="container nav-container">
<a href="../index.html" class="logo">
<img src="../assets/images/kitchen-logo.webp" alt="THE KITCHEN" class="navbar-logo">
<span class="navbar-brand">THE KITCHEN</span>
</a>
<nav class="nav-links" id="navLinks">
<a href="../index.html">Home</a>
<a href="../about.html">About</a>
<a href="../blog.html">Blog</a>
<a href="../cities.html">Cities</a>
<a href="/uae-dubai/knowledge.html">Knowledge</a>
<a href="../contact.html">Contact</a>
</nav>
<div class="menu-toggle" id="menuToggle">☰</div>
</div>
</header>`;
}

function footerHtml() {
  return `<footer>
<div class="container">
<div class="footer-logo">THE KITCHEN</div>
<p>Knowledge &bull; Cities &bull; Opportunities &bull; Community</p>
<p class="copyright">© 2026 THE KITCHEN. All Rights Reserved.</p>
</div>
</footer>`;
}

function pageShell({ title, description, canonicalUrl, ogType, ogTitle, ogDescription, ogImage, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeAttr(description)}">
<link rel="canonical" href="${escapeAttr(canonicalUrl)}">
<link rel="stylesheet" href="../style.css">
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<meta property="og:type" content="${escapeAttr(ogType)}">
<meta property="og:title" content="${escapeAttr(ogTitle)}">
<meta property="og:description" content="${escapeAttr(ogDescription)}">
<meta property="og:url" content="${escapeAttr(canonicalUrl)}">
<meta property="og:image" content="${escapeAttr(ogImage || DEFAULT_OG_IMAGE)}">
</head>
<body class="blog-article">
${navHtml()}
${body}
${footerHtml()}
<script src="../script.js"></script>
</body>
</html>
`;
}

function localImagePath(ogImage) {
  if (!ogImage || !ogImage.startsWith(`${SITE_URL}/`)) {
    return "../assets/images/knowledge/knowledge.webp";
  }
  return `../${ogImage.slice(`${SITE_URL}/`.length)}`;
}

function renderRelatedCards(item, itemBySlug) {
  return item.relatedSlugs
    .map((slug) => {
      const related = itemBySlug.get(slug);
      return `<div class="knowledge-card">
<h3>${escapeHtml(related.title)}</h3>
<a href="${escapeAttr(related.slug)}.html">Read Answer →</a>
</div>`;
    })
    .join("\n");
}

function renderArticlePage(item, itemBySlug) {
  const bodySections = item.bodySections
    .map((section) => `<h2>${escapeHtml(section.heading)}</h2>
${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("\n")}`)
    .join("\n");

  const takeaways = item.keyTakeaways
    .map((takeaway) => `<li>${escapeHtml(takeaway)}</li>`)
    .join("\n");

  const body = `<img src="${escapeAttr(localImagePath(item.ogImage))}" alt="${escapeAttr(item.title)}" class="article-featured-image">
<section class="hero">
<div class="container hero-content">
<p class="hero-tag">${escapeHtml(item.heroTag)}</p>
<h1>${escapeHtml(item.title)}</h1>
<p class="hero-description">${escapeHtml(item.heroDescription)}</p>
</div>
</section>
<section>
<div class="container article-body">
${bodySections}
<h2>Key Takeaways</h2>
<ul class="takeaway-list">
${takeaways}
</ul>
</div>
</section>
<section>
<div class="container">
<h2 class="section-title">Featured Questions</h2>
<div class="knowledge-grid">
${renderRelatedCards(item, itemBySlug)}
</div>
</div>
</section>`;

  return pageShell({
    title: item.seoTitle,
    description: item.metaDescription,
    canonicalUrl: item.canonicalUrl,
    ogType: "article",
    ogTitle: item.title,
    ogDescription: item.metaDescription,
    ogImage: item.ogImage,
    body
  });
}

function groupByCategory(items) {
  const groups = new Map();
  for (const item of items) {
    if (!groups.has(item.category)) {
      groups.set(item.category, []);
    }
    groups.get(item.category).push(item);
  }
  return groups;
}

function renderHub(items) {
  const groups = groupByCategory(items);
  const orderedCategories = [
    ...CATEGORY_ORDER.filter((category) => groups.has(category)),
    ...Array.from(groups.keys()).filter((category) => !CATEGORY_ORDER.includes(category)).sort()
  ];

  const sections = orderedCategories
    .map((category) => `<section>
<div class="container">
<h2 class="section-title">${escapeHtml(category)}</h2>
<div class="knowledge-grid">
${groups.get(category).map((item) => `<div class="knowledge-card">
<h3>${escapeHtml(item.title)}</h3>
<a href="${escapeAttr(item.slug)}.html">Read Answer →</a>
</div>`).join("\n")}
</div>
</div>
</section>`)
    .join("\n");

  const body = `<img src="../assets/images/knowledge/knowledge.jpg" alt="Knowledge Library" class="article-featured-image">
<section class="hero">
<div class="container hero-content">
<p class="hero-tag">KNOWLEDGE - EDUCATION - AWARENESS</p>
<h1>KNOWLEDGE LIBRARY</h1>
<p class="hero-description">Explore educational guides and frequently asked questions about Dubai, UAE laws, travel, public safety, medication awareness and responsible visitor preparation.</p>
</div>
</section>
${sections}
<section class="community-cta">
<div class="container">
<h2>Growing Knowledge Base</h2>
<p>THE KITCHEN Knowledge Library continues expanding with practical, legal-awareness focused resources for Dubai, the UAE and the wider region.</p>
</div>
</section>`;

  return pageShell({
    title: "Dubai Knowledge Library | UAE Laws, Safety & Travel Guides | THE KITCHEN",
    description: "Explore Dubai and UAE knowledge guides covering laws, public safety, travel information, medication awareness and frequently asked questions.",
    canonicalUrl: `${SITE_URL}/uae-dubai/knowledge.html`,
    ogType: "website",
    ogTitle: "Dubai Knowledge Library | THE KITCHEN",
    ogDescription: "Educational guides and frequently asked questions about Dubai, UAE laws, travel, public safety and medication awareness.",
    ogImage: DEFAULT_OG_IMAGE,
    body
  });
}

function updateSitemap(items) {
  const existing = fs.existsSync(sitemapPath) ? fs.readFileSync(sitemapPath, "utf8") : "";
  const matches = existing.matchAll(/<loc>([^<]+)<\/loc>/g);
  const seen = new Set();
  const urls = [];

  for (const match of matches) {
    const url = match[1].trim();
    if (!seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
  }

  const generatedUrls = [
    `${SITE_URL}/uae-dubai/knowledge.html`,
    ...items.map((item) => item.canonicalUrl)
  ];

  for (const url of generatedUrls) {
    if (!seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `<url><loc>${escapeHtml(url)}</loc></url>`).join("\n")}
</urlset>
`;

  fs.writeFileSync(sitemapPath, sitemap, "utf8");
}

function main() {
  const items = readKnowledgeItems();
  validateItems(items);

  fs.mkdirSync(outputDir, { recursive: true });
  const itemBySlug = new Map(items.map((item) => [item.slug, item]));

  fs.writeFileSync(path.join(outputDir, "knowledge.html"), renderHub(items), "utf8");

  for (const item of items) {
    fs.writeFileSync(path.join(outputDir, `${item.slug}.html`), renderArticlePage(item, itemBySlug), "utf8");
  }

  updateSitemap(items);
  console.log(`Generated ${items.length} knowledge articles and knowledge.html.`);
}

main();
