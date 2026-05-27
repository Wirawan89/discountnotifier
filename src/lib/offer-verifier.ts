export type OfferVerificationResult = {
  hasOffer: boolean;
  matchedKeywords: string[];
  checkedUrls: string[];
  matchedUrl?: string;
};

export type OfferVerifierOptions = {
  country?: string;
  profile?: "retail" | "retailShop" | "dining" | "entertainment" | "services" | "travel";
};

type UrlToCheck = {
  url: string;
  depth: number;
  source: "store" | "common" | "catalog" | "discovered";
};

const OFFER_KEYWORDS = [
  "discount",
  "discounts",
  "sale",
  "on sale",
  "clearance",
  "clerance",
  "clearence",
  "deal",
  "deals",
  "hot deal",
  "happy hour",
  "happy hours",
  "eofy",
  "eofy deal",
  "eofy deals",
  "end of financial year",
  "special",
  "specials",
  "special price",
  "special prices",
  "special offer",
  "special offers",
  "special deal",
  "special deals",
  "limited time offer",
  "limited time offers",
  "offer",
  "offers",
  "promo",
  "promotion",
  "outlet",
  "save",
  "view offer",
  "view offers",
  "view deal",
  "view deals",
  "bundle and save",
  "package",
  "packages",
];

const OFFER_TEXT_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "save $", pattern: /\bsave\s*\$+\s*\d+/i },
  { label: "$ off", pattern: /\$\s*\d+(?:\.\d{1,2})?\s*off\b/i },
  { label: "$ bonus", pattern: /\$\s*\d+(?:\.\d{1,2})?\s*(?:bonus|cashback|cash\s*back|credit)\b/i },
  { label: "% off", pattern: /\b\d+(?:\.\d+)?%\s*off\b/i },
  { label: "save $$$", pattern: /\bsave\s*\${2,}\b/i },
  { label: "half price", pattern: /\b(?:1\/2|half)\s*price\b/i },
  { label: "off rrp", pattern: /\boff\s+rrp\b/i },
  { label: "money saving", pattern: /\bsave\s+\d+(?:\.\d+)?\s*(?:dollars|aud)\b/i },
  { label: "cashback", pattern: /\bcash\s*back|cashback\b/i },
  { label: "bonus offer", pattern: /\b(?:bonus|welcome|sign[-\s]?up)\s+(?:offer|bonus|credit)\b/i },
  { label: "free trial", pattern: /\bfree\s+(?:trial|month|membership|consultation|quote)\b/i },
  { label: "fee waiver", pattern: /\b(?:no|zero|waived?)\s+(?:monthly|annual|joining|setup|account)?\s*fees?\b/i },
  { label: "markdown price", pattern: /\boriginally\s+(?:aud\s*)?\$\s*\d+(?:\.\d{1,2})?/i },
  { label: "buy one get one free", pattern: /\b(?:buy\s+one\s+get\s+one\s+free|bogo|2\s*for\s*1|two\s+for\s+one)\b/i },
  { label: "free night", pattern: /\b(?:free\s+night|night\s+free|stay\s+\d+\s+(?:nights?\s+)?pay\s+\d+)\b/i },
  { label: "package deal", pattern: /\b(?:package\s+deal|holiday\s+package|travel\s+package|flight\s*\+\s*hotel)\b/i },
  { label: "bundle and save", pattern: /\bbundle\s*(?:&|and)\s*save\b/i },
];

const STRONG_OFFER_KEYWORDS = new Set([
  "sale",
  "on sale",
  "clearance",
  "clerance",
  "clearence",
  "deal",
  "deals",
  "hot deal",
  "happy hour",
  "happy hours",
  "eofy",
  "eofy deal",
  "eofy deals",
  "end of financial year",
  "special offer",
  "special offers",
  "special price",
  "special prices",
  "special deal",
  "special deals",
  "limited time offer",
  "limited time offers",
  "promo",
  "promotion",
  "outlet",
  "save $",
  "$ off",
  "% off",
  "half price",
  "off rrp",
  "money saving",
  "markdown price",
]);

const DINING_STRONG_OFFER_KEYWORDS = new Set([
  "happy hour",
  "happy hours",
  "special offer",
  "special offers",
  "special deal",
  "special deals",
]);

const ENTERTAINMENT_STRONG_OFFER_KEYWORDS = new Set([
  "discount",
  "discounts",
  "deal",
  "deals",
  "hot deal",
  "special offer",
  "special offers",
  "special deal",
  "special deals",
  "promo",
  "promotion",
  "save $",
  "$ off",
  "% off",
  "half price",
  "money saving",
]);

const SERVICES_STRONG_OFFER_KEYWORDS = new Set([
  "discount",
  "discounts",
  "deal",
  "deals",
  "special offer",
  "special offers",
  "special deal",
  "special deals",
  "promo",
  "promotion",
  "$ bonus",
  "$ off",
  "% off",
  "cashback",
  "bonus offer",
  "free trial",
  "fee waiver",
  "money saving",
]);

const TRAVEL_STRONG_OFFER_KEYWORDS = new Set([
  "discount",
  "discounts",
  "sale",
  "deal",
  "deals",
  "special offer",
  "special offers",
  "special deal",
  "special deals",
  "limited time offer",
  "limited time offers",
  "offer",
  "offers",
  "promo",
  "promotion",
  "save $",
  "save $$$",
  "$ off",
  "% off",
  "money saving",
  "view offer",
  "view offers",
  "view deal",
  "view deals",
  "bundle and save",
  "buy one get one free",
  "free night",
  "package deal",
]);

const RETAIL_SHOP_STRONG_OFFER_KEYWORDS = new Set([
  "sale",
  "on sale",
  "clearance",
  "clerance",
  "clearence",
  "deal",
  "deals",
  "hot deal",
  "eofy",
  "eofy deal",
  "eofy deals",
  "end of financial year",
  "promo",
  "promotion",
  "special price",
  "special prices",
  "limited time offer",
  "limited time offers",
  "outlet",
  "save $",
  "$ off",
  "% off",
  "half price",
  "off rrp",
  "money saving",
  "markdown price",
]);

const NON_OFFER_PAGE_PATTERN =
  /(linktr\.ee|dealer|distributor|find[-\s]?store|store[-\s]?locator|\/(?:pages\/)?stores?(?:[/?#]|$)|store[-\s]?locations?|service[-\s]?center|support|warranty|manual|faq|help[-\s]?centre|help[-\s]?center|ordering|news|press|article|terms|conditions|privacy|policy)/i;

const OFFER_LINK_PATTERN =
  /(discount|sale|clearance|clerance|clearence|deal|hot[-\s]?deal|happy[-\s]?hour|eofy|end[-\s]?of[-\s]?financial[-\s]?year|special|special[-\s]?price|limited[-\s]?time[-\s]?offer|offer|view[-\s]?(?:offer|offers|deal|deals)|promo|promotion|outlet|catalogue|catalog|what'?s[-\s]?on|markdown|reduced|save|package|flight\s*\+\s*hotel|buy\s+one\s+get\s+one|bogo|2\s*for\s*1|free[-\s]?night|\$\s*\d+\s*off|\d+%\s*off|(?:1\/2|half)\s*price|off\s+rrp)/i;

const COMMON_OFFER_PATHS = [
  "/sale",
  "/sales",
  "/deals",
  "/happy-hour",
  "/happy-hours",
  "/eofy",
  "/eofy-deals",
  "/clearance",
  "/clearance/",
  "/clearance?p=1",
  "/clearance?p=2",
  "/specials",
  "/offers",
  "/special-offers",
  "/special-deals",
  "/promotions",
  "/whats-on",
  "/whatson",
  "/outlet",
  "/hot-deals",
  "/red-hot-deals",
  "/half-price-deals",
  "/event/eofy",
  "/event/eofy-deals",
  "/event/eofy-sale",
  "/event/offer-exclusive-deals",
  "/collections/sale",
  "/collections/clearance",
  "/collections/deals",
  "/collections/hot-deals",
  "/collections/all-products-on-sale",
  "/collections/half-price-deals",
  "/collections/specials",
  "/collections/offers",
  "/collections/outlet",
  "/pages/sale",
  "/pages/deals",
  "/pages/eofy-deals",
  "/shop/sale",
];

const DINING_OFFER_PATHS = [
  "/happy-hour",
  "/happy-hours",
  "/special-offers",
  "/special-deals",
  "/offers",
  "/whats-on",
  "/whatson",
];

const ENTERTAINMENT_OFFER_PATHS = [
  "/deals",
  "/offers",
  "/special-offers",
  "/special-deals",
  "/promotions",
  "/promo",
];

const SERVICES_OFFER_PATHS = [
  "/deals",
  "/offers",
  "/special-offers",
  "/promotions",
  "/pricing",
  "/plans",
];

const TRAVEL_OFFER_PATHS = [
  "/deals",
  "/offers",
  "/special-offers",
  "/special-deals",
  "/promotions",
  "/promo",
  "/sale",
  "/packages",
  "/holiday-packages",
  "/hotel-deals",
  "/travel-deals",
  "/holidays/deal",
  "/holidays/deals",
  "/holidays/deals/fly-stay-deals",
  "/holidays/special-offers",
  "/a/en/offers",
  "/a/en/deals",
  "/en/offers",
  "/en/deals",
];

const MAX_DISCOVERED_LINKS = 8;
const MAX_PAGES_TO_CHECK = 32;
const MAX_DISCOVERY_DEPTH = 3;
const REQUEST_TIMEOUT_MS = 8000;
const MIN_RETAIL_SHOP_PERCENT_OFF = 25;
const AU_LOCAL_RETAIL_HOSTS = new Set([
  "incu.com",
  "parlourx.com",
  "abovethecloudsstore.com",
  "thearchiveau.com",
  "sorrythanksiloveyou.com",
]);

function normalizeUrl(url: string): string | null {
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).toString();
  } catch {
    return null;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function isBlockedOrUnavailablePage(text: string): boolean {
  const normalizedText = text.toLowerCase();
  const hasBlockedText = [
    "pardon our interruption",
    "access denied",
    "please enable javascript",
    "javascript is not available",
    "site is currently unavailable",
  ].some((blockedText) => normalizedText.includes(blockedText));

  if (!hasBlockedText) {
    return false;
  }

  const hasUsableOfferText = OFFER_TEXT_PATTERNS.some(({ pattern }) => pattern.test(text));

  return !hasUsableOfferText;
}

function findKeywords(text: string): string[] {
  const normalizedText = text.toLowerCase();

  const keywordMatches = OFFER_KEYWORDS.filter((keyword) => {
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escapedKeyword}\\b`, "i").test(normalizedText);
  });

  const patternMatches = OFFER_TEXT_PATTERNS
    .filter(({ pattern }) => pattern.test(text))
    .map(({ label }) => label);

  return Array.from(new Set([...keywordMatches, ...patternMatches]));
}

function findKeywordsInUrl(url: string): string[] {
  return findKeywords(url.replace(/[-_/?.=&]+/g, " "));
}

function hasExplicitSavingsInUrl(url: string): boolean {
  const urlText = url.replace(/[-_/?.=&]+/g, " ");

  return OFFER_TEXT_PATTERNS.some(({ pattern }) => pattern.test(urlText));
}

function getPercentOffValues(text: string): number[] {
  const percentages: number[] = [];
  const percentOffPattern = /\b(\d+(?:\.\d+)?)%\s*off\b/gi;
  let match: RegExpExecArray | null;

  while ((match = percentOffPattern.exec(text)) !== null) {
    percentages.push(Number(match[1]));
  }

  return percentages.filter((percentage) => Number.isFinite(percentage));
}

function hasRetailShopExplicitSavings(pageText: string): boolean {
  const hasNonPercentageSavings = OFFER_TEXT_PATTERNS.some(
    ({ label, pattern }) => label !== "% off" && pattern.test(pageText)
  );
  const hasMeaningfulPercentOff = getPercentOffValues(pageText).some(
    (percentage) => percentage >= MIN_RETAIL_SHOP_PERCENT_OFF
  );

  return hasNonPercentageSavings || hasMeaningfulPercentOff;
}

function getSiteKey(url: string): string | null {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    const labels = host.split(".").filter(Boolean);

    if (labels.length <= 2) {
      return host;
    }

    const secondLevelCountryDomains = new Set(["com", "net", "org", "co"]);
    const lastLabel = labels[labels.length - 1];
    const secondLastLabel = labels[labels.length - 2];
    const labelCount =
      (lastLabel === "au" || lastLabel === "nz") && secondLevelCountryDomains.has(secondLastLabel) ? 3 : 2;

    return labels.slice(-labelCount).join(".");
  } catch {
    return null;
  }
}

function isSameSiteUrl(candidateUrl: string, pageUrl: string): boolean {
  const candidateSite = getSiteKey(candidateUrl);
  const pageSite = getSiteKey(pageUrl);

  return Boolean(candidateSite && pageSite && candidateSite === pageSite);
}

function hasAustralianTravelUrl(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  const path = url.pathname.toLowerCase();
  const search = url.search.toLowerCase();

  return (
    path.startsWith("/au") ||
    path.includes("/en-au") ||
    path.includes("/en_au") ||
    path.includes("/en/au") ||
    path.includes("/english/au") ||
    path.includes("/australia") ||
    path.includes("/holidays") ||
    search.includes("country=au") ||
    search.includes("pos=au") ||
    search.includes("region=au") ||
    ((host === "qantas.com" || host === "www.qantas.com") &&
      /^\/(?:holidays|au|au-en|au\/)/i.test(path))
  );
}

function hasAustralianLocalRetailHost(url: URL): boolean {
  const host = url.hostname.toLowerCase().replace(/^www\./, "");

  return AU_LOCAL_RETAIL_HOSTS.has(host);
}

function hasTrustedOfferIntentInUrl(url: string): boolean {
  return /(sale|clearance|clerance|clearence|deal|hot[-\s]?deal|eofy|special|special[-\s]?price|limited[-\s]?time[-\s]?offer|offer|promo|promotion|outlet|markdown|reduced)/i.test(
    url
  );
}

function hasRetailShopCatalogueEvidence(url: string, pageText: string): boolean {
  return (
    /\b(catalogue|catalog)\b/i.test(url) &&
    /\b(offer|offers)\b/i.test(pageText) &&
    /\bsave\b/i.test(pageText)
  );
}

function hasEntertainmentOfferEvidence(matchedKeywords: string[], url: string, pageText = ""): boolean {
  if (NON_OFFER_PAGE_PATTERN.test(url)) {
    return false;
  }

  const hasExplicitSavings = OFFER_TEXT_PATTERNS.some(({ pattern }) => pattern.test(pageText));
  const hasStrongEventKeyword = matchedKeywords.some((keyword) =>
    ENTERTAINMENT_STRONG_OFFER_KEYWORDS.has(keyword)
  );
  const hasOfferIntentUrl =
    /(discount|deal|special[-\s]?offer|special[-\s]?deal|promo|promotion|cheap|saver|value|member)/i.test(url);
  const hasAvailabilityOnlyText =
    /\b(tickets?\s+(?:are\s+)?(?:now\s+)?on\s+sale|tickets?\s+on\s+sale\s+now|now\s+on\s+sale|on\s+sale\s+now|tickets?\s+available|book\s+now)\b/i.test(
      pageText
    );

  if (hasExplicitSavings && hasStrongEventKeyword) {
    return true;
  }

  if (hasStrongEventKeyword && (hasOfferIntentUrl || !hasAvailabilityOnlyText)) {
    return true;
  }

  if (!pageText && hasStrongEventKeyword && hasOfferIntentUrl) {
    return true;
  }

  return false;
}

function hasDiningOfferEvidence(matchedKeywords: string[], url: string, pageText = ""): boolean {
  if (NON_OFFER_PAGE_PATTERN.test(url)) {
    return false;
  }

  const hasHappyHour = matchedKeywords.some((keyword) => /^happy hours?$/i.test(keyword));
  const hasDiningKeyword = matchedKeywords.some((keyword) => DINING_STRONG_OFFER_KEYWORDS.has(keyword));
  const hasExplicitSavings = OFFER_TEXT_PATTERNS.some(({ pattern }) => pattern.test(pageText));
  const hasOfferIntentUrl =
    /(happy[-\s]?hours?|special[-\s]?offers?|special[-\s]?deals?|deals?|offers?|what'?s[-\s]?on|whatson)/i.test(url);
  const hasAccommodationOfferUrl =
    /(hotel[-_/ ]?offers?|accommodation|rooms?|suites?|stay|stays|packages?)/i.test(url) &&
    !/(restaurant|restaurants|dining|bar|bars|food|drink|happy[-\s]?hours?)/i.test(url);
  const newsletterOnlySignal =
    /\b(?:stay\s+in\s+touch|newsletter|newsletters|subscribe|sign\s+up|first\s+to\s+hear)\b[\s\S]{0,180}\b(?:special\s+offers?|special\s+deals?|offers?|deals?)\b/i.test(
      pageText
    );

  if (hasHappyHour) {
    return true;
  }

  if (!hasDiningKeyword) {
    return false;
  }

  if (hasAccommodationOfferUrl) {
    return false;
  }

  if (newsletterOnlySignal && !hasExplicitSavings && !hasOfferIntentUrl) {
    return false;
  }

  return hasExplicitSavings || hasOfferIntentUrl;
}

function hasServicesOfferEvidence(matchedKeywords: string[], url: string, pageText = ""): boolean {
  if (NON_OFFER_PAGE_PATTERN.test(url)) {
    return false;
  }

  const hasServiceOfferPattern = OFFER_TEXT_PATTERNS.some(({ label, pattern }) =>
    SERVICES_STRONG_OFFER_KEYWORDS.has(label) && pattern.test(pageText)
  );
  const hasStrongServiceKeyword = matchedKeywords.some((keyword) =>
    SERVICES_STRONG_OFFER_KEYWORDS.has(keyword)
  );
  const hasOfferIntentUrl = /(deal|offer|special|promo|promotion|pricing|plan|cashback|bonus|free)/i.test(url);

  return hasServiceOfferPattern || (hasStrongServiceKeyword && hasOfferIntentUrl);
}

function hasTravelExplicitSavings(pageText: string): boolean {
  const hasStrongTravelPattern = OFFER_TEXT_PATTERNS.some(({ label, pattern }) => {
    if (label === "% off") {
      return false;
    }

    return TRAVEL_STRONG_OFFER_KEYWORDS.has(label) && pattern.test(pageText);
  });
  const hasMeaningfulPercentOff = getPercentOffValues(pageText).some(
    (percentage) => percentage >= MIN_RETAIL_SHOP_PERCENT_OFF
  );

  return hasStrongTravelPattern || hasMeaningfulPercentOff;
}

function hasTravelOfferEvidence(matchedKeywords: string[], url: string, pageText = ""): boolean {
  if (NON_OFFER_PAGE_PATTERN.test(url)) {
    return false;
  }

  const hasTravelKeyword = matchedKeywords.some((keyword) =>
    TRAVEL_STRONG_OFFER_KEYWORDS.has(keyword)
  );
  const hasExplicitSavings = hasTravelExplicitSavings(pageText);
  const hasOfferIntentUrl =
    /(deals?|offers?|special[-\s]?(?:deals?|offers?)|promo|promotion|sale|packages?|holiday|flight[-\s+]?hotel|hotel[-\s]?deals?|travel[-\s]?deals?)/i.test(
      url
    );
  const hasSpecialTravelOfferText =
    /\b(?:discounts?\s+and\s+special\s+offers?|special\s+(?:deals?|offers?)|exclusive\s+(?:deals?|offers?)|travel\s+deals?|hotel\s+deals?|holiday\s+deals?)\b/i.test(
      pageText
    );
  const hasPackageDealText =
    /\b(?:flight\s*\+\s*hotel|holiday\s+package|travel\s+package|package\s+deal|hotel\s+deals?|accommodation\s+deals?)\b/i.test(
      pageText
    );
  const newsletterOnlySignal =
    /\b(?:newsletter|newsletters|subscribe|sign\s+up|first\s+to\s+hear)\b[\s\S]{0,180}\b(?:exclusive\s+)?(?:offers?|deals?)\b/i.test(
      pageText
    );

  if (!hasTravelKeyword) {
    return false;
  }

  if (newsletterOnlySignal && !hasExplicitSavings && !hasOfferIntentUrl && !hasSpecialTravelOfferText) {
    return false;
  }

  return hasExplicitSavings || hasOfferIntentUrl || hasSpecialTravelOfferText || hasPackageDealText;
}

function normalizeCountry(country?: string): string | undefined {
  if (!country || country.trim().length === 0) {
    return undefined;
  }

  const normalized = country.trim();

  if (/^(australia|au)$/i.test(normalized)) {
    return "Australia";
  }

  if (/^(new zealand|nz)$/i.test(normalized)) {
    return "New Zealand";
  }

  if (/^(united states|united states of america|usa|us)$/i.test(normalized)) {
    return "United States";
  }

  return normalized;
}

function isCountryRelevant(url: string, country?: string, pageText = ""): boolean {
  const normalizedCountry = normalizeCountry(country);

  if (!normalizedCountry) {
    return true;
  }

  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.toLowerCase();
    const path = parsedUrl.pathname.toLowerCase();
    const text = pageText.toLowerCase();

    if (normalizedCountry === "Australia") {
      return (
        host.endsWith(".com.au") ||
        host.endsWith(".net.au") ||
        host.startsWith("au.") ||
        hasAustralianLocalRetailHost(parsedUrl) ||
        hasAustralianTravelUrl(parsedUrl) ||
        /\b(australia|australian|aud|nsw|vic|qld|wa|sa|tas|act|nt)\b/i.test(text)
      );
    }

    if (normalizedCountry === "New Zealand") {
      return (
        host.endsWith(".co.nz") ||
        host.endsWith(".nz") ||
        host.startsWith("nz.") ||
        path.startsWith("/nz") ||
        /\b(new zealand|nz|nzd|auckland|wellington|christchurch)\b/i.test(text)
      );
    }

    if (normalizedCountry === "United States") {
      return (
        host.endsWith(".com") ||
        host.endsWith(".us") ||
        host.startsWith("us.") ||
        path.startsWith("/us") ||
        /\b(united states|usa|usd)\b/i.test(text)
      );
    }

    return text.includes(normalizedCountry.toLowerCase());
  } catch {
    return false;
  }
}

function hasStrongOfferEvidence(
  matchedKeywords: string[],
  url: string,
  pageText = "",
  profile: OfferVerifierOptions["profile"] = "retail"
): boolean {
  if (profile === "dining") {
    return hasDiningOfferEvidence(matchedKeywords, url, pageText);
  }

  if (profile === "entertainment") {
    return hasEntertainmentOfferEvidence(matchedKeywords, url, pageText);
  }

  if (profile === "services") {
    return hasServicesOfferEvidence(matchedKeywords, url, pageText);
  }

  if (profile === "travel") {
    return hasTravelOfferEvidence(matchedKeywords, url, pageText);
  }

  if (profile === "retailShop") {
    if (NON_OFFER_PAGE_PATTERN.test(url)) {
      return false;
    }

    const hasExplicitSavings = hasRetailShopExplicitSavings(pageText);
    const hasRetailKeyword = matchedKeywords.some((keyword) => RETAIL_SHOP_STRONG_OFFER_KEYWORDS.has(keyword));
    const hasCatalogueOfferEvidence = hasRetailShopCatalogueEvidence(url, pageText);

    return (hasExplicitSavings && hasRetailKeyword) || hasCatalogueOfferEvidence;
  }

  const hasSpecialsPath =
    matchedKeywords.some((keyword) => keyword === "special" || keyword === "specials") &&
    /(\/|-)special(s)?(\/|$)|catalogue|catalog|weekly-specials|on-special/i.test(url);
  const hasStrongKeyword =
    hasSpecialsPath || matchedKeywords.some((keyword) => STRONG_OFFER_KEYWORDS.has(keyword));

  if (!hasStrongKeyword) {
    return false;
  }

  const pageLooksInformational = NON_OFFER_PAGE_PATTERN.test(url) || NON_OFFER_PAGE_PATTERN.test(pageText);
  const hasExplicitSavings = OFFER_TEXT_PATTERNS.some(({ pattern }) => pattern.test(pageText));
  const hasSalePath =
    /(\/|-)sale(s)?(\/|$)|clearance|eofy|deal|outlet|promo|promotion|(\/|-)special(s)?(\/|$)|catalogue|catalog|weekly-specials|on-special/i.test(
      url
    );

  if (pageLooksInformational && !hasExplicitSavings && !hasSalePath) {
    return false;
  }

  return true;
}

function extractOfferLinks(html: string, pageUrl: string): string[] {
  const links = new Set<string>();
  const anchorPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorPattern.exec(html)) !== null) {
    const href = match[1];
    const label = stripHtml(match[2]);
    const candidateText = `${href} ${label}`;

    if (!OFFER_LINK_PATTERN.test(candidateText)) {
      continue;
    }

    try {
      const url = new URL(href, pageUrl);
      if ((url.protocol === "http:" || url.protocol === "https:") && isSameSiteUrl(url.toString(), pageUrl)) {
        links.add(url.toString());
      }
    } catch {
      // Ignore malformed store links.
    }
  }

  return Array.from(links).slice(0, MAX_DISCOVERED_LINKS);
}

async function fetchPage(url: string): Promise<{ text: string; html: string } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; DiscountNotifier/1.0; +https://localhost)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType && !contentType.includes("text/html") && !contentType.includes("text/plain")) {
      return null;
    }

    const html = await response.text();
    const text = stripHtml(html);

    if (isBlockedOrUnavailablePage(text)) {
      return null;
    }

    return { html, text };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function addCommonOfferUrls(
  baseUrl: string,
  urls: Set<string>,
  profile: OfferVerifierOptions["profile"] = "retail"
) {
  try {
    const base = new URL(baseUrl);
    const commonPaths =
      profile === "dining"
        ? DINING_OFFER_PATHS
        : profile === "entertainment"
          ? ENTERTAINMENT_OFFER_PATHS
          : profile === "services"
            ? SERVICES_OFFER_PATHS
            : profile === "travel"
              ? TRAVEL_OFFER_PATHS
              : profile === "retailShop"
                ? []
                : COMMON_OFFER_PATHS;

    commonPaths.forEach((path) => {
      urls.add(new URL(path, base.origin).toString());
    });

    const firstPathSegment = base.pathname.split("/").filter(Boolean)[0];
    if (firstPathSegment && /^[a-z]{2}(-[a-z]{2})?$/i.test(firstPathSegment)) {
      commonPaths.forEach((path) => {
        urls.add(new URL(`/${firstPathSegment}${path}`, base.origin).toString());
      });
    }
  } catch {
    // Ignore invalid base URLs.
  }
}

function queueUrl(
  url: string,
  depth: number,
  source: UrlToCheck["source"],
  queuedUrls: Set<string>,
  queue: UrlToCheck[]
) {
  const normalizedUrl = normalizeUrl(url);

  if (!normalizedUrl || queuedUrls.has(normalizedUrl)) {
    return;
  }

  queuedUrls.add(normalizedUrl);
  queue.push({ url: normalizedUrl, depth, source });
}

export class OfferVerifier {
  static async verifyStoreOfferPages(
    storeUrl: string,
    catalogUrls: string[] = [],
    options: OfferVerifierOptions = {}
  ): Promise<OfferVerificationResult> {
    const normalizedStoreUrl = normalizeUrl(storeUrl);
    const checkedUrls: string[] = [];
    const queuedUrls = new Set<string>();
    const urlsToCheck: UrlToCheck[] = [];

    if (normalizedStoreUrl) {
      queueUrl(normalizedStoreUrl, 1, "store", queuedUrls, urlsToCheck);
    }

    catalogUrls
      .map(normalizeUrl)
      .filter((url): url is string => Boolean(url))
      .forEach((url) => queueUrl(url, 2, "catalog", queuedUrls, urlsToCheck));

    if (normalizedStoreUrl) {
      const commonOfferUrls = new Set<string>();
      addCommonOfferUrls(normalizedStoreUrl, commonOfferUrls, options.profile);
      commonOfferUrls.forEach((url) => queueUrl(url, 2, "common", queuedUrls, urlsToCheck));
    }

    for (let index = 0; index < urlsToCheck.length && checkedUrls.length < MAX_PAGES_TO_CHECK; index++) {
      const current = urlsToCheck[index];
      checkedUrls.push(current.url);
      const page = await fetchPage(current.url);

      if (!page) {
        const matchedKeywords = findKeywordsInUrl(current.url);
        const canTrustOfferUrl =
          current.source === "catalog" ||
          (options.profile !== "retailShop" && current.source === "discovered");
        const hasTrustedRetailShopCatalogUrl =
          options.profile === "retailShop" &&
          current.source === "catalog" &&
          hasTrustedOfferIntentInUrl(current.url);

        if (
          canTrustOfferUrl &&
          matchedKeywords.length > 0 &&
          isCountryRelevant(current.url, options.country) &&
          (hasTrustedRetailShopCatalogUrl ||
            hasStrongOfferEvidence(matchedKeywords, current.url, "", options.profile))
        ) {
          return {
            hasOffer: true,
            matchedKeywords,
            checkedUrls,
            matchedUrl: current.url,
          };
        }

        continue;
      }

      const matchedKeywords = Array.from(
        new Set([
          ...findKeywords(page.text),
          ...(current.source === "catalog" ? findKeywordsInUrl(current.url) : []),
        ])
      );
      const hasTrustedRetailShopCatalogPage =
        options.profile === "retailShop" &&
        current.source === "catalog" &&
        hasTrustedOfferIntentInUrl(current.url) &&
        !NON_OFFER_PAGE_PATTERN.test(current.url) &&
        matchedKeywords.some((keyword) => RETAIL_SHOP_STRONG_OFFER_KEYWORDS.has(keyword));

      if (
        matchedKeywords.length > 0 &&
        isCountryRelevant(current.url, options.country, page.text) &&
        (hasTrustedRetailShopCatalogPage ||
          hasStrongOfferEvidence(matchedKeywords, current.url, page.text, options.profile))
      ) {
        return {
          hasOffer: true,
          matchedKeywords,
          checkedUrls,
          matchedUrl: current.url,
        };
      }

      if (current.depth < MAX_DISCOVERY_DEPTH) {
        extractOfferLinks(page.html, current.url).forEach((link) =>
          queueUrl(link, current.depth + 1, "discovered", queuedUrls, urlsToCheck)
        );
      }
    }

    return {
      hasOffer: false,
      matchedKeywords: [],
      checkedUrls,
    };
  }
}
