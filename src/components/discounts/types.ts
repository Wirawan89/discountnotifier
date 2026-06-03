export type Category = {
  id: number;
  name: string;
};

export type Store = {
  id: number;
  name: string;
  suburb: string;
  city?: string | null;
  country?: string | null;
  state?: string | null;
  address?: string | null;
  contact?: string | null;
  url: string;
  sourceType?: string | null;
  googleBusinessUrl?: string | null;
  websiteUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationSource?: string | null;
  background?: string | null;
  categoryId: number;
  discounts?: Discount[];
  promotions?: StorePromotion[];
};

export type Discount = {
  id: number;
  storeId: number;
  title: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  updatedAt?: string;
  image?: string | null;
  coupon?: string | null;
  eCatalog?: string[];
};

export type StorePromotion = {
  id: number;
  storeId: number;
  message: string;
  url?: string | null;
  scheduleType?: string;
  weeklyDays?: number[];
  monthlyWeeks?: number[];
  startDate: string;
  endDate: string;
  priority?: number;
  status?: string;
};

export type ShareData = {
  store: Store;
  discount?: Discount;
};

export type BusinessPromotion = {
  id: number;
  businessName: string;
  url: string;
  suburb: string;
  country: string;
  category: Category;
  store?: Store | null;
  promotionMessage: string;
  promotionUrl?: string | null;
  promotionStartDate: string;
  promotionEndDate: string;
  showcaseImages: string[];
  aiImageTextEnabled?: boolean;
  aiImageTextPrompt?: string | null;
  membershipType: "Platinum" | "Gold" | "Silver" | string;
};
