/**
 * Home Depot API Service - SerpAPI Integration
 *
 * Integrates with SerpAPI's Home Depot Search API
 * Documentation: https://serpapi.com/home-depot-search-api
 *
 * Requirements 19: Materials Management with Home Depot Integration
 *
 * Environment Variables Required:
 * - SERPAPI_API_KEY: Your SerpAPI API key from https://serpapi.com/
 *
 * Note: SerpAPI has rate limits based on your plan. Consider implementing
 * caching for frequently searched products.
 */

export interface HomeDepotProduct {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  manufacturer: string;
  price: number;
  unitOfMeasure: string;
  imageUrl: string;
  productUrl: string;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' | 'special_order';
  stockQuantity?: number;
  leadTimeDays: number;
  specifications: {
    [key: string]: string;
  };
  rating?: number;
  reviewCount?: number;
}

export interface HomeDepotSearchParams {
  query: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface HomeDepotSearchResult {
  products: HomeDepotProduct[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// SerpAPI Response Types
interface SerpAPIProduct {
  product_id?: string;
  title?: string;
  link?: string;
  image?: string;
  thumbnails?: string[][]; // Nested array of thumbnail URLs at different sizes
  rating?: number;
  ratings_total?: number;
  reviews?: number;
  price?: string | number;
  extracted_price?: number; // Pre-extracted numeric price
  price_was?: number; // Original price if on sale
  shipping?: string;
  model_number?: string;
  brand?: string;
  is_sponsored?: boolean;
  position?: number;
  delivery?: {
    tagline?: string;
    pickup?: string;
  };
  pickup?: {
    availability?: string;
  };
  availability?: {
    status?: string;
    in_stock?: boolean;
    store_availability?: string;
  };
  specifications?: Array<{
    key: string;
    value: string;
  }>;
}

interface SerpAPIResponse {
  search_metadata?: {
    status?: string;
    total_time_taken?: number;
  };
  search_parameters?: {
    q?: string;
    page?: number;
  };
  products?: SerpAPIProduct[];
  pagination?: {
    current?: number;
    next?: string;
    total_results?: number;
  };
  error?: string;
}

// Simple in-memory cache to reduce API calls
interface CacheEntry {
  data: HomeDepotSearchResult;
  timestamp: number;
}

const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

// Fallback mock products for development/testing
const MOCK_PRODUCTS: HomeDepotProduct[] = [
  // Lumber
  {
    id: 'hd-1001',
    sku: '202532819',
    name: '2 in. x 4 in. x 8 ft. Premium Kiln-Dried Whitewood Stud',
    description: 'Premium kiln-dried whitewood stud ideal for interior framing and construction projects.',
    category: 'lumber',
    manufacturer: 'Severe Weather',
    price: 6.47,
    unitOfMeasure: 'each',
    imageUrl: 'https://images.thdstatic.com/productImages/202532819/svn/severe-weather-dimensional-lumber-202532819-64_400.jpg',
    productUrl: 'https://www.homedepot.com/p/202532819',
    stockStatus: 'in_stock',
    stockQuantity: 1500,
    leadTimeDays: 0,
    specifications: {
      'Actual Dimensions': '1.5 in. x 3.5 in. x 96 in.',
      'Wood Species': 'Whitewood',
      'Treatment': 'Kiln-Dried',
      'Grade': 'Stud Grade'
    },
    rating: 4.5,
    reviewCount: 287
  },
  {
    id: 'hd-1002',
    sku: '161640',
    name: '2 in. x 6 in. x 8 ft. #2 Ground Contact Pressure-Treated Lumber',
    description: 'Pressure-treated lumber for ground contact applications, resistant to rot and insects.',
    category: 'lumber',
    manufacturer: 'WeatherShield',
    price: 12.98,
    unitOfMeasure: 'each',
    imageUrl: 'https://images.thdstatic.com/productImages/161640/svn/weathershield-pressure-treated-lumber-161640-64_400.jpg',
    productUrl: 'https://www.homedepot.com/p/161640',
    stockStatus: 'in_stock',
    stockQuantity: 850,
    leadTimeDays: 0,
    specifications: {
      'Actual Dimensions': '1.5 in. x 5.5 in. x 96 in.',
      'Treatment': 'Pressure-Treated',
      'Use': 'Ground Contact',
      'Grade': '#2 and Better'
    },
    rating: 4.7,
    reviewCount: 412
  },
  // Concrete
  {
    id: 'hd-2001',
    sku: '100350432',
    name: 'QUIKRETE 80 lb. Concrete Mix',
    description: 'Commercial-grade concrete mix for structural and general construction applications.',
    category: 'concrete',
    manufacturer: 'QUIKRETE',
    price: 5.48,
    unitOfMeasure: 'bag',
    imageUrl: 'https://images.thdstatic.com/productImages/100350432/svn/quikrete-concrete-mix-100350432-64_400.jpg',
    productUrl: 'https://www.homedepot.com/p/100350432',
    stockStatus: 'in_stock',
    stockQuantity: 2400,
    leadTimeDays: 0,
    specifications: {
      'Weight': '80 lb',
      'Coverage': '0.6 cu. ft.',
      'Compressive Strength': '4000 PSI',
      'Set Time': '20-40 minutes'
    },
    rating: 4.6,
    reviewCount: 1523
  },
  // Electrical
  {
    id: 'hd-3001',
    sku: '202294320',
    name: 'Romex SIMpull 250 ft. 12/2 NM-B Wire',
    description: 'Non-metallic sheathed cable for residential wiring applications.',
    category: 'electrical',
    manufacturer: 'Southwire',
    price: 139.00,
    unitOfMeasure: 'roll',
    imageUrl: 'https://images.thdstatic.com/productImages/202294320/svn/southwire-electrical-wire-202294320-64_400.jpg',
    productUrl: 'https://www.homedepot.com/p/202294320',
    stockStatus: 'in_stock',
    stockQuantity: 45,
    leadTimeDays: 0,
    specifications: {
      'Length': '250 ft',
      'Gauge': '12 AWG',
      'Conductors': '2 with Ground',
      'Voltage Rating': '600V'
    },
    rating: 4.8,
    reviewCount: 342
  },
  {
    id: 'hd-3002',
    sku: '100404072',
    name: 'RACO 4 in. Square Electrical Box',
    description: 'Galvanized steel electrical box for switches and receptacles.',
    category: 'electrical',
    manufacturer: 'RACO',
    price: 2.18,
    unitOfMeasure: 'each',
    imageUrl: 'https://images.thdstatic.com/productImages/100404072/svn/raco-electrical-boxes-100404072-64_400.jpg',
    productUrl: 'https://www.homedepot.com/p/100404072',
    stockStatus: 'in_stock',
    stockQuantity: 780,
    leadTimeDays: 0,
    specifications: {
      'Size': '4 in. Square',
      'Depth': '2-1/8 in.',
      'Material': 'Galvanized Steel',
      'Knockouts': '1/2 in. and 3/4 in.'
    },
    rating: 4.7,
    reviewCount: 156
  },
  // Plumbing
  {
    id: 'hd-4001',
    sku: '100134328',
    name: 'Charlotte Pipe 3 in. x 10 ft. PVC DWV Pipe',
    description: 'PVC drain, waste and vent pipe for residential plumbing systems.',
    category: 'plumbing',
    manufacturer: 'Charlotte Pipe',
    price: 14.27,
    unitOfMeasure: 'each',
    imageUrl: 'https://images.thdstatic.com/productImages/100134328/svn/charlotte-pipe-pvc-dwv-pipe-100134328-64_400.jpg',
    productUrl: 'https://www.homedepot.com/p/100134328',
    stockStatus: 'in_stock',
    stockQuantity: 320,
    leadTimeDays: 0,
    specifications: {
      'Diameter': '3 in.',
      'Length': '10 ft',
      'Material': 'PVC Schedule 40',
      'Color': 'White'
    },
    rating: 4.6,
    reviewCount: 89
  },
  // Drywall
  {
    id: 'hd-5001',
    sku: '100321605',
    name: 'Sheetrock Brand 1/2 in. x 4 ft. x 8 ft. UltraLight Drywall',
    description: 'Lightweight drywall panel, 30% lighter than standard drywall.',
    category: 'drywall',
    manufacturer: 'USG',
    price: 14.98,
    unitOfMeasure: 'sheet',
    imageUrl: 'https://images.thdstatic.com/productImages/100321605/svn/usg-sheetrock-drywall-100321605-64_400.jpg',
    productUrl: 'https://www.homedepot.com/p/100321605',
    stockStatus: 'in_stock',
    stockQuantity: 650,
    leadTimeDays: 0,
    specifications: {
      'Thickness': '1/2 in.',
      'Dimensions': '4 ft x 8 ft',
      'Weight': '37.3 lb',
      'Edge Type': 'Tapered'
    },
    rating: 4.5,
    reviewCount: 523
  },
  {
    id: 'hd-5002',
    sku: '100391484',
    name: 'DAP 4.5 Gal. Pre-Mixed Drywall Joint Compound',
    description: 'Ready-mixed joint compound for taping, finishing and texturing drywall.',
    category: 'drywall',
    manufacturer: 'DAP',
    price: 18.97,
    unitOfMeasure: 'bucket',
    imageUrl: 'https://images.thdstatic.com/productImages/100391484/svn/dap-joint-compound-100391484-64_400.jpg',
    productUrl: 'https://www.homedepot.com/p/100391484',
    stockStatus: 'in_stock',
    stockQuantity: 280,
    leadTimeDays: 0,
    specifications: {
      'Volume': '4.5 gal',
      'Type': 'All-Purpose',
      'Drying Time': '24 hours',
      'Sandability': 'Excellent'
    },
    rating: 4.7,
    reviewCount: 876
  },
  // Roofing
  {
    id: 'hd-6001',
    sku: '100131467',
    name: 'GAF Timberline HDZ Charcoal Architectural Shingles (33.3 sq. ft.)',
    description: 'Premium architectural shingles with StainGuard protection.',
    category: 'roofing',
    manufacturer: 'GAF',
    price: 43.98,
    unitOfMeasure: 'bundle',
    imageUrl: 'https://images.thdstatic.com/productImages/100131467/svn/gaf-architectural-shingles-100131467-64_400.jpg',
    productUrl: 'https://www.homedepot.com/p/100131467',
    stockStatus: 'in_stock',
    stockQuantity: 420,
    leadTimeDays: 0,
    specifications: {
      'Coverage': '33.3 sq. ft.',
      'Color': 'Charcoal',
      'Warranty': 'Lifetime Limited',
      'Wind Rating': '130 MPH'
    },
    rating: 4.8,
    reviewCount: 1245
  },
  // Paint
  {
    id: 'hd-7001',
    sku: '205352642',
    name: 'BEHR Premium Plus Ultra 1 gal. Ultra Pure White Interior Paint',
    description: 'Premium interior paint and primer in one with advanced stain-blocking technology.',
    category: 'paint',
    manufacturer: 'BEHR',
    price: 38.98,
    unitOfMeasure: 'gallon',
    imageUrl: 'https://images.thdstatic.com/productImages/205352642/svn/behr-interior-paint-205352642-64_400.jpg',
    productUrl: 'https://www.homedepot.com/p/205352642',
    stockStatus: 'in_stock',
    stockQuantity: 340,
    leadTimeDays: 0,
    specifications: {
      'Volume': '1 gal',
      'Finish': 'Eggshell',
      'Coverage': '250-400 sq. ft.',
      'Dry Time': '1 hour'
    },
    rating: 4.6,
    reviewCount: 2341
  },
  // Hardware
  {
    id: 'hd-8001',
    sku: '202034373',
    name: 'Grip-Rite #8 x 3 in. Philips Bugle-Head Coarse Thread Sharp Point Drywall Screws (1 lb./Pack)',
    description: 'Coarse thread drywall screws for attaching drywall to wood studs.',
    category: 'hardware',
    manufacturer: 'Grip-Rite',
    price: 7.97,
    unitOfMeasure: 'pack',
    imageUrl: 'https://images.thdstatic.com/productImages/202034373/svn/grip-rite-drywall-screws-202034373-64_400.jpg',
    productUrl: 'https://www.homedepot.com/p/202034373',
    stockStatus: 'in_stock',
    stockQuantity: 1200,
    leadTimeDays: 0,
    specifications: {
      'Size': '#8 x 3 in.',
      'Thread': 'Coarse',
      'Head': 'Bugle',
      'Quantity': 'Approx. 290 per lb'
    },
    rating: 4.7,
    reviewCount: 456
  },
  // HVAC
  {
    id: 'hd-9001',
    sku: '100396925',
    name: 'Master Flow 6 in. x 25 ft. Insulated Flexible Duct R6 Silver Jacket',
    description: 'Insulated flexible duct for HVAC air distribution systems.',
    category: 'hvac',
    manufacturer: 'Master Flow',
    price: 32.47,
    unitOfMeasure: 'each',
    imageUrl: 'https://images.thdstatic.com/productImages/100396925/svn/master-flow-duct-insulation-100396925-64_400.jpg',
    productUrl: 'https://www.homedepot.com/p/100396925',
    stockStatus: 'in_stock',
    stockQuantity: 85,
    leadTimeDays: 0,
    specifications: {
      'Diameter': '6 in.',
      'Length': '25 ft',
      'R-Value': 'R6',
      'Jacket': 'Metalized Polyester'
    },
    rating: 4.5,
    reviewCount: 123
  },
  // Flooring
  {
    id: 'hd-10001',
    sku: '305003290',
    name: 'TrafficMASTER Allure Ultra 7.5 in. x 47.6 in. Aspen Oak Blonde Luxury Vinyl Plank (19.8 sq. ft./case)',
    description: 'Waterproof luxury vinyl plank flooring with realistic wood grain texture.',
    category: 'flooring',
    manufacturer: 'TrafficMASTER',
    price: 35.88,
    unitOfMeasure: 'case',
    imageUrl: 'https://images.thdstatic.com/productImages/305003290/svn/trafficmaster-vinyl-plank-305003290-64_400.jpg',
    productUrl: 'https://www.homedepot.com/p/305003290',
    stockStatus: 'in_stock',
    stockQuantity: 240,
    leadTimeDays: 0,
    specifications: {
      'Coverage': '19.8 sq. ft.',
      'Thickness': '5.5 mm',
      'Wear Layer': '12 mil',
      'Installation': 'Floating/Click-Lock'
    },
    rating: 4.4,
    reviewCount: 1876
  }
];

/**
 * Helper: Map SerpAPI category to our category system
 */
function mapCategoryToEnum(title?: string, brand?: string): string {
  if (!title) return 'other';

  const titleLower = title.toLowerCase();

  // Category mapping based on product title/description
  if (titleLower.includes('lumber') || titleLower.includes('wood') || titleLower.includes('stud') || titleLower.includes('plywood')) return 'lumber';
  if (titleLower.includes('concrete') || titleLower.includes('cement') || titleLower.includes('mortar')) return 'concrete';
  if (titleLower.includes('wire') || titleLower.includes('electrical') || titleLower.includes('outlet') || titleLower.includes('switch')) return 'electrical';
  if (titleLower.includes('pipe') || titleLower.includes('plumbing') || titleLower.includes('faucet') || titleLower.includes('drain')) return 'plumbing';
  if (titleLower.includes('hvac') || titleLower.includes('duct') || titleLower.includes('ventilation')) return 'hvac';
  if (titleLower.includes('roof') || titleLower.includes('shingle')) return 'roofing';
  if (titleLower.includes('floor') || titleLower.includes('tile') || titleLower.includes('vinyl') || titleLower.includes('laminate')) return 'flooring';
  if (titleLower.includes('paint') || titleLower.includes('primer') || titleLower.includes('stain')) return 'paint';
  if (titleLower.includes('screw') || titleLower.includes('nail') || titleLower.includes('bolt') || titleLower.includes('fastener')) return 'hardware';
  if (titleLower.includes('drywall') || titleLower.includes('gypsum') || titleLower.includes('joint compound')) return 'drywall';
  if (titleLower.includes('door') || titleLower.includes('window')) return 'doors_windows';
  if (titleLower.includes('insulation') || titleLower.includes('foam board')) return 'insulation';
  if (titleLower.includes('drill') || titleLower.includes('saw') || titleLower.includes('tool')) return 'tools';
  if (titleLower.includes('fixture') || titleLower.includes('light') || titleLower.includes('faucet')) return 'fixtures';

  return 'other';
}

/**
 * Helper: Extract best image URL from SerpAPI product
 * Prefers thumbnails array (600px for good quality), falls back to image field
 */
function extractImageUrl(product: SerpAPIProduct): string {
  // Try thumbnails array first (SerpAPI provides nested array of URLs)
  if (product.thumbnails && product.thumbnails.length > 0) {
    // Flatten the nested array structure
    const allThumbnails = product.thumbnails.flat();

    // Prefer 600px size for good quality
    const preferred = allThumbnails.find(url => url.includes('_600.jpg'));
    if (preferred) return preferred;

    // Try 400px as fallback
    const medium = allThumbnails.find(url => url.includes('_400.jpg'));
    if (medium) return medium;

    // Try 1000px for high quality
    const large = allThumbnails.find(url => url.includes('_1000.jpg'));
    if (large) return large;

    // Take any available thumbnail
    if (allThumbnails.length > 0 && allThumbnails[0]) {
      return allThumbnails[0];
    }
  }

  // Fall back to image field
  if (product.image) return product.image;

  // Fall back to link-based image URL construction (use 600px)
  if (product.product_id) {
    return `https://images.thdstatic.com/productImages/${product.product_id}/svn/${product.product_id}-64_600.jpg`;
  }

  return '';
}

/**
 * Helper: Map SerpAPI product to our product interface
 */
function mapSerpAPIProduct(product: SerpAPIProduct): HomeDepotProduct {
  // Extract price - prefer extracted_price, then parse from string
  let price = 0;
  if (product.extracted_price !== undefined && product.extracted_price > 0) {
    price = product.extracted_price;
  } else if (typeof product.price === 'string') {
    const priceMatch = product.price.match(/[\d,]+\.?\d*/);
    price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : 0;
  } else if (typeof product.price === 'number') {
    price = product.price;
  }

  // Determine stock status from multiple sources
  let stockStatus: HomeDepotProduct['stockStatus'] = 'in_stock';

  // Check availability object
  if (product.availability?.status) {
    const status = product.availability.status.toLowerCase();
    if (status.includes('out of stock')) stockStatus = 'out_of_stock';
    else if (status.includes('low stock') || status.includes('limited')) stockStatus = 'low_stock';
    else if (status.includes('special order') || status.includes('ship to')) stockStatus = 'special_order';
  } else if (product.availability?.in_stock === false) {
    stockStatus = 'out_of_stock';
  }

  // Also check pickup availability
  if (product.pickup?.availability) {
    const pickup = product.pickup.availability.toLowerCase();
    if (pickup.includes('unavailable') || pickup.includes('out of stock')) {
      stockStatus = stockStatus === 'in_stock' ? 'low_stock' : stockStatus;
    }
  }

  // Build specifications object
  const specifications: { [key: string]: string } = {};
  if (product.specifications) {
    product.specifications.forEach(spec => {
      if (spec.key && spec.value) {
        specifications[spec.key] = spec.value;
      }
    });
  }

  // Add model number if available
  if (product.model_number) {
    specifications['Model Number'] = product.model_number;
  }

  // Add brand if available
  if (product.brand) {
    specifications['Brand'] = product.brand;
  }

  // Extract unit of measure from title or default to 'each'
  let unitOfMeasure = 'each';
  const titleLower = product.title?.toLowerCase() || '';
  if (titleLower.includes('gal')) unitOfMeasure = 'gallon';
  else if (titleLower.includes('lb')) unitOfMeasure = 'pound';
  else if (titleLower.includes('ft')) unitOfMeasure = 'foot';
  else if (titleLower.includes('sq')) unitOfMeasure = 'square foot';
  else if (titleLower.includes('bundle')) unitOfMeasure = 'bundle';
  else if (titleLower.includes('case')) unitOfMeasure = 'case';
  else if (titleLower.includes('bag')) unitOfMeasure = 'bag';
  else if (titleLower.includes('box')) unitOfMeasure = 'box';
  else if (titleLower.includes('pack')) unitOfMeasure = 'pack';
  else if (titleLower.includes('roll')) unitOfMeasure = 'roll';
  else if (titleLower.includes('sheet')) unitOfMeasure = 'sheet';

  // Extract image using our helper function
  const imageUrl = extractImageUrl(product);

  return {
    id: product.product_id || `hd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    sku: product.model_number || product.product_id || '',
    name: product.title || 'Unknown Product',
    description: product.title || '',
    category: mapCategoryToEnum(product.title, product.brand),
    manufacturer: product.brand || 'Unknown',
    price,
    unitOfMeasure,
    imageUrl,
    productUrl: product.link || `https://www.homedepot.com/p/${product.product_id}`,
    stockStatus,
    stockQuantity: product.availability?.in_stock ? undefined : 0,
    leadTimeDays: stockStatus === 'special_order' ? 14 : stockStatus === 'out_of_stock' ? 7 : 0,
    specifications,
    rating: product.rating,
    reviewCount: product.ratings_total || product.reviews,
  };
}

/**
 * Helper: Create cache key from search params
 */
function getCacheKey(params: HomeDepotSearchParams): string {
  const { query, category, minPrice, maxPrice, inStockOnly, page, limit } = params;
  return JSON.stringify({ query, category, minPrice, maxPrice, inStockOnly, page, limit });
}

/**
 * Helper: Check if cache entry is valid
 */
function isCacheValid(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp < CACHE_TTL;
}

/**
 * Search Home Depot products using SerpAPI
 */
export async function searchHomeDepotProducts(
  params: HomeDepotSearchParams
): Promise<HomeDepotSearchResult> {
  const {
    query,
    category,
    minPrice,
    maxPrice,
    inStockOnly = false,
    page = 1,
    limit = 20
  } = params;

  // Check cache first
  const cacheKey = getCacheKey(params);
  const cachedResult = searchCache.get(cacheKey);
  if (cachedResult && isCacheValid(cachedResult)) {
    console.log('Returning cached Home Depot search results');
    return cachedResult.data;
  }

  // Check if API key is available
  const apiKey = process.env.SERPAPI_API_KEY;

  if (!apiKey) {
    console.warn('SERPAPI_API_KEY not configured, using mock data');
    return searchMockProducts(params);
  }

  try {
    // Build search query with category filter if provided
    let searchQuery = query || '';
    if (category) {
      const categoryDisplayName = getCategoryDisplayName(category);
      searchQuery = `${categoryDisplayName} ${searchQuery}`.trim();
    }

    // Ensure we have a search query
    if (!searchQuery) {
      searchQuery = 'building materials';
    }

    // Build SerpAPI URL with optimized parameters
    const serpApiUrl = new URL('https://serpapi.com/search');
    serpApiUrl.searchParams.append('engine', 'home_depot');
    serpApiUrl.searchParams.append('q', searchQuery);
    serpApiUrl.searchParams.append('api_key', apiKey);

    // Pagination - use 'ps' for items per page (max 48) and calculate offset
    const itemsPerPage = Math.min(limit, 48); // Max 48 per SerpAPI docs
    serpApiUrl.searchParams.append('ps', itemsPerPage.toString());

    // Use 'nao' for offset-based pagination (0, 24, 48, etc.)
    if (page > 1) {
      const offset = (page - 1) * itemsPerPage;
      serpApiUrl.searchParams.append('nao', offset.toString());
    }

    // Sorting - default to best_match for relevance
    serpApiUrl.searchParams.append('hd_sort', 'best_match');

    // Price filtering at API level (more efficient)
    if (minPrice !== undefined && minPrice > 0) {
      serpApiUrl.searchParams.append('lowerbound', minPrice.toString());
    }
    if (maxPrice !== undefined && maxPrice > 0) {
      serpApiUrl.searchParams.append('upperbound', maxPrice.toString());
    }

    console.log('Fetching from SerpAPI:', searchQuery, '| Params:', {
      ps: itemsPerPage,
      page,
      minPrice,
      maxPrice
    });

    // Make API request
    const response = await fetch(serpApiUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`SerpAPI request failed: ${response.status} ${response.statusText}`);
    }

    const data: SerpAPIResponse = await response.json();

    // Check for API errors
    if (data.error) {
      throw new Error(`SerpAPI error: ${data.error}`);
    }

    if (!data.products || data.products.length === 0) {
      console.log('No products found from SerpAPI, using mock data');
      return searchMockProducts(params);
    }

    // Map SerpAPI products to our format
    let products = data.products.map(mapSerpAPIProduct);

    // Apply client-side filters (for filters not supported by SerpAPI)
    // Note: Price filtering is now done at API level via lowerbound/upperbound
    products = products.filter(product => {
      // Stock filter (SerpAPI doesn't have this filter)
      if (inStockOnly && product.stockStatus !== 'in_stock') return false;

      // Additional price validation (in case API filter didn't work perfectly)
      if (minPrice !== undefined && product.price < minPrice) return false;
      if (maxPrice !== undefined && product.price > maxPrice) return false;

      return true;
    });

    const total = data.pagination?.total_results || products.length;
    const hasMore = products.length >= limit;

    const result: HomeDepotSearchResult = {
      products,
      total,
      page,
      limit,
      hasMore,
    };

    // Cache the result
    searchCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    return result;
  } catch (error) {
    console.error('Error fetching from SerpAPI:', error);
    console.log('Falling back to mock data');

    // Fallback to mock products on error
    return searchMockProducts(params);
  }
}

/**
 * Fallback: Search mock products (used when API is unavailable)
 */
function searchMockProducts(params: HomeDepotSearchParams): HomeDepotSearchResult {
  const {
    query,
    category,
    minPrice,
    maxPrice,
    inStockOnly = false,
    page = 1,
    limit = 20
  } = params;

  // Filter products
  const filteredProducts = MOCK_PRODUCTS.filter(product => {
    // Search query match
    const searchMatch = query.toLowerCase().split(' ').every(term =>
      product.name.toLowerCase().includes(term) ||
      product.description.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term)
    );

    if (!searchMatch) return false;

    // Category filter
    if (category && product.category !== category) return false;

    // Price range filter
    if (minPrice !== undefined && product.price < minPrice) return false;
    if (maxPrice !== undefined && product.price > maxPrice) return false;

    // Stock filter
    if (inStockOnly && product.stockStatus !== 'in_stock') return false;

    return true;
  });

  // Pagination
  const total = filteredProducts.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  return {
    products: paginatedProducts,
    total,
    page,
    limit,
    hasMore: endIndex < total
  };
}

/**
 * Get product by ID
 * Note: SerpAPI doesn't have a direct product lookup by ID, so we search by SKU or use mock data
 */
export async function getHomeDepotProduct(productId: string): Promise<HomeDepotProduct | null> {
  // First check mock products
  const mockProduct = MOCK_PRODUCTS.find(p => p.id === productId);
  if (mockProduct) {
    return mockProduct;
  }

  // If not found in mocks and API key is available, try searching by product ID
  const apiKey = process.env.SERPAPI_API_KEY;
  if (apiKey) {
    try {
      const results = await searchHomeDepotProducts({ query: productId, limit: 5 });
      return results.products.find(p => p.id === productId) || null;
    } catch (error) {
      console.error('Error fetching product by ID:', error);
      return null;
    }
  }

  return null;
}

/**
 * Get product by SKU
 * Searches for products using the SKU
 */
export async function getHomeDepotProductBySku(sku: string): Promise<HomeDepotProduct | null> {
  // First check mock products
  const mockProduct = MOCK_PRODUCTS.find(p => p.sku === sku);
  if (mockProduct) {
    return mockProduct;
  }

  // If not found in mocks and API key is available, search by SKU
  const apiKey = process.env.SERPAPI_API_KEY;
  if (apiKey) {
    try {
      const results = await searchHomeDepotProducts({ query: sku, limit: 5 });
      return results.products.find(p => p.sku === sku) || results.products[0] || null;
    } catch (error) {
      console.error('Error fetching product by SKU:', error);
      return null;
    }
  }

  return null;
}

/**
 * Get all available categories
 */
export function getHomeDepotCategories(): string[] {
  return [
    'lumber',
    'concrete',
    'electrical',
    'plumbing',
    'hvac',
    'roofing',
    'flooring',
    'paint',
    'hardware',
    'drywall',
    'tools',
    'fixtures',
    'insulation',
    'doors_windows',
    'landscaping',
    'other'
  ];
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(category: string): string {
  const categoryNames: Record<string, string> = {
    lumber: 'Lumber & Wood',
    concrete: 'Concrete & Cement',
    electrical: 'Electrical',
    plumbing: 'Plumbing',
    hvac: 'HVAC',
    roofing: 'Roofing',
    flooring: 'Flooring',
    paint: 'Paint & Supplies',
    hardware: 'Hardware & Fasteners',
    drywall: 'Drywall & Supplies',
    tools: 'Tools & Equipment',
    fixtures: 'Fixtures & Fittings',
    insulation: 'Insulation',
    doors_windows: 'Doors & Windows',
    landscaping: 'Landscaping',
    other: 'Other Materials'
  };

  return categoryNames[category] || category;
}
