import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_COUNTRY = "Australia";

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

function buildCountryWhere(country: string | null) {
  const normalizedCountry = normalizeCountry(country);

  if (normalizedCountry === DEFAULT_COUNTRY) {
    return {
      OR: [{ country: normalizedCountry }, { country: "" }],
    };
  }

  return { country: normalizedCountry };
}

function averageCoordinates(rows: Array<{ latitude: number | null; longitude: number | null }>) {
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
    matchedStores: coordinates.length,
  };
}

function countryCodeForGeocode(country: string | null) {
  const normalizedCountry = normalizeCountry(country);

  if (normalizedCountry === "Australia") {
    return "au";
  }

  if (normalizedCountry === "New Zealand") {
    return "nz";
  }

  if (normalizedCountry === "United States") {
    return "us";
  }

  return "";
}

async function geocodeLocation(location: string, country: string | null) {
  const normalizedCountry = normalizeCountry(country);
  const countryCode = countryCodeForGeocode(country);
  const params = new URLSearchParams({
    format: "jsonv2",
    limit: "1",
    q: `${location}, ${normalizedCountry}`,
  });

  if (countryCode) {
    params.set("countrycodes", countryCode);
  }

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: {
      "Accept-Language": "en-AU,en;q=0.9",
      "User-Agent": "DiscountNotifier/0.1 location lookup",
    },
  });

  if (!response.ok) {
    return null;
  }

  const results = await response.json();
  const firstResult = Array.isArray(results) ? results[0] : null;
  const lat = Number(firstResult?.lat);
  const lng = Number(firstResult?.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    lat,
    lng,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location")?.trim();
    const country = searchParams.get("country");

    if (!location) {
      return NextResponse.json({ error: "Location is required" }, { status: 400 });
    }

    const baseWhere = {
      ...buildCountryWhere(country),
      latitude: { not: null },
      longitude: { not: null },
      NOT: {
        locationSource: "closed",
      },
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
      return NextResponse.json({
        ...suburbCoordinates,
        location,
        source: "store-suburb",
      });
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

    const cityCoordinates = averageCoordinates(cityMatches);

    if (cityCoordinates) {
      return NextResponse.json({
        ...cityCoordinates,
        location,
        source: "store-city",
      });
    }

    const geocodedCoordinates = await geocodeLocation(location, country);

    if (geocodedCoordinates) {
      return NextResponse.json({
        ...geocodedCoordinates,
        matchedStores: 0,
        location,
        source: "geocoded-suburb",
      });
    }

    return NextResponse.json({ error: "No coordinates found for this location" }, { status: 404 });
  } catch (error) {
    console.error("Failed to resolve location coordinates:", error);
    return NextResponse.json({ error: "Failed to resolve location coordinates" }, { status: 500 });
  }
}
