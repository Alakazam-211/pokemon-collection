# Neon Database Setup - Quick Guide

## Step 1: Get Connection String from Neon Dashboard

1. Go to your [Neon Dashboard](https://console.neon.tech/)
2. Select your project
3. Go to **Connection Details** or **Dashboard** tab
4. Copy the **Connection String** (it will look like: `postgres://user:password@host.neon.tech/database?sslmode=require`)

## Step 2: Add to Vercel Environment Variables

1. Go to [Vercel Project Settings](https://vercel.com/alakazamlabs/pokemon-collection/settings/environment-variables)
2. Click **Add New**
3. Add these variables:

   **Variable 1:**
   - Key: `POSTGRES_URL`
   - Value: Paste your Neon connection string
   - Environments: ✅ Production, ✅ Preview, ✅ Development
   - Click **Save**

   **Variable 2 (optional, for migrations):**
   - Key: `POSTGRES_URL_NON_POOLING`
   - Value: Same connection string (or use the non-pooling version if Neon provides one)
   - Environments: ✅ Production, ✅ Preview, ✅ Development
   - Click **Save**

## Step 3: Run Database Migration

You have two options:

### Option A: Using Neon SQL Editor (Easiest)

1. Go to your Neon Dashboard
2. Click on **SQL Editor** tab
3. Copy the entire contents of `lib/migrations/create_tables.sql`
4. Paste it into the SQL Editor
5. Click **Run** or press Ctrl+Enter
6. You should see "Success" message

### Option B: Using psql Command Line

```bash
# First, update your .env.local with the connection string
# Then run:
source .env.local
psql "$POSTGRES_URL" -f lib/migrations/create_tables.sql
```

## Step 4: Update Local .env.local

1. Copy the connection string from Neon Dashboard
2. Update your `.env.local` file:

```bash
POSTGRES_URL=postgres://user:password@host.neon.tech/database?sslmode=require
POSTGRES_URL_NON_POOLING=postgres://user:password@host.neon.tech/database?sslmode=require
```

## Step 5: Test Locally

```bash
npm run dev
```

Visit http://localhost:3007 and try adding a card!

## Step 6: Redeploy Vercel (if needed)

After adding environment variables, Vercel should automatically redeploy. If not:
- Go to Deployments tab
- Click the three dots on latest deployment
- Click **Redeploy**

## Verification

To verify everything is working:

1. **Check Vercel Environment Variables:**
   ```bash
   vercel env ls --scope=alakazamlabs
   ```

2. **Test Database Connection:**
   - Try adding a card in the app
   - Check Neon Dashboard > Tables to see if `pokemon_cards` table exists

3. **Check Logs:**
   ```bash
   vercel logs --scope=alakazamlabs
   ```

## Troubleshooting

### Connection Errors
- Make sure `POSTGRES_URL` is set in Vercel (not just `DATABASE_URL`)
- Verify the connection string is correct (copy from Neon Dashboard)
- Check that SSL mode is set: `?sslmode=require`

### Migration Errors
- Make sure you're running the migration against the correct database
- Check Neon SQL Editor for any error messages
- Verify the SQL syntax is correct

### Local Development Issues
- Ensure `.env.local` has the correct connection string
- Restart your dev server after updating `.env.local`
- Check that Neon allows connections from your IP (should be enabled by default)

