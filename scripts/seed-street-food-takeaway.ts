import { PrismaClient } from "@prisma/client";
import { OfferVerifier } from "../src/lib/offer-verifier";

const prisma = new PrismaClient();

const streetFoodStores = [
  {
    name: "VN Street Foods Marrickville",
    url: "https://www.vnstreetfoods.com.au/home",
    suburb: "Marrickville",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Hello Auntie Marrickville",
    url: "https://hello-auntie.com.au/",
    suburb: "Marrickville",
    city: "Sydney",
    catalogs: ["https://hello-auntie.com.au/menu/"],
  },
  {
    name: "Great Aunty Three",
    url: "https://greatauntythree.com/",
    suburb: "Enmore",
    city: "Sydney",
    catalogs: ["https://greatauntythree.com/menu/"],
  },
  {
    name: "Marrickville Pork Roll Darling Square",
    url: "https://www.darlingharbour.com/eat-drink/marrickville-pork-roll",
    suburb: "Haymarket",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Tan Viet Noodle House Cabramatta",
    url: "https://tanviet.com.au/",
    suburb: "Cabramatta",
    city: "Sydney",
    catalogs: ["https://tanviet.com.au/locations/"],
  },
  {
    name: "Bau Truong Cabramatta",
    url: "https://www.bautruong.com.au/",
    suburb: "Cabramatta",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Pho Tau Bay Cabramatta",
    url: "https://restaurantguru.com/Pho-Tau-Bay-Cabramatta-2",
    suburb: "Cabramatta",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Tam Broken Rice Canley Vale",
    url: "https://australia.chamberofcommerce.com/business-directory/new-south-wales/canley-vale/vietnamese-restaurant/4080877-tam-broken-rice-vietnamese-restaurant",
    suburb: "Canley Vale",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Banh Mi Bay Ngo Bankstown",
    url: "https://www.timeout.com/sydney/restaurants/banh-mi-bay-ngo",
    suburb: "Bankstown",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Roll'd Sydney",
    url: "https://rolld.com.au/",
    suburb: "Sydney",
    city: "Sydney",
    catalogs: ["https://rolld.com.au/offers/"],
  },
  {
    name: "Saigon Summer",
    url: "https://saigonsummer.com.au/",
    suburb: "Sydney Olympic Park",
    city: "Sydney",
    catalogs: ["https://saigonsummer.com.au/about-us/"],
  },
  {
    name: "Ho Jiak Haymarket",
    url: "https://www.hojiak.com.au/haymarket/",
    suburb: "Haymarket",
    city: "Sydney",
    catalogs: ["https://www.hojiak.com.au/whats-on/"],
  },
  {
    name: "Mamak Haymarket",
    url: "https://www.mamak.com.au/#haymarket",
    suburb: "Haymarket",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Mamak Chatswood",
    url: "https://www.mamak.com.au/#chatswood",
    suburb: "Chatswood",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Mamak Parramatta",
    url: "https://www.mamak.com.au/#parramatta",
    suburb: "Parramatta",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Chat Thai Haymarket",
    url: "https://chatthai.com/locations/",
    suburb: "Haymarket",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Dodee Paidang Haymarket",
    url: "https://www.dodeepaidang.com/",
    suburb: "Haymarket",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "King's Hot Bread Hurstville",
    url: "https://au.sluurpy.com/hurstville/restaurant/4568197/kings-hot-bread",
    suburb: "Hurstville",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Medan Ciak Sydney CBD",
    url: "https://medanciak.com.au/#sydney-cbd",
    suburb: "Sydney",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Medan Ciak Mascot",
    url: "https://medanciak.com.au/#mascot",
    suburb: "Mascot",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Pandawa Nasi Bungkus Sydney",
    url: "https://www.pandawa.com.au/",
    suburb: "Sydney",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Warung Pojok Sussex Street",
    url: "https://tasteofindonesia.com.au/business/warung-pojok-sussex-st-6814d2965f349",
    suburb: "Sydney",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Warung Pojok Campsie",
    url: "https://www.ubereats.com/au/store/warung-pojok/g0SkPMeoR4SHums1TlHq9A",
    suburb: "Campsie",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Ria Ayam Penyet Sydney CBD",
    url: "https://sydney.ria98.com.au/",
    suburb: "Sydney",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Teras Java Mascot",
    url: "https://terasjava.com.au/",
    suburb: "Mascot",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Warung The Sawah Sydney",
    url: "https://www.ubereats.com/au/store/warung-the-sawah/m5-9f_XmXNW0D6jv4G00gQ",
    suburb: "Sydney",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Ayam Goreng 99 Kingsford",
    url: "https://www.ayamgoreng99.com/",
    suburb: "Kingsford",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Aroma of Indonesia Sydney",
    url: "https://aromaofindonesia.com.au/",
    suburb: "Sydney",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Billu Indian Eatery Harris Park",
    url: "https://www.billu.com.au/",
    suburb: "Harris Park",
    city: "Sydney",
    catalogs: ["https://www.billu.com.au/whats-on"],
  },
  {
    name: "Chatkazz Harris Park",
    url: "https://www.chatkazz.com.au/contact",
    suburb: "Harris Park",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "The Dosa Hub Sydney CBD",
    url: "https://www.dosahub.com.au/",
    suburb: "Sydney",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Flyover Redfern",
    url: "https://www.flyoverfritterie.com.au/",
    suburb: "Redfern",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Pista House Sydney",
    url: "https://pistahousesydney.com.au/",
    suburb: "Lakemba",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Kowloon Cafe Haymarket",
    url: "https://www.kowlooncafe.com.au/#haymarket",
    suburb: "Haymarket",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Kowloon Cafe Burwood",
    url: "https://www.kowlooncafe.com.au/#burwood",
    suburb: "Burwood",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Kowloon Cafe Eastwood",
    url: "https://www.kowlooncafe.com.au/#eastwood",
    suburb: "Eastwood",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Kowloon Cafe Chatswood",
    url: "https://www.kowlooncafe.com.au/#chatswood",
    suburb: "Chatswood",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Hong Kong Street Food Rhodes",
    url: "http://hongkongstreetfood.au/",
    suburb: "Rhodes",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Canton Cafe Chatswood",
    url: "https://www.chatswoodinterchange.com/eats/canton-cafe/",
    suburb: "Chatswood",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Tea Square Cafe Chatswood",
    url: "https://www.ubereats.com/au/store/tea-square-cafe/tF05r5lTUt6pusqBH7O7oA",
    suburb: "Chatswood",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Momocha Strathfield",
    url: "https://momocha.com.au/",
    suburb: "Strathfield",
    city: "Sydney",
    catalogs: ["https://momocha.com.au/about-us/"],
  },
  {
    name: "Momo Eats Rockdale",
    url: "https://momoeats.com.au/",
    suburb: "Rockdale",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Chulho Town Hall",
    url: "https://www.chulho.com.au/#town-hall",
    suburb: "Sydney",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Chulho Harris Park",
    url: "https://www.chulho.com.au/#harris-park",
    suburb: "Harris Park",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "The Muglan Sydney CBD",
    url: "https://themuglan.com.au/",
    suburb: "Sydney",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Namaste Sydney",
    url: "https://namastesydney.com.au/",
    suburb: "Sydney",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "MR Hotdog Cabramatta",
    url: "https://www.mrhotdog.com.au/#cabramatta",
    suburb: "Cabramatta",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "MR Hotdog Chinatown",
    url: "https://www.mrhotdog.com.au/#chinatown",
    suburb: "Haymarket",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Mr Lei Mascot",
    url: "https://www.mrlei.com.au/",
    suburb: "Mascot",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Shiso Fine Japanese Food Truck",
    url: "https://shisofine.com.au/",
    suburb: "Sydney",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Marko's Thai Street Food",
    url: "https://markorestaurant.com.au/",
    suburb: "Sydney",
    city: "Sydney",
    catalogs: [],
  },
  {
    name: "Pondok Nasi Bakar South Melbourne",
    url: "https://pondoknasibakar.com.au/",
    suburb: "South Melbourne",
    city: "Melbourne",
    catalogs: [],
  },
  {
    name: "Garam Merica Melbourne",
    url: "http://garammerica.com/",
    suburb: "Melbourne",
    city: "Melbourne",
    catalogs: [],
  },
  {
    name: "Dosa Hut Melbourne CBD",
    url: "https://www.dosahut.net.au/#melbourne-cbd",
    suburb: "Melbourne",
    city: "Melbourne",
    catalogs: [],
  },
  {
    name: "Momo Central Melbourne",
    url: "https://momocentral.com.au/",
    suburb: "Melbourne",
    city: "Melbourne",
    catalogs: [],
  },
  {
    name: "Mad Momos Glenroy",
    url: "https://madmomos.com.au/",
    suburb: "Glenroy",
    city: "Melbourne",
    catalogs: [],
  },
  {
    name: "Momo Station Melbourne",
    url: "https://momostation.com.au/",
    suburb: "Melbourne",
    city: "Melbourne",
    catalogs: [],
  },
  {
    name: "Manise Cafe Perth",
    url: "https://manisecafe.yolasite.com/",
    suburb: "Northbridge",
    city: "Perth",
    catalogs: [],
  },
  {
    name: "Raja Gurih Perth",
    url: "https://rajagurih.com.au/",
    suburb: "Perth",
    city: "Perth",
    catalogs: [],
  },
  {
    name: "Sauma Northbridge",
    url: "https://www.sauma.com.au/",
    suburb: "Northbridge",
    city: "Perth",
    catalogs: [],
  },
  {
    name: "Vividh Perth",
    url: "https://vividhrestaurant.com.au/",
    suburb: "Perth",
    city: "Perth",
    catalogs: [],
  },
  {
    name: "Tasty Momo Dianella",
    url: "https://tastymomo.com.au/",
    suburb: "Dianella",
    city: "Perth",
    catalogs: [],
  },
  {
    name: "Sendok Garpu Brisbane CBD",
    url: "https://www.sendokgarpu.com.au/",
    suburb: "Brisbane City",
    city: "Brisbane",
    catalogs: [],
  },
  {
    name: "Warisan Fortitude Valley",
    url: "https://www.warisan.com.au/",
    suburb: "Fortitude Valley",
    city: "Brisbane",
    catalogs: [],
  },
  {
    name: "Chatori Cafe Brisbane",
    url: "https://www.chatori.com.au/",
    suburb: "Brisbane",
    city: "Brisbane",
    catalogs: [],
  },
  {
    name: "Amritsar Sweets & Chaat Brisbane",
    url: "https://amritsarfoods.com/",
    suburb: "Brisbane",
    city: "Brisbane",
    catalogs: [],
  },
  {
    name: "Spicy Momo House Lutwyche",
    url: "https://spicymomohouse.com/",
    suburb: "Lutwyche",
    city: "Brisbane",
    catalogs: [],
  },
  {
    name: "Saffron Cuisine Brisbane Street Food",
    url: "https://saffroncuisine.com.au/menu/street-food-brisbane",
    suburb: "Brisbane",
    city: "Brisbane",
    catalogs: [],
  },
  {
    name: "Stanley Brisbane Takeaway",
    url: "https://www.stanleyrestaurant.com.au/takeaway",
    suburb: "Brisbane City",
    city: "Brisbane",
    catalogs: [],
  },
  {
    name: "Ria Ayam Penyet Adelaide CBD",
    url: "https://adelaide.ria98.com.au/",
    suburb: "Adelaide",
    city: "Adelaide",
    catalogs: [],
  },
  {
    name: "Hut & Soul Adelaide",
    url: "https://www.hutandsoul.com.au/",
    suburb: "Adelaide",
    city: "Adelaide",
    catalogs: [],
  },
  {
    name: "Warung Suka Adelaide",
    url: "https://warung-suka-indonesia-eatery.res-menu.net/",
    suburb: "Adelaide",
    city: "Adelaide",
    catalogs: [],
  },
  {
    name: "Abang Abang Adelaide",
    url: "https://www.abangabangau.com/",
    suburb: "Adelaide",
    city: "Adelaide",
    catalogs: [],
  },
  {
    name: "Chaioz North Adelaide",
    url: "https://www.chaioz.com.au/",
    suburb: "North Adelaide",
    city: "Adelaide",
    catalogs: [],
  },
  {
    name: "The Omnii Adelaide",
    url: "https://theomnii.com.au/",
    suburb: "Adelaide",
    city: "Adelaide",
    catalogs: [],
  },
  {
    name: "+82 Pocha Adelaide",
    url: "https://plus82pocha.com.au/",
    suburb: "Adelaide",
    city: "Adelaide",
    catalogs: [],
  },
  {
    name: "Sit Lo Adelaide",
    url: "https://sitlo.com.au/",
    suburb: "Adelaide",
    city: "Adelaide",
    catalogs: [],
  },
  {
    name: "Que Huong Cafe Adelaide",
    url: "https://que-huong-cafe.com.au/",
    suburb: "Adelaide",
    city: "Adelaide",
    catalogs: [],
  },
  {
    name: "Ayuriz Cafe Darwin",
    url: "https://ayuriz-cafe.goto-restaurants.com/",
    suburb: "Darwin City",
    city: "Darwin",
    catalogs: [],
  },
  {
    name: "Barrabanhmi Darwin",
    url: "https://www.casuarinasquare.com.au/store/barrabanhmi-darwin/",
    suburb: "Casuarina",
    city: "Darwin",
    catalogs: [],
  },
  {
    name: "BBQ Lady Darwin",
    url: "https://www.bbqlady.com.au/",
    suburb: "Darwin City",
    city: "Darwin",
    catalogs: [],
  },
  {
    name: "Mo:Mo King Darwin",
    url: "https://themomoking.com.au/",
    suburb: "Darwin City",
    city: "Darwin",
    catalogs: [],
  },
  {
    name: "Palates of India Darwin",
    url: "https://palatesofindia.com/",
    suburb: "Darwin City",
    city: "Darwin",
    catalogs: [],
  },
  {
    name: "Lazy Susan's Eating House Darwin",
    url: "https://www.lazysusansdarwin.com.au/",
    suburb: "Darwin City",
    city: "Darwin",
    catalogs: [],
  },
] as const;

const staleStreetFoodUrls = [
  "https://www.banhmilocator.com/nsw/tam-broken-rice-vietnamese-restaurant-canley-vale",
  "https://www.instagram.com/marrickville.porkroll/",
  "https://www.facebook.com/PhoTauBay.AU/",
  "https://www.facebook.com/BanhMiBayNgo/",
  "https://www.facebook.com/pages/Kings-Hot-Bread/159753907385157",
];

const CATEGORY_NAME = "Cultural Bites & Takeaway";
const LEGACY_CATEGORY_NAME = "Street Food & Takeaway";

const newlyAddedStoreNames = new Set([
  "Pho Tau Bay Cabramatta",
  "Banh Mi Bay Ngo Bankstown",
  "King's Hot Bread Hurstville",
  "Medan Ciak Sydney CBD",
  "Medan Ciak Mascot",
  "Pandawa Nasi Bungkus Sydney",
  "Warung Pojok Sussex Street",
  "Warung Pojok Campsie",
  "Ria Ayam Penyet Sydney CBD",
  "Teras Java Mascot",
  "Warung The Sawah Sydney",
  "Ayam Goreng 99 Kingsford",
  "Aroma of Indonesia Sydney",
  "Billu Indian Eatery Harris Park",
  "Chatkazz Harris Park",
  "The Dosa Hub Sydney CBD",
  "Flyover Redfern",
  "Pista House Sydney",
  "Kowloon Cafe Haymarket",
  "Kowloon Cafe Burwood",
  "Kowloon Cafe Eastwood",
  "Kowloon Cafe Chatswood",
  "Hong Kong Street Food Rhodes",
  "Canton Cafe Chatswood",
  "Tea Square Cafe Chatswood",
  "Momocha Strathfield",
  "Momo Eats Rockdale",
  "Chulho Town Hall",
  "Chulho Harris Park",
  "The Muglan Sydney CBD",
  "Namaste Sydney",
  "MR Hotdog Cabramatta",
  "MR Hotdog Chinatown",
  "Mr Lei Mascot",
  "Shiso Fine Japanese Food Truck",
  "Marko's Thai Street Food",
  "Pondok Nasi Bakar South Melbourne",
  "Garam Merica Melbourne",
  "Dosa Hut Melbourne CBD",
  "Momo Central Melbourne",
  "Mad Momos Glenroy",
  "Momo Station Melbourne",
  "Manise Cafe Perth",
  "Raja Gurih Perth",
  "Sauma Northbridge",
  "Vividh Perth",
  "Tasty Momo Dianella",
  "Sendok Garpu Brisbane CBD",
  "Warisan Fortitude Valley",
  "Chatori Cafe Brisbane",
  "Amritsar Sweets & Chaat Brisbane",
  "Spicy Momo House Lutwyche",
  "Saffron Cuisine Brisbane Street Food",
  "Stanley Brisbane Takeaway",
  "Ria Ayam Penyet Adelaide CBD",
  "Hut & Soul Adelaide",
  "Warung Suka Adelaide",
  "Abang Abang Adelaide",
  "Chaioz North Adelaide",
  "The Omnii Adelaide",
  "+82 Pocha Adelaide",
  "Sit Lo Adelaide",
  "Que Huong Cafe Adelaide",
  "Ayuriz Cafe Darwin",
  "Barrabanhmi Darwin",
  "BBQ Lady Darwin",
  "Mo:Mo King Darwin",
  "Palates of India Darwin",
  "Lazy Susan's Eating House Darwin",
]);

function createOffer(storeName: string, matchedUrl: string, matchedKeywords: string[]) {
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);

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

async function main() {
  const owner = await prisma.user.findFirst({ orderBy: { id: "asc" } });
  if (!owner) {
    throw new Error("No user found to own seeded street food stores.");
  }

  const legacyCategory = await prisma.category.findUnique({
    where: { name: LEGACY_CATEGORY_NAME },
  });
  const existingCategory = await prisma.category.findUnique({
    where: { name: CATEGORY_NAME },
  });

  const category =
    existingCategory ||
    (legacyCategory
      ? await prisma.category.update({
          where: { id: legacyCategory.id },
          data: { name: CATEGORY_NAME },
        })
      : await prisma.category.create({
          data: { name: CATEGORY_NAME },
        }));

  if (legacyCategory && existingCategory && legacyCategory.id !== existingCategory.id) {
    await prisma.store.updateMany({
      where: { categoryId: legacyCategory.id },
      data: { categoryId: category.id },
    });
    await prisma.category.delete({ where: { id: legacyCategory.id } });
  }

  await prisma.discount.deleteMany({
    where: {
      store: {
        url: {
          in: staleStreetFoodUrls,
        },
      },
    },
  });
  await prisma.store.deleteMany({
    where: {
      url: {
        in: staleStreetFoodUrls,
      },
    },
  });

  const storesToSeed = process.argv.includes("--new-only")
    ? streetFoodStores.filter((store) => newlyAddedStoreNames.has(store.name))
    : streetFoodStores;

  let offerCount = 0;

  for (const store of storesToSeed) {
    const savedStore = await prisma.store.upsert({
      where: { url: store.url },
      update: {
        name: store.name,
        suburb: store.suburb,
        city: store.city,
        country: "Australia",
        catalogs: [...store.catalogs],
        categoryId: category.id,
      },
      create: {
        name: store.name,
        url: store.url,
        suburb: store.suburb,
        city: store.city,
        country: "Australia",
        catalogs: [...store.catalogs],
        categoryId: category.id,
        ownerId: owner.id,
      },
    });

    const result = await OfferVerifier.verifyStoreOfferPages(store.url, [...store.catalogs], {
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
      offerCount += 1;
      console.log(`offer: ${store.name} -> ${result.matchedKeywords.join(", ")} @ ${result.matchedUrl}`);
    } else {
      await prisma.discount.deleteMany({
        where: {
          storeId: savedStore.id,
          description: {
            startsWith: "Offer wording found on the store website",
          },
        },
      });
      console.log(`no-offer: ${store.name}`);
    }
  }

  console.log(`Seeded ${storesToSeed.length} ${CATEGORY_NAME} stores. Verified offers: ${offerCount}.`);
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
