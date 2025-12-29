-- Create pokemon_cards table
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

-- Create index on name for faster searches
CREATE INDEX IF NOT EXISTS idx_pokemon_cards_name ON pokemon_cards(name);
CREATE INDEX IF NOT EXISTS idx_pokemon_cards_set ON pokemon_cards(set);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_pokemon_cards_updated_at
    BEFORE UPDATE ON pokemon_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

