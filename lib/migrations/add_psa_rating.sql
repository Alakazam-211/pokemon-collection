-- Migration: Add PSA rating fields to pokemon_cards table
-- Run this in Neon SQL Editor

-- Add PSA fields to pokemon_cards table
ALTER TABLE pokemon_cards
ADD COLUMN IF NOT EXISTS is_psa BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS psa_rating INTEGER CHECK (psa_rating >= 1 AND psa_rating <= 10);

-- Add index for PSA cards
CREATE INDEX IF NOT EXISTS idx_pokemon_cards_psa ON pokemon_cards(is_psa) WHERE is_psa = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN pokemon_cards.is_psa IS 'Whether this card is PSA graded';
COMMENT ON COLUMN pokemon_cards.psa_rating IS 'PSA rating (1-10) if the card is PSA graded';

