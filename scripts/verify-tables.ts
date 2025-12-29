// Script to verify database tables exist
import { config } from 'dotenv';
import { resolve } from 'path';
import { sql } from '@vercel/postgres';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

async function verifyTables() {
  try {
    console.log('Checking database tables...\n');

    // Check if pokemon_cards table exists
    try {
      const pokemonCardsResult = await sql`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'pokemon_cards'
      `;
      
      if (pokemonCardsResult.rows[0].count === '1') {
        console.log('✅ pokemon_cards table exists');
        
        // Get row count
        const countResult = await sql`SELECT COUNT(*) as count FROM pokemon_cards`;
        console.log(`   - Contains ${countResult.rows[0].count} cards`);
      } else {
        console.log('❌ pokemon_cards table does NOT exist');
      }
    } catch (error) {
      console.log('❌ Error checking pokemon_cards:', error instanceof Error ? error.message : 'Unknown error');
    }

    // Check if tcg_catalog table exists
    try {
      const tcgCatalogResult = await sql`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tcg_catalog'
      `;
      
      if (tcgCatalogResult.rows[0].count === '1') {
        console.log('✅ tcg_catalog table exists');
        
        // Get row count
        const countResult = await sql`SELECT COUNT(*) as count FROM tcg_catalog`;
        console.log(`   - Contains ${countResult.rows[0].count} cards`);
      } else {
        console.log('❌ tcg_catalog table does NOT exist');
      }
    } catch (error) {
      console.log('❌ Error checking tcg_catalog:', error instanceof Error ? error.message : 'Unknown error');
    }

    // Check if update_updated_at_column function exists
    try {
      const functionResult = await sql`
        SELECT COUNT(*) as count 
        FROM pg_proc 
        WHERE proname = 'update_updated_at_column'
      `;
      
      if (functionResult.rows[0].count === '1') {
        console.log('✅ update_updated_at_column function exists');
      } else {
        console.log('❌ update_updated_at_column function does NOT exist');
      }
    } catch (error) {
      console.log('❌ Error checking function:', error instanceof Error ? error.message : 'Unknown error');
    }

    // List all tables
    console.log('\n📋 All tables in database:');
    try {
      const allTablesResult = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `;
      
      if (allTablesResult.rows.length > 0) {
        allTablesResult.rows.forEach(row => {
          console.log(`   - ${row.table_name}`);
        });
      } else {
        console.log('   (no tables found)');
      }
    } catch (error) {
      console.log('❌ Error listing tables:', error instanceof Error ? error.message : 'Unknown error');
    }

    console.log('\n✅ Verification complete!');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
}

verifyTables()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

