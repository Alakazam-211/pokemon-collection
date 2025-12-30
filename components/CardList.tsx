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

  // Ensure cards is always an array
  const safeCards = Array.isArray(cards) ? cards : [];

  const filteredCards = safeCards.filter(
    (card) =>
      card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.set.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.rarity.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (safeCards.length === 0) {
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
          className="glass-input-enhanced w-full px-4 py-3 rounded-xl"
        />
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {filteredCards.length === 0 ? (
          <div className="text-center py-8 text-[var(--glass-black-dark)]/70">
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

