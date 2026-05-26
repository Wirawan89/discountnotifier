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
  url: string;
  background?: string | null;
  categoryId: number;
};

export type Discount = {
  id: number;
  storeId: number;
  title: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  image?: string | null;
  coupon?: string | null;
};

export type ShareData = {
  store: Store;
  discount?: Discount;
};
