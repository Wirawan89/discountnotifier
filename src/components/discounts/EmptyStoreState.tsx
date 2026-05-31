type EmptyStoreStateProps = {
  searchTerm: string;
  selectedSuburb: string;
  showFavoritesOnly: boolean;
  showNearMe: boolean;
  isSaleNearbyMode?: boolean;
  isOffersNearbyMode?: boolean;
  userLocation: string;
  onClearFilters: () => void;
};

export default function EmptyStoreState({
  searchTerm,
  selectedSuburb,
  showFavoritesOnly,
  showNearMe,
  isSaleNearbyMode = false,
  isOffersNearbyMode = false,
  userLocation,
  onClearFilters,
}: EmptyStoreStateProps) {
  const isNearbyOfferMode = isSaleNearbyMode || isOffersNearbyMode;

  return (
    <div className="bg-white rounded-lg shadow-md p-8 text-center">
      <div className="text-6xl mb-4">🔍</div>
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
      <button
        type="button"
        onClick={onClearFilters}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
      >
        Clear Filters
      </button>
    </div>
  );
}
