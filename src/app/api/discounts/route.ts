import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


// GET: Delete expired discounts, then list current offers.
export async function GET() {
  console.log('DISCOUNTS ROUTE FILE LOADED');
  console.log('HIT /api/discounts');
  try {
    const now = new Date();

    const deletedExpiredDiscounts = await prisma.discount.deleteMany({
      where: {
        endDate: {
          lt: now,
        },
      },
    });

    if (deletedExpiredDiscounts.count > 0) {
      console.log(`Deleted ${deletedExpiredDiscounts.count} expired discounts before returning current offers`);
    }

    const discounts = await prisma.discount.findMany({
      where: {
        endDate: {
          gte: now,
        },
      },
      include: { store: true },
    });
    return NextResponse.json(discounts);
  } catch (error) {
    console.error('Error in /api/discounts:', error, JSON.stringify(error, null, 2));
    return NextResponse.json({ error: 'Failed to fetch discounts' }, { status: 500 });
  }
}

// POST: Add a new discount
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const discount = await prisma.discount.create({
      data: {
        storeId: data.storeId,
        title: data.title,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        eCatalog: Array.isArray(data.eCatalog)
          ? data.eCatalog
          : data.image
            ? [data.image]
            : [],
      },
    });
    return NextResponse.json(discount);
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to create discount' }, { status: 500 });
  }
}
