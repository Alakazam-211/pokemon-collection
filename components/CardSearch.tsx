"use client";

import { useState, useEffect, useRef } from "react";
import { PokemonTCGCard } from "@/lib/pokemon-tcg-api";
import GlassCard from "./GlassCard";

interface CardSearchProps {
  onSelectCard: (card: PokemonTCGCard) => void;
  onClose?: () => void;
}

export default function CardSearch({ onSelectCard, onClose }: CardSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<PokemonTCGCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Close results when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    setError(null);

    searchTimeoutRef.current = setTimeout(async () => {
      const clientStartTime = Date.now();
      try {
        const searchUrl = `/api/pokemon/search?q=${encodeURIComponent(searchQuery)}&pageSize=10`;
        const fetchStartTime = Date.now();
        const response = await fetch(searchUrl);
        const fetchTime = Date.now() - fetchStartTime;
        
        if (!response.ok) {
          throw new Error(`Failed to search cards: ${response.status} ${response.statusText}`);
        }

        const parseStartTime = Date.now();
        const data = await response.json();
        const parseTime = Date.now() - parseStartTime;
        const totalClientTime = Date.now() - clientStartTime;
        
        setResults(data.data || []);
        setShowResults(true);
      } catch (err) {
        console.error("Search error:", err);
        setError(err instanceof Error ? err.message : "Failed to search cards");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSelectCard = (card: PokemonTCGCard) => {
    onSelectCard(card);
    setSearchQuery("");
    setResults([]);
    setShowResults(false);
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="relative" ref={resultsRef}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-[var(--glass-black-dark)] mb-2">
          Search Pokemon Cards
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            className="glass-input-enhanced w-full px-4 py-3 rounded-xl pr-10"
            placeholder="Search by card name (e.g., Pikachu, Charizard)..."
          />
          {loading && (
            <div className="absolute right-3 top-3.5">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--glass-primary)]"></div>
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 max-h-96 overflow-y-auto bg-white rounded-xl shadow-xl border border-gray-200">
          {results.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => handleSelectCard(card)}
              className="w-full px-4 py-3 text-left hover:bg-gray-100 border-b border-gray-200 last:border-b-0 flex items-center gap-3 transition-colors"
            >
              {card.images?.small && (
                <img
                  src={card.images.small}
                  alt={card.name}
                  className="w-16 h-22 object-contain flex-shrink-0 rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[var(--glass-black-dark)] truncate">
                  {card.name}
                </div>
                <div className="text-sm text-[var(--glass-black-dark)]/70">
                  {card.set.name} • #{card.number}
                  {card.rarity && ` • ${card.rarity}`}
                </div>
                {card.tcgplayer?.prices && (
                  <div className="text-xs text-green-600 mt-1">
                    ${card.tcgplayer.prices.normal?.market?.toFixed(2) || 
                      card.tcgplayer.prices.normal?.mid?.toFixed(2) || 
                      card.tcgplayer.prices.normal?.low?.toFixed(2) || 
                      'Price N/A'}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && searchQuery.length >= 2 && !loading && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 p-4 text-center text-[var(--glass-black-dark)]/70 bg-white rounded-xl shadow-xl border border-gray-200">
          No cards found. Try a different search term.
        </div>
      )}
    </div>
  );
}

