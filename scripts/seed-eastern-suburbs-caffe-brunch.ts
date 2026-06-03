import { PrismaClient } from "@prisma/client";
import { updateCatalogUrlHealth } from "../src/lib/catalog-health";
import { getLiveVerifiedOfferEndDate } from "../src/lib/offer-lifecycle";
import { OfferVerifier } from "../src/lib/offer-verifier";

const prisma = new PrismaClient();
const CATEGORY_NAME = "Caffe & Brunch";
const VERIFY_CONCURRENCY = 4;

type EasternCafe = {
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

const stores: EasternCafe[] = [
  {
    name: "Speedos Cafe North Bondi",
    url: "https://speedoscafe.com.au/",
    suburb: "North Bondi",
    city: "Sydney",
    state: "NSW",
    address: "126 Ramsgate Avenue, North Bondi NSW 2026",
    catalogs: ["https://speedoscafe.com.au/"],
    description: "North Bondi beachside brunch cafe serving colourful breakfast, lunch, coffee and happy hour.",
  },
  {
    name: "The Nine Bondi Beach",
    url: "https://theninesydney.com.au/",
    suburb: "Bondi Beach",
    city: "Sydney",
    state: "NSW",
    address: "163 Glenayr Avenue, Bondi Beach NSW 2026",
    catalogs: ["https://theninesydney.com.au/"],
    description: "Bondi Beach Mediterranean cafe serving all-day breakfast, brunch, lunch and coffee.",
  },
  {
    name: "Porch and Parlour Bondi Beach",
    url: "https://www.qthotels.com/bondi-beach/things-to-do/porch-parlour/",
    suburb: "Bondi Beach",
    city: "Sydney",
    state: "NSW",
    address: "110 Ramsgate Avenue, Bondi Beach NSW 2026",
    catalogs: ["https://www.qthotels.com/bondi-beach/things-to-do/porch-parlour/"],
    description: "Bondi Beach cafe known for coffee, beachside breakfast and brunch.",
  },
  {
    name: "Bills Bondi Beach",
    url: "https://www.bills.com.au/locations/bondi",
    suburb: "Bondi Beach",
    city: "Sydney",
    state: "NSW",
    address: "79 Hall Street, Bondi Beach NSW 2026",
    contact: "+61 2 8412 0700",
    catalogs: ["https://www.bills.com.au/locations/bondi"],
    description: "Iconic Bondi all-day dining and brunch venue.",
  },
  {
    name: "Harrys Bondi",
    url: "https://harrysbondi.com.au/",
    suburb: "Bondi Beach",
    city: "Sydney",
    state: "NSW",
    address: "136 Wairoa Avenue, Bondi Beach NSW 2026",
    catalogs: ["https://harrysbondi.com.au/"],
    description: "Bondi cafe serving breakfast, brunch, lunch and specialty coffee.",
    ignoredOfferUrlPatterns: [/special-offers/i],
  },
  {
    name: "Shuk Bondi",
    url: "https://www.shuk.com.au/",
    suburb: "Bondi",
    city: "Sydney",
    state: "NSW",
    address: "2 Mitchell Street, North Bondi NSW 2026",
    catalogs: ["https://www.shuk.com.au/"],
    description: "Bondi neighbourhood cafe and bakery serving Israeli-influenced brunch, coffee and pastries.",
  },
  {
    name: "Lox Stock and Barrel Bondi",
    url: "https://www.loxstockandbarrel.com.au/",
    suburb: "Bondi Beach",
    city: "Sydney",
    state: "NSW",
    address: "140 Glenayr Avenue, Bondi Beach NSW 2026",
    catalogs: ["https://www.loxstockandbarrel.com.au/"],
    description: "Bondi deli diner and cafe serving brunch, bagels, coffee and baked goods.",
  },
  {
    name: "Bondi Wholefoods Bondi Beach",
    url: "https://www.bondiwholefoods.com.au/",
    suburb: "Bondi Beach",
    city: "Sydney",
    state: "NSW",
    address: "1/30A Hastings Parade, North Bondi NSW 2026",
    catalogs: ["https://www.bondiwholefoods.com.au/"],
    description: "Bondi health-focused cafe serving wholefood breakfast, brunch, smoothies and coffee.",
  },
  {
    name: "Leaf Cafe Bondi Junction",
    url: "https://www.leafcafe.com.au/our-stores-menus/bondi-junction/",
    suburb: "Bondi Junction",
    city: "Sydney",
    state: "NSW",
    address: "Shop G02, 28-42 Bronte Road, Bondi Junction NSW 2022",
    contact: "(02) 8201 3136",
    catalogs: ["https://www.leafcafe.com.au/our-stores-menus/bondi-junction/"],
    description: "Bondi Junction cafe serving brunch, dinner, coffee and casual dining.",
  },
  {
    name: "Three Blue Ducks Bronte",
    url: "https://www.threeblueducks.com/bronte",
    suburb: "Bronte",
    city: "Sydney",
    state: "NSW",
    address: "141-143 Macpherson Street, Bronte NSW 2024",
    catalogs: ["https://www.threeblueducks.com/bronte"],
    description: "Bronte cafe and restaurant serving breakfast, lunch, coffee and seasonal produce-led food.",
  },
  {
    name: "Iggy's Bread Bronte",
    url: "https://iggysbread.com/",
    suburb: "Bronte",
    city: "Sydney",
    state: "NSW",
    address: "145d Macpherson Street, Bronte NSW 2024",
    catalogs: ["https://iggysbread.com/"],
    description: "Bronte bakery serving sourdough, pastries, coffee and baked goods.",
  },
  {
    name: "Clodeli Randwick",
    url: "https://www.clodeli.com/",
    suburb: "Randwick",
    city: "Sydney",
    state: "NSW",
    address: "Shop 1, 210 Clovelly Road, Randwick NSW 2031",
    contact: "0466 215 504",
    catalogs: ["https://www.clodeli.com/"],
    description: "Randwick/Clovelly cafe serving breakfast, lunch, coffee and baked goods.",
  },
  {
    name: "22 Grams Randwick",
    url: "https://www.22grams.com/",
    suburb: "Randwick",
    city: "Sydney",
    state: "NSW",
    address: "166-168 Belmore Road, Randwick NSW 2031",
    contact: "info@22grams.net",
    catalogs: ["https://www.22grams.com/", "https://www.22grams.com/menu"],
    description: "Highly rated Randwick artisan roastery, bakery and cafe serving brunch, coffee, pastries and baked goods.",
  },
  {
    name: "Eggshellent Cafe Randwick",
    url: "https://order-direct.com.au/eggshellent/",
    suburb: "Randwick",
    city: "Sydney",
    state: "NSW",
    address: "Randwick NSW 2031",
    catalogs: ["https://order-direct.com.au/eggshellent/"],
    description: "Highly rated Randwick cafe and brunch spot with an official order-direct menu page.",
    ignoredOfferUrlPatterns: [/order-direct\.com\.au\/special-offers/i],
  },
  {
    name: "A Man and His Monkey Randwick",
    url: "https://www.amanandhismonkey.com.au/",
    suburb: "Randwick",
    city: "Sydney",
    state: "NSW",
    address: "149 Clovelly Road, Randwick NSW 2031",
    catalogs: ["https://www.amanandhismonkey.com.au/"],
    description: "Randwick cafe between Queens Park and Clovelly serving brunch, coffee and lunch.",
  },
  {
    name: "Tucker Randwick",
    url: "https://tucker.localoria.com/",
    suburb: "Randwick",
    city: "Sydney",
    state: "NSW",
    address: "Randwick NSW 2031",
    catalogs: ["https://tucker.localoria.com/"],
    description: "Randwick cafe on Clovelly Road serving breakfast, coffee and brunch.",
  },
  {
    name: "Bake Bar Randwick",
    url: "https://www.bakebar.com.au/#randwick",
    verificationUrl: "https://www.bakebar.com.au/",
    suburb: "Randwick",
    city: "Sydney",
    state: "NSW",
    address: "67 Frenchmans Road, Randwick NSW 2031",
    catalogs: ["https://www.bakebar.com.au/"],
    description: "Randwick artisan bakery and cafe serving breakfast, brunch, lunch and sourdough.",
    ignoredOfferUrlPatterns: [/special-offers/i],
  },
  {
    name: "Coogee Courtyard",
    url: "https://www.coogeecourtyard.com.au/",
    suburb: "Coogee",
    city: "Sydney",
    state: "NSW",
    address: "Coogee NSW 2034",
    catalogs: ["https://www.coogeecourtyard.com.au/"],
    description: "Coogee cafe and courtyard venue serving coffee, breakfast and casual dining.",
  },
  {
    name: "Barzura Coogee",
    url: "https://barzura.com.au/",
    suburb: "Coogee",
    city: "Sydney",
    state: "NSW",
    address: "62 Carr Street, Coogee NSW 2034",
    catalogs: ["https://barzura.com.au/"],
    description: "Coogee beachside cafe and restaurant serving breakfast, lunch, coffee and casual meals.",
  },
  {
    name: "Little Jack Horner Coogee",
    url: "https://littlejackhorner.com.au/",
    suburb: "Coogee",
    city: "Sydney",
    state: "NSW",
    address: "270-274 Coogee Bay Road, Coogee NSW 2034",
    catalogs: ["https://littlejackhorner.com.au/"],
    description: "Coogee cafe and bar serving breakfast, brunch, coffee and beachside casual dining.",
    ignoredOfferUrlPatterns: [/whats-on-at-jacks/i, /functions/i, /event/i],
  },
  {
    name: "Indigo Double Bay",
    url: "https://www.indigodoublebay.com/",
    suburb: "Double Bay",
    city: "Sydney",
    state: "NSW",
    address: "15 Cross Street, Double Bay NSW 2028",
    catalogs: ["https://www.indigodoublebay.com/"],
    description: "Double Bay modern Australian cafe serving breakfast, brunch, lunch and coffee.",
  },
  {
    name: "Cafe Arno Double Bay",
    url: "https://www.cafearno.com.au/",
    suburb: "Double Bay",
    city: "Sydney",
    state: "NSW",
    address: "Double Bay NSW 2028",
    catalogs: ["https://www.cafearno.com.au/"],
    description: "Double Bay cafe serving coffee, breakfast, brunch and casual meals.",
  },
  {
    name: "Redleaf Cafe Double Bay",
    url: "https://www.theredleafcafe.com.au/",
    suburb: "Double Bay",
    city: "Sydney",
    state: "NSW",
    address: "Murray Rose Pool, Double Bay NSW 2028",
    catalogs: ["https://www.theredleafcafe.com.au/"],
    description: "Harbourside Double Bay cafe overlooking Murray Rose Pool with breakfast, lunch and coffee.",
  },
  {
    name: "Bake Bar Double Bay",
    url: "https://www.bakebar.com.au/#double-bay",
    verificationUrl: "https://www.bakebar.com.au/",
    suburb: "Double Bay",
    city: "Sydney",
    state: "NSW",
    address: "Double Bay NSW 2028",
    catalogs: ["https://www.bakebar.com.au/"],
    description: "Double Bay artisan bakery and cafe serving breakfast, brunch, lunch and sourdough.",
    ignoredOfferUrlPatterns: [/special-offers/i],
  },
  {
    name: "Bake Bar Rose Bay",
    url: "https://www.bakebar.com.au/#rose-bay",
    verificationUrl: "https://www.bakebar.com.au/",
    suburb: "Rose Bay",
    city: "Sydney",
    state: "NSW",
    address: "Rose Bay NSW 2029",
    catalogs: ["https://www.bakebar.com.au/"],
    description: "Rose Bay artisan bakery and cafe serving breakfast, brunch, lunch and sourdough.",
    ignoredOfferUrlPatterns: [/special-offers/i],
  },
  {
    name: "Jewel on the Bay Rose Bay",
    url: "https://jewelonthebay.com.au/",
    suburb: "Rose Bay",
    city: "Sydney",
    state: "NSW",
    address: "639 New South Head Road, Rose Bay NSW 2029",
    catalogs: ["https://jewelonthebay.com.au/"],
    description: "Rose Bay cafe and restaurant serving breakfast, brunch, coffee and casual dining.",
  },
  {
    name: "Nielsen Park Cafe Vaucluse",
    url: "https://nielsenparkcafe.com.au/",
    suburb: "Vaucluse",
    city: "Sydney",
    state: "NSW",
    address: "Nielsen Park, Vaucluse NSW 2030",
    catalogs: ["https://nielsenparkcafe.com.au/"],
    description: "Vaucluse park cafe serving breakfast, lunch, coffee and beachside dining.",
  },
  {
    name: "Grumpy Baker Vaucluse",
    url: "https://www.grumpybaker.com.au/",
    suburb: "Vaucluse",
    city: "Sydney",
    state: "NSW",
    address: "Vaucluse NSW 2030",
    catalogs: ["https://www.grumpybaker.com.au/"],
    description: "Eastern Suburbs bakery cafe serving coffee, pastries, bread and cafe meals.",
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

async function closeDuplicateUrl(url: string, keepStoreId: number) {
  const duplicate = await prisma.store.findUnique({ where: { url }, select: { id: true } });
  if (!duplicate || duplicate.id === keepStoreId) {
    return;
  }

  await prisma.discount.deleteMany({ where: { storeId: duplicate.id } });
  await prisma.store.update({
    where: { id: duplicate.id },
    data: {
      locationSource: "closed",
      description: "Closed duplicate superseded by official Eastern Suburbs cafe listing.",
    },
  });
}

async function verifyAndSaveStore(store: EasternCafe, categoryId: number, ownerId: number) {
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

  if (store.name === "Leaf Cafe Bondi Junction") {
    await closeDuplicateUrl("https://leafcafe.com.au/pages/bondi-junction", savedStore.id);
  }

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
    throw new Error("No user found to own seeded Eastern Suburbs cafe stores.");
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

  console.log(`Seeded ${savedStores} Eastern Suburbs cafe and brunch stores. Verified offers: ${verifiedOffers}.`);
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
