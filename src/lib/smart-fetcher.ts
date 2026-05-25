import { PrismaClient } from '@prisma/client';
import { DiscountFetcher } from './discount-fetcher';

const prisma = new PrismaClient();
const DAY_MS = 24 * 60 * 60 * 1000;
const FETCH_LOCK_TTL_MS = 15 * 60 * 1000;
const DEFAULT_COUNTRY = 'Australia';

export interface FetchResult {
  success: boolean;
  message: string;
  data?: any;
  stats?: any;
  errors?: string[];
  wasCached?: boolean;
  nextFetchDate?: Date;
}

export class SmartFetcher {
  private static buildCountryWhere(country?: string) {
    const normalizedCountry = country && country.trim().length > 0 ? country.trim() : DEFAULT_COUNTRY;

    if (normalizedCountry === DEFAULT_COUNTRY) {
      return {
        OR: [
          { country: DEFAULT_COUNTRY },
          { country: '' },
        ],
      };
    }

    return { country: normalizedCountry };
  }

  private static getRefreshPeriodMs(refreshPeriodDays: number): number {
    return Math.max(refreshPeriodDays, 1) * DAY_MS;
  }

  private static getNextFetchDate(lastFetchedAt: Date, refreshPeriodDays: number): Date {
    return new Date(lastFetchedAt.getTime() + this.getRefreshPeriodMs(refreshPeriodDays));
  }

  private static async getCachedCategoryData(categoryId: number, country?: string) {
    const existingStores = await prisma.store.findMany({
      where: {
        categoryId,
        ...this.buildCountryWhere(country),
      },
      include: {
        discounts: {
          where: {
            endDate: { gte: new Date() }
          }
        }
      }
    });

    const totalStores = existingStores.length;
    const totalDiscounts = existingStores.reduce((sum, store) => sum + store.discounts.length, 0);

    return {
      existingStores,
      totalStores,
      totalDiscounts
    };
  }

  private static async reserveCategoryFetch(categoryId: number): Promise<{
    reserved: boolean;
    lastFetchedAt?: Date;
    refreshPeriodDays: number;
    nextFetchDate?: Date;
    daysSinceLastFetch?: number;
    fetchStatus?: string;
    reason?: 'cached' | 'in_progress' | 'race_lost';
  }> {
    const now = new Date();

    try {
      return await prisma.$transaction(async (tx) => {
        const fetchLog = await tx.categoryFetchLog.findUnique({
          where: { categoryId }
        });

        if (!fetchLog) {
          await tx.categoryFetchLog.create({
            data: {
              categoryId,
              lastFetchedAt: now,
              refreshPeriodDays: 1,
              storesFetched: 0,
              discountsFetched: 0,
              fetchStatus: 'fetching',
              updatedAt: now
            }
          });

          return {
            reserved: true,
            lastFetchedAt: now,
            refreshPeriodDays: 1,
            nextFetchDate: this.getNextFetchDate(now, 1),
            daysSinceLastFetch: 0,
            fetchStatus: 'fetching'
          };
        }

        const refreshPeriodDays = Math.max(fetchLog.refreshPeriodDays, 1);
        const timeSinceLastFetch = now.getTime() - fetchLog.lastFetchedAt.getTime();
        const daysSinceLastFetch = Math.floor(timeSinceLastFetch / DAY_MS);
        const nextFetchDate = this.getNextFetchDate(fetchLog.lastFetchedAt, refreshPeriodDays);
        const fetchingStartedRecently =
          fetchLog.fetchStatus === 'fetching' &&
          now.getTime() - fetchLog.updatedAt.getTime() < FETCH_LOCK_TTL_MS;

        if (fetchingStartedRecently) {
          return {
            reserved: false,
            lastFetchedAt: fetchLog.lastFetchedAt,
            refreshPeriodDays,
            nextFetchDate,
            daysSinceLastFetch,
            fetchStatus: fetchLog.fetchStatus,
            reason: 'in_progress'
          };
        }

        if (timeSinceLastFetch < this.getRefreshPeriodMs(refreshPeriodDays)) {
          return {
            reserved: false,
            lastFetchedAt: fetchLog.lastFetchedAt,
            refreshPeriodDays,
            nextFetchDate,
            daysSinceLastFetch,
            fetchStatus: fetchLog.fetchStatus,
            reason: 'cached'
          };
        }

        const updateResult = await tx.categoryFetchLog.updateMany({
          where: {
            categoryId,
            lastFetchedAt: fetchLog.lastFetchedAt,
            updatedAt: fetchLog.updatedAt,
            fetchStatus: fetchLog.fetchStatus
          },
          data: {
            lastFetchedAt: now,
            fetchStatus: 'fetching',
            errorMessage: null,
            updatedAt: now
          }
        });

        if (updateResult.count === 0) {
          return {
            reserved: false,
            lastFetchedAt: fetchLog.lastFetchedAt,
            refreshPeriodDays,
            nextFetchDate,
            daysSinceLastFetch,
            fetchStatus: fetchLog.fetchStatus,
            reason: 'race_lost'
          };
        }

        return {
          reserved: true,
          lastFetchedAt: now,
          refreshPeriodDays,
          nextFetchDate: this.getNextFetchDate(now, refreshPeriodDays),
          daysSinceLastFetch: 0,
          fetchStatus: 'fetching'
        };
      });
    } catch (error) {
      console.error('Error reserving category fetch:', error);
      return {
        reserved: false,
        refreshPeriodDays: 1,
        reason: 'race_lost'
      };
    }
  }

  /**
   * Check if a category needs to be refreshed based on last fetch date and refresh period
   */
  static async shouldRefreshCategory(categoryId: number): Promise<{
    shouldRefresh: boolean;
    lastFetchedAt?: Date;
    refreshPeriodDays: number;
    nextFetchDate?: Date;
    daysSinceLastFetch?: number;
  }> {
    try {
      // Get or create fetch log for the category
      const fetchLog = await prisma.categoryFetchLog.findUnique({
        where: { categoryId },
        include: { category: true }
      });

      if (!fetchLog) {
        // First time fetching this category
        return {
          shouldRefresh: true,
          refreshPeriodDays: 3, // Default
          nextFetchDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        };
      }

      const now = new Date();
      const lastFetched = fetchLog.lastFetchedAt;
      const refreshPeriodMs = this.getRefreshPeriodMs(fetchLog.refreshPeriodDays);
      const timeSinceLastFetch = now.getTime() - lastFetched.getTime();
      const daysSinceLastFetch = Math.floor(timeSinceLastFetch / DAY_MS);
      const nextFetchDate = new Date(lastFetched.getTime() + refreshPeriodMs);

      const shouldRefresh = timeSinceLastFetch >= refreshPeriodMs;

      return {
        shouldRefresh,
        lastFetchedAt: lastFetched,
        refreshPeriodDays: fetchLog.refreshPeriodDays,
        nextFetchDate,
        daysSinceLastFetch
      };
    } catch (error) {
      console.error('Error checking refresh status:', error);
      // Default to refresh if there's an error
      return {
        shouldRefresh: true,
        refreshPeriodDays: 3
      };
    }
  }

  /**
   * Update the fetch log after a successful fetch
   */
  static async updateFetchLog(
    categoryId: number,
    stats: { totalStores: number; totalDiscounts: number },
    status: 'success' | 'failed' | 'partial' = 'success',
    errorMessage?: string
  ): Promise<void> {
    try {
      await prisma.categoryFetchLog.upsert({
        where: { categoryId },
        update: {
          lastFetchedAt: new Date(),
          storesFetched: stats.totalStores,
          discountsFetched: stats.totalDiscounts,
          fetchStatus: status,
          errorMessage,
          updatedAt: new Date()
        },
        create: {
          categoryId,
          lastFetchedAt: new Date(),
          storesFetched: stats.totalStores,
          discountsFetched: stats.totalDiscounts,
          fetchStatus: status,
          errorMessage,
          refreshPeriodDays: 3 // Default
        }
      });
    } catch (error) {
      console.error('Error updating fetch log:', error);
    }
  }

  /**
   * Update the refresh period for a category
   */
  static async updateRefreshPeriod(categoryId: number, refreshPeriodDays: number): Promise<void> {
    try {
      await prisma.categoryFetchLog.upsert({
        where: { categoryId },
        update: {
          refreshPeriodDays,
          updatedAt: new Date()
        },
        create: {
          categoryId,
          refreshPeriodDays,
          lastFetchedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error updating refresh period:', error);
    }
  }

  /**
   * Get fetch statistics for a category
   */
  static async getFetchStats(categoryId: number): Promise<{
    lastFetchedAt?: Date;
    refreshPeriodDays: number;
    nextFetchDate?: Date;
    daysSinceLastFetch?: number;
    storesFetched: number;
    discountsFetched: number;
    fetchStatus: string;
  } | null> {
    try {
      const fetchLog = await prisma.categoryFetchLog.findUnique({
        where: { categoryId }
      });

      if (!fetchLog) {
        return null;
      }

      const now = new Date();
      const timeSinceLastFetch = now.getTime() - fetchLog.lastFetchedAt.getTime();
      const daysSinceLastFetch = Math.floor(timeSinceLastFetch / DAY_MS);
      const nextFetchDate = this.getNextFetchDate(fetchLog.lastFetchedAt, fetchLog.refreshPeriodDays);

      return {
        lastFetchedAt: fetchLog.lastFetchedAt,
        refreshPeriodDays: fetchLog.refreshPeriodDays,
        nextFetchDate,
        daysSinceLastFetch,
        storesFetched: fetchLog.storesFetched,
        discountsFetched: fetchLog.discountsFetched,
        fetchStatus: fetchLog.fetchStatus
      };
    } catch (error) {
      console.error('Error getting fetch stats:', error);
      return null;
    }
  }

  /**
   * Smart fetch function that checks cache before making API calls
   */
  static async smartFetch(
    categoryId: number,
    categoryName: string,
    fetchFunction: () => Promise<any>,
    providers: string[] = ['openrouter', 'claude'],
    country: string = DEFAULT_COUNTRY
  ): Promise<FetchResult> {
    try {
      const reservation = await this.reserveCategoryFetch(categoryId);

      if (!reservation.reserved) {
        const { existingStores, totalStores, totalDiscounts } = await this.getCachedCategoryData(categoryId, country);
        const nextFetchDate = reservation.nextFetchDate;
        const daysUntilRefresh = nextFetchDate
          ? Math.max(0, Math.ceil((nextFetchDate.getTime() - Date.now()) / DAY_MS))
          : 1;
        const message =
          reservation.reason === 'in_progress'
            ? `A fetch for ${categoryName} is already in progress. Showing cached data to avoid duplicate token usage.`
            : `Using cached data (last updated ${reservation.daysSinceLastFetch ?? 0} days ago). Next refresh in ${daysUntilRefresh} day${daysUntilRefresh === 1 ? '' : 's'}.`;

        return {
          success: true,
          message,
          data: existingStores,
          stats: {
            totalStores,
            totalDiscounts,
            wasCached: true,
            refreshPeriodDays: reservation.refreshPeriodDays,
            fetchStatus: reservation.fetchStatus,
            duplicateFetchPrevented: true
          },
          wasCached: true,
          nextFetchDate
        };
      }

      // Need to refresh - make API calls
      console.log(`Fetching fresh data for category: ${categoryName} (daily category fetch reserved in database)`);

      // Use the existing DiscountFetcher for API calls
      const fetchResult = await DiscountFetcher.fetchAndValidate(
        providers.join('+'),
        categoryName,
        fetchFunction
      );

      if (fetchResult.success) {
        // Save to database
        const saveResult = await DiscountFetcher.saveToDatabase(
          fetchResult.stores,
          categoryId
        );

        // Update fetch log
        await this.updateFetchLog(categoryId, {
          totalStores: fetchResult.stats.totalStores,
          totalDiscounts: fetchResult.stats.totalDiscounts
        });

        return {
          success: true,
          message: `Successfully fetched fresh data for ${categoryName}`,
          data: fetchResult.stores,
          stats: {
            ...fetchResult.stats,
            wasCached: false,
            refreshPeriodDays: reservation.refreshPeriodDays,
            fetchStatus: 'success',
            duplicateFetchPrevented: false
          },
          wasCached: false,
          nextFetchDate: reservation.nextFetchDate
        };
      } else {
        // Update fetch log with error
        await this.updateFetchLog(
          categoryId,
          { totalStores: 0, totalDiscounts: 0 },
          'failed',
          fetchResult.errors.join(', ')
        );

        return {
          success: false,
          message: 'Failed to fetch fresh data',
          errors: fetchResult.errors,
          stats: fetchResult.stats
        };
      }
    } catch (error) {
      console.error('Error in smart fetch:', error);
      return {
        success: false,
        message: 'Error during smart fetch',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
}
