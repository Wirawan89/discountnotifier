import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';


// PUT - Update category refresh period
export async function PUT(request: Request) {
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

    const { categoryId, refreshPeriodDays } = await request.json();
    
    if (!categoryId || !refreshPeriodDays) {
      return NextResponse.json({ error: 'Category ID and refresh period are required' }, { status: 400 });
    }

    if (refreshPeriodDays < 1 || refreshPeriodDays > 365) {
      return NextResponse.json({ error: 'Refresh period must be between 1 and 365 days' }, { status: 400 });
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Update or create fetch log with new refresh period
    const updatedFetchLog = await prisma.categoryFetchLog.upsert({
      where: { categoryId },
      update: { refreshPeriodDays },
      create: {
        categoryId,
        refreshPeriodDays,
        lastFetchedAt: new Date(),
        storesFetched: 0,
        discountsFetched: 0,
        fetchStatus: 'pending'
      }
    });

    return NextResponse.json(updatedFetchLog);
  } catch (error) {
    console.error('Refresh period PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

