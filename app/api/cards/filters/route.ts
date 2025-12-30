import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: NextRequest) {
  try {
    // Get unique values for filters from user's collection
    const [setsResult, raritiesResult, conditionsResult] = await Promise.all([
      // Unique set names
      sql`
        SELECT DISTINCT set
        FROM pokemon_cards
        WHERE set IS NOT NULL
        ORDER BY set ASC
      `,
      // Unique rarities
      sql`
        SELECT DISTINCT rarity
        FROM pokemon_cards
        WHERE rarity IS NOT NULL AND rarity != ''
        ORDER BY rarity ASC
      `,
      // Unique conditions
      sql`
        SELECT DISTINCT condition
        FROM pokemon_cards
        ORDER BY 
          CASE condition
            WHEN 'Mint' THEN 1
            WHEN 'Near Mint' THEN 2
            WHEN 'Excellent' THEN 3
            WHEN 'Good' THEN 4
            WHEN 'Fair' THEN 5
            WHEN 'Poor' THEN 6
            ELSE 7
          END
      `,
    ]);

    return NextResponse.json({
      sets: setsResult.rows.map(row => row.set),
      rarities: raritiesResult.rows.map(row => row.rarity),
      conditions: conditionsResult.rows.map(row => row.condition),
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filter options' },
      { status: 500 }
    );
  }
}

