import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: List all discounts
export async function GET(req: Request) {
  console.log('DISCOUNTS ROUTE FILE LOADED');
  console.log('HIT /api/discounts');
  try {
    const discounts = await prisma.discount.findMany({
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
        image: data.image || null,
      },
    });
    return NextResponse.json(discount);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create discount' }, { status: 500 });
  }
}
