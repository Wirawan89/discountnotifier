import { PrismaClient } from "@prisma/client";
import { getLiveVerifiedOfferEndDate } from "../src/lib/offer-lifecycle";

const prisma = new PrismaClient();

const CATEGORY_NAME = "Business Attire";
const DAVID_JONES_URL = "https://www.davidjones.com/brand/ted-baker";
const THE_ICONIC_URL = "https://www.theiconic.com.au/ted-baker/";
const OFFER_DESCRIPTION =
  "Offer wording found on the store website (sale, on sale, reduced to clear, offers, save, % off). Check the store website for live availability.";

const stockists = [
  {
    name: "Ted Baker at David Jones Online",
    url: DAVID_JONES_URL,
    suburb: "Australia",
    city: "Online",
    state: "National",
    address: "David Jones online Ted Baker brand page",
    catalogs: [DAVID_JONES_URL],
    discountUrls: [DAVID_JONES_URL],
  },
  {
    name: "Ted Baker at THE ICONIC Online",
    url: THE_ICONIC_URL,
    suburb: "Australia",
    city: "Online",
    state: "National",
    address: "THE ICONIC online Ted Baker brand page",
    catalogs: [THE_ICONIC_URL],
    discountUrls: [THE_ICONIC_URL],
  },
];

const branches = [
  {
    name: "Ted Baker Bondi Junction",
    suburb: "Bondi Junction",
    city: "Sydney",
    state: "NSW",
    address: "Westfield Bondi Junction, Bondi Junction NSW",
    latitude: -33.891626,
    longitude: 151.250738,
  },
  {
    name: "Ted Baker Chatswood",
    suburb: "Chatswood",
    city: "Sydney",
    state: "NSW",
    address: "Chatswood Chase, Chatswood NSW",
    latitude: -33.794178,
    longitude: 151.186011,
  },
  {
    name: "Ted Baker Melbourne",
    suburb: "Melbourne",
    city: "Melbourne",
    state: "VIC",
    address: "Emporium Melbourne, Melbourne VIC",
    latitude: -37.812517,
    longitude: 144.963555,
  },
  {
    name: "Ted Baker Indooroopilly",
    suburb: "Indooroopilly",
    city: "Brisbane",
    state: "QLD",
    address: "Indooroopilly Shopping Centre, Indooroopilly QLD",
    latitude: -27.499614,
    longitude: 152.972645,
  },
  {
    name: "Ted Baker Sydney",
    suburb: "Sydney",
    city: "Sydney",
    state: "NSW",
    address: "Westfield Sydney, Sydney NSW",
    latitude: -33.870516,
    longitude: 151.208263,
  },
  {
    name: "Ted Baker Adelaide",
    suburb: "Adelaide",
    city: "Adelaide",
    state: "SA",
    address: "Rundle Mall, Adelaide SA",
    latitude: -34.922848,
    longitude: 138.601902,
  },
  {
    name: "Ted Baker Chadstone",
    suburb: "Chadstone",
    city: "Melbourne",
    state: "VIC",
    address: "Chadstone The Fashion Capital, Chadstone VIC",
    latitude: -37.886039,
    longitude: 145.083461,
  },
].map((branch) => {
  const slug = `${branch.suburb}-${branch.state}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return {
    ...branch,
    url: `${DAVID_JONES_URL}#${slug}`,
    catalogs: [DAVID_JONES_URL, THE_ICONIC_URL],
    discountUrls: [DAVID_JONES_URL, THE_ICONIC_URL],
  };
});

type SeedItem = (typeof stockists)[number] | (typeof branches)[number];

function latitudeOf(item: SeedItem) {
  return "latitude" in item ? item.latitude : undefined;
}

function longitudeOf(item: SeedItem) {
  return "longitude" in item ? item.longitude : undefined;
}

async function main() {
  const owner = await prisma.user.findFirst({ orderBy: { id: "asc" } });
  if (!owner) throw new Error("No owner user found");

  const category = await prisma.category.upsert({
    where: { name: CATEGORY_NAME },
    update: {},
    create: { name: CATEGORY_NAME },
  });

  const now = new Date();
  const saved = [];

  for (const item of [...stockists, ...branches]) {
    const store = await prisma.store.upsert({
      where: { url: item.url },
      update: {
        name: item.name,
        suburb: item.suburb,
        city: item.city,
        state: item.state,
        country: "Australia",
        address: item.address,
        description:
          "Mainline Ted Baker listing for Business Attire. Outlet-specific Ted Baker rows stay in Factory Outlets.",
        catalogs: item.catalogs,
        sourceType: "website",
        websiteUrl: item.catalogs[0],
        locationSource: item.city === "Online" ? "online" : "suburb",
        latitude: latitudeOf(item),
        longitude: longitudeOf(item),
        categoryId: category.id,
      },
      create: {
        name: item.name,
        url: item.url,
        suburb: item.suburb,
        city: item.city,
        state: item.state,
        country: "Australia",
        address: item.address,
        description:
          "Mainline Ted Baker listing for Business Attire. Outlet-specific Ted Baker rows stay in Factory Outlets.",
        catalogs: item.catalogs,
        sourceType: "website",
        websiteUrl: item.catalogs[0],
        locationSource: item.city === "Online" ? "online" : "suburb",
        latitude: latitudeOf(item),
        longitude: longitudeOf(item),
        categoryId: category.id,
        ownerId: owner.id,
      },
    });

    await prisma.discount.upsert({
      where: {
        storeId_title: {
          storeId: store.id,
          title: "Happening Now...",
        },
      },
      update: {
        description: OFFER_DESCRIPTION,
        startDate: now,
        endDate: getLiveVerifiedOfferEndDate(now, "retailShop"),
        eCatalog: item.discountUrls,
        updatedAt: now,
      },
      create: {
        storeId: store.id,
        title: "Happening Now...",
        description: OFFER_DESCRIPTION,
        startDate: now,
        endDate: getLiveVerifiedOfferEndDate(now, "retailShop"),
        eCatalog: item.discountUrls,
      },
    });

    saved.push({
      id: store.id,
      name: store.name,
      url: store.url,
      categoryId: store.categoryId,
    });
  }

  console.log(JSON.stringify({ savedCount: saved.length, saved }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
