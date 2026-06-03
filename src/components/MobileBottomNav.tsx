"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import HeaderHelp from "@/components/HeaderHelp";
import HeaderQuickSearch from "@/components/HeaderQuickSearch";
import NotificationBell from "@/components/NotificationBell";
import StoreSuggestionFeedback from "@/components/StoreSuggestionFeedback";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const isHiddenPage =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/business") ||
    pathname.startsWith("/profile");

  if (isHiddenPage) {
    return null;
  }

  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-40 rounded-full border border-gray-200 bg-white/95 px-3 py-2 shadow-2xl backdrop-blur sm:hidden"
      aria-label="Mobile quick actions"
    >
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-sky-200 bg-sky-50 text-sky-700 shadow-sm ring-1 ring-sky-100 transition hover:scale-105 hover:bg-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
          aria-label="DiscountNotifier home"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m3 10.5 9-7 9 7M5.5 9v10.5h4.75v-6h3.5v6h4.75V9" />
          </svg>
        </Link>
        <HeaderQuickSearch />
        <StoreSuggestionFeedback />
        <HeaderHelp />
        <NotificationBell />
      </div>
    </nav>
  );
}
