import { PrismaClient } from "@prisma/client";
import { updateCatalogUrlHealth } from "../src/lib/catalog-health";
import { getLiveVerifiedOfferEndDate } from "../src/lib/offer-lifecycle";
import { OfferVerifier } from "../src/lib/offer-verifier";

const prisma = new PrismaClient();
const CATEGORY_NAME = "Business Attire";
const VERIFY_CONCURRENCY = 4;

const businessAttireStores = [
  { name: "InStitchu Australia", url: "https://institchu.com/", suburb: "Sydney", city: "Sydney", catalogs: ["https://institchu.com/showrooms/"] },
  { name: "Oscar Hunt Tailors", url: "https://www.oscarhunt.com.au/", suburb: "Melbourne", city: "Melbourne", catalogs: ["https://www.oscarhunt.com.au/pages/showrooms"] },
  { name: "P Johnson Tailors", url: "https://pjt.com/", suburb: "Paddington", city: "Sydney", catalogs: [] },
  { name: "REMY Sydney Tailor", url: "https://www.remy.com.au/", suburb: "Sydney", city: "Sydney", catalogs: ["https://www.remy.com.au/suits-2/"] },
  { name: "Montagio Sydney", url: "https://www.montagio.com.au/", suburb: "Sydney", city: "Sydney", catalogs: [] },
  { name: "Roman Daniels Sydney", url: "https://romandaniels.com/", suburb: "Sydney", city: "Sydney", catalogs: ["https://romandaniels.com/mens-suits/"] },
  { name: "Chokman Sydney", url: "https://www.chokman.com.au/business-suits", suburb: "Sydney", city: "Sydney", catalogs: [] },
  { name: "Brent Wilson Sydney", url: "https://www.brentwilson.com.au/", suburb: "Sydney", city: "Sydney", catalogs: ["https://www.brentwilson.com.au/collections/sale"] },
  { name: "Germanicos Bespoke Tailors", url: "https://www.germanicos.com.au/", suburb: "Melbourne", city: "Melbourne", catalogs: [] },
  { name: "The Cloakroom Brisbane", url: "https://thecloakroom.com.au/", suburb: "Brisbane", city: "Brisbane", catalogs: [] },
  { name: "Godwin Charli Melbourne", url: "https://godwincharli.com/", suburb: "Melbourne", city: "Melbourne", catalogs: ["https://godwincharli.com/collections/sale"] },
  { name: "Mens Suit Warehouse Melbourne", url: "https://menssuitwarehouse.com.au/", suburb: "Abbotsford", city: "Melbourne", catalogs: ["https://menssuitwarehouse.com.au/collections/sale"] },
  { name: "Soho Workshop Melbourne", url: "https://sohoworkshop.com.au/", suburb: "Melbourne", city: "Melbourne", catalogs: [] },
  { name: "Zac Mens Adelaide", url: "https://zacmens.com/", suburb: "Adelaide", city: "Adelaide", catalogs: [] },
  { name: "Henry Bucks Melbourne", url: "https://henrybucks.com.au/", suburb: "Melbourne", city: "Melbourne", catalogs: ["https://henrybucks.com.au/collections/sale"] },
  { name: "American Tailors Melbourne", url: "https://www.americantailors.com.au/", suburb: "Melbourne", city: "Melbourne", catalogs: [] },
  { name: "Joe Black Australia", url: "https://joeblack.com.au/", suburb: "Sydney", city: "Sydney", catalogs: ["https://joeblack.com.au/collections/sale"] },
  { name: "Rhodes & Beckett Australia", url: "https://www.rhodesbeckett.com/", suburb: "Melbourne", city: "Melbourne", catalogs: ["https://www.rhodesbeckett.com/collections/sale"] },
  { name: "Studio Italia Australia", url: "https://studioitalia.com.au/", suburb: "Melbourne", city: "Melbourne", catalogs: ["https://studioitalia.com.au/collections/sale"] },
  { name: "SABA Workwear", url: "https://www.saba.com.au/", suburb: "Melbourne", city: "Melbourne", catalogs: ["https://www.saba.com.au/collections/sale"] },
  { name: "Cue Workwear", url: "https://www.cue.com/collections/workwear", suburb: "Sydney", city: "Sydney", catalogs: ["https://www.cue.com/collections/sale"] },
  { name: "Veronika Maine Workwear", url: "https://www.veronikamaine.com.au/", suburb: "Sydney", city: "Sydney", catalogs: ["https://www.veronikamaine.com.au/collections/sale"] },
  { name: "Sportscraft Workwear", url: "https://www.sportscraft.com.au/", suburb: "Melbourne", city: "Melbourne", catalogs: ["https://www.sportscraft.com.au/c/sale"] },
  { name: "David Lawrence Workwear", url: "https://www.davidlawrence.com.au/", suburb: "Sydney", city: "Sydney", catalogs: ["https://www.davidlawrence.com.au/collections/sale"] },
  { name: "Review Workwear", url: "https://www.review-australia.com/", suburb: "Melbourne", city: "Melbourne", catalogs: ["https://www.review-australia.com/au/sale"] },
  { name: "Forcast Workwear", url: "https://www.forcast.com.au/", suburb: "Sydney", city: "Sydney", catalogs: ["https://www.forcast.com.au/collections/sale"] },
  { name: "Jacqui E Workwear", url: "https://jacquie.jgl.com.au/", suburb: "Melbourne", city: "Melbourne", catalogs: ["https://jacquie.jgl.com.au/shop/en/jacquie/sale"] },
  { name: "Commonry Workwear", url: "https://commonry.com/", suburb: "Melbourne", city: "Melbourne", catalogs: ["https://commonry.com/collections/sale"] },
  { name: "Trenery Workwear", url: "https://www.trenery.com.au/", suburb: "Melbourne", city: "Melbourne", catalogs: ["https://www.trenery.com.au/sale/"] },
  { name: "Marcs Workwear", url: "https://www.marcs.com.au/", suburb: "Sydney", city: "Sydney", catalogs: ["https://www.marcs.com.au/sale/"] },
  { name: "Forever New Workwear", url: "https://www.forevernew.com.au/", suburb: "Melbourne", city: "Melbourne", catalogs: ["https://www.forevernew.com.au/sale"] },
  { name: "Tokito Workwear", url: "https://www.myer.com.au/b/Tokito", suburb: "Melbourne", city: "Melbourne", catalogs: ["https://www.myer.com.au/c/women/womens-clothing/womens-workwear"] },
] as const;

function createOffer(storeName: string, matchedUrl: string, matchedKeywords: string[]) {
  const startDate = new Date();
  const endDate = getLiveVerifiedOfferEndDate(startDate);

  return {
    title: `${storeName} current sale and offers`,
    description: `Offer wording found on the store website (${matchedKeywords.join(", ")}). Check the store website for live availability.`,
    startDate,
    endDate,
    eCatalog: [matchedUrl],
  };
}

async function verifyAndSaveStore(
  store: (typeof businessAttireStores)[number],
  categoryId: number,
  ownerId: number
): Promise<number> {
  const savedStore = await prisma.store.upsert({
    where: { url: store.url },
    update: {
      name: store.name,
      suburb: store.suburb,
      city: store.city,
      country: "Australia",
      catalogs: [...store.catalogs],
      categoryId,
    },
    create: {
      name: store.name,
      url: store.url,
      suburb: store.suburb,
      city: store.city,
      country: "Australia",
      catalogs: [...store.catalogs],
      categoryId,
      ownerId,
    },
  });

  const result = await OfferVerifier.verifyStoreOfferPages(store.url, [...store.catalogs], {
    country: "Australia",
    profile: "retailShop",
  });
  const { removedCatalogUrls } = await updateCatalogUrlHealth(prisma, savedStore.id, [...store.catalogs], result);

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
      update: offer,
      create: {
        ...offer,
        storeId: savedStore.id,
      },
    });
    console.log(`offer: ${store.name} -> ${result.matchedKeywords.join(", ")} @ ${result.matchedUrl}`);
    return 1;
  }

  await prisma.discount.deleteMany({
    where: {
      storeId: savedStore.id,
      description: {
        startsWith: "Offer wording found on the store website",
      },
    },
  });
  console.log(`no-offer: ${store.name}`);
  return 0;
}

async function main() {
  const owner = await prisma.user.findFirst({ orderBy: { id: "asc" } });
  if (!owner) {
    throw new Error("No user found to own seeded business attire stores.");
  }

  const category = await prisma.category.upsert({
    where: { name: CATEGORY_NAME },
    update: {},
    create: { name: CATEGORY_NAME },
  });

  let offerCount = 0;
  for (let index = 0; index < businessAttireStores.length; index += VERIFY_CONCURRENCY) {
    const batch = businessAttireStores.slice(index, index + VERIFY_CONCURRENCY);
    const results = await Promise.all(
      batch.map((store) => verifyAndSaveStore(store, category.id, owner.id))
    );
    offerCount += results.reduce<number>((sum, count) => sum + count, 0);
  }

  console.log(`Seeded ${businessAttireStores.length} ${CATEGORY_NAME} stores. Verified offers: ${offerCount}.`);
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
