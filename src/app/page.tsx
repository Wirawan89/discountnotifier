'use client';

import { useEffect, useMemo, useState } from 'react';
import CategorySidebar from '@/components/discounts/CategorySidebar';
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

export default function Home() {
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
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showNearMe, setShowNearMe] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [smartFetchLoading, setSmartFetchLoading] = useState(false);
  const [smartFetchResult, setSmartFetchResult] = useState<string | null>(null);
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
  }, []);

  useEffect(() => {
    localStorage.setItem('discountNotifierFavorites', JSON.stringify(favorites));
  }, [favorites]);

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

  const filteredStores = useMemo(() => {
    let filtered = stores.filter((store) => normalizeCountry(store.country) === selectedCountry);

    if (selectedSuburb) {
      filtered = filtered.filter((store) => store.suburb === selectedSuburb);
    }

    if (searchTerm) {
      const normalizedSearch = searchTerm.toLowerCase();
      filtered = filtered.filter((store) => {
        const storeDiscounts = discounts.filter((discount) => discount.storeId === store.id);
        const highSignalText = [
          store.name,
          store.url,
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

        return (normalizedSearch.length <= 2 ? highSignalText : searchableText).includes(normalizedSearch);
      });
    }

    if (showNearMe && userLocation) {
      const normalizedLocation = normalizeLocation(userLocation);
      filtered = filtered.filter(
        (store) =>
          normalizeLocation(store.suburb) === normalizedLocation ||
          normalizeLocation(store.city) === normalizedLocation
      );
    }

    if (showFavoritesOnly) {
      filtered = filtered.filter((store) => favorites.includes(store.id));
    }

    filtered.sort((a, b) => {
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
  }, [discounts, favorites, searchTerm, selectedCategory?.name, selectedCountry, selectedSuburb, showFavoritesOnly, showNearMe, sortBy, stores, userLocation]);

  const storesToShow = showAllStores ? filteredStores : filteredStores.slice(0, 8);

  const resetCategoryViewState = () => {
    setSelectedSuburb("");
    setShowAllStores(false);
    setSearchTerm("");
    setShowNearMe(false);
    setShowFavoritesOnly(false);
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

    if (value.trim()) {
      setSelectedSuburb("");
      setShowNearMe(false);
      setShowFavoritesOnly(false);
      setShowAllStores(false);
    }
  };

  const refreshCategoryData = (category: Category) => {
    setLoadingStores(true);
    setLoadingDiscounts(true);

    setTimeout(() => {
      fetch('/api/stores')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setStores(data.filter((store: Store) => store.categoryId === category.id));
          } else {
            setStores([]);
            console.error('Failed to fetch stores:', data.error || data, data.details || '');
          }
          setLoadingStores(false);
        });

      fetch('/api/discounts')
        .then((res) => res.json())
        .then((data) => {
          setDiscounts(data);
          setLoadingDiscounts(false);
        });
    }, 500);
  };

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
    resetCategoryViewState();
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
  };

  const getUserLocation = (): Promise<string | null> => {
    setIsLoadingLocation(true);

    const askForSuburb = () => {
      const suburb = window.prompt(
        "Enter your suburb so nearby search can match stores in your exact area and 1-2 nearby suburbs.",
        userLocation || DEFAULT_LOCATION_SUBURB
      )?.trim();

      if (suburb) {
        setUserLocation(suburb);
        return suburb;
      }

      return null;
    };

    if (!navigator.geolocation) {
      const suburb = askForSuburb();
      setIsLoadingLocation(false);
      return Promise.resolve(suburb);
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          const suburb = askForSuburb();
          setIsLoadingLocation(false);
          resolve(suburb);
        },
        (error) => {
          console.log("Location access denied:", error);
          const suburb = askForSuburb();
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

    try {
      const response = await fetch(
        `/api/stores/sale-nearby?location=${encodeURIComponent(location)}&country=${encodeURIComponent(selectedCountry)}`
      );
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

    try {
      const response = await fetch(
        `/api/stores/offers-nearby?location=${encodeURIComponent(location)}&country=${encodeURIComponent(selectedCountry)}`
      );
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

    try {
      const response = await fetch('/api/discounts/smart-fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: selectedCategory.id,
          country: selectedCountry,
          providers: ['openrouter'],
        }),
      });
      const data = await response.json();

      if (response.ok) {
        const message = data.message || 'Success!';
        const stats = data.stats ? ` (${data.stats.totalStores} stores, ${data.stats.totalDiscounts} discounts)` : '';
        const cacheInfo = data.wasCached ? ' [CACHED]' : ' [FRESH]';
        setSmartFetchResult(message + stats + cacheInfo);
        setTimeout(() => refreshCategoryData(selectedCategory), 1000);
      } else {
        const errorMsg = data.error || 'Error fetching discounts';
        setSmartFetchResult(
          errorMsg.includes('credit') || errorMsg.includes('quota') || errorMsg.includes('rate limit')
            ? 'API limits reached - showing existing discounts. Try again later or check your API credits.'
            : errorMsg
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
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HotDealsTicker />

      <div className="flex h-[calc(100vh-120px)]">
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

        <main className="w-2/3 p-6 overflow-y-auto">
          {selectedCategory || isSaleNearbyMode || isOffersNearbyMode ? (
            <div>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">
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
                  Showing brunch, dining and beverage offers near {offersNearbyLocation || "your location"}
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

              {!loadingStores && filteredStores.length > 8 && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowAllStores((value) => !value)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
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
                  selectedSuburb={selectedSuburb}
                  showFavoritesOnly={showFavoritesOnly}
                  showNearMe={showNearMe}
                  userLocation={userLocation}
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
  );
}
