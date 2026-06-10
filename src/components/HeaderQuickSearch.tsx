"use client";

import { FormEvent, useEffect, useId, useMemo, useState } from "react";

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

type HeaderQuickSearchProps = {
  ariaLabel?: string;
  globalOpenMode?: "desktop" | "mobile";
};

export default function HeaderQuickSearch({ ariaLabel = "Quick search stores", globalOpenMode }: HeaderQuickSearchProps) {
  const tooltipId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [stores, setStores] = useState<StoreSearchResult[]>([]);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!globalOpenMode) {
      return;
    }

    const handleOpen = (event: Event) => {
      const isMobile = window.matchMedia("(max-width: 639px)").matches;
      const shouldHandle =
        (globalOpenMode === "mobile" && isMobile) ||
        (globalOpenMode === "desktop" && !isMobile);

      if (!shouldHandle) {
        return;
      }

      const detail = (event as CustomEvent<{ query?: string }>).detail;
      setQuery(detail?.query || "");
      void openSearch();
    };

    window.addEventListener("discountnotifier:open-quick-search", handleOpen);

    return () => {
      window.removeEventListener("discountnotifier:open-quick-search", handleOpen);
    };
  }, [globalOpenMode, openSearch]);

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

  async function openSearch() {
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
  }

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
    <div className="group relative">
      <button
        type="button"
        onClick={openSearch}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/45 bg-white/35 text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_8px_20px_rgba(16,185,129,0.16)] ring-1 ring-emerald-200/40 backdrop-blur-xl transition hover:scale-105 hover:bg-white/55 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:h-10 sm:w-10"
        aria-label={ariaLabel}
        aria-describedby={tooltipId}
      >
        <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
        </svg>
      </button>
      <span
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none fixed bottom-20 left-1/2 z-[90] flex w-[min(16rem,calc(100vw-2rem))] -translate-x-1/2 items-start gap-2 rounded-[22px] rounded-br-md border border-emerald-200 bg-emerald-100 px-3 py-2 text-left text-[11px] font-medium leading-snug text-gray-900 opacity-0 shadow-lg transition-opacity duration-150 before:absolute before:-bottom-1.5 before:left-1/2 before:h-4 before:w-4 before:-translate-x-1/2 before:rotate-45 before:border-b before:border-r before:border-emerald-200 before:bg-emerald-100 group-hover:opacity-100 group-focus-within:opacity-100 group-active:opacity-100 sm:absolute sm:bottom-auto sm:left-auto sm:right-0 sm:top-12 sm:w-56 sm:translate-x-0 sm:before:-top-1.5 sm:before:bottom-auto sm:before:left-auto sm:before:right-3 sm:before:translate-x-0 sm:before:border-b-0 sm:before:border-r-0 sm:before:border-l sm:before:border-t"
      >
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-300 text-[11px] leading-none text-emerald-950">
          💬
        </span>
        <span>Search for a store or suburb.</span>
      </span>

      {isOpen && (
        <div
          className="fixed inset-0 z-[85] flex items-start justify-center overflow-y-auto bg-black/35 px-3 py-4 sm:pt-24"
          onClick={closeSearch}
        >
          <div
            className="mx-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="shrink-0 flex items-start justify-between gap-4 border-b border-gray-200 p-4">
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

            <form onSubmit={submitSearch} className="min-h-0 flex-1 overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <label className="block text-sm font-medium text-gray-700">
                Store or suburb
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  autoFocus
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-base shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:text-sm"
                  placeholder="e.g. JB Hi-Fi Chatswood"
                />
              </label>

              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={locating}
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 sm:w-auto sm:text-xs"
              >
                {locating ? "Checking location..." : coordinates ? "Location sorting enabled" : "Use my location"}
              </button>

              {message && <p className="mt-3 text-sm text-red-600">{message}</p>}
              {loading && <p className="mt-3 text-sm text-gray-500">Loading stores...</p>}

              {visibleStores.length > 0 && (
                <div className="mt-4 max-h-[42dvh] divide-y divide-gray-100 overflow-y-auto rounded-md border border-gray-200 sm:max-h-72">
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
