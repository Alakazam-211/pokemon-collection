import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: NextRequest) {
  try {
    // Get unique values for filters
    const [setsResult, raritiesResult, seriesResult, typesResult] = await Promise.all([
      // Unique set names
      sql`
        SELECT DISTINCT set_name
        FROM tcg_catalog
        WHERE set_name IS NOT NULL
        ORDER BY set_name ASC
      `,
      // Unique rarities
      sql`
        SELECT DISTINCT rarity
        FROM tcg_catalog
        WHERE rarity IS NOT NULL
        ORDER BY rarity ASC
      `,
      // Unique series
      sql`
        SELECT DISTINCT set_series
        FROM tcg_catalog
        WHERE set_series IS NOT NULL
        ORDER BY set_series ASC
      `,
      // Unique types (flatten array)
      sql`
        SELECT DISTINCT unnest(types) as type
        FROM tcg_catalog
        WHERE types IS NOT NULL AND array_length(types, 1) > 0
        ORDER BY type ASC
      `,
    ]);

    return NextResponse.json({
      sets: setsResult.rows.map(row => row.set_name),
      rarities: raritiesResult.rows.map(row => row.rarity),
      series: seriesResult.rows.map(row => row.set_series),
      types: typesResult.rows.map(row => row.type),
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filter options' },
      { status: 500 }
    );
  }
}

