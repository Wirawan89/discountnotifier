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
    <aside className="w-full bg-gray-50 shadow-md lg:w-1/3">
      <div className="flex h-full flex-col gap-3 p-3 sm:p-4">
        <div className="flex flex-row flex-wrap items-start gap-3 lg:flex-col">
          <NearbyButton
            label="saleNearby"
            active={isSaleNearbyActive}
            loading={isSaleNearbyLoading}
            onClick={onSaleNearby}
          />
          <NearbyButton
            label="offersNearby"
            description="Brunch, Dining, Cultural Bites"
            active={isOffersNearbyActive}
            loading={isOffersNearbyLoading}
            onClick={onOffersNearby}
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col rounded-lg bg-white p-3 shadow-sm sm:p-4">
          <h2 className="mb-3 text-lg font-bold text-gray-800 sm:mb-4 sm:text-xl">Categories</h2>
          {loading ? (
            <div className="flex min-h-24 flex-1 items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <select
                value={selectedCategory?.id ?? ""}
                onChange={(event) => {
                  const category = categories.find((item) => item.id === Number(event.target.value));
                  if (category) {
                    onSelectCategory(category);
                  }
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 lg:hidden"
                aria-label="Select category"
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <div className="hidden lg:block lg:flex-1 lg:space-y-2 lg:overflow-y-auto lg:pr-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    className={`cursor-pointer rounded-lg px-3 py-2 text-left text-sm transition-all duration-200 lg:w-full lg:p-3 lg:transform lg:hover:scale-105 ${
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
            </>
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
