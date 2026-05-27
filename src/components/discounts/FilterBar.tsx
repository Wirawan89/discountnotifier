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
  showFetchActions?: boolean;
  onSearchChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onSuburbChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onToggleFavoritesOnly: () => void;
  onGetUserLocation: () => void | Promise<void>;
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
  showFetchActions = true,
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
    <div className="mb-6 rounded-lg bg-white p-3 shadow-md sm:p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:flex xl:flex-wrap xl:items-center">
        <div className="min-w-0 sm:col-span-2 xl:min-w-48 xl:flex-1">
          <input
            type="text"
            placeholder="Search stores..."
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={selectedCountry}
          onChange={(event) => onCountryChange(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 xl:w-auto"
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
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 xl:w-auto"
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
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 xl:w-auto"
        >
          <option value="name">Sort by Name</option>
          <option value="suburb">Sort by Suburb</option>
          <option value="discounts">Sort by Discounts</option>
          <option value="favorites">Sort by Favorites</option>
        </select>

        <button
          type="button"
          onClick={onToggleFavoritesOnly}
          className={`flex h-10 w-full items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium transition-all duration-200 xl:w-auto ${
            showFavoritesOnly
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <span className="text-sm">❤️</span>
          {showFavoritesOnly ? "Show All" : "Favorites"}
        </button>

        <button
          type="button"
          onClick={onGetUserLocation}
          disabled={isLoadingLocation}
          className={`w-full rounded-lg px-4 py-2 font-medium transition-all duration-200 xl:w-auto ${
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
            className={`w-full rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 xl:w-auto ${
              showNearMe
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {showNearMe ? `Hide ${userLocation}` : `Show ${userLocation}`}
          </button>
        )}

        {showFetchActions && (
          <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:flex-wrap sm:items-center xl:mb-4">
            <button
              type="button"
              onClick={onSmartFetch}
              disabled={smartFetchLoading}
              className={`w-full rounded-lg bg-gradient-to-r from-green-600 to-green-400 px-4 py-2 font-medium text-white shadow transition-all duration-200 hover:from-green-700 hover:to-green-500 sm:w-auto ${smartFetchLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {smartFetchLoading ? "Smart Fetching..." : "Smart Fetch Discounts"}
            </button>

            <button
              type="button"
              onClick={onShowExisting}
              disabled={smartFetchLoading}
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-400 px-4 py-2 font-medium text-white shadow transition-all duration-200 hover:from-blue-700 hover:to-blue-500 sm:w-auto"
            >
              Show Existing
            </button>

            {smartFetchResult && (
              <span className={`rounded px-3 py-1 text-sm font-medium shadow animate-fadeIn ${
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
        )}
      </div>
    </div>
  );
}
