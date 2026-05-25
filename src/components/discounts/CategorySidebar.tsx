import type { Category } from "./types";

type CategorySidebarProps = {
  categories: Category[];
  loading: boolean;
  selectedCategory: Category | null;
  onSelectCategory: (category: Category) => void;
};

export default function CategorySidebar({
  categories,
  loading,
  selectedCategory,
  onSelectCategory,
}: CategorySidebarProps) {
  return (
    <aside className="w-1/3 bg-white shadow-md">
      <div className="p-4 h-full flex flex-col">
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
    </aside>
  );
}
