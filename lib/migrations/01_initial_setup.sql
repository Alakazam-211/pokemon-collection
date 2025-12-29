-- Combined migration file for Pokemon Collection database
-- Run this entire file in Neon SQL Editor

-- ============================================
-- Step 1: Create the update_updated_at_column function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- Step 2: Create pokemon_cards table (your collection)
-- ============================================
CREATE TABLE IF NOT EXISTS pokemon_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    set TEXT NOT NULL,
    number TEXT,
    rarity TEXT,
    condition TEXT NOT NULL CHECK (condition IN ('Mint', 'Near Mint', 'Excellent', 'Good', 'Fair', 'Poor')),
    value DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for pokemon_cards
CREATE INDEX IF NOT EXISTS idx_pokemon_cards_name ON pokemon_cards(name);
CREATE INDEX IF NOT EXISTS idx_pokemon_cards_set ON pokemon_cards(set);

-- Create trigger for pokemon_cards
CREATE TRIGGER update_pokemon_cards_updated_at
    BEFORE UPDATE ON pokemon_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Step 3: Create tcg_catalog table (Pokemon TCG API cache)
-- ============================================
CREATE TABLE IF NOT EXISTS tcg_catalog (
    id TEXT PRIMARY KEY, -- Pokemon TCG API card ID
    name TEXT NOT NULL,
    supertype TEXT,
    subtypes TEXT[], -- Array of subtypes
    hp TEXT,
    types TEXT[], -- Array of types
    set_id TEXT NOT NULL,
    set_name TEXT NOT NULL,
    set_series TEXT,
    number TEXT,
    artist TEXT,
    rarity TEXT,
    flavor_text TEXT,
    national_pokedex_numbers INTEGER[],
    images_small TEXT,
    images_large TEXT,
    tcgplayer_url TEXT,
    cardmarket_url TEXT,
    -- Pricing data (from TCGPlayer)
    price_normal_market DECIMAL(10, 2),
    price_normal_mid DECIMAL(10, 2),
    price_normal_low DECIMAL(10, 2),
    price_holofoil_market DECIMAL(10, 2),
    price_holofoil_mid DECIMAL(10, 2),
    -- Metadata
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for tcg_catalog
CREATE INDEX IF NOT EXISTS idx_tcg_catalog_name ON tcg_catalog(name);
CREATE INDEX IF NOT EXISTS idx_tcg_catalog_set_name ON tcg_catalog(set_name);
CREATE INDEX IF NOT EXISTS idx_tcg_catalog_number ON tcg_catalog(number);
CREATE INDEX IF NOT EXISTS idx_tcg_catalog_rarity ON tcg_catalog(rarity);

-- Note: Full-text search index requires pg_trgm extension
-- Uncomment the following lines if you want full-text search:
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX IF NOT EXISTS idx_tcg_catalog_name_trgm ON tcg_catalog USING gin(name gin_trgm_ops);

-- Create trigger for tcg_catalog
CREATE TRIGGER update_tcg_catalog_updated_at
    BEFORE UPDATE ON tcg_catalog
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

