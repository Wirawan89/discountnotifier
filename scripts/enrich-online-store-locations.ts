import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type ExtractedLocation = {
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
};

type LocatorCandidate = {
  url: string;
  source: string;
};

const AU_STATES = new Set(["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"]);
const COMMON_LOCATOR_PATHS = [
  "/store-locator",
  "/store-locator/",
  "/stores",
  "/stores/",
  "/store-finder",
  "/store-finder/",
  "/store-locations",
  "/store-locations/",
  "/locations",
  "/locations/",
  "/find-a-store",
  "/find-a-store/",
  "/findastore",
  "/findastore/",
  "/find-us",
  "/find-us/",
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

function normalizeUrl(url: string) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";

    return parsed.toString();
  } catch {
    return url;
  }
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

async function fetchText(url: string) {
  const controller = new AbortController();
  const timeoutMs = Number(getArg("timeoutMs") || 5000);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; DiscountNotifier/1.0; +https://discountnotifier.local)",
        accept: "text/html,application/xhtml+xml,application/json,text/javascript,*/*;q=0.8",
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

async function fetchHtml(url: string) {
  const text = await fetchText(url);

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

function stringValue(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return normalizeText(value);
    }
    if (typeof value === "number") {
      return String(value);
    }
  }

  return "";
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
  const state = stringValue(
    record.addressRegion,
    record.state,
    record.region,
    record.province,
    record.administrativeArea,
    parent?.state,
    parent?.addressRegion
  ).toUpperCase();
  const countryValue = record.addressCountry;
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
  const street = stringValue(
    record.streetAddress,
    record.addressLine1,
    record.address1,
    record.line1,
    record.street,
    parent?.streetAddress,
    parent?.addressLine1,
    parent?.address1
  );
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

    locations.push({
      address: formatAddress(street, suburb, state, postcode),
      suburb,
      state,
      postcode,
      country: "Australia",
      latitude: null,
      longitude: null,
    });
  }

  return locations;
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
  return `${baseName.replace(/\bAustralia\b/gi, "").replace(/\bOnline\b/gi, "").trim()} ${location.suburb}`.replace(
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
  const locationKey = slugify([location.suburb, location.state, location.postcode, location.address].join(" "));

  return `${storeUrl.replace(/\/$/, "")}#${locationKey}`;
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

function locationFromAddressParts(parts: {
  street: string;
  suburb: string;
  state: string;
  postcode: string;
  latitude?: number | null;
  longitude?: number | null;
}): ExtractedLocation | null {
  const state = parts.state.toUpperCase();
  const suburb = normalizeText(parts.suburb);
  const street = normalizeText(parts.street).replace(new RegExp(`,?\\s*${suburb.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"), "");
  const postcode = normalizeText(parts.postcode);

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
  if (/^Umart Australia$/i.test(store.name)) {
    const result = await discoverUmartLocations();

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
    locations.push(...extractRegexLocations(text));

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
  const discountState = getArg("discountState") || "active";
  const now = new Date();
  const discountDateWhere =
    discountState === "any"
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
      ...(categoryName ? { category: { name: categoryName } } : {}),
      discounts: {
        some: {
          ...discountDateWhere,
        },
      },
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

    if (!dryRun) {
      for (const location of result.locations) {
        const url = locationUrl(store.url, location);
        const name = branchName(store.name, location);
        const existing = await prisma.store.findFirst({
          where: {
            categoryId: store.categoryId,
            address: location.address,
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
          catalogs: store.catalogs,
          sourceType: "website",
          websiteUrl: store.websiteUrl || store.url,
          locationSource: "suburb",
          categoryId: store.categoryId,
          ownerId: store.ownerId,
          background: store.background,
        };

        if (existing) {
          await prisma.store.update({
            where: { id: existing.id },
            data: storeData,
          });
        } else {
          await prisma.store.upsert({
            where: { url },
            update: storeData,
            create: storeData,
          });
          created += 1;
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
