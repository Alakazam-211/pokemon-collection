// Script to sync the entire Pokemon TCG catalog to local database
import { sql } from '@vercel/postgres';
import { searchCards, PokemonTCGCard } from './pokemon-tcg-api';
import { updateSyncStatus } from './sync-status';

const API_BASE_URL = 'https://api.pokemontcg.io/v2';
const PAGE_SIZE = 250; // Max page size for Pokemon TCG API

interface SyncStats {
  totalPages: number;
  cardsProcessed: number;
  cardsInserted: number;
  cardsUpdated: number;
  errors: number;
  startTime: number;
}

/**
 * Sync all Pokemon TCG cards to local database
 */
export async function syncTCGCatalog(): Promise<SyncStats> {
  const stats: SyncStats = {
    totalPages: 0,
    cardsProcessed: 0,
    cardsInserted: 0,
    cardsUpdated: 0,
    errors: 0,
    startTime: Date.now(),
  };

  try {
    // Initialize sync status
    updateSyncStatus({
      status: 'running',
      progress: 0,
      totalPages: 0,
      currentPage: 0,
      cardsProcessed: 0,
      cardsInserted: 0,
      cardsUpdated: 0,
      errors: 0,
      message: 'Starting sync...',
      startTime: stats.startTime,
    });
    
    // Check if table exists before starting sync
    updateSyncStatus({
      message: 'Checking database...',
    });
    
    try {
      await sql`SELECT 1 FROM tcg_catalog LIMIT 1`;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      if (errorMsg.includes('does not exist')) {
        updateSyncStatus({
          status: 'error',
          message: 'Database table "tcg_catalog" does not exist. Please run the migration first.',
          endTime: Date.now(),
        });
        throw new Error('Database table "tcg_catalog" does not exist. Please run lib/migrations/create_tcg_catalog.sql in Neon SQL Editor first.');
      }
      throw error;
    }
    
    updateSyncStatus({
      message: 'Starting sync...',
    });
    
    console.log('Starting TCG catalog sync...');
    
    // Get total count first - use a wildcard query to get all cards
    let firstPage;
    try {
      // Pokemon TCG API v2 requires a query parameter, use wildcard to get all cards
      const response = await fetch(`${API_BASE_URL}/cards?q=*&pageSize=1`, {
        headers: { 'Accept': 'application/json' },
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Could not read error body');
        throw new Error(`Failed to fetch total count: ${response.status} ${response.statusText} - ${errorText}`);
      }
      firstPage = await response.json();
    } catch (error) {
      throw error;
    }
    
    const totalCount = firstPage.totalCount || 0;
    stats.totalPages = Math.ceil(totalCount / PAGE_SIZE);
    
    updateSyncStatus({
      totalPages: stats.totalPages,
      message: `Found ${totalCount} total cards. Processing ${stats.totalPages} pages...`,
    });
    
    console.log(`Found ${totalCount} total cards. Processing ${stats.totalPages} pages...`);

    // Process all pages
    for (let page = 1; page <= stats.totalPages; page++) {
      console.log(`Processing page ${page}/${stats.totalPages}...`);
      
      try {
        // Fetch directly from API for pagination - use wildcard query to get all cards
        const response = await fetch(`${API_BASE_URL}/cards?q=*&pageSize=${PAGE_SIZE}&page=${page}`, {
          headers: { 'Accept': 'application/json' },
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const apiResult = await response.json();
        const result = { data: apiResult.data || [] };
        
        for (const card of result.data) {
          try {
            const wasInserted = await upsertCard(card);
            stats.cardsProcessed++;
            if (wasInserted) {
              stats.cardsInserted++;
            } else {
              stats.cardsUpdated++;
            }
            
            // Update progress every 50 cards
            if (stats.cardsProcessed % 50 === 0) {
              updateSyncStatus({
                status: 'running', // Ensure status stays as running
                cardsProcessed: stats.cardsProcessed,
                cardsInserted: stats.cardsInserted,
                cardsUpdated: stats.cardsUpdated,
                errors: stats.errors,
                message: `Processed ${stats.cardsProcessed} cards...`,
              });
              console.log(`Processed ${stats.cardsProcessed} cards...`);
            }
          } catch (error) {
            console.error(`Error processing card ${card.id}:`, error);
            stats.errors++;
            updateSyncStatus({ 
              status: 'running', // Keep status as running even if there are errors
              errors: stats.errors 
            });
          }
        }
        
        // Update final stats for this page
        updateSyncStatus({
          status: 'running', // Ensure status stays as running
          cardsProcessed: stats.cardsProcessed,
          cardsInserted: stats.cardsInserted,
          cardsUpdated: stats.cardsUpdated,
          errors: stats.errors,
        });
        
        // Small delay to respect rate limits
        if (page < stats.totalPages) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`Error processing page ${page}:`, error);
        stats.errors++;
      }
    }

    const duration = Date.now() - stats.startTime;
    console.log(`\nSync completed in ${(duration / 1000).toFixed(2)}s`);
    console.log(`Processed: ${stats.cardsProcessed}, Inserted: ${stats.cardsInserted}, Updated: ${stats.cardsUpdated}, Errors: ${stats.errors}`);
    
    updateSyncStatus({
      status: 'completed',
      progress: 100,
      cardsProcessed: stats.cardsProcessed,
      cardsInserted: stats.cardsInserted,
      cardsUpdated: stats.cardsUpdated,
      errors: stats.errors,
      message: `Sync completed! Processed ${stats.cardsProcessed} cards in ${(duration / 1000).toFixed(2)}s`,
      endTime: Date.now(),
    });
    
    return stats;
  } catch (error) {
    console.error('Sync failed:', error);
    updateSyncStatus({
      status: 'error',
      message: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      endTime: Date.now(),
    });
    throw error;
  }
}

/**
 * Upsert a card into the catalog
 * Returns true if inserted, false if updated
 */
async function upsertCard(card: PokemonTCGCard): Promise<boolean> {
  const priceNormal = card.tcgplayer?.prices?.normal;
  const priceHolofoil = card.tcgplayer?.prices?.holofoil;
  
  // Convert arrays to PostgreSQL array format
  const subtypesArray = card.subtypes && card.subtypes.length > 0 
    ? `{${card.subtypes.map(s => `"${s.replace(/"/g, '\\"')}"`).join(',')}}`
    : '{}';
  const typesArray = card.types && card.types.length > 0
    ? `{${card.types.map(t => `"${t.replace(/"/g, '\\"')}"`).join(',')}}`
    : '{}';
  const pokedexArray = card.nationalPokedexNumbers && card.nationalPokedexNumbers.length > 0
    ? `{${card.nationalPokedexNumbers.join(',')}}`
    : '{}';
  
  // Use INSERT ... ON CONFLICT to handle duplicates automatically
  // This will INSERT new cards or UPDATE existing ones based on the PRIMARY KEY (id)
  // The ON CONFLICT clause ensures no duplicates - if a card with the same id exists,
  // it will update all fields instead of creating a duplicate
  const result = await sql.query(`
    WITH existing AS (
      SELECT id FROM tcg_catalog WHERE id = $1
    ),
    upserted AS (
      INSERT INTO tcg_catalog (
        id, name, supertype, subtypes, hp, types,
        set_id, set_name, set_series, number, artist, rarity, flavor_text,
        national_pokedex_numbers, images_small, images_large,
        tcgplayer_url, cardmarket_url,
        price_normal_market, price_normal_mid, price_normal_low,
        price_holofoil_market, price_holofoil_mid,
        last_synced_at, updated_at
      )
      VALUES (
        $1, $2, $3, $4::text[], $5, $6::text[],
        $7, $8, $9, $10, $11, $12, $13,
        $14::integer[], $15, $16,
        $17, $18,
        $19, $20, $21,
        $22, $23,
        NOW(), NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        supertype = EXCLUDED.supertype,
        subtypes = EXCLUDED.subtypes,
        hp = EXCLUDED.hp,
        types = EXCLUDED.types,
        set_id = EXCLUDED.set_id,
        set_name = EXCLUDED.set_name,
        set_series = EXCLUDED.set_series,
        number = EXCLUDED.number,
        artist = EXCLUDED.artist,
        rarity = EXCLUDED.rarity,
        flavor_text = EXCLUDED.flavor_text,
        national_pokedex_numbers = EXCLUDED.national_pokedex_numbers,
        images_small = EXCLUDED.images_small,
        images_large = EXCLUDED.images_large,
        tcgplayer_url = EXCLUDED.tcgplayer_url,
        cardmarket_url = EXCLUDED.cardmarket_url,
        price_normal_market = EXCLUDED.price_normal_market,
        price_normal_mid = EXCLUDED.price_normal_mid,
        price_normal_low = EXCLUDED.price_normal_low,
        price_holofoil_market = EXCLUDED.price_holofoil_market,
        price_holofoil_mid = EXCLUDED.price_holofoil_mid,
        last_synced_at = NOW(),
        updated_at = NOW()
      RETURNING id
    )
    SELECT NOT EXISTS(SELECT 1 FROM existing) AS inserted
  `, [
    card.id,
    card.name,
    card.supertype || null,
    subtypesArray,
    card.hp || null,
    typesArray,
    card.set.id,
    card.set.name,
    card.set.series || null,
    card.number || null,
    card.artist || null,
    card.rarity || null,
    card.flavorText || null,
    pokedexArray,
    card.images?.small || null,
    card.images?.large || null,
    card.tcgplayer?.url || null,
    card.cardmarket?.url || null,
    priceNormal?.market || null,
    priceNormal?.mid || null,
    priceNormal?.low || null,
    priceHolofoil?.market || null,
    priceHolofoil?.mid || null,
  ]);
  
  // Return true if it was an INSERT (new card), false if it was an UPDATE (existing card)
  return result.rows[0]?.inserted ?? false;
}

