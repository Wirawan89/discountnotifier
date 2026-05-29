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
  const normalizeExternalUrl = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);
  const getDiscountUrl = (discount?: Discount) => {
    const offerUrl = discount?.eCatalog?.find((url) => /^https?:\/\//i.test(url));

    return normalizeExternalUrl(offerUrl || store.url);
  };
  const primaryVisitUrl = getDiscountUrl(storeDiscounts[0]);
  const getOfferPeriodText = (discount: Discount) => {
    const isLiveVerifiedOffer = /offer wording found on the store website/i.test(discount.description || "");

    if (isLiveVerifiedOffer) {
      return "Happening Now...";
    }

    return `${new Date(discount.startDate).toLocaleDateString()} - ${new Date(discount.endDate).toLocaleDateString()}`;
  };

  const handleVisitStore = (event: MouseEvent<HTMLAnchorElement>) => {
    const openedWindow = window.open(primaryVisitUrl, "_blank");

    if (openedWindow) {
      event.preventDefault();
      openedWindow.opener = null;
    }
  };

  return (
    <div
      className="relative rounded-lg border border-gray-200 bg-white p-3 shadow-md transition-all duration-300 hover:shadow-xl sm:p-4 sm:transform sm:hover:-translate-y-1"
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
        <div className="mb-3 flex min-w-0 items-center gap-3 pr-9">
          <StoreLogo name={store.name} url={store.url} />
          <h3 className="min-w-0 text-base font-bold leading-snug text-gray-800">{store.name}</h3>
        </div>
        <p className="text-sm text-gray-600 mb-2">📍 {store.suburb}</p>

        <div className="mb-3 flex flex-col gap-2 min-[420px]:flex-row">
          <a
            href={primaryVisitUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleVisitStore}
            className="flex-1 rounded bg-blue-50 px-2 py-1 text-center text-sm font-medium text-blue-600 transition-colors duration-200 hover:bg-blue-100 hover:text-blue-800"
          >
            Visit Store →
          </a>
          <button
            type="button"
            onClick={() => onShare(store)}
            className="rounded bg-green-600 px-3 py-1 text-sm text-white transition-colors duration-200 hover:bg-green-700"
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
                  <a
                    key={discount.id}
                    href={getDiscountUrl(discount)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-red-50 p-2 rounded border-l-2 border-red-400 hover:bg-red-100 transition-colors duration-200"
                  >
                    <div className="font-medium text-red-700 text-xs">{discount.title}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {getOfferPeriodText(discount)}
                    </div>
                  </a>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
