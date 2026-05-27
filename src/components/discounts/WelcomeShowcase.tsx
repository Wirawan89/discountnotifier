"use client";

import { useEffect, useMemo, useState } from "react";
import type { BusinessPromotion } from "./types";

function getMainWebsiteUrl(value: string) {
  const normalizedUrl = /^https?:\/\//i.test(value) ? value : `https://${value}`;

  try {
    const url = new URL(normalizedUrl);
    return `${url.origin}/`;
  } catch (_error) {
    return normalizedUrl;
  }
}

function getShowcaseOverlayText(promotion: BusinessPromotion) {
  if (promotion.aiImageTextEnabled && promotion.aiImageTextPrompt?.trim()) {
    return promotion.aiImageTextPrompt.trim();
  }

  return "";
}

export default function WelcomeShowcase() {
  const [promotions, setPromotions] = useState<BusinessPromotion[]>([]);
  const [showcaseImageIndexes, setShowcaseImageIndexes] = useState<Record<number, number>>({});

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

  const showcasePromotions = useMemo(
    () => promotions.filter((promotion) => promotion.showcaseImages.length > 0).slice(0, 8),
    [promotions]
  );

  const changeShowcaseImage = (promotionId: number, imageCount: number, direction: number) => {
    setShowcaseImageIndexes((currentIndexes) => {
      const currentIndex = currentIndexes[promotionId] ?? 0;
      const nextIndex = (currentIndex + direction + imageCount) % imageCount;

      return {
        ...currentIndexes,
        [promotionId]: nextIndex,
      };
    });
  };

  return (
    <div className="rounded-lg bg-white p-4 text-center shadow-md sm:p-8">
      <style>
        {`
          @keyframes showcaseTextDiagonal {
            0% {
              left: 0%;
              top: 100%;
              transform: translate(-110%, 10%) rotate(-24deg);
            }
            100% {
              left: 100%;
              top: 0%;
              transform: translate(-10%, -115%) rotate(-24deg);
            }
          }

          .animate-showcaseTextDiagonal {
            animation: showcaseTextDiagonal 9s linear infinite;
            will-change: left, top, transform;
          }

          .showcase-card {
            container-type: inline-size;
          }

          .showcase-sale-banner {
            isolation: isolate;
            min-width: 8rem;
            max-width: calc(100% - 1.5rem);
            overflow: hidden;
            padding: 0.55rem 1.45rem;
            background: #ef1d18;
            clip-path: polygon(
              0% 28%,
              5% 22%,
              2% 10%,
              10% 13%,
              13% 0%,
              19% 12%,
              25% 2%,
              31% 12%,
              38% 0%,
              44% 12%,
              50% 2%,
              56% 12%,
              63% 0%,
              69% 12%,
              75% 2%,
              81% 12%,
              88% 0%,
              91% 13%,
              98% 10%,
              95% 22%,
              100% 28%,
              93% 40%,
              100% 50%,
              93% 60%,
              100% 72%,
              95% 78%,
              98% 90%,
              91% 87%,
              88% 100%,
              81% 88%,
              75% 98%,
              69% 88%,
              63% 100%,
              56% 88%,
              50% 98%,
              44% 88%,
              38% 100%,
              31% 88%,
              25% 98%,
              19% 88%,
              13% 100%,
              10% 87%,
              2% 90%,
              5% 78%,
              0% 72%,
              7% 60%,
              0% 50%,
              7% 40%
            );
            filter:
              drop-shadow(0 4px 0 #111827)
              drop-shadow(0 12px 18px rgba(0, 0, 0, 0.3));
            font-size: 1.05rem;
            line-height: 1.05;
            text-overflow: ellipsis;
            text-shadow:
              2px 2px 0 #ffffff,
              -1px -1px 0 #ffffff,
              1px -1px 0 #ffffff,
              -1px 1px 0 #ffffff;
          }

          .showcase-sale-banner::before {
            content: "";
            position: absolute;
            inset: 4px;
            z-index: -1;
            background:
              radial-gradient(circle at 18% 28%, rgba(255, 255, 255, 0.8) 0 2px, transparent 2px 8px),
              radial-gradient(circle at 82% 72%, rgba(255, 255, 255, 0.55) 0 2px, transparent 2px 9px),
              linear-gradient(135deg, #fffdf0 0%, #ffe95f 42%, #ffc51c 100%);
            clip-path: inherit;
          }

          @container (min-width: 420px) {
            .showcase-sale-banner {
              padding: 0.65rem 1.75rem;
              font-size: 1.15rem;
            }
          }

          @container (max-width: 340px) {
            .showcase-sale-banner {
              padding: 0.45rem 1.1rem;
              font-size: 0.92rem;
            }
          }

          @container (max-width: 300px) {
            .showcase-sale-banner {
              padding: 0.4rem 0.95rem;
              font-size: 0.82rem;
            }
          }

          @media (max-width: 480px) {
            .showcase-sale-banner {
              padding: 0.45rem 1.1rem;
              font-size: 0.92rem;
            }
          }

          @media (max-width: 360px) {
            .showcase-sale-banner {
              padding: 0.4rem 0.95rem;
              font-size: 0.82rem;
            }
          }
        `}
      </style>
      <h2 className="mb-4 text-xl font-bold text-gray-800 sm:text-2xl">Welcome to DiscountNotifier</h2>
      <p className="text-gray-600 mb-6">
        Select a category to discover amazing discounts and offers in your area!
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {showcasePromotions.length > 0
          ? showcasePromotions.map((promotion, index) => {
              const mainWebsiteUrl = getMainWebsiteUrl(promotion.store?.url || promotion.url);
              const overlayText = getShowcaseOverlayText(promotion);
              const imageIndex = Math.min(
                showcaseImageIndexes[promotion.id] ?? 0,
                promotion.showcaseImages.length - 1
              );
              const currentImage = promotion.showcaseImages[imageIndex];
              const hasMultipleImages = promotion.showcaseImages.length > 1;

              return (
                <div
                  key={promotion.id}
                  className="showcase-card group relative aspect-[4/3] overflow-hidden rounded-lg border border-gray-200 bg-gray-100 text-left shadow-sm transition-all duration-200 hover:border-blue-300 hover:shadow-md"
                  style={{
                    animationDelay: `${(index + 1) * 100}ms`,
                    animationName: "fadeInUp",
                    animationDuration: "0.6s",
                    animationTimingFunction: "ease-out",
                    animationFillMode: "forwards",
                  }}
                >
                  <a href={mainWebsiteUrl} target="_blank" rel="noopener noreferrer" className="block h-full w-full">
                    <img
                      src={currentImage}
                      alt={`${promotion.businessName} showcase ${imageIndex + 1}`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {overlayText && (
                      <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        <div className="animate-showcaseTextDiagonal showcase-sale-banner absolute whitespace-nowrap font-black uppercase tracking-wide text-red-700">
                          {overlayText}
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white">
                      <div className="truncate text-sm font-semibold">{promotion.businessName}</div>
                      <div className="mt-1 text-[11px] uppercase tracking-wide">{promotion.membershipType}</div>
                    </div>
                  </a>
                  {hasMultipleImages && (
                    <>
                      <button
                        type="button"
                        aria-label={`Previous ${promotion.businessName} showcase image`}
                        className="absolute left-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-xl font-black leading-none text-white shadow-md backdrop-blur-sm transition hover:bg-black/75 focus:outline-none focus:ring-2 focus:ring-white"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          changeShowcaseImage(promotion.id, promotion.showcaseImages.length, -1);
                        }}
                      >
                        &lt;
                      </button>
                      <button
                        type="button"
                        aria-label={`Next ${promotion.businessName} showcase image`}
                        className="absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-xl font-black leading-none text-white shadow-md backdrop-blur-sm transition hover:bg-black/75 focus:outline-none focus:ring-2 focus:ring-white"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          changeShowcaseImage(promotion.id, promotion.showcaseImages.length, 1);
                        }}
                      >
                        &gt;
                      </button>
                      <div className="absolute right-3 top-3 z-20 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm backdrop-blur-sm">
                        {imageIndex + 1}/{promotion.showcaseImages.length}
                      </div>
                    </>
                  )}
                </div>
              );
            })
          : [1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div
                key={item}
                className="bg-gray-100 rounded-lg p-6 border-2 border-dashed border-gray-300 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 transform hover:scale-105"
                style={{
                  animationDelay: `${item * 100}ms`,
                  animationName: "fadeInUp",
                  animationDuration: "0.6s",
                  animationTimingFunction: "ease-out",
                  animationFillMode: "forwards",
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
