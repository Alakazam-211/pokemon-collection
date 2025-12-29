# Database Migration Instructions

## Quick Start

Run the combined migration file in Neon SQL Editor:

**File to run:** `lib/migrations/01_initial_setup.sql`

## Step-by-Step Instructions

1. **Open Neon Dashboard**
   - Go to https://console.neon.tech/
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Or navigate to the "SQL Editor" tab

3. **Run the Migration**
   - Copy the entire contents of `lib/migrations/01_initial_setup.sql`
   - Paste it into the SQL Editor
   - Click "Run" or press `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac)

4. **Verify Tables Created**
   - Run this query to verify:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('pokemon_cards', 'tcg_catalog');
   ```
   - You should see both tables listed

## What Gets Created

### Tables:
1. **`pokemon_cards`** - Your personal Pokemon card collection
2. **`tcg_catalog`** - Cache of all Pokemon TCG cards from the API

### Functions:
- **`update_updated_at_column()`** - Automatically updates `updated_at` timestamps

### Indexes:
- Indexes on `name`, `set`, `number`, `rarity` for fast searching

## Troubleshooting

### Error: "relation already exists"
- This means the table already exists. The migration uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run again.

### Error: "function already exists"
- The function already exists. Safe to ignore or run the migration again.

### Error: "extension pg_trgm does not exist"
- This is only needed for full-text search. The migration file has this commented out by default.
- If you want full-text search, uncomment the extension creation lines in the migration file.

## After Migration

Once the migration is complete:
1. The sync button should work properly
2. You can start syncing the Pokemon TCG catalog
3. You can add cards to your collection

