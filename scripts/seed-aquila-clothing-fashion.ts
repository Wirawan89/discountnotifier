import { PrismaClient } from "@prisma/client";
import { getLiveVerifiedOfferEndDate } from "../src/lib/offer-lifecycle";
import { OfferVerifier } from "../src/lib/offer-verifier";

const prisma = new PrismaClient();

const categoryName = "Business Attire";
const directCatalogs = [
  "https://www.aquila.com.au/sale",
  "https://www.aquila.com.au/sale/shoes",
  "https://aquila.com.au/collections/sale-shoes",
  "https://aquila.com.au/collections/sale-bags",
];

const stockists = [
  {
    name: "Aquila at Myer",
    url: "https://www.myer.com.au/b/Aquila",
    suburb: "Australia",
    city: "Online",
    state: "National",
    address: "Myer online Aquila brand page",
    catalogs: ["https://www.myer.com.au/b/Aquila"],
    verifyMaxPages: 1,
    description: "Aquila shoes and accessories stocked by Myer Australia.",
  },
  {
    name: "Aquila at David Jones",
    url: "https://www.davidjones.com/brand/aquila",
    suburb: "Australia",
    city: "Online",
    state: "National",
    address: "David Jones online Aquila brand page",
    catalogs: ["https://www.davidjones.com/brand/aquila", "https://www.davidjones.com/sale?text=Aquila"],
    verifyMaxPages: 1,
    description: "Aquila shoes stocked by David Jones Australia.",
  },
];

function createOffer(matchedUrl: string, matchedKeywords: string[]) {
  const startDate = new Date();
  return {
    title: "Happening Now...",
    description: `Offer wording found on the store website (${matchedKeywords.join(", ")}). Check the store website for live availability.`,
    startDate,
    endDate: getLiveVerifiedOfferEndDate(startDate, "retailShop"),
    eCatalog: [matchedUrl],
  };
}

async function verifyStore(storeId: number, name: string, verificationUrl: string, catalogs: string[], maxPages = 8) {
  const result = await OfferVerifier.verifyStoreOfferPages(verificationUrl, catalogs, {
    country: "Australia",
    profile: "retailShop",
    maxPages,
    requestTimeoutMs: 15000,
  });

  await prisma.discount.deleteMany({
    where: {
      storeId,
      OR: [
        { title: "Happening Now..." },
        { description: { startsWith: "Offer wording found on the store website" } },
        { title: { contains: "current sale and offers", mode: "insensitive" } },
      ],
    },
  });

  if (result.hasOffer && result.matchedUrl) {
    const offer = createOffer(result.matchedUrl, result.matchedKeywords);
    await prisma.discount.upsert({
      where: {
        storeId_title: {
          storeId,
          title: offer.title,
        },
      },
      update: {
        ...offer,
        updatedAt: new Date(),
      },
      create: {
        ...offer,
        storeId,
      },
    });
    console.log(`offer: ${name} -> ${result.matchedKeywords.join(", ")} @ ${result.matchedUrl}`);
    return 1;
  }

  console.log(`no-offer: ${name}`);
  return 0;
}

async function main() {
  const owner = await prisma.user.findFirst({ orderBy: { id: "asc" } });
  if (!owner) {
    throw new Error("No user found to own seeded Aquila stores.");
  }

  const category = await prisma.category.upsert({
    where: { name: categoryName },
    update: {},
    create: { name: categoryName },
  });

  const aquilaStores = await prisma.store.findMany({
    where: {
      OR: [
        { name: { startsWith: "Aquila", mode: "insensitive" } },
        { url: { contains: "aquila.com.au", mode: "insensitive" } },
        { websiteUrl: { contains: "aquila.com.au", mode: "insensitive" } },
      ],
      NOT: [{ name: { contains: "David Jones", mode: "insensitive" } }, { name: { contains: "Myer", mode: "insensitive" } }],
    },
    select: {
      id: true,
      name: true,
      url: true,
      websiteUrl: true,
    },
  });

  let savedStores = 0;
  let verifiedOffers = 0;

  for (const store of aquilaStores) {
    const websiteUrl = store.websiteUrl || "https://www.aquila.com.au/home";
    await prisma.store.update({
      where: { id: store.id },
      data: {
        categoryId: category.id,
        catalogs: directCatalogs,
        websiteUrl,
        country: "Australia",
      },
    });
    savedStores += 1;
    verifiedOffers += await verifyStore(store.id, store.name, websiteUrl, directCatalogs, 8);
  }

  for (const stockist of stockists) {
    const saved = await prisma.store.upsert({
      where: { url: stockist.url },
      update: {
        name: stockist.name,
        suburb: stockist.suburb,
        city: stockist.city,
        state: stockist.state,
        country: "Australia",
        address: stockist.address,
        description: stockist.description,
        catalogs: stockist.catalogs,
        sourceType: "website",
        websiteUrl: stockist.url,
        locationSource: "online",
        categoryId: category.id,
      },
      create: {
        name: stockist.name,
        url: stockist.url,
        suburb: stockist.suburb,
        city: stockist.city,
        state: stockist.state,
        country: "Australia",
        address: stockist.address,
        description: stockist.description,
        catalogs: stockist.catalogs,
        sourceType: "website",
        websiteUrl: stockist.url,
        locationSource: "online",
        categoryId: category.id,
        ownerId: owner.id,
      },
    });

    savedStores += 1;
    verifiedOffers += await verifyStore(saved.id, stockist.name, stockist.url, stockist.catalogs, stockist.verifyMaxPages);
  }

  console.log(`Seeded/updated ${savedStores} Aquila Clothing & Fashions stores. Verified offers: ${verifiedOffers}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
