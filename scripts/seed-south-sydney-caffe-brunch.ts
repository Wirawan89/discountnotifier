import { PrismaClient } from "@prisma/client";
import { updateCatalogUrlHealth } from "../src/lib/catalog-health";
import { getLiveVerifiedOfferEndDate } from "../src/lib/offer-lifecycle";
import { OfferVerifier } from "../src/lib/offer-verifier";

const prisma = new PrismaClient();
const CATEGORY_NAME = "Caffe & Brunch";
const VERIFY_CONCURRENCY = 4;

type SouthSydneyCafe = {
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

const stores: SouthSydneyCafe[] = [
  {
    name: "Benzie's Botany",
    url: "https://benzies.com.au/",
    suburb: "Botany",
    city: "Sydney",
    state: "NSW",
    address: "Botany NSW 2019",
    catalogs: ["https://benzies.com.au/"],
    description: "Botany cafe with Middle Eastern and Mediterranean-inspired breakfast, lunch, coffee and catering.",
  },
  {
    name: "The Burrow Cafe Maroubra",
    url: "https://www.theburrowcafe.org/",
    suburb: "Maroubra",
    city: "Sydney",
    state: "NSW",
    address: "Heffron Centre, Bunnerong Road, Maroubra NSW 2035",
    catalogs: ["https://www.theburrowcafe.org/"],
    description: "Community cafe at the Heffron Centre serving specialty coffee, all-day breakfast, lunch and catering.",
  },
  {
    name: "Ek'sentrik Cafe Maroubra",
    url: "https://www.eksentrikcafe.com.au/",
    suburb: "Maroubra",
    city: "Sydney",
    state: "NSW",
    address: "765A Anzac Parade, Maroubra NSW 2035",
    catalogs: ["https://www.eksentrikcafe.com.au/"],
    description: "Maroubra cafe serving coffee, breakfast, brunch and lunch.",
  },
  {
    name: "Page Two Cafe Randwick",
    url: "https://www.pagetwocafe.com.au/",
    suburb: "Randwick",
    city: "Sydney",
    state: "NSW",
    address: "122 Belmore Road, Randwick NSW 2031",
    contact: "02 9399 6294",
    catalogs: ["https://www.pagetwocafe.com.au/"],
    description: "Randwick cafe with all-day brunch classics, lunch, coffee and garden seating.",
  },
  {
    name: "A Man and His Monkey Randwick",
    url: "https://www.amanandhismonkey.com.au/",
    suburb: "Randwick",
    city: "Sydney",
    state: "NSW",
    address: "149 Clovelly Road, Randwick NSW 2031",
    contact: "02 9398 3900",
    catalogs: ["https://www.amanandhismonkey.com.au/"],
    description: "Randwick brunch cafe serving Middle Eastern-inspired breakfast, lunch, coffee and takeaway bites.",
  },
  {
    name: "Le Rendez-Vous Cafe Randwick",
    url: "https://www.lerendezvouscafe.com.au/",
    suburb: "Randwick",
    city: "Sydney",
    state: "NSW",
    address: "Shop 2, 65-71 Belmore Road, Randwick NSW 2031",
    contact: "0480 103 671",
    catalogs: ["https://www.lerendezvouscafe.com.au/"],
    description: "Randwick French cafe serving pastries, cakes, coffee, breakfast and baguettes.",
  },
  {
    name: "The Shed Cafe Randwick",
    url: "https://theshedcafe.com.au/randwick/",
    suburb: "Randwick",
    city: "Sydney",
    state: "NSW",
    address: "Shop 25, Royal Randwick Shopping Centre, Randwick NSW 2031",
    contact: "02 9398 7525",
    catalogs: ["https://theshedcafe.com.au/randwick/"],
    description: "Randwick shopping centre cafe serving premium coffee, brunch and fresh cafe meals.",
  },
  {
    name: "Nooks Place Randwick",
    url: "https://www.nooksplace.com.au/about",
    suburb: "Randwick",
    city: "Sydney",
    state: "NSW",
    address: "Randwick NSW 2031",
    catalogs: ["https://www.nooksplace.com.au/about"],
    description: "Randwick neighbourhood cafe serving all-day breakfast, lunch, pastries, coffee and drinks.",
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

async function verifyAndSaveStore(store: SouthSydneyCafe, categoryId: number, ownerId: number) {
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
    throw new Error("No user found to own seeded South Sydney cafe stores.");
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

  console.log(`Seeded ${savedStores} South Sydney cafe and brunch stores. Verified offers: ${verifiedOffers}.`);
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
