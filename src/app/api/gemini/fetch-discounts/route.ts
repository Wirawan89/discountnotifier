import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendDiscountNotifications } from '../../../../lib/email';
import { DiscountFetcher } from '../../../../lib/discount-fetcher';


// Helper to call Gemini API
async function callGeminiForCategory(categoryName: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set in .env');

  const prompt = `Find all websites in New South Wales (NSW), Australia, in the "${categoryName}" category offering sales or discounts.
Before including an offer, check the store homepage and at least one relevant second page such as sale, deals, clearance, hot deals, offers, promotions, or outlet.
Only include a discount when the checked page visibly uses wording such as Discount, Sale, Clearance, Deal, Hot Deal, Offer, Promo, Outlet, or Save.
If no matching wording is visible for a store, include the store with an empty discounts array.
For each, return:
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

Return the data as a valid JSON array. Use YYYY-MM-DD format for dates.`;

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
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  if (!text) {
    throw new Error('Empty response from Gemini API');
  }

  return text;
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

    console.log(`Fetching discounts for category: ${catName}`);

    // Use the centralized fetcher
    const fetchResult = await DiscountFetcher.fetchAndValidate(
      'Gemini',
      catName!,
      () => callGeminiForCategory(catName!)
    );

    if (!fetchResult.success) {
      console.error('Fetch failed:', fetchResult.errors);
      return NextResponse.json({ 
        error: 'Failed to fetch discounts',
        details: fetchResult.errors,
        stats: fetchResult.stats
      }, { status: 500 });
    }

    // Save to database
    const saveResult = await DiscountFetcher.saveToDatabase(
      fetchResult.stores,
      categoryId || 0
    );

    // Send email notifications for new discounts
    if (fetchResult.stores.length > 0) {
      try {
        // Get all new discounts for email notifications
        const newDiscounts = [];
        for (const store of fetchResult.stores) {
          for (const discount of store.discounts) {
            // Check if this is a new discount by querying the database
            const existingDiscount = await prisma.discount.findFirst({
              where: {
                store: { url: store.url },
                title: discount.title
              }
            });

            if (!existingDiscount) {
              newDiscounts.push({
                storeId: 0, // Will be updated after saving
                title: discount.title,
                description: discount.description,
                percentage: discount.percentage,
                coupon: discount.coupon,
                endDate: new Date(discount.endDate),
              });
            }
          }
        }

        // Send notifications if there are new discounts
        if (newDiscounts.length > 0) {
          // Create a temporary ID for email notifications
          const discountsWithIds = newDiscounts.map((discount, index) => ({
            ...discount,
            id: -(index + 1), // Use negative IDs to indicate these are temporary
          }));
          await sendDiscountNotifications(categoryId || 0, discountsWithIds);
        }
      } catch (emailError) {
        console.error('Failed to send email notifications:', emailError);
        // Don't fail the entire request if email fails
      }
    }

    return NextResponse.json({
      message: `Successfully processed ${saveResult.savedStores} stores with ${saveResult.savedDiscounts} discounts for category ${catName}`,
      stats: {
        ...fetchResult.stats,
        savedStores: saveResult.savedStores,
        savedDiscounts: saveResult.savedDiscounts,
        saveErrors: saveResult.errors.length
      },
      errors: [...fetchResult.errors, ...saveResult.errors]
    });
  } catch (err: any) {
    console.error('Gemini fetch error:', err);
    return NextResponse.json({ 
      error: err.message || 'Unknown error occurred' 
    }, { status: 500 });
  }
} 
