"use client";

import { CollectionStats } from "@/types/pokemon";

interface CollectionStatsDisplayProps {
  stats: CollectionStats;
}

export default function CollectionStatsDisplay({
  stats,
}: CollectionStatsDisplayProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
        Collection Overview
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="text-sm font-medium opacity-90">Total Cards</div>
          <div className="text-3xl font-bold mt-2">{stats.totalCards}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="text-sm font-medium opacity-90">Unique Cards</div>
          <div className="text-3xl font-bold mt-2">{stats.uniqueCards}</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="text-sm font-medium opacity-90">Total Value</div>
          <div className="text-3xl font-bold mt-2">
            ${stats.totalValue.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}

