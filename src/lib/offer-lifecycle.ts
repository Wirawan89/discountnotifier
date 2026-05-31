export const LIVE_VERIFIED_OFFER_VALID_DAYS = 2;

export function getLiveVerifiedOfferEndDate(startDate = new Date()): Date {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + LIVE_VERIFIED_OFFER_VALID_DAYS);
  return endDate;
}
