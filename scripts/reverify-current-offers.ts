import { PrismaClient } from "@prisma/client";
import { OfferVerifier } from "../src/lib/offer-verifier";

const prisma = new PrismaClient();
const categoryName = process.argv.find((arg) => arg.startsWith("--category="))?.split("=")[1];
const storeName = process.argv.find((arg) => arg.startsWith("--store="))?.split("=")[1];
const createMissingOffers = process.argv.includes("--create-missing");

function getVerifierProfile(categoryName?: string): "retail" | "retailShop" | "dining" | "entertainment" | "services" {
  if (categoryName === "Dining & Beverages" || categoryName === "Caffe & Brunch") {
    return "dining";
  }

  if (categoryName === "Entertainment & Events") {
    return "entertainment";
  }

  if (categoryName === "Financial & Services") {
    return "services";
  }

  if (
    categoryName === "Sport Gears" ||
    categoryName === "Music Gears" ||
    categoryName === "Food & Groceries" ||
    categoryName === "Cosmetic & Perfumes" ||
    categoryName === "Clothing & Fashions" ||
    categoryName === "Electronic & Gadgets" ||
    categoryName === "Baby & Kids" ||
    categoryName === "Home & Garden" ||
    categoryName === "Luxury & Designer" ||
    categoryName === "HIFI Audio & Speakers" ||
    categoryName === "Gifts & Flowers" ||
    categoryName === "Travel & Accommodation" ||
    categoryName === "Vitamins & Supplements" ||
    categoryName === "Office & Stationery" ||
    categoryName === "Games" ||
    categoryName === "Trending Toys" ||
    categoryName === "Tools & DIY" ||
    categoryName === "Books & Magazines" ||
    categoryName === "Cars Accessories" ||
    categoryName === "Business Attire" ||
    categoryName === "Leather Jackets & Bags" ||
    categoryName === "Pets Supplies" ||
    categoryName === "Traveling Accessories"
  ) {
    return "retailShop";
  }

  return "retail";
}

function createGenericOffer(
  storeName: string,
  matchedUrl: string,
  matchedKeywords: string[],
  profile: "retail" | "retailShop" | "dining" | "entertainment" | "services"
) {
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);
  const hasEofyOffer = matchedKeywords.some((keyword) => /eofy|end of financial year/i.test(keyword));
  const hasHappyHour = matchedKeywords.some((keyword) => /happy hour/i.test(keyword));

  return {
    title:
      profile === "dining"
        ? hasHappyHour
          ? `${storeName} Happy Hour and Special Offers`
          : `${storeName} Special Offers`
        : profile === "entertainment"
          ? `${storeName} Event Deals and Offers`
        : profile === "services"
          ? `${storeName} Service Deals and Offers`
        : hasEofyOffer
          ? `${storeName} EOFY Deals`
          : `${storeName} current sale and offers`,
    description: `Offer wording found on the store website (${matchedKeywords.join(", ")}). Check the store website for live availability.`,
    startDate,
    endDate,
    eCatalog: [matchedUrl],
  };
}

async function main() {
  const now = new Date();
  const stores = await prisma.store.findMany({
    where: {
      ...(createMissingOffers
        ? {}
        : {
            discounts: {
              some: {
                endDate: {
                  gte: now,
                },
              },
            },
          }),
      ...(categoryName
        ? {
            category: {
              name: categoryName,
            },
          }
        : {}),
      ...(storeName
        ? {
            name: {
              equals: storeName,
              mode: "insensitive",
            },
          }
        : {}),
    },
    include: {
      category: true,
      discounts: {
        where: {
          endDate: {
            gte: now,
          },
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  let checked = 0;
  let kept = 0;
  let removed = 0;
  let created = 0;

  console.log(
    `Rechecking ${stores.length} store(s)${categoryName ? ` in ${categoryName}` : ""}${storeName ? ` named ${storeName}` : ""} for current offer wording...`
  );

  for (const store of stores) {
    if (createMissingOffers && store.discounts.length === 0) {
      checked++;
      const result = await OfferVerifier.verifyStoreOfferPages(store.url, store.catalogs, {
        country: store.country,
        profile: getVerifierProfile(store.category.name),
      });

      if (result.hasOffer && result.matchedUrl) {
        const offer = createGenericOffer(
          store.name,
          result.matchedUrl,
          result.matchedKeywords,
          getVerifierProfile(store.category.name)
        );
        await prisma.discount.upsert({
          where: {
            storeId_title: {
              storeId: store.id,
              title: offer.title,
            },
          },
          update: offer,
          create: {
            storeId: store.id,
            ...offer,
          },
        });

        created++;
        console.log(
          `[create] ${store.category.name} / ${store.name} / ${offer.title} (${result.matchedKeywords.join(", ")} at ${result.matchedUrl})`
        );
      } else {
        console.log(
          `[empty] ${store.category.name} / ${store.name} (no matching wording found)`
        );
      }

      continue;
    }

    for (const discount of store.discounts) {
      checked++;
      const result = await OfferVerifier.verifyStoreOfferPages(store.url, [
        ...store.catalogs,
        ...discount.eCatalog,
      ], {
        country: store.country,
        profile: getVerifierProfile(store.category.name),
      });

      if (result.hasOffer) {
        kept++;
        console.log(
          `[keep] ${store.category.name} / ${store.name} / ${discount.title} (${result.matchedKeywords.join(", ")} at ${result.matchedUrl})`
        );
        continue;
      }

      await prisma.discount.delete({
        where: {
          id: discount.id,
        },
      });

      removed++;
      console.log(
        `[remove] ${store.category.name} / ${store.name} / ${discount.title} (no matching wording found)`
      );
    }
  }

  console.log(`Done. Checked ${checked} store/offer record(s), kept ${kept}, created ${created}, removed ${removed}.`);
}

main()
  .catch((error) => {
    console.error("Failed to recheck current offers:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
