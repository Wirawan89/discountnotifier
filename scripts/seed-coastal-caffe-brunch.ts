import { PrismaClient } from "@prisma/client";
import { updateCatalogUrlHealth } from "../src/lib/catalog-health";
import { getLiveVerifiedOfferEndDate } from "../src/lib/offer-lifecycle";
import { OfferVerifier } from "../src/lib/offer-verifier";

const prisma = new PrismaClient();
const CATEGORY_NAME = "Caffe & Brunch";
const VERIFY_CONCURRENCY = 4;

type CoastalCafe = {
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

const stores: CoastalCafe[] = [
  {
    name: "Waves Cafe Avoca Beach",
    url: "https://www.wavesavocabeach.com.au/",
    suburb: "Avoca Beach",
    city: "Central Coast",
    state: "NSW",
    address: "181 Avoca Drive, Avoca Beach NSW 2251",
    catalogs: ["https://www.wavesavocabeach.com.au/"],
    description: "Central Coast cafe in Avoca Beach serving coffee, breakfast and lunch daily.",
  },
  {
    name: "The Point Avoca Beach",
    url: "https://www.thepointatavocabeach.com.au/avoca-beach-cafe-restaurant",
    verificationUrl: "https://www.thepointatavocabeach.com.au/",
    suburb: "Avoca Beach",
    city: "Central Coast",
    state: "NSW",
    address: "10 Vine Street, Avoca Beach NSW 2251",
    contact: "02 4382 2760",
    catalogs: ["https://www.thepointatavocabeach.com.au/avoca-beach-cafe-restaurant"],
    description: "Beachfront Central Coast cafe and restaurant serving coffee, breakfast, lunch and coastal dining.",
  },
  {
    name: "Bellyfish Cafe Terrigal",
    url: "https://www.bellyfishcafe.com/",
    suburb: "Terrigal",
    city: "Central Coast",
    state: "NSW",
    address: "Shops 3-4, 112 Terrigal Esplanade, Terrigal NSW 2260",
    contact: "02 4385 6838",
    catalogs: ["https://www.bellyfishcafe.com/"],
    description: "Long-running Terrigal beachside cafe serving Single O coffee, all-day brunch and takeaway.",
  },
  {
    name: "Neighbours Long Jetty",
    url: "https://www.neighbours.net.au/",
    suburb: "Long Jetty",
    city: "Central Coast",
    state: "NSW",
    address: "310A The Entrance Road, Long Jetty NSW 2261",
    contact: "0449 989 819",
    catalogs: ["https://www.neighbours.net.au/"],
    description: "Long Jetty wholefood cafe and yoga studio serving coffee, brunch and nourishing cafe food.",
  },
  {
    name: "Bulli Beach Cafe",
    url: "https://www.bullibeachcafe.com/",
    suburb: "Bulli",
    city: "Wollongong",
    state: "NSW",
    address: "68 Trinity Row, Bulli NSW 2516",
    contact: "02 4284 8808",
    catalogs: ["https://www.bullibeachcafe.com/", "https://www.bullibeachcafe.com/contact"],
    description: "Beachfront Wollongong cafe at Bulli serving breakfast, lunch, dinner, coffee and coastal takeaway.",
  },
  {
    name: "The Scarborough Hotel",
    url: "https://www.thescarboroughhotel.com.au/",
    suburb: "Scarborough",
    city: "Wollongong",
    state: "NSW",
    address: "383 Lawrence Hargrave Drive, Scarborough NSW 2515",
    contact: "02 4267 5444",
    catalogs: ["https://www.thescarboroughhotel.com.au/"],
    description: "Iconic coastal hotel and dining venue in Scarborough with ocean views, cafe-style daytime dining and drinks.",
  },
  {
    name: "Tradies Bistro and Cafe Helensburgh",
    url: "https://www.tradies.com.au/eat-and-drink/the-bistro-cafe",
    suburb: "Helensburgh",
    city: "Wollongong",
    state: "NSW",
    address: "30 Boomerang Street, Helensburgh NSW 2508",
    contact: "02 4294 1122",
    catalogs: ["https://www.tradies.com.au/eat-and-drink/the-bistro-cafe"],
    description: "Helensburgh bistro and cafe venue serving casual meals, coffee, gelato and takeaway.",
  },
  {
    name: "Austi Beach Cafe Austinmer",
    url: "https://austibeach.com.au/",
    suburb: "Austinmer",
    city: "Wollongong",
    state: "NSW",
    address: "104 Lawrence Hargrave Drive, Austinmer NSW 2515",
    contact: "02 4268 5680",
    catalogs: ["https://austibeach.com.au/", "https://austibeach.com.au/trading-hours"],
    description: "Austinmer beachfront cafe serving coffee, breakfast, lunch, dinner and beachside casual meals.",
  },
  {
    name: "Stacks Eatery Kiama Downs",
    url: "https://stackseatery.com.au/",
    suburb: "Kiama Downs",
    city: "Kiama",
    state: "NSW",
    address: "21 Johnson Avenue, Kiama Downs NSW 2533",
    contact: "02 4216 3190",
    catalogs: ["https://stackseatery.com.au/"],
    description: "Kiama Downs coastal dining cafe serving Allpress coffee, brunch, sweets, sandwiches and burgers.",
  },
  {
    name: "Towradgi Beach Hotel",
    url: "https://towradgibeachhotel.com.au/menu/",
    verificationUrl: "https://towradgibeachhotel.com.au/",
    suburb: "Towradgi",
    city: "Wollongong",
    state: "NSW",
    address: "170 Pioneer Road, Towradgi NSW 2518",
    contact: "02 4283 3588",
    catalogs: ["https://towradgibeachhotel.com.au/menu/"],
    description: "Towradgi beachside hotel and bistro with breakfast menu, casual dining and drinks.",
  },
  {
    name: "Connie's Cliff Road Cafe North Wollongong",
    url: "https://www.conniescafewollongong.com/",
    suburb: "North Wollongong",
    city: "Wollongong",
    state: "NSW",
    address: "North Wollongong NSW 2500",
    catalogs: ["https://www.conniescafewollongong.com/"],
    description: "North Wollongong beachside cafe serving coffee, breakfast, lunch and brunch-friendly meals.",
  },
  {
    name: "Aqua Restaurant North Wollongong",
    url: "https://www.aquarestaurant.com.au/",
    suburb: "North Wollongong",
    city: "Wollongong",
    state: "NSW",
    address: "Cliff Road, North Wollongong NSW 2500",
    catalogs: ["https://www.aquarestaurant.com.au/"],
    description: "Casual licensed restaurant and cafe on Cliff Road serving breakfast, lunch and coastal dining.",
  },
  {
    name: "RÜH Cafe Wollongong Central",
    url: "https://www.ruhcafe.com.au/location/ruh-cafe-wollongong-central/",
    verificationUrl: "https://www.ruhcafe.com.au/",
    suburb: "Wollongong",
    city: "Wollongong",
    state: "NSW",
    address: "200 Crown Street, Wollongong NSW 2500",
    catalogs: ["https://www.ruhcafe.com.au/", "https://www.ruhcafe.com.au/location/ruh-cafe-wollongong-central/"],
    description: "RÜH cafe in Wollongong Central serving specialty coffee, fresh food and brunch.",
  },
  {
    name: "RÜH Espresso Bar Fairy Meadow",
    url: "https://www.ruhcafe.com.au/location/ruh-espresso-bar-fairy-meadow/",
    verificationUrl: "https://www.ruhcafe.com.au/",
    suburb: "Fairy Meadow",
    city: "Wollongong",
    state: "NSW",
    address: "Fairy Meadow NSW 2519",
    catalogs: ["https://www.ruhcafe.com.au/", "https://www.ruhcafe.com.au/location/ruh-espresso-bar-fairy-meadow/"],
    description: "Fairy Meadow RÜH espresso bar serving specialty coffee, honest food and cafe meals.",
  },
  {
    name: "Saltie Dog Wollongong",
    url: "https://saltiedog.com.au/#wollongong",
    verificationUrl: "https://saltiedog.com.au/",
    suburb: "Wollongong",
    city: "Wollongong",
    state: "NSW",
    address: "Wollongong Central, Wollongong NSW 2500",
    contact: "0469 829 592",
    catalogs: ["https://saltiedog.com.au/"],
    description: "Wollongong coffee and crepes cafe serving brunch, desserts and freshly roasted coffee.",
  },
  {
    name: "Saints Espresso West Wollongong",
    url: "https://stmarksww.org.au/saints-espresso",
    suburb: "West Wollongong",
    city: "Wollongong",
    state: "NSW",
    address: "West Wollongong NSW 2500",
    contact: "0474 653 491",
    catalogs: ["https://stmarksww.org.au/saints-espresso"],
    description: "West Wollongong community cafe serving quality coffee, toasties and pastries.",
  },
  {
    name: "Figtree Hotel Bistro",
    url: "https://www.figtreehotel.com.au/eat-drink/",
    suburb: "Figtree",
    city: "Wollongong",
    state: "NSW",
    address: "47 Princes Highway, Figtree NSW 2525",
    contact: "02 4228 4088",
    catalogs: ["https://www.figtreehotel.com.au/eat-drink/"],
    description: "Figtree hotel bistro serving casual lunch and dinner with pizza, salads, schnitzels and burgers.",
  },
  {
    name: "Greenhouse on Flora Sutherland",
    url: "https://www.greenhouseonflora.com.au/",
    suburb: "Sutherland",
    city: "Sydney",
    state: "NSW",
    address: "Shop 1, 41-47 Eton Street, Sutherland NSW 2232",
    contact: "02 8544 8330",
    catalogs: ["https://www.greenhouseonflora.com.au/"],
    description: "Sutherland cafe serving coffee, globally inspired brunch, lunch and desserts.",
  },
  {
    name: "Left Bower Sutherland",
    url: "https://leftbower.com.au/",
    suburb: "Sutherland",
    city: "Sydney",
    state: "NSW",
    address: "Shop 3, 45 Adelong Street, Sutherland NSW 2232",
    catalogs: ["https://leftbower.com.au/"],
    description: "Sutherland cafe serving modern Australian breakfast, brunch, dinner classics, cakes and coffee.",
  },
  {
    name: "Car Hole Cafe Sutherland",
    url: "https://carholecafe.com.au/",
    suburb: "Sutherland",
    city: "Sydney",
    state: "NSW",
    address: "5 Eton Street, Sutherland NSW 2232",
    contact: "0434 473 907",
    catalogs: ["https://carholecafe.com.au/"],
    description: "Sutherland breakfast and brunch cafe serving coffee, juices, smoothies, burgers and snacks.",
  },
  {
    name: "The Spot Cafe Kiama",
    url: "https://thespotkiama.com/",
    suburb: "Kiama",
    city: "Kiama",
    state: "NSW",
    address: "Shop 10, 143 Terralong Street, Kiama NSW 2533",
    catalogs: ["https://thespotkiama.com/"],
    description: "Kiama cafe serving all-day breakfast, coffee and casual brunch.",
  },
  {
    name: "The Hungry Monkey Kiama",
    url: "https://www.thehungrymonkey.com.au/kiama-cafe",
    verificationUrl: "https://www.thehungrymonkey.com.au/",
    suburb: "Kiama",
    city: "Kiama",
    state: "NSW",
    address: "5/32 Collins Street, Kiama NSW 2533",
    contact: "1300 666 539",
    catalogs: ["https://www.thehungrymonkey.com.au/", "https://www.thehungrymonkey.com.au/kiama-cafe"],
    description: "Popular Kiama cafe serving breakfast, coffee, burgers and locally sourced meals.",
  },
  {
    name: "The Hungry Monkey Berry",
    url: "https://www.thehungrymonkey.com.au/berry-landing",
    verificationUrl: "https://www.thehungrymonkey.com.au/",
    suburb: "Berry",
    city: "Shoalhaven",
    state: "NSW",
    address: "Berry NSW 2535",
    contact: "1300 666 539",
    catalogs: ["https://www.thehungrymonkey.com.au/", "https://www.thehungrymonkey.com.au/berry-landing"],
    description: "Hungry Monkey's Berry cafe serving specialty coffee, brunch and South Coast cafe food.",
  },
  {
    name: "iv Coffee Berry",
    url: "https://ivcoffee.com.au/",
    suburb: "Berry",
    city: "Shoalhaven",
    state: "NSW",
    address: "117 Queen Street, Berry NSW 2535",
    catalogs: ["https://ivcoffee.com.au/"],
    description: "Highly rated Berry specialty coffee bar serving Paradox coffee and daily cafe treats.",
  },
  {
    name: "The Garden Berry",
    url: "https://www.thegardenberry.com.au/",
    suburb: "Berry",
    city: "Shoalhaven",
    state: "NSW",
    address: "103 Queen Street, Berry NSW 2535",
    contact: "02 4464 1920",
    catalogs: ["https://www.thegardenberry.com.au/"],
    description: "Berry cafe, restaurant and bar serving breakfast, lunch, coffee, cakes and courtyard dining.",
  },
  {
    name: "Milkwood Bakery Berry",
    url: "https://milkwoodbakery.com.au/",
    suburb: "Berry",
    city: "Shoalhaven",
    state: "NSW",
    address: "109 Queen Street, Berry NSW 2535",
    contact: "02 4464 3033",
    catalogs: ["https://milkwoodbakery.com.au/"],
    description: "Berry bakery cafe offering sourdough, pastries, cakes, savouries, coffee, tea and hot chocolate.",
  },
  {
    name: "The Berry Patch",
    url: "https://theberrypatch.com.au/",
    suburb: "Berry",
    city: "Shoalhaven",
    state: "NSW",
    address: "Berry NSW 2535",
    catalogs: ["https://theberrypatch.com.au/"],
    description: "Berry cafe, events and farm shop serving breakfast, lunch, brunch and seasonal cafe food.",
  },
  {
    name: "Native Cafe Kiama",
    url: "https://www.nativecafe.com.au/#kiama",
    verificationUrl: "https://www.nativecafe.com.au/",
    suburb: "Kiama",
    city: "Kiama",
    state: "NSW",
    address: "58 Terralong Street, Kiama NSW 2533",
    contact: "02 4232 4421",
    catalogs: ["https://www.nativecafe.com.au/"],
    description: "South Coast wholefoods cafe in Kiama serving coffee, fresh meals, cakes and slices.",
  },
  {
    name: "Native Cafe Ulladulla",
    url: "https://www.nativecafe.com.au/#ulladulla",
    verificationUrl: "https://www.nativecafe.com.au/",
    suburb: "Ulladulla",
    city: "Shoalhaven",
    state: "NSW",
    address: "Shop 2, 84 Princes Highway, Ulladulla NSW 2539",
    contact: "02 4455 4789",
    catalogs: ["https://www.nativecafe.com.au/"],
    description: "Ulladulla harbour cafe serving wholefoods, specialty coffee and healthy breakfast and lunch.",
  },
  {
    name: "Darling House Huskisson",
    url: "https://darlinghouse.au/",
    suburb: "Huskisson",
    city: "Shoalhaven",
    state: "NSW",
    address: "Shop 5-6, 57 Owen Street, Huskisson NSW 2540",
    contact: "0493 206 409",
    catalogs: ["https://darlinghouse.au/"],
    description: "Huskisson deli-style cafe and wine bar serving sandwiches, brunchy food, coffee and wraps.",
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

async function verifyAndSaveStore(store: CoastalCafe, categoryId: number, ownerId: number) {
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
    throw new Error("No user found to own seeded coastal cafe stores.");
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

  console.log(`Seeded ${savedStores} coastal cafe and brunch stores. Verified offers: ${verifiedOffers}.`);
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
