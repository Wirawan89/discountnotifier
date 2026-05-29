import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_COUNTRY = "Australia";
const MAX_NEARBY_SUBURBS = 2;
const DINING_CATEGORY_NAMES = ["Caffe & Brunch", "Dining & Beverages", "Cultural Bites & Takeaway"];

const NEARBY_SUBURBS: Record<string, string[]> = {
  sydney: ["Haymarket", "Surry Hills"],
  haymarket: ["Sydney", "Surry Hills"],
  "surry hills": ["Sydney", "Haymarket"],
  mascot: ["Sydney", "Rosebery"],
  rosebery: ["Mascot", "Sydney"],
  leichhardt: ["Sydney", "Haymarket"],
  artarmon: ["Sydney", "Chatswood"],
  marrickville: ["Sydney", "Surry Hills"],
  melbourne: ["Southbank", "Richmond"],
  brisbane: ["Fortitude Valley", "South Brisbane"],
  perth: ["Northbridge", "Subiaco"],
  adelaide: ["Norwood", "Unley"],
};

function normalizeCountry(country: string | null) {
  if (!country || country.trim().length === 0) {
    return DEFAULT_COUNTRY;
  }

  if (/^(usa|us|united states of america)$/i.test(country.trim())) {
    return "United States";
  }

  if (/^nz$/i.test(country.trim())) {
    return "New Zealand";
  }

  return country.trim();
}

function buildCountryWhere(country: string) {
  if (country === DEFAULT_COUNTRY) {
    return {
      OR: [{ country }, { country: "" }],
    };
  }

  return { country };
}

function normalizeSuburb(suburb: string) {
  return suburb.trim().toLowerCase();
}

function pickNearbySuburbs(location: string, availableSuburbs: string[]) {
  const exactSuburb =
    availableSuburbs.find((suburb) => normalizeSuburb(suburb) === normalizeSuburb(location)) ||
    location.trim();
  const preferredNearby = NEARBY_SUBURBS[normalizeSuburb(location)] || [];
  const nearby = preferredNearby
    .map((suburb) =>
      availableSuburbs.find((availableSuburb) => normalizeSuburb(availableSuburb) === normalizeSuburb(suburb))
    )
    .filter((suburb): suburb is string => Boolean(suburb))
    .filter((suburb) => normalizeSuburb(suburb) !== normalizeSuburb(exactSuburb));
  const fallbackNearby = availableSuburbs
    .filter((suburb) => normalizeSuburb(suburb) !== normalizeSuburb(exactSuburb))
    .filter((suburb) => !nearby.some((nearbySuburb) => normalizeSuburb(nearbySuburb) === normalizeSuburb(suburb)));

  return [exactSuburb, ...nearby, ...fallbackNearby].slice(0, MAX_NEARBY_SUBURBS + 1);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location")?.trim();
    const country = normalizeCountry(searchParams.get("country"));

    if (!location) {
      return NextResponse.json({ error: "Location is required" }, { status: 400 });
    }

    const countryWhere = buildCountryWhere(country);
    const categoryWhere = {
      category: {
        name: {
          in: DINING_CATEGORY_NAMES,
        },
      },
    };

    const availableStores = await prisma.store.findMany({
      where: {
        ...countryWhere,
        ...categoryWhere,
      },
      select: {
        suburb: true,
      },
      distinct: ["suburb"],
    });
    const availableSuburbs = availableStores
      .map((store) => store.suburb)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    const suburbs = pickNearbySuburbs(location, availableSuburbs);

    const stores = await prisma.store.findMany({
      where: {
        ...countryWhere,
        ...categoryWhere,
        suburb: {
          in: suburbs,
        },
        discounts: {
          some: {
            endDate: {
              gte: new Date(),
            },
          },
        },
      },
      include: {
        category: true,
        discounts: {
          where: {
            endDate: {
              gte: new Date(),
            },
          },
          orderBy: {
            endDate: "asc",
          },
        },
      },
      orderBy: [{ suburb: "asc" }, { name: "asc" }],
    });

    const totalDiscounts = stores.reduce((sum, store) => sum + store.discounts.length, 0);

    return NextResponse.json({
      message: `Found ${stores.length} brunch, dining, beverage and cultural bites stores with ${totalDiscounts} current offers near ${location}`,
      location,
      country,
      categories: DINING_CATEGORY_NAMES,
      suburbs,
      stores,
      stats: {
        totalStores: stores.length,
        totalDiscounts,
      },
    });
  } catch (error) {
    console.error("Error fetching OffersNearby stores:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch OffersNearby stores",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
