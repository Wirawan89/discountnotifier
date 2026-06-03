import { PrismaClient } from "@prisma/client";
import { updateCatalogUrlHealth } from "../src/lib/catalog-health";
import { getLiveVerifiedOfferEndDate } from "../src/lib/offer-lifecycle";
import { OfferVerifier } from "../src/lib/offer-verifier";

const prisma = new PrismaClient();
const CATEGORY_NAME = "Caffe & Brunch";
const VERIFY_CONCURRENCY = 4;

type QueenslandCafe = {
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

const stores: QueenslandCafe[] = [
  {
    name: "Caffiend Cairns",
    url: "https://www.caffiend.com.au/",
    verificationUrl: "https://www.caffiend.com.au/",
    suburb: "Cairns City",
    city: "Cairns",
    state: "QLD",
    address: "5/72 Grafton Street, Cairns City QLD 4870",
    contact: "0431 429 596",
    catalogs: ["https://www.caffiend.com.au/", "https://www.caffiend.com.au/location"],
    description: "Cairns cafe known for specialty coffee, modern Australian brunch, breakfast and local produce-led meals.",
  },
  {
    name: "Guyala Cafe Cairns North",
    url: "https://www.guyalacafe.com.au/",
    suburb: "Cairns North",
    city: "Cairns",
    state: "QLD",
    address: "2 Smith Street, Cairns North QLD 4870",
    catalogs: ["https://www.guyalacafe.com.au/"],
    description: "Cairns Esplanade cafe serving inventive modern brunch, coffee, breakfast and relaxed lunch dishes.",
  },
  {
    name: "St Crispins Cafe Port Douglas",
    url: "https://www.stcrispins.com.au/",
    suburb: "Port Douglas",
    city: "Port Douglas",
    state: "QLD",
    address: "9 St Crispins Avenue, Port Douglas QLD 4877",
    contact: "0400 652 906",
    catalogs: ["https://www.stcrispins.com.au/", "https://www.stcrispins.com.au/contact"],
    description: "Port Douglas cafe and events venue serving all-day dining, coffee, brunch and local tropical produce.",
  },
  {
    name: "Whistle Stop Cafe Yungaburra",
    url: "https://whistlestopcafe.com.au/",
    suburb: "Yungaburra",
    city: "Atherton Tablelands",
    state: "QLD",
    address: "36 Cedar Street, Yungaburra QLD 4884",
    contact: "07 4095 3913",
    catalogs: ["https://whistlestopcafe.com.au/"],
    description: "Yungaburra family-owned Tablelands cafe serving breakfast, lunch, coffee, cakes and casual brunch.",
  },
  {
    name: "Turtle Rock Cafe Cape Tribulation",
    url: "https://oceansafari.com.au/turtle-rock-cafe/",
    verificationUrl: "https://oceansafari.com.au/",
    suburb: "Cape Tribulation",
    city: "Daintree",
    state: "QLD",
    address: "Cape Tribulation Road, Cape Tribulation QLD 4873",
    catalogs: ["https://oceansafari.com.au/", "https://oceansafari.com.au/turtle-rock-cafe/"],
    description: "Daintree and Great Barrier Reef area cafe serving coffee, breakfast, lunch and casual traveller meals.",
  },
  {
    name: "Mello Cafe Townsville",
    url: "https://www.townsvillemellocafe.com/",
    suburb: "Townsville City",
    city: "Townsville",
    state: "QLD",
    address: "Townsville City QLD 4810",
    catalogs: ["https://www.townsvillemellocafe.com/"],
    description: "Townsville cafe serving coffee, breakfast, brunch, lunch and relaxed city cafe food.",
  },
  {
    name: "Coffee Cartel NQ Townsville",
    url: "https://coffeecartelnq.com.au/",
    suburb: "Garbutt",
    city: "Townsville",
    state: "QLD",
    address: "Garbutt QLD 4814",
    catalogs: ["https://coffeecartelnq.com.au/"],
    description: "Townsville specialty coffee business and cafe-style venue serving coffee, light bites and local roasts.",
  },
  {
    name: "Chill Cafe Ayr",
    url: "https://www.chillcoffee.group/",
    suburb: "Ayr",
    city: "Ayr",
    state: "QLD",
    address: "Ayr QLD 4807",
    catalogs: ["https://www.chillcoffee.group/"],
    description: "Ayr cafe serving breakfast, lunch, coffee, sweet treats and community cafe meals.",
  },
  {
    name: "Stock Exchange Cafe Charters Towers",
    url: "https://apac-cdn.menuweb.menu/storage/media/companies_menu_pdf/88873597/stock-exchange-cafe-charters-towers-menu.pdf",
    verificationUrl: "https://apac-cdn.menuweb.menu/storage/media/companies_menu_pdf/88873597/stock-exchange-cafe-charters-towers-menu.pdf",
    suburb: "Charters Towers City",
    city: "Charters Towers",
    state: "QLD",
    address: "76 Mosman Street, Charters Towers City QLD 4820",
    catalogs: ["https://apac-cdn.menuweb.menu/storage/media/companies_menu_pdf/88873597/stock-exchange-cafe-charters-towers-menu.pdf"],
    description: "Charters Towers cafe and brunch venue serving coffee, breakfast, burgers and casual country-town meals.",
  },
  {
    name: "CocoBrew Riverfront Rockhampton",
    url: "https://cocobrewriverfront.com.au/",
    suburb: "Rockhampton City",
    city: "Rockhampton",
    state: "QLD",
    address: "5 East Street, Rockhampton City QLD 4700",
    contact: "07 4864 5045",
    catalogs: ["https://cocobrewriverfront.com.au/", "https://cocobrewriverfront.com.au/rockhampton-restaurant/"],
    description: "Rockhampton riverfront cafe, bar and grill serving breakfast, coffee, lunch, dinner and casual dining.",
  },
  {
    name: "My Rainbow Cafe Airlie Beach",
    url: "https://www.myrainbowbakery.com.au/",
    suburb: "Airlie Beach",
    city: "Whitsundays",
    state: "QLD",
    address: "Airlie Beach QLD 4802",
    contact: "0458 398 560",
    catalogs: ["https://www.myrainbowbakery.com.au/"],
    description: "Airlie Beach cafe, bakery and caterer serving breakfast, lunch, coffee, sweet treats and high tea.",
  },
  {
    name: "Sisters Corner Cafe Airlie Beach",
    url: "https://www.sisterscornercafe.com.au/",
    suburb: "Airlie Beach",
    city: "Whitsundays",
    state: "QLD",
    address: "Shute Harbour Road, Airlie Beach QLD 4802",
    catalogs: ["https://www.sisterscornercafe.com.au/"],
    description: "Airlie Beach cafe serving coffee, all-day breakfast, brunch, lunch and relaxed Whitsundays meals.",
  },
  {
    name: "Sorrento Restaurant and Bar Airlie Beach",
    url: "https://www.sorrentowhitsunday.com/",
    suburb: "Airlie Beach",
    city: "Whitsundays",
    state: "QLD",
    address: "Coral Sea Marina, 22 Shingley Drive, Airlie Beach QLD 4802",
    contact: "07 4946 7454",
    catalogs: ["https://www.sorrentowhitsunday.com/"],
    description: "Airlie Beach waterfront restaurant and bar serving all-day dining, coffee, lunch and relaxed coastal meals.",
  },
  {
    name: "Boaty's Airlie Beach",
    url: "https://www.boatysairliebeach.com/",
    suburb: "Airlie Beach",
    city: "Whitsundays",
    state: "QLD",
    address: "336 Shute Harbour Road, Airlie Beach QLD 4802",
    contact: "07 3184 0946",
    catalogs: ["https://www.boatysairliebeach.com/"],
    description: "Airlie Beach bar and restaurant serving breakfast, lunch, dinner and casual Whitsundays cafe-style meals.",
  },
  {
    name: "The Hangar Cafe and Bar Whitsundays",
    url: "https://thehangarcafeandbar.com.au/",
    suburb: "Flametree",
    city: "Whitsundays",
    state: "QLD",
    address: "Whitsunday Airport, Flametree QLD 4802",
    catalogs: ["https://thehangarcafeandbar.com.au/"],
    description: "Whitsundays airside cafe and bar between Airlie Beach and Shute Harbour serving coffee, brunch and casual food.",
  },
  {
    name: "Garuma Airlie Beach",
    url: "https://garuma.squarespace.com/",
    suburb: "Airlie Beach",
    city: "Whitsundays",
    state: "QLD",
    address: "Airlie Beach QLD 4802",
    catalogs: ["https://garuma.squarespace.com/"],
    description: "Airlie Beach breakfast restaurant and cafe serving coffee, brunch and pet-friendly Whitsundays dining.",
  },
  {
    name: "K&Co Mackay",
    url: "https://www.kandco.com.au/",
    suburb: "Mackay",
    city: "Mackay",
    state: "QLD",
    address: "Mackay QLD 4740",
    catalogs: ["https://www.kandco.com.au/"],
    description: "Mackay local cafe group covering K&Co, CURB and 9th Lane Grind with coffee, breakfast, brunch and catering.",
  },
  {
    name: "The Deli Nook Mackay",
    url: "https://platteredup.com.au/",
    suburb: "Mackay",
    city: "Mackay",
    state: "QLD",
    address: "15 Macalister Street, Mackay QLD 4740",
    contact: "0412 897 266",
    catalogs: ["https://platteredup.com.au/"],
    description: "Mackay deli and coffee shop serving coffee, grazing food, platters, catering and light cafe meals.",
    ignoredOfferUrlPatterns: [/\/special-offers/i, /\/\.well-known\/sgcaptcha/i],
  },
  {
    name: "Earlybirds Cafe Gladstone",
    url: "https://earlybirdscafe.com.au/",
    suburb: "Gladstone Central",
    city: "Gladstone",
    state: "QLD",
    address: "Gladstone Central QLD 4680",
    catalogs: ["https://earlybirdscafe.com.au/"],
    description: "Gladstone cafe serving coffee, breakfast, brunch, lunch and casual Central Queensland meals.",
  },
  {
    name: "Vibe Cafe Gladstone",
    url: "https://vibecafe.com.au/",
    suburb: "Gladstone Central",
    city: "Gladstone",
    state: "QLD",
    address: "Gladstone Central QLD 4680",
    catalogs: ["https://vibecafe.com.au/"],
    description: "Gladstone cafe serving coffee, breakfast, brunch, lunch and relaxed city cafe food.",
  },
  {
    name: "Sessions Cafe Emerald",
    url: "https://sessions.cafe/",
    suburb: "Emerald",
    city: "Emerald",
    state: "QLD",
    address: "Emerald QLD 4720",
    catalogs: ["https://sessions.cafe/"],
    description: "Emerald cafe serving specialty coffee, breakfast, lunch and Central Highlands brunch-style meals.",
    ignoredOfferUrlPatterns: [/\/special-offers/i],
  },
  {
    name: "Roma Cafe and Restaurant Brisbane",
    url: "https://romacafeandrestaurant.com.au/",
    suburb: "Brisbane City",
    city: "Brisbane",
    state: "QLD",
    address: "816a/3 Parkland Boulevard, Brisbane City QLD 4000",
    catalogs: ["https://romacafeandrestaurant.com.au/"],
    description: "Brisbane cafe and restaurant serving breakfast, brunch, coffee and Nepalese comfort food near Roma Street Parklands.",
    ignoredOfferUrlPatterns: [/\/special-offers/i],
  },
  {
    name: "Blue Gum Cafe Charleville",
    url: "https://www.murweh.qld.gov.au/Community-and-Services/Community-Services/Community-and-Business-Directory/Blue-Gum-Caf%C3%A9",
    suburb: "Charleville",
    city: "Charleville",
    state: "QLD",
    address: "76 Alfred Street, Charleville QLD 4470",
    contact: "07 4654 1104",
    catalogs: [
      "https://www.murweh.qld.gov.au/Community-and-Services/Community-Services/Community-and-Business-Directory/Blue-Gum-Caf%C3%A9",
    ],
    description: "Charleville coffee shop listed by Murweh Shire, serving coffee and casual cafe food.",
  },
  {
    name: "Murphys Coffee House Cunnamulla",
    url: "https://www.outbackqueensland.com.au/food_and_drink/rumour-has-it-cunnamulla/",
    suburb: "Cunnamulla",
    city: "Cunnamulla",
    state: "QLD",
    address: "10 Stockyard Street, Cunnamulla QLD 4490",
    catalogs: ["https://www.outbackqueensland.com.au/food_and_drink/rumour-has-it-cunnamulla/"],
    description: "Cunnamulla cafe and gift shop serving coffee, high tea and relaxed Outback Queensland cafe meals.",
    ignoredOfferUrlPatterns: [/\/deals/i],
  },
  {
    name: "Groundhog Social Manly",
    url: "https://groundhogsocial.com.au/",
    suburb: "Manly",
    city: "Brisbane",
    state: "QLD",
    address: "Manly QLD 4179",
    catalogs: ["https://groundhogsocial.com.au/"],
    description: "Brisbane bayside cafe serving coffee, breakfast, brunch, lunch and relaxed neighbourhood food.",
  },
  {
    name: "Bam Bam Bakehouse Mermaid Beach",
    url: "https://www.bambambakehouse.com/",
    suburb: "Mermaid Beach",
    city: "Gold Coast",
    state: "QLD",
    address: "2519 Gold Coast Highway, Mermaid Beach QLD 4218",
    catalogs: ["https://www.bambambakehouse.com/"],
    description: "Gold Coast bakery and brunch venue serving pastries, coffee, breakfast and modern cafe meals.",
  },
  {
    name: "Paradox Coffee Roasters Surfers Paradise",
    url: "https://paradoxroasterscafe.com/",
    suburb: "Surfers Paradise",
    city: "Gold Coast",
    state: "QLD",
    address: "10 Beach Road, Surfers Paradise QLD 4217",
    contact: "07 5538 3235",
    catalogs: ["https://paradoxroasterscafe.com/"],
    description: "Surfers Paradise cafe and coffee roaster serving coffee, breakfast, brunch and Gold Coast cafe food.",
  },
  {
    name: "The Velo Project Mooloolaba",
    url: "https://theveloproject.com.au/",
    suburb: "Mooloolaba",
    city: "Sunshine Coast",
    state: "QLD",
    address: "19 Careela Street, Mooloolaba QLD 4557",
    contact: "07 5444 8693",
    catalogs: ["https://theveloproject.com.au/"],
    description: "Sunshine Coast brunch cafe serving coffee, breakfast, lunch and creative Mooloolaba cafe dishes.",
  },
  {
    name: "Jam Jar Cafe Hervey Bay",
    url: "https://jamjarcafehb.com/",
    suburb: "Pialba",
    city: "Hervey Bay",
    state: "QLD",
    address: "Shop 87, Pialba Place Shopping Centre, Main Street, Pialba QLD 4655",
    catalogs: ["https://jamjarcafehb.com/", "https://jamjarcafehb.com/food-menu/"],
    description: "Hervey Bay cafe serving premium coffee, all-day brunch, toasties, shakes and casual local food.",
  },
  {
    name: "Pier Village Cafe Hervey Bay",
    url: "https://piervillagecafe.com.au/",
    suburb: "Urangan",
    city: "Hervey Bay",
    state: "QLD",
    address: "Urangan QLD 4655",
    catalogs: ["https://piervillagecafe.com.au/"],
    description: "Hervey Bay waterfront cafe near Urangan Pier serving breakfast, coffee, lunch and coastal brunch.",
  },
  {
    name: "Aquavue Beachfront Bar and Eatery Hervey Bay",
    url: "https://www.aquavue.com.au/",
    suburb: "Torquay",
    city: "Hervey Bay",
    state: "QLD",
    address: "415a Esplanade, Torquay QLD 4655",
    contact: "07 4125 5528",
    catalogs: ["https://www.aquavue.com.au/"],
    description: "Hervey Bay beachfront cafe, bar and eatery serving coffee, breakfast, lunch and sunset bites.",
  },
  {
    name: "Bayaroma Cafe Hervey Bay",
    url: "https://bayaroma.com.au/",
    suburb: "Torquay",
    city: "Hervey Bay",
    state: "QLD",
    address: "Torquay QLD 4655",
    catalogs: ["https://bayaroma.com.au/"],
    description: "Torquay cafe on the Hervey Bay Esplanade serving all-day breakfast, lunch, coffee and daily specials.",
  },
  {
    name: "Salt Cafe Urangan",
    url: "https://saltcafe.com.au/",
    suburb: "Urangan",
    city: "Hervey Bay",
    state: "QLD",
    address: "Urangan QLD 4655",
    catalogs: ["https://saltcafe.com.au/"],
    description: "Hervey Bay cafe with views serving coffee, breakfast, lunch, functions and casual waterfront dining.",
  },
  {
    name: "Indulge Cafe Bundaberg",
    url: "https://www.indulgecafe.com.au/",
    suburb: "Bundaberg Central",
    city: "Bundaberg",
    state: "QLD",
    address: "Bundaberg Central QLD 4670",
    catalogs: ["https://www.indulgecafe.com.au/"],
    description: "Bundaberg cafe and bistro serving coffee, breakfast, lunch and European-influenced cafe meals.",
  },
  {
    name: "Buzz Superfood Bar Bundaberg",
    url: "https://www.buzzsuperfoodbarbundaberg.com/",
    suburb: "Bundaberg Central",
    city: "Bundaberg",
    state: "QLD",
    address: "Bundaberg Central QLD 4670",
    contact: "07 4151 5423",
    catalogs: ["https://www.buzzsuperfoodbarbundaberg.com/"],
    description: "Bundaberg healthy cafe serving coffee, breakfast, lunch, smoothies and raw superfood meals.",
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

async function verifyAndSaveStore(store: QueenslandCafe, categoryId: number, ownerId: number) {
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
    throw new Error("No user found to own seeded Queensland cafe stores.");
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

  console.log(`Seeded ${savedStores} Queensland cafe and brunch stores. Verified offers: ${verifiedOffers}.`);
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
