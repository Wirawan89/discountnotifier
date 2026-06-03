import { PrismaClient } from "@prisma/client";
import { updateCatalogUrlHealth } from "../src/lib/catalog-health";
import { getLiveVerifiedOfferEndDate } from "../src/lib/offer-lifecycle";
import { OfferVerifier } from "../src/lib/offer-verifier";

const prisma = new PrismaClient();
const CATEGORY_NAME = "Caffe & Brunch";
const VERIFY_CONCURRENCY = 4;

type VictoriaCafe = {
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

const stores: VictoriaCafe[] = [
  {
    name: "Ten Square Cafe Melbourne",
    url: "https://www.tensquarecafe.com.au/",
    suburb: "Melbourne",
    city: "Melbourne",
    state: "VIC",
    address: "120 Hardware Street, Melbourne VIC 3000",
    contact: "03 9670 6522",
    catalogs: ["https://www.tensquarecafe.com.au/"],
    description: "Melbourne CBD brunch cafe near Hardware Lane serving specialty coffee, breakfast, brunch and lunch.",
  },
  {
    name: "Glass Merchants Balaclava",
    url: "https://www.glassmerchants.com.au/",
    suburb: "Balaclava",
    city: "Melbourne",
    state: "VIC",
    address: "63-65 Nelson Street, Balaclava VIC 3183",
    catalogs: ["https://www.glassmerchants.com.au/"],
    description: "Balaclava cafe and brunch venue serving coffee, breakfast, lunch and relaxed neighbourhood dining.",
  },
  {
    name: "Elephant Cafe West Melbourne",
    url: "https://elephant-cafe.com.au/",
    suburb: "West Melbourne",
    city: "Melbourne",
    state: "VIC",
    address: "250 Victoria Street, West Melbourne VIC 3003",
    catalogs: ["https://elephant-cafe.com.au/"],
    description: "West Melbourne cafe serving brunch, coffee, juices and casual cafe meals near Queen Victoria Market.",
  },
  {
    name: "The Espressonist Melbourne",
    url: "https://www.the-espressonist.com/",
    suburb: "Melbourne",
    city: "Melbourne",
    state: "VIC",
    address: "Melbourne VIC 3000",
    catalogs: ["https://www.the-espressonist.com/"],
    description: "Melbourne specialty coffee and cafe venue serving breakfast, brunch and grab-and-go food.",
  },
  {
    name: "Cannibal Creek Bakehouse Garfield",
    url: "https://cannibalcreekbakehouse.com.au/",
    suburb: "Garfield",
    city: "Gippsland",
    state: "VIC",
    address: "41 Main Street, Garfield VIC 3814",
    contact: "03 5617 8286",
    catalogs: ["https://cannibalcreekbakehouse.com.au/", "https://cannibalcreekbakehouse.com.au/contact-us/"],
    description: "Garfield bakehouse and cafe in Gippsland serving brunch, coffee, bread, cakes and takeaway meals.",
  },
  {
    name: "Cafe Aga Yarram",
    url: "https://www.cafeaga.com/",
    suburb: "Yarram",
    city: "Gippsland",
    state: "VIC",
    address: "219 Commercial Road, Yarram VIC 3971",
    contact: "03 5182 5198",
    catalogs: ["https://www.cafeaga.com/"],
    description: "South East Gippsland cafe in Yarram serving coffee, brunch, lunch and dietary-inclusive cafe food.",
  },
  {
    name: "Icaro Apollo Bay",
    url: "https://www.icaro.au/",
    suburb: "Apollo Bay",
    city: "Great Ocean Road",
    state: "VIC",
    address: "1F & 1G Moore Street, Apollo Bay VIC 3233",
    catalogs: ["https://www.icaro.au/"],
    description: "Apollo Bay bar, restaurant and cafe serving specialty coffee, seasonal brunch and coastal dining.",
  },
  {
    name: "Tilly Divine Warrnambool",
    url: "https://tillydivine.com.au/",
    suburb: "Warrnambool",
    city: "Warrnambool",
    state: "VIC",
    address: "174-176 Liebig Street, Warrnambool VIC 3280",
    contact: "03 5562 7952",
    catalogs: ["https://tillydivine.com.au/"],
    description: "Warrnambool cafe and bar serving ST ALi coffee, all-day breakfast, lunch, cakes and casual drinks.",
  },
  {
    name: "Beaches Cafe Bar Warrnambool",
    url: "https://www.beachescafebar.com.au/",
    suburb: "Warrnambool",
    city: "Warrnambool",
    state: "VIC",
    address: "91 Merri Street, Warrnambool VIC 3280",
    contact: "0438 150 558",
    catalogs: ["https://www.beachescafebar.com.au/"],
    description: "Warrnambool coastal cafe and bar serving breakfast, lunch, coffee, cakes and ocean-view dining.",
  },
  {
    name: "Cafe Go Geelong",
    url: "https://cafego.com.au/",
    suburb: "Geelong",
    city: "Geelong",
    state: "VIC",
    address: "37 Bellerine Street, Geelong VIC 3220",
    contact: "03 5229 4752",
    catalogs: ["https://cafego.com.au/", "https://cafego.com.au/contact/"],
    description: "Geelong cafe institution serving coffee, all-day brunch, takeaway meals and local catering.",
  },
  {
    name: "King of the Castle Geelong West",
    url: "https://www.kingofthecastlecafe.com.au/",
    suburb: "Geelong West",
    city: "Geelong",
    state: "VIC",
    address: "24 Pakington Street, Geelong West VIC 3218",
    contact: "03 5223 1341",
    catalogs: ["https://www.kingofthecastlecafe.com.au/"],
    description: "Geelong West cafe serving breakfast, brunch, coffee and casual cafe food on Pakington Street.",
  },
  {
    name: "Black Cup Cafe East Geelong",
    url: "https://www.blackcupcafe.com.au/",
    suburb: "East Geelong",
    city: "Geelong",
    state: "VIC",
    address: "103 Garden Street, East Geelong VIC 3219",
    catalogs: ["https://www.blackcupcafe.com.au/"],
    description: "East Geelong cafe serving custom blend coffee, breakfast, brunch and lunch.",
  },
  {
    name: "Webster's Market and Cafe Ballarat",
    url: "https://webstersmarketandcafe.com/",
    suburb: "Ballarat Central",
    city: "Ballarat",
    state: "VIC",
    address: "61 Webster Street, Ballarat Central VIC 3350",
    contact: "03 5331 2498",
    catalogs: ["https://webstersmarketandcafe.com/", "https://webstersmarketandcafe.com/contact"],
    description: "Ballarat market cafe serving strong coffee, seasonal all-day brunch and cafe meals.",
  },
  {
    name: "Fig Tree Cafe Horsham",
    url: "https://www.figtreehorsham.com.au/",
    suburb: "Horsham",
    city: "Horsham",
    state: "VIC",
    address: "59 Firebrace Street, Horsham VIC 3400",
    contact: "03 4317 8039",
    catalogs: ["https://www.figtreehorsham.com.au/"],
    description: "Horsham cafe serving coffee, breakfast, lunch and gluten-free friendly cafe food.",
  },
  {
    name: "Brass Monkey Mildura",
    url: "https://www.brassmonkeyrestaurant.com.au/",
    suburb: "Mildura",
    city: "Mildura",
    state: "VIC",
    address: "149 Eighth Street, Mildura VIC 3500",
    contact: "03 5021 4769",
    catalogs: ["https://www.brassmonkeyrestaurant.com.au/"],
    description: "Mildura kitchen and coffee venue serving breakfast, boozy brunch, lunch and specialty drinks.",
  },
  {
    name: "Shippy's Cafe Mildura",
    url: "https://shippys.com.au/",
    suburb: "Mildura",
    city: "Mildura",
    state: "VIC",
    address: "122 Hugh King Drive, Mildura VIC 3500",
    contact: "0418 132 715",
    catalogs: ["https://shippys.com.au/", "https://shippys.com.au/contact-us/"],
    description: "Mildura cafe on Hugh King Drive serving coffee, breakfast, brunch and riverside cafe food.",
  },
  {
    name: "Cafe Jas Wodonga",
    url: "https://www.cafejas.com.au/",
    suburb: "Wodonga",
    city: "Wodonga",
    state: "VIC",
    address: "Wodonga VIC 3690",
    catalogs: ["https://www.cafejas.com.au/"],
    description: "Wodonga cafe, bar and restaurant serving coffee, breakfast, lunch and casual meals.",
  },
  {
    name: "Cafe The PreVue Wodonga",
    url: "https://www.cafetheprevue.com.au/",
    suburb: "Wodonga",
    city: "Wodonga",
    state: "VIC",
    address: "48-50 Elgin Boulevard, Wodonga VIC 3690",
    catalogs: ["https://www.cafetheprevue.com.au/"],
    description: "Wodonga cafe overlooking the Junction precinct serving breakfast, lunch, coffee and drinks.",
  },
  {
    name: "Close Collective Cafe Wangaratta",
    url: "https://www.closecollective.org.au/",
    suburb: "Wangaratta",
    city: "Wangaratta",
    state: "VIC",
    address: "Wangaratta VIC 3677",
    catalogs: ["https://www.closecollective.org.au/", "https://www.closecollective.org.au/contact-us"],
    description: "Wangaratta social enterprise cafe serving coffee, food and community-focused cafe experiences.",
  },
  {
    name: "Beechworth Bakery Beechworth",
    url: "https://beechworthbakery.com.au/#beechworth",
    verificationUrl: "https://beechworthbakery.com.au/",
    suburb: "Beechworth",
    city: "High Country",
    state: "VIC",
    address: "27 Camp Street, Beechworth VIC 3747",
    contact: "1300 233 784",
    catalogs: ["https://beechworthbakery.com.au/"],
    description: "Original Beechworth Bakery branch serving coffee, breakfast, pies, pastries, sandwiches and bakery meals.",
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

async function verifyAndSaveStore(store: VictoriaCafe, categoryId: number, ownerId: number) {
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
    throw new Error("No user found to own seeded Victoria cafe stores.");
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

  console.log(`Seeded ${savedStores} Victoria cafe and brunch stores. Verified offers: ${verifiedOffers}.`);
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
