import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { TCGCatalogCard } from '@/lib/db-tcg-catalog';

function mapRowToCard(row: any): TCGCatalogCard {
  return {
    id: row.id,
    name: row.name,
    supertype: row.supertype,
    subtypes: row.subtypes,
    hp: row.hp,
    types: row.types,
    set_id: row.set_id,
    set_name: row.set_name,
    set_series: row.set_series,
    number: row.number,
    artist: row.artist,
    rarity: row.rarity,
    flavor_text: row.flavor_text,
    national_pokedex_numbers: row.national_pokedex_numbers,
    images_small: row.images_small,
    images_large: row.images_large,
    tcgplayer_url: row.tcgplayer_url,
    cardmarket_url: row.cardmarket_url,
    price_normal_market: row.price_normal_market ? parseFloat(row.price_normal_market) : null,
    price_normal_mid: row.price_normal_mid ? parseFloat(row.price_normal_mid) : null,
    price_normal_low: row.price_normal_low ? parseFloat(row.price_normal_low) : null,
    price_holofoil_market: row.price_holofoil_market ? parseFloat(row.price_holofoil_market) : null,
    price_holofoil_mid: row.price_holofoil_mid ? parseFloat(row.price_holofoil_mid) : null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const setFilter = searchParams.get('set') || '';
    const rarityFilter = searchParams.get('rarity') || '';
    const seriesFilter = searchParams.get('series') || '';
    const typeFilter = searchParams.get('type') || '';
    const offset = (page - 1) * limit;

    // Build query with filters using sql template tag
    let query;
    let countQuery;

    const searchPattern = search ? `%${search}%` : null;

    if (search || setFilter || rarityFilter || seriesFilter || typeFilter) {
      // Build WHERE clause conditionally
      let whereClause: any;
      const parts: any[] = [];
      
      if (searchPattern) {
        parts.push(sql`(name ILIKE ${searchPattern} OR set_name ILIKE ${searchPattern} OR rarity ILIKE ${searchPattern})`);
      }
      if (setFilter) {
        parts.push(sql`set_name = ${setFilter}`);
      }
      if (rarityFilter) {
        parts.push(sql`rarity = ${rarityFilter}`);
      }
      if (seriesFilter) {
        parts.push(sql`set_series = ${seriesFilter}`);
      }
      if (typeFilter) {
        parts.push(sql`${typeFilter} = ANY(types)`);
      }

      // Build whereClause by combining parts
      if (parts.length === 1) {
        whereClause = parts[0];
      } else if (parts.length === 2) {
        whereClause = sql`${parts[0]} AND ${parts[1]}`;
      } else if (parts.length === 3) {
        whereClause = sql`${parts[0]} AND ${parts[1]} AND ${parts[2]}`;
      } else if (parts.length === 4) {
        whereClause = sql`${parts[0]} AND ${parts[1]} AND ${parts[2]} AND ${parts[3]}`;
      } else if (parts.length === 5) {
        whereClause = sql`${parts[0]} AND ${parts[1]} AND ${parts[2]} AND ${parts[3]} AND ${parts[4]}`;
      }

      query = sql`
        SELECT 
          id, name, supertype, subtypes, hp, types,
          set_id, set_name, set_series, number, artist, rarity, flavor_text,
          national_pokedex_numbers, images_small, images_large,
          tcgplayer_url, cardmarket_url,
          price_normal_market, price_normal_mid, price_normal_low,
          price_holofoil_market, price_holofoil_mid
        FROM tcg_catalog
        WHERE ${whereClause}
        ORDER BY name ASC, set_name ASC, number ASC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
      
      countQuery = sql`
        SELECT COUNT(*) as total
        FROM tcg_catalog
        WHERE ${whereClause}
      `;
    } else {
      query = sql`
        SELECT 
          id, name, supertype, subtypes, hp, types,
          set_id, set_name, set_series, number, artist, rarity, flavor_text,
          national_pokedex_numbers, images_small, images_large,
          tcgplayer_url, cardmarket_url,
          price_normal_market, price_normal_mid, price_normal_low,
          price_holofoil_market, price_holofoil_mid
        FROM tcg_catalog
        ORDER BY name ASC, set_name ASC, number ASC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
      
      countQuery = sql`
        SELECT COUNT(*) as total
        FROM tcg_catalog
      `;
    }

    const [rowsResult, countResult] = await Promise.all([
      query,
      countQuery,
    ]);

    const cards = rowsResult.rows.map(mapRowToCard);
    const totalCount = parseInt(countResult.rows[0]?.total || '0');

    return NextResponse.json({
      data: cards,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching TCG catalog:', error);
    return NextResponse.json(
      { error: 'Failed to fetch TCG catalog cards' },
      { status: 500 }
    );
  }
}

