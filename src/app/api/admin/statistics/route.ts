import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';


export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (range) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }

    // Fetch all statistics in parallel
    const [
      userAccessStats,
      tokenUsageStats,
      fetchStats,
      aiPerformanceStats
    ] = await Promise.all([
      // User Access Statistics
      prisma.userAccessLog.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _count: {
          id: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      }),

      // Token Usage Statistics
      prisma.tokenUsageLog.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          category: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),

      // Fetch Performance Statistics
      prisma.aiPerformanceLog.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          category: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),

      // AI Performance Summary
      prisma.aiPerformanceLog.groupBy({
        by: ['provider'],
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _avg: {
          responseTime: true,
          successRate: true,
          dataQuality: true
        },
        _count: {
          id: true
        }
      })
    ]);

    // Transform user access stats
    const transformedUserAccessStats = userAccessStats.map(stat => ({
      date: stat.createdAt.toISOString().split('T')[0],
      count: stat._count.id
    }));

    // Transform token usage stats
    const transformedTokenUsageStats = tokenUsageStats.map(stat => ({
      date: stat.createdAt.toISOString().split('T')[0],
      provider: stat.provider,
      tokensUsed: stat.tokensUsed,
      cost: stat.cost || 0
    }));

    // Transform fetch stats
    const transformedFetchStats = fetchStats.map(stat => ({
      date: stat.createdAt.toISOString().split('T')[0],
      category: stat.category?.name || 'Unknown',
      provider: stat.provider,
      successRate: stat.successRate,
      responseTime: stat.responseTime,
      storesFound: stat.storesFound,
      discountsFound: stat.discountsFound
    }));

    // Transform AI performance stats
    const transformedAiPerformanceStats = aiPerformanceStats.map(stat => ({
      provider: stat.provider,
      avgResponseTime: stat._avg.responseTime || 0,
      avgSuccessRate: stat._avg.successRate || 0,
      avgDataQuality: stat._avg.dataQuality || 0,
      totalRequests: stat._count.id
    }));

    return NextResponse.json({
      userAccessStats: transformedUserAccessStats,
      tokenUsageStats: transformedTokenUsageStats,
      fetchStats: transformedFetchStats,
      aiPerformanceStats: transformedAiPerformanceStats
    });
  } catch (error) {
    console.error('Statistics GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

