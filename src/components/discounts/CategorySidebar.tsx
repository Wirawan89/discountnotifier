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
        <div className="flex flex-nowrap items-start gap-3 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
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
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-800 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm lg:hidden"
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
  const activeClass = active
    ? "border-red-200/75 bg-red-600/85 text-white shadow-[0_16px_35px_rgba(220,38,38,0.34)] ring-red-200/75"
    : "border-red-200/70 bg-red-500/78 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_12px_28px_rgba(220,38,38,0.24)] ring-red-100/70 hover:bg-red-600/85";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`group relative h-[58px] w-[170px] shrink-0 overflow-hidden rounded-[1.35rem] border px-4 py-2 text-center ring-1 backdrop-blur-2xl transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02] ${activeClass} ${
        loading ? "cursor-not-allowed opacity-60" : ""
      }`}
      style={{ width: "170px", height: "58px" }}
    >
      <span className="pointer-events-none absolute inset-x-5 top-1 h-px bg-white/70" />
      <span className="pointer-events-none absolute -left-8 -top-10 h-20 w-20 rounded-full bg-white/30 blur-2xl transition-transform duration-300 group-hover:translate-x-4" />
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/24 via-transparent to-red-950/18" />
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs leading-none text-yellow-300 drop-shadow animate-pulse">
        ✦
      </span>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs leading-none text-yellow-300 drop-shadow transition-transform duration-200 group-hover:rotate-12">
        ✦
      </span>
      <span className="relative flex h-full items-center justify-center">
        <span className="w-full min-w-0 text-center">
          <span
            className="block text-sm font-black leading-none text-white"
            style={{ textShadow: "0 1px 8px rgba(0,0,0,0.38)" }}
          >
            {label}
          </span>
          {description && (
            <span className="mt-1 block font-bold leading-tight text-white/90" style={{ fontSize: "9px", textShadow: "0 1px 5px rgba(0,0,0,0.3)" }}>
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
