"use client";

import { useState, useEffect } from "react";
import GlassCard from "./GlassCard";
import GlassButton from "./GlassButton";

interface SyncStatus {
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number;
  totalPages: number;
  currentPage: number;
  cardsProcessed: number;
  cardsInserted: number;
  cardsUpdated: number;
  errors: number;
  message: string;
  catalogStats?: {
    totalCards: number;
    lastSynced: string | null;
  };
}

export default function SyncCatalogButton() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);

  // Poll for status updates when sync is running
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (polling || status?.status === 'running') {
      interval = setInterval(async () => {
        try {
          const response = await fetch('/api/pokemon/sync/status');
          const data = await response.json();
          
          setStatus(data);
          
          // Stop polling if sync completed or errored
          if (data.status === 'completed' || data.status === 'error') {
            setPolling(false);
          }
        } catch (error) {
          console.error('Error fetching sync status:', error);
        }
      }, 2000); // Poll every 2 seconds
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [polling, status?.status]);

  const handleSync = async () => {
    setLoading(true);
    setPolling(true);
    
    try {
      const response = await fetch('/api/pokemon/sync', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Start polling for status
        const statusResponse = await fetch('/api/pokemon/sync/status');
        const statusData = await statusResponse.json();
        
        setStatus(statusData);
      } else {
        alert(`Failed to start sync: ${data.message || data.error}`);
        setPolling(false);
      }
    } catch (error) {
      console.error('Error starting sync:', error);
      alert('Failed to start sync. Please try again.');
      setPolling(false);
    } finally {
      setLoading(false);
    }
  };

  // Load initial status
  useEffect(() => {
    fetch('/api/pokemon/sync/status')
      .then(res => res.json())
      .then(data => setStatus(data))
      .catch(err => console.error('Error loading status:', err));
  }, []);

  const isRunning = status?.status === 'running';
  const isCompleted = status?.status === 'completed';
  const hasError = status?.status === 'error';

  return (
    <GlassCard className="p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--glass-black-dark)]">
            TCG Catalog Sync
          </h2>
          <p className="text-sm text-[var(--glass-black-dark)]/70 mt-1">
            Sync the entire Pokemon TCG database to your local Neon database for instant searches
          </p>
        </div>
        <GlassButton
          onClick={handleSync}
          disabled={loading || isRunning}
          variant={isRunning ? "glass" : "primary"}
          className={isRunning ? "cursor-not-allowed opacity-50" : ""}
        >
          {loading ? 'Starting...' : isRunning ? 'Syncing...' : 'Start Sync'}
        </GlassButton>
      </div>

      {status && (
        <div className="space-y-4">
          {/* Catalog Stats */}
          {status.catalogStats && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <GlassCard className="p-4 bg-blue-500/20 border-blue-400/30">
                <div className="text-sm text-[var(--glass-black-dark)]/70">Total Cards</div>
                <div className="text-2xl font-bold text-[var(--glass-black-dark)]">
                  {status.catalogStats.totalCards.toLocaleString()}
                </div>
              </GlassCard>
              <GlassCard className="p-4 bg-green-500/20 border-green-400/30">
                <div className="text-sm text-[var(--glass-black-dark)]/70">Last Synced</div>
                <div className="text-lg font-semibold text-[var(--glass-black-dark)]">
                  {status.catalogStats.lastSynced
                    ? new Date(status.catalogStats.lastSynced).toLocaleString()
                    : 'Never'}
                </div>
              </GlassCard>
            </div>
          )}

          {/* Progress Bar */}
          {isRunning && (
            <div>
              <div className="flex justify-between text-sm text-[var(--glass-black-dark)]/70 mb-2">
                <span>{status.message}</span>
                <span>{status.progress}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-[var(--glass-primary)] h-3 rounded-full transition-all duration-300"
                  style={{ width: `${status.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Status Details - Only show when running or completed, not on error */}
          {(isRunning || isCompleted) && (
            <GlassCard className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-[var(--glass-black-dark)]/70">Status</div>
                  <div className={`font-semibold ${
                    isRunning ? 'text-blue-600' :
                    isCompleted ? 'text-green-600' :
                    'text-[var(--glass-black-dark)]'
                  }`}>
                    {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                  </div>
                </div>
                <div>
                  <div className="text-[var(--glass-black-dark)]/70">Cards Processed</div>
                  <div className="font-semibold text-[var(--glass-black-dark)]">
                    {status.cardsProcessed.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[var(--glass-black-dark)]/70">Inserted</div>
                  <div className="font-semibold text-green-600">
                    {status.cardsInserted.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[var(--glass-black-dark)]/70">Updated</div>
                  <div className="font-semibold text-blue-600">
                    {status.cardsUpdated.toLocaleString()}
                  </div>
                </div>
              </div>
              
              {status.totalPages > 0 && (
                <div className="mt-3 text-sm text-[var(--glass-black-dark)]/70">
                  Page {status.currentPage} of {status.totalPages}
                </div>
              )}
            </GlassCard>
          )}

          {/* Completed Message */}
          {isCompleted && (
            <GlassCard className="p-4 bg-green-500/20 border-green-400/50">
              <div className="text-green-800 font-semibold">
                ✅ Sync completed successfully!
              </div>
              <div className="text-sm text-green-700 mt-1">
                Your catalog now has {status.cardsProcessed.toLocaleString()} cards. Searches will be instant!
              </div>
            </GlassCard>
          )}
        </div>
      )}

      <div className="mt-4 text-xs text-[var(--glass-black-dark)]/60">
        💡 Tip: The sync runs in the background. You can leave this page and it will continue.
        Check back later to see the progress!
      </div>
    </GlassCard>
  );
}

