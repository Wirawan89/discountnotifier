import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';


export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch all statistics in parallel
    const [
      totalUsers,
      totalStores,
      totalDiscounts,
      totalCategories,
      activeApiProviders,
      todayUserAccess,
      todayTokenUsage,
      todayFetchOperations
    ] = await Promise.all([
      prisma.user.count(),
      prisma.store.count(),
      prisma.discount.count(),
      prisma.category.count(),
      prisma.apiConfiguration.count({ where: { isEnabled: true } }),
      prisma.userAccessLog.count({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        }
      }),
      prisma.tokenUsageLog.count({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        }
      }),
      prisma.categoryFetchLog.count({
        where: {
          updatedAt: {
            gte: today,
            lt: tomorrow
          }
        }
      })
    ]);

    return NextResponse.json({
      totalUsers,
      totalStores,
      totalDiscounts,
      totalCategories,
      activeApiProviders,
      todayUserAccess,
      todayTokenUsage,
      todayFetchOperations
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

