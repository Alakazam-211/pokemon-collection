"use client";

import { useState, useEffect } from "react";
import { PokemonCard, CollectionStats } from "@/types/pokemon";
import AddCardForm from "@/components/AddCardForm";
import CardList from "@/components/CardList";
import CollectionStatsDisplay from "@/components/CollectionStatsDisplay";
import SyncCatalogButton from "@/components/SyncCatalogButton";
import GlassCard from "@/components/GlassCard";
import GlassButton from "@/components/GlassButton";

export default function Home() {
  const [cards, setCards] = useState<PokemonCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<CollectionStats>({
    totalCards: 0,
    totalValue: 0,
    uniqueCards: 0,
  });

  // Load cards from API on mount
  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/cards");
      if (!response.ok) {
        throw new Error("Failed to fetch cards");
      }
      const data = await response.json();
      setCards(data);
    } catch (err) {
      console.error("Error fetching cards:", err);
      setError("Failed to load cards. Please check your database connection.");
    } finally {
      setLoading(false);
    }
  };

  // Update stats whenever cards change
  useEffect(() => {
    const totalCards = cards.reduce((sum, card) => sum + card.quantity, 0);
    const totalValue = cards.reduce((sum, card) => sum + card.value * card.quantity, 0);
    const uniqueCards = cards.length;

    setStats({
      totalCards,
      totalValue,
      uniqueCards,
    });
  }, [cards]);

  const addCard = async (card: Omit<PokemonCard, "id">) => {
    try {
      setError(null);
      const response = await fetch("/api/cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(card),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add card");
      }

      const newCard = await response.json();
      setCards([newCard, ...cards]);
    } catch (err) {
      console.error("Error adding card:", err);
      setError(err instanceof Error ? err.message : "Failed to add card");
    }
  };

  const removeCard = async (id: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/cards/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete card");
      }

      setCards(cards.filter((card) => card.id !== id));
    } catch (err) {
      console.error("Error deleting card:", err);
      setError("Failed to delete card");
    }
  };

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

      const updatedCard = await response.json();
      setCards(cards.map((card) => (card.id === id ? updatedCard : card)));
    } catch (err) {
      console.error("Error updating card:", err);
      setError("Failed to update card");
    }
  };

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-[var(--glass-black-dark)] mb-2">
            Pokémon Card Collection
          </h1>
          <p className="text-[var(--glass-black-dark)]/80 mb-6 text-lg">
            Track your collection and total deck value
          </p>
          <GlassButton
            href="/collection"
            variant="primary"
            className="text-lg"
          >
            🎴 Explore Collection
          </GlassButton>
        </div>

        {error && (
          <GlassCard className="mb-6 p-6 bg-red-500/20 border-red-500/50">
            <div className="flex items-center justify-between">
              <span className="text-red-800 font-semibold">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-4 px-4 py-2 glass-button text-red-800 hover:text-red-900"
              >
                Dismiss
              </button>
            </div>
          </GlassCard>
        )}

        <CollectionStatsDisplay stats={stats} />

        <SyncCatalogButton />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <GlassCard className="p-6">
            <h2 className="text-2xl font-semibold text-[var(--glass-black-dark)] mb-4">
              Add New Card
            </h2>
            <AddCardForm onAdd={addCard} />
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-2xl font-semibold text-[var(--glass-black-dark)] mb-4">
              Your Collection ({cards.length} {cards.length === 1 ? "card" : "cards"})
            </h2>
            {loading ? (
              <div className="text-center py-12 text-[var(--glass-black-dark)]/70">
                <p>Loading your collection...</p>
              </div>
            ) : (
              <CardList
                cards={cards}
                onRemove={removeCard}
                onUpdate={updateCard}
              />
            )}
          </GlassCard>
        </div>
      </div>
    </main>
  );
}

