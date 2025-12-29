import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { syncTCGCatalog } from '@/lib/sync-tcg-catalog';
import { updateSyncStatus } from './status/route';

export async function GET(request: NextRequest) {
  try {
    // Check catalog status
    const { rows } = await sql`
      SELECT 
        COUNT(*) as total_cards,
        MAX(last_synced_at) as last_synced
      FROM tcg_catalog
    `;
    
    const totalCards = parseInt(rows[0].total_cards) || 0;
    const lastSynced = rows[0].last_synced;
    
    return NextResponse.json({
      status: 'ready',
      totalCards,
      lastSynced: lastSynced || null,
      message: totalCards > 0 
        ? `Catalog has ${totalCards} cards. Last synced: ${lastSynced || 'Never'}`
        : 'Catalog is empty. Use POST to sync.',
      instructions: 'Send a POST request to this endpoint to sync the catalog',
    });
  } catch (error) {
    // Table might not exist yet
    if (error instanceof Error && error.message.includes('does not exist')) {
      return NextResponse.json({
        status: 'not_initialized',
        message: 'Catalog table does not exist. Run the migration first.',
        instructions: 'Run lib/migrations/create_tcg_catalog.sql in Neon SQL Editor',
      });
    }
    
    console.error('Error checking catalog status:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Failed to check catalog status', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if sync is already running
    const currentStatus = await import('./status/route').then(m => m.getSyncStatus());
    if (currentStatus?.status === 'running') {
      return NextResponse.json({
        success: false,
        message: 'Sync is already in progress',
        status: currentStatus,
      }, { status: 409 }); // Conflict
    }
    
    // Start sync in background (don't await - let it run async)
    syncTCGCatalog().catch(error => {
      console.error('Background sync error:', error);
    });
    
    // Return immediately with "started" status
    return NextResponse.json({
      success: true,
      message: 'Sync started in background',
      status: 'running',
      note: 'Check /api/pokemon/sync/status for progress',
    });
  } catch (error) {
    console.error('Error starting sync:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to start sync', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

