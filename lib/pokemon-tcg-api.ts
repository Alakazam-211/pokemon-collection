// Pokemon TCG API integration
// Documentation: https://docs.pokemontcg.io/

const API_BASE_URL = 'https://api.pokemontcg.io/v2';

// Simple in-memory cache (in production, consider Redis or similar)
const cache = new Map<string, { data: PokemonTCGSearchResponse; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

export interface PokemonTCGCard {
  id: string;
  name: string;
  supertype: string;
  subtypes: string[];
  hp?: string;
  types?: string[];
  evolvesFrom?: string;
  evolvesTo?: string[];
  rules?: string[];
  abilities?: Array<{
    name: string;
    text: string;
    type: string;
  }>;
  attacks?: Array<{
    name: string;
    cost: string[];
    convertedEnergyCost: number;
    damage: string;
    text: string;
  }>;
  weaknesses?: Array<{
    type: string;
    value: string;
  }>;
  resistances?: Array<{
    type: string;
    value: string;
  }>;
  retreatCost?: string[];
  convertedRetreatCost?: number;
  set: {
    id: string;
    name: string;
    series: string;
    printedTotal: number;
    total: number;
    legalities: {
      unlimited?: string;
      standard?: string;
      expanded?: string;
    };
    ptcgoCode?: string;
    releaseDate: string;
    updatedAt: string;
    images: {
      symbol: string;
      logo: string;
    };
  };
  number: string;
  artist?: string;
  rarity: string;
  flavorText?: string;
  nationalPokedexNumbers?: number[];
  legalities: {
    unlimited?: string;
    standard?: string;
    expanded?: string;
  };
  images: {
    small: string;
    large: string;
  };
  tcgplayer?: {
    url: string;
    updatedAt: string;
    prices: {
      normal?: {
        low?: number;
        mid?: number;
        high?: number;
        market?: number;
        directLow?: number;
      };
      holofoil?: {
        low?: number;
        mid?: number;
        high?: number;
        market?: number;
        directLow?: number;
      };
      '1stEditionHolofoil'?: {
        low?: number;
        mid?: number;
        high?: number;
        market?: number;
        directLow?: number;
      };
      unlimitedHolofoil?: {
        low?: number;
        mid?: number;
        high?: number;
        market?: number;
        directLow?: number;
      };
      reverseHolofoil?: {
        low?: number;
        mid?: number;
        high?: number;
        market?: number;
        directLow?: number;
      };
    };
  };
  cardmarket?: {
    url: string;
    updatedAt: string;
    prices: {
      averageSellPrice?: number;
      lowPrice?: number;
      trendPrice?: number;
      germanProLow?: number;
      suggestedPrice?: number;
      reverseHoloSell?: number;
      reverseHoloLow?: number;
      reverseHoloTrend?: number;
      lowPriceExPlus?: number;
      avg1?: number;
      avg7?: number;
      avg30?: number;
      reverseHoloAvg1?: number;
      reverseHoloAvg7?: number;
      reverseHoloAvg30?: number;
    };
  };
}

export interface PokemonTCGSearchResponse {
  data: PokemonTCGCard[];
  page: number;
  pageSize: number;
  count: number;
  totalCount: number;
}

export interface SearchParams {
  q?: string; // Query string
  name?: string;
  set?: string;
  number?: string;
  rarity?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Search for Pokemon cards using the Pokemon TCG API
 */
export async function searchCards(params: SearchParams = {}): Promise<PokemonTCGSearchResponse> {
  const startTime = Date.now();
  const queryParams = new URLSearchParams();
  
  // Build query string
  if (params.q) {
    // Capitalize first letter
    const capitalizedQuery = params.q.charAt(0).toUpperCase() + params.q.slice(1).toLowerCase();
    
    // If q is already formatted (contains quotes or colons), use as-is
    // Otherwise, try exact match first, then wildcard if needed
    let formattedQuery: string;
    if (params.q.includes(':') || params.q.includes('"')) {
      formattedQuery = params.q;
    } else {
      // Try exact match first (faster), fallback to wildcard if no results
      formattedQuery = `name:"${capitalizedQuery}"`;
    }
    queryParams.append('q', formattedQuery);
  } else {
    // Build query from individual params
    const queryParts: string[] = [];
    if (params.name) {
      const capitalizedName = params.name.charAt(0).toUpperCase() + params.name.slice(1).toLowerCase();
      queryParts.push(`name:${capitalizedName}*`);
    }
    if (params.set) queryParts.push(`set.name:"${params.set}"`);
    if (params.number) queryParts.push(`number:${params.number}`);
    if (params.rarity) queryParts.push(`rarity:"${params.rarity}"`);
    
    if (queryParts.length > 0) {
      queryParams.append('q', queryParts.join(' '));
    }
  }
  
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  
  const url = `${API_BASE_URL}/cards?${queryParams.toString()}`;
  const queryBuildTime = Date.now() - startTime;
  
  // Check cache first
  const cacheKey = url;
  const cached = cache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    // #region agent log
    await fetch('http://127.0.0.1:7251/ingest/2b29af8d-f28f-411d-acc1-a9922535324c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pokemon-tcg-api.ts:190',message:'Cache hit',data:{cacheKey,age:Date.now()-cached.timestamp},timestamp:Date.now(),sessionId:'debug-session',runId:'perf-tracking',hypothesisId:'perf'})}).catch(()=>{});
    // #endregion
    return cached.data;
  }
  
  try {
    // #region agent log
    await fetch('http://127.0.0.1:7251/ingest/2b29af8d-f28f-411d-acc1-a9922535324c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pokemon-tcg-api.ts:196',message:'Calling Pokemon TCG API',data:{url,queryParams:queryParams.toString(),params,queryBuildTime,cacheMiss:true},timestamp:Date.now(),sessionId:'debug-session',runId:'perf-tracking',hypothesisId:'perf'})}).catch(()=>{});
    // #endregion
    
    const fetchStartTime = Date.now();
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    const fetchTime = Date.now() - fetchStartTime;
    
    // #region agent log
    await fetch('http://127.0.0.1:7251/ingest/2b29af8d-f28f-411d-acc1-a9922535324c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pokemon-tcg-api.ts:195',message:'Pokemon TCG API response received',data:{status:response.status,statusText:response.statusText,ok:response.ok,fetchTime},timestamp:Date.now(),sessionId:'debug-session',runId:'perf-tracking',hypothesisId:'perf'})}).catch(()=>{});
    // #endregion
    
    if (!response.ok) {
      // #region agent log
      const errorBody = await response.text().catch(() => 'Could not read error body');
      await fetch('http://127.0.0.1:7251/ingest/2b29af8d-f28f-411d-acc1-a9922535324c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pokemon-tcg-api.ts:202',message:'Pokemon TCG API error response',data:{status:response.status,statusText:response.statusText,errorBody},timestamp:Date.now(),sessionId:'debug-session',runId:'perf-tracking',hypothesisId:'perf'})}).catch(()=>{});
      // #endregion
      throw new Error(`Pokemon TCG API error: ${response.status} ${response.statusText}`);
    }
    
    const parseStartTime = Date.now();
    const data = await response.json();
    const parseTime = Date.now() - parseStartTime;
    const totalTime = Date.now() - startTime;
    
    // If no results with exact match and we used exact match, try wildcard
    if (params.q && !params.q.includes(':') && !params.q.includes('"') && 
        (!data.data || data.data.length === 0)) {
      const capitalizedQuery = params.q.charAt(0).toUpperCase() + params.q.slice(1).toLowerCase();
      const wildcardQuery = `name:${capitalizedQuery}*`;
      const wildcardUrl = `${API_BASE_URL}/cards?q=${encodeURIComponent(wildcardQuery)}&pageSize=${params.pageSize || 20}`;
      
      // Check cache for wildcard query
      const wildcardCached = cache.get(wildcardUrl);
      if (wildcardCached && (Date.now() - wildcardCached.timestamp) < CACHE_TTL) {
        // #region agent log
        await fetch('http://127.0.0.1:7251/ingest/2b29af8d-f28f-411d-acc1-a9922535324c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pokemon-tcg-api.ts:218',message:'Wildcard cache hit',data:{wildcardQuery},timestamp:Date.now(),sessionId:'debug-session',runId:'perf-tracking',hypothesisId:'perf'})}).catch(()=>{});
        // #endregion
        return wildcardCached.data;
      }
      
      // #region agent log
      await fetch('http://127.0.0.1:7251/ingest/2b29af8d-f28f-411d-acc1-a9922535324c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pokemon-tcg-api.ts:223',message:'Trying wildcard search',data:{wildcardQuery,wildcardUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'perf-tracking',hypothesisId:'perf'})}).catch(()=>{});
      // #endregion
      
      const wildcardFetchStart = Date.now();
      const wildcardResponse = await fetch(wildcardUrl, {
        headers: { 'Accept': 'application/json' },
      });
      const wildcardFetchTime = Date.now() - wildcardFetchStart;
      
      if (wildcardResponse.ok) {
        const wildcardData = await wildcardResponse.json();
        // Cache wildcard result
        cache.set(wildcardUrl, { data: wildcardData, timestamp: Date.now() });
        // #region agent log
        await fetch('http://127.0.0.1:7251/ingest/2b29af8d-f28f-411d-acc1-a9922535324c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pokemon-tcg-api.ts:233',message:'Wildcard search success',data:{hasData:!!wildcardData.data,dataLength:wildcardData.data?.length||0,wildcardFetchTime},timestamp:Date.now(),sessionId:'debug-session',runId:'perf-tracking',hypothesisId:'perf'})}).catch(()=>{});
        // #endregion
        return wildcardData;
      }
    }
    
    // Cache the result
    cache.set(cacheKey, { data, timestamp: Date.now() });
    
    // #region agent log
    await fetch('http://127.0.0.1:7251/ingest/2b29af8d-f28f-411d-acc1-a9922535324c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pokemon-tcg-api.ts:242',message:'Pokemon TCG API success',data:{hasData:!!data.data,dataLength:data.data?.length||0,queryBuildTime,fetchTime,parseTime,totalTime,cached:false},timestamp:Date.now(),sessionId:'debug-session',runId:'perf-tracking',hypothesisId:'perf'})}).catch(()=>{});
    // #endregion
    return data;
  } catch (error) {
    // #region agent log
    await fetch('http://127.0.0.1:7251/ingest/2b29af8d-f28f-411d-acc1-a9922535324c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pokemon-tcg-api.ts:144',message:'Exception in searchCards',data:{errorMessage:error instanceof Error?error.message:'Unknown',errorName:error instanceof Error?error.name:'Unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    console.error('Error searching Pokemon cards:', error);
    throw error;
  }
}

/**
 * Get a specific card by ID
 */
export async function getCardById(cardId: string): Promise<PokemonTCGCard> {
  const url = `${API_BASE_URL}/cards/${cardId}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Pokemon TCG API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching Pokemon card:', error);
    throw error;
  }
}

/**
 * Get all available sets
 */
export async function getSets(): Promise<any[]> {
  const url = `${API_BASE_URL}/sets`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Pokemon TCG API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching sets:', error);
    throw error;
  }
}

/**
 * Convert Pokemon TCG API card to our PokemonCard format
 */
export function convertTCGCardToPokemonCard(tcgCard: PokemonTCGCard, condition: string = 'Near Mint', value?: number): Omit<import('@/types/pokemon').PokemonCard, 'id'> {
  // Try to get price from TCGPlayer or CardMarket
  let cardValue = value;
  if (!cardValue && tcgCard.tcgplayer?.prices) {
    const prices = tcgCard.tcgplayer.prices;
    // Prefer market price, then mid, then low
    cardValue = prices.normal?.market || 
                prices.normal?.mid || 
                prices.normal?.low ||
                prices.holofoil?.market ||
                prices.holofoil?.mid ||
                prices.holofoil?.low ||
                0;
  }
  
  if (!cardValue && tcgCard.cardmarket?.prices) {
    const prices = tcgCard.cardmarket.prices;
    cardValue = prices.trendPrice || prices.averageSellPrice || prices.suggestedPrice || 0;
  }
  
  return {
    name: tcgCard.name,
    set: tcgCard.set.name,
    number: tcgCard.number,
    rarity: tcgCard.rarity,
    condition: condition as any,
    value: cardValue || 0,
    quantity: 1,
    imageUrl: tcgCard.images.large || tcgCard.images.small,
  };
}

