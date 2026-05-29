import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendDiscountNotifications } from '../../../../lib/email';
import { DiscountFetcher } from '../../../../lib/discount-fetcher';


// Helper to call OpenRouter API with Perplexity Sonar model
async function callOpenRouterForCategory(categoryName: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set in .env');

  const prompt = `Find Australian stores in the "${categoryName}" category with current sales/discounts. 

Category rules:
- "Food & Groceries": Woolworths, Coles, Aldi Australia, IGA
- "Caffe & Brunch": cafes, coffee shops, brunch spots  
- "Cultural Bites & Takeaway": Asian cultural bites, banh mi, momo, chaat, noodle bars, and casual takeaway food
- "Dining & Beverages": restaurants, bars, pubs (NOT cafes)
- "Cosmetic & Perfumes": Adore Beauty, Sephora, Mecca
- "Baby & Kids": baby products, children's clothing, toys
- "Clothing & Fashions": fashion retailers, clothing stores
- "Electronic & Gadgets": electronics stores, tech retailers
- "Home & Garden": home improvement, furniture, garden stores
- "Sport Gears": sports equipment, athletic wear
- "Business Attire": formal wear, business clothing
- "Luxury & Designer": high-end, luxury stores
- "Financial & Services": banks, financial services
- "Travel & Accommodation": travel agencies, hotels
- "Entertainment & Events": entertainment venues, event services

Visit main homepage URLs and at least one relevant second page such as sale, deals, clearance, hot deals, offers, promotions, or outlet. Look for sales in headers, navigation, content areas, footers. Skip popups/modals.
Only include a discount when the checked page visibly uses wording such as Discount, Sale, Clearance, Deal, Hot Deal, Offer, Promo, Outlet, or Save.
If no matching wording is visible for a store, include the store with an empty discounts array.

Return JSON array with objects containing:
- Store name
- Store URL (main homepage)  
- Suburb (default to "Sydney" if unknown)
- City
- Country
- Contact
- Address
- Description
- E-catalog image URLs (array)
- Discounts (array with):
  * title
  * description  
  * start date (YYYY-MM-DD)
  * end date (YYYY-MM-DD)
  * percentage discount (number)
  * coupon (string)
  * e-catalog image URLs (array)

Only include stores that truly match the category. Use YYYY-MM-DD date format.`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'DiscountNotifier'
    },
    body: JSON.stringify({
      model: 'perplexity/sonar',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const text = data.choices[0]?.message?.content || '';
  
  if (!text) {
    throw new Error('Empty response from OpenRouter API');
  }

  return text;
}

export async function POST(request: Request) {
  try {
    const { categoryId } = await request.json();
    
    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    // Get category name
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    console.log(`Fetching discounts for category: ${category.name}`);

    // Use the centralized fetcher
    const fetchResult = await DiscountFetcher.fetchAndValidate(
      'OpenRouter',
      category.name,
      () => callOpenRouterForCategory(category.name)
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
      categoryId
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
           await sendDiscountNotifications(categoryId, discountsWithIds);
         }
      } catch (emailError) {
        console.error('Failed to send email notifications:', emailError);
        // Don't fail the entire request if email fails
      }
    }

    const message = `Successfully processed ${saveResult.savedStores} stores with ${saveResult.savedDiscounts} discounts for ${category.name}`;
    
    return NextResponse.json({ 
      message,
      stats: {
        ...fetchResult.stats,
        savedStores: saveResult.savedStores,
        savedDiscounts: saveResult.savedDiscounts,
        saveErrors: saveResult.errors.length
      },
      errors: [...fetchResult.errors, ...saveResult.errors]
    });

  } catch (error) {
    console.error('OpenRouter fetch error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }, { status: 500 });
  }
} 
