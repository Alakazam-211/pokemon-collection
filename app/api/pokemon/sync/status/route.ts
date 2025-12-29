import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getSyncStatus, getDefaultStatus } from '@/lib/sync-status';

export async function GET(request: NextRequest) {
  const status = getSyncStatus() || getDefaultStatus();
  
  // Also get catalog stats
  try {
    const { rows } = await sql`
      SELECT 
        COUNT(*) as total_cards,
        MAX(last_synced_at) as last_synced
      FROM tcg_catalog
    `;
    
    return NextResponse.json({
      ...status,
      catalogStats: {
        totalCards: parseInt(rows[0].total_cards) || 0,
        lastSynced: rows[0].last_synced || null,
      },
    });
  } catch (error) {
    return NextResponse.json({
      ...status,
      catalogStats: {
        totalCards: 0,
        lastSynced: null,
      },
    });
  }
}


