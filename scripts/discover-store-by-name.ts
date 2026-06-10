import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { updateCatalogUrlHealth } from "../src/lib/catalog-health";
import { getLiveVerifiedOfferEndDate } from "../src/lib/offer-lifecycle";
import { OfferVerifier, OfferVerifierOptions } from "../src/lib/offer-verifier";
import {
  decodeHtml,
  normalizeForMatch,
  stripHtml,
  validateStockistPresence,
  validateStoreCandidate,
  verifierOptionsForStoreCandidate,
} from "../src/lib/store-candidate-validator";

const prisma = new PrismaClient();

const SOCIAL_OR_NOISY_HOST_PATTERN =
  /(facebook|instagram|tiktok|youtube|linkedin|twitter|x\.com|pinterest|reddit|google|bing|duckduckgo|wikipedia|amazon|ebay|temu|shein)/i;

type SaveAndVerifyInput = {
  name: string;
  url: string;
  websiteUrl: string;
  verificationUrl: string;
  catalogs: string[];
  categoryId: number;
  ownerId: number;
  categoryName: string;
  country: string;
  rawStoreName: string;
  suburb?: string;
  city?: string;
  state?: string;
  address?: string;
  description?: string;
  locationSource?: string;
  ignoredOfferUrlPatterns?: RegExp[];
};

type StockistTarget = {
  stockistName: string;
  url: string;
  catalogs: string[];
  ignoredOfferUrlPatterns?: RegExp[];
};

function argValue(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function cleanStoreName(value: string) {
  const cleaned = value
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(?:shoe|shoes|store|shop|brand|australia|sale|discount|deal|offer)s?\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (/^r\.?\s*m\.?\s*williams?$/i.test(cleaned)) return "R.M.Williams";

  return cleaned;
}

function titleCase(value: string) {
  if (/^r\.?\s*m\.?\s*williams?$/i.test(value.trim())) return "R.M.Williams";

  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function normalizeUrl(value: string) {
  try {
    const parsed = new URL(value);
    parsed.hash = "";
    parsed.search = "";
    return parsed.toString();
  } catch {
    return value;
  }
}

function canonicalStoreUrl(value: string, storeName: string) {
  try {
    const parsed = new URL(value);
    const normalizedHost = normalizeForMatch(parsed.hostname);
    const normalizedStore = normalizeForMatch(storeName);

    if (normalizedHost.includes(normalizedStore)) {
      return `${parsed.protocol}//${parsed.hostname}/`;
    }

    return normalizeUrl(value);
  } catch {
    return normalizeUrl(value);
  }
}

function extractLinks(html: string, baseUrl: string) {
  const links = new Set<string>();
  const hrefPattern = /href=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;

  while ((match = hrefPattern.exec(html))) {
    const rawHref = decodeHtml(match[1]);
    let href = rawHref;

    try {
      if (href.includes("uddg=")) {
        const parsed = new URL(href, baseUrl);
        const decoded = parsed.searchParams.get("uddg");
        if (decoded) href = decoded;
      }

      const url = normalizeUrl(new URL(href, baseUrl).toString());
      const host = new URL(url).hostname;
      if (!/^https?:\/\//i.test(url) || SOCIAL_OR_NOISY_HOST_PATTERN.test(host)) {
        continue;
      }
      links.add(url);
    } catch {
      // Ignore malformed search-result links.
    }
  }

  return [...links];
}

async function stockistPageHasBrandPresence(target: StockistTarget, storeName: string) {
  const urls = Array.from(new Set([target.url, ...target.catalogs]));

  for (const url of urls) {
    const html = await fetchText(url);
    const signal = validateStockistPresence(html, storeName);
    if (signal.ok) return { ok: true, reason: signal.reason, url };
  }

  return { ok: false, reason: "brand not confirmed on stockist pages" };
}

function scoreCandidate(url: string, storeName: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    const normalizedHost = normalizeForMatch(host);
    const normalizedStore = normalizeForMatch(storeName);
    let score = 0;

    if (normalizedHost.includes(normalizedStore)) score += 80;
    if (host.endsWith(".com.au") || host.endsWith(".au")) score += 25;
    if (/(official|store|shop)/i.test(url)) score += 8;
    if (/(sale|clearance|outlet|deals?)/i.test(url)) score += 6;
    if (/(myer|davidjones|incu|theiconic|stockist|stores?)/i.test(host + parsed.pathname)) score += 5;
    if (/(careers|jobs|login|account|privacy|terms|returns)/i.test(url)) score -= 30;
    if (parsed.pathname.split("/").filter(Boolean).length > 3) score -= 8;

    return score;
  } catch {
    return -100;
  }
}

async function fetchText(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) return "";
    return await response.text();
  } catch {
    return "";
  } finally {
    clearTimeout(timeout);
  }
}

async function discoverCandidateUrl(storeName: string, country: string) {
  const searchQueries = [
    `${storeName} ${country} official store sale`,
    `${storeName} ${country} store locator sale`,
    `${storeName} ${country} official website`,
  ];
  const candidates = new Set<string>();

  for (const query of searchQueries) {
    const urls = [
      `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
    ];

    for (const url of urls) {
      const html = await fetchText(url);
      for (const link of extractLinks(html, url)) {
        candidates.add(link);
      }
    }
  }

  return [...candidates]
    .map((url) => ({ url, score: scoreCandidate(url, storeName) }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score)[0]?.url;
}

function retailCatalogs(baseUrl: string) {
  const base = baseUrl.replace(/\/$/, "");
  return Array.from(
    new Set([
      `${base}/sale`,
      `${base}/sale/`,
      `${base}/collections/sale`,
      `${base}/clearance`,
      `${base}/clearance/`,
      `${base}/outlet`,
      `${base}/outlet/`,
      `${base}/specials`,
      `${base}/deals`,
    ])
  );
}

function theIconicBrandUrl(storeName: string) {
  const slug = storeName
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\./g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");

  return `https://www.theiconic.com.au/${slug}/`;
}

function stockistTargetsForCategory(categoryName: string, storeName: string): StockistTarget[] {
  if (!/clothing|fashion|business attire|leather|sport gears|factory outlets|baby|kids/i.test(categoryName)) {
    return [];
  }

  const encoded = encodeURIComponent(storeName);
  const isSportCategory = /sport gears/i.test(categoryName);
  const isDressShoeOrBusinessBrand =
    /business attire/i.test(categoryName) ||
    /\b(?:r\.?\s*m\.?\s*williams?|rm\s*williams?|r\.?m\.?\s*williams?|aquila|florsheim|loake|church'?s|crockett|jones|bared|ecco|clarks|johnston\s*&?\s*murphy)\b/i.test(storeName);
  const isSneakerOrSportBrand =
    /\b(?:nike|adidas|asics|hoka|onitsuka|new\s*balance|puma|reebok|converse|vans|skechers|saucony|brooks|salomon|under\s*armour|footwear|sneaker|sneakers|running)\b/i.test(storeName);
  const shouldCheckSportStockists = isSportCategory || (!isDressShoeOrBusinessBrand && isSneakerOrSportBrand);

  const departmentStoreStockists: StockistTarget[] = [
    {
      stockistName: "Myer",
      url: `https://www.myer.com.au/search?query=${encoded}`,
      catalogs: [`https://www.myer.com.au/search?query=${encoded}`],
    },
    {
      stockistName: "David Jones",
      url: `https://www.davidjones.com/search?text=${encoded}`,
      catalogs: [`https://www.davidjones.com/search?text=${encoded}`],
    },
    {
      stockistName: "THE ICONIC",
      url: theIconicBrandUrl(storeName),
      catalogs: [theIconicBrandUrl(storeName)],
    },
  ];

  const fashionBoutiqueStockists: StockistTarget[] = [
    {
      stockistName: "Incu",
      url: `https://www.incu.com/search?q=${encoded}`,
      catalogs: [`https://www.incu.com/search?q=${encoded}`],
    },
  ];

  const fashionStockists = isDressShoeOrBusinessBrand
    ? departmentStoreStockists
    : [...departmentStoreStockists, ...fashionBoutiqueStockists];
  const sportFootwearStockists: StockistTarget[] = [
    {
      stockistName: "Platypus",
      url: `https://www.platypusshoes.com.au/search?q=${encoded}`,
      catalogs: [`https://www.platypusshoes.com.au/search?q=${encoded}`],
    },
    {
      stockistName: "Hype DC",
      url: `https://www.hypedc.com/au/search?q=${encoded}`,
      catalogs: [`https://www.hypedc.com/au/search?q=${encoded}`],
    },
    {
      stockistName: "The Athlete's Foot",
      url: `https://www.theathletesfoot.com.au/search?q=${encoded}`,
      catalogs: [`https://www.theathletesfoot.com.au/search?q=${encoded}`],
    },
    {
      stockistName: "JD Sports",
      url: `https://www.jdsports.com.au/search/${encoded}/`,
      catalogs: [`https://www.jdsports.com.au/search/${encoded}/`],
    },
    {
      stockistName: "Foot Locker",
      url: `https://www.footlocker.com.au/en/search?query=${encoded}`,
      catalogs: [`https://www.footlocker.com.au/en/search?query=${encoded}`],
    },
  ];

  return shouldCheckSportStockists
    ? [...fashionStockists, ...sportFootwearStockists]
    : fashionStockists;
}

function verifierProfileForCategory(categoryName: string): NonNullable<OfferVerifierOptions["profile"]> {
  if (/dining|caffe|cafe|brunch|beverage|cultural/i.test(categoryName)) return "dining";
  if (/travel|accommodation/i.test(categoryName)) return "travel";
  if (/entertainment|events/i.test(categoryName)) return "entertainment";
  if (/financial|services/i.test(categoryName)) return "services";
  return "retailShop";
}

async function runLocationEnrichment(categoryName: string, storeName: string) {
  const result = spawnSync(
    "npx",
    [
      "tsx",
      "scripts/enrich-online-store-locations.ts",
      "--apply",
      `--category=${categoryName}`,
      `--store=${storeName}`,
      "--exactStore",
      "--all-location-sources",
      "--discountState=all",
      "--limit=5",
      "--maxChecked=25",
      "--maxLocations=80",
    ],
    {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit",
      shell: process.platform === "win32",
    }
  );

  if (result.status !== 0) {
    console.warn(`Location enrichment finished with exit code ${result.status ?? "unknown"}.`);
  }
}

async function saveAndVerifyStore(input: SaveAndVerifyInput) {
  const profile = verifierProfileForCategory(input.categoryName);
  const host = new URL(input.url).hostname.replace(/^www\./, "");
  const existingByUrl = await prisma.store.findUnique({ where: { url: input.url } });
  const existingSameHost = existingByUrl
    ? null
    : await prisma.store.findFirst({
        where: {
          categoryId: input.categoryId,
          name: { equals: input.name, mode: "insensitive" },
          OR: [{ url: { contains: host } }, { websiteUrl: { contains: host } }],
        },
      });
  const storeData = {
    name: input.name,
    suburb: input.suburb || input.country,
    city: input.city || "Online",
    state: input.state || "National",
    country: input.country,
    address: input.address || `${input.name} online store`,
    description:
      input.description || `Website-backed listing discovered from category search for "${input.rawStoreName}".`,
    catalogs: input.catalogs,
    sourceType: "website",
    websiteUrl: input.websiteUrl,
    locationSource: input.locationSource || "online",
    categoryId: input.categoryId,
  };
  const savedStore = existingSameHost
    ? await prisma.store.update({
        where: { id: existingSameHost.id },
        data: {
          ...storeData,
          url: input.url,
        },
      })
    : await prisma.store.upsert({
        where: { url: input.url },
        update: storeData,
        create: {
          ...storeData,
          url: input.url,
          ownerId: input.ownerId,
        },
      });

  console.log(`saved: ${input.name} -> ${input.url}`);

  const result = await OfferVerifier.verifyStoreOfferPages(input.verificationUrl, input.catalogs, {
    country: input.country,
    profile,
    maxPages: 5,
    requestTimeoutMs: 15000,
    ...verifierOptionsForStoreCandidate(input.name),
  });

  await updateCatalogUrlHealth(prisma, savedStore.id, input.catalogs, result);

  const matchedUrl = result.matchedUrl;
  const ignoredOffer = matchedUrl
    ? input.ignoredOfferUrlPatterns?.some((pattern) => pattern.test(matchedUrl))
    : false;

  if (result.hasOffer && matchedUrl && !ignoredOffer) {
    const now = new Date();
    await prisma.discount.upsert({
      where: {
        storeId_title: {
          storeId: savedStore.id,
          title: "Happening Now...",
        },
      },
      update: {
        description: `Offer wording found on the store website (${result.matchedKeywords.join(", ")}). Check the store website for live availability.`,
        startDate: now,
        endDate: getLiveVerifiedOfferEndDate(now, profile),
        eCatalog: [matchedUrl],
        updatedAt: now,
      },
      create: {
        storeId: savedStore.id,
        title: "Happening Now...",
        description: `Offer wording found on the store website (${result.matchedKeywords.join(", ")}). Check the store website for live availability.`,
        startDate: now,
        endDate: getLiveVerifiedOfferEndDate(now, profile),
        eCatalog: [matchedUrl],
      },
    });
    console.log(`offer: ${input.name} -> ${result.matchedKeywords.join(", ")} @ ${matchedUrl}`);
    return { saved: 1, offer: 1 };
  }

  await prisma.discount.deleteMany({
    where: {
      storeId: savedStore.id,
      OR: [
        { title: "Happening Now..." },
        { description: { startsWith: "Offer wording found on the store website" } },
      ],
    },
  });
  console.log(`no-offer: ${input.name}${ignoredOffer ? ` (ignored ${result.matchedUrl})` : ""}`);
  return { saved: 1, offer: 0 };
}

async function main() {
  const categoryName = String(argValue("category") || "").trim();
  const rawStoreName = String(argValue("store") || "").trim();
  const country = String(argValue("country") || "Australia").trim();
  const storeName = cleanStoreName(rawStoreName);

  if (!categoryName || !storeName) {
    throw new Error("Both --category and --store are required.");
  }

  const owner = await prisma.user.findFirst({ orderBy: { id: "asc" } });
  if (!owner) throw new Error("No user found to own discovered stores.");

  const category = await prisma.category.upsert({
    where: { name: categoryName },
    update: {},
    create: { name: categoryName },
  });

  const discoveredUrl = await discoverCandidateUrl(storeName, country);
  if (!discoveredUrl) {
    console.log(`No official candidate URL found for ${storeName}.`);
    return;
  }

  const baseUrl = canonicalStoreUrl(discoveredUrl, storeName);
  const officialHtml = await fetchText(baseUrl);
  const officialCandidateValidation = validateStoreCandidate({
    name: storeName,
    url: baseUrl,
    websiteUrl: baseUrl,
    categoryName,
    html: officialHtml,
    sourceType: "website",
  });

  if (!officialCandidateValidation.ok) {
    console.log(`Rejected ${baseUrl}: ${officialCandidateValidation.reason}.`);
    return;
  }

  const displayName = titleCase(storeName);
  const catalogs = retailCatalogs(baseUrl);

  await saveAndVerifyStore({
    name: displayName,
    url: baseUrl,
    websiteUrl: baseUrl,
    verificationUrl: baseUrl,
    catalogs,
    categoryId: category.id,
    ownerId: owner.id,
    categoryName,
    country,
    rawStoreName,
  });

  let stockistSaved = 0;
  let stockistOffers = 0;

  for (const stockist of stockistTargetsForCategory(categoryName, storeName)) {
    const stockistPresence = await stockistPageHasBrandPresence(stockist, storeName);
    if (!stockistPresence.ok) {
      console.log(`skip-stockist: ${displayName} at ${stockist.stockistName} (${stockistPresence.reason})`);
      continue;
    }

    const result = await saveAndVerifyStore({
      name: `${displayName} at ${stockist.stockistName} Online`,
      url: stockist.url,
      websiteUrl: stockist.url,
      verificationUrl: stockist.url,
      catalogs: stockist.catalogs,
      categoryId: category.id,
      ownerId: owner.id,
      categoryName,
      country,
      rawStoreName,
      address: `${stockist.stockistName} online ${displayName} search or brand page`,
      description: `${displayName} stocked or searched through ${stockist.stockistName} Australia online. Verify live availability on the stockist website.`,
      ignoredOfferUrlPatterns: stockist.ignoredOfferUrlPatterns,
    });

    stockistSaved += result.saved;
    stockistOffers += result.offer;
  }

  console.log(`stockist-summary: saved ${stockistSaved}, verified offers ${stockistOffers}`);

  await runLocationEnrichment(categoryName, displayName);
}

main()
  .catch((error) => {
    console.error("Target store discovery failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
