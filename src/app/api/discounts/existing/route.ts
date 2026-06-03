import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_COUNTRY = 'Australia';

function normalizeCountry(country: string | null) {
  if (!country || country.trim().length === 0) {
    return DEFAULT_COUNTRY;
  }

  if (/^(usa|us|united states of america)$/i.test(country.trim())) {
    return 'United States';
  }

  if (/^nz$/i.test(country.trim())) {
    return 'New Zealand';
  }

  return country.trim();
}

function buildCountryWhere(country: string) {
  const normalizedCountry = normalizeCountry(country);

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

function currentMonthlyWeek(date: Date) {
  return Math.min(4, Math.floor((date.getDate() - 1) / 7) + 1);
}

function isScheduledForDate(scheduleType: string, weeklyDays: number[], monthlyWeeks: number[], date: Date) {
  if (scheduleType === 'daily' || scheduleType === 'one_off') return true;
  if (scheduleType === 'weekly') {
    const day = date.getDay() === 0 ? 7 : date.getDay();
    return weeklyDays.includes(day);
  }
  if (scheduleType === 'monthly') return monthlyWeeks.includes(currentMonthlyWeek(date));
  return true;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const country = normalizeCountry(searchParams.get('country'));

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const now = new Date();

    // Fetch existing stores and discounts for the category
    const stores = await prisma.store.findMany({
      where: {
        categoryId: parseInt(categoryId),
        ...buildCountryWhere(country),
        NOT: {
          locationSource: 'closed',
        },
        OR: [
          { sourceType: { not: 'google_business' } },
          {
            discounts: {
              some: {
                endDate: {
                  gte: now,
                },
              },
            },
          },
          {
            promotions: {
              some: {
                status: 'active',
                startDate: {
                  lte: now,
                },
                endDate: {
                  gte: now,
                },
              },
            },
          },
        ],
      },
      include: {
        discounts: {
          where: {
            endDate: {
              gte: now // Only active discounts
            }
          },
          orderBy: {
            endDate: 'asc'
          }
        },
        promotions: {
          where: {
            status: 'active',
            startDate: {
              lte: now,
            },
            endDate: {
              gte: now,
            },
          },
          orderBy: [{ priority: 'desc' }, { endDate: 'asc' }],
        },
      },
      orderBy: {
        name: 'asc'
      }
    });

    const scheduledStores = stores.map((store) => ({
      ...store,
      promotions: store.promotions.filter((promotion) =>
        isScheduledForDate(promotion.scheduleType, promotion.weeklyDays, promotion.monthlyWeeks, now)
      ),
    }));
    const totalStores = scheduledStores.length;
    const totalDiscounts = scheduledStores.reduce((sum, store) => sum + store.discounts.length, 0);
    const totalPromotions = scheduledStores.reduce((sum, store) => sum + store.promotions.length, 0);

    return NextResponse.json({
      message: `Found ${totalStores} ${country} stores with ${totalDiscounts} active discounts and ${totalPromotions} merchant promotions`,
      stores: scheduledStores,
      stats: {
        totalStores,
        totalDiscounts,
        totalPromotions,
        categoryId: parseInt(categoryId),
        country,
      }
    });

  } catch (error) {
    console.error('Error fetching existing discounts:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch existing discounts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
