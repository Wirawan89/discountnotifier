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
      className="fixed inset-x-4 bottom-4 z-40 rounded-[2rem] border border-white/50 bg-white/35 px-3 py-2 shadow-[0_18px_45px_rgba(15,23,42,0.22)] ring-1 ring-black/5 backdrop-blur-2xl supports-[backdrop-filter]:bg-white/25 sm:hidden"
      aria-label="Mobile quick actions"
    >
      <div className="pointer-events-none absolute inset-x-6 top-1 h-px bg-white/80" />
      <div className="pointer-events-none absolute inset-x-10 bottom-1 h-px bg-black/5" />
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/45 bg-white/35 text-sky-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_8px_20px_rgba(14,165,233,0.16)] ring-1 ring-sky-200/40 backdrop-blur-xl transition hover:scale-105 hover:bg-white/55 focus:outline-none focus:ring-2 focus:ring-sky-500"
          aria-label="DiscountNotifier home"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m3 10.5 9-7 9 7M5.5 9v10.5h4.75v-6h3.5v6h4.75V9" />
          </svg>
        </Link>
        <HeaderQuickSearch ariaLabel="Quick search stores on mobile" globalOpenMode="mobile" />
        <StoreSuggestionFeedback />
        <HeaderHelp />
        <NotificationBell />
      </div>
    </nav>
  );
}
