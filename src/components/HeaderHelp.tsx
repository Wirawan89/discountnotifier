"use client";

import { useEffect, useRef, useState } from "react";

const helpItems = [
  {
    title: "offersNearby",
    description:
      "Find nearby offers from cafe, brunch, bars and beverage stores. Location access must be enabled.",
  },
  {
    title: "saleNearby",
    description:
      "Find nearby sales, deals, clearance and discounts from retail stores around your current location.",
  },
  {
    title: "Notification Bell",
    description:
      "Notifies you when stores match your selected preference categories and have verified sale, deal, clearance or discount activity.",
  },
  {
    title: "Categories",
    description:
      "Browse stores by category, search by store or suburb, share your location for Near Me sorting, review Current Offers, open Show Direction in Google Maps, and flag stores as Favourite so you can access them quickly from Categories.",
  },
  {
    title: "Business Sign-in",
    description:
      "For store owners who want to register their business and publish time-limited promotions to attract buyers when needed.",
  },
];

export default function HeaderHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-sm font-black text-blue-700 shadow-sm ring-1 ring-blue-100 transition hover:scale-105 hover:bg-blue-100 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:h-10 sm:w-10"
        aria-label="Open help"
        aria-expanded={isOpen}
      >
        ?
      </button>

      {isOpen && (
        <div className="fixed inset-x-3 top-16 z-50 max-h-[calc(100vh-5rem)] overflow-y-auto rounded-lg border border-gray-200 bg-white p-4 shadow-lg sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-96">
          <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Quick Help</h2>
              <p className="mt-1 text-xs text-gray-500">A quick guide to the main buttons.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full px-2 py-1 text-sm text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close help"
            >
              x
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {helpItems.map((item) => (
              <div key={item.title}>
                <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-1 text-xs leading-5 text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
