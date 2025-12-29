// Script to sync the entire Pokemon TCG catalog to local database
import { sql } from '@vercel/postgres';
import { searchCards, PokemonTCGCard } from './pokemon-tcg-api';
import { updateSyncStatus } from '../app/api/pokemon/sync/status/route';

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
    
    console.log('Starting TCG catalog sync...');
    
    // Get total count first - search for a common card to get total count
    const firstPage = await fetch(`${API_BASE_URL}/cards?pageSize=1`)
      .then(res => res.json());
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
        // Fetch directly from API for pagination
        const response = await fetch(`${API_BASE_URL}/cards?pageSize=${PAGE_SIZE}&page=${page}`, {
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
            updateSyncStatus({ errors: stats.errors });
          }
        }
        
        // Update final stats for this page
        updateSyncStatus({
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
  
  // Check if card exists
  const { rows: existing } = await sql`
    SELECT id FROM tcg_catalog WHERE id = ${card.id}
  `;
  
  const isInsert = existing.length === 0;
  
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
  
  await sql.query(`
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
  
  return isInsert;
}

