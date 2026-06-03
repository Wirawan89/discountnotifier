import { PrismaClient } from "@prisma/client";
import { updateCatalogUrlHealth } from "../src/lib/catalog-health";
import { getLiveVerifiedOfferEndDate } from "../src/lib/offer-lifecycle";
import { OfferVerifier } from "../src/lib/offer-verifier";

const prisma = new PrismaClient();
const CATEGORY_NAME = "Caffe & Brunch";
const VERIFY_CONCURRENCY = 4;

type SydneyCafe = {
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

const stores: SydneyCafe[] = [
  {
    name: "Room 10 Potts Point",
    url: "https://www.roomtenpottspoint.com.au/",
    suburb: "Potts Point",
    city: "Sydney",
    state: "NSW",
    address: "10 Llankelly Place, Potts Point NSW 2011",
    contact: "02 9357 4100",
    catalogs: ["https://www.roomtenpottspoint.com.au/"],
    description: "Small Potts Point cafe known for specialty coffee, breakfast sandwiches and inner-city brunch.",
  },
  {
    name: "Pina Potts Point",
    url: "https://room10group.com/#pina-potts-point",
    verificationUrl: "https://room10group.com/",
    suburb: "Potts Point",
    city: "Sydney",
    state: "NSW",
    address: "4/29 Orwell Street, Potts Point NSW 2011",
    catalogs: ["https://room10group.com/"],
    description: "Potts Point cafe serving refined brunch, coffee and seasonal daytime dining.",
  },
  {
    name: "The Apollo Cafe Potts Point",
    url: "https://www.theapollo.com.au/cafe",
    suburb: "Potts Point",
    city: "Sydney",
    state: "NSW",
    address: "44 Macleay Street, Potts Point NSW 2011",
    catalogs: ["https://www.theapollo.com.au/cafe"],
    description: "Potts Point cafe by The Apollo serving coffee, pastries and daytime cafe dishes.",
  },
  {
    name: "Theeca Darlinghurst",
    url: "https://www.theeca.com.au/",
    suburb: "Darlinghurst",
    city: "Sydney",
    state: "NSW",
    address: "Darlinghurst NSW 2010",
    catalogs: ["https://www.theeca.com.au/"],
    description: "Darlinghurst cafe and neighbourhood brunch spot serving coffee, breakfast and lunch.",
  },
  {
    name: "Bootsdarling Darlinghurst",
    url: "https://bootsdarling.com.au/",
    suburb: "Darlinghurst",
    city: "Sydney",
    state: "NSW",
    address: "333 South Dowling Street, Darlinghurst NSW 2010",
    catalogs: ["https://bootsdarling.com.au/"],
    description: "Darlinghurst cafe serving breakfast, lunch, coffee and seasonal brunch dishes.",
  },
  {
    name: "Bar Nina Darlinghurst",
    url: "https://www.barnina.com.au/",
    suburb: "Darlinghurst",
    city: "Sydney",
    state: "NSW",
    address: "85 Stanley Street, Darlinghurst NSW 2010",
    catalogs: ["https://www.barnina.com.au/"],
    description: "Darlinghurst cafe and bar serving brunch, coffee and European-inspired daytime meals.",
  },
  {
    name: "Rusty Rabbit Darlinghurst",
    url: "https://www.therustyrabbit.com.au/",
    suburb: "Darlinghurst",
    city: "Sydney",
    state: "NSW",
    address: "252 Forbes Street, Darlinghurst NSW 2010",
    catalogs: ["https://www.therustyrabbit.com.au/"],
    description: "Darlinghurst cafe known for all-day breakfast, brunch and coffee.",
  },
  {
    name: "Tropicana Caffe Darlinghurst",
    url: "https://www.tropicanacaffe.com/",
    suburb: "Darlinghurst",
    city: "Sydney",
    state: "NSW",
    address: "227 Victoria Street, Darlinghurst NSW 2010",
    catalogs: ["https://www.tropicanacaffe.com/"],
    description: "Long-running Darlinghurst cafe serving breakfast, lunch, coffee and casual dining.",
  },
  {
    name: "Bills Darlinghurst",
    url: "https://www.bills.com.au/locations/darlinghurst",
    suburb: "Darlinghurst",
    city: "Sydney",
    state: "NSW",
    address: "433 Liverpool Street, Darlinghurst NSW 2010",
    contact: "+61 2 9360 9631",
    catalogs: ["https://www.bills.com.au/locations/darlinghurst"],
    description: "Iconic Darlinghurst all-day dining and brunch venue.",
  },
  {
    name: "Edition Roasters Darling Square",
    url: "https://editionroasters.com/",
    suburb: "Haymarket",
    city: "Sydney",
    state: "NSW",
    address: "Darling Square, Haymarket NSW 2000",
    catalogs: ["https://editionroasters.com/"],
    description: "Japanese-influenced specialty coffee and brunch cafe at Darling Square.",
  },
  {
    name: "Kobo Cafe Darling Square",
    url: "https://www.kobocafe.com.au/",
    suburb: "Haymarket",
    city: "Sydney",
    state: "NSW",
    address: "Darling Square, Haymarket NSW 2000",
    catalogs: ["https://www.kobocafe.com.au/"],
    description: "Darling Square cafe serving coffee, breakfast plates and casual brunch.",
  },
  {
    name: "Zenius Coffee Chippendale",
    url: "https://zenius.au/",
    suburb: "Chippendale",
    city: "Sydney",
    state: "NSW",
    address: "Chippendale NSW 2008",
    catalogs: ["https://zenius.au/"],
    description: "Chippendale specialty coffee and brunch cafe.",
  },
  {
    name: "Something for Jess Chippendale",
    url: "https://www.somethingforjess.com.au/",
    suburb: "Chippendale",
    city: "Sydney",
    state: "NSW",
    address: "27 Abercrombie Street, Chippendale NSW 2008",
    catalogs: ["https://www.somethingforjess.com.au/"],
    description: "Chippendale neighbourhood cafe serving seasonal breakfast, lunch and coffee.",
  },
  {
    name: "Toby's Estate Chippendale",
    url: "https://www.tobysestate.com.au/#chippendale-sydney",
    verificationUrl: "https://www.tobysestate.com.au/cafe-finder/",
    suburb: "Chippendale",
    city: "Sydney",
    state: "NSW",
    address: "32-36 City Road, Chippendale NSW 2008",
    catalogs: ["https://www.tobysestate.com.au/cafe-finder/"],
    description: "Award-winning Toby's Estate flagship cafe and roastery in Chippendale.",
  },
  {
    name: "Cafe Giulia Chippendale",
    url: "https://cafe-giulia.square.site/",
    verificationUrl: "https://cafe-giulia.square.site/",
    suburb: "Chippendale",
    city: "Sydney",
    state: "NSW",
    address: "92 Abercrombie Street, Chippendale NSW 2008",
    contact: "02 9167 2786",
    catalogs: ["https://cafe-giulia.square.site/"],
    description: "Long-running Chippendale cafe serving coffee, breakfast, lunch and catering.",
  },
  {
    name: "La Herradura Coffee Stable Chippendale",
    url: "https://laherraduracoffeestable.com/",
    suburb: "Chippendale",
    city: "Sydney",
    state: "NSW",
    address: "6 Shepherd Street, Chippendale NSW 2008",
    contact: "0478 253 581",
    catalogs: ["https://laherraduracoffeestable.com/"],
    description: "Chippendale Colombian coffee stable serving breakfast, lunch and casual dining.",
  },
  {
    name: "Campos Coffee Newtown",
    url: "https://www.camposcoffee.com/flagships#newtown",
    verificationUrl: "https://www.camposcoffee.com/flagships",
    suburb: "Newtown",
    city: "Sydney",
    state: "NSW",
    address: "193 Missenden Road, Newtown NSW 2042",
    catalogs: ["https://www.camposcoffee.com/flagships"],
    description: "Campos Coffee flagship cafe in Newtown, close to the Chippendale inner-city cafe corridor.",
  },
  {
    name: "One Shot Cafe Ultimo",
    url: "https://oneshotcafe.com.au/",
    suburb: "Ultimo",
    city: "Sydney",
    state: "NSW",
    address: "Shop 5, 15-17 Broadway, Ultimo NSW 2007",
    catalogs: ["https://oneshotcafe.com.au/"],
    description: "Ultimo cafe serving breakfast, lunch, coffee and inner-city brunch.",
  },
  {
    name: "Cafe Kooks Ultimo",
    url: "https://cafekooks.com.au/",
    suburb: "Ultimo",
    city: "Sydney",
    state: "NSW",
    address: "88 Mountain Street, Ultimo NSW 2007",
    catalogs: ["https://cafekooks.com.au/"],
    description: "Ultimo cafe serving brunch, coffee and Korean-influenced cafe food.",
  },
  {
    name: "Bar Zini Pyrmont",
    url: "https://www.barzini.com.au/",
    suburb: "Pyrmont",
    city: "Sydney",
    state: "NSW",
    address: "78 Harris Street, Pyrmont NSW 2009",
    catalogs: ["https://www.barzini.com.au/"],
    description: "Pyrmont cafe and restaurant serving breakfast, lunch, coffee and casual dining.",
  },
  {
    name: "Social Brew Cafe Pyrmont",
    url: "https://www.socialbrewcafe.com.au/",
    suburb: "Pyrmont",
    city: "Sydney",
    state: "NSW",
    address: "224 Harris Street, Pyrmont NSW 2009",
    catalogs: ["https://www.socialbrewcafe.com.au/"],
    description: "Pyrmont cafe serving brunch, coffee, acai bowls and casual breakfast dishes.",
  },
  {
    name: "Sonder Cafe Paddington",
    url: "https://www.sondercafe.com.au/",
    suburb: "Paddington",
    city: "Sydney",
    state: "NSW",
    address: "227 Glenmore Road, Paddington NSW 2021",
    catalogs: ["https://www.sondercafe.com.au/"],
    description: "Paddington cafe serving coffee, breakfast and neighbourhood brunch.",
  },
  {
    name: "Cafe Fiveways Paddington",
    url: "https://www.cafefiveways.com.au/",
    suburb: "Paddington",
    city: "Sydney",
    state: "NSW",
    address: "Five Ways, Paddington NSW 2021",
    catalogs: ["https://www.cafefiveways.com.au/"],
    description: "Paddington cafe serving breakfast, lunch, coffee and brunch around Five Ways.",
  },
  {
    name: "Ampersand Cafe Paddington",
    url: "https://www.ampersandcafe.com.au/",
    suburb: "Paddington",
    city: "Sydney",
    state: "NSW",
    address: "78 Oxford Street, Paddington NSW 2021",
    catalogs: ["https://www.ampersandcafe.com.au/"],
    description: "Paddington bookstore cafe serving coffee, breakfast, lunch and brunch.",
  },
  {
    name: "Leaf Cafe Bondi Junction",
    url: "https://leafcafe.com.au/pages/bondi-junction",
    suburb: "Bondi Junction",
    city: "Sydney",
    state: "NSW",
    address: "Westfield Bondi Junction, Bondi Junction NSW 2022",
    catalogs: ["https://leafcafe.com.au/pages/bondi-junction"],
    description: "Bondi Junction cafe serving breakfast, lunch, coffee and shopping-centre brunch.",
  },
  {
    name: "Dirty Red Glebe",
    url: "https://www.dirtyred.com.au/",
    suburb: "Glebe",
    city: "Sydney",
    state: "NSW",
    address: "41 Glebe Point Road, Glebe NSW 2037",
    catalogs: ["https://www.dirtyred.com.au/"],
    description: "Glebe cafe serving specialty coffee, brunch and Mediterranean-inspired breakfast dishes.",
  },
  {
    name: "Cherry Moon Annandale",
    url: "https://www.cherrymoon.com.au/",
    suburb: "Annandale",
    city: "Sydney",
    state: "NSW",
    address: "Annandale NSW 2038",
    catalogs: ["https://www.cherrymoon.com.au/"],
    description: "Annandale bakery and cafe serving pastries, coffee and brunch-friendly baked goods.",
  },
  {
    name: "Revolver Annandale",
    url: "https://www.revolvercafe.com.au/",
    suburb: "Annandale",
    city: "Sydney",
    state: "NSW",
    address: "291 Annandale Street, Annandale NSW 2038",
    catalogs: ["https://www.revolvercafe.com.au/"],
    description: "Annandale cafe serving breakfast, brunch, lunch and specialty coffee.",
  },
  {
    name: "Contessa Balmain",
    url: "https://www.contessabalmain.com.au/",
    suburb: "Balmain",
    city: "Sydney",
    state: "NSW",
    address: "371 Darling Street, Balmain NSW 2041",
    catalogs: ["https://www.contessabalmain.com.au/"],
    description: "Balmain cafe serving breakfast, lunch, coffee and neighbourhood brunch.",
  },
  {
    name: "Bertoni Casalinga Balmain",
    url: "https://www.bertoni.com.au/",
    suburb: "Balmain",
    city: "Sydney",
    state: "NSW",
    address: "281 Darling Street, Balmain NSW 2041",
    catalogs: ["https://www.bertoni.com.au/"],
    description: "Balmain Italian cafe serving coffee, breakfast, lunch and casual meals.",
  },
  {
    name: "Egg of the Universe Rozelle",
    url: "https://eggoftheuniverse.com/",
    suburb: "Rozelle",
    city: "Sydney",
    state: "NSW",
    address: "713 Darling Street, Rozelle NSW 2039",
    catalogs: ["https://eggoftheuniverse.com/"],
    description: "Rozelle wholefoods cafe and yoga venue serving breakfast, lunch and coffee.",
    ignoredOfferUrlPatterns: [/yoga/i, /retreat/i, /workshop/i],
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

async function verifyAndSaveStore(store: SydneyCafe, categoryId: number, ownerId: number) {
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
    throw new Error("No user found to own seeded Sydney inner city cafe stores.");
  }

  const category = await prisma.category.upsert({
    where: { name: CATEGORY_NAME },
    update: {},
    create: { name: CATEGORY_NAME },
  });

  const closedCalico = await prisma.store.findMany({
    where: {
      categoryId: category.id,
      OR: [
        { url: "https://calicocafe.com.au/" },
        { websiteUrl: "https://calicocafe.com.au/" },
        {
          name: { equals: "Calico Cafe Chippendale", mode: "insensitive" },
          suburb: { equals: "Chippendale", mode: "insensitive" },
        },
      ],
      NOT: { locationSource: "closed" },
    },
    select: { id: true },
  });

  if (closedCalico.length > 0) {
    const closedCalicoIds = closedCalico.map((store) => store.id);
    await prisma.store.updateMany({
      where: { id: { in: closedCalicoIds } },
      data: {
        locationSource: "closed",
        description: "Closed because the previous official website no longer resolves.",
        catalogs: [],
      },
    });
    await prisma.discount.deleteMany({ where: { storeId: { in: closedCalicoIds } } });
    console.log(`closed-dead-url: Calico Cafe Chippendale (${closedCalico.length})`);
  }

  let savedStores = 0;
  let verifiedOffers = 0;

  for (let index = 0; index < stores.length; index += VERIFY_CONCURRENCY) {
    const batch = stores.slice(index, index + VERIFY_CONCURRENCY);
    const results = await Promise.all(batch.map((store) => verifyAndSaveStore(store, category.id, owner.id)));
    savedStores += results.reduce((sum, result) => sum + result.store, 0);
    verifiedOffers += results.reduce((sum, result) => sum + result.offer, 0);
  }

  console.log(`Seeded ${savedStores} Sydney inner city cafe and brunch stores. Verified offers: ${verifiedOffers}.`);
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
