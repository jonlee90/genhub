# Home Depot API Service - SerpAPI Integration

## Overview

The Home Depot API service provides real-time product search, pricing, and availability data from Home Depot using the SerpAPI Home Depot Search API. This integration is used for the Materials Management feature (Requirement 19) in the GenHub PWA.

## Documentation

- **SerpAPI Home Depot Search**: https://serpapi.com/home-depot-search-api
- **API Documentation**: https://serpapi.com/search-api
- **Playground**: https://serpapi.com/playground?engine=home_depot

## Setup

### 1. Get SerpAPI API Key

1. Sign up for a free account at https://serpapi.com/
2. Navigate to your dashboard: https://serpapi.com/manage-api-key
3. Copy your API key

### 2. Configure Environment Variable

Add your API key to `.env.local`:

```bash
SERPAPI_API_KEY=your_api_key_here
```

### 3. Free Tier Limits

- **100 searches per month** on the free tier
- Each search query counts as 1 API call
- Caching is implemented (30-minute TTL) to reduce API usage
- The system automatically falls back to mock data if the API key is not configured

## Usage

### Search Products

```typescript
import { searchHomeDepotProducts } from '@/lib/services/home-depot-api';

// Basic search
const results = await searchHomeDepotProducts({
  query: 'lumber 2x4',
});

// Advanced search with filters
const results = await searchHomeDepotProducts({
  query: 'concrete mix',
  category: 'concrete',
  minPrice: 5,
  maxPrice: 20,
  inStockOnly: true,
  page: 1,
  limit: 20,
});
```

### Get Product by ID

```typescript
import { getHomeDepotProduct } from '@/lib/services/home-depot-api';

const product = await getHomeDepotProduct('hd-1001');
```

### Get Product by SKU

```typescript
import { getHomeDepotProductBySku } from '@/lib/services/home-depot-api';

const product = await getHomeDepotProductBySku('202532819');
```

## Features

### Real-time Product Data
- Live pricing from Home Depot
- Stock availability status
- Product specifications
- Images and product URLs
- Customer ratings and reviews

### Smart Data Mapping
- **Category Detection**: Automatically maps products to construction categories (lumber, concrete, electrical, etc.)
- **Price Extraction**: Handles various price formats ("$X.XX", numbers)
- **Stock Status**: Maps to standardized status (in_stock, low_stock, out_of_stock, special_order)
- **Unit of Measure**: Extracts from product titles (gallon, pound, foot, etc.)
- **Specifications**: Formats product specifications into key-value pairs

### Caching
- **In-memory cache** with 30-minute TTL
- Reduces API calls for repeated searches
- Cache key based on all search parameters
- Automatic cache invalidation after TTL expires

### Error Handling & Fallback
- **Graceful degradation**: Falls back to mock data if API fails
- **Detailed logging**: Console logs for debugging
- **Mock products**: 12 sample products across all categories
- **No breaking changes**: UI continues to work without API key

## API Response Mapping

### SerpAPI Response → HomeDepotProduct

| SerpAPI Field | Our Field | Notes |
|---------------|-----------|-------|
| `product_id` | `id` | Unique product identifier |
| `title` | `name`, `description` | Product name and description |
| `model_number` | `sku` | Product SKU |
| `brand` | `manufacturer` | Brand/manufacturer name |
| `price` | `price` | Extracted from string or number |
| `image` | `imageUrl` | Product image URL |
| `link` | `productUrl` | Home Depot product page |
| `availability.status` | `stockStatus` | Mapped to enum values |
| `availability.in_stock` | `stockStatus` | Boolean to status mapping |
| `rating` | `rating` | Customer rating (1-5) |
| `ratings_total` | `reviewCount` | Number of reviews |
| `specifications[]` | `specifications` | Key-value object |

## Categories

The service supports the following construction material categories:

- `lumber` - Lumber & Wood
- `concrete` - Concrete & Cement
- `electrical` - Electrical
- `plumbing` - Plumbing
- `hvac` - HVAC
- `roofing` - Roofing
- `flooring` - Flooring
- `paint` - Paint & Supplies
- `hardware` - Hardware & Fasteners
- `drywall` - Drywall & Supplies
- `tools` - Tools & Equipment
- `fixtures` - Fixtures & Fittings
- `insulation` - Insulation
- `doors_windows` - Doors & Windows
- `landscaping` - Landscaping
- `other` - Other Materials

## Stock Status Values

- `in_stock` - Available for purchase
- `low_stock` - Limited quantity available
- `out_of_stock` - Currently unavailable
- `special_order` - Available by special order (14-day lead time)

## Cost Optimization

### Reducing API Calls

1. **Caching**: 30-minute cache reduces duplicate searches
2. **Mock Data**: Use for development/testing
3. **Pagination**: Implement infinite scroll instead of loading all results
4. **Debouncing**: Add search input debouncing (500ms recommended)
5. **Category Filtering**: Pre-filter by category to narrow results

### Example: Search Debouncing

```typescript
import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

export function MaterialsSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearch) {
      // API call only fires 500ms after user stops typing
      searchProducts(debouncedSearch);
    }
  }, [debouncedSearch]);
}
```

## Troubleshooting

### No Results Returned

1. Check if API key is configured in `.env.local`
2. Verify API key is valid (test at https://serpapi.com/playground)
3. Check console logs for error messages
4. Ensure search query is specific enough
5. Try removing filters (category, price range) to broaden search

### API Rate Limit Exceeded

If you exceed 100 searches/month on the free tier:

1. **Upgrade Plan**: https://serpapi.com/pricing
2. **Use Cache**: Cached results don't count toward limit
3. **Mock Data**: System automatically falls back to mock data
4. **Optimize Searches**: Implement debouncing and reduce duplicate queries

### Inaccurate Category Mapping

Categories are auto-detected from product titles. If mapping is incorrect:

1. Products will still be searchable and usable
2. Category filters may not work as expected
3. Consider adding manual category override in UI
4. Submit issue for improved category detection

## Mock Data

When API key is not configured or API fails, the service uses mock data:

- **12 sample products** across all categories
- Includes realistic data (prices, SKUs, specifications)
- Supports all search filters
- Useful for development and testing

## Testing

### Unit Tests

```typescript
// Test with mock data (no API key)
describe('Home Depot API - Mock', () => {
  it('should search mock products', async () => {
    const results = await searchHomeDepotProducts({ query: 'lumber' });
    expect(results.products.length).toBeGreaterThan(0);
  });
});

// Test with real API (requires API key)
describe('Home Depot API - Real', () => {
  it('should search real products', async () => {
    process.env.SERPAPI_API_KEY = 'test_key';
    const results = await searchHomeDepotProducts({ query: 'drywall' });
    expect(results.products.length).toBeGreaterThan(0);
  });
});
```

### Manual Testing

1. **Without API Key**: Remove `SERPAPI_API_KEY` from `.env.local`
   - Should fall back to mock data
   - Console should show warning: "SERPAPI_API_KEY not configured, using mock data"

2. **With API Key**: Add valid `SERPAPI_API_KEY`
   - Should return real Home Depot products
   - Console should show: "Fetching from SerpAPI: {query}"
   - Verify live pricing and stock status

3. **Cache Testing**: Search same query twice
   - Second search should show: "Returning cached Home Depot search results"
   - No additional API call should be made

## Integration with Materials Module

The Home Depot API service is used by:

1. **Materials Search Page** (`/app/materials`)
   - Product search interface
   - Category filtering
   - Stock status filters

2. **Server Actions** (`app/actions/materials.ts`)
   - `searchProducts()` - Search Home Depot products
   - `createMaterialFromHomeDepot()` - Add products to catalog
   - `assignMaterialToTask()` - Assign materials to tasks

3. **UI Components**
   - `MaterialsSearch.tsx` - Search interface
   - `ProductCard.tsx` - Product display
   - `ProductComparisonModal.tsx` - Side-by-side comparison
   - `AssignMaterialModal.tsx` - Assignment form

## Future Enhancements

1. **Store Location**: Add store_id parameter for local inventory
2. **Product Details**: Fetch detailed product specs using product page scraping
3. **Price History**: Track price changes over time
4. **Availability Alerts**: Notify when out-of-stock items become available
5. **Database Caching**: Move from in-memory to database caching for persistence
6. **Alternative Suppliers**: Integrate Lowe's, Menards, or other supplier APIs
7. **Bulk Import**: Import product lists from CSV/Excel

## Support

For issues related to:
- **SerpAPI Integration**: Check SerpAPI documentation and support
- **GenHub Materials Module**: Submit issue to project repository
- **API Key Issues**: Contact SerpAPI support

## References

- SerpAPI Home Depot API: https://serpapi.com/home-depot-search-api
- SerpAPI Documentation: https://serpapi.com/docs
- Home Depot Website: https://www.homedepot.com/
- Materials Management Requirements: `.claude/tasks/context_session_10.md`
