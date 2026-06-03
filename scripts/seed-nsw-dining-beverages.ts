import { PrismaClient } from "@prisma/client";
import { updateCatalogUrlHealth } from "../src/lib/catalog-health";
import { getLiveVerifiedOfferEndDate } from "../src/lib/offer-lifecycle";
import { OfferVerifier } from "../src/lib/offer-verifier";

const prisma = new PrismaClient();
const CATEGORY_NAME = "Dining & Beverages";
const VERIFY_CONCURRENCY = 4;

type DiningVenue = {
  name: string;
  url: string;
  websiteUrl?: string;
  suburb: string;
  city: string;
  state: string;
  address: string;
  contact?: string;
  catalogs?: string[];
  description: string;
  ignoredOfferUrlPatterns?: RegExp[];
};

const venues: DiningVenue[] = [
  {
    name: "InSitu Bar and Restaurant Manly",
    url: "https://www.insitumanly.com.au/",
    suburb: "Manly",
    city: "Sydney",
    state: "NSW",
    address: "1/18 Sydney Road, Manly NSW 2095",
    contact: "02 3820 7314",
    catalogs: ["https://www.insitumanly.com.au/"],
    description: "Northern Beaches restaurant, small cocktail bar and live-music venue serving lunch, dinner and drinks.",
  },
  {
    name: "Bistro Manly",
    url: "https://bistromanly.com.au/",
    suburb: "Manly",
    city: "Sydney",
    state: "NSW",
    address: "55 North Steyne, Manly NSW 2095",
    catalogs: ["https://bistromanly.com.au/", "https://bistromanly.com.au/menus/"],
    description: "Beachfront French bistro and cocktail bar serving lunch, dinner, seafood and coastal dining.",
  },
  {
    name: "Courtyard Dee Why RSL",
    url: "https://deewhyrsl.com.au/venue/courtyard/",
    websiteUrl: "https://deewhyrsl.com.au/",
    suburb: "Dee Why",
    city: "Sydney",
    state: "NSW",
    address: "932 Pittwater Road, Dee Why NSW 2099",
    catalogs: ["https://deewhyrsl.com.au/venue/courtyard/", "https://deewhyrsl.com.au/whats-on/"],
    description: "Northern Beaches bar and casual dining venue with cocktails, shared plates, craft beer and live music.",
  },
  {
    name: "Barrenjoey House Palm Beach",
    url: "https://www.barrenjoeyhouse.com.au/",
    suburb: "Palm Beach",
    city: "Sydney",
    state: "NSW",
    address: "1108 Barrenjoey Road, Palm Beach NSW 2108",
    catalogs: ["https://www.barrenjoeyhouse.com.au/"],
    description: "Palm Beach restaurant and bar serving lunch, dinner, cocktails and coastal Northern Beaches dining.",
  },
  {
    name: "Jonah's Whale Beach",
    url: "https://jonahs.com.au/",
    suburb: "Whale Beach",
    city: "Sydney",
    state: "NSW",
    address: "69 Bynya Road, Whale Beach NSW 2107",
    catalogs: ["https://jonahs.com.au/", "https://jonahs.com.au/dine/"],
    description: "Fine dining restaurant and boutique hotel above Whale Beach with lunch, dinner and ocean views.",
  },
  {
    name: "L'Heritage Mosman",
    url: "https://lheritage.com.au/",
    suburb: "Mosman",
    city: "Sydney",
    state: "NSW",
    address: "7b Chowder Bay Road, Mosman NSW 2088",
    catalogs: ["https://lheritage.com.au/"],
    description: "Lower North Shore French restaurant in Chowder Bay serving lunch, dinner and waterside dining.",
  },
  {
    name: "Bathers Pavilion Restaurant Balmoral",
    url: "https://www.batherspavilion.com.au/spaces/restaurant/",
    websiteUrl: "https://www.batherspavilion.com.au/",
    suburb: "Mosman",
    city: "Sydney",
    state: "NSW",
    address: "4 The Esplanade, Mosman NSW 2088",
    catalogs: ["https://www.batherspavilion.com.au/", "https://www.batherspavilion.com.au/spaces/restaurant/"],
    description: "Balmoral fine dining restaurant and bar serving lunch, dinner, seafood and harbourfront dining.",
  },
  {
    name: "The Fernery Mosman",
    url: "https://www.thefernerymosman.com.au/",
    suburb: "Mosman",
    city: "Sydney",
    state: "NSW",
    address: "719 Military Road, Mosman NSW 2088",
    catalogs: ["https://www.thefernerymosman.com.au/", "https://www.thefernerymosman.com.au/what-s-on"],
    description: "Lower North Shore rooftop bar and restaurant serving cocktails, relaxed dining and city views.",
  },
  {
    name: "RAFI North Sydney",
    url: "https://rafisydney.com.au/",
    suburb: "North Sydney",
    city: "Sydney",
    state: "NSW",
    address: "99 Mount Street, North Sydney NSW 2060",
    catalogs: ["https://rafisydney.com.au/", "https://rafisydney.com.au/whats-on/"],
    description: "North Sydney restaurant and bar serving lunch, dinner, cocktails and large-format dining.",
  },
  {
    name: "Kipling's Garage Bar Turramurra",
    url: "https://kiplingsgaragebar.com.au/",
    suburb: "Turramurra",
    city: "Sydney",
    state: "NSW",
    address: "2 Eastern Road, Turramurra NSW 2074",
    catalogs: ["https://kiplingsgaragebar.com.au/"],
    description: "Upper North Shore bar and restaurant serving dinner, drinks, cocktails and casual dining.",
  },
  {
    name: "The Fiddler Rouse Hill",
    url: "https://www.thefiddler.com.au/",
    suburb: "Rouse Hill",
    city: "Sydney",
    state: "NSW",
    address: "Commercial Road, Rouse Hill NSW 2155",
    catalogs: ["https://www.thefiddler.com.au/", "https://www.thefiddler.com.au/whats-on/"],
    description: "Hills District pub, restaurant, cocktail garden and live-entertainment venue for lunch, dinner and events.",
  },
  {
    name: "Lilymu Parramatta",
    url: "https://www.lilymu.com/",
    suburb: "Parramatta",
    city: "Sydney",
    state: "NSW",
    address: "153 Macquarie Street, Parramatta NSW 2150",
    catalogs: ["https://www.lilymu.com/"],
    description: "Western Sydney Asian restaurant and bar serving lunch, dinner, cocktails and shared dining.",
  },
  {
    name: "Nick and Nora's Parramatta",
    url: "https://nickandnoras.com.au/parramatta",
    suburb: "Parramatta",
    city: "Sydney",
    state: "NSW",
    address: "45 Macquarie Street, Parramatta NSW 2150",
    catalogs: ["https://nickandnoras.com.au/parramatta"],
    description: "Parramatta rooftop cocktail and champagne bar serving drinks, snacks and elevated evening dining.",
  },
  {
    name: "The Log Cabin Penrith",
    url: "https://www.thelogcabin.com.au/",
    suburb: "Penrith",
    city: "Sydney",
    state: "NSW",
    address: "20 Memorial Avenue, Penrith NSW 2750",
    catalogs: ["https://www.thelogcabin.com.au/", "https://www.thelogcabin.com.au/whats-on"],
    description: "Penrith riverside restaurant, bar and live-event venue serving lunch, dinner and drinks.",
  },
  {
    name: "Sittanos Penrith",
    url: "https://sittanos.com.au/",
    suburb: "Penrith",
    city: "Sydney",
    state: "NSW",
    address: "585 High Street, Penrith NSW 2750",
    catalogs: ["https://sittanos.com.au/"],
    description: "Penrith bar and restaurant serving Italian-style lunch, dinner and al fresco dining.",
  },
  {
    name: "The Paper Mill Food Liverpool",
    url: "https://www.thepapermillfood.com/",
    suburb: "Liverpool",
    city: "Sydney",
    state: "NSW",
    address: "20 Shepherd Street, Liverpool NSW 2170",
    catalogs: ["https://www.thepapermillfood.com/"],
    description: "Liverpool food precinct with restaurants, bars, lunch, dinner and riverside South West Sydney dining.",
  },
  {
    name: "Bellbird Dining and Bar Casula",
    url: "https://www.casulapowerhouse.com/visit/bellbird-dining-and-bar",
    suburb: "Casula",
    city: "Sydney",
    state: "NSW",
    address: "1 Powerhouse Road, Casula NSW 2170",
    catalogs: ["https://www.casulapowerhouse.com/visit/bellbird-dining-and-bar"],
    description: "Casula Powerhouse restaurant and bar serving lunch, dinner, gallery dining and South West Sydney events.",
  },
  {
    name: "Rocksia Hotel Banksia",
    url: "https://www.rocksia.com.au/",
    suburb: "Banksia",
    city: "Sydney",
    state: "NSW",
    address: "299 Princes Highway, Banksia NSW 2216",
    catalogs: ["https://www.rocksia.com.au/", "https://www.rocksia.com.au/whats-on/"],
    description: "St George hotel, restaurant and bar serving lunch, dinner, drinks and live entertainment.",
  },
  {
    name: "Blackwood Cronulla",
    url: "https://blackwoodhospitality.com.au/",
    suburb: "Cronulla",
    city: "Sydney",
    state: "NSW",
    address: "5/33 Surf Lane, Cronulla NSW 2230",
    catalogs: ["https://blackwoodhospitality.com.au/"],
    description: "Sutherland Shire restaurant group serving lunch, dinner, drinks and coastal dining in Cronulla.",
  },
  {
    name: "Sea Level Cronulla",
    url: "https://sealevel.com.au/",
    suburb: "Cronulla",
    city: "Sydney",
    state: "NSW",
    address: "2 The Kingsway, Cronulla NSW 2230",
    catalogs: ["https://sealevel.com.au/"],
    description: "Cronulla beachfront restaurant serving lunch, dinner, seafood and Sutherland Shire oceanfront dining.",
  },
  {
    name: "Sax Barangaroo",
    url: "https://www.barangaroo.com/eat-drink/sax",
    suburb: "Barangaroo",
    city: "Sydney",
    state: "NSW",
    address: "Barangaroo NSW 2000",
    catalogs: ["https://www.barangaroo.com/eat-drink/sax"],
    description: "Barangaroo lounge, restaurant and cocktail bar with evening cocktails and live-music programming.",
  },
  {
    name: "Rekodo Restaurant and Vinyl Bar Barangaroo",
    url: "https://www.barangaroo.com/eat-drink/rekodo-restaurant-and-vinyl-bar",
    suburb: "Barangaroo",
    city: "Sydney",
    state: "NSW",
    address: "Level 1, 35 Barangaroo Avenue, Barangaroo NSW 2000",
    catalogs: ["https://www.barangaroo.com/eat-drink/rekodo-restaurant-and-vinyl-bar"],
    description: "Barangaroo Japanese restaurant and vinyl bar with cocktails, DJs, lunch, dinner and skyline views.",
  },
  {
    name: "Smoke Bar Barangaroo",
    url: "https://www.barangaroo.com/eat-drink/smoke-bar",
    suburb: "Barangaroo",
    city: "Sydney",
    state: "NSW",
    address: "35 Barangaroo Avenue, Barangaroo NSW 2000",
    catalogs: ["https://www.barangaroo.com/eat-drink/smoke-bar"],
    description: "Barangaroo rooftop cocktail and champagne bar with DJs, small plates and evening drinks.",
  },
  {
    name: "SORA Sydney",
    url: "https://sorasydney.com/",
    suburb: "Sydney CBD",
    city: "Sydney",
    state: "NSW",
    address: "Sydney CBD NSW 2000",
    catalogs: ["https://sorasydney.com/"],
    description: "Sydney CBD rooftop sky lounge serving refined cocktails, dining and music-led evening service.",
  },
  {
    name: "Rockpool Bar and Grill Sydney",
    url: "https://rockpoolbarandgrill.com.au/sydney/",
    suburb: "Sydney CBD",
    city: "Sydney",
    state: "NSW",
    address: "66 Hunter Street, Sydney NSW 2000",
    catalogs: ["https://rockpoolbarandgrill.com.au/sydney/", "https://rockpoolbarandgrill.com.au/lounge/"],
    description: "Sydney CBD fine dining steakhouse and cocktail lounge serving lunch, dinner and live-music drinks.",
  },
  {
    name: "Bar 83 Sydney Tower",
    url: "https://bar83sydneytower.com.au/",
    suburb: "Sydney CBD",
    city: "Sydney",
    state: "NSW",
    address: "Westfield Sydney, 108 Market Street, Sydney NSW 2000",
    catalogs: ["https://bar83sydneytower.com.au/"],
    description: "Sydney Tower cocktail bar serving drinks, small plates and skyline dining above the CBD.",
  },
  {
    name: "Shell House Sydney",
    url: "https://shellhouse.com.au/",
    suburb: "Sydney CBD",
    city: "Sydney",
    state: "NSW",
    address: "37 Margaret Street, Sydney NSW 2000",
    catalogs: ["https://shellhouse.com.au/"],
    description: "Sydney CBD restaurant, dining room, terrace and cocktail bar serving lunch, dinner and late drinks.",
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

async function verifyAndSaveStore(venue: DiningVenue, categoryId: number, ownerId: number) {
  const savedStore = await prisma.store.upsert({
    where: { url: venue.url },
    update: {
      name: venue.name,
      suburb: venue.suburb,
      city: venue.city,
      state: venue.state,
      country: "Australia",
      contact: venue.contact,
      address: venue.address,
      description: venue.description,
      catalogs: venue.catalogs || [],
      sourceType: "website",
      websiteUrl: venue.websiteUrl || venue.url,
      locationSource: "suburb",
      categoryId,
    },
    create: {
      name: venue.name,
      url: venue.url,
      suburb: venue.suburb,
      city: venue.city,
      state: venue.state,
      country: "Australia",
      contact: venue.contact,
      address: venue.address,
      description: venue.description,
      catalogs: venue.catalogs || [],
      sourceType: "website",
      websiteUrl: venue.websiteUrl || venue.url,
      locationSource: "suburb",
      categoryId,
      ownerId,
    },
  });

  const verificationUrl = venue.websiteUrl || venue.url;
  const result = await OfferVerifier.verifyStoreOfferPages(verificationUrl, venue.catalogs || [], {
    country: "Australia",
    profile: "dining",
    maxPages: 5,
    requestTimeoutMs: 12000,
  });

  const { removedCatalogUrls } = await updateCatalogUrlHealth(prisma, savedStore.id, venue.catalogs || [], result);
  if (removedCatalogUrls.length > 0) {
    console.log(`catalog-prune: ${venue.name} -> ${removedCatalogUrls.join(", ")}`);
  }

  const matchedUrl = result.matchedUrl;
  const ignoredOffer = matchedUrl
    ? venue.ignoredOfferUrlPatterns?.some((pattern) => pattern.test(matchedUrl))
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
    console.log(`offer: ${venue.name} -> ${result.matchedKeywords.join(", ")} @ ${matchedUrl}`);
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
    `no-offer: ${venue.name}${ignoredOffer ? ` (ignored ${matchedUrl})` : ""}${
      deleted.count > 0 ? ` (removed ${deleted.count})` : ""
    }`
  );
  return { store: 1, offer: 0 };
}

async function main() {
  const owner = await prisma.user.findFirst({ orderBy: { id: "asc" } });
  if (!owner) {
    throw new Error("No user found to own seeded NSW dining stores.");
  }

  const category = await prisma.category.upsert({
    where: { name: CATEGORY_NAME },
    update: {},
    create: { name: CATEGORY_NAME },
  });

  let savedStores = 0;
  let verifiedOffers = 0;

  for (let index = 0; index < venues.length; index += VERIFY_CONCURRENCY) {
    const batch = venues.slice(index, index + VERIFY_CONCURRENCY);
    const results = await Promise.all(batch.map((venue) => verifyAndSaveStore(venue, category.id, owner.id)));
    savedStores += results.reduce((sum, result) => sum + result.store, 0);
    verifiedOffers += results.reduce((sum, result) => sum + result.offer, 0);
  }

  console.log(`Seeded ${savedStores} NSW dining and beverage venues. Verified offers: ${verifiedOffers}.`);
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
