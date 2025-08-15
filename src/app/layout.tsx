import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import UserMenu from "@/components/UserMenu";
import NotificationBell from "@/components/NotificationBell";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center">
                    <h1 className="text-xl font-bold text-gray-900">
                      🛍️ DiscountNotifier
                    </h1>
                  </div>
                  
                  <div className="flex items-center space-x-4">
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
