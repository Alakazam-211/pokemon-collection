"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { PokemonCard } from "@/types/pokemon";
import GlassCard from "@/components/GlassCard";
import GlassButton from "@/components/GlassButton";
import FilterBar, { FilterOptions, ActiveFilters } from "@/components/FilterBar";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

interface CatalogPriceInfo {
  catalogCard: {
    id: string;
    name: string;
    set: string;
    number: string | null;
  };
  prices: {
    market: number | null;
    mid: number | null;
    low: number | null;
    holofoilMarket: number | null;
    holofoilMid: number | null;
  };
  currentValue: number;
}

export default function CollectionExplorer() {
  const [cards, setCards] = useState<PokemonCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCard, setSelectedCard] = useState<PokemonCard | null>(null);
  const [filters, setFilters] = useState<ActiveFilters>({});
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({});
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);
  const limit = 50;
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [catalogPriceInfo, setCatalogPriceInfo] = useState<CatalogPriceInfo | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<{
    value: string;
    quantity: string;
    condition: PokemonCard["condition"];
    isPsa: boolean;
    psaRating: string;
  } | null>(null);
  // Load sort order from localStorage, default to "recently-added"
  const [sortOrder, setSortOrder] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("collectionSortOrder") || "recently-added";
    }
    return "recently-added";
  });

  // Save sort order to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("collectionSortOrder", sortOrder);
    }
  }, [sortOrder]);

  // Load filter options on mount
  useEffect(() => {
    fetch("/api/cards/filters")
      .then((res) => res.json())
      .then((data) => {
        setFilterOptions({
          sets: data.sets || [],
          rarities: data.rarities || [],
          conditions: data.conditions || [],
          types: data.types || [],
        });
      })
      .catch((err) => console.error("Error loading filter options:", err));
  }, []);

  useEffect(() => {
    // Initial load or reload when search or filters change
    const shouldReload = !searchTerm;
    if (shouldReload) {
      setCards([]);
      pageRef.current = 1;
      setHasMore(true);
      fetchCards(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filters]);

  // Reset editing state when selected card changes
  useEffect(() => {
    setIsEditing(false);
    setEditData(null);
  }, [selectedCard]);

  const fetchCards = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        pageRef.current = 1;
      } else {
        setLoadingMore(true);
      }
      setError(null);
      const currentPage = pageRef.current;
      
      // Build query params
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });
      
      if (filters.set) {
        params.append('set', filters.set);
      }
      if (filters.rarity) {
        params.append('rarity', filters.rarity);
      }
      if (filters.condition) {
        params.append('condition', filters.condition);
      }
      if (filters.type) {
        params.append('type', filters.type);
      }
      
      const response = await fetch(`/api/cards?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.details || errorData.error || "Failed to fetch cards";
        throw new Error(errorMessage);
      }
      const data = await response.json();
      
      // Include createdAt for sorting
      const cardsWithTimestamp = data.data.map((card: any) => ({
        ...card,
        createdAt: card.createdAt || card.created_at,
      }));
      
      if (reset) {
        setCards(cardsWithTimestamp);
      } else {
        setCards(prev => [...prev, ...cardsWithTimestamp]);
      }
      
      setTotalCount(data.pagination.total);
      setHasMore(currentPage < data.pagination.totalPages);
      
      if (!reset) {
        pageRef.current += 1;
      }
    } catch (err) {
      console.error("Error fetching cards:", err);
      setError(err instanceof Error ? err.message : "Failed to load cards. Please check your database connection.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading && !searchTerm) {
      fetchCards(false);
    }
  }, [loadingMore, hasMore, loading, searchTerm]);

  const observerTarget = useInfiniteScroll({
    hasMore: hasMore && !searchTerm,
    loading: loadingMore,
    onLoadMore: loadMore,
  });

  const filteredCards = useMemo(() => {
    let result = cards;
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(
        (card) =>
          card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          card.set.toLowerCase().includes(searchTerm.toLowerCase()) ||
          card.rarity.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (card.number && card.number.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply sorting
    const sorted = [...result].sort((a, b) => {
      switch (sortOrder) {
        case "recently-added":
          // Sort by createdAt if available, otherwise maintain API order
          const aCreated = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : Date.now();
          const bCreated = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : Date.now();
          return bCreated - aCreated; // Most recent first
        
        case "alphabetical":
          const nameA = a.name.toLowerCase();
          const nameB = b.name.toLowerCase();
          if (nameA !== nameB) return nameA.localeCompare(nameB);
          // If names are equal, sort by set
          return a.set.localeCompare(b.set);
        
        case "card-number":
          // Sort by set first, then by card number
          const setCompare = a.set.localeCompare(b.set);
          if (setCompare !== 0) return setCompare;
          // Parse card numbers (handle formats like "25/102" or "25")
          const parseNumber = (num: string) => {
            if (!num) return Infinity;
            const match = num.match(/^(\d+)/);
            return match ? parseInt(match[1], 10) : Infinity;
          };
          return parseNumber(a.number || "") - parseNumber(b.number || "");
        
        case "value-high-low":
          return (b.value * b.quantity) - (a.value * a.quantity);
        
        case "value-low-high":
          return (a.value * a.quantity) - (b.value * b.quantity);
        
        case "set-name":
          const setA = a.set.toLowerCase();
          const setB = b.set.toLowerCase();
          if (setA !== setB) return setA.localeCompare(setB);
          // If sets are equal, sort by card number
          const parseNumberA = (num: string) => {
            if (!num) return Infinity;
            const match = num.match(/^(\d+)/);
            return match ? parseInt(match[1], 10) : Infinity;
          };
          return parseNumberA(a.number || "") - parseNumberA(b.number || "");
        
        case "rarity":
          const rarityA = a.rarity || "";
          const rarityB = b.rarity || "";
          if (rarityA !== rarityB) return rarityA.localeCompare(rarityB);
          // If rarity is equal, sort by name
          return a.name.localeCompare(b.name);
        
        case "total-value-high-low":
          return (b.value * b.quantity) - (a.value * a.quantity);
        
        case "total-value-low-high":
          return (a.value * a.quantity) - (b.value * b.quantity);
        
        default:
          return 0;
      }
    });
    
    return sorted;
  }, [cards, searchTerm, sortOrder]);

  const updateCard = async (id: string, updates: Partial<PokemonCard>) => {
    try {
      setError(null);
      const response = await fetch(`/api/cards/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to update card");
      }

      const updatedCardData = await response.json();
      // Preserve createdAt when updating
      const updatedCard = {
        ...updatedCardData,
        createdAt: updatedCardData.createdAt || updatedCardData.created_at || (cards.find(c => c.id === id) as any)?.createdAt,
      };
      
      setCards(cards.map((card) => (card.id === id ? updatedCard : card)));
      
      // Update selected card if it's the one being updated
      if (selectedCard && selectedCard.id === id) {
        setSelectedCard(updatedCard);
        setIsEditing(false);
        setEditData(null);
      }
    } catch (err) {
      console.error("Error updating card:", err);
      setError("Failed to update card");
    }
  };

  const removeCard = async (id: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/cards/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete card");
      }

      // Remove card from list
      setCards((prevCards) => prevCards.filter((card) => card.id !== id));
      
      // Close modal if the deleted card was selected
      if (selectedCard && selectedCard.id === id) {
        setSelectedCard(null);
      }
    } catch (err) {
      console.error("Error deleting card:", err);
      setError(err instanceof Error ? err.message : "Failed to delete card");
    }
  };

  const handleSyncFromCatalog = async () => {
    if (!selectedCard) return;
    
    setIsSyncing(true);
    setSyncError(null);
    
    try {
      const response = await fetch(`/api/cards/${selectedCard.id}/catalog-price`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 404) {
          setSyncError(errorData.error || 'Card not found in catalog');
        } else {
          setSyncError(errorData.error || 'Failed to fetch catalog price');
        }
        setIsSyncing(false);
        return;
      }
      
      const priceInfo: CatalogPriceInfo = await response.json();
      
      // Check if catalog has any pricing data
      const hasAnyPrice = priceInfo.prices.market !== null || 
                         priceInfo.prices.mid !== null || 
                         priceInfo.prices.low !== null ||
                         priceInfo.prices.holofoilMarket !== null ||
                         priceInfo.prices.holofoilMid !== null;
      
      if (!hasAnyPrice) {
        setSyncError('No price data available in catalog for this card');
        setIsSyncing(false);
        return;
      }
      
      // Prefer market price, but allow fallback to mid or low if market isn't available
      if (priceInfo.prices.market === null || priceInfo.prices.market === undefined) {
        // Use mid price as fallback, or low, or holofoil market
        const fallbackPrice = priceInfo.prices.mid || 
                             priceInfo.prices.low || 
                             priceInfo.prices.holofoilMarket ||
                             priceInfo.prices.holofoilMid;
        
        if (fallbackPrice !== null && fallbackPrice !== undefined) {
          // Update the market price to the fallback for display
          priceInfo.prices.market = fallbackPrice;
        } else {
          setSyncError('No market price available in catalog for this card');
          setIsSyncing(false);
          return;
        }
      }
      
      setCatalogPriceInfo(priceInfo);
      setShowSyncDialog(true);
      setIsSyncing(false);
    } catch (error) {
      console.error('Error syncing from catalog:', error);
      setSyncError('Failed to fetch catalog price. Please try again.');
      setIsSyncing(false);
    }
  };

  const handleConfirmSync = () => {
    if (!catalogPriceInfo || !selectedCard) return;
    
    const marketPrice = catalogPriceInfo.prices.market;
    if (marketPrice !== null && marketPrice !== undefined) {
      updateCard(selectedCard.id, { value: marketPrice });
      setShowSyncDialog(false);
      setCatalogPriceInfo(null);
      setSyncError(null);
    }
  };

  const handleCancelSync = () => {
    setShowSyncDialog(false);
    setCatalogPriceInfo(null);
    setSyncError(null);
  };

  const handleStartEdit = () => {
    if (!selectedCard) return;
    setEditData({
      value: selectedCard.value.toString(),
      quantity: selectedCard.quantity.toString(),
      condition: selectedCard.condition,
      isPsa: selectedCard.isPsa || false,
      psaRating: selectedCard.psaRating?.toString() || "",
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData(null);
  };

  const handleSaveEdit = () => {
    if (!selectedCard || !editData) return;
    
    updateCard(selectedCard.id, {
      value: parseFloat(editData.value) || 0,
      quantity: parseInt(editData.quantity) || 1,
      condition: editData.condition,
      isPsa: editData.isPsa,
      psaRating: editData.isPsa && editData.psaRating ? parseInt(editData.psaRating) : undefined,
    });
    setIsEditing(false);
    setEditData(null);
  };

  if (loading) {
    return (
      <main className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--glass-primary)]"></div>
            <p className="mt-4 text-[var(--glass-black-dark)]">Loading collection...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="mb-4 sm:mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--glass-black-dark)] mb-2">
                Collection Explorer
              </h1>
              <p className="text-[var(--glass-black-dark)]/80 text-base sm:text-lg">
                Browse your {totalCount > 0 ? totalCount : cards.length} {totalCount === 1 ? "card" : "cards"} in detail
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4 sm:mb-6">
            <input
              type="text"
              placeholder="Search by name, set, rarity, or number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input-enhanced w-full px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg rounded-xl min-h-[44px]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-[var(--glass-black-dark)]/50 hover:text-[var(--glass-black-dark)] active:text-[var(--glass-black-dark)] min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Filter Bar */}
          <FilterBar
            filterOptions={filterOptions}
            activeFilters={filters}
            onFiltersChange={setFilters}
            variant="collection"
            sortOrder={sortOrder}
            onSortChange={setSortOrder}
          />
        </div>

        {error && (
          <GlassCard className="mb-6 p-4 bg-red-500/20 border-red-500/50">
            <span className="text-red-800 font-semibold">{error}</span>
          </GlassCard>
        )}

        {/* Card Grid */}
        {filteredCards.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-[var(--glass-black-dark)]">
              {searchTerm ? `No cards found matching "${searchTerm}"` : "No cards in your collection yet."}
            </p>
            {!searchTerm && (
              <GlassButton
                href="/"
                variant="primary"
                className="mt-4"
              >
                Add Your First Card
              </GlassButton>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 overflow-visible">
              {filteredCards.map((card) => (
                <GlassCard
                  key={card.id}
                  onClick={() => setSelectedCard(card)}
                  className="group cursor-pointer p-0 overflow-visible transition-transform duration-300"
                >
                  {card.imageUrl ? (
                    <div 
                      className="relative aspect-[2/3] overflow-visible"
                    >
                      <div className="w-full h-full overflow-visible rounded-lg">
                        <img
                          src={card.imageUrl}
                          alt={card.name}
                          className="w-full h-full object-contain rounded-lg group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center text-[var(--glass-black-dark)]/50">
                                  <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              `;
                            }
                          }}
                        />
                      </div>
                      {card.quantity > 1 && (
                        <div className="absolute top-1 right-1 bg-[var(--glass-primary)] text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg z-10">
                          ×{card.quantity}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-[2/3] bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center">
                      <svg className="w-16 h-16 text-[var(--glass-black-dark)]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="px-1 py-0.5">
                    <h3 className="font-bold text-[var(--glass-black-dark)] text-sm mb-0 line-clamp-2 group-hover:text-[var(--glass-primary)] transition-colors">
                      {card.name}
                    </h3>
                    <p className="text-xs text-[var(--glass-black-dark)]/70 mb-0">
                      {card.set} {card.number && `#${card.number}`}
                    </p>
                    {card.rarity && (
                      <span className="inline-block px-1.5 py-0.5 text-xs font-medium glass-button rounded-full mb-0">
                        {card.rarity}
                      </span>
                    )}
                    <div className="mt-0.5 pt-0.5 border-t border-white/30">
                      <p className="text-xs text-[var(--glass-black-dark)]/70">Value</p>
                      <p className="text-sm font-bold text-[var(--glass-primary)]">
                        ${(card.value * card.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
            
            {/* Infinite Scroll Loading Indicator */}
            {hasMore && !searchTerm && (
              <div ref={observerTarget} className="mt-8 flex justify-center">
                {loadingMore && (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--glass-primary)]"></div>
                    <p className="mt-2 text-sm text-[var(--glass-black-dark)]/70">Loading more cards...</p>
                  </div>
                )}
              </div>
            )}
            
            {!hasMore && cards.length > 0 && !searchTerm && (
              <div className="mt-8 text-center">
                <p className="text-[var(--glass-black-dark)]/70">
                  You've reached the end! Showing all {totalCount.toLocaleString()} cards.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal for larger card view */}
      {selectedCard && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={() => setSelectedCard(null)}
        >
          <GlassCard
            className="max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto relative bg-white mx-2 sm:mx-0"
            style={{ background: '#ffffff', backdropFilter: 'none' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <button
                onClick={() => setSelectedCard(null)}
                className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10 glass-button rounded-full p-2 hover:bg-white/40 active:bg-white/40 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--glass-black-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6">
                <div className="flex items-center justify-center">
                  {selectedCard.imageUrl ? (
                    <img
                      src={selectedCard.imageUrl}
                      alt={selectedCard.name}
                      className="w-full max-w-md rounded-xl shadow-xl"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="w-full aspect-[2/3] bg-gradient-to-br from-white/30 to-white/10 rounded-xl flex items-center justify-center">
                              <svg class="w-32 h-32 text-[var(--glass-black-dark)]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          `;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-gradient-to-br from-white/30 to-white/10 rounded-xl flex items-center justify-center">
                      <svg className="w-32 h-32 text-[var(--glass-black-dark)]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-[var(--glass-black-dark)] mb-2 break-words">
                      {selectedCard.name}
                    </h2>
                    <p className="text-base sm:text-lg text-[var(--glass-black-dark)]/70">
                      {selectedCard.set} {selectedCard.number && `#${selectedCard.number}`}
                    </p>
                  </div>

                  {selectedCard.rarity && (
                    <div>
                      <span className="inline-block px-4 py-2 text-sm font-medium glass-button rounded-full">
                        {selectedCard.rarity}
                      </span>
                    </div>
                  )}

                  {isEditing && editData ? (
                    <div className="space-y-3 sm:space-y-4 pt-4 border-t border-white/30">
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="block text-xs sm:text-sm text-[var(--glass-black-dark)]/70 mb-1">
                            Value ($)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={editData.value}
                            onChange={(e) =>
                              setEditData({ ...editData, value: e.target.value })
                            }
                            className="glass-input-enhanced w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm text-[var(--glass-black-dark)]/70 mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={editData.quantity}
                            onChange={(e) =>
                              setEditData({ ...editData, quantity: e.target.value })
                            }
                            className="glass-input-enhanced w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm text-[var(--glass-black-dark)]/70 mb-1">
                          Condition
                        </label>
                        <select
                          value={editData.condition}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              condition: e.target.value as PokemonCard["condition"],
                            })
                          }
                          className="glass-input-enhanced w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg"
                        >
                          <option value="Mint">Mint</option>
                          <option value="Near Mint">Near Mint</option>
                          <option value="Excellent">Excellent</option>
                          <option value="Good">Good</option>
                          <option value="Fair">Fair</option>
                          <option value="Poor">Poor</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`psa-${selectedCard.id}`}
                            checked={editData.isPsa}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                isPsa: e.target.checked,
                                psaRating: e.target.checked ? editData.psaRating : "",
                              })
                            }
                            className="w-4 h-4 rounded border-gray-300 text-[var(--glass-primary)] focus:ring-[var(--glass-primary)]"
                          />
                          <label
                            htmlFor={`psa-${selectedCard.id}`}
                            className="text-xs sm:text-sm text-[var(--glass-black-dark)]/70 cursor-pointer"
                          >
                            PSA Graded
                          </label>
                        </div>
                        {editData.isPsa && (
                          <div>
                            <label className="block text-xs sm:text-sm text-[var(--glass-black-dark)]/70 mb-1">
                              PSA Rating (1-10)
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={editData.psaRating}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (
                                  value === "" ||
                                  (parseInt(value) >= 1 && parseInt(value) <= 10)
                                ) {
                                  setEditData({ ...editData, psaRating: value });
                                }
                              }}
                              className="glass-input-enhanced w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg"
                              placeholder="1-10"
                              required={editData.isPsa}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <GlassButton
                          onClick={handleSaveEdit}
                          variant="primary"
                          className="px-4 py-2 text-sm sm:text-base flex-1"
                        >
                          Save
                        </GlassButton>
                        <GlassButton
                          onClick={handleCancelEdit}
                          variant="glass"
                          className="px-4 py-2 text-sm sm:text-base flex-1"
                        >
                          Cancel
                        </GlassButton>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-4 border-t border-white/30">
                      <div>
                        <p className="text-xs sm:text-sm text-[var(--glass-black-dark)]/70 mb-1">Condition</p>
                        <p className="text-base sm:text-lg font-semibold text-[var(--glass-black-dark)]">
                          {selectedCard.condition}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-[var(--glass-black-dark)]/70 mb-1">Quantity</p>
                        <p className="text-base sm:text-lg font-semibold text-[var(--glass-black-dark)]">
                          {selectedCard.quantity}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-[var(--glass-black-dark)]/70 mb-1">Value per Card</p>
                        <p className="text-base sm:text-lg font-semibold text-[var(--glass-black-dark)]">
                          ${selectedCard.value.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-[var(--glass-black-dark)]/70 mb-1">Total Value</p>
                        <p className="text-lg sm:text-xl font-bold text-[var(--glass-primary)]">
                          ${(selectedCard.value * selectedCard.quantity).toFixed(2)}
                        </p>
                      </div>
                      {selectedCard.isPsa && selectedCard.psaRating && (
                        <>
                          <div>
                            <p className="text-xs sm:text-sm text-[var(--glass-black-dark)]/70 mb-1">PSA Rating</p>
                            <p className="text-base sm:text-lg font-bold text-yellow-700">
                              {selectedCard.psaRating}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Edit and Sync Buttons */}
                  <div className="pt-4 border-t border-white/30 space-y-2">
                    {!isEditing && (
                      <GlassButton
                        onClick={handleStartEdit}
                        variant="primary"
                        className="w-full"
                      >
                        ✏️ Edit Card
                      </GlassButton>
                    )}
                    {!isEditing && (
                      <GlassButton
                        onClick={handleSyncFromCatalog}
                        variant="glass"
                        disabled={isSyncing}
                        className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSyncing ? "Syncing..." : "🔄 Sync Price from Catalog"}
                      </GlassButton>
                    )}
                    
                    {/* Sync Error Message */}
                    {syncError && !showSyncDialog && (
                      <div className="mt-3 p-2 bg-red-500/20 border border-red-500/50 rounded-lg">
                        <p className="text-xs text-red-800">{syncError}</p>
                        <button
                          onClick={() => setSyncError(null)}
                          className="mt-1 text-xs text-red-600 hover:text-red-800 underline"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}

                    {/* Sync Confirmation Dialog */}
                    {showSyncDialog && catalogPriceInfo && (
                      <div className="mt-3 p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                        <h4 className="text-sm font-semibold text-[var(--glass-black-dark)] mb-2">
                          Sync Price from Catalog
                        </h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-[var(--glass-black-dark)]/70">Current Value:</span>
                            <span className="font-medium text-[var(--glass-black-dark)]">
                              ${catalogPriceInfo.currentValue.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[var(--glass-black-dark)]/70">Catalog Market Price:</span>
                            <span className="font-bold text-[var(--glass-primary)]">
                              ${catalogPriceInfo.prices.market!.toFixed(2)}
                            </span>
                          </div>
                          <div className="pt-2 border-t border-white/30 flex gap-2">
                            <GlassButton
                              onClick={handleConfirmSync}
                              variant="primary"
                              className="px-3 py-1 text-xs flex-1"
                            >
                              Update to ${catalogPriceInfo.prices.market!.toFixed(2)}
                            </GlassButton>
                            <GlassButton
                              onClick={handleCancelSync}
                              variant="glass"
                              className="px-3 py-1 text-xs flex-1"
                            >
                              Cancel
                            </GlassButton>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Delete Button */}
                  <div className="pt-4 border-t border-white/30">
                    <GlassButton
                      onClick={(e) => {
                        e.stopPropagation();
                        const confirmed = window.confirm(`Remove ${selectedCard.name} from collection?`);
                        if (confirmed) {
                          removeCard(selectedCard.id);
                        }
                      }}
                      variant="outline"
                      className="w-full border-red-500 text-red-600 hover:bg-red-500/10"
                    >
                      🗑️ Remove from Collection
                    </GlassButton>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </main>
  );
}

