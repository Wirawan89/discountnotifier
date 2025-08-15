# Gemini API Backup

This file contains your original Gemini API implementation for future reference.

## Original Gemini API Route
File: `src/app/api/gemini/fetch-discounts/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to call Gemini API
async function callGeminiForCategory(categoryName: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set in .env');

  const prompt = `Find all websites in New South Wales (NSW), Australia, in the "${categoryName}" category offering sales or discounts. For each, return:
- Store name
- Store URL
- Suburb
- City
- Country
- Contact
- Address
- Description
- E-catalog image URLs (jpg/png, as array)
- For each discount: title, description, start date, end date, percentage discount, coupon (if any), e-catalog image URLs (as array)`;

  const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-002:generateContent?key=' + apiKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  if (!response.ok) {
    throw new Error('Gemini API error: ' + (await response.text()));
  }

  const data = await response.json();
  // The response format may vary; adjust parsing as needed
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text;
}

// Helper to parse Gemini response (expects JSON or structured text)
function parseGeminiResponse(text: string) {
  // Try to parse as JSON first
  try {
    return JSON.parse(text);
  } catch {
    // Fallback: try to parse as structured text (implement as needed)
    // For now, return empty array
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

    // Call Gemini API
    const geminiText = await callGeminiForCategory(catName!);
    const storesData = parseGeminiResponse(geminiText);

    if (!Array.isArray(storesData)) {
      return NextResponse.json({ error: 'Gemini response could not be parsed as array' }, { status: 500 });
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
          city: store.city,
          country: store.country,
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
          city: store.city,
          country: store.country,
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
          await prisma.discount.upsert({
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

// Note: Set your Gemini API key in .env as GEMINI_API_KEY=your_key_here
```

## Setup Instructions

### To use Gemini API:
1. Get a Gemini API key from Google AI Studio: https://aistudio.google.com/
2. Add to your `.env` file:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. The Gemini API route is already implemented at `/api/gemini/fetch-discounts`
4. The frontend has a "🤖 Gemini" button that calls this API

### To use Claude API:
1. Get an Anthropic API key from: https://console.anthropic.com/
2. Add to your `.env` file:
   ```
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   ```
3. The Claude API route is implemented at `/api/claude/fetch-discounts`
4. The frontend has a "🧠 Claude" button that calls this API

### Current Status:
- ✅ Gemini API route: `/api/gemini/fetch-discounts` (preserved)
- ✅ Claude API route: `/api/claude/fetch-discounts` (new)
- ✅ Frontend buttons for both APIs
- ✅ Both APIs use the same database schema and response format

### To switch back to Gemini:
- Simply use the "🤖 Gemini" button instead of "🧠 Claude"
- Both APIs are available simultaneously
- You can compare results from both AI models 