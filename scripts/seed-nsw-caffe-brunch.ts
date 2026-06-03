import { PrismaClient } from "@prisma/client";
import { updateCatalogUrlHealth } from "../src/lib/catalog-health";
import { getLiveVerifiedOfferEndDate } from "../src/lib/offer-lifecycle";
import { OfferVerifier } from "../src/lib/offer-verifier";

const prisma = new PrismaClient();
const CATEGORY_NAME = "Caffe & Brunch";
const VERIFY_CONCURRENCY = 4;

type NswCafe = {
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

const stores: NswCafe[] = [
  {
    name: "Girdlers Manly",
    url: "https://www.girdlers.com.au/cafe-manly",
    verificationUrl: "https://www.girdlers.com.au/",
    suburb: "Manly",
    city: "Sydney",
    state: "NSW",
    address: "Short Street Plaza, Manly NSW 2095",
    contact: "0427 332 914",
    catalogs: ["https://www.girdlers.com.au/", "https://www.girdlers.com.au/cafe-manly"],
    description: "Northern Beaches wholefood cafe serving coffee, brunch, lunch and nourishing Manly cafe meals.",
  },
  {
    name: "Ground Zero Cafe Manly",
    url: "https://www.groundzeromanly.com/",
    suburb: "Manly",
    city: "Sydney",
    state: "NSW",
    address: "Manly NSW 2095",
    catalogs: ["https://www.groundzeromanly.com/"],
    description: "Long-running Manly cafe serving coffee, casual brunch, breakfast and beachside Northern Beaches food.",
  },
  {
    name: "Market Lane Cafe Manly",
    url: "https://www.marketlanemanly.com/",
    suburb: "Manly",
    city: "Sydney",
    state: "NSW",
    address: "Shop 9-11, 37-39 The Corso, Manly NSW 2095",
    contact: "0434 639 080",
    catalogs: ["https://www.marketlanemanly.com/"],
    description: "Manly laneway cafe serving Allpress coffee, breakfast, brunch, pastries and gluten-free options.",
  },
  {
    name: "Girdlers Avalon",
    url: "https://www.girdlers.com.au/cafe-avalon",
    verificationUrl: "https://www.girdlers.com.au/",
    suburb: "Avalon Beach",
    city: "Sydney",
    state: "NSW",
    address: "1/1-5 Hilltop Road, Avalon Beach NSW 2107",
    contact: "0427 577 659",
    catalogs: ["https://www.girdlers.com.au/", "https://www.girdlers.com.au/cafe-avalon"],
    description: "Avalon Beach wholefood cafe serving coffee, brunch, lunch and Northern Beaches cafe dishes.",
  },
  {
    name: "Bluewater Cafe Manly",
    url: "https://bluewatercafe.com.au/",
    suburb: "Manly",
    city: "Sydney",
    state: "NSW",
    address: "Manly NSW 2095",
    catalogs: ["https://bluewatercafe.com.au/"],
    description: "Manly beach cafe serving coffee, breakfast, lunch and relaxed brunch near the water.",
  },
  {
    name: "Frenchy's Cafe Mosman",
    url: "https://frenchyscafe.com.au/",
    suburb: "Mosman",
    city: "Sydney",
    state: "NSW",
    address: "3 Read Place, Mosman NSW 2088",
    catalogs: ["https://frenchyscafe.com.au/"],
    description: "Lower North Shore French-themed outdoor cafe serving breakfast, lunch, coffee and fresh baked items.",
    ignoredOfferUrlPatterns: [/\/special-offers/i],
  },
  {
    name: "The Foliage Cafe North Sydney",
    url: "https://foliagecafe.sstori.com/",
    suburb: "North Sydney",
    city: "Sydney",
    state: "NSW",
    address: "173 Blues Point Road, North Sydney NSW 2060",
    catalogs: ["https://foliagecafe.sstori.com/"],
    description: "North Sydney cafe serving specialty coffee, brunch and leafy lower-north-shore cafe food.",
    ignoredOfferUrlPatterns: [/\/special-offers/i],
  },
  {
    name: "Fox and Sparrow North Sydney",
    url: "https://www.foxandsparrow.com.au/",
    suburb: "North Sydney",
    city: "Sydney",
    state: "NSW",
    address: "North Sydney NSW 2060",
    catalogs: ["https://www.foxandsparrow.com.au/"],
    description: "North Sydney cafe and restaurant serving breakfast, lunch, quality coffee, events and catering.",
  },
  {
    name: "Pure Brew and Co Gordon",
    url: "https://www.purebrewandco.com/",
    suburb: "Gordon",
    city: "Sydney",
    state: "NSW",
    address: "Shop 1 & 3, 1-5 St Johns Avenue, Gordon NSW 2072",
    catalogs: ["https://www.purebrewandco.com/"],
    description: "Upper North Shore specialty coffee and brunch cafe in Gordon serving breakfast and modern cafe plates.",
  },
  {
    name: "The Coffee Emporium Hornsby",
    url: "https://www.thecoffeeemporium.com.au/",
    suburb: "Hornsby",
    city: "Sydney",
    state: "NSW",
    address: "Westfield Hornsby, 236 Pacific Highway, Hornsby NSW 2077",
    catalogs: ["https://www.thecoffeeemporium.com.au/"],
    description: "Hornsby cafe chain venue serving coffee, breakfast, brunch and shopping-centre cafe meals.",
  },
  {
    name: "The Morning Mill Castle Hill",
    url: "https://themorningmill.com.au/",
    suburb: "Castle Hill",
    city: "Sydney",
    state: "NSW",
    address: "Castle Hill NSW 2154",
    catalogs: ["https://themorningmill.com.au/"],
    description: "Castle Hill Mediterranean cafe serving coffee, breakfast, brunch and Hills District cafe food.",
  },
  {
    name: "Say Cafe Castle Hill",
    url: "https://saycafe.com.au/",
    suburb: "Castle Hill",
    city: "Sydney",
    state: "NSW",
    address: "Castle Hill NSW 2154",
    catalogs: ["https://saycafe.com.au/"],
    description: "Castle Hill cafe serving brunch, coffee and casual Hills District cafe meals.",
    ignoredOfferUrlPatterns: [/\/special-offers/i],
  },
  {
    name: "Second Home Cafe Baulkham Hills",
    url: "https://tsh.cafe/",
    suburb: "Baulkham Hills",
    city: "Sydney",
    state: "NSW",
    address: "Baulkham Hills NSW 2153",
    catalogs: ["https://tsh.cafe/"],
    description: "Hills District cafe group serving coffee, healthy breakfast, brunch, lunch, smoothies and juices.",
  },
  {
    name: "Leaf Cafe Rouse Hill",
    url: "https://www.leafcafe.com.au/our-stores-menus/rouse-hill/",
    verificationUrl: "https://www.leafcafe.com.au/",
    suburb: "Rouse Hill",
    city: "Sydney",
    state: "NSW",
    address: "A-GR 003 Rouse Hill Town Centre, Corner of Windsor Road and White Hart Drive, Rouse Hill NSW 2155",
    contact: "02 9674 5140",
    catalogs: ["https://www.leafcafe.com.au/", "https://www.leafcafe.com.au/our-stores-menus/rouse-hill/"],
    description: "Rouse Hill cafe serving locally roasted coffee, all-day brunch, pastries and Hills District meals.",
  },
  {
    name: "Fed Blue Mountains",
    url: "https://www.fedbluemountains.com.au/",
    suburb: "Wentworth Falls",
    city: "Blue Mountains",
    state: "NSW",
    address: "Wentworth Falls NSW 2782",
    catalogs: ["https://www.fedbluemountains.com.au/"],
    description: "Blue Mountains bistro and cafe serving breakfast, brunch, lunch, coffee and house-made food.",
  },
  {
    name: "LoveBites Coffee Co Wentworth Falls",
    url: "https://www.lovebitescc.com/",
    suburb: "Wentworth Falls",
    city: "Blue Mountains",
    state: "NSW",
    address: "13 Station Street, Wentworth Falls NSW 2782",
    contact: "0434 918 771",
    catalogs: ["https://www.lovebitescc.com/"],
    description: "Blue Mountains cafe serving coffee, breakfast, brunch, lunch and dinner using local produce.",
  },
  {
    name: "Leaf Cafe Blacktown",
    url: "https://www.leafcafe.com.au/our-stores-menus/blacktown/",
    verificationUrl: "https://www.leafcafe.com.au/",
    suburb: "Blacktown",
    city: "Sydney",
    state: "NSW",
    address: "Tenancy 2044-1, Westpoint Shopping Centre, 17 Patrick Street, Blacktown NSW 2148",
    catalogs: ["https://www.leafcafe.com.au/", "https://www.leafcafe.com.au/our-stores-menus/blacktown/"],
    description: "Blacktown cafe serving specialty coffee, all-day brunch, pastries and Greater Western Sydney cafe meals.",
  },
  {
    name: "Jukes Cafe Penrith",
    url: "https://jukescafe.com.au/",
    suburb: "Penrith",
    city: "Sydney",
    state: "NSW",
    address: "Shop 5, 461 High Street, Penrith NSW 2750",
    catalogs: ["https://jukescafe.com.au/"],
    description: "Penrith cafe and sandwich bar serving fresh sandwiches, local coffee, smoothies and casual meals.",
  },
  {
    name: "Tspoon Cafe Penrith",
    url: "https://www.thetspooncafe.com.au/",
    suburb: "Penrith",
    city: "Sydney",
    state: "NSW",
    address: "Penrith NSW 2750",
    catalogs: ["https://www.thetspooncafe.com.au/"],
    description: "Penrith cafe serving coffee, breakfast, brunch and casual Western Sydney cafe dishes.",
  },
  {
    name: "Wildflower Society Campbelltown",
    url: "https://www.wildflowersociety.com.au/",
    suburb: "Campbelltown",
    city: "Sydney",
    state: "NSW",
    address: "200 Gilchrist Drive, Campbelltown NSW 2560",
    catalogs: ["https://www.wildflowersociety.com.au/", "https://www.wildflowersociety.com.au/menu"],
    description: "Campbelltown brunch cafe serving modern classics, specialty coffee and halal-friendly cafe meals.",
  },
  {
    name: "Black Elk Espresso Carnes Hill",
    url: "https://www.blackelk.com.au/",
    suburb: "Carnes Hill",
    city: "Sydney",
    state: "NSW",
    address: "600 Kurrajong Road, Carnes Hill NSW 2171",
    contact: "02 9607 7870",
    catalogs: ["https://www.blackelk.com.au/"],
    description: "South West Sydney brunch cafe serving specialty coffee, breakfast, lunch and plated modern Australian meals.",
  },
  {
    name: "Treble Cafe Fairfield",
    url: "https://www.treblefairfield.com.au/",
    suburb: "Fairfield",
    city: "Sydney",
    state: "NSW",
    address: "Fairfield NSW 2165",
    catalogs: ["https://www.treblefairfield.com.au/"],
    description: "Fairfield neighbourhood cafe serving coffee, breakfast, brunch and warm South West Sydney hospitality.",
  },
  {
    name: "Bondeno Cafe Fairfield",
    url: "https://bondeno-cafe.placejoys.com/",
    suburb: "Fairfield",
    city: "Sydney",
    state: "NSW",
    address: "77 Ware Street, Fairfield NSW 2165",
    contact: "02 9723 0860",
    catalogs: ["https://bondeno-cafe.placejoys.com/"],
    description: "Fairfield cafe and breakfast restaurant serving coffee, brunch and neighbourhood cafe food.",
  },
  {
    name: "Common Ground Coffee and Kitchen Hurstville",
    url: "https://www.cafecg.com.au/",
    suburb: "Hurstville",
    city: "Sydney",
    state: "NSW",
    address: "Westfield Hurstville, 301/3 Cross Street, Hurstville NSW 2220",
    catalogs: ["https://www.cafecg.com.au/"],
    description: "Hurstville cafe serving coffee, brunch and casual St George cafe meals inside Westfield Hurstville.",
  },
  {
    name: "Cure Cafe South Hurstville",
    url: "https://curecafe.com.au/",
    suburb: "South Hurstville",
    city: "Sydney",
    state: "NSW",
    address: "Shop 2, 18 Greenacre Road, South Hurstville NSW 2221",
    contact: "02 8068 0611",
    catalogs: ["https://curecafe.com.au/"],
    description: "South Hurstville cafe serving coffee, brunch and local St George cafe food.",
  },
  {
    name: "Diamond Cafe Hurstville",
    url: "https://apac-cdn.menuweb.menu/storage/media/companies_menu_pdf/98633047/diamond-cafe-hurstville-menu.pdf",
    suburb: "Hurstville",
    city: "Sydney",
    state: "NSW",
    address: "197 Forest Road, Hurstville NSW 2220",
    catalogs: ["https://apac-cdn.menuweb.menu/storage/media/companies_menu_pdf/98633047/diamond-cafe-hurstville-menu.pdf"],
    description: "Hurstville cafe listing with menu coverage for coffee, breakfast and casual south Sydney meals.",
  },
  {
    name: "Blackwood Cronulla",
    url: "https://blackwoodhospitality.com.au/",
    suburb: "Cronulla",
    city: "Sydney",
    state: "NSW",
    address: "Cronulla NSW 2230",
    catalogs: ["https://blackwoodhospitality.com.au/"],
    description: "Cronulla cafe and restaurant serving breakfast, brunch and lunch in the Sutherland Shire.",
  },
  {
    name: "Heart and Soul Cronulla",
    url: "https://www.theurbanlist.com/sydney/directory/heart-soul",
    suburb: "Cronulla",
    city: "Sydney",
    state: "NSW",
    address: "6/17 Gerrale Street, Cronulla NSW 2230",
    contact: "02 9523 6146",
    catalogs: ["https://www.theurbanlist.com/sydney/directory/heart-soul"],
    description: "Cronulla wholefood cafe serving coffee, breakfast, lunch and healthy Sutherland Shire brunch.",
    ignoredOfferUrlPatterns: [/\/special-offers/i],
  },
  {
    name: "Bianchini's Elouera Beach",
    url: "https://www.bianchinis.com.au/bianchiniselouerabeachcafe",
    verificationUrl: "https://www.bianchinis.com.au/",
    suburb: "Cronulla",
    city: "Sydney",
    state: "NSW",
    address: "Elouera Beach, Cronulla NSW 2230",
    catalogs: ["https://www.bianchinis.com.au/", "https://www.bianchinis.com.au/bianchiniselouerabeachcafe"],
    description: "Sutherland Shire beach cafe serving coffee, all-day breakfast, lunch and brunch with Bate Bay views.",
  },
  {
    name: "Hendrix Coffee Co Cronulla",
    url: "https://shirescout.squarespace.com/eat-drink/hendrix-coffee-co",
    suburb: "Cronulla",
    city: "Sydney",
    state: "NSW",
    address: "1/150 Cronulla Street, Cronulla NSW 2230",
    contact: "0449 820 644",
    catalogs: ["https://shirescout.squarespace.com/eat-drink/hendrix-coffee-co"],
    description: "Cronulla cafe serving coffee, breakfast, toasties and takeaway-friendly Sutherland Shire cafe food.",
  },
  {
    name: "South Coffee and Food Barangaroo",
    url: "https://www.southcoffeefood.com.au/",
    suburb: "Barangaroo",
    city: "Sydney",
    state: "NSW",
    address: "International Towers Sydney, Tower 1, 100 Barangaroo Avenue, Barangaroo NSW 2000",
    contact: "02 9290 3904",
    catalogs: ["https://www.southcoffeefood.com.au/"],
    description: "Barangaroo cafe serving coffee, seasonal food, brunch and weekday CBD cafe meals.",
  },
  {
    name: "Wild Sage Barangaroo",
    url: "https://wildsage.com.au/",
    suburb: "Barangaroo",
    city: "Sydney",
    state: "NSW",
    address: "Barangaroo NSW 2000",
    catalogs: ["https://wildsage.com.au/"],
    description: "Barangaroo modern Australian cafe and restaurant serving breakfast, brunch, lunch and coffee.",
  },
  {
    name: "Devon Cafe Barangaroo",
    url: "https://www.barangaroo.com/eat-drink/devon-cafe",
    suburb: "Barangaroo",
    city: "Sydney",
    state: "NSW",
    address: "19/200 Barangaroo Avenue, Barangaroo NSW 2000",
    contact: "02 9262 4660",
    catalogs: ["https://www.barangaroo.com/eat-drink/devon-cafe"],
    description: "Barangaroo brunch cafe serving coffee, breakfast, brunch and lunch near Sydney CBD.",
  },
  {
    name: "Envoy Cafe Sydney CBD",
    url: "https://www.envoycafe.com.au/",
    suburb: "Sydney CBD",
    city: "Sydney",
    state: "NSW",
    address: "Sydney CBD NSW 2000",
    catalogs: ["https://www.envoycafe.com.au/"],
    description: "Sydney CBD cafe near Circular Quay and Barangaroo serving coffee, matcha, focaccia, breakfast and brunch.",
  },
  {
    name: "Bottega Coco Barangaroo",
    url: "https://bottegacoco.com.au/",
    suburb: "Barangaroo",
    city: "Sydney",
    state: "NSW",
    address: "Barangaroo NSW 2000",
    catalogs: ["https://bottegacoco.com.au/"],
    description: "Barangaroo Italian restaurant and patisserie serving brunch, high tea, coffee and cafe-style food.",
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

async function verifyAndSaveStore(store: NswCafe, categoryId: number, ownerId: number) {
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
    throw new Error("No user found to own seeded NSW cafe stores.");
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

  console.log(`Seeded ${savedStores} NSW cafe and brunch stores. Verified offers: ${verifiedOffers}.`);
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
