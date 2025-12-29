"use client";

import { useState, useEffect } from "react";
import { PokemonCard } from "@/types/pokemon";
import GlassCard from "@/components/GlassCard";
import GlassButton from "@/components/GlassButton";

export default function CollectionExplorer() {
  const [cards, setCards] = useState<PokemonCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCard, setSelectedCard] = useState<PokemonCard | null>(null);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/cards");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.details || errorData.error || "Failed to fetch cards";
        throw new Error(errorMessage);
      }
      const data = await response.json();
      setCards(data);
    } catch (err) {
      console.error("Error fetching cards:", err);
      setError(err instanceof Error ? err.message : "Failed to load cards. Please check your database connection.");
    } finally {
      setLoading(false);
    }
  };

  const filteredCards = cards.filter(
    (card) =>
      card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.set.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.rarity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (card.number && card.number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-5xl font-bold text-[var(--glass-black-dark)] mb-2">
                Collection Explorer
              </h1>
              <p className="text-[var(--glass-black-dark)]/80 text-lg">
                Browse your {cards.length} {cards.length === 1 ? "card" : "cards"} in detail
              </p>
            </div>
            <GlassButton
              href="/"
              variant="primary"
            >
              ← Back to Collection
            </GlassButton>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, set, rarity, or number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input-enhanced w-full px-6 py-4 text-lg rounded-xl"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {filteredCards.map((card) => (
              <GlassCard
                key={card.id}
                onClick={() => setSelectedCard(card)}
                className="group cursor-pointer p-0 overflow-hidden hover:scale-105 transition-transform duration-300"
              >
                {card.imageUrl ? (
                  <div className="relative aspect-[2/3] overflow-hidden p-2">
                    <img
                      src={card.imageUrl}
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
                    {card.quantity > 1 && (
                      <div className="absolute top-2 right-2 bg-[var(--glass-primary)] text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg z-10">
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
                <div className="p-4">
                  <h3 className="font-bold text-[var(--glass-black-dark)] text-sm mb-1 line-clamp-2 group-hover:text-[var(--glass-primary)] transition-colors">
                    {card.name}
                  </h3>
                  <p className="text-xs text-[var(--glass-black-dark)]/70 mb-2">
                    {card.set} {card.number && `#${card.number}`}
                  </p>
                  {card.rarity && (
                    <span className="inline-block px-2 py-1 text-xs font-medium glass-button rounded-full mb-2">
                      {card.rarity}
                    </span>
                  )}
                  <div className="mt-2 pt-2 border-t border-white/30">
                    <p className="text-xs text-[var(--glass-black-dark)]/70">Value</p>
                    <p className="text-sm font-bold text-[var(--glass-primary)]">
                      ${(card.value * card.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
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
                
                <div className="space-y-4">
                  <div>
                    <h2 className="text-3xl font-bold text-[var(--glass-black-dark)] mb-2">
                      {selectedCard.name}
                    </h2>
                    <p className="text-lg text-[var(--glass-black-dark)]/70">
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

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/30">
                    <div>
                      <p className="text-sm text-[var(--glass-black-dark)]/70 mb-1">Condition</p>
                      <p className="text-lg font-semibold text-[var(--glass-black-dark)]">
                        {selectedCard.condition}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--glass-black-dark)]/70 mb-1">Quantity</p>
                      <p className="text-lg font-semibold text-[var(--glass-black-dark)]">
                        {selectedCard.quantity}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--glass-black-dark)]/70 mb-1">Value per Card</p>
                      <p className="text-lg font-semibold text-[var(--glass-black-dark)]">
                        ${selectedCard.value.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--glass-black-dark)]/70 mb-1">Total Value</p>
                      <p className="text-xl font-bold text-[var(--glass-primary)]">
                        ${(selectedCard.value * selectedCard.quantity).toFixed(2)}
                      </p>
                    </div>
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

