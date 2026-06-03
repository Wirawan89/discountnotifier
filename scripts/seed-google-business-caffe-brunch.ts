import { PrismaClient } from "@prisma/client";
import { getLiveVerifiedOfferEndDate } from "../src/lib/offer-lifecycle";
import { OfferVerifier } from "../src/lib/offer-verifier";

const prisma = new PrismaClient();
const CATEGORY_NAME = "Caffe & Brunch";

type GoogleBusinessCafe = {
  name: string;
  suburb: string;
  city: string;
  googleQuery: string;
  websiteUrl?: string;
  catalogs?: string[];
};

const googleBusinessCafes: GoogleBusinessCafe[] = [
  {
    name: "Eat Ozzo Marrickville",
    suburb: "Marrickville",
    city: "Sydney",
    googleQuery: "Eat Ozzo Marrickville cafe",
    websiteUrl: "https://www.eatozzo.com/marrickville",
  },
  {
    name: "Eat Ozzo Pyrmont",
    suburb: "Pyrmont",
    city: "Sydney",
    googleQuery: "Eat Ozzo Pyrmont cafe",
    websiteUrl: "https://www.eatozzo.com/",
  },
  {
    name: "Moka Pod Marrickville",
    suburb: "Marrickville",
    city: "Sydney",
    googleQuery: "Moka Pod Marrickville cafe",
    websiteUrl: "https://mokapod.com.au/",
  },
  {
    name: "Kitaya Cafe Chatswood",
    suburb: "Chatswood",
    city: "Sydney",
    googleQuery: "Kitaya Cafe Chatswood",
    websiteUrl: "https://www.kitaya.com.au/",
  },
  {
    name: "Kitaya Cafe North Sydney",
    suburb: "North Sydney",
    city: "Sydney",
    googleQuery: "Kitaya Cafe North Sydney",
    websiteUrl: "https://www.kitaya.com.au/",
  },
  {
    name: "Two Deers Cafe Burwood",
    suburb: "Burwood",
    city: "Sydney",
    googleQuery: "Two Deers Cafe Burwood",
    websiteUrl: "https://www.twodeerscafe.com.au/",
  },
  {
    name: "Circa Espresso Parramatta",
    suburb: "Parramatta",
    city: "Sydney",
    googleQuery: "Circa Espresso Parramatta cafe",
  },
  {
    name: "Lil Miss Collins Parramatta",
    suburb: "Parramatta",
    city: "Sydney",
    googleQuery: "Lil Miss Collins Parramatta cafe",
  },
  {
    name: "Hanna's Cafe Parramatta",
    suburb: "Parramatta",
    city: "Sydney",
    googleQuery: "Hanna's Cafe Parramatta brunch",
  },
  {
    name: "Antique Cherry Cafe Burwood",
    suburb: "Burwood",
    city: "Sydney",
    googleQuery: "Antique Cherry Cafe Burwood",
  },
  {
    name: "Double Tap Marrickville",
    suburb: "Marrickville",
    city: "Sydney",
    googleQuery: "Double Tap Marrickville cafe",
  },
  {
    name: "Ona Coffee Marrickville",
    suburb: "Marrickville",
    city: "Sydney",
    googleQuery: "Ona Coffee Marrickville",
  },
  {
    name: "Two Chaps Marrickville",
    suburb: "Marrickville",
    city: "Sydney",
    googleQuery: "Two Chaps Marrickville cafe",
  },
  {
    name: "Valentina's Marrickville",
    suburb: "Marrickville",
    city: "Sydney",
    googleQuery: "Valentina's Marrickville brunch",
  },
  {
    name: "Cafe Kooks Ultimo",
    suburb: "Ultimo",
    city: "Sydney",
    googleQuery: "Cafe Kooks Ultimo",
  },
  {
    name: "End of King Newtown",
    suburb: "Newtown",
    city: "Sydney",
    googleQuery: "End of King Newtown cafe",
  },
  {
    name: "Taguan Redfern",
    suburb: "Redfern",
    city: "Sydney",
    googleQuery: "Taguan Cafe Redfern",
  },
  {
    name: "Bellboy Cafe Brunswick East",
    suburb: "Brunswick East",
    city: "Melbourne",
    googleQuery: "Bellboy Cafe Brunswick East",
    websiteUrl: "https://bellboycafe.com.au/",
  },
  {
    name: "Marios Cafe Fitzroy",
    suburb: "Fitzroy",
    city: "Melbourne",
    googleQuery: "Marios Cafe Fitzroy",
    websiteUrl: "https://marioscafe.com.au/",
  },
  {
    name: "Elephant Cafe West Melbourne",
    suburb: "West Melbourne",
    city: "Melbourne",
    googleQuery: "Elephant Cafe West Melbourne",
    websiteUrl: "https://elephant-cafe.com.au/",
  },
  {
    name: "Tosha South Yarra",
    suburb: "South Yarra",
    city: "Melbourne",
    googleQuery: "Tosha South Yarra cafe",
    websiteUrl: "https://tosha.au/",
  },
  {
    name: "Market Lane Coffee South Yarra",
    suburb: "South Yarra",
    city: "Melbourne",
    googleQuery: "Market Lane Coffee South Yarra",
  },
  {
    name: "Auction Rooms North Melbourne",
    suburb: "North Melbourne",
    city: "Melbourne",
    googleQuery: "Auction Rooms North Melbourne cafe",
  },
  {
    name: "Proud Mary Collingwood",
    suburb: "Collingwood",
    city: "Melbourne",
    googleQuery: "Proud Mary Collingwood cafe",
  },
  {
    name: "Industry Beans Fitzroy",
    suburb: "Fitzroy",
    city: "Melbourne",
    googleQuery: "Industry Beans Fitzroy",
  },
  {
    name: "Top Paddock Richmond",
    suburb: "Richmond",
    city: "Melbourne",
    googleQuery: "Top Paddock Richmond cafe",
  },
  {
    name: "St Ali South Melbourne",
    suburb: "South Melbourne",
    city: "Melbourne",
    googleQuery: "St Ali South Melbourne cafe",
  },
  {
    name: "Seven Seeds Carlton",
    suburb: "Carlton",
    city: "Melbourne",
    googleQuery: "Seven Seeds Carlton cafe",
  },
  {
    name: "Felix for Good Brisbane",
    suburb: "Brisbane City",
    city: "Brisbane",
    googleQuery: "Felix for Good Brisbane cafe",
  },
  {
    name: "Pawpaw Cafe Woolloongabba",
    suburb: "Woolloongabba",
    city: "Brisbane",
    googleQuery: "Pawpaw Cafe Woolloongabba",
  },
  {
    name: "Little Loco New Farm",
    suburb: "New Farm",
    city: "Brisbane",
    googleQuery: "Little Loco New Farm cafe",
  },
  {
    name: "Nodo Newstead",
    suburb: "Newstead",
    city: "Brisbane",
    googleQuery: "Nodo Newstead cafe",
  },
  {
    name: "King Arthur Fortitude Valley",
    suburb: "Fortitude Valley",
    city: "Brisbane",
    googleQuery: "King Arthur Fortitude Valley cafe",
  },
  {
    name: "La Veen Coffee Perth",
    suburb: "Perth",
    city: "Perth",
    googleQuery: "La Veen Coffee Perth",
  },
  {
    name: "Hylin West Leederville",
    suburb: "West Leederville",
    city: "Perth",
    googleQuery: "Hylin West Leederville cafe",
  },
  {
    name: "Little Lefroy Fremantle",
    suburb: "Fremantle",
    city: "Perth",
    googleQuery: "Little Lefroy Fremantle cafe",
  },
  {
    name: "Gordon St Garage West Perth",
    suburb: "West Perth",
    city: "Perth",
    googleQuery: "Gordon St Garage West Perth",
  },
  {
    name: "Daisies Cottesloe",
    suburb: "Cottesloe",
    city: "Perth",
    googleQuery: "Daisies Cottesloe cafe",
  },
  {
    name: "Peter Rabbit Adelaide",
    suburb: "Adelaide",
    city: "Adelaide",
    googleQuery: "Peter Rabbit Adelaide cafe",
  },
  {
    name: "Exchange Coffee Adelaide",
    suburb: "Adelaide",
    city: "Adelaide",
    googleQuery: "Exchange Coffee Adelaide cafe",
  },
  {
    name: "Part Time Lover Adelaide",
    suburb: "Adelaide",
    city: "Adelaide",
    googleQuery: "Part Time Lover Adelaide cafe",
  },
  {
    name: "Whistle and Flute Unley",
    suburb: "Unley",
    city: "Adelaide",
    googleQuery: "Whistle and Flute Unley cafe",
  },
  {
    name: "Dandy Lane Hobart",
    suburb: "Hobart",
    city: "Hobart",
    googleQuery: "Dandy Lane Hobart cafe",
  },
  {
    name: "Machine Laundry Cafe Hobart",
    suburb: "Salamanca",
    city: "Hobart",
    googleQuery: "Machine Laundry Cafe Hobart",
  },
  {
    name: "Sweet Bones Braddon",
    suburb: "Braddon",
    city: "Canberra",
    googleQuery: "Sweet Bones Braddon cafe",
  },
  {
    name: "Highroad Dickson",
    suburb: "Dickson",
    city: "Canberra",
    googleQuery: "Highroad Dickson cafe",
  },
  {
    name: "The Cupping Room Canberra",
    suburb: "Canberra City",
    city: "Canberra",
    googleQuery: "The Cupping Room Canberra",
  },
  {
    name: "Laneway Specialty Coffee Darwin",
    suburb: "Parap",
    city: "Darwin",
    googleQuery: "Laneway Specialty Coffee Darwin",
  },
  {
    name: "Ruby G's Canteen Darwin",
    suburb: "Darwin",
    city: "Darwin",
    googleQuery: "Ruby G's Canteen Darwin cafe",
  },
  {
    name: "Commune Burleigh Heads",
    suburb: "Burleigh Heads",
    city: "Gold Coast",
    googleQuery: "Commune Burleigh Heads cafe",
  },
  {
    name: "Barefoot Barista Palm Beach",
    suburb: "Palm Beach",
    city: "Gold Coast",
    googleQuery: "Barefoot Barista Palm Beach cafe",
  },
  {
    name: "Daark Espresso Chirn Park",
    suburb: "Chirn Park",
    city: "Gold Coast",
    googleQuery: "Daark Espresso Chirn Park",
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
    throw new Error("No user found to own seeded Google Business cafes.");
  }

  const category = await prisma.category.upsert({
    where: { name: CATEGORY_NAME },
    update: {},
    create: { name: CATEGORY_NAME },
  });

  let saved = 0;
  let offers = 0;

  for (const store of googleBusinessCafes) {
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
        ? "Website-backed cafe listing discovered from Google Business search."
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

  console.log(`Done. Saved ${saved} Google Business sourced ${CATEGORY_NAME} store(s), verified ${offers} website-backed offer(s).`);
}

main()
  .catch((error) => {
    console.error("Failed to seed Google Business Caffe & Brunch stores:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
