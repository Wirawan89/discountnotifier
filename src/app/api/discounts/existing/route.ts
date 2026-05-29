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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const country = normalizeCountry(searchParams.get('country'));

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    // Fetch existing stores and discounts for the category
    const stores = await prisma.store.findMany({
      where: {
        categoryId: parseInt(categoryId),
        ...buildCountryWhere(country),
      },
      include: {
        discounts: {
          where: {
            endDate: {
              gte: new Date() // Only active discounts
            }
          },
          orderBy: {
            endDate: 'asc'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    const totalStores = stores.length;
    const totalDiscounts = stores.reduce((sum, store) => sum + store.discounts.length, 0);

    return NextResponse.json({
      message: `Found ${totalStores} ${country} stores with ${totalDiscounts} active discounts`,
      stores,
      stats: {
        totalStores,
        totalDiscounts,
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
