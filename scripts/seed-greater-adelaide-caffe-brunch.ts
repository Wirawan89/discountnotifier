import { PrismaClient } from "@prisma/client";
import { updateCatalogUrlHealth } from "../src/lib/catalog-health";
import { getLiveVerifiedOfferEndDate } from "../src/lib/offer-lifecycle";
import { OfferVerifier } from "../src/lib/offer-verifier";

const prisma = new PrismaClient();
const CATEGORY_NAME = "Caffe & Brunch";
const VERIFY_CONCURRENCY = 4;

type AdelaideCafe = {
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

const stores: AdelaideCafe[] = [
  {
    name: "Reno's Bistro Adelaide",
    url: "https://www.renosbistro.com/",
    suburb: "Adelaide",
    city: "Adelaide",
    state: "SA",
    address: "45 Pirie Street, Adelaide SA 5000",
    contact: "0499 979 755",
    catalogs: ["https://www.renosbistro.com/"],
    description: "Adelaide CBD cafe and Italian bistro serving coffee, breakfast, lunch, pastries and catering.",
  },
  {
    name: "Coffylosophy Adelaide",
    url: "https://www.coffylosophy.com.au/",
    suburb: "Adelaide",
    city: "Adelaide",
    state: "SA",
    address: "198A Hutt Street, Adelaide SA 5000",
    contact: "08 8223 9351",
    catalogs: ["https://www.coffylosophy.com.au/"],
    description: "Award-winning Hutt Street cafe serving coffee, all-day meals, breakfast, brunch and lunch.",
  },
  {
    name: "Lounders Boatshed Cafe Adelaide",
    url: "https://loundersboatshedcafe.com.au/",
    suburb: "Adelaide",
    city: "Adelaide",
    state: "SA",
    address: "1018 Victoria Drive, Adelaide SA 5000",
    contact: "08 8223 2958",
    catalogs: ["https://loundersboatshedcafe.com.au/"],
    description: "River Torrens cafe in Adelaide serving breakfast, lunch, coffee, cake and riverside brunch.",
  },
  {
    name: "Hatun Cafe Adelaide",
    url: "https://hatuncafe.com.au/",
    suburb: "Adelaide",
    city: "Adelaide",
    state: "SA",
    address: "Adelaide SA 5000",
    catalogs: ["https://hatuncafe.com.au/"],
    description: "Adelaide CBD Turkish street cafe serving coffee, breakfast, brunch, lunch and fresh casual meals.",
  },
  {
    name: "Vintage Chef Co Cafe Evanston Park",
    url: "https://www.vintagechefco.com.au/cafe/",
    verificationUrl: "https://www.vintagechefco.com.au/",
    suburb: "Evanston Park",
    city: "Gawler",
    state: "SA",
    address: "18-20 Alexander Avenue, Evanston Park SA 5116",
    catalogs: ["https://www.vintagechefco.com.au/", "https://www.vintagechefco.com.au/cafe/"],
    description: "Gawler-area cafe at STARplex serving breakfast, lunch, Seven Miles coffee and prepared meals.",
  },
  {
    name: "Lil Mumma's Cafe Gawler",
    url: "https://www.lilmummascafe.com/",
    suburb: "Gawler",
    city: "Gawler",
    state: "SA",
    address: "1/40 Murray Street, Gawler SA 5118",
    catalogs: ["https://www.lilmummascafe.com/"],
    description: "Gawler cafe serving coffee, breakfast, lunch, catering and casual brunch-friendly meals.",
  },
  {
    name: "Cafe Sia Gawler",
    url: "https://cafesia.com.au/menu/",
    verificationUrl: "https://cafesia.com.au/",
    suburb: "Evanston",
    city: "Gawler",
    state: "SA",
    address: "Shop 10, Gawler Green Shopping Centre, 4 Tulloch Road, Evanston SA 5116",
    contact: "08 8522 6990",
    catalogs: ["https://cafesia.com.au/", "https://cafesia.com.au/menu/"],
    description: "Gawler cafe and restaurant serving brunch, coffee, lunch, dinner and Mediterranean-inspired meals.",
  },
  {
    name: "Saints Kitchen Salisbury",
    url: "https://saintskitchen.net.au/",
    suburb: "Salisbury",
    city: "Adelaide",
    state: "SA",
    address: "Salisbury SA 5108",
    catalogs: ["https://saintskitchen.net.au/"],
    description: "Salisbury cafe and restaurant serving brunch, coffee, lunch and South Australian produce-led meals.",
  },
  {
    name: "Agatha's Cafe Port Noarlunga",
    url: "https://www.agathascafe.com.au/",
    suburb: "Port Noarlunga",
    city: "Adelaide",
    state: "SA",
    address: "1 Gawler Street, Port Noarlunga SA 5167",
    catalogs: ["https://www.agathascafe.com.au/"],
    description: "Licensed Port Noarlunga beach cafe serving breakfast, brunch, lunch, coffee and South Australian wine.",
  },
  {
    name: "Taste Revolution Port Noarlunga South",
    url: "https://www.tasteesplande.com/about",
    verificationUrl: "https://www.tasteesplande.com/",
    suburb: "Port Noarlunga South",
    city: "Adelaide",
    state: "SA",
    address: "153-157 Esplanade, Port Noarlunga South SA 5167",
    contact: "0401 483 490",
    catalogs: ["https://www.tasteesplande.com/", "https://www.tasteesplande.com/about"],
    description: "Port Noarlunga South coastal cafe serving morning coffee, brunch, lunch and casual seaside meals.",
  },
  {
    name: "Manna McLaren Vale",
    url: "https://www.mannamv.com/",
    suburb: "McLaren Vale",
    city: "McLaren Vale",
    state: "SA",
    address: "211 Main Road, McLaren Vale SA 5171",
    contact: "0409 393 818",
    catalogs: ["https://www.mannamv.com/", "https://www.mannamv.com/menu"],
    description: "Award-winning McLaren Vale licensed cafe serving specialty coffee, breakfast, lunch and seasonal brunch.",
  },
  {
    name: "Harry's Deli at Wirra Wirra McLaren Vale",
    url: "https://wirrawirra.com/pages/harrys-deli-at-wirra-wirra",
    verificationUrl: "https://wirrawirra.com/",
    suburb: "McLaren Vale",
    city: "McLaren Vale",
    state: "SA",
    address: "255 Strout Road, McLaren Vale SA 5171",
    contact: "08 8323 8414",
    catalogs: ["https://wirrawirra.com/", "https://wirrawirra.com/pages/harrys-deli-at-wirra-wirra"],
    description: "McLaren Vale winery deli serving coffee, lunch, local produce, share plates and relaxed daytime dining.",
  },
  {
    name: "Lockwood General Burnside",
    url: "https://www.lockwoodgeneral.com.au/",
    suburb: "Burnside",
    city: "Adelaide",
    state: "SA",
    address: "35 High Street, Burnside SA 5066",
    catalogs: ["https://www.lockwoodgeneral.com.au/"],
    description: "Burnside cafe, bar and providore serving specialty coffee, brunch, bread, pastries and small goods.",
  },
  {
    name: "Superbutter Burnside Village",
    url: "https://www.superbutter.com.au/",
    suburb: "Glenside",
    city: "Adelaide",
    state: "SA",
    address: "Shop 42, Burnside Village, 447 Portrush Road, Glenside SA 5065",
    catalogs: ["https://www.superbutter.com.au/"],
    description: "Burnside Village cafe serving coffee, thick-cut toasties, brunch food and casual daytime meals.",
  },
  {
    name: "Mr Chu Burnside Village",
    url: "https://www.mrchueatery.com.au/burnside-village.php",
    verificationUrl: "https://www.mrchueatery.com.au/",
    suburb: "Glenside",
    city: "Adelaide",
    state: "SA",
    address: "Vine Mall Courtyard, Burnside Village, 447 Portrush Road, Glenside SA 5065",
    contact: "08 7111 5316",
    catalogs: ["https://www.mrchueatery.com.au/", "https://www.mrchueatery.com.au/burnside-village.php"],
    description: "Burnside contemporary eatery serving breakfast cocktails, brunch, lunch and Asian-inspired cafe dishes.",
  },
  {
    name: "Caffe Buongiorno Norwood",
    url: "https://www.caffe-buongiorno.com.au/",
    suburb: "Norwood",
    city: "Adelaide",
    state: "SA",
    address: "145 The Parade, Norwood SA 5067",
    contact: "08 8364 2944",
    catalogs: ["https://www.caffe-buongiorno.com.au/"],
    description: "Norwood Italian cafe and restaurant serving breakfast, lunch, coffee, cake, gelati and late dining.",
  },
  {
    name: "The Banksia Tree Port Adelaide",
    url: "https://www.thebanksiatree.com/",
    suburb: "Port Adelaide",
    city: "Adelaide",
    state: "SA",
    address: "147 St Vincent Street, Port Adelaide SA 5015",
    catalogs: ["https://www.thebanksiatree.com/"],
    description: "Award-winning Port Adelaide cafe and restaurant serving local, seasonal breakfast, brunch and coffee.",
  },
  {
    name: "MALOBO Henley Beach",
    url: "https://malobo.com.au/",
    suburb: "Henley Beach",
    city: "Adelaide",
    state: "SA",
    address: "Henley Square, Henley Beach SA 5022",
    catalogs: ["https://malobo.com.au/"],
    description: "Henley Beach waterfront cafe and bar serving specialty coffee, brunch, bakery treats and all-day meals.",
  },
  {
    name: "H&A Coffee House Glenelg",
    url: "https://hacoffeehouse.com.au/about/",
    verificationUrl: "https://hacoffeehouse.com.au/",
    suburb: "Glenelg",
    city: "Adelaide",
    state: "SA",
    address: "Glenelg SA 5045",
    catalogs: ["https://hacoffeehouse.com.au/", "https://hacoffeehouse.com.au/about/"],
    description: "Glenelg coffee house serving breakfast, brunch, lunch and casual cafe food.",
  },
  {
    name: "The Strand Cafe Glenelg",
    url: "https://cafestrand.com.au/",
    suburb: "Glenelg",
    city: "Adelaide",
    state: "SA",
    address: "108 Jetty Road, Glenelg SA 5045",
    catalogs: ["https://cafestrand.com.au/"],
    description: "Glenelg beachside cafe and restaurant serving breakfast, casual lunch, coffee and Mediterranean-inspired meals.",
  },
  {
    name: "Charlie West Cafe Hindmarsh",
    url: "https://www.charlie-west.com.au/",
    suburb: "Hindmarsh",
    city: "Adelaide",
    state: "SA",
    address: "190 Port Road, Hindmarsh SA 5007",
    catalogs: ["https://www.charlie-west.com.au/"],
    description: "Long-running western Adelaide cafe serving coffee, breakfast, lunch and cosy casual meals.",
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

async function verifyAndSaveStore(store: AdelaideCafe, categoryId: number, ownerId: number) {
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
    throw new Error("No user found to own seeded Greater Adelaide cafe stores.");
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

  console.log(`Seeded ${savedStores} Greater Adelaide cafe and brunch stores. Verified offers: ${verifiedOffers}.`);
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
