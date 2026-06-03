import { PrismaClient } from "@prisma/client";
import { updateCatalogUrlHealth } from "../src/lib/catalog-health";
import { getLiveVerifiedOfferEndDate } from "../src/lib/offer-lifecycle";
import { OfferVerifier } from "../src/lib/offer-verifier";

const prisma = new PrismaClient();
const CATEGORY_NAME = "Caffe & Brunch";
const VERIFY_CONCURRENCY = 4;

type WesternAustraliaCafe = {
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

const stores: WesternAustraliaCafe[] = [
  {
    name: "Hello Duck Cafe Bunbury",
    url: "https://www.helloduckcafe.com.au/",
    suburb: "Bunbury",
    city: "Bunbury",
    state: "WA",
    address: "Bunbury WA 6230",
    catalogs: ["https://www.helloduckcafe.com.au/"],
    description: "Bunbury cafe and brunch venue serving specialty coffee, breakfast, lunch and relaxed casual food.",
  },
  {
    name: "Backbeach Cafe Bunbury",
    url: "https://www.backbeachcafe.com.au/",
    suburb: "Bunbury",
    city: "Bunbury",
    state: "WA",
    address: "1 Ocean Drive, Bunbury WA 6230",
    contact: "08 9791 4877",
    catalogs: ["https://www.backbeachcafe.com.au/"],
    description: "Beachside Bunbury cafe serving breakfast, lunch, coffee and coastal dining overlooking Back Beach.",
  },
  {
    name: "Unleash Cafe Margaret River",
    url: "https://www.unleashcafe.com/",
    suburb: "Margaret River",
    city: "Margaret River",
    state: "WA",
    address: "Margaret River WA 6285",
    catalogs: ["https://www.unleashcafe.com/"],
    description: "Margaret River cafe serving coffee, breakfast, brunch, lunch and dog-friendly casual dining.",
  },
  {
    name: "Blue Ginger Fine Foods Margaret River",
    url: "https://www.bluegingerfinefoods.com/cafe-coffee-shop/",
    verificationUrl: "https://www.bluegingerfinefoods.com/",
    suburb: "Margaret River",
    city: "Margaret River",
    state: "WA",
    address: "31 Station Road, Margaret River WA 6285",
    contact: "08 9757 3074",
    catalogs: ["https://www.bluegingerfinefoods.com/", "https://www.bluegingerfinefoods.com/cafe-coffee-shop/"],
    description: "Margaret River wholefoods store and cafe serving breakfast, coffee, lunch, cakes and local produce.",
  },
  {
    name: "White Elephant Cafe Gnarabup",
    url: "https://www.whiteelephantcafe.com.au/",
    suburb: "Gnarabup",
    city: "Margaret River",
    state: "WA",
    address: "Gnarabup Beach, Gnarabup WA 6285",
    contact: "08 9757 1990",
    catalogs: ["https://www.whiteelephantcafe.com.au/"],
    description: "Beachfront Gnarabup cafe near Margaret River serving breakfast, lunch, coffee and ocean-view brunch.",
  },
  {
    name: "Maison Lassiaille Margaret River",
    url: "https://maisonlassiaille.com.au/",
    suburb: "Margaret River",
    city: "Margaret River",
    state: "WA",
    address: "317 Harmans Mill Road, Wilyabrup WA 6280",
    contact: "08 9755 6226",
    catalogs: ["https://maisonlassiaille.com.au/"],
    description: "Margaret River patisserie and cafe serving French pastries, coffee, cakes and brunch-friendly sweets.",
  },
  {
    name: "Bred Co Albany",
    url: "https://www.bredco.com.au/",
    suburb: "Albany",
    city: "Albany",
    state: "WA",
    address: "Albany WA 6330",
    catalogs: ["https://www.bredco.com.au/", "https://www.bredco.com.au/where-to-find-bred-co"],
    description: "Albany sourdough bakery and cafe serving coffee, pastries, bread and breakfast-friendly baked goods.",
  },
  {
    name: "Dylans on the Terrace Albany",
    url: "https://www.dylans.com.au/",
    suburb: "Albany",
    city: "Albany",
    state: "WA",
    address: "82 Stirling Terrace, Albany WA 6330",
    contact: "08 9841 8720",
    catalogs: ["https://www.dylans.com.au/"],
    description: "Albany cafe and restaurant serving breakfast, brunch, lunch, coffee and casual dining.",
  },
  {
    name: "Flowvitality Geraldton",
    url: "https://flowcafe.squarespace.com/",
    suburb: "Geraldton",
    city: "Geraldton",
    state: "WA",
    address: "Geraldton WA 6530",
    catalogs: ["https://flowcafe.squarespace.com/"],
    description: "Geraldton cafe and wellness venue serving coffee, brunch, lunch and fresh cafe food.",
  },
  {
    name: "Piper Lane Cafe Geraldton",
    url: "https://piperlanecafe.com.au/",
    suburb: "Geraldton",
    city: "Geraldton",
    state: "WA",
    address: "Geraldton WA 6530",
    catalogs: ["https://piperlanecafe.com.au/"],
    description: "Geraldton cafe serving breakfast, lunch, coffee and casual brunch in the Mid West.",
  },
  {
    name: "Jaffle Shack Geraldton",
    url: "https://www.jaffleshack.com.au/",
    suburb: "Geraldton",
    city: "Geraldton",
    state: "WA",
    address: "Geraldton WA 6530",
    catalogs: ["https://www.jaffleshack.com.au/"],
    description: "Geraldton cafe known for coffee, breakfast, lunch, jaffles, smoothies and takeaway bites.",
  },
  {
    name: "The Lunch Shack Geraldton",
    url: "https://www.thelunchshack.com/",
    suburb: "Geraldton",
    city: "Geraldton",
    state: "WA",
    address: "Geraldton WA 6530",
    catalogs: ["https://www.thelunchshack.com/"],
    description: "Geraldton lunch and cafe spot serving coffee, sandwiches, fresh meals and takeaway-friendly brunch.",
  },
  {
    name: "RedFoot My Second Home Cafe Karratha",
    url: "https://www.redfootco.com/",
    suburb: "Stove Hill",
    city: "Karratha",
    state: "WA",
    address: "Inside The Ranges resort, Lot 1090 De Witt Road, Stove Hill WA 6714",
    contact: "0419 183 284",
    catalogs: ["https://www.redfootco.com/"],
    description: "Karratha Pilbara cafe operated by RedFoot & Co serving coffee, fresh food and local cafe meals.",
  },
  {
    name: "Lo's Cafe Fusion Karratha",
    url: "https://losgroup.com.au/",
    suburb: "Karratha",
    city: "Karratha",
    state: "WA",
    address: "Shop 7, 20 Sharpe Avenue, Karratha WA 6714",
    catalogs: ["https://losgroup.com.au/"],
    description: "Karratha cafe serving coffee, brunch and community-focused casual dining.",
  },
  {
    name: "Provedore by Millijo Port Hedland",
    url: "https://provedorebymillijo.com.au/",
    suburb: "Port Hedland",
    city: "Port Hedland",
    state: "WA",
    address: "Pretty Pool, Port Hedland WA 6721",
    catalogs: ["https://provedorebymillijo.com.au/"],
    description: "Coastal Port Hedland cafe and restaurant serving breakfast, coffee, takeaway and seasonal meals.",
  },
  {
    name: "The Aviator Bar and Cafe Port Hedland",
    url: "https://www.aviatorbarandcafeporthedland.com/",
    suburb: "Port Hedland",
    city: "Port Hedland",
    state: "WA",
    address: "Port Hedland International Airport, Great Northern Highway, Port Hedland WA 6721",
    contact: "0447 484 241",
    catalogs: ["https://www.aviatorbarandcafeporthedland.com/"],
    description: "Port Hedland airport cafe serving coffee, breakfast, light meals and casual traveller-friendly food.",
  },
  {
    name: "Haven Broome",
    url: "https://www.havenbroome.com.au/",
    suburb: "Broome",
    city: "Broome",
    state: "WA",
    address: "Shop 17, Paspaley Plaza, Broome WA 6725",
    catalogs: ["https://www.havenbroome.com.au/"],
    description: "Broome cafe in Chinatown serving specialty coffee, brunch classics and fresh casual dining.",
  },
  {
    name: "Dragonfly Cafe Broome",
    url: "https://dragonfly-cafe.squarespace.com/",
    suburb: "Broome",
    city: "Broome",
    state: "WA",
    address: "Broome WA 6725",
    catalogs: ["https://dragonfly-cafe.squarespace.com/"],
    description: "Broome cafe serving breakfast, brunch, coffee, lunch and relaxed Kimberley dining.",
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

async function verifyAndSaveStore(store: WesternAustraliaCafe, categoryId: number, ownerId: number) {
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
    throw new Error("No user found to own seeded Western Australia cafe stores.");
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

  console.log(`Seeded ${savedStores} Western Australia cafe and brunch stores. Verified offers: ${verifiedOffers}.`);
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
