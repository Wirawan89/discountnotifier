import { PrismaClient } from "@prisma/client";
import { updateCatalogUrlHealth } from "../src/lib/catalog-health";
import { getLiveVerifiedOfferEndDate } from "../src/lib/offer-lifecycle";
import { OfferVerifier } from "../src/lib/offer-verifier";

const prisma = new PrismaClient();
const CATEGORY_NAME = "Dining & Beverages";
const VERIFY_CONCURRENCY = 4;

type JapaneseDiningStore = {
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
};

const stores: JapaneseDiningStore[] = [
  {
    name: "Mensho Tokyo Sydney",
    url: "https://www.mensho.com.au/#sydney-nsw-2000-shop-2-temperance-lane",
    websiteUrl: "https://www.mensho.com.au/",
    suburb: "Sydney",
    city: "Sydney",
    state: "NSW",
    address: "Shop 2 Temperance Lane, Sydney NSW 2000",
    contact: "1300 339 603",
    catalogs: ["https://www.mensho.com.au/"],
    description: "Michelin-recommended Tokyo ramen restaurant with an Australian Sydney location.",
  },
  {
    name: "Mensho Tokyo Melbourne",
    url: "https://www.mensho.com.au/#melbourne-vic-3000-166-russell-street",
    websiteUrl: "https://www.mensho.com.au/",
    suburb: "Melbourne",
    city: "Melbourne",
    state: "VIC",
    address: "166 Russell Street, Melbourne VIC 3000",
    contact: "1300 339 603",
    catalogs: ["https://www.mensho.com.au/"],
    description: "Michelin-recommended Tokyo ramen restaurant with an Australian Melbourne location.",
  },
  {
    name: "Toko Sydney",
    url: "https://tokorestaurant.com/",
    suburb: "Sydney",
    city: "Sydney",
    state: "NSW",
    address: "Lower Ground, 275 George Street, Sydney NSW 2000",
    contact: "02 9357 6100",
    catalogs: ["https://tokorestaurant.com/contact/"],
    description: "Contemporary Japanese izakaya dining in Sydney CBD.",
  },
  {
    name: "Kisuke Potts Point",
    url: "https://www.kisukepottspoint.com/",
    suburb: "Potts Point",
    city: "Sydney",
    state: "NSW",
    address: "50 Llankelly Place, Potts Point NSW 2011",
    catalogs: ["https://www.kisukepottspoint.com/"],
    description: "Omakase restaurant led by Chef Morita, formerly of Kisuke Willoughby.",
  },
  {
    name: "Chaco Bar Potts Point",
    url: "https://chacobar.com.au/",
    suburb: "Potts Point",
    city: "Sydney",
    state: "NSW",
    address: "186-188 Victoria Street, Potts Point NSW 2011",
    contact: "(02) 8593 4567",
    catalogs: ["https://chacobar.com.au/"],
    description: "Japanese yakitori bar and restaurant in Potts Point.",
  },
  {
    name: "Tokyo Bird Surry Hills",
    url: "https://tokyobird.com.au/",
    suburb: "Surry Hills",
    city: "Sydney",
    state: "NSW",
    address: "226 Commonwealth Street, Surry Hills NSW 2010",
    contact: "(02) 8880 9971",
    catalogs: ["https://tokyobird.com.au/bookings/"],
    description: "Japanese whisky, yakitori and cocktail bar in Surry Hills.",
  },
  {
    name: "Haco Sydney",
    url: "https://hacosydney.com.au/",
    suburb: "Sydney",
    city: "Sydney",
    state: "NSW",
    address: "102/21 Alberta Street, Sydney NSW 2000",
    contact: "+61 408 866 285",
    catalogs: ["https://hacosydney.com.au/reservations/"],
    description: "Refined charcoal and tempura omakase restaurant in Sydney.",
  },
  {
    name: "Hanasuki Chatswood",
    url: "https://www.hanasuki.com.au/",
    suburb: "Chatswood",
    city: "Sydney",
    state: "NSW",
    address: "Shop 1, 18-26 Anderson Street, Chatswood NSW 2067",
    contact: "02 8376 3099",
    catalogs: ["https://www.hanasuki.com.au/contact-us/"],
    description: "Japanese dining in Chatswood focused on authentic Japanese culinary artistry.",
  },
  {
    name: "Moku Sydney",
    url: "https://www.mokusydney.com/",
    suburb: "Darlinghurst",
    city: "Sydney",
    state: "NSW",
    address: "163 Crown Street, Darlinghurst NSW 2010",
    contact: "(02) 8246 6138",
    catalogs: ["https://www.mokusydney.com/"],
    description: "Boutique Japanese fusion restaurant and bar with omakase sessions.",
  },
  {
    name: "Besuto Omakase",
    url: "https://besutosydney.com.au/",
    suburb: "Sydney",
    city: "Sydney",
    state: "NSW",
    address: "3 Underwood Street, Sydney NSW 2000",
    catalogs: ["https://besutosydney.com.au/"],
    description: "Traditional Japanese omakase restaurant in Sydney CBD.",
  },
  {
    name: "Izakaya Uomichi Sydney",
    url: "https://www.uomichi.com.au/",
    suburb: "Sydney",
    city: "Sydney",
    state: "NSW",
    address: "501 George Street, Sydney NSW 2000",
    catalogs: ["https://www.uomichi.com.au/"],
    description: "Japanese izakaya in Regent Place Sydney.",
  },
  {
    name: "Izy.Aki Paddington",
    url: "https://izyaki.com.au/",
    suburb: "Paddington",
    city: "Sydney",
    state: "NSW",
    address: "362 Oxford Street, Paddington NSW 2021",
    catalogs: ["https://izyaki.com.au/"],
    description: "Kappo omakase and izakaya-style Japanese bar in Paddington.",
  },
  {
    name: "Sachi Melbourne",
    url: "https://www.sachidon.com/",
    suburb: "Melbourne",
    city: "Melbourne",
    state: "VIC",
    address: "179 Queen Street, Melbourne VIC 3000",
    catalogs: ["https://www.sachidon.com/"],
    description: "Seafood, sushi and omakase restaurant shaped by Japanese technique.",
  },
  {
    name: "Kisumé Melbourne",
    url: "https://kisume.com.au/",
    suburb: "Melbourne",
    city: "Melbourne",
    state: "VIC",
    address: "175 Flinders Lane, Melbourne VIC 3000",
    contact: "(03) 9671 4888",
    catalogs: ["https://kisume.com.au/"],
    description: "Japanese fine dining, sushi, sashimi and omakase in Melbourne CBD.",
  },
  {
    name: "Kentaro Omakase Melbourne",
    url: "https://www.kentaro.com.au/",
    suburb: "Melbourne",
    city: "Melbourne",
    state: "VIC",
    address: "242 Exhibition Street, Melbourne VIC 3000",
    catalogs: ["https://www.kentaro.com.au/"],
    description: "Elevated Japanese omakase dining in Melbourne.",
  },
  {
    name: "Izakaya Domo Melbourne",
    url: "https://www.izakayadomo.com.au/",
    suburb: "Melbourne",
    city: "Melbourne",
    state: "VIC",
    address: "Melbourne CBD VIC 3000",
    catalogs: ["https://www.izakayadomo.com.au/"],
    description: "Hidden Melbourne izakaya with Japanese bar and restaurant dining.",
  },
  {
    name: "Wagaya Brisbane",
    url: "https://www.wagayabrisbane.com.au/",
    suburb: "Fortitude Valley",
    city: "Brisbane",
    state: "QLD",
    address: "Fortitude Valley QLD 4006",
    catalogs: ["https://www.wagayabrisbane.com.au/"],
    description: "Long-running authentic Japanese dining venue in Fortitude Valley.",
  },
  {
    name: "NIIWA Brisbane",
    url: "https://www.niiwa.com.au/",
    suburb: "Fortitude Valley",
    city: "Brisbane",
    state: "QLD",
    address: "James Street, Fortitude Valley QLD 4006",
    catalogs: ["https://www.niiwa.com.au/"],
    description: "Japanese izakaya restaurant and bar on James Street Brisbane.",
  },
  {
    name: "KU-O Japanese Brisbane",
    url: "https://kuojap.com/",
    suburb: "Woolloongabba",
    city: "Brisbane",
    state: "QLD",
    address: "Woolloongabba QLD 4102",
    catalogs: ["https://kuojap.com/"],
    description: "Authentic Japanese restaurant in Brisbane.",
  },
  {
    name: "Egawa-An Perth",
    url: "https://www.waegawaan.com/",
    suburb: "East Perth",
    city: "Perth",
    state: "WA",
    address: "East Perth WA 6004",
    catalogs: ["https://www.waegawaan.com/"],
    description: "Traditional Edomae-style omakase restaurant in East Perth.",
  },
  {
    name: "Ichirin Japanese Perth",
    url: "https://ichirin.com.au/",
    suburb: "Leeming",
    city: "Perth",
    state: "WA",
    address: "Leeming WA 6149",
    catalogs: ["https://ichirin.com.au/"],
    description: "Small family-run Japanese restaurant offering omakase and a la carte menus.",
  },
  {
    name: "Furaibo Perth",
    url: "https://www.furaibo.com.au/",
    suburb: "Perth",
    city: "Perth",
    state: "WA",
    address: "Perth WA 6000",
    catalogs: ["https://www.furaibo.com.au/"],
    description: "Authentic izakaya bar and restaurant in Perth CBD.",
  },
  {
    name: "Izakaya Sumi Perth",
    url: "https://izakayasumi.com.au/",
    suburb: "Perth",
    city: "Perth",
    state: "WA",
    address: "Perth WA 6000",
    catalogs: ["https://izakayasumi.com.au/"],
    description: "Casual Japanese izakaya dining in Perth.",
  },
  {
    name: "TUNO Izakaya Adelaide",
    url: "https://www.tuno.com.au/",
    suburb: "Adelaide",
    city: "Adelaide",
    state: "SA",
    address: "Adelaide SA 5000",
    catalogs: ["https://www.tuno.com.au/"],
    description: "Traditional yakitori, sake and ramen bar in Adelaide.",
  },
  {
    name: "Kappo Adelaide",
    url: "https://kappo.au/",
    suburb: "Adelaide",
    city: "Adelaide",
    state: "SA",
    address: "33 Wright Court, Adelaide SA 5000",
    contact: "08 7084 5931",
    catalogs: ["https://kappo.au/"],
    description: "Japanese comfort dining and izakaya in Adelaide.",
  },
  {
    name: "Ramen & Izakaya Himeji Adelaide",
    url: "https://ramenizakaya-himeji.com/",
    suburb: "Adelaide",
    city: "Adelaide",
    state: "SA",
    address: "Grote Street, Adelaide SA 5000",
    catalogs: ["https://ramenizakaya-himeji.com/"],
    description: "Ramen and izakaya restaurant with traditional Japanese atmosphere in Adelaide.",
  },
  {
    name: "Kushi Izakaya Canberra",
    url: "https://www.kushiizakaya.com.au/",
    suburb: "Belconnen",
    city: "Canberra",
    state: "ACT",
    address: "Shop T15A, Capital Food Market, 15 Market Street, Belconnen ACT 2617",
    contact: "02 6170 3198",
    catalogs: ["https://www.kushiizakaya.com.au/"],
    description: "Traditional and modern Japanese dining in Canberra.",
  },
  {
    name: "Three Japanese Hobart",
    url: "https://www.3jp.com.au/",
    suburb: "Battery Point",
    city: "Hobart",
    state: "TAS",
    address: "38 Waterloo Crescent, Battery Point TAS 7004",
    contact: "0444 566 830",
    catalogs: ["https://www.3jp.com.au/"],
    description: "Authentic Japanese restaurant in Battery Point, Hobart.",
  },
  {
    name: "Shingeki Yakiniku Hobart",
    url: "https://www.shingekiyakiniku.com/",
    suburb: "North Hobart",
    city: "Hobart",
    state: "TAS",
    address: "366A Elizabeth Street, North Hobart TAS 7000",
    catalogs: ["https://www.shingekiyakiniku.com/"],
    description: "Japanese yakiniku restaurant in North Hobart.",
  },
];

function createOffer(storeName: string, matchedUrl: string, matchedKeywords: string[]) {
  const startDate = new Date();
  const endDate = getLiveVerifiedOfferEndDate(startDate, "dining");
  const hasHappyHour = matchedKeywords.some((keyword) => /happy hour/i.test(keyword));

  return {
    title: hasHappyHour ? `${storeName} Happy Hour and Special Offers` : `${storeName} Special Offers`,
    description: `Offer wording found on the store website (${matchedKeywords.join(", ")}). Check the store website for live availability.`,
    startDate,
    endDate,
    eCatalog: [matchedUrl],
  };
}

async function verifyAndSaveStore(store: JapaneseDiningStore, categoryId: number, ownerId: number) {
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
      websiteUrl: store.websiteUrl,
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
      websiteUrl: store.websiteUrl,
      locationSource: "suburb",
      categoryId,
      ownerId,
    },
  });

  const verificationUrl = store.websiteUrl || store.url;
  const result = await OfferVerifier.verifyStoreOfferPages(verificationUrl, store.catalogs || [], {
    country: "Australia",
    profile: "dining",
  });

  const { removedCatalogUrls } = await updateCatalogUrlHealth(prisma, savedStore.id, store.catalogs || [], result);
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
      update: {
        ...offer,
        updatedAt: new Date(),
      },
      create: {
        ...offer,
        storeId: savedStore.id,
      },
    });
    console.log(`offer: ${store.name} -> ${result.matchedKeywords.join(", ")} @ ${result.matchedUrl}`);
    return { store: 1, offer: 1 };
  }

  const deleted = await prisma.discount.deleteMany({
    where: {
      storeId: savedStore.id,
      description: {
        startsWith: "Offer wording found on the store website",
      },
    },
  });

  console.log(`no-offer: ${store.name}${deleted.count > 0 ? ` (removed ${deleted.count})` : ""}`);
  return { store: 1, offer: 0 };
}

async function main() {
  const owner = await prisma.user.findFirst({ orderBy: { id: "asc" } });
  if (!owner) {
    throw new Error("No user found to own seeded Japanese dining stores.");
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

  console.log(`Seeded ${savedStores} authentic Japanese dining stores. Verified offers: ${verifiedOffers}.`);
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
