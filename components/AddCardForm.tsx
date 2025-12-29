"use client";

import { useState, FormEvent } from "react";
import { PokemonCard } from "@/types/pokemon";
import { PokemonTCGCard, convertTCGCardToPokemonCard } from "@/lib/pokemon-tcg-api";
import CardSearch from "./CardSearch";
import GlassButton from "./GlassButton";

interface AddCardFormProps {
  onAdd: (card: Omit<PokemonCard, "id">) => void;
}

export default function AddCardForm({ onAdd }: AddCardFormProps) {
  const [useSearch, setUseSearch] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    set: "",
    number: "",
    rarity: "",
    condition: "Near Mint" as PokemonCard["condition"],
    value: "",
    quantity: "1",
    imageUrl: "",
  });

  const handleCardSelect = (tcgCard: PokemonTCGCard) => {
    const convertedCard = convertTCGCardToPokemonCard(tcgCard, formData.condition);
    setFormData({
      name: convertedCard.name,
      set: convertedCard.set,
      number: convertedCard.number,
      rarity: convertedCard.rarity,
      condition: formData.condition,
      value: convertedCard.value > 0 ? convertedCard.value.toString() : "",
      quantity: formData.quantity,
      imageUrl: convertedCard.imageUrl || "",
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.set || !formData.value) {
      alert("Please fill in at least Name, Set, and Value fields");
      return;
    }

    onAdd({
      name: formData.name,
      set: formData.set,
      number: formData.number,
      rarity: formData.rarity,
      condition: formData.condition,
      value: parseFloat(formData.value) || 0,
      quantity: parseInt(formData.quantity) || 1,
      imageUrl: formData.imageUrl || undefined,
    });

    // Reset form
    setFormData({
      name: "",
      set: "",
      number: "",
      rarity: "",
      condition: "Near Mint",
      value: "",
      quantity: "1",
      imageUrl: "",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Toggle between search and manual entry */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setUseSearch(true)}
          className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            useSearch
              ? "bg-[var(--glass-primary)] text-white shadow-lg"
              : "glass-button text-[var(--glass-black-dark)]"
          }`}
        >
          🔍 Search Cards
        </button>
        <button
          type="button"
          onClick={() => setUseSearch(false)}
          className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            !useSearch
              ? "bg-[var(--glass-primary)] text-white shadow-lg"
              : "glass-button text-[var(--glass-black-dark)]"
          }`}
        >
          ✏️ Manual Entry
        </button>
      </div>

      {useSearch ? (
        <CardSearch onSelectCard={handleCardSelect} />
      ) : null}

      <div>
        <label className="block text-sm font-medium text-[var(--glass-black-dark)] mb-1">
          Card Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="glass-input-enhanced w-full px-4 py-3 rounded-xl"
          placeholder="e.g., Pikachu VMAX"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--glass-black-dark)] mb-1">
            Set *
          </label>
          <input
            type="text"
            value={formData.set}
            onChange={(e) => setFormData({ ...formData, set: e.target.value })}
            className="glass-input-enhanced w-full px-4 py-3 rounded-xl"
            placeholder="e.g., Base Set"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--glass-black-dark)] mb-1">
            Card Number
          </label>
          <input
            type="text"
            value={formData.number}
            onChange={(e) => setFormData({ ...formData, number: e.target.value })}
            className="glass-input-enhanced w-full px-4 py-3 rounded-xl"
            placeholder="e.g., 25/102"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--glass-black-dark)] mb-1">
            Rarity
          </label>
          <input
            type="text"
            value={formData.rarity}
            onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
            className="glass-input-enhanced w-full px-4 py-3 rounded-xl"
            placeholder="e.g., Ultra Rare"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--glass-black-dark)] mb-1">
            Condition
          </label>
          <select
            value={formData.condition}
            onChange={(e) =>
              setFormData({
                ...formData,
                condition: e.target.value as PokemonCard["condition"],
              })
            }
            className="glass-input-enhanced w-full px-4 py-3 rounded-xl"
          >
            <option value="Mint">Mint</option>
            <option value="Near Mint">Near Mint</option>
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
            <option value="Poor">Poor</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--glass-black-dark)] mb-1">
            Value ($) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            className="glass-input-enhanced w-full px-4 py-3 rounded-xl"
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--glass-black-dark)] mb-1">
            Quantity
          </label>
          <input
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            className="glass-input-enhanced w-full px-4 py-3 rounded-xl"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--glass-black-dark)] mb-1">
          Image URL (optional)
        </label>
        <input
          type="url"
          value={formData.imageUrl}
          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          className="glass-input-enhanced w-full px-4 py-3 rounded-xl"
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <GlassButton
        type="submit"
        variant="primary"
        className="w-full"
      >
        Add Card to Collection
      </GlassButton>
    </form>
  );
}

