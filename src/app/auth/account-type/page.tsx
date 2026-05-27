export default function AccountTypePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <span className="text-2xl">🛍️</span>
          </div>
          <h1 className="mt-6 text-3xl font-extrabold text-gray-900">
            Choose your account type
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Select how you want to use DiscountNotifier.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <a
            href="/auth/signup"
            className="rounded-lg border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-xl">
              👤
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Sign up as User</h2>
            <p className="mt-2 text-sm text-gray-600">
              Browse categories, save favourites and receive offer notifications.
            </p>
          </a>

          <a
            href="/business/signup"
            className="rounded-lg border border-red-200 bg-white p-6 text-left shadow-sm transition hover:border-red-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-xl">
              🏪
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Sign up as Business / Merchant</h2>
            <p className="mt-2 text-sm text-gray-600">
              Register your store, promotion message and showcase images.
            </p>
          </a>
        </div>

        <div className="text-center text-sm">
          <a href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
            Back to sign in
          </a>
        </div>
      </div>
    </div>
  );
}
