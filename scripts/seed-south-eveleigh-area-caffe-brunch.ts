import { PrismaClient } from "@prisma/client";
import { updateCatalogUrlHealth } from "../src/lib/catalog-health";
import { getLiveVerifiedOfferEndDate } from "../src/lib/offer-lifecycle";
import { OfferVerifier } from "../src/lib/offer-verifier";

const prisma = new PrismaClient();
const CATEGORY_NAME = "Caffe & Brunch";
const VERIFY_CONCURRENCY = 4;

type AreaCafe = {
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

const stores: AreaCafe[] = [
  {
    name: "The Grounds Coffee Factory South Eveleigh",
    url: "https://thegrounds.com.au/dine-in/the-coffee-factory/#south-eveleigh",
    verificationUrl: "https://thegrounds.com.au/dine-in/the-coffee-factory/",
    suburb: "South Eveleigh",
    city: "Sydney",
    state: "NSW",
    address: "Bay 4A, 2 Locomotive Street, South Eveleigh NSW 2015",
    contact: "(02) 9699 2225",
    catalogs: ["https://thegrounds.com.au/dine-in/the-coffee-factory/"],
    description: "Large South Eveleigh cafe and coffee roastery serving breakfast, lunch and coffee experiences.",
    ignoredOfferUrlPatterns: [/private-dining/i, /whats-on/i],
  },
  {
    name: "The Naked Duck South Eveleigh",
    url: "https://www.thenakedduck.com.au/#south-eveleigh",
    verificationUrl: "https://www.thenakedduck.com.au/",
    suburb: "South Eveleigh",
    city: "Sydney",
    state: "NSW",
    address: "Lobby, 5 Central Avenue, Eveleigh NSW 2015",
    contact: "0425 457 214",
    catalogs: ["https://www.thenakedduck.com.au/"],
    description: "South Eveleigh cafe serving breakfast, lunch and corporate-friendly casual dining.",
  },
  {
    name: "Sette Cafe South Eveleigh",
    url: "https://www.settecafe.com.au/",
    suburb: "South Eveleigh",
    city: "Sydney",
    state: "NSW",
    address: "8 Central Avenue, Eveleigh NSW 2015",
    contact: "(02) 9698 7440",
    catalogs: ["https://www.settecafe.com.au/"],
    description: "South Eveleigh cafe offering breakfast, lunch, coffee and catering.",
  },
  {
    name: "Toby's Estate South Eveleigh",
    url: "https://www.southeveleigh.com/things-to-do/dining#tobys-estate",
    suburb: "South Eveleigh",
    city: "Sydney",
    state: "NSW",
    address: "Shop 13, 2 Central Avenue, Eveleigh NSW 2015",
    catalogs: ["https://www.southeveleigh.com/things-to-do/dining"],
    description: "South Eveleigh coffee stop listed in the precinct dining directory.",
  },
  {
    name: "Haven Coffee Green Square",
    url: "https://havencoffee.com.au/pages/green-square",
    suburb: "Zetland",
    city: "Sydney",
    state: "NSW",
    address: "Shop C1, 34 Ebsworth Street, Zetland NSW 2017",
    contact: "0424 198 914",
    catalogs: ["https://havencoffee.com.au/pages/green-square"],
    description: "Green Square brunch and specialty coffee venue in Zetland.",
  },
  {
    name: "Social Society Sydney Zetland",
    url: "https://socialsocietysydney.com/",
    suburb: "Zetland",
    city: "Sydney",
    state: "NSW",
    address: "7 Ebsworth Street, Zetland NSW 2017",
    contact: "0455 490 076",
    catalogs: ["https://socialsocietysydney.com/"],
    description: "Zetland cafe serving breakfast, brunch, lunch and coffee.",
  },
  {
    name: "noun Green Square",
    url: "https://cafenoun.com/",
    suburb: "Green Square",
    city: "Sydney",
    state: "NSW",
    address: "Green Square, Zetland NSW 2017",
    catalogs: ["https://cafenoun.com/"],
    description: "Green Square cafe by day and bar by night with brunch-friendly daytime trading.",
  },
  {
    name: "Taste Texture Alexandria",
    url: "https://www.tastetexture.com.au/",
    suburb: "Alexandria",
    city: "Sydney",
    state: "NSW",
    address: "358 Botany Road, Alexandria NSW 2015",
    catalogs: ["https://www.tastetexture.com.au/"],
    description: "Brunch, coffee, pancakes and pasta spot serving Alexandria, Green Square, Zetland and Rosebery locals.",
  },
  {
    name: "The Brothers Project Rosebery",
    url: "https://www.thebrothersproject.net/",
    suburb: "Rosebery",
    city: "Sydney",
    state: "NSW",
    address: "Shop 2, 755-759 Botany Road, Rosebery NSW 2018",
    contact: "admin@thebrothersproject.net",
    catalogs: ["https://www.thebrothersproject.net/"],
    description: "Rosebery neighbourhood cafe with Asian-inspired brunch and classic breakfast dishes.",
  },
  {
    name: "Two Fives Cafe Rosebery",
    url: "https://www.twofives.com.au/",
    suburb: "Rosebery",
    city: "Sydney",
    state: "NSW",
    address: "353 Gardeners Road, Rosebery NSW 2018",
    contact: "(02) 9669 1611",
    catalogs: ["https://www.twofives.com.au/"],
    description: "Rosebery cafe serving all-day breakfast, coffee and catering.",
  },
  {
    name: "Luxe Rosebery",
    url: "https://luxerosebery.com.au/",
    suburb: "Rosebery",
    city: "Sydney",
    state: "NSW",
    address: "19 Rosebery Avenue, Rosebery NSW 2018",
    contact: "0499 903 198",
    catalogs: ["https://luxerosebery.com.au/"],
    description: "Rosebery cafe focused on coffee, breakfast and lunch.",
  },
  {
    name: "MORE Rosebery",
    url: "https://www.moredailyritual.com.au/",
    suburb: "Rosebery",
    city: "Sydney",
    state: "NSW",
    address: "G02, 77 Dunning Avenue, Rosebery NSW 2018",
    catalogs: ["https://www.moredailyritual.com.au/"],
    description: "Rosebery weekday cafe known for matcha, coffee, bagels and brunch staples.",
  },
  {
    name: "Sub-Station Cafe Rosebery",
    url: "https://www.substation.cafe/#rosebery",
    verificationUrl: "https://www.substation.cafe/",
    suburb: "Rosebery",
    city: "Sydney",
    state: "NSW",
    address: "128 Rothschild Avenue, Rosebery NSW 2018",
    contact: "0451 142 513",
    catalogs: ["https://www.substation.cafe/"],
    description: "Rosebery cafe and catering venue serving coffee, breakfast and lunch.",
  },
  {
    name: "Black Star Pastry Rosebery",
    url: "https://www.blackstarpastry.com/locations#rosebery",
    verificationUrl: "https://www.blackstarpastry.com/locations",
    suburb: "Rosebery",
    city: "Sydney",
    state: "NSW",
    address: "C1, 85-113 Dunning Avenue, Rosebery NSW 2018",
    contact: "(02) 9557 8656",
    catalogs: ["https://www.blackstarpastry.com/locations"],
    description: "Rosebery bakery and cafe location with pastries, cakes, coffee and savoury options.",
  },
  {
    name: "Frenchies Bistro and Brewery Rosebery",
    url: "https://frenchiesbistroandbrewery.com.au/",
    suburb: "Rosebery",
    city: "Sydney",
    state: "NSW",
    address: "The Cannery, 6/61-71 Mentmore Avenue, Rosebery NSW 2018",
    contact: "02 8964 3171",
    catalogs: ["https://frenchiesbistroandbrewery.com.au/"],
    description: "Rosebery bistro, brewery and bakery with casual dining and house-made produce.",
  },
  {
    name: "La Cantina Mascot",
    url: "https://lacantinamascot.com/",
    suburb: "Mascot",
    city: "Sydney",
    state: "NSW",
    address: "289 King Street, Mascot NSW 2020",
    contact: "(02) 8668 4281",
    catalogs: ["https://lacantinamascot.com/"],
    description: "Mascot Latin cafe serving breakfast, lunch, coffee and empanadas.",
  },
  {
    name: "Kingship Coffee Mascot",
    url: "https://kingshipcoffee.com/",
    suburb: "Mascot",
    city: "Sydney",
    state: "NSW",
    address: "Shop 1, 244 Coward Street, Mascot NSW 2020",
    catalogs: ["https://kingshipcoffee.com/"],
    description: "Mascot cafe and coffee venue serving breakfast, lunch and dinner.",
  },
];

function createOffer(storeName: string, matchedUrl: string, matchedKeywords: string[]) {
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

async function verifyAndSaveStore(store: AreaCafe, categoryId: number, ownerId: number) {
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
    const offer = createOffer(store.name, matchedUrl, result.matchedKeywords);
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
      OR: [
        { title: "Happening Now..." },
        { description: { startsWith: "Offer wording found on the store website" } },
      ],
    },
  });

  console.log(
    `no-offer: ${store.name}${ignoredOffer ? ` (ignored ${result.matchedUrl})` : ""}${
      deleted.count > 0 ? ` (removed ${deleted.count})` : ""
    }`
  );
  return { store: 1, offer: 0 };
}

async function main() {
  const owner = await prisma.user.findFirst({ orderBy: { id: "asc" } });
  if (!owner) {
    throw new Error("No user found to own seeded South Eveleigh area cafe stores.");
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
    `Seeded ${savedStores} cafe and brunch stores across South Eveleigh, Zetland, Green Square, Rosebery and Mascot. Verified offers: ${verifiedOffers}.`
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
