import { PrismaClient } from "@prisma/client";
import { updateCatalogUrlHealth } from "../src/lib/catalog-health";
import { getLiveVerifiedOfferEndDate } from "../src/lib/offer-lifecycle";
import { OfferVerifier } from "../src/lib/offer-verifier";

const prisma = new PrismaClient();
const CATEGORY_NAME = "Caffe & Brunch";
const VERIFY_CONCURRENCY = 4;

type InnerWestCafe = {
  name: string;
  url: string;
  verificationUrl?: string;
  suburb: string;
  city: string;
  state: string;
  address: string;
  contact?: string;
  catalogs?: string[];
  description: string;
  ignoredOfferUrlPatterns?: RegExp[];
};

const stores: InnerWestCafe[] = [
  {
    name: "Outfield Cafe Ashfield",
    url: "https://www.outfield.com.au/",
    suburb: "Ashfield",
    city: "Sydney",
    state: "NSW",
    address: "230 Victoria Street, Ashfield NSW 2131",
    contact: "info@outfield.com.au",
    catalogs: ["https://www.outfield.com.au/", "https://www.outfield.com.au/menu"],
    description: "Highly regarded parkside cafe in Yeo Park serving specialty coffee, brunch and picnic catering.",
  },
  {
    name: "Brewfield Ashfield",
    url: "https://www.brewfield.com.au/",
    suburb: "Ashfield",
    city: "Sydney",
    state: "NSW",
    address: "260 Liverpool Road, Ashfield NSW 2131",
    contact: "02 9713 9664",
    catalogs: ["https://www.brewfield.com.au/"],
    description: "Calm Ashfield cafe and caterer serving breakfast, lunch, coffee and inner-west brunch.",
  },
  {
    name: "The Counter Petersham",
    url: "https://thecounterpetersham.com.au/",
    suburb: "Petersham",
    city: "Sydney",
    state: "NSW",
    address: "96 Audley Street, Petersham NSW 2049",
    contact: "0435 670 181",
    catalogs: ["https://thecounterpetersham.com.au/"],
    description: "Petersham cafe serving specialty coffee, classic breakfast, brunch, lunch and juices.",
    ignoredOfferUrlPatterns: [/^https:\/\/thecounterpetersham\.com\.au\/?$/i],
  },
  {
    name: "Solstice Summer Hill",
    url: "https://www.solsticesummerhill.com.au/",
    suburb: "Summer Hill",
    city: "Sydney",
    state: "NSW",
    address: "Summer Hill NSW 2130",
    catalogs: ["https://www.solsticesummerhill.com.au/"],
    description: "Small Summer Hill specialty coffee bar with seasonal pastries and sandwiches.",
  },
  {
    name: "Envy Deli Cafe Summer Hill",
    url: "https://www.envydelicafe.com.au/",
    suburb: "Summer Hill",
    city: "Sydney",
    state: "NSW",
    address: "109 Smith Street, Summer Hill NSW 2130",
    contact: "02 9797 1668",
    catalogs: ["https://www.envydelicafe.com.au/"],
    description: "Long-running Summer Hill deli cafe with all-day breakfast, cakes, lunch and courtyard dining.",
  },
  {
    name: "Plunge No. 46 Summer Hill",
    url: "https://plunge46.com/",
    suburb: "Summer Hill",
    city: "Sydney",
    state: "NSW",
    address: "46 Lackey Street, Summer Hill NSW 2130",
    contact: "02 9799 9666",
    catalogs: ["https://plunge46.com/"],
    description: "Mediterranean-inspired Summer Hill cafe serving all-day breakfast, meze lunch and locally roasted coffee.",
  },
  {
    name: "The Carpenter Leichhardt",
    url: "https://www.thecarpentercafe.com.au/",
    suburb: "Leichhardt",
    city: "Sydney",
    state: "NSW",
    address: "Leichhardt NSW 2040",
    contact: "02 8033 8509",
    catalogs: ["https://www.thecarpentercafe.com.au/"],
    description: "Leichhardt specialty coffee roastery and cafe with brunch and house-roasted coffee.",
  },
  {
    name: "Leaf Cafe Leichhardt",
    url: "https://www.leafcafe.com.au/our-stores-menus/leichhardt/",
    suburb: "Leichhardt",
    city: "Sydney",
    state: "NSW",
    address: "Shop 23 Leichhardt Market Place, 122-138 Flood Street, Leichhardt NSW 2040",
    contact: "0431 468 212",
    catalogs: ["https://www.leafcafe.com.au/our-stores-menus/leichhardt/"],
    description: "Leichhardt cafe serving specialty coffee and an extensive all-day brunch menu.",
  },
  {
    name: "Honey & Walnut Patisserie Dulwich Hill",
    url: "https://honeyandwalnutpatisserie.com.au/",
    suburb: "Dulwich Hill",
    city: "Sydney",
    state: "NSW",
    address: "Dulwich Hill NSW 2203",
    catalogs: ["https://honeyandwalnutpatisserie.com.au/"],
    description: "Dulwich Hill patisserie and cafe baking handmade sweets, savoury pastries and coffee daily.",
  },
  {
    name: "3 Tomatoes Cafe Ashbury",
    url: "https://www.3tomatoescafe.com/",
    suburb: "Ashbury",
    city: "Sydney",
    state: "NSW",
    address: "121 Holden Street, Ashbury NSW 2193",
    contact: "info@3tomatoescafe.com",
    catalogs: ["https://www.3tomatoescafe.com/"],
    description: "Ashbury neighbourhood cafe serving breakfast, brunch, lunch and coffee.",
  },
];

function createOffer(matchedUrl: string, matchedKeywords: string[]) {
  const startDate = new Date();
  const endDate = getLiveVerifiedOfferEndDate(startDate, "dining");
  const hasHappyHour = matchedKeywords.some((keyword) => /happy hour/i.test(keyword));

  return {
    title: "Happening Now...",
    description: `Offer wording found on the store website (${matchedKeywords.join(", ")}). Check the store website for live availability.`,
    startDate,
    endDate,
    eCatalog: [matchedUrl],
    coupon: hasHappyHour ? "Happy Hour / Special" : undefined,
  };
}

async function verifyAndSaveStore(store: InnerWestCafe, categoryId: number, ownerId: number) {
  const savedStore = await prisma.store.upsert({
    where: { url: store.url },
    update: {
      name: store.name,
      suburb: store.suburb,
      city: store.city,
      state: store.state,
      country: "Australia",
      contact: store.contact,
      address: store.address,
      description: store.description,
      catalogs: store.catalogs || [],
      sourceType: "website",
      websiteUrl: store.verificationUrl || store.url,
      locationSource: "suburb",
      categoryId,
    },
    create: {
      name: store.name,
      url: store.url,
      suburb: store.suburb,
      city: store.city,
      state: store.state,
      country: "Australia",
      contact: store.contact,
      address: store.address,
      description: store.description,
      catalogs: store.catalogs || [],
      sourceType: "website",
      websiteUrl: store.verificationUrl || store.url,
      locationSource: "suburb",
      categoryId,
      ownerId,
    },
  });

  const googleFallbacks = await prisma.store.findMany({
    where: {
      categoryId,
      sourceType: "google_business",
      NOT: { locationSource: "closed" },
      name: { equals: store.name, mode: "insensitive" },
      suburb: { equals: store.suburb, mode: "insensitive" },
    },
    select: { id: true },
  });

  if (googleFallbacks.length > 0) {
    const fallbackIds = googleFallbacks.map((fallback) => fallback.id);
    await prisma.store.updateMany({
      where: { id: { in: fallbackIds } },
      data: {
        locationSource: "closed",
        description: "Closed duplicate superseded by official website listing.",
      },
    });
    await prisma.discount.deleteMany({ where: { storeId: { in: fallbackIds } } });
    console.log(`closed-google-fallback: ${store.name} (${googleFallbacks.length})`);
  }

  const verificationUrl = store.verificationUrl || store.url;
  const result = await OfferVerifier.verifyStoreOfferPages(verificationUrl, store.catalogs || [], {
    country: "Australia",
    profile: "dining",
    maxPages: 5,
    requestTimeoutMs: 12000,
  });

  const { removedCatalogUrls } = await updateCatalogUrlHealth(prisma, savedStore.id, store.catalogs || [], result);
  if (removedCatalogUrls.length > 0) {
    console.log(`catalog-prune: ${store.name} -> ${removedCatalogUrls.join(", ")}`);
  }

  const matchedUrl = result.matchedUrl;
  const ignoredOffer = matchedUrl
    ? store.ignoredOfferUrlPatterns?.some((pattern) => pattern.test(matchedUrl))
    : false;

  if (result.hasOffer && matchedUrl && !ignoredOffer) {
    const offer = createOffer(matchedUrl, result.matchedKeywords);
    await prisma.discount.upsert({
      where: {
        storeId_title: {
          storeId: savedStore.id,
          title: offer.title,
        },
      },
      update: {
        ...offer,
        updatedAt: new Date(),
      },
      create: {
        ...offer,
        storeId: savedStore.id,
      },
    });
    console.log(`offer: ${store.name} -> ${result.matchedKeywords.join(", ")} @ ${matchedUrl}`);
    return { store: 1, offer: 1 };
  }

  const deleted = await prisma.discount.deleteMany({
    where: {
      storeId: savedStore.id,
      OR: [
        { title: "Happening Now..." },
        { description: { startsWith: "Offer wording found on the store website" } },
      ],
    },
  });

  console.log(
    `no-offer: ${store.name}${ignoredOffer ? ` (ignored ${matchedUrl})` : ""}${
      deleted.count > 0 ? ` (removed ${deleted.count})` : ""
    }`
  );
  return { store: 1, offer: 0 };
}

async function main() {
  const owner = await prisma.user.findFirst({ orderBy: { id: "asc" } });
  if (!owner) {
    throw new Error("No user found to own seeded Inner West cafe stores.");
  }

  const category = await prisma.category.upsert({
    where: { name: CATEGORY_NAME },
    update: {},
    create: { name: CATEGORY_NAME },
  });

  let savedStores = 0;
  let verifiedOffers = 0;

  for (let index = 0; index < stores.length; index += VERIFY_CONCURRENCY) {
    const batch = stores.slice(index, index + VERIFY_CONCURRENCY);
    const results = await Promise.all(batch.map((store) => verifyAndSaveStore(store, category.id, owner.id)));
    savedStores += results.reduce((sum, result) => sum + result.store, 0);
    verifiedOffers += results.reduce((sum, result) => sum + result.offer, 0);
  }

  console.log(`Seeded ${savedStores} Inner West cafe and brunch stores. Verified offers: ${verifiedOffers}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(process.exitCode ?? 0);
  });
