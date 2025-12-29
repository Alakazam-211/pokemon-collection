import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// Simple in-memory store for sync progress (in production, use Redis or database)
const syncStatus = new Map<string, {
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number;
  totalPages: number;
  currentPage: number;
  cardsProcessed: number;
  cardsInserted: number;
  cardsUpdated: number;
  errors: number;
  message: string;
  startTime?: number;
  endTime?: number;
}>();

const SYNC_ID = 'main'; // Single sync instance

export async function GET(request: NextRequest) {
  const status = syncStatus.get(SYNC_ID) || {
    status: 'idle' as const,
    progress: 0,
    totalPages: 0,
    currentPage: 0,
    cardsProcessed: 0,
    cardsInserted: 0,
    cardsUpdated: 0,
    errors: 0,
    message: 'No sync in progress',
  };
  
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

export function updateSyncStatus(updates: Partial<typeof syncStatus extends Map<string, infer V> ? V : never>) {
  const current = syncStatus.get(SYNC_ID) || {
    status: 'running' as const,
    progress: 0,
    totalPages: 0,
    currentPage: 0,
    cardsProcessed: 0,
    cardsInserted: 0,
    cardsUpdated: 0,
    errors: 0,
    message: '',
    startTime: Date.now(),
  };
  
  syncStatus.set(SYNC_ID, { ...current, ...updates });
}

export function getSyncStatus() {
  return syncStatus.get(SYNC_ID);
}

