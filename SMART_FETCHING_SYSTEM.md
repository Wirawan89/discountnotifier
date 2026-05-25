# Smart Fetching System Documentation

## Overview

The Smart Fetching System implements intelligent caching for discount data fetching to improve efficiency and reduce API costs. It automatically determines when to fetch fresh data versus using cached data based on configurable refresh periods.

## Key Features

### 🧠 Smart Caching Logic
- **Automatic Cache Check**: Before making API calls, the system checks when the category was last fetched
- **Configurable Refresh Periods**: Each category can have a different refresh period (default: 3 days)
- **Efficient API Usage**: Only fetches fresh data when the cache has expired
- **Fallback to Cache**: If API calls fail, the system falls back to cached data

### 📊 Database Schema

#### New Table: `CategoryFetchLog`
```sql
model CategoryFetchLog {
  id              Int      @id @default(autoincrement())
  category        Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  categoryId      Int
  lastFetchedAt   DateTime @default(now())
  refreshPeriodDays Int    @default(3) // Configurable per category
  storesFetched   Int      @default(0)
  discountsFetched Int     @default(0)
  fetchStatus     String   @default("success") // success, failed, partial
  errorMessage    String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([categoryId])
}
```

## How It Works

### 1. Cache Check Process
```typescript
// Check if category needs refresh
const refreshCheck = await SmartFetcher.shouldRefreshCategory(categoryId);

if (!refreshCheck.shouldRefresh) {
  // Return cached data from database
  return getCachedData(categoryId);
} else {
  // Fetch fresh data from AI providers
  return fetchFreshData(categoryId);
}
```

### 2. Refresh Period Calculation
```typescript
const timeSinceLastFetch = now.getTime() - lastFetched.getTime();
const shouldRefresh = timeSinceLastFetch >= (refreshPeriodDays * 24 * 60 * 60 * 1000);
```

### 3. Smart Fetch Flow
1. **Check Cache**: Determine if data needs refresh
2. **If Cached**: Return existing data with cache status
3. **If Fresh Needed**: Make API calls to AI providers
4. **Save Results**: Update database and fetch log
5. **Return Data**: Provide fresh data with success status

## API Endpoints

### Smart Fetch Endpoint
```
POST /api/discounts/smart-fetch
```

**Request Body:**
```json
{
  "categoryId": 1,
  "providers": ["openrouter", "claude"]
}
```

**Response:**
```json
{
  "message": "Using cached data (last updated 2 days ago). Next refresh in 1 days.",
  "data": [...],
  "stats": {
    "totalStores": 5,
    "totalDiscounts": 12,
    "wasCached": true,
    "refreshPeriodDays": 3
  },
  "wasCached": true,
  "nextFetchDate": "2024-01-15T10:00:00Z"
}
```

### Fetch Statistics Endpoint
```
GET /api/discounts/smart-fetch?categoryId=1
```

**Response:**
```json
{
  "stats": {
    "lastFetchedAt": "2024-01-12T10:00:00Z",
    "refreshPeriodDays": 3,
    "nextFetchDate": "2024-01-15T10:00:00Z",
    "daysSinceLastFetch": 2,
    "storesFetched": 5,
    "discountsFetched": 12,
    "fetchStatus": "success"
  }
}
```

### Refresh Period Management
```
GET /api/categories/refresh-period?categoryId=1
PUT /api/categories/refresh-period
```

**Update Request:**
```json
{
  "categoryId": 1,
  "refreshPeriodDays": 5
}
```

## Configuration

### Default Settings
- **Default Refresh Period**: 3 days
- **Minimum Refresh Period**: 1 day
- **Maximum Refresh Period**: 30 days
- **Cache Strategy**: Return cached data if within refresh period

### Per-Category Configuration
Each category can have its own refresh period:
- **High-Value Categories**: 1-2 days (e.g., Electronics, Fashion)
- **Medium-Value Categories**: 3-5 days (e.g., Food, Services)
- **Low-Value Categories**: 7-10 days (e.g., Books, Home)

## Benefits

### 🚀 Performance Improvements
- **Faster Response Times**: Cached data returns instantly
- **Reduced API Calls**: Only fetch when necessary
- **Better User Experience**: No waiting for API responses

### 💰 Cost Savings
- **Reduced API Costs**: Fewer calls to expensive AI providers
- **Efficient Resource Usage**: Only use APIs when cache expires
- **Predictable Expenses**: Controlled refresh frequency

### 🔧 Operational Benefits
- **Configurable Refresh**: Adjust periods based on category importance
- **Error Resilience**: Fallback to cache if APIs fail
- **Monitoring**: Track fetch history and success rates

## Usage Examples

### Basic Smart Fetch
```typescript
const result = await SmartFetcher.smartFetch(
  categoryId,
  categoryName,
  () => callAIProviders(categoryName),
  ['openrouter', 'claude']
);

if (result.wasCached) {
  console.log('Using cached data');
} else {
  console.log('Fetched fresh data');
}
```

### Update Refresh Period
```typescript
await SmartFetcher.updateRefreshPeriod(categoryId, 5); // 5 days
```

### Get Fetch Statistics
```typescript
const stats = await SmartFetcher.getFetchStats(categoryId);
console.log(`Last fetched: ${stats.daysSinceLastFetch} days ago`);
console.log(`Next fetch: ${stats.nextFetchDate}`);
```

## Migration Guide

### From Old System
1. **Database Migration**: Run `npx prisma migrate dev`
2. **Update API Calls**: Replace `/api/discounts/fetch-all` with `/api/discounts/smart-fetch`
3. **Update UI**: Change button text to "Smart Fetch Discounts"
4. **Test Functionality**: Verify cache behavior works correctly

### Configuration Changes
1. **Set Default Period**: Update default in `SmartFetcher.shouldRefreshCategory()`
2. **Category-Specific**: Use admin interface to set per-category periods
3. **Monitor Usage**: Check fetch logs for optimization opportunities

## Troubleshooting

### Common Issues

#### Cache Not Working
- Check if `CategoryFetchLog` table exists
- Verify `categoryId` is correct
- Check database connection

#### Refresh Period Not Updating
- Ensure `PUT` request includes both `categoryId` and `refreshPeriodDays`
- Check if refresh period is between 1-30 days
- Verify database permissions

#### API Calls Still Happening
- Check if cache has expired (refresh period exceeded)
- Verify `shouldRefreshCategory` logic
- Check for database errors

### Debug Commands
```bash
# Check fetch statistics
curl "http://localhost:3000/api/discounts/smart-fetch?categoryId=1"

# Update refresh period
curl -X PUT http://localhost:3000/api/categories/refresh-period \
  -H "Content-Type: application/json" \
  -d '{"categoryId": 1, "refreshPeriodDays": 5}'

# Test smart fetch
curl -X POST http://localhost:3000/api/discounts/smart-fetch \
  -H "Content-Type: application/json" \
  -d '{"categoryId": 1, "providers": ["openrouter", "claude"]}'
```

## Future Enhancements

### Planned Features
- **Admin Dashboard**: Web interface for managing refresh periods
- **Analytics**: Detailed fetch statistics and cost analysis
- **Smart Scheduling**: Automatic fetch scheduling based on usage patterns
- **Multi-Level Caching**: Category-level and global-level caching strategies

### Performance Optimizations
- **Background Fetching**: Pre-fetch data before cache expires
- **Incremental Updates**: Only fetch changed data
- **Compression**: Compress cached data for storage efficiency

## Conclusion

The Smart Fetching System provides a robust, efficient, and cost-effective solution for managing discount data fetching. By implementing intelligent caching with configurable refresh periods, it significantly reduces API costs while maintaining data freshness and improving user experience.
