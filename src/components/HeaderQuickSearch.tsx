"use client";

import { FormEvent, useMemo, useState } from "react";

type StoreSearchResult = {
  id: number;
  name: string;
  url: string;
  suburb: string;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  category?: {
    id: number;
    name: string;
  };
};

type Coordinates = {
  lat: number;
  lng: number;
};

function storeLocation(store: StoreSearchResult) {
  return [store.suburb, store.city, store.state].filter(Boolean).join(", ");
}

function distanceKm(from: Coordinates, store: StoreSearchResult) {
  if (typeof store.latitude !== "number" || typeof store.longitude !== "number") {
    return null;
  }

  const earthRadiusKm = 6371;
  const latDistance = ((store.latitude - from.lat) * Math.PI) / 180;
  const lngDistance = ((store.longitude - from.lng) * Math.PI) / 180;
  const fromLat = (from.lat * Math.PI) / 180;
  const toLat = (store.latitude * Math.PI) / 180;
  const haversine =
    Math.sin(latDistance / 2) * Math.sin(latDistance / 2) +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lngDistance / 2) * Math.sin(lngDistance / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export default function HeaderQuickSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [stores, setStores] = useState<StoreSearchResult[]>([]);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState("");

  const visibleStores = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return [];
    }

    const words = normalizedQuery.split(/\s+/).filter(Boolean);

    const matches = stores
      .filter((store) => {
        const haystack = [store.name, store.suburb, store.city || "", store.state || "", store.address || ""]
          .join(" ")
          .toLowerCase();

        return words.every((word) => haystack.includes(word));
      })
      .sort((a, b) => {
        if (!coordinates) return a.name.localeCompare(b.name);
        const aDistance = distanceKm(coordinates, a);
        const bDistance = distanceKm(coordinates, b);
        if (aDistance === null && bDistance === null) return a.name.localeCompare(b.name);
        if (aDistance === null) return 1;
        if (bDistance === null) return -1;
        return aDistance - bDistance;
      })
      .slice(0, 8);

    return matches;
  }, [coordinates, query, stores]);

  const openSearch = async () => {
    setIsOpen(true);
    setMessage("");

    if (stores.length > 0 || loading) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/stores?country=Australia");
      if (response.ok) {
        const data = await response.json();
        setStores(Array.isArray(data) ? data : []);
      } else {
        setMessage("Unable to load stores right now.");
      }
    } catch (_error) {
      setMessage("Network error loading stores.");
    } finally {
      setLoading(false);
    }
  };

  const closeSearch = () => {
    setIsOpen(false);
    setQuery("");
    setMessage("");
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage("Location is not available in this browser.");
      return;
    }

    setLocating(true);
    setMessage("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocating(false);
      },
      () => {
        setMessage("Location access was not enabled.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (visibleStores[0]) {
      window.open(visibleStores[0].url, "_blank", "noopener,noreferrer");
      return;
    }

    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      window.location.href = `/?quickSearch=${encodeURIComponent(trimmedQuery)}`;
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={openSearch}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100 transition hover:scale-105 hover:bg-emerald-100 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:h-10 sm:w-10"
        aria-label="Quick search stores"
      >
        <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[85] bg-black/35 px-3 py-5 sm:flex sm:items-start sm:justify-center sm:pt-24"
          onClick={closeSearch}
        >
          <div
            className="mx-auto w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Quick Search</h2>
                <p className="mt-1 text-xs text-gray-500">Search store names or suburbs. Use location to sort nearby matches first.</p>
              </div>
              <button
                type="button"
                onClick={closeSearch}
                className="rounded-full px-2 py-1 text-sm text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close quick search"
              >
                x
              </button>
            </div>

            <form onSubmit={submitSearch} className="p-4">
              <label className="block text-sm font-medium text-gray-700">
                Store or suburb
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  autoFocus
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="e.g. JB Hi-Fi Chatswood"
                />
              </label>

              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={locating}
                className="mt-3 inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
              >
                {locating ? "Checking location..." : coordinates ? "Location sorting enabled" : "Use my location"}
              </button>

              {message && <p className="mt-3 text-sm text-red-600">{message}</p>}
              {loading && <p className="mt-3 text-sm text-gray-500">Loading stores...</p>}

              {visibleStores.length > 0 && (
                <div className="mt-4 max-h-72 divide-y divide-gray-100 overflow-y-auto rounded-md border border-gray-200">
                  {visibleStores.map((store) => (
                    <a
                      key={store.id}
                      href={store.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-3 py-3 hover:bg-emerald-50"
                    >
                      <span className="block text-sm font-semibold text-gray-900">{store.name}</span>
                      <span className="mt-1 block text-xs text-gray-500">
                        {[store.category?.name, storeLocation(store)].filter(Boolean).join(" - ")}
                        {coordinates && distanceKm(coordinates, store) !== null
                          ? ` - ${distanceKm(coordinates, store)?.toFixed(1)} km`
                          : ""}
                      </span>
                    </a>
                  ))}
                </div>
              )}

              {query.trim() && !loading && visibleStores.length === 0 && (
                <p className="mt-4 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-500">
                  No matching store found. Try a different store name or suburb.
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
