import { PrismaClient } from "@prisma/client";
import { updateCatalogUrlHealth } from "../src/lib/catalog-health";
import { getLiveVerifiedOfferEndDate } from "../src/lib/offer-lifecycle";
import { OfferVerifier } from "../src/lib/offer-verifier";

const prisma = new PrismaClient();
const CATEGORY_NAME = "Caffe & Brunch";
const VERIFY_CONCURRENCY = 4;

type TasmaniaCafe = {
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

const stores: TasmaniaCafe[] = [
  {
    name: "Dandy Lane Hobart",
    url: "https://dandylanecafe.com/",
    suburb: "Hobart",
    city: "Hobart",
    state: "TAS",
    address: "138 Collins Street, Hobart TAS 7000",
    contact: "03 6234 6838",
    catalogs: ["https://dandylanecafe.com/"],
    description: "Popular Hobart CBD brunch cafe serving specialty coffee, breakfast, lunch and seasonal plates.",
  },
  {
    name: "Rivulet Cafe South Hobart",
    url: "https://www.rivuletcafe.com.au/",
    suburb: "South Hobart",
    city: "Hobart",
    state: "TAS",
    address: "64 Anglesea Street, South Hobart TAS 7004",
    contact: "03 6223 6696",
    catalogs: ["https://www.rivuletcafe.com.au/"],
    description: "South Hobart cafe and provedore serving brunch, coffee, pastries, wine and deli goods.",
  },
  {
    name: "Raincheck Lounge North Hobart",
    url: "https://www.rainchecklounge.com/",
    suburb: "North Hobart",
    city: "Hobart",
    state: "TAS",
    address: "392 Elizabeth Street, North Hobart TAS 7000",
    contact: "03 6234 5975",
    catalogs: ["https://www.rainchecklounge.com/"],
    description: "North Hobart cafe and lounge serving breakfast, lunch, coffee and relaxed all-day dining.",
  },
  {
    name: "Sisterhood Hobart",
    url: "https://sisterhoodhobart.com/",
    suburb: "Sandy Bay",
    city: "Hobart",
    state: "TAS",
    address: "48 King Street, Sandy Bay TAS 7005",
    contact: "03 6223 6533",
    catalogs: ["https://sisterhoodhobart.com/"],
    description: "Sandy Bay brunch cafe with coffee, breakfast, lunch, pastries and a local neighbourhood feel.",
  },
  {
    name: "The Little Poet Hobart",
    url: "https://www.thelittlepoet.com/",
    suburb: "Hobart",
    city: "Hobart",
    state: "TAS",
    address: "Hobart TAS 7000",
    catalogs: ["https://www.thelittlepoet.com/"],
    description: "Hobart cafe serving coffee, brunch and modern cafe food.",
  },
  {
    name: "Madame Clarke's Kingston",
    url: "https://www.madameclarkes.com/",
    suburb: "Kingston",
    city: "Hobart",
    state: "TAS",
    address: "8 Channel Highway, Kingston TAS 7050",
    contact: "03 6229 5566",
    catalogs: ["https://www.madameclarkes.com/"],
    description: "Kingston cafe and eatery serving breakfast, lunch, coffee, drinks and casual meals.",
  },
  {
    name: "The Pantry Launceston",
    url: "https://thepantrycafe.com.au/",
    suburb: "Launceston",
    city: "Launceston",
    state: "TAS",
    address: "64 Charles Street, Launceston TAS 7250",
    contact: "03 6331 7100",
    catalogs: ["https://thepantrycafe.com.au/"],
    description: "Launceston cafe serving breakfast, lunch, coffee, juices, cakes and catering.",
  },
  {
    name: "Basin Cafe West Launceston",
    url: "https://www.basincafe.com.au/cafe",
    verificationUrl: "https://www.basincafe.com.au/",
    suburb: "West Launceston",
    city: "Launceston",
    state: "TAS",
    address: "74-90 Basin Road, West Launceston TAS 7250",
    contact: "03 6334 8111",
    catalogs: ["https://www.basincafe.com.au/cafe"],
    description: "Cafe at Cataract Gorge serving breakfast, lunch, coffee and casual dining in West Launceston.",
  },
  {
    name: "Hungry Birds Devonport",
    url: "https://www.hungrybirds.com.au/#devonport",
    verificationUrl: "https://www.hungrybirds.com.au/",
    suburb: "Devonport",
    city: "Devonport",
    state: "TAS",
    address: "Devonport TAS 7310",
    contact: "03 6424 4555",
    catalogs: ["https://www.hungrybirds.com.au/"],
    description: "North-west Tasmania cafe serving coffee, brunch, lunch and fresh cafe food.",
  },
  {
    name: "Hungry Birds Burnie",
    url: "https://www.hungrybirds.com.au/#burnie",
    verificationUrl: "https://www.hungrybirds.com.au/",
    suburb: "Burnie",
    city: "Burnie",
    state: "TAS",
    address: "Burnie TAS 7320",
    contact: "03 6432 3666",
    catalogs: ["https://www.hungrybirds.com.au/"],
    description: "Burnie branch of Hungry Birds serving brunch, coffee and casual cafe food.",
  },
  {
    name: "Anvers Cafe Latrobe",
    url: "https://anvers-chocolate.com.au/anvers-cafe/",
    suburb: "Latrobe",
    city: "Devonport",
    state: "TAS",
    address: "9025 Bass Highway, Latrobe TAS 7307",
    contact: "03 6426 2958",
    catalogs: ["https://anvers-chocolate.com.au/anvers-cafe/"],
    description: "House of Anvers cafe near Devonport serving chocolate, breakfast, lunch, coffee and desserts.",
  },
  {
    name: "Bruny Island Cruises Restaurant",
    url: "https://www.brunycruises.com.au/restaurant/",
    suburb: "Adventure Bay",
    city: "Bruny Island",
    state: "TAS",
    address: "915 Adventure Bay Road, Adventure Bay TAS 7150",
    contact: "03 6293 1465",
    catalogs: ["https://www.brunycruises.com.au/restaurant/"],
    description: "Bruny Island restaurant and cafe-style stop serving hot food, drinks and pre/post cruise meals.",
  },
  {
    name: "Bruny Island Premium Wines Restaurant",
    url: "https://www.brunyislandwine.com/eat/",
    suburb: "Lunawanna",
    city: "Bruny Island",
    state: "TAS",
    address: "4391 Main Road, Lunawanna TAS 7150",
    contact: "03 6293 1088",
    catalogs: ["https://www.brunyislandwine.com/eat/"],
    description: "Bruny Island winery restaurant serving lunch, wine, cider and local Tasmanian produce.",
  },
  {
    name: "Bruny Island Cheese and Beer Co",
    url: "https://brunyislandcheese.com.au/",
    suburb: "Great Bay",
    city: "Bruny Island",
    state: "TAS",
    address: "1807 Bruny Island Main Road, Great Bay TAS 7150",
    contact: "03 6260 6353",
    catalogs: ["https://brunyislandcheese.com.au/"],
    description: "Bruny Island cheese, beer and provisions venue with tastings, coffee, snacks and local produce.",
  },
  {
    name: "Lunawanna Cafe Bruny Island",
    url: "https://brunyisland.com.au/lunawanna-cafe",
    suburb: "Lunawanna",
    city: "Bruny Island",
    state: "TAS",
    address: "Lunawanna TAS 7150",
    catalogs: ["https://brunyisland.com.au/lunawanna-cafe"],
    description: "Bruny Island cafe listing for coffee, breakfast, lunch and local island dining.",
    ignoredOfferUrlPatterns: [/\/special-offers/i],
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

async function verifyAndSaveStore(store: TasmaniaCafe, categoryId: number, ownerId: number) {
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
    throw new Error("No user found to own seeded Tasmania cafe stores.");
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

  console.log(`Seeded ${savedStores} Tasmania cafe and brunch stores. Verified offers: ${verifiedOffers}.`);
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
