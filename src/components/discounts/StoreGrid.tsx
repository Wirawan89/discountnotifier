import StoreCard from "./StoreCard";
import type { Discount, Store } from "./types";

type StoreGridProps = {
  stores: Store[];
  discounts: Discount[];
  favorites: number[];
  loadingDiscounts: boolean;
  onToggleFavorite: (storeId: number) => void;
  onShare: (store: Store, discount?: Discount) => void;
};

export default function StoreGrid({
  stores,
  discounts,
  favorites,
  loadingDiscounts,
  onToggleFavorite,
  onShare,
}: StoreGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
      {stores.map((store, index) => (
        <StoreCard
          key={store.id}
          store={store}
          index={index}
          discounts={discounts}
          loadingDiscounts={loadingDiscounts}
          isFavorite={favorites.includes(store.id)}
          onToggleFavorite={onToggleFavorite}
          onShare={onShare}
        />
      ))}
    </div>
  );
}
