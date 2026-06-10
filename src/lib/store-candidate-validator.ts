import type { OfferVerifierOptions } from "./offer-verifier";

export type StoreCandidateValidationInput = {
  name: string;
  url: string;
  categoryName: string;
  html?: string;
  sourceType?: string;
  websiteUrl?: string;
  description?: string;
};

export type StoreCandidateValidationResult = {
  ok: boolean;
  reason?: string;
};

export function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function stripHtml(value: string) {
  return decodeHtml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeForMatch(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function categoryUsesRetailDiscovery(categoryName: string) {
  return /clothing|fashion|business attire|leather|sport gears|factory outlets|baby|kids|cosmetic|perfume|electronic|gadget|hifi|speaker|gift|flowers|office|stationery|games|toys|tools|diy|pets|traveling accessories|vitamins|supplements/i.test(
    categoryName
  );
}

export function isBrandAtStockistName(name: string) {
  return /\bat\s+.+\s+online$/i.test(name);
}

export function verifierOptionsForStoreCandidate(name: string): Pick<
  OfferVerifierOptions,
  "disableCommonOfferUrls" | "disableDiscoveredOfferLinks" | "requireProductDiscountEvidence"
> {
  if (!isBrandAtStockistName(name)) {
    return {};
  }

  return {
    disableCommonOfferUrls: true,
    disableDiscoveredOfferLinks: true,
    requireProductDiscountEvidence: true,
  };
}

export function validateStockistPresence(html: string, storeName: string): StoreCandidateValidationResult {
  const text = stripHtml(html);
  const lowerText = text.toLowerCase();
  const normalizedText = normalizeForMatch(text);
  const normalizedStore = normalizeForMatch(storeName);

  if (!text || !normalizedStore || !normalizedText.includes(normalizedStore)) {
    return { ok: false, reason: "brand name not found on stockist page" };
  }

  const negativeResultPatterns = [
    /\b(?:no|0)\s+(?:products?|results?|matches?|items?)\b/i,
    /\bnothing\s+(?:found|matched)\b/i,
    /\bnot\s+found\b/i,
    /\bcouldn'?t\s+find\b/i,
    /\bdid\s+not\s+match\b/i,
    /\bsorry\b.{0,120}\b(?:no|not|couldn'?t)\b/i,
  ];

  if (negativeResultPatterns.some((pattern) => pattern.test(text))) {
    return { ok: false, reason: "stockist page reports no matching products" };
  }

  const normalizedStoreMatches = normalizedText.match(new RegExp(normalizedStore, "g")) || [];
  const queryOnlyPattern = new RegExp(
    `\\b(?:search\\s+(?:results\\s+)?(?:for\\s+)?|results\\s+for\\s+|you\\s+searched\\s+for\\s+)${storeName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
    "i"
  );

  if (normalizedStoreMatches.length <= 2 && queryOnlyPattern.test(text)) {
    return { ok: false, reason: "brand appears only as a search query, not a product" };
  }

  const storeIndex = normalizeForMatch(text.slice(0, Math.max(text.length, 1))).indexOf(normalizedStore);
  const originalStoreIndex = lowerText.indexOf(storeName.toLowerCase());
  const contextStart = Math.max((originalStoreIndex >= 0 ? originalStoreIndex : storeIndex) - 500, 0);
  const contextEnd = Math.min((originalStoreIndex >= 0 ? originalStoreIndex : storeIndex) + storeName.length + 700, text.length);
  const nearbyText = text.slice(contextStart, contextEnd);
  const nearbyCommerceSignal =
    /\b(?:add to (?:bag|cart)|product|products|price|size|colour|color|available|sale|clearance|was|now)\b/i.test(
      nearbyText
    ) || /\$\s?\d/.test(nearbyText);

  if (!nearbyCommerceSignal) {
    return { ok: false, reason: "brand name is not shown near product evidence on stockist page" };
  }

  const commerceSignal =
    /\b(?:add to (?:bag|cart)|product|products|price|size|colour|color|available|sale|clearance|was|now)\b/i.test(
      text
    ) || /\$\s?\d/.test(text);

  if (!commerceSignal) {
    return { ok: false, reason: "no product or commerce signal found on stockist page" };
  }

  return { ok: true };
}

export function validateStoreCandidate(input: StoreCandidateValidationInput): StoreCandidateValidationResult {
  const sourceType = input.sourceType || "website";

  try {
    const parsedUrl = new URL(input.url);
    const host = parsedUrl.hostname.toLowerCase();

    if (
      sourceType !== "google_business" &&
      /(facebook|instagram|tiktok|youtube|linkedin|twitter|x\.com|pinterest|reddit|google|bing|duckduckgo|wikipedia|amazon|ebay|temu|shein)/i.test(
        host
      )
    ) {
      return { ok: false, reason: "noisy or unsupported store URL host" };
    }
  } catch {
    return { ok: false, reason: "invalid store URL" };
  }

  if (!categoryUsesRetailDiscovery(input.categoryName)) {
    return { ok: true };
  }

  const text = stripHtml([input.html, input.description, input.name, input.websiteUrl].filter(Boolean).join(" "));
  if (!text) {
    return { ok: true };
  }

  const serviceOnlySignal =
    /\b(?:cloud\s*(?:zone|computing|solutions?|services?|migration|infrastructure)|managed\s+(?:it|cloud|services?)|cyber\s*security|cybersecurity|software\s+solutions?|saas|microsoft\s+azure|aws|google\s+cloud|it\s+consult(?:ing|ants?)?|digital\s+transformation)\b/i.test(
      text
    );
  const retailSignal =
    /\b(?:add to (?:bag|cart)|shop now|product|products|size|colour|color|menswear|womenswear|footwear|apparel|clothing|shoes|sneakers?|sport|fitness|gear|sale|clearance|price)\b/i.test(
      text
    ) || /\$\s?\d/.test(text);

  if (serviceOnlySignal && !retailSignal) {
    return { ok: false, reason: "service/IT site does not match retail category" };
  }

  return { ok: true };
}
