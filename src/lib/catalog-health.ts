import type { FailedCatalogUrl, OfferVerificationResult } from "./offer-verifier";

export const CATALOG_URL_FAILURE_PRUNE_THRESHOLD = 3;

type CatalogHealthPrisma = {
  catalogUrlHealth?: {
    upsert: (args: any) => Promise<{ url: string; failureCount: number }>;
    findMany: (args: any) => Promise<Array<{ url: string; failureCount: number }>>;
  };
  store: {
    update: (args: any) => Promise<unknown>;
  };
};

export type CatalogHealthUpdateResult = {
  removedCatalogUrls: string[];
};

function normalizeCatalogUrl(url: string): string | null {
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).toString();
  } catch {
    return null;
  }
}

function getCatalogUrlKey(url: string): string {
  return normalizeCatalogUrl(url) || url;
}

function getCatalogUrlMap(catalogUrls: string[]): Map<string, string> {
  const normalizedUrls = new Map<string, string>();

  for (const catalogUrl of catalogUrls) {
    normalizedUrls.set(getCatalogUrlKey(catalogUrl), catalogUrl);
  }

  return normalizedUrls;
}

function getFailedCatalogUrls(
  catalogUrls: string[],
  failedCatalogUrls: FailedCatalogUrl[] = []
): FailedCatalogUrl[] {
  const catalogUrlMap = getCatalogUrlMap(catalogUrls);
  const uniqueFailures = new Map<string, FailedCatalogUrl>();

  for (const failure of failedCatalogUrls) {
    const catalogUrlKey = getCatalogUrlKey(failure.url);

    if (catalogUrlMap.has(catalogUrlKey)) {
      uniqueFailures.set(catalogUrlKey, {
        ...failure,
        url: catalogUrlKey,
      });
    }
  }

  return Array.from(uniqueFailures.values());
}

export async function updateCatalogUrlHealth(
  prisma: CatalogHealthPrisma,
  storeId: number,
  catalogUrls: string[],
  result: OfferVerificationResult
): Promise<CatalogHealthUpdateResult> {
  if (!prisma.catalogUrlHealth) {
    return { removedCatalogUrls: [] };
  }

  const now = new Date();
  const catalogUrlMap = getCatalogUrlMap(catalogUrls);
  const matchedCatalogUrl = result.matchedUrl ? normalizeCatalogUrl(result.matchedUrl) : null;
  const failedCatalogUrls = getFailedCatalogUrls(catalogUrls, result.failedCatalogUrls);

  if (matchedCatalogUrl && catalogUrlMap.has(matchedCatalogUrl)) {
    await prisma.catalogUrlHealth.upsert({
      where: {
        storeId_url: {
          storeId,
          url: matchedCatalogUrl,
        },
      },
      update: {
        failureCount: 0,
        lastStatus: null,
        lastError: null,
        lastCheckedAt: now,
        lastSucceededAt: now,
      },
      create: {
        storeId,
        url: matchedCatalogUrl,
        failureCount: 0,
        lastCheckedAt: now,
        lastSucceededAt: now,
      },
    });
  }

  for (const failedCatalogUrl of failedCatalogUrls) {
    if (failedCatalogUrl.url === matchedCatalogUrl) {
      continue;
    }

    await prisma.catalogUrlHealth.upsert({
      where: {
        storeId_url: {
          storeId,
          url: failedCatalogUrl.url,
        },
      },
      update: {
        failureCount: {
          increment: 1,
        },
        lastStatus: failedCatalogUrl.status ?? null,
        lastError: failedCatalogUrl.reason,
        lastCheckedAt: now,
      },
      create: {
        storeId,
        url: failedCatalogUrl.url,
        failureCount: 1,
        lastStatus: failedCatalogUrl.status ?? null,
        lastError: failedCatalogUrl.reason,
        lastCheckedAt: now,
      },
    });
  }

  if (failedCatalogUrls.length === 0) {
    return { removedCatalogUrls: [] };
  }

  const failedUrls = failedCatalogUrls.map((failure) => failure.url);
  const catalogUrlsToPrune = await prisma.catalogUrlHealth.findMany({
    where: {
      storeId,
      url: {
        in: failedUrls,
      },
      failureCount: {
        gte: CATALOG_URL_FAILURE_PRUNE_THRESHOLD,
      },
    },
  });
  const pruneUrlSet = new Set(catalogUrlsToPrune.map((catalogUrl) => catalogUrl.url));

  if (pruneUrlSet.size === 0) {
    return { removedCatalogUrls: [] };
  }

  const nextCatalogUrls = catalogUrls.filter((catalogUrl) => {
    return !pruneUrlSet.has(getCatalogUrlKey(catalogUrl));
  });
  const removedCatalogUrls = catalogUrls.filter((catalogUrl) => {
    return pruneUrlSet.has(getCatalogUrlKey(catalogUrl));
  });

  if (removedCatalogUrls.length > 0) {
    await prisma.store.update({
      where: {
        id: storeId,
      },
      data: {
        catalogs: nextCatalogUrls,
      },
    });
  }

  return { removedCatalogUrls };
}
