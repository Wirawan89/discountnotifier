import { PrismaClient } from "@prisma/client";
import { updateCatalogUrlHealth } from "../src/lib/catalog-health";
import { getLiveVerifiedOfferEndDate } from "../src/lib/offer-lifecycle";
import { OfferVerifier } from "../src/lib/offer-verifier";

const prisma = new PrismaClient();
const CATEGORY_NAME = "Caffe & Brunch";
const VERIFY_CONCURRENCY = 4;

type NorthernTerritoryCafe = {
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

const stores: NorthernTerritoryCafe[] = [
  {
    name: "Besser Brew Bar Winnellie",
    url: "https://www.besserbrewbar.com.au/",
    suburb: "Winnellie",
    city: "Darwin",
    state: "NT",
    address: "6/116 Coonawarra Road, Winnellie NT 0820",
    contact: "08 8984 3254",
    catalogs: ["https://www.besserbrewbar.com.au/"],
    description: "Darwin cafe and brew bar serving breakfast, brunch, coffee, burgers and casual daytime meals.",
  },
  {
    name: "Ruby G's Canteen Coconut Grove",
    url: "https://www.rubygscanteen.com.au/",
    suburb: "Coconut Grove",
    city: "Darwin",
    state: "NT",
    address: "3/2 Tang Street, Coconut Grove NT 0810",
    contact: "08 8900 7122",
    catalogs: ["https://www.rubygscanteen.com.au/"],
    description: "Darwin bakery and canteen serving coffee, pastries, breakfast, brunch and casual meals.",
  },
  {
    name: "Laneway Coffee Parap",
    url: "https://www.lanewaycoffee.com.au/menu",
    verificationUrl: "https://www.lanewaycoffee.com.au/",
    suburb: "Parap",
    city: "Darwin",
    state: "NT",
    address: "Parap NT 0820",
    catalogs: ["https://www.lanewaycoffee.com.au/", "https://www.lanewaycoffee.com.au/menu"],
    description: "Darwin cafe serving specialty coffee, all-day dining, breakfast, brunch and lunch.",
  },
  {
    name: "Eva's Cafe Darwin Botanic Gardens",
    url: "https://www.botanicgardenscafe.com.au/",
    suburb: "The Gardens",
    city: "Darwin",
    state: "NT",
    address: "200 Gardens Road, The Gardens NT 0820",
    catalogs: ["https://www.botanicgardenscafe.com.au/"],
    description: "Darwin Botanic Gardens cafe serving Allpress coffee, local-ingredient meals, brunch and lunch.",
  },
  {
    name: "Saltwater at Bundilla The Gardens",
    url: "https://saltwaterb.com.au/",
    suburb: "The Gardens",
    city: "Darwin",
    state: "NT",
    address: "19 Conacher Street, The Gardens NT 0820",
    contact: "0448 730 238",
    catalogs: ["https://saltwaterb.com.au/"],
    description: "Museum cafe and restaurant in Darwin serving breakfast, brunch, lunch and NT produce-led dining.",
  },
  {
    name: "The Foreshore Restaurant and Cafe Nightcliff",
    url: "https://foreshorecafe.com.au/",
    suburb: "Nightcliff",
    city: "Darwin",
    state: "NT",
    address: "259 Casuarina Drive, Nightcliff NT 0810",
    contact: "08 8948 4488",
    catalogs: ["https://foreshorecafe.com.au/"],
    description: "Nightcliff foreshore cafe and restaurant serving coffee, breakfast, brunch, lunch and ocean-view meals.",
  },
  {
    name: "Pulp Kitchen Palmerston",
    url: "https://darwinfoodies.com/directory/pulp-kitchen",
    suburb: "Palmerston",
    city: "Palmerston",
    state: "NT",
    address: "Shop 9/130 University Avenue, Palmerston NT 0830",
    contact: "08 8931 0300",
    catalogs: ["https://darwinfoodies.com/directory/pulp-kitchen"],
    description: "Palmerston cafe serving breakfast, brunch, lunch, dinner and relaxed casual food.",
  },
  {
    name: "Fresh Point Co Bellamack",
    url: "https://freshpointcobellamack.gotoeat.net/",
    suburb: "Bellamack",
    city: "Palmerston",
    state: "NT",
    address: "Shop 5-9, 127 Flynn Circuit, Bellamack NT 0832",
    catalogs: ["https://freshpointcobellamack.gotoeat.net/"],
    description: "Bellamack cafe serving coffee, pancakes, breakfast, brunch and casual Palmerston-area meals.",
  },
  {
    name: "The Finch Cafe Katherine",
    url: "https://thefinchcafe.com.au/",
    suburb: "Katherine",
    city: "Katherine",
    state: "NT",
    address: "17a Katherine Terrace, Katherine NT 0850",
    contact: "08 8972 1990",
    catalogs: ["https://thefinchcafe.com.au/", "https://www.thefinchcafe.com.au/About/"],
    description: "Katherine cafe serving coffee, all-day breakfast, lunch, sandwiches, wraps, salads and sweet treats.",
  },
  {
    name: "Black Russian Coffee and Toasties Katherine",
    url: "https://blackrussian.com.au/",
    suburb: "Katherine",
    city: "Katherine",
    state: "NT",
    address: "23 Chambers Drive, Katherine NT 0850",
    contact: "0460 750 203",
    catalogs: ["https://blackrussian.com.au/"],
    description: "Katherine coffee and toastie cafe inside the visitor centre courtyard serving breakfast and lunch bites.",
  },
  {
    name: "The Daily Grind Cafe Alice Springs",
    url: "https://www.thedailygrindcafe.com.au/",
    suburb: "Alice Springs",
    city: "Alice Springs",
    state: "NT",
    address: "Shop 27/36-38 Hartley Street, Alice Springs NT 0870",
    contact: "0439 587 559",
    catalogs: ["https://www.thedailygrindcafe.com.au/"],
    description: "Alice Springs cafe serving coffee, brunch, quick bites and warm outback-style cafe meals.",
  },
  {
    name: "The Bean Tree Cafe Alice Springs",
    url: "https://www.beantreecafe.org/",
    suburb: "Alice Springs",
    city: "Alice Springs",
    state: "NT",
    address: "27 Tuncks Road, Alice Springs NT 0870",
    contact: "0447 270 949",
    catalogs: ["https://www.beantreecafe.org/", "https://www.beantreecafe.org/contact-us"],
    description: "Alice Springs botanical garden cafe serving bush-inspired food, coffee, breakfast and lunch.",
  },
  {
    name: "Epilogue Lounge Alice Springs",
    url: "https://www.epiloguelounge.com.au/",
    suburb: "Alice Springs",
    city: "Alice Springs",
    state: "NT",
    address: "1/58 Todd Mall, Alice Springs NT 0870",
    catalogs: ["https://www.epiloguelounge.com.au/"],
    description: "Alice Springs cafe and lounge serving breakfast, lunch, cafe drinks and evening dining.",
  },
  {
    name: "Kulata Academy Cafe Yulara",
    url: "https://www.ayersrockresort.com.au/dining/kulata-academy-cafe",
    verificationUrl: "https://www.ayersrockresort.com.au/",
    suburb: "Yulara",
    city: "Uluru",
    state: "NT",
    address: "Town Square, Yulara NT 0872",
    catalogs: [
      "https://www.ayersrockresort.com.au/",
      "https://www.ayersrockresort.com.au/dining/kulata-academy-cafe",
      "https://www.ayersrockresort.com.au/dine",
    ],
    description: "Ayers Rock Resort cafe in Yulara serving coffee, breakfast classics, sandwiches, salads and pastries.",
    ignoredOfferUrlPatterns: [/\/offers\//i],
  },
  {
    name: "Bay Leaf Cafe Tennant Creek",
    url: "https://darwinlocalista.com.au/listing/bay-leaf-cafe?place=tennant+creek%2C+nt%2C+au",
    suburb: "Tennant Creek",
    city: "Tennant Creek",
    state: "NT",
    address: "2/163 Paterson Street, Tennant Creek NT 0860",
    contact: "08 8962 1295",
    catalogs: ["https://darwinlocalista.com.au/listing/bay-leaf-cafe?place=tennant+creek%2C+nt%2C+au"],
    description: "Tennant Creek cafe serving coffee, cakes, breakfast, lunch and casual Barkly-region meals.",
    ignoredOfferUrlPatterns: [/\/special-offers/i],
  },
  {
    name: "Gove Cafe Nhulunbuy",
    url: "https://govepizzaandcafe-d1b4.bitebusiness.com/",
    suburb: "Nhulunbuy",
    city: "East Arnhem",
    state: "NT",
    address: "85 Chesterfield Circuit, Nhulunbuy NT 0880",
    contact: "08 8987 1155",
    catalogs: ["https://govepizzaandcafe-d1b4.bitebusiness.com/"],
    description: "Nhulunbuy cafe and takeaway serving coffee, breakfast, brunch, burgers, pizza and casual food.",
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

async function verifyAndSaveStore(store: NorthernTerritoryCafe, categoryId: number, ownerId: number) {
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
    throw new Error("No user found to own seeded Northern Territory cafe stores.");
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

  console.log(`Seeded ${savedStores} Northern Territory cafe and brunch stores. Verified offers: ${verifiedOffers}.`);
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
