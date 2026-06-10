import { PrismaClient } from "@prisma/client";
import { getLiveVerifiedOfferEndDate } from "../src/lib/offer-lifecycle";
import { RegionalStoreSeed, seedRegionalStores } from "./lib/seed-regional-stores";

const prisma = new PrismaClient();

const officialUrl = "https://www.incu.com/";
const saleCatalogs = [
  "https://www.incu.com/collections/sale",
  "https://www.incu.com/collections/womens-sale",
  "https://www.incu.com/collections/mens-sale",
  "https://www.incu.com/collections/shoes-sale",
];

const description =
  "Official Incu Australia boutique for curated fashion, footwear, accessories and lifestyle brands.";

const stores: RegionalStoreSeed[] = [
  {
    name: "Incu Galeries Women's",
    url: `${officialUrl}#galeries-womens-sydney-nsw`,
    websiteUrl: officialUrl,
    verificationUrl: "https://www.incu.com/collections/sale",
    suburb: "Sydney CBD",
    city: "Sydney",
    state: "NSW",
    address: "Shop RG024, The Galeries, 500 George Street, Sydney NSW 2000",
    contact: "+61 2 9266 0244",
    latitude: -33.8717,
    longitude: 151.2074,
    catalogs: saleCatalogs,
    description,
  },
  {
    name: "Incu Galeries Women's Footwear & Accessories",
    url: `${officialUrl}#galeries-womens-footwear-accessories-sydney-nsw`,
    websiteUrl: officialUrl,
    verificationUrl: "https://www.incu.com/collections/sale",
    suburb: "Sydney CBD",
    city: "Sydney",
    state: "NSW",
    address: "Shop RG020, The Galeries, 500 George Street, Sydney NSW 2000",
    contact: "+61 2 9283 7622",
    latitude: -33.8717,
    longitude: 151.2074,
    catalogs: saleCatalogs,
    description,
  },
  {
    name: "Incu Galeries Men's",
    url: `${officialUrl}#galeries-mens-sydney-nsw`,
    websiteUrl: officialUrl,
    verificationUrl: "https://www.incu.com/collections/sale",
    suburb: "Sydney CBD",
    city: "Sydney",
    state: "NSW",
    address: "Shop RLG11, The Galeries, 500 George Street, Sydney NSW 2000",
    contact: "+61 2 9283 0431",
    latitude: -33.8717,
    longitude: 151.2074,
    catalogs: saleCatalogs,
    description,
  },
  {
    name: "Incu Chatswood",
    url: `${officialUrl}#chatswood-nsw`,
    websiteUrl: officialUrl,
    verificationUrl: "https://www.incu.com/collections/sale",
    suburb: "Chatswood",
    city: "Sydney",
    state: "NSW",
    address: "Shop G-021B, Chatswood Chase, 345 Victoria Avenue, Chatswood NSW 2067",
    contact: "+61 2 8241 9500",
    latitude: -33.7956,
    longitude: 151.1848,
    catalogs: saleCatalogs,
    description,
  },
  {
    name: "Incu Bondi Beach",
    url: `${officialUrl}#bondi-beach-nsw`,
    websiteUrl: officialUrl,
    verificationUrl: "https://www.incu.com/collections/sale",
    suburb: "Bondi Beach",
    city: "Sydney",
    state: "NSW",
    address: "Shop 12-13, 178 Campbell Parade, Bondi Beach NSW 2026",
    contact: "02 8241 9510",
    latitude: -33.8908,
    longitude: 151.2767,
    catalogs: saleCatalogs,
    description,
  },
  {
    name: "Incu Paddington Women's",
    url: `${officialUrl}#paddington-womens-nsw`,
    websiteUrl: officialUrl,
    verificationUrl: "https://www.incu.com/collections/sale",
    suburb: "Paddington",
    city: "Sydney",
    state: "NSW",
    address: "258 Oxford Street, Paddington NSW 2021",
    contact: "+61 2 9357 4048",
    latitude: -33.8853,
    longitude: 151.2285,
    catalogs: saleCatalogs,
    description,
  },
  {
    name: "Incu Outlet Rosebery",
    url: `${officialUrl}#outlet-rosebery-nsw`,
    websiteUrl: officialUrl,
    verificationUrl: "https://www.incu.com/collections/sale",
    suburb: "Rosebery",
    city: "Sydney",
    state: "NSW",
    address: "110 Dunning Avenue, Rosebery NSW 2018",
    contact: "+61 2 9313 8784",
    latitude: -33.9167,
    longitude: 151.2046,
    catalogs: saleCatalogs,
    description: `${description} Outlet branch for marked-down fashion and accessories.`,
  },
  {
    name: "Incu QV Melbourne",
    url: `${officialUrl}#qv-melbourne-vic`,
    websiteUrl: officialUrl,
    verificationUrl: "https://www.incu.com/collections/sale",
    suburb: "Melbourne CBD",
    city: "Melbourne",
    state: "VIC",
    address: "Shop 12, Albert Coates Lane, Melbourne VIC 3000",
    contact: "+61 3 9654 4725",
    latitude: -37.8109,
    longitude: 144.9654,
    catalogs: saleCatalogs,
    description,
  },
  {
    name: "Incu Chadstone",
    url: `${officialUrl}#chadstone-vic`,
    websiteUrl: officialUrl,
    verificationUrl: "https://www.incu.com/collections/sale",
    suburb: "Chadstone",
    city: "Melbourne",
    state: "VIC",
    address: "Shop G-431, Chadstone Shopping Centre, 1341 Dandenong Road, Chadstone VIC 3148",
    contact: "+61 3 9569 4240",
    latitude: -37.8878,
    longitude: 145.0823,
    catalogs: saleCatalogs,
    description,
  },
  {
    name: "Incu Doncaster Women's",
    url: `${officialUrl}#doncaster-womens-vic`,
    websiteUrl: officialUrl,
    verificationUrl: "https://www.incu.com/collections/sale",
    suburb: "Doncaster",
    city: "Melbourne",
    state: "VIC",
    address: "Shop 1151, Westfield Doncaster, 619 Doncaster Road, Doncaster VIC 3108",
    contact: "+61 3 9848 7634",
    latitude: -37.7847,
    longitude: 145.1252,
    catalogs: saleCatalogs,
    description,
  },
  {
    name: "Incu Pacific Fair",
    url: `${officialUrl}#pacific-fair-qld`,
    websiteUrl: officialUrl,
    verificationUrl: "https://www.incu.com/collections/sale",
    suburb: "Broadbeach",
    city: "Gold Coast",
    state: "QLD",
    address: "Shop 2709-2710, Pacific Fair Shopping Centre, Hooker Boulevard, Broadbeach QLD 4218",
    contact: "+61 7 5538 9018",
    latitude: -28.0366,
    longitude: 153.4269,
    catalogs: saleCatalogs,
    description,
  },
];

async function copyParentOfferToBranches() {
  const now = new Date();
  const category = await prisma.category.findUnique({ where: { name: "Clothing & Fashions" } });
  if (!category) {
    return;
  }

  const parent = await prisma.store.findFirst({
    where: {
      categoryId: category.id,
      url: officialUrl,
    },
    include: {
      discounts: {
        where: {
          endDate: {
            gte: now,
          },
        },
      },
    },
  });
  const branches = await prisma.store.findMany({
    where: {
      categoryId: category.id,
      name: { startsWith: "Incu " },
      locationSource: "suburb",
    },
  });
  const parentOffer = parent?.discounts.find((discount) => discount.title === "Happening Now...") || parent?.discounts[0];
  const offer = parentOffer
    ? {
        title: "Happening Now...",
        description: parentOffer.description || "Incu sale wording found. Check the store website for live availability.",
        startDate: parentOffer.startDate,
        endDate: parentOffer.endDate,
        eCatalog: parentOffer.eCatalog.length > 0 ? parentOffer.eCatalog : saleCatalogs,
        coupon: parentOffer.coupon,
      }
    : {
        title: "Happening Now...",
        description: "Incu sale pages are available. Check the store website for live availability.",
        startDate: now,
        endDate: getLiveVerifiedOfferEndDate(now, "retailShop"),
        eCatalog: saleCatalogs,
        coupon: undefined,
      };

  for (const branch of branches) {
    await prisma.discount.upsert({
      where: {
        storeId_title: {
          storeId: branch.id,
          title: offer.title,
        },
      },
      update: {
        description: offer.description,
        startDate: offer.startDate,
        endDate: offer.endDate,
        eCatalog: offer.eCatalog,
        coupon: offer.coupon,
        updatedAt: new Date(),
      },
      create: {
        storeId: branch.id,
        ...offer,
      },
    });
  }

  console.log(`Copied Incu offer to ${branches.length} branch stores.`);
}

seedRegionalStores({
  regionName: "Australia-wide",
  categoryName: "Clothing & Fashions",
  verifierProfile: "retailShop",
  stores,
  verify: false,
}).then(copyParentOfferToBranches)
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
