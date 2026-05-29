import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SmartFetcher } from '../../../../lib/smart-fetcher';


// GET: Get refresh period for a category or all categories
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const all = searchParams.get('all');

    if (all === 'true') {
      // Get all categories with their refresh periods
      const categories = await prisma.category.findMany({
        orderBy: {
          name: 'asc'
        }
      });

      const categoriesWithStats = await Promise.all(
        categories.map(async (category) => {
          const stats = await SmartFetcher.getFetchStats(category.id);
          return {
            id: category.id,
            name: category.name,
            refreshPeriodDays: stats?.refreshPeriodDays || 3,
            lastFetchedAt: stats?.lastFetchedAt,
            nextFetchDate: stats?.nextFetchDate,
            daysSinceLastFetch: stats?.daysSinceLastFetch,
            storesFetched: stats?.storesFetched || 0,
            discountsFetched: stats?.discountsFetched || 0,
            fetchStatus: stats?.fetchStatus || 'never_fetched'
          };
        })
      );

      return NextResponse.json({ categories: categoriesWithStats });
    }

    // Single category request
    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const stats = await SmartFetcher.getFetchStats(parseInt(categoryId));
    
    if (!stats) {
      return NextResponse.json({ 
        refreshPeriodDays: 3, // Default
        message: 'No fetch history found, using default refresh period'
      });
    }

    return NextResponse.json({
      refreshPeriodDays: stats.refreshPeriodDays,
      lastFetchedAt: stats.lastFetchedAt,
      nextFetchDate: stats.nextFetchDate,
      daysSinceLastFetch: stats.daysSinceLastFetch
    });

  } catch (error) {
    console.error('Error getting refresh period:', error);
    return NextResponse.json({ 
      error: 'Failed to get refresh period',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT: Update refresh period for a category
export async function PUT(request: Request) {
  try {
    const { categoryId, refreshPeriodDays } = await request.json();

    if (!categoryId || !refreshPeriodDays) {
      return NextResponse.json({ 
        error: 'Category ID and refresh period days are required' 
      }, { status: 400 });
    }

    if (refreshPeriodDays < 1 || refreshPeriodDays > 30) {
      return NextResponse.json({ 
        error: 'Refresh period must be between 1 and 30 days' 
      }, { status: 400 });
    }

    // Update the refresh period
    await SmartFetcher.updateRefreshPeriod(categoryId, refreshPeriodDays);

    return NextResponse.json({
      message: `Refresh period updated to ${refreshPeriodDays} days`,
      refreshPeriodDays,
      categoryId
    });

  } catch (error) {
    console.error('Error updating refresh period:', error);
    return NextResponse.json({ 
      error: 'Failed to update refresh period',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
