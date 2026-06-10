import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_COUNTRY = "Australia";
const DINING_CATEGORY_NAMES = ["Caffe & Brunch", "Dining & Beverages", "Cultural Bites & Takeaway"];
const MAX_NEARBY_WALKING_KM = 12;
const WALKING_DISTANCE_ESTIMATE_MULTIPLIER = 1.35;

type Coordinates = {
  lat: number;
  lng: number;
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

function distanceKm(from: Coordinates, to: Coordinates) {
  const earthRadiusKm = 6371;
  const latDistance = ((to.lat - from.lat) * Math.PI) / 180;
  const lngDistance = ((to.lng - from.lng) * Math.PI) / 180;
  const fromLat = (from.lat * Math.PI) / 180;
  const toLat = (to.lat * Math.PI) / 180;
  const haversine =
    Math.sin(latDistance / 2) * Math.sin(latDistance / 2) +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lngDistance / 2) * Math.sin(lngDistance / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function estimateWalkingDistanceKm(straightLineDistanceKm: number) {
  return straightLineDistanceKm * WALKING_DISTANCE_ESTIMATE_MULTIPLIER;
}

function parseCoordinates(searchParams: URLSearchParams) {
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
}

function currentMonthlyWeek(date: Date) {
  return Math.min(4, Math.floor((date.getDate() - 1) / 7) + 1);
}

function isScheduledForDate(scheduleType: string, weeklyDays: number[], monthlyWeeks: number[], date: Date) {
  if (scheduleType === "daily" || scheduleType === "one_off") return true;
  if (scheduleType === "weekly") {
    const day = date.getDay() === 0 ? 7 : date.getDay();
    return weeklyDays.includes(day);
  }
  if (scheduleType === "monthly") return monthlyWeeks.includes(currentMonthlyWeek(date));
  return true;
}

async function resolveLocationCoordinates(location: string, country: string) {
  const countryWhere = buildCountryWhere(country);
  const baseWhere = {
    ...countryWhere,
    latitude: { not: null },
    longitude: { not: null },
    NOT: {
      locationSource: "closed",
    },
  };

  const averageCoordinates = (rows: Array<{ latitude: number | null; longitude: number | null }>) => {
    const coordinates = rows.filter(
      (row): row is { latitude: number; longitude: number } =>
        typeof row.latitude === "number" && typeof row.longitude === "number"
    );

    if (coordinates.length === 0) {
      return null;
    }

    return {
      lat: coordinates.reduce((sum, row) => sum + row.latitude, 0) / coordinates.length,
      lng: coordinates.reduce((sum, row) => sum + row.longitude, 0) / coordinates.length,
    };
  };

  const suburbMatches = await prisma.store.findMany({
    where: {
      ...baseWhere,
      suburb: {
        equals: location,
        mode: "insensitive",
      },
    },
    select: {
      latitude: true,
      longitude: true,
    },
    take: 100,
  });
  const suburbCoordinates = averageCoordinates(suburbMatches);

  if (suburbCoordinates) {
    return suburbCoordinates;
  }

  const cityMatches = await prisma.store.findMany({
    where: {
      ...baseWhere,
      city: {
        equals: location,
        mode: "insensitive",
      },
    },
    select: {
      latitude: true,
      longitude: true,
    },
    take: 100,
  });

  return averageCoordinates(cityMatches);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location")?.trim();
    const country = normalizeCountry(searchParams.get("country"));
    const originCoordinates = parseCoordinates(searchParams) || (location ? await resolveLocationCoordinates(location, country) : null);

    if (!location && !originCoordinates) {
      return NextResponse.json({ error: "Location or coordinates are required" }, { status: 400 });
    }

    if (!originCoordinates) {
      return NextResponse.json({ error: "Could not resolve location coordinates" }, { status: 404 });
    }

    const now = new Date();
    const countryWhere = buildCountryWhere(country);
    const categoryWhere = {
      category: {
        name: {
          in: DINING_CATEGORY_NAMES,
        },
      },
    };

    const stores = await prisma.store.findMany({
      where: {
        ...countryWhere,
        ...categoryWhere,
        NOT: {
          locationSource: "closed",
        },
        latitude: { not: null },
        longitude: { not: null },
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

    const scheduledStores = stores
      .map((store) => ({
        ...store,
        distanceKm: estimateWalkingDistanceKm(
          distanceKm(originCoordinates, {
            lat: Number(store.latitude),
            lng: Number(store.longitude),
          })
        ),
        promotions: store.promotions.filter((promotion) =>
          isScheduledForDate(promotion.scheduleType, promotion.weeklyDays, promotion.monthlyWeeks, now)
        ),
      }))
      .filter(
        (store) =>
          (store.discounts.length > 0 || store.promotions.length > 0) &&
          store.distanceKm <= MAX_NEARBY_WALKING_KM
      )
      .sort((a, b) => a.distanceKm - b.distanceKm);
    const totalDiscounts = scheduledStores.reduce((sum, store) => sum + store.discounts.length, 0);
    const totalPromotions = scheduledStores.reduce((sum, store) => sum + store.promotions.length, 0);
    const suburbs = Array.from(new Set(scheduledStores.map((store) => store.suburb).filter(Boolean)));

    return NextResponse.json({
      message:
        scheduledStores.length > 0
          ? `Found ${scheduledStores.length} brunch, dining, beverage and cultural bites stores with ${totalDiscounts} current offers and ${totalPromotions} merchant promotions within ${MAX_NEARBY_WALKING_KM} km estimated walking distance of ${location || "your location"}`
          : `No sale or offer stores found near ${location || "your location"}. To learn or browse the stores near you, use Categories and select Near me.`,
      location: location || "Current location",
      country,
      categories: DINING_CATEGORY_NAMES,
      suburbs,
      origin: originCoordinates,
      stores: scheduledStores,
      stats: {
        totalStores: scheduledStores.length,
        totalDiscounts,
        totalPromotions,
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
