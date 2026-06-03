import { PrismaClient } from "@prisma/client";
import { updateCatalogUrlHealth } from "../src/lib/catalog-health";
import { getLiveVerifiedOfferEndDate } from "../src/lib/offer-lifecycle";
import { OfferVerifier } from "../src/lib/offer-verifier";

const prisma = new PrismaClient();
const CATEGORY_NAME = "Caffe & Brunch";
const VERIFY_CONCURRENCY = 4;

type MarrickvilleCafe = {
  name: string;
  url: string;
  suburb: string;
  city: string;
  state: string;
  address: string;
  contact?: string;
  catalogs?: string[];
  description: string;
  sourceType?: "website" | "google_business";
};

const stores: MarrickvilleCafe[] = [
  {
    name: "ONA Coffee Sydney Marrickville",
    url: "https://www.onacoffeesydney.com/",
    suburb: "Marrickville",
    city: "Sydney",
    state: "NSW",
    address: "58/60 Smith Street, Marrickville NSW 2204",
    contact: "onasydney@onacoffee.com.au",
    catalogs: ["https://www.onacoffeesydney.com/"],
    description: "Good Food Guide award-winning specialty coffee and brunch cafe in Marrickville.",
  },
  {
    name: "Two Chaps Marrickville",
    url: "https://www.twochaps.com.au/",
    suburb: "Marrickville",
    city: "Sydney",
    state: "NSW",
    address: "122 Chapel Street, Marrickville NSW 2204",
    contact: "(02) 9572 8858",
    catalogs: ["https://www.twochaps.com.au/"],
    description: "From-scratch cafe and bakery with a sustainable, produce-driven brunch menu.",
  },
  {
    name: "Matinee Coffee Marrickville",
    url: "https://www.matineecoffee.com/about",
    suburb: "Marrickville",
    city: "Sydney",
    state: "NSW",
    address: "Shop 1, 23-29 Addison Road, Marrickville NSW 2204",
    contact: "(02) 9519 7591",
    catalogs: ["https://www.matineecoffee.com/say-hello"],
    description: "Spacious Marrickville brunch cafe with house-made pastries, sodas, relishes and roasted coffee.",
  },
  {
    name: "Roastville Coffee Marrickville",
    url: "https://roastville.com.au/pages/locations",
    suburb: "Marrickville",
    city: "Sydney",
    state: "NSW",
    address: "157 Victoria Road, Marrickville NSW 2204",
    contact: "(02) 9560 4802",
    catalogs: ["https://roastville.com.au/pages/locations"],
    description: "Specialty coffee roaster and cafe serving brunch in Marrickville.",
  },
  {
    name: "Double Roasters Cafe Marrickville",
    url: "https://doubleroasters.com/pages/visit-us",
    suburb: "Marrickville",
    city: "Sydney",
    state: "NSW",
    address: "199 Victoria Road, Marrickville NSW 2204",
    contact: "(02) 9518 0771",
    catalogs: ["https://doubleroasters.com/pages/visit-us"],
    description: "Marrickville specialty coffee roastery and cafe with brunch and retail beans.",
  },
  {
    name: "Side Story Cafe Marrickville",
    url: "https://doubleroasters.com/pages/visit-us#side-story-cafe",
    suburb: "Marrickville",
    city: "Sydney",
    state: "NSW",
    address: "313 Marrickville Road, Marrickville NSW 2204",
    contact: "(02) 9518 0771",
    catalogs: ["https://doubleroasters.com/pages/visit-us"],
    description: "Double Roasters side cafe at Marrickville Library with specialty brews and fresh cafe food.",
  },
  {
    name: "White Rabbit Marrickville",
    url: "https://whiterabbitsydney.com/marrickville",
    suburb: "Marrickville",
    city: "Sydney",
    state: "NSW",
    address: "30 Llewellyn Street, Marrickville NSW 2204",
    contact: "(02) 9221 8012",
    catalogs: ["https://whiterabbitsydney.com/marrickville"],
    description: "Spacious artisan bakery and all-day brunch cafe in Marrickville.",
  },
  {
    name: "Eat Ozzo Marrickville",
    url: "https://www.eatozzo.com/marrickville",
    suburb: "Marrickville",
    city: "Sydney",
    state: "NSW",
    address: "Chapel Street, Marrickville NSW 2204",
    catalogs: ["https://www.eatozzo.com/marrickville"],
    description: "Italian-inspired Marrickville cafe and sandwich shop serving breakfast, brunch and lunch.",
  },
  {
    name: "Moka Pod Marrickville",
    url: "https://mokapod.com.au/",
    suburb: "Marrickville",
    city: "Sydney",
    state: "NSW",
    address: "Marrickville NSW 2204",
    catalogs: ["https://mokapod.com.au/"],
    description: "Modern Aussie brunch and Campos coffee cafe in Marrickville.",
  },
  {
    name: "The Giant Bean Marrickville",
    url: "https://thegiantbean.com.au/",
    suburb: "Marrickville",
    city: "Sydney",
    state: "NSW",
    address: "314 Victoria Road, Marrickville NSW 2204",
    catalogs: ["https://thegiantbean.com.au/"],
    description: "Marrickville cafe serving brunch, coffee and casual local dining.",
  },
  {
    name: "The General Dulwich Hill",
    url: "https://www.mygeneral.com.au/",
    suburb: "Dulwich Hill",
    city: "Sydney",
    state: "NSW",
    address: "514 Marrickville Road, Dulwich Hill NSW 2203",
    catalogs: ["https://www.mygeneral.com.au/"],
    description: "Inner West brunch cafe near Marrickville with all-day cafe food.",
  },
  {
    name: "Coffee Alchemy Marrickville",
    url: "https://coffeealchemy.com.au/pages/coffee-alchemy",
    suburb: "Marrickville",
    city: "Sydney",
    state: "NSW",
    address: "2/87 Sydenham Road, Marrickville NSW 2204",
    contact: "(02) 9516 1997",
    catalogs: ["https://coffeealchemy.com.au/pages/coffee-alchemy"],
    description: "Highly regarded specialty coffee roastery and Marrickville cafe.",
  },
  {
    name: "Black Market Coffee Marrickville",
    url: "https://blackmarketcoffee.com.au/",
    suburb: "Marrickville",
    city: "Sydney",
    state: "NSW",
    address: "24 Cadogan Street, Marrickville NSW 2204",
    catalogs: ["https://blackmarketcoffee.com.au/"],
    description: "Specialty coffee roastery and cafe in Marrickville with an official website.",
  },
  {
    name: "Bespoke and Grind Marrickville",
    url: "https://www.google.com/search?q=Bespoke+and+Grind+Marrickville",
    suburb: "Marrickville",
    city: "Sydney",
    state: "NSW",
    address: "78-80 Livingstone Road, Marrickville NSW 2204",
    catalogs: [],
    description: "Highly rated Marrickville local cafe and coffee shop without a confirmed official website.",
    sourceType: "google_business",
  },
  {
    name: "Valentina's Marrickville",
    url: "https://www.google.com/search?q=Valentina%27s+Marrickville+brunch",
    suburb: "Marrickville",
    city: "Sydney",
    state: "NSW",
    address: "132 Livingstone Road, Marrickville NSW 2204",
    catalogs: [],
    description: "Popular Marrickville diner-style brunch cafe without a confirmed official website.",
    sourceType: "google_business",
  },
  {
    name: "Double Tap Marrickville",
    url: "https://doubletapcoffee.com.au/about-us/",
    suburb: "Marrickville",
    city: "Sydney",
    state: "NSW",
    address: "54-56 Smith Street, Marrickville NSW 2204",
    contact: "0404 475 430",
    catalogs: ["https://doubletapcoffee.com.au/about-us/"],
    description: "Marrickville coffee roaster and cafe focused on community and specialty coffee.",
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

async function verifyAndSaveStore(store: MarrickvilleCafe, categoryId: number, ownerId: number) {
  const sourceType = store.sourceType || "website";
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
      sourceType,
      googleBusinessUrl: sourceType === "google_business" ? store.url : undefined,
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
      sourceType,
      googleBusinessUrl: sourceType === "google_business" ? store.url : undefined,
      locationSource: "suburb",
      categoryId,
      ownerId,
    },
  });

  if (sourceType === "google_business") {
    await prisma.discount.deleteMany({
      where: {
        storeId: savedStore.id,
        description: {
          startsWith: "Offer wording found on the store website",
        },
      },
    });
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

async function closeSupersededGoogleRows() {
  const supersededNames = [
    "Ona Coffee Marrickville",
    "Two Chaps Marrickville",
    "Coffee Alchemy Marrickville",
    "Double Tap Marrickville",
  ];

  const result = await prisma.store.updateMany({
    where: {
      category: { name: CATEGORY_NAME },
      sourceType: "google_business",
      OR: supersededNames.map((name) => ({ name })),
    },
    data: {
      locationSource: "closed",
      description: "Closed duplicate superseded by official website listing.",
    },
  });

  if (result.count > 0) {
    console.log(`closed-duplicates: ${result.count} Google Business row(s) superseded by official websites`);
  }
}

async function main() {
  const owner = await prisma.user.findFirst({ orderBy: { id: "asc" } });
  if (!owner) {
    throw new Error("No user found to own seeded Marrickville cafe stores.");
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

  await closeSupersededGoogleRows();

  console.log(`Seeded ${savedStores} Marrickville cafe and brunch stores. Verified offers: ${verifiedOffers}.`);
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
