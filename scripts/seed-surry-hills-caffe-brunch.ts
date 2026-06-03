import { PrismaClient } from "@prisma/client";
import { updateCatalogUrlHealth } from "../src/lib/catalog-health";
import { getLiveVerifiedOfferEndDate } from "../src/lib/offer-lifecycle";
import { OfferVerifier } from "../src/lib/offer-verifier";

const prisma = new PrismaClient();
const CATEGORY_NAME = "Caffe & Brunch";
const VERIFY_CONCURRENCY = 4;

type SurryHillsCafe = {
  name: string;
  url: string;
  suburb: string;
  city: string;
  state: string;
  address: string;
  contact?: string;
  catalogs?: string[];
  description: string;
};

const stores: SurryHillsCafe[] = [
  {
    name: "Four Ate Five",
    url: "https://www.fouratefive.com/",
    suburb: "Surry Hills",
    city: "Sydney",
    state: "NSW",
    address: "485 Crown Street, Surry Hills NSW 2010",
    contact: "(02) 9698 6485",
    catalogs: ["https://www.fouratefive.com/"],
    description: "Neighbourhood brunch spot known for Middle Eastern-inspired breakfast and lunch.",
  },
  {
    name: "Sticky Fingers Cafe Surry Hills",
    url: "https://stickyfingerscafe.com.au/",
    suburb: "Surry Hills",
    city: "Sydney",
    state: "NSW",
    address: "23 Pelican Street, Surry Hills NSW 2010",
    catalogs: ["https://stickyfingerscafe.com.au/"],
    description: "Fully licensed breakfast and brunch cafe in Surry Hills.",
  },
  {
    name: "Lumiere Cafe Surry Hills",
    url: "https://lumierecafe.com.au/",
    suburb: "Surry Hills",
    city: "Sydney",
    state: "NSW",
    address: "Bourke Street, Surry Hills NSW 2010",
    contact: "lumierecafesurryhills@gmail.com",
    catalogs: ["https://lumierecafe.com.au/"],
    description: "Long-running Bourke Street cafe serving all-day breakfast and lunch.",
  },
  {
    name: "Cafe Ish Surry Hills",
    url: "https://www.cafeish.com.au/",
    suburb: "Surry Hills",
    city: "Sydney",
    state: "NSW",
    address: "82 Campbell Street, Surry Hills NSW 2010",
    catalogs: ["https://www.cafeish.com.au/"],
    description: "Cafe and izakaya with Native Australian and Japanese-influenced food.",
  },
  {
    name: "Cafe Kentaro Surry Hills",
    url: "https://www.cafekentaro.com.au/",
    suburb: "Surry Hills",
    city: "Sydney",
    state: "NSW",
    address: "616 Bourke Street, Surry Hills NSW 2010",
    contact: "0468 927 728",
    catalogs: ["https://www.cafekentaro.com.au/"],
    description: "Japanese-inspired brunch cafe and matcha specialist in Surry Hills.",
  },
  {
    name: "Single O Surry Hills",
    url: "https://singleo.com.au/pages/surry-hills",
    suburb: "Surry Hills",
    city: "Sydney",
    state: "NSW",
    address: "60-64 Reservoir Street, Surry Hills NSW 2010",
    contact: "(02) 9211 0665",
    catalogs: ["https://singleo.com.au/pages/surry-hills"],
    description: "Specialty coffee and brunch cafe at Single O's original Surry Hills location.",
  },
  {
    name: "Paramount Coffee Project",
    url: "https://www.paramountcoffeeproject.com.au/",
    suburb: "Surry Hills",
    city: "Sydney",
    state: "NSW",
    address: "80 Commonwealth Street, Surry Hills NSW 2010",
    contact: "hello@paramountcoffeeproject.com.au",
    catalogs: ["https://www.paramountcoffeeproject.com.au/about-us"],
    description: "Neighbourhood cafe at Paramount House showcasing coffee roasters and cafe favourites.",
  },
  {
    name: "bills Surry Hills",
    url: "https://www.bills.com.au/locations/surry-hills",
    suburb: "Surry Hills",
    city: "Sydney",
    state: "NSW",
    address: "355 Crown Street, Surry Hills NSW 2010",
    contact: "+61 2 9360 4762",
    catalogs: ["https://www.bills.com.au/locations/surry-hills"],
    description: "Iconic Surry Hills all-day dining and brunch venue.",
  },
  {
    name: "AP Bakery Surry Hills",
    url: "https://www.apbakery.com.au/stores-locations#surry-hills-nsw-2010-106-commonwealth-st",
    suburb: "Surry Hills",
    city: "Sydney",
    state: "NSW",
    address: "106 Commonwealth Street, Surry Hills NSW 2010",
    catalogs: ["https://www.apbakery.com.au/stores-locations"],
    description: "A.P Bakery's Surry Hills bakery and cafe location.",
  },
  {
    name: "Reuben Hills",
    url: "https://reubenhills.com.au/",
    suburb: "Surry Hills",
    city: "Sydney",
    state: "NSW",
    address: "61 Albion Street, Surry Hills NSW 2010",
    contact: "02 9211 5556",
    catalogs: ["https://reubenhills.com.au/"],
    description: "Specialty coffee roaster and all-day brunch cafe in Surry Hills.",
  },
  {
    name: "Shift Eatery Surry Hills",
    url: "https://www.shifteatery.com.au/",
    suburb: "Surry Hills",
    city: "Sydney",
    state: "NSW",
    address: "Shop 4, 241 Commonwealth Street, Surry Hills NSW 2010",
    contact: "+61 2 9281 5053",
    catalogs: ["https://www.shifteatery.com.au/"],
    description: "Plant-based vegan deli and cafe in Surry Hills.",
  },
  {
    name: "Cook & Archies Surry Hills",
    url: "https://cookandarchies.com.au/",
    suburb: "Surry Hills",
    city: "Sydney",
    state: "NSW",
    address: "4/14 Buckingham Street, Surry Hills NSW 2010",
    contact: "02 9310 3933",
    catalogs: ["https://cookandarchies.com.au/"],
    description: "Local breakfast, lunch and brunch cafe near Devonshire Street.",
  },
  {
    name: "Dad and the Frog Cafe",
    url: "https://www.dadandthefrog.com.au/",
    suburb: "Surry Hills",
    city: "Sydney",
    state: "NSW",
    address: "Fitzroy Street, Surry Hills NSW 2010",
    catalogs: ["https://www.dadandthefrog.com.au/"],
    description: "Award-winning neighbourhood cafe in Surry Hills.",
  },
  {
    name: "Lode Pies & Pastries",
    url: "https://www.lodepies.com/",
    suburb: "Surry Hills",
    city: "Sydney",
    state: "NSW",
    address: "487 Crown Street, Surry Hills NSW 2010",
    catalogs: ["https://www.lodepies.com/"],
    description: "Surry Hills pastry and bakery destination.",
  },
  {
    name: "Cafe Dougie Surry Hills",
    url: "https://www.google.com/search?q=Cafe+Dougie+Surry+Hills",
    suburb: "Surry Hills",
    city: "Sydney",
    state: "NSW",
    address: "496 Bourke Street, Surry Hills NSW 2010",
    catalogs: [],
    description: "Highly rated local Surry Hills brunch and matcha cafe without a confirmed official website.",
  },
];

function createOffer(storeName: string, matchedUrl: string, matchedKeywords: string[]) {
  const startDate = new Date();
  const endDate = getLiveVerifiedOfferEndDate(startDate, "dining");
  const hasHappyHour = matchedKeywords.some((keyword) => /happy hour/i.test(keyword));

  return {
    title: hasHappyHour ? `${storeName} Happy Hour and Special Offers` : `${storeName} Special Offers`,
    description: `Offer wording found on the store website (${matchedKeywords.join(", ")}). Check the store website for live availability.`,
    startDate,
    endDate,
    eCatalog: [matchedUrl],
  };
}

async function verifyAndSaveStore(store: SurryHillsCafe, categoryId: number, ownerId: number) {
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
      sourceType: store.url.includes("google.com/search") ? "google_business" : "website",
      googleBusinessUrl: store.url.includes("google.com/search") ? store.url : undefined,
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
      sourceType: store.url.includes("google.com/search") ? "google_business" : "website",
      googleBusinessUrl: store.url.includes("google.com/search") ? store.url : undefined,
      locationSource: "suburb",
      categoryId,
      ownerId,
    },
  });

  if (store.url.includes("google.com/search")) {
    console.log(`no-offer: ${store.name} (Google Business listing only)`);
    return { store: 1, offer: 0 };
  }

  const result = await OfferVerifier.verifyStoreOfferPages(store.url, store.catalogs || [], {
    country: "Australia",
    profile: "dining",
  });

  const { removedCatalogUrls } = await updateCatalogUrlHealth(prisma, savedStore.id, store.catalogs || [], result);
  if (removedCatalogUrls.length > 0) {
    console.log(`catalog-prune: ${store.name} -> ${removedCatalogUrls.join(", ")}`);
  }

  if (result.hasOffer && result.matchedUrl) {
    const offer = createOffer(store.name, result.matchedUrl, result.matchedKeywords);
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
    console.log(`offer: ${store.name} -> ${result.matchedKeywords.join(", ")} @ ${result.matchedUrl}`);
    return { store: 1, offer: 1 };
  }

  const deleted = await prisma.discount.deleteMany({
    where: {
      storeId: savedStore.id,
      description: {
        startsWith: "Offer wording found on the store website",
      },
    },
  });

  console.log(`no-offer: ${store.name}${deleted.count > 0 ? ` (removed ${deleted.count})` : ""}`);
  return { store: 1, offer: 0 };
}

async function main() {
  const owner = await prisma.user.findFirst({ orderBy: { id: "asc" } });
  if (!owner) {
    throw new Error("No user found to own seeded Surry Hills cafe stores.");
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

  console.log(`Seeded ${savedStores} Surry Hills cafe and brunch stores. Verified offers: ${verifiedOffers}.`);
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
