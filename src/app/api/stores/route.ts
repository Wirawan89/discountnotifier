import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


// GET: List all stores
export async function GET() {
  console.log('HIT /api/stores');

  try {
    const stores = await prisma.store.findMany({
      include: { category: true },
    });
    return NextResponse.json(stores);
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
        categoryId: data.categoryId,
        url: data.url,
        ownerId: data.ownerId,
        background: data.background || null,
      },
    });
    return NextResponse.json(store);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create store' }, { status: 500 });
  }
}
