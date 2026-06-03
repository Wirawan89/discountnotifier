export type LiveVerifiedOfferProfile =
  | "retail"
  | "retailShop"
  | "dining"
  | "entertainment"
  | "services"
  | "travel";

export const LIVE_VERIFIED_OFFER_VALID_DAYS_BY_PROFILE: Record<LiveVerifiedOfferProfile, number> = {
  retail: 7,
  retailShop: 7,
  dining: 2,
  entertainment: 5,
  services: 7,
  travel: 7,
};

export function getLiveVerifiedOfferValidDays(profile: LiveVerifiedOfferProfile = "retailShop"): number {
  return LIVE_VERIFIED_OFFER_VALID_DAYS_BY_PROFILE[profile] ?? LIVE_VERIFIED_OFFER_VALID_DAYS_BY_PROFILE.retailShop;
}

export function getLiveVerifiedOfferEndDate(
  startDate = new Date(),
  profile: LiveVerifiedOfferProfile = "retailShop"
): Date {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + getLiveVerifiedOfferValidDays(profile));
  return endDate;
}
