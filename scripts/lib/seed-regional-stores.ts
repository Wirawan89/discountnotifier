import { PrismaClient } from "@prisma/client";
import { updateCatalogUrlHealth } from "../../src/lib/catalog-health";
import { getLiveVerifiedOfferEndDate } from "../../src/lib/offer-lifecycle";
import { OfferVerifier, OfferVerifierOptions } from "../../src/lib/offer-verifier";

const DEFAULT_VERIFY_CONCURRENCY = 4;
type VerifierProfile = NonNullable<OfferVerifierOptions["profile"]>;

export type RegionalStoreSeed = {
  name: string;
  url: string;
  websiteUrl?: string;
  verificationUrl?: string;
  suburb: string;
  city: string;
  state: string;
  address: string;
  contact?: string;
  catalogs?: string[];
  description: string;
  country?: string;
  sourceType?: string;
  locationSource?: string;
  ignoredOfferUrlPatterns?: RegExp[];
  verifierProfileOverride?: VerifierProfile;
};

export type SeedRegionalStoresInput = {
  regionName: string;
  categoryName: string;
  verifierProfile: VerifierProfile;
  stores: RegionalStoreSeed[];
  country?: string;
  sourceType?: string;
  locationSource?: string;
  maxPages?: number;
  requestTimeoutMs?: number;
  verify?: boolean;
  closeGoogleFallbackDuplicates?: boolean;
  concurrency?: number;
};

function createOffer(matchedUrl: string, matchedKeywords: string[], verifierProfile: VerifierProfile) {
  const startDate = new Date();
  const endDate = getLiveVerifiedOfferEndDate(startDate, verifierProfile);
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

async function closeGoogleFallbackDuplicates(
  prisma: PrismaClient,
  store: RegionalStoreSeed,
  categoryId: number
) {
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

  if (googleFallbacks.length === 0) {
    return;
  }

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

async function verifyAndSaveStore(
  prisma: PrismaClient,
  store: RegionalStoreSeed,
  categoryId: number,
  ownerId: number,
  options: SeedRegionalStoresInput
) {
  const country = store.country || options.country || "Australia";
  const sourceType = store.sourceType || options.sourceType || "website";
  const locationSource = store.locationSource || options.locationSource || "suburb";
  const websiteUrl = store.websiteUrl || store.verificationUrl || store.url;
  const verifierProfile = store.verifierProfileOverride || options.verifierProfile;

  const savedStore = await prisma.store.upsert({
    where: { url: store.url },
    update: {
      name: store.name,
      suburb: store.suburb,
      city: store.city,
      state: store.state,
      country,
      contact: store.contact,
      address: store.address,
      description: store.description,
      catalogs: store.catalogs || [],
      sourceType,
      websiteUrl,
      locationSource,
      categoryId,
    },
    create: {
      name: store.name,
      url: store.url,
      suburb: store.suburb,
      city: store.city,
      state: store.state,
      country,
      contact: store.contact,
      address: store.address,
      description: store.description,
      catalogs: store.catalogs || [],
      sourceType,
      websiteUrl,
      locationSource,
      categoryId,
      ownerId,
    },
  });

  if (options.closeGoogleFallbackDuplicates ?? true) {
    await closeGoogleFallbackDuplicates(prisma, store, categoryId);
  }

  if (options.verify === false) {
    console.log(`saved: ${store.name}`);
    return { store: 1, offer: 0 };
  }

  const result = await OfferVerifier.verifyStoreOfferPages(websiteUrl, store.catalogs || [], {
    country,
    profile: verifierProfile,
    maxPages: options.maxPages ?? 5,
    requestTimeoutMs: options.requestTimeoutMs ?? 12000,
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
    const offer = createOffer(matchedUrl, result.matchedKeywords, verifierProfile);
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

export async function seedRegionalStores(input: SeedRegionalStoresInput) {
  const prisma = new PrismaClient();

  try {
    const owner = await prisma.user.findFirst({ orderBy: { id: "asc" } });
    if (!owner) {
      throw new Error(`No user found to own seeded ${input.regionName} stores.`);
    }

    const category = await prisma.category.upsert({
      where: { name: input.categoryName },
      update: {},
      create: { name: input.categoryName },
    });

    let savedStores = 0;
    let verifiedOffers = 0;
    const concurrency = input.concurrency ?? DEFAULT_VERIFY_CONCURRENCY;

    for (let index = 0; index < input.stores.length; index += concurrency) {
      const batch = input.stores.slice(index, index + concurrency);
      const results = await Promise.all(
        batch.map((store) => verifyAndSaveStore(prisma, store, category.id, owner.id, input))
      );
      savedStores += results.reduce((sum, result) => sum + result.store, 0);
      verifiedOffers += results.reduce((sum, result) => sum + result.offer, 0);
    }

    console.log(
      `Seeded ${savedStores} ${input.regionName} ${input.categoryName} stores. Verified offers: ${verifiedOffers}.`
    );
  } finally {
    await prisma.$disconnect();
  }
}
