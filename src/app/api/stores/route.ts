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

function buildCountryWhere(country: string | null) {
  if (!country) {
    return {};
  }

  const normalizedCountry = normalizeCountry(country);

  if (normalizedCountry === DEFAULT_COUNTRY) {
    return {
      OR: [{ country: normalizedCountry }, { country: '' }],
    };
  }

  return { country: normalizedCountry };
}

function currentMonthlyWeek(date: Date) {
  return Math.min(4, Math.floor((date.getDate() - 1) / 7) + 1);
}

function isScheduledForDate(
  scheduleType: string,
  weeklyDays: number[],
  monthlyWeeks: number[],
  date: Date
) {
  if (scheduleType === 'daily' || scheduleType === 'one_off') {
    return true;
  }

  if (scheduleType === 'weekly') {
    const day = date.getDay() === 0 ? 7 : date.getDay();
    return weeklyDays.includes(day);
  }

  if (scheduleType === 'monthly') {
    return monthlyWeeks.includes(currentMonthlyWeek(date));
  }

  return true;
}

// GET: List all stores
export async function GET(request: Request) {
  console.log('HIT /api/stores');

  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const country = searchParams.get('country');
    const hideLeadOnly = searchParams.get('hideLeadOnly') === 'true';
    const now = new Date();

    const stores = await prisma.store.findMany({
      where: {
        ...(categoryId ? { categoryId: Number(categoryId) } : {}),
        ...buildCountryWhere(country),
        NOT: {
          locationSource: 'closed',
        },
        ...(hideLeadOnly
          ? {
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
            }
          : {}),
      },
      include: {
        category: true,
        discounts: {
          where: {
            endDate: {
              gte: now,
            },
          },
          orderBy: {
            endDate: 'asc',
          },
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
        name: 'asc',
      },
    });
    return NextResponse.json(
      stores.map((store) => ({
        ...store,
        promotions: store.promotions.filter((promotion) =>
          isScheduledForDate(
            promotion.scheduleType,
            promotion.weeklyDays,
            promotion.monthlyWeeks,
            now
          )
        ),
      }))
    );
  } catch (error) {
    console.error('Error in /api/stores:', error, JSON.stringify(error, null, 2));
    return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 });
  }
}

// POST: Add a new store
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const store = await prisma.store.create({
      data: {
        name: data.name,
        suburb: data.suburb,
        city: data.city || '',
        country: data.country || '',
        state: data.state || null,
        address: data.address || null,
        categoryId: data.categoryId,
        url: data.url,
        ownerId: data.ownerId,
        background: data.background || null,
        latitude: typeof data.latitude === 'number' ? data.latitude : null,
        longitude: typeof data.longitude === 'number' ? data.longitude : null,
        locationSource: data.locationSource || null,
      },
    });
    return NextResponse.json(store);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create store' }, { status: 500 });
  }
}
