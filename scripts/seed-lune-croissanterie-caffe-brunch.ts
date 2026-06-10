import { PrismaClient } from "@prisma/client";
import { OfferVerifier } from "../src/lib/offer-verifier";

const prisma = new PrismaClient();

const CATEGORY_NAME = "Caffe & Brunch";
const WEBSITE_URL = "https://lunecroissanterie.com/";

const branches = [
  {
    name: "Lune Croissanterie Armadale",
    address: "Shop 2, 835 High St",
    suburb: "Armadale",
    state: "VIC",
    postcode: "3143",
    latitude: -37.855,
    longitude: 145.02,
  },
  {
    name: "Lune Croissanterie Fitzroy",
    address: "119 Rose St",
    suburb: "Fitzroy",
    state: "VIC",
    postcode: "3065",
    latitude: -37.797,
    longitude: 144.979,
  },
  {
    name: "Lune Croissanterie Melbourne CBD Russell",
    address: "Entry via Russell St, Shop 16, 161 Collins Street",
    suburb: "Melbourne",
    state: "VIC",
    postcode: "3000",
    latitude: -37.815,
    longitude: 144.968,
  },
  {
    name: "Lune Croissanterie Melbourne CBD Lonsdale",
    address: "670 Lonsdale St",
    suburb: "Melbourne",
    state: "VIC",
    postcode: "3000",
    latitude: -37.815,
    longitude: 144.952,
  },
  {
    name: "Lune Croissanterie Brisbane CBD Burnett",
    address: "Entry via Burnett Lane, Shop 10, 79 Adelaide St",
    suburb: "Brisbane City",
    state: "QLD",
    postcode: "4000",
    latitude: -27.47,
    longitude: 153.024,
  },
  {
    name: "Lune Croissanterie South Brisbane",
    address: "Shop 1, 13-17 Manning St",
    suburb: "South Brisbane",
    state: "QLD",
    postcode: "4101",
    latitude: -27.475,
    longitude: 153.018,
  },
  {
    name: "Lune Croissanterie Rosebery",
    address: "Entry via Mentmore Ave, 115/151 Dunning Ave",
    suburb: "Rosebery",
    state: "NSW",
    postcode: "2018",
    latitude: -33.918,
    longitude: 151.202,
  },
  {
    name: "Lune Croissanterie Sydney CBD Castlereagh",
    address: "Entry via Castlereagh St, Shop N80.RT01 Metro Martin Place, 1 Elizabeth St",
    suburb: "Sydney",
    state: "NSW",
    postcode: "2000",
    latitude: -33.867,
    longitude: 151.21,
  },
];

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

async function main() {
  const owner = await prisma.user.findFirst({ orderBy: { id: "asc" } });

  if (!owner) {
    throw new Error("No user found to own seeded Lune stores.");
  }

  const category = await prisma.category.upsert({
    where: { name: CATEGORY_NAME },
    update: {},
    create: { name: CATEGORY_NAME },
  });

  const result = await OfferVerifier.verifyStoreOfferPages(WEBSITE_URL, [WEBSITE_URL], {
    country: "Australia",
    profile: "dining",
    maxPages: 8,
    requestTimeoutMs: 15000,
  });

  let created = 0;
  let updated = 0;
  let deletedOffers = 0;

  for (const branch of branches) {
    const url = `${WEBSITE_URL}#${slug(`${branch.name} ${branch.address} ${branch.suburb} ${branch.state} ${branch.postcode}`)}`;
    const existing = await prisma.store.findFirst({
      where: {
        categoryId: category.id,
        OR: [
          { url },
          { name: branch.name },
          {
            name: { contains: "Lune Croissanterie", mode: "insensitive" },
            suburb: branch.suburb,
            address: { contains: branch.address.split(",")[0], mode: "insensitive" },
          },
        ],
      },
    });

    const data = {
      name: branch.name,
      url,
      suburb: branch.suburb,
      city: branch.suburb,
      state: branch.state,
      country: "Australia",
      address: `${branch.address}, ${branch.suburb} ${branch.state} ${branch.postcode}`,
      catalogs: [WEBSITE_URL],
      sourceType: "website",
      websiteUrl: WEBSITE_URL,
      latitude: branch.latitude,
      longitude: branch.longitude,
      locationSource: "suburb",
      categoryId: category.id,
      ownerId: owner.id,
      description: "Lune Croissanterie branch location listed on the official website.",
    };

    const store = existing
      ? await prisma.store.update({ where: { id: existing.id }, data })
      : await prisma.store.create({ data });

    if (existing) {
      updated += 1;
    } else {
      created += 1;
    }

    if (!result.hasOffer) {
      const deleted = await prisma.discount.deleteMany({
        where: {
          storeId: store.id,
          OR: [
            { title: { contains: "Special Offers", mode: "insensitive" } },
            { title: "Happening Now..." },
            { eCatalog: { hasSome: ["https://lunecroissanterie.com/special-offers"] } },
          ],
        },
      });
      deletedOffers += deleted.count;
    }
  }

  console.log(
    JSON.stringify(
      {
        created,
        updated,
        deletedOffers,
        verifier: result,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
