type EmptyStoreStateProps = {
  searchTerm: string;
  selectedSuburb: string;
  showFavoritesOnly: boolean;
  showNearMe: boolean;
  userLocation: string;
  onClearFilters: () => void;
};

export default function EmptyStoreState({
  searchTerm,
  selectedSuburb,
  showFavoritesOnly,
  showNearMe,
  userLocation,
  onClearFilters,
}: EmptyStoreStateProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-8 text-center">
      <div className="text-6xl mb-4">🔍</div>
      <p className="text-gray-600">
        No stores found
        {searchTerm && ` for "${searchTerm}"`}
        {showNearMe && userLocation && ` near ${userLocation}`}
        {selectedSuburb && ` in ${selectedSuburb}`}
        {showFavoritesOnly && " in favorites"}
      </p>
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
