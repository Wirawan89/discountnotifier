import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_COUNTRY = "Australia";
const MAX_MATCHES = 6;
const SHARED_DIRECTORY_DOMAINS = new Set([
  "westfield.com.au",
  "stockland.com.au",
  "qicre.com",
  "vicinity.com.au",
  "scentregroup.com",
  "dexus.com",
  "meriton.com.au",
  "cabramattaplaza.com.au",
  "duttonplaza.com.au",
  "marrickvillemetro.com.au",
  "burwoodplaza.com.au",
  "villageplaza.com.au",
  "canberraoutlet.com.au",
]);

function normalizeBusinessUrl(value: unknown) {
  const rawUrl = String(value || "").trim();
  if (!rawUrl) {
    return "";
  }

  return /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
}

function getDomain(value: string) {
  try {
    return new URL(normalizeBusinessUrl(value)).hostname
      .toLowerCase()
      .replace(/^www\./, "");
  } catch (_error) {
    return "";
  }
}

function isSharedDirectoryDomain(domain: string) {
  return SHARED_DIRECTORY_DOMAINS.has(domain);
}

function normalizeComparableUrl(value: string) {
  try {
    const url = new URL(normalizeBusinessUrl(value));
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    const pathname = url.pathname.replace(/\/+$/, "") || "/";

    return `${hostname}${pathname}`.toLowerCase();
  } catch (_error) {
    return "";
  }
}

function normalizeName(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\b(pty|ltd|limited|australia|australian|store|stores|shop|official)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeLocation(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function getNameTokens(value: string) {
  return new Set(
    normalizeName(value)
      .split(/\s+/)
      .filter((token) => token.length >= 3)
  );
}

function tokenOverlapScore(inputName: string, storeName: string) {
  const inputTokens = getNameTokens(inputName);
  const storeTokens = getNameTokens(storeName);

  if (inputTokens.size === 0 || storeTokens.size === 0) {
    return 0;
  }

  let overlap = 0;
  for (const token of inputTokens) {
    if (storeTokens.has(token)) {
      overlap++;
    }
  }

  const ratio = overlap / Math.max(inputTokens.size, storeTokens.size);
  return Math.round(ratio * 45);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessName = searchParams.get("businessName") || "";
    const url = normalizeBusinessUrl(searchParams.get("url"));
    const suburb = searchParams.get("suburb") || "";
    const city = searchParams.get("city") || suburb;
    const country = searchParams.get("country") || DEFAULT_COUNTRY;
    const categoryId = Number(searchParams.get("categoryId") || 0);

    if (!businessName.trim() && !url) {
      return NextResponse.json({ matches: [] });
    }

    const inputDomain = getDomain(url);
    const inputComparableUrl = normalizeComparableUrl(url);
    const normalizedSuburb = normalizeLocation(suburb);
    const normalizedCity = normalizeLocation(city);
    const normalizedName = normalizeName(businessName);

    const countryWhere = {
      country: {
        in: country === DEFAULT_COUNTRY ? [DEFAULT_COUNTRY, ""] : [country],
      },
    };

    const stores = await prisma.store.findMany({
      where: {
        ...countryWhere,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        business: {
          select: {
            id: true,
            businessName: true,
            verificationStatus: true,
          },
        },
      },
      take: 2500,
    });

    const matches = stores
      .map((store) => {
        const reasons: string[] = [];
        let score = 0;

        const storeDomain = getDomain(store.url);
        const isSameFullUrl = Boolean(
          inputComparableUrl &&
          normalizeComparableUrl(store.url) === inputComparableUrl
        );
        const isSameDomain = Boolean(inputDomain && storeDomain && inputDomain === storeDomain);
        const isSharedDomain = isSameDomain && isSharedDirectoryDomain(storeDomain);
        const isPrivateDomainMatch = isSameDomain && !isSharedDomain;
        const isCategoryMatch = categoryId > 0 && store.categoryId === categoryId;

        if (isSameFullUrl) {
          score += 150;
          reasons.push(isSharedDomain ? "same directory page" : "same website URL");
        } else if (isPrivateDomainMatch) {
          score += 120;
          reasons.push("same website domain");
        }

        const nameScore = tokenOverlapScore(normalizedName, store.name);
        if (nameScore >= 15) {
          score += nameScore;
          reasons.push("similar business name");
        }

        const storeSuburb = normalizeLocation(store.suburb);
        const storeCity = normalizeLocation(store.city);
        const isSameLocation = Boolean(
          normalizedSuburb &&
          (storeSuburb === normalizedSuburb || storeCity === normalizedSuburb)
        );
        if (
          isSameLocation
        ) {
          score += 20;
          reasons.push("same suburb");
        } else if (
          normalizedCity &&
          (storeCity === normalizedCity || storeSuburb === normalizedCity)
        ) {
          score += 10;
          reasons.push("same city");
        }

        if (isCategoryMatch) {
          score += 10;
          reasons.push("same category");
        } else if (categoryId > 0 && (isSameFullUrl || isPrivateDomainMatch)) {
          reasons.push(`different category: ${store.category.name}`);
        }

        if (isSharedDomain && !isSameFullUrl && nameScore >= 25 && isSameLocation) {
          score += 40;
          reasons.push("same shared directory domain");
        }

        return {
          id: store.id,
          name: store.name,
          url: store.url,
          suburb: store.suburb,
          city: store.city,
          country: store.country || DEFAULT_COUNTRY,
          category: store.category,
          alreadyClaimed: Boolean(store.business),
          claimedBy: store.business?.businessName || null,
          score,
          reasons,
        };
      })
      .filter((match) => {
        const hasIdentityUrlMatch =
          match.reasons.includes("same website URL") ||
          match.reasons.includes("same website domain") ||
          match.reasons.includes("same directory page") ||
          match.reasons.includes("same shared directory domain");
        const hasCategoryMatch = match.reasons.includes("same category");

        return hasIdentityUrlMatch || (hasCategoryMatch && match.score >= 35);
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_MATCHES);

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Error searching store matches:", error);
    return NextResponse.json(
      { error: "Failed to search existing stores" },
      { status: 500 }
    );
  }
}
