-- Create TCG catalog table for storing all Pokemon cards from the API
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

-- Create indexes for fast searching
CREATE INDEX IF NOT EXISTS idx_tcg_catalog_name ON tcg_catalog(name);
CREATE INDEX IF NOT EXISTS idx_tcg_catalog_set_name ON tcg_catalog(set_name);
CREATE INDEX IF NOT EXISTS idx_tcg_catalog_number ON tcg_catalog(number);
CREATE INDEX IF NOT EXISTS idx_tcg_catalog_rarity ON tcg_catalog(rarity);

-- Full-text search index (PostgreSQL)
CREATE INDEX IF NOT EXISTS idx_tcg_catalog_name_trgm ON tcg_catalog USING gin(name gin_trgm_ops);

-- Update trigger
CREATE TRIGGER update_tcg_catalog_updated_at
    BEFORE UPDATE ON tcg_catalog
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

