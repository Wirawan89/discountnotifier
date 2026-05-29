import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';


// GET - Fetch all API configurations
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

    const configs = await prisma.apiConfiguration.findMany({
      orderBy: { priority: 'asc' }
    });

    return NextResponse.json(configs);
  } catch (error) {
    console.error('API config GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update API configuration
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

    const config = await request.json();
    
    if (!config.id) {
      return NextResponse.json({ error: 'Configuration ID is required' }, { status: 400 });
    }

    // Validate input
    if (config.maxTokens && (config.maxTokens < 1 || config.maxTokens > 8000)) {
      return NextResponse.json({ error: 'Max tokens must be between 1 and 8000' }, { status: 400 });
    }

    if (config.temperature && (config.temperature < 0 || config.temperature > 2)) {
      return NextResponse.json({ error: 'Temperature must be between 0 and 2' }, { status: 400 });
    }

    if (config.priority && (config.priority < 1 || config.priority > 10)) {
      return NextResponse.json({ error: 'Priority must be between 1 and 10' }, { status: 400 });
    }

    const updatedConfig = await prisma.apiConfiguration.update({
      where: { id: config.id },
      data: {
        isEnabled: config.isEnabled,
        apiKey: config.apiKey,
        modelName: config.modelName,
        maxTokens: config.maxTokens,
        temperature: config.temperature,
        priority: config.priority
      }
    });

    return NextResponse.json(updatedConfig);
  } catch (error) {
    console.error('API config PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new API configuration
export async function POST(request: Request) {
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

    const config = await request.json();
    
    if (!config.provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
    }

    // Check if provider already exists
    const existing = await prisma.apiConfiguration.findUnique({
      where: { provider: config.provider }
    });

    if (existing) {
      return NextResponse.json({ error: 'Provider configuration already exists' }, { status: 400 });
    }

    const newConfig = await prisma.apiConfiguration.create({
      data: {
        provider: config.provider,
        isEnabled: config.isEnabled ?? true,
        apiKey: config.apiKey,
        modelName: config.modelName,
        maxTokens: config.maxTokens ?? 3000,
        temperature: config.temperature ?? 0.7,
        priority: config.priority ?? 1
      }
    });

    return NextResponse.json(newConfig, { status: 201 });
  } catch (error) {
    console.error('API config POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

