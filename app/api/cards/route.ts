import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { createCard } from '@/lib/db';
import { PokemonCard } from '@/types/pokemon';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const setFilter = searchParams.get('set') || '';
    const rarityFilter = searchParams.get('rarity') || '';
    const conditionFilter = searchParams.get('condition') || '';
    const typeFilter = searchParams.get('type') || '';
    const offset = (page - 1) * limit;

    // Build query with filters
    let countQuery;
    let query;

    // Check if we have any actual filter values (not just empty strings)
    const hasFilters = (setFilter && setFilter.trim()) || 
                      (rarityFilter && rarityFilter.trim()) || 
                      (conditionFilter && conditionFilter.trim()) ||
                      (typeFilter && typeFilter.trim());

    if (hasFilters) {
      // If type filter is present, we need to join with tcg_catalog
      if (typeFilter && typeFilter.trim()) {
        // Build conditions dynamically using sql.query() to avoid nested template issues
        const whereParts: string[] = [];
        const queryParams: any[] = [];
        
        if (setFilter && setFilter.trim()) {
          whereParts.push(`pc.set = $${queryParams.length + 1}`);
          queryParams.push(setFilter);
        }
        if (rarityFilter && rarityFilter.trim()) {
          whereParts.push(`pc.rarity = $${queryParams.length + 1}`);
          queryParams.push(rarityFilter);
        }
        if (conditionFilter && conditionFilter.trim()) {
          whereParts.push(`pc.condition = $${queryParams.length + 1}`);
          queryParams.push(conditionFilter);
        }
        // Type filter uses join condition
        whereParts.push(`tc.types IS NOT NULL AND $${queryParams.length + 1} IN (SELECT unnest(tc.types))`);
        queryParams.push(typeFilter);
        
        const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';
        const allParams = [...queryParams, limit, offset];
        
        // Use sql.query() which properly handles parameterization
        query = sql.query(`
          SELECT DISTINCT
            pc.id,
            pc.name,
            pc.set,
            pc.number,
            pc.rarity,
            pc.condition,
            pc.value,
            pc.quantity,
            pc.image_url as "imageUrl",
            pc.is_psa as "isPsa",
            pc.psa_rating as "psaRating",
            pc.created_at as "createdAt",
            pc.updated_at as "updatedAt"
          FROM pokemon_cards pc
          INNER JOIN tcg_catalog tc ON (
            pc.name = tc.name 
            AND pc.set = tc.set_name
            AND (pc.number = tc.number OR (pc.number IS NULL AND tc.number IS NULL))
          )
          ${whereClause}
          ORDER BY pc.created_at DESC
          LIMIT $${queryParams.length + 1}
          OFFSET $${queryParams.length + 2}
        `, allParams);
        
        countQuery = sql.query(`
          SELECT COUNT(DISTINCT pc.id) as total
          FROM pokemon_cards pc
          INNER JOIN tcg_catalog tc ON (
            pc.name = tc.name 
            AND pc.set = tc.set_name
            AND (pc.number = tc.number OR (pc.number IS NULL AND tc.number IS NULL))
          )
          ${whereClause}
        `, queryParams);
      } else {
        // No type filter - simpler query without join
        const whereParts: string[] = [];
        const queryParams: any[] = [];
        
        if (setFilter && setFilter.trim()) {
          whereParts.push(`set = $${queryParams.length + 1}`);
          queryParams.push(setFilter);
        }
        if (rarityFilter && rarityFilter.trim()) {
          whereParts.push(`rarity = $${queryParams.length + 1}`);
          queryParams.push(rarityFilter);
        }
        if (conditionFilter && conditionFilter.trim()) {
          whereParts.push(`condition = $${queryParams.length + 1}`);
          queryParams.push(conditionFilter);
        }
        
        const whereClause = whereParts.join(' AND ');
        const allParams = [...queryParams, limit, offset];
        
        // Use sql.query() which properly handles parameterization
        query = sql.query(`
          SELECT 
            id,
            name,
            set,
            number,
            rarity,
            condition,
            value,
            quantity,
            image_url as "imageUrl",
            is_psa as "isPsa",
            psa_rating as "psaRating",
            created_at as "createdAt",
            updated_at as "updatedAt"
          FROM pokemon_cards
          WHERE ${whereClause}
          ORDER BY created_at DESC
          LIMIT $${queryParams.length + 1}
          OFFSET $${queryParams.length + 2}
        `, allParams);
        
        countQuery = sql.query(`
          SELECT COUNT(*) as total
          FROM pokemon_cards
          WHERE ${whereClause}
        `, queryParams);
      }
    } else {
      countQuery = sql`
        SELECT COUNT(*) as total
        FROM pokemon_cards
      `;

      query = sql`
        SELECT 
          id,
          name,
          set,
          number,
          rarity,
          condition,
          value,
          quantity,
          image_url as "imageUrl",
          is_psa as "isPsa",
          psa_rating as "psaRating",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM pokemon_cards
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    }

    const [countResult, rowsResult] = await Promise.all([
      countQuery,
      query,
    ]);

    const totalCount = parseInt(countResult.rows[0]?.total || '0');
    const { rows } = rowsResult;
    
    const cards: PokemonCard[] = rows.map(row => ({
      id: row.id,
      name: row.name,
      set: row.set,
      number: row.number || '',
      rarity: row.rarity || '',
      condition: row.condition as PokemonCard['condition'],
      value: parseFloat(row.value),
      quantity: row.quantity,
      imageUrl: row.imageUrl || undefined,
      isPsa: row.isPsa || false,
      psaRating: row.psaRating || undefined,
    }));

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
    console.error('Error fetching cards:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isDatabaseError = errorMessage.includes('relation') || 
                           errorMessage.includes('does not exist') ||
                           errorMessage.includes('connection') ||
                           errorMessage.includes('ENOTFOUND') ||
                           errorMessage.includes('ECONNREFUSED');
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch cards',
        details: isDatabaseError 
          ? 'Database connection error. Please check your POSTGRES_URL environment variable and ensure the database tables are created.'
          : errorMessage
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.set || body.value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, set, and value are required' },
        { status: 400 }
      );
    }

    const cardData: Omit<PokemonCard, 'id'> = {
      name: body.name,
      set: body.set,
      number: body.number || '',
      rarity: body.rarity || '',
      condition: body.condition || 'Near Mint',
      value: parseFloat(body.value),
      quantity: parseInt(body.quantity) || 1,
      imageUrl: body.imageUrl || undefined,
      isPsa: body.isPsa || false,
      psaRating: body.isPsa && body.psaRating ? parseInt(body.psaRating) : undefined,
    };

    const newCard = await createCard(cardData);
    return NextResponse.json(newCard, { status: 201 });
  } catch (error) {
    console.error('Error creating card:', error);
    return NextResponse.json(
      { error: 'Failed to create card' },
      { status: 500 }
    );
  }
}

