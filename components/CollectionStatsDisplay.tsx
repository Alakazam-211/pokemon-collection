"use client";

import { CollectionStats } from "@/types/pokemon";
import GlassCard from "./GlassCard";

interface CollectionStatsDisplayProps {
  stats: CollectionStats;
}

export default function CollectionStatsDisplay({
  stats,
}: CollectionStatsDisplayProps) {
  return (
    <GlassCard className="p-6 mb-6">
      <h2 className="text-2xl font-semibold text-[var(--glass-black-dark)] mb-4">
        Collection Overview
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-6 bg-gradient-to-br from-blue-500/80 to-blue-600/80 border-blue-400/50">
          <div className="text-sm font-medium text-white/90">Total Cards</div>
          <div className="text-3xl font-bold mt-2 text-white">{stats.totalCards}</div>
        </GlassCard>

        <GlassCard className="p-6 bg-gradient-to-br from-purple-500/80 to-purple-600/80 border-purple-400/50">
          <div className="text-sm font-medium text-white/90">Unique Cards</div>
          <div className="text-3xl font-bold mt-2 text-white">{stats.uniqueCards}</div>
        </GlassCard>

        <GlassCard className="p-6 bg-gradient-to-br from-green-500/80 to-green-600/80 border-green-400/50">
          <div className="text-sm font-medium text-white/90">Total Value</div>
          <div className="text-3xl font-bold mt-2 text-white">
            ${stats.totalValue.toFixed(2)}
          </div>
        </GlassCard>
      </div>
    </GlassCard>
  );
}

