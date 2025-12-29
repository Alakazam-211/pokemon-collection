"use client";

import { useState } from "react";
import { PokemonCard } from "@/types/pokemon";
import CardItem from "./CardItem";

interface CardListProps {
  cards: PokemonCard[];
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<PokemonCard>) => void;
}

export default function CardList({ cards, onRemove, onUpdate }: CardListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCards = cards.filter(
    (card) =>
      card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.set.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.rarity.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (cards.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-lg">No cards in your collection yet.</p>
        <p className="text-sm mt-2">Add your first card using the form on the left!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search cards..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {filteredCards.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No cards found matching "{searchTerm}"
          </div>
        ) : (
          filteredCards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              onRemove={onRemove}
              onUpdate={onUpdate}
            />
          ))
        )}
      </div>
    </div>
  );
}

