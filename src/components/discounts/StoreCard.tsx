import type { MouseEvent } from "react";
import type { Discount, Store } from "./types";

type StoreCardProps = {
  store: Store;
  index: number;
  discounts: Discount[];
  loadingDiscounts: boolean;
  isFavorite: boolean;
  onToggleFavorite: (storeId: number) => void;
  onShare: (store: Store, discount?: Discount) => void;
};

export default function StoreCard({
  store,
  index,
  discounts,
  loadingDiscounts,
  isFavorite,
  onToggleFavorite,
  onShare,
}: StoreCardProps) {
  const storeDiscounts = discounts.filter((discount) => discount.storeId === store.id);
  const storeUrl = /^https?:\/\//i.test(store.url) ? store.url : `https://${store.url}`;

  const handleVisitStore = (event: MouseEvent<HTMLAnchorElement>) => {
    const openedWindow = window.open(storeUrl, "_blank");

    if (openedWindow) {
      event.preventDefault();
      openedWindow.opener = null;
    }
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative"
      style={{
        animationDelay: `${index * 100}ms`,
        animation: "fadeInUp 0.6s ease-out forwards",
      }}
    >
      <button
        type="button"
        onClick={() => onToggleFavorite(store.id)}
        className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 ${
          isFavorite
            ? "bg-red-500 text-white hover:bg-red-600"
            : "bg-gray-200 text-gray-600 hover:bg-red-500 hover:text-white"
        }`}
      >
        <span className="text-lg">{isFavorite ? "❤️" : "🤍"}</span>
      </button>

      <div className="flex flex-col h-full">
        <h3 className="font-bold text-lg text-gray-800 mb-2 pr-12">{store.name}</h3>
        <p className="text-sm text-gray-600 mb-2">📍 {store.suburb}</p>

        <div className="flex gap-2 mb-3">
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleVisitStore}
            className="flex-1 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200 text-center py-1 px-2 bg-blue-50 rounded hover:bg-blue-100"
          >
            Visit Store →
          </a>
          <button
            type="button"
            onClick={() => onShare(store)}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors duration-200"
          >
            📤 Share
          </button>
        </div>

        <div className="flex-1">
          <h4 className="font-semibold text-red-500 text-sm mb-2">Current Offers:</h4>
          {loadingDiscounts ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ) : (
            <div className="space-y-2">
              {storeDiscounts.length === 0 ? (
                <p className="text-xs text-gray-400">No offer at the moment</p>
              ) : (
                storeDiscounts.slice(0, 2).map((discount) => (
                  <div key={discount.id} className="bg-red-50 p-2 rounded border-l-2 border-red-400 hover:bg-red-100 transition-colors duration-200 relative">
                    <div className="font-medium text-red-700 text-xs">{discount.title}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {new Date(discount.startDate).toLocaleDateString()} - {new Date(discount.endDate).toLocaleDateString()}
                    </div>
                    <button
                      type="button"
                      onClick={() => onShare(store, discount)}
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
  );
}
