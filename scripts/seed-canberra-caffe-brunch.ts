import { PrismaClient } from "@prisma/client";
import { updateCatalogUrlHealth } from "../src/lib/catalog-health";
import { getLiveVerifiedOfferEndDate } from "../src/lib/offer-lifecycle";
import { OfferVerifier } from "../src/lib/offer-verifier";

const prisma = new PrismaClient();
const CATEGORY_NAME = "Caffe & Brunch";
const VERIFY_CONCURRENCY = 4;

type CanberraCafe = {
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

const stores: CanberraCafe[] = [
  {
    name: "The Cupping Room Canberra",
    url: "https://thecuppingroom.com.au/",
    suburb: "Canberra City",
    city: "Canberra",
    state: "ACT",
    address: "1/1-13 University Avenue, Canberra ACT 2601",
    catalogs: ["https://thecuppingroom.com.au/"],
    description: "Canberra city brunch cafe and ONA coffee venue serving breakfast, lunch and takeaway coffee.",
  },
  {
    name: "Gather Cafe Braddon",
    url: "https://www.cafegather.com.au/",
    suburb: "Braddon",
    city: "Canberra",
    state: "ACT",
    address: "Braddon ACT 2612",
    catalogs: ["https://www.cafegather.com.au/"],
    description: "Braddon cafe serving seasonal breakfast, brunch, coffee and casual dining.",
  },
  {
    name: "Sweet Bones Braddon",
    url: "https://sweetbonescompany.com/",
    suburb: "Braddon",
    city: "Canberra",
    state: "ACT",
    address: "Braddon ACT 2612",
    catalogs: ["https://sweetbonescompany.com/"],
    description: "Plant-based Braddon cafe and bakery with brunch, coffee and sweets.",
  },
  {
    name: "Uptown Vibes Braddon",
    url: "https://www.uptownvibes.com.au/",
    suburb: "Braddon",
    city: "Canberra",
    state: "ACT",
    address: "Braddon ACT 2612",
    catalogs: ["https://www.uptownvibes.com.au/"],
    description: "Braddon dining spot with weekend brunch, coffee and relaxed meals.",
  },
  {
    name: "Highroad Dickson",
    url: "https://www.highroad.com.au/",
    suburb: "Dickson",
    city: "Canberra",
    state: "ACT",
    address: "1 Woolley Street, Dickson ACT 2602",
    catalogs: ["https://www.highroad.com.au/"],
    description: "Dickson cafe from the ONA family serving brunch, coffee and casual dining.",
  },
  {
    name: "Trevs at Dickson",
    url: "https://www.trevsatdickson.com.au/",
    suburb: "Dickson",
    city: "Canberra",
    state: "ACT",
    address: "20 Challis Street, Dickson ACT 2602",
    contact: "0406 369 224",
    catalogs: ["https://www.trevsatdickson.com.au/"],
    description: "Licensed Canberra cafe and restaurant in Dickson serving breakfast, lunch, dinner and coffee.",
  },
  {
    name: "Cafe Stepping Stone Dickson",
    url: "https://www.cafesteppingstone.com/dickson",
    verificationUrl: "https://www.cafesteppingstone.com/dickson",
    suburb: "Dickson",
    city: "Canberra",
    state: "ACT",
    address: "8 Hawdon Place, Dickson ACT 2602",
    catalogs: ["https://www.cafesteppingstone.com/dickson"],
    description: "Vegetarian social-enterprise cafe in Dickson serving seasonal brunch, coffee and desserts.",
    ignoredOfferUrlPatterns: [/events/i],
  },
  {
    name: "Rosemary by EightyTwenty Kingston",
    url: "https://www.eightytwentyfood.com.au/kingston-cafe",
    suburb: "Kingston",
    city: "Canberra",
    state: "ACT",
    address: "9/15 Tench Street, Kingston ACT 2604",
    contact: "0461 507 674",
    catalogs: ["https://www.eightytwentyfood.com.au/kingston-cafe"],
    description: "Kingston cafe by EightyTwenty serving brunch, coffee and fresh cafe meals.",
  },
  {
    name: "Silo Bakery Kingston",
    url: "https://silobakery.com.au/",
    suburb: "Kingston",
    city: "Canberra",
    state: "ACT",
    address: "36 Giles Street, Kingston ACT 2604",
    contact: "(02) 6260 6060",
    catalogs: ["https://silobakery.com.au/"],
    description: "Kingston bakery and cafe serving all-day menu items, pastries, breakfast and lunch.",
  },
  {
    name: "Local Press Cafe Kingston",
    url: "https://localpresscafe.com.au/",
    suburb: "Kingston",
    city: "Canberra",
    state: "ACT",
    address: "35 Eastlake Parade, Kingston ACT 2604",
    contact: "(02) 6162 1422",
    catalogs: ["https://localpresscafe.com.au/"],
    description: "Kingston Foreshore wholefoods cafe serving breakfast, lunch, coffee and cold-pressed juices.",
  },
  {
    name: "Penny University Cafe Kingston",
    url: "https://www.pennyscbr.com.au/",
    suburb: "Kingston",
    city: "Canberra",
    state: "ACT",
    address: "15 Kennedy Street, Kingston ACT 2604",
    contact: "(02) 6162 1500",
    catalogs: ["https://www.pennyscbr.com.au/"],
    description: "Old Kingston Shops cafe serving all-day brunch, coffee and relaxed dining.",
  },
  {
    name: "Rowa Cafe Belconnen",
    url: "https://rowacafe.com.au/",
    suburb: "Belconnen",
    city: "Canberra",
    state: "ACT",
    address: "Westfield Belconnen, Belconnen ACT 2617",
    catalogs: ["https://rowacafe.com.au/"],
    description: "Belconnen brunch cafe serving bowls, brunch favourites and specialty coffee.",
  },
  {
    name: "Forrest Specialty Coffee Belconnen",
    url: "https://www.forrestspecialtycoffee.com.au/",
    suburb: "Belconnen",
    city: "Canberra",
    state: "ACT",
    address: "Shop 95, Westfield Belconnen, 18 Benjamin Way, Belconnen ACT 2617",
    contact: "0451 985 761",
    catalogs: ["https://www.forrestspecialtycoffee.com.au/"],
    description: "Belconnen specialty coffee and brunch cafe serving ONA coffee, breakfast and lunch.",
  },
  {
    name: "Cafe Momo Bruce",
    url: "https://www.cafemomo.com.au/",
    suburb: "Bruce",
    city: "Canberra",
    state: "ACT",
    address: "Bruce ACT 2617",
    catalogs: ["https://www.cafemomo.com.au/"],
    description: "Bruce cafe serving breakfast, brunch, coffee and casual meals.",
  },
  {
    name: "Cafe MAME Melba",
    url: "https://www.cafemame.com.au/",
    verificationUrl: "https://www.cafemame.com.au/find-us",
    suburb: "Melba",
    city: "Canberra",
    state: "ACT",
    address: "Shop 2, 4 Melba Court, Melba ACT 2615",
    catalogs: ["https://www.cafemame.com.au/find-us"],
    description: "Melba neighbourhood cafe serving breakfast, lunch and coffee.",
  },
  {
    name: "Gang Gang Cafe Downer",
    url: "https://ganggangcafe.com.au/",
    suburb: "Downer",
    city: "Canberra",
    state: "ACT",
    address: "Shop 4, 2 Frencham Place, Downer ACT 2602",
    contact: "0422 130 625",
    catalogs: ["https://ganggangcafe.com.au/"],
    description: "Downer cafe, bar and music venue serving coffee, daytime food and evening meals.",
    ignoredOfferUrlPatterns: [/event/i, /calendar/i, /gig/i],
  },
  {
    name: "Redbrick Coffee City Canberra",
    url: "https://redbrickcoffee.shop/",
    suburb: "Canberra City",
    city: "Canberra",
    state: "ACT",
    address: "1 Constitution Avenue, Canberra ACT 2600",
    catalogs: ["https://redbrickcoffee.shop/"],
    description: "Canberra city specialty coffee shop by Redbrick with a local produce-focused food menu.",
  },
  {
    name: "Redbrick Roastery Fyshwick",
    url: "https://redbrick.coffee/pages/about#fyshwick",
    verificationUrl: "https://redbrick.coffee/pages/about",
    suburb: "Fyshwick",
    city: "Canberra",
    state: "ACT",
    address: "6/161 Newcastle Street, Fyshwick ACT 2609",
    catalogs: ["https://redbrick.coffee/pages/about"],
    description: "Fyshwick coffee roastery and cafe from Redbrick.",
    ignoredOfferUrlPatterns: [/pages\/about/i],
  },
  {
    name: "ONA Coffee House Fyshwick",
    url: "https://www.onacoffeehouse.com.au/",
    suburb: "Fyshwick",
    city: "Canberra",
    state: "ACT",
    address: "68 Wollongong Street, Fyshwick ACT 2609",
    catalogs: ["https://www.onacoffeehouse.com.au/"],
    description: "Fyshwick specialty coffee house and cafe from ONA Coffee.",
    ignoredOfferUrlPatterns: [/barista-class/i, /events/i, /whats-on/i],
  },
  {
    name: "Mocan and Green Grout NewActon",
    url: "https://mocanandgreengrout.com/",
    suburb: "NewActon",
    city: "Canberra",
    state: "ACT",
    address: "1/19 Marcus Clarke Street, NewActon ACT 2601",
    contact: "02 6162 2909",
    catalogs: ["https://mocanandgreengrout.com/"],
    description: "NewActon ethical cafe serving breakfast, lunch, dinner, coffee and seasonal Canberra produce.",
  },
  {
    name: "Pollen Cafe Canberra",
    url: "https://www.pollencafe.com.au/",
    suburb: "Acton",
    city: "Canberra",
    state: "ACT",
    address: "Australian National Botanic Gardens, Clunies Ross Street, Acton ACT 2601",
    catalogs: ["https://www.pollencafe.com.au/"],
    description: "Cafe at the Australian National Botanic Gardens serving breakfast, lunch and coffee.",
  },
  {
    name: "EQ Cafe and Bakehouse Deakin",
    url: "https://eqcafe.com.au/",
    suburb: "Deakin",
    city: "Canberra",
    state: "ACT",
    address: "70 Kent Street, Deakin ACT 2600",
    catalogs: ["https://eqcafe.com.au/"],
    description: "Canberra cafe and bakehouse serving coffee, breakfast, lunch, cakes and catering.",
  },
  {
    name: "Patissez Cafe Griffith",
    url: "https://patissez.com/contact/",
    suburb: "Griffith",
    city: "Canberra",
    state: "ACT",
    address: "2/21 Bougainville Street, Griffith ACT 2603",
    contact: "0402 808 191",
    catalogs: ["https://patissez.com/contact/"],
    description: "Manuka-area cafe known for breakfast, lunch, desserts and shakes.",
  },
  {
    name: "Two Before Ten Aranda",
    url: "https://www.twobeforeten.com.au/header-menu/shop/#aranda",
    verificationUrl: "https://www.twobeforeten.com.au/header-menu/shop/",
    suburb: "Aranda",
    city: "Canberra",
    state: "ACT",
    address: "Aranda Shops, 68 Bandjalong Crescent, Aranda ACT 2614",
    catalogs: ["https://www.twobeforeten.com.au/header-menu/shop/"],
    description: "Two Before Ten cafe, roastery and local produce kitchen location in Aranda.",
  },
  {
    name: "Cafe Stepping Stone Strathnairn",
    url: "https://www.cafesteppingstone.com/",
    suburb: "Strathnairn",
    city: "Canberra",
    state: "ACT",
    address: "Strathnairn Arts, 90 Stockdill Drive, Holt ACT 2615",
    catalogs: ["https://www.cafesteppingstone.com/"],
    description: "Vegetarian social-enterprise cafe at Strathnairn Arts serving seasonal brunch, coffee and desserts.",
    ignoredOfferUrlPatterns: [/events/i],
  },
  {
    name: "Bookplate Cafe Canberra",
    url: "https://www.library.gov.au/visit/cafes/about-bookplate-cafe",
    suburb: "Parkes",
    city: "Canberra",
    state: "ACT",
    address: "National Library of Australia, Parkes Place, Parkes ACT 2600",
    contact: "(02) 6262 1154",
    catalogs: ["https://www.library.gov.au/visit/cafes/about-bookplate-cafe"],
    description: "National Library of Australia cafe serving breakfast, brunch, lunch and tea in Canberra's Parliamentary Triangle.",
    ignoredOfferUrlPatterns: [/events/i, /catering/i],
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

async function verifyAndSaveStore(store: CanberraCafe, categoryId: number, ownerId: number) {
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

    await prisma.discount.deleteMany({
      where: {
        storeId: savedStore.id,
        title: { not: offer.title },
        description: { startsWith: "Offer wording found on the store website" },
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
    throw new Error("No user found to own seeded Canberra cafe stores.");
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

  console.log(`Seeded ${savedStores} Canberra cafe and brunch stores. Verified offers: ${verifiedOffers}.`);
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
