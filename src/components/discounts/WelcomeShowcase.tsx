export default function WelcomeShowcase() {
  return (
    <div className="bg-white rounded-lg shadow-md p-8 text-center">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Welcome to DiscountNotifier</h2>
      <p className="text-gray-600 mb-6">
        Select a category from the left sidebar to discover amazing discounts and offers in your area!
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
          <div
            key={item}
            className="bg-gray-100 rounded-lg p-6 border-2 border-dashed border-gray-300 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 transform hover:scale-105"
            style={{
              animationDelay: `${item * 100}ms`,
              animation: "fadeInUp 0.6s ease-out forwards",
            }}
          >
            <div className="text-gray-400 text-sm">Featured Showcase {item}</div>
            <div className="text-xs text-gray-500 mt-2">Store owners can promote their products here</div>
          </div>
        ))}
      </div>
    </div>
  );
}
