import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: NextRequest) {
  try {
    // Get unique values for filters from user's collection
    // For types, we need to join with tcg_catalog to get type information
    const [setsResult, raritiesResult, conditionsResult, typesResult] = await Promise.all([
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
      // Unique conditions - use subquery to allow ORDER BY with CASE expression
      sql`
        SELECT condition
        FROM (
          SELECT DISTINCT condition
          FROM pokemon_cards
        ) AS distinct_conditions
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
      // Unique types - join with tcg_catalog to get types for cards in collection
      sql`
        SELECT DISTINCT unnest(tc.types) as type
        FROM pokemon_cards pc
        INNER JOIN tcg_catalog tc ON (
          pc.name = tc.name 
          AND pc.set = tc.set_name
          AND (pc.number = tc.number OR (pc.number IS NULL AND tc.number IS NULL))
        )
        WHERE tc.types IS NOT NULL AND array_length(tc.types, 1) > 0
        ORDER BY type ASC
      `,
    ]);

    const sets = setsResult.rows.map(row => row.set);
    const rarities = raritiesResult.rows.map(row => row.rarity);
    const conditions = conditionsResult.rows.map(row => row.condition);
    const types = typesResult.rows.map(row => row.type);

    return NextResponse.json({
      sets,
      rarities,
      conditions,
      types,
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filter options' },
      { status: 500 }
    );
  }
}

