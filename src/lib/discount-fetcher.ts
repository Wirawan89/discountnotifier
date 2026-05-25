import { PrismaClient } from '@prisma/client';
import { OfferVerifier } from './offer-verifier';

const prisma = new PrismaClient();

// Types for consistent data structure
export interface DiscountData {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  percentage?: number;
  coupon?: string;
  eCatalog?: string[];
}

export interface StoreData {
  name: string;
  url: string;
  suburb: string;
  city?: string;
  country?: string;
  contact?: string;
  address?: string;
  description?: string;
  catalogs?: string[];
  discounts: DiscountData[];
}

export interface FetchResult {
  success: boolean;
  stores: StoreData[];
  errors: string[];
  stats: {
    totalStores: number;
    totalDiscounts: number;
    validStores: number;
    validDiscounts: number;
  };
}

function getVerifierProfile(categoryName?: string): 'retail' | 'retailShop' | 'dining' {
  if (categoryName === 'Dining & Beverages' || categoryName === 'Caffe & Brunch') {
    return 'dining';
  }

  if (
    categoryName === 'Sport Gears' ||
    categoryName === 'Cosmetic & Perfumes' ||
    categoryName === 'Clothing & Fashions' ||
    categoryName === 'Electronic & Gadgets' ||
    categoryName === 'Baby & Kids' ||
    categoryName === 'Luxury & Designer' ||
    categoryName === 'HIFI Audio & Speakers' ||
    categoryName === 'Entertainment & Events' ||
    categoryName === 'Gifts & Flowers' ||
    categoryName === 'Travel & Accommodation' ||
    categoryName === 'Vitamins & Supplements' ||
    categoryName === 'Office & Stationery' ||
    categoryName === 'Games' ||
    categoryName === 'Trending Toys' ||
    categoryName === 'Tools & DIY' ||
    categoryName === 'Books & Magazines' ||
    categoryName === 'Cars Accessories' ||
    categoryName === 'Business Attire' ||
    categoryName === 'Leather Jackets & Bags' ||
    categoryName === 'Pets Supplies' ||
    categoryName === 'Traveling Accessories'
  ) {
    return 'retailShop';
  }

  return 'retail';
}

// Data validation utilities
export class DataValidator {
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && date > new Date('2020-01-01');
  }

  static isCurrentOrFutureDate(dateString: string): boolean {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }

  static isValidPercentage(percentage: any): boolean {
    return typeof percentage === 'number' && percentage > 0 && percentage <= 100;
  }

  static sanitizeString(str: any): string | undefined {
    if (typeof str !== 'string') return undefined;
    const sanitized = str.trim();
    return sanitized.length > 0 ? sanitized : undefined;
  }

  static validateStore(store: any): StoreData | null {
    try {
      // Required fields
      if (!store.name || !store.url) {
        return null;
      }

      const name = this.sanitizeString(store.name);
      const url = this.sanitizeString(store.url);
      const suburb = this.sanitizeString(store.suburb) || 'Sydney';

      if (!name || !url || !this.isValidUrl(url)) {
        return null;
      }

      // Validate and sanitize discounts
      const validDiscounts: DiscountData[] = [];
      if (Array.isArray(store.discounts)) {
        for (const discount of store.discounts) {
          const validDiscount = this.validateDiscount(discount);
          if (validDiscount) {
            validDiscounts.push(validDiscount);
          }
        }
      }

      return {
        name,
        url,
        suburb,
        city: this.sanitizeString(store.city) || 'Sydney',
        country: this.sanitizeString(store.country) || 'Australia',
        contact: this.sanitizeString(store.contact),
        address: this.sanitizeString(store.address),
        description: this.sanitizeString(store.description),
        catalogs: Array.isArray(store.catalogs) ? store.catalogs.filter((url: string) => this.isValidUrl(url)) : [],
        discounts: validDiscounts,
      };
    } catch (error) {
      console.error('Store validation error:', error);
      return null;
    }
  }

  static validateDiscount(discount: any): DiscountData | null {
    try {
      if (!discount.title) return null;

      const title = this.sanitizeString(discount.title);
      if (!title) return null;

      // Validate dates
      const startDate = discount.startDate || discount['start date'] || discount.start_date || new Date().toISOString().slice(0, 10);
      const endDate = discount.endDate || discount['end date'] || discount.end_date;

      if (!this.isValidDate(startDate) || !this.isValidDate(endDate) || !this.isCurrentOrFutureDate(endDate)) {
        return null;
      }

      // Validate percentage if provided
      let percentage: number | undefined;
      if (discount.percentage !== undefined) {
        if (this.isValidPercentage(discount.percentage)) {
          percentage = discount.percentage;
        }
      }

      return {
        title,
        description: this.sanitizeString(discount.description),
        startDate,
        endDate,
        percentage,
        coupon: this.sanitizeString(discount.coupon),
        eCatalog: Array.isArray(discount.eCatalog) ? discount.eCatalog.filter((url: string) => this.isValidUrl(url)) : [],
      };
    } catch (error) {
      console.error('Discount validation error:', error);
      return null;
    }
  }
}

// JSON parsing utilities
export class JsonParser {
  static extractJsonFromText(text: string): any {
    let cleanedText = text.trim();

    // Remove markdown code blocks
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.slice(7).trim();
      if (cleanedText.endsWith('```')) {
        cleanedText = cleanedText.slice(0, -3).trim();
      }
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.slice(3).trim();
      if (cleanedText.endsWith('```')) {
        cleanedText = cleanedText.slice(0, -3).trim();
      }
    }

    // Try direct parsing first
    try {
      return JSON.parse(cleanedText);
    } catch (error) {
      console.log('Direct JSON parsing failed, attempting extraction...');
    }

    // Try to extract JSON array
    const jsonStart = cleanedText.indexOf('[');
    if (jsonStart !== -1) {
      let bracketCount = 0;
      let jsonEnd = -1;

      for (let i = jsonStart; i < cleanedText.length; i++) {
        if (cleanedText[i] === '[') bracketCount++;
        if (cleanedText[i] === ']') bracketCount--;
        if (bracketCount === 0) {
          jsonEnd = i;
          break;
        }
      }

      if (jsonEnd !== -1) {
        const extractedJson = cleanedText.substring(jsonStart, jsonEnd + 1);
        try {
          return JSON.parse(extractedJson);
        } catch (extractError) {
          console.error('Extracted JSON parsing failed:', extractError);
        }
      }
    }

    // Try to extract JSON object
    const objectStart = cleanedText.indexOf('{');
    if (objectStart !== -1) {
      let braceCount = 0;
      let objectEnd = -1;

      for (let i = objectStart; i < cleanedText.length; i++) {
        if (cleanedText[i] === '{') braceCount++;
        if (cleanedText[i] === '}') braceCount--;
        if (braceCount === 0) {
          objectEnd = i;
          break;
        }
      }

      if (objectEnd !== -1) {
        const extractedJson = cleanedText.substring(objectStart, objectEnd + 1);
        try {
          return JSON.parse(extractedJson);
        } catch (extractError) {
          console.error('Extracted object JSON parsing failed:', extractError);
        }
      }
    }

    throw new Error('Could not extract valid JSON from response');
  }
}

// Rate limiting utility
export class RateLimiter {
  private static requestCounts: Map<string, { count: number; resetTime: number }> = new Map();
  private static readonly MAX_REQUESTS = 10; // Max requests per minute
  private static readonly WINDOW_MS = 60000; // 1 minute

  static async checkRateLimit(provider: string): Promise<boolean> {
    const now = Date.now();
    const key = `${provider}_${Math.floor(now / this.WINDOW_MS)}`;
    
    const current = this.requestCounts.get(key) || { count: 0, resetTime: now + this.WINDOW_MS };
    
    if (now > current.resetTime) {
      this.requestCounts.set(key, { count: 1, resetTime: now + this.WINDOW_MS });
      return true;
    }

    if (current.count >= this.MAX_REQUESTS) {
      return false;
    }

    current.count++;
    this.requestCounts.set(key, current);
    return true;
  }

  static async waitForRateLimit(provider: string): Promise<void> {
    while (!(await this.checkRateLimit(provider))) {
      console.log(`Rate limit reached for ${provider}, waiting...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Main fetcher class
export class DiscountFetcher {
  private static createGenericVerifiedDiscount(
    storeName: string,
    matchedUrl: string,
    matchedKeywords: string[],
    categoryName?: string
  ): DiscountData {
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const matchedText = matchedKeywords.length > 0 ? matchedKeywords.join(', ') : 'offer';
    const hasEofyOffer = matchedKeywords.some((keyword) => /eofy|end of financial year/i.test(keyword));
    const hasHappyHour = matchedKeywords.some((keyword) => /happy hour/i.test(keyword));
    const profile = getVerifierProfile(categoryName);

    return {
      title:
        profile === 'dining'
          ? hasHappyHour
            ? `${storeName} Happy Hour and Special Offers`
            : `${storeName} Special Offers`
          : hasEofyOffer
            ? `${storeName} EOFY Deals`
            : `${storeName} current sale and offers`,
      description: `Offer wording found on the store website (${matchedText}). Check the store website for live availability.`,
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
      eCatalog: [matchedUrl],
    };
  }

  private static async keepOnlyVerifiedOffers(store: StoreData, categoryName?: string): Promise<StoreData> {
    if (store.discounts.length === 0) {
      const result = await OfferVerifier.verifyStoreOfferPages(store.url, store.catalogs, {
        country: store.country,
        profile: getVerifierProfile(categoryName),
      });

      if (!result.hasOffer || !result.matchedUrl) {
        return store;
      }

      console.log(
        `Verified offer wording for ${store.name} on ${result.matchedUrl}: ${result.matchedKeywords.join(', ')}`
      );

      return {
        ...store,
        discounts: [
          this.createGenericVerifiedDiscount(
            store.name,
            result.matchedUrl,
            result.matchedKeywords,
            categoryName
          ),
        ],
      };
    }

    const storeResult = await OfferVerifier.verifyStoreOfferPages(store.url, store.catalogs, {
      country: store.country,
      profile: getVerifierProfile(categoryName),
    });
    if (storeResult.hasOffer) {
      console.log(
        `Verified offer wording for ${store.name} on ${storeResult.matchedUrl}: ${storeResult.matchedKeywords.join(', ')}`
      );
      return store;
    }

    const verifiedDiscounts: DiscountData[] = [];

    for (const discount of store.discounts) {
      const discountResult = await OfferVerifier.verifyStoreOfferPages(
        store.url,
        discount.eCatalog || [],
        { country: store.country, profile: getVerifierProfile(categoryName) }
      );

      if (discountResult.hasOffer) {
        verifiedDiscounts.push(discount);
        console.log(
          `Verified offer wording for ${store.name} discount "${discount.title}" on ${discountResult.matchedUrl}: ${discountResult.matchedKeywords.join(', ')}`
        );
      } else {
        console.log(
          `No matching offer wording found for ${store.name} discount "${discount.title}". Checked: ${discountResult.checkedUrls.join(', ')}`
        );
      }
    }

    return {
      ...store,
      discounts: verifiedDiscounts,
    };
  }

  static async fetchAndValidate(
    provider: string,
    categoryName: string,
    fetchFunction: () => Promise<string>
  ): Promise<FetchResult> {
    const errors: string[] = [];
    const stores: StoreData[] = [];

    try {
      // Check rate limit
      await RateLimiter.waitForRateLimit(provider);

      // Fetch data from AI provider
      console.log(`Fetching data from ${provider} for category: ${categoryName}`);
      const rawResponse = await fetchFunction();

      // Parse JSON response
      let parsedData: any;
      try {
        parsedData = JsonParser.extractJsonFromText(rawResponse);
      } catch (parseError) {
        errors.push(`JSON parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
        return {
          success: false,
          stores: [],
          errors,
          stats: { totalStores: 0, totalDiscounts: 0, validStores: 0, validDiscounts: 0 }
        };
      }

      // Validate and process stores
      if (Array.isArray(parsedData)) {
        for (const storeData of parsedData) {
          const validatedStore = DataValidator.validateStore(storeData);
          if (validatedStore) {
            stores.push(await this.keepOnlyVerifiedOffers(validatedStore, categoryName));
          } else {
            errors.push(`Invalid store data: ${JSON.stringify(storeData).substring(0, 100)}...`);
          }
        }
      } else if (parsedData && typeof parsedData === 'object') {
        // Handle single store response
        const validatedStore = DataValidator.validateStore(parsedData);
        if (validatedStore) {
          stores.push(await this.keepOnlyVerifiedOffers(validatedStore, categoryName));
        } else {
          errors.push('Invalid single store data');
        }
      } else {
        errors.push('Response is not an array or object');
      }

      // Calculate statistics
      const totalStores = stores.length;
      const totalDiscounts = stores.reduce((sum, store) => sum + store.discounts.length, 0);
      const validStores = stores.length;
      const validDiscounts = stores.reduce((sum, store) => sum + store.discounts.length, 0);

      return {
        success: validStores > 0,
        stores,
        errors,
        stats: {
          totalStores,
          totalDiscounts,
          validStores,
          validDiscounts,
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Fetch error: ${errorMessage}`);
      
      return {
        success: false,
        stores: [],
        errors,
        stats: { totalStores: 0, totalDiscounts: 0, validStores: 0, validDiscounts: 0 }
      };
    }
  }

  static async saveToDatabase(
    stores: StoreData[],
    categoryId: number,
    ownerId: number = 1
  ): Promise<{ savedStores: number; savedDiscounts: number; errors: string[] }> {
    const errors: string[] = [];
    let savedStores = 0;
    let savedDiscounts = 0;

    for (const storeData of stores) {
      try {
        // Upsert store
        const dbStore = await prisma.store.upsert({
          where: { url: storeData.url },
          update: {
            name: storeData.name,
            suburb: storeData.suburb,
            city: storeData.city,
            country: storeData.country,
            contact: storeData.contact,
            address: storeData.address,
            description: storeData.description,
            catalogs: storeData.catalogs,
            categoryId: categoryId,
          },
          create: {
            name: storeData.name,
            url: storeData.url,
            suburb: storeData.suburb,
            city: storeData.city,
            country: storeData.country,
            contact: storeData.contact,
            address: storeData.address,
            description: storeData.description,
            catalogs: storeData.catalogs,
            categoryId: categoryId,
            ownerId: ownerId,
          },
        });

        savedStores++;

        // Process discounts
        for (const discountData of storeData.discounts) {
          try {
            const dbDiscount = await prisma.discount.upsert({
              where: {
                storeId_title: {
                  storeId: dbStore.id,
                  title: discountData.title,
                },
              },
              update: {
                description: discountData.description,
                startDate: new Date(discountData.startDate),
                endDate: new Date(discountData.endDate),
                percentage: discountData.percentage,
                coupon: discountData.coupon,
                eCatalog: discountData.eCatalog,
              },
              create: {
                storeId: dbStore.id,
                title: discountData.title,
                description: discountData.description,
                startDate: new Date(discountData.startDate),
                endDate: new Date(discountData.endDate),
                percentage: discountData.percentage,
                coupon: discountData.coupon,
                eCatalog: discountData.eCatalog,
              },
            });

            savedDiscounts++;
            console.log(`Saved discount: ${discountData.title} for store: ${storeData.name}`);

          } catch (discountError) {
            const errorMsg = `Failed to save discount ${discountData.title}: ${discountError instanceof Error ? discountError.message : 'Unknown error'}`;
            errors.push(errorMsg);
            console.error(errorMsg);
          }
        }

        const activeTitleFilter =
          storeData.discounts.length > 0
            ? { title: { notIn: storeData.discounts.map((discount) => discount.title) } }
            : {};

        const deletedStaleDiscounts = await prisma.discount.deleteMany({
          where: {
            storeId: dbStore.id,
            endDate: {
              gte: new Date(),
            },
            ...activeTitleFilter,
          },
        });

        if (deletedStaleDiscounts.count > 0) {
          console.log(
            `Removed ${deletedStaleDiscounts.count} unverified current discount(s) for store: ${storeData.name}`
          );
        }

      } catch (storeError) {
        const errorMsg = `Failed to save store ${storeData.name}: ${storeError instanceof Error ? storeError.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    return { savedStores, savedDiscounts, errors };
  }
}
