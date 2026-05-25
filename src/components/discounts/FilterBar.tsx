type FilterBarProps = {
  searchTerm: string;
  selectedCountry: string;
  countryOptions: string[];
  selectedSuburb: string;
  suburbOptions: string[];
  sortBy: string;
  showFavoritesOnly: boolean;
  showNearMe: boolean;
  userLocation: string;
  isLoadingLocation: boolean;
  smartFetchLoading: boolean;
  smartFetchResult: string | null;
  onSearchChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onSuburbChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onToggleFavoritesOnly: () => void;
  onGetUserLocation: () => void;
  onToggleNearMe: () => void;
  onSmartFetch: () => void;
  onShowExisting: () => void;
};

export default function FilterBar({
  searchTerm,
  selectedCountry,
  countryOptions,
  selectedSuburb,
  suburbOptions,
  sortBy,
  showFavoritesOnly,
  showNearMe,
  userLocation,
  isLoadingLocation,
  smartFetchLoading,
  smartFetchResult,
  onSearchChange,
  onCountryChange,
  onSuburbChange,
  onSortChange,
  onToggleFavoritesOnly,
  onGetUserLocation,
  onToggleNearMe,
  onSmartFetch,
  onShowExisting,
}: FilterBarProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-48">
          <input
            type="text"
            placeholder="Search stores..."
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-black"
          />
        </div>

        <select
          value={selectedCountry}
          onChange={(event) => onCountryChange(event.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-black"
          aria-label="Country"
        >
          {countryOptions.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>

        {suburbOptions.length > 1 && (
          <select
            value={selectedSuburb}
            onChange={(event) => onSuburbChange(event.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-black"
          >
            <option value="">All Suburbs</option>
            {suburbOptions.map((suburb) => (
              <option key={suburb} value={suburb}>
                {suburb}
              </option>
            ))}
          </select>
        )}

        <select
          value={sortBy}
          onChange={(event) => onSortChange(event.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-black"
        >
          <option value="name">Sort by Name</option>
          <option value="suburb">Sort by Suburb</option>
          <option value="discounts">Sort by Discounts</option>
          <option value="favorites">Sort by Favorites</option>
        </select>

        <button
          type="button"
          onClick={onToggleFavoritesOnly}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
            showFavoritesOnly
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <span className="text-lg">❤️</span>
          {showFavoritesOnly ? "Show All" : "Favorites"}
        </button>

        <button
          type="button"
          onClick={onGetUserLocation}
          disabled={isLoadingLocation}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            showNearMe
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          } ${isLoadingLocation ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isLoadingLocation ? (
            <span className="flex items-center">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
              Locating...
            </span>
          ) : (
            "📍 Near Me"
          )}
        </button>

        {userLocation && (
          <button
            type="button"
            onClick={onToggleNearMe}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              showNearMe
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {showNearMe ? `Hide ${userLocation}` : `Show ${userLocation}`}
          </button>
        )}

        <div className="mb-4 flex items-center gap-4">
          <button
            type="button"
            onClick={onSmartFetch}
            disabled={smartFetchLoading}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 bg-gradient-to-r from-green-600 to-green-400 text-white shadow hover:from-green-700 hover:to-green-500 ${smartFetchLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {smartFetchLoading ? "Smart Fetching..." : "Smart Fetch Discounts"}
          </button>

          <button
            type="button"
            onClick={onShowExisting}
            disabled={smartFetchLoading}
            className="px-4 py-2 rounded-lg font-medium transition-all duration-200 bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow hover:from-blue-700 hover:to-blue-500"
          >
            Show Existing
          </button>

          {smartFetchResult && (
            <span className={`ml-2 text-sm font-medium px-3 py-1 rounded shadow animate-fadeIn ${
              smartFetchResult.includes("Success") || smartFetchResult.includes("stores") || smartFetchResult.includes("existing")
                ? "text-green-700 bg-green-100"
                : smartFetchResult.includes("limits") || smartFetchResult.includes("credit")
                  ? "text-yellow-700 bg-yellow-100"
                  : "text-red-700 bg-red-100"
            }`}>
              {smartFetchResult}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
