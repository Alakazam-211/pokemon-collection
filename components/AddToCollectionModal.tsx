"use client";

import { useState, FormEvent } from "react";
import { TCGCatalogCard } from "@/lib/db-tcg-catalog";
import { PokemonCard } from "@/types/pokemon";
import GlassCard from "./GlassCard";
import GlassButton from "./GlassButton";

interface AddToCollectionModalProps {
  card: TCGCatalogCard;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddToCollectionModal({
  card,
  onClose,
  onSuccess,
}: AddToCollectionModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState<PokemonCard["condition"]>("Near Mint");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCardPrice = (): number => {
    return card.price_normal_market || card.price_normal_mid || card.price_normal_low || 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Convert TCGCatalogCard to PokemonCard format
      const cardData: Omit<PokemonCard, "id"> = {
        name: card.name,
        set: card.set_name,
        number: card.number || "",
        rarity: card.rarity || "",
        condition: condition,
        value: getCardPrice(),
        quantity: quantity,
        imageUrl: card.images_large || card.images_small || undefined,
      };

      const response = await fetch("/api/cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cardData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add card to collection");
      }

      // Success - close modal and call success callback
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error("Error adding card to collection:", err);
      setError(err instanceof Error ? err.message : "Failed to add card to collection");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <GlassCard
        className="max-w-md w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[var(--glass-black-dark)]">
              Add to Collection
            </h2>
            <button
              onClick={onClose}
              className="glass-button rounded-full p-2 hover:bg-white/40 transition-colors"
            >
              <svg className="w-6 h-6 text-[var(--glass-black-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Card Preview */}
          <div className="mb-6 flex items-center gap-4">
            {card.images_small || card.images_large ? (
              <img
                src={card.images_large || card.images_small || ""}
                alt={card.name}
                className="w-24 h-32 object-cover rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-24 h-32 bg-gradient-to-br from-white/30 to-white/10 rounded-lg flex items-center justify-center">
                <svg className="w-12 h-12 text-[var(--glass-black-dark)]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-bold text-lg text-[var(--glass-black-dark)] mb-1">
                {card.name}
              </h3>
              <p className="text-sm text-[var(--glass-black-dark)]/70">
                {card.set_name} {card.number && `#${card.number}`}
              </p>
              {card.rarity && (
                <span className="inline-block mt-1 px-2 py-1 text-xs font-medium glass-button rounded-full">
                  {card.rarity}
                </span>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Quantity Input */}
            <div>
              <label className="block text-sm font-medium text-[var(--glass-black-dark)] mb-2">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="glass-button rounded-lg px-4 py-2 text-lg font-bold hover:bg-white/40 transition-colors"
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setQuantity(Math.max(1, val));
                  }}
                  className="glass-input-enhanced flex-1 px-4 py-3 rounded-xl text-center text-lg font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="glass-button rounded-lg px-4 py-2 text-lg font-bold hover:bg-white/40 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Condition Select */}
            <div>
              <label className="block text-sm font-medium text-[var(--glass-black-dark)] mb-2">
                Condition
              </label>
              <select
                value={condition}
                onChange={(e) =>
                  setCondition(e.target.value as PokemonCard["condition"])
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

            {/* Price Display */}
            {getCardPrice() > 0 && (
              <div className="pt-4 border-t border-white/30">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--glass-black-dark)]/70">
                    Price per card:
                  </span>
                  <span className="text-lg font-bold text-[var(--glass-primary)]">
                    ${getCardPrice().toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm font-semibold text-[var(--glass-black-dark)]">
                    Total Value:
                  </span>
                  <span className="text-xl font-bold text-[var(--glass-primary)]">
                    ${(getCardPrice() * quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <GlassButton
                type="button"
                onClick={onClose}
                variant="glass"
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </GlassButton>
              <GlassButton
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Adding..." : "Add to Collection"}
              </GlassButton>
            </div>
          </form>
        </div>
      </GlassCard>
    </div>
  );
}

