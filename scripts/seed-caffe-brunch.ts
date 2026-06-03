import { PrismaClient } from "@prisma/client";
import { updateCatalogUrlHealth } from "../src/lib/catalog-health";
import { getLiveVerifiedOfferEndDate } from "../src/lib/offer-lifecycle";
import { OfferVerifier } from "../src/lib/offer-verifier";

const prisma = new PrismaClient();
const CATEGORY_NAME = "Caffe & Brunch";
const VERIFY_CONCURRENCY = 4;

const nationalCaffeBrunchStores = [
  { name: "The Nine Bondi", url: "https://theninesydney.com.au/", suburb: "Bondi Beach", city: "Sydney", catalogs: [] },
  { name: "Dad and the Frog Cafe", url: "https://www.dadandthefrog.com.au/", suburb: "Surry Hills", city: "Sydney", catalogs: [] },
  { name: "Calico Redfern", url: "https://www.calicoredfern.com.au/", suburb: "Redfern", city: "Sydney", catalogs: [] },
  { name: "Zenius Coffee Chippendale", url: "https://zenius.au/", suburb: "Chippendale", city: "Sydney", catalogs: [] },
  { name: "Kaska Eatery Darlinghurst", url: "https://www.kaskaeatery.com/", suburb: "Darlinghurst", city: "Sydney", catalogs: [] },
  { name: "The Rocks Cafe", url: "https://www.therockscafe.com.au/", suburb: "The Rocks", city: "Sydney", catalogs: [] },
  { name: "Room 10 Potts Point", url: "https://www.roomtenpottspoint.com.au/", suburb: "Potts Point", city: "Sydney", catalogs: [] },
  { name: "Hardware Societe Melbourne", url: "https://www.hardwaresociete.com/visit", suburb: "Melbourne", city: "Melbourne", catalogs: [] },
  { name: "Operator Diner Melbourne", url: "https://operatordiner.com.au/", suburb: "Melbourne", city: "Melbourne", catalogs: [] },
  { name: "Lune Croissanterie Melbourne", url: "https://lunecroissanterie.com/", suburb: "Melbourne", city: "Melbourne", catalogs: [] },
  { name: "Morning After Brisbane", url: "https://www.morningafter.com.au/", suburb: "West End", city: "Brisbane", catalogs: [] },
  { name: "Sisco BCL Brisbane", url: "https://siscocafe.com/", suburb: "Spring Hill", city: "Brisbane", catalogs: [] },
  { name: "Smoked Paprika Brisbane", url: "https://smokedpaprika.com.au/", suburb: "Paddington", city: "Brisbane", catalogs: [] },
  { name: "Beyond The Brew Brisbane", url: "https://beyondthebrew.com.au/", suburb: "Fitzgibbon", city: "Brisbane", catalogs: [] },
  { name: "Cleaver Heritage West Perth", url: "https://cleaverheritage.com.au/", suburb: "West Perth", city: "Perth", catalogs: [] },
  { name: "Ootong and Lincoln Fremantle", url: "https://ootongandlincoln.com/", suburb: "South Fremantle", city: "Perth", catalogs: [] },
  { name: "Mary Street Bakery Perth", url: "https://marystreetbakery.com.au/", suburb: "Highgate", city: "Perth", catalogs: ["https://marystreetbakery.com.au/locations/"] },
  { name: "Sayers Sister Perth", url: "http://www.sayerssister.au/", suburb: "Northbridge", city: "Perth", catalogs: [] },
  { name: "West End Deli Perth", url: "https://www.westenddeli.net.au/", suburb: "West Perth", city: "Perth", catalogs: [] },
  { name: "Loveon Cafe Adelaide", url: "https://loveoncafe.com.au/", suburb: "Mile End", city: "Adelaide", catalogs: [] },
  { name: "Coffylosophy Adelaide", url: "https://www.coffylosophy.com.au/", suburb: "Adelaide", city: "Adelaide", catalogs: [] },
  { name: "Lounders Boatshed Cafe Adelaide", url: "https://loundersboatshedcafe.com.au/", suburb: "Adelaide", city: "Adelaide", catalogs: [] },
  { name: "Sublime Cafe Adelaide", url: "https://www.sublimecatering.com.au/cafe", suburb: "Clarence Park", city: "Adelaide", catalogs: [] },
  { name: "The Little Poet Hobart", url: "https://www.thelittlepoet.com/", suburb: "Hobart", city: "Hobart", catalogs: [] },
  { name: "Harbour Lights Cafe Hobart", url: "https://www.harbourlightscafe.com.au/", suburb: "Hobart", city: "Hobart", catalogs: [] },
  { name: "Raincheck Lounge Hobart", url: "https://www.rainchecklounge.com/", suburb: "North Hobart", city: "Hobart", catalogs: [] },
  { name: "EQ Cafe and Bakehouse Canberra", url: "https://eqcafe.com.au/", suburb: "Deakin", city: "Canberra", catalogs: [] },
  { name: "Pollen Cafe Canberra", url: "https://www.pollencafe.com.au/", suburb: "Acton", city: "Canberra", catalogs: [] },
  { name: "Rowa Cafe Belconnen", url: "https://rowacafe.com.au/", suburb: "Belconnen", city: "Canberra", catalogs: [] },
  { name: "Forrest Specialty Coffee Canberra", url: "https://www.forrestspecialtycoffee.com.au/", suburb: "Forrest", city: "Canberra", catalogs: [] },
  { name: "Ben's Bakehouse Darwin", url: "https://www.bensbakehouse.com/", suburb: "Darwin City", city: "Darwin", catalogs: [] },
  { name: "Paddock Bakery Gold Coast", url: "https://www.paddockbakery.com/", suburb: "Burleigh Heads", city: "Gold Coast", catalogs: [] },
  { name: "Bam Bam Bakehouse Gold Coast", url: "https://bambambakehouse.com/", suburb: "Mermaid Beach", city: "Gold Coast", catalogs: [] },
  { name: "Elk Espresso Gold Coast", url: "https://elkespresso.com.au/", suburb: "Broadbeach", city: "Gold Coast", catalogs: [] },
  { name: "BSKT Cafe Gold Coast", url: "https://bskt.com.au/", suburb: "Mermaid Beach", city: "Gold Coast", catalogs: [] },
] as const;

function createOffer(storeName: string, matchedUrl: string, matchedKeywords: string[]) {
  const startDate = new Date();
  const endDate = getLiveVerifiedOfferEndDate(startDate, "dining");

  return {
    title: `${storeName} Special Offers`,
    description: `Offer wording found on the store website (${matchedKeywords.join(", ")}). Check the store website for live availability.`,
    startDate,
    endDate,
    eCatalog: [matchedUrl],
  };
}

async function verifyAndSaveStore(
  store: (typeof nationalCaffeBrunchStores)[number],
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
    profile: "dining",
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
    throw new Error("No user found to own seeded cafe and brunch stores.");
  }

  const category = await prisma.category.upsert({
    where: { name: CATEGORY_NAME },
    update: {},
    create: { name: CATEGORY_NAME },
  });

  let offerCount = 0;
  for (let index = 0; index < nationalCaffeBrunchStores.length; index += VERIFY_CONCURRENCY) {
    const batch = nationalCaffeBrunchStores.slice(index, index + VERIFY_CONCURRENCY);
    const results = await Promise.all(
      batch.map((store) => verifyAndSaveStore(store, category.id, owner.id))
    );
    offerCount += results.reduce<number>((sum, count) => sum + count, 0);
  }

  console.log(`Seeded ${nationalCaffeBrunchStores.length} ${CATEGORY_NAME} stores. Verified offers: ${offerCount}.`);
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
