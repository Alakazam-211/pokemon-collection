"use client";

import { useState, useEffect, useRef } from "react";
import { PokemonTCGCard } from "@/lib/pokemon-tcg-api";

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
        // #region agent log
        const searchUrl = `/api/pokemon/search?q=${encodeURIComponent(searchQuery)}&pageSize=10`;
        fetch('http://127.0.0.1:7251/ingest/2b29af8d-f28f-411d-acc1-a9922535324c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CardSearch.tsx:49',message:'Search API call starting',data:{searchQuery,searchUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'perf-tracking',hypothesisId:'perf'})}).catch(()=>{});
        // #endregion
        
        const fetchStartTime = Date.now();
        const response = await fetch(searchUrl);
        const fetchTime = Date.now() - fetchStartTime;
        
        // #region agent log
        fetch('http://127.0.0.1:7251/ingest/2b29af8d-f28f-411d-acc1-a9922535324c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CardSearch.tsx:52',message:'Response received',data:{status:response.status,statusText:response.statusText,ok:response.ok,headers:Object.fromEntries(response.headers.entries())},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        if (!response.ok) {
          // #region agent log
          const errorText = await response.text().catch(() => 'Could not read error body');
          fetch('http://127.0.0.1:7251/ingest/2b29af8d-f28f-411d-acc1-a9922535324c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CardSearch.tsx:56',message:'Response not OK',data:{status:response.status,statusText:response.statusText,errorBody:errorText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          throw new Error(`Failed to search cards: ${response.status} ${response.statusText}`);
        }

        const parseStartTime = Date.now();
        const data = await response.json();
        const parseTime = Date.now() - parseStartTime;
        const totalClientTime = Date.now() - clientStartTime;
        
        // #region agent log
        fetch('http://127.0.0.1:7251/ingest/2b29af8d-f28f-411d-acc1-a9922535324c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CardSearch.tsx:63',message:'JSON parsed successfully',data:{hasData:!!data.data,dataLength:data.data?.length||0,totalCount:data.totalCount,fetchTime,parseTime,totalClientTime},timestamp:Date.now(),sessionId:'debug-session',runId:'perf-tracking',hypothesisId:'perf'})}).catch(()=>{});
        // #endregion
        setResults(data.data || []);
        setShowResults(true);
      } catch (err) {
        // #region agent log
        fetch('http://127.0.0.1:7251/ingest/2b29af8d-f28f-411d-acc1-a9922535324c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CardSearch.tsx:68',message:'Exception caught',data:{errorMessage:err instanceof Error?err.message:'Unknown',errorName:err instanceof Error?err.name:'Unknown',errorStack:err instanceof Error?err.stack:'N/A'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
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
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Search Pokemon Cards
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white pr-10"
            placeholder="Search by card name (e.g., Pikachu, Charizard)..."
          />
          {loading && (
            <div className="absolute right-3 top-2.5">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-96 overflow-y-auto">
          {results.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => handleSelectCard(card)}
              className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-b-0 flex items-center gap-3"
            >
              {card.images?.small && (
                <img
                  src={card.images.small}
                  alt={card.name}
                  className="w-16 h-22 object-contain flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 dark:text-white truncate">
                  {card.name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {card.set.name} • #{card.number}
                  {card.rarity && ` • ${card.rarity}`}
                </div>
                {card.tcgplayer?.prices && (
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
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
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg p-4 text-center text-gray-500 dark:text-gray-400">
          No cards found. Try a different search term.
        </div>
      )}
    </div>
  );
}

