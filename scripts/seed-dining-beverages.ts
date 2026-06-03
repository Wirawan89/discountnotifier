import { PrismaClient } from "@prisma/client";
import { updateCatalogUrlHealth } from "../src/lib/catalog-health";
import { getLiveVerifiedOfferEndDate } from "../src/lib/offer-lifecycle";
import { OfferVerifier } from "../src/lib/offer-verifier";

const prisma = new PrismaClient();
const CATEGORY_NAME = "Dining & Beverages";
const VERIFY_CONCURRENCY = 4;

const nationalDiningStores = [
  {
    name: "Mjolner Sydney",
    url: "https://mjolner.com.au/sydney/",
    suburb: "Sydney",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Munich Brauhaus The Rocks",
    url: "https://munichbrauhaus.com.au/locations/the-rocks/",
    suburb: "The Rocks",
    city: "Sydney",
    catalogs: ["https://munichbrauhaus.com.au/whats-on/"],
  },
  {
    name: "Cafe Sydney",
    url: "https://cafesydney.com/",
    suburb: "Sydney",
    city: "Sydney",
    catalogs: ["https://cafesydney.com/whats-on/"],
  },
  { name: "Quay Sydney", url: "https://www.quay.com.au/", suburb: "The Rocks", city: "Sydney", catalogs: [] },
  { name: "Aria Sydney", url: "https://www.ariasydney.com.au/", suburb: "Sydney", city: "Sydney", catalogs: [] },
  { name: "Icebergs Dining Room and Bar", url: "https://idrb.com/", suburb: "Bondi Beach", city: "Sydney", catalogs: [] },
  { name: "Margaret Double Bay", url: "https://margaretdoublebay.com/", suburb: "Double Bay", city: "Sydney", catalogs: [] },
  { name: "Bistecca Sydney", url: "https://bistecca.com.au/", suburb: "Sydney", city: "Sydney", catalogs: [] },
  { name: "Poetica North Sydney", url: "https://www.poetica.sydney/", suburb: "North Sydney", city: "Sydney", catalogs: ["https://www.poetica.sydney/whats-on"] },
  { name: "Burrow Bar Sydney", url: "https://burrow.bar/", suburb: "Sydney", city: "Sydney", catalogs: [] },
  { name: "Jacoby's Tiki Bar", url: "https://jacobys.sydney/", suburb: "Enmore", city: "Sydney", catalogs: [] },
  { name: "Embla Melbourne", url: "https://embla.com.au/", suburb: "Melbourne", city: "Melbourne", catalogs: [] },
  { name: "Chin Chin Melbourne", url: "https://www.chinchin.melbourne/", suburb: "Melbourne", city: "Melbourne", catalogs: ["https://www.chinchin.melbourne/whats-on/"] },
  { name: "Supernormal Melbourne", url: "https://supernormal.net.au/", suburb: "Melbourne", city: "Melbourne", catalogs: [] },
  { name: "Vue de Monde Melbourne", url: "https://vuedemonde.com.au/", suburb: "Melbourne", city: "Melbourne", catalogs: [] },
  { name: "MoVida Melbourne", url: "https://movida.com.au/", suburb: "Melbourne", city: "Melbourne", catalogs: [] },
  { name: "Caretaker's Cottage Melbourne", url: "https://caretakerscottage.bar/", suburb: "Melbourne", city: "Melbourne", catalogs: [] },
  { name: "Apollo Inn Melbourne", url: "https://apolloinn.bar/", suburb: "Melbourne", city: "Melbourne", catalogs: [] },
  { name: "Mjolner Melbourne", url: "https://mjolner.com.au/melbourne/", suburb: "Melbourne", city: "Melbourne", catalogs: [] },
  { name: "Agnes Brisbane", url: "https://agnesrestaurant.com.au/", suburb: "Fortitude Valley", city: "Brisbane", catalogs: [] },
  { name: "Felons Brewing Co Brisbane", url: "https://felonsbrewingco.com.au/", suburb: "Brisbane City", city: "Brisbane", catalogs: ["https://felonsbrewingco.com.au/whats-on/"] },
  { name: "Greca Brisbane", url: "https://greca.com.au/", suburb: "Brisbane City", city: "Brisbane", catalogs: [] },
  { name: "Gerard's Bistro Brisbane", url: "https://gerardsbistro.com.au/", suburb: "Fortitude Valley", city: "Brisbane", catalogs: [] },
  { name: "The Gresham Brisbane", url: "https://www.thegresham.com.au/", suburb: "Brisbane City", city: "Brisbane", catalogs: [] },
  { name: "Savile Row Brisbane", url: "https://www.savilerowbrisbane.com.au/", suburb: "Fortitude Valley", city: "Brisbane", catalogs: [] },
  { name: "Blackbird Bar and Grill Brisbane", url: "https://blackbirdbrisbane.com.au/", suburb: "Brisbane City", city: "Brisbane", catalogs: ["https://blackbirdbrisbane.com.au/whats-on/"] },
  { name: "Wildflower Perth", url: "https://wildflowerperth.com.au/", suburb: "Perth", city: "Perth", catalogs: [] },
  { name: "Long Chim Perth", url: "https://www.longchimperth.com/", suburb: "Perth", city: "Perth", catalogs: [] },
  { name: "Petition Perth", url: "https://petitionperth.com/", suburb: "Perth", city: "Perth", catalogs: [] },
  { name: "Print Hall Perth", url: "https://printhall.com.au/", suburb: "Perth", city: "Perth", catalogs: ["https://printhall.com.au/whats-on/"] },
  { name: "Balthazar Perth", url: "https://balthazar.com.au/", suburb: "Perth", city: "Perth", catalogs: [] },
  { name: "Africola Adelaide", url: "https://africola.com.au/", suburb: "Adelaide", city: "Adelaide", catalogs: [] },
  { name: "Shobosho Adelaide", url: "https://shobosho.com.au/", suburb: "Adelaide", city: "Adelaide", catalogs: [] },
  { name: "Peel St Adelaide", url: "https://www.peelst.com.au/", suburb: "Adelaide", city: "Adelaide", catalogs: [] },
  { name: "2KW Bar and Restaurant Adelaide", url: "https://2kwbar.com.au/", suburb: "Adelaide", city: "Adelaide", catalogs: ["https://2kwbar.com.au/whats-on/"] },
  { name: "Hains & Co Adelaide", url: "https://hainsco.com.au/", suburb: "Adelaide", city: "Adelaide", catalogs: [] },
  { name: "Maybe Mae Adelaide", url: "https://maybemae.com/", suburb: "Adelaide", city: "Adelaide", catalogs: [] },
  { name: "Fugazzi Adelaide", url: "https://fugazzi.com.au/", suburb: "Adelaide", city: "Adelaide", catalogs: [] },
  { name: "Cascade Brewery Bar Hobart", url: "https://cascadebrewerybar.com.au/", suburb: "South Hobart", city: "Hobart", catalogs: ["https://cascadebrewerybar.com.au/whats-on/"] },
  { name: "Hobart Brewing Co", url: "https://www.hobartbrewingco.com.au/", suburb: "Hobart", city: "Hobart", catalogs: ["https://www.hobartbrewingco.com.au/events"] },
  { name: "Fico Hobart", url: "https://ficofico.net/", suburb: "Hobart", city: "Hobart", catalogs: [] },
  { name: "Aloft Hobart", url: "https://aloftrestaurant.com/", suburb: "Hobart", city: "Hobart", catalogs: [] },
  { name: "The Glass House Hobart", url: "https://www.theglass.house/", suburb: "Hobart", city: "Hobart", catalogs: [] },
  { name: "Landscape Restaurant Hobart", url: "https://www.landscaperestaurant.com.au/", suburb: "Hobart", city: "Hobart", catalogs: [] },
  { name: "Wharf One Darwin", url: "https://wharfone.com.au/", suburb: "Darwin City", city: "Darwin", catalogs: [] },
  { name: "Hot Tamale Darwin", url: "https://hottamale.net.au/", suburb: "Darwin City", city: "Darwin", catalogs: ["https://hottamale.net.au/whats-on/"] },
  { name: "Charlie's of Darwin", url: "https://charliesofdarwin.com.au/", suburb: "Darwin City", city: "Darwin", catalogs: [] },
  { name: "Stone House Wine Bar Darwin", url: "https://stonehousewinebar.com.au/", suburb: "Darwin City", city: "Darwin", catalogs: [] },
  { name: "Pilot Canberra", url: "https://pilotrestaurant.com/", suburb: "Ainslie", city: "Canberra", catalogs: [] },
  { name: "Bar Rochford Canberra", url: "https://barrochford.com/", suburb: "Canberra", city: "Canberra", catalogs: [] },
  { name: "Akiba Canberra", url: "https://akiba.com.au/", suburb: "Canberra", city: "Canberra", catalogs: ["https://akiba.com.au/whats-on/"] },
  { name: "Rick Shores Burleigh Heads", url: "https://rickshores.com.au/", suburb: "Burleigh Heads", city: "Gold Coast", catalogs: [] },
  { name: "Etsu Izakaya Gold Coast", url: "https://etsu.com.au/", suburb: "Mermaid Beach", city: "Gold Coast", catalogs: [] },
  { name: "The North Room Gold Coast", url: "https://thenorthroom.com.au/", suburb: "Mermaid Beach", city: "Gold Coast", catalogs: [] },
] as const;

function createOffer(storeName: string, matchedUrl: string, matchedKeywords: string[]) {
  const startDate = new Date();
  const endDate = getLiveVerifiedOfferEndDate(startDate, "dining");

  const title = matchedKeywords.some((keyword) => /happy hour/i.test(keyword))
    ? `${storeName} Happy Hour and Special Offers`
    : `${storeName} Special Offers`;

  return {
    title,
    description: `Offer wording found on the store website (${matchedKeywords.join(", ")}). Check the store website for live availability.`,
    startDate,
    endDate,
    eCatalog: [matchedUrl],
  };
}

async function verifyAndSaveStore(
  store: (typeof nationalDiningStores)[number],
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
    throw new Error("No user found to own seeded dining stores.");
  }

  const category = await prisma.category.upsert({
    where: { name: CATEGORY_NAME },
    update: {},
    create: { name: CATEGORY_NAME },
  });

  let offerCount = 0;
  for (let index = 0; index < nationalDiningStores.length; index += VERIFY_CONCURRENCY) {
    const batch = nationalDiningStores.slice(index, index + VERIFY_CONCURRENCY);
    const results = await Promise.all(
      batch.map((store) => verifyAndSaveStore(store, category.id, owner.id))
    );
    offerCount += results.reduce<number>((sum, count) => sum + count, 0);
  }

  console.log(`Seeded ${nationalDiningStores.length} ${CATEGORY_NAME} stores. Verified offers: ${offerCount}.`);
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
