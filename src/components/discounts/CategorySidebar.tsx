import type { Category } from "./types";

type CategorySidebarProps = {
  categories: Category[];
  loading: boolean;
  selectedCategory: Category | null;
  isSaleNearbyActive: boolean;
  isSaleNearbyLoading: boolean;
  isOffersNearbyActive: boolean;
  isOffersNearbyLoading: boolean;
  onSelectCategory: (category: Category) => void;
  onSaleNearby: () => void;
  onOffersNearby: () => void;
};

export default function CategorySidebar({
  categories,
  loading,
  selectedCategory,
  isSaleNearbyActive,
  isSaleNearbyLoading,
  isOffersNearbyActive,
  isOffersNearbyLoading,
  onSelectCategory,
  onSaleNearby,
  onOffersNearby,
}: CategorySidebarProps) {
  return (
    <aside className="w-1/3 bg-gray-50 shadow-md">
      <div className="flex h-full flex-col gap-3 p-4">
        <div className="flex flex-col items-start gap-3">
          <NearbyButton
            label="saleNearby"
            active={isSaleNearbyActive}
            loading={isSaleNearbyLoading}
            onClick={onSaleNearby}
          />
          <NearbyButton
            label="offersNearby"
            description="Brunch, Dining & Beverages"
            active={isOffersNearbyActive}
            loading={isOffersNearbyLoading}
            onClick={onOffersNearby}
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col rounded-lg bg-white p-4 shadow-sm">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Categories</h2>
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={`w-full text-left p-3 rounded-lg cursor-pointer transition-all duration-200 text-sm transform hover:scale-105 ${
                    selectedCategory?.id === category.id
                      ? "bg-blue-100 text-blue-900 border-l-4 border-blue-500 shadow-md"
                      : "bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm"
                  }`}
                  onClick={() => onSelectCategory(category)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

type NearbyButtonProps = {
  label: string;
  description?: string;
  active: boolean;
  loading: boolean;
  onClick: () => void;
};

function NearbyButton({ label, description, active, loading, onClick }: NearbyButtonProps) {
  const colorClass = active ? "bg-red-700 text-white" : "bg-red-600 text-white hover:bg-red-700";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`group relative h-[50px] w-[150px] shrink-0 overflow-hidden rounded-sm border-2 border-black px-3 py-1.5 text-center shadow-[3px_3px_0_#111] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#111] ${colorClass} ${
        loading ? "cursor-not-allowed opacity-60" : ""
      }`}
      style={{ width: "150px", height: "50px" }}
    >
      <span className="absolute inset-x-1 top-1 h-1 rounded-full bg-white/35"></span>
      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs leading-none text-yellow-100 animate-pulse">
        ✦
      </span>
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs leading-none text-yellow-100 transition-transform duration-200 group-hover:rotate-12">
        ✦
      </span>
      <span className="relative flex h-full items-center justify-center">
        <span className="w-full min-w-0 text-center">
          <span
            className="block text-sm font-black leading-none text-white"
            style={{ textShadow: "1px 1px 0 #000, -1px 1px 0 #000, 1px -1px 0 #000, -1px -1px 0 #000" }}
          >
            {label}
          </span>
          {description && (
            <span className="mt-1 block font-bold uppercase leading-tight text-white/95" style={{ fontSize: "8px" }}>
              {description}
            </span>
          )}
        </span>
      </span>
      {loading && (
        <span className="relative mt-1 block text-[10px] font-bold uppercase leading-none text-white/90">
          Loading
        </span>
      )}
    </button>
  );
}
