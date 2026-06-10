"use client";

import { useEffect, useMemo, useState } from "react";
import type { BusinessPromotion } from "./types";

const fallbackDeals = [
  "20% off at Sydney Cafe",
  "50% off Electronics at TechStore",
  "Free Delivery at FashionHub",
  "Buy 1 Get 1 at MusicGear",
];

export default function HotDealsTicker() {
  const [promotions, setPromotions] = useState<BusinessPromotion[]>([]);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const response = await fetch("/api/business/promotions");
        if (response.ok) {
          const data = await response.json();
          setPromotions(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error fetching business promotions:", error);
      }
    };

    fetchPromotions();
  }, []);

  const tickerItems = useMemo(() => {
    if (promotions.length === 0) {
      return fallbackDeals;
    }

    return promotions.map(
      (promotion) => `${promotion.businessName}: ${promotion.promotionMessage}`
    );
  }, [promotions]);
  const tickerText = tickerItems.join(" • ");

  return (
    <div className="overflow-hidden border-b border-white/45 bg-gradient-to-r from-red-500/70 via-rose-500/55 to-amber-400/55 py-2 text-white shadow-[0_10px_28px_rgba(239,68,68,0.22)] backdrop-blur-2xl">
      <div className="relative w-full px-3 sm:px-4">
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-white/70" />
        <div className="flex items-center rounded-full border border-white/25 bg-white/15 px-3 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
          <span className="mr-3 shrink-0 rounded-full bg-white/25 px-3 py-1 text-xs font-black uppercase tracking-wide text-white shadow-sm sm:mr-4">
            Hot Deals
          </span>
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="animate-marquee whitespace-nowrap text-sm font-semibold drop-shadow-sm">
              <span className="mr-8">{tickerText}</span>
              <span className="mr-8">{tickerText}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
