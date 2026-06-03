import { PrismaClient } from "@prisma/client";
import { updateCatalogUrlHealth } from "../src/lib/catalog-health";
import { getLiveVerifiedOfferEndDate } from "../src/lib/offer-lifecycle";
import { OfferVerifier } from "../src/lib/offer-verifier";

const prisma = new PrismaClient();
const CATEGORY_NAME = "Caffe & Brunch";
const VERIFY_CONCURRENCY = 4;

type CapitalCafe = {
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

const stores: CapitalCafe[] = [
  {
    name: "Higher Ground Melbourne",
    url: "https://highergroundmelbourne.com.au/",
    suburb: "Melbourne",
    city: "Melbourne",
    state: "VIC",
    address: "650 Little Bourke Street, Melbourne VIC 3000",
    contact: "03 8899 6219",
    catalogs: ["https://highergroundmelbourne.com.au/"],
    description: "Melbourne CBD brunch destination serving elevated breakfast, coffee and all-day cafe dining.",
  },
  {
    name: "The Hardware Societe Melbourne",
    url: "https://www.hardwaresociete.com/",
    suburb: "Melbourne",
    city: "Melbourne",
    state: "VIC",
    address: "10 Katherine Place, Melbourne VIC 3000",
    catalogs: ["https://www.hardwaresociete.com/"],
    description: "Melbourne cafe known for French and Spanish-inspired breakfast and brunch.",
  },
  {
    name: "Operator25 Melbourne",
    url: "https://operator25.com.au/",
    suburb: "Melbourne",
    city: "Melbourne",
    state: "VIC",
    address: "25 Wills Street, Melbourne VIC 3000",
    catalogs: ["https://operator25.com.au/"],
    description: "Melbourne CBD cafe serving specialty coffee, brunch and Asian-inspired breakfast dishes.",
  },
  {
    name: "Lune Croissanterie Melbourne",
    url: "https://lunecroissanterie.com/",
    suburb: "Melbourne",
    city: "Melbourne",
    state: "VIC",
    address: "Melbourne VIC 3000",
    catalogs: ["https://lunecroissanterie.com/"],
    description: "Melbourne croissanterie and bakery cafe serving coffee, pastries and takeaway baked goods.",
    ignoredOfferUrlPatterns: [/special-offers/i],
  },
  {
    name: "Humble Rays Carlton",
    url: "https://humblerays.com.au/",
    suburb: "Carlton",
    city: "Melbourne",
    state: "VIC",
    address: "71 Bouverie Street, Carlton VIC 3053",
    catalogs: ["https://humblerays.com.au/"],
    description: "Carlton cafe serving colourful brunch, coffee and Asian-influenced cafe food.",
  },
  {
    name: "Archie's All Day Fitzroy",
    url: "https://www.archiesallday.com.au/",
    suburb: "Fitzroy",
    city: "Melbourne",
    state: "VIC",
    address: "189 Gertrude Street, Fitzroy VIC 3065",
    catalogs: ["https://www.archiesallday.com.au/"],
    description: "Fitzroy all-day cafe and diner serving breakfast, brunch, coffee and casual meals.",
  },
  {
    name: "Industry Beans Fitzroy",
    url: "https://industrybeans.com/pages/fitzroy",
    suburb: "Fitzroy",
    city: "Melbourne",
    state: "VIC",
    address: "70-76 Westgarth Street, Fitzroy VIC 3065",
    catalogs: ["https://industrybeans.com/pages/fitzroy"],
    description: "Fitzroy specialty coffee roastery and brunch cafe.",
  },
  {
    name: "Seven Seeds Carlton",
    url: "https://sevenseeds.com.au/",
    suburb: "Carlton",
    city: "Melbourne",
    state: "VIC",
    address: "114 Berkeley Street, Carlton VIC 3053",
    catalogs: ["https://sevenseeds.com.au/"],
    description: "Carlton coffee roaster and cafe serving breakfast, lunch and specialty coffee.",
  },
  {
    name: "Top Paddock Richmond",
    url: "https://toppaddockcafe.com/",
    suburb: "Richmond",
    city: "Melbourne",
    state: "VIC",
    address: "658 Church Street, Richmond VIC 3121",
    catalogs: ["https://toppaddockcafe.com/"],
    description: "Richmond brunch cafe known for refined breakfast dishes and specialty coffee.",
  },
  {
    name: "Auction Rooms North Melbourne",
    url: "https://auctionroomscafe.com.au/",
    suburb: "North Melbourne",
    city: "Melbourne",
    state: "VIC",
    address: "103-107 Errol Street, North Melbourne VIC 3051",
    catalogs: ["https://auctionroomscafe.com.au/"],
    description: "North Melbourne cafe and coffee institution serving breakfast, brunch and lunch.",
  },
  {
    name: "Morning After West End",
    url: "https://www.morningafter.com.au/",
    suburb: "West End",
    city: "Brisbane",
    state: "QLD",
    address: "Cambridge Street, West End QLD 4101",
    catalogs: ["https://www.morningafter.com.au/"],
    description: "West End cafe serving all-day breakfast, specialty coffee and relaxed brunch.",
    ignoredOfferUrlPatterns: [/shop/i, /anniversary/i],
  },
  {
    name: "Pawpaw Cafe Woolloongabba",
    url: "https://pawpawcafe.com.au/",
    suburb: "Woolloongabba",
    city: "Brisbane",
    state: "QLD",
    address: "898 Stanley Street East, Woolloongabba QLD 4102",
    catalogs: ["https://pawpawcafe.com.au/"],
    description: "Woolloongabba cafe and brunch venue serving breakfast, lunch and coffee.",
  },
  {
    name: "King Arthur Fortitude Valley",
    url: "https://www.kingarthur.com.au/",
    suburb: "Fortitude Valley",
    city: "Brisbane",
    state: "QLD",
    address: "164C Arthur Street, Fortitude Valley QLD 4006",
    catalogs: ["https://www.kingarthur.com.au/"],
    description: "Fortitude Valley cafe serving seasonal brunch, coffee and lunch.",
  },
  {
    name: "Nodo Newstead",
    url: "https://nododonuts.com/pages/newstead",
    suburb: "Newstead",
    city: "Brisbane",
    state: "QLD",
    address: "1 Ella Street, Newstead QLD 4006",
    catalogs: ["https://nododonuts.com/pages/newstead"],
    description: "Newstead cafe and bakery serving brunch, coffee and gluten-free doughnuts.",
  },
  {
    name: "Little Loco New Farm",
    url: "https://littleloco.com.au/",
    suburb: "New Farm",
    city: "Brisbane",
    state: "QLD",
    address: "121 Merthyr Road, New Farm QLD 4005",
    catalogs: ["https://littleloco.com.au/"],
    description: "New Farm cafe serving coffee, breakfast and neighbourhood brunch.",
  },
  {
    name: "Felix for Goodness Brisbane",
    url: "https://www.felixforgoodness.com/",
    suburb: "Brisbane City",
    city: "Brisbane",
    state: "QLD",
    address: "50 Burnett Lane, Brisbane City QLD 4000",
    catalogs: ["https://www.felixforgoodness.com/"],
    description: "Brisbane laneway cafe serving seasonal breakfast, lunch and coffee.",
  },
  {
    name: "Anouk Cafe Paddington",
    url: "https://anoukcafe.com.au/",
    suburb: "Paddington",
    city: "Brisbane",
    state: "QLD",
    address: "212 Given Terrace, Paddington QLD 4064",
    catalogs: ["https://anoukcafe.com.au/"],
    description: "Paddington cafe serving breakfast, brunch, lunch and coffee.",
  },
  {
    name: "Naim Paddington",
    url: "https://www.naimrestaurant.com.au/",
    suburb: "Paddington",
    city: "Brisbane",
    state: "QLD",
    address: "14 Collingwood Street, Paddington QLD 4064",
    catalogs: ["https://www.naimrestaurant.com.au/"],
    description: "Paddington restaurant and cafe serving brunch, coffee and Middle Eastern-inspired food.",
  },
  {
    name: "Industry Beans Newstead",
    url: "https://industrybeans.com/pages/newstead",
    suburb: "Newstead",
    city: "Brisbane",
    state: "QLD",
    address: "18 Proe Street, Newstead QLD 4006",
    catalogs: ["https://industrybeans.com/pages/newstead"],
    description: "Newstead specialty coffee and brunch cafe from Industry Beans.",
  },
  {
    name: "La Veen Coffee Perth",
    url: "https://laveencoffee.com.au/",
    suburb: "Perth",
    city: "Perth",
    state: "WA",
    address: "90 King Street, Perth WA 6000",
    catalogs: ["https://laveencoffee.com.au/"],
    description: "Perth CBD coffee and brunch cafe serving specialty coffee and breakfast.",
  },
  {
    name: "Hylin West Leederville",
    url: "https://www.hylin.com.au/",
    suburb: "West Leederville",
    city: "Perth",
    state: "WA",
    address: "178 Railway Parade, West Leederville WA 6007",
    catalogs: ["https://www.hylin.com.au/"],
    description: "West Leederville brunch cafe serving breakfast, lunch, coffee and happy hour.",
  },
  {
    name: "Mary Street Bakery Highgate",
    url: "https://www.marystreetbakery.com.au/",
    suburb: "Highgate",
    city: "Perth",
    state: "WA",
    address: "507 Beaufort Street, Highgate WA 6003",
    catalogs: ["https://www.marystreetbakery.com.au/"],
    description: "Perth bakery and cafe institution serving pastries, coffee and brunch.",
  },
  {
    name: "Sayers Sister Northbridge",
    url: "https://sayerssister.com.au/",
    suburb: "Northbridge",
    city: "Perth",
    state: "WA",
    address: "236 Lake Street, Northbridge WA 6003",
    catalogs: ["https://sayerssister.com.au/"],
    description: "Northbridge cafe serving breakfast, brunch, lunch and coffee.",
  },
  {
    name: "Tiisch Perth",
    url: "https://www.tiisch.com.au/",
    suburb: "Perth",
    city: "Perth",
    state: "WA",
    address: "9B/938 Hay Street, Perth WA 6000",
    catalogs: ["https://www.tiisch.com.au/"],
    description: "Perth cafe and restaurant serving brunch, coffee and bottomless brunch.",
  },
  {
    name: "Ootong and Lincoln South Fremantle",
    url: "https://ootongandlincoln.com/",
    suburb: "South Fremantle",
    city: "Perth",
    state: "WA",
    address: "258 South Terrace, South Fremantle WA 6162",
    catalogs: ["https://ootongandlincoln.com/"],
    description: "South Fremantle vintage cafe serving brunch, pastries and coffee.",
  },
  {
    name: "La Galette Nedlands",
    url: "https://www.lagalette.com.au/",
    suburb: "Nedlands",
    city: "Perth",
    state: "WA",
    address: "Shop 4, 160 Hampden Road, Nedlands WA 6009",
    contact: "08 6162 9412",
    catalogs: ["https://www.lagalette.com.au/"],
    description: "Nedlands Parisian-style cafe and patisserie serving light meals, pastries and coffee.",
  },
  {
    name: "Daisies Cottesloe",
    url: "https://daisiescottesloe.com.au/",
    suburb: "Cottesloe",
    city: "Perth",
    state: "WA",
    address: "305 Marmion Street, Cottesloe WA 6011",
    catalogs: ["https://daisiescottesloe.com.au/"],
    description: "Cottesloe cafe and bakery serving coffee, pastries and casual brunch.",
  },
  {
    name: "Exchange Coffee Adelaide",
    url: "https://exchangecoffee.com.au/",
    suburb: "Adelaide",
    city: "Adelaide",
    state: "SA",
    address: "12-18 Vardon Avenue, Adelaide SA 5000",
    catalogs: ["https://exchangecoffee.com.au/"],
    description: "Adelaide specialty coffee bar and brunch cafe.",
  },
  {
    name: "Peter Rabbit Adelaide",
    url: "https://www.peterabbit.com.au/cafe",
    suburb: "Adelaide",
    city: "Adelaide",
    state: "SA",
    address: "234-244 Hindley Street, Adelaide SA 5000",
    catalogs: ["https://www.peterabbit.com.au/cafe"],
    description: "Adelaide garden cafe serving breakfast, brunch, lunch and coffee.",
  },
  {
    name: "Part Time Lover Adelaide",
    url: "https://parttimelover.com.au/",
    suburb: "Adelaide",
    city: "Adelaide",
    state: "SA",
    address: "Paul Kelly Lane, Adelaide SA 5000",
    catalogs: ["https://parttimelover.com.au/"],
    description: "Adelaide cafe and restaurant serving coffee, brunch, lunch and dinner.",
  },
  {
    name: "Whistle and Flute Unley",
    url: "https://whistleandflute.com.au/",
    suburb: "Unley",
    city: "Adelaide",
    state: "SA",
    address: "136 Greenhill Road, Unley SA 5061",
    catalogs: ["https://whistleandflute.com.au/"],
    description: "Unley cafe serving breakfast, lunch, coffee and brunch.",
  },
  {
    name: "Coffylosophy Adelaide",
    url: "https://www.coffylosophy.com.au/",
    suburb: "Adelaide",
    city: "Adelaide",
    state: "SA",
    address: "198A Hutt Street, Adelaide SA 5000",
    catalogs: ["https://www.coffylosophy.com.au/"],
    description: "Hutt Street cafe serving coffee, breakfast, brunch, lunch and all-day meals.",
  },
  {
    name: "94 West Findon",
    url: "https://www.94west.com.au/",
    suburb: "Findon",
    city: "Adelaide",
    state: "SA",
    address: "94 Findon Road, Findon SA 5023",
    catalogs: ["https://www.94west.com.au/"],
    description: "Findon cafe serving breakfast, brunch, lunch and coffee.",
  },
  {
    name: "The Loose Caboose Hindmarsh",
    url: "https://www.theloosecaboose.com.au/",
    suburb: "Hindmarsh",
    city: "Adelaide",
    state: "SA",
    address: "21 First Street, Hindmarsh SA 5007",
    catalogs: ["https://www.theloosecaboose.com.au/"],
    description: "Hindmarsh cafe known for brunch, coffee and breakfast dishes.",
  },
  {
    name: "Cafe Troppo Adelaide",
    url: "https://cafetroppoadelaide.com/",
    suburb: "Adelaide",
    city: "Adelaide",
    state: "SA",
    address: "42 Whitmore Square, Adelaide SA 5000",
    catalogs: ["https://cafetroppoadelaide.com/"],
    description: "Adelaide community cafe serving seasonal brunch, coffee, wine and music.",
  },
  {
    name: "My Kingdom for a Horse Adelaide",
    url: "https://mykingdomforahorse.com.au/",
    suburb: "Adelaide",
    city: "Adelaide",
    state: "SA",
    address: "191 Wright Street, Adelaide SA 5000",
    catalogs: ["https://mykingdomforahorse.com.au/"],
    description: "Adelaide cafe and coffee roaster serving breakfast, brunch and lunch.",
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

async function verifyAndSaveStore(store: CapitalCafe, categoryId: number, ownerId: number) {
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
    throw new Error("No user found to own seeded capital city cafe stores.");
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

  console.log(`Seeded ${savedStores} Melbourne, Brisbane, Perth and Adelaide cafe stores. Verified offers: ${verifiedOffers}.`);
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
