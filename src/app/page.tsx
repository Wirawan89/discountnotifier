'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import CategorySidebar from '@/components/discounts/CategorySidebar';
import DoodleBackground from '@/components/discounts/DoodleBackground';
import EmptyStoreState from '@/components/discounts/EmptyStoreState';
import FilterBar from '@/components/discounts/FilterBar';
import HotDealsTicker from '@/components/discounts/HotDealsTicker';
import ShareModal from '@/components/discounts/ShareModal';
import StoreGrid from '@/components/discounts/StoreGrid';
import WelcomeShowcase from '@/components/discounts/WelcomeShowcase';
import type { Category, Discount, ShareData, Store } from '@/components/discounts/types';

const DEFAULT_COUNTRY = "Australia";
const BASE_COUNTRIES = [DEFAULT_COUNTRY, "New Zealand", "United States"];
const DEFAULT_LOCATION_SUBURB = "Sydney";
const CATEGORY_NEAR_ME_MAX_KM = 12;
const WALKING_DISTANCE_ESTIMATE_MULTIPLIER = 1.35;
const DISTANCE_RANGES = [
  { id: "0-2", label: "0 - 2 KM", min: 0, max: 2 },
  { id: "2-6", label: "2 - 6 KM", min: 2, max: 6 },
  { id: "6-plus", label: "> 6 KM", min: 6, max: Number.POSITIVE_INFINITY },
] as const;
const UNRANKED_DISTANCE_RANGE = {
  id: "unranked",
  label: "Not distance-ranked",
} as const;

type Coordinates = {
  lat: number;
  lng: number;
};

type DistanceRangeId = (typeof DISTANCE_RANGES)[number]["id"] | typeof UNRANKED_DISTANCE_RANGE.id | "";
type LocationRequestOptions = {
  requireSuburb?: boolean;
};

const LOCATION_COORDINATES: Record<string, Coordinates> = {
  acton: { lat: -35.2777, lng: 149.1189 },
  adelaide: { lat: -34.9285, lng: 138.6007 },
  alexandria: { lat: -33.9022, lng: 151.2004 },
  artarmon: { lat: -33.8088, lng: 151.1852 },
  ashfield: { lat: -33.8883, lng: 151.1227 },
  bankstown: { lat: -33.9173, lng: 151.0359 },
  beaconsfield: { lat: -33.9129, lng: 151.2004 },
  belconnen: { lat: -35.2384, lng: 149.0652 },
  "bondi beach": { lat: -33.8915, lng: 151.2767 },
  braddon: { lat: -35.2706, lng: 149.1351 },
  brisbane: { lat: -27.4698, lng: 153.0251 },
  "brisbane city": { lat: -27.4698, lng: 153.0251 },
  broadbeach: { lat: -28.0293, lng: 153.4317 },
  "brunswick east": { lat: -37.7728, lng: 144.9731 },
  burleigh: { lat: -28.089, lng: 153.45 },
  "burleigh heads": { lat: -28.089, lng: 153.45 },
  burwood: { lat: -33.877, lng: 151.103 },
  cabramatta: { lat: -33.8949, lng: 150.9344 },
  "canberra city": { lat: -35.2809, lng: 149.13 },
  "canley vale": { lat: -33.8869, lng: 150.9439 },
  carlton: { lat: -37.8001, lng: 144.9671 },
  chatswood: { lat: -33.7969, lng: 151.1833 },
  chippendale: { lat: -33.8867, lng: 151.2 },
  "chirn park": { lat: -27.9555, lng: 153.4028 },
  collingwood: { lat: -37.8021, lng: 144.9883 },
  cottesloe: { lat: -31.9959, lng: 115.7597 },
  darlinghurst: { lat: -33.879, lng: 151.22 },
  darwin: { lat: -12.4634, lng: 130.8456 },
  "darwin city": { lat: -12.4634, lng: 130.8456 },
  deakin: { lat: -35.318, lng: 149.107 },
  dickson: { lat: -35.25, lng: 149.139 },
  fairfield: { lat: -33.8674, lng: 150.9568 },
  fitzroy: { lat: -37.7984, lng: 144.9783 },
  footscray: { lat: -37.7998, lng: 144.8996 },
  "fortitude valley": { lat: -27.4571, lng: 153.0343 },
  fremantle: { lat: -32.0569, lng: 115.7439 },
  haymarket: { lat: -33.8792, lng: 151.2048 },
  highgate: { lat: -31.9398, lng: 115.8717 },
  hobart: { lat: -42.8821, lng: 147.3272 },
  hurstville: { lat: -33.9678, lng: 151.1055 },
  liverpool: { lat: -33.9209, lng: 150.9238 },
  marrickville: { lat: -33.9106, lng: 151.1559 },
  mascot: { lat: -33.925, lng: 151.193 },
  melbourne: { lat: -37.8136, lng: 144.9631 },
  newtown: { lat: -33.8974, lng: 151.178 },
  "north sydney": { lat: -33.839, lng: 151.207 },
  northbridge: { lat: -31.946, lng: 115.8589 },
  parramatta: { lat: -33.815, lng: 151.0011 },
  perth: { lat: -31.9523, lng: 115.8613 },
  pyrmont: { lat: -33.869, lng: 151.194 },
  redfern: { lat: -33.8928, lng: 151.2042 },
  rosebery: { lat: -33.9197, lng: 151.2035 },
  salamanca: { lat: -42.8864, lng: 147.3318 },
  strathfield: { lat: -33.8713, lng: 151.0947 },
  surry: { lat: -33.8845, lng: 151.2125 },
  "surry hills": { lat: -33.8845, lng: 151.2125 },
  sydney: { lat: -33.8688, lng: 151.2093 },
  waterloo: { lat: -33.8999, lng: 151.207 },
  ultimo: { lat: -33.8816, lng: 151.1984 },
  unley: { lat: -34.95, lng: 138.607 },
  "west end": { lat: -27.4813, lng: 153.0097 },
  "west leederville": { lat: -31.9413, lng: 115.8315 },
  "west perth": { lat: -31.9488, lng: 115.8414 },
  woolloongabba: { lat: -27.4869, lng: 153.036 },
  zetland: { lat: -33.9075, lng: 151.2086 },
};

function normalizeCountry(country?: string | null) {
  if (!country || country.trim().length === 0) {
    return DEFAULT_COUNTRY;
  }

  const normalized = country.trim();

  if (/^(usa|us|united states of america)$/i.test(normalized)) {
    return "United States";
  }

  if (/^(nz)$/i.test(normalized)) {
    return "New Zealand";
  }

  return normalized;
}

function normalizeLocation(value?: string | null) {
  return value?.trim().toLowerCase() || "";
}

function getLocationCoordinates(value?: string | null) {
  return LOCATION_COORDINATES[normalizeLocation(value)];
}

function isGenericCityLocation(store: Store) {
  const suburb = normalizeLocation(store.suburb);
  const city = normalizeLocation(store.city);

  return Boolean(suburb && city && suburb === city);
}

function getStoreLocationQuality(store: Store) {
  if (typeof store.latitude === "number" && typeof store.longitude === "number") {
    return store.locationSource || "exact";
  }

  if (store.locationSource === "online" || store.locationSource === "city" || store.locationSource === "unknown") {
    return store.locationSource;
  }

  if (isGenericCityLocation(store)) {
    return "city";
  }

  if (getLocationCoordinates(store.suburb)) {
    return "suburb";
  }

  return "unknown";
}

function getStoreCoordinates(store: Store) {
  if (typeof store.latitude === "number" && typeof store.longitude === "number") {
    return {
      lat: store.latitude,
      lng: store.longitude,
    };
  }

  if (getStoreLocationQuality(store) !== "suburb") {
    return undefined;
  }

  return getLocationCoordinates(store.suburb);
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

function getStoreDestination(store: Store) {
  return [store.address, store.name, store.suburb, store.city, store.country || DEFAULT_COUNTRY]
    .filter((part): part is string => Boolean(part && part.trim().length > 0))
    .join(", ");
}

function getWalkingMapUrl(origin: string, storesToMap: Store[]) {
  const destinations = storesToMap.map(getStoreDestination).filter(Boolean);
  const [destination, ...waypoints] = destinations;
  const params = new URLSearchParams({
    api: "1",
    travelmode: "walking",
    origin,
    destination: destination || origin,
  });

  if (waypoints.length > 0) {
    params.set("waypoints", waypoints.join("|"));
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export default function Home() {
  const initialQuickJumpAppliedRef = useRef(false);
  const userCoordinatesRef = useRef<Coordinates | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loadingDiscounts, setLoadingDiscounts] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  const [selectedSuburb, setSelectedSuburb] = useState("");
  const [showAllStores, setShowAllStores] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [userLocation, setUserLocation] = useState("");
  const [userCoordinates, setUserCoordinates] = useState<Coordinates | null>(null);
  const [locationCoordinateCache, setLocationCoordinateCache] = useState<Record<string, Coordinates>>({});
  const [selectedDistanceRange, setSelectedDistanceRange] = useState<DistanceRangeId>("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showNearMe, setShowNearMe] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [smartFetchLoading, setSmartFetchLoading] = useState(false);
  const [smartFetchResult, setSmartFetchResult] = useState<string | null>(null);
  const [storeDiscoveryLoading, setStoreDiscoveryLoading] = useState(false);
  const [storeDiscoveryMessage, setStoreDiscoveryMessage] = useState("");
  const [storeDiscoveryLink, setStoreDiscoveryLink] = useState<{ href: string; categoryName: string } | null>(null);
  const [userStoreDiscoveryEnabled, setUserStoreDiscoveryEnabled] = useState(true);
  const [isSaleNearbyMode, setIsSaleNearbyMode] = useState(false);
  const [saleNearbyLoading, setSaleNearbyLoading] = useState(false);
  const [saleNearbyLocation, setSaleNearbyLocation] = useState("");
  const [saleNearbySuburbs, setSaleNearbySuburbs] = useState<string[]>([]);
  const [saleNearbyResult, setSaleNearbyResult] = useState<string | null>(null);
  const [isOffersNearbyMode, setIsOffersNearbyMode] = useState(false);
  const [offersNearbyLoading, setOffersNearbyLoading] = useState(false);
  const [offersNearbyLocation, setOffersNearbyLocation] = useState("");
  const [offersNearbySuburbs, setOffersNearbySuburbs] = useState<string[]>([]);
  const [offersNearbyResult, setOffersNearbyResult] = useState<string | null>(null);

  const updateUserCoordinates = (coordinates: Coordinates | null) => {
    userCoordinatesRef.current = coordinates;
    setUserCoordinates(coordinates);
  };

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
        setLoadingCategories(false);
      });

    const savedFavorites = localStorage.getItem('discountNotifierFavorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }

    fetch("/api/features")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data && typeof data.userStoreDiscoveryEnabled === "boolean") {
          setUserStoreDiscoveryEnabled(data.userStoreDiscoveryEnabled);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem('discountNotifierFavorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    if (initialQuickJumpAppliedRef.current) {
      return;
    }

    if (categories.length === 0) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const categoryId = Number(params.get("categoryId"));
    const quickSearch = params.get("quickSearch") || "";
    const category = categories.find((item) => item.id === categoryId);

    if (category) {
      setSelectedCategory(category);
      setSearchTerm(quickSearch);
      setSelectedSuburb("");
      setShowNearMe(false);
      setShowFavoritesOnly(false);
      setShowAllStores(false);
      setSelectedDistanceRange("");
      setStoreDiscoveryMessage("");
      setStoreDiscoveryLink(null);
      refreshCategoryData(category);
    } else if (quickSearch) {
      setSearchTerm(quickSearch);
    }

    initialQuickJumpAppliedRef.current = true;
  }, [categories]);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  );

  const suburbOptions = useMemo(
    () =>
      Array.from(
        new Set(
          stores
            .filter((store) => normalizeCountry(store.country) === selectedCountry)
            .map((store) => store.suburb)
        )
      ).sort(),
    [selectedCountry, stores]
  );
  const searchableLocationOptions = useMemo(
    () =>
      Array.from(
        new Set(
          stores
            .filter((store) => normalizeCountry(store.country) === selectedCountry)
            .flatMap((store) => [store.suburb, store.city])
            .filter((location): location is string => Boolean(location && location.trim().length > 0))
        )
      ).sort((a, b) => a.localeCompare(b)),
    [selectedCountry, stores]
  );
  const searchedLocationScope = useMemo(() => {
    const normalizedSearch = normalizeLocation(searchTerm);

    if (!normalizedSearch) {
      return [];
    }

    return searchableLocationOptions.filter((location) => normalizeLocation(location) === normalizedSearch);
  }, [searchTerm, searchableLocationOptions]);

  const countryOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...BASE_COUNTRIES,
          ...stores.map((store) => normalizeCountry(store.country)),
        ])
      ).sort((a, b) => {
        if (a === DEFAULT_COUNTRY) return -1;
        if (b === DEFAULT_COUNTRY) return 1;
        return a.localeCompare(b);
      }),
    [stores]
  );

  const getCoordinatesForLocationInput = (location: string) => {
    const normalizedLocation = normalizeLocation(location);
    const staticCoordinates = getLocationCoordinates(location);

    if (staticCoordinates) {
      return staticCoordinates;
    }

    const cachedCoordinates = locationCoordinateCache[`${selectedCountry}:${normalizedLocation}`];

    if (cachedCoordinates) {
      return cachedCoordinates;
    }

    const matchingStores = stores.filter(
      (store) =>
        normalizeCountry(store.country) === selectedCountry &&
        (normalizeLocation(store.suburb) === normalizedLocation || normalizeLocation(store.city) === normalizedLocation) &&
        typeof store.latitude === "number" &&
        typeof store.longitude === "number"
    );

    if (matchingStores.length === 0) {
      return undefined;
    }

    return {
      lat: matchingStores.reduce((sum, store) => sum + Number(store.latitude), 0) / matchingStores.length,
      lng: matchingStores.reduce((sum, store) => sum + Number(store.longitude), 0) / matchingStores.length,
    };
  };

  const resolveLocationCoordinates = async (location: string) => {
    const localCoordinates = getCoordinatesForLocationInput(location);

    if (localCoordinates) {
      return localCoordinates;
    }

    try {
      const response = await fetch(
        `/api/locations/coordinates?location=${encodeURIComponent(location)}&country=${encodeURIComponent(selectedCountry)}`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (typeof data.lat !== "number" || typeof data.lng !== "number") {
        return null;
      }

      const coordinates = {
        lat: data.lat,
        lng: data.lng,
      };
      const cacheKey = `${selectedCountry}:${normalizeLocation(location)}`;
      setLocationCoordinateCache((previousCache) => ({
        ...previousCache,
        [cacheKey]: coordinates,
      }));

      return coordinates;
    } catch (_error) {
      return null;
    }
  };

  const nearbyOriginCoordinates = useMemo(
    () => userCoordinates || getCoordinatesForLocationInput(userLocation),
    [locationCoordinateCache, selectedCountry, stores, userCoordinates, userLocation]
  );

  const getStoreDistanceKm = (store: Store) => {
    const storeCoordinates = getStoreCoordinates(store);

    if (!nearbyOriginCoordinates || !storeCoordinates) {
      return null;
    }

    return estimateWalkingDistanceKm(distanceKm(nearbyOriginCoordinates, storeCoordinates));
  };

  const filteredStores = useMemo(() => {
    let filtered = stores.filter((store) => normalizeCountry(store.country) === selectedCountry);

    if (selectedSuburb) {
      filtered = filtered.filter((store) => store.suburb === selectedSuburb);
    }

    if (searchTerm) {
      const normalizedSearch = searchTerm.toLowerCase();
      const searchWords = normalizedSearch.split(/\s+/).filter(Boolean);
      filtered = filtered.filter((store) => {
        const storeDiscounts = discounts.filter((discount) => discount.storeId === store.id);
        const highSignalText = [
          store.name,
          store.url,
          store.websiteUrl || "",
          store.address || "",
          ...storeDiscounts.flatMap((discount) => [
            discount.title,
            discount.description || "",
            discount.coupon || "",
          ]),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const searchableText = [
          highSignalText,
          store.suburb,
          store.city,
          selectedCategory?.name,
          normalizeCountry(store.country),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const exactLocationMatch =
          normalizeLocation(store.suburb) === normalizedSearch ||
          normalizeLocation(store.city) === normalizedSearch;
        const searchTarget = normalizedSearch.length <= 2 && !exactLocationMatch ? highSignalText : searchableText;

        return searchWords.length > 1
          ? searchWords.every((word) => searchTarget.includes(word))
          : searchTarget.includes(normalizedSearch);
      });
    }

    if (showNearMe) {
      if (nearbyOriginCoordinates) {
        filtered = filtered.filter((store) => {
          const storeDistance = getStoreDistanceKm(store);

          return storeDistance !== null && storeDistance <= CATEGORY_NEAR_ME_MAX_KM;
        });
      } else if (userLocation) {
        const normalizedLocation = normalizeLocation(userLocation);
        filtered = filtered.filter(
          (store) =>
            normalizeLocation(store.suburb) === normalizedLocation ||
            normalizeLocation(store.city) === normalizedLocation
        );
      } else {
        filtered = [];
      }
    }

    if (showFavoritesOnly) {
      filtered = filtered.filter((store) => favorites.includes(store.id));
    }

    if ((isSaleNearbyMode || isOffersNearbyMode) && selectedDistanceRange) {
      if (selectedDistanceRange === UNRANKED_DISTANCE_RANGE.id) {
        filtered = filtered.filter((store) => getStoreDistanceKm(store) === null);
      } else {
        const selectedRange = DISTANCE_RANGES.find((range) => range.id === selectedDistanceRange);

        if (selectedRange) {
          filtered = filtered.filter((store) => {
            const storeDistance = getStoreDistanceKm(store);

            if (storeDistance === null) {
              return false;
            }

            return storeDistance >= selectedRange.min && storeDistance < selectedRange.max;
          });
        }
      }
    }

    filtered.sort((a, b) => {
      if (showNearMe && nearbyOriginCoordinates) {
        return (getStoreDistanceKm(a) ?? Number.POSITIVE_INFINITY) - (getStoreDistanceKm(b) ?? Number.POSITIVE_INFINITY);
      }

      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "suburb":
          return a.suburb.localeCompare(b.suburb);
        case "discounts":
          return (
            discounts.filter((discount) => discount.storeId === b.id).length -
            discounts.filter((discount) => discount.storeId === a.id).length
          );
        case "favorites":
          return Number(favorites.includes(b.id)) - Number(favorites.includes(a.id));
        default:
          return 0;
      }
    });

    return filtered;
  }, [discounts, favorites, isOffersNearbyMode, isSaleNearbyMode, nearbyOriginCoordinates, searchTerm, selectedCategory?.name, selectedCountry, selectedDistanceRange, selectedSuburb, showFavoritesOnly, showNearMe, sortBy, stores, userLocation]);

  const shouldShowAllFilteredStores =
    showAllStores ||
    Boolean(searchTerm.trim()) ||
    Boolean(selectedSuburb) ||
    showNearMe ||
    isSaleNearbyMode ||
    isOffersNearbyMode;
  const storesToShow = shouldShowAllFilteredStores ? filteredStores : filteredStores.slice(0, 8);
  const nearbyDistanceSummary = useMemo(() => {
    if (!isSaleNearbyMode && !isOffersNearbyMode) {
      return DISTANCE_RANGES.map((range) => ({ ...range, count: 0 }));
    }

    return DISTANCE_RANGES.map((range) => ({
      ...range,
      count: stores.filter((store) => {
        if (normalizeCountry(store.country) !== selectedCountry) {
          return false;
        }

        const storeDistance = getStoreDistanceKm(store);

        if (storeDistance === null) {
          return false;
        }

        return storeDistance >= range.min && storeDistance < range.max;
      }).length,
    }));
  }, [isOffersNearbyMode, isSaleNearbyMode, nearbyOriginCoordinates, selectedCountry, stores]);
  const nearbyStoresWithKnownDistance = nearbyDistanceSummary.reduce((sum, range) => sum + range.count, 0);
  const unrankedNearbyStoresCount = stores.filter(
    (store) => normalizeCountry(store.country) === selectedCountry && getStoreDistanceKm(store) === null
  ).length;
  const nearbyMapStores = filteredStores.filter((store) => getStoreDistanceKm(store) !== null).slice(0, 20);
  const nearbyMapOrigin = nearbyOriginCoordinates
    ? `${nearbyOriginCoordinates.lat},${nearbyOriginCoordinates.lng}`
    : userLocation || saleNearbyLocation || offersNearbyLocation || DEFAULT_LOCATION_SUBURB;
  const nearbyMapUrl = getWalkingMapUrl(nearbyMapOrigin, nearbyMapStores);

  const resetCategoryViewState = () => {
    setSelectedSuburb("");
    setShowAllStores(false);
    setSearchTerm("");
    setShowNearMe(false);
    setShowFavoritesOnly(false);
    setSelectedDistanceRange("");
    setIsSaleNearbyMode(false);
    setSaleNearbyLocation("");
    setSaleNearbySuburbs([]);
    setSaleNearbyResult(null);
    setIsOffersNearbyMode(false);
    setOffersNearbyLocation("");
    setOffersNearbySuburbs([]);
    setOffersNearbyResult(null);
  };

  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    setSelectedSuburb("");
    setShowAllStores(false);
    setShowNearMe(false);
    setSelectedDistanceRange("");
    setIsSaleNearbyMode(false);
    setSaleNearbyLocation("");
    setSaleNearbySuburbs([]);
    setSaleNearbyResult(null);
    setIsOffersNearbyMode(false);
    setOffersNearbyLocation("");
    setOffersNearbySuburbs([]);
    setOffersNearbyResult(null);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setStoreDiscoveryMessage("");
    setStoreDiscoveryLink(null);

    if (value.trim()) {
      setSelectedSuburb("");
      setShowNearMe(false);
      setShowFavoritesOnly(false);
      setShowAllStores(false);
      setSelectedDistanceRange("");
    }
  };

  const handleRequestStoreDiscovery = async () => {
    const storeName = searchTerm.trim();
    const categoryName = selectedCategory?.name;

    if (!storeName || !categoryName) {
      return;
    }

    setStoreDiscoveryLoading(true);
    setStoreDiscoveryMessage("");
    setStoreDiscoveryLink(null);

    if (!userStoreDiscoveryEnabled) {
      setStoreDiscoveryMessage("Automatic store discovery is currently disabled.");
      return;
    }

    try {
      const response = await fetch("/api/stores/discovery-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoryName,
          storeName,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setStoreDiscoveryMessage(data.error || "Could not start store search.");
        return;
      }

      if (data.foundExisting && data.href && data.categoryName) {
        setStoreDiscoveryMessage(
          `${data.storeName || storeName} is already listed in ${data.categoryName}.`
        );
        setStoreDiscoveryLink({
          href: data.href,
          categoryName: data.categoryName,
        });
        return;
      }

      setSmartFetchResult(
        data.message ||
          `Your request will be processed in background, approximately 1-2 minutes. Please re-enter "${storeName}" in Search after that.`
      );
      setSearchTerm("");
      setSelectedSuburb("");
      setShowNearMe(false);
      setShowFavoritesOnly(false);
      setShowAllStores(false);
      setSelectedDistanceRange("");
      setStoreDiscoveryMessage("");
      setStoreDiscoveryLink(null);
    } catch (error) {
      setStoreDiscoveryMessage("Could not start store search. Please try again.");
    } finally {
      setStoreDiscoveryLoading(false);
    }
  };

  const handleCancelStoreDiscovery = () => {
    setSearchTerm("");
    setSelectedSuburb("");
    setShowNearMe(false);
    setShowFavoritesOnly(false);
    setShowAllStores(false);
    setSelectedDistanceRange("");
    setStoreDiscoveryMessage("");
    setStoreDiscoveryLink(null);
  };

  const handleSearchOtherCategories = () => {
    const query = searchTerm.trim();

    setSelectedCategory(null);
    setSearchTerm("");
    setSelectedSuburb("");
    setShowNearMe(false);
    setShowFavoritesOnly(false);
    setShowAllStores(false);
    setSelectedDistanceRange("");
    setStoreDiscoveryMessage("");
    setStoreDiscoveryLink(null);

    window.dispatchEvent(
      new CustomEvent("discountnotifier:open-quick-search", {
        detail: {
          query,
        },
      })
    );
  };

  const refreshCategoryData = (category: Category) => {
    setLoadingStores(true);
    setLoadingDiscounts(true);

    setTimeout(() => {
      fetch(`/api/stores?categoryId=${category.id}&country=${encodeURIComponent(selectedCountry)}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setStores(data);
            setDiscounts(data.flatMap((store: Store) => store.discounts || []));
          } else {
            setStores([]);
            setDiscounts([]);
            console.error('Failed to fetch stores:', data.error || data, data.details || '');
          }
        })
        .catch((error) => {
          setStores([]);
          setDiscounts([]);
          console.error('Failed to fetch stores:', error);
        })
        .finally(() => {
          setLoadingStores(false);
          setLoadingDiscounts(false);
        });
    }, 500);
  };

  const handleCategoryClick = (category: Category) => {
    if (window.location.search) {
      window.history.replaceState(null, "", window.location.pathname);
    }

    setSelectedCategory(category);
    resetCategoryViewState();
    fetch('/api/analytics/access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'view_category', categoryId: category.id }),
      keepalive: true,
    }).catch(() => {});
    refreshCategoryData(category);
  };

  const handleNearMe = async () => {
    const location = await getUserLocation();

    if (!location) {
      return;
    }

    setSelectedSuburb("");
    setShowNearMe(true);
    setShowAllStores(false);
    setSelectedDistanceRange("");
    setSmartFetchResult(
      location === "Current location"
        ? `Showing stores within ${CATEGORY_NEAR_ME_MAX_KM} km estimated walking distance of your current location.`
        : `Showing stores within ${CATEGORY_NEAR_ME_MAX_KM} km estimated walking distance of your entered suburb.`
    );
  };

  const getUserLocation = async (options: LocationRequestOptions = {}): Promise<string | null> => {
    setIsLoadingLocation(true);
    const { requireSuburb = false } = options;

    const askForSuburb = async () => {
      const suburb = window.prompt(
        requireSuburb
          ? "Enter your suburb so nearby search can match stores in your exact area and 1-2 nearby suburbs."
          : "Browser location is unavailable. Enter your suburb to show nearby stores.",
        userLocation || DEFAULT_LOCATION_SUBURB
      )?.trim();

      if (suburb) {
        setUserLocation(suburb);
        updateUserCoordinates(await resolveLocationCoordinates(suburb));
        return suburb;
      }

      return null;
    };

    if (!navigator.geolocation) {
      const suburb = await askForSuburb();
      setIsLoadingLocation(false);
      return suburb;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          updateUserCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          if (!requireSuburb) {
            setUserLocation("Current location");
            setIsLoadingLocation(false);
            resolve("Current location");
            return;
          }

          const suburb = await askForSuburb();
          setIsLoadingLocation(false);
          resolve(suburb);
        },
        async (error) => {
          console.log("Location access denied:", error);
          const suburb = await askForSuburb();
          setIsLoadingLocation(false);
          resolve(suburb);
        }
      );
    });
  };

  const handleSaleNearby = async () => {
    let location = userLocation;

    if (!location) {
      const shouldEnableLocation = window.confirm(
        "SaleNearby needs location based filtering. Turn on location based search now?"
      );

      if (!shouldEnableLocation) {
        return;
      }

      location = await getUserLocation() || "";
    }

    if (!location) {
      setSaleNearbyResult("SaleNearby needs a suburb before it can search nearby offers.");
      return;
    }

    setSelectedCategory(null);
    setIsSaleNearbyMode(true);
    setIsOffersNearbyMode(false);
    setSaleNearbyLoading(true);
    setLoadingStores(true);
    setLoadingDiscounts(true);
    setSaleNearbyLocation(location);
    setSaleNearbyResult("Loading SaleNearby offers...");
    setSelectedSuburb("");
    setSearchTerm("");
    setShowAllStores(false);
    setShowNearMe(false);
    setShowFavoritesOnly(false);
    setSelectedDistanceRange("");

    try {
      const params = new URLSearchParams({
        location,
        country: selectedCountry,
      });
      const coordinates = userCoordinatesRef.current || userCoordinates;

      if (coordinates) {
        params.set("lat", String(coordinates.lat));
        params.set("lng", String(coordinates.lng));
      }

      const response = await fetch(`/api/stores/sale-nearby?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        setStores([]);
        setDiscounts([]);
        setSaleNearbySuburbs([]);
        setSaleNearbyResult(data.error || "Failed to fetch SaleNearby stores");
        return;
      }

      const nearbyStores = Array.isArray(data.stores) ? data.stores : [];
      setStores(nearbyStores);
      setDiscounts(nearbyStores.flatMap((store: Store & { discounts?: Discount[] }) => store.discounts || []));
      setSaleNearbySuburbs(Array.isArray(data.suburbs) ? data.suburbs : []);
      setSaleNearbyResult(data.message || `Loaded ${nearbyStores.length} SaleNearby stores`);
    } catch (_error) {
      setStores([]);
      setDiscounts([]);
      setSaleNearbySuburbs([]);
      setSaleNearbyResult("Network error loading SaleNearby stores");
    } finally {
      setSaleNearbyLoading(false);
      setLoadingStores(false);
      setLoadingDiscounts(false);
    }
  };

  const handleOffersNearby = async () => {
    let location = userLocation;

    if (!location) {
      const shouldEnableLocation = window.confirm(
        "OffersNearby needs location based filtering. Turn on location based search now?"
      );

      if (!shouldEnableLocation) {
        return;
      }

      location = await getUserLocation() || "";
    }

    if (!location) {
      setOffersNearbyResult("OffersNearby needs a suburb before it can search brunch, dining and beverage offers.");
      return;
    }

    setSelectedCategory(null);
    setIsSaleNearbyMode(false);
    setIsOffersNearbyMode(true);
    setOffersNearbyLoading(true);
    setLoadingStores(true);
    setLoadingDiscounts(true);
    setOffersNearbyLocation(location);
    setOffersNearbyResult("Loading OffersNearby dining offers...");
    setSelectedSuburb("");
    setSearchTerm("");
    setShowAllStores(false);
    setShowNearMe(false);
    setShowFavoritesOnly(false);
    setSelectedDistanceRange("");

    try {
      const params = new URLSearchParams({
        location,
        country: selectedCountry,
      });
      const coordinates = userCoordinatesRef.current || userCoordinates;

      if (coordinates) {
        params.set("lat", String(coordinates.lat));
        params.set("lng", String(coordinates.lng));
      }

      const response = await fetch(`/api/stores/offers-nearby?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        setStores([]);
        setDiscounts([]);
        setOffersNearbySuburbs([]);
        setOffersNearbyResult(data.error || "Failed to fetch OffersNearby stores");
        return;
      }

      const nearbyStores = Array.isArray(data.stores) ? data.stores : [];
      setStores(nearbyStores);
      setDiscounts(nearbyStores.flatMap((store: Store & { discounts?: Discount[] }) => store.discounts || []));
      setOffersNearbySuburbs(Array.isArray(data.suburbs) ? data.suburbs : []);
      setOffersNearbyResult(data.message || `Loaded ${nearbyStores.length} OffersNearby stores`);
    } catch (_error) {
      setStores([]);
      setDiscounts([]);
      setOffersNearbySuburbs([]);
      setOffersNearbyResult("Network error loading OffersNearby stores");
    } finally {
      setOffersNearbyLoading(false);
      setLoadingStores(false);
      setLoadingDiscounts(false);
    }
  };

  const toggleFavorite = (storeId: number) => {
    setFavorites((previousFavorites) =>
      previousFavorites.includes(storeId)
        ? previousFavorites.filter((id) => id !== storeId)
        : [...previousFavorites, storeId]
    );
  };

  const handleSmartFetch = async () => {
    if (!selectedCategory) return;

    setSmartFetchLoading(true);
    setSmartFetchResult(null);
    const scopedSuburbs = selectedSuburb
      ? [selectedSuburb]
      : showNearMe && userLocation
        ? [userLocation]
        : searchedLocationScope.length > 0
          ? searchedLocationScope
        : [];

    try {
      const response = await fetch('/api/discounts/smart-fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: selectedCategory.id,
          country: selectedCountry,
          providers: ['openrouter'],
          suburbs: scopedSuburbs,
        }),
      });
      const data = await response.json();

      if (response.ok) {
        const message = data.message || 'Success!';
        const stats = data.stats ? ` (${data.stats.totalStores} stores, ${data.stats.totalDiscounts} discounts)` : '';
        const scopeInfo = scopedSuburbs.length > 0 ? ` [${scopedSuburbs.join(", ")}]` : "";
        const cacheInfo = data.wasCached ? ' [CACHED]' : ' [FRESH]';
        setSmartFetchResult(message + stats + scopeInfo + cacheInfo);
        setTimeout(() => refreshCategoryData(selectedCategory), 1000);
      } else {
        const errorDetails = Array.isArray(data.details) ? data.details.join(' ') : data.details || '';
        const errorMsg = `${data.error || 'Error fetching discounts'} ${errorDetails}`.trim();
        setSmartFetchResult(
          errorMsg.includes('credit') || errorMsg.includes('quota') || errorMsg.includes('rate limit')
            ? 'API limits reached - showing existing discounts. Try again later or check your API credits.'
            : data.error || 'Error fetching discounts'
        );
      }
    } catch (_error) {
      setSmartFetchResult('Network error - please try again');
    } finally {
      setSmartFetchLoading(false);
    }
  };

  const handleShowExisting = async () => {
    if (!selectedCategory) return;

    setSmartFetchLoading(true);
    setSmartFetchResult('Loading existing discounts...');

    try {
      const response = await fetch(`/api/discounts/existing?categoryId=${selectedCategory.id}&country=${encodeURIComponent(selectedCountry)}`);
      const data = await response.json();

      if (response.ok) {
        setSmartFetchResult(data.message);
        setTimeout(() => refreshCategoryData(selectedCategory), 500);
      } else {
        setSmartFetchResult(data.error || 'Error loading existing discounts');
      }
    } catch (_error) {
      setSmartFetchResult('Network error loading existing discounts');
    } finally {
      setSmartFetchLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedSuburb("");
    setShowNearMe(false);
    setShowFavoritesOnly(false);
    setSelectedDistanceRange("");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-50">
      <DoodleBackground />
      <div className="relative z-10">
        <HotDealsTicker />

        <div className="flex min-h-[calc(100vh-120px)] flex-col lg:h-[calc(100vh-120px)] lg:flex-row">
        <CategorySidebar
          categories={sortedCategories}
          loading={loadingCategories}
          selectedCategory={selectedCategory}
          isSaleNearbyActive={isSaleNearbyMode}
          isSaleNearbyLoading={saleNearbyLoading}
          isOffersNearbyActive={isOffersNearbyMode}
          isOffersNearbyLoading={offersNearbyLoading}
          onSelectCategory={handleCategoryClick}
          onSaleNearby={handleSaleNearby}
          onOffersNearby={handleOffersNearby}
        />

        <main className="w-full flex-1 overflow-y-auto p-4 pb-28 sm:p-5 sm:pb-5 lg:w-2/3 lg:p-6">
          {selectedCategory || isSaleNearbyMode || isOffersNearbyMode ? (
            <div>
              <h2 className="mb-4 text-xl font-bold text-gray-800 sm:text-2xl">
                {isSaleNearbyMode ? "SaleNearby" : isOffersNearbyMode ? "OffersNearby" : selectedCategory?.name}
              </h2>
              {isSaleNearbyMode && (
                <p className="mb-4 text-sm text-gray-600">
                  Showing current offers near {saleNearbyLocation || "your location"}
                  {saleNearbySuburbs.length > 0 && ` (${saleNearbySuburbs.join(", ")})`}.
                </p>
              )}
              {isOffersNearbyMode && (
                <p className="mb-4 text-sm text-gray-600">
                  Showing brunch, dining, beverage and cultural bites offers near {offersNearbyLocation || "your location"}
                  {offersNearbySuburbs.length > 0 && ` (${offersNearbySuburbs.join(", ")})`}.
                </p>
              )}

              <FilterBar
                searchTerm={searchTerm}
                selectedCountry={selectedCountry}
                countryOptions={countryOptions}
                selectedSuburb={selectedSuburb}
                suburbOptions={suburbOptions}
                sortBy={sortBy}
                showFavoritesOnly={showFavoritesOnly}
                showNearMe={showNearMe}
                userLocation={userLocation}
                isLoadingLocation={isLoadingLocation}
                smartFetchLoading={smartFetchLoading}
                smartFetchResult={
                  isSaleNearbyMode
                    ? saleNearbyResult
                    : isOffersNearbyMode
                      ? offersNearbyResult
                      : smartFetchResult
                }
                showFetchActions={!isSaleNearbyMode && !isOffersNearbyMode}
                onSearchChange={handleSearchChange}
                onCountryChange={handleCountryChange}
                onSuburbChange={setSelectedSuburb}
                onSortChange={setSortBy}
                onToggleFavoritesOnly={() => setShowFavoritesOnly((value) => !value)}
                onGetUserLocation={handleNearMe}
                onToggleNearMe={() => setShowNearMe((value) => !value)}
                onSmartFetch={handleSmartFetch}
                onShowExisting={handleShowExisting}
              />

              {(isSaleNearbyMode || isOffersNearbyMode) && !loadingStores && stores.length > 0 && (
                <div className="mb-5 rounded-lg border border-red-100 bg-white p-3 shadow-sm sm:p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Distance grouping</p>
                      <p className="text-xs text-gray-500">
                        Estimated walking range from {userLocation || "your location"}. Generic city-only stores are not grouped until exact coordinates are added.
                        {nearbyStoresWithKnownDistance < stores.length &&
                          ` ${stores.length - nearbyStoresWithKnownDistance} store(s) need exact location data.`}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <button
                        type="button"
                        onClick={() => setSelectedDistanceRange("")}
                        className={`rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                          selectedDistanceRange === ""
                            ? "bg-gray-900 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        All ({stores.length})
                      </button>
                      {nearbyDistanceSummary.map((range) => (
                        <button
                          key={range.id}
                          type="button"
                          onClick={() => setSelectedDistanceRange(range.id)}
                          className={`rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                            selectedDistanceRange === range.id
                              ? "bg-red-600 text-white"
                              : "bg-red-50 text-red-700 hover:bg-red-100"
                          }`}
                        >
                          {range.label} ({range.count})
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setSelectedDistanceRange(UNRANKED_DISTANCE_RANGE.id)}
                        className={`rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                          selectedDistanceRange === UNRANKED_DISTANCE_RANGE.id
                            ? "bg-amber-600 text-white"
                            : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                        }`}
                      >
                        {UNRANKED_DISTANCE_RANGE.label} ({unrankedNearbyStoresCount})
                      </button>
                      {nearbyMapStores.length > 0 ? (
                        <a
                          href={nearbyMapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-700"
                        >
                          Show Map{filteredStores.length > 20 ? " (first 20)" : ""}
                        </a>
                      ) : (
                        <span className="rounded-md bg-gray-100 px-3 py-2 text-center text-sm font-medium text-gray-400">
                          Show Map
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {loadingStores && (
                <div className="flex justify-center items-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading stores...</p>
                  </div>
                </div>
              )}

              {!loadingStores && (
                <div className="mb-4 text-sm text-gray-600">
                  Showing {storesToShow.length} of {filteredStores.length} stores
                  {` in ${selectedCountry}`}
                  {searchTerm && ` for "${searchTerm}"`}
                  {isSaleNearbyMode && saleNearbyLocation && ` near ${saleNearbyLocation}`}
                  {isOffersNearbyMode && offersNearbyLocation && ` near ${offersNearbyLocation}`}
                  {selectedDistanceRange &&
                    ` (${
                      selectedDistanceRange === UNRANKED_DISTANCE_RANGE.id
                        ? UNRANKED_DISTANCE_RANGE.label
                        : DISTANCE_RANGES.find((range) => range.id === selectedDistanceRange)?.label
                    })`}
                  {!isSaleNearbyMode && !isOffersNearbyMode && showNearMe && userLocation && ` near ${userLocation}`}
                  {showFavoritesOnly && ` (${favorites.length} favorites)`}
                </div>
              )}

              {!loadingStores && (
                <StoreGrid
                  stores={storesToShow}
                  discounts={discounts}
                  favorites={favorites}
                  loadingDiscounts={loadingDiscounts}
                  onToggleFavorite={toggleFavorite}
                  onShare={(store, discount) => setShareData({ store, discount })}
                />
              )}

              {!loadingStores && !shouldShowAllFilteredStores && filteredStores.length > 8 && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowAllStores((value) => !value)}
                    className="w-full rounded-lg bg-blue-600 px-6 py-2 text-white transition-all duration-200 hover:bg-blue-700 sm:w-auto sm:transform sm:hover:scale-105"
                  >
                    {showAllStores
                      ? "Show Less (8 stores)"
                      : `Show More Stores (${filteredStores.length - 8} more)`}
                  </button>
                </div>
              )}

              {!loadingStores && filteredStores.length === 0 && (
                <EmptyStoreState
                  searchTerm={searchTerm}
                  categoryName={selectedCategory?.name}
                  selectedSuburb={selectedSuburb}
                  showFavoritesOnly={showFavoritesOnly}
                  showNearMe={showNearMe}
                  isSaleNearbyMode={isSaleNearbyMode}
                  isOffersNearbyMode={isOffersNearbyMode}
                  userLocation={userLocation}
                  discoveryLoading={storeDiscoveryLoading}
                  discoveryMessage={storeDiscoveryMessage}
                  discoveryLink={storeDiscoveryLink}
                  userStoreDiscoveryEnabled={userStoreDiscoveryEnabled}
                  onRequestStoreDiscovery={handleRequestStoreDiscovery}
                  onCancelStoreDiscovery={handleCancelStoreDiscovery}
                  onSearchOtherCategories={handleSearchOtherCategories}
                  onClearFilters={clearFilters}
                />
              )}
            </div>
          ) : (
            <WelcomeShowcase />
          )}
        </main>
        </div>

        <ShareModal shareData={shareData} onClose={() => setShareData(null)} />
      </div>
    </div>
  );
}
