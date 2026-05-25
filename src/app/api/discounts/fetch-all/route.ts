import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendDiscountNotifications } from '../../../../lib/email';
import { DiscountFetcher } from '../../../../lib/discount-fetcher';

const prisma = new PrismaClient();

// Helper functions for each provider
async function callOpenRouterForCategory(categoryName: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set in .env');

  const prompt = `Find Australian stores in the "${categoryName}" category with current sales/discounts. 

Category rules:
- "Food & Groceries": Woolworths, Coles, Aldi Australia, IGA
- "Caffe & Brunch": cafes, coffee shops, brunch spots  
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
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 3000
    })
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status} - ${await response.text()}`);
  }

  const data = await response.json();
  const text = data.choices[0]?.message?.content || '';
  
  if (!text) {
    throw new Error('Empty response from OpenRouter API');
  }

  return text;
}

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

async function callClaudeForCategory(categoryName: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set in .env');

  const prompt = `Find all websites in New South Wales (NSW), Australia, in the "${categoryName}" category offering sales or discounts.
Before including an offer, check the store homepage and at least one relevant second page such as sale, deals, clearance, hot deals, offers, promotions, or outlet.
Only include a discount when the checked page visibly uses wording such as Discount, Sale, Clearance, Deal, Hot Deal, Offer, Promo, Outlet, or Save.
If no matching wording is visible for a store, include the store with an empty discounts array.
For each, return a JSON array with objects containing:
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

Return only valid JSON, no additional text. Use YYYY-MM-DD format for dates.`;

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
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    throw new Error('Claude API error: ' + (await response.text()));
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';
  
  if (!text) {
    throw new Error('Empty response from Claude API');
  }

  return text;
}

export async function POST(request: Request) {
  try {
    const { categoryId, providers = ['openrouter', 'gemini', 'claude'] } = await request.json();
    
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

    console.log(`Fetching discounts for category: ${category.name} from providers: ${providers.join(', ')}`);

    // Define provider configurations
    const providerConfigs = {
      openrouter: {
        name: 'OpenRouter',
        enabled: providers.includes('openrouter') && !!process.env.OPENROUTER_API_KEY,
        fetchFn: () => callOpenRouterForCategory(category.name)
      },
      gemini: {
        name: 'Gemini',
        enabled: providers.includes('gemini') && !!process.env.GEMINI_API_KEY,
        fetchFn: () => callGeminiForCategory(category.name)
      },
      claude: {
        name: 'Claude',
        enabled: providers.includes('claude') && !!process.env.ANTHROPIC_API_KEY,
        fetchFn: () => callClaudeForCategory(category.name)
      }
    };

    // Fetch from all enabled providers
    const fetchPromises = Object.entries(providerConfigs)
      .filter(([_, config]) => config.enabled)
      .map(async ([key, config]) => {
        try {
          console.log(`Fetching from ${config.name}...`);
          const result = await DiscountFetcher.fetchAndValidate(
            config.name,
            category.name,
            config.fetchFn
          );
          return { provider: key, result };
        } catch (error) {
          console.error(`Error fetching from ${config.name}:`, error);
          return { 
            provider: key, 
            result: { 
              success: false, 
              stores: [], 
              errors: [error instanceof Error ? error.message : 'Unknown error'],
              stats: { totalStores: 0, totalDiscounts: 0, validStores: 0, validDiscounts: 0 }
            } 
          };
        }
      });

    // Wait for all fetches to complete
    const fetchResults = await Promise.allSettled(fetchPromises);
    
    // Process results
    const allStores: any[] = [];
    const allErrors: string[] = [];
    const providerStats: any = {};

    fetchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const { provider, result: fetchResult } = result.value;
        providerStats[provider] = fetchResult.stats;
        
        if (fetchResult.success) {
          allStores.push(...fetchResult.stores);
        }
        
        allErrors.push(...fetchResult.errors.map(error => `[${provider}] ${error}`));
      } else {
        const provider = Object.keys(providerConfigs)[index];
        providerStats[provider] = { totalStores: 0, totalDiscounts: 0, validStores: 0, validDiscounts: 0 };
        allErrors.push(`[${provider}] Fetch failed: ${result.reason}`);
      }
    });

    // Remove duplicate stores based on URL
    const uniqueStores = allStores.filter((store, index, self) => 
      index === self.findIndex(s => s.url === store.url)
    );

    // Save to database
    const saveResult = await DiscountFetcher.saveToDatabase(
      uniqueStores,
      categoryId
    );

    // Send email notifications for new discounts
    if (uniqueStores.length > 0) {
      try {
        // Get all new discounts for email notifications
        const newDiscounts = [];
        for (const store of uniqueStores) {
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

    // Calculate overall statistics
    const totalStats = {
      totalStores: uniqueStores.length,
      totalDiscounts: uniqueStores.reduce((sum, store) => sum + store.discounts.length, 0),
      validStores: uniqueStores.length,
      validDiscounts: uniqueStores.reduce((sum, store) => sum + store.discounts.length, 0),
      savedStores: saveResult.savedStores,
      savedDiscounts: saveResult.savedDiscounts,
      saveErrors: saveResult.errors.length,
      providerStats
    };

    const message = `Successfully processed ${saveResult.savedStores} stores with ${saveResult.savedDiscounts} discounts for ${category.name} from ${Object.keys(providerStats).length} providers`;
    
    return NextResponse.json({ 
      message,
      stats: totalStats,
      errors: [...allErrors, ...saveResult.errors],
      providers: Object.keys(providerStats)
    });

  } catch (error) {
    console.error('Multi-provider fetch error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }, { status: 500 });
  }
}
