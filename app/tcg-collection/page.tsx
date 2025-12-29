"use client";

import { useState, useEffect } from "react";
import { TCGCatalogCard } from "@/lib/db-tcg-catalog";
import GlassCard from "@/components/GlassCard";
import GlassButton from "@/components/GlassButton";
import SyncCatalogButton from "@/components/SyncCatalogButton";

export default function TCGCollection() {
  const [cards, setCards] = useState<TCGCatalogCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCard, setSelectedCard] = useState<TCGCatalogCard | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 50;

  useEffect(() => {
    fetchCards();
  }, [page, searchTerm]);

  const fetchCards = async () => {
    try {
      setLoading(true);
      setError(null);
      const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
      const response = await fetch(`/api/tcg-catalog?page=${page}&limit=${limit}${searchParam}`);
      if (!response.ok) {
        throw new Error("Failed to fetch cards");
      }
      const data = await response.json();
      setCards(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.total);
    } catch (err) {
      console.error("Error fetching cards:", err);
      setError("Failed to load cards. Please check your database connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page when searching
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
        <div className="mb-8">
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
                  setPage(1);
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {cards.map((card) => {
                const price = getCardPrice(card);
                return (
                  <GlassCard
                    key={card.id}
                    onClick={() => setSelectedCard(card)}
                    className="group cursor-pointer p-0 overflow-hidden hover:scale-105 transition-transform duration-300"
                  >
                    {card.images_small || card.images_large ? (
                      <div className="relative aspect-[2/3] overflow-hidden p-2">
                        <img
                          src={card.images_large || card.images_small || ''}
                          alt={card.name}
                          className="w-full h-full object-cover rounded-lg group-hover:scale-110 transition-transform duration-300"
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
                    ) : (
                      <div className="aspect-[2/3] bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center">
                        <svg className="w-16 h-16 text-[var(--glass-black-dark)]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-[var(--glass-black-dark)] text-sm mb-1 line-clamp-2 group-hover:text-[var(--glass-primary)] transition-colors">
                        {card.name}
                      </h3>
                      <p className="text-xs text-[var(--glass-black-dark)]/70 mb-2">
                        {card.set_name} {card.number && `#${card.number}`}
                      </p>
                      {card.rarity && (
                        <span className="inline-block px-2 py-1 text-xs font-medium glass-button rounded-full mb-2">
                          {card.rarity}
                        </span>
                      )}
                      {price !== null && (
                        <div className="mt-2 pt-2 border-t border-white/30">
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 bg-[var(--glass-primary)] text-white hover:bg-[var(--glass-primary-dark)] shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${
                    page === 1 ? "opacity-50 cursor-not-allowed hover:translate-y-0" : ""
                  }`}
                >
                  ← Previous
                </button>
                <span className="text-[var(--glass-black-dark)] font-semibold">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 bg-[var(--glass-primary)] text-white hover:bg-[var(--glass-primary-dark)] shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${
                    page === totalPages ? "opacity-50 cursor-not-allowed hover:translate-y-0" : ""
                  }`}
                >
                  Next →
                </button>
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
            className="max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
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

                  {selectedCard.tcgplayer_url && (
                    <div className="pt-4">
                      <a
                        href={selectedCard.tcgplayer_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glass-button px-4 py-2 inline-block text-center"
                      >
                        View on TCGPlayer →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </main>
  );
}

