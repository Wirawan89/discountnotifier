import { PrismaClient } from "@prisma/client";
import { getLiveVerifiedOfferEndDate } from "../src/lib/offer-lifecycle";
import { OfferVerifier } from "../src/lib/offer-verifier";

const prisma = new PrismaClient();
const CATEGORY_NAME = "Cultural Bites & Takeaway";
const GOOGLE_PLACES_API_URL = "https://places.googleapis.com/v1/places:searchText";
const API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;

const DEFAULT_QUERIES = [
  "banh mi",
  "banh cuon",
  "Vietnamese takeaway",
  "Indonesian restaurant",
  "Nepalese momo",
  "Indian street food",
  "Hong Kong cafe",
  "Korean street food",
  "Thai street food",
  "Malaysian takeaway",
];

const NATIONAL_SUBURBS = [
  { suburb: "Cabramatta", city: "Sydney" },
  { suburb: "Canley Vale", city: "Sydney" },
  { suburb: "Marrickville", city: "Sydney" },
  { suburb: "Bankstown", city: "Sydney" },
  { suburb: "Burwood", city: "Sydney" },
  { suburb: "Chatswood", city: "Sydney" },
  { suburb: "Eastwood", city: "Sydney" },
  { suburb: "Hurstville", city: "Sydney" },
  { suburb: "Ashfield", city: "Sydney" },
  { suburb: "Harris Park", city: "Sydney" },
  { suburb: "Haymarket", city: "Sydney" },
  { suburb: "Parramatta", city: "Sydney" },
  { suburb: "Footscray", city: "Melbourne" },
  { suburb: "Springvale", city: "Melbourne" },
  { suburb: "Richmond", city: "Melbourne" },
  { suburb: "Box Hill", city: "Melbourne" },
  { suburb: "Glen Waverley", city: "Melbourne" },
  { suburb: "Dandenong", city: "Melbourne" },
  { suburb: "Melbourne CBD", city: "Melbourne" },
  { suburb: "Sunnybank", city: "Brisbane" },
  { suburb: "Fortitude Valley", city: "Brisbane" },
  { suburb: "West End", city: "Brisbane" },
  { suburb: "Zillmere", city: "Brisbane" },
  { suburb: "Northbridge", city: "Perth" },
  { suburb: "Victoria Park", city: "Perth" },
  { suburb: "Perth CBD", city: "Perth" },
  { suburb: "Adelaide CBD", city: "Adelaide" },
  { suburb: "Gouger Street", city: "Adelaide" },
  { suburb: "Darwin CBD", city: "Darwin" },
  { suburb: "Hobart CBD", city: "Hobart" },
  { suburb: "Canberra CBD", city: "Canberra" },
  { suburb: "Dickson", city: "Canberra" },
  { suburb: "Gold Coast", city: "Gold Coast" },
];

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  googleMapsUri?: string;
  websiteUri?: string;
  businessStatus?: string;
};

function getArg(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function googleSearchUrl(query: string) {
  return `https://www.google.com/search?${new URLSearchParams({
    q: query,
    source: "lnms",
    tbm: "lcl",
  }).toString()}`;
}

function getSearchPlan() {
  const queryArg = getArg("query");
  const suburbArg = getArg("suburb");
  const cityArg = getArg("city");
  const limitSuburbs = Number(getArg("limit-suburbs") || NATIONAL_SUBURBS.length);

  const queries = queryArg ? [queryArg] : DEFAULT_QUERIES;
  const suburbs = suburbArg
    ? [{ suburb: suburbArg, city: cityArg || suburbArg }]
    : NATIONAL_SUBURBS.slice(0, limitSuburbs);

  return { queries, suburbs };
}

async function searchPlaces(textQuery: string): Promise<GooglePlace[]> {
  if (!API_KEY) {
    throw new Error("GOOGLE_MAPS_API_KEY or GOOGLE_PLACES_API_KEY is required to run live Google Places discovery.");
  }

  const response = await fetch(GOOGLE_PLACES_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.googleMapsUri,places.websiteUri,places.businessStatus",
    },
    body: JSON.stringify({
      textQuery,
      regionCode: "AU",
      languageCode: "en-AU",
      includedType: "restaurant",
      maxResultCount: Math.max(1, Math.min(20, Number(getArg("limit-results") || 8))),
    }),
  });

  if (!response.ok) {
    throw new Error(`Google Places error ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  return Array.isArray(data.places) ? data.places : [];
}

function inferSuburb(place: GooglePlace, fallbackSuburb: string) {
  const address = place.formattedAddress || "";
  const addressParts = address.split(",").map((part) => part.trim()).filter(Boolean);
  const likelySuburb = addressParts.find((part) => /\bNSW|VIC|QLD|WA|SA|TAS|ACT|NT\b/i.test(part));

  return likelySuburb?.replace(/\bNSW|VIC|QLD|WA|SA|TAS|ACT|NT\b.*$/i, "").trim() || fallbackSuburb;
}

function createOffer(storeName: string, matchedUrl: string, matchedKeywords: string[]) {
  const startDate = new Date();
  const endDate = getLiveVerifiedOfferEndDate(startDate, "dining");

  return {
    title: `${storeName} Special Offers`,
    description: `Offer wording found on the store website (${matchedKeywords.join(", ")}). Check the store website or Google Business profile for live availability.`,
    startDate,
    endDate,
    eCatalog: [matchedUrl],
  };
}

async function savePlace(place: GooglePlace, fallbackSuburb: string, fallbackCity: string, categoryId: number, ownerId: number) {
  const name = place.displayName?.text?.trim();

  if (!name || place.businessStatus === "CLOSED_PERMANENTLY") {
    return { saved: false, offered: false };
  }

  const googleBusinessUrl = place.googleMapsUri || googleSearchUrl(`${name} ${fallbackSuburb}`);
  const websiteUrl = place.websiteUri || undefined;
  const url = websiteUrl || googleBusinessUrl;
  const suburb = inferSuburb(place, fallbackSuburb);
  const existingStore = await prisma.store.findFirst({
    where: {
      OR: [
        { url },
        { googleBusinessUrl },
        {
          name,
          suburb,
          categoryId,
        },
      ],
    },
  });
  const storeData = {
    name,
    url,
    suburb,
    city: fallbackCity,
    country: "Australia",
    address: place.formattedAddress,
    catalogs: [],
    sourceType: websiteUrl ? "website" : "google_business",
    googleBusinessUrl,
    websiteUrl,
    description: websiteUrl
      ? "Website-backed listing discovered from Google Places."
      : "Google Business profile listing discovered from Google Places. Live offer verification needs a website, business owner promotion, or a Google profile data provider.",
    categoryId,
    ownerId,
  };
  const savedStore = existingStore
    ? await prisma.store.update({ where: { id: existingStore.id }, data: storeData })
    : await prisma.store.create({ data: storeData });

  if (!websiteUrl) {
    return { saved: true, offered: false };
  }

  const result = await OfferVerifier.verifyStoreOfferPages(websiteUrl, [], {
    country: "Australia",
    profile: "dining",
    maxPages: 6,
    requestTimeoutMs: 3000,
  });

  if (!result.hasOffer || !result.matchedUrl) {
    return { saved: true, offered: false };
  }

  const offer = createOffer(name, result.matchedUrl, result.matchedKeywords);
  await prisma.discount.upsert({
    where: {
      storeId_title: {
        storeId: savedStore.id,
        title: offer.title,
      },
    },
    update: offer,
    create: {
      ...offer,
      storeId: savedStore.id,
    },
  });

  return { saved: true, offered: true };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const owner = await prisma.user.findFirst({ orderBy: { id: "asc" } });

  if (!owner) {
    throw new Error("No user found to own discovered Google Places stores.");
  }

  const category = await prisma.category.upsert({
    where: { name: CATEGORY_NAME },
    update: {},
    create: { name: CATEGORY_NAME },
  });
  const { queries, suburbs } = getSearchPlan();
  let saved = 0;
  let offers = 0;
  let searched = 0;

  for (const location of suburbs) {
    for (const query of queries) {
      const textQuery = `${query} in ${location.suburb} ${location.city} Australia`;
      searched += 1;
      console.log(`search: ${textQuery}`);
      const places = await searchPlaces(textQuery);

      for (const place of places) {
        const name = place.displayName?.text || "Unknown";
        if (dryRun) {
          console.log(`dry-run: ${name} | ${place.formattedAddress || ""} | ${place.websiteUri || place.googleMapsUri || ""}`);
          continue;
        }

        const result = await savePlace(place, location.suburb, location.city, category.id, owner.id);
        if (result.saved) saved += 1;
        if (result.offered) offers += 1;
      }
    }
  }

  console.log(`Done. Searches ${searched}, saved/updated ${saved}, verified offers ${offers}.`);
}

main()
  .catch((error) => {
    console.error("Failed to discover Google Places Cultural Bites stores:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
