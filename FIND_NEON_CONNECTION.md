# How to Find Your Neon Connection String

## You Don't Need API Keys!

For connecting to Neon Postgres, you need a **connection string** (database URL), not API keys. The connection string contains your credentials embedded in it.

## Where to Find Your Connection String

### Method 1: Neon Dashboard (Easiest)

1. **Go to Neon Dashboard:**
   - Visit: https://console.neon.tech/
   - Log in if needed

2. **Select Your Project:**
   - Click on your project name in the dashboard

3. **Find Connection Details:**
   - Look for a section called **"Connection Details"** or **"Connection string"**
   - It might be on the main dashboard or in a **"Settings"** or **"Database"** tab
   - You'll see something like:
     ```
     postgres://username:password@ep-xxxx-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```

4. **Copy the Connection String:**
   - Click the **copy icon** next to the connection string
   - Or manually select and copy it

### Method 2: Using Neon CLI (Alternative)

If you want to use the CLI:

```bash
# First authenticate
npx neonctl@latest auth

# Then get connection string
npx neonctl@latest connection-string --project-id YOUR_PROJECT_ID
```

But the dashboard method is much easier!

## What the Connection String Looks Like

Your connection string will look like one of these formats:

```
postgres://username:password@ep-xxxx-xxxx.region.aws.neon.tech/database?sslmode=require
```

or

```
postgresql://username:password@ep-xxxx-xxxx.region.aws.neon.tech/database?sslmode=require
```

## Where to Use It

1. **In `.env.local` file:**
   ```bash
   POSTGRES_URL=postgres://username:password@ep-xxxx-xxxx.region.aws.neon.tech/database?sslmode=require
   ```

2. **In Vercel Environment Variables:**
   - Go to: https://vercel.com/alakazamlabs/pokemon-collection/settings/environment-variables
   - Add `POSTGRES_URL` with your connection string

## Visual Guide

In the Neon Dashboard, look for:
- A section labeled **"Connection Details"**
- A box showing **"Connection string"** or **"Postgres connection string"**
- A button to **"Copy"** the connection string
- Sometimes it's shown in different formats (URI, JDBC, etc.) - use the **URI** or **Postgres** format

## If You Can't Find It

1. Check the **Dashboard** tab of your Neon project
2. Look in **Settings** → **Connection Details**
3. Check the **Databases** tab
4. Look for a **"Connect"** or **"Connection"** button

The connection string is always available - it's how you connect to your database!

## Security Note

⚠️ **Important:** The connection string contains your database password. Keep it secret:
- ✅ Add `.env.local` to `.gitignore` (already done)
- ✅ Never commit connection strings to Git
- ✅ Only share with trusted team members
- ✅ Use Vercel environment variables for production (never hardcode)

