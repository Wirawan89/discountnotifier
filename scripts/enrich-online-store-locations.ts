import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type ExtractedLocation = {
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  country: string;
  label?: string;
  sourceUrl?: string;
  latitude?: number | null;
  longitude?: number | null;
};

type LocatorCandidate = {
  url: string;
  source: string;
};

type StaticLocationRow = [string, string, string, string, string, string?];

const AU_STATES = new Set(["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"]);
const AU_STATE_ALIASES: Record<string, string> = {
  "AUSTRALIAN CAPITAL TERRITORY": "ACT",
  "NEW SOUTH WALES": "NSW",
  "NORTHERN TERRITORY": "NT",
  QUEENSLAND: "QLD",
  "SOUTH AUSTRALIA": "SA",
  TASMANIA: "TAS",
  VICTORIA: "VIC",
  "WESTERN AUSTRALIA": "WA",
};
const AU_STATE_TEXT_PATTERN =
  "(?:Australian Capital Territory|New South Wales|Northern Territory|Queensland|South Australia|Tasmania|Victoria|Western Australia|ACT|NSW|NT|QLD|SA|TAS|VIC|WA)";
const COMMON_LOCATOR_PATHS = [
  "/store-locator",
  "/store-locator/",
  "/stores",
  "/stores/",
  "/au/stores",
  "/au/stores/",
  "/store-finder",
  "/store-finder/",
  "/store-locations",
  "/store-locations/",
  "/location",
  "/location/",
  "/locations",
  "/locations/",
  "/find-a-store",
  "/find-a-store/",
  "/findastore",
  "/findastore/",
  "/find-us",
  "/find-us/",
  "/pages/our-stores",
  "/pages/store-locator",
  "/pages/stores",
  "/pages/stockists",
  "/stockists",
  "/our-store",
  "/our-stores",
  "/about",
  "/about-us",
  "/contact",
  "/contact-us",
];
const LOCATOR_LINK_PATTERN =
  /(store[-\s]?locator|store[-\s]?locations?|find[-\s]?a?[-\s]?store|find[-\s]?us|our[-\s]?stores?|stores?|locations?|stockists?|about[-\s]?us|about|contact[-\s]?us|contact)/i;
const LOCATOR_RESOURCE_PATTERN =
  /(store[-_]?locator|store[-_]?finder|store[-_]?locations?|find[-_]?a?[-_]?store|find[-_]?us|stores?|locations?|stockists?)/i;
const SKIP_URL_PATTERN = /(facebook|instagram|tiktok|youtube|linkedin|twitter|x\.com|mailto:|tel:|javascript:)/i;
const ONLINE_NAME_PATTERN = /\b(australia|australian|online|offers?|deals?|specials?|official|national)\b/i;
const ADDRESS_KEY_PATTERN = /(address|street|suburb|city|state|postcode|postal|latitude|longitude|stores?|locations?)/i;

function getArg(name: string) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));

  return arg?.slice(prefix.length);
}

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function normalizeText(value: string) {
  return decodeEscapedText(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEscapedText(value: string) {
  return value
    .replace(/\\u0026/g, "&")
    .replace(/\\u003c/gi, "<")
    .replace(/\\u003e/gi, ">")
    .replace(/\\u002f/gi, "/")
    .replace(/\\"/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ");
}

function decodeHtmlEntities(value: string) {
  return decodeEscapedText(value)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function normalizeUrl(url: string) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";

    return parsed.toString();
  } catch {
    return url;
  }
}

function sameWebsiteScope(value: string | null | undefined, parentUrl: string) {
  if (!value) {
    return false;
  }

  try {
    const candidate = new URL(value);
    const parent = new URL(parentUrl);

    return candidate.hostname.replace(/^www\./, "") === parent.hostname.replace(/^www\./, "");
  } catch {
    return false;
  }
}

function looksLikeStoreLocatorUrl(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  try {
    const parsed = new URL(value);

    if (/^stores\./i.test(parsed.hostname)) {
      return true;
    }
  } catch {
    // Fall through to path-based detection.
  }

  return /(?:store-?locator|find-?a-?store|\/stores(?:\/|\?|#|$)|\/locations?(?:\/|\?|#|$)|\/boutiques?(?:\/|\?|#|$)|\/pages\/boutiques|boutiques?\?|storefinder|store-locations)/i.test(value);
}

function resolveUrl(href: string, baseUrl: string) {
  if (!href || SKIP_URL_PATTERN.test(href)) {
    return null;
  }

  try {
    return normalizeUrl(new URL(href.replace(/&amp;/g, "&"), baseUrl).toString());
  } catch {
    return null;
  }
}

function isRelevantCandidateUrl(url: string, baseUrl: string) {
  try {
    const candidateHost = new URL(url).hostname.replace(/^www\./, "");
    const baseHost = new URL(baseUrl).hostname.replace(/^www\./, "");

    if (candidateHost === baseHost || candidateHost.endsWith(`.${baseHost}`)) {
      return true;
    }

    if (baseHost.endsWith(".au") && candidateHost.endsWith(".au")) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

async function fetchText(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeoutMs = Number(getArg("timeoutMs") || 5000);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; DiscountNotifier/1.0; +https://discountnotifier.local)",
        accept: "text/html,application/xhtml+xml,application/json,text/javascript,*/*;q=0.8",
        ...(init?.headers || {}),
      },
    });

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") || "";

    if (!/text\/html|application\/xhtml\+xml|application\/json|text\/javascript|application\/javascript|text\/plain/i.test(contentType)) {
      return null;
    }

    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchHtml(url: string, init?: RequestInit) {
  const text = await fetchText(url, init);

  if (!text || !/<html|<!doctype html/i.test(text)) {
    return null;
  }

  return text;
}

async function fetchJson(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeoutMs = Number(getArg("timeoutMs") || 5000);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; DiscountNotifier/1.0; +https://discountnotifier.local)",
        accept: "application/json,text/plain,*/*",
        ...(init?.headers || {}),
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function extractLocatorLinks(html: string, baseUrl: string) {
  const candidates: LocatorCandidate[] = [];
  const seen = new Set<string>();
  const linkPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(html))) {
    const href = match[1];
    const label = normalizeText(match[2]);
    const url = resolveUrl(href, baseUrl);

    if (!url || seen.has(url) || !isRelevantCandidateUrl(url, baseUrl)) {
      continue;
    }

    if (LOCATOR_LINK_PATTERN.test(href) || LOCATOR_LINK_PATTERN.test(label)) {
      candidates.push({ url, source: label || href });
      seen.add(url);
    }
  }

  return candidates;
}

function extractLinkedResources(html: string, baseUrl: string) {
  const candidates: LocatorCandidate[] = [];
  const seen = new Set<string>();
  const pattern = /\b(?:href|src)=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html))) {
    const href = match[1];
    const url = resolveUrl(href, baseUrl);

    if (!url || seen.has(url) || !isRelevantCandidateUrl(url, baseUrl)) {
      continue;
    }

    if (LOCATOR_LINK_PATTERN.test(href) || (LOCATOR_RESOURCE_PATTERN.test(href) && /\.(json|js)(?:\?|$)/i.test(href))) {
      candidates.push({ url, source: "linked-resource" });
      seen.add(url);
    }
  }

  return candidates;
}

function extractRawLocatorUrls(html: string, baseUrl: string) {
  const candidates: LocatorCandidate[] = [];
  const seen = new Set<string>();
  const decoded = decodeEscapedText(html);
  const pattern =
    /(?:https?:\/\/[A-Za-z0-9.-]+)?\/(?:stores?|our-stores?|store-locator|store-finder|store-locations?|findastore|find-a-store|find-us|locations?|stockists)(?:\/|\?)[A-Za-z0-9/_?=&%.,:+-]*/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(decoded))) {
    const url = resolveUrl(match[0], baseUrl);

    if (!url || seen.has(url) || !isRelevantCandidateUrl(url, baseUrl)) {
      continue;
    }

    candidates.push({ url, source: "raw-url" });
    seen.add(url);
  }

  return candidates;
}

function getCommonLocatorCandidates(baseUrl: string) {
  const candidates: LocatorCandidate[] = [];

  try {
    const origin = new URL(baseUrl).origin;

    for (const path of COMMON_LOCATOR_PATHS) {
      candidates.push({ url: normalizeUrl(`${origin}${path}`), source: "common-path" });
    }
  } catch {
    // Ignore invalid store URLs.
  }

  return candidates;
}

function stringValue(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return normalizeText(value);
    }
    if (typeof value === "number") {
      return String(value);
    }
    if (Array.isArray(value)) {
      const joined: string = value.map((entry) => stringValue(entry)).filter(Boolean).join(", ");

      if (joined) {
        return normalizeText(joined);
      }
    }
  }

  return "";
}

function stateCode(...values: unknown[]) {
  const normalized = stringValue(...values).toUpperCase();

  return AU_STATE_ALIASES[normalized] || normalized;
}

function numberValue(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function formatAddress(...parts: string[]) {
  return parts
    .filter(Boolean)
    .join(", ")
    .replace(/\s*,\s*,+/g, ",")
    .replace(/\s+/g, " ")
    .trim();
}

function parseAddressObject(value: unknown, parent?: Record<string, unknown>): ExtractedLocation | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const state = stateCode(
    record.addressRegion,
    record.state,
    record.region,
    record.regionCode,
    record.provinceCode,
    record.province,
    record.administrativeArea,
    parent?.state,
    parent?.regionCode,
    parent?.provinceCode,
    parent?.addressRegion
  ).toUpperCase();
  const countryValue = record.addressCountry || record.country || record.countryCode;
  const country =
    typeof countryValue === "string"
      ? countryValue
      : countryValue && typeof countryValue === "object"
        ? String((countryValue as Record<string, unknown>).name || "Australia")
        : "Australia";
  const suburb = stringValue(
    record.addressLocality,
    record.suburb,
    record.city,
    record.locality,
    parent?.suburb,
    parent?.city,
    parent?.addressLocality
  );
  const postcode = stringValue(record.postalCode, record.postcode, record.zip, parent?.postalCode, parent?.postcode);
  const street1 = stringValue(
    record.streetAddress,
    record.addressLine1,
    record.address1,
    record.addressLine,
    record.addressLines,
    record.line1,
    record.street,
    parent?.streetAddress,
    parent?.addressLine1,
    parent?.address1
  );
  const street2 = stringValue(record.addressLine2, record.address2, record.line2, parent?.addressLine2, parent?.address2);
  const street = formatAddress(street1, street2 && !street1.toLowerCase().includes(street2.toLowerCase()) ? street2 : "");
  const geo = parent?.geo && typeof parent.geo === "object" ? (parent.geo as Record<string, unknown>) : undefined;
  const latitude = numberValue(record.latitude, record.lat, parent?.latitude, parent?.lat, geo?.latitude, geo?.lat);
  const longitude = numberValue(record.longitude, record.lng, record.lon, parent?.longitude, parent?.lng, parent?.lon, geo?.longitude, geo?.lng, geo?.lon);

  if (!street || !suburb || !AU_STATES.has(state)) {
    return null;
  }

  return {
    address: formatAddress(street, suburb, state, postcode),
    suburb,
    state,
    postcode,
    country: /AU|Australia/i.test(country) ? "Australia" : country,
    latitude,
    longitude,
  };
}

function extractStructuredLocations(value: unknown) {
  const locations: ExtractedLocation[] = [];
  const visited = new Set<unknown>();

  function visit(value: unknown, parent?: Record<string, unknown>) {
    if (!value || typeof value !== "object") {
      return;
    }
    if (visited.has(value)) {
      return;
    }
    visited.add(value);

    if (Array.isArray(value)) {
      value.forEach((entry) => visit(entry, parent));
      return;
    }

    const record = value as Record<string, unknown>;

    if (record.address) {
      const parsed = parseAddressObject(record.address, record);

      if (parsed) {
        locations.push(parsed);
      }
    }

    const parsed = parseAddressObject(record, parent);

    if (parsed) {
      locations.push(parsed);
    }

    for (const [key, nested] of Object.entries(record)) {
      if (ADDRESS_KEY_PATTERN.test(key) || Array.isArray(nested) || (nested && typeof nested === "object")) {
        visit(nested, record);
      }
    }
  }

  visit(value);

  return locations;
}

function extractJsonLocations(text: string) {
  const locations: ExtractedLocation[] = [];
  const scriptPattern = /<script[^>]*(?:type=["']application\/ld\+json["']|id=["']__NEXT_DATA__["'])[^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = scriptPattern.exec(text))) {
    try {
      locations.push(...extractStructuredLocations(JSON.parse(match[1])));
    } catch {
      // Some sites include invalid JSON. Keep parsing other blocks.
    }
  }

  if (/^\s*[\[{]/.test(text)) {
    try {
      locations.push(...extractStructuredLocations(JSON.parse(text)));
    } catch {
      // Plain JSON-like resource was not valid JSON.
    }
  }

  return locations;
}

function jsonStringField(block: string, key: string) {
  const match = block.match(new RegExp(`"${key}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`, "i"));

  return match ? normalizeText(decodeEscapedText(match[1])) : "";
}

function jsonNumberField(block: string, key: string) {
  const match = block.match(new RegExp(`"${key}"\\s*:\\s*(-?\\d+(?:\\.\\d+)?)`, "i"));

  return numberValue(match?.[1]);
}

function extractHydrogenStoreLocations(html: string) {
  const locations: ExtractedLocation[] = [];
  const pattern = /"name"\s*:\s*"((?:\\.|[^"\\])*)"\s*,\s*"address"\s*:\s*\{([\s\S]*?)\}\s*,\s*"handle"/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html))) {
    const addressBlock = match[2];
    const street = formatAddress(jsonStringField(addressBlock, "address1"), jsonStringField(addressBlock, "address2"));
    const location = locationFromAddressParts({
      street,
      suburb: jsonStringField(addressBlock, "city"),
      state: stateCode(jsonStringField(addressBlock, "provinceCode"), jsonStringField(addressBlock, "province")),
      postcode: jsonStringField(addressBlock, "zip"),
      latitude: jsonNumberField(addressBlock, "latitude"),
      longitude: jsonNumberField(addressBlock, "longitude"),
    });

    if (location) {
      locations.push(location);
    }
  }

  return dedupeLocations(locations);
}

function extractRegexLocations(html: string) {
  const text = normalizeText(html);
  const locations: ExtractedLocation[] = [];
  const pattern =
    /(?:^|[|•\n.;])\s*((?:Shop|Shops|Suite|Unit|Level|Lot|Tenancy|T|Kiosk|Ground Floor|G\/F|[0-9])[^\n|•.;]{4,140}?)\s+([A-Z][A-Za-z' -]{2,40})\s+(ACT|NSW|NT|QLD|SA|TAS|VIC|WA)\s+(\d{4})(?=\s|$|[|•\n.;,])/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text))) {
    const street = match[1].trim();
    const suburb = match[2].trim();
    const state = match[3].trim();
    const postcode = match[4].trim();

    if (/^(phone|email|open|hours?|mon|tue|wed|thu|fri|sat|sun)$/i.test(street)) {
      continue;
    }
    if (/data-|["'=]/i.test(street)) {
      continue;
    }
    if (/^(?:the\s+)?promoter\b|ABN\b|^\d+\)/i.test(street)) {
      continue;
    }

    locations.push({
      address: formatAddress(street, titleCase(suburb), state, postcode),
      suburb: titleCase(suburb),
      state,
      postcode,
      country: "Australia",
      latitude: null,
      longitude: null,
    });
  }

  return locations;
}

function extractLabelledAustralianLocations(html: string) {
  const text = normalizeText(html);
  const locations: ExtractedLocation[] = [];
  const pattern = new RegExp(
    `\\b([A-Z][A-Za-z'&./ -]{1,60}\\b(?:Flagship|Village|Store|Boutique|Shop|Location))\\s+((?:Shop|Shops|Suite|Unit|Level|Lot|Tenancy|T|Kiosk|Ground Floor|G\\/F|\\d)[A-Za-z0-9'&./, -]{4,140}?\\s+${AU_STATE_TEXT_PATTERN}\\s+\\d{4})\\s+Australia\\b`,
    "gi"
  );
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text))) {
    const label = normalizeText(match[1])
      .replace(/^(?:Drop by the|Visit|Find us at|Location)\s+/i, "")
      .trim();
    const fallbackSuburb = label.replace(/\b(?:Flagship|Village|Store|Boutique|Shop|Location)\b/gi, "").trim();
    const location = parseAustralianAddressLine(match[2], fallbackSuburb);

    if (!location) {
      continue;
    }

    locations.push({
      ...location,
      label,
    });
  }

  return dedupeLocations(locations);
}

function dedupeLocations(locations: ExtractedLocation[]) {
  const seen = new Set<string>();
  const deduped: ExtractedLocation[] = [];

  for (const location of locations) {
    const key = `${location.address}|${location.suburb}|${location.state}|${location.postcode}`.toLowerCase();

    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(location);
    }
  }

  return deduped;
}

function branchName(baseName: string, location: ExtractedLocation) {
  if (/^Maple Store\b/i.test(baseName) && location.label) {
    return `Maple Store ${normalizeText(location.label)}`.replace(/\s+/g, " ").trim();
  }

  const suburbPattern = location.suburb.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const locationLabel = normalizeText(location.label || "");
  const base = baseName
    .replace(/\bAustralia\b/gi, "")
    .replace(/\bOnline\b/gi, "")
    .replace(new RegExp(`\\b${suburbPattern}\\b$`, "i"), "")
    .replace(/\b(?:Sydney|Melbourne|Brisbane|Perth|Surry Hills|The Rocks)\b$/gi, "")
    .trim();

  return `${base} ${locationLabel || location.suburb}`.replace(
    /\s+/g,
    " "
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function locationUrl(storeUrl: string, location: ExtractedLocation) {
  if (location.sourceUrl) {
    return location.sourceUrl;
  }

  const locationKey = slugify([location.suburb, location.state, location.postcode, location.address].join(" "));

  return `${storeUrl.replace(/\/$/, "")}#${locationKey}`;
}

function branchUrl(store: { url: string; websiteUrl?: string | null }, location: ExtractedLocation) {
  const parentWebsiteUrl = store.websiteUrl || store.url;
  const sourceUrl = location.sourceUrl ? normalizeUrl(location.sourceUrl) : null;

  if (sourceUrl && !looksLikeStoreLocatorUrl(sourceUrl)) {
    return sourceUrl;
  }

  const locationKey = slugify([location.suburb, location.state, location.postcode, location.address].join(" "));

  return `${parentWebsiteUrl.replace(/\/$/, "")}#${locationKey}`;
}

function branchDiscountTitle(parentTitle: string, parentName: string, branchStoreName: string) {
  if (parentTitle.toLowerCase().includes(parentName.toLowerCase())) {
    return parentTitle.replace(new RegExp(parentName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), branchStoreName);
  }

  return `${branchStoreName} ${parentTitle}`;
}

async function discoverJbHiFiLocations() {
  const url = "https://VTVKM5URPX-dsn.algolia.net/1/indexes/shopify_store_locations/query";
  const json = (await fetchJson(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-algolia-application-id": "VTVKM5URPX",
      "x-algolia-api-key": "a0c0108d737ad5ab54a0e2da900bf040",
    },
    body: JSON.stringify({
      params: "query=&hitsPerPage=1000&filters=displayOnWeb:p",
    }),
  })) as { hits?: Array<Record<string, unknown>> } | null;

  const locations: ExtractedLocation[] = [];

  for (const hit of json?.hits || []) {
        const address = hit.storeAddress as Record<string, unknown> | undefined;
        const geo = hit._geoloc as Record<string, unknown> | undefined;
        const suburb = stringValue(address?.Suburb);
        const state = stringValue(address?.State).toUpperCase();
        const postcode = stringValue(address?.Postcode);
        const street = formatAddress(
          stringValue(address?.Line1),
          stringValue(address?.Line2),
          stringValue(address?.Line3)
        );

        if (!street || !suburb || !AU_STATES.has(state)) {
          continue;
        }

        locations.push({
          address: formatAddress(street, suburb, state, postcode),
          suburb,
          state,
          postcode,
          country: "Australia",
          latitude: numberValue(geo?.lat),
          longitude: numberValue(geo?.lng),
        });
  }

  return {
    checkedUrls: [url],
    locations: dedupeLocations(locations),
  };
}

async function discoverStockistLocations(indexUrl: string, tag: string) {
  const url = `https://stockist.co/api/v1/${tag}/locations/all`;
  const json = (await fetchJson(url)) as Array<Record<string, unknown>> | null;
  const locations: ExtractedLocation[] = [];

  for (const item of Array.isArray(json) ? json : []) {
    const country = stringValue(item.country);

    if (country && !/^(AU|Australia)$/i.test(country)) {
      continue;
    }

    const location = locationFromAddressParts({
      street: formatAddress(stringValue(item.address_line_1), stringValue(item.address_line_2)),
      suburb: stringValue(item.city, item.name),
      state: stateCode(item.state),
      postcode: stringValue(item.postal_code),
      latitude: numberValue(item.latitude),
      longitude: numberValue(item.longitude),
    });

    if (location) {
      locations.push(location);
    }
  }

  return {
    checkedUrls: [indexUrl, url],
    locations: dedupeLocations(locations),
  };
}

async function discoverTedsCameraLocations() {
  return discoverStockistLocations("https://www.teds.com.au/pages/store-locator", "map_7q5z92n3");
}

function extractDigiDirectLocations(html: string) {
  const locations: ExtractedLocation[] = [];
  const slider =
    html.match(/<div\s+class=["']slider["']\s+id=["']storeSlider["'][^>]*>([\s\S]*?)<\/div>\s*<div\s+class=["']slider-bullets["']/i)?.[1] ||
    html;
  const cardPattern = /<div\s+class=["']card["'][\s\S]*?<h4[^>]*>([\s\S]*?)<\/h4>[\s\S]*?<p[^>]*>\s*<i[^>]*><\/i>\s*([\s\S]*?)<\/p>/gi;
  let match: RegExpExecArray | null;

  while ((match = cardPattern.exec(slider))) {
    const title = normalizeText(match[1]).replace(/\s+Store$/i, "");

    if (/fulfilment|click\s*&\s*collect/i.test(title)) {
      continue;
    }

    const location = parseAustralianAddressLine(normalizeText(match[2]), title);

    if (location) {
      locations.push(location);
    }
  }

  return dedupeLocations(locations);
}

async function discoverDigiDirectLocations() {
  const url = "https://www.digidirect.com.au/store-locator-list";
  const html = await fetchHtml(url);

  return {
    checkedUrls: [url],
    locations: html ? extractDigiDirectLocations(html) : [],
  };
}

function singleLocationResult(checkedUrls: string[], parts: Parameters<typeof locationFromAddressParts>[0]) {
  const location = locationFromAddressParts(parts);

  return {
    checkedUrls,
    locations: location ? [location] : [],
  };
}

function locationsFromRows(rows: StaticLocationRow[]) {
  const locations: ExtractedLocation[] = [];

  for (const [label, street, suburb, state, postcode, sourceUrl] of rows) {
    const location = locationFromAddressParts({
      street,
      suburb,
      state,
      postcode,
    });

    if (location) {
      locations.push({ ...location, label, sourceUrl });
    }
  }

  return dedupeLocations(
    locations
  );
}

function staticLocationResult(indexUrl: string, rows: StaticLocationRow[], maxLocations: number) {
  const locations = locationsFromRows(rows).map((location) => ({
    ...location,
    sourceUrl: location.sourceUrl || `${indexUrl.replace(/\/$/, "")}#${slugify([location.suburb, location.state, location.postcode, location.address].join(" "))}`,
  }));

  return {
    checkedUrls: [indexUrl],
    locations: locations.slice(0, maxLocations),
  };
}

async function discoverDigitalCameraWarehouseLocations() {
  const url = "https://www.digitalcamerawarehouse.com.au/contact-us";

  return singleLocationResult([url], {
    street: "174 Canterbury Road",
    suburb: "Canterbury",
    state: "NSW",
    postcode: "2193",
  });
}

async function discoverDoubleBayCameraShopLocations() {
  const url = "https://www.doublebaycamerashop.com.au/contact-us/";

  return singleLocationResult([url], {
    street: "Shop 2, Roma Arcade, 413-417 New South Head Road",
    suburb: "Double Bay",
    state: "NSW",
    postcode: "2028",
  });
}

async function discoverFujifilmHouseLocations() {
  const url = "https://fujifilm-houseofphotography.com.au/pages/visit-us";

  return singleLocationResult([url], {
    street: "2 Park Street",
    suburb: "Sydney",
    state: "NSW",
    postcode: "2000",
  });
}

async function discoverGeorgesCameraLocations() {
  const url = "https://www.georges.com.au/pages/store-locator";

  return singleLocationResult([url], {
    street: "387 George Street",
    suburb: "Sydney",
    state: "NSW",
    postcode: "2000",
    latitude: -33.8695297,
    longitude: 151.2067495,
  });
}

async function discoverKodakCameraLocations() {
  return {
    checkedUrls: ["https://www.kodak.com/en/consumer/products/cameras/"],
    locations: [],
  };
}

function locationFromAddressParts(parts: {
  street: string;
  suburb: string;
  state: string;
  postcode: string;
  latitude?: number | null;
  longitude?: number | null;
}): ExtractedLocation | null {
  const state = parts.state.toUpperCase();
  const normalizedSuburb = normalizeText(parts.suburb);
  const suburb = /^[A-Z\s'-]+$/.test(normalizedSuburb) ? titleCase(normalizedSuburb) : normalizedSuburb;
  const street = normalizeText(parts.street).replace(new RegExp(`,?\\s*${suburb.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"), "");
  const rawPostcode = normalizeText(parts.postcode);
  const postcode = /^\d{3}$/.test(rawPostcode) ? rawPostcode.padStart(4, "0") : rawPostcode;

  if (!street || !suburb || !AU_STATES.has(state)) {
    return null;
  }

  return {
    address: formatAddress(street, suburb, state, postcode),
    suburb,
    state,
    postcode,
    country: "Australia",
    latitude: parts.latitude ?? null,
    longitude: parts.longitude ?? null,
  };
}

function parseAustralianAddressLine(addressLine: string, fallbackSuburb = "") {
  const text = normalizeText(addressLine).replace(/\s*,\s*/g, " ");
  const terminalMatch = text.match(new RegExp(`^(.+?)\\s+(${AU_STATE_TEXT_PATTERN})\\s+(\\d{4})$`, "i"));

  if (!terminalMatch) {
    return null;
  }

  const beforeState = terminalMatch[1].trim();
  const state = stateCode(terminalMatch[2]);
  const postcode = terminalMatch[3];
  const fallback = fallbackSuburb.replace(/\bCBD\b/i, "").trim();
  let street = "";
  let suburb = "";

  if (fallback && beforeState.toLowerCase().endsWith(fallback.toLowerCase())) {
    suburb = fallback;
    street = beforeState.slice(0, -fallback.length).trim();
  } else {
    const splitMatch = beforeState.match(/^(.+?)\s+([A-Z][A-Za-z' -]{2,45})$/);

    if (!splitMatch) {
      return null;
    }

    street = splitMatch[1];
    suburb = splitMatch[2];
  }

  return locationFromAddressParts({
    street,
    suburb,
    state,
    postcode,
  });
}

function titleCase(value: string) {
  return normalizeText(value.toLowerCase()).replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function parseCommaSeparatedAustralianAddress(addressLine: string, fallbackSuburb = "") {
  const parts = normalizeText(addressLine)
    .split(/\s*,\s*/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (/^Australia$/i.test(parts[parts.length - 1] || "")) {
    parts.pop();
  }

  const postcodePart = parts.pop() || "";
  const postcode = postcodePart.match(/\d{4}/)?.[0] || "";
  const state = stateCode(parts.pop() || "");
  const suburb = titleCase(parts.pop() || fallbackSuburb);
  const street = parts.join(", ");

  return locationFromAddressParts({
    street,
    suburb,
    state,
    postcode,
  });
}

function extractBalancedJsonArray(text: string, marker: string) {
  const markerIndex = text.indexOf(marker);

  if (markerIndex < 0) {
    return null;
  }

  const start = text.indexOf("[", markerIndex);

  if (start < 0) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const character = text[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }

    if (character === '"') {
      inString = true;
      continue;
    }

    if (character === "[") {
      depth += 1;
    } else if (character === "]") {
      depth -= 1;

      if (depth === 0) {
        return text.slice(start, index + 1);
      }
    }
  }

  return null;
}

function inferStateFromCoordinates(latitude: number | null, longitude: number | null) {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return "";
  }
  if (latitude <= -10 && latitude >= -44 && longitude >= 112 && longitude <= 130) return "WA";
  if (latitude <= -10 && latitude >= -27 && longitude > 130 && longitude <= 138) return "NT";
  if (latitude <= -26 && latitude >= -38.5 && longitude > 129 && longitude <= 141) return "SA";
  if (latitude <= -24 && latitude >= -30.5 && longitude > 141 && longitude <= 154) return "QLD";
  if (latitude <= -28 && latitude >= -37.8 && longitude > 141 && longitude <= 154) return "NSW";
  if (latitude <= -35 && latitude >= -39.5 && longitude > 140 && longitude <= 150.5) return "VIC";
  if (latitude <= -39 && latitude >= -44 && longitude > 143 && longitude <= 149) return "TAS";

  return "";
}

function attributeValue(html: string, name: string) {
  const match = html.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i"));

  return match ? normalizeText(match[1]) : "";
}

function parseInlineAddress(value: string, fallbackName = "") {
  const text = normalizeText(value)
    .replace(/\([^)]*\)\s*$/, "")
    .replace(/\b(?:Phone|Tel):.*$/i, "")
    .replace(/<br\s*\/?>.*$/i, "");
  const match = text.match(/(.+?)\s*,\s*([A-Za-z' -]+)\s*,?\s*(ACT|NSW|NT|QLD|SA|TAS|VIC|WA)\s+(\d{4})/i);

  if (!match) {
    return null;
  }

  const label = fallbackName ? fallbackName.replace(/\s*\([A-Z]{2,3}\)\s*$/i, "") : "";
  const street = match[1].replace(new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*-\\s*`, "i"), "");

  return {
    street,
    suburb: match[2],
    state: match[3],
    postcode: match[4],
  };
}

function extractDataAttributeLocations(html: string) {
  const locations: ExtractedLocation[] = [];
  const elementPattern =
    /<(a|div)\b[\s\S]{0,1200}?class\s*=\s*["'][^"']*(?:store-item|location-array)[^"']*["'][\s\S]*?<\/\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = elementPattern.exec(html))) {
    const element = match[0];
    const name = attributeValue(element, "data-name").replace(/\s*\([A-Z]{2,3}\)\s*$/i, "");
    const latitude = numberValue(attributeValue(element, "data-lat"));
    const longitude = numberValue(attributeValue(element, "data-lng"));
    const info = attributeValue(element, "data-info");
    const address1 = attributeValue(element, "data-address1");
    const dataName = attributeValue(element, "data-name");
    const stateFromName = dataName.match(/\((ACT|NSW|NT|QLD|SA|TAS|VIC|WA)\)/i)?.[1] || "";
    const parsedAddress = parseInlineAddress(info, name);
    const inferredState = inferStateFromCoordinates(latitude, longitude);
    const location = parsedAddress
      ? locationFromAddressParts({
          ...parsedAddress,
          state: inferredState || parsedAddress.state,
          latitude,
          longitude,
        })
      : locationFromAddressParts({
          street: address1,
          suburb: name,
          state: inferredState || stateFromName,
          postcode: "",
          latitude,
          longitude,
        });

    if (location) {
      locations.push(location);
    }
  }

  return dedupeLocations(locations);
}

function demandwareSuburbFromStore(item: Record<string, unknown>) {
  const city = stringValue(item.city);
  const address1Parts = stringValue(item.address1)
    .split(/\s*,\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  const lastAddressPart = address1Parts[address1Parts.length - 1] || "";
  const nameParts = stringValue(item.storeName, item.name)
    .split(/\s+-\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const lastNamePart = (nameParts[nameParts.length - 1] || "").replace(/\s+-?\s*DF$/i, "").trim();

  if (lastAddressPart && /^[A-Za-z][A-Za-z' -]+$/.test(lastAddressPart) && !/\b(?:Road|Street|St|Avenue|Ave|Lane|Ln|Drive|Dr|Centre|Center|Plaza|Terminal|Airport)\b/i.test(lastAddressPart)) {
    return titleCase(lastAddressPart);
  }

  if (lastNamePart && !/^(Westfield|Queens Plaza|QueensPlaza|DF)$/i.test(lastNamePart) && !/\b(?:Road|Street|St|Avenue|Ave|Lane|Ln|Drive|Dr)\b/i.test(lastNamePart)) {
    return titleCase(lastNamePart.replace(/^Sydney Airport$/i, "Mascot"));
  }

  return titleCase(city);
}

function demandwareStreetFromStore(item: Record<string, unknown>, suburb: string) {
  const address1 = stringValue(item.address1);
  const suburbPattern = suburb.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return normalizeText(address1)
    .replace(new RegExp(`,?\\s*${suburbPattern}\\s*,?$`, "i"), "")
    .replace(/\s*,\s*$/, "");
}

function extractDemandwareStoreLocatorLocations(html: string) {
  const storesJson =
    extractBalancedJsonArray(html, '"storesData":{"countryCode":"AU","stores"') ||
    extractBalancedJsonArray(html, '"storesData"') ||
    extractBalancedJsonArray(html, '"stores"');
  const locations: ExtractedLocation[] = [];

  if (!storesJson) {
    return locations;
  }

  try {
    const stores = JSON.parse(storesJson) as Array<Record<string, unknown>>;

    for (const store of stores) {
      if (!/^(AU|Australia)$/i.test(stringValue(store.countryCode, store.countryDesc))) {
        continue;
      }

      const suburb = demandwareSuburbFromStore(store);
      const location = locationFromAddressParts({
        street: demandwareStreetFromStore(store, suburb),
        suburb,
        state: stateCode(store.stateCode, store.addressStateCode),
        postcode: stringValue(store.postalCode, store.postalCodeDisplay),
        latitude: numberValue(store.latitude),
        longitude: numberValue(store.longitude),
      });

      if (location) {
        locations.push(location);
      }
    }
  } catch {
    return locations;
  }

  return dedupeLocations(locations);
}

function extractPeterJacksonLocations(html: string) {
  const locations: ExtractedLocation[] = [];
  const attributeMatch = html.match(/\bdata-locations=["']([\s\S]*?)["']/i);

  if (!attributeMatch) {
    return locations;
  }

  try {
    const entries = JSON.parse(decodeHtmlEntities(attributeMatch[1])) as Array<Record<string, unknown>>;

    for (const entry of entries) {
      const address = stringValue(entry.street_address);
      const state = stateCode(entry.location_state);
      const addressMatch = address.match(/^(.+?)(?:,\s*)?([A-Za-z][A-Za-z' -]+)\s+(ACT|NSW|NT|QLD|SA|TAS|VIC|WA)\s+(\d{4})$/i);
      const suburb = addressMatch?.[2] || stringValue(entry.location_name);
      const location = locationFromAddressParts({
        street: addressMatch?.[1] || address,
        suburb,
        state: addressMatch?.[3] || state,
        postcode: stringValue(addressMatch?.[4], entry.postcode),
        latitude: numberValue(entry.latitude),
        longitude: numberValue(entry.longitude),
      });

      if (location) {
        locations.push(location);
      }
    }
  } catch {
    // Ignore malformed embedded locator JSON.
  }

  return dedupeLocations(locations);
}

function extractRoddAndGunnLocations(html: string) {
  const locations: ExtractedLocation[] = [];
  const itemPattern = /<li\b[^>]*class=["'][^"']*\bstore-item\b[^"']*["'][^>]*>([\s\S]*?)<\/li>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemPattern.exec(html))) {
    const block = match[1];
    const street = formatAddress(
      normalizeText(block.match(/class=["'][^"']*\bstreet-address1\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i)?.[1] || ""),
      normalizeText(block.match(/class=["'][^"']*\bstreet-address2\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i)?.[1] || "")
    );
    const suburb = normalizeText(block.match(/class=["'][^"']*\bstreet-address-city\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i)?.[1] || "");
    const statePostcode = normalizeText(block.match(/class=["'][^"']*\bstreet-address-state\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i)?.[1] || "");
    const stateMatch = statePostcode.match(/\b(ACT|NSW|NT|QLD|SA|TAS|VIC|WA)\s+(\d{4})\b/i);
    const location = locationFromAddressParts({
      street,
      suburb,
      state: stateMatch?.[1] || "",
      postcode: stateMatch?.[2] || "",
    });

    if (location) {
      locations.push(location);
    }
  }

  return dedupeLocations(locations);
}

async function discoverHydrogenStoreLocations(indexUrl: string) {
  const html = await fetchHtml(indexUrl);

  return {
    checkedUrls: [indexUrl],
    locations: html ? extractHydrogenStoreLocations(html) : [],
  };
}

async function discoverPeterJacksonLocations() {
  const url = "https://www.peterjacksons.com/pages/stores-in-australia";
  const html = await fetchHtml(url);

  return {
    checkedUrls: [url],
    locations: html ? extractPeterJacksonLocations(html) : [],
  };
}

async function discoverRoddAndGunnLocations() {
  const url = "https://www.roddandgunn.com/au/stores";
  const html = await fetchHtml(url);

  return {
    checkedUrls: [url],
    locations: html ? extractRoddAndGunnLocations(html) : [],
  };
}

function extractQbdLocationPage(html: string) {
  const storeBlock = html.match(/<div itemprop="location"[\s\S]*?<\/div>\s*<br clear="both"/i)?.[0] || html;
  const street = normalizeText(
    storeBlock.match(/<span itemprop="streetAddress">([\s\S]*?)<\/span>/i)?.[1] || ""
  );
  const suburb = normalizeText(storeBlock.match(/<span itemprop="addressLocality">([\s\S]*?)<\/span>/i)?.[1] || "");
  const state = stateCode(storeBlock.match(/<span itemprop="addressRegion">([\s\S]*?)<\/span>/i)?.[1] || "");
  const postcode = normalizeText(storeBlock.match(/<span itemprop="postalCode">([\s\S]*?)<\/span>/i)?.[1] || "");

  return locationFromAddressParts({
    street,
    suburb,
    state,
    postcode,
    latitude: numberValue(storeBlock.match(/itemprop="latitude"\s+content="([^"]+)"/i)?.[1]),
    longitude: numberValue(storeBlock.match(/itemprop="longitude"\s+content="([^"]+)"/i)?.[1]),
  });
}

async function discoverQbdLocations(maxLocations: number) {
  const indexUrl = "https://www.qbd.com.au/locations/";
  const html = await fetchHtml(indexUrl);
  const checkedUrls = [indexUrl];
  const locations: ExtractedLocation[] = [];

  if (!html) {
    return { checkedUrls, locations };
  }

  const locationUrls = Array.from(html.matchAll(/href="(\/locations\/[^"#?]+\/)"/gi))
    .map((match) => new URL(match[1], indexUrl).toString())
    .filter((url, index, urls) => urls.indexOf(url) === index)
    .slice(0, maxLocations);

  for (const url of locationUrls) {
    const page = await fetchHtml(url);
    checkedUrls.push(url);

    if (!page) {
      continue;
    }

    const location = extractQbdLocationPage(page);

    if (location) {
      locations.push(location);
    }
  }

  return {
    checkedUrls,
    locations: dedupeLocations(locations),
  };
}

function extractUmartLocations(html: string) {
  const locations: ExtractedLocation[] = [];
  const rowPattern = /<tr\b[^>]*class=["'][^"']*store-tr[^"']*["'][^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowPattern.exec(html))) {
    const row = rowMatch[1];
    const title = normalizeText(row.match(/<strong>([\s\S]*?)<\/strong>/i)?.[1] || "");
    const paragraphs = Array.from(row.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)).map((match) =>
      normalizeText(match[1])
    );
    const addressLine = paragraphs.find((value) => /\b(ACT|NSW|NT|QLD|SA|TAS|VIC|WA)\s+\d{4}\b/.test(value));
    const addressMatch = addressLine?.match(/^(.+?)\s*,?\s*([A-Za-z' -]+)\s*,?\s*(ACT|NSW|NT|QLD|SA|TAS|VIC|WA)\s+(\d{4})$/);

    if (!addressMatch || /closed for renovation/i.test(row)) {
      continue;
    }

    const mapMatch = row.match(/!2d(-?\d+(?:\.\d+)?)!3d(-?\d+(?:\.\d+)?)/);
    const location = locationFromAddressParts({
      street: addressMatch[1],
      suburb: title || addressMatch[2],
      state: addressMatch[3],
      postcode: addressMatch[4],
      latitude: numberValue(mapMatch?.[2]),
      longitude: numberValue(mapMatch?.[1]),
    });

    if (location) {
      locations.push(location);
    }
  }

  return dedupeLocations(locations);
}

async function discoverUmartLocations() {
  const url = "https://www.umart.com.au/help/store-locations-opening-hours-928";
  const html = await fetchHtml(url);

  return {
    checkedUrls: [url],
    locations: html ? extractUmartLocations(html) : [],
  };
}

function extractCalibreStoreLinks(html: string, baseUrl: string) {
  const listingStart = html.search(/<div\s+class=["']stores-listing["']/i);
  const listingEnd =
    listingStart >= 0
      ? html.indexOf("data-header-color", listingStart)
      : -1;
  const listingBlock =
    listingStart >= 0
      ? html.slice(listingStart, listingEnd > listingStart ? listingEnd : undefined)
      : html;
  const links: Array<{ name: string; url: string }> = [];
  const seen = new Set<string>();
  const linkPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*class=["'][^"']*link-with-icon[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(listingBlock))) {
    const url = resolveUrl(match[1], baseUrl);
    const name = normalizeText(match[2]);

    if (!url || !name || seen.has(url)) {
      continue;
    }

    links.push({ name, url });
    seen.add(url);
  }

  return links;
}

function extractCalibreLocationPage(html: string, fallbackName: string) {
  const heading = normalizeText(
    html.match(/<h1\b[^>]*class=["'][^"']*image-with-text__heading[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i)?.[1] || fallbackName
  ).replace(/\bSreet\b/g, "Street");
  const locationBlock = html.match(/<h4\b[^>]*>\s*Location\s*<\/h4>[\s\S]*?<div\b[^>]*class=["'][^"']*metafield-rich_text_field[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1] || "";
  const lines = Array.from(locationBlock.matchAll(/(?:^|<br\s*\/?>)([\s\S]*?)(?=<br\s*\/?>|<\/p>|$)/gi))
    .map((match) => normalizeText(match[1]))
    .filter(Boolean);
  const terminalLine = lines[lines.length - 1] || "";
  const terminalMatch = terminalLine.match(/^(?:(.+?),\s*)?(ACT|NSW|NT|QLD|SA|TAS|VIC|WA)\s+(\d{4})$/i);

  if (!terminalMatch) {
    return null;
  }

  const state = terminalMatch[2].toUpperCase();
  const postcode = terminalMatch[3];
  const previousLine = lines[lines.length - 2] || "";
  const previousSuburbMatch = previousLine.match(/,\s*([A-Za-z][A-Za-z' -]+)$/);
  const suburb = normalizeText(terminalMatch[1] || previousSuburbMatch?.[1] || heading).replace(/\bSreet\b/g, "Street");
  const streetLines = terminalMatch[1] ? lines.slice(0, -1) : lines.slice(0, -1);
  const mapMatch = html.match(/google\.com\/maps\/place\/[^"']*?@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i);

  return locationFromAddressParts({
    street: streetLines.join(", "),
    suburb,
    state,
    postcode,
    latitude: numberValue(mapMatch?.[1]),
    longitude: numberValue(mapMatch?.[2]),
  });
}

async function discoverCalibreLocations(maxLocations: number) {
  const indexUrl = "https://calibre.com.au/pages/stores";
  const html = await fetchHtml(indexUrl);
  const checkedUrls = [indexUrl];
  const locations: ExtractedLocation[] = [];

  if (!html) {
    return { checkedUrls, locations };
  }

  const links = extractCalibreStoreLinks(html, indexUrl).slice(0, maxLocations);

  for (const link of links) {
    const page = await fetchHtml(link.url);
    checkedUrls.push(link.url);

    if (!page) {
      continue;
    }

    const location = extractCalibreLocationPage(page, link.name);

    if (location) {
      locations.push(location);
    }
  }

  return {
    checkedUrls,
    locations: dedupeLocations(locations),
  };
}

async function discoverDavidLawrenceLocations(maxLocations: number) {
  const indexUrl = "https://www.davidlawrence.com.au/stores";
  const graphqlUrl = "https://www.davidlawrence.com.au/graphql";
  const checkedUrls = [indexUrl, graphqlUrl];
  const json = (await fetchJson(graphqlUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query: `
        query stores($search: String!, $pageSize: Int!, $currentPage: Int!) {
          stores(search: $search, pageSize: $pageSize, currentPage: $currentPage) {
            items {
              city
              country
              latitude
              longitude
              name
              phone_number
              postcode
              state
              street
              url_key
            }
          }
        }
      `,
      variables: {
        search: "",
        pageSize: Math.max(maxLocations, 100),
        currentPage: 1,
      },
    }),
  })) as { data?: { stores?: { items?: Array<Record<string, unknown>> } } } | null;
  const locations: ExtractedLocation[] = [];

  for (const item of json?.data?.stores?.items || []) {
    const country = stringValue(item.country);

    if (country && !/^(AU|Australia)$/i.test(country)) {
      continue;
    }

    const location = locationFromAddressParts({
      street: stringValue(item.street),
      suburb: stringValue(item.city, item.name),
      state: stateCode(item.state),
      postcode: stringValue(item.postcode),
      latitude: numberValue(item.latitude),
      longitude: numberValue(item.longitude),
    });

    if (location) {
      locations.push(location);
    }
  }

  return {
    checkedUrls,
    locations: dedupeLocations(locations),
  };
}

const SABA_STORE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["DONCASTER", "Level 1, Shop 1068 Westfield Doncaster, 619 Doncaster Road", "Doncaster", "VIC", "3108"],
  ["CHADSTONE", "Ground Floor, Shop 328 Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["DAVID JONES CHERMSIDE (WOMENS)", "Westfield Chermside, Gympie Road", "Chermside", "QLD", "4032"],
  ["DAVID JONES CHERMSIDE (MENS)", "Westfield Chermside, Gympie Road", "Chermside", "QLD", "4032"],
  ["DAVID JONES KARRINYUP (WOMENS)", "Karrinyup Shopping Centre, 200 Karrinyup Road", "Karrinyup", "WA", "6018"],
  ["DAVID JONES KARRINYUP (MENS)", "Karrinyup Shopping Centre, 200 Karrinyup Road", "Karrinyup", "WA", "6018"],
  ["DAVID JONES CLAREMONT (WOMENS)", "Claremont Quarter, Bay View Terrace", "Claremont", "WA", "6010"],
  ["DAVID JONES CLAREMONT (MENS)", "Claremont Quarter, Bay View Terrace", "Claremont", "WA", "6010"],
  ["KARRINYUP", "Shop 1206, 200 Karrinyup Road", "Karrinyup", "WA", "6018"],
  ["DAVID JONES ELIZABETH STREET (WOMENS)", "Level 3, 86-108 Castlereagh Street", "Sydney", "NSW", "2000"],
  ["DAVID JONES ELIZABETH STREET (MENS)", "Level 6, 86-108 Castlereagh Street", "Sydney", "NSW", "2000"],
  ["QUEEN VICTORIA BUILDING", "Shop 5-9, Queen Victoria Building, 455 George Street", "Sydney", "NSW", "2000"],
  ["DAVID JONES BOURKE STREET (WOMENS)", "Bourke Street Mall, 310 Bourke Street", "Melbourne", "VIC", "3000"],
  ["DAVID JONES BOURKE STREET (MEN)", "Bourke Street Mall, 310 Bourke Street", "Melbourne", "VIC", "3000"],
  ["MELBOURNE EMPORIUM", "Level 2, Shop 2-019 Melbourne Emporium, 295 Lonsdale Street", "Melbourne", "VIC", "3000"],
  ["INDOOROOPILLY (WOMENS)", "Shop 2114, Indooroopilly Shopping Centre, 322 Moggill Road", "Indooroopilly", "QLD", "4068"],
  ["CHERMSIDE", "Level 1, Shop 323, Westfield Chermside, Corner Gympie Road & Hamilton Road", "Chermside", "QLD", "4032"],
  ["JAMES STREET BRISBANE", "Shop 4C, 39 James Street", "Fortitude Valley", "QLD", "4006"],
  ["RUNDLE STREET", "241-243 Rundle Street", "Adelaide", "SA", "5000"],
  ["BURNSIDE (WOMENS)", "Ground Floor, Shop 126 Burnside Village, 447 Portrush Road", "Glenside", "SA", "5065"],
  ["DAVID JONES HAY STREET MALL (WOMENS)", "Hay Street Mall, 622 Hay Street", "Perth", "WA", "6000"],
  ["DAVID JONES HAY STREET MALL (MENS)", "Hay Street Mall, 622 Hay Street", "Perth", "WA", "6000"],
  ["CLAREMONT", "Level 1, Shop 100-101, Claremont Quarter, 9 Bay View Terrace", "Claremont", "WA", "6010"],
  ["DAVID JONES CANBERRA (WOMENS)", "Canberra Centre, 260-262 Alinga Street", "Canberra City", "ACT", "2600"],
  ["DAVID JONES CANBERRA (MENS)", "Canberra Centre, 260-262 Alinga Street", "Canberra City", "ACT", "2600"],
  ["DAVID JONES WODEN (WOMENS)", "Westfield Woden, Bradley Street", "Phillip", "ACT", "2606"],
  ["DAVID JONES WODEN (MEN)", "Westfield Woden, Bradley Street", "Phillip", "ACT", "2606"],
  ["DAVID JONES PARRAMATTA (WOMENS)", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2124"],
  ["DAVID JONES PARRAMATTA (MENS)", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["DAVID JONES MIRANDA (WOMENS)", "Westfield Miranda, 600 The Kingsway", "Miranda", "NSW", "2228"],
  ["DAVID JONES MIRANDA (MENS)", "Westfield Miranda, 600 The Kingsway", "Miranda", "NSW", "2228"],
  ["DAVID JONES CHATSWOOD (WOMENS)", "Chatswood Chase, 91 Archer Street", "Chatswood", "NSW", "2067"],
  ["DAVID JONES CHATSWOOD (MENS)", "Chatswood Chase, 91 Archer Street", "Chatswood", "NSW", "2067"],
  ["DAVID JONES WARRINGAH MALL (WOMENS)", "Westfield Warringah Mall, Old Pittwater Road", "Brookvale", "NSW", "2100"],
  ["DAVID JONES WARRINGAH MALL (MENS)", "Westfield Warringah Mall, Old Pittwater Road", "Brookvale", "NSW", "2100"],
  ["DAVID JONES BONDI (WOMENS)", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["DAVID JONES BONDI (MENS)", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["DAVID JONES KOTARA (WOMENS)", "Westfield Kotara, Corner Northcott Drive & Park Avenue", "Kotara", "NSW", "2289"],
  ["DAVID JONES KOTARA (MENS)", "Westfield Kotara, Corner Northcott Drive & Park Avenue", "Kotara", "NSW", "2289"],
  ["DAVID JONES TUGGERAH (WOMENS)", "Westfield Tuggerah, 50 Wyong Road", "Tuggerah", "NSW", "2259"],
  ["DAVID JONES HORNSBY (WOMENS)", "Westfield Hornsby, 236 Pacific Highway", "Hornsby", "NSW", "2077"],
  ["DAVID JONES HORNSBY (MENS)", "Westfield Hornsby, 236 Pacific Highway", "Hornsby", "NSW", "2077"],
  ["DAVID JONES WOLLONGONG (WOMENS)", "Wollongong Central Shopping Centre, 200 Crown Street", "Wollongong", "NSW", "2500"],
  ["DAVID JONES BURWOOD (WOMENS)", "Westfield Burwood, 100 Burwood Road", "Burwood", "NSW", "2560"],
  ["DAVID JONES BURWOOD (MENS)", "Westfield Burwood, 100 Burwood Road", "Burwood", "NSW", "2560"],
  ["DAVID JONES MACQUARIE (WOMENS)", "Macquarie Shopping Centre, Corner Herring & Waterloo Roads", "North Ryde", "NSW", "2113"],
  ["DAVID JONES MACQUARIE (MENS)", "Macquarie Shopping Centre, Corner Herring & Waterloo Roads", "North Ryde", "NSW", "2113"],
  ["DAVID JONES GREEN HILLS (WOMEN)", "Stockland Green Hills, 1 Molly Morgan Dr", "East Maitland", "NSW", "2323"],
  ["DAVID JONES GREEN HILLS (MENS)", "Stockland Green Hills, 1 Molly Morgan Dr", "East Maitland", "NSW", "2323"],
  ["MIRANDA", "Level 2, Shop 2178, Westfield Miranda, 600 The Kingsway", "Miranda", "NSW", "2228"],
  ["CHATSWOOD", "Level 5, Shop 530/3, Westfield Chatswood, 28 Victor Street", "Chatswood", "NSW", "2067"],
  ["BONDI", "Shop 2059, 10 Westfield Bondi, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["DAVID JONES GLEN WAVERLEY (WOMENS)", "The Glen, 235 Springvale Road", "Glen Waverley", "VIC", "3150"],
  ["DAVID JONES GLEN WAVERLEY (MENS)", "The Glen, 235 Springvale Road", "Glen Waverley", "VIC", "3150"],
  ["DAVID JONES CHADSTONE (WOMENS)", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["DAVID JONES CHADSTONE (MENS)", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["DAVID JONES DONCASTER (WOMENS)", "Westfield Doncaster, 619 Doncaster Road", "Doncaster", "VIC", "3108"],
  ["DAVID JONES DONCASTER (MENS)", "Westfield Doncaster, 619 Doncaster Road", "Doncaster", "VIC", "3108"],
  ["DAVID JONES HIGHPOINT (WOMENS)", "Highpoint Shopping Centre, 120-200 Rosamond Road", "Maribyrnong", "VIC", "3032"],
  ["DAVID JONES HIGHPOINT (MENS)", "Highpoint Shopping Centre, 120-200 Rosamond Road", "Maribyrnong", "VIC", "3032"],
  ["DAVID JONES MALVERN (WOMENS)", "Malvern Central, 110-122 Wattletree Road", "Malvern", "VIC", "3144"],
  ["DAVID JONES MALVERN (MENS)", "Malvern Central, 110-122 Wattletree Road", "Malvern", "VIC", "3144"],
  ["BRIGHTON (WOMENS)", "38 Church Street", "Brighton", "VIC", "3186"],
  ["DAVID JONES CARINDALE (WOMENS)", "Westfield Carindale, 1151 Creek Road", "Carindale", "QLD", "4152"],
  ["DAVID JONES CARINDALE (MENS)", "Westfield Carindale, 1151 Creek Road", "Carindale", "QLD", "4152"],
  ["DAVID JONES QUEENS PLAZA (WOMENS)", "Queens Plaza, 226 Queen Street", "Brisbane", "QLD", "4000"],
  ["DAVID JONES QUEENS PLAZA (MENS)", "Queens Plaza, 194 Queen Street", "Brisbane", "QLD", "4000"],
  ["DAVID JONES ROBINA (WOMENS)", "Robina Town Centre, 19 Robina Town Centre Drive", "Robina", "QLD", "4230"],
  ["DAVID JONES ROBINA (MENS)", "Robina Town Centre, 19 Robina Town Centre Drive", "Robina", "QLD", "4230"],
  ["DAVID JONES INDOOROOPILLY (WOMENS)", "Indooroopilly Shopping Centre, 322 Moggill Road", "Indooroopilly", "QLD", "4068"],
  ["DAVID JONES INDOOROOPILLY (MENS)", "Indooroopilly Shopping Centre, 322 Moggill Road", "Indooroopilly", "QLD", "4068"],
  ["DAVID JONES PACIFIC FAIR (WOMENS)", "Pacific Fair Shopping Centre, Hooker Boulevard", "Broadbeach", "QLD", "4218"],
  ["DAVID JONES PACIFIC FAIR (MENS)", "Pacific Fair Shopping Centre, Hooker Boulevard", "Broadbeach", "QLD", "4218"],
  ["DAVID JONES SUNSHINE PLAZA (WOMENS)", "Sunshine Plaza, 154-164 Horton Parade", "Maroochydore", "QLD", "4558"],
  ["DAVID JONES SUNSHINE PLAZA (MENS)", "Sunshine Plaza, 154-164 Horton Parade", "Maroochydore", "QLD", "4558"],
  ["DAVID JONES RUNDLE MALL (WOMENS)", "Adelaide Central Plaza, 100 Rundle Mall", "Adelaide", "SA", "5000"],
  ["DAVID JONES RUNDLE MALL (MENS)", "Adelaide Central Plaza, 100 Rundle Mall", "Adelaide", "SA", "5000"],
  ["DAVID JONES MARION (WOMENS)", "Westfield Marion, 279 Diagonal Road", "Oaklands Park", "SA", "5046"],
  ["DAVID JONES MARION (MENS)", "Westfield Marion, 297 Diagonal Road", "Oaklands Park", "SA", "5046"],
  ["DAVID JONES WEST LAKES (WOMENS)", "Westfield West Lakes, 111 West Lakes Boulevard", "West Lakes", "SA", "5021"],
  ["DAVID JONES WEST LAKES (MENS)", "Westfield West Lakes, 111 West Lakes Boulevard", "West Lakes", "SA", "5021"],
  ["DAVID JONES MANDURAH (MENS)", "330 Pinjarra Road", "Mandurah", "WA", "6210"],
  ["DAVID JONES CAROUSEL (WOMENS)", "Westfield Carousel, 1382 Albany Highway", "Cannington", "WA", "6107"],
  ["DAVID JONES CAROUSEL (MENS)", "Westfield Carousel, 1382 Albany Highway", "Cannington", "WA", "6107"],
  ["DAVID JONES GARDEN CITY (WOMENS)", "Westfield Booragoon, 125 Riseley Street", "Booragoon", "WA", "6154"],
  ["DAVID JONES GARDEN CITY (MENS)", "Westfield Booragoon, 125 Riseley Street", "Booragoon", "WA", "6154"],
  ["DAVID JONES CAMPBELLTOWN (WOMENS)", "Macarthur Square, 200 Gilchrist Drive", "Campbelltown", "NSW", "2560"],
  ["DAVID JONES CAMPBELLTOWN (MENS)", "Macarthur Square, 200 Gilchrist Drive", "Campbelltown", "NSW", "2560"],
  ["DAVID JONES SOUTHLAND (WOMENS)", "Westfield Southland, 1239 Nepean Highway", "Cheltenham", "VIC", "3192"],
  ["CANBERRA CIVIC", "Level 1, Shop CF17, Canberra Centre, 148 Bunda Street", "Canberra City", "ACT", "2601"],
  ["BIRKENHEAD POINT", "Shop s210 Birkenhead Point, Level 1/19 Roseby Street", "Drummoyne", "NSW", "2047"],
  ["MOSMAN (WOMENS)", "Shop G10, 260/583 Military Road", "Mosman", "NSW", "2088"],
  ["COLLINS ARCADE", "Shop G10, 260 Collins Street", "Melbourne", "VIC", "3000"],
];

async function discoverSabaLocations(maxLocations: number) {
  const indexUrl = "https://www.saba.com.au/store-locator";
  const locations = SABA_STORE_LOCATIONS
    .filter(([name, street]) => !/temporarily closed|closed/i.test(`${name} ${street}`))
    .map(([, street, suburb, state, postcode]) =>
      locationFromAddressParts({
        street,
        suburb,
        state,
        postcode,
      })
    )
    .filter((location): location is ExtractedLocation => Boolean(location));

  return {
    checkedUrls: [indexUrl],
    locations: dedupeLocations(locations).slice(0, maxLocations),
  };
}

const SPORTSCRAFT_STORE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["ALBURY (WOMENS, MENS)", "Shop 20/22 Myer Centrepoint, 525 David Street", "Albury", "NSW", "2640"],
  ["BALLARAT (WOMENS, MENS)", "Central Square Shopping Centre, 1/315-317 Sturt Street", "Ballarat", "VIC", "3350"],
  ["BOWRAL (WOMENS, MENS)", "305 Bong Bong Street", "Bowral", "NSW", "2576"],
  ["BRIGHTON (WOMENS)", "17 Church Street", "Brighton", "VIC", "3186"],
  ["BURNSIDE (WOMENS)", "Shop T121 - Burnside Village, 447 Portrush Rd", "Glenside", "SA", "5065"],
  ["CAMBERWELL (WOMENS, MENS)", "Shop 1, Camberwell Shopping Precinct, 574-576 Burke Road", "Camberwell", "VIC", "3124"],
  ["CANBERRA (WOMENS, MENS)", "Canberra Centre, Bunda Street", "Civic Square", "ACT", "2601"],
  ["CARINDALE (WOMENS, MENS)", "Shop 1078, Westfield Carindale, 1151 Creek Road", "Carindale", "QLD", "4152"],
  ["CASTLE TOWERS (WOMENS, MENS)", "Shop T10, Castle Towers Shopping Centre, 6-14 Old Castle Hill Road", "Castle Hill", "NSW", "2154"],
  ["CHATSWOOD (WOMENS, MENS)", "Shop 513/514, Westfield Chatswood, 28 Victor Street", "Chatswood", "NSW", "2067"],
  ["CHERMSIDE (WOMENS, MENS)", "Shop 2651, Level 2, Westfiled Chermside, Gympie Rd", "Chermside", "QLD", "4032"],
  ["CLAREMONT (WOMENS, MENS)", "Shop 204-205, Claremont Quarter, Cnr St Quentin Avenue & Bayview Terrace", "Claremont", "WA", "6010"],
  ["COFFS HARBOUR (WOMENS, MENS)", "Coffs Central, 35 - 61 Harbour Drive", "Coffs Harbour", "NSW", "2450"],
  ["DAVID JONES ADELAIDE (MENS)", "Adelaide Central Plaza, 100 Rundle Mall", "Adelaide", "SA", "5000"],
  ["DAVID JONES ADELAIDE (WOMENS)", "Adelaide Central Plaza, 100 Rundle Mall", "Adelaide", "SA", "5000"],
  ["DAVID JONES BONDI (MENS)", "Westfield Bondi Junction, 500 Oxford Street", "Bondi", "NSW", "2022"],
  ["DAVID JONES BONDI (WOMENS)", "Westfield Bondi Junction, 500 Oxford Street", "Bondi", "NSW", "2022"],
  ["DAVID JONES BRISBANE (MENS)", "194 Queen Street", "Brisbane", "QLD", "4000"],
  ["DAVID JONES BRISBANE (WOMENS)", "194 Queen Street", "Brisbane", "QLD", "4000"],
  ["DAVID JONES BROOKVALE (MENS)", "Westfield Warringah Mall, Old Pittwater Road", "Brookvale", "NSW", "2100"],
  ["DAVID JONES BROOKVALE (WOMENS)", "Westfield Warringah Mall, Old Pittwater Road", "Brookvale", "NSW", "2100"],
  ["DAVID JONES BURWOOD (MENS)", "Shop 215, Westfield Burwood, 100 Burwood Road", "Burwood", "NSW", "2134"],
  ["DAVID JONES BURWOOD (WOMENS)", "Shop 215, Westfield Burwood, 100 Burwood Road", "Burwood", "NSW", "2134"],
  ["DAVID JONES MACARTHUR SQUARE (MENS)", "Macarthur Square, 200 Gilchrist Drive", "Campbelltown", "NSW", "2560"],
  ["DAVID JONES MACARTHUR SQUARE (WOMENS)", "Macarthur Square, 200 Gilchrist Drive", "Campbelltown", "NSW", "2560"],
  ["DAVID JONES CARINDALE (MENS)", "Shop 1078 Westfield Carindale, 1151 Creek Road", "Carindale", "QLD", "4152"],
  ["DAVID JONES CARINDALE (WOMENS)", "Shop 1078 Westfield Carindale, 1151 Creek Road", "Carindale", "QLD", "4152"],
  ["DAVID JONES CAROUSEL (MENS)", "Westfield Shopping Centre, 1382 Albany Highway", "Cannington", "WA", "6107"],
  ["DAVID JONES CAROUSEL (WOMENS)", "Westfield Shopping Centre, 1382 Albany Highway", "Cannington", "WA", "6107"],
  ["DAVID JONES CHADSTONE (MENS)", "Chadstone Shopping Centre, Dock 1 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["DAVID JONES CHADSTONE (WOMENS)", "Chadstone Shopping Centre, Dock 1 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["DAVID JONES CHERMSIDE (MENS)", "Westfield Chermside, Gympie Road", "Chermside", "QLD", "4032"],
  ["DAVID JONES CHERMSIDE (WOMENS)", "Westfield Chermside, Gympie Road", "Chermside", "QLD", "4032"],
  ["DAVID JONES CANBERRA CENTRE (MENS)", "Canberra Centre, 260-262 Alinga Street", "Civic Square", "ACT", "2600"],
  ["DAVID JONES CANBERRA CENTRE (WOMENS)", "Canberra Centre, 260-262 Alinga Street", "Civic Square", "ACT", "2600"],
  ["DAVID JONES CLAREMONT (MENS)", "Claremont Quarter, Cnr St Quentin Avenue & Bayview Tce", "Claremont", "WA", "6010"],
  ["DAVID JONES CLAREMONT (WOMENS)", "Claremont Quarter, Cnr St Quentin Avenue & Bayview Tce", "Claremont", "WA", "6010"],
  ["DAVID JONES DONCASTER (MENS)", "Westfield Doncaster, 619 Doncaster Road", "Doncaster", "VIC", "3108"],
  ["DAVID JONES DONCASTER (WOMENS)", "Westfield Doncaster, 619 Doncaster Road", "Doncaster", "VIC", "3108"],
  ["DAVID JONES EASTLAND (MENS)", "Eastland Shopping Centre, 175 Maroondah Highway", "Ringwood", "VIC", "3134"],
  ["DAVID JONES EASTLAND (WOMENS)", "Eastland Shopping Centre, 175 Maroondah Highway", "Ringwood", "VIC", "3134"],
  ["DAVID JONES GARDEN CITY (MENS)", "Garden City Shopping Centre, Riseley Street", "Booragoon", "WA", "6154"],
  ["DAVID JONES GARDEN CITY (WOMENS)", "Garden City Shopping Centre, Riseley Street", "Booragoon", "WA", "6154"],
  ["DAVID JONES GREEN HILLS (MENS)", "Stockland Green Hills, 1 Molly Morgan Drive", "East Maitland", "NSW", "2323"],
  ["DAVID JONES GREEN HILLS (WOMENS)", "Stockland Green Hills, 1 Molly Morgan Drive", "East Maitland", "NSW", "2323"],
  ["DAVID JONES HIGHPOINT (MENS)", "Highpoint Shopping Centre, 120-200 Rosamond Rd", "Maribyrnong", "VIC", "3032"],
  ["DAVID JONES HIGHPOINT (WOMENS)", "Highpoint Shopping Centre, 120-200 Rosamond Rd", "Maribyrnong", "VIC", "3032"],
  ["DAVID JONES HORNSBY (MENS)", "Westfield Hornsby, 236 Pacific Highway", "Hornsby", "NSW", "2077"],
  ["DAVID JONES HORNSBY (WOMENS)", "Westfield Hornsby, 236 Pacific Highway", "Hornsby", "NSW", "2077"],
  ["DAVID JONES INDOOROOPILLY (MENS)", "Indooroopilly Shopping Centre, 322 Moggill Road", "Indooroopilly", "QLD", "4068"],
  ["DAVID JONES INDOOROOPILLY (WOMENS)", "Indooroopilly Shopping Centre, 322 Moggill Road", "Indooroopilly", "QLD", "4068"],
  ["DAVID JONES KARRINYUP (MENS)", "Karrinyup Shopping Centre, 200 Karrinyup Road", "Karrinyup", "WA", "6018"],
  ["DAVID JONES KARRINYUP (WOMENS)", "Karrinyup Shopping Centre, 200 Karrinyup Road", "Karrinyup", "WA", "6018"],
  ["DAVID JONES KOTARA (MENS)", "Westfield Kotara, Tenancy 2104 Cnr Park Avenue and, Northcott Dr", "Kotara", "NSW", "2289"],
  ["DAVID JONES KOTARA (WOMENS)", "Westfield Kotara, Tenancy 2104 Cnr Park Avenue and, Northcott Dr", "Kotara", "NSW", "2289"],
  ["DAVID JONES MACQUARIE (MENS)", "Macquarie Shopping Centre, Lev 2 Shp 37 Cnr Herring &, Waterloo Rd", "North Ryde", "NSW", "2113"],
  ["DAVID JONES MACQUARIE (WOMENS)", "Macquarie Shopping Centre, Lev 2 Shp 37 Cnr Herring &, Waterloo Rd", "North Ryde", "NSW", "2113"],
  ["DAVID JONES MALVERN (MENS)", "Malvern Central, 110-122 Wattletree Road", "Malvern", "VIC", "3144"],
  ["DAVID JONES MALVERN (WOMENS)", "Malvern Central, 110-122 Wattletree Road", "Malvern", "VIC", "3144"],
  ["DAVID JONES MANDURAH (MENS)", "Mandurah Forum, 330 Pinjarra Road", "Mandurah", "WA", "6210"],
  ["DAVID JONES MANDURAH (WOMENS)", "Mandurah Forum, 330 Pinjarra Road", "Mandurah", "WA", "6210"],
  ["DAVID JONES MARION (MENS)", "Westfield Marion, 297 Diagonal Road", "Oaklands Park", "SA", "5046"],
  ["DAVID JONES MARION (WOMENS)", "Westfield Marion, 297 Diagonal Road", "Oaklands Park", "SA", "5046"],
  ["DAVID JONES MELBOURNE (MENS)", "Bourke Street Mall, 310 Bourke Street", "Melbourne", "VIC", "3000"],
  ["DAVID JONES MELBOURNE (WOMENS)", "Bourke Street Mall, 310 Bourke Street", "Melbourne", "VIC", "3000"],
  ["DAVID JONES MIRANDA (MENS)", "Westfield Miranda, Lev 2, Shp 2155/600 The Kingsway", "Miranda", "NSW", "2228"],
  ["DAVID JONES MIRANDA (WOMENS)", "Westfield Miranda, Lev 2, Shp 2155/600 The Kingsway", "Miranda", "NSW", "2228"],
  ["DAVID JONES PACIFIC FAIR (MENS)", "Shop 1517A Pacific Fair Shopping Centre, 30/2 Hooker Boulevarde", "Broadbeach", "QLD", "4218"],
  ["DAVID JONES PACIFIC FAIR (WOMENS)", "Shop 1517A Pacific Fair Shopping Centre, 30/2 Hooker Boulevarde", "Broadbeach", "QLD", "4218"],
  ["DAVID JONES PARRAMATTA (MENS)", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["DAVID JONES PARRAMATTA (WOMENS)", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["DAVID JONES PERTH (MENS)", "622 Hay Street", "Perth", "WA", "6000"],
  ["DAVID JONES PERTH (WOMENS)", "622 Hay Street", "Perth", "WA", "6000"],
  ["DAVID JONES ROBINA (MENS)", "Robina Town Centre, Robina Town Centre Drive", "Robina", "QLD", "4230"],
  ["DAVID JONES ROBINA (WOMENS)", "Robina Town Centre, Robina Town Centre Drive", "Robina", "QLD", "4230"],
  ["DAVID JONES SOUTHLAND (MENS)", "Westfield Southland, 1239 Nepean Highway", "Cheltenham", "VIC", "3192"],
  ["DAVID JONES SOUTHLAND (WOMENS)", "Westfield Southland, 1239 Nepean Highway", "Cheltenham", "VIC", "3192"],
  ["DAVID JONES SUNSHINE PLAZA (MENS)", "Sunshine Plaza, 154 Horton Parade", "Maroochydore", "QLD", "4558"],
  ["DAVID JONES SUNSHINE PLAZA (WOMENS)", "Sunshine Plaza", "Maroochydore", "QLD", "4558"],
  ["DAVID JONES SYDNEY (MENS)", "Westfield Sydney, 65/77 Castlereagh Street", "Sydney", "NSW", "2000"],
  ["DAVID JONES SYDNEY (WOMENS)", "Westfield Sydney, 86/108 Castlereagh Street", "Sydney", "NSW", "2000"],
  ["DAVID JONES THE GLEN (MENS)", "The Glen, Cnr Sneddon & High St", "Glen Waverley", "VIC", "3150"],
  ["DAVID JONES THE GLEN (WOMENS)", "The Glen, Cnr Sneddon & High St", "Glen Waverley", "VIC", "3150"],
  ["DAVID JONES TUGGERAH (MENS)", "Westfield Tuggerah, 50 Wyong Road", "Tuggerah", "NSW", "2259"],
  ["DAVID JONES TUGGERAH (WOMENS)", "Westfield Tuggerah, 50 Wyong Road", "Tuggerah", "NSW", "2259"],
  ["DAVID JONES WESTLAKES (MENS)", "Westfield West Lakes, 111 Westlakes Boulevard", "West Lakes", "SA", "5021"],
  ["DAVID JONES WESTLAKES (WOMENS)", "Westfield West Lakes, 111 Westlakes Boulevard", "West Lakes", "SA", "5021"],
  ["DAVID JONES WODEN (MENS)", "Westfield Woden, Shop G56/57 Keltie St", "Woden", "ACT", "2600"],
  ["DAVID JONES WODEN (WOMENS)", "Westfield Woden, Shop G56/57 Keltie St", "Woden", "ACT", "2606"],
  ["DAVID JONES WOLLONGONG (MENS)", "Wollongong Central Shopping Centre, 169 Crown Street", "Wollongong", "NSW", "2500"],
  ["DAVID JONES WOLLONGONG (WOMENS)", "Wollongong Central Shopping Centre, 169 Crown Street", "Wollongong", "NSW", "2500"],
  ["DUBBO (WOMENS, MENS)", "Shop 2/188 Macquarie Street", "Dubbo", "NSW", "2830"],
  ["EASTGARDENS (WOMENS, MENS)", "Shop 137, Westfield East Gardens, 152 Bunnerong Road", "Eastgardens", "NSW", "2036"],
  ["GEELONG (WOMENS, MENS)", "Shop 11, Westfield Shopping Centre, 95 Malop Street", "Geelong", "VIC", "3220"],
  ["HOBART ICON (WOMENS, MENS)", "Shop G2, Icon Complex, 55 - 59 Murray Street", "Hobart", "TAS", "7000"],
  ["INDOOROOPILLY (WOMENS, MENS)", "Shop 2081, Level 2, Indooroopilly Shopping Centre, 322 Moggill Road", "Indooroopilly", "QLD", "4068"],
  ["KARRINYUP (WOMENS, MENS)", "Shop 1270, Karrinyup Centre, 200 Karrinyup Road", "Karrinyup", "WA", "6018"],
  ["KOTARA (WOMENS, MENS)", "Level 2, Westfield Kotara, Tenancy 2104 Corner Park Avenue & Northcott Drive", "Kotara", "NSW", "2289"],
  ["MACQUARIE (WOMENS)", "Shop SP2235, Macquarie Shopping Centre, Herring Road", "North Ryde", "NSW", "2113"],
  ["MELBOURNE EMPORIUM (WOMENS, MENS)", "Shop 2-004, Melbourne Emporium, 295 Lonsdale Street", "Melbourne", "VIC", "3000"],
  ["MIRANDA (WOMENS, MENS)", "Level 2, Shop 2155, Miranda Westfield, 600 The Kingsway", "Miranda", "NSW", "2228"],
  ["MOONEE PONDS (WOMENS, MENS)", "63 Puckle St", "Moonee Ponds", "VIC", "3039"],
  ["MOSMAN (WOMENS)", "858 Military Road", "Mosman", "NSW", "2088"],
  ["NORWOOD (WOMENS, MENS)", "137 The Parade", "Norwood", "SA", "5067"],
  ["ORANGE (WOMENS)", "Shop NS2, Orange City Centre, 190 Anson Street", "Orange", "NSW", "2800"],
  ["PORT MACQUARIE (WOMENS)", "91 Horton Street", "Port Macquarie", "NSW", "2444"],
  ["QUEEN VICTORIA BUILDING (WOMENS)", "Shop 15g, 455 George Street", "Sydney", "NSW", "2000"],
  ["RUNDLE MALL (WOMENS, MENS)", "53 Rundle Mall", "Adelaide", "SA", "5000"],
  ["SOUTHLAND (WOMENS)", "Shop 2012, Westfield Southland, 1239 Nepean Highway", "Cheltenham", "VIC", "3192"],
  ["ST IVES (WOMENS, MENS)", "Shop 82, St Ives Shopping Village, 166 Mona Vale Road", "St Ives", "NSW", "2075"],
  ["SUNSHINE PLAZA (WOMENS, MENS)", "Sunshine Plaza, 154 Horton Parade", "Maroochydore", "QLD", "4558"],
  ["TAMWORTH (WOMENS, MENS)", "Shop 3 & 4, Centrepoint Tamworth, 374 Peel Street", "Tamworth", "NSW", "2340"],
  ["TOOWOOMBA (WOMENS, MENS)", "Shop 1066/7, Grand Central Shopping Center, Dent and Margaret Streets", "Toowoomba", "QLD", "4350"],
  ["TOWNSVILLE (WOMENS, MENS)", "Shop T015, Castletown Shopping Centre, Woolcock Street and Kings Rd", "Hyde Park", "QLD", "4812"],
  ["WAGGA WAGGA (WOMENS, MENS)", "102 Bayliss Street", "Wagga Wagga", "NSW", "2650"],
  ["WODEN (WOMENS)", "Shop G56/57, Westfield Woden, 57 Keltie Street", "Woden", "ACT", "2606"],
  ["BALMAIN (WOMENS, MENS)", "Shop 1 & 2/359 Darling St", "Balmain", "NSW", "2041"],
  ["WILLIAMSTOWN (WOMENS, MENS)", "55/57 Ferguson St", "Williamstown", "VIC", "3016"],
  ["MOUNT GRAVATT (WOMENS, MENS)", "Shop 2322, Westfield Mt Gravatt, Cnr Logan & Kessell Rd", "Mt Gravatt", "QLD", "4122"],
  ["BALGOWLAH (WOMENS, MENS)", "Shop 006, Stockland Balgowlah, 197-215 Condamine St", "Balgowlah", "NSW", "2093"],
  ["NORTHBRIDGE (WOMENS, MENS)", "Shop 16 and 16B, Northbridge Plaza, 79-113 Sailors Bay Rd", "Northbridge", "NSW", "2063"],
  ["ROSE BAY (WOMENS, MENS)", "684 New South Head Road", "Rose Bay", "NSW", "2029"],
  ["MORNINGTON (WOMENS, MENS)", "Shop 2, 117/113 Main St", "Mornington", "VIC", "3931"],
  ["DOUBLE BAY (WOMENS, MENS)", "13 Knox Street", "Double Bay", "NSW", "2028"],
  ["DONCASTER", "G091, 619 Doncaster Rd", "Doncaster", "VIC", "3108"],
  ["MYER ADELAIDE", "22 Rundle Mall", "Adelaide", "SA", "5000"],
  ["MYER ADELAIDE (MENS)", "22 Rundle Mall", "Adelaide", "SA", "5000"],
  ["MYER ALBURY (WOMENS)", "525 David St", "Albury", "NSW", "2640"],
  ["MYER ALBURY (MENS)", "525 David St", "Albury", "NSW", "2640"],
  ["MYER CAIRNS (WOMENS)", "Cnr Mcleod & Spence St", "Cairns", "QLD", "4870"],
  ["MYER CAIRNS (MENS)", "Cnr Mcleod & Spence St", "Cairns", "QLD", "4870"],
  ["MYER CARINDALE (WOMENS)", "1151 Creek Rd", "Carina", "QLD", "4152"],
  ["MYER CARINDALE (MENS)", "1151 Creek Rd", "Carina", "QLD", "4152"],
  ["MYER CASTLE HILL (WOMENS)", "Shop 700/6-14 Castle St", "Castle Hill", "NSW", "2154"],
  ["MYER CASTLE HILL (MENS)", "Shop 700/6-14 Castle St", "Castle Hill", "NSW", "2154"],
  ["MYER SYDNEY (WOMENS)", "436 George St", "Sydney", "NSW", "2000"],
  ["MYER SYDNEY (MENS)", "436 George St", "Sydney", "NSW", "2000"],
  ["MYER CHADSTONE (WOMENS)", "1341 Dandenong Rd", "Chadstone", "VIC", "3148"],
  ["MYER CHADSTONE (MENS)", "1341 Dandenong Rd", "Chadstone", "VIC", "3148"],
  ["MYER CHARLESTOWN (WOMENS)", "Chapman St", "Charlestown", "NSW", "2290"],
  ["MYER CHARLESTOWN (MENS)", "Chapman St", "Charlestown", "NSW", "2290"],
  ["MYER CHERMSIDE (WOMENS)", "Gympie Rd", "Chermside", "QLD", "4032"],
  ["MYER CHERMSIDE (MENS)", "Gympie Rd", "Chermside", "QLD", "4032"],
  ["MYER GARDEN CITY (WOMENS)", "125 Riseley St", "Booragoon", "WA", "6154"],
  ["MYER GEELONG (WOMENS)", "105 Malop St", "Geelong", "VIC", "3220"],
  ["MYER GEELONG (MENS)", "105 Malop St", "Geelong", "VIC", "3220"],
  ["MYER KARRINYUP (WOMENS)", "Karrinyup Rd", "Karrinyup", "WA", "6018"],
  ["MYER KARRINYUP (MENS)", "Karrinyup Rd", "Karrinyup", "WA", "6018"],
  ["MYER MACQUARIE (WOMENS)", "Herring Rd", "North Ryde", "NSW", "2113"],
  ["MYER MACQUARIE (MENS)", "Herring Rd", "North Ryde", "NSW", "2113"],
  ["MYER MAROOCHYDORE (WOMENS)", "Amaroo St", "Maroochydore", "QLD", "4558"],
  ["MYER MAROOCHYDORE (MENS)", "Amaroo St", "Maroochydore", "QLD", "4558"],
  ["MYER MELBOURNE (WOMENS)", "314-336 Bourke St", "Melbourne", "VIC", "3000"],
  ["MYER MELBOURNE (MENS)", "314-336 Bourke St", "Melbourne", "VIC", "3000"],
  ["MYER NORTHLAND (WOMENS)", "2-50 Murray Rd East", "Preston", "VIC", "3072"],
  ["MYER NORTHLAND (MENS)", "2-50 Murray Rd East", "Preston", "VIC", "3072"],
  ["MYER PACIFIC FAIR (WOMENS)", "Hooker Blvd", "Broadbeach", "QLD", "4217"],
  ["MYER PERTH (WOMENS)", "200 Murray St", "Perth", "WA", "6000"],
  ["MYER PERTH (MENS)", "200 Murray St", "Perth", "WA", "6000"],
  ["MYER ROBINA (MENS)", "167-191 Robina Town Centre Dr", "Robina", "QLD", "4226"],
  ["MYER TOOWOOMBA (WOMENS)", "Cnr Margaret & Dent St", "Toowoomba", "QLD", "4350"],
  ["MYER TOOWOOMBA (MENS)", "Cnr Margaret & Dent St", "Toowoomba", "QLD", "4350"],
  ["CHATSWOOD CHASE (WOMENS & MENS)", "Shop 2-022A Chatswood Chase, 345 Victoria Ave", "Chatswood", "NSW", "2067"],
];

async function discoverSportscraftLocations(maxLocations: number) {
  const indexUrl = "https://www.sportscraft.com.au/store-locator";
  const locations = SPORTSCRAFT_STORE_LOCATIONS
    .map(([, street, suburb, state, postcode]) =>
      locationFromAddressParts({
        street,
        suburb,
        state,
        postcode,
      })
    )
    .filter((location): location is ExtractedLocation => Boolean(location));

  return {
    checkedUrls: [indexUrl],
    locations: dedupeLocations(locations).slice(0, maxLocations),
  };
}

const MJ_BALE_STORE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Birkenhead Pt SC Drummoyne NSW", "19 Roseby Street, Shop 65, Lvl 2, Birkenhead Point Shopping Centre", "Drummoyne", "NSW", "2047"],
  ["Westfield Bondi Junction NSW", "500 Oxford Street, Shop 4010/4011, Westfield Bondi Junction", "Bondi Junction", "NSW", "2022"],
  ["Myer Sydney City NSW", "436 George Street, Myer", "Sydney", "NSW", "2000"],
  ["Westfield City Sydney NSW", "Cnr Pitt Street Mall & Market Street, Shop 2039, Westfield Sydney City", "Sydney", "NSW", "2000"],
  ["Queen St Woollahra NSW", "106 Queen Street", "Woollahra", "NSW", "2025"],
  ["Macquarie SC Macquarie Park NSW", "Cnr Herring and Waterloo Roads, Shop 3322, Lvl 3, Zone H, Macquarie Centre", "North Ryde", "NSW", "2113"],
  ["Westfield Miranda NSW", "600 Kingsway, Shop 2189, Lvl 2, Zone S, Westfield Miranda", "Miranda", "NSW", "2228"],
  ["Myer Westfield Bondi Junction NSW", "500 Oxford Street, Myer / Lvl 2, Westfield Bondi Junction", "Bondi Junction", "NSW", "2022"],
  ["Myer Westfield Chatswood NSW", "1 Anderson Street, Myer / Westfield Chatswood", "Chatswood", "NSW", "2067"],
  ["Westfield Parramatta NSW", "159-175 Church Street, Shop 4047, Westfield Parramatta", "Parramatta", "NSW", "2150"],
  ["Martin Place NSW", "1 Martin Place, Shop 10G", "Sydney", "NSW", "2000"],
  ["DFO Homebush NSW", "3-5 Underwood Road, Tenancy 3-073, DFO Homebush", "Homebush", "NSW", "2140"],
  ["Myer Macquarie Centre NSW", "Cnr Herring and Waterloo Roads, Myer / Macquarie Centre", "North Ryde", "NSW", "2112"],
  ["Greenwood Plaza NSW", "36 Blue Street, Shop P24, Greenwood Plaza", "North Sydney", "NSW", "2060"],
  ["Warringah Mall NSW", "Condamine Street & Old Pittwater Road, Shop 2344, Westfield Warringah Mall", "Brookvale", "NSW", "2100"],
  ["Westfield Chatswood NSW", "1 Anderson Street, Shop 547, Westfield Chatswood", "Chatswood", "NSW", "2067"],
  ["Alexandria NSW", "7D/2 Huntley Street", "Alexandria", "NSW", "2015"],
  ["Castle Towers NSW", "6-14 Castle Street, Shop 525, Castle Towers Shopping Centre", "Castle Hill", "NSW", "2154"],
  ["Sydney Airport NSW", "Sydney Airport T3 Domestic Terminal, Shop 25-0036", "Mascot", "NSW", "2020"],
  ["Barangaroo NSW", "Barangaroo South, Shop C2.04, Scotch Row, International House Sydney", "Millers Point", "NSW", "2000"],
  ["Chatswood Chase NSW", "345 Victoria Avenue, Shop 2-022, Chatswood Chase Shopping Centre", "Chatswood", "NSW", "2067"],
  ["Westfield Burwood NSW", "100 Burwood Road, Shop 211, Westfield Burwood", "Burwood", "NSW", "2134"],
  ["David Jones Bondi NSW", "500 Oxford Street, David Jones / Westfield Bondi Junction", "Bondi Junction", "NSW", "2022"],
  ["David Jones Chatswood NSW", "345 Victoria Avenue, Level 3, David Jones / Chatswood Chase", "Chatswood", "NSW", "2067"],
  ["David Jones Elizabeth Street NSW", "86-108 Castlereagh Street, David Jones Elizabeth St", "Sydney", "NSW", "2000"],
  ["David Jones Macquarie Centre", "197-223 Herring Road, David Jones / Macquarie Centre", "Macquarie Park", "NSW", "2113"],
  ["David Jones Miranda NSW", "600 Kingsway, David Jones / Westfield Miranda", "Miranda", "NSW", "2228"],
  ["David Jones Kotara NSW", "Cnr Park Avenue & Northcott Drive, David Jones / Level 1, Westfield Kotara", "Kotara", "NSW", "2289"],
  ["Myer Albury NSW", "525 David Street, Myer / Level 1", "Albury", "NSW", "2640"],
  ["Westfield Hornsby NSW", "236 Pacific Highway, Shop 2083, Westfield Hornsby", "Hornsby", "NSW", "2077"],
  ["Rosebery NSW", "115-151 Dunning Avenue, Shop Tenancy 4 / Unit 24, Rosebery Engine Yards", "Rosebery", "NSW", "2018"],
  ["David Jones Burwood NSW", "100 Burwood Road, David Jones / Westfield Burwood", "Burwood", "NSW", "2134"],
  ["Mosman NSW", "681 Military Road", "Mosman", "NSW", "2088"],
  ["David Jones Parramatta NSW", "Level 3, Corner of Argyle and Marsden Streets, David Jones Westfield Parramatta", "Parramatta", "NSW", "2150"],
  ["David Jones Macarthur NSW", "200 Gilchrist Dr, Macarthur Square", "Campbelltown", "NSW", "2560"],
  ["Eastern Creek Quarter NSW", "159 Rooty Hill Road South, Tenancy 3211, ECQ Outlet", "Eastern Creek", "NSW", "2766"],
  ["Brisbane City QLD", "171-209 Queen Street Mall, Shop G15, Ground Floor, Wintergarden", "Brisbane", "QLD", "4000"],
  ["Indooroopilly SC QLD", "322 Moggill Road, Shop T2115, Indooroopilly Shopping Centre", "Indooroopilly", "QLD", "4068"],
  ["DFO Brisbane Airport QLD", "Ninth Avenue, Shop G042, DFO Brisbane Airport", "Brisbane Airport", "QLD", "4008"],
  ["Myer Carindale QLD", "1151 Creek Road, Myer / Westfield Carindale", "Carindale", "QLD", "4152"],
  ["Westfield Carindale QLD", "1151 Creek Road, Shop 1210, Westfield Carindale", "Carindale", "QLD", "4152"],
  ["Westfield Chermside QLD", "Cnr Gympie & Hamilton Roads, Shop 315, Lvl 1, Westfield Chermside", "Chermside", "QLD", "4032"],
  ["Pacific Fair QLD", "34 Hooker Boulevard, Shop 2759, Pacific Fair", "Broadbeach Waters", "QLD", "4218"],
  ["Harbour Town Outlets QLD", "147-189 Brisbane Road, Shop C029, Harbourtown Premium Outlet Centre", "Biggera Waters", "QLD", "4216"],
  ["Toowoomba QLD", "Cnr Margaret & Dent Streets, Shop 1113, Grand Central Shopping Centre", "Toowoomba", "QLD", "4350"],
  ["David Jones Queens Plaza QLD", "226 Queen Street, David Jones / Queens Plaza", "Brisbane City", "QLD", "4000"],
  ["David Jones Pacific Fair QLD", "2-30 Hooker Boulevard, David Jones / Pacific Fair Shopping Centre", "Broadbeach Waters", "QLD", "4218"],
  ["David Jones Indooroopilly QLD", "322 Moggill Road, David Jones / Indooroopilly Shopping Centre", "Indooroopilly", "QLD", "4068"],
  ["David Jones Chermside QLD", "395 Hamilton Road, David Jones / Level 2, Westfield Chermside", "Chermside", "QLD", "4032"],
  ["David Jones Sunshine QLD", "154-164 Horton Parade, David Jones / Sunshine Plaza", "Maroochydore", "QLD", "4558"],
  ["Canberra Centre ACT", "148 Bunda Street, Shop CF15, Level 1 Canberra Centre", "Canberra", "ACT", "2601"],
  ["DFO Canberra ACT", "337 Canberra Avenue, Shop 140A, Canberra Outlet", "Fyshwick", "ACT", "2906"],
  ["David Jones Canberra ACT", "260-262 Alinga Street, David Jones / Canberra Centre", "Canberra", "ACT", "2600"],
  ["Westfield Doncaster VIC", "619 Doncaster Road, Shop 1093, Lvl1, Westfield Doncaster", "Doncaster", "VIC", "3108"],
  ["Emporium Melbourne VIC", "287 Lonsdale Street, Shop 1-032, Emporium Melbourne", "Melbourne", "VIC", "3000"],
  ["Myer Chadstone SC VIC", "1341 Dandenong Road, Myer / Chadstone Shopping Centre", "Chadstone", "VIC", "3148"],
  ["Myer Melbourne City VIC", "314-336 Bourke Street, Myer", "Melbourne", "VIC", "3000"],
  ["DFO South Wharf VIC", "20 Convention Centre Place, Shop 4086, DFO South Wharf", "South Wharf", "VIC", "3006"],
  ["Chadstone SC VIC", "1341 Dandenong Road, Tenancy 326, Chadstone Shopping Centre", "Chadstone", "VIC", "3148"],
  ["Chapel St South Yarra VIC", "524-564 Chapel Street, Shop 15, The Colonnade", "South Yarra", "VIC", "3141"],
  ["Myer Westfield Doncaster VIC", "619 Doncaster Road, Myer / Westfield Doncaster", "Doncaster", "VIC", "3108"],
  ["Rialto VIC", "7/525 Collins Street, Retail 7 /", "Melbourne", "VIC", "3000"],
  ["DFO Essendon VIC", "100 Bulla Road, Shop G099, DFO Essendon", "Essendon Fields", "VIC", "3041"],
  ["Collins Place VIC", "45 Collins Street, Shop 26-27, Collins Place Retail Centre, Lvl 1", "Melbourne", "VIC", "3000"],
  ["Collins Arcade VIC", "260 Collins Street, Tenancy G.09A", "Melbourne", "VIC", "3000"],
  ["Highpoint VIC", "120 Rosamond Road, Shop 3509, Highpoint Shopping Centre", "Maribyrnong", "VIC", "3032"],
  ["David Jones Doncaster VIC", "619 Doncaster Road, David Jones / Westfield Doncaster", "Doncaster", "VIC", "3108"],
  ["David Jones Chadstone VIC", "1341 Dandenong Road, David Jones / Chadstone Shopping Centre", "Chadstone", "VIC", "3148"],
  ["Westfield Southland VIC", "1239 Nepean Highway, Shop 2007, Westfield Southland", "Cheltenham", "VIC", "3192"],
  ["David Jones Bourke Street Mall VIC", "310 Bourke Street Mall, David Jones / Level 5", "Melbourne", "VIC", "3000"],
  ["Myer Adelaide City SA", "22 Rundle Mall, Myer", "Adelaide", "SA", "5000"],
  ["Rundle Place Adelaide SA", "77-91 Rundle Mall, Shop G09, Rundle Place", "Adelaide", "SA", "5000"],
  ["David Jones Adelaide SA", "100 Rundle Mall, David Jones / Adelaide Central Plaza", "Adelaide", "SA", "5000"],
  ["Burnside SA", "447 Portrush Road, Tenancy T134 Burnside Village", "Glenside", "SA", "5065"],
  ["Myer Karrinyup WA", "200 Karrinyup Road, Myer", "Karrinyup", "WA", "6018"],
  ["Perth City WA", "125 St Georges Terrace, Shop HG109, Brookfield Place", "Perth", "WA", "6000"],
  ["Myer Perth City WA", "200 Murray Street, Myer", "Perth", "WA", "6000"],
  ["Enex 100 WA", "683-703 Hay Street Mall, Tenancy H-113", "Perth", "WA", "6000"],
  ["Claremont Quarter WA", "9 Bayview Terrace, Shop 212, Claremont Quarter", "Claremont", "WA", "6010"],
  ["DFO Perth Airport WA", "Dunreath Drive, Shop G-082, DFO Perth Airport", "Perth Airport", "WA", "6105"],
  ["David Jones Claremont WA", "9 Bayview Terrace, David Jones / Claremont Quarter", "Claremont", "WA", "6010"],
  ["Westfield Booragoon WA", "125 Riseley Street, Shop 57, Westfield Booragoon", "Booragoon", "WA", "6154"],
  ["Karrinyup WA", "200 Karrinyup Road, Shop SP1261-B, Westfield Karrinyup", "Karrinyup", "WA", "6018"],
  ["David Jones Hay Street Mall", "622 Hay Street, David Jones / Level 4", "Perth", "WA", "6000"],
  ["David Jones Karrinyup WA", "200 Karrinyup Road, David Jones / Level 1, Westfield Karrinyup", "Karrinyup", "WA", "6018"],
  ["Myer Booragoon WA", "125 Riseley Street, Level 1 Myer", "Booragoon", "WA", "6154"],
  ["Hobart TAS", "90-92 Murray Street", "Hobart", "TAS", "7000"],
];

async function discoverMjBaleLocations(maxLocations: number) {
  const indexUrl = "https://www.mjbale.com/pages/store-locator";
  const locations = MJ_BALE_STORE_LOCATIONS.map(([, street, suburb, state, postcode]) =>
    locationFromAddressParts({
      street,
      suburb,
      state,
      postcode,
    })
  ).filter((location): location is ExtractedLocation => Boolean(location));

  return {
    checkedUrls: [indexUrl],
    locations: dedupeLocations(locations).slice(0, maxLocations),
  };
}

async function discoverBabyKingdomLocations() {
  const url = "https://www.babykingdom.com.au/pages/store-locations";

  return {
    checkedUrls: [url],
    locations: [
      {
        address: "Shop 2 / Level 1, Homemaker Centre, 49-59 O'Riordan St, Alexandria, NSW, 2015",
        suburb: "Alexandria",
        state: "NSW",
        postcode: "2015",
        country: "Australia",
        latitude: -33.914421806379934,
        longitude: 151.1946182147082,
      },
      {
        address: "Chullora Business Park, Tenancy 7, 62 Hume Hwy, Chullora, NSW, 2190",
        suburb: "Chullora",
        state: "NSW",
        postcode: "2190",
        country: "Australia",
        latitude: null,
        longitude: null,
      },
      {
        address: "473 Rocky Point Rd, Sans Souci, NSW, 2219",
        suburb: "Sans Souci",
        state: "NSW",
        postcode: "2219",
        country: "Australia",
        latitude: null,
        longitude: null,
      },
    ],
  };
}

async function discoverBabyVillageLocations() {
  const url = "https://www.babyvillage.com.au/pages/contact-us";

  return {
    checkedUrls: [url],
    locations: [
      {
        address: "17-21 Bronte Road, Bondi Junction, NSW, 2022",
        suburb: "Bondi Junction",
        state: "NSW",
        postcode: "2022",
        country: "Australia",
        latitude: null,
        longitude: null,
      },
    ],
  };
}

async function discoverKinokuniyaLocations() {
  const url = "https://www.kinokuniya.com.au/contact/";

  return {
    checkedUrls: [url],
    locations: [
      {
        address: "Level 2, The Galeries, 500 George Street, Sydney, NSW, 2000",
        suburb: "Sydney",
        state: "NSW",
        postcode: "2000",
        country: "Australia",
        latitude: -33.8726763,
        longitude: 151.2072391,
      },
      {
        address: "Level 5, Westfield Chatswood, 1 Anderson Street, Chatswood, NSW, 2067",
        suburb: "Chatswood",
        state: "NSW",
        postcode: "2067",
        country: "Australia",
        latitude: null,
        longitude: null,
      },
    ],
  };
}

async function discoverReadingsLocations() {
  const url = "https://www.readings.com.au/shops";

  return {
    checkedUrls: [url],
    locations: [
      {
        address: "309 Lygon St, Carlton, VIC, 3053",
        suburb: "Carlton",
        state: "VIC",
        postcode: "3053",
        country: "Australia",
        latitude: null,
        longitude: null,
      },
      {
        address: "The Market Pavilion, Chadstone Shopping Centre, 1341 Dandenong Rd, Malvern East, VIC, 3145",
        suburb: "Malvern East",
        state: "VIC",
        postcode: "3145",
        country: "Australia",
        latitude: null,
        longitude: null,
      },
      {
        address: "Ground Level, Westfield Doncaster, 619 Doncaster Rd, Doncaster, VIC, 3108",
        suburb: "Doncaster",
        state: "VIC",
        postcode: "3108",
        country: "Australia",
        latitude: null,
        longitude: null,
      },
      {
        address: "Level 1, Emporium Melbourne, 287 Lonsdale St, Melbourne, VIC, 3000",
        suburb: "Melbourne",
        state: "VIC",
        postcode: "3000",
        country: "Australia",
        latitude: null,
        longitude: null,
      },
      {
        address: "687 Glenferrie Rd, Hawthorn, VIC, 3122",
        suburb: "Hawthorn",
        state: "VIC",
        postcode: "3122",
        country: "Australia",
        latitude: null,
        longitude: null,
      },
      {
        address: "315 Lygon St, Carlton, VIC, 3053",
        suburb: "Carlton",
        state: "VIC",
        postcode: "3053",
        country: "Australia",
        latitude: null,
        longitude: null,
      },
      {
        address: "185 Glenferrie Rd, Malvern, VIC, 3144",
        suburb: "Malvern",
        state: "VIC",
        postcode: "3144",
        country: "Australia",
        latitude: null,
        longitude: null,
      },
      {
        address: "State Library Victoria, 285-321 Russell St, Melbourne, VIC, 3000",
        suburb: "Melbourne",
        state: "VIC",
        postcode: "3000",
        country: "Australia",
        latitude: null,
        longitude: null,
      },
      {
        address: "112 Acland St, St Kilda, VIC, 3182",
        suburb: "St Kilda",
        state: "VIC",
        postcode: "3182",
        country: "Australia",
        latitude: null,
        longitude: null,
      },
    ],
  };
}

const CHEMIST_WAREHOUSE_STORE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney George Street", "412-414 George Street", "Sydney", "NSW", "2000"],
  ["Bondi Junction", "Shop 5015, Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Chatswood", "Shop 305, Westfield Chatswood, 1 Anderson Street", "Chatswood", "NSW", "2067"],
  ["Parramatta", "Shop 5051, Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["Hurstville", "Westfield Hurstville, Park Road", "Hurstville", "NSW", "2220"],
  ["Melbourne Bourke Street", "252 Bourke Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Doncaster", "Westfield Doncaster, 619 Doncaster Road", "Doncaster", "VIC", "3108"],
  ["Brisbane Queen Street", "Queen Street Mall", "Brisbane", "QLD", "4000"],
  ["Chermside", "Westfield Chermside, Gympie Road", "Chermside", "QLD", "4032"],
  ["Pacific Fair", "Pacific Fair Shopping Centre, Hooker Boulevard", "Broadbeach", "QLD", "4218"],
  ["Adelaide Rundle Mall", "Rundle Mall", "Adelaide", "SA", "5000"],
  ["Perth Hay Street", "Hay Street Mall", "Perth", "WA", "6000"],
  ["Karrinyup", "Karrinyup Shopping Centre, 200 Karrinyup Road", "Karrinyup", "WA", "6018"],
  ["Canberra Centre", "Canberra Centre, Bunda Street", "Canberra", "ACT", "2601"],
  ["Hobart", "Elizabeth Street", "Hobart", "TAS", "7000"],
  ["Darwin", "Smith Street Mall", "Darwin", "NT", "0800"],
];

const PRICELINE_STORE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney Pitt Street", "Pitt Street Mall", "Sydney", "NSW", "2000"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Chatswood", "Westfield Chatswood, 1 Anderson Street", "Chatswood", "NSW", "2067"],
  ["Parramatta", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["Miranda", "Westfield Miranda, 600 Kingsway", "Miranda", "NSW", "2228"],
  ["Melbourne Central", "Melbourne Central, La Trobe Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Doncaster", "Westfield Doncaster, 619 Doncaster Road", "Doncaster", "VIC", "3108"],
  ["Brisbane CBD", "Queen Street Mall", "Brisbane", "QLD", "4000"],
  ["Chermside", "Westfield Chermside, Gympie Road", "Chermside", "QLD", "4032"],
  ["Robina", "Robina Town Centre Drive", "Robina", "QLD", "4230"],
  ["Adelaide", "Rundle Mall", "Adelaide", "SA", "5000"],
  ["Perth", "Murray Street Mall", "Perth", "WA", "6000"],
  ["Karrinyup", "Karrinyup Shopping Centre, 200 Karrinyup Road", "Karrinyup", "WA", "6018"],
  ["Canberra", "Canberra Centre, Bunda Street", "Canberra", "ACT", "2601"],
  ["Hobart", "Elizabeth Street", "Hobart", "TAS", "7000"],
];

const MECCA_STORE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["George Street", "345 George Street", "Sydney", "NSW", "2000"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Chatswood", "Chatswood Chase, 345 Victoria Avenue", "Chatswood", "NSW", "2067"],
  ["Parramatta", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["Miranda", "Westfield Miranda, 600 Kingsway", "Miranda", "NSW", "2228"],
  ["Melbourne Central", "Melbourne Central, La Trobe Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Doncaster", "Westfield Doncaster, 619 Doncaster Road", "Doncaster", "VIC", "3108"],
  ["Brisbane", "QueensPlaza, Queen Street Mall", "Brisbane", "QLD", "4000"],
  ["Chermside", "Westfield Chermside, Gympie Road", "Chermside", "QLD", "4032"],
  ["Pacific Fair", "Pacific Fair Shopping Centre, Hooker Boulevard", "Broadbeach", "QLD", "4218"],
  ["Adelaide", "Rundle Mall", "Adelaide", "SA", "5000"],
  ["Perth", "Karrinyup Shopping Centre, 200 Karrinyup Road", "Karrinyup", "WA", "6018"],
  ["Canberra", "Canberra Centre, Bunda Street", "Canberra", "ACT", "2601"],
];

const SEPHORA_STORE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Pitt Street", "Pitt Street Mall", "Sydney", "NSW", "2000"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Chatswood", "Westfield Chatswood, 1 Anderson Street", "Chatswood", "NSW", "2067"],
  ["Parramatta", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["Macquarie", "Macquarie Centre, Herring Road", "North Ryde", "NSW", "2113"],
  ["Melbourne Central", "Melbourne Central, La Trobe Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Doncaster", "Westfield Doncaster, 619 Doncaster Road", "Doncaster", "VIC", "3108"],
  ["Brisbane", "Queen Street Mall", "Brisbane", "QLD", "4000"],
  ["Chermside", "Westfield Chermside, Gympie Road", "Chermside", "QLD", "4032"],
  ["Pacific Fair", "Pacific Fair Shopping Centre, Hooker Boulevard", "Broadbeach", "QLD", "4218"],
  ["Perth", "Karrinyup Shopping Centre, 200 Karrinyup Road", "Karrinyup", "WA", "6018"],
  ["Adelaide", "Rundle Mall", "Adelaide", "SA", "5000"],
];

const HAIRHOUSE_STORE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Chatswood", "Westfield Chatswood, 1 Anderson Street", "Chatswood", "NSW", "2067"],
  ["Parramatta", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["Miranda", "Westfield Miranda, 600 Kingsway", "Miranda", "NSW", "2228"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Doncaster", "Westfield Doncaster, 619 Doncaster Road", "Doncaster", "VIC", "3108"],
  ["Highpoint", "Highpoint Shopping Centre, 120-200 Rosamond Road", "Maribyrnong", "VIC", "3032"],
  ["Chermside", "Westfield Chermside, Gympie Road", "Chermside", "QLD", "4032"],
  ["Carindale", "Westfield Carindale, 1151 Creek Road", "Carindale", "QLD", "4152"],
  ["Adelaide", "Rundle Mall", "Adelaide", "SA", "5000"],
  ["Karrinyup", "Karrinyup Shopping Centre, 200 Karrinyup Road", "Karrinyup", "WA", "6018"],
  ["Canberra", "Canberra Centre, Bunda Street", "Canberra", "ACT", "2601"],
];

const BODY_SHOP_STORE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Pitt Street Mall", "Sydney", "NSW", "2000"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Chatswood", "Westfield Chatswood, 1 Anderson Street", "Chatswood", "NSW", "2067"],
  ["Parramatta", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["Melbourne", "Bourke Street Mall", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Doncaster", "Westfield Doncaster, 619 Doncaster Road", "Doncaster", "VIC", "3108"],
  ["Brisbane", "Queen Street Mall", "Brisbane", "QLD", "4000"],
  ["Chermside", "Westfield Chermside, Gympie Road", "Chermside", "QLD", "4032"],
  ["Adelaide", "Rundle Mall", "Adelaide", "SA", "5000"],
  ["Perth", "Murray Street Mall", "Perth", "WA", "6000"],
  ["Canberra", "Canberra Centre, Bunda Street", "Canberra", "ACT", "2601"],
];

const AESOP_STORE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "188 Pitt Street", "Sydney", "NSW", "2000"],
  ["Paddington", "242 Oxford Street", "Paddington", "NSW", "2021"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Chatswood", "Chatswood Chase, 345 Victoria Avenue", "Chatswood", "NSW", "2067"],
  ["Melbourne", "Flinders Lane", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["South Yarra", "Chapel Street", "South Yarra", "VIC", "3141"],
  ["Brisbane", "James Street", "Fortitude Valley", "QLD", "4006"],
  ["Adelaide", "Rundle Street", "Adelaide", "SA", "5000"],
  ["Perth", "Claremont Quarter, Bay View Terrace", "Claremont", "WA", "6010"],
  ["Canberra", "Canberra Centre, Bunda Street", "Canberra", "ACT", "2601"],
];

const W_COSMETICS_STORE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "George Street", "Sydney", "NSW", "2000"],
  ["Chatswood", "Westfield Chatswood, 1 Anderson Street", "Chatswood", "NSW", "2067"],
  ["Burwood", "Westfield Burwood, 100 Burwood Road", "Burwood", "NSW", "2134"],
  ["Hurstville", "Westfield Hurstville, Park Road", "Hurstville", "NSW", "2220"],
  ["Melbourne", "Melbourne Central, La Trobe Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Brisbane", "Queen Street Mall", "Brisbane", "QLD", "4000"],
  ["Perth", "Murray Street Mall", "Perth", "WA", "6000"],
];

const MAC_STORE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Pitt Street Mall", "Sydney", "NSW", "2000"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Chatswood", "Chatswood Chase, 345 Victoria Avenue", "Chatswood", "NSW", "2067"],
  ["Melbourne", "Melbourne Central, La Trobe Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Brisbane", "Queen Street Mall", "Brisbane", "QLD", "4000"],
  ["Adelaide", "Rundle Mall", "Adelaide", "SA", "5000"],
  ["Perth", "Hay Street Mall", "Perth", "WA", "6000"],
];

const JURLIQUE_STORE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Westfield Sydney, Pitt Street Mall", "Sydney", "NSW", "2000"],
  ["Chatswood", "Chatswood Chase, 345 Victoria Avenue", "Chatswood", "NSW", "2067"],
  ["Melbourne", "Emporium Melbourne, 287 Lonsdale Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Brisbane", "QueensPlaza, Queen Street Mall", "Brisbane", "QLD", "4000"],
  ["Adelaide", "Rundle Mall", "Adelaide", "SA", "5000"],
  ["Perth", "Karrinyup Shopping Centre, 200 Karrinyup Road", "Karrinyup", "WA", "6018"],
];

const MYER_BEAUTY_STORE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "436 George Street", "Sydney", "NSW", "2000"],
  ["Bondi", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Chatswood", "Westfield Chatswood, 1 Anderson Street", "Chatswood", "NSW", "2067"],
  ["Parramatta", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["Miranda", "Westfield Miranda, 600 Kingsway", "Miranda", "NSW", "2228"],
  ["Melbourne", "314-336 Bourke Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Doncaster", "Westfield Doncaster, 619 Doncaster Road", "Doncaster", "VIC", "3108"],
  ["Northland", "2-50 Murray Road East", "Preston", "VIC", "3072"],
  ["Brisbane", "Queen Street Mall", "Brisbane", "QLD", "4000"],
  ["Chermside", "Westfield Chermside, Gympie Road", "Chermside", "QLD", "4032"],
  ["Carindale", "Westfield Carindale, 1151 Creek Road", "Carindale", "QLD", "4152"],
  ["Adelaide", "22 Rundle Mall", "Adelaide", "SA", "5000"],
  ["Perth", "200 Murray Street", "Perth", "WA", "6000"],
  ["Karrinyup", "Karrinyup Shopping Centre, 200 Karrinyup Road", "Karrinyup", "WA", "6018"],
  ["Canberra", "Canberra Centre, Bunda Street", "Canberra", "ACT", "2601"],
  ["Hobart", "Cat & Fiddle Arcade, Murray Street", "Hobart", "TAS", "7000"],
];

const DAVID_JONES_BEAUTY_STORE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Elizabeth Street", "86-108 Castlereagh Street", "Sydney", "NSW", "2000"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Chatswood", "Chatswood Chase, 345 Victoria Avenue", "Chatswood", "NSW", "2067"],
  ["Parramatta", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["Miranda", "Westfield Miranda, 600 Kingsway", "Miranda", "NSW", "2228"],
  ["Bourke Street", "310 Bourke Street Mall", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Doncaster", "Westfield Doncaster, 619 Doncaster Road", "Doncaster", "VIC", "3108"],
  ["QueensPlaza", "226 Queen Street", "Brisbane", "QLD", "4000"],
  ["Chermside", "Westfield Chermside, Gympie Road", "Chermside", "QLD", "4032"],
  ["Pacific Fair", "Pacific Fair Shopping Centre, Hooker Boulevard", "Broadbeach", "QLD", "4218"],
  ["Adelaide", "100 Rundle Mall", "Adelaide", "SA", "5000"],
  ["Perth", "622 Hay Street", "Perth", "WA", "6000"],
  ["Karrinyup", "Karrinyup Shopping Centre, 200 Karrinyup Road", "Karrinyup", "WA", "6018"],
  ["Canberra", "Canberra Centre, 260-262 Alinga Street", "Canberra", "ACT", "2600"],
];

function discoverCosmeticChainLocations(storeName: string, maxLocations: number) {
  if (/^Chemist Warehouse Australia$|^Ultra Beauty Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.chemistwarehouse.com.au/store-locator", CHEMIST_WAREHOUSE_STORE_LOCATIONS, maxLocations);
  }
  if (/^Priceline Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.priceline.com.au/store-finder/country/AU", PRICELINE_STORE_LOCATIONS, maxLocations);
  }
  if (/^MECCA Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.mecca.com/en-au/stores/", MECCA_STORE_LOCATIONS, maxLocations);
  }
  if (/^Sephora Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.sephora.com.au/store-locations", SEPHORA_STORE_LOCATIONS, maxLocations);
  }
  if (/^Hairhouse Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.hairhouse.com.au/store-locator", HAIRHOUSE_STORE_LOCATIONS, maxLocations);
  }
  if (/^The Body Shop Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.thebodyshop.com/en-au/store-finder", BODY_SHOP_STORE_LOCATIONS, maxLocations);
  }
  if (/^Aesop Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.aesop.com/au/r/store-locator/", AESOP_STORE_LOCATIONS, maxLocations);
  }
  if (/^W Cosmetics Australia$/i.test(storeName)) {
    return staticLocationResult("https://wcosmetics.com.au/pages/store-locations", W_COSMETICS_STORE_LOCATIONS, maxLocations);
  }
  if (/^M·A·C Cosmetics Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.maccosmetics.com.au/store_locator", MAC_STORE_LOCATIONS, maxLocations);
  }
  if (/^Jurlique Australia$/i.test(storeName)) {
    return staticLocationResult("https://jurlique.com.au/pages/store-locator", JURLIQUE_STORE_LOCATIONS, maxLocations);
  }
  if (/^Myer Beauty Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.myer.com.au/store-locator", MYER_BEAUTY_STORE_LOCATIONS, maxLocations);
  }
  if (/^David Jones Beauty$/i.test(storeName)) {
    return staticLocationResult("https://www.davidjones.com/stores", DAVID_JONES_BEAUTY_STORE_LOCATIONS, maxLocations);
  }

  return null;
}

const COSMETIC_CHAIN_PARENT_NAMES = [
  "Aesop Australia",
  "Chemist Warehouse Australia",
  "David Jones Beauty",
  "Hairhouse Australia",
  "Jurlique Australia",
  "MECCA Australia",
  "Myer Beauty Australia",
  "M·A·C Cosmetics Australia",
  "Priceline Australia",
  "Sephora Australia",
  "The Body Shop Australia",
  "Ultra Beauty Australia",
  "W Cosmetics Australia",
];

const OROTON_OUTLET_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Birkenhead Point", "Birkenhead Point Brand Outlet, 19 Roseby Street", "Drummoyne", "NSW", "2047"],
  ["DFO Homebush", "DFO Homebush, 3-5 Underwood Road", "Homebush", "NSW", "2140"],
  ["DFO South Wharf", "DFO South Wharf, 20 Convention Centre Place", "South Wharf", "VIC", "3006"],
  ["DFO Essendon", "DFO Essendon, 100 Bulla Road", "Essendon Fields", "VIC", "3041"],
  ["Harbour Town", "Harbour Town Premium Outlets, 147-189 Brisbane Road", "Biggera Waters", "QLD", "4216"],
  ["DFO Brisbane", "DFO Brisbane, 18th Avenue", "Brisbane Airport", "QLD", "4008"],
  ["Watertown", "Watertown Brand Outlet Centre, 840 Wellington Street", "West Perth", "WA", "6005"],
  ["Canberra Outlet", "Canberra Outlet Centre, 337 Canberra Avenue", "Fyshwick", "ACT", "2609"],
];

const COACH_OUTLET_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Birkenhead Point", "Birkenhead Point Brand Outlet, 19 Roseby Street", "Drummoyne", "NSW", "2047"],
  ["DFO Homebush", "DFO Homebush, 3-5 Underwood Road", "Homebush", "NSW", "2140"],
  ["DFO South Wharf", "DFO South Wharf, 20 Convention Centre Place", "South Wharf", "VIC", "3006"],
  ["DFO Essendon", "DFO Essendon, 100 Bulla Road", "Essendon Fields", "VIC", "3041"],
  ["Harbour Town", "Harbour Town Premium Outlets, 147-189 Brisbane Road", "Biggera Waters", "QLD", "4216"],
  ["DFO Brisbane", "DFO Brisbane, 18th Avenue", "Brisbane Airport", "QLD", "4008"],
  ["Watertown", "Watertown Brand Outlet Centre, 840 Wellington Street", "West Perth", "WA", "6005"],
  ["DFO Perth", "DFO Perth, 11 High Street", "Perth Airport", "WA", "6105"],
];

const COUNTRY_ROAD_OUTLET_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Birkenhead Point", "Birkenhead Point Brand Outlet, 19 Roseby Street", "Drummoyne", "NSW", "2047"],
  ["DFO Homebush", "DFO Homebush, 3-5 Underwood Road", "Homebush", "NSW", "2140"],
  ["DFO South Wharf", "DFO South Wharf, 20 Convention Centre Place", "South Wharf", "VIC", "3006"],
  ["DFO Moorabbin", "DFO Moorabbin, 250 Centre Dandenong Road", "Moorabbin Airport", "VIC", "3194"],
  ["DFO Brisbane", "DFO Brisbane, 18th Avenue", "Brisbane Airport", "QLD", "4008"],
  ["Harbour Town", "Harbour Town Premium Outlets, 147-189 Brisbane Road", "Biggera Waters", "QLD", "4216"],
  ["Watertown", "Watertown Brand Outlet Centre, 840 Wellington Street", "West Perth", "WA", "6005"],
  ["Canberra Outlet", "Canberra Outlet Centre, 337 Canberra Avenue", "Fyshwick", "ACT", "2609"],
];

const MJ_BALE_OUTLET_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Birkenhead Point", "Birkenhead Point Brand Outlet, 19 Roseby Street", "Drummoyne", "NSW", "2047"],
  ["DFO Homebush", "DFO Homebush, 3-5 Underwood Road", "Homebush", "NSW", "2140"],
  ["Alexandria Outlet", "Rosebery Engine Yards, 115-151 Dunning Avenue", "Rosebery", "NSW", "2018"],
  ["DFO South Wharf", "DFO South Wharf, 20 Convention Centre Place", "South Wharf", "VIC", "3006"],
  ["DFO Essendon", "DFO Essendon, 100 Bulla Road", "Essendon Fields", "VIC", "3041"],
  ["Harbour Town", "Harbour Town Premium Outlets, 147-189 Brisbane Road", "Biggera Waters", "QLD", "4216"],
  ["DFO Brisbane", "DFO Brisbane, 18th Avenue", "Brisbane Airport", "QLD", "4008"],
  ["DFO Canberra", "Canberra Outlet Centre, 337 Canberra Avenue", "Fyshwick", "ACT", "2609"],
];

const POLITIX_OUTLET_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Canberra Outlet", "Canberra Outlet Centre, 337 Canberra Avenue", "Fyshwick", "ACT", "2609"],
  ["DFO Homebush", "DFO Homebush, 3-5 Underwood Road", "Homebush", "NSW", "2140"],
  ["DFO South Wharf", "DFO South Wharf, 20 Convention Centre Place", "South Wharf", "VIC", "3006"],
  ["DFO Brisbane", "DFO Brisbane, 18th Avenue", "Brisbane Airport", "QLD", "4008"],
  ["Harbour Town", "Harbour Town Premium Outlets, 147-189 Brisbane Road", "Biggera Waters", "QLD", "4216"],
  ["Watertown", "Watertown Brand Outlet Centre, 840 Wellington Street", "West Perth", "WA", "6005"],
];

const SKECHERS_OUTLET_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Canberra Outlet", "Canberra Outlet Centre, 337 Canberra Avenue", "Fyshwick", "ACT", "2609"],
  ["DFO Homebush", "DFO Homebush, 3-5 Underwood Road", "Homebush", "NSW", "2140"],
  ["Birkenhead Point", "Birkenhead Point Brand Outlet, 19 Roseby Street", "Drummoyne", "NSW", "2047"],
  ["DFO South Wharf", "DFO South Wharf, 20 Convention Centre Place", "South Wharf", "VIC", "3006"],
  ["DFO Moorabbin", "DFO Moorabbin, 250 Centre Dandenong Road", "Moorabbin Airport", "VIC", "3194"],
  ["DFO Brisbane", "DFO Brisbane, 18th Avenue", "Brisbane Airport", "QLD", "4008"],
  ["Harbour Town", "Harbour Town Premium Outlets, 147-189 Brisbane Road", "Biggera Waters", "QLD", "4216"],
  ["Watertown", "Watertown Brand Outlet Centre, 840 Wellington Street", "West Perth", "WA", "6005"],
];

const SUPRDRY_TED_BAKER_OUTLET_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Birkenhead Point", "Birkenhead Point Brand Outlet, 19 Roseby Street", "Drummoyne", "NSW", "2047"],
  ["DFO Homebush", "DFO Homebush, 3-5 Underwood Road", "Homebush", "NSW", "2140"],
  ["DFO South Wharf", "DFO South Wharf, 20 Convention Centre Place", "South Wharf", "VIC", "3006"],
  ["DFO Brisbane", "DFO Brisbane, 18th Avenue", "Brisbane Airport", "QLD", "4008"],
  ["Harbour Town", "Harbour Town Premium Outlets, 147-189 Brisbane Road", "Biggera Waters", "QLD", "4216"],
  ["Watertown", "Watertown Brand Outlet Centre, 840 Wellington Street", "West Perth", "WA", "6005"],
];

const ARMANI_OUTLET_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["DFO Homebush", "DFO Homebush, 3-5 Underwood Road", "Homebush", "NSW", "2140"],
  ["DFO South Wharf", "DFO South Wharf, 20 Convention Centre Place", "South Wharf", "VIC", "3006"],
  ["DFO Brisbane", "DFO Brisbane, 18th Avenue", "Brisbane Airport", "QLD", "4008"],
  ["Harbour Town", "Harbour Town Premium Outlets, 147-189 Brisbane Road", "Biggera Waters", "QLD", "4216"],
  ["DFO Perth", "DFO Perth, 11 High Street", "Perth Airport", "WA", "6105"],
];

const BOSS_OUTLET_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Homebush", "DFO Homebush, 3-5 Underwood Road", "Homebush", "NSW", "2140"],
  ["South Wharf", "DFO South Wharf, 20 Convention Centre Place", "South Wharf", "VIC", "3006"],
  ["Brisbane Airport", "DFO Brisbane, 18th Avenue", "Brisbane Airport", "QLD", "4008"],
  ["Harbour Town", "Harbour Town Premium Outlets, 147-189 Brisbane Road", "Biggera Waters", "QLD", "4216"],
  ["Perth Airport", "DFO Perth, 11 High Street", "Perth Airport", "WA", "6105"],
];

const SPORTS_OUTLET_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Birkenhead Point", "Birkenhead Point Brand Outlet, 19 Roseby Street", "Drummoyne", "NSW", "2047"],
  ["DFO Homebush", "DFO Homebush, 3-5 Underwood Road", "Homebush", "NSW", "2140"],
  ["DFO South Wharf", "DFO South Wharf, 20 Convention Centre Place", "South Wharf", "VIC", "3006"],
  ["DFO Essendon", "DFO Essendon, 100 Bulla Road", "Essendon Fields", "VIC", "3041"],
  ["DFO Moorabbin", "DFO Moorabbin, 250 Centre Dandenong Road", "Moorabbin Airport", "VIC", "3194"],
  ["DFO Brisbane", "DFO Brisbane, 18th Avenue", "Brisbane Airport", "QLD", "4008"],
  ["Harbour Town", "Harbour Town Premium Outlets, 147-189 Brisbane Road", "Biggera Waters", "QLD", "4216"],
  ["DFO Perth", "DFO Perth, 11 High Street", "Perth Airport", "WA", "6105"],
  ["Canberra Outlet", "Canberra Outlet Centre, 337 Canberra Avenue", "Fyshwick", "ACT", "2609"],
];

const TYPO_OUTLET_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["DFO Homebush", "DFO Homebush, 3-5 Underwood Road", "Homebush", "NSW", "2140"],
  ["DFO South Wharf", "DFO South Wharf, 20 Convention Centre Place", "South Wharf", "VIC", "3006"],
  ["DFO Brisbane", "DFO Brisbane, 18th Avenue", "Brisbane Airport", "QLD", "4008"],
  ["Harbour Town", "Harbour Town Premium Outlets, 147-189 Brisbane Road", "Biggera Waters", "QLD", "4216"],
  ["Watertown", "Watertown Brand Outlet Centre, 840 Wellington Street", "West Perth", "WA", "6005"],
  ["Canberra Outlet", "Canberra Outlet Centre, 337 Canberra Avenue", "Fyshwick", "ACT", "2609"],
];

function discoverFactoryOutletChainLocations(storeName: string, maxLocations: number) {
  if (/^Oroton Outlet$/i.test(storeName)) {
    return staticLocationResult("https://oroton.com/outlet/", OROTON_OUTLET_LOCATIONS, maxLocations);
  }
  if (/^Coach Outlet Australia$/i.test(storeName)) {
    return staticLocationResult("https://au.coach.com/shop/outlet", COACH_OUTLET_LOCATIONS, maxLocations);
  }
  if (/^Country Road & Trenery Outlet$/i.test(storeName)) {
    return staticLocationResult("https://outlet.countryroad.com.au/", COUNTRY_ROAD_OUTLET_LOCATIONS, maxLocations);
  }
  if (/^M\.?J\.?\s+Bale Outlet Stores$/i.test(storeName)) {
    return staticLocationResult("https://www.mjbale.com/pages/outlet-stores", MJ_BALE_OUTLET_LOCATIONS, maxLocations);
  }
  if (/^Politix Canberra Outlet$/i.test(storeName)) {
    return staticLocationResult("https://www.politix.com.au/stores/ACT-Canberra-Outlet-Centre", POLITIX_OUTLET_LOCATIONS, maxLocations);
  }
  if (/^Skechers Canberra Outlet$/i.test(storeName)) {
    return staticLocationResult("https://canberraoutlet.com.au/stores/skechers", SKECHERS_OUTLET_LOCATIONS, maxLocations);
  }
  if (/^Superdry Outlet$|^Ted Baker Outlet$/i.test(storeName)) {
    return staticLocationResult("https://www.superdry.com/outlet/", SUPRDRY_TED_BAKER_OUTLET_LOCATIONS, maxLocations);
  }
  if (/^Armani Exchange Outlet Australia$|^Armani Outlet Australia$/i.test(storeName)) {
    return staticLocationResult("https://locations.armani.com/en/armani-outlet/australia", ARMANI_OUTLET_LOCATIONS, maxLocations);
  }
  if (/^BOSS Outlet Homebush$/i.test(storeName)) {
    return staticLocationResult("https://www.hugoboss.com/au/boss-outlet-3-1-5-underwood-road-sydney-homebush-nsw/", BOSS_OUTLET_LOCATIONS, maxLocations);
  }
  if (/^Arc'teryx Outlet Australia$|^Under Armour Outlet Australia$|^Salomon Outlet Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.dfo.com.au/", SPORTS_OUTLET_LOCATIONS, maxLocations);
  }
  if (/^Typo Outlet Australia$/i.test(storeName)) {
    return staticLocationResult("https://typo.com/AU/outlet/", TYPO_OUTLET_LOCATIONS, maxLocations);
  }

  return null;
}

const FACTORY_OUTLET_CHAIN_PARENT_NAMES = [
  "Arc'teryx Outlet Australia",
  "Armani Exchange Outlet Australia",
  "Armani Outlet Australia",
  "BOSS Outlet Homebush",
  "Coach Outlet Australia",
  "Country Road & Trenery Outlet",
  "M.J. Bale Outlet Stores",
  "Oroton Outlet",
  "Politix Canberra Outlet",
  "Salomon Outlet Australia",
  "Skechers Canberra Outlet",
  "Superdry Outlet",
  "Ted Baker Outlet",
  "Typo Outlet Australia",
  "Under Armour Outlet Australia",
];

const SAKE_RESTAURANT_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["The Rocks", "12 Argyle Street", "The Rocks", "NSW", "2000"],
  ["Manly", "Manly Wharf, East Esplanade", "Manly", "NSW", "2095"],
  ["Hamer Hall", "Arts Centre Melbourne, 100 St Kilda Road", "Melbourne", "VIC", "3004"],
];

const MUNICH_BRAUHAUS_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["The Rocks", "33 Playfair Street", "The Rocks", "NSW", "2000"],
  ["South Wharf", "45 South Wharf Promenade", "South Wharf", "VIC", "3006"],
  ["South Bank", "153 Stanley Street Plaza", "South Brisbane", "QLD", "4101"],
];

const MJOLNER_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "267 Cleveland Street", "Redfern", "NSW", "2016"],
  ["Melbourne", "106 Hardware Street", "Melbourne", "VIC", "3000"],
];

const SYDNEY_BREWERY_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Surry Hills", "28 Albion Street", "Surry Hills", "NSW", "2010"],
  ["Hunter Valley", "430 Wine Country Drive", "Lovedale", "NSW", "2325"],
];

const FELONS_BREWING_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Howard Smith Wharves", "5 Boundary Street", "Brisbane City", "QLD", "4000"],
];

const CHIN_CHIN_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Melbourne", "125 Flinders Lane", "Melbourne", "VIC", "3000"],
  ["Sydney", "69 Commonwealth Street", "Surry Hills", "NSW", "2010"],
];

const LONG_CHIM_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Perth", "Saint Georges Terrace", "Perth", "WA", "6000"],
  ["Sydney", "Angel Place, 14 Martin Place", "Sydney", "NSW", "2000"],
];

const THE_BAVARIAN_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["York Street", "24 York Street", "Sydney", "NSW", "2000"],
  ["Manly Wharf", "Manly Wharf, East Esplanade", "Manly", "NSW", "2095"],
  ["World Square", "644 George Street", "Sydney", "NSW", "2000"],
  ["Chermside", "Westfield Chermside, Gympie Road", "Chermside", "QLD", "4032"],
  ["Robina", "Robina Town Centre Drive", "Robina", "QLD", "4226"],
  ["Knox", "Westfield Knox, 425 Burwood Highway", "Wantirna South", "VIC", "3152"],
];

const EL_CAMINO_CANTINA_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["The Rocks", "18 Argyle Street", "The Rocks", "NSW", "2000"],
  ["Entertainment Quarter", "122 Lang Road", "Moore Park", "NSW", "2021"],
  ["Manly Wharf", "Manly Wharf, East Esplanade", "Manly", "NSW", "2095"],
  ["Bowen Hills", "45 King Street", "Bowen Hills", "QLD", "4006"],
  ["South Bank", "Shop 2, 153 Stanley Street Plaza", "South Brisbane", "QLD", "4101"],
  ["Fitzroy", "222 Brunswick Street", "Fitzroy", "VIC", "3065"],
];

const FRATELLI_FRESH_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Darling Harbour", "ICC Sydney, 14 Darling Drive", "Sydney", "NSW", "2000"],
  ["Westfield Sydney", "Westfield Sydney, 188 Pitt Street", "Sydney", "NSW", "2000"],
  ["Entertainment Quarter", "122 Lang Road", "Moore Park", "NSW", "2021"],
  ["Manly", "54 West Esplanade", "Manly", "NSW", "2095"],
];

function discoverDiningChainLocations(storeName: string, maxLocations: number) {
  if (/^Saké Restaurant & Bar$/i.test(storeName)) {
    return staticLocationResult("https://www.sakerestaurant.com.au/locations/", SAKE_RESTAURANT_LOCATIONS, maxLocations);
  }
  if (/^Munich Brauhaus The Rocks$/i.test(storeName)) {
    return staticLocationResult("https://munichbrauhaus.com/locations/", MUNICH_BRAUHAUS_LOCATIONS, maxLocations);
  }
  if (/^Mjolner Sydney$|^Mjolner Melbourne$/i.test(storeName)) {
    return staticLocationResult("https://mjolner.com.au/", MJOLNER_LOCATIONS, maxLocations);
  }
  if (/^Sydney Brewery Surry Hills$/i.test(storeName)) {
    return staticLocationResult("https://sydneybrewery.com/venues/", SYDNEY_BREWERY_LOCATIONS, maxLocations);
  }
  if (/^Felons Brewing Co Brisbane$/i.test(storeName)) {
    return staticLocationResult("https://felonsbrewingco.com.au/", FELONS_BREWING_LOCATIONS, maxLocations);
  }
  if (/^Chin Chin Melbourne$/i.test(storeName)) {
    return staticLocationResult("https://www.chinchinrestaurant.com.au/", CHIN_CHIN_LOCATIONS, maxLocations);
  }
  if (/^Long Chim Perth$/i.test(storeName)) {
    return staticLocationResult("https://www.longchimperth.com/", LONG_CHIM_LOCATIONS, maxLocations);
  }
  if (/^The Bavarian Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.thebavarians.com/locations/", THE_BAVARIAN_LOCATIONS, maxLocations);
  }
  if (/^El Camino Cantina Australia$/i.test(storeName)) {
    return staticLocationResult("https://elcaminocantina.com.au/locations/", EL_CAMINO_CANTINA_LOCATIONS, maxLocations);
  }
  if (/^Fratelli Fresh Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.fratellifresh.com.au/locations/", FRATELLI_FRESH_LOCATIONS, maxLocations);
  }

  return null;
}

const DINING_CHAIN_PARENT_NAMES = [
  "Chin Chin Melbourne",
  "El Camino Cantina Australia",
  "Felons Brewing Co Brisbane",
  "Fratelli Fresh Australia",
  "Long Chim Perth",
  "Munich Brauhaus The Rocks",
  "Saké Restaurant & Bar",
  "Sydney Brewery Surry Hills",
  "The Bavarian Australia",
];

const WOOLWORTHS_STORE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Town Hall", "Town Hall Square, 480 George Street", "Sydney", "NSW", "2000"],
  ["Double Bay", "451 New South Head Road", "Double Bay", "NSW", "2028"],
  ["Chatswood", "Chatswood Chase, 345 Victoria Avenue", "Chatswood", "NSW", "2067"],
  ["Parramatta", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["Melbourne QV", "QV Melbourne, 210 Lonsdale Street", "Melbourne", "VIC", "3000"],
  ["Southbank", "63 City Road", "Southbank", "VIC", "3006"],
  ["Brisbane CBD", "MacArthur Central, 255 Queen Street", "Brisbane City", "QLD", "4000"],
  ["Carindale", "Westfield Carindale, 1151 Creek Road", "Carindale", "QLD", "4152"],
  ["Adelaide", "80-88 Rundle Mall", "Adelaide", "SA", "5000"],
  ["Perth", "Raine Square, 300 Murray Street", "Perth", "WA", "6000"],
  ["Canberra", "Canberra Centre, Bunda Street", "Canberra", "ACT", "2601"],
  ["Hobart", "44 Argyle Street", "Hobart", "TAS", "7000"],
  ["Darwin", "Smith Street Mall", "Darwin City", "NT", "0800"],
];

const COLES_STORE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["World Square", "World Square, 650 George Street", "Sydney", "NSW", "2000"],
  ["Broadway", "Broadway Shopping Centre, 1 Bay Street", "Ultimo", "NSW", "2007"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Parramatta", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["Melbourne Central", "Melbourne Central, 211 La Trobe Street", "Melbourne", "VIC", "3000"],
  ["Richmond", "261 Bridge Road", "Richmond", "VIC", "3121"],
  ["Brisbane CBD", "Queen Street Mall", "Brisbane City", "QLD", "4000"],
  ["West End", "Mollison Street", "West End", "QLD", "4101"],
  ["Rundle Mall", "Rundle Mall", "Adelaide", "SA", "5000"],
  ["Perth CBD", "William Street", "Perth", "WA", "6000"],
  ["Canberra Centre", "Canberra Centre, Bunda Street", "Canberra", "ACT", "2601"],
  ["Hobart", "Cat & Fiddle Arcade, Murray Street", "Hobart", "TAS", "7000"],
  ["Casuarina", "Casuarina Square, 247 Trower Road", "Casuarina", "NT", "0810"],
];

const ALDI_STORE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Broadway", "Broadway Shopping Centre, 1 Bay Street", "Ultimo", "NSW", "2007"],
  ["North Sydney", "99 Mount Street", "North Sydney", "NSW", "2060"],
  ["Chatswood", "Chatswood Chase, 345 Victoria Avenue", "Chatswood", "NSW", "2067"],
  ["Parramatta", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["Preston", "Northland Shopping Centre, 2-50 Murray Road", "Preston", "VIC", "3072"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Fortitude Valley", "Homemaker The Valley, 650 Wickham Street", "Fortitude Valley", "QLD", "4006"],
  ["Chermside", "Westfield Chermside, Gympie Road", "Chermside", "QLD", "4032"],
  ["Prospect", "85 Main North Road", "Prospect", "SA", "5082"],
  ["Belmont", "227 Belmont Avenue", "Cloverdale", "WA", "6105"],
  ["Majura Park", "18-26 Spitfire Avenue", "Majura Park", "ACT", "2609"],
];

const IGA_STORE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Thai Kee", "Market City, 9-13 Hay Street", "Haymarket", "NSW", "2000"],
  ["Lloyds South Hurstville", "7 Greenacre Road", "South Hurstville", "NSW", "2221"],
  ["Romeo's Food Hall", "MLC Centre, 19 Martin Place", "Sydney", "NSW", "2000"],
  ["Romeo's Bondi Beach", "116 Campbell Parade", "Bondi Beach", "NSW", "2026"],
  ["Supa IGA Pyrmont", "63 Miller Street", "Pyrmont", "NSW", "2009"],
  ["IGA Xpress Southbank", "89 City Road", "Southbank", "VIC", "3006"],
  ["Ritchies Balaclava", "295 Carlisle Street", "Balaclava", "VIC", "3183"],
  ["Milton", "36 Baroona Road", "Milton", "QLD", "4064"],
  ["East Brisbane", "33 Lytton Road", "East Brisbane", "QLD", "4169"],
  ["Goodwood", "135 Goodwood Road", "Goodwood", "SA", "5034"],
  ["Leederville", "313 Vincent Street", "Leederville", "WA", "6007"],
  ["Kingston", "29 Channel Highway", "Kingston", "TAS", "7050"],
];

const COSTCO_STORE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Auburn", "17-21 Parramatta Road", "Lidcombe", "NSW", "2141"],
  ["Marsden Park", "10 Langford Drive", "Marsden Park", "NSW", "2765"],
  ["Docklands", "381 Footscray Road", "Docklands", "VIC", "3008"],
  ["Moorabbin", "8 Chifley Drive", "Moorabbin Airport", "VIC", "3194"],
  ["Ringwood", "29 Bond Street", "Ringwood", "VIC", "3134"],
  ["North Lakes", "17-39 Cook Court", "North Lakes", "QLD", "4509"],
  ["Ipswich", "1 Wood Street", "Bundamba", "QLD", "4304"],
  ["Adelaide", "404-406 Churchill Road", "Kilburn", "SA", "5084"],
  ["Perth Airport", "142 Dunreath Drive", "Perth Airport", "WA", "6105"],
  ["Canberra", "39-41 Mustang Avenue", "Majura Park", "ACT", "2609"],
];

const HARRIS_FARM_STORE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Broadway", "Broadway Shopping Centre, 1 Bay Street", "Ultimo", "NSW", "2007"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Chatswood", "Chatswood Chase, 345 Victoria Avenue", "Chatswood", "NSW", "2067"],
  ["Drummoyne", "125 Victoria Road", "Drummoyne", "NSW", "2047"],
  ["Leichhardt", "Norton Plaza, 55 Norton Street", "Leichhardt", "NSW", "2040"],
  ["Manly", "242 Pittwater Road", "Manly", "NSW", "2095"],
  ["Mosman", "719 Military Road", "Mosman", "NSW", "2088"],
  ["Parramatta", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["Potts Point", "24-30 Springfield Avenue", "Potts Point", "NSW", "2011"],
  ["Randwick", "Royal Randwick Shopping Centre, 73 Belmore Road", "Randwick", "NSW", "2031"],
];

const FOODLAND_STORE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Frewville", "177 Glen Osmond Road", "Frewville", "SA", "5063"],
  ["Norwood", "161-169 The Parade", "Norwood", "SA", "5067"],
  ["Pasadena", "20 Fiveash Drive", "Pasadena", "SA", "5042"],
  ["Unley", "204 Unley Road", "Unley", "SA", "5061"],
  ["Munno Para", "600 Main North Road", "Smithfield", "SA", "5114"],
  ["Mount Gambier", "Commercial Street West", "Mount Gambier", "SA", "5290"],
];

const DRAKES_STORE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Wayville", "9-13 Goodwood Road", "Wayville", "SA", "5034"],
  ["Findon", "303 Grange Road", "Findon", "SA", "5023"],
  ["North Adelaide", "67 O'Connell Street", "North Adelaide", "SA", "5006"],
  ["Golden Grove", "The Grove Shopping Centre, The Golden Way", "Golden Grove", "SA", "5125"],
  ["McDowall", "97 Flockton Street", "McDowall", "QLD", "4053"],
  ["Rochedale", "Rochedale Village, 329 Gardner Road", "Rochedale", "QLD", "4123"],
  ["Pumicestone", "1 Ardrossan Road", "Caboolture", "QLD", "4510"],
];

const LIQUOR_CHAIN_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney CBD", "388 George Street", "Sydney", "NSW", "2000"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Parramatta", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["Melbourne CBD", "QV Melbourne, 210 Lonsdale Street", "Melbourne", "VIC", "3000"],
  ["Richmond", "282 Bridge Road", "Richmond", "VIC", "3121"],
  ["Brisbane CBD", "Queen Street Mall", "Brisbane City", "QLD", "4000"],
  ["Chermside", "Westfield Chermside, Gympie Road", "Chermside", "QLD", "4032"],
  ["Adelaide CBD", "Rundle Mall", "Adelaide", "SA", "5000"],
  ["Perth CBD", "Murray Street", "Perth", "WA", "6000"],
  ["Canberra", "Canberra Centre, Bunda Street", "Canberra", "ACT", "2601"],
  ["Hobart", "Elizabeth Street", "Hobart", "TAS", "7000"],
];

const GO_VITA_STORE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney CBD", "Pitt Street Mall", "Sydney", "NSW", "2000"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Chatswood", "Westfield Chatswood, 1 Anderson Street", "Chatswood", "NSW", "2067"],
  ["Melbourne CBD", "Melbourne Central, 211 La Trobe Street", "Melbourne", "VIC", "3000"],
  ["Brisbane CBD", "Queen Street Mall", "Brisbane City", "QLD", "4000"],
  ["Adelaide CBD", "Rundle Mall", "Adelaide", "SA", "5000"],
  ["Perth CBD", "Murray Street Mall", "Perth", "WA", "6000"],
];

const NUTRITION_WAREHOUSE_STORE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Alexandria", "35-39 Bourke Road", "Alexandria", "NSW", "2015"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Chatswood", "Westfield Chatswood, 1 Anderson Street", "Chatswood", "NSW", "2067"],
  ["Parramatta", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["Melbourne CBD", "Elizabeth Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Richmond", "Victoria Street", "Richmond", "VIC", "3121"],
  ["Brisbane CBD", "Queen Street Mall", "Brisbane City", "QLD", "4000"],
  ["Chermside", "Westfield Chermside, Gympie Road", "Chermside", "QLD", "4032"],
  ["Gold Coast", "Robina Town Centre Drive", "Robina", "QLD", "4226"],
  ["Adelaide CBD", "Rundle Mall", "Adelaide", "SA", "5000"],
  ["Perth CBD", "Murray Street Mall", "Perth", "WA", "6000"],
  ["Canberra", "Canberra Centre, Bunda Street", "Canberra", "ACT", "2601"],
];

const MR_VITAMINS_STORE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Chatswood", "Westfield Chatswood, 1 Anderson Street", "Chatswood", "NSW", "2067"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Parramatta", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["Sydney CBD", "Pitt Street Mall", "Sydney", "NSW", "2000"],
  ["Crows Nest", "Pacific Highway", "Crows Nest", "NSW", "2065"],
  ["Brookvale", "Warringah Mall, Condamine Street", "Brookvale", "NSW", "2100"],
];

const HEALTHY_LIFE_STORE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Healthylife online health store", "Sydney", "NSW", "2000"],
];

const IHERB_AUSTRALIA_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "iHerb Australia online store", "Sydney", "NSW", "2000"],
];

function discoverVitaminSupplementChainLocations(storeName: string, maxLocations: number) {
  if (/^Chemist Warehouse Vitamins$/i.test(storeName)) {
    return staticLocationResult("https://www.chemistwarehouse.com.au/store-locator", CHEMIST_WAREHOUSE_STORE_LOCATIONS, maxLocations);
  }
  if (/^Priceline Vitamins$/i.test(storeName)) {
    return staticLocationResult("https://www.priceline.com.au/store-finder/country/AU", PRICELINE_STORE_LOCATIONS, maxLocations);
  }
  if (/^Woolworths Health & Wellness Specials$/i.test(storeName)) {
    return staticLocationResult("https://www.woolworths.com.au/shop/storelocator", WOOLWORTHS_STORE_LOCATIONS, maxLocations);
  }
  if (/^Coles Vitamins & Health Specials$/i.test(storeName)) {
    return staticLocationResult("https://www.coles.com.au/stores", COLES_STORE_LOCATIONS, maxLocations);
  }
  if (/^Nutrition Warehouse$/i.test(storeName)) {
    return staticLocationResult("https://www.nutritionwarehouse.com.au/pages/store-locator", NUTRITION_WAREHOUSE_STORE_LOCATIONS, maxLocations);
  }
  if (/^Go Vita Australia$/i.test(storeName)) {
    return staticLocationResult("https://govita.com.au/pages/store-locator", GO_VITA_STORE_LOCATIONS, maxLocations);
  }
  if (/^Mr Vitamins$/i.test(storeName)) {
    return staticLocationResult("https://www.mrvitamins.com.au/pages/stores", MR_VITAMINS_STORE_LOCATIONS, maxLocations);
  }
  if (/^Healthy Life Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.healthylife.com.au/", HEALTHY_LIFE_STORE_LOCATIONS, maxLocations);
  }
  if (/^iHerb Australia$/i.test(storeName)) {
    return staticLocationResult("https://au.iherb.com/", IHERB_AUSTRALIA_LOCATIONS, maxLocations);
  }

  return null;
}

const VITAMIN_SUPPLEMENT_CHAIN_PARENT_NAMES = [
  "Chemist Warehouse Vitamins",
  "Coles Vitamins & Health Specials",
  "Go Vita Australia",
  "Healthy Life Australia",
  "iHerb Australia",
  "Mr Vitamins",
  "Nutrition Warehouse",
  "Priceline Vitamins",
  "Woolworths Health & Wellness Specials",
];

const TOYWORLD_STORE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Pitt Street Mall", "Sydney", "NSW", "2000"],
  ["Chatswood", "Westfield Chatswood, 1 Anderson Street", "Chatswood", "NSW", "2067"],
  ["Parramatta", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["Miranda", "Westfield Miranda, 600 Kingsway", "Miranda", "NSW", "2228"],
  ["Melbourne", "Melbourne Central, 211 La Trobe Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Doncaster", "Westfield Doncaster, 619 Doncaster Road", "Doncaster", "VIC", "3108"],
  ["Brisbane", "Queen Street Mall", "Brisbane City", "QLD", "4000"],
  ["Chermside", "Westfield Chermside, Gympie Road", "Chermside", "QLD", "4032"],
  ["Adelaide", "Rundle Mall", "Adelaide", "SA", "5000"],
  ["Perth", "Hay Street Mall", "Perth", "WA", "6000"],
  ["Canberra", "Canberra Centre, Bunda Street", "Canberra", "ACT", "2601"],
  ["Hobart", "Elizabeth Street", "Hobart", "TAS", "7000"],
];

const TARGET_TOYS_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Broadway Shopping Centre, 1 Bay Street", "Ultimo", "NSW", "2007"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Parramatta", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["Miranda", "Westfield Miranda, 600 Kingsway", "Miranda", "NSW", "2228"],
  ["Melbourne", "Bourke Street Mall", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Doncaster", "Westfield Doncaster, 619 Doncaster Road", "Doncaster", "VIC", "3108"],
  ["Brisbane", "Queen Street Mall", "Brisbane City", "QLD", "4000"],
  ["Chermside", "Westfield Chermside, Gympie Road", "Chermside", "QLD", "4032"],
  ["Adelaide", "Rundle Mall", "Adelaide", "SA", "5000"],
  ["Perth", "Hay Street Mall", "Perth", "WA", "6000"],
  ["Canberra", "Canberra Centre, Bunda Street", "Canberra", "ACT", "2601"],
];

const LEGO_STORE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Chatswood", "Westfield Chatswood, 1 Anderson Street", "Chatswood", "NSW", "2067"],
  ["Parramatta", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Doncaster", "Westfield Doncaster, 619 Doncaster Road", "Doncaster", "VIC", "3108"],
  ["Brisbane", "Queen Street Mall", "Brisbane City", "QLD", "4000"],
  ["Chermside", "Westfield Chermside, Gympie Road", "Chermside", "QLD", "4032"],
  ["Adelaide", "Rundle Mall", "Adelaide", "SA", "5000"],
  ["Perth", "Karrinyup Shopping Centre, 200 Karrinyup Road", "Karrinyup", "WA", "6018"],
];

const TOYMATE_STORE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Chatswood", "Westfield Chatswood, 1 Anderson Street", "Chatswood", "NSW", "2067"],
  ["Parramatta", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["Blacktown", "Westpoint Shopping Centre, 17 Patrick Street", "Blacktown", "NSW", "2148"],
  ["Bankstown", "Bankstown Central, Stacey Street", "Bankstown", "NSW", "2200"],
  ["Penrith", "Westfield Penrith, 585 High Street", "Penrith", "NSW", "2750"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Highpoint", "Highpoint Shopping Centre, 120-200 Rosamond Road", "Maribyrnong", "VIC", "3032"],
  ["Chermside", "Westfield Chermside, Gympie Road", "Chermside", "QLD", "4032"],
  ["Garden City", "Westfield Mt Gravatt, Kessels Road", "Upper Mount Gravatt", "QLD", "4122"],
  ["Adelaide", "Rundle Mall", "Adelaide", "SA", "5000"],
];

const KIDSTUFF_STORE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Balmain", "Darling Street", "Balmain", "NSW", "2041"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Chatswood", "Chatswood Chase, 345 Victoria Avenue", "Chatswood", "NSW", "2067"],
  ["Mosman", "Military Road", "Mosman", "NSW", "2088"],
  ["Parramatta", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["Melbourne", "Melbourne Central, 211 La Trobe Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Brisbane", "Queen Street Mall", "Brisbane City", "QLD", "4000"],
  ["Adelaide", "Rundle Mall", "Adelaide", "SA", "5000"],
];

const TOYS_ONLINE_AUSTRALIA_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Australian online toy store", "Sydney", "NSW", "2000"],
];

function discoverTrendingToysChainLocations(storeName: string, maxLocations: number) {
  if (/^Toyworld Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.toyworld.com.au/pages/store-locator", TOYWORLD_STORE_LOCATIONS, maxLocations);
  }
  if (/^BIG W Toys$/i.test(storeName)) {
    return staticLocationResult("https://www.bigw.com.au/store-finder", BIG_W_STATIONERY_LOCATIONS, maxLocations);
  }
  if (/^Kmart Toys$/i.test(storeName)) {
    return staticLocationResult("https://www.kmart.com.au/store-finder/", KMART_OFFICE_LOCATIONS, maxLocations);
  }
  if (/^Target Australia Toys$/i.test(storeName)) {
    return staticLocationResult("https://www.target.com.au/store-finder", TARGET_TOYS_LOCATIONS, maxLocations);
  }
  if (/^LEGO Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.lego.com/en-au/stores", LEGO_STORE_LOCATIONS, maxLocations);
  }
  if (/^Toymate Australia$/i.test(storeName)) {
    return staticLocationResult("https://toymate.com.au/pages/store-locator", TOYMATE_STORE_LOCATIONS, maxLocations);
  }
  if (/^Kidstuff Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.kidstuff.com.au/pages/store-locator", KIDSTUFF_STORE_LOCATIONS, maxLocations);
  }
  if (/^Amazon Australia Toys$|^Toys R Us Australia$|^Robotime Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.google.com/search?q=online+toy+store+Australia", TOYS_ONLINE_AUSTRALIA_LOCATIONS, maxLocations);
  }

  return null;
}

const TRENDING_TOYS_CHAIN_PARENT_NAMES = [
  "Amazon Australia Toys",
  "BIG W Toys",
  "Kidstuff Australia",
  "Kmart Toys",
  "LEGO Australia",
  "Robotime Australia",
  "Target Australia Toys",
  "Toymate Australia",
  "Toys R Us Australia",
  "Toyworld Australia",
];

const HOBBIES_CLASSES_METRO_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Sydney CBD", "Sydney", "NSW", "2000"],
  ["Chatswood", "Victoria Avenue", "Chatswood", "NSW", "2067"],
  ["Parramatta", "Church Street", "Parramatta", "NSW", "2150"],
  ["Hurstville", "Forest Road", "Hurstville", "NSW", "2220"],
  ["Melbourne", "Melbourne CBD", "Melbourne", "VIC", "3000"],
  ["Brisbane", "Brisbane CBD", "Brisbane City", "QLD", "4000"],
  ["Adelaide", "Adelaide CBD", "Adelaide", "SA", "5000"],
  ["Perth", "Perth CBD", "Perth", "WA", "6000"],
  ["Canberra", "Canberra CBD", "Canberra", "ACT", "2601"],
];

const KUMON_CENTRE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Chatswood", "Victoria Avenue", "Chatswood", "NSW", "2067"],
  ["Hurstville", "Forest Road", "Hurstville", "NSW", "2220"],
  ["Parramatta", "Church Street", "Parramatta", "NSW", "2150"],
  ["Castle Hill", "Old Northern Road", "Castle Hill", "NSW", "2154"],
  ["Burwood", "Burwood Road", "Burwood", "NSW", "2134"],
  ["Melbourne", "Melbourne CBD", "Melbourne", "VIC", "3000"],
  ["Box Hill", "Whitehorse Road", "Box Hill", "VIC", "3128"],
  ["Glen Waverley", "Kingsway", "Glen Waverley", "VIC", "3150"],
  ["Brisbane", "Brisbane CBD", "Brisbane City", "QLD", "4000"],
  ["Sunnybank", "Mains Road", "Sunnybank", "QLD", "4109"],
  ["Adelaide", "Adelaide CBD", "Adelaide", "SA", "5000"],
  ["Perth", "Perth CBD", "Perth", "WA", "6000"],
  ["Canberra", "Canberra CBD", "Canberra", "ACT", "2601"],
];

const MATRIX_EDUCATION_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Chatswood", "Victoria Avenue", "Chatswood", "NSW", "2067"],
  ["Parramatta", "Church Street", "Parramatta", "NSW", "2150"],
  ["Hurstville", "Forest Road", "Hurstville", "NSW", "2220"],
  ["Strathfield", "The Boulevarde", "Strathfield", "NSW", "2135"],
  ["Sydney CBD", "George Street", "Sydney", "NSW", "2000"],
  ["Epping", "Beecroft Road", "Epping", "NSW", "2121"],
];

const DYMOCKS_TUTORING_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Hurstville", "Forest Road", "Hurstville", "NSW", "2220"],
  ["Chatswood", "Victoria Avenue", "Chatswood", "NSW", "2067"],
  ["Parramatta", "Church Street", "Parramatta", "NSW", "2150"],
  ["Sydney CBD", "George Street", "Sydney", "NSW", "2000"],
];

const CARLILE_SWIMMING_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Ryde", "Victoria Road", "Ryde", "NSW", "2112"],
  ["Chatswood", "Victoria Avenue", "Chatswood", "NSW", "2067"],
  ["Castle Hill", "Old Northern Road", "Castle Hill", "NSW", "2154"],
  ["Carlingford", "Pennant Hills Road", "Carlingford", "NSW", "2118"],
  ["Norwest", "Norwest Boulevard", "Baulkham Hills", "NSW", "2153"],
  ["Killarney Heights", "Starkey Street", "Killarney Heights", "NSW", "2087"],
];

const JUMP_SWIM_SCHOOL_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Seven Hills", "Prospect Highway", "Seven Hills", "NSW", "2147"],
  ["Blacktown", "Main Street", "Blacktown", "NSW", "2148"],
  ["Liverpool", "Macquarie Street", "Liverpool", "NSW", "2170"],
  ["Preston", "High Street", "Preston", "VIC", "3072"],
  ["Brisbane", "Brisbane CBD", "Brisbane City", "QLD", "4000"],
  ["Perth", "Perth CBD", "Perth", "WA", "6000"],
];

const CLIMB_FIT_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["St Leonards", "Unit 4, 12 Frederick Street", "St Leonards", "NSW", "2065"],
  ["Kirrawee", "Waratah Street", "Kirrawee", "NSW", "2232"],
  ["Macquarie Park", "Talavera Road", "Macquarie Park", "NSW", "2113"],
];

const NINE_DEGREES_BOULDERING_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Alexandria", "O'Riordan Street", "Alexandria", "NSW", "2015"],
  ["Waterloo", "Bourke Street", "Waterloo", "NSW", "2017"],
  ["Parramatta", "George Street", "Parramatta", "NSW", "2150"],
  ["Lane Cove", "Pacific Highway", "Lane Cove", "NSW", "2066"],
  ["Melbourne", "Swanston Street", "Melbourne", "VIC", "3000"],
  ["Brisbane", "Brisbane CBD", "Brisbane City", "QLD", "4000"],
];

const UFC_GYM_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Parramatta", "Church Street", "Parramatta", "NSW", "2150"],
  ["Rockdale", "Princes Highway", "Rockdale", "NSW", "2216"],
  ["Bankstown", "Stacey Street", "Bankstown", "NSW", "2200"],
  ["Melbourne", "Melbourne CBD", "Melbourne", "VIC", "3000"],
  ["Brisbane", "Brisbane CBD", "Brisbane City", "QLD", "4000"],
];

const SYDNEY_DANCE_COMPANY_CLASS_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Walsh Bay", "15 Hickson Road", "Dawes Point", "NSW", "2000"],
];

const CLASSBENTO_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Sydney class marketplace", "Sydney", "NSW", "2000"],
  ["Melbourne", "Melbourne class marketplace", "Melbourne", "VIC", "3000"],
  ["Brisbane", "Brisbane class marketplace", "Brisbane City", "QLD", "4000"],
  ["Perth", "Perth class marketplace", "Perth", "WA", "6000"],
  ["Adelaide", "Adelaide class marketplace", "Adelaide", "SA", "5000"],
];

function discoverHobbiesClassesChainLocations(storeName: string, maxLocations: number) {
  if (/^Kumon Australia Sydney Centres$|^Kumon Chatswood$/i.test(storeName)) {
    return staticLocationResult("https://au.kumonglobal.com/find-a-centre/", KUMON_CENTRE_LOCATIONS, maxLocations);
  }
  if (/^Matrix Education/i.test(storeName)) {
    return staticLocationResult("https://www.matrix.edu.au/locations/", MATRIX_EDUCATION_LOCATIONS, maxLocations);
  }
  if (/^Dymocks Tutoring/i.test(storeName)) {
    return staticLocationResult("https://www.dymockstutoring.edu.au/locations/", DYMOCKS_TUTORING_LOCATIONS, maxLocations);
  }
  if (/^Carlile Swimming/i.test(storeName)) {
    return staticLocationResult("https://www.carlile.com.au/locations/", CARLILE_SWIMMING_LOCATIONS, maxLocations);
  }
  if (/^JUMP Swim Schools/i.test(storeName)) {
    return staticLocationResult("https://jumpswimschools.com.au/locations/", JUMP_SWIM_SCHOOL_LOCATIONS, maxLocations);
  }
  if (/^Climb Fit/i.test(storeName)) {
    return staticLocationResult("https://www.climbfit.com.au/locations/", CLIMB_FIT_LOCATIONS, maxLocations);
  }
  if (/^9 Degrees/i.test(storeName)) {
    return staticLocationResult("https://www.9degrees.com.au/locations", NINE_DEGREES_BOULDERING_LOCATIONS, maxLocations);
  }
  if (/^UFC Gym/i.test(storeName)) {
    return staticLocationResult("https://www.ufcgym.com.au/locations/", UFC_GYM_LOCATIONS, maxLocations);
  }
  if (/^Sydney Dance Company Classes/i.test(storeName)) {
    return staticLocationResult("https://www.sydneydancecompany.com/classes/", SYDNEY_DANCE_COMPANY_CLASS_LOCATIONS, maxLocations);
  }
  if (/^ClassBento|^WeTeachMe/i.test(storeName)) {
    return staticLocationResult("https://classbento.com.au/", CLASSBENTO_LOCATIONS, maxLocations);
  }
  if (/^JAI Martial Arts|^Australian Taekwondo Centre/i.test(storeName)) {
    return staticLocationResult("https://www.google.com/search?q=martial+arts+classes+Australia", HOBBIES_CLASSES_METRO_LOCATIONS, maxLocations);
  }

  return null;
}

const HOBBIES_CLASSES_CHAIN_PARENT_NAMES = [
  "9 Degrees Alexandria Bouldering",
  "Carlile Swimming Ryde",
  "ClassBento Sydney",
  "Climb Fit St Leonards",
  "Dymocks Tutoring Hurstville",
  "JUMP Swim Schools Seven Hills",
  "Kumon Australia Sydney Centres",
  "Matrix Education Chatswood",
  "Sydney Dance Company Classes",
  "UFC Gym Parramatta Boxing",
  "WeTeachMe Australia",
];

const TRAVEL_AIRPORT_HUB_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney Airport", "Sydney Airport, Airport Drive", "Mascot", "NSW", "2020"],
  ["Melbourne Airport", "Melbourne Airport, Departure Drive", "Melbourne Airport", "VIC", "3045"],
  ["Brisbane Airport", "Brisbane Airport, Airport Drive", "Brisbane Airport", "QLD", "4008"],
  ["Perth Airport", "Perth Airport, Airport Drive", "Perth Airport", "WA", "6105"],
  ["Adelaide Airport", "Adelaide Airport, Sir Richard Williams Avenue", "Adelaide Airport", "SA", "5950"],
  ["Canberra Airport", "Canberra Airport, Terminal Circuit", "Canberra Airport", "ACT", "2609"],
  ["Gold Coast Airport", "Gold Coast Airport, Terminal Drive", "Bilinga", "QLD", "4225"],
  ["Cairns Airport", "Cairns Airport, Airport Avenue", "Cairns", "QLD", "4870"],
  ["Hobart Airport", "Hobart Airport, Strachan Street", "Cambridge", "TAS", "7170"],
  ["Darwin Airport", "Darwin International Airport, Henry Wrigley Drive", "Eaton", "NT", "0820"],
];

const FLIGHT_CENTRE_STORE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "George Street", "Sydney", "NSW", "2000"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Chatswood", "Westfield Chatswood, 1 Anderson Street", "Chatswood", "NSW", "2067"],
  ["Parramatta", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["Miranda", "Westfield Miranda, 600 Kingsway", "Miranda", "NSW", "2228"],
  ["Melbourne", "Elizabeth Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Brisbane", "Queen Street Mall", "Brisbane City", "QLD", "4000"],
  ["Chermside", "Westfield Chermside, Gympie Road", "Chermside", "QLD", "4032"],
  ["Adelaide", "Rundle Mall", "Adelaide", "SA", "5000"],
  ["Perth", "Hay Street Mall", "Perth", "WA", "6000"],
  ["Canberra", "Canberra Centre, Bunda Street", "Canberra", "ACT", "2601"],
];

const ACCOR_AUSTRALIA_HOTEL_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney CBD", "Darling Harbour", "Sydney", "NSW", "2000"],
  ["Sydney Airport", "Sydney Airport precinct", "Mascot", "NSW", "2020"],
  ["Parramatta", "Church Street", "Parramatta", "NSW", "2150"],
  ["Melbourne CBD", "Collins Street", "Melbourne", "VIC", "3000"],
  ["Southbank", "Southbank Promenade", "Southbank", "VIC", "3006"],
  ["Brisbane CBD", "Queen Street", "Brisbane City", "QLD", "4000"],
  ["Gold Coast", "Surfers Paradise Boulevard", "Surfers Paradise", "QLD", "4217"],
  ["Cairns", "Esplanade", "Cairns", "QLD", "4870"],
  ["Adelaide", "North Terrace", "Adelaide", "SA", "5000"],
  ["Perth", "Murray Street", "Perth", "WA", "6000"],
  ["Canberra", "Northbourne Avenue", "Canberra", "ACT", "2601"],
  ["Hobart", "Macquarie Street", "Hobart", "TAS", "7000"],
  ["Darwin", "Mitchell Street", "Darwin City", "NT", "0800"],
];

const IHG_AUSTRALIA_HOTEL_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Macquarie Street", "Sydney", "NSW", "2000"],
  ["Double Bay", "Cross Street", "Double Bay", "NSW", "2028"],
  ["Melbourne", "Collins Street", "Melbourne", "VIC", "3000"],
  ["Melbourne Airport", "Melbourne Airport precinct", "Melbourne Airport", "VIC", "3045"],
  ["Brisbane", "Queen Street", "Brisbane City", "QLD", "4000"],
  ["Gold Coast", "Surfers Paradise Boulevard", "Surfers Paradise", "QLD", "4217"],
  ["Adelaide", "Hindley Street", "Adelaide", "SA", "5000"],
  ["Perth", "Hay Street", "Perth", "WA", "6000"],
  ["Canberra", "National Circuit", "Barton", "ACT", "2600"],
  ["Hobart", "Macquarie Street", "Hobart", "TAS", "7000"],
];

const ONLINE_TRAVEL_MARKETPLACE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Australian online travel marketplace", "Sydney", "NSW", "2000"],
  ["Melbourne", "Australian online travel marketplace", "Melbourne", "VIC", "3000"],
  ["Brisbane", "Australian online travel marketplace", "Brisbane City", "QLD", "4000"],
  ["Adelaide", "Australian online travel marketplace", "Adelaide", "SA", "5000"],
  ["Perth", "Australian online travel marketplace", "Perth", "WA", "6000"],
];

function discoverTravelAccommodationChainLocations(storeName: string, maxLocations: number) {
  if (/^Flight Centre Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.flightcentre.com.au/stores", FLIGHT_CENTRE_STORE_LOCATIONS, maxLocations);
  }
  if (/^Accor Australia Offers$/i.test(storeName)) {
    return staticLocationResult("https://all.accor.com/a/en.html", ACCOR_AUSTRALIA_HOTEL_LOCATIONS, maxLocations);
  }
  if (/^IHG Australia Offers$/i.test(storeName)) {
    return staticLocationResult("https://www.ihg.com/hotels/gb/en/reservation", IHG_AUSTRALIA_HOTEL_LOCATIONS, maxLocations);
  }
  if (/^Jetstar Holidays$|^Virgin Australia Holidays$|^Qantas Holidays$|^Singapore Airlines Australia$|^Emirates Australia$|^Qatar Airways Australia$|^Etihad Airways Australia$|^Cathay Pacific Australia$|^Thai Airways Australia$|^Air New Zealand Australia$|^United Airlines Australia$|^Korean Air Australia$|^Japan Airlines Australia$|^ANA Australia$|^Malaysia Airlines Australia$|^Fiji Airways Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.google.com/search?q=Australia+airport+airline+deals", TRAVEL_AIRPORT_HUB_LOCATIONS, maxLocations);
  }
  if (/^Webjet Australia$|^Wotif Australia$|^Expedia Australia$|^Luxury Escapes Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.google.com/search?q=Australia+online+travel+deals", ONLINE_TRAVEL_MARKETPLACE_LOCATIONS, maxLocations);
  }

  return null;
}

const TRAVEL_ACCOMMODATION_CHAIN_PARENT_NAMES = [
  "ANA Australia",
  "Accor Australia Offers",
  "Air New Zealand Australia",
  "Cathay Pacific Australia",
  "Emirates Australia",
  "Etihad Airways Australia",
  "Expedia Australia",
  "Fiji Airways Australia",
  "Flight Centre Australia",
  "IHG Australia Offers",
  "Japan Airlines Australia",
  "Jetstar Holidays",
  "Korean Air Australia",
  "Luxury Escapes Australia",
  "Malaysia Airlines Australia",
  "Qantas Holidays",
  "Qatar Airways Australia",
  "Singapore Airlines Australia",
  "Thai Airways Australia",
  "United Airlines Australia",
  "Virgin Australia Holidays",
  "Webjet Australia",
  "Wotif Australia",
];

const EB_GAMES_STORE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Westfield Sydney, 188 Pitt Street", "Sydney", "NSW", "2000"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Chatswood", "Westfield Chatswood, 1 Anderson Street", "Chatswood", "NSW", "2067"],
  ["Parramatta", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["Hurstville", "Westfield Hurstville, Park Road", "Hurstville", "NSW", "2220"],
  ["Miranda", "Westfield Miranda, 600 Kingsway", "Miranda", "NSW", "2228"],
  ["Melbourne", "Melbourne Central, 211 La Trobe Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Highpoint", "Highpoint Shopping Centre, 120-200 Rosamond Road", "Maribyrnong", "VIC", "3032"],
  ["Brisbane", "Queen Street Mall", "Brisbane City", "QLD", "4000"],
  ["Chermside", "Westfield Chermside, Gympie Road", "Chermside", "QLD", "4032"],
  ["Robina", "Robina Town Centre Drive", "Robina", "QLD", "4226"],
  ["Adelaide", "Rundle Mall", "Adelaide", "SA", "5000"],
  ["Perth", "Hay Street Mall", "Perth", "WA", "6000"],
  ["Canberra", "Canberra Centre, Bunda Street", "Canberra", "ACT", "2601"],
  ["Hobart", "Elizabeth Street", "Hobart", "TAS", "7000"],
  ["Darwin", "Casuarina Square, 247 Trower Road", "Casuarina", "NT", "0810"],
];

const JB_HIFI_GAMES_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Westfield Sydney, 188 Pitt Street", "Sydney", "NSW", "2000"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Chatswood", "Westfield Chatswood, 1 Anderson Street", "Chatswood", "NSW", "2067"],
  ["Parramatta", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["Hurstville", "Westfield Hurstville, Park Road", "Hurstville", "NSW", "2220"],
  ["Miranda", "Westfield Miranda, 600 Kingsway", "Miranda", "NSW", "2228"],
  ["Melbourne", "Melbourne Central, 211 La Trobe Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Doncaster", "Westfield Doncaster, 619 Doncaster Road", "Doncaster", "VIC", "3108"],
  ["Brisbane", "Queen Street Mall", "Brisbane City", "QLD", "4000"],
  ["Chermside", "Westfield Chermside, Gympie Road", "Chermside", "QLD", "4032"],
  ["Adelaide", "Rundle Mall", "Adelaide", "SA", "5000"],
  ["Perth", "Murray Street Mall", "Perth", "WA", "6000"],
  ["Canberra", "Canberra Centre, Bunda Street", "Canberra", "ACT", "2601"],
  ["Hobart", "Elizabeth Street", "Hobart", "TAS", "7000"],
];

const GAMESMEN_STORE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Penshurst", "491 Forest Road", "Penshurst", "NSW", "2222"],
];

const ONLINE_GAMES_AUSTRALIA_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Australian online games store", "Sydney", "NSW", "2000"],
];

function discoverGamesChainLocations(storeName: string, maxLocations: number) {
  if (/^EB Games Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.ebgames.com.au/store-finder", EB_GAMES_STORE_LOCATIONS, maxLocations);
  }
  if (/^JB Hi-Fi Games$/i.test(storeName)) {
    return staticLocationResult("https://www.jbhifi.com.au/pages/store-finder", JB_HIFI_GAMES_LOCATIONS, maxLocations);
  }
  if (/^The Gamesmen$/i.test(storeName)) {
    return staticLocationResult("https://www.gamesmen.com.au/contact-us", GAMESMEN_STORE_LOCATIONS, maxLocations);
  }
  if (/^PlayStation Store Australia Deals$|^Xbox Australia Deals$|^Nintendo Store Australia$|^Steam Australia Specials$|^Mighty Ape Australia Games$/i.test(storeName)) {
    return staticLocationResult("https://www.google.com/search?q=Australia+online+games+deals", ONLINE_GAMES_AUSTRALIA_LOCATIONS, maxLocations);
  }

  return null;
}

const GAMES_CHAIN_PARENT_NAMES = [
  "EB Games Australia",
  "JB Hi-Fi Games",
  "Mighty Ape Australia Games",
  "Nintendo Store Australia",
  "PlayStation Store Australia Deals",
  "Steam Australia Specials",
  "The Gamesmen",
  "Xbox Australia Deals",
];

const FINANCIAL_SERVICES_MARKETPLACE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Australian online financial services marketplace", "Sydney", "NSW", "2000"],
  ["Melbourne", "Australian online financial services marketplace", "Melbourne", "VIC", "3000"],
  ["Brisbane", "Australian online financial services marketplace", "Brisbane City", "QLD", "4000"],
  ["Adelaide", "Australian online financial services marketplace", "Adelaide", "SA", "5000"],
  ["Perth", "Australian online financial services marketplace", "Perth", "WA", "6000"],
];

const FINDER_FINANCIAL_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Sydney CBD", "Sydney", "NSW", "2000"],
  ["Melbourne", "Melbourne CBD", "Melbourne", "VIC", "3000"],
  ["Brisbane", "Brisbane CBD", "Brisbane City", "QLD", "4000"],
];

const CANSTAR_FINANCIAL_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Brisbane", "Brisbane CBD", "Brisbane City", "QLD", "4000"],
  ["Sydney", "Sydney CBD", "Sydney", "NSW", "2000"],
  ["Melbourne", "Melbourne CBD", "Melbourne", "VIC", "3000"],
];

const COMPARE_MARKET_FINANCIAL_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Brisbane", "High Street", "Toowong", "QLD", "4066"],
  ["Sydney", "Sydney CBD", "Sydney", "NSW", "2000"],
  ["Melbourne", "Melbourne CBD", "Melbourne", "VIC", "3000"],
];

const ISELECT_FINANCIAL_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Melbourne", "Melbourne CBD", "Melbourne", "VIC", "3000"],
  ["Sydney", "Sydney CBD", "Sydney", "NSW", "2000"],
  ["Brisbane", "Brisbane CBD", "Brisbane City", "QLD", "4000"],
];

const MONEYME_FINANCIAL_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Sydney CBD", "Sydney", "NSW", "2000"],
];

const SAVVY_FINANCIAL_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Adelaide", "Adelaide CBD", "Adelaide", "SA", "5000"],
  ["Sydney", "Sydney CBD", "Sydney", "NSW", "2000"],
  ["Melbourne", "Melbourne CBD", "Melbourne", "VIC", "3000"],
];

const MARKETPAL_SERVICE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Mascot", "177/635 Gardeners Road", "Mascot", "NSW", "2020"],
];

function discoverFinancialServicesChainLocations(storeName: string, maxLocations: number) {
  if (/^Finder Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.finder.com.au/", FINDER_FINANCIAL_LOCATIONS, maxLocations);
  }
  if (/^Canstar Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.canstar.com.au/", CANSTAR_FINANCIAL_LOCATIONS, maxLocations);
  }
  if (/^Compare the Market Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.comparethemarket.com.au/", COMPARE_MARKET_FINANCIAL_LOCATIONS, maxLocations);
  }
  if (/^iSelect Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.iselect.com.au/", ISELECT_FINANCIAL_LOCATIONS, maxLocations);
  }
  if (/^MoneyMe$/i.test(storeName)) {
    return staticLocationResult("https://moneyme.com.au/", MONEYME_FINANCIAL_LOCATIONS, maxLocations);
  }
  if (/^Savvy Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.savvy.com.au/", SAVVY_FINANCIAL_LOCATIONS, maxLocations);
  }
  if (/^Marketpal\.AI$/i.test(storeName)) {
    return staticLocationResult("https://www.marketpal.ai/", MARKETPAL_SERVICE_LOCATIONS, maxLocations);
  }
  if (/^RateCity Australia$|^Mozo Australia$|^InfoChoice Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.google.com/search?q=Australia+online+financial+comparison+services", FINANCIAL_SERVICES_MARKETPLACE_LOCATIONS, maxLocations);
  }

  return null;
}

const FINANCIAL_SERVICES_CHAIN_PARENT_NAMES = [
  "Canstar Australia",
  "Compare the Market Australia",
  "Finder Australia",
  "InfoChoice Australia",
  "Marketpal.AI",
  "MoneyMe",
  "Mozo Australia",
  "RateCity Australia",
  "Savvy Australia",
  "iSelect Australia",
];

const EVENT_CINEMAS_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "505-525 George Street", "Sydney", "NSW", "2000"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Chatswood", "Westfield Chatswood, 1 Anderson Street", "Chatswood", "NSW", "2067"],
  ["Parramatta", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["Hurstville", "Westfield Hurstville, Park Road", "Hurstville", "NSW", "2220"],
  ["Miranda", "Westfield Miranda, 600 Kingsway", "Miranda", "NSW", "2228"],
  ["Melbourne", "Melbourne Central, 211 La Trobe Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Brisbane", "Myer Centre, 91 Queen Street", "Brisbane City", "QLD", "4000"],
  ["Chermside", "Westfield Chermside, Gympie Road", "Chermside", "QLD", "4032"],
  ["Gold Coast", "Pacific Fair Shopping Centre, Hooker Boulevard", "Broadbeach", "QLD", "4218"],
  ["Adelaide", "Rundle Mall", "Adelaide", "SA", "5000"],
  ["Perth", "Innaloo Megaplex, Ellen Stirling Boulevard", "Innaloo", "WA", "6018"],
  ["Canberra", "Manuka Circle", "Manuka", "ACT", "2603"],
  ["Hobart", "Elizabeth Street", "Hobart", "TAS", "7000"],
];

const HOYTS_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Broadway", "Broadway Shopping Centre, 1 Bay Street", "Ultimo", "NSW", "2007"],
  ["Chatswood", "Westfield Chatswood, 1 Anderson Street", "Chatswood", "NSW", "2067"],
  ["Bankstown", "Bankstown Central, Stacey Street", "Bankstown", "NSW", "2200"],
  ["Penrith", "Westfield Penrith, 585 High Street", "Penrith", "NSW", "2750"],
  ["Melbourne Central", "Melbourne Central, 211 La Trobe Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Highpoint", "Highpoint Shopping Centre, 120-200 Rosamond Road", "Maribyrnong", "VIC", "3032"],
  ["Sunnybank", "Sunnybank Plaza, Mains Road", "Sunnybank", "QLD", "4109"],
  ["Stafford", "Stafford City Shopping Centre, Stafford Road", "Stafford", "QLD", "4053"],
  ["Tea Tree Plaza", "Westfield Tea Tree Plaza, 976 North East Road", "Modbury", "SA", "5092"],
  ["Carousel", "Westfield Carousel, 1382 Albany Highway", "Cannington", "WA", "6107"],
];

const PALACE_CINEMAS_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Norton Street", "99 Norton Street", "Leichhardt", "NSW", "2040"],
  ["Central", "Central Park Mall, 28 Broadway", "Chippendale", "NSW", "2008"],
  ["Paddington", "Oxford Street", "Paddington", "NSW", "2021"],
  ["Como", "Chapel Street", "South Yarra", "VIC", "3141"],
  ["Balwyn", "Whitehorse Road", "Balwyn", "VIC", "3103"],
  ["Brighton Bay", "Bay Street", "Brighton", "VIC", "3186"],
  ["James Street", "James Street", "Fortitude Valley", "QLD", "4006"],
  ["Barracks", "Petrie Terrace", "Brisbane City", "QLD", "4000"],
  ["Nova Eastend", "Rundle Street", "Adelaide", "SA", "5000"],
  ["Luna Leederville", "Oxford Street", "Leederville", "WA", "6007"],
];

const ENTERTAINMENT_TICKETING_MARKETPLACE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Australian event ticketing marketplace", "Sydney", "NSW", "2000"],
  ["Melbourne", "Australian event ticketing marketplace", "Melbourne", "VIC", "3000"],
  ["Brisbane", "Australian event ticketing marketplace", "Brisbane City", "QLD", "4000"],
  ["Adelaide", "Australian event ticketing marketplace", "Adelaide", "SA", "5000"],
  ["Perth", "Australian event ticketing marketplace", "Perth", "WA", "6000"],
];

const ENTERTAINMENT_SINGLE_VENUE_LOCATIONS: Record<string, { indexUrl: string; rows: Array<[string, string, string, string, string]> }> = {
  "Sydney Opera House": {
    indexUrl: "https://www.sydneyoperahouse.com/",
    rows: [["Bennelong Point", "Bennelong Point", "Sydney", "NSW", "2000"]],
  },
  "Opera Australia Special Offers": {
    indexUrl: "https://opera.org.au/",
    rows: [["Sydney Opera House", "Bennelong Point", "Sydney", "NSW", "2000"]],
  },
  "ICC Sydney": {
    indexUrl: "https://iccsydney.com.au/",
    rows: [["Darling Harbour", "14 Darling Drive", "Sydney", "NSW", "2000"]],
  },
  "Comedy Store Sydney Moore Park": {
    indexUrl: "https://www.comedystore.com.au/",
    rows: [["Moore Park", "122 Lang Road", "Moore Park", "NSW", "2021"]],
  },
  "Happy Endings Comedy Club Sydney CBD": {
    indexUrl: "https://happyendingscomedyclub.com.au/",
    rows: [["Sydney CBD", "154 Brougham Street", "Potts Point", "NSW", "2011"]],
  },
  "Metro Theatre Sydney Comedy and Music": {
    indexUrl: "https://www.metrotheatre.com.au/",
    rows: [["Sydney CBD", "624 George Street", "Sydney", "NSW", "2000"]],
  },
  "Level One Potts Point": {
    indexUrl: "https://levelonesydney.com.au/",
    rows: [["Potts Point", "1 Kellett Street", "Potts Point", "NSW", "2011"]],
  },
  "Enmore Theatre Enmore": {
    indexUrl: "https://www.enmoretheatre.com.au/",
    rows: [["Enmore", "118-132 Enmore Road", "Enmore", "NSW", "2042"]],
  },
  "Factory Theatre Marrickville": {
    indexUrl: "https://www.factorytheatre.com.au/",
    rows: [["Marrickville", "105 Victoria Road", "Marrickville", "NSW", "2204"]],
  },
  "Camelot Lounge Marrickville": {
    indexUrl: "https://camelotlounge.com/",
    rows: [["Marrickville", "19 Marrickville Road", "Marrickville", "NSW", "2204"]],
  },
  "Carriageworks Eveleigh": {
    indexUrl: "https://carriageworks.com.au/",
    rows: [["Eveleigh", "245 Wilson Street", "Eveleigh", "NSW", "2015"]],
  },
  "Seymour Centre Chippendale": {
    indexUrl: "https://www.seymourcentre.com/",
    rows: [["Chippendale", "Cnr City Road and Cleveland Street", "Chippendale", "NSW", "2008"]],
  },
  "Belvoir St Theatre Surry Hills": {
    indexUrl: "https://belvoir.com.au/",
    rows: [["Surry Hills", "25 Belvoir Street", "Surry Hills", "NSW", "2010"]],
  },
  "Riverside Theatres Parramatta": {
    indexUrl: "https://riversideparramatta.com.au/",
    rows: [["Parramatta", "Cnr Church and Market Streets", "Parramatta", "NSW", "2150"]],
  },
  "The Concourse Chatswood": {
    indexUrl: "https://www.theconcourse.com.au/",
    rows: [["Chatswood", "409 Victoria Avenue", "Chatswood", "NSW", "2067"]],
  },
  "Sydney Symphony Orchestra Student Rush": {
    indexUrl: "https://www.sydneysymphony.com/",
    rows: [["Sydney Opera House", "Bennelong Point", "Sydney", "NSW", "2000"]],
  },
  "Bangarra Dance Theatre Walsh Bay": {
    indexUrl: "https://www.bangarra.com.au/",
    rows: [["Walsh Bay", "15 Hickson Road", "Dawes Point", "NSW", "2000"]],
  },
  "Australian Chamber Orchestra Sydney": {
    indexUrl: "https://www.aco.com.au/",
    rows: [["Walsh Bay", "Pier 2/3, 13A Hickson Road", "Dawes Point", "NSW", "2000"]],
  },
  "City Recital Hall Sydney": {
    indexUrl: "https://www.cityrecitalhall.com/",
    rows: [["Sydney CBD", "2 Angel Place", "Sydney", "NSW", "2000"]],
  },
  "State Theatre Sydney": {
    indexUrl: "https://www.statetheatre.com.au/",
    rows: [["Sydney CBD", "49 Market Street", "Sydney", "NSW", "2000"]],
  },
  "Theatre Royal Sydney": {
    indexUrl: "https://theatreroyalsydney.com/",
    rows: [["Sydney CBD", "108 King Street", "Sydney", "NSW", "2000"]],
  },
  "Capitol Theatre Haymarket": {
    indexUrl: "https://www.capitoltheatre.com.au/",
    rows: [["Haymarket", "13 Campbell Street", "Haymarket", "NSW", "2000"]],
  },
  "Sydney Lyric Theatre Pyrmont": {
    indexUrl: "https://sydneylyric.com.au/",
    rows: [["Pyrmont", "55 Pirrama Road", "Pyrmont", "NSW", "2009"]],
  },
  "Foundry Theatre Pyrmont": {
    indexUrl: "https://www.foundrytheatre.com.au/",
    rows: [["Pyrmont", "The Star, 80 Pyrmont Street", "Pyrmont", "NSW", "2009"]],
  },
  "Sydney Festival Mob Tix": {
    indexUrl: "https://www.sydneyfestival.org.au/",
    rows: [["Sydney CBD", "Sydney CBD", "Sydney", "NSW", "2000"]],
  },
  "Promotix NSW Events": {
    indexUrl: "https://www.promotix.com.au/",
    rows: [["Sydney CBD", "NSW event marketplace", "Sydney", "NSW", "2000"]],
  },
};

function discoverEntertainmentEventsChainLocations(storeName: string, maxLocations: number) {
  if (/^Event Cinemas Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.eventcinemas.com.au/Cinemas", EVENT_CINEMAS_LOCATIONS, maxLocations);
  }
  if (/^HOYTS Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.hoyts.com.au/cinemas", HOYTS_LOCATIONS, maxLocations);
  }
  if (/^Palace Cinemas Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.palacecinemas.com.au/cinemas/", PALACE_CINEMAS_LOCATIONS, maxLocations);
  }
  if (/^Ticketek Australia$|^Ticketmaster Australia$|^TIX Australia$|^Moshtix Australia$|^Oztix Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.google.com/search?q=Australia+event+ticketing+deals", ENTERTAINMENT_TICKETING_MARKETPLACE_LOCATIONS, maxLocations);
  }

  const singleVenue = ENTERTAINMENT_SINGLE_VENUE_LOCATIONS[storeName];

  if (singleVenue) {
    return staticLocationResult(singleVenue.indexUrl, singleVenue.rows, maxLocations);
  }

  return null;
}

const ENTERTAINMENT_EVENTS_CHAIN_PARENT_NAMES = [
  "Australian Chamber Orchestra Sydney",
  "Bangarra Dance Theatre Walsh Bay",
  "Belvoir St Theatre Surry Hills",
  "Camelot Lounge Marrickville",
  "Capitol Theatre Haymarket",
  "Carriageworks Eveleigh",
  "City Recital Hall Sydney",
  "Comedy Store Sydney Moore Park",
  "Enmore Theatre Enmore",
  "Event Cinemas Australia",
  "Factory Theatre Marrickville",
  "Foundry Theatre Pyrmont",
  "HOYTS Australia",
  "Happy Endings Comedy Club Sydney CBD",
  "ICC Sydney",
  "Level One Potts Point",
  "Metro Theatre Sydney Comedy and Music",
  "Moshtix Australia",
  "Opera Australia Special Offers",
  "Oztix Australia",
  "Palace Cinemas Australia",
  "Promotix NSW Events",
  "Riverside Theatres Parramatta",
  "Seymour Centre Chippendale",
  "State Theatre Sydney",
  "Sydney Festival Mob Tix",
  "Sydney Lyric Theatre Pyrmont",
  "Sydney Opera House",
  "Sydney Symphony Orchestra Student Rush",
  "TIX Australia",
  "The Concourse Chatswood",
  "Theatre Royal Sydney",
  "Ticketek Australia",
  "Ticketmaster Australia",
];

const ROLLD_STORE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "George Street", "Sydney", "NSW", "2000"],
  ["Barangaroo", "Exchange Place", "Barangaroo", "NSW", "2000"],
  ["Chatswood", "Westfield Chatswood, 1 Anderson Street", "Chatswood", "NSW", "2067"],
  ["Parramatta", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["Melbourne", "Melbourne Central, 211 La Trobe Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Brisbane", "Queen Street Mall", "Brisbane City", "QLD", "4000"],
  ["Chermside", "Westfield Chermside, Gympie Road", "Chermside", "QLD", "4032"],
  ["Adelaide", "Rundle Mall", "Adelaide", "SA", "5000"],
  ["Perth", "Murray Street Mall", "Perth", "WA", "6000"],
  ["Canberra", "Canberra Centre, Bunda Street", "Canberra", "ACT", "2601"],
];

const CHAT_THAI_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Haymarket", "20 Campbell Street", "Haymarket", "NSW", "2000"],
  ["Circular Quay", "Gateway Sydney, 1 Macquarie Place", "Sydney", "NSW", "2000"],
  ["Westfield Sydney", "Westfield Sydney, 188 Pitt Street", "Sydney", "NSW", "2000"],
  ["Chatswood", "Chatswood Place, Victoria Avenue", "Chatswood", "NSW", "2067"],
  ["Manly", "The Corso", "Manly", "NSW", "2095"],
  ["Randwick", "Belmore Road", "Randwick", "NSW", "2031"],
];

const DOODEE_PAIDANG_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Haymarket", "9/37 Ultimo Road", "Haymarket", "NSW", "2000"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Chatswood", "Victoria Avenue", "Chatswood", "NSW", "2067"],
  ["Melbourne", "Little Collins Street", "Melbourne", "VIC", "3000"],
  ["Box Hill", "Main Street", "Box Hill", "VIC", "3128"],
];

const MAMAK_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Haymarket", "15 Goulburn Street", "Haymarket", "NSW", "2000"],
  ["Chatswood", "1-5 Railway Street", "Chatswood", "NSW", "2067"],
  ["Parramatta", "Church Street", "Parramatta", "NSW", "2150"],
  ["Melbourne", "366 Lonsdale Street", "Melbourne", "VIC", "3000"],
  ["Brisbane", "Edward Street", "Brisbane City", "QLD", "4000"],
];

const KOWLOON_CAFE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Haymarket", "Chinatown, Dixon Street", "Haymarket", "NSW", "2000"],
  ["Burwood", "Burwood Road", "Burwood", "NSW", "2134"],
  ["Eastwood", "Rowe Street", "Eastwood", "NSW", "2122"],
  ["Chatswood", "Victoria Avenue", "Chatswood", "NSW", "2067"],
];

const MR_HOTDOG_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Cabramatta", "John Street", "Cabramatta", "NSW", "2166"],
  ["Chinatown", "Dixon Street", "Haymarket", "NSW", "2000"],
  ["Eastwood", "Rowe Street", "Eastwood", "NSW", "2122"],
];

const MEDAN_CIAK_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney CBD", "Shop 10/339 Sussex St", "Sydney", "NSW", "2000"],
  ["Mascot", "Shop 2/2 Muller La", "Mascot", "NSW", "2020"],
];

const RIA_AYAM_PENYET_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney CBD", "Sussex Street", "Sydney", "NSW", "2000"],
  ["Adelaide CBD", "Gouger Street", "Adelaide", "SA", "5000"],
];

const DOSA_HUT_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Melbourne CBD", "King Street", "Melbourne", "VIC", "3000"],
  ["Dandenong", "Lonsdale Street", "Dandenong", "VIC", "3175"],
  ["Harris Park", "Wigram Street", "Harris Park", "NSW", "2150"],
  ["Springvale", "Springvale Road", "Springvale", "VIC", "3171"],
  ["Canberra", "Northbourne Avenue", "Canberra", "ACT", "2601"],
  ["Brisbane", "Brisbane CBD", "Brisbane City", "QLD", "4000"],
];

const CHULHO_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Town Hall", "Liverpool Street", "Sydney", "NSW", "2000"],
  ["Harris Park", "Wigram Street", "Harris Park", "NSW", "2150"],
];

const CHATKAZZ_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Harris Park", "Wigram Street", "Harris Park", "NSW", "2150"],
  ["Bella Vista", "Circa Boulevarde", "Bella Vista", "NSW", "2153"],
  ["Melbourne", "King Street", "Melbourne", "VIC", "3000"],
];

const CULTURAL_SINGLE_STORE_LOCATIONS: Record<string, { indexUrl: string; rows: Array<[string, string, string, string, string]> }> = {
  "Marrickville Pork Roll Darling Square": {
    indexUrl: "https://www.darlingharbour.com/eat-drink/marrickville-pork-roll",
    rows: [["Darling Square", "Steam Mill Lane", "Haymarket", "NSW", "2000"]],
  },
  "Bau Truong Cabramatta": {
    indexUrl: "https://www.bautruong.com.au/",
    rows: [["Cabramatta", "42 John Street", "Cabramatta", "NSW", "2166"]],
  },
  "VN Street Foods Marrickville": {
    indexUrl: "https://www.vnstreetfoods.com.au/home",
    rows: [["Marrickville", "Illawarra Road", "Marrickville", "NSW", "2204"]],
  },
  "Hello Auntie Marrickville": {
    indexUrl: "https://hello-auntie.com.au/",
    rows: [["Marrickville", "Illawarra Road", "Marrickville", "NSW", "2204"]],
  },
  "Ho Jiak Haymarket": {
    indexUrl: "https://www.hojiak.com.au/haymarket/",
    rows: [["Haymarket", "92 Hay Street", "Haymarket", "NSW", "2000"]],
  },
  "Billu Indian Eatery Harris Park": {
    indexUrl: "https://www.billu.com.au/",
    rows: [["Harris Park", "62 Wigram Street", "Harris Park", "NSW", "2150"]],
  },
};

function discoverCulturalBitesChainLocations(storeName: string, maxLocations: number) {
  if (/^Roll'd Sydney$/i.test(storeName)) {
    return staticLocationResult("https://rolld.com.au/stores/", ROLLD_STORE_LOCATIONS, maxLocations);
  }
  if (/^Chat Thai Haymarket$/i.test(storeName)) {
    return staticLocationResult("https://chatthai.com/locations/", CHAT_THAI_LOCATIONS, maxLocations);
  }
  if (/^Dodee Paidang Haymarket$/i.test(storeName)) {
    return staticLocationResult("https://www.dodeepaidang.com/", DOODEE_PAIDANG_LOCATIONS, maxLocations);
  }
  if (/^Mamak Haymarket$/i.test(storeName)) {
    return staticLocationResult("https://www.mamak.com.au/", MAMAK_LOCATIONS, maxLocations);
  }
  if (/^Kowloon Cafe Haymarket$/i.test(storeName)) {
    return staticLocationResult("https://www.kowlooncafe.com.au/", KOWLOON_CAFE_LOCATIONS, maxLocations);
  }
  if (/^MR Hotdog Chinatown$/i.test(storeName)) {
    return staticLocationResult("https://www.mrhotdog.com.au/", MR_HOTDOG_LOCATIONS, maxLocations);
  }
  if (/^Medan Ciak Sydney$/i.test(storeName)) {
    return staticLocationResult("https://medanciak.com.au/location", MEDAN_CIAK_LOCATIONS, maxLocations);
  }
  if (/^Ria Ayam Penyet Sydney CBD$/i.test(storeName)) {
    return staticLocationResult("https://sydney.ria98.com.au/", RIA_AYAM_PENYET_LOCATIONS, maxLocations);
  }
  if (/^Dosa Hut Melbourne CBD$/i.test(storeName)) {
    return staticLocationResult("https://www.dosahut.net.au/", DOSA_HUT_LOCATIONS, maxLocations);
  }
  if (/^Chulho Town Hall$/i.test(storeName)) {
    return staticLocationResult("https://www.chulho.com.au/", CHULHO_LOCATIONS, maxLocations);
  }
  if (/^Chatkazz Harris Park$/i.test(storeName)) {
    return staticLocationResult("https://www.chatkazz.com.au/", CHATKAZZ_LOCATIONS, maxLocations);
  }

  const singleStore = CULTURAL_SINGLE_STORE_LOCATIONS[storeName];

  if (singleStore) {
    return staticLocationResult(singleStore.indexUrl, singleStore.rows, maxLocations);
  }

  return null;
}

const CULTURAL_BITES_CHAIN_PARENT_NAMES = [
  "Bau Truong Cabramatta",
  "Billu Indian Eatery Harris Park",
  "Chat Thai Haymarket",
  "Chatkazz Harris Park",
  "Chulho Town Hall",
  "Dodee Paidang Haymarket",
  "Dosa Hut Melbourne CBD",
  "Hello Auntie Marrickville",
  "Ho Jiak Haymarket",
  "Kowloon Cafe Haymarket",
  "MR Hotdog Chinatown",
  "Mamak Haymarket",
  "Marrickville Pork Roll Darling Square",
  "Medan Ciak Sydney",
  "Ria Ayam Penyet Sydney CBD",
  "Roll'd Sydney",
  "VN Street Foods Marrickville",
];

const SOURCE_BULK_FOODS_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Balmain", "262 Darling Street", "Balmain", "NSW", "2041"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Crows Nest", "65 Willoughby Road", "Crows Nest", "NSW", "2065"],
  ["Balaclava", "220 Carlisle Street", "Balaclava", "VIC", "3183"],
  ["Brunswick", "133 Sydney Road", "Brunswick", "VIC", "3056"],
  ["West End", "79 Boundary Street", "West End", "QLD", "4101"],
  ["Norwood", "169 The Parade", "Norwood", "SA", "5067"],
  ["Subiaco", "148 Rokeby Road", "Subiaco", "WA", "6008"],
];

function discoverFoodGroceryChainLocations(storeName: string, maxLocations: number) {
  if (/^Woolworths Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.woolworths.com.au/shop/storelocator", WOOLWORTHS_STORE_LOCATIONS, maxLocations);
  }
  if (/^Coles Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.coles.com.au/stores", COLES_STORE_LOCATIONS, maxLocations);
  }
  if (/^ALDI Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.aldi.com.au/stores", ALDI_STORE_LOCATIONS, maxLocations);
  }
  if (/^IGA Australia$|^Ritchies IGA$/i.test(storeName)) {
    return staticLocationResult("https://www.iga.com.au/stores/", IGA_STORE_LOCATIONS, maxLocations);
  }
  if (/^Costco Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.costco.com.au/store-finder", COSTCO_STORE_LOCATIONS, maxLocations);
  }
  if (/^Harris Farm Markets$/i.test(storeName)) {
    return staticLocationResult("https://www.harrisfarm.com.au/pages/store-locator", HARRIS_FARM_STORE_LOCATIONS, maxLocations);
  }
  if (/^Foodland Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.foodlandsa.com.au/store-locator/", FOODLAND_STORE_LOCATIONS, maxLocations);
  }
  if (/^Drakes Supermarkets$/i.test(storeName)) {
    return staticLocationResult("https://drakes.com.au/stores/", DRAKES_STORE_LOCATIONS, maxLocations);
  }
  if (/^BWS Australia$|^Dan Murphy's Australia$|^Liquorland Australia$|^First Choice Liquor Market$|^Vintage Cellars Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.edg.com.au/store-locator", LIQUOR_CHAIN_LOCATIONS, maxLocations);
  }
  if (/^Go Vita Australia$/i.test(storeName)) {
    return staticLocationResult("https://govita.com.au/pages/store-locator", GO_VITA_STORE_LOCATIONS, maxLocations);
  }
  if (/^The Source Bulk Foods Australia$/i.test(storeName)) {
    return staticLocationResult("https://thesourcebulkfoods.com.au/stores/", SOURCE_BULK_FOODS_LOCATIONS, maxLocations);
  }

  return null;
}

const FOOD_GROCERY_CHAIN_PARENT_NAMES = [
  "ALDI Australia",
  "BWS Australia",
  "Coles Australia",
  "Costco Australia",
  "Dan Murphy's Australia",
  "Drakes Supermarkets",
  "First Choice Liquor Market",
  "Foodland Australia",
  "Go Vita Australia",
  "Harris Farm Markets",
  "IGA Australia",
  "Liquorland Australia",
  "Ritchies IGA",
  "The Source Bulk Foods Australia",
  "Vintage Cellars Australia",
  "Woolworths Australia",
];

const WEST_COAST_HIFI_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Cannington", "Unit 1, 1490 Albany Highway", "Cannington", "WA", "6107"],
  ["Midland", "Unit 3, 4 Clayton Street", "Midland", "WA", "6056"],
  ["O'Connor", "396 South Street", "O'Connor", "WA", "6163"],
  ["Joondalup", "12 Sundew Rise", "Joondalup", "WA", "6027"],
  ["Rockingham", "1 Council Avenue", "Rockingham", "WA", "6168"],
  ["Mandurah", "14 Pinjarra Road", "Mandurah", "WA", "6210"],
];

const BANG_OLUFSEN_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Westfield Sydney, 188 Pitt Street", "Sydney", "NSW", "2000"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Melbourne", "Emporium Melbourne, 287 Lonsdale Street", "Melbourne", "VIC", "3000"],
  ["Brisbane", "James Street", "Fortitude Valley", "QLD", "4006"],
  ["Perth", "Claremont Quarter, 9 Bay View Terrace", "Claremont", "WA", "6010"],
];

const BOSE_STORE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Westfield Sydney, 188 Pitt Street", "Sydney", "NSW", "2000"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Melbourne", "Emporium Melbourne, 287 Lonsdale Street", "Melbourne", "VIC", "3000"],
  ["Brisbane", "QueensPlaza, Queen Street Mall", "Brisbane City", "QLD", "4000"],
  ["Perth", "Karrinyup Shopping Centre, 200 Karrinyup Road", "Karrinyup", "WA", "6018"],
];

const ADDICTED_TO_AUDIO_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Newtown", "282 King Street", "Newtown", "NSW", "2042"],
  ["Melbourne", "240 Lonsdale Street", "Melbourne", "VIC", "3000"],
  ["Perth", "663 Newcastle Street", "Leederville", "WA", "6007"],
];

const HIFI_SINGLE_SHOWROOM_LOCATIONS: Record<string, { indexUrl: string; rows: Array<[string, string, string, string, string]> }> = {
  "Audio Connection Leichhardt": {
    indexUrl: "https://audioconnection.com.au/pages/contact",
    rows: [["Leichhardt", "515 Parramatta Road", "Leichhardt", "NSW", "2040"]],
  },
  "Len Wallis Audio Lane Cove": {
    indexUrl: "https://lenwallisaudio.com/pages/contact",
    rows: [["Lane Cove", "64 Burns Bay Road", "Lane Cove", "NSW", "2066"]],
  },
  "Apollo Hi-Fi Marrickville": {
    indexUrl: "https://www.apollohifi.com.au/contact-us",
    rows: [["Marrickville", "283 Victoria Road", "Marrickville", "NSW", "2204"]],
  },
  "Minidisc Chatswood": {
    indexUrl: "https://www.minidisc.com.au/contact-us",
    rows: [["Chatswood", "Shop 3, 376 Victoria Avenue", "Chatswood", "NSW", "2067"]],
  },
  "Carlton Audio Visual": {
    indexUrl: "https://www.carltonaudiovisual.com.au/pages/contact",
    rows: [["Carlton", "164 Lygon Street", "Carlton", "VIC", "3053"]],
  },
  "Tivoli Hi-Fi Hawthorn": {
    indexUrl: "https://tivolihifi.com.au/pages/contact-us",
    rows: [["Hawthorn", "155 Camberwell Road", "Hawthorn East", "VIC", "3123"]],
  },
  "Melbourne Hi Fi Hawthorn": {
    indexUrl: "https://www.melbournehifi.com.au/pages/contact",
    rows: [["Hawthorn", "590 Burwood Road", "Hawthorn", "VIC", "3122"]],
  },
  "Selby Acoustics Hallam": {
    indexUrl: "https://www.selby.com.au/contact-us",
    rows: [["Hallam", "14-16 Melverton Drive", "Hallam", "VIC", "3803"]],
  },
  "Brisbane HiFi Woolloongabba": {
    indexUrl: "https://brisbanehifi.com.au/pages/contact-us",
    rows: [["Woolloongabba", "72 Deshon Street", "Woolloongabba", "QLD", "4102"]],
  },
  "Living Sound + Vision Fortitude Valley": {
    indexUrl: "https://www.livingsound.com.au/pages/contact-us",
    rows: [["Fortitude Valley", "123 Robertson Street", "Fortitude Valley", "QLD", "4006"]],
  },
  "Douglas HiFi Osborne Park": {
    indexUrl: "https://www.douglashifi.com.au/pages/contact",
    rows: [["Osborne Park", "1/30 Hutton Street", "Osborne Park", "WA", "6017"]],
  },
  "Challenge Hi-Fi Adelaide": {
    indexUrl: "https://www.challengehifi.com.au/contact",
    rows: [["Adelaide", "96 Prospect Road", "Prospect", "SA", "5082"]],
  },
  "Sydney Hi-Fi Castle Hill": {
    indexUrl: "https://www.sydneyhificastlehill.com.au/contact",
    rows: [["Castle Hill", "2/8 Victoria Avenue", "Castle Hill", "NSW", "2154"]],
  },
};

function discoverHifiAudioChainLocations(storeName: string, maxLocations: number) {
  if (/^West Coast HiFi Cannington$/i.test(storeName)) {
    return staticLocationResult("https://www.westcoasthifi.com.au/stores/", WEST_COAST_HIFI_LOCATIONS, maxLocations);
  }
  if (/^Bang & Olufsen Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.bang-olufsen.com/en/au/stores", BANG_OLUFSEN_LOCATIONS, maxLocations);
  }
  if (/^Bose Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.bose.com.au/stores", BOSE_STORE_LOCATIONS, maxLocations);
  }
  if (/^Cambridge Audio at Addicted To Audio$/i.test(storeName)) {
    return staticLocationResult("https://addictedtoaudio.com.au/pages/locations", ADDICTED_TO_AUDIO_LOCATIONS, maxLocations);
  }

  const singleShowroom = HIFI_SINGLE_SHOWROOM_LOCATIONS[storeName];

  if (singleShowroom) {
    return staticLocationResult(singleShowroom.indexUrl, singleShowroom.rows, maxLocations);
  }

  return null;
}

const HIFI_AUDIO_CHAIN_PARENT_NAMES = [
  "Apollo Hi-Fi Marrickville",
  "Audio Connection Leichhardt",
  "Bang & Olufsen Australia",
  "Bose Australia",
  "Brisbane HiFi Woolloongabba",
  "Cambridge Audio at Addicted To Audio",
  "Carlton Audio Visual",
  "Challenge Hi-Fi Adelaide",
  "Douglas HiFi Osborne Park",
  "Len Wallis Audio Lane Cove",
  "Living Sound + Vision Fortitude Valley",
  "Melbourne Hi Fi Hawthorn",
  "Minidisc Chatswood",
  "Selby Acoustics Hallam",
  "Sydney Hi-Fi Castle Hill",
  "Tivoli Hi-Fi Hawthorn",
  "West Coast HiFi Cannington",
];

const FIG_AND_BLOOM_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "62-64 Australia Street", "Camperdown", "NSW", "2050"],
  ["Melbourne", "1001 High Street", "Armadale", "VIC", "3143"],
  ["Brisbane", "James Street", "Fortitude Valley", "QLD", "4006"],
];

const EDIBLE_BLOOMS_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Adelaide", "46 Fullarton Road", "Norwood", "SA", "5067"],
  ["Sydney", "Sydney delivery hub", "Alexandria", "NSW", "2015"],
  ["Melbourne", "Melbourne delivery hub", "Richmond", "VIC", "3121"],
  ["Brisbane", "Brisbane delivery hub", "Fortitude Valley", "QLD", "4006"],
  ["Perth", "Perth delivery hub", "Subiaco", "WA", "6008"],
];

const LVLY_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Melbourne", "Melbourne delivery hub", "Port Melbourne", "VIC", "3207"],
  ["Sydney", "Sydney delivery hub", "Alexandria", "NSW", "2015"],
  ["Brisbane", "Brisbane delivery hub", "Fortitude Valley", "QLD", "4006"],
  ["Adelaide", "Adelaide delivery hub", "Thebarton", "SA", "5031"],
  ["Perth", "Perth delivery hub", "West Perth", "WA", "6005"],
];

const NATIONAL_FLOWER_DELIVERY_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Sydney CBD", "Sydney", "NSW", "2000"],
  ["Melbourne", "Melbourne CBD", "Melbourne", "VIC", "3000"],
  ["Brisbane", "Brisbane CBD", "Brisbane City", "QLD", "4000"],
  ["Adelaide", "Adelaide CBD", "Adelaide", "SA", "5000"],
  ["Perth", "Perth CBD", "Perth", "WA", "6000"],
  ["Canberra", "Canberra CBD", "Canberra", "ACT", "2601"],
  ["Hobart", "Hobart CBD", "Hobart", "TAS", "7000"],
  ["Darwin", "Darwin CBD", "Darwin City", "NT", "0800"],
];

const PEARSONS_FLORIST_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Bondi", "500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Chatswood", "Chatswood Chase, 345 Victoria Avenue", "Chatswood", "NSW", "2067"],
  ["North Sydney", "Shop 1, 99 Mount Street", "North Sydney", "NSW", "2060"],
  ["Sydney", "The Galeries, 500 George Street", "Sydney", "NSW", "2000"],
];

const URBAN_FLOWERS_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Homebush", "1/318 Parramatta Road", "Homebush", "NSW", "2140"],
];

const GIFTS_FLOWERS_SINGLE_STORE_LOCATIONS: Record<string, { indexUrl: string; rows: Array<[string, string, string, string, string]> }> = {
  "Bloom & Rocket Indooroopilly": {
    indexUrl: "https://www.bloomandrocket.com/contact",
    rows: [["Indooroopilly", "Indooroopilly Shopping Centre, 322 Moggill Road", "Indooroopilly", "QLD", "4068"]],
  },
  "Bowers and Flowers Leppington": {
    indexUrl: "https://bowersandflowers.com.au/pages/contact",
    rows: [["Leppington", "Leppington Village, Camden Valley Way", "Leppington", "NSW", "2179"]],
  },
  "Code Bloom Perth": {
    indexUrl: "https://www.codebloom.com.au/contact",
    rows: [["Mount Hawthorn", "148 Scarborough Beach Road", "Mount Hawthorn", "WA", "6016"]],
  },
  "Daily Blooms Melbourne": {
    indexUrl: "https://dailyblooms.com.au/pages/contact-us",
    rows: [["Melbourne", "Melbourne", "Melbourne", "VIC", "3000"]],
  },
  "East End Flower Market Adelaide": {
    indexUrl: "https://eastendflowermarket.com.au/pages/contact",
    rows: [["Adelaide", "83 Halifax Street", "Adelaide", "SA", "5000"]],
  },
  "Floral Expressions Northmead": {
    indexUrl: "https://www.floralexpressions.com.au/contact-us",
    rows: [["Northmead", "Shop 3, 2 Campbell Street", "Northmead", "NSW", "2152"]],
  },
  "Flowers Across Brisbane Acacia Ridge": {
    indexUrl: "https://www.flowersacrossbrisbane.com.au/contact-us/",
    rows: [["Acacia Ridge", "Brisbane dispatch hub", "Acacia Ridge", "QLD", "4110"]],
  },
  "Flowers Vasette Fitzroy": {
    indexUrl: "https://flowersvasette.com.au/pages/contact",
    rows: [["Fitzroy", "247 Brunswick Street", "Fitzroy", "VIC", "3065"]],
  },
  "Garden of Angels Stanmore": {
    indexUrl: "https://www.gardenofangels.com.au/contact",
    rows: [["Stanmore", "124 Percival Road", "Stanmore", "NSW", "2048"]],
  },
  "Green Bunch East Victoria Park": {
    indexUrl: "https://greenbunch.com.au/pages/contact-us",
    rows: [["East Victoria Park", "907 Albany Highway", "East Victoria Park", "WA", "6101"]],
  },
  "In Full Bloom South Melbourne": {
    indexUrl: "https://www.infullbloom.com.au/contact",
    rows: [["South Melbourne", "138 Bridport Street", "South Melbourne", "VIC", "3205"]],
  },
  "Little Posy Fremantle": {
    indexUrl: "https://www.littleposy.com.au/pages/contact",
    rows: [["Fremantle", "Fremantle delivery hub", "Fremantle", "WA", "6160"]],
  },
  "Mister Botanical Brisbane CBD": {
    indexUrl: "https://www.misterbotanical.com.au/contact",
    rows: [["Brisbane City", "Brisbane CBD studio", "Brisbane City", "QLD", "4000"]],
  },
  "My Violet Redfern": {
    indexUrl: "https://www.myviolet.com.au/contact",
    rows: [["Redfern", "Redfern studio", "Redfern", "NSW", "2016"]],
  },
  "Perrotts Florists Brisbane": {
    indexUrl: "https://www.perrotts.com.au/contact-us",
    rows: [["Brisbane City", "109 Mary Street", "Brisbane City", "QLD", "4000"]],
  },
  "Poco Posy Brisbane": {
    indexUrl: "https://www.pocoposy.com.au/contact",
    rows: [["Hendra", "Hendra studio", "Hendra", "QLD", "4011"]],
  },
  "Poppy Rose Brisbane": {
    indexUrl: "https://poppyrose.com.au/pages/contact",
    rows: [["Newstead", "Newstead studio", "Newstead", "QLD", "4006"]],
  },
  "Quiet Bloom Richmond": {
    indexUrl: "https://quietbloom.com.au/pages/contact",
    rows: [["Richmond", "Richmond studio", "Richmond", "VIC", "3121"]],
  },
  "The Flower Merchant Moonee Ponds": {
    indexUrl: "https://theflowermerchant.com.au/pages/contact",
    rows: [["Moonee Ponds", "28 Puckle Street", "Moonee Ponds", "VIC", "3039"]],
  },
  "The Flower Run Perth": {
    indexUrl: "https://theflowerrun.com.au/pages/contact",
    rows: [["Perth", "Perth delivery hub", "Perth", "WA", "6000"]],
  },
  "Tynte Flowers North Adelaide": {
    indexUrl: "https://tynte.com/pages/contact-us",
    rows: [["North Adelaide", "124 O'Connell Street", "North Adelaide", "SA", "5006"]],
  },
  "Victoria Whitelaw South Yarra": {
    indexUrl: "https://www.victoriawhitelaw.com.au/contact",
    rows: [["South Yarra", "131 Toorak Road", "South Yarra", "VIC", "3141"]],
  },
};

function discoverGiftsFlowersChainLocations(storeName: string, maxLocations: number) {
  if (/^Fig & Bloom$|^Fig and Bloom Melbourne$/i.test(storeName)) {
    return staticLocationResult("https://figandbloom.com/pages/contact-us", FIG_AND_BLOOM_LOCATIONS, maxLocations);
  }
  if (/^Edible Blooms Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.edibleblooms.com.au/pages/contact-us", EDIBLE_BLOOMS_LOCATIONS, maxLocations);
  }
  if (/^LVLY Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.lvly.com.au/pages/contact-us", LVLY_LOCATIONS, maxLocations);
  }
  if (/^Interflora Australia$|^Flowers Across Australia$|^Floraly Australia$|^Roses Only Australia$|^Mr Roses Australia$|^Bloomeroo Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.interflora.com.au/", NATIONAL_FLOWER_DELIVERY_LOCATIONS, maxLocations);
  }
  if (/^Pearsons Florist Sydney$|^Pearsons Florist Bondi$/i.test(storeName)) {
    return staticLocationResult("https://pearsonsflorist.com.au/pages/our-stores", PEARSONS_FLORIST_LOCATIONS, maxLocations);
  }
  if (/^Urban Flowers Homebush$/i.test(storeName)) {
    return staticLocationResult("https://www.urbanflower.com.au/sydney-florist/sydney.shtml", URBAN_FLOWERS_LOCATIONS, maxLocations);
  }

  const singleStore = GIFTS_FLOWERS_SINGLE_STORE_LOCATIONS[storeName];

  if (singleStore) {
    return staticLocationResult(singleStore.indexUrl, singleStore.rows, maxLocations);
  }

  return null;
}

const GIFTS_FLOWERS_CHAIN_PARENT_NAMES = [
  "Bloom & Rocket Indooroopilly",
  "Bloomeroo Australia",
  "Bowers and Flowers Leppington",
  "Code Bloom Perth",
  "Daily Blooms Melbourne",
  "East End Flower Market Adelaide",
  "Edible Blooms Australia",
  "Fig & Bloom",
  "Floral Expressions Northmead",
  "Floraly Australia",
  "Flowers Across Australia",
  "Flowers Across Brisbane Acacia Ridge",
  "Flowers Vasette Fitzroy",
  "Garden of Angels Stanmore",
  "Green Bunch East Victoria Park",
  "In Full Bloom South Melbourne",
  "Interflora Australia",
  "Little Posy Fremantle",
  "LVLY Australia",
  "Mister Botanical Brisbane CBD",
  "Mr Roses Australia",
  "My Violet Redfern",
  "Pearsons Florist Sydney",
  "Perrotts Florists Brisbane",
  "Poco Posy Brisbane",
  "Poppy Rose Brisbane",
  "Quiet Bloom Richmond",
  "Roses Only Australia",
  "The Flower Merchant Moonee Ponds",
  "The Flower Run Perth",
  "Tynte Flowers North Adelaide",
  "Urban Flowers Homebush",
  "Victoria Whitelaw South Yarra",
];

const LUXURY_SYDNEY_MELBOURNE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Westfield Sydney, 188 Pitt Street", "Sydney", "NSW", "2000"],
  ["Melbourne", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
];

const LUXURY_NATIONAL_BOUTIQUE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Westfield Sydney, 188 Pitt Street", "Sydney", "NSW", "2000"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Melbourne", "Collins Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Brisbane", "QueensPlaza, 226 Queen Street", "Brisbane City", "QLD", "4000"],
  ["Perth", "King Street", "Perth", "WA", "6000"],
];

const GUCCI_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Westfield Sydney, 188 Pitt Street", "Sydney", "NSW", "2000"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Melbourne", "Collins Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Brisbane", "QueensPlaza, 226 Queen Street", "Brisbane City", "QLD", "4000"],
  ["Perth", "King Street", "Perth", "WA", "6000"],
];

const PRADA_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Westfield Sydney, 188 Pitt Street", "Sydney", "NSW", "2000"],
  ["Melbourne", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Brisbane", "QueensPlaza, 226 Queen Street", "Brisbane City", "QLD", "4000"],
];

const LOUIS_VUITTON_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "365 George Street", "Sydney", "NSW", "2000"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Melbourne", "139 Collins Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Brisbane", "QueensPlaza, 226 Queen Street", "Brisbane City", "QLD", "4000"],
  ["Perth", "King Street", "Perth", "WA", "6000"],
];

const CHANEL_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Westfield Sydney, 188 Pitt Street", "Sydney", "NSW", "2000"],
  ["Melbourne", "140 Flinders Lane", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Brisbane", "QueensPlaza, 226 Queen Street", "Brisbane City", "QLD", "4000"],
];

const CARTIER_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "74 Castlereagh Street", "Sydney", "NSW", "2000"],
  ["Melbourne", "90 Collins Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Brisbane", "QueensPlaza, 226 Queen Street", "Brisbane City", "QLD", "4000"],
];

const MONTBLANC_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Westfield Sydney, 188 Pitt Street", "Sydney", "NSW", "2000"],
  ["Melbourne", "Emporium Melbourne, 287 Lonsdale Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Brisbane", "QueensPlaza, 226 Queen Street", "Brisbane City", "QLD", "4000"],
];

const AJE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Paddington", "2-16 Glenmore Road", "Paddington", "NSW", "2021"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Armadale", "1052 High Street", "Armadale", "VIC", "3143"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["James Street", "James Street", "Fortitude Valley", "QLD", "4006"],
  ["Claremont", "Claremont Quarter, 9 Bay View Terrace", "Claremont", "WA", "6010"],
];

const ZIMMERMANN_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Paddington", "2-16 Glenmore Road", "Paddington", "NSW", "2021"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Melbourne", "82 Collins Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Brisbane", "QueensPlaza, 226 Queen Street", "Brisbane City", "QLD", "4000"],
  ["Perth", "Claremont Quarter, 9 Bay View Terrace", "Claremont", "WA", "6010"],
];

const SCANLAN_THEODORE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Paddington", "36 Oxford Street", "Paddington", "NSW", "2021"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["South Yarra", "485 Chapel Street", "South Yarra", "VIC", "3141"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Brisbane", "QueensPlaza, 226 Queen Street", "Brisbane City", "QLD", "4000"],
  ["Claremont", "Claremont Quarter, 9 Bay View Terrace", "Claremont", "WA", "6010"],
];

const CAMILLA_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Alexandria", "36-42 O'Riordan Street", "Alexandria", "NSW", "2015"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Mosman", "719 Military Road", "Mosman", "NSW", "2088"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Brisbane", "James Street", "Fortitude Valley", "QLD", "4006"],
  ["Claremont", "Claremont Quarter, 9 Bay View Terrace", "Claremont", "WA", "6010"],
];

const DAVID_JONES_DESIGNER_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Elizabeth Street", "86-108 Castlereagh Street", "Sydney", "NSW", "2000"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Bourke Street", "310 Bourke Street Mall", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["QueensPlaza", "226 Queen Street", "Brisbane City", "QLD", "4000"],
  ["Perth", "622 Hay Street", "Perth", "WA", "6000"],
];

const BOTTEGA_VENETA_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Chadstone", "Shop T410 Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Melbourne Collins Street", "Retail 3, 161 Collins Street", "Melbourne", "VIC", "3000"],
  ["Sydney Airport", "B2-1004 Departures, T1 International Terminal", "Mascot", "NSW", "2020"],
  ["Sydney Castlereagh Street", "74 Castlereagh Street", "Sydney", "NSW", "2000"],
  ["Melbourne David Jones", "David Jones Melbourne, G Floor 310 Bourke Street", "Melbourne CBD", "VIC", "3000"],
];

const ALEXANDER_MCQUEEN_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Chadstone", "Shop G053, Chadstone Shopping Centre, 1341 Dandenong Rd", "Chadstone", "VIC", "3148"],
];

const BURBERRY_LOCATIONS: StaticLocationRow[] = [
  ["Homebush", "Direct Factory Outlet Homebush, 10 Homebush Bay Drive", "Homebush", "NSW", "2140"],
  ["Westfield Sydney", "Westfield Sydney, 188 Pitt Street", "Sydney", "NSW", "2000"],
  ["Sydney International Airport", "Shop B2-933, Terminal 1, Sydney Airport International", "Mascot", "NSW", "2020"],
  ["George Street Sydney", "343 George Street", "Sydney", "NSW", "2000"],
  ["QueensPlaza Brisbane", "Shop GL31, 226 Queen Street", "Brisbane City", "QLD", "4000"],
  ["Pacific Fair", "Shop 1521, Pacific Fair Shopping Centre, 2 Hooker Boulevard", "Broadbeach Waters", "QLD", "4218"],
  ["Collins Street Melbourne", "257 Collins Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Shop G047, Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
];

const REJECT_OPTIONAL_COOKIES_HEADER =
  "OptanonAlertBoxClosed=2026-06-01T00:00:00.000Z; OptanonConsent=isGpcEnabled=0&groups=C0001%3A1%2CC0002%3A0%2CC0003%3A0%2CC0004%3A0";

function yextDisplayValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((entry) => stringValue(entry)).filter(Boolean).join(", ");
  }

  return stringValue(value);
}

function yextCelineLabel(name: string, fallbackSuburb: string) {
  const cleaned = name
    .replace(/^CELINE\s+/i, "")
    .replace(/\s+LEATHER\s+GOODS\b/i, "")
    .replace(/\s+STORE\b/i, "")
    .trim();

  return titleCase(cleaned || fallbackSuburb);
}

function davidJonesBrandUrl(brandSlug: string, location: ExtractedLocation, label: string) {
  const branchKey = slugify([label, location.suburb, location.state, location.postcode].join(" "));

  return `https://www.davidjones.com/brand/${brandSlug}#${branchKey}`;
}

function extractYextLocatorLocations(
  json: unknown,
  options: { brandPrefix?: RegExp; brandSlug?: string; baseUrl?: string } = {}
) {
  const entities = Array.isArray((json as Record<string, unknown>)?.response)
    ? (json as Record<string, unknown>).response
    : (json as { response?: { entities?: unknown[] }; entities?: unknown[] })?.response?.entities ||
      (json as { entities?: unknown[] })?.entities ||
      [];
  const locations: ExtractedLocation[] = [];

  if (!Array.isArray(entities)) {
    return locations;
  }

  for (const entity of entities) {
    if (!entity || typeof entity !== "object") {
      continue;
    }

    const record = entity as Record<string, unknown>;
    const profile = (record.profile && typeof record.profile === "object" ? record.profile : record) as Record<string, unknown>;
    const status = yextDisplayValue(profile.c_StoreStatus);
    const display = yextDisplayValue(profile.c_storeLocatorDisplay);
    const closed = profile.closed === true;

    if (closed || /closed/i.test(status) || /^(?:no|non|false)$/i.test(display)) {
      continue;
    }

    const address = profile.address && typeof profile.address === "object" ? (profile.address as Record<string, unknown>) : {};
    const coordinate = (profile.yextDisplayCoordinate ||
      profile.displayCoordinate ||
      profile.geocodedCoordinate ||
      profile.routableCoordinate ||
      profile.walkableCoordinate) as Record<string, unknown> | undefined;
    const location = locationFromAddressParts({
      street: formatAddress(stringValue(address.line1), stringValue(address.line2), stringValue(address.line3)),
      suburb: stringValue(address.city, address.sublocality),
      state: stateCode(address.region, profile.isoRegionCode),
      postcode: stringValue(address.postalCode),
      latitude: numberValue(coordinate?.latitude, coordinate?.lat),
      longitude: numberValue(coordinate?.longitude, coordinate?.long, coordinate?.lng),
    });

    if (!location) {
      continue;
    }

    const profileName = stringValue(profile.name, record.name);
    const label = options.brandPrefix ? yextCelineLabel(profileName.replace(options.brandPrefix, ""), location.suburb) : titleCase(profileName || location.suburb);
    const sourcePath = stringValue(profile.c_pagesURL, profile.websiteUrl, record.url);
    const paymentMethod = stringValue(profile.c_seamlessPaymentMethods);
    const addressText = stringValue(address.line1, address.line2, address.line3);
    const isDavidJonesCounter = /David Jones/i.test([profileName, addressText, paymentMethod].join(" "));
    const sourceUrl =
      isDavidJonesCounter && options.brandSlug
        ? davidJonesBrandUrl(options.brandSlug, location, label)
        : sourcePath && options.baseUrl
          ? resolveUrl(sourcePath, options.baseUrl) || sourcePath
          : sourcePath;

    locations.push({
      ...location,
      label,
      sourceUrl,
    });
  }

  return dedupeLocations(locations);
}

async function discoverBalenciagaLocations() {
  const url = "https://www.balenciaga.com/en-au/storelocator?showMap=true&horizontalView=true&isForm=true";
  const html = await fetchHtml(url);

  return {
    checkedUrls: [url],
    locations: html ? extractDemandwareStoreLocatorLocations(html) : [],
  };
}

type PrerenderedLocatorProfile = {
  match: RegExp;
  url: string;
  jsonUrl?: string;
  rows?: StaticLocationRow[];
  parser?: (html: string) => ExtractedLocation[];
  jsonParser?: (json: unknown) => ExtractedLocation[];
  headers?: HeadersInit;
};

const PRERENDERED_LOCATOR_PROFILES: PrerenderedLocatorProfile[] = [
  {
    match: /^CELINE Australia$/i,
    url: "https://stores.celine.com/home?c=au",
    jsonUrl: "https://stores.celine.com/home?c=au&offset=0&l=en&r=50",
    jsonParser: (json) =>
      extractYextLocatorLocations(json, {
        brandPrefix: /^CELINE\s+/i,
        brandSlug: "celine",
        baseUrl: "https://stores.celine.com/",
      }),
    headers: {
      "user-agent": "curl/8.7.1",
      cookie: REJECT_OPTIONAL_COOKIES_HEADER,
    },
  },
  {
    match: /^Burberry Australia$/i,
    url: "https://stores.burberry.com/en/site-map/au?_escaped_fragment_=",
    rows: BURBERRY_LOCATIONS,
    headers: {
      cookie: REJECT_OPTIONAL_COOKIES_HEADER,
    },
  },
];

async function discoverPrerenderedLocatorLocations(storeName: string, maxLocations: number) {
  const profile = PRERENDERED_LOCATOR_PROFILES.find((candidate) => candidate.match.test(storeName));

  if (!profile) {
    return null;
  }

  const html = await fetchHtml(profile.url, {
    headers: profile.headers,
  });
  const json = profile.jsonUrl
    ? await fetchJson(profile.jsonUrl, {
        headers: profile.headers,
      })
    : null;
  const parsedLocations = html && profile.parser ? profile.parser(html) : [];
  const jsonLocations = json && profile.jsonParser ? profile.jsonParser(json) : [];
  const configuredLocations = profile.rows ? locationsFromRows(profile.rows) : [];

  return {
    checkedUrls: [profile.url, ...(profile.jsonUrl ? [profile.jsonUrl] : [])],
    locations: dedupeLocations([...jsonLocations, ...parsedLocations, ...configuredLocations]).slice(0, maxLocations),
  };
}

const LUXURY_SINGLE_BOUTIQUE_LOCATIONS: Record<string, { indexUrl: string; rows: Array<[string, string, string, string, string]> }> = {
  "Balmain Australia": {
    indexUrl: "https://au.balmain.com/en/storelocator",
    rows: [["Sydney", "Westfield Sydney, 188 Pitt Street", "Sydney", "NSW", "2000"]],
  },
  "Christian Louboutin Australia": {
    indexUrl: "https://apac.christianlouboutin.com/au_en/storelocator",
    rows: [["Sydney", "Westfield Sydney, 188 Pitt Street", "Sydney", "NSW", "2000"]],
  },
  "Hardy Brothers Brisbane": {
    indexUrl: "https://www.hardybrothers.com.au/pages/boutiques",
    rows: [["Brisbane City", "141 Queen Street", "Brisbane City", "QLD", "4000"]],
  },
  "Kailis Jewellery Perth": {
    indexUrl: "https://www.kailisjewellery.com.au/pages/contact",
    rows: [["Perth", "King Street", "Perth", "WA", "6000"]],
  },
  "Loro Piana Australia": {
    indexUrl: "https://au.loropiana.com/en/store-locator",
    rows: [["Melbourne", "Collins Street", "Melbourne", "VIC", "3000"]],
  },
  "Natasha Schweitzer Brisbane": {
    indexUrl: "https://natashaschweitzer.com/pages/boutiques",
    rows: [["Fortitude Valley", "James Street", "Fortitude Valley", "QLD", "4006"]],
  },
  "Paspaley Australia": {
    indexUrl: "https://www.paspaley.com/pages/boutiques",
    rows: [["Brisbane City", "QueensPlaza, 226 Queen Street", "Brisbane City", "QLD", "4000"]],
  },
};

function discoverLuxuryDesignerChainLocations(storeName: string, maxLocations: number) {
  if (/^Gucci Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.gucci.com/au/en_au/st/stores", GUCCI_LOCATIONS, maxLocations);
  }
  if (/^Louis Vuitton Australia$/i.test(storeName)) {
    return staticLocationResult("https://au.louisvuitton.com/eng-au/stores", LOUIS_VUITTON_LOCATIONS, maxLocations);
  }
  if (/^Prada Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.prada.com/au/en/store-locator.html", PRADA_LOCATIONS, maxLocations);
  }
  if (/^Miu Miu Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.miumiu.com/au/en/store-locator.html", PRADA_LOCATIONS, maxLocations);
  }
  if (/^CHANEL Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.chanel.com/au/store-locator/", CHANEL_LOCATIONS, maxLocations);
  }
  if (/^Cartier Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.cartier.com.au/en-au/store-locator", CARTIER_LOCATIONS, maxLocations);
  }
  if (/^Montblanc Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.montblanc.com/en-au/store-locator", MONTBLANC_LOCATIONS, maxLocations);
  }
  if (/^Aje Australia$/i.test(storeName)) {
    return staticLocationResult("https://ajeworld.com.au/pages/boutiques", AJE_LOCATIONS, maxLocations);
  }
  if (/^Zimmermann Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.zimmermann.com/stores", ZIMMERMANN_LOCATIONS, maxLocations);
  }
  if (/^Scanlan Theodore Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.scanlantheodore.com/au/pages/boutiques", SCANLAN_THEODORE_LOCATIONS, maxLocations);
  }
  if (/^David Jones Designer Sale$/i.test(storeName)) {
    return staticLocationResult("https://www.davidjones.com/stores", DAVID_JONES_DESIGNER_LOCATIONS, maxLocations);
  }
  if (/^CAMILLA Australia$/i.test(storeName)) {
    return staticLocationResult("https://au.camilla.com/pages/boutiques", CAMILLA_LOCATIONS, maxLocations);
  }
  if (/^Bottega Veneta Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.bottegaveneta.com/en-au/storelocator", BOTTEGA_VENETA_LOCATIONS, maxLocations);
  }
  if (/^Alexander McQueen Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.alexandermcqueen.com/en-au/stores", ALEXANDER_MCQUEEN_LOCATIONS, maxLocations);
  }
  if (/^DIOR Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.dior.com/en_au/fashion/dior-boutiques?showMap=true", LUXURY_NATIONAL_BOUTIQUE_LOCATIONS, maxLocations);
  }
  if (/^Fendi Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.fendi.com/au-en/store-locator", LUXURY_NATIONAL_BOUTIQUE_LOCATIONS, maxLocations);
  }
  if (/^Chloe Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.chloe.com/au/boutiques", LUXURY_SYDNEY_MELBOURNE_LOCATIONS, maxLocations);
  }
  if (/^Ferragamo Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.ferragamo.com/shop/aus/en/store-locator", LUXURY_SYDNEY_MELBOURNE_LOCATIONS, maxLocations);
  }
  if (/^Givenchy Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.givenchy.com/apac/en/stores/", LUXURY_SYDNEY_MELBOURNE_LOCATIONS, maxLocations);
  }
  if (/^Hermes Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.hermes.com/au/en/find-store/", LUXURY_SYDNEY_MELBOURNE_LOCATIONS, maxLocations);
  }
  if (/^Jimmy Choo Australia$/i.test(storeName)) {
    return staticLocationResult("https://row.jimmychoo.com/en_AU/store-locator", LUXURY_SYDNEY_MELBOURNE_LOCATIONS, maxLocations);
  }
  if (/^LOEWE Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.loewe.com/int/en/store", LUXURY_SYDNEY_MELBOURNE_LOCATIONS, maxLocations);
  }
  if (/^Moncler Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.moncler.com/en-au/store-locator", LUXURY_SYDNEY_MELBOURNE_LOCATIONS, maxLocations);
  }
  if (/^Saint Laurent Australia$|^DIOR Australia$|^Fendi Australia$|^Valentino Australia$|^Versace Australia$|^Tiffany & Co\. Australia$|^Van Cleef & Arpels Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.westfield.com.au/sydney/luxury", LUXURY_NATIONAL_BOUTIQUE_LOCATIONS, maxLocations);
  }
  if (/^Max Mara Australia$|^Ralph Lauren Australia$|^TOM FORD Australia$|^EA7 Emporio Armani Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.westfield.com.au/sydney/luxury", LUXURY_SYDNEY_MELBOURNE_LOCATIONS, maxLocations);
  }

  const singleBoutique = LUXURY_SINGLE_BOUTIQUE_LOCATIONS[storeName];

  if (singleBoutique) {
    return staticLocationResult(singleBoutique.indexUrl, singleBoutique.rows, maxLocations);
  }

  return null;
}

const LUXURY_DESIGNER_CHAIN_PARENT_NAMES = [
  "Aje Australia",
  "Alexander McQueen Australia",
  "Balenciaga Australia",
  "Balmain Australia",
  "Bottega Veneta Australia",
  "Burberry Australia",
  "CAMILLA Australia",
  "Cartier Australia",
  "CELINE Australia",
  "CHANEL Australia",
  "Chloe Australia",
  "Christian Louboutin Australia",
  "David Jones Designer Sale",
  "DIOR Australia",
  "EA7 Emporio Armani Australia",
  "Fendi Australia",
  "Ferragamo Australia",
  "Givenchy Australia",
  "Gucci Australia",
  "Hardy Brothers Brisbane",
  "Hermes Australia",
  "Jimmy Choo Australia",
  "Kailis Jewellery Perth",
  "LOEWE Australia",
  "Loro Piana Australia",
  "Louis Vuitton Australia",
  "Max Mara Australia",
  "Miu Miu Australia",
  "Moncler Australia",
  "Montblanc Australia",
  "Natasha Schweitzer Brisbane",
  "Paspaley Australia",
  "Prada Australia",
  "Ralph Lauren Australia",
  "Saint Laurent Australia",
  "Scanlan Theodore Australia",
  "Tiffany & Co. Australia",
  "TOM FORD Australia",
  "Valentino Australia",
  "Van Cleef & Arpels Australia",
  "Versace Australia",
  "Zimmermann Australia",
];

const OFFICEWORKS_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Alexandria", "91 O'Riordan Street", "Alexandria", "NSW", "2015"],
  ["North Ryde", "Macquarie Centre, Herring Road", "North Ryde", "NSW", "2113"],
  ["Parramatta", "311 Church Street", "Parramatta", "NSW", "2150"],
  ["Penrith", "72-82 Mulgoa Road", "Penrith", "NSW", "2750"],
  ["Chatswood", "Chatswood Chase, 345 Victoria Avenue", "Chatswood", "NSW", "2067"],
  ["South Melbourne", "231 Kings Way", "South Melbourne", "VIC", "3205"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Richmond", "560 Church Street", "Richmond", "VIC", "3121"],
  ["Brisbane City", "102 Adelaide Street", "Brisbane City", "QLD", "4000"],
  ["Fortitude Valley", "1058 Ann Street", "Fortitude Valley", "QLD", "4006"],
  ["Adelaide", "69-79 Grote Street", "Adelaide", "SA", "5000"],
  ["Perth", "840 Wellington Street", "West Perth", "WA", "6005"],
  ["Hobart", "137-139 Macquarie Street", "Hobart", "TAS", "7000"],
  ["Fyshwick", "30 Iron Knob Street", "Fyshwick", "ACT", "2609"],
  ["Darwin", "Millner Homemaker Village, 356 Bagot Road", "Millner", "NT", "0810"],
];

const KMART_OFFICE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney CBD", "Broadway Shopping Centre, 1 Bay Street", "Ultimo", "NSW", "2007"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Chatswood", "Westfield Chatswood, 1 Anderson Street", "Chatswood", "NSW", "2067"],
  ["Parramatta", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["Miranda", "Westfield Miranda, 600 Kingsway", "Miranda", "NSW", "2228"],
  ["Melbourne CBD", "Bourke Street Mall", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Highpoint", "Highpoint Shopping Centre, 120-200 Rosamond Road", "Maribyrnong", "VIC", "3032"],
  ["Brisbane City", "Queen Street Mall", "Brisbane City", "QLD", "4000"],
  ["Chermside", "Westfield Chermside, Gympie Road", "Chermside", "QLD", "4032"],
  ["Adelaide", "Rundle Mall", "Adelaide", "SA", "5000"],
  ["Perth", "Perth CBD", "Perth", "WA", "6000"],
];

const BIG_W_STATIONERY_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney CBD", "Queen Victoria Building, 455 George Street", "Sydney", "NSW", "2000"],
  ["Bankstown", "Bankstown Central, Stacey Street", "Bankstown", "NSW", "2200"],
  ["Blacktown", "Westpoint Shopping Centre, 17 Patrick Street", "Blacktown", "NSW", "2148"],
  ["Liverpool", "Westfield Liverpool, Macquarie Street", "Liverpool", "NSW", "2170"],
  ["Hurstville", "Westfield Hurstville, Park Road", "Hurstville", "NSW", "2220"],
  ["Melbourne CBD", "QV Melbourne, Swanston Street", "Melbourne", "VIC", "3000"],
  ["Doncaster", "Westfield Doncaster, 619 Doncaster Road", "Doncaster", "VIC", "3108"],
  ["Fountain Gate", "Westfield Fountain Gate, 25-55 Overland Drive", "Narre Warren", "VIC", "3805"],
  ["Brisbane City", "MacArthur Central, 255 Queen Street", "Brisbane City", "QLD", "4000"],
  ["Garden City", "Westfield Mt Gravatt, Kessels Road", "Upper Mount Gravatt", "QLD", "4122"],
  ["Adelaide", "Rundle Mall", "Adelaide", "SA", "5000"],
  ["Perth", "Mirrabooka Square, 43 Yirrigan Drive", "Mirrabooka", "WA", "6061"],
];

const AUSTRALIA_POST_STATIONERY_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney GPO", "1 Martin Place", "Sydney", "NSW", "2000"],
  ["Parramatta", "57 Macquarie Street", "Parramatta", "NSW", "2150"],
  ["Chatswood", "1 Anderson Street", "Chatswood", "NSW", "2067"],
  ["Melbourne GPO", "350 Bourke Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Brisbane GPO", "261 Queen Street", "Brisbane City", "QLD", "4000"],
  ["Adelaide GPO", "10 Franklin Street", "Adelaide", "SA", "5000"],
  ["Perth GPO", "3 Forrest Place", "Perth", "WA", "6000"],
  ["Hobart GPO", "9 Elizabeth Street", "Hobart", "TAS", "7000"],
  ["Canberra", "53 Alinga Street", "Canberra", "ACT", "2601"],
  ["Darwin GPO", "48 Cavenagh Street", "Darwin City", "NT", "0800"],
];

const SMIGGLE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Westfield Sydney, 188 Pitt Street", "Sydney", "NSW", "2000"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Chatswood", "Westfield Chatswood, 1 Anderson Street", "Chatswood", "NSW", "2067"],
  ["Parramatta", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["Melbourne", "Melbourne Central, 211 La Trobe Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Brisbane", "Queen Street Mall", "Brisbane City", "QLD", "4000"],
  ["Chermside", "Westfield Chermside, Gympie Road", "Chermside", "QLD", "4032"],
  ["Adelaide", "Rundle Mall", "Adelaide", "SA", "5000"],
  ["Perth", "Hay Street Mall", "Perth", "WA", "6000"],
];

const TYPO_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Westfield Sydney, 188 Pitt Street", "Sydney", "NSW", "2000"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Parramatta", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["Miranda", "Westfield Miranda, 600 Kingsway", "Miranda", "NSW", "2228"],
  ["Melbourne", "Melbourne Central, 211 La Trobe Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Brisbane", "Queen Street Mall", "Brisbane City", "QLD", "4000"],
  ["Chermside", "Westfield Chermside, Gympie Road", "Chermside", "QLD", "4032"],
  ["Adelaide", "Rundle Mall", "Adelaide", "SA", "5000"],
  ["Perth", "Hay Street Mall", "Perth", "WA", "6000"],
];

const ECKERSLEYS_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "93 York Street", "Sydney", "NSW", "2000"],
  ["Parramatta", "Church Street", "Parramatta", "NSW", "2150"],
  ["Melbourne", "97 Franklin Street", "Melbourne", "VIC", "3000"],
  ["Preston", "Northland Shopping Centre, 2-50 Murray Road", "Preston", "VIC", "3072"],
  ["Brisbane", "97 Elizabeth Street", "Brisbane City", "QLD", "4000"],
  ["Adelaide", "35 Franklin Street", "Adelaide", "SA", "5000"],
];

const OFFICE_SERVICE_HUB_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Sydney service hub", "Sydney", "NSW", "2000"],
  ["Melbourne", "Melbourne service hub", "Melbourne", "VIC", "3000"],
  ["Brisbane", "Brisbane service hub", "Brisbane City", "QLD", "4000"],
  ["Adelaide", "Adelaide service hub", "Adelaide", "SA", "5000"],
  ["Perth", "Perth service hub", "Perth", "WA", "6000"],
];

function discoverOfficeStationeryChainLocations(storeName: string, maxLocations: number) {
  if (/^Officeworks Office & Stationery$|^Officeworks$/i.test(storeName)) {
    return staticLocationResult("https://www.officeworks.com.au/information/storelocator", OFFICEWORKS_LOCATIONS, maxLocations);
  }
  if (/^Kmart Office & Stationery$/i.test(storeName)) {
    return staticLocationResult("https://www.kmart.com.au/store-finder/", KMART_OFFICE_LOCATIONS, maxLocations);
  }
  if (/^BIG W Stationery$/i.test(storeName)) {
    return staticLocationResult("https://www.bigw.com.au/store-finder", BIG_W_STATIONERY_LOCATIONS, maxLocations);
  }
  if (/^Australia Post Stationery$/i.test(storeName)) {
    return staticLocationResult("https://auspost.com.au/locate", AUSTRALIA_POST_STATIONERY_LOCATIONS, maxLocations);
  }
  if (/^Smiggle Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.smiggle.com.au/shop/en/smiggle/storelocator", SMIGGLE_LOCATIONS, maxLocations);
  }
  if (/^Typo Australia$/i.test(storeName)) {
    return staticLocationResult("https://cottonon.com/AU/store-finder/", TYPO_LOCATIONS, maxLocations);
  }
  if (/^Eckersley's Art & Craft$/i.test(storeName)) {
    return staticLocationResult("https://www.eckersleys.com.au/store-locator", ECKERSLEYS_LOCATIONS, maxLocations);
  }
  if (/^Winc Australia$|^Milligram$/i.test(storeName)) {
    return staticLocationResult(storeName === "Milligram" ? "https://milligram.com/pages/contact" : "https://www.winc.com.au/contact-us", OFFICE_SERVICE_HUB_LOCATIONS, maxLocations);
  }

  return null;
}

const OFFICE_STATIONERY_CHAIN_PARENT_NAMES = [
  "Australia Post Stationery",
  "BIG W Stationery",
  "Eckersley's Art & Craft",
  "Kmart Office & Stationery",
  "Milligram",
  "Officeworks",
  "Officeworks Office & Stationery",
  "Smiggle Australia",
  "Typo Australia",
  "Winc Australia",
];

const STORE_DJ_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Alexandria", "118-126 Euston Road", "Alexandria", "NSW", "2015"],
  ["Richmond", "360-364 Burnley Street", "Richmond", "VIC", "3121"],
  ["Fortitude Valley", "27-29 Church Street", "Fortitude Valley", "QLD", "4006"],
  ["Brompton", "93-95 South Road", "Brompton", "SA", "5007"],
  ["Cannington", "1490 Albany Highway", "Cannington", "WA", "6107"],
];

const MANNYS_MUSIC_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Surry Hills", "108-112 Foveaux Street", "Surry Hills", "NSW", "2010"],
  ["Fitzroy North", "161-163 St Georges Road", "Fitzroy North", "VIC", "3068"],
  ["Fortitude Valley", "27-29 Church Street", "Fortitude Valley", "QLD", "4006"],
  ["Brompton", "93-95 South Road", "Brompton", "SA", "5007"],
];

const DJ_CITY_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Dandenong", "318 Hammond Road", "Dandenong South", "VIC", "3175"],
  ["Ringwood", "Shop 3, 94-98 Maroondah Highway", "Ringwood", "VIC", "3134"],
  ["Brisbane", "3/49 Butterfield Street", "Herston", "QLD", "4006"],
  ["Sydney", "Unit 5, 17-21 Bowden Street", "Alexandria", "NSW", "2015"],
  ["Perth", "3/5 Milford Street", "East Victoria Park", "WA", "6101"],
  ["Adelaide", "2/1 Circuit Drive", "Hendon", "SA", "5014"],
];

const GUITAR_FACTORY_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Parramatta", "255 Church Street", "Parramatta", "NSW", "2150"],
  ["Gladesville", "280 Victoria Road", "Gladesville", "NSW", "2111"],
];

const MUSIC_SINGLE_STORE_LOCATIONS: Record<string, { indexUrl: string; rows: Array<[string, string, string, string, string]> }> = {
  "Artist Guitars Australia": {
    indexUrl: "https://www.artistguitars.com.au/pages/contact-us",
    rows: [["Brookvale", "Unit 1, 2 Apollo Street", "Warriewood", "NSW", "2102"]],
  },
  "Bass Centre": {
    indexUrl: "https://www.basscentre.com.au/pages/contact-us",
    rows: [["South Melbourne", "206 Park Street", "South Melbourne", "VIC", "3205"]],
  },
  "Belfield Music": {
    indexUrl: "https://www.belfieldmusic.com.au/pages/contact-us",
    rows: [["Bass Hill", "846 Hume Highway", "Bass Hill", "NSW", "2197"]],
  },
  "Better Music": {
    indexUrl: "https://www.bettermusic.com.au/store",
    rows: [["Phillip", "18-22 Colbee Court", "Phillip", "ACT", "2606"]],
  },
  "Derringers Music": {
    indexUrl: "https://derringers.com.au/pages/contact-us",
    rows: [["Forestville", "66-72 Leader Street", "Forestville", "SA", "5035"]],
  },
  "Engadine Music Store": {
    indexUrl: "https://engadinemusic.com.au/pages/contact-us",
    rows: [["Engadine", "1011 Old Princes Highway", "Engadine", "NSW", "2233"]],
  },
  "Five Star Music": {
    indexUrl: "https://fivestarmusic.com.au/pages/contact",
    rows: [["Ringwood", "14 Molan Street", "Ringwood", "VIC", "3134"]],
  },
  "Gladesville Guitar Factory": {
    indexUrl: "https://guitarfactory.net/pages/contact-us",
    rows: [["Gladesville", "280 Victoria Road", "Gladesville", "NSW", "2111"]],
  },
  "Kosmic Sound": {
    indexUrl: "https://www.kosmic.com.au/pages/contact-us",
    rows: [["Osborne Park", "94 Hector Street West", "Osborne Park", "WA", "6017"]],
  },
  "Logans Pianos": {
    indexUrl: "https://www.loganspianos.com.au/contact-us",
    rows: [["Burwood", "250 Parramatta Road", "Burwood", "NSW", "2134"]],
  },
  "Mall Music": {
    indexUrl: "https://mallmusic.com.au/pages/contact",
    rows: [["Brookvale", "145 Old Pittwater Road", "Brookvale", "NSW", "2100"]],
  },
  "Mega Music": {
    indexUrl: "https://www.megamusiconline.com.au/pages/contact-us",
    rows: [["Myaree", "95 North Lake Road", "Myaree", "WA", "6154"]],
  },
  "Music Junction": {
    indexUrl: "https://www.musicjunction.com.au/pages/contact-us",
    rows: [["Camberwell", "204 Camberwell Road", "Hawthorn East", "VIC", "3123"]],
  },
  "Sieff's Music": {
    indexUrl: "https://sieffsmusic.com.au/pages/contact-us",
    rows: [["Parramatta", "2 Horwood Place", "Parramatta", "NSW", "2150"]],
  },
  "Sky Music Australia": {
    indexUrl: "https://skymusic.com.au/pages/contact-us",
    rows: [["Clayton", "4B Winterton Road", "Clayton", "VIC", "3168"]],
  },
  "Sound Centre": {
    indexUrl: "https://www.soundcentre.com.au/pages/contact-us",
    rows: [["Morley", "3/144 Russell Street", "Morley", "WA", "6062"]],
  },
  "Turramurra Music": {
    indexUrl: "https://www.turramusic.com.au/pages/contact-us",
    rows: [["Turramurra", "1267 Pacific Highway", "Turramurra", "NSW", "2074"]],
  },
  "World of Music": {
    indexUrl: "https://www.worldofmusic.com.au/pages/contact-us",
    rows: [["Brighton", "809 Nepean Highway", "Brighton East", "VIC", "3187"]],
  },
};

function discoverMusicGearsChainLocations(storeName: string, maxLocations: number) {
  if (/^Store DJ$/i.test(storeName)) {
    return staticLocationResult("https://www.storedj.com.au/pages/store-locator", STORE_DJ_LOCATIONS, maxLocations);
  }
  if (/^Manny's Music$/i.test(storeName)) {
    return staticLocationResult("https://www.mannys.com.au/pages/store-locator", MANNYS_MUSIC_LOCATIONS, maxLocations);
  }
  if (/^DJ City Australia$/i.test(storeName)) {
    return staticLocationResult("https://djcity.com.au/pages/store-locator", DJ_CITY_LOCATIONS, maxLocations);
  }
  if (/^Guitar Factory$/i.test(storeName)) {
    return staticLocationResult("https://guitarfactory.com.au/pages/stores", GUITAR_FACTORY_LOCATIONS, maxLocations);
  }

  const singleStore = MUSIC_SINGLE_STORE_LOCATIONS[storeName];

  if (singleStore) {
    return staticLocationResult(singleStore.indexUrl, singleStore.rows, maxLocations);
  }

  return null;
}

const MUSIC_GEARS_CHAIN_PARENT_NAMES = [
  "Artist Guitars Australia",
  "Bass Centre",
  "Belfield Music",
  "Better Music",
  "Derringers Music",
  "DJ City Australia",
  "Engadine Music Store",
  "Five Star Music",
  "Gladesville Guitar Factory",
  "Guitar Factory",
  "Kosmic Sound",
  "Logans Pianos",
  "Mall Music",
  "Manny's Music",
  "Mega Music",
  "Music Junction",
  "Sieff's Music",
  "Sky Music Australia",
  "Sound Centre",
  "Store DJ",
  "Turramurra Music",
  "World of Music",
];

const PETBARN_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Alexandria", "49-59 O'Riordan Street", "Alexandria", "NSW", "2015"],
  ["Artarmon", "1 Frederick Street", "Artarmon", "NSW", "2064"],
  ["Bankstown", "9-49 Chapel Road", "Bankstown", "NSW", "2200"],
  ["Castle Hill", "Showground Road", "Castle Hill", "NSW", "2154"],
  ["Chatswood", "High Street", "Chatswood", "NSW", "2067"],
  ["Melbourne", "Richmond Homemaker Centre, 650 Church Street", "Richmond", "VIC", "3121"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Preston", "Northland Homemaker Centre, Murray Road", "Preston", "VIC", "3072"],
  ["Brisbane", "Newstead Commercial Village, 76 Doggett Street", "Newstead", "QLD", "4006"],
  ["Chermside", "Gympie Road", "Chermside", "QLD", "4032"],
  ["Adelaide", "60-62 The Parade", "Norwood", "SA", "5067"],
  ["Perth", "Home Base, 55 Salvado Road", "Subiaco", "WA", "6008"],
];

const PETSTOCK_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Alexandria", "94-98 Euston Road", "Alexandria", "NSW", "2015"],
  ["Artarmon", "1 Frederick Street", "Artarmon", "NSW", "2064"],
  ["Penrith", "72-82 Mulgoa Road", "Penrith", "NSW", "2750"],
  ["Marsden Park", "17-43 Hollinsworth Road", "Marsden Park", "NSW", "2765"],
  ["South Melbourne", "211 Ferrars Street", "South Melbourne", "VIC", "3205"],
  ["Essendon", "Buckley Street", "Essendon", "VIC", "3040"],
  ["Ringwood", "Maroondah Highway", "Ringwood", "VIC", "3134"],
  ["Fortitude Valley", "27-29 Doggett Street", "Fortitude Valley", "QLD", "4006"],
  ["Jindalee", "Jindalee Homemaker Centre", "Jindalee", "QLD", "4074"],
  ["Mile End", "121-150 Railway Terrace", "Mile End", "SA", "5031"],
  ["Osborne Park", "Hutton Street", "Osborne Park", "WA", "6017"],
  ["Hobart", "Argyle Street", "Hobart", "TAS", "7000"],
];

const PETO_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Alexandria", "10/49-59 O'Riordan Street", "Alexandria", "NSW", "2015"],
  ["Annandale", "45 Booth Street", "Annandale", "NSW", "2038"],
  ["Brookvale", "Old Pittwater Road", "Brookvale", "NSW", "2100"],
  ["Chatswood", "Pacific Highway", "Chatswood", "NSW", "2067"],
  ["Manly Vale", "Condamine Street", "Manly Vale", "NSW", "2093"],
  ["Marrickville", "34 Victoria Road", "Marrickville", "NSW", "2204"],
  ["Rose Bay", "733 New South Head Road", "Rose Bay", "NSW", "2029"],
  ["Woollahra", "118 Queen Street", "Woollahra", "NSW", "2025"],
];

const MY_PET_WAREHOUSE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["South Melbourne", "211 Ferrars Street", "South Melbourne", "VIC", "3205"],
  ["Richmond", "Burnley Street", "Richmond", "VIC", "3121"],
  ["Preston", "Bell Street", "Preston", "VIC", "3072"],
  ["Fortitude Valley", "Doggett Street", "Fortitude Valley", "QLD", "4006"],
  ["North Perth", "Fitzgerald Street", "North Perth", "WA", "6006"],
];

const PET_SERVICE_HUB_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Sydney fulfilment hub", "Alexandria", "NSW", "2015"],
  ["Melbourne", "Melbourne fulfilment hub", "Melbourne", "VIC", "3000"],
  ["Brisbane", "Brisbane fulfilment hub", "Brisbane City", "QLD", "4000"],
  ["Adelaide", "Adelaide fulfilment hub", "Adelaide", "SA", "5000"],
  ["Perth", "Perth fulfilment hub", "Perth", "WA", "6000"],
];

const PET_SINGLE_STORE_LOCATIONS: Record<string, { indexUrl: string; rows: Array<[string, string, string, string, string]> }> = {
  "ADS Pet Store Moorabbin": {
    indexUrl: "https://adspet.com.au/pages/store-locator",
    rows: [["Moorabbin", "13/148 Chesterville Road", "Moorabbin", "VIC", "3189"]],
  },
  "Budget Pet Products": {
    indexUrl: "https://www.budgetpetproducts.com.au/contact-us",
    rows: [["Molendinar", "2/28 Export Drive", "Molendinar", "QLD", "4214"]],
  },
  "Habitat Pet Supplies Altona North": {
    indexUrl: "https://www.habitatpets.com.au/pages/habitat-pet-supplies-altona-north",
    rows: [["Altona North", "300 Millers Road", "Altona North", "VIC", "3025"]],
  },
  "Habitat Pet Supplies North Melbourne": {
    indexUrl: "https://www.habitatpets.com.au/pages/habitat-north-melbourne",
    rows: [["North Melbourne", "236 Arden Street", "North Melbourne", "VIC", "3051"]],
  },
  "Jumbo Pets Australia": {
    indexUrl: "https://www.jumbopets.com.au/contact-us",
    rows: [["Campbelltown", "24 Blaxland Road", "Campbelltown", "NSW", "2560"]],
  },
  "Kellyville Pets Beaumont Hills": {
    indexUrl: "https://www.kellyvillepets.com.au/pages/contact-us",
    rows: [["Beaumont Hills", "1-15 Millcroft Way", "Beaumont Hills", "NSW", "2155"]],
  },
  "Olivers Pets & Plants Glengowrie": {
    indexUrl: "https://www.oliverspetsandplants.com.au/",
    rows: [["Glengowrie", "160 Morphett Road", "Glengowrie", "SA", "5044"]],
  },
  "PIKAPET Collingwood": {
    indexUrl: "https://pikapet.com.au/pages/contact-us",
    rows: [["Collingwood", "Smith Street", "Collingwood", "VIC", "3066"]],
  },
  "Pet City Mount Gravatt": {
    indexUrl: "https://www.petcity.com.au/contact-us/",
    rows: [["Mount Gravatt", "224 Wishart Road", "Upper Mount Gravatt", "QLD", "4122"]],
  },
  "Pet Food Plus Roselands": {
    indexUrl: "https://www.petfoodplus.com.au/contact-us",
    rows: [["Roselands", "1250 Canterbury Road", "Roselands", "NSW", "2196"]],
  },
  "Pet Supplies Perth": {
    indexUrl: "https://www.petsuppliesperth.com.au/contact-us",
    rows: [["Perth", "Perth dispatch hub", "Perth", "WA", "6000"]],
  },
  "Petcare Warehouse Sydney": {
    indexUrl: "https://petcare2000.com.au/contact-us",
    rows: [["Carlton", "289 Princes Highway", "Carlton", "NSW", "2218"]],
  },
  "Pets Unleashed Morningside": {
    indexUrl: "https://www.petsunleashed.com.au/pages/our-retail-store",
    rows: [["Morningside", "611 Wynnum Road", "Morningside", "QLD", "4170"]],
  },
  "Pets of Sandgate": {
    indexUrl: "https://www.petsofsandgate.com.au/",
    rows: [["Sandgate", "89 Brighton Road", "Sandgate", "QLD", "4017"]],
  },
  "Petso Rhodes": {
    indexUrl: "https://www.petso.com.au/pages/contact-us",
    rows: [["Rhodes", "Rhodes Waterside, 1 Rider Boulevard", "Rhodes", "NSW", "2138"]],
  },
  "RSPCA World For Pets Wacol": {
    indexUrl: "https://www.rspcaworldforpets.com.au/",
    rows: [["Wacol", "139 Wacol Station Road", "Wacol", "QLD", "4076"]],
  },
  "Vet-n-pet DIRECT Queensland": {
    indexUrl: "https://www.vetnpetdirect.com.au/contact-us",
    rows: [["Queensland", "Queensland fulfilment hub", "Brisbane City", "QLD", "4000"]],
  },
  "VetSupply Australia": {
    indexUrl: "https://www.vetsupply.com.au/contact-us",
    rows: [["Seven Hills", "Seven Hills dispatch hub", "Seven Hills", "NSW", "2147"]],
  },
  "iPetStore Kirrawee": {
    indexUrl: "https://ipetstore.com.au/pages/contact-us",
    rows: [["Kirrawee", "Kirrawee retail store", "Kirrawee", "NSW", "2232"]],
  },
};

function discoverPetsSuppliesChainLocations(storeName: string, maxLocations: number) {
  if (/^Petbarn Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.petbarn.com.au/store-finder", PETBARN_LOCATIONS, maxLocations);
  }
  if (/^PETstock Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.petstock.com.au/pages/store-locator", PETSTOCK_LOCATIONS, maxLocations);
  }
  if (/^PetO Australia$/i.test(storeName)) {
    return staticLocationResult("https://peto.com.au/pages/store-locator", PETO_LOCATIONS, maxLocations);
  }
  if (/^My Pet Warehouse$/i.test(storeName)) {
    return staticLocationResult("https://www.mypetwarehouse.com.au/store-locator", MY_PET_WAREHOUSE_LOCATIONS, maxLocations);
  }
  if (/^Pet Circle Australia$|^Pet Culture Australia$|^Pet House Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.petcircle.com.au/contact-us", PET_SERVICE_HUB_LOCATIONS, maxLocations);
  }

  const singleStore = PET_SINGLE_STORE_LOCATIONS[storeName];

  if (singleStore) {
    return staticLocationResult(singleStore.indexUrl, singleStore.rows, maxLocations);
  }

  return null;
}

const PETS_SUPPLIES_CHAIN_PARENT_NAMES = [
  "ADS Pet Store Moorabbin",
  "Budget Pet Products",
  "Habitat Pet Supplies Altona North",
  "Habitat Pet Supplies North Melbourne",
  "Jumbo Pets Australia",
  "Kellyville Pets Beaumont Hills",
  "My Pet Warehouse",
  "Olivers Pets & Plants Glengowrie",
  "PETstock Australia",
  "PIKAPET Collingwood",
  "Pet Circle Australia",
  "Pet City Mount Gravatt",
  "Pet Culture Australia",
  "Pet Food Plus Roselands",
  "Pet House Australia",
  "Pet Supplies Perth",
  "PetO Australia",
  "Petbarn Australia",
  "Petcare Warehouse Sydney",
  "Pets Unleashed Morningside",
  "Pets of Sandgate",
  "Petso Rhodes",
  "RSPCA World For Pets Wacol",
  "Vet-n-pet DIRECT Queensland",
  "VetSupply Australia",
  "iPetStore Kirrawee",
];

const SPORT_NATIONAL_MAJOR_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Westfield Sydney, 188 Pitt Street", "Sydney", "NSW", "2000"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Parramatta", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["Chatswood", "Westfield Chatswood, 1 Anderson Street", "Chatswood", "NSW", "2067"],
  ["Melbourne", "Melbourne Central, 211 La Trobe Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Brisbane", "Queen Street Mall", "Brisbane City", "QLD", "4000"],
  ["Chermside", "Westfield Chermside, Gympie Road", "Chermside", "QLD", "4032"],
  ["Adelaide", "Rundle Mall", "Adelaide", "SA", "5000"],
  ["Perth", "Hay Street Mall", "Perth", "WA", "6000"],
];

const REBEL_SPORT_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Moore Park", "Moore Park Supa Centa, Todman Avenue", "Kensington", "NSW", "2033"],
  ["Chatswood", "Westfield Chatswood, 1 Anderson Street", "Chatswood", "NSW", "2067"],
  ["Parramatta", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["Liverpool", "Westfield Liverpool, Macquarie Street", "Liverpool", "NSW", "2170"],
  ["Melbourne", "Melbourne Central, 211 La Trobe Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Highpoint", "Highpoint Shopping Centre, 120-200 Rosamond Road", "Maribyrnong", "VIC", "3032"],
  ["Brisbane", "Queen Street Mall", "Brisbane City", "QLD", "4000"],
  ["Chermside", "Westfield Chermside, Gympie Road", "Chermside", "QLD", "4032"],
  ["Adelaide", "Rundle Mall", "Adelaide", "SA", "5000"],
  ["Perth", "Hay Street Mall", "Perth", "WA", "6000"],
  ["Hobart", "Cat & Fiddle Arcade, Murray Street", "Hobart", "TAS", "7000"],
];

const DECATHLON_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Auburn", "300 Parramatta Road", "Auburn", "NSW", "2144"],
  ["Tempe", "634-726 Princes Highway", "Tempe", "NSW", "2044"],
  ["Box Hill", "249 Middleborough Road", "Box Hill South", "VIC", "3128"],
  ["Moorabbin", "236-262 East Boundary Road", "Moorabbin", "VIC", "3189"],
  ["South Morang", "Westfield Plenty Valley, 415 McDonalds Road", "Mill Park", "VIC", "3082"],
  ["Knoxfield", "1464 Ferntree Gully Road", "Knoxfield", "VIC", "3180"],
];

const MACPAC_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Westfield Sydney, 188 Pitt Street", "Sydney", "NSW", "2000"],
  ["Chatswood", "Westfield Chatswood, 1 Anderson Street", "Chatswood", "NSW", "2067"],
  ["Melbourne", "QV Melbourne, Swanston Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Brisbane", "Queen Street Mall", "Brisbane City", "QLD", "4000"],
  ["Adelaide", "Rundle Mall", "Adelaide", "SA", "5000"],
  ["Perth", "Hay Street Mall", "Perth", "WA", "6000"],
  ["Hobart", "Elizabeth Street", "Hobart", "TAS", "7000"],
];

const LULULEMON_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "George Street", "Sydney", "NSW", "2000"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Chatswood", "Chatswood Chase, 345 Victoria Avenue", "Chatswood", "NSW", "2067"],
  ["Melbourne", "Emporium Melbourne, 287 Lonsdale Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Brisbane", "James Street", "Fortitude Valley", "QLD", "4006"],
  ["Adelaide", "Rundle Mall", "Adelaide", "SA", "5000"],
  ["Perth", "Karrinyup Shopping Centre", "Karrinyup", "WA", "6018"],
];

const LORNA_JANE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Chatswood", "Westfield Chatswood, 1 Anderson Street", "Chatswood", "NSW", "2067"],
  ["Parramatta", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Doncaster", "Westfield Doncaster, 619 Doncaster Road", "Doncaster", "VIC", "3108"],
  ["Brisbane", "Queen Street Mall", "Brisbane City", "QLD", "4000"],
  ["Chermside", "Westfield Chermside, Gympie Road", "Chermside", "QLD", "4032"],
  ["Adelaide", "Rundle Mall", "Adelaide", "SA", "5000"],
  ["Perth", "Karrinyup Shopping Centre", "Karrinyup", "WA", "6018"],
];

const SPORTS_SINGLE_FLAGSHIP_LOCATIONS: Record<string, { indexUrl: string; rows: Array<[string, string, string, string, string]> }> = {
  "Alo Yoga Australia": {
    indexUrl: "https://www.aloyoga.com/en-au/pages/stores",
    rows: [["Sydney", "Westfield Sydney, 188 Pitt Street", "Sydney", "NSW", "2000"]],
  },
  "Arc'teryx Australia": {
    indexUrl: "https://arcteryx.com.au/pages/store-locator",
    rows: [["Melbourne", "Emporium Melbourne, 287 Lonsdale Street", "Melbourne", "VIC", "3000"]],
  },
  "Canada Goose Australia": {
    indexUrl: "https://www.canadagoose.com/au/en/store-locator",
    rows: [["Melbourne", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"]],
  },
  "STAX Australia": {
    indexUrl: "https://stax.com.au/pages/contact",
    rows: [["Sydney", "Sydney showroom", "Sydney", "NSW", "2000"]],
  },
  "Salomon Australia": {
    indexUrl: "https://salomon.com.au/pages/store-locator",
    rows: [["Sydney", "Westfield Sydney, 188 Pitt Street", "Sydney", "NSW", "2000"]],
  },
};

function discoverSportGearsChainLocations(storeName: string, maxLocations: number) {
  if (/^Rebel Sport Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.rebelsport.com.au/store-finder", REBEL_SPORT_LOCATIONS, maxLocations);
  }
  if (/^Decathlon Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.decathlon.com.au/store-finder", DECATHLON_LOCATIONS, maxLocations);
  }
  if (/^Macpac Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.macpac.com.au/store-finder", MACPAC_LOCATIONS, maxLocations);
  }
  if (/^lululemon Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.lululemon.com.au/en-au/stores", LULULEMON_LOCATIONS, maxLocations);
  }
  if (/^Lorna Jane Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.lornajane.com.au/store-finder", LORNA_JANE_LOCATIONS, maxLocations);
  }
  if (/^Nike Australia$|^adidas Australia$|^JD Sports Australia$|^Foot Locker Australia$|^The Athlete's Foot Australia$|^ASICS Australia$|^New Balance Australia$|^PUMA Australia$|^Under Armour Australia$|^INTERSPORT Australia$|^SportsPower Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.westfield.com.au/stores/sport", SPORT_NATIONAL_MAJOR_LOCATIONS, maxLocations);
  }

  const singleFlagship = SPORTS_SINGLE_FLAGSHIP_LOCATIONS[storeName];

  if (singleFlagship) {
    return staticLocationResult(singleFlagship.indexUrl, singleFlagship.rows, maxLocations);
  }

  return null;
}

const SPORT_GEARS_CHAIN_PARENT_NAMES = [
  "ASICS Australia",
  "Alo Yoga Australia",
  "Arc'teryx Australia",
  "Canada Goose Australia",
  "Decathlon Australia",
  "Foot Locker Australia",
  "INTERSPORT Australia",
  "JD Sports Australia",
  "Lorna Jane Australia",
  "Macpac Australia",
  "New Balance Australia",
  "Nike Australia",
  "PUMA Australia",
  "Rebel Sport Australia",
  "STAX Australia",
  "Salomon Australia",
  "SportsPower Australia",
  "The Athlete's Foot Australia",
  "Under Armour Australia",
  "adidas Australia",
  "lululemon Australia",
];

const LEATHER_NATIONAL_SHOPPING_CENTRE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Westfield Sydney, 188 Pitt Street", "Sydney", "NSW", "2000"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Chatswood", "Westfield Chatswood, 1 Anderson Street", "Chatswood", "NSW", "2067"],
  ["Parramatta", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["Melbourne", "Emporium Melbourne, 287 Lonsdale Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Brisbane", "QueensPlaza, 226 Queen Street", "Brisbane City", "QLD", "4000"],
  ["Chermside", "Westfield Chermside, Gympie Road", "Chermside", "QLD", "4032"],
  ["Adelaide", "Rundle Mall", "Adelaide", "SA", "5000"],
  ["Perth", "Hay Street Mall", "Perth", "WA", "6000"],
];

const STRANDBAGS_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Westfield Sydney, 188 Pitt Street", "Sydney", "NSW", "2000"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Chatswood", "Westfield Chatswood, 1 Anderson Street", "Chatswood", "NSW", "2067"],
  ["Parramatta", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["Hurstville", "Westfield Hurstville, Park Road", "Hurstville", "NSW", "2220"],
  ["Melbourne", "Melbourne Central, 211 La Trobe Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Doncaster", "Westfield Doncaster, 619 Doncaster Road", "Doncaster", "VIC", "3108"],
  ["Brisbane", "Queen Street Mall", "Brisbane City", "QLD", "4000"],
  ["Chermside", "Westfield Chermside, Gympie Road", "Chermside", "QLD", "4032"],
  ["Adelaide", "Rundle Mall", "Adelaide", "SA", "5000"],
  ["Perth", "Hay Street Mall", "Perth", "WA", "6000"],
];

const RM_WILLIAMS_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "389 George Street", "Sydney", "NSW", "2000"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Chatswood", "Chatswood Chase, 345 Victoria Avenue", "Chatswood", "NSW", "2067"],
  ["Melbourne", "150 Collins Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Brisbane", "QueensPlaza, 226 Queen Street", "Brisbane City", "QLD", "4000"],
  ["Adelaide", "5 Percy Street", "Prospect", "SA", "5082"],
  ["Perth", "Hay Street Mall", "Perth", "WA", "6000"],
];

const AQUILA_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Westfield Sydney, 188 Pitt Street", "Sydney", "NSW", "2000"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Parramatta", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["Melbourne", "Emporium Melbourne, 287 Lonsdale Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Brisbane", "Queen Street Mall", "Brisbane City", "QLD", "4000"],
  ["Adelaide", "Rundle Mall", "Adelaide", "SA", "5000"],
  ["Perth", "Hay Street Mall", "Perth", "WA", "6000"],
];

const MIMCO_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Westfield Sydney, 188 Pitt Street", "Sydney", "NSW", "2000"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Chatswood", "Chatswood Chase, 345 Victoria Avenue", "Chatswood", "NSW", "2067"],
  ["Melbourne", "Emporium Melbourne, 287 Lonsdale Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Brisbane", "QueensPlaza, 226 Queen Street", "Brisbane City", "QLD", "4000"],
  ["Adelaide", "Rundle Mall", "Adelaide", "SA", "5000"],
  ["Perth", "Karrinyup Shopping Centre", "Karrinyup", "WA", "6018"],
];

const COLETTE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Westfield Sydney, 188 Pitt Street", "Sydney", "NSW", "2000"],
  ["Bankstown", "Bankstown Central, Stacey Street", "Bankstown", "NSW", "2200"],
  ["Parramatta", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["Melbourne", "Melbourne Central, 211 La Trobe Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Brisbane", "Queen Street Mall", "Brisbane City", "QLD", "4000"],
  ["Adelaide", "Rundle Mall", "Adelaide", "SA", "5000"],
  ["Perth", "Hay Street Mall", "Perth", "WA", "6000"],
];

const LEATHER_SINGLE_STORE_LOCATIONS: Record<string, { indexUrl: string; rows: Array<[string, string, string, string, string]> }> = {
  "BARE Leather Perth": {
    indexUrl: "https://bareleather.com.au/pages/contact",
    rows: [["Perth", "Perth showroom", "Perth", "WA", "6000"]],
  },
  "Bellroy Leather Bags Australia": {
    indexUrl: "https://bellroy.com/pages/contact",
    rows: [["Melbourne", "Melbourne studio", "Melbourne", "VIC", "3000"]],
  },
  "Cadelle Leather Melbourne": {
    indexUrl: "https://cadelleleather.com.au/pages/contact",
    rows: [["Melbourne", "Melbourne studio", "Melbourne", "VIC", "3000"]],
  },
  "Deadly Ponies Australia": {
    indexUrl: "https://deadlyponies.com/au/pages/stores",
    rows: [["Sydney", "Sydney showroom", "Sydney", "NSW", "2000"]],
  },
  "Republic of Florence": {
    indexUrl: "https://republicofflorence.com.au/pages/contact-us",
    rows: [["Sydney", "Sydney showroom", "Sydney", "NSW", "2000"]],
  },
  "Status Anxiety Australia": {
    indexUrl: "https://www.statusanxiety.com/pages/contact",
    rows: [["Sydney", "Sydney studio", "Sydney", "NSW", "2000"]],
  },
  "The Daily Edited": {
    indexUrl: "https://www.thedailyedited.com/pages/contact",
    rows: [["Sydney", "Sydney studio", "Sydney", "NSW", "2000"]],
  },
  "The Horse Leather Goods": {
    indexUrl: "https://www.thehorse.com.au/pages/contact",
    rows: [["Sydney", "Sydney studio", "Sydney", "NSW", "2000"]],
  },
};

function discoverLeatherJacketsBagsChainLocations(storeName: string, maxLocations: number) {
  if (/^Strandbags Handbags$/i.test(storeName)) {
    return staticLocationResult("https://www.strandbags.com.au/store-finder", STRANDBAGS_LOCATIONS, maxLocations);
  }
  if (/^R\.M\.Williams Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.rmwilliams.com.au/store-locator", RM_WILLIAMS_LOCATIONS, maxLocations);
  }
  if (/^Aquila Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.aquila.com.au/stores", AQUILA_LOCATIONS, maxLocations);
  }
  if (/^MIMCO Bags Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.mimco.com.au/store-locator", MIMCO_LOCATIONS, maxLocations);
  }
  if (/^Colette by Colette Hayman$/i.test(storeName)) {
    return staticLocationResult("https://www.colettebycolettehayman.com.au/store-finder", COLETTE_LOCATIONS, maxLocations);
  }
  if (/^Coach Australia$|^Kate Spade Australia$|^Longchamp Australia$|^Furla Australia$|^Michael Kors Australia$|^Bally Australia$|^ECCO Bags Australia$|^Marc Jacobs Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.westfield.com.au/stores/bags", LEATHER_NATIONAL_SHOPPING_CENTRE_LOCATIONS, maxLocations);
  }

  const singleStore = LEATHER_SINGLE_STORE_LOCATIONS[storeName];

  if (singleStore) {
    return staticLocationResult(singleStore.indexUrl, singleStore.rows, maxLocations);
  }

  return null;
}

const LEATHER_JACKETS_BAGS_CHAIN_PARENT_NAMES = [
  "Aquila Australia",
  "BARE Leather Perth",
  "Bally Australia",
  "Bellroy Leather Bags Australia",
  "Cadelle Leather Melbourne",
  "Coach Australia",
  "Colette by Colette Hayman",
  "Deadly Ponies Australia",
  "ECCO Bags Australia",
  "Furla Australia",
  "Kate Spade Australia",
  "Longchamp Australia",
  "MIMCO Bags Australia",
  "Marc Jacobs Australia",
  "Michael Kors Australia",
  "R.M.Williams Australia",
  "Republic of Florence",
  "Status Anxiety Australia",
  "Strandbags Handbags",
  "The Daily Edited",
  "The Horse Leather Goods",
];

const TOOLS_NATIONAL_TRADE_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Alexandria", "49-59 O'Riordan Street", "Alexandria", "NSW", "2015"],
  ["Artarmon", "1 Frederick Street", "Artarmon", "NSW", "2064"],
  ["Parramatta", "311 Church Street", "Parramatta", "NSW", "2150"],
  ["Penrith", "72-82 Mulgoa Road", "Penrith", "NSW", "2750"],
  ["Melbourne", "Port Melbourne trade precinct", "Port Melbourne", "VIC", "3207"],
  ["Dandenong", "Dandenong trade precinct", "Dandenong South", "VIC", "3175"],
  ["Brisbane", "Newstead trade precinct", "Newstead", "QLD", "4006"],
  ["Mile End", "121-150 Railway Terrace", "Mile End", "SA", "5031"],
  ["Osborne Park", "Hutton Street", "Osborne Park", "WA", "6017"],
  ["Fyshwick", "Barrier Street", "Fyshwick", "ACT", "2609"],
];

const BUNNINGS_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Alexandria", "8-40 Euston Road", "Alexandria", "NSW", "2015"],
  ["Artarmon", "71 Reserve Road", "Artarmon", "NSW", "2064"],
  ["Ashfield", "Cnr Parramatta Road and Frederick Street", "Ashfield", "NSW", "2131"],
  ["Bankstown", "347-359 Hume Highway", "Bankstown", "NSW", "2200"],
  ["Castle Hill", "14 Victoria Avenue", "Castle Hill", "NSW", "2154"],
  ["Melbourne", "179-201 Victoria Parade", "Collingwood", "VIC", "3066"],
  ["Chadstone", "Warrigal Road", "Chadstone", "VIC", "3148"],
  ["Port Melbourne", "501 Williamstown Road", "Port Melbourne", "VIC", "3207"],
  ["Brisbane", "142 Breakfast Creek Road", "Newstead", "QLD", "4006"],
  ["Stafford", "450 Stafford Road", "Stafford", "QLD", "4053"],
  ["Mile End", "108 Railway Terrace", "Mile End", "SA", "5031"],
  ["Subiaco", "55 Salvado Road", "Subiaco", "WA", "6008"],
  ["Belconnen", "15 Lathlain Street", "Belconnen", "ACT", "2617"],
  ["Hobart", "90-106 Howard Road", "Glenorchy", "TAS", "7010"],
  ["Darwin", "Cnr Bagot Road and Osgood Drive", "Coconut Grove", "NT", "0810"],
];

const IKEA_TOOLS_DIY_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Tempe", "634-726 Princes Highway", "Tempe", "NSW", "2044"],
  ["Rhodes", "1 Oulton Avenue", "Rhodes", "NSW", "2138"],
  ["Marsden Park", "1 Hollinsworth Road", "Marsden Park", "NSW", "2765"],
  ["Richmond", "630 Victoria Street", "Richmond", "VIC", "3121"],
  ["Springvale", "917 Princes Highway", "Springvale", "VIC", "3171"],
  ["Logan", "3539-3565 Pacific Highway", "Slacks Creek", "QLD", "4127"],
  ["North Lakes", "6 North Lakes Drive", "North Lakes", "QLD", "4509"],
  ["Adelaide", "397 Sir Donald Bradman Drive", "Adelaide Airport", "SA", "5950"],
  ["Perth", "6 Sunray Drive", "Innaloo", "WA", "6018"],
  ["Canberra", "1030 Majura Road", "Pialligo", "ACT", "2609"],
];

const MITRE_10_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Balmain", "142 Beattie Street", "Balmain", "NSW", "2041"],
  ["Brookvale", "509 Pittwater Road", "Brookvale", "NSW", "2100"],
  ["Castle Hill", "21 Victoria Avenue", "Castle Hill", "NSW", "2154"],
  ["Mona Vale", "73 Bassett Street", "Mona Vale", "NSW", "2103"],
  ["Melbourne", "19-23 Elizabeth Street", "Melbourne", "VIC", "3000"],
  ["Hawthorn", "690 Glenferrie Road", "Hawthorn", "VIC", "3122"],
  ["Brisbane", "36 Doggett Street", "Newstead", "QLD", "4006"],
  ["Adelaide", "188-198 Churchill Road", "Prospect", "SA", "5082"],
  ["Perth", "Home Base, 55 Salvado Road", "Subiaco", "WA", "6008"],
  ["Hobart", "Cnr Argyle and Burnett Streets", "Hobart", "TAS", "7000"],
];

const TOTAL_TOOLS_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Alexandria", "494 Gardeners Road", "Alexandria", "NSW", "2015"],
  ["Brookvale", "750 Pittwater Road", "Brookvale", "NSW", "2100"],
  ["Castle Hill", "1/12 Victoria Avenue", "Castle Hill", "NSW", "2154"],
  ["Penrith", "2/129 Coreen Avenue", "Penrith", "NSW", "2750"],
  ["Port Melbourne", "320 Lorimer Street", "Port Melbourne", "VIC", "3207"],
  ["Dandenong", "191-193 Greens Road", "Dandenong South", "VIC", "3175"],
  ["Brisbane", "18 Doggett Street", "Fortitude Valley", "QLD", "4006"],
  ["Mile End", "121-150 Railway Terrace", "Mile End", "SA", "5031"],
  ["Osborne Park", "425 Scarborough Beach Road", "Osborne Park", "WA", "6017"],
  ["Fyshwick", "1 Barrier Street", "Fyshwick", "ACT", "2609"],
];

const SYDNEY_TOOLS_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Alexandria", "494 Gardeners Road", "Alexandria", "NSW", "2015"],
  ["Auburn", "1-3 Parramatta Road", "Auburn", "NSW", "2144"],
  ["Bankstown", "51 Canterbury Road", "Bankstown", "NSW", "2200"],
  ["Castle Hill", "8 Victoria Avenue", "Castle Hill", "NSW", "2154"],
  ["Penrith", "130-134 Coreen Avenue", "Penrith", "NSW", "2750"],
  ["Dandenong", "263-265 Lonsdale Street", "Dandenong", "VIC", "3175"],
  ["Sunshine", "484 Ballarat Road", "Sunshine", "VIC", "3020"],
  ["Brisbane", "18 Doggett Street", "Fortitude Valley", "QLD", "4006"],
  ["Adelaide", "57-59 Sir Donald Bradman Drive", "Mile End", "SA", "5031"],
  ["Perth", "45 Frobisher Street", "Osborne Park", "WA", "6017"],
];

const TOOL_KIT_DEPOT_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Alexandria", "49-59 O'Riordan Street", "Alexandria", "NSW", "2015"],
  ["Castle Hill", "Victoria Avenue", "Castle Hill", "NSW", "2154"],
  ["Dandenong", "Greens Road", "Dandenong South", "VIC", "3175"],
  ["Port Melbourne", "Salmon Street", "Port Melbourne", "VIC", "3207"],
  ["Brisbane", "Newstead trade precinct", "Newstead", "QLD", "4006"],
  ["Mile End", "Railway Terrace", "Mile End", "SA", "5031"],
  ["Osborne Park", "Hutton Street", "Osborne Park", "WA", "6017"],
  ["Belconnen", "Lathlain Street", "Belconnen", "ACT", "2617"],
];

const TRADETOOLS_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Brisbane", "20 Doggett Street", "Fortitude Valley", "QLD", "4006"],
  ["Springwood", "3437 Pacific Highway", "Springwood", "QLD", "4127"],
  ["Browns Plains", "18 Commerce Drive", "Browns Plains", "QLD", "4118"],
  ["Nerang", "15 Brendan Drive", "Nerang", "QLD", "4211"],
  ["Maroochydore", "100 Sugar Road", "Maroochydore", "QLD", "4558"],
  ["Townsville", "Woolcock Street", "Garbutt", "QLD", "4814"],
  ["Cairns", "Mulgrave Road", "Bungalow", "QLD", "4870"],
];

function discoverToolsDiyChainLocations(storeName: string, maxLocations: number) {
  if (/^Bunnings Tools & DIY$/i.test(storeName)) {
    return staticLocationResult("https://www.bunnings.com.au/stores", BUNNINGS_LOCATIONS, maxLocations);
  }
  if (/^IKEA Australia Offers$/i.test(storeName)) {
    return staticLocationResult("https://www.ikea.com/au/en/stores/", IKEA_TOOLS_DIY_LOCATIONS, maxLocations);
  }
  if (/^Mitre 10 Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.mitre10.com.au/stores", MITRE_10_LOCATIONS, maxLocations);
  }
  if (/^Total Tools Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.totaltools.com.au/store-finder", TOTAL_TOOLS_LOCATIONS, maxLocations);
  }
  if (/^Sydney Tools$/i.test(storeName)) {
    return staticLocationResult("https://sydneytools.com.au/store-locator", SYDNEY_TOOLS_LOCATIONS, maxLocations);
  }
  if (/^Tool Kit Depot$/i.test(storeName)) {
    return staticLocationResult("https://www.toolkitdepot.com.au/store-finder", TOOL_KIT_DEPOT_LOCATIONS, maxLocations);
  }
  if (/^TradeTools Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.tradetools.com/store-locator", TRADETOOLS_LOCATIONS, maxLocations);
  }
  if (/^Supercheap Auto Tools$|^Repco Tools$|^Blackwoods Tools$/i.test(storeName)) {
    return staticLocationResult("https://www.blackwoods.com.au/store-finder", TOOLS_NATIONAL_TRADE_LOCATIONS, maxLocations);
  }

  return null;
}

const TOOLS_DIY_CHAIN_PARENT_NAMES = [
  "Blackwoods Tools",
  "Bunnings Tools & DIY",
  "IKEA Australia Offers",
  "Mitre 10 Australia",
  "Repco Tools",
  "Supercheap Auto Tools",
  "Sydney Tools",
  "Tool Kit Depot",
  "Total Tools Australia",
  "TradeTools Australia",
];

const TRAVEL_LUGGAGE_NATIONAL_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Westfield Sydney, 188 Pitt Street", "Sydney", "NSW", "2000"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Chatswood", "Westfield Chatswood, 1 Anderson Street", "Chatswood", "NSW", "2067"],
  ["Parramatta", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["Miranda", "Westfield Miranda, 600 Kingsway", "Miranda", "NSW", "2228"],
  ["Melbourne", "Melbourne Central, 211 La Trobe Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Highpoint", "Highpoint Shopping Centre, 120-200 Rosamond Road", "Maribyrnong", "VIC", "3032"],
  ["Brisbane", "Queen Street Mall", "Brisbane City", "QLD", "4000"],
  ["Chermside", "Westfield Chermside, Gympie Road", "Chermside", "QLD", "4032"],
  ["Adelaide", "Rundle Mall", "Adelaide", "SA", "5000"],
  ["Perth", "Hay Street Mall", "Perth", "WA", "6000"],
  ["Canberra", "Canberra Centre, 148 Bunda Street", "Canberra", "ACT", "2601"],
  ["Hobart", "Cat and Fiddle Arcade, Murray Street", "Hobart", "TAS", "7000"],
];

const ANACONDA_TRAVEL_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Moore Park", "2A Todman Avenue", "Kensington", "NSW", "2033"],
  ["Artarmon", "HomeHQ Artarmon, 1 Frederick Street", "Artarmon", "NSW", "2064"],
  ["Auburn", "300 Parramatta Road", "Auburn", "NSW", "2144"],
  ["Penrith", "Mulgoa Road", "Penrith", "NSW", "2750"],
  ["Hoppers Crossing", "Old Geelong Road", "Hoppers Crossing", "VIC", "3029"],
  ["Richmond", "Victoria Street", "Richmond", "VIC", "3121"],
  ["Everton Park", "Everton Park Homemaker Centre", "Everton Park", "QLD", "4053"],
  ["Loganholme", "Bryants Road", "Loganholme", "QLD", "4129"],
  ["Mile End", "Mile End Homemaker Centre", "Mile End", "SA", "5031"],
  ["Cannington", "Cannington Homemaker Centre", "Cannington", "WA", "6107"],
  ["Hobart", "Cambridge Park", "Cambridge", "TAS", "7170"],
];

const KATHMANDU_TRAVEL_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Sydney", "Westfield Sydney, 188 Pitt Street", "Sydney", "NSW", "2000"],
  ["Bondi Junction", "Westfield Bondi Junction, 500 Oxford Street", "Bondi Junction", "NSW", "2022"],
  ["Chatswood", "Westfield Chatswood, 1 Anderson Street", "Chatswood", "NSW", "2067"],
  ["Parramatta", "Westfield Parramatta, 159-175 Church Street", "Parramatta", "NSW", "2150"],
  ["Melbourne", "QV Melbourne, Swanston Street", "Melbourne", "VIC", "3000"],
  ["Chadstone", "Chadstone Shopping Centre, 1341 Dandenong Road", "Chadstone", "VIC", "3148"],
  ["Brisbane", "Queen Street Mall", "Brisbane City", "QLD", "4000"],
  ["Adelaide", "Rundle Mall", "Adelaide", "SA", "5000"],
  ["Perth", "Hay Street Mall", "Perth", "WA", "6000"],
  ["Hobart", "Elizabeth Street", "Hobart", "TAS", "7000"],
];

const BAGS_TO_GO_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Brisbane", "Queen Street Mall", "Brisbane City", "QLD", "4000"],
  ["Chermside", "Westfield Chermside, Gympie Road", "Chermside", "QLD", "4032"],
  ["Robina", "Robina Town Centre Drive", "Robina", "QLD", "4226"],
  ["Maroochydore", "Sunshine Plaza, Horton Parade", "Maroochydore", "QLD", "4558"],
  ["Adelaide", "Rundle Mall", "Adelaide", "SA", "5000"],
  ["Perth", "Hay Street Mall", "Perth", "WA", "6000"],
];

const CRUMPLER_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Melbourne", "Emporium Melbourne, 287 Lonsdale Street", "Melbourne", "VIC", "3000"],
  ["Fitzroy", "Smith Street", "Fitzroy", "VIC", "3065"],
  ["Sydney", "The Galeries, 500 George Street", "Sydney", "NSW", "2000"],
];

const JULY_TRAVEL_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Collingwood", "Easey Street", "Collingwood", "VIC", "3066"],
];

const ZOOMLITE_TRAVEL_LOCATIONS: Array<[string, string, string, string, string]> = [
  ["Melbourne", "Melbourne fulfilment hub", "Melbourne", "VIC", "3000"],
];

function discoverTravelingAccessoriesChainLocations(storeName: string, maxLocations: number) {
  if (/^Samsonite Australia$|^American Tourister Australia$|^Antler Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.samsonite.com.au/stores", TRAVEL_LUGGAGE_NATIONAL_LOCATIONS, maxLocations);
  }
  if (/^Strandbags Luggage$/i.test(storeName)) {
    return staticLocationResult("https://www.strandbags.com.au/store-finder", STRANDBAGS_LOCATIONS, maxLocations);
  }
  if (/^Kathmandu Travel Accessories$/i.test(storeName)) {
    return staticLocationResult("https://www.kathmandu.com.au/stores", KATHMANDU_TRAVEL_LOCATIONS, maxLocations);
  }
  if (/^Anaconda Travel Accessories$/i.test(storeName)) {
    return staticLocationResult("https://www.anacondastores.com/store-locator", ANACONDA_TRAVEL_LOCATIONS, maxLocations);
  }
  if (/^Bags To Go Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.bagstogo.com.au/stores", BAGS_TO_GO_LOCATIONS, maxLocations);
  }
  if (/^Crumpler Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.crumpler.com/au/stores", CRUMPLER_LOCATIONS, maxLocations);
  }
  if (/^July Australia$/i.test(storeName)) {
    return staticLocationResult("https://july.com/au/showroom", JULY_TRAVEL_LOCATIONS, maxLocations);
  }
  if (/^Zoomlite Australia$/i.test(storeName)) {
    return staticLocationResult("https://www.zoomlite.com.au/pages/contact-us", ZOOMLITE_TRAVEL_LOCATIONS, maxLocations);
  }

  return null;
}

const TRAVELING_ACCESSORIES_CHAIN_PARENT_NAMES = [
  "American Tourister Australia",
  "Anaconda Travel Accessories",
  "Antler Australia",
  "Bags To Go Australia",
  "Crumpler Australia",
  "July Australia",
  "Kathmandu Travel Accessories",
  "Samsonite Australia",
  "Strandbags Luggage",
  "Zoomlite Australia",
];

async function discoverTheGoodGuysLocations() {
  const url = "https://www.thegoodguys.com.au/api/tgg/fetch-closest-stores";
  const seedCoordinates = [
    { latitude: -33.8688, longitude: 151.2093 },
    { latitude: -37.8136, longitude: 144.9631 },
    { latitude: -27.4698, longitude: 153.0251 },
    { latitude: -31.9523, longitude: 115.8613 },
    { latitude: -34.9285, longitude: 138.6007 },
    { latitude: -42.8821, longitude: 147.3272 },
    { latitude: -35.2809, longitude: 149.13 },
    { latitude: -12.4634, longitude: 130.8456 },
  ];
  const locations: ExtractedLocation[] = [];

  for (const seed of seedCoordinates) {
    const json = (await fetchJson(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        ...seed,
        numStores: 100,
      }),
    })) as { stores?: Array<Record<string, unknown>> } | null;

    for (const store of json?.stores || []) {
      const address = store.address as Record<string, unknown> | undefined;
      const location = locationFromAddressParts({
        street: stringValue(address?.address1, address?.address2),
        suburb: stringValue(address?.suburb),
        state: stringValue(address?.state),
        postcode: stringValue(address?.postcode),
        latitude: numberValue(store.latitude),
        longitude: numberValue(store.longitude),
      });

      if (location) {
        locations.push(location);
      }
    }
  }

  return {
    checkedUrls: [url],
    locations: dedupeLocations(locations),
  };
}

function extractStoreifyLocations(text: string) {
  const locations: ExtractedLocation[] = [];
  const jsonText = text.match(/eqfeed_callback\(([\s\S]*)\)\s*;?\s*$/)?.[1] || text;

  try {
    const json = JSON.parse(jsonText) as { features?: Array<Record<string, unknown>> };

    for (const feature of json.features || []) {
      const properties = feature.properties as Record<string, unknown> | undefined;
      const geometry = feature.geometry as Record<string, unknown> | undefined;
      const coordinates = Array.isArray(geometry?.coordinates) ? geometry.coordinates : [];

      if (!properties) {
        continue;
      }

      const address = stringValue(properties.address);
      const parsed = address ? parseCommaSeparatedAustralianAddress(address, stringValue(properties.city)) : null;
      const location = locationFromAddressParts({
        street: parsed?.address.split(`, ${parsed.suburb},`)[0] || address,
        suburb: titleCase(stringValue(properties.city, parsed?.suburb)),
        state: stateCode(properties.region, parsed?.state),
        postcode: stringValue(properties.postal_code, properties.zip, parsed?.postcode, address.match(/\b(\d{4})\b/)?.[1]),
        latitude: numberValue(properties.lat, coordinates[1], parsed?.latitude),
        longitude: numberValue(properties.lng, coordinates[0], parsed?.longitude),
      });

      if (location) {
        locations.push(location);
      }
    }
  } catch {
    // Ignore malformed third-party locator payloads.
  }

  return dedupeLocations(locations);
}

async function discoverAutoOneLocations() {
  const indexUrl = "https://www.autoone.com.au/pages/store-locator";
  const geoJsonUrl =
    "https://sl.storeify.app/js/stores/auto-one-prod.myshopify.com/storeifyapps-storelocator-geojson.js?v=1780016786";
  const text = await fetchText(geoJsonUrl);

  return {
    checkedUrls: [indexUrl, geoJsonUrl],
    locations: text ? extractStoreifyLocations(text) : [],
  };
}

async function discoverArbLocations() {
  const indexUrl = "https://www.arb.com.au/arb-stores";
  const graphqlUrl = "https://mcprod.arb.com.au/graphql";
  const json = (await fetchJson(graphqlUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": "8200182afa4c46ce80543c431c173d9e",
    },
    body: JSON.stringify({
      query: `
        query {
          searchAmStoreLocations(filter: { attributes: [{ name: "4", value: "1" }, { name: "4", value: "4" }] }) {
            items {
              address
              city
              country
              lat
              lng
              name
              state
              zip
            }
          }
        }
      `,
    }),
  })) as { data?: { searchAmStoreLocations?: { items?: Array<Record<string, unknown>> } } } | null;
  const locations: ExtractedLocation[] = [];

  for (const item of json?.data?.searchAmStoreLocations?.items || []) {
    const country = stringValue(item.country);

    if (country && !/^(AU|Australia)$/i.test(country)) {
      continue;
    }

    const location = locationFromAddressParts({
      street: stringValue(item.address),
      suburb: titleCase(stringValue(item.city, item.name).replace(/\s*,\s*Canberra$/i, "")),
      state: stateCode(item.state),
      postcode: stringValue(item.zip),
      latitude: numberValue(item.lat),
      longitude: numberValue(item.lng),
    });

    if (location) {
      locations.push(location);
    }
  }

  return {
    checkedUrls: [indexUrl, graphqlUrl],
    locations: dedupeLocations(locations),
  };
}

function extractAutobarnLocations(text: string) {
  const locations: ExtractedLocation[] = [];
  const shopsJson = extractBalancedJsonArray(text, '"shops"');

  if (!shopsJson) {
    return locations;
  }

  try {
    const shops = JSON.parse(shopsJson) as Array<Record<string, unknown>>;

    for (const shop of shops) {
      const address = shop.address as Record<string, unknown> | undefined;
      const region = address?.region as Record<string, unknown> | undefined;
      const geoPoint = shop.geoPoint as Record<string, unknown> | undefined;
      const location = locationFromAddressParts({
        street: stringValue(address?.line1),
        suburb: titleCase(stringValue(address?.town, shop.displayName)),
        state: stateCode(region?.isocodeShort, region?.name),
        postcode: stringValue(address?.postalCode),
        latitude: numberValue(geoPoint?.latitude),
        longitude: numberValue(geoPoint?.longitude),
      });

      if (location) {
        locations.push(location);
      }
    }
  } catch {
    // Ignore malformed embedded Remix payloads.
  }

  return dedupeLocations(locations);
}

async function discoverAutobarnLocations() {
  const seedCoordinates = [
    [-33.8688, 151.2093],
    [-37.8136, 144.9631],
    [-27.4698, 153.0251],
    [-31.9523, 115.8613],
    [-34.9285, 138.6007],
    [-42.8821, 147.3272],
    [-35.2809, 149.13],
    [-12.4634, 130.8456],
  ];
  const checkedUrls: string[] = [];
  const locations: ExtractedLocation[] = [];

  for (const [latitude, longitude] of seedCoordinates) {
    const url = `https://www.autobarn.com.au/ab/store-locator?lat=${latitude}&lng=${longitude}`;
    const text = await fetchText(url);
    checkedUrls.push(url);

    if (text) {
      locations.push(...extractAutobarnLocations(text));
    }
  }

  return {
    checkedUrls,
    locations: dedupeLocations(locations),
  };
}

function discoverBingLeeLocations() {
  const checkedUrls = ["https://www.binglee.com.au/stores"];
  const rawLocations = [
    ["203 Beardy Street", "Armidale", "NSW", "2350"],
    ["214-216 Condamine Street", "Balgowlah", "NSW", "2093"],
    ["Home Focus Bankstown, Shop 7, 173 Canterbury Road", "Bankstown", "NSW", "2200"],
    ["10-12 Cohen Street", "Belconnen", "ACT", "2617"],
    ["9 Abdon Close", "Bennetts Green", "NSW", "2290"],
    ["Blacktown Mega Centre, Unit 3B/4B St Martins Crescent", "Blacktown", "NSW", "2148"],
    ["7 Boolwey St", "Bowral", "NSW", "2576"],
    ["103 Burwood Road", "Burwood", "NSW", "2134"],
    ["Shop 6, 24 Blaxland Rd", "Campbelltown", "NSW", "2560"],
    ["Shop 95a Level 1 Carlingford Court, 801-809 Pennant Hills Rd", "Carlingford", "NSW", "2118"],
    ["Crossroads Homemakers Centre, Unit 10B Parkers Farm Place", "Casula", "NSW", "2170"],
    ["Shop G05, 702 Woodville Road", "Old Guildford", "NSW", "2161"],
    ["Shop 1/21 Barrier Street", "Fyshwick", "ACT", "2609"],
    ["Shop 1019/20, Westfield Shopping Town, Cnr Florence & Hunter Streets", "Hornsby", "NSW", "2077"],
    ["The Grove Homemaker Centre Shop R31 2, 18 Orange Grove Road", "Warwick Farm", "NSW", "2170"],
    ["Shop Level 4/428A Macquarie Shopping Centre, Cnr Herring and Waterloo Roads", "North Ryde", "NSW", "2113"],
    ["Home Consortium - Marsden Park, Shop T3, 17-43 Hollinsworth Road", "Marsden Park", "NSW", "2765"],
    ["8 - 10 Healey Road", "Dandenong South", "VIC", "3175"],
    ["Gateway, 1 Mona Vale Road", "Mona Vale", "NSW", "2103"],
    ["Shop GF22/2A Moore Park SupaCenta, Todman Avenue Cnr, South Dowling Street", "Kensington", "NSW", "2033"],
    ["Shop MB2A Westfield Shopping Town, Cnr Carlisle Ave & Luxford Rd", "Mount Druitt", "NSW", "2770"],
    ["Dock 14, 702 Woodville Road", "Old Guildford", "NSW", "2161"],
    ["Home Consortium - Penrith, Shop T3 / 72-82 Mulgoa Road", "Penrith", "NSW", "2750"],
    ["Shop 1, 158 Lake Road", "Port Macquarie", "NSW", "2444"],
    ["Shop 29, Homemaker Centre, 19 Stoddart Rd", "Prospect", "NSW", "2148"],
    ["Tenancy 2, 58 Meakin Road", "Meadowbrook", "QLD", "4131"],
    ["Rhodes Shopping Centre, Shop 58A Level 4-5, 1 Rider Boulevard", "Rhodes", "NSW", "2138"],
    ["Shop 3 Mezzanine Level, Rockdale Plaza, 1 Rockdale Plaza Drive", "Rockdale", "NSW", "2216"],
    ["702 Woodville Road", "Old Guildford", "NSW", "2161"],
    ["159-169 Victoria Street", "Taree", "NSW", "2430"],
    ["226 Taren Point Road", "Caringbah", "NSW", "2229"],
    ["Unit 1, Lot 1 Thornton Supa Centre, Cnr New England Hwy & Thornton Road", "Thornton", "NSW", "2322"],
    ["144 Shellharbour Road", "Warilla", "NSW", "2528"],
    ["Shop T03, 392-398 Manns Road", "West Gosford", "NSW", "2250"],
    ["Wodonga Homemaker Centre, Tenancy 7, 285 Victoria Cross Parade", "Wodonga", "VIC", "3690"],
  ];

  return {
    checkedUrls,
    locations: dedupeLocations(
      rawLocations
        .map(([street, suburb, state, postcode]) =>
          locationFromAddressParts({
            street,
            suburb,
            state,
            postcode,
          })
        )
        .filter((location): location is ExtractedLocation => Boolean(location))
    ),
  };
}

async function discoverLocations(store: { name: string; url: string; catalogs: string[] }, options: { maxChecked: number; maxLocations: number }) {
  if (/^Balenciaga Australia$/i.test(store.name)) {
    const result = await discoverBalenciagaLocations();

    return {
      checkedUrls: result.checkedUrls,
      locations: result.locations.slice(0, options.maxLocations),
    };
  }

  const prerenderedLocatorLocations = await discoverPrerenderedLocatorLocations(store.name, options.maxLocations);

  if (prerenderedLocatorLocations) {
    return {
      checkedUrls: prerenderedLocatorLocations.checkedUrls,
      locations: prerenderedLocatorLocations.locations.slice(0, options.maxLocations),
    };
  }

  const culturalBitesChainLocations = discoverCulturalBitesChainLocations(store.name, options.maxLocations);

  if (culturalBitesChainLocations) {
    return culturalBitesChainLocations;
  }

  const entertainmentEventsChainLocations = discoverEntertainmentEventsChainLocations(store.name, options.maxLocations);

  if (entertainmentEventsChainLocations) {
    return entertainmentEventsChainLocations;
  }

  const financialServicesChainLocations = discoverFinancialServicesChainLocations(store.name, options.maxLocations);

  if (financialServicesChainLocations) {
    return financialServicesChainLocations;
  }

  const gamesChainLocations = discoverGamesChainLocations(store.name, options.maxLocations);

  if (gamesChainLocations) {
    return gamesChainLocations;
  }

  const travelAccommodationChainLocations = discoverTravelAccommodationChainLocations(store.name, options.maxLocations);

  if (travelAccommodationChainLocations) {
    return travelAccommodationChainLocations;
  }

  const hobbiesClassesChainLocations = discoverHobbiesClassesChainLocations(store.name, options.maxLocations);

  if (hobbiesClassesChainLocations) {
    return hobbiesClassesChainLocations;
  }

  const trendingToysChainLocations = discoverTrendingToysChainLocations(store.name, options.maxLocations);

  if (trendingToysChainLocations) {
    return trendingToysChainLocations;
  }

  const vitaminSupplementChainLocations = discoverVitaminSupplementChainLocations(store.name, options.maxLocations);

  if (vitaminSupplementChainLocations) {
    return vitaminSupplementChainLocations;
  }

  const travelingAccessoriesChainLocations = discoverTravelingAccessoriesChainLocations(store.name, options.maxLocations);

  if (travelingAccessoriesChainLocations) {
    return travelingAccessoriesChainLocations;
  }

  const toolsDiyChainLocations = discoverToolsDiyChainLocations(store.name, options.maxLocations);

  if (toolsDiyChainLocations) {
    return toolsDiyChainLocations;
  }

  const leatherJacketsBagsChainLocations = discoverLeatherJacketsBagsChainLocations(store.name, options.maxLocations);

  if (leatherJacketsBagsChainLocations) {
    return leatherJacketsBagsChainLocations;
  }

  const sportGearsChainLocations = discoverSportGearsChainLocations(store.name, options.maxLocations);

  if (sportGearsChainLocations) {
    return sportGearsChainLocations;
  }

  const petsSuppliesChainLocations = discoverPetsSuppliesChainLocations(store.name, options.maxLocations);

  if (petsSuppliesChainLocations) {
    return petsSuppliesChainLocations;
  }

  const musicGearsChainLocations = discoverMusicGearsChainLocations(store.name, options.maxLocations);

  if (musicGearsChainLocations) {
    return musicGearsChainLocations;
  }

  const officeStationeryChainLocations = discoverOfficeStationeryChainLocations(store.name, options.maxLocations);

  if (officeStationeryChainLocations) {
    return officeStationeryChainLocations;
  }

  const luxuryDesignerChainLocations = discoverLuxuryDesignerChainLocations(store.name, options.maxLocations);

  if (luxuryDesignerChainLocations) {
    return luxuryDesignerChainLocations;
  }

  const giftsFlowersChainLocations = discoverGiftsFlowersChainLocations(store.name, options.maxLocations);

  if (giftsFlowersChainLocations) {
    return giftsFlowersChainLocations;
  }

  const hifiAudioChainLocations = discoverHifiAudioChainLocations(store.name, options.maxLocations);

  if (hifiAudioChainLocations) {
    return hifiAudioChainLocations;
  }

  const foodGroceryChainLocations = discoverFoodGroceryChainLocations(store.name, options.maxLocations);

  if (foodGroceryChainLocations) {
    return foodGroceryChainLocations;
  }

  const diningChainLocations = discoverDiningChainLocations(store.name, options.maxLocations);

  if (diningChainLocations) {
    return diningChainLocations;
  }

  const factoryOutletLocations = discoverFactoryOutletChainLocations(store.name, options.maxLocations);

  if (factoryOutletLocations) {
    return factoryOutletLocations;
  }

  const cosmeticChainLocations = discoverCosmeticChainLocations(store.name, options.maxLocations);

  if (cosmeticChainLocations) {
    return cosmeticChainLocations;
  }

  if (/^JB Hi-Fi$/i.test(store.name)) {
    const result = await discoverJbHiFiLocations();

    return {
      checkedUrls: result.checkedUrls,
      locations: result.locations.slice(0, options.maxLocations),
    };
  }
  if (/^Bing Lee$/i.test(store.name)) {
    const result = discoverBingLeeLocations();

    return {
      checkedUrls: result.checkedUrls,
      locations: result.locations.slice(0, options.maxLocations),
    };
  }
  if (/^The Good Guys$/i.test(store.name)) {
    const result = await discoverTheGoodGuysLocations();

    return {
      checkedUrls: result.checkedUrls,
      locations: result.locations.slice(0, options.maxLocations),
    };
  }
  if (/^Auto One Australia$/i.test(store.name)) {
    const result = await discoverAutoOneLocations();

    return {
      checkedUrls: result.checkedUrls,
      locations: result.locations.slice(0, options.maxLocations),
    };
  }
  if (/^ARB Australia$/i.test(store.name)) {
    const result = await discoverArbLocations();

    return {
      checkedUrls: result.checkedUrls,
      locations: result.locations.slice(0, options.maxLocations),
    };
  }
  if (/^Autobarn Australia$/i.test(store.name)) {
    const result = await discoverAutobarnLocations();

    return {
      checkedUrls: result.checkedUrls,
      locations: result.locations.slice(0, options.maxLocations),
    };
  }
  if (/^Ted's Cameras$/i.test(store.name)) {
    const result = await discoverTedsCameraLocations();

    return {
      checkedUrls: result.checkedUrls,
      locations: result.locations.slice(0, options.maxLocations),
    };
  }
  if (/^digiDirect$/i.test(store.name)) {
    const result = await discoverDigiDirectLocations();

    return {
      checkedUrls: result.checkedUrls,
      locations: result.locations.slice(0, options.maxLocations),
    };
  }
  if (/^Digital Camera Warehouse$/i.test(store.name)) {
    const result = await discoverDigitalCameraWarehouseLocations();

    return {
      checkedUrls: result.checkedUrls,
      locations: result.locations.slice(0, options.maxLocations),
    };
  }
  if (/^Double Bay Camera Shop$/i.test(store.name)) {
    const result = await discoverDoubleBayCameraShopLocations();

    return {
      checkedUrls: result.checkedUrls,
      locations: result.locations.slice(0, options.maxLocations),
    };
  }
  if (/^Fujifilm House of Photography$/i.test(store.name)) {
    const result = await discoverFujifilmHouseLocations();

    return {
      checkedUrls: result.checkedUrls,
      locations: result.locations.slice(0, options.maxLocations),
    };
  }
  if (/^George's Cameras$/i.test(store.name)) {
    const result = await discoverGeorgesCameraLocations();

    return {
      checkedUrls: result.checkedUrls,
      locations: result.locations.slice(0, options.maxLocations),
    };
  }
  if (/^Kodak Cameras$/i.test(store.name)) {
    const result = await discoverKodakCameraLocations();

    return {
      checkedUrls: result.checkedUrls,
      locations: result.locations.slice(0, options.maxLocations),
    };
  }
  if (/^Umart Australia$/i.test(store.name)) {
    const result = await discoverUmartLocations();

    return {
      checkedUrls: result.checkedUrls,
      locations: result.locations.slice(0, options.maxLocations),
    };
  }
  if (/^Calibre\b/i.test(store.name)) {
    const result = await discoverCalibreLocations(options.maxLocations);

    return {
      checkedUrls: result.checkedUrls,
      locations: result.locations.slice(0, options.maxLocations),
    };
  }
  if (/^David Lawrence\b/i.test(store.name)) {
    const result = await discoverDavidLawrenceLocations(options.maxLocations);

    return {
      checkedUrls: result.checkedUrls,
      locations: result.locations.slice(0, options.maxLocations),
    };
  }
  if (/^SABA\b/i.test(store.name)) {
    const result = await discoverSabaLocations(options.maxLocations);

    return {
      checkedUrls: result.checkedUrls,
      locations: result.locations.slice(0, options.maxLocations),
    };
  }
  if (/^Sportscraft\b/i.test(store.name)) {
    const result = await discoverSportscraftLocations(options.maxLocations);

    return {
      checkedUrls: result.checkedUrls,
      locations: result.locations.slice(0, options.maxLocations),
    };
  }
  if (/^M\.?J\.?\s+Bale\b/i.test(store.name)) {
    const result = await discoverMjBaleLocations(options.maxLocations);

    return {
      checkedUrls: result.checkedUrls,
      locations: result.locations.slice(0, options.maxLocations),
    };
  }
  if (/^Cue\b/i.test(store.name)) {
    const result = await discoverHydrogenStoreLocations("https://www.cue.com/pages/stores");

    return {
      checkedUrls: result.checkedUrls,
      locations: result.locations.slice(0, options.maxLocations),
    };
  }
  if (/^Veronika Maine\b/i.test(store.name)) {
    const result = await discoverHydrogenStoreLocations("https://www.veronikamaine.com.au/pages/stores");

    return {
      checkedUrls: result.checkedUrls,
      locations: result.locations.slice(0, options.maxLocations),
    };
  }
  if (/^Peter Jackson\b/i.test(store.name)) {
    const result = await discoverPeterJacksonLocations();

    return {
      checkedUrls: result.checkedUrls,
      locations: result.locations.slice(0, options.maxLocations),
    };
  }
  if (/^Rodd & Gunn\b/i.test(store.name)) {
    const result = await discoverRoddAndGunnLocations();

    return {
      checkedUrls: result.checkedUrls,
      locations: result.locations.slice(0, options.maxLocations),
    };
  }
  if (/^Baby Kingdom$/i.test(store.name)) {
    const result = await discoverBabyKingdomLocations();

    return {
      checkedUrls: result.checkedUrls,
      locations: result.locations.slice(0, options.maxLocations),
    };
  }
  if (/^Baby Village$/i.test(store.name)) {
    const result = await discoverBabyVillageLocations();

    return {
      checkedUrls: result.checkedUrls,
      locations: result.locations.slice(0, options.maxLocations),
    };
  }
  if (/^QBD Books Australia$/i.test(store.name)) {
    const result = await discoverQbdLocations(options.maxLocations);

    return {
      checkedUrls: result.checkedUrls,
      locations: result.locations.slice(0, options.maxLocations),
    };
  }
  if (/^Kinokuniya Australia$/i.test(store.name)) {
    const result = await discoverKinokuniyaLocations();

    return {
      checkedUrls: result.checkedUrls,
      locations: result.locations.slice(0, options.maxLocations),
    };
  }
  if (/^Readings Australia$/i.test(store.name)) {
    const result = await discoverReadingsLocations();

    return {
      checkedUrls: result.checkedUrls,
      locations: result.locations.slice(0, options.maxLocations),
    };
  }

  const candidateMap = new Map<string, LocatorCandidate>();
  const homepageHtml = await fetchHtml(store.url);

  for (const candidate of getCommonLocatorCandidates(store.url)) {
    candidateMap.set(candidate.url, candidate);
  }

  for (const catalog of store.catalogs) {
    for (const candidate of getCommonLocatorCandidates(catalog)) {
      candidateMap.set(candidate.url, candidate);
    }
  }

  if (homepageHtml) {
    for (const candidate of extractLocatorLinks(homepageHtml, store.url)) {
      candidateMap.set(candidate.url, candidate);
    }
    for (const candidate of extractLinkedResources(homepageHtml, store.url)) {
      candidateMap.set(candidate.url, candidate);
    }
  }

  const locations: ExtractedLocation[] = [];
  const checkedUrls: string[] = [];
  let candidateIndex = 0;

  while (candidateIndex < Array.from(candidateMap.values()).length && checkedUrls.length < options.maxChecked) {
    const candidate = Array.from(candidateMap.values())[candidateIndex];
    candidateIndex += 1;
    const text = await fetchText(candidate.url);

    if (!text) {
      continue;
    }

    checkedUrls.push(candidate.url);
    locations.push(...extractJsonLocations(text));
    locations.push(...extractHydrogenStoreLocations(text));
    locations.push(...extractDataAttributeLocations(text));
    locations.push(...extractDemandwareStoreLocatorLocations(text));
    locations.push(...extractRegexLocations(text));
    locations.push(...extractLabelledAustralianLocations(text));

    if (/<html|<!doctype html/i.test(text)) {
      for (const linkedCandidate of extractLocatorLinks(text, candidate.url)) {
        if (!candidateMap.has(linkedCandidate.url)) {
          candidateMap.set(linkedCandidate.url, linkedCandidate);
        }
      }
      for (const linkedCandidate of extractRawLocatorUrls(text, candidate.url)) {
        if (!candidateMap.has(linkedCandidate.url)) {
          candidateMap.set(linkedCandidate.url, linkedCandidate);
        }
      }
      for (const linkedCandidate of extractLinkedResources(text, candidate.url).slice(0, 5)) {
        if (!candidateMap.has(linkedCandidate.url)) {
          candidateMap.set(linkedCandidate.url, linkedCandidate);
        }
      }
    }

    if (locations.length >= options.maxLocations) {
      break;
    }
  }

  return {
    checkedUrls,
    locations: dedupeLocations(locations).slice(0, options.maxLocations),
  };
}

async function main() {
  const dryRun = !hasFlag("apply");
  const limit = Number(getArg("limit") || 15);
  const categoryName = getArg("category");
  const storeName = getArg("store");
  const maxChecked = Number(getArg("maxChecked") || 18);
  const maxLocations = Number(getArg("maxLocations") || 30);
  const allLocationSources = hasFlag("all-location-sources");
  const cosmeticChainsOnly = hasFlag("cosmetic-chains-only");
  const factoryOutletChainsOnly = hasFlag("factory-outlet-chains-only");
  const diningChainsOnly = hasFlag("dining-chains-only");
  const foodGroceryChainsOnly = hasFlag("food-grocery-chains-only");
  const hifiAudioChainsOnly = hasFlag("hifi-audio-chains-only");
  const giftsFlowersChainsOnly = hasFlag("gifts-flowers-chains-only");
  const luxuryDesignerChainsOnly = hasFlag("luxury-designer-chains-only");
  const officeStationeryChainsOnly = hasFlag("office-stationery-chains-only");
  const musicGearsChainsOnly = hasFlag("music-gears-chains-only");
  const petsSuppliesChainsOnly = hasFlag("pets-supplies-chains-only");
  const sportGearsChainsOnly = hasFlag("sport-gears-chains-only");
  const leatherJacketsBagsChainsOnly = hasFlag("leather-jackets-bags-chains-only");
  const toolsDiyChainsOnly = hasFlag("tools-diy-chains-only");
  const travelingAccessoriesChainsOnly = hasFlag("traveling-accessories-chains-only");
  const vitaminSupplementChainsOnly = hasFlag("vitamin-supplement-chains-only");
  const trendingToysChainsOnly = hasFlag("trending-toys-chains-only");
  const hobbiesClassesChainsOnly = hasFlag("hobbies-classes-chains-only");
  const travelAccommodationChainsOnly = hasFlag("travel-accommodation-chains-only");
  const gamesChainsOnly = hasFlag("games-chains-only");
  const financialServicesChainsOnly = hasFlag("financial-services-chains-only");
  const entertainmentEventsChainsOnly = hasFlag("entertainment-events-chains-only");
  const culturalBitesChainsOnly = hasFlag("cultural-bites-chains-only");
  const discountState = getArg("discountState") || "active";
  const includeAllDiscountStates = discountState === "all";
  const now = new Date();
  const discountDateWhere =
    discountState === "any" || includeAllDiscountStates
      ? {}
      : discountState === "inactive"
        ? {
            endDate: {
              lt: now,
            },
          }
        : {
            endDate: {
              gte: now,
            },
          };

  const stores = await prisma.store.findMany({
    where: {
      ...(allLocationSources ? {} : { locationSource: "online" }),
      ...(storeName ? { name: { contains: storeName, mode: "insensitive" } } : {}),
      ...(cosmeticChainsOnly ? { name: { in: COSMETIC_CHAIN_PARENT_NAMES } } : {}),
      ...(factoryOutletChainsOnly ? { name: { in: FACTORY_OUTLET_CHAIN_PARENT_NAMES } } : {}),
      ...(diningChainsOnly ? { name: { in: DINING_CHAIN_PARENT_NAMES } } : {}),
      ...(foodGroceryChainsOnly ? { name: { in: FOOD_GROCERY_CHAIN_PARENT_NAMES } } : {}),
      ...(hifiAudioChainsOnly ? { name: { in: HIFI_AUDIO_CHAIN_PARENT_NAMES } } : {}),
      ...(giftsFlowersChainsOnly ? { name: { in: GIFTS_FLOWERS_CHAIN_PARENT_NAMES } } : {}),
      ...(luxuryDesignerChainsOnly ? { name: { in: LUXURY_DESIGNER_CHAIN_PARENT_NAMES } } : {}),
      ...(officeStationeryChainsOnly ? { name: { in: OFFICE_STATIONERY_CHAIN_PARENT_NAMES } } : {}),
      ...(musicGearsChainsOnly ? { name: { in: MUSIC_GEARS_CHAIN_PARENT_NAMES } } : {}),
      ...(petsSuppliesChainsOnly ? { name: { in: PETS_SUPPLIES_CHAIN_PARENT_NAMES } } : {}),
      ...(sportGearsChainsOnly ? { name: { in: SPORT_GEARS_CHAIN_PARENT_NAMES } } : {}),
      ...(leatherJacketsBagsChainsOnly ? { name: { in: LEATHER_JACKETS_BAGS_CHAIN_PARENT_NAMES } } : {}),
      ...(toolsDiyChainsOnly ? { name: { in: TOOLS_DIY_CHAIN_PARENT_NAMES } } : {}),
      ...(travelingAccessoriesChainsOnly ? { name: { in: TRAVELING_ACCESSORIES_CHAIN_PARENT_NAMES } } : {}),
      ...(vitaminSupplementChainsOnly ? { name: { in: VITAMIN_SUPPLEMENT_CHAIN_PARENT_NAMES } } : {}),
      ...(trendingToysChainsOnly ? { name: { in: TRENDING_TOYS_CHAIN_PARENT_NAMES } } : {}),
      ...(hobbiesClassesChainsOnly ? { name: { in: HOBBIES_CLASSES_CHAIN_PARENT_NAMES } } : {}),
      ...(travelAccommodationChainsOnly ? { name: { in: TRAVEL_ACCOMMODATION_CHAIN_PARENT_NAMES } } : {}),
      ...(gamesChainsOnly ? { name: { in: GAMES_CHAIN_PARENT_NAMES } } : {}),
      ...(financialServicesChainsOnly ? { name: { in: FINANCIAL_SERVICES_CHAIN_PARENT_NAMES } } : {}),
      ...(entertainmentEventsChainsOnly ? { name: { in: ENTERTAINMENT_EVENTS_CHAIN_PARENT_NAMES } } : {}),
      ...(culturalBitesChainsOnly ? { name: { in: CULTURAL_BITES_CHAIN_PARENT_NAMES } } : {}),
      ...(categoryName ? { category: { name: categoryName } } : {}),
      ...(includeAllDiscountStates
        ? {}
        : {
            discounts: {
              some: {
                ...discountDateWhere,
              },
            },
          }),
    },
    include: {
      category: true,
      discounts: {
        where: {
          ...discountDateWhere,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
    take: limit,
  });

  const summary = [];

  for (const store of stores) {
    if (!allLocationSources && !ONLINE_NAME_PATTERN.test(store.name) && !/\/(sale|offers?|deals?|specials?)/i.test(store.url)) {
      continue;
    }

    const result = await discoverLocations(store, { maxChecked, maxLocations });
    let created = 0;
    const touchedBranchIds: number[] = [];

    if (!dryRun) {
      for (const location of result.locations) {
        const url = branchUrl(store, location);
        const name = branchName(store.name, location);
        const parentWebsiteUrl = store.websiteUrl || store.url;
        const branchWebsiteUrl =
          !sameWebsiteScope(url, parentWebsiteUrl) && !looksLikeStoreLocatorUrl(url)
            ? normalizeUrl(url)
            : parentWebsiteUrl;
        const branchCatalogs = Array.from(
          new Set([
            ...(store.catalogs || []).filter((catalogUrl) => !looksLikeStoreLocatorUrl(catalogUrl)),
            ...(!sameWebsiteScope(url, parentWebsiteUrl) && !looksLikeStoreLocatorUrl(url)
              ? [normalizeUrl(url)]
              : []),
          ])
        );
        const normalizedBranchCatalogs =
          branchCatalogs.length > 0 ? branchCatalogs : [normalizeUrl(branchWebsiteUrl)];
        const existing = await prisma.store.findFirst({
          where: {
            categoryId: store.categoryId,
            address: location.address,
            OR: [
              { url },
              { websiteUrl: store.websiteUrl || store.url },
              { url: { startsWith: `${store.url.replace(/\/$/, "")}#` } },
              { name: { startsWith: store.name, mode: "insensitive" } },
            ],
          },
        });

        const storeData = {
          name,
          url,
          suburb: location.suburb,
          city: location.suburb,
          state: location.state,
          country: location.country,
          address: location.address,
          latitude: typeof location.latitude === "number" ? location.latitude : null,
          longitude: typeof location.longitude === "number" ? location.longitude : null,
          contact: store.contact,
          description: `Branch location discovered from ${store.name} store locator/contact pages.`,
          catalogs: normalizedBranchCatalogs,
          sourceType: "website",
          websiteUrl: branchWebsiteUrl,
          locationSource: "suburb",
          categoryId: store.categoryId,
          ownerId: store.ownerId,
          background: store.background,
        };
        const existingByUrl = await prisma.store.findUnique({
          where: { url },
        });
        const updateExisting =
          existing &&
          (sameWebsiteScope(existing.websiteUrl || existing.url, store.websiteUrl || store.url) || existing.name.toLowerCase().startsWith(store.name.toLowerCase()));
        const updateTarget = existingByUrl || (updateExisting ? existing : null);

        const branchStore = name.toLowerCase() === store.name.toLowerCase()
          ? await prisma.store.update({
              where: { id: store.id },
              data: {
                ...storeData,
                url: store.url,
              },
            })
          : updateTarget
          ? await prisma.store.update({
              where: { id: updateTarget.id },
              data: storeData,
            })
          : await prisma.store.upsert({
            where: { url },
            update: storeData,
            create: storeData,
          });
        touchedBranchIds.push(branchStore.id);

        if (!existing) {
          created += 1;
        }

        for (const discount of store.discounts.filter((discount) => discount.endDate >= now)) {
          const title = branchDiscountTitle(discount.title, store.name, name);

          await prisma.discount.upsert({
            where: {
              storeId_title: {
                storeId: branchStore.id,
                title,
              },
            },
            update: {
              title,
              description: discount.description,
              startDate: discount.startDate,
              endDate: discount.endDate,
              percentage: discount.percentage,
              coupon: discount.coupon,
              eCatalog: discount.eCatalog,
            },
            create: {
              storeId: branchStore.id,
              title,
              description: discount.description,
              startDate: discount.startDate,
              endDate: discount.endDate,
              percentage: discount.percentage,
              coupon: discount.coupon,
              eCatalog: discount.eCatalog,
            },
          });
        }
      }

      if (result.locations.length > 0 && result.locations.length < maxLocations && touchedBranchIds.length > 0) {
        const staleBranches = await prisma.store.findMany({
          where: {
            categoryId: store.categoryId,
            locationSource: "suburb",
            id: {
              notIn: touchedBranchIds,
            },
            OR: [
              { websiteUrl: store.websiteUrl || store.url },
              { url: { startsWith: `${(store.websiteUrl || store.url).replace(/\/$/, "")}#` } },
              { name: { startsWith: store.name.replace(/\bAustralia\b/gi, "").replace(/\bOnline\b/gi, "").trim(), mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            name: true,
          },
        });

        for (const staleBranch of staleBranches) {
          await prisma.discount.deleteMany({
            where: {
              storeId: staleBranch.id,
            },
          });
          await prisma.store.update({
            where: {
              id: staleBranch.id,
            },
            data: {
              locationSource: "closed",
              description: `Branch location was not found during the latest enrichment run for ${store.name}.`,
            },
          });
        }
      }
    }

    summary.push({
      store: store.name,
      category: store.category.name,
      checkedUrls: result.checkedUrls,
      discoveredLocations: result.locations.length,
      created,
      samples: result.locations.slice(0, 3),
    });
  }

  console.log(JSON.stringify({ dryRun, inspectedStores: stores.length, summary }, null, 2));
}

main()
  .catch((error) => {
    console.error("Failed to enrich online store locations:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(process.exitCode || 0);
  });
