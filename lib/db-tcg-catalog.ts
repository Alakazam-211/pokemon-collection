// Database functions for querying the local TCG catalog
import { sql } from '@vercel/postgres';
import { PokemonTCGCard } from './pokemon-tcg-api';

export interface TCGCatalogCard {
  id: string;
  name: string;
  supertype: string | null;
  subtypes: string[] | null;
  hp: string | null;
  types: string[] | null;
  set_id: string;
  set_name: string;
  set_series: string | null;
  number: string | null;
  artist: string | null;
  rarity: string | null;
  flavor_text: string | null;
  national_pokedex_numbers: number[] | null;
  images_small: string | null;
  images_large: string | null;
  tcgplayer_url: string | null;
  cardmarket_url: string | null;
  price_normal_market: number | null;
  price_normal_mid: number | null;
  price_normal_low: number | null;
  price_holofoil_market: number | null;
  price_holofoil_mid: number | null;
}

export interface CatalogSearchResult {
  data: TCGCatalogCard[];
  totalCount: number;
}

/**
 * Search the local TCG catalog with fuzzy matching
 * Supports partial name matching (e.g., "chu" will match "Pikachu")
 */
export async function searchCatalog(
  query: string,
  limit: number = 20
): Promise<CatalogSearchResult> {
  // Clean the query
  const cleanedQuery = query.trim();
  const searchPattern = `%${cleanedQuery}%`;
  
  try {
    // Use ILIKE for case-insensitive fuzzy search
    // This allows matching partial names anywhere in the string
    // e.g., "chu" matches "Pikachu", "zard" matches "Charizard"
    const { rows } = await sql`
      SELECT 
        id, name, supertype, subtypes, hp, types,
        set_id, set_name, set_series, number, artist, rarity, flavor_text,
        national_pokedex_numbers, images_small, images_large,
        tcgplayer_url, cardmarket_url,
        price_normal_market, price_normal_mid, price_normal_low,
        price_holofoil_market, price_holofoil_mid,
        CASE 
          WHEN LOWER(name) = LOWER(${cleanedQuery}) THEN 1
          WHEN LOWER(name) LIKE LOWER(${`${cleanedQuery}%`}) THEN 2
          WHEN LOWER(name) LIKE LOWER(${`%${cleanedQuery}%`}) THEN 3
          ELSE 4
        END as match_priority
      FROM tcg_catalog
      WHERE name ILIKE ${searchPattern}
         OR set_name ILIKE ${searchPattern}
      ORDER BY match_priority ASC, name ASC
      LIMIT ${limit}
    `;
    
    // Get total count
    const { rows: countRows } = await sql`
      SELECT COUNT(*) as total
      FROM tcg_catalog
      WHERE name ILIKE ${searchPattern}
         OR set_name ILIKE ${searchPattern}
    `;
    
    return {
      data: rows.map(mapRowToCard),
      totalCount: parseInt(countRows[0].total),
    };
  } catch (error) {
    console.error('Error searching catalog:', error);
    throw error;
  }
}

/**
 * Get card by ID from catalog
 */
export async function getCatalogCardById(id: string): Promise<TCGCatalogCard | null> {
  try {
    const { rows } = await sql`
      SELECT 
        id, name, supertype, subtypes, hp, types,
        set_id, set_name, set_series, number, artist, rarity, flavor_text,
        national_pokedex_numbers, images_small, images_large,
        tcgplayer_url, cardmarket_url,
        price_normal_market, price_normal_mid, price_normal_low,
        price_holofoil_market, price_holofoil_mid
      FROM tcg_catalog
      WHERE id = ${id}
      LIMIT 1
    `;
    
    if (rows.length === 0) {
      return null;
    }
    
    return mapRowToCard(rows[0]);
  } catch (error) {
    console.error('Error getting catalog card:', error);
    throw error;
  }
}

/**
 * Find a matching catalog card for a collection card
 * Matches by name and set_name (required), optionally by number and rarity
 * Prioritizes cards with pricing data
 * Returns the best match with pricing information
 */
export async function findMatchingCatalogCard(
  name: string,
  set: string,
  number?: string | null,
  rarity?: string | null
): Promise<TCGCatalogCard | null> {
  try {
    // If number is provided, try exact match first (name + set + number)
    // Prioritize cards with pricing data
    if (number && number.trim()) {
      const { rows: exactRows } = await sql`
        SELECT 
          id, name, supertype, subtypes, hp, types,
          set_id, set_name, set_series, number, artist, rarity, flavor_text,
          national_pokedex_numbers, images_small, images_large,
          tcgplayer_url, cardmarket_url,
          price_normal_market, price_normal_mid, price_normal_low,
          price_holofoil_market, price_holofoil_mid,
          CASE 
            WHEN price_normal_market IS NOT NULL THEN 1
            WHEN price_normal_mid IS NOT NULL THEN 2
            WHEN price_normal_low IS NOT NULL THEN 3
            WHEN price_holofoil_market IS NOT NULL THEN 4
            WHEN price_holofoil_mid IS NOT NULL THEN 5
            ELSE 6
          END as price_priority
        FROM tcg_catalog
        WHERE LOWER(name) = LOWER(${name})
          AND LOWER(set_name) = LOWER(${set})
          AND number = ${number}
        ORDER BY price_priority ASC
        LIMIT 1
      `;
      
      if (exactRows.length > 0) {
        return mapRowToCard(exactRows[0]);
      }
    }
    
    // Build query for name + set match, prioritizing pricing data
    // Also consider rarity if provided
    let whereClause = `LOWER(name) = LOWER($1) AND LOWER(set_name) = LOWER($2)`;
    const queryParams: any[] = [name, set];
    
    if (rarity && rarity.trim()) {
      whereClause += ` AND LOWER(rarity) = LOWER($${queryParams.length + 1})`;
      queryParams.push(rarity);
    }
    
    const { rows } = await sql.query(`
      SELECT 
        id, name, supertype, subtypes, hp, types,
        set_id, set_name, set_series, number, artist, rarity, flavor_text,
        national_pokedex_numbers, images_small, images_large,
        tcgplayer_url, cardmarket_url,
        price_normal_market, price_normal_mid, price_normal_low,
        price_holofoil_market, price_holofoil_mid,
        CASE 
          WHEN price_normal_market IS NOT NULL THEN 1
          WHEN price_normal_mid IS NOT NULL THEN 2
          WHEN price_normal_low IS NOT NULL THEN 3
          WHEN price_holofoil_market IS NOT NULL THEN 4
          WHEN price_holofoil_mid IS NOT NULL THEN 5
          ELSE 6
        END as price_priority
      FROM tcg_catalog
      WHERE ${whereClause}
      ORDER BY 
        price_priority ASC,
        CASE WHEN number IS NOT NULL THEN 1 ELSE 2 END,
        number ASC
      LIMIT 1
    `, queryParams);
    
    if (rows.length === 0) {
      return null;
    }
    
    return mapRowToCard(rows[0]);
  } catch (error) {
    console.error('Error finding matching catalog card:', error);
    throw error;
  }
}

/**
 * Convert database row to TCGCatalogCard
 */
function mapRowToCard(row: any): TCGCatalogCard {
  return {
    id: row.id,
    name: row.name,
    supertype: row.supertype,
    subtypes: row.subtypes,
    hp: row.hp,
    types: row.types,
    set_id: row.set_id,
    set_name: row.set_name,
    set_series: row.set_series,
    number: row.number,
    artist: row.artist,
    rarity: row.rarity,
    flavor_text: row.flavor_text,
    national_pokedex_numbers: row.national_pokedex_numbers,
    images_small: row.images_small,
    images_large: row.images_large,
    tcgplayer_url: row.tcgplayer_url,
    cardmarket_url: row.cardmarket_url,
    price_normal_market: row.price_normal_market ? parseFloat(row.price_normal_market) : null,
    price_normal_mid: row.price_normal_mid ? parseFloat(row.price_normal_mid) : null,
    price_normal_low: row.price_normal_low ? parseFloat(row.price_normal_low) : null,
    price_holofoil_market: row.price_holofoil_market ? parseFloat(row.price_holofoil_market) : null,
    price_holofoil_mid: row.price_holofoil_mid ? parseFloat(row.price_holofoil_mid) : null,
  };
}

/**
 * Convert catalog card to PokemonTCGCard format for compatibility
 */
export function catalogCardToTCGCard(card: TCGCatalogCard): PokemonTCGCard {
  return {
    id: card.id,
    name: card.name,
    supertype: card.supertype || '',
    subtypes: card.subtypes || [],
    hp: card.hp || undefined,
    types: card.types || [],
    set: {
      id: card.set_id,
      name: card.set_name,
      series: card.set_series || '',
      printedTotal: 0,
      total: 0,
      legalities: {},
      releaseDate: '',
      updatedAt: '',
      images: {
        symbol: '',
        logo: '',
      },
    },
    number: card.number || '',
    artist: card.artist || undefined,
    rarity: card.rarity || '',
    flavorText: card.flavor_text || undefined,
    nationalPokedexNumbers: card.national_pokedex_numbers || undefined,
    legalities: {},
    images: {
      small: card.images_small || '',
      large: card.images_large || '',
    },
    tcgplayer: card.tcgplayer_url ? {
      url: card.tcgplayer_url,
      updatedAt: '',
      prices: {
        normal: card.price_normal_market || card.price_normal_mid || card.price_normal_low ? {
          market: card.price_normal_market || undefined,
          mid: card.price_normal_mid || undefined,
          low: card.price_normal_low || undefined,
        } : undefined,
        holofoil: card.price_holofoil_market || card.price_holofoil_mid ? {
          market: card.price_holofoil_market || undefined,
          mid: card.price_holofoil_mid || undefined,
        } : undefined,
      },
    } : undefined,
    cardmarket: card.cardmarket_url ? {
      url: card.cardmarket_url,
      updatedAt: '',
      prices: {},
    } : undefined,
  };
}

