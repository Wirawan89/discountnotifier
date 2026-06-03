import { PrismaClient } from "@prisma/client";
import { updateCatalogUrlHealth } from "../src/lib/catalog-health";
import { getLiveVerifiedOfferEndDate } from "../src/lib/offer-lifecycle";
import { OfferVerifier } from "../src/lib/offer-verifier";

const prisma = new PrismaClient();
const CATEGORY_NAME = "Caffe & Brunch";
const VERIFY_CONCURRENCY = 4;

type HighlandsCafe = {
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

const stores: HighlandsCafe[] = [
  {
    name: "Raw & Wild Market and Cafe Bowral",
    url: "https://rawwild.com.au/",
    suburb: "Bowral",
    city: "Southern Highlands",
    state: "NSW",
    address: "250 Bong Bong Street, Bowral NSW 2576",
    contact: "02 4851 5155",
    catalogs: ["https://rawwild.com.au/", "https://rawwild.com.au/wholefood-cafe-bowral/"],
    description: "Bowral organic market and wholefood cafe serving breakfast, lunch, coffee and seasonal local produce.",
  },
  {
    name: "Kaffeine Bowral",
    url: "https://www.kaffeinebowral.com.au/",
    suburb: "Bowral",
    city: "Southern Highlands",
    state: "NSW",
    address: "Bowral NSW 2576",
    catalogs: ["https://www.kaffeinebowral.com.au/"],
    description: "Bowral cafe focused on fresh breakfast, lunch, coffee and catering.",
  },
  {
    name: "Plantation Cafe Bowral",
    url: "https://greenlanebowral.com/plantation-cafe-bowral/",
    suburb: "Bowral",
    city: "Southern Highlands",
    state: "NSW",
    address: "21 Banyette Street, Bowral NSW 2576",
    catalogs: ["https://greenlanebowral.com/plantation-cafe-bowral/"],
    description: "Plant-filled Bowral cafe in Green Lane serving coffee, breakfasts, cakes and an all-day menu.",
  },
  {
    name: "The Press Shop Bowral",
    url: "https://www.thepressshopbowral.au/story",
    suburb: "Bowral",
    city: "Southern Highlands",
    state: "NSW",
    address: "Shop 5, 391-397 Bong Bong Street, Bowral NSW 2576",
    contact: "(02) 4879 9244",
    catalogs: ["https://www.thepressshopbowral.au/story"],
    description: "Highly regarded Bowral cafe serving specialty coffee, breakfast and seasonal cafe food.",
  },
  {
    name: "Rush Roasting Bowral",
    url: "https://rushroasting.com.au/",
    suburb: "Bowral",
    city: "Southern Highlands",
    state: "NSW",
    address: "Bowral NSW 2576",
    catalogs: ["https://rushroasting.com.au/"],
    description: "Southern Highlands coffee roaster and Bowral cafe serving coffee and cafe food.",
  },
  {
    name: "Coffee Culture Bowral",
    url: "https://coffeeculture.au/#bowral",
    verificationUrl: "https://coffeeculture.au/",
    suburb: "Bowral",
    city: "Southern Highlands",
    state: "NSW",
    address: "Empire Cinema Complex, Bong Bong Street, Bowral NSW 2576",
    contact: "02 4862 2400",
    catalogs: ["https://coffeeculture.au/"],
    description: "Long-running Southern Highlands cafe and coffee roaster location in Bowral.",
  },
  {
    name: "Gumnut Patisserie Bowral",
    url: "https://gumnutpatisserie.com.au/site/locations#bowral",
    verificationUrl: "https://gumnutpatisserie.com.au/site/locations",
    suburb: "Bowral",
    city: "Southern Highlands",
    state: "NSW",
    address: "Shop 7, Grand Arcade, Bong Bong Street, Bowral NSW 2576",
    contact: "02 4862 2819",
    catalogs: ["https://gumnutpatisserie.com.au/site/locations"],
    description: "Award-winning Southern Highlands patisserie and cafe location in Bowral.",
  },
  {
    name: "Bistro Sociale Bowral",
    url: "https://www.bistrosociale.com.au/index.html",
    suburb: "Bowral",
    city: "Southern Highlands",
    state: "NSW",
    address: "6 David Street, Bowral NSW 2576",
    catalogs: ["https://www.bistrosociale.com.au/index.html"],
    description: "Bowral restaurant and terrace venue with brunch-friendly dining in the Southern Highlands.",
  },
  {
    name: "The Shaggy Cow Mittagong",
    url: "http://www.theshaggycow.com.au/",
    suburb: "Mittagong",
    city: "Southern Highlands",
    state: "NSW",
    address: "112 Main Street, Mittagong NSW 2575",
    contact: "02 4872 2966",
    catalogs: ["http://www.theshaggycow.com.au/"],
    description: "Award-winning modern country cafe in Mittagong serving breakfast, lunch and coffee.",
  },
  {
    name: "Coffee Culture Mittagong",
    url: "https://coffeeculture.au/#mittagong",
    verificationUrl: "https://coffeeculture.au/",
    suburb: "Mittagong",
    city: "Southern Highlands",
    state: "NSW",
    address: "Shop 1, 118 Main Street, Mittagong NSW 2575",
    contact: "02 4871 3573",
    catalogs: ["https://coffeeculture.au/"],
    description: "Coffee Culture's Mittagong cafe and coffee location serving breakfast, lunch and roasted coffee.",
  },
  {
    name: "Gumnut Patisserie Mittagong",
    url: "https://gumnutpatisserie.com.au/site/locations#mittagong",
    verificationUrl: "https://gumnutpatisserie.com.au/site/locations",
    suburb: "Mittagong",
    city: "Southern Highlands",
    state: "NSW",
    address: "Corner of Cavendish and Dalton Streets, Mittagong NSW 2575",
    contact: "02 4872 2172",
    catalogs: ["https://gumnutpatisserie.com.au/site/locations"],
    description: "Award-winning Southern Highlands patisserie and cafe location in Mittagong.",
  },
  {
    name: "Four Seasons Bistro Mittagong",
    url: "https://www.fourseasonsbistro.com.au/",
    suburb: "Mittagong",
    city: "Southern Highlands",
    state: "NSW",
    address: "24 Bowral Road, Mittagong NSW 2575",
    contact: "0428 354 719",
    catalogs: ["https://www.fourseasonsbistro.com.au/"],
    description: "Vegetarian, vegan and rawist Mittagong cafe and bistro serving breakfast, lunch and coffee.",
  },
  {
    name: "Brewsters Cafe Mittagong",
    url: "https://brewsterscafe.business.site/",
    suburb: "Mittagong",
    city: "Southern Highlands",
    state: "NSW",
    address: "18 Bowral Road, Mittagong NSW 2575",
    contact: "0408 465 682",
    catalogs: ["https://brewsterscafe.business.site/"],
    description: "Mittagong coffee house and record bar serving breakfast, lunch, roasted coffee and cafe snacks.",
  },
  {
    name: "The Post Office Cafe Moss Vale",
    url: "https://www.thepostofficemossvale.com.au/",
    suburb: "Moss Vale",
    city: "Southern Highlands",
    state: "NSW",
    address: "1/249 Argyle Street, Moss Vale NSW 2577",
    contact: "(02) 4870 1264",
    catalogs: ["https://www.thepostofficemossvale.com.au/"],
    description: "Moss Vale cafe in a restored post office building serving coffee, breakfast and lunch.",
  },
  {
    name: "Flour Bar Moss Vale",
    url: "https://www.flourbar.com.au/",
    suburb: "Moss Vale",
    city: "Southern Highlands",
    state: "NSW",
    address: "386 Argyle Street, Moss Vale NSW 2577",
    contact: "(02) 4868 2552",
    catalogs: ["https://www.flourbar.com.au/"],
    description: "Moss Vale bakery, cafe, wine bar and deli serving breakfast, pastries, coffee and casual dining.",
  },
  {
    name: "Highlands Merchant Moss Vale",
    url: "http://www.highlandsmerchant.com.au/",
    suburb: "Moss Vale",
    city: "Southern Highlands",
    state: "NSW",
    address: "405 Argyle Street, Moss Vale NSW 2577",
    contact: "02 4869 5746",
    catalogs: ["http://www.highlandsmerchant.com.au/"],
    description: "Popular Moss Vale cafe known for locally sourced, handmade breakfast, lunch and coffee.",
  },
  {
    name: "Bernie's Diner Moss Vale",
    url: "https://www.berniesdiner.com.au/",
    suburb: "Moss Vale",
    city: "Southern Highlands",
    state: "NSW",
    address: "402-404 Argyle Street, Moss Vale NSW 2577",
    contact: "02 4869 1502",
    catalogs: ["https://www.berniesdiner.com.au/"],
    description: "Historic Moss Vale diner serving all-day breakfast, lunch, dinner, coffee and diner classics.",
  },
  {
    name: "Farm Club Australia Werai",
    url: "https://www.farmclubaustralia.com/",
    suburb: "Werai",
    city: "Southern Highlands",
    state: "NSW",
    address: "1 Werai Road, Werai NSW",
    catalogs: ["https://www.farmclubaustralia.com/"],
    description: "Southern Highlands farm gate cafe and bakery near Moss Vale serving coffee, gourmet pies and baked goods.",
  },
  {
    name: "Gumnut Patisserie Berrima",
    url: "https://gumnutpatisserie.com.au/site/locations#berrima",
    verificationUrl: "https://gumnutpatisserie.com.au/site/locations",
    suburb: "Berrima",
    city: "Southern Highlands",
    state: "NSW",
    address: "Shop 1, Post Office Corner, Hume Highway, Berrima NSW 2577",
    contact: "02 4877 2177",
    catalogs: ["https://gumnutpatisserie.com.au/site/locations"],
    description: "Award-winning Southern Highlands patisserie and cafe location in Berrima.",
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

async function verifyAndSaveStore(store: HighlandsCafe, categoryId: number, ownerId: number) {
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
    throw new Error("No user found to own seeded Southern Highlands cafe stores.");
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

  console.log(
    `Seeded ${savedStores} Southern Highlands cafe and brunch stores. Verified offers: ${verifiedOffers}.`
  );
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
