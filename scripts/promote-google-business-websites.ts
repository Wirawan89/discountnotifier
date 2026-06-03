import { PrismaClient } from "@prisma/client";
import { getLiveVerifiedOfferEndDate } from "../src/lib/offer-lifecycle";
import { OfferVerifier, type OfferVerifierOptions } from "../src/lib/offer-verifier";

const prisma = new PrismaClient();

type VerifierProfile = NonNullable<OfferVerifierOptions["profile"]>;

type WebsitePromotion = {
  name: string;
  category: string;
  suburb: string;
  city: string;
  officialUrl: string;
  catalogs?: string[];
  state?: string;
  address?: string;
  contact?: string;
  profile?: VerifierProfile;
};

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const listUnresolved = args.has("--list-unresolved");

const profileByCategory: Record<string, VerifierProfile> = {
  "Caffe & Brunch": "dining",
  "Cultural Bites & Takeaway": "dining",
  "Dining & Beverages": "dining",
  "Gifts & Flowers": "retailShop",
  "Hobbies & Classes": "services",
};

const promotions: WebsitePromotion[] = [
  {
    name: "Coffee Alchemy Marrickville",
    category: "Caffe & Brunch",
    suburb: "Marrickville",
    city: "Sydney",
    state: "NSW",
    address: "2/87 Sydenham Road, Marrickville NSW 2204",
    contact: "(02) 9516 1997",
    officialUrl: "https://coffeealchemy.com.au/pages/coffee-alchemy",
  },
  {
    name: "Black Market Coffee Marrickville",
    category: "Caffe & Brunch",
    suburb: "Marrickville",
    city: "Sydney",
    state: "NSW",
    address: "24 Cadogan Street, Marrickville NSW 2204",
    officialUrl: "https://blackmarketcoffee.com.au/",
  },
  {
    name: "Double Tap Marrickville",
    category: "Caffe & Brunch",
    suburb: "Marrickville",
    city: "Sydney",
    state: "NSW",
    address: "54-56 Smith Street, Marrickville NSW 2204",
    contact: "0404 475 430",
    officialUrl: "https://doubletapcoffee.com.au/about-us/",
  },
  {
    name: "Industry Beans Fitzroy",
    category: "Caffe & Brunch",
    suburb: "Fitzroy",
    city: "Melbourne",
    state: "VIC",
    officialUrl: "https://industrybeans.com/pages/fitzroy",
  },
  {
    name: "Seven Seeds Carlton",
    category: "Caffe & Brunch",
    suburb: "Carlton",
    city: "Melbourne",
    state: "VIC",
    officialUrl: "https://sevenseeds.com.au/",
  },
  {
    name: "St Ali South Melbourne",
    category: "Caffe & Brunch",
    suburb: "South Melbourne",
    city: "Melbourne",
    state: "VIC",
    officialUrl: "https://stali.com.au/",
  },
  {
    name: "Proud Mary Collingwood",
    category: "Caffe & Brunch",
    suburb: "Collingwood",
    city: "Melbourne",
    state: "VIC",
    officialUrl: "https://www.proudmarycoffee.com.au/",
  },
  {
    name: "Top Paddock Richmond",
    category: "Caffe & Brunch",
    suburb: "Richmond",
    city: "Melbourne",
    state: "VIC",
    officialUrl: "https://toppaddockcafe.com/",
  },
  {
    name: "Market Lane Coffee South Yarra",
    category: "Caffe & Brunch",
    suburb: "South Yarra",
    city: "Melbourne",
    state: "VIC",
    officialUrl: "https://marketlane.com.au/pages/south-yarra-market",
  },
  {
    name: "Auction Rooms North Melbourne",
    category: "Caffe & Brunch",
    suburb: "North Melbourne",
    city: "Melbourne",
    state: "VIC",
    officialUrl: "https://auctionroomscafe.com.au/",
  },
  {
    name: "Felix for Good Brisbane",
    category: "Caffe & Brunch",
    suburb: "Brisbane City",
    city: "Brisbane",
    state: "QLD",
    officialUrl: "https://www.felixforgoodness.com/",
  },
  {
    name: "Pawpaw Cafe Woolloongabba",
    category: "Caffe & Brunch",
    suburb: "Woolloongabba",
    city: "Brisbane",
    state: "QLD",
    officialUrl: "https://pawpawcafe.com.au/",
  },
  {
    name: "Little Loco New Farm",
    category: "Caffe & Brunch",
    suburb: "New Farm",
    city: "Brisbane",
    state: "QLD",
    officialUrl: "https://littleloco.com.au/",
  },
  {
    name: "Nodo Newstead",
    category: "Caffe & Brunch",
    suburb: "Newstead",
    city: "Brisbane",
    state: "QLD",
    officialUrl: "https://nododonuts.com/pages/newstead",
  },
  {
    name: "La Veen Coffee Perth",
    category: "Caffe & Brunch",
    suburb: "Perth",
    city: "Perth",
    state: "WA",
    officialUrl: "https://laveencoffee.com.au/",
  },
  {
    name: "Hylin West Leederville",
    category: "Caffe & Brunch",
    suburb: "West Leederville",
    city: "Perth",
    state: "WA",
    officialUrl: "https://www.hylin.com.au/",
  },
  {
    name: "Little Lefroy Fremantle",
    category: "Caffe & Brunch",
    suburb: "Fremantle",
    city: "Perth",
    state: "WA",
    officialUrl: "https://littlelefroy.com/",
  },
  {
    name: "Gordon St Garage West Perth",
    category: "Caffe & Brunch",
    suburb: "West Perth",
    city: "Perth",
    state: "WA",
    officialUrl: "https://gordonstgarage.com.au/",
  },
  {
    name: "Daisies Cottesloe",
    category: "Caffe & Brunch",
    suburb: "Cottesloe",
    city: "Perth",
    state: "WA",
    officialUrl: "https://daisiescottesloe.com.au/",
  },
  {
    name: "Exchange Coffee Adelaide",
    category: "Caffe & Brunch",
    suburb: "Adelaide",
    city: "Adelaide",
    state: "SA",
    officialUrl: "https://exchangecoffee.com.au/",
  },
  {
    name: "Part Time Lover Adelaide",
    category: "Caffe & Brunch",
    suburb: "Adelaide",
    city: "Adelaide",
    state: "SA",
    officialUrl: "https://parttimelover.com.au/",
  },
  {
    name: "Whistle and Flute Unley",
    category: "Caffe & Brunch",
    suburb: "Unley",
    city: "Adelaide",
    state: "SA",
    officialUrl: "https://whistleandflute.com.au/",
  },
  {
    name: "Dandy Lane Hobart",
    category: "Caffe & Brunch",
    suburb: "Hobart",
    city: "Hobart",
    state: "TAS",
    officialUrl: "https://www.dandylane.com.au/",
  },
  {
    name: "Machine Laundry Cafe Hobart",
    category: "Caffe & Brunch",
    suburb: "Salamanca",
    city: "Hobart",
    state: "TAS",
    officialUrl: "https://machinelaundrycafe.com.au/",
  },
  {
    name: "Sweet Bones Braddon",
    category: "Caffe & Brunch",
    suburb: "Braddon",
    city: "Canberra",
    state: "ACT",
    officialUrl: "https://sweetbonescompany.com/",
  },
  {
    name: "Highroad Dickson",
    category: "Caffe & Brunch",
    suburb: "Dickson",
    city: "Canberra",
    state: "ACT",
    officialUrl: "https://www.highroad.com.au/",
  },
  {
    name: "The Cupping Room Canberra",
    category: "Caffe & Brunch",
    suburb: "Canberra City",
    city: "Canberra",
    state: "ACT",
    officialUrl: "https://thecuppingroom.com.au/",
  },
  {
    name: "Laneway Specialty Coffee Darwin",
    category: "Caffe & Brunch",
    suburb: "Parap",
    city: "Darwin",
    state: "NT",
    officialUrl: "https://www.lanewayspecialtycoffee.com.au/",
  },
  {
    name: "Barefoot Barista Palm Beach",
    category: "Caffe & Brunch",
    suburb: "Palm Beach",
    city: "Gold Coast",
    state: "QLD",
    officialUrl: "https://www.barefootbarista.com.au/",
  },
  {
    name: "Daark Espresso Chirn Park",
    category: "Caffe & Brunch",
    suburb: "Chirn Park",
    city: "Gold Coast",
    state: "QLD",
    officialUrl: "https://daarkespresso.com.au/",
  },
  {
    name: "Circa Espresso Parramatta",
    category: "Caffe & Brunch",
    suburb: "Parramatta",
    city: "Sydney",
    state: "NSW",
    officialUrl: "https://circaespresso.com.au/",
  },
  {
    name: "Lil Miss Collins Parramatta",
    category: "Caffe & Brunch",
    suburb: "Parramatta",
    city: "Sydney",
    state: "NSW",
    officialUrl: "https://www.lilmisscollins.com.au/",
  },
  {
    name: "Banh Cuon Ba Oanh",
    category: "Cultural Bites & Takeaway",
    suburb: "Cabramatta",
    city: "Sydney",
    state: "NSW",
    officialUrl: "https://banhcuonbaoanh.com.au/",
  },
  {
    name: "Tan Viet Noodle House Eastwood",
    category: "Cultural Bites & Takeaway",
    suburb: "Eastwood",
    city: "Sydney",
    state: "NSW",
    officialUrl: "https://tanviet.com.au/",
  },
  {
    name: "Medan Ciak Sydney",
    category: "Cultural Bites & Takeaway",
    suburb: "Sydney",
    city: "Sydney",
    state: "NSW",
    officialUrl: "https://medanciak.com.au/",
  },
  {
    name: "Chatkazz Harris Park",
    category: "Cultural Bites & Takeaway",
    suburb: "Harris Park",
    city: "Sydney",
    state: "NSW",
    officialUrl: "https://www.chatkazz.com.au/",
  },
  {
    name: "Aangan Indian Restaurant West Footscray",
    category: "Cultural Bites & Takeaway",
    suburb: "West Footscray",
    city: "Melbourne",
    state: "VIC",
    officialUrl: "https://aangan.com.au/",
  },
  {
    name: "Dosa Hut Harris Park",
    category: "Cultural Bites & Takeaway",
    suburb: "Harris Park",
    city: "Sydney",
    state: "NSW",
    officialUrl: "https://www.dosahut.com.au/",
  },
  {
    name: "Dosa Hut Dandenong",
    category: "Cultural Bites & Takeaway",
    suburb: "Dandenong",
    city: "Melbourne",
    state: "VIC",
    officialUrl: "https://www.dosahut.com.au/",
  },
  {
    name: "Billu's Indian Eatery Harris Park",
    category: "Cultural Bites & Takeaway",
    suburb: "Harris Park",
    city: "Sydney",
    state: "NSW",
    officialUrl: "https://billus.com.au/",
  },
  {
    name: "Shalom Indonesian Restaurant Kingsford",
    category: "Cultural Bites & Takeaway",
    suburb: "Kingsford",
    city: "Sydney",
    state: "NSW",
    officialUrl: "https://shalomindonesianrestaurant.com.au/",
  },
  {
    name: "Work-Shop Melbourne",
    category: "Hobbies & Classes",
    suburb: "Fitzroy",
    city: "Melbourne",
    state: "VIC",
    officialUrl: "https://work-shop.com.au/",
  },
  {
    name: "Work-Shop Sydney",
    category: "Hobbies & Classes",
    suburb: "Redfern",
    city: "Sydney",
    state: "NSW",
    officialUrl: "https://work-shop.com.au/",
  },
  {
    name: "Kumon Chatswood",
    category: "Hobbies & Classes",
    suburb: "Chatswood",
    city: "Sydney",
    state: "NSW",
    officialUrl: "https://www.kumonsearch.com.au/class/chatswood",
  },
  {
    name: "North Shore Coaching College Chatswood",
    category: "Hobbies & Classes",
    suburb: "Chatswood",
    city: "Sydney",
    state: "NSW",
    officialUrl: "https://www.north-shore.com.au/",
  },
  {
    name: "Poho Flowers Potts Point",
    category: "Gifts & Flowers",
    suburb: "Potts Point",
    city: "Sydney",
    state: "NSW",
    officialUrl: "https://www.poho.com.au/",
  },
  {
    name: "Little Flowers Sydney",
    category: "Gifts & Flowers",
    suburb: "Sydney",
    city: "Sydney",
    state: "NSW",
    officialUrl: "https://littleflowers.com.au/",
  },
  {
    name: "Poppy Rose Brisbane",
    category: "Gifts & Flowers",
    suburb: "Brisbane",
    city: "Brisbane",
    state: "QLD",
    officialUrl: "https://poppyrose.com.au/",
  },
  {
    name: "Daphne Florist Perth",
    category: "Gifts & Flowers",
    suburb: "Perth",
    city: "Perth",
    state: "WA",
    officialUrl: "https://www.daphneflorist.com.au/",
  },
];

function googleSearchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}&source=lnms&tbm=lcl`;
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function branchUrl(mapping: WebsitePromotion): string {
  const duplicateUrlCount = promotions.filter((item) => item.officialUrl === mapping.officialUrl).length;
  if (duplicateUrlCount <= 1) {
    return mapping.officialUrl;
  }

  return `${mapping.officialUrl.replace(/#.*$/, "")}#${slug(`${mapping.suburb} ${mapping.city}`)}`;
}

function offerDescription(result: { matchedKeywords?: string[]; matchedUrl?: string }): string {
  const suffix = result.matchedKeywords?.length ? ` (${result.matchedKeywords.join(", ")})` : "";
  return `Offer wording found on the store website${suffix}. Check store website for latest availability.`;
}

async function ownerId(): Promise<number> {
  const admin = await prisma.user.findFirst({
    where: { email: "admin@discountnotifier.com" },
    select: { id: true },
  });

  if (admin) {
    return admin.id;
  }

  const firstUser = await prisma.user.findFirst({ select: { id: true }, orderBy: { id: "asc" } });
  if (!firstUser) {
    throw new Error("No user exists to own seeded stores.");
  }
  return firstUser.id;
}

async function upsertVerifiedOffer(
  storeId: number,
  profile: VerifierProfile,
  result: { matchedKeywords?: string[]; matchedUrl?: string }
) {
  const now = new Date();
  const endDate = getLiveVerifiedOfferEndDate(now, profile);

  await prisma.discount.upsert({
    where: {
      storeId_title: {
        storeId,
        title: "Happening Now...",
      },
    },
    update: {
      description: offerDescription(result),
      startDate: now,
      endDate,
      eCatalog: result.matchedUrl ? [result.matchedUrl] : [],
    },
    create: {
      storeId,
      title: "Happening Now...",
      description: offerDescription(result),
      startDate: now,
      endDate,
      eCatalog: result.matchedUrl ? [result.matchedUrl] : [],
    },
  });
}

async function removeLiveVerifiedOffer(storeId: number) {
  await prisma.discount.deleteMany({
    where: {
      storeId,
      OR: [
        { title: "Happening Now..." },
        { title: "Now on Sale" },
        { description: { startsWith: "Offer wording found on the store website" } },
      ],
    },
  });
}

async function promote(mapping: WebsitePromotion, owner: number) {
  const category = await prisma.category.findUnique({ where: { name: mapping.category }, select: { id: true } });
  if (!category) {
    return { status: "missing-category", mapping };
  }

  const profile = mapping.profile || profileByCategory[mapping.category] || "retailShop";
  const googleRows = await prisma.store.findMany({
    where: {
      categoryId: category.id,
      sourceType: "google_business",
      NOT: { locationSource: "closed" },
      name: { equals: mapping.name, mode: "insensitive" },
      suburb: { equals: mapping.suburb, mode: "insensitive" },
    },
    select: { id: true, url: true, name: true, suburb: true },
  });

  const googleUrl = googleRows[0]?.url || googleSearchUrl(`${mapping.name} ${mapping.suburb}`);
  const catalogs = mapping.catalogs?.length ? mapping.catalogs : [mapping.officialUrl];
  const storeUrl = branchUrl(mapping);

  if (dryRun) {
    return { status: googleRows.length === 0 ? "dry-run-ensure-only" : "dry-run", mapping, googleRows: googleRows.length };
  }

  const existing = await prisma.store.findUnique({ where: { url: storeUrl }, select: { id: true } });
  const store = existing
    ? await prisma.store.update({
        where: { id: existing.id },
        data: {
          name: mapping.name,
          suburb: mapping.suburb,
          city: mapping.city,
          state: mapping.state,
          country: "Australia",
          address: mapping.address,
          contact: mapping.contact,
          categoryId: category.id,
          catalogs,
          sourceType: "website",
          googleBusinessUrl: googleUrl,
          websiteUrl: mapping.officialUrl,
          locationSource: "suburb",
          description: "Official website listing promoted from Google Business fallback.",
        },
        select: { id: true },
      })
    : await prisma.store.create({
        data: {
          name: mapping.name,
          url: storeUrl,
          suburb: mapping.suburb,
          city: mapping.city,
          state: mapping.state,
          country: "Australia",
          address: mapping.address,
          contact: mapping.contact,
          categoryId: category.id,
          ownerId: owner,
          catalogs,
          sourceType: "website",
          googleBusinessUrl: googleUrl,
          websiteUrl: mapping.officialUrl,
          locationSource: "suburb",
          description: "Official website listing promoted from Google Business fallback.",
        },
        select: { id: true },
      });

  const result = await OfferVerifier.verifyStoreOfferPages(mapping.officialUrl, catalogs, {
    country: "Australia",
    profile,
    maxPages: 5,
    requestTimeoutMs: 12000,
  });

  if (result.hasOffer) {
    await upsertVerifiedOffer(store.id, profile, result);
  } else {
    await removeLiveVerifiedOffer(store.id);
  }

  const closed = googleRows.length
    ? await prisma.store.updateMany({
        where: {
          id: { in: googleRows.map((row) => row.id) },
        },
        data: {
          locationSource: "closed",
          description: "Closed duplicate superseded by official website listing.",
        },
      })
    : { count: 0 };

  if (googleRows.length) {
    await prisma.discount.deleteMany({ where: { storeId: { in: googleRows.map((row) => row.id) } } });
  }

  if (storeUrl !== mapping.officialUrl) {
    const duplicateBaseRows = await prisma.store.findMany({
      where: {
        categoryId: category.id,
        url: mapping.officialUrl,
        sourceType: "website",
        NOT: { locationSource: "closed" },
      },
      select: { id: true },
    });

    if (duplicateBaseRows.length) {
      await prisma.store.updateMany({
        where: { id: { in: duplicateBaseRows.map((row) => row.id) } },
        data: {
          locationSource: "closed",
          description: "Closed duplicate base listing superseded by branch-specific official website listings.",
        },
      });
      await prisma.discount.deleteMany({ where: { storeId: { in: duplicateBaseRows.map((row) => row.id) } } });
    }
  }

  return {
    status: result.hasOffer
      ? googleRows.length === 0 ? "ensured-with-offer" : "promoted-with-offer"
      : googleRows.length === 0 ? "ensured-no-offer" : "promoted-no-offer",
    mapping,
    storeId: store.id,
    closed: closed.count,
    matchedKeywords: result.matchedKeywords,
    matchedUrl: result.matchedUrl,
  };
}

async function printUnresolved() {
  const mappedKeys = new Set(
    promotions.map((item) => `${item.category.toLowerCase()}|${item.name.toLowerCase()}|${item.suburb.toLowerCase()}`)
  );

  const rows = await prisma.store.findMany({
    where: { sourceType: "google_business", NOT: { locationSource: "closed" } },
    select: {
      name: true,
      suburb: true,
      city: true,
      category: { select: { name: true } },
    },
    orderBy: [{ category: { name: "asc" } }, { suburb: "asc" }, { name: "asc" }],
  });

  const unresolved = rows.filter(
    (row) => !mappedKeys.has(`${row.category.name.toLowerCase()}|${row.name.toLowerCase()}|${row.suburb.toLowerCase()}`)
  );

  console.log(JSON.stringify({
    unresolvedCount: unresolved.length,
    unresolved: unresolved.map((row) => ({
      category: row.category.name,
      name: row.name,
      suburb: row.suburb,
      search: `https://www.google.com/search?q=${encodeURIComponent(`${row.name} ${row.suburb} official website`)}`,
    })),
  }, null, 2));
}

async function main() {
  if (listUnresolved) {
    await printUnresolved();
    return;
  }

  const owner = await ownerId();
  const results = [];
  for (const mapping of promotions) {
    try {
      results.push(await promote(mapping, owner));
    } catch (error) {
      results.push({
        status: "error",
        mapping,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const summary = results.reduce<Record<string, number>>((acc, result) => {
    acc[result.status] = (acc[result.status] || 0) + 1;
    return acc;
  }, {});

  console.log(JSON.stringify({ dryRun, total: results.length, summary, results }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
