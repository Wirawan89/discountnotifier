import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendDiscountNotifications } from '../../../../lib/email';

const prisma = new PrismaClient();

// Helper to call Claude API
async function callClaudeForCategory(categoryName: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set in .env');

  const prompt = `Find all websites in New South Wales (NSW), Australia, in the "${categoryName}" category offering sales or discounts. For each, return a JSON array with objects containing:
- Store name
- Store URL
- Suburb
- City
- Country
- Contact
- Address
- Description
- E-catalog image URLs (jpg/png, as array)
- For each discount: title, description, start date, end date, percentage discount, coupon (if any), e-catalog image URLs (as array)

Return only valid JSON, no additional text.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error('Claude API error: ' + errorText);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';
  return text;
}

// Helper to parse Claude response (expects JSON)
function parseClaudeResponse(text: string) {
  // Try to parse as JSON first
  try {
    return JSON.parse(text);
  } catch {
    // Fallback: try to extract JSON from text if it's wrapped
    const jsonMatch = text.match(/\[.*\]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // If still fails, return empty array
        return [];
      }
    }
    return [];
  }
}

export async function POST(req: Request) {
  try {
    const { categoryId, categoryName } = await req.json();
    if (!categoryId && !categoryName) {
      return NextResponse.json({ error: 'categoryId or categoryName required' }, { status: 400 });
    }

    // Get category name if only id is provided
    let catName = categoryName;
    if (!catName && categoryId) {
      const cat = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!cat) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      catName = cat.name;
    }

    // Call Claude API
    const claudeText = await callClaudeForCategory(catName!);
    const storesData = parseClaudeResponse(claudeText);

    if (!Array.isArray(storesData)) {
      return NextResponse.json({ error: 'Claude response could not be parsed as array' }, { status: 500 });
    }

    let savedStores = 0;
    let savedDiscounts = 0;
    for (const store of storesData) {
      // Upsert store by url
      const dbStore = await prisma.store.upsert({
        where: { url: store.url },
        update: {
          name: store.name,
          suburb: store.suburb,
          city: store.city || "",
          country: store.country || "",
          contact: store.contact,
          address: store.address,
          description: store.description,
          catalogs: store.catalogs || [],
          categoryId: categoryId || undefined,
        },
        create: {
          name: store.name,
          url: store.url,
          suburb: store.suburb,
          city: store.city || "",
          country: store.country || "",
          contact: store.contact,
          address: store.address,
          description: store.description,
          catalogs: store.catalogs || [],
          categoryId: categoryId || undefined,
          ownerId: 1, // TODO: assign correct owner
        },
      });
      savedStores++;
      // Upsert discounts for this store
      if (Array.isArray(store.discounts)) {
        for (const discount of store.discounts) {
          const dbDiscount = await prisma.discount.upsert({
            where: {
              storeId_title: {
                storeId: dbStore.id,
                title: discount.title,
              },
            },
            update: {
              description: discount.description,
              startDate: new Date(discount.startDate),
              endDate: new Date(discount.endDate),
              percentage: discount.percentage,
              coupon: discount.coupon,
              eCatalog: discount.eCatalog || [],
            },
            create: {
              storeId: dbStore.id,
              title: discount.title,
              description: discount.description,
              startDate: new Date(discount.startDate),
              endDate: new Date(discount.endDate),
              percentage: discount.percentage,
              coupon: discount.coupon,
              eCatalog: discount.eCatalog || [],
            },
          });
          
          // Send email notification for new discount (only if it was created, not updated)
          if (dbDiscount.createdAt.getTime() === dbDiscount.updatedAt.getTime()) {
            try {
              await sendDiscountNotifications(categoryId || 0, [{
                id: dbDiscount.id,
                storeId: dbStore.id,
                title: discount.title,
                description: discount.description,
                percentage: discount.percentage,
                coupon: discount.coupon,
                endDate: new Date(discount.endDate),
              }]);
            } catch (emailError) {
              console.error('Failed to send email notification:', emailError);
            }
          }
          
          savedDiscounts++;
        }
      }
    }

    return NextResponse.json({
      message: `Saved ${savedStores} stores and ${savedDiscounts} discounts for category ${catName}`,
      stores: savedStores,
      discounts: savedDiscounts,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
}

// Note: Set your Anthropic API key in .env as ANTHROPIC_API_KEY=your_key_here 