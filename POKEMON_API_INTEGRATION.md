# Pokemon TCG API Integration

## Overview

The app now integrates with the **Pokemon TCG API** (pokemontcg.io) to automatically fetch card data, images, and pricing information. This eliminates the need for manual entry of card details.

## Features

### 🔍 Card Search
- Search for Pokemon cards by name
- Real-time autocomplete suggestions
- Displays card images, set information, and prices
- Click to auto-fill the form

### 📊 Auto-Filled Data
When you select a card from search, the following fields are automatically filled:
- **Card Name** - Official card name
- **Set** - Set name (e.g., "Base Set", "Sword & Shield")
- **Card Number** - Card number in the set
- **Rarity** - Card rarity (e.g., "Common", "Rare Holo")
- **Image URL** - High-quality card image
- **Value** - Market price from TCGPlayer (if available)

### ✏️ Manual Entry Still Available
You can still manually enter cards if:
- The card isn't in the API database
- You want to override pricing
- You're adding custom cards

## How to Use

### Search Mode (Default)
1. Click the **"🔍 Search Cards"** tab
2. Type a card name (e.g., "Pikachu", "Charizard")
3. Select a card from the dropdown results
4. The form will auto-fill with card details
5. Adjust condition, quantity, and value if needed
6. Click **"Add Card to Collection"**

### Manual Entry Mode
1. Click the **"✏️ Manual Entry"** tab
2. Fill in all fields manually
3. Submit the form

## API Details

### Pokemon TCG API
- **Base URL**: `https://api.pokemon.io/v2`
- **Free Tier**: No API key required for basic usage
- **Rate Limits**: Reasonable limits for hobby use
- **Documentation**: https://docs.pokemontcg.io/

### Data Sources
- **Card Images**: Provided by Pokemon TCG API
- **Pricing**: TCGPlayer market prices (when available)
- **Card Data**: Official Pokemon TCG database

## Technical Implementation

### Files Created
- `lib/pokemon-tcg-api.ts` - API client and utilities
- `app/api/pokemon/search/route.ts` - Search API endpoint
- `components/CardSearch.tsx` - Search component with autocomplete

### Files Modified
- `components/AddCardForm.tsx` - Added search integration

### API Endpoints

#### Search Cards
```
GET /api/pokemon/search?q=pikachu&pageSize=10
```

Query Parameters:
- `q` - Search query (card name)
- `pageSize` - Number of results (default: 20)
- `page` - Page number

## Benefits

1. **Faster Entry** - No need to manually type card names and details
2. **Accurate Data** - Official card information from Pokemon TCG
3. **High-Quality Images** - Professional card images automatically included
4. **Price Estimates** - Market prices from TCGPlayer when available
5. **Consistent Formatting** - Standardized set names and card numbers

## Limitations

- API may not have all cards (especially very new or very old cards)
- Pricing data may not be available for all cards
- Requires internet connection for search
- Rate limits apply (but generous for hobby use)

## Future Enhancements

Possible improvements:
- Search by set name
- Filter by rarity
- Bulk import from API
- Price history tracking
- Set completion tracking

