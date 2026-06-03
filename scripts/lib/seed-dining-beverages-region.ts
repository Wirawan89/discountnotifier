import { RegionalStoreSeed, seedRegionalStores } from "./seed-regional-stores";

export type DiningBeverageVenue = RegionalStoreSeed;

export async function seedDiningBeverageRegion(regionName: string, venues: DiningBeverageVenue[]) {
  return seedRegionalStores({
    regionName,
    categoryName: "Dining & Beverages",
    verifierProfile: "dining",
    stores: venues,
  });
}
