type EmptyStoreStateProps = {
  searchTerm: string;
  categoryName?: string;
  selectedSuburb: string;
  showFavoritesOnly: boolean;
  showNearMe: boolean;
  isSaleNearbyMode?: boolean;
  isOffersNearbyMode?: boolean;
  userLocation: string;
  discoveryLoading?: boolean;
  discoveryMessage?: string;
  discoveryLink?: {
    href: string;
    categoryName: string;
  } | null;
  userStoreDiscoveryEnabled?: boolean;
  onRequestStoreDiscovery?: () => void;
  onCancelStoreDiscovery?: () => void;
  onSearchOtherCategories?: () => void;
  onClearFilters: () => void;
};

export default function EmptyStoreState({
  searchTerm,
  categoryName,
  selectedSuburb,
  showFavoritesOnly,
  showNearMe,
  isSaleNearbyMode = false,
  isOffersNearbyMode = false,
  userLocation,
  discoveryLoading = false,
  discoveryMessage = "",
  discoveryLink = null,
  userStoreDiscoveryEnabled = true,
  onRequestStoreDiscovery,
  onCancelStoreDiscovery,
  onSearchOtherCategories,
  onClearFilters,
}: EmptyStoreStateProps) {
  const isNearbyOfferMode = isSaleNearbyMode || isOffersNearbyMode;
  const canSearchOtherCategories =
    !userStoreDiscoveryEnabled &&
    !isNearbyOfferMode &&
    Boolean(searchTerm.trim()) &&
    Boolean(categoryName) &&
    Boolean(onSearchOtherCategories);
  const canRequestStoreDiscovery =
    userStoreDiscoveryEnabled &&
    !isNearbyOfferMode &&
    Boolean(searchTerm.trim()) &&
    Boolean(categoryName) &&
    Boolean(onRequestStoreDiscovery);
  const hasExistingStoreMatch = Boolean(discoveryLink);
  const hasClearableFilters =
    Boolean(selectedSuburb) ||
    showFavoritesOnly ||
    showNearMe ||
    isNearbyOfferMode ||
    (!canRequestStoreDiscovery && Boolean(searchTerm.trim()));

  return (
    <div className="rounded-lg bg-white p-4 text-center shadow-md sm:p-8">
      <div className="mb-3 text-4xl sm:mb-4 sm:text-6xl">🔍</div>
      <p className="text-gray-600">
        {isNearbyOfferMode ? "No sale or offer stores found" : "No stores found"}
        {searchTerm && ` for "${searchTerm}"`}
        {showNearMe && userLocation && ` near ${userLocation}`}
        {selectedSuburb && ` in ${selectedSuburb}`}
        {showFavoritesOnly && " in favorites"}
      </p>
      {isNearbyOfferMode && (
        <p className="mx-auto mt-3 max-w-md text-sm text-gray-500">
          To learn or browse the stores near you, use Categories and select Near me.
        </p>
      )}
      {canSearchOtherCategories && (
        <div className="mx-auto mt-5 max-w-md rounded-lg border border-blue-100 bg-blue-50 p-3 text-left sm:p-4">
          <p className="text-sm font-semibold text-gray-900">Do you want to search on other categories?</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onSearchOtherCategories}
              className="min-h-11 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={onClearFilters}
              className="min-h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors duration-200 hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}
      {canRequestStoreDiscovery && (
        <div className="mx-auto mt-5 max-w-md rounded-lg border border-amber-200 bg-amber-50 p-3 text-left sm:p-4">
          <p className="text-sm font-semibold text-gray-900">
            {hasExistingStoreMatch ? "Store found in another category" : "Do you want to find the store?"}
          </p>
          {!hasExistingStoreMatch && (
            <p className="mt-1 text-sm text-gray-600">
              We can search for {searchTerm} in {categoryName} and run the verifier in the background.
            </p>
          )}
          {discoveryMessage && (
            <p className="mt-3 rounded-md bg-white px-3 py-2 text-xs font-medium text-amber-900">
              {discoveryMessage}
            </p>
          )}
          {discoveryLink && (
            <a
              href={discoveryLink.href}
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700 sm:w-auto"
            >
              Go to {discoveryLink.categoryName}
            </a>
          )}
          {!hasExistingStoreMatch && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onRequestStoreDiscovery}
                disabled={discoveryLoading}
                className="min-h-11 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {discoveryLoading ? "Searching..." : "Yes"}
              </button>
              <button
                type="button"
                onClick={onCancelStoreDiscovery}
                disabled={discoveryLoading}
                className="min-h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors duration-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
      {!canSearchOtherCategories && !canRequestStoreDiscovery && hasClearableFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-4 min-h-11 w-full rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors duration-200 hover:bg-blue-700 sm:w-auto"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
