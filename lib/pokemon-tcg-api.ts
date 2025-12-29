// Pokemon TCG API integration
// Documentation: https://docs.pokemontcg.io/

const API_BASE_URL = 'https://api.pokemontcg.io/v2';

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
  const queryParams = new URLSearchParams();
  
  // Build query string
  if (params.q) {
    queryParams.append('q', params.q);
  } else {
    // Build query from individual params
    const queryParts: string[] = [];
    if (params.name) queryParts.push(`name:"${params.name}"`);
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
    return data;
  } catch (error) {
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

