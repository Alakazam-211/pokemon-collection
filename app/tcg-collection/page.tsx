"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { TCGCatalogCard } from "@/lib/db-tcg-catalog";
import GlassCard from "@/components/GlassCard";
import GlassButton from "@/components/GlassButton";
import SyncCatalogButton from "@/components/SyncCatalogButton";
import AddToCollectionModal from "@/components/AddToCollectionModal";
import FilterBar, { FilterOptions, ActiveFilters } from "@/components/FilterBar";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

export default function TCGCollection() {
  const [cards, setCards] = useState<TCGCatalogCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCard, setSelectedCard] = useState<TCGCatalogCard | null>(null);
  const [cardToAdd, setCardToAdd] = useState<TCGCatalogCard | null>(null);
  const [filters, setFilters] = useState<ActiveFilters>({});
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({});
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);
  const limit = 50;

  // Load filter options on mount
  useEffect(() => {
    fetch("/api/tcg-catalog/filters")
      .then((res) => res.json())
      .then((data) => {
        setFilterOptions({
          sets: data.sets || [],
          rarities: data.rarities || [],
          series: data.series || [],
          types: data.types || [],
        });
      })
      .catch((err) => console.error("Error loading filter options:", err));
  }, []);

  useEffect(() => {
    // Reset when search term or filters change
    setCards([]);
    pageRef.current = 1;
    setHasMore(true);
    fetchCards(true);
  }, [searchTerm, filters]);

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
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (filters.set) {
        params.append('set', filters.set);
      }
      if (filters.rarity) {
        params.append('rarity', filters.rarity);
      }
      if (filters.series) {
        params.append('series', filters.series);
      }
      if (filters.type) {
        params.append('type', filters.type);
      }
      
      const response = await fetch(`/api/tcg-catalog?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch cards");
      }
      const data = await response.json();
      
      if (reset) {
        setCards(data.data);
      } else {
        setCards(prev => [...prev, ...data.data]);
      }
      
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.total);
      setHasMore(currentPage < data.pagination.totalPages);
      
      if (!reset) {
        pageRef.current += 1;
      }
    } catch (err) {
      console.error("Error fetching cards:", err);
      setError("Failed to load cards. Please check your database connection.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      fetchCards(false);
    }
  }, [loadingMore, hasMore, loading, searchTerm]);

  const observerTarget = useInfiniteScroll({
    hasMore,
    loading: loadingMore,
    onLoadMore: loadMore,
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const getCardPrice = (card: TCGCatalogCard): number | null => {
    return card.price_normal_market || card.price_normal_mid || card.price_normal_low || null;
  };

  if (loading && cards.length === 0) {
    return (
      <main className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--glass-primary)]"></div>
            <p className="mt-4 text-[var(--glass-black-dark)]">Loading TCG catalog...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-5xl font-bold text-[var(--glass-black-dark)] mb-2">
                TCG Collection
              </h1>
              <p className="text-[var(--glass-black-dark)]/80 text-lg">
                Browse {totalCount.toLocaleString()} cards from the Pokemon TCG database
              </p>
            </div>
            <GlassButton
              href="/"
              variant="primary"
            >
              ← Back to Home
            </GlassButton>
          </div>
        </div>

        {/* TCG Catalog Sync */}
        <SyncCatalogButton />

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, set, or rarity..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="glass-input-enhanced w-full px-6 py-4 text-lg rounded-xl"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  pageRef.current = 1;
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--glass-black-dark)]/50 hover:text-[var(--glass-black-dark)]"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <FilterBar
          filterOptions={filterOptions}
          activeFilters={filters}
          onFiltersChange={setFilters}
          variant="tcg"
        />

        {error && (
          <GlassCard className="mb-6 p-4 bg-red-500/20 border-red-500/50">
            <span className="text-red-800 font-semibold">{error}</span>
          </GlassCard>
        )}

        {/* Card Grid */}
        {cards.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-[var(--glass-black-dark)]">
              {searchTerm ? `No cards found matching "${searchTerm}"` : "No cards in the catalog yet."}
            </p>
            {!searchTerm && (
              <GlassButton
                href="/"
                variant="primary"
                className="mt-4"
              >
                Sync TCG Catalog
              </GlassButton>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4 overflow-visible">
              {cards.map((card) => {
                const price = getCardPrice(card);
                return (
                  <GlassCard
                    key={card.id}
                    className="group cursor-pointer p-0 overflow-visible transition-transform duration-300 relative"
                  >
                    {card.images_small || card.images_large ? (
                      <div className="relative aspect-[2/3] overflow-visible">
                        <div className="w-full h-full overflow-visible rounded-lg">
                          <img
                            src={card.images_large || card.images_small || ''}
                            alt={card.name}
                            className="w-full h-full object-contain rounded-lg group-hover:scale-110 transition-transform duration-300"
                            onClick={() => setSelectedCard(card)}
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
                        {/* Add Button Overlay */}
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCardToAdd(card);
                            }}
                            className="glass-button bg-[var(--glass-primary)] text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[var(--glass-primary)]/90 shadow-lg"
                            title="Add to Collection"
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-[2/3] bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center relative">
                        <svg className="w-16 h-16 text-[var(--glass-black-dark)]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {/* Add Button Overlay */}
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCardToAdd(card);
                            }}
                            className="glass-button bg-[var(--glass-primary)] text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[var(--glass-primary)]/90 shadow-lg"
                            title="Add to Collection"
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="px-1 py-0.5" onClick={() => setSelectedCard(card)}>
                      <h3 className="font-bold text-[var(--glass-black-dark)] text-sm mb-0 line-clamp-2 group-hover:text-[var(--glass-primary)] transition-colors">
                        {card.name}
                      </h3>
                      <p className="text-xs text-[var(--glass-black-dark)]/70 mb-0">
                        {card.set_name} {card.number && `#${card.number}`}
                      </p>
                      {card.rarity && (
                        <span className="inline-block px-1.5 py-0.5 text-xs font-medium glass-button rounded-full mb-0">
                          {card.rarity}
                        </span>
                      )}
                      {price !== null && (
                        <div className="mt-0.5 pt-0.5 border-t border-white/30">
                          <p className="text-xs text-[var(--glass-black-dark)]/70">Market Price</p>
                          <p className="text-sm font-bold text-[var(--glass-primary)]">
                            ${price.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                );
              })}
            </div>

            {/* Infinite Scroll Loading Indicator */}
            {hasMore && (
              <div ref={observerTarget} className="mt-8 flex justify-center">
                {loadingMore && (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--glass-primary)]"></div>
                    <p className="mt-2 text-sm text-[var(--glass-black-dark)]/70">Loading more cards...</p>
                  </div>
                )}
              </div>
            )}
            
            {!hasMore && cards.length > 0 && (
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedCard(null)}
        >
          <GlassCard
            className="max-w-4xl w-full max-h-[90vh] overflow-y-auto relative !bg-white"
            style={{ background: '#ffffff', backdropFilter: 'none' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <button
                onClick={() => setSelectedCard(null)}
                className="absolute top-4 right-4 z-10 glass-button rounded-full p-2 hover:bg-white/40 transition-colors"
              >
                <svg className="w-6 h-6 text-[var(--glass-black-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="grid md:grid-cols-2 gap-6 p-6">
                <div className="flex items-center justify-center">
                  {selectedCard.images_large || selectedCard.images_small ? (
                    <img
                      src={selectedCard.images_large || selectedCard.images_small || ''}
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
                
                <div className="space-y-4">
                  <div>
                    <h2 className="text-3xl font-bold text-[var(--glass-black-dark)] mb-2">
                      {selectedCard.name}
                    </h2>
                    <p className="text-lg text-[var(--glass-black-dark)]/70">
                      {selectedCard.set_name} {selectedCard.number && `#${selectedCard.number}`}
                    </p>
                  </div>

                  {selectedCard.rarity && (
                    <div>
                      <span className="inline-block px-4 py-2 text-sm font-medium glass-button rounded-full">
                        {selectedCard.rarity}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/30">
                    {selectedCard.supertype && (
                      <div>
                        <p className="text-sm text-[var(--glass-black-dark)]/70 mb-1">Type</p>
                        <p className="text-lg font-semibold text-[var(--glass-black-dark)]">
                          {selectedCard.supertype}
                        </p>
                      </div>
                    )}
                    {selectedCard.hp && (
                      <div>
                        <p className="text-sm text-[var(--glass-black-dark)]/70 mb-1">HP</p>
                        <p className="text-lg font-semibold text-[var(--glass-black-dark)]">
                          {selectedCard.hp}
                        </p>
                      </div>
                    )}
                    {selectedCard.types && selectedCard.types.length > 0 && (
                      <div>
                        <p className="text-sm text-[var(--glass-black-dark)]/70 mb-1">Types</p>
                        <p className="text-lg font-semibold text-[var(--glass-black-dark)]">
                          {selectedCard.types.join(", ")}
                        </p>
                      </div>
                    )}
                    {selectedCard.artist && (
                      <div>
                        <p className="text-sm text-[var(--glass-black-dark)]/70 mb-1">Artist</p>
                        <p className="text-lg font-semibold text-[var(--glass-black-dark)]">
                          {selectedCard.artist}
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedCard.flavor_text && (
                    <div className="pt-4 border-t border-white/30">
                      <p className="text-sm text-[var(--glass-black-dark)]/70 mb-2">Flavor Text</p>
                      <p className="text-base text-[var(--glass-black-dark)] italic">
                        {selectedCard.flavor_text}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/30">
                    {selectedCard.price_normal_market && (
                      <div>
                        <p className="text-sm text-[var(--glass-black-dark)]/70 mb-1">Market Price</p>
                        <p className="text-xl font-bold text-[var(--glass-primary)]">
                          ${selectedCard.price_normal_market.toFixed(2)}
                        </p>
                      </div>
                    )}
                    {selectedCard.price_normal_mid && (
                      <div>
                        <p className="text-sm text-[var(--glass-black-dark)]/70 mb-1">Mid Price</p>
                        <p className="text-lg font-semibold text-[var(--glass-black-dark)]">
                          ${selectedCard.price_normal_mid.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-4 pt-4">
                    <GlassButton
                      onClick={() => {
                        setCardToAdd(selectedCard);
                        setSelectedCard(null);
                      }}
                      variant="primary"
                      className="w-full"
                    >
                      Add to Collection
                    </GlassButton>
                    {selectedCard.tcgplayer_url && (
                      <a
                        href={selectedCard.tcgplayer_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glass-button px-6 py-3 rounded-full font-semibold transition-all duration-300 text-center hover:bg-white/40 hover:-translate-y-0.5 w-full"
                      >
                        View on TCGPlayer →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Add to Collection Modal */}
      {cardToAdd && (
        <AddToCollectionModal
          card={cardToAdd}
          onClose={() => setCardToAdd(null)}
          onSuccess={() => {
            // Optionally show a success message or refresh data
            console.log("Card added to collection successfully!");
          }}
        />
      )}
    </main>
  );
}

