import { NextRequest, NextResponse } from 'next/server';
import { searchCards, SearchParams } from '@/lib/pokemon-tcg-api';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const params: SearchParams = {
      q: searchParams.get('q') || undefined,
      name: searchParams.get('name') || undefined,
      set: searchParams.get('set') || undefined,
      number: searchParams.get('number') || undefined,
      rarity: searchParams.get('rarity') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
      pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : 20,
    };
    
    const result = await searchCards(params);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error searching Pokemon cards:', error);
    return NextResponse.json(
      { error: 'Failed to search Pokemon cards', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

