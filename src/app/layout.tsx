import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import Providers from "@/components/Providers";
import UserMenu from "@/components/UserMenu";
import NotificationBell from "@/components/NotificationBell";

export const metadata: Metadata = {
  title: "DiscountNotifier - Find the Best Deals in NSW",
  description: "Discover current and upcoming discounts in stores across NSW, Australia. Get notified about the best deals in your area.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex min-h-16 items-center justify-between gap-3 py-2">
                  <Link
                    href="/"
                    className="flex min-w-0 items-center rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label="Go to DiscountNotifier home"
                  >
                    <h1 className="truncate text-lg font-bold text-gray-900 sm:text-xl">
                      🛍️ DiscountNotifier
                    </h1>
                  </Link>
                  
                  <div className="flex shrink-0 items-center gap-2 sm:gap-4">
                    <a
                      href="/business/signin"
                      className="inline-flex rounded-md border border-red-200 px-2 py-2 text-xs font-medium text-red-700 hover:bg-red-50 sm:px-3 sm:text-sm"
                    >
                      Sign-in (Business)
                    </a>
                    <NotificationBell />
                    <UserMenu />
                  </div>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main>{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
