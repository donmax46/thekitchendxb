const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const dataPath = path.join(rootDir, "data", "knowledge-pages.json");
const cardsDataPath = path.join(rootDir, "data", "knowledge-cards.json");
const outputDir = path.join(rootDir, "uae-dubai");
const cardOutputDir = path.join(outputDir, "knowledge-cards");
const regionOutputDir = path.join(outputDir, "knowledge-regions");
const categoryOutputDir = path.join(outputDir, "knowledge-categories");
const sitemapPath = path.join(rootDir, "sitemap.xml");

const SITE_URL = "https://thekitchendxb.com";
const FALLBACK_IMAGE_RELATIVE = "assets/images/knowledge/knowledge.jpg";
const FALLBACK_IMAGE_SRC = `../${FALLBACK_IMAGE_RELATIVE}`;
const DEFAULT_OG_IMAGE = `${SITE_URL}/${FALLBACK_IMAGE_RELATIVE}`;
const MIN_IMAGE_BYTES = 1024;
const CARD_PAGE_SIZE = 500;
const CARD_REGION_ORDER = ["UAE / GCC", "Europe", "USA", "Asia-Pacific", "Africa", "Global Cities"];
const ALLOWED_CARD_INTENTS = new Set([
  "how-to",
  "where-to",
  "why",
  "dangers",
  "precautions",
  "what-to-know",
  "legal-awareness",
  "travel-safety",
  "wellness-awareness",
  "public-health"
]);
const forbiddenTerm = (...parts) => parts.join("");
const FORBIDDEN_CARD_TERMS = [
  forbiddenTerm("what", "sapp"),
  forbiddenTerm("wa", ".me"),
  "order now",
  "buy now",
  forbiddenTerm("discreet ", "deliv", "ery"),
  "where to buy vapes",
  forbiddenTerm("where to ", "buy", " thc"),
  forbiddenTerm("where to ", "buy", " cbd"),
  "how to use thc",
  "how to vape",
  "how to dose cbd",
  "how to travel with thc",
  "how to travel with cbd",
  "how to avoid detection",
  "product menus",
  forbiddenTerm("stra", "ins"),
  "prices",
  "ordering language"
];
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
  const raw = fs.readFileSync(dataPath, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(raw);
}

function readKnowledgeCards() {
  if (!fs.existsSync(cardsDataPath)) {
    return [];
  }

  const raw = fs.readFileSync(cardsDataPath, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(raw);
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

function validateCards(cards) {
  if (!Array.isArray(cards)) {
    throw new Error("knowledge-cards.json must contain an array.");
  }

  const requiredFields = [
    "slug",
    "title",
    "description",
    "region",
    "country",
    "city",
    "category",
    "intent",
    "keywords",
    "priority",
    "image",
    "alt"
  ];
  const slugs = new Set();
  const titles = new Set();

  for (const card of cards) {
    for (const field of requiredFields) {
      if (card[field] === undefined || card[field] === null || card[field] === "") {
        throw new Error(`Missing ${field} for card ${card.slug || card.title || "(unknown)"}.`);
      }
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(card.slug)) {
      throw new Error(`Invalid card slug: ${card.slug}`);
    }

    if (/guide\s+[12]\b/i.test(card.title)) {
      throw new Error(`${card.slug} title must not contain Guide ${1} or Guide ${2}.`);
    }

    if (card.title.trim().length < 28) {
      throw new Error(`${card.slug} title must be at least 28 characters.`);
    }

    if (card.description.trim().length < 130) {
      throw new Error(`${card.slug} description must be at least 130 characters.`);
    }

    if (slugs.has(card.slug)) {
      throw new Error(`Duplicate card slug: ${card.slug}`);
    }
    slugs.add(card.slug);

    const normalizedTitle = card.title.trim().toLowerCase();
    if (titles.has(normalizedTitle)) {
      throw new Error(`Duplicate card title: ${card.title}`);
    }
    titles.add(normalizedTitle);

    if (!ALLOWED_CARD_INTENTS.has(card.intent)) {
      throw new Error(`${card.slug} has invalid intent: ${card.intent}`);
    }

    if (!Array.isArray(card.keywords)) {
      throw new Error(`${card.slug} keywords must be an array.`);
    }

    const searchable = `${card.title} ${card.description} ${card.keywords.join(" ")}`.toLowerCase();
    for (const term of FORBIDDEN_CARD_TERMS) {
      if (searchable.includes(term)) {
        throw new Error(`${card.slug} contains forbidden term: ${term}`);
      }
    }
  }
}

function navHtml(assetPrefix = "../") {
  return `<header class="navbar">
<div class="container nav-container">
<a href="${assetPrefix}index.html" class="logo">
<img src="${assetPrefix}assets/images/kitchen-logo.webp" alt="THE KITCHEN" class="navbar-logo" loading="lazy" decoding="async" width="96" height="96">
<span class="navbar-brand">THE KITCHEN</span>
</a>
<nav class="nav-links" id="navLinks">
<a href="${assetPrefix}index.html">Home</a>
<a href="${assetPrefix}about.html">About</a>
<a href="${assetPrefix}blog.html">Blog</a>
<a href="${assetPrefix}cities.html">Cities</a>
<a href="/uae-dubai/knowledge.html">Knowledge</a>
<a href="${assetPrefix}contact.html">Contact</a>
</nav>
<div class="menu-toggle" id="menuToggle">&#9776;</div>
</div>
</header>`;
}

function footerHtml() {
  return `<footer>
<div class="container">
<div class="footer-logo">THE KITCHEN</div>
<p>Knowledge &bull; Cities &bull; Opportunities &bull; Community</p>
<p class="copyright">&copy; 2026 THE KITCHEN. All Rights Reserved.</p>
</div>
</footer>`;
}

function imageExists(localRelativePath) {
  const localPath = path.join(rootDir, localRelativePath);
  return fs.existsSync(localPath) && fs.statSync(localPath).size >= MIN_IMAGE_BYTES;
}

function getJpegDimensions(localRelativePath) {
  const localPath = path.join(rootDir, localRelativePath);
  const buffer = fs.readFileSync(localPath);
  let offset = 2;

  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return null;
  }

  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);

    if (marker >= 0xc0 && marker <= 0xc3) {
      return {
        width: buffer.readUInt16BE(offset + 7),
        height: buffer.readUInt16BE(offset + 5)
      };
    }

    offset += 2 + length;
  }

  return null;
}

function resolveImage(ogImage) {
  let localRelativePath = FALLBACK_IMAGE_RELATIVE;

  if (ogImage && ogImage.startsWith(`${SITE_URL}/`)) {
    const candidate = ogImage.slice(`${SITE_URL}/`.length);
    if (!candidate.endsWith("/knowledge/knowledge.webp") && imageExists(candidate)) {
      localRelativePath = candidate;
    }
  }

  if (!imageExists(localRelativePath)) {
    localRelativePath = FALLBACK_IMAGE_RELATIVE;
  }

  const dimensions = getJpegDimensions(localRelativePath) || { width: 1200, height: 675 };

  return {
    relativePath: localRelativePath,
    url: `${SITE_URL}/${localRelativePath}`,
    src: `../${localRelativePath}`,
    width: dimensions.width,
    height: dimensions.height
  };
}

function featuredImageHtml({ image, alt, assetPrefix = "../" }) {
  const src = image.relativePath ? `${assetPrefix}${image.relativePath}` : image.src;
  return `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" class="article-featured-image" loading="lazy" decoding="async" width="${image.width}" height="${image.height}">`;
}

function webPageSchema({ title, description, canonicalUrl, ogImage }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: canonicalUrl,
    image: ogImage || DEFAULT_OG_IMAGE,
    publisher: {
      "@type": "Organization",
      name: "THE KITCHEN",
      url: SITE_URL
    }
  };
}

function pageShell({ title, description, canonicalUrl, ogType, ogTitle, ogDescription, ogImage, body, jsonLd, assetPrefix = "../" }) {
  const schema = jsonLd || webPageSchema({ title, description, canonicalUrl, ogImage });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeAttr(description)}">
<link rel="canonical" href="${escapeAttr(canonicalUrl)}">
<link rel="stylesheet" href="${assetPrefix}style.css">
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<meta property="og:type" content="${escapeAttr(ogType)}">
<meta property="og:title" content="${escapeAttr(ogTitle)}">
<meta property="og:description" content="${escapeAttr(ogDescription)}">
<meta property="og:url" content="${escapeAttr(canonicalUrl)}">
<meta property="og:image" content="${escapeAttr(ogImage || DEFAULT_OG_IMAGE)}">
<script type="application/ld+json">${JSON.stringify(schema)}</script>
</head>
<body class="blog-article">
${navHtml(assetPrefix)}
${body}
${footerHtml()}
<script src="${assetPrefix}script.js"></script>
</body>
</html>
`;
}

function renderRelatedCards(item, itemBySlug) {
  return item.relatedSlugs
    .map((slug) => {
      const related = itemBySlug.get(slug);
      return `<article class="knowledge-card">
<a class="knowledge-card-link" href="${escapeAttr(related.slug)}.html" aria-label="Read ${escapeAttr(related.title)}">
<h3>${escapeHtml(related.title)}</h3>
<span class="knowledge-card-action">Read guide &rarr;</span>
</a>
</article>`;
    })
    .join("\n");
}

function renderArticlePage(item, itemBySlug) {
  const image = resolveImage(item.ogImage);
  const bodySections = item.bodySections
    .map((section) => `<h2>${escapeHtml(section.heading)}</h2>
${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("\n")}`)
    .join("\n");

  const takeaways = item.keyTakeaways
    .map((takeaway) => `<li>${escapeHtml(takeaway)}</li>`)
    .join("\n");

  const body = `${featuredImageHtml({ image, alt: item.title })}
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
    ogImage: image.url,
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

function groupByField(items, field) {
  const groups = new Map();
  for (const item of items) {
    const key = item[field];
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(item);
  }
  return groups;
}

function cardImage(card) {
  if (card.image && card.image.startsWith(`${SITE_URL}/`)) {
    return resolveImage(card.image);
  }

  if (card.image) {
    const candidate = card.image.replace(/^\.\.\//, "");
    if (imageExists(candidate)) {
      const dimensions = getJpegDimensions(candidate) || { width: 1200, height: 675 };
      return {
        relativePath: candidate,
        url: `${SITE_URL}/${candidate}`,
        src: `../${candidate}`,
        width: dimensions.width,
        height: dimensions.height
      };
    }
  }

  return resolveImage(DEFAULT_OG_IMAGE);
}

function cardPageUrl(card) {
  return `${SITE_URL}/uae-dubai/knowledge-cards/${card.slug}.html`;
}

function regionHubUrl(region, pageNumber = 1) {
  const base = `${SITE_URL}/uae-dubai/knowledge-regions/${slugify(region)}`;
  return pageNumber === 1 ? `${base}.html` : `${base}-page-${pageNumber}.html`;
}

function categoryHubUrl(category, pageNumber = 1) {
  const base = `${SITE_URL}/uae-dubai/knowledge-categories/${slugify(category)}`;
  return pageNumber === 1 ? `${base}.html` : `${base}-page-${pageNumber}.html`;
}

function renderSeoCard(card, hrefPrefix = "knowledge-cards/") {
  const image = cardImage(card);
  const imageSrc = hrefPrefix === "knowledge-cards/" ? image.src : image.src.replace(/^\.\.\//, "../../");
  return `<article class="knowledge-card seo-knowledge-card">
<a class="knowledge-card-link" href="${escapeAttr(hrefPrefix)}${escapeAttr(card.slug)}.html" aria-label="Read ${escapeAttr(card.title)}">
<img class="knowledge-card-image" src="${escapeAttr(imageSrc)}" alt="${escapeAttr(card.alt || card.title)}" loading="lazy" decoding="async" width="${image.width}" height="${image.height}">
<p class="knowledge-card-meta">${escapeHtml(card.region)} / ${escapeHtml(card.category)} / ${escapeHtml(card.intent || "guide")}</p>
<h3>${escapeHtml(card.title)}</h3>
<p>${escapeHtml(card.description)}</p>
<span class="knowledge-card-action">Read guide &rarr;</span>
</a>
</article>`;
}

function renderPagination({ currentPage, totalPages, urlForPage }) {
  if (totalPages <= 1) {
    return "";
  }

  const links = [];
  for (let page = 1; page <= totalPages; page += 1) {
    const className = page === currentPage ? ' class="active"' : "";
    links.push(`<a${className} href="${escapeAttr(urlForPage(page).replace(`${SITE_URL}/uae-dubai/`, "../"))}">${page}</a>`);
  }

  return `<nav class="knowledge-pagination" aria-label="Knowledge card pages">
${links.join("\n")}
</nav>`;
}

function renderCardPage(card, relatedCards) {
  const image = cardImage(card);
  const canonicalUrl = cardPageUrl(card);
  const title = `${card.title} | THE KITCHEN Knowledge`;
  const description = card.description;
  const keywords = card.keywords.join(", ");
  const jsonLd = {
    ...webPageSchema({ title, description, canonicalUrl, ogImage: image.url }),
    about: card.category,
    keywords,
    audience: card.intent
  };

  const related = relatedCards
    .map((relatedCard) => renderSeoCard(relatedCard, ""))
    .join("\n");

  const body = `${featuredImageHtml({ image, alt: card.alt || card.title, assetPrefix: "../../" })}
<section class="hero">
<div class="container hero-content">
<p class="hero-tag">${escapeHtml(card.region)} - ${escapeHtml(card.category)}</p>
<h1>${escapeHtml(card.title)}</h1>
<p class="hero-description">${escapeHtml(card.description)}</p>
</div>
</section>
<section>
<div class="container article-body">
<h2>${escapeHtml(card.city)} Knowledge Summary</h2>
<p>${escapeHtml(card.description)}</p>
<p>This public knowledge page is designed for discovery, travel awareness, city research and responsible preparation. It is informational and non-operational.</p>
<h2>SEO Focus</h2>
<ul class="takeaway-list">
<li>Region: ${escapeHtml(card.region)}</li>
<li>Country: ${escapeHtml(card.country)}</li>
<li>City: ${escapeHtml(card.city)}</li>
<li>Category: ${escapeHtml(card.category)}</li>
<li>Intent: ${escapeHtml(card.intent)}</li>
<li>Keywords: ${escapeHtml(keywords)}</li>
</ul>
</div>
</section>
<section>
<div class="container">
<h2 class="section-title">Related Knowledge Cards</h2>
<div class="knowledge-grid">
${related}
</div>
</div>
</section>`;

  return pageShell({
    title,
    description,
    canonicalUrl,
    ogType: "website",
    ogTitle: card.title,
    ogDescription: description,
    ogImage: image.url,
    jsonLd,
    assetPrefix: "../../",
    body
  });
}

function renderCardHubPage({ title, description, canonicalUrl, cards, currentPage, totalPages, urlForPage, hrefPrefix }) {
  const image = resolveImage(DEFAULT_OG_IMAGE);
  const body = `${featuredImageHtml({ image, alt: title, assetPrefix: "../../" })}
<section class="hero">
<div class="container hero-content">
<p class="hero-tag">SEO KNOWLEDGE CARDS</p>
<h1>${escapeHtml(title)}</h1>
<p class="hero-description">${escapeHtml(description)}</p>
</div>
</section>
<section>
<div class="container">
<div class="knowledge-grid">
${cards.map((card) => renderSeoCard(card, hrefPrefix)).join("\n")}
</div>
${renderPagination({ currentPage, totalPages, urlForPage })}
</div>
</section>`;

  return pageShell({
    title: `${title} | THE KITCHEN`,
    description,
    canonicalUrl,
    ogType: "website",
    ogTitle: title,
    ogDescription: description,
    ogImage: image.url,
    assetPrefix: "../../",
    body
  });
}

function paginate(items, pageSize) {
  const pages = [];
  for (let index = 0; index < items.length; index += pageSize) {
    pages.push(items.slice(index, index + pageSize));
  }
  return pages.length ? pages : [[]];
}

function renderCardSections(cards) {
  if (!cards.length) {
    return "";
  }

  const byRegion = groupByField(cards, "region");
  const orderedRegions = [
    ...CARD_REGION_ORDER.filter((region) => byRegion.has(region)),
    ...Array.from(byRegion.keys()).filter((region) => !CARD_REGION_ORDER.includes(region)).sort()
  ];

  return orderedRegions
    .map((region) => {
      const regionCards = byRegion.get(region);
      return `<section>
<div class="container">
<h2 class="section-title">${escapeHtml(region)}</h2>
<div class="knowledge-grid">
${regionCards.slice(0, CARD_PAGE_SIZE).map((card) => renderSeoCard(card)).join("\n")}
</div>
<div style="text-align:center;margin-top:30px;">
<a class="btn-secondary" href="knowledge-regions/${escapeAttr(slugify(region))}.html">View ${escapeHtml(region)} Cards</a>
</div>
</div>
</section>`;
    })
    .join("\n");
}

function renderHub(items, cards = []) {
  const image = resolveImage(DEFAULT_OG_IMAGE);
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
${groups.get(category).map((item) => `<article class="knowledge-card">
<a class="knowledge-card-link" href="${escapeAttr(item.slug)}.html" aria-label="Read ${escapeAttr(item.title)}">
<h3>${escapeHtml(item.title)}</h3>
<span class="knowledge-card-action">Read guide &rarr;</span>
</a>
</article>`).join("\n")}
</div>
</div>
</section>`)
    .join("\n");

  const body = `${featuredImageHtml({ image, alt: "Knowledge Library" })}
<section class="hero">
<div class="container hero-content">
<p class="hero-tag">KNOWLEDGE - EDUCATION - AWARENESS</p>
<h1>KNOWLEDGE LIBRARY</h1>
<p class="hero-description">Explore educational guides and frequently asked questions about Dubai, UAE laws, travel, public safety, medication awareness and responsible visitor preparation.</p>
</div>
</section>
${sections}
${renderCardSections(cards)}
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
    ogImage: image.url,
    body
  });
}

function renderAllCardPages(cards) {
  for (const generatedDir of [cardOutputDir, regionOutputDir, categoryOutputDir]) {
    fs.rmSync(generatedDir, { recursive: true, force: true });
  }

  fs.mkdirSync(cardOutputDir, { recursive: true });
  fs.mkdirSync(regionOutputDir, { recursive: true });
  fs.mkdirSync(categoryOutputDir, { recursive: true });

  const byCategory = groupByField(cards, "category");

  for (const card of cards) {
    const relatedCards = (byCategory.get(card.category) || [])
      .filter((candidate) => candidate.slug !== card.slug)
      .slice(0, 5);
    fs.writeFileSync(path.join(cardOutputDir, `${card.slug}.html`), renderCardPage(card, relatedCards), "utf8");
  }

  const byRegion = groupByField(cards, "region");
  for (const [region, regionCards] of byRegion) {
    const pages = paginate(regionCards, CARD_PAGE_SIZE);
    pages.forEach((pageCards, index) => {
      const pageNumber = index + 1;
      const title = `${region} Knowledge Cards${pageNumber > 1 ? ` - Page ${pageNumber}` : ""}`;
      const description = `Explore ${region} knowledge cards for city intelligence, travel awareness, research and public-safety oriented discovery.`;
      fs.writeFileSync(
        path.join(regionOutputDir, `${slugify(region)}${pageNumber > 1 ? `-page-${pageNumber}` : ""}.html`),
        renderCardHubPage({
          title,
          description,
          canonicalUrl: regionHubUrl(region, pageNumber),
          cards: pageCards,
          currentPage: pageNumber,
          totalPages: pages.length,
          urlForPage: (page) => regionHubUrl(region, page),
          hrefPrefix: "../knowledge-cards/"
        }),
        "utf8"
      );
    });
  }

  const sortedCategories = Array.from(byCategory.keys()).sort();
  for (const category of sortedCategories) {
    const categoryCards = byCategory.get(category);
    const pages = paginate(categoryCards, CARD_PAGE_SIZE);
    pages.forEach((pageCards, index) => {
      const pageNumber = index + 1;
      const title = `${category} Knowledge Cards${pageNumber > 1 ? ` - Page ${pageNumber}` : ""}`;
      const description = `Explore ${category} knowledge cards across global regions, cities and legal-awareness focused research topics.`;
      fs.writeFileSync(
        path.join(categoryOutputDir, `${slugify(category)}${pageNumber > 1 ? `-page-${pageNumber}` : ""}.html`),
        renderCardHubPage({
          title,
          description,
          canonicalUrl: categoryHubUrl(category, pageNumber),
          cards: pageCards,
          currentPage: pageNumber,
          totalPages: pages.length,
          urlForPage: (page) => categoryHubUrl(category, page),
          hrefPrefix: "../knowledge-cards/"
        }),
        "utf8"
      );
    });
  }
}

function cardGeneratedUrls(cards) {
  const urls = [];
  urls.push(...cards.map((card) => cardPageUrl(card)));

  for (const [region, regionCards] of groupByField(cards, "region")) {
    paginate(regionCards, CARD_PAGE_SIZE).forEach((_, index) => {
      urls.push(regionHubUrl(region, index + 1));
    });
  }

  for (const [category, categoryCards] of groupByField(cards, "category")) {
    paginate(categoryCards, CARD_PAGE_SIZE).forEach((_, index) => {
      urls.push(categoryHubUrl(category, index + 1));
    });
  }

  return urls;
}

function updateSitemap(items, cards = []) {
  const existing = fs.existsSync(sitemapPath) ? fs.readFileSync(sitemapPath, "utf8") : "";
  const matches = existing.matchAll(/<loc>([^<]+)<\/loc>/g);
  const seen = new Set();
  const urls = [];
  const generatedUrlPattern = new RegExp(`^${SITE_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/uae-dubai/(?:knowledge-cards|knowledge-regions|knowledge-categories)/`);

  for (const match of matches) {
    const url = match[1].trim();
    if (generatedUrlPattern.test(url)) {
      continue;
    }
    if (!seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
  }

  const generatedUrls = [
    `${SITE_URL}/uae-dubai/knowledge.html`,
    ...items.map((item) => item.canonicalUrl),
    ...cardGeneratedUrls(cards)
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
  const cards = readKnowledgeCards();
  validateItems(items);
  validateCards(cards);

  fs.mkdirSync(outputDir, { recursive: true });
  const itemBySlug = new Map(items.map((item) => [item.slug, item]));

  fs.writeFileSync(path.join(outputDir, "knowledge.html"), renderHub(items, cards), "utf8");

  for (const item of items) {
    fs.writeFileSync(path.join(outputDir, `${item.slug}.html`), renderArticlePage(item, itemBySlug), "utf8");
  }

  renderAllCardPages(cards);
  updateSitemap(items, cards);
  console.log(`Generated ${items.length} knowledge articles, ${cards.length} SEO cards and knowledge.html.`);
}

main();
