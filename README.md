# DiscountNotifier

DiscountNotifier is a Next.js app for tracking current discounts and store offers by category. It combines seeded store data, AI-assisted smart fetching, and a website verifier that checks store pages for real offer wording before displaying an offer.

The app is currently focused on Australia by default, with support for country filtering in the UI.

## What It Does

- Shows discount categories in a sidebar.
- Lists stores for the selected category.
- Displays current offers per store.
- Shows "No offer at the moment" when the verifier cannot confirm an active offer.
- Lets users search, filter by country/suburb, sort, favorite stores, and open store links in a new tab.
- Provides `SaleNearby`, which shows current-offer stores from the selected suburb plus 1-2 nearby suburbs.
- Uses store URLs to render small store logos beside store names.
- Supports smart fetching with OpenRouter, Gemini, and Claude routes.
- Caches category fetches with `CategoryFetchLog` to avoid repeated fetches within the configured refresh period.
- Supports login, signup, forgot password, reset password, admin pages, notifications, and user preferences.

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- NextAuth
- Nodemailer
- OpenRouter, Gemini, and Claude API integrations

## Main Entry Points

- App home page: `src/app/page.tsx`
- Auth pages: `src/app/auth/*`
- Admin pages: `src/app/admin/*`
- Main discount UI components: `src/components/discounts/*`
- Store cards and logo tile:
  - `src/components/discounts/StoreCard.tsx`
  - `src/components/discounts/StoreLogo.tsx`
- Smart fetch API: `src/app/api/discounts/smart-fetch/route.ts`
- Existing discounts API: `src/app/api/discounts/existing/route.ts`
- Store API: `src/app/api/stores/route.ts`
- SaleNearby API: `src/app/api/stores/sale-nearby/route.ts`
- Category API: `src/app/api/categories/route.ts`
- Offer verifier: `src/lib/offer-verifier.ts`
- Fetch parsing and validation: `src/lib/discount-fetcher.ts`
- Reverify script: `scripts/reverify-current-offers.ts`
- Seed data: `prisma/seed.ts`
- Database schema: `prisma/schema.prisma`

## Verifier Profiles

The verifier has three profiles:

- `retail`: default general checker.
- `retailShop`: stricter shop checker for retail categories. It checks the homepage, configured catalog URLs, and same-site discovered offer links.
- `dining`: dining-specific checker for wording such as `happy hour`, `special offer`, and `special deal`.

Current category-to-profile mapping lives in:

- `src/lib/discount-fetcher.ts`
- `scripts/reverify-current-offers.ts`

Most retail categories use `retailShop`. `Dining & Beverages` and `Caffe & Brunch` use `dining`.

## Database

The app uses PostgreSQL with Prisma. Key models include:

- `User`
- `Store`
- `Category`
- `Discount`
- `Showcase`
- `Notification`
- `UserPreference`
- `CategoryFetchLog`
- `ApiConfiguration`
- `TokenUsageLog`
- `AiPerformanceLog`

The `Store` model contains:

- `id`
- `name`
- `url`
- `suburb`
- `city`
- `country`
- `contact`
- `address`
- `description`
- `catalogs`
- `categoryId`
- `ownerId`
- `background`
- `createdAt`
- `updatedAt`

## Environment Variables

Create `.env` in the project root. Do not commit it.

```env
DATABASE_URL="postgresql://username:password@localhost:5432/discountnotifier"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

EMAIL_FROM="noreply@discountnotifier.com"

# Gmail SMTP, optional but needed for password reset emails unless another SMTP setup is added.
GMAIL_USER="your-email@gmail.com"
GMAIL_PASS="your-gmail-app-password"

# AI providers, optional depending on which smart fetch routes you use.
OPENROUTER_API_KEY=""
GEMINI_API_KEY=""
ANTHROPIC_API_KEY=""

# Admin seed helper, optional.
ADMIN_EMAIL="admin@discountnotifier.com"
ADMIN_PASSWORD="change-this-password"
```

## Setup

Install dependencies:

```bash
npm install
```

Generate Prisma client:

```bash
npm run db:generate
```

Run migrations:

```bash
npm run db:migrate
```

Seed categories, stores, API config, and test data:

```bash
npm run db:seed
```

Start the dev server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

To use another port:

```bash
npm run dev -- -p 3003
```

## Useful Scripts

```bash
npm run dev
npm run build
npm run start
npm run db:generate
npm run db:migrate
npm run db:seed
npm run offers:reverify
npm run cleanup
npm run cleanup:monthly
npm run cleanup:monthly:dry-run
npm run cleanup:full
npm run cleanup:dry-run
npm run test:email
npm run init:admin
```

## Reverify Current Offers

Recheck all stores/offers:

```bash
npm run offers:reverify
```

Recheck one category and create generic current offers when the verifier confirms offer wording:

```bash
npm run offers:reverify -- --category="Books & Magazines" --create-missing
```

Recheck one store:

```bash
npm run offers:reverify -- --store="Booktopia Australia" --create-missing
```

## Cleanup

Remove expired discounts:

```bash
npm run cleanup:monthly
```

Preview monthly cleanup without deleting:

```bash
npm run cleanup:monthly:dry-run
```

## Email And Password Reset

Forgot password and reset password routes are implemented under:

- `src/app/api/auth/forgot-password/route.ts`
- `src/app/api/auth/reset-password/route.ts`
- `src/app/auth/forgot-password/page.tsx`
- `src/app/auth/reset-password/page.tsx`

For Gmail SMTP, use a Gmail App Password, not the normal Gmail account password.

Test email:

```bash
npm run test:email your-email@example.com
```

## Project Structure

```text
prisma/
  schema.prisma
  seed.ts

scripts/
  reverify-current-offers.ts
  monthly-cleanup.js
  cleanup-database.js
  cleanup-expired.js
  init-admin.js
  setup-cron.js
  test-email.js

src/app/
  page.tsx
  admin/
  api/
  auth/
  profile/

src/components/discounts/
  CategorySidebar.tsx
  FilterBar.tsx
  StoreGrid.tsx
  StoreCard.tsx
  StoreLogo.tsx
  ShareModal.tsx

src/lib/
  discount-fetcher.ts
  offer-verifier.ts
  email.ts
  prisma.ts
```

## Development Notes

- Store logos are rendered from each store URL using a favicon service. They are not currently stored in the database.
- `Store.url` is unique, so seed data uses category-specific URLs when the same brand appears in multiple categories.
- `catalogs` stores offer/catalog URLs used by the verifier.
- `CategoryFetchLog` prevents repeated smart fetches within the category refresh window.
- The default country in the UI is Australia.
- The app uses date-based current offers: offers are current when `endDate` has not passed.
- `SaleNearby` uses existing `Store.suburb`, `Store.city`, and `Store.country` fields. Add latitude/longitude later if true distance-based search is needed.

## GitHub

Repository:

```text
https://github.com/Wirawan89/discountnotifier.git
```
