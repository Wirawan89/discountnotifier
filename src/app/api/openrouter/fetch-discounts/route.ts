import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendDiscountNotifications } from '../../../../lib/email';

const prisma = new PrismaClient();

// Helper function to parse and validate dates
function parseDate(dateString: any): Date | null {
  if (!dateString || dateString === 'null' || dateString === 'unknown' || dateString === '') {
    return null;
  }
  
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

// Helper to call OpenRouter API with Perplexity Sonar model
async function callOpenRouterForCategory(categoryName: string) {
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

Visit main homepage URLs. Look for sales in headers, navigation, content areas, footers. Skip popups/modals.

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

  try {
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
    
    console.log('OpenRouter response text:', text);
    
    // Try to parse JSON from the response
    let stores;
    let cleanedText = text;
    // Remove markdown code block if present
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.slice(7).trim();
      if (cleanedText.endsWith('```')) {
        cleanedText = cleanedText.slice(0, -3).trim();
      }
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.slice(3).trim();
      if (cleanedText.endsWith('```')) {
        cleanedText = cleanedText.slice(0, -3).trim();
      }
    }
    
    try {
      stores = JSON.parse(cleanedText);
      console.log('Sonar JSON parse successful');
    } catch (parseError) {
      console.log('Sonar JSON parse failed, trying to extract complete JSON');
      console.log('Raw response length:', text.length);
      
      // Try to find the complete JSON structure
      const jsonStart = cleanedText.indexOf('[');
      if (jsonStart !== -1) {
        // Find the matching closing bracket
        let bracketCount = 0;
        let jsonEnd = -1;
        
        for (let i = jsonStart; i < cleanedText.length; i++) {
          if (cleanedText[i] === '[') bracketCount++;
          if (cleanedText[i] === ']') bracketCount--;
          if (bracketCount === 0) {
            jsonEnd = i;
            break;
          }
        }
        
        if (jsonEnd !== -1) {
          const extractedJson = cleanedText.substring(jsonStart, jsonEnd + 1);
          try {
            stores = JSON.parse(extractedJson);
            console.log('Extracted JSON parse successful');
          } catch (extractError) {
            console.log('Extracted JSON parse failed');
            console.log('Raw response:', text);
            console.log('Cleaned text:', cleanedText);
            console.log('Parse error:', parseError);
            throw new Error(`Could not parse JSON response from OpenRouter. Raw response: ${text.substring(0, 500)}...`);
          }
        } else {
          console.log('Could not find complete JSON structure');
          console.log('Raw response:', text);
          console.log('Cleaned text:', cleanedText);
          console.log('Parse error:', parseError);
          throw new Error(`Could not parse JSON response from OpenRouter. Raw response: ${text.substring(0, 500)}...`);
        }
      } else {
        console.log('No JSON array found in response');
        console.log('Raw response:', text);
        console.log('Cleaned text:', cleanedText);
        console.log('Parse error:', parseError);
        throw new Error(`Could not parse JSON response from OpenRouter. Raw response: ${text.substring(0, 500)}...`);
      }
    }
    return stores;
  } catch (error) {
    console.error('OpenRouter API error:', error);
    throw error;
  }
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

    // Call OpenRouter API
    const stores = await callOpenRouterForCategory(category.name);
    
    if (!Array.isArray(stores)) {
      throw new Error('Invalid response format from OpenRouter');
    }

    let savedCount = 0;
    let errorCount = 0;

    // Process each store
    for (const store of stores) {
      try {
        // Find or create store by url
        let dbStore = await prisma.store.findFirst({ where: { url: store["Store URL"] } });
        if (!dbStore) {
          dbStore = await prisma.store.create({
            data: {
              name: store["Store name"] || store["Store Name"],
              url: store["Store URL"],
              suburb: store["Suburb"] || "Sydney", // Default to Sydney if null
              categoryId: categoryId,
              ownerId: 1, // TODO: assign correct owner
              background: store["Background"] || null,
            },
          });
        } else {
          dbStore = await prisma.store.update({
            where: { id: dbStore.id },
            data: {
              name: store["Store name"] || store["Store Name"],
              suburb: store["Suburb"] || "Sydney", // Default to Sydney if null
              categoryId: categoryId,
              background: store["Background"] || null,
            },
          });
        }

        // Process discounts for this store
        if (store["Discounts"] && Array.isArray(store["Discounts"])) {
          for (const discount of store["Discounts"]) {
            try {
              // Parse dates safely
              const startDate = parseDate(discount["start date"] || discount["start_date"]);
              const endDate = parseDate(discount["end date"] || discount["end_date"]);
              
              // Skip discounts with invalid dates
              if (!startDate || !endDate) {
                console.log(`Skipping discount "${discount.title}" due to invalid dates`);
                continue;
              }

              // Find or create discount by storeId and title
              let dbDiscount = await prisma.discount.findFirst({ 
                where: { storeId: dbStore.id, title: discount.title } 
              });
              
              if (!dbDiscount) {
                dbDiscount = await prisma.discount.create({
                  data: {
                    storeId: dbStore.id,
                    title: discount.title,
                    description: discount.description || null,
                    startDate: startDate,
                    endDate: endDate,
                  },
                });
                console.log(`Created discount: ${discount.title} for store: ${dbStore.name}`);
                
                // Send email notification for new discount
                try {
                  await sendDiscountNotifications(categoryId, [{
                    id: dbDiscount.id,
                    storeId: dbStore.id,
                    title: discount.title,
                    description: discount.description || null,
                    percentage: discount.percentage || null,
                    coupon: discount.coupon || null,
                    endDate: endDate,
                  }]);
                } catch (emailError) {
                  console.error('Failed to send email notification:', emailError);
                }
              } else {
                dbDiscount = await prisma.discount.update({
                  where: { id: dbDiscount.id },
                  data: {
                    description: discount.description || null,
                    startDate: startDate,
                    endDate: endDate,
                  },
                });
                console.log(`Updated discount: ${discount.title} for store: ${dbStore.name}`);
              }
            } catch (discountError) {
              console.error('Error saving discount:', discountError);
              errorCount++;
            }
          }
        }

        savedCount++;
      } catch (storeError) {
        console.error('Error saving store:', storeError);
        errorCount++;
      }
    }

    const message = `Successfully processed ${savedCount} stores with discounts for ${category.name}${errorCount > 0 ? ` (${errorCount} errors)` : ''}`;
    
    return NextResponse.json({ 
      message,
      storesProcessed: savedCount,
      errors: errorCount
    });

  } catch (error) {
    console.error('OpenRouter fetch error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }, { status: 500 });
  }
} 