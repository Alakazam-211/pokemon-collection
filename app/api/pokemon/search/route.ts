import { NextRequest, NextResponse } from 'next/server';
import { searchCards, SearchParams } from '@/lib/pokemon-tcg-api';
import { searchCatalog, catalogCardToTCGCard } from '@/lib/db-tcg-catalog';

export async function GET(request: NextRequest) {
  const routeStartTime = Date.now();
  try {
    // #region agent log
    await fetch('http://127.0.0.1:7251/ingest/2b29af8d-f28f-411d-acc1-a9922535324c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:5',message:'API route handler entered',data:{url:request.url,searchParams:Object.fromEntries(request.nextUrl.searchParams)},timestamp:Date.now(),sessionId:'debug-session',runId:'perf-tracking',hypothesisId:'perf'})}).catch(()=>{});
    // #endregion
    
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
    
    // #region agent log
    await fetch('http://127.0.0.1:7251/ingest/2b29af8d-f28f-411d-acc1-a9922535324c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:17',message:'Calling searchCards',data:{params,paramParseTime},timestamp:Date.now(),sessionId:'debug-session',runId:'perf-tracking',hypothesisId:'perf'})}).catch(()=>{});
    // #endregion
    
    const searchStartTime = Date.now();
    
    // Try local catalog first (much faster)
    let result;
    let searchSource = 'external';
    
    if (params.q) {
      try {
        const catalogResults = await searchCatalog(params.q, params.pageSize || 20);
        
        // #region agent log
        await fetch('http://127.0.0.1:7251/ingest/2b29af8d-f28f-411d-acc1-a9922535324c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:25',message:'Catalog search attempt',data:{query:params.q,resultCount:catalogResults.data.length,totalCount:catalogResults.totalCount},timestamp:Date.now(),sessionId:'debug-session',runId:'perf-tracking',hypothesisId:'perf'})}).catch(()=>{});
        // #endregion
        
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
        // #region agent log
        await fetch('http://127.0.0.1:7251/ingest/2b29af8d-f28f-411d-acc1-a9922535324c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:38',message:'Catalog search failed, falling back',data:{error:error instanceof Error?error.message:'Unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'perf-tracking',hypothesisId:'perf'})}).catch(()=>{});
        // #endregion
        // Fall through to external API
      }
    }
    
    // Fallback to external API if catalog search didn't work
    if (!result) {
      result = await searchCards(params);
    }
    
    const searchTime = Date.now() - searchStartTime;
    const totalRouteTime = Date.now() - routeStartTime;
    
    // #region agent log
    await fetch('http://127.0.0.1:7251/ingest/2b29af8d-f28f-411d-acc1-a9922535324c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:50',message:'searchCards succeeded',data:{resultCount:result.data?.length||0,totalCount:result.totalCount,searchTime,totalRouteTime,searchSource},timestamp:Date.now(),sessionId:'debug-session',runId:'perf-tracking',hypothesisId:'perf'})}).catch(()=>{});
    // #endregion
    
    return NextResponse.json(result);
  } catch (error) {
    // #region agent log
    await fetch('http://127.0.0.1:7251/ingest/2b29af8d-f28f-411d-acc1-a9922535324c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:24',message:'Error in API route',data:{errorMessage:error instanceof Error?error.message:'Unknown',errorName:error instanceof Error?error.name:'Unknown',errorStack:error instanceof Error?error.stack:'N/A'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    console.error('Error searching Pokemon cards:', error);
    return NextResponse.json(
      { error: 'Failed to search Pokemon cards', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

