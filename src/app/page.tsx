'use client';

import { useEffect, useState } from 'react';

type Category = {
  id: number;
  name: string;
};

type Store = {
  id: number;
  name: string;
  suburb: string;
  url: string;
  background?: string | null;
  categoryId: number;
};

type Discount = {
  id: number;
  storeId: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  image?: string | null;
};

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loadingDiscounts, setLoadingDiscounts] = useState(false);
  const [selectedSuburb, setSelectedSuburb] = useState<string>("");
  const [showAllStores, setShowAllStores] = useState(false);
  
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [userLocation, setUserLocation] = useState<string>("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showNearMe, setShowNearMe] = useState(false);
  
  // Favorites and Sharing states
  const [favorites, setFavorites] = useState<number[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareData, setShareData] = useState<{store: Store, discount?: Discount} | null>(null);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiResult, setGeminiResult] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        console.log('Fetched categories:', data);
        setCategories(data);
        setLoadingCategories(false);
      });
    
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('discountNotifierFavorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('discountNotifierFavorites', JSON.stringify(favorites));
  }, [favorites]);

  // Get user location
  const getUserLocation = () => {
    setIsLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const mockSuburbs = ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"];
          const randomSuburb = mockSuburbs[Math.floor(Math.random() * mockSuburbs.length)];
          setUserLocation(randomSuburb);
          setIsLoadingLocation(false);
        },
        (error) => {
          console.log("Location access denied:", error);
          setIsLoadingLocation(false);
        }
      );
    } else {
      setIsLoadingLocation(false);
    }
  };

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
    setSelectedSuburb("");
    setShowAllStores(false);
    setSearchTerm("");
    setShowNearMe(false);
    setShowFavoritesOnly(false);
    setLoadingStores(true);
    setLoadingDiscounts(true);
    
    setTimeout(() => {
      fetch('/api/stores')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const filtered = data.filter((store: Store) => store.categoryId === category.id);
            setStores(filtered);
          } else {
            setStores([]); // or handle error
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

  // Toggle favorite
  const toggleFavorite = (storeId: number) => {
    setFavorites(prev => 
      prev.includes(storeId) 
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId]
    );
  };

  // Share store/discount
  const shareStore = (store: Store, discount?: Discount) => {
    setShareData({ store, discount });
    setShowShareModal(true);
  };

  // Close share modal
  const closeShareModal = () => {
    setShowShareModal(false);
    setShareData(null);
  };

  // Get unique suburbs for the selected category
  const suburbOptions = Array.from(new Set(stores.map((store) => store.suburb))).sort();

  // Filter and sort stores
  const getFilteredAndSortedStores = () => {
    let filtered = stores;

    if (selectedSuburb) {
      filtered = filtered.filter((store) => store.suburb === selectedSuburb);
    }

    if (searchTerm) {
      filtered = filtered.filter((store) =>
        store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.suburb.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (showNearMe && userLocation) {
      filtered = filtered.filter((store) => store.suburb === userLocation);
    }

    // Filter by favorites
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
          const aDiscounts = discounts.filter(d => d.storeId === a.id).length;
          const bDiscounts = discounts.filter(d => d.storeId === b.id).length;
          return bDiscounts - aDiscounts;
        case "favorites":
          const aFav = favorites.includes(a.id);
          const bFav = favorites.includes(b.id);
          return bFav ? 1 : aFav ? -1 : 0;
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredStores = getFilteredAndSortedStores();
  const storesToShow = showAllStores ? filteredStores : filteredStores.slice(0, 8);

  // Sort categories alphabetically
  const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Ticker - Second Horizontal Frame */}
      <div className="bg-red-600 text-white py-2 overflow-hidden">
        <div className="w-full px-4">
          <div className="flex items-center">
            <span className="font-bold mr-4">🔥 HOT DEALS:</span>
            <div className="flex-1 overflow-hidden">
              <div className="animate-marquee whitespace-nowrap">
                <span className="mr-8">20% off at Sydney Cafe • 50% off Electronics at TechStore • Free Delivery at FashionHub • Buy 1 Get 1 at MusicGear</span>
                <span className="mr-8">20% off at Sydney Cafe • 50% off Electronics at TechStore • Free Delivery at FashionHub • Buy 1 Get 1 at MusicGear</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Full Height */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* Left Sidebar - Categories (1/3 width, full height) */}
        <div className="w-1/3 bg-white shadow-md">
          <div className="p-4 h-full flex flex-col">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Categories</h2>
            {loadingCategories ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {sortedCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 text-sm transform hover:scale-105 ${
                      selectedCategory?.id === cat.id
                        ? "bg-blue-100 text-blue-900 border-l-4 border-blue-500 shadow-md"
                        : "bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm"
                    }`}
                    onClick={() => handleCategoryClick(cat)}
                  >
                    {cat.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Content Area - Showcase Boxes (2/3 width, full height) */}
        <div className="w-2/3 p-6 overflow-y-auto">
          {selectedCategory ? (
            <div>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">
                {selectedCategory.name}
              </h2>

              {/* Search and Filter Bar */}
              <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-center">
                  {/* Search Bar */}
                  <div className="flex-1 min-w-48">
                    <input
                      type="text"
                      placeholder="Search stores..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-black"
                    />
                  </div>

                  {/* Suburb Filter */}
                  {suburbOptions.length > 1 && (
                    <select
                      value={selectedSuburb}
                      onChange={(e) => setSelectedSuburb(e.target.value)}
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

                  {/* Sort By */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-black"
                  >
                    <option value="name">Sort by Name</option>
                    <option value="suburb">Sort by Suburb</option>
                    <option value="discounts">Sort by Discounts</option>
                    <option value="favorites">Sort by Favorites</option>
                  </select>

                  {/* Favorites Filter */}
                  <button
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                      showFavoritesOnly
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    <span className="text-lg">❤️</span>
                    {showFavoritesOnly ? "Show All" : "Favorites"}
                  </button>

                  {/* Near Me Button */}
                  <button
                    onClick={getUserLocation}
                    disabled={isLoadingLocation}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      showNearMe
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    } ${isLoadingLocation ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {isLoadingLocation ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Locating...
                      </div>
                    ) : (
                      "📍 Near Me"
                    )}
                  </button>

                  {/* Show Near Me Toggle */}
                  {userLocation && (
                    <button
                      onClick={() => setShowNearMe(!showNearMe)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        showNearMe
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {showNearMe ? `Hide ${userLocation}` : `Show ${userLocation}`}
                    </button>
                  )}

                  {/* Gemini Button */}
                  <div className="mb-4 flex items-center gap-4">
                    <button
                      onClick={async () => {
                        setGeminiLoading(true);
                        setGeminiResult(null);
                        try {
                          const res = await fetch('/api/gemini/fetch-discounts', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ categoryId: selectedCategory.id })
                          });
                          const data = await res.json();
                          if (res.ok) {
                            setGeminiResult(data.message || 'Success!');
                          } else {
                            setGeminiResult(data.error || 'Error fetching discounts');
                          }
                        } catch (err) {
                          setGeminiResult('Network error');
                        } finally {
                          setGeminiLoading(false);
                        }
                      }}
                      disabled={geminiLoading}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow hover:from-blue-700 hover:to-blue-500 ${geminiLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {geminiLoading ? 'Fetching Discounts...' : 'Fetch Latest Discounts'}
                    </button>
                    {geminiResult && (
                      <span className="ml-2 text-sm font-medium text-green-700 bg-green-100 px-3 py-1 rounded shadow animate-fadeIn">
                        {geminiResult}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Loading Animation */}
              {loadingStores && (
                <div className="flex justify-center items-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading stores...</p>
                  </div>
                </div>
              )}

              {/* Results Count */}
              {!loadingStores && (
                <div className="mb-4 text-sm text-gray-600">
                  Showing {storesToShow.length} of {filteredStores.length} stores
                  {searchTerm && ` for "${searchTerm}"`}
                  {showNearMe && userLocation && ` near ${userLocation}`}
                  {showFavoritesOnly && ` (${favorites.length} favorites)`}
                </div>
              )}

              {/* Showcase Grid - Responsive grid */}
              {!loadingStores && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                  {storesToShow.map((store, index) => (
                    <div
                      key={store.id}
                      className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative"
                      style={{
                        animationDelay: `${index * 100}ms`,
                        animation: "fadeInUp 0.6s ease-out forwards"
                      }}
                    >
                      {/* Favorite Button */}
                      <button
                        onClick={() => toggleFavorite(store.id)}
                        className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 ${
                          favorites.includes(store.id)
                            ? "bg-red-500 text-white hover:bg-red-600"
                            : "bg-gray-200 text-gray-600 hover:bg-red-500 hover:text-white"
                        }`}
                      >
                        <span className="text-lg">
                          {favorites.includes(store.id) ? "❤️" : "🤍"}
                        </span>
                      </button>

                      <div className="flex flex-col h-full">
                        <h3 className="font-bold text-lg text-gray-800 mb-2 pr-12">{store.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">📍 {store.suburb}</p>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2 mb-3">
                          <a
                            href={store.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200 text-center py-1 px-2 bg-blue-50 rounded hover:bg-blue-100"
                          >
                            Visit Store →
                          </a>
                          <button
                            onClick={() => shareStore(store)}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors duration-200"
                          >
                            📤 Share
                          </button>
                        </div>
                        
                        {/* Discounts for this store */}
                        <div className="flex-1">
                          <h4 className="font-semibold text-red-500 text-sm mb-2">Current Offers:</h4>
                          {loadingDiscounts ? (
                            <div className="animate-pulse">
                              <div className="h-4 bg-gray-200 rounded mb-2"></div>
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {discounts.filter((d) => d.storeId === store.id).length === 0 ? (
                                <p className="text-xs text-gray-400">No current offers</p>
                              ) : (
                                discounts
                                  .filter((d) => d.storeId === store.id)
                                  .slice(0, 2)
                                  .map((discount) => (
                                    <div key={discount.id} className="bg-red-50 p-2 rounded border-l-2 border-red-400 hover:bg-red-100 transition-colors duration-200 relative">
                                      <div className="font-medium text-red-700 text-xs">{discount.title}</div>
                                      <div className="text-xs text-gray-600 mt-1">
                                        {new Date(discount.startDate).toLocaleDateString()} - {new Date(discount.endDate).toLocaleDateString()}
                                      </div>
                                      <button
                                        onClick={() => shareStore(store, discount)}
                                        className="absolute top-1 right-1 text-xs bg-green-600 text-white px-1 rounded hover:bg-green-700 transition-colors"
                                      >
                                        📤
                                      </button>
                                    </div>
                                  ))
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Show more/less stores button */}
              {!loadingStores && filteredStores.length > 8 && (
                <div className="text-center">
                  <button 
                    onClick={() => setShowAllStores(!showAllStores)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
                  >
                    {showAllStores 
                      ? `Show Less (8 stores)` 
                      : `Show More Stores (${filteredStores.length - 8} more)`
                    }
                  </button>
                </div>
              )}

              {!loadingStores && filteredStores.length === 0 && (
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
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedSuburb("");
                      setShowNearMe(false);
                      setShowFavoritesOnly(false);
                    }}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Default showcase when no category is selected */
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Welcome to DiscountNotifier</h2>
              <p className="text-gray-600 mb-6">
                Select a category from the left sidebar to discover amazing discounts and offers in your area!
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div 
                    key={i} 
                    className="bg-gray-100 rounded-lg p-6 border-2 border-dashed border-gray-300 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 transform hover:scale-105"
                    style={{
                      animationDelay: `${i * 100}ms`,
                      animation: "fadeInUp 0.6s ease-out forwards"
                    }}
                  >
                    <div className="text-gray-400 text-sm">Featured Showcase {i}</div>
                    <div className="text-xs text-gray-500 mt-2">Store owners can promote their products here</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && shareData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Share {shareData.discount ? 'Discount' : 'Store'}</h3>
              <button
                onClick={closeShareModal}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4">
              <p className="font-medium">{shareData.store.name}</p>
              <p className="text-sm text-gray-600">📍 {shareData.store.suburb}</p>
              {shareData.discount && (
                <div className="mt-2 p-2 bg-red-50 rounded border-l-2 border-red-400">
                  <p className="font-medium text-red-700 text-sm">{shareData.discount.title}</p>
                  <p className="text-xs text-gray-600">{shareData.discount.description}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const text = shareData.discount 
                    ? `Check out this amazing discount at ${shareData.store.name}: ${shareData.discount.title}`
                    : `Check out ${shareData.store.name} in ${shareData.store.suburb}`;
                  const url = shareData.store.url;
                  
                  if (navigator.share) {
                    navigator.share({
                      title: 'DiscountNotifier',
                      text: text,
                      url: url
                    });
                  } else {
                    navigator.clipboard.writeText(`${text}\n${url}`);
                    alert('Link copied to clipboard!');
                  }
                  closeShareModal();
                }}
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Share
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareData.store.url);
                  alert('Store URL copied to clipboard!');
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Copy URL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeInUp 0.6s ease-out;
        }
      `}</style>
    </div>
  );
} 