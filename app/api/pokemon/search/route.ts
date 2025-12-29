import { NextRequest, NextResponse } from 'next/server';
import { searchCards, SearchParams } from '@/lib/pokemon-tcg-api';
import { searchCatalog, catalogCardToTCGCard } from '@/lib/db-tcg-catalog';

export async function GET(request: NextRequest) {
  const routeStartTime = Date.now();
  try {
    const paramParseStartTime = Date.now();
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
    const paramParseTime = Date.now() - paramParseStartTime;
    
    const searchStartTime = Date.now();
    
    // Try local catalog first (much faster)
    let result;
    let searchSource = 'external';
    
    if (params.q) {
      try {
        const catalogResults = await searchCatalog(params.q, params.pageSize || 20);
        
        if (catalogResults.data.length > 0) {
          // Convert catalog cards to PokemonTCGCard format
          result = {
            data: catalogResults.data.map(catalogCardToTCGCard),
            page: params.page || 1,
            pageSize: params.pageSize || 20,
            count: catalogResults.data.length,
            totalCount: catalogResults.totalCount,
          };
          searchSource = 'local';
        }
      } catch (error) {
        // Fall through to external API
      }
    }
    
    // Fallback to external API if catalog search didn't work
    if (!result) {
      result = await searchCards(params);
    }
    
    const searchTime = Date.now() - searchStartTime;
    const totalRouteTime = Date.now() - routeStartTime;
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error searching Pokemon cards:', error);
    return NextResponse.json(
      { error: 'Failed to search Pokemon cards', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

