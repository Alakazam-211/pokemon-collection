"use client";

import { useState, useEffect } from "react";
import GlassCard from "./GlassCard";
import GlassButton from "./GlassButton";

export interface FilterOptions {
  sets?: string[];
  rarities?: string[];
  series?: string[];
  types?: string[];
  conditions?: string[];
}

export interface ActiveFilters {
  set?: string;
  rarity?: string;
  series?: string;
  type?: string;
  condition?: string;
}

interface FilterBarProps {
  filterOptions: FilterOptions;
  activeFilters: ActiveFilters;
  onFiltersChange: (filters: ActiveFilters) => void;
  variant?: "tcg" | "collection";
}

export default function FilterBar({
  filterOptions,
  activeFilters,
  onFiltersChange,
  variant = "tcg",
}: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof ActiveFilters, value: string | undefined) => {
    const newFilters = { ...activeFilters };
    if (value && value !== "") {
      newFilters[key] = value;
    } else {
      delete newFilters[key];
    }
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const activeFilterCount = Object.keys(activeFilters).length;

  return (
    <GlassCard className={`mb-6 transition-all duration-300 ${isExpanded ? '' : '!px-6 !py-3'}`}>
      <div className={isExpanded ? 'p-4' : ''}>
        {/* Header with toggle */}
        <div className={`flex items-center justify-between ${isExpanded ? 'mb-4' : ''}`}>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-[var(--glass-black-dark)]">
              Filters
            </h3>
            {activeFilterCount > 0 && (
              <span className="px-2 py-1 bg-[var(--glass-primary)] text-white text-xs font-bold rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-[var(--glass-black-dark)]/70 hover:text-[var(--glass-black-dark)] underline"
              >
                Clear All
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2.5 sm:p-3 rounded-full bg-[var(--glass-primary)] backdrop-blur-sm border border-white/30 hover:bg-[var(--glass-primary-dark)] active:bg-[var(--glass-primary-dark)] transition-all min-h-[44px] min-w-[44px] flex items-center justify-center shadow-lg"
              aria-label="Toggle filters"
              aria-expanded={isExpanded}
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isExpanded ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        {isExpanded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {/* Set Filter */}
            {filterOptions.sets && filterOptions.sets.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-[var(--glass-black-dark)] mb-2">
                  Set
                </label>
                <select
                  value={activeFilters.set || ""}
                  onChange={(e) => handleFilterChange("set", e.target.value)}
                  className="glass-input-enhanced w-full px-3 py-2.5 sm:py-2 rounded-lg text-sm min-h-[44px]"
                >
                  <option value="">All Sets</option>
                  {filterOptions.sets.map((set) => (
                    <option key={set} value={set}>
                      {set}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Series Filter (for TCG) */}
            {variant === "tcg" && filterOptions.series && filterOptions.series.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-[var(--glass-black-dark)] mb-2">
                  Series
                </label>
                <select
                  value={activeFilters.series || ""}
                  onChange={(e) => handleFilterChange("series", e.target.value)}
                  className="glass-input-enhanced w-full px-3 py-2.5 sm:py-2 rounded-lg text-sm min-h-[44px]"
                >
                  <option value="">All Series</option>
                  {filterOptions.series.map((series) => (
                    <option key={series} value={series}>
                      {series}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Rarity Filter */}
            {filterOptions.rarities && filterOptions.rarities.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-[var(--glass-black-dark)] mb-2">
                  Rarity
                </label>
                <select
                  value={activeFilters.rarity || ""}
                  onChange={(e) => handleFilterChange("rarity", e.target.value)}
                  className="glass-input-enhanced w-full px-3 py-2.5 sm:py-2 rounded-lg text-sm min-h-[44px]"
                >
                  <option value="">All Rarities</option>
                  {filterOptions.rarities.map((rarity) => (
                    <option key={rarity} value={rarity}>
                      {rarity}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Type Filter (for TCG) */}
            {variant === "tcg" && filterOptions.types && filterOptions.types.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-[var(--glass-black-dark)] mb-2">
                  Type
                </label>
                <select
                  value={activeFilters.type || ""}
                  onChange={(e) => handleFilterChange("type", e.target.value)}
                  className="glass-input-enhanced w-full px-3 py-2.5 sm:py-2 rounded-lg text-sm min-h-[44px]"
                >
                  <option value="">All Types</option>
                  {filterOptions.types.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Condition Filter (for Collection) */}
            {variant === "collection" && filterOptions.conditions && filterOptions.conditions.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-[var(--glass-black-dark)] mb-2">
                  Condition
                </label>
                <select
                  value={activeFilters.condition || ""}
                  onChange={(e) => handleFilterChange("condition", e.target.value)}
                  className="glass-input-enhanced w-full px-3 py-2.5 sm:py-2 rounded-lg text-sm min-h-[44px]"
                >
                  <option value="">All Conditions</option>
                  {filterOptions.conditions.map((condition) => (
                    <option key={condition} value={condition}>
                      {condition}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Type Filter (for Collection) */}
            {variant === "collection" && filterOptions.types && filterOptions.types.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-[var(--glass-black-dark)] mb-2">
                  Type
                </label>
                <select
                  value={activeFilters.type || ""}
                  onChange={(e) => handleFilterChange("type", e.target.value)}
                  className="glass-input-enhanced w-full px-3 py-2.5 sm:py-2 rounded-lg text-sm min-h-[44px]"
                >
                  <option value="">All Types</option>
                  {filterOptions.types.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div className="mt-4 pt-4 border-t border-white/30">
            <div className="flex flex-wrap gap-2">
              {Object.entries(activeFilters).map(([key, value]) => (
                value && (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--glass-primary)]/20 text-[var(--glass-primary)] rounded-full text-sm"
                  >
                    <span className="font-medium capitalize">{key}:</span>
                    <span>{value}</span>
                    <button
                      onClick={() => handleFilterChange(key as keyof ActiveFilters, undefined)}
                      className="hover:text-red-600"
                    >
                      ×
                    </button>
                  </span>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

