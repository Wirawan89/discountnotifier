import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SmartFetcher } from '../../../../lib/smart-fetcher';

const DEFAULT_COUNTRY = 'Australia';

function normalizeCountry(country: string | undefined): string {
  if (!country || country.trim().length === 0) {
    return DEFAULT_COUNTRY;
  }

  const normalized = country.trim();

  if (/^(usa|us|united states of america)$/i.test(normalized)) {
    return 'United States';
  }

  if (/^nz$/i.test(normalized)) {
    return 'New Zealand';
  }

  return normalized;
}

function getDefaultCity(country: string): string {
  switch (country) {
    case 'New Zealand':
      return 'Auckland';
    case 'United States':
      return 'New York';
    case 'Australia':
    default:
      return 'Sydney';
  }
}

// Function to call multiple AI providers
async function callMultipleProviders(categoryName: string, country: string, providers: string[]): Promise<string> {
  const responses: string[] = [];
  const errors: string[] = [];
  
  for (const provider of providers) {
    try {
      let response = '';
      
      switch (provider) {
        case 'openrouter':
          response = await callOpenRouterForCategory(categoryName, country);
          break;
        case 'claude':
          response = await callClaudeForCategory(categoryName, country);
          break;
        case 'gemini':
          response = await callGeminiForCategory(categoryName, country);
          break;
        default:
          console.warn(`Unknown provider: ${provider}`);
          continue;
      }
      
      if (response) {
        responses.push(response);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown provider error';
      errors.push(`${provider}: ${message}`);
      console.error(`Error calling ${provider}:`, error);
    }
  }

  if (responses.length === 0) {
    throw new Error(`No AI providers returned discount data. ${errors.join(' | ')}`);
  }
  
  // Combine responses or return the first successful one
  return responses.join('\n\n---\n\n');
}

function buildDiscountFetchPrompt(categoryName: string, country: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const defaultCity = getDefaultCity(country);
  const electronicsInstruction = categoryName.toLowerCase().includes('electronic')
    ? 'For this category, include local electronics retailers only when current Hot Deal, On Sale, Red Hot Deal, or Clearance offers are visible on their country-specific websites.'
    : '';

  return [
    `Today is ${today}.`,
    `Find 5-10 stores in ${country} that offer current discounts in the ${categoryName} category.`,
    `Default the suburb/city to ${defaultCity} only when the store does not publish a local suburb.`,
    `Only include stores that sell to customers in ${country}; do not include stores that are only for another country or region.`,
    `Set the country field to "${country}" for every returned store.`,
    electronicsInstruction,
    'Before including an offer, check the store homepage and at least one relevant second page such as sale, deals, clearance, hot deals, offers, promotions, or outlet.',
    'Only include a discount when the checked page visibly uses wording such as Discount, Sale, Clearance, Deal, Hot Deal, Offer, Promo, Outlet, or Save. If no matching wording is visible for a store, include the store with an empty discounts array.',
    'Only include offers whose endDate is today or in the future. If an exact end date is not published, use a conservative date 7 days from today and say in the description that availability should be checked on the store website.',
    'Return JSON only. Do not include markdown, citations, comments, prose, or code fences.',
    'Use this exact structure:',
    '[{"name":"Store Name","url":"https://store.com","suburb":"Suburb Name","city":"City Name","country":"Country Name","discounts":[{"title":"Discount Title","description":"Description","percentage":20,"coupon":"SAVE20","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD","eCatalog":["https://store.com/sale-page"]}]}]'
  ].filter(Boolean).join(' ');
}

// AI Provider functions (copied from existing routes)
async function callOpenRouterForCategory(categoryName: string, country: string): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'perplexity/sonar',
      messages: [
        {
          role: 'user',
          content: buildDiscountFetchPrompt(categoryName, country)
        }
      ],
      max_tokens: 1800,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status} - ${await response.text()}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callClaudeForCategory(categoryName: string, country: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1800,
      messages: [
        {
          role: 'user',
          content: buildDiscountFetchPrompt(categoryName, country)
        }
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${await response.text()}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

async function callGeminiForCategory(categoryName: string, country: string): Promise<string> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: buildDiscountFetchPrompt(categoryName, country)
            }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: 1800,
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${await response.text()}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

export async function POST(request: Request) {
  try {
    const { categoryId, country: requestedCountry, providers = ['openrouter'] } = await request.json();
    const country = normalizeCountry(requestedCountry);
    
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

    console.log(`Smart fetching discounts for category: ${category.name} in ${country}`);

    // Use the smart fetcher
    const result = await SmartFetcher.smartFetch(
      categoryId,
      category.name,
      () => callMultipleProviders(category.name, country, providers),
      providers,
      country
    );

    if (result.success) {
      return NextResponse.json({
        message: result.message,
        data: result.data,
        stats: result.stats,
        wasCached: result.wasCached,
        nextFetchDate: result.nextFetchDate
      });
    } else {
      return NextResponse.json({
        error: result.message,
        details: result.errors,
        stats: result.stats
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in smart fetch endpoint:', error);
    return NextResponse.json({ 
      error: 'Failed to smart fetch discounts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to get fetch statistics for a category
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const stats = await SmartFetcher.getFetchStats(parseInt(categoryId));
    
    if (!stats) {
      return NextResponse.json({ 
        message: 'No fetch history found for this category',
        stats: {
          lastFetchedAt: null,
          refreshPeriodDays: 3,
          nextFetchDate: null,
          daysSinceLastFetch: null,
          storesFetched: 0,
          discountsFetched: 0,
          fetchStatus: 'never_fetched'
        }
      });
    }

    return NextResponse.json({ stats });

  } catch (error) {
    console.error('Error getting fetch stats:', error);
    return NextResponse.json({ 
      error: 'Failed to get fetch statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
