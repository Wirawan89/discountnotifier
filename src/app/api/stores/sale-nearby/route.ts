import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_COUNTRY = "Australia";
const MAX_NEARBY_SUBURBS = 2;

const NEARBY_SUBURBS: Record<string, string[]> = {
  sydney: ["Haymarket", "Surry Hills"],
  haymarket: ["Sydney", "Surry Hills"],
  "surry hills": ["Sydney", "Haymarket"],
  cabramatta: ["Canley Vale", "Fairfield"],
  "canley vale": ["Cabramatta", "Fairfield"],
  fairfield: ["Cabramatta", "Canley Vale"],
  liverpool: ["Cabramatta", "Fairfield"],
  bankstown: ["Cabramatta", "Burwood"],
  chatswood: ["Artarmon", "North Sydney"],
  burwood: ["Strathfield", "Ashfield"],
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
  const exactSuburb = availableSuburbs.find(
    (suburb) => normalizeSuburb(suburb) === normalizeSuburb(location)
  ) || location.trim();
  const preferredNearby = NEARBY_SUBURBS[normalizeSuburb(location)] || [];
  const nearby = preferredNearby
    .map((suburb) =>
      availableSuburbs.find((availableSuburb) => normalizeSuburb(availableSuburb) === normalizeSuburb(suburb))
    )
    .filter((suburb): suburb is string => Boolean(suburb))
    .filter((suburb) => normalizeSuburb(suburb) !== normalizeSuburb(exactSuburb));

  return [exactSuburb, ...nearby].slice(0, MAX_NEARBY_SUBURBS + 1);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location")?.trim();
    const country = normalizeCountry(searchParams.get("country"));

    if (!location) {
      return NextResponse.json({ error: "Location is required" }, { status: 400 });
    }

    const now = new Date();
    const countryWhere = buildCountryWhere(country);
    const availableStores = await prisma.store.findMany({
      where: countryWhere,
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
        suburb: {
          in: suburbs,
        },
        OR: [
          {
            discounts: {
              some: {
                endDate: {
                  gte: now,
                },
              },
            },
          },
          {
            promotions: {
              some: {
                status: "active",
                startDate: {
                  lte: now,
                },
                endDate: {
                  gte: now,
                },
              },
            },
          },
        ],
      },
      include: {
        category: true,
        discounts: {
          where: {
            endDate: {
              gte: now,
            },
          },
          orderBy: {
            endDate: "asc",
          },
        },
        promotions: {
          where: {
            status: "active",
            startDate: {
              lte: now,
            },
            endDate: {
              gte: now,
            },
          },
          orderBy: [{ priority: "desc" }, { endDate: "asc" }],
        },
      },
      orderBy: [{ suburb: "asc" }, { name: "asc" }],
    });

    const totalDiscounts = stores.reduce((sum, store) => sum + store.discounts.length, 0);
    const totalPromotions = stores.reduce((sum, store) => sum + store.promotions.length, 0);

    return NextResponse.json({
      message:
        stores.length > 0
          ? `Found ${stores.length} stores with ${totalDiscounts} current offers and ${totalPromotions} merchant promotions near ${location}`
          : `No sale or offer stores found near ${location}. To learn or browse the stores near you, use Categories and select Near me.`,
      location,
      country,
      suburbs,
      stores,
      stats: {
        totalStores: stores.length,
        totalDiscounts,
        totalPromotions,
      },
    });
  } catch (error) {
    console.error("Error fetching SaleNearby stores:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch SaleNearby stores",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
