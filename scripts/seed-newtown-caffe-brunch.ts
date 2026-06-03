import { PrismaClient } from "@prisma/client";
import { updateCatalogUrlHealth } from "../src/lib/catalog-health";
import { getLiveVerifiedOfferEndDate } from "../src/lib/offer-lifecycle";
import { OfferVerifier } from "../src/lib/offer-verifier";

const prisma = new PrismaClient();
const CATEGORY_NAME = "Caffe & Brunch";
const VERIFY_CONCURRENCY = 4;

type NewtownCafe = {
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

const stores: NewtownCafe[] = [
  {
    name: "Rising Sun Workshop Newtown",
    url: "https://risingsunworkshop.com/",
    suburb: "Newtown",
    city: "Sydney",
    state: "NSW",
    address: "1C Whateley Street, Newtown NSW 2042",
    catalogs: ["https://risingsunworkshop.com/contact"],
    description: "Award-winning Newtown restaurant and cafe with Japanese and Korean-inspired day menu.",
  },
  {
    name: "Miss Lilly's Newtown",
    url: "https://misslillys.com.au/",
    suburb: "Newtown",
    city: "Sydney",
    state: "NSW",
    address: "571 King Street, Newtown NSW 2042",
    contact: "(02) 9516 2411",
    catalogs: ["https://misslillys.com.au/"],
    description: "Bakery cafe in Newtown serving pies, pastries, cakes and coffee.",
  },
  {
    name: "End of King Newtown",
    url: "https://endofking.com.au/",
    suburb: "Newtown",
    city: "Sydney",
    state: "NSW",
    address: "609 King Street, Newtown NSW 2042",
    catalogs: ["https://endofking.com.au/"],
    description: "Highly rated cafe at the south end of King Street with brunch, coffee and creative lunch dishes.",
  },
  {
    name: "Rolling Penny Newtown",
    url: "https://www.rollingpenny.au/menu",
    suburb: "Newtown",
    city: "Sydney",
    state: "NSW",
    address: "583A King Street, Newtown NSW 2042",
    contact: "02 8056 8897",
    catalogs: ["https://www.rollingpenny.au/menu"],
    description: "Neighbourhood brunch cafe known for inventive breakfast and lunch in South King Street.",
  },
  {
    name: "Flour Drum Newtown",
    url: "https://flourdrum.com.au/",
    suburb: "Newtown",
    city: "Sydney",
    state: "NSW",
    address: "531 King Street, Newtown NSW 2042",
    contact: "(02) 9565 2822",
    catalogs: ["https://flourdrum.com.au/contact-us/"],
    description: "Newtown breakfast, lunch and cake cafe at the southern end of King Street.",
  },
  {
    name: "Hoochie Mamma Cafe Camperdown",
    url: "https://www.hoochiemammacafe.com.au/",
    suburb: "Camperdown",
    city: "Sydney",
    state: "NSW",
    address: "156 Missenden Road, Camperdown NSW 2050",
    catalogs: ["https://www.hoochiemammacafe.com.au/"],
    description: "Fully licensed cafe near Newtown, Sydney Uni and RPA, serving coffee and brunch fare.",
  },
  {
    name: "Black Star Pastry Newtown",
    url: "https://www.blackstarpastry.com/locations#newtown",
    suburb: "Newtown",
    city: "Sydney",
    state: "NSW",
    address: "Shop 1/325 King Street, Newtown NSW 2042",
    catalogs: ["https://www.blackstarpastry.com/locations"],
    description: "Newtown bakery cafe known for cakes, pastries, coffee and takeaway.",
  },
  {
    name: "212 Blu Newtown",
    url: "https://212blu.com/contact/",
    suburb: "Newtown",
    city: "Sydney",
    state: "NSW",
    address: "212 Australia Street, Newtown NSW 2042",
    contact: "(02) 9516 0115",
    catalogs: ["https://212blu.com/contact/"],
    description: "Newtown cafe and wine bar on Australia Street.",
  },
  {
    name: "Tokyo Lamington Newtown",
    url: "https://www.tokyolamington.com/",
    suburb: "Newtown",
    city: "Sydney",
    state: "NSW",
    address: "277 Australia Street, Newtown NSW 2042",
    catalogs: ["https://www.tokyolamington.com/"],
    description: "Newtown bakery and cafe known for lamingtons, cakes and coffee.",
  },
  {
    name: "Hollis Park Cafe Newtown",
    url: "https://www.google.com/search?q=Hollis+Park+Cafe+Newtown",
    suburb: "Newtown",
    city: "Sydney",
    state: "NSW",
    address: "64 Wilson Street, Newtown NSW 2042",
    catalogs: [],
    description: "Neighbourhood cafe near Hollis Park with no confirmed official website.",
    sourceType: "google_business",
  },
  {
    name: "Satellite Cafe Newtown",
    url: "https://www.google.com/search?q=Satellite+Cafe+Newtown",
    suburb: "Newtown",
    city: "Sydney",
    state: "NSW",
    address: "7-8/80 Wilson Street, Newtown NSW 2042",
    catalogs: [],
    description: "Long-running Wilson Street cafe with no confirmed official website.",
    sourceType: "google_business",
  },
  {
    name: "Maeda Newtown",
    url: "https://www.google.com/search?q=Maeda+Newtown+cafe",
    suburb: "Newtown",
    city: "Sydney",
    state: "NSW",
    address: "King Street, Newtown NSW 2042",
    catalogs: [],
    description: "Highly regarded Newtown cafe listing without a confirmed official website.",
    sourceType: "google_business",
  },
  {
    name: "Shenkin Erskineville",
    url: "https://www.google.com/search?q=Shenkin+Erskineville",
    suburb: "Erskineville",
    city: "Sydney",
    state: "NSW",
    address: "53 Erskineville Road, Erskineville NSW 2043",
    catalogs: [],
    description: "Middle Eastern brunch cafe near Newtown with no confirmed official website.",
    sourceType: "google_business",
  },
  {
    name: "West Juliett Marrickville",
    url: "https://westjuliett.com/",
    suburb: "Marrickville",
    city: "Sydney",
    state: "NSW",
    address: "30 Llewellyn Street, Marrickville NSW 2204",
    contact: "02 9519 0101",
    catalogs: ["https://westjuliett.com/"],
    description: "Well-known Marrickville brunch cafe near the Newtown area.",
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

async function verifyAndSaveStore(store: NewtownCafe, categoryId: number, ownerId: number) {
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

async function main() {
  const owner = await prisma.user.findFirst({ orderBy: { id: "asc" } });
  if (!owner) {
    throw new Error("No user found to own seeded Newtown cafe stores.");
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

  console.log(`Seeded ${savedStores} Newtown-area cafe and brunch stores. Verified offers: ${verifiedOffers}.`);
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
