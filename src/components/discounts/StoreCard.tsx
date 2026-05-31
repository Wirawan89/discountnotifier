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
  const storePromotions = store.promotions || [];
  const normalizeExternalUrl = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);
  const getDiscountUrl = (discount?: Discount) => {
    const offerUrl = discount?.eCatalog?.find((url) => /^https?:\/\//i.test(url));

    return normalizeExternalUrl(offerUrl || store.websiteUrl || store.googleBusinessUrl || store.url);
  };
  const getPromotionUrl = (promotion?: { url?: string | null }) => {
    return normalizeExternalUrl(promotion?.url || store.websiteUrl || store.googleBusinessUrl || store.url);
  };
  const destinationParts = [
    store.address,
    store.name,
    store.suburb,
    store.city,
    store.country || "Australia",
  ].filter((part): part is string => Boolean(part && part.trim().length > 0));
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinationParts.join(", "))}`;
  const primaryVisitUrl = storeDiscounts[0] ? getDiscountUrl(storeDiscounts[0]) : getPromotionUrl(storePromotions[0]);
  const getOfferPeriodText = (discount: Discount) => {
    const isLiveVerifiedOffer = /offer wording found on the store website/i.test(discount.description || "");

    if (isLiveVerifiedOffer) {
      return "Happening Now...";
    }

    return `${new Date(discount.startDate).toLocaleDateString()} - ${new Date(discount.endDate).toLocaleDateString()}`;
  };

  const handleVisitStore = (event: MouseEvent<HTMLAnchorElement>) => {
    fetch("/api/analytics/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "view_store", categoryId: store.categoryId, storeId: store.id }),
      keepalive: true,
    }).catch(() => {});

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
          <div className="min-w-0">
            <h3 className="min-w-0 text-base font-bold leading-snug text-gray-800">{store.name}</h3>
            {store.sourceType === "google_business" && (
              <span className="mt-1 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                Google Business
              </span>
            )}
          </div>
        </div>
        <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <span>📍 {store.suburb}</span>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Show directions to ${store.name}`}
            className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 transition-colors duration-200 hover:border-red-300 hover:bg-red-100 hover:text-red-700"
          >
            Show Direction
          </a>
        </div>

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
              {storeDiscounts.length === 0 && storePromotions.length === 0 ? (
                <p className="text-xs text-gray-400">No offer at the moment</p>
              ) : (
                <>
                  {storeDiscounts.slice(0, 2).map((discount) => (
                    <a
                      key={`discount-${discount.id}`}
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
                  ))}
                  {storeDiscounts.length < 2 &&
                    storePromotions.slice(0, 2 - storeDiscounts.length).map((promotion) => (
                      <a
                        key={`promotion-${promotion.id}`}
                        href={getPromotionUrl(promotion)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded border-l-2 border-amber-400 bg-amber-50 p-2 transition-colors duration-200 hover:bg-amber-100"
                      >
                        <div className="text-xs font-medium text-amber-800">{promotion.message}</div>
                        <div className="mt-1 text-xs text-gray-600">Merchant promotion</div>
                      </a>
                    ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
