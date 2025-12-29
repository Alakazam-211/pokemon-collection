# Vercel Postgres Setup Guide

## Deployment Status

✅ **App deployed to Vercel**: https://pokemon-collection-2cxund41x-alakazamlabs.vercel.app
✅ **GitHub Repository**: https://github.com/Alakazam-211/pokemon-collection
✅ **Code pushed and deployed**

## Next Steps: Create Postgres Database via Marketplace

**Important**: Vercel no longer offers their own Postgres service. You need to use a marketplace provider.

### Step 1: Select a Postgres Provider from Marketplace

1. Go to [Vercel Dashboard](https://vercel.com/alakazamlabs/pokemon-collection)
2. Navigate to the **Storage** tab
3. You'll see **Marketplace Database Providers** section
4. **Recommended: Click on "Neon"** (Serverless Postgres) - it has a great free tier:
   - 512MB storage
   - 0.5 compute hours/day
   - Perfect for hobby apps

   **Alternative options:**
   - **Supabase** - Also excellent free tier (500MB, 2GB bandwidth)
   - **Prisma Postgres** - If available, instant serverless Postgres

5. Click on your chosen provider (e.g., Neon)
6. Follow the setup wizard:
   - Sign up/login to the provider (if needed)
   - Create a new database/project
   - Select the free tier plan
   - Choose a region closest to you
   - Name it `pokemon-collection-db` (or any name you prefer)
7. Complete the setup - Vercel will automatically link it to your project

### Step 2: Get Connection String

After setting up the database through the marketplace provider:

**If using Neon:**
1. The connection string will be automatically added to Vercel as `DATABASE_URL` or `POSTGRES_URL`
2. You may also need to get the connection string directly from Neon dashboard:
   - Go to your Neon project dashboard
   - Navigate to **Connection Details** or **Settings**
   - Copy the connection string (it will look like `postgres://user:password@host/database`)

**If using Supabase:**
1. Connection string will be added as `DATABASE_URL` or `POSTGRES_URL`
2. You can also get it from Supabase dashboard > Project Settings > Database > Connection string

**Note**: The environment variable name might be `DATABASE_URL` instead of `POSTGRES_URL` depending on the provider. We'll need to update the code to handle both.

### Step 3: Run Database Migration

After the database is created, you need to run the migration to create the tables:

**Option A: Using Provider Dashboard (Recommended)**

**For Neon:**
1. Go to your Neon project dashboard
2. Navigate to **SQL Editor** or **Query** tab
3. Copy and paste the contents of `lib/migrations/create_tables.sql`
4. Click **Run** or execute the query

**For Supabase:**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `lib/migrations/create_tables.sql`
4. Click **Run**

**Option B: Using psql (Command Line)**
```bash
# Get the connection string from your provider dashboard or Vercel env vars
# Then run:
psql "your-connection-string-here" -f lib/migrations/create_tables.sql

# Or if you have it in .env.local:
source .env.local
psql "$POSTGRES_URL" -f lib/migrations/create_tables.sql
```

**Option C: Using a Database Client**
1. Get the connection string from your provider dashboard
2. Connect using any PostgreSQL client (pgAdmin, DBeaver, TablePlus, etc.)
3. Run the SQL from `lib/migrations/create_tables.sql`

### Step 4: Update Environment Variables in Vercel

After setting up the database:

1. Go to your project's **Settings** > **Environment Variables** in Vercel
2. You should see `DATABASE_URL` or `POSTGRES_URL` automatically added
3. If not, add it manually:
   - Variable name: `POSTGRES_URL` (or `DATABASE_URL` - the code supports both)
   - Value: Your connection string from the provider (e.g., `postgres://user:password@host/database`)
   - Make sure to add it for **Production**, **Preview**, and **Development** environments

### Step 5: Update Local Environment Variables

1. Copy the connection string from Vercel dashboard (Settings > Environment Variables)
2. Update your local `.env.local` file:
```bash
# Use POSTGRES_URL (the code will also check DATABASE_URL as fallback)
POSTGRES_URL=postgres://user:password@host:5432/database

# If your provider gives you a non-pooling URL for migrations, add it:
POSTGRES_URL_NON_POOLING=postgres://user:password@host:5432/database
```

**Note**: Marketplace providers typically give you one connection string. Use it for both `POSTGRES_URL` and `POSTGRES_URL_NON_POOLING` if separate URLs aren't provided.

### Step 6: Test Locally

1. Make sure `.env.local` is updated with the connection strings
2. Run the migration locally (if you want to test):
   ```bash
   psql $POSTGRES_URL_NON_POOLING -f lib/migrations/create_tables.sql
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Visit http://localhost:3007
5. Try adding a card - it should save to the database!

### Step 6: Redeploy (if needed)

After setting up the database and environment variables:
1. Vercel will automatically redeploy when you push changes
2. Or manually trigger a redeploy from the dashboard
3. The app should now work with the database!

## Environment Variables Reference

After setting up Postgres through a marketplace provider, you'll have:
- `DATABASE_URL` or `POSTGRES_URL` - Connection string from your provider (Neon, Supabase, etc.)

The code supports both `POSTGRES_URL` and `DATABASE_URL` environment variables. Copy the connection string to your `.env.local` for local development.

**Provider-specific notes:**
- **Neon**: Provides connection strings in their dashboard. Use the main connection string.
- **Supabase**: Connection string available in Project Settings > Database. Use the "URI" format.
- **Prisma Postgres**: Should automatically inject connection strings into Vercel.

## Troubleshooting

### Database connection errors
- Make sure the database is created and linked to your project
- Verify environment variables are set in Vercel dashboard
- Check that the migration has been run

### Migration errors
- Make sure you're using `POSTGRES_URL_NON_POOLING` for migrations
- Check that you have the correct permissions
- Verify the SQL syntax in `lib/migrations/create_tables.sql`

### Local development issues
- Ensure `.env.local` exists and has the correct connection strings
- Restart your dev server after updating `.env.local`
- Check that the database is accessible from your IP (Vercel Postgres allows connections from anywhere by default)

