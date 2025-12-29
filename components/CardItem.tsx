"use client";

import { useState } from "react";
import { PokemonCard } from "@/types/pokemon";

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
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {card.imageUrl && (
              <img
                src={card.imageUrl}
                alt={card.name}
                className="w-16 h-20 object-cover rounded border border-gray-300 dark:border-gray-600"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                {card.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {card.set} {card.number && `#${card.number}`}
              </p>
              {card.rarity && (
                <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
                  {card.rarity}
                </span>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-2 mt-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Value ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editData.value}
                    onChange={(e) =>
                      setEditData({ ...editData, value: e.target.value })
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editData.quantity}
                    onChange={(e) =>
                      setEditData({ ...editData, quantity: e.target.value })
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
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
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-800 dark:text-white"
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
                <button
                  onClick={handleSave}
                  className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditData({
                      value: card.value.toString(),
                      quantity: card.quantity.toString(),
                      condition: card.condition,
                    });
                  }}
                  className="px-3 py-1 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Condition:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {card.condition}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {card.quantity}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Value per card:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${card.value.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-300 dark:border-gray-600">
                <span className="text-gray-900 dark:text-white">Total Value:</span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  ${totalValue.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {!isEditing && (
          <div className="flex flex-col gap-2 ml-4">
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => {
                if (confirm(`Remove ${card.name} from collection?`)) {
                  onRemove(card.id);
                }
              }}
              className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            >
              Remove
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

