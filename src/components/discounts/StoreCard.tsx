import type { MouseEvent } from "react";
import type { Discount, Store } from "./types";
import StoreLogo from "./StoreLogo";

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
  const getOfferPeriodText = (discount: Discount) => {
    const isLiveVerifiedOffer = /offer wording found on the store website/i.test(discount.description || "");

    if (isLiveVerifiedOffer) {
      return "Happening Now...";
    }

    return `${new Date(discount.startDate).toLocaleDateString()} - ${new Date(discount.endDate).toLocaleDateString()}`;
  };

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
        animationName: "fadeInUp",
        animationDuration: "0.6s",
        animationTimingFunction: "ease-out",
        animationFillMode: "forwards",
      }}
    >
      <button
        type="button"
        onClick={() => onToggleFavorite(store.id)}
        aria-label={isFavorite ? `Remove ${store.name} from favorites` : `Add ${store.name} to favorites`}
        className={`absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
          isFavorite
            ? "bg-red-500 text-white hover:bg-red-600"
            : "bg-gray-200 text-gray-600 hover:bg-red-500 hover:text-white"
        }`}
      >
        <span className="text-sm">{isFavorite ? "❤️" : "🤍"}</span>
      </button>

      <div className="flex flex-col h-full">
        <div className="mb-3 flex items-center gap-3 pr-9">
          <StoreLogo name={store.name} url={store.url} />
          <h3 className="font-bold text-base leading-snug text-gray-800">{store.name}</h3>
        </div>
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
                  <div key={discount.id} className="bg-red-50 p-2 rounded border-l-2 border-red-400 hover:bg-red-100 transition-colors duration-200">
                    <div className="font-medium text-red-700 text-xs">{discount.title}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {getOfferPeriodText(discount)}
                    </div>
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
