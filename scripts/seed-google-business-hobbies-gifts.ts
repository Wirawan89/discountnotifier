import { PrismaClient } from "@prisma/client";
import { getLiveVerifiedOfferEndDate } from "../src/lib/offer-lifecycle";
import { OfferVerifier, type OfferVerifierOptions } from "../src/lib/offer-verifier";

const prisma = new PrismaClient();

type SeedStore = {
  name: string;
  suburb: string;
  city: string;
  googleQuery: string;
  websiteUrl?: string;
  catalogs?: string[];
};

type SeedCategory = {
  name: string;
  profile: NonNullable<OfferVerifierOptions["profile"]>;
  stores: SeedStore[];
};

const categoriesToSeed: SeedCategory[] = [
  {
    name: "Hobbies & Classes",
    profile: "services",
    stores: [
      {
        name: "WeTeachMe Australia",
        suburb: "Melbourne",
        city: "Melbourne",
        googleQuery: "WeTeachMe Australia creative classes",
        websiteUrl: "https://www.weteachme.com/",
      },
      {
        name: "ClassBento Sydney",
        suburb: "Sydney",
        city: "Sydney",
        googleQuery: "ClassBento Sydney classes workshops",
        websiteUrl: "https://classbento.com.au/",
      },
      {
        name: "Zentopia Studio Sydney",
        suburb: "Sydney",
        city: "Sydney",
        googleQuery: "Zentopia Studio Sydney pottery classes",
        websiteUrl: "https://www.zentopiastudio.com/",
      },
      {
        name: "Something at Mary's Pottery",
        suburb: "Marrickville",
        city: "Sydney",
        googleQuery: "Something at Mary's Marrickville pottery classes",
        websiteUrl: "https://somethingatmarys.com/",
      },
      {
        name: "The Ceramic Studio Brisbane",
        suburb: "Indooroopilly",
        city: "Brisbane",
        googleQuery: "The Ceramic Studio Indooroopilly pottery classes",
        websiteUrl: "https://www.theceramicstudio.com.au/",
      },
      {
        name: "Cork & Chroma Brisbane",
        suburb: "West End",
        city: "Brisbane",
        googleQuery: "Cork and Chroma Brisbane paint and sip",
        websiteUrl: "https://www.corkandchroma.com.au/",
      },
      {
        name: "Cork & Chroma Sydney",
        suburb: "Surry Hills",
        city: "Sydney",
        googleQuery: "Cork and Chroma Sydney paint and sip",
        websiteUrl: "https://www.corkandchroma.com.au/",
      },
      {
        name: "JAI Martial Arts",
        suburb: "Sydney",
        city: "Sydney",
        googleQuery: "JAI Martial Arts Sydney taekwondo classes",
        websiteUrl: "https://www.jaimartialarts.com.au/",
      },
      {
        name: "North Sydney Community Centre",
        suburb: "North Sydney",
        city: "Sydney",
        googleQuery: "North Sydney Community Centre classes",
        websiteUrl: "https://www.northsydneycentre.com.au/",
      },
      {
        name: "Sydney Dance Company Classes",
        suburb: "Dawes Point",
        city: "Sydney",
        googleQuery: "Sydney Dance Company classes",
        websiteUrl: "https://www.sydneydancecompany.com/classes/",
      },
      {
        name: "Dance Central Sydney",
        suburb: "Surry Hills",
        city: "Sydney",
        googleQuery: "Dance Central Sydney classes",
        websiteUrl: "https://dancecentral.com.au/",
      },
      {
        name: "Sydney Cooking School",
        suburb: "Neutral Bay",
        city: "Sydney",
        googleQuery: "Sydney Cooking School Neutral Bay",
        websiteUrl: "https://www.sydneycookingschool.com.au/",
      },
      {
        name: "Otao Kitchen Melbourne",
        suburb: "Richmond",
        city: "Melbourne",
        googleQuery: "Otao Kitchen Richmond cooking classes",
        websiteUrl: "https://otaokitchen.com.au/",
      },
      {
        name: "Laneway Learning Melbourne",
        suburb: "Melbourne",
        city: "Melbourne",
        googleQuery: "Laneway Learning Melbourne classes",
        websiteUrl: "https://www.lanewaylearning.com/",
      },
      {
        name: "Work-Shop Melbourne",
        suburb: "Fitzroy",
        city: "Melbourne",
        googleQuery: "Work-Shop Melbourne creative classes",
      },
      {
        name: "Work-Shop Sydney",
        suburb: "Redfern",
        city: "Sydney",
        googleQuery: "Work-Shop Sydney creative classes",
      },
      {
        name: "Kumon Chatswood",
        suburb: "Chatswood",
        city: "Sydney",
        googleQuery: "Kumon Chatswood tutoring",
      },
      {
        name: "North Shore Coaching College Chatswood",
        suburb: "Chatswood",
        city: "Sydney",
        googleQuery: "North Shore Coaching College Chatswood",
      },
      {
        name: "Australian Taekwondo Centre Melbourne",
        suburb: "Melbourne",
        city: "Melbourne",
        googleQuery: "Australian Taekwondo Centre Melbourne classes",
      },
      {
        name: "Brisbane Dance Workshop",
        suburb: "Brisbane",
        city: "Brisbane",
        googleQuery: "Brisbane dance classes workshop",
      },
      {
        name: "Perth Pottery and Sculpture Classes",
        suburb: "Perth",
        city: "Perth",
        googleQuery: "Perth pottery classes studio",
      },
      {
        name: "Adelaide Central School of Art Short Courses",
        suburb: "Adelaide",
        city: "Adelaide",
        googleQuery: "Adelaide art classes short courses",
      },
      {
        name: "Canberra Glassworks Classes",
        suburb: "Kingston",
        city: "Canberra",
        googleQuery: "Canberra Glassworks classes",
        websiteUrl: "https://canberraglassworks.com/",
      },
      {
        name: "Hobart Pottery Classes",
        suburb: "Hobart",
        city: "Hobart",
        googleQuery: "Hobart pottery classes studio",
      },
    ],
  },
  {
    name: "Gifts & Flowers",
    profile: "retailShop",
    stores: [
      {
        name: "V by Vie Alexandria",
        suburb: "Alexandria",
        city: "Sydney",
        googleQuery: "V by Vie Alexandria florist gift shop",
        websiteUrl: "https://vbyvie.com.au/",
      },
      {
        name: "Flowers Across Australia",
        suburb: "Brisbane",
        city: "Brisbane",
        googleQuery: "Flowers Across Australia florist",
        websiteUrl: "https://www.flowersacross.com.au/",
      },
      {
        name: "Pearsons Florist Sydney",
        suburb: "Sydney",
        city: "Sydney",
        googleQuery: "Pearsons Florist Sydney",
        websiteUrl: "https://pearsonsflorist.com.au/",
      },
      {
        name: "Lime Tree Bower Sydney",
        suburb: "Sydney",
        city: "Sydney",
        googleQuery: "Lime Tree Bower Sydney florist",
        websiteUrl: "https://limetreebower.com/",
      },
      {
        name: "Code Bloom Perth",
        suburb: "Mount Hawthorn",
        city: "Perth",
        googleQuery: "Code Bloom Mount Hawthorn florist",
        websiteUrl: "https://www.codebloom.com.au/",
      },
      {
        name: "Bowers and Flowers Leppington",
        suburb: "Leppington",
        city: "Sydney",
        googleQuery: "Bowers and Flowers Leppington florist",
        websiteUrl: "https://bowersandflowers.com.au/",
      },
      {
        name: "Bloomeroo Australia",
        suburb: "Sydney",
        city: "Sydney",
        googleQuery: "Bloomeroo Australia florist",
        websiteUrl: "https://www.bloomeroo.com.au/",
      },
      {
        name: "LVLY Australia",
        suburb: "Melbourne",
        city: "Melbourne",
        googleQuery: "LVLY Australia flowers gifts",
        websiteUrl: "https://www.lvly.com.au/",
      },
      {
        name: "Daily Blooms Melbourne",
        suburb: "Melbourne",
        city: "Melbourne",
        googleQuery: "Daily Blooms Melbourne florist",
        websiteUrl: "https://dailyblooms.com.au/",
      },
      {
        name: "Fig and Bloom Melbourne",
        suburb: "Melbourne",
        city: "Melbourne",
        googleQuery: "Fig and Bloom Melbourne florist",
        websiteUrl: "https://www.figandbloom.com/",
      },
      {
        name: "Flowers Vasette Fitzroy",
        suburb: "Fitzroy",
        city: "Melbourne",
        googleQuery: "Flowers Vasette Fitzroy florist",
        websiteUrl: "https://flowersvasette.com.au/",
      },
      {
        name: "The Little Market Bunch Melbourne",
        suburb: "Melbourne",
        city: "Melbourne",
        googleQuery: "The Little Market Bunch Melbourne",
        websiteUrl: "https://thelittlemarketbunch.com.au/",
      },
      {
        name: "Roses Only Australia",
        suburb: "Sydney",
        city: "Sydney",
        googleQuery: "Roses Only Australia flowers",
        websiteUrl: "https://www.rosesonly.com.au/",
      },
      {
        name: "Mr Roses Australia",
        suburb: "Sydney",
        city: "Sydney",
        googleQuery: "Mr Roses Australia",
        websiteUrl: "https://www.mrroses.com.au/",
      },
      {
        name: "Floraly Australia",
        suburb: "Sydney",
        city: "Sydney",
        googleQuery: "Floraly Australia flowers",
        websiteUrl: "https://www.floraly.com.au/",
      },
      {
        name: "Edible Blooms Australia",
        suburb: "Adelaide",
        city: "Adelaide",
        googleQuery: "Edible Blooms Australia gifts",
        websiteUrl: "https://www.edibleblooms.com.au/",
      },
      {
        name: "The Hamper Emporium",
        suburb: "Sydney",
        city: "Sydney",
        googleQuery: "The Hamper Emporium Australia",
        websiteUrl: "https://www.thehamperemporium.com.au/",
      },
      {
        name: "Gifts Australia",
        suburb: "Sydney",
        city: "Sydney",
        googleQuery: "Gifts Australia online gift shop",
        websiteUrl: "https://www.giftsaustralia.com.au/",
        catalogs: ["https://www.giftsaustralia.com.au/sale"],
      },
      {
        name: "Hardtofind Australia",
        suburb: "Sydney",
        city: "Sydney",
        googleQuery: "Hardtofind Australia gifts",
        websiteUrl: "https://www.hardtofind.com.au/",
      },
      {
        name: "Poppy Rose Brisbane",
        suburb: "Brisbane",
        city: "Brisbane",
        googleQuery: "Poppy Rose Brisbane florist",
      },
      {
        name: "Little Flowers Sydney",
        suburb: "Sydney",
        city: "Sydney",
        googleQuery: "Little Flowers Sydney florist",
      },
      {
        name: "Poho Flowers Potts Point",
        suburb: "Potts Point",
        city: "Sydney",
        googleQuery: "Poho Flowers Potts Point",
      },
      {
        name: "Daphne Florist Perth",
        suburb: "Perth",
        city: "Perth",
        googleQuery: "Daphne Florist Perth",
      },
      {
        name: "Fossick and Co Perth",
        suburb: "Perth",
        city: "Perth",
        googleQuery: "Fossick and Co Perth gift shop",
      },
    ],
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
  const endDate = getLiveVerifiedOfferEndDate(startDate, "services");

  return {
    title: `${storeName} Special Offers`,
    description: `Offer wording found on the store website (${matchedKeywords.join(", ")}). Check the store website or Google Business profile for live availability.`,
    startDate,
    endDate,
    eCatalog: [matchedUrl],
  };
}

async function seedCategory(categorySeed: SeedCategory, ownerId: number) {
  const category = await prisma.category.upsert({
    where: { name: categorySeed.name },
    update: {},
    create: { name: categorySeed.name },
  });

  let saved = 0;
  let offers = 0;

  for (const store of categorySeed.stores) {
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
      locationSource: "suburb",
      description: store.websiteUrl
        ? `Website-backed ${categorySeed.name} listing discovered from Google Business search.`
        : "Google Business profile listing. Live offer verification needs a website, business owner promotion, or a Google profile data provider.",
      categoryId: category.id,
      ownerId,
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
        profile: categorySeed.profile,
        maxPages: 6,
        requestTimeoutMs: 3000,
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
        console.log(`offer: ${categorySeed.name} / ${store.name} -> ${result.matchedKeywords.join(", ")} @ ${result.matchedUrl}`);
      } else {
        console.log(`no-offer: ${categorySeed.name} / ${store.name} website checked`);
      }
    } else {
      console.log(`google-business-only: ${categorySeed.name} / ${store.name} -> ${googleBusinessUrl}`);
    }
  }

  return { category: categorySeed.name, saved, offers };
}

async function main() {
  const owner = await prisma.user.findFirst({ orderBy: { id: "asc" } });

  if (!owner) {
    throw new Error("No user found to own seeded Google Business stores.");
  }

  const results = [];

  for (const categorySeed of categoriesToSeed) {
    results.push(await seedCategory(categorySeed, owner.id));
  }

  console.log(`Done. ${JSON.stringify(results, null, 2)}`);
}

main()
  .catch((error) => {
    console.error("Failed to seed Google Business Hobbies/Gifts stores:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
