# TCG Catalog Local Storage Strategy

## Overview

Store the entire Pokemon TCG card catalog locally in Neon Postgres for instant searches and better performance.

## Benefits

- **Instant Searches**: No 16-second API wait times
- **No Rate Limits**: Unlimited searches
- **Offline Capability**: Works without internet
- **Better UX**: Fast, responsive search experience
- **Cost Effective**: ~8-10MB storage (very minimal)

## Storage Requirements

- **Card Count**: ~20,000 cards
- **Storage Size**: ~8-10MB (metadata only, images remain URLs)
- **Neon Free Tier**: 256MB (plenty of room)

## Implementation

### 1. Database Schema

Created `tcg_catalog` table with:
- Card metadata (name, set, number, rarity, etc.)
- Image URLs (not storing images locally)
- Pricing data from TCGPlayer
- Full-text search indexes

### 2. Initial Sync

Run the sync script to populate the catalog:

```bash
# Via API endpoint (recommended)
curl -X POST http://localhost:3007/api/pokemon/sync

# Or create a script:
npm run sync-catalog
```

**Estimated Time**: ~10-15 minutes for initial sync (respecting rate limits)

### 3. Monthly Updates

Schedule monthly syncs to update:
- New cards from recent sets
- Updated pricing data
- New images

**Options**:
- Vercel Cron Jobs (recommended)
- GitHub Actions
- Manual trigger via API

### 4. Search Implementation

Search now queries local database instead of external API:
- Case-insensitive search (ILIKE)
- Fast full-text search
- Instant results (<100ms)

## Migration Steps

1. **Run Migration**:
   ```sql
   -- Run lib/migrations/create_tcg_catalog.sql in Neon SQL Editor
   ```

2. **Initial Sync**:
   ```bash
   curl -X POST http://localhost:3007/api/pokemon/sync
   ```

3. **Update Search API**:
   - Modify `/api/pokemon/search` to use local catalog
   - Fallback to external API if catalog empty

4. **Set Up Monthly Sync**:
   - Vercel Cron: Run sync monthly
   - Or manual trigger when needed

## Maintenance

- **Monthly**: Run sync to update catalog
- **Storage**: Monitor database size (should stay <50MB)
- **Performance**: Catalog queries should be <100ms

## Fallback Strategy

If catalog is empty or sync fails:
- Fallback to external Pokemon TCG API
- Show warning to user
- Log error for admin review

## Cost Analysis

- **Storage**: ~10MB = Free (Neon free tier: 256MB)
- **Sync Time**: ~10-15 min monthly = Negligible
- **Query Performance**: Instant = Better UX
- **API Calls**: Reduced from every search to monthly sync = Better reliability

## Next Steps

1. ✅ Database schema created
2. ✅ Sync script created
3. ⏳ Run migration
4. ⏳ Run initial sync
5. ⏳ Update search to use catalog
6. ⏳ Set up monthly sync job

