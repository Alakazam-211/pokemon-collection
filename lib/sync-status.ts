// Shared sync status management
// This avoids circular dependencies between route handlers and sync script

export interface SyncStatus {
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
}

// Use globalThis to persist status across Next.js workers
// In production with multiple instances, use Redis or database
declare global {
  var __syncStatus: Map<string, SyncStatus> | undefined;
}

const SYNC_ID = 'main'; // Single sync instance

function getSyncStatusMap(): Map<string, SyncStatus> {
  if (!globalThis.__syncStatus) {
    globalThis.__syncStatus = new Map<string, SyncStatus>();
  }
  return globalThis.__syncStatus;
}

export function updateSyncStatus(updates: Partial<SyncStatus>) {
  const syncStatus = getSyncStatusMap();
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
  
  const newStatus = { ...current, ...updates };
  syncStatus.set(SYNC_ID, newStatus);
}

export function getSyncStatus(): SyncStatus | undefined {
  const syncStatus = getSyncStatusMap();
  const status = syncStatus.get(SYNC_ID);
  return status;
}

export function getDefaultStatus(): SyncStatus {
  return {
    status: 'idle',
    progress: 0,
    totalPages: 0,
    currentPage: 0,
    cardsProcessed: 0,
    cardsInserted: 0,
    cardsUpdated: 0,
    errors: 0,
    message: 'No sync in progress',
  };
}

export function clearSyncStatus() {
  const syncStatus = getSyncStatusMap();
  syncStatus.delete(SYNC_ID);
}

