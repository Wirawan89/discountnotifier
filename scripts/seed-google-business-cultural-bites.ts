import { PrismaClient } from "@prisma/client";
import { getLiveVerifiedOfferEndDate } from "../src/lib/offer-lifecycle";
import { OfferVerifier } from "../src/lib/offer-verifier";

const prisma = new PrismaClient();
const CATEGORY_NAME = "Cultural Bites & Takeaway";

type GoogleBusinessStore = {
  name: string;
  suburb: string;
  city: string;
  googleQuery: string;
  websiteUrl?: string;
  catalogs?: string[];
};

const googleBusinessStores: GoogleBusinessStore[] = [
  {
    name: "Banh Cuon Ba Oanh",
    suburb: "Cabramatta",
    city: "Sydney",
    googleQuery: "Banh Cuon Ba Oanh Cabramatta",
  },
  {
    name: "Banh Cuon Ba Oanh Chatswood",
    suburb: "Chatswood",
    city: "Sydney",
    googleQuery: "Banh Cuon Ba Oanh Chatswood",
  },
  {
    name: "Banh Cuon Tay Ho",
    suburb: "Bankstown",
    city: "Sydney",
    googleQuery: "Banh Cuon Tay Ho Bankstown",
  },
  {
    name: "Tan Viet Noodle House Eastwood",
    suburb: "Eastwood",
    city: "Sydney",
    googleQuery: "Tan Viet Noodle House Eastwood",
    websiteUrl: "https://tanviet.com.au/",
  },
  {
    name: "Pho An Bankstown",
    suburb: "Bankstown",
    city: "Sydney",
    googleQuery: "Pho An Bankstown",
  },
  {
    name: "Nhu Lan Bakery Footscray",
    suburb: "Footscray",
    city: "Melbourne",
    googleQuery: "Nhu Lan Bakery Footscray",
  },
  {
    name: "To's Bakery Footscray",
    suburb: "Footscray",
    city: "Melbourne",
    googleQuery: "To's Bakery Footscray",
  },
  {
    name: "Bun Bun Bakery Springvale",
    suburb: "Springvale",
    city: "Melbourne",
    googleQuery: "Bun Bun Bakery Springvale",
  },
  {
    name: "Luke's Vietnamese Bakery Reservoir",
    suburb: "Reservoir",
    city: "Melbourne",
    googleQuery: "Luke's Vietnamese Bakery Reservoir",
  },
  {
    name: "Medan Ciak Sydney",
    suburb: "Sydney",
    city: "Sydney",
    googleQuery: "Medan Ciak Sydney",
    websiteUrl: "https://medanciak.com.au/",
  },
  {
    name: "Warung Pojok Melbourne",
    suburb: "Melbourne",
    city: "Melbourne",
    googleQuery: "Warung Pojok Melbourne Indonesian restaurant",
  },
  {
    name: "Sawah Sydney",
    suburb: "Sydney",
    city: "Sydney",
    googleQuery: "Sawah Sydney Indonesian restaurant",
  },
  {
    name: "MakYos Indonesian Restaurant",
    suburb: "Melbourne",
    city: "Melbourne",
    googleQuery: "MakYos Indonesian Restaurant Melbourne",
  },
  {
    name: "Momo Central Ashfield",
    suburb: "Ashfield",
    city: "Sydney",
    googleQuery: "Momo Central Ashfield",
  },
  {
    name: "Momo Station Melbourne",
    suburb: "Melbourne",
    city: "Melbourne",
    googleQuery: "Momo Station Melbourne",
  },
  {
    name: "Himalayan Momo House Brisbane",
    suburb: "Brisbane",
    city: "Brisbane",
    googleQuery: "Himalayan Momo House Brisbane",
  },
  {
    name: "Chatkazz Harris Park",
    suburb: "Harris Park",
    city: "Sydney",
    googleQuery: "Chatkazz Harris Park",
    websiteUrl: "https://www.chatkazz.com.au/",
  },
  {
    name: "Aangan Indian Restaurant West Footscray",
    suburb: "West Footscray",
    city: "Melbourne",
    googleQuery: "Aangan Indian Restaurant West Footscray",
    websiteUrl: "https://aangan.com.au/",
  },
  {
    name: "Hong Kong Bing Sutt Burwood",
    suburb: "Burwood",
    city: "Sydney",
    googleQuery: "Hong Kong Bing Sutt Burwood",
  },
  {
    name: "Kowloon Cafe Chatswood",
    suburb: "Chatswood",
    city: "Sydney",
    googleQuery: "Kowloon Cafe Chatswood",
  },
  {
    name: "Korean Street Food Perth",
    suburb: "Perth",
    city: "Perth",
    googleQuery: "Korean street food Perth takeaway",
  },
  {
    name: "Seoul Toast Melbourne",
    suburb: "Melbourne",
    city: "Melbourne",
    googleQuery: "Seoul Toast Melbourne Korean street food",
  },
  {
    name: "Kimchi House Adelaide",
    suburb: "Adelaide",
    city: "Adelaide",
    googleQuery: "Kimchi House Adelaide Korean takeaway",
  },
  {
    name: "Little Momo Perth",
    suburb: "Perth",
    city: "Perth",
    googleQuery: "Little Momo Perth Nepalese",
  },
  {
    name: "Banh Mi Factory Zillmere",
    suburb: "Zillmere",
    city: "Brisbane",
    googleQuery: "Banh Mi Factory Zillmere",
  },
  {
    name: "Banh Mi Thit Footscray",
    suburb: "Footscray",
    city: "Melbourne",
    googleQuery: "Banh Mi Thit Footscray",
  },
  {
    name: "Hanoi Rose Footscray",
    suburb: "Footscray",
    city: "Melbourne",
    googleQuery: "Hanoi Rose Footscray Vietnamese",
  },
  {
    name: "Pho Hung Vuong Saigon Footscray",
    suburb: "Footscray",
    city: "Melbourne",
    googleQuery: "Pho Hung Vuong Saigon Footscray",
  },
  {
    name: "Co Thu Quan Footscray",
    suburb: "Footscray",
    city: "Melbourne",
    googleQuery: "Co Thu Quan Footscray",
  },
  {
    name: "Pho Hung Vuong Springvale",
    suburb: "Springvale",
    city: "Melbourne",
    googleQuery: "Pho Hung Vuong Springvale",
  },
  {
    name: "Banh Mi Stand Springvale",
    suburb: "Springvale",
    city: "Melbourne",
    googleQuery: "banh mi Springvale Vietnamese bakery",
  },
  {
    name: "Indonesian Street Food Kingsford",
    suburb: "Kingsford",
    city: "Sydney",
    googleQuery: "Indonesian street food Kingsford Sydney",
  },
  {
    name: "Shalom Indonesian Restaurant Kingsford",
    suburb: "Kingsford",
    city: "Sydney",
    googleQuery: "Shalom Indonesian Restaurant Kingsford",
  },
  {
    name: "Enjoy Mie Kensington",
    suburb: "Kensington",
    city: "Sydney",
    googleQuery: "Enjoy Mie Kensington Indonesian",
  },
  {
    name: "Ayam Goreng 99 Kingsford",
    suburb: "Kingsford",
    city: "Sydney",
    googleQuery: "Ayam Goreng 99 Kingsford",
  },
  {
    name: "Mie Kocok Bandung Sydney",
    suburb: "Sydney",
    city: "Sydney",
    googleQuery: "Mie Kocok Bandung Sydney Indonesian",
  },
  {
    name: "Dapur Indo Sydney",
    suburb: "Sydney",
    city: "Sydney",
    googleQuery: "Dapur Indo Sydney Indonesian",
  },
  {
    name: "Momo Bar Manuka",
    suburb: "Manuka",
    city: "Canberra",
    googleQuery: "Momo Bar Manuka Canberra",
  },
  {
    name: "The Hungry Buddha Belconnen",
    suburb: "Belconnen",
    city: "Canberra",
    googleQuery: "The Hungry Buddha Belconnen Nepalese",
  },
  {
    name: "Himalayan Nepalese Restaurant Inglewood",
    suburb: "Inglewood",
    city: "Perth",
    googleQuery: "Himalayan Nepalese Restaurant Inglewood Perth",
  },
  {
    name: "Momo House Northbridge",
    suburb: "Northbridge",
    city: "Perth",
    googleQuery: "Momo House Northbridge Perth",
  },
  {
    name: "Chai Bar Harris Park",
    suburb: "Harris Park",
    city: "Sydney",
    googleQuery: "Chai Bar Harris Park Indian street food",
  },
  {
    name: "Billu's Indian Eatery Harris Park",
    suburb: "Harris Park",
    city: "Sydney",
    googleQuery: "Billu's Indian Eatery Harris Park",
  },
  {
    name: "Dosa Hut Harris Park",
    suburb: "Harris Park",
    city: "Sydney",
    googleQuery: "Dosa Hut Harris Park",
  },
  {
    name: "Delhi Streets Melbourne",
    suburb: "Melbourne",
    city: "Melbourne",
    googleQuery: "Delhi Streets Melbourne Indian street food",
  },
  {
    name: "Dosa Hut Dandenong",
    suburb: "Dandenong",
    city: "Melbourne",
    googleQuery: "Dosa Hut Dandenong",
  },
  {
    name: "Hong Kong Street Food Burwood",
    suburb: "Burwood",
    city: "Sydney",
    googleQuery: "Hong Kong street food Burwood Sydney",
  },
  {
    name: "Hong Kong Cafe Hurstville",
    suburb: "Hurstville",
    city: "Sydney",
    googleQuery: "Hong Kong cafe Hurstville",
  },
  {
    name: "Hong Kong BBQ Eastwood",
    suburb: "Eastwood",
    city: "Sydney",
    googleQuery: "Hong Kong BBQ Eastwood",
  },
  {
    name: "Korean Street Food Eastwood",
    suburb: "Eastwood",
    city: "Sydney",
    googleQuery: "Korean street food Eastwood Sydney",
  },
  {
    name: "Korean Toast Chatswood",
    suburb: "Chatswood",
    city: "Sydney",
    googleQuery: "Korean toast Chatswood",
  },
  {
    name: "Seoul Toast Box Hill",
    suburb: "Box Hill",
    city: "Melbourne",
    googleQuery: "Seoul Toast Box Hill Korean",
  },
  {
    name: "Korean Street Food Sunnybank",
    suburb: "Sunnybank",
    city: "Brisbane",
    googleQuery: "Korean street food Sunnybank Brisbane",
  },
  {
    name: "Thai Street Food Haymarket",
    suburb: "Haymarket",
    city: "Sydney",
    googleQuery: "Thai street food Haymarket Sydney",
  },
  {
    name: "Thai Street Food Richmond",
    suburb: "Richmond",
    city: "Melbourne",
    googleQuery: "Thai street food Richmond Melbourne",
  },
  {
    name: "Malaysian Street Food Sunnybank",
    suburb: "Sunnybank",
    city: "Brisbane",
    googleQuery: "Malaysian street food Sunnybank",
  },
  {
    name: "Roti King Perth",
    suburb: "Perth",
    city: "Perth",
    googleQuery: "Roti King Perth Malaysian",
  },
  {
    name: "Laksa House Adelaide",
    suburb: "Adelaide",
    city: "Adelaide",
    googleQuery: "Laksa House Adelaide Malaysian",
  },
  {
    name: "Vietnamese Bakery Darwin",
    suburb: "Darwin",
    city: "Darwin",
    googleQuery: "Vietnamese bakery Darwin banh mi",
  },
  {
    name: "Momo and Dumpling Hobart",
    suburb: "Hobart",
    city: "Hobart",
    googleQuery: "momo dumpling Hobart Nepalese",
  },
  {
    name: "Banh Mi Gold Coast",
    suburb: "Southport",
    city: "Gold Coast",
    googleQuery: "banh mi Southport Gold Coast",
  },
  {
    name: "Indian Street Food Gold Coast",
    suburb: "Southport",
    city: "Gold Coast",
    googleQuery: "Indian street food Southport Gold Coast",
  },
];

function googleSearchUrl(query: string) {
  const params = new URLSearchParams({
    q: query,
    source: "lnms",
    tbm: "lcl",
  });

  return `https://www.google.com/search?${params.toString()}`;
}

function createOffer(storeName: string, matchedUrl: string, matchedKeywords: string[]) {
  const startDate = new Date();
  const endDate = getLiveVerifiedOfferEndDate(startDate, "dining");

  return {
    title: `${storeName} Special Offers`,
    description: `Offer wording found on the store website (${matchedKeywords.join(", ")}). Check the store website or Google Business profile for live availability.`,
    startDate,
    endDate,
    eCatalog: [matchedUrl],
  };
}

async function main() {
  const owner = await prisma.user.findFirst({ orderBy: { id: "asc" } });

  if (!owner) {
    throw new Error("No user found to own seeded Google Business stores.");
  }

  const category = await prisma.category.upsert({
    where: { name: CATEGORY_NAME },
    update: {},
    create: { name: CATEGORY_NAME },
  });

  let saved = 0;
  let offers = 0;

  for (const store of googleBusinessStores) {
    const googleBusinessUrl = googleSearchUrl(store.googleQuery);
    const url = store.websiteUrl || googleBusinessUrl;
    const existingStore = await prisma.store.findFirst({
      where: {
        categoryId: category.id,
        name: store.name,
        suburb: store.suburb,
      },
    });
    const storeData = {
      name: store.name,
      url,
      suburb: store.suburb,
      city: store.city,
      country: "Australia",
      catalogs: store.catalogs || [],
      sourceType: store.websiteUrl ? "website" : "google_business",
      googleBusinessUrl,
      websiteUrl: store.websiteUrl,
      description: store.websiteUrl
        ? "Website-backed listing discovered from Google Business search."
        : "Google Business profile listing. Live offer verification needs a website, business owner promotion, or a Google profile data provider.",
      categoryId: category.id,
      ownerId: owner.id,
    };
    const savedStore = existingStore
      ? await prisma.store.update({
          where: { id: existingStore.id },
          data: storeData,
        })
      : await prisma.store.upsert({
          where: { url },
          update: storeData,
          create: storeData,
        });

    saved += 1;

    if (store.websiteUrl) {
      const result = await OfferVerifier.verifyStoreOfferPages(store.websiteUrl, store.catalogs || [], {
        country: "Australia",
        profile: "dining",
      });

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
        offers += 1;
        console.log(`offer: ${store.name} -> ${result.matchedKeywords.join(", ")} @ ${result.matchedUrl}`);
      } else {
        console.log(`no-offer: ${store.name} website checked`);
      }
    } else {
      console.log(`google-business-only: ${store.name} -> ${googleBusinessUrl}`);
    }
  }

  console.log(`Done. Saved ${saved} Google Business sourced Cultural Bites store(s), verified ${offers} website-backed offer(s).`);
}

main()
  .catch((error) => {
    console.error("Failed to seed Google Business Cultural Bites stores:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
