"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PokemonCard, CollectionStats } from "@/types/pokemon";
import AddCardForm from "@/components/AddCardForm";
import CardList from "@/components/CardList";
import CollectionStatsDisplay from "@/components/CollectionStatsDisplay";
import SyncCatalogButton from "@/components/SyncCatalogButton";

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
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
            Pokémon Card Collection
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Track your collection and total deck value
          </p>
          <Link
            href="/collection"
            className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors shadow-lg hover:shadow-xl"
          >
            🎴 Explore Collection
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-800 dark:text-red-300 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <CollectionStatsDisplay stats={stats} />

        <SyncCatalogButton />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Add New Card
            </h2>
            <AddCardForm onAdd={addCard} />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Your Collection ({cards.length} {cards.length === 1 ? "card" : "cards"})
            </h2>
            {loading ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p>Loading your collection...</p>
              </div>
            ) : (
              <CardList
                cards={cards}
                onRemove={removeCard}
                onUpdate={updateCard}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

