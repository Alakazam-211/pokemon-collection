# Vercel Postgres Setup Guide

## Deployment Status

✅ **App deployed to Vercel**: https://pokemon-collection-2cxund41x-alakazamlabs.vercel.app
✅ **GitHub Repository**: https://github.com/Alakazam-211/pokemon-collection
✅ **Code pushed and deployed**

## Next Steps: Create Vercel Postgres Database

### Step 1: Create Postgres Database in Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/alakazamlabs/pokemon-collection)
2. Navigate to the **Storage** tab
3. Click **Create Database**
4. Select **Postgres**
5. Choose the **Hobby (Free)** plan
6. Name it `pokemon-collection-db` (or any name you prefer)
7. Select the region closest to you
8. Click **Create**

### Step 2: Link Database to Project

After creating the database:
1. The database will automatically be linked to your project
2. Environment variables will be automatically added:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`

### Step 3: Run Database Migration

After the database is created, you need to run the migration to create the tables:

**Option A: Using Vercel Dashboard**
1. Go to your project's Storage tab
2. Click on your Postgres database
3. Go to the **Data** tab
4. Click **Run SQL**
5. Copy and paste the contents of `lib/migrations/create_tables.sql`
6. Click **Run**

**Option B: Using Vercel CLI (if you have psql installed)**
```bash
# Get the connection string from Vercel dashboard (Storage > Postgres > .env.local)
# Then run:
psql $POSTGRES_URL_NON_POOLING -f lib/migrations/create_tables.sql
```

**Option C: Using a database client**
1. Get the connection string from Vercel dashboard
2. Connect using any PostgreSQL client (pgAdmin, DBeaver, etc.)
3. Run the SQL from `lib/migrations/create_tables.sql`

### Step 4: Update Local Environment Variables

After creating the database in Vercel:

1. Go to your project's **Settings** > **Environment Variables**
2. Copy the values for:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`

3. Update your local `.env.local` file with these values:
```bash
POSTGRES_URL=postgres://...
POSTGRES_PRISMA_URL=postgres://...
POSTGRES_URL_NON_POOLING=postgres://...
```

### Step 5: Test Locally

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

After setting up Postgres, you'll have these in Vercel (automatically):
- `POSTGRES_URL` - Main pooled connection string
- `POSTGRES_PRISMA_URL` - Prisma-compatible connection string
- `POSTGRES_URL_NON_POOLING` - Direct connection for migrations

Copy these to your `.env.local` for local development.

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

