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
    <div className="bg-red-600 text-white py-2 overflow-hidden">
      <div className="w-full px-4">
        <div className="flex items-center">
          <span className="font-bold mr-4">HOT DEALS:</span>
          <div className="flex-1 overflow-hidden">
            <div className="animate-marquee whitespace-nowrap">
              <span className="mr-8">{tickerText}</span>
              <span className="mr-8">{tickerText}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
