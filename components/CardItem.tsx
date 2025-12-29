"use client";

import { useState } from "react";
import { PokemonCard } from "@/types/pokemon";
import GlassCard from "./GlassCard";
import GlassButton from "./GlassButton";

interface CardItemProps {
  card: PokemonCard;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<PokemonCard>) => void;
}

export default function CardItem({ card, onRemove, onUpdate }: CardItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    value: card.value.toString(),
    quantity: card.quantity.toString(),
    condition: card.condition,
  });

  const handleSave = () => {
    onUpdate(card.id, {
      value: parseFloat(editData.value) || 0,
      quantity: parseInt(editData.quantity) || 1,
      condition: editData.condition,
    });
    setIsEditing(false);
  };

  const totalValue = card.value * card.quantity;

  return (
    <GlassCard className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {card.imageUrl && (
              <img
                src={card.imageUrl}
                alt={card.name}
                className="w-16 h-20 object-cover rounded-lg border-2 border-white/50"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <div>
              <h3 className="font-semibold text-[var(--glass-black-dark)] text-lg">
                {card.name}
              </h3>
              <p className="text-sm text-[var(--glass-black-dark)]/70">
                {card.set} {card.number && `#${card.number}`}
              </p>
              {card.rarity && (
                <span className="inline-block mt-1 px-2 py-1 text-xs font-medium glass-button rounded-full">
                  {card.rarity}
                </span>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-2 mt-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-[var(--glass-black-dark)]/70 mb-1">
                    Value ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editData.value}
                    onChange={(e) =>
                      setEditData({ ...editData, value: e.target.value })
                    }
                    className="glass-input-enhanced w-full px-2 py-1 text-sm rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--glass-black-dark)]/70 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editData.quantity}
                    onChange={(e) =>
                      setEditData({ ...editData, quantity: e.target.value })
                    }
                    className="glass-input-enhanced w-full px-2 py-1 text-sm rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[var(--glass-black-dark)]/70 mb-1">
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
                  className="glass-input-enhanced w-full px-2 py-1 text-sm rounded-lg"
                >
                  <option value="Mint">Mint</option>
                  <option value="Near Mint">Near Mint</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>
              <div className="flex gap-2">
                <GlassButton
                  onClick={handleSave}
                  variant="primary"
                  className="px-3 py-1 text-xs"
                >
                  Save
                </GlassButton>
                <GlassButton
                  onClick={() => {
                    setIsEditing(false);
                    setEditData({
                      value: card.value.toString(),
                      quantity: card.quantity.toString(),
                      condition: card.condition,
                    });
                  }}
                  variant="glass"
                  className="px-3 py-1 text-xs"
                >
                  Cancel
                </GlassButton>
              </div>
            </div>
          ) : (
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--glass-black-dark)]/70">Condition:</span>
                <span className="font-medium text-[var(--glass-black-dark)]">
                  {card.condition}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--glass-black-dark)]/70">Quantity:</span>
                <span className="font-medium text-[var(--glass-black-dark)]">
                  {card.quantity}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--glass-black-dark)]/70">Value per card:</span>
                <span className="font-medium text-[var(--glass-black-dark)]">
                  ${card.value.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-1 border-t border-white/30">
                <span className="text-[var(--glass-black-dark)]">Total Value:</span>
                <span className="text-[var(--glass-primary)]">
                  ${totalValue.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {!isEditing && (
          <div className="flex flex-col gap-2 ml-4">
            <GlassButton
              onClick={() => setIsEditing(true)}
              variant="primary"
              className="px-3 py-1 text-xs"
            >
              Edit
            </GlassButton>
            <GlassButton
              onClick={() => {
                if (confirm(`Remove ${card.name} from collection?`)) {
                  onRemove(card.id);
                }
              }}
              variant="outline"
              className="px-3 py-1 text-xs border-red-500 text-red-600 hover:bg-red-500/10"
            >
              Remove
            </GlassButton>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

