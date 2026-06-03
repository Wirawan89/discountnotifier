import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import Providers from "@/components/Providers";
import UserMenu from "@/components/UserMenu";
import NotificationBell from "@/components/NotificationBell";
import StoreSuggestionFeedback from "@/components/StoreSuggestionFeedback";
import HeaderHelp from "@/components/HeaderHelp";
import HeaderQuickSearch from "@/components/HeaderQuickSearch";
import MobileBottomNav from "@/components/MobileBottomNav";

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
              <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                <div className="flex min-h-16 items-center justify-between gap-2 py-2">
                  <Link
                    href="/"
                    className="flex min-w-0 items-center rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label="Go to DiscountNotifier home"
                  >
                    <h1 className="truncate text-base font-bold text-gray-900 sm:text-xl">
                      🛍️ DiscountNotifier
                    </h1>
                  </Link>
                  
                  <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
                    <a
                      href="/business/signin"
                      className="inline-flex min-h-9 items-center rounded-md border border-red-200 px-2 text-xs font-medium text-red-700 hover:bg-red-50 sm:min-h-10 sm:px-3 sm:text-sm"
                    >
                      <span className="sm:hidden">Business</span>
                      <span className="hidden sm:inline">Sign-in (Business)</span>
                    </a>
                    <div className="hidden items-center gap-3 sm:flex">
                      <HeaderQuickSearch />
                      <StoreSuggestionFeedback />
                      <HeaderHelp />
                      <NotificationBell />
                    </div>
                    <UserMenu />
                  </div>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="pb-24 sm:pb-0">{children}</main>
            <MobileBottomNav />
          </div>
        </Providers>
      </body>
    </html>
  );
}
