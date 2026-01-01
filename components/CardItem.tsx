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

interface CatalogPriceInfo {
  catalogCard: {
    id: string;
    name: string;
    set: string;
    number: string | null;
  };
  prices: {
    market: number | null;
    mid: number | null;
    low: number | null;
    holofoilMarket: number | null;
    holofoilMid: number | null;
  };
  currentValue: number;
}

export default function CardItem({ card, onRemove, onUpdate }: CardItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    value: card.value.toString(),
    quantity: card.quantity.toString(),
    condition: card.condition,
    isPsa: card.isPsa || false,
    psaRating: card.psaRating?.toString() || "",
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [catalogPriceInfo, setCatalogPriceInfo] = useState<CatalogPriceInfo | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleSave = () => {
    onUpdate(card.id, {
      value: parseFloat(editData.value) || 0,
      quantity: parseInt(editData.quantity) || 1,
      condition: editData.condition,
      isPsa: editData.isPsa,
      psaRating: editData.isPsa && editData.psaRating ? parseInt(editData.psaRating) : undefined,
    });
    setIsEditing(false);
  };

  const handleSyncFromCatalog = async () => {
    setIsSyncing(true);
    setSyncError(null);
    
    try {
      const response = await fetch(`/api/cards/${card.id}/catalog-price`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 404) {
          setSyncError(errorData.error || 'Card not found in catalog');
        } else {
          setSyncError(errorData.error || 'Failed to fetch catalog price');
        }
        setIsSyncing(false);
        return;
      }
      
      const priceInfo: CatalogPriceInfo = await response.json();
      
      // Check if catalog has market price (required per user preference)
      if (priceInfo.prices.market === null || priceInfo.prices.market === undefined) {
        setSyncError('No market price available in catalog for this card');
        setIsSyncing(false);
        return;
      }
      
      setCatalogPriceInfo(priceInfo);
      setShowSyncDialog(true);
      setIsSyncing(false);
    } catch (error) {
      console.error('Error syncing from catalog:', error);
      setSyncError('Failed to fetch catalog price. Please try again.');
      setIsSyncing(false);
    }
  };

  const handleConfirmSync = () => {
    if (!catalogPriceInfo) return;
    
    const marketPrice = catalogPriceInfo.prices.market;
    if (marketPrice !== null && marketPrice !== undefined) {
      onUpdate(card.id, { value: marketPrice });
      setShowSyncDialog(false);
      setCatalogPriceInfo(null);
      setSyncError(null);
    }
  };

  const handleCancelSync = () => {
    setShowSyncDialog(false);
    setCatalogPriceInfo(null);
    setSyncError(null);
  };

  const totalValue = card.value * card.quantity;

  return (
    <GlassCard className="p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 sm:gap-3 mb-2">
            {card.imageUrl && (
              <img
                src={card.imageUrl}
                alt={card.name}
                className="w-12 h-16 sm:w-16 sm:h-20 object-cover rounded-lg border-2 border-white/50 flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[var(--glass-black-dark)] text-base sm:text-lg break-words">
                {card.name}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--glass-black-dark)]/70">
                {card.set} {card.number && `#${card.number}`}
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {card.rarity && (
                  <span className="inline-block px-2 py-0.5 sm:py-1 text-xs font-medium glass-button rounded-full">
                    {card.rarity}
                  </span>
                )}
                {card.isPsa && card.psaRating && (
                  <span className="inline-block px-2 py-0.5 sm:py-1 text-xs font-bold bg-yellow-500/20 text-yellow-800 rounded-full border border-yellow-500/30">
                    PSA {card.psaRating}
                  </span>
                )}
              </div>
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
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`psa-${card.id}`}
                    checked={editData.isPsa}
                    onChange={(e) => setEditData({ 
                      ...editData, 
                      isPsa: e.target.checked,
                      psaRating: e.target.checked ? editData.psaRating : ""
                    })}
                    className="w-4 h-4 rounded border-gray-300 text-[var(--glass-primary)] focus:ring-[var(--glass-primary)]"
                  />
                  <label htmlFor={`psa-${card.id}`} className="text-xs text-[var(--glass-black-dark)]/70 cursor-pointer">
                    PSA Graded
                  </label>
                </div>
                {editData.isPsa && (
                  <div>
                    <label className="block text-xs text-[var(--glass-black-dark)]/70 mb-1">
                      PSA Rating (1-10)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={editData.psaRating}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || (parseInt(value) >= 1 && parseInt(value) <= 10)) {
                          setEditData({ ...editData, psaRating: value });
                        }
                      }}
                      className="glass-input-enhanced w-full px-2 py-1 text-sm rounded-lg"
                      placeholder="1-10"
                      required={editData.isPsa}
                    />
                  </div>
                )}
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
                      isPsa: card.isPsa || false,
                      psaRating: card.psaRating?.toString() || "",
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
              {card.isPsa && card.psaRating && (
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--glass-black-dark)]/70">PSA Rating:</span>
                  <span className="font-bold text-yellow-700">
                    {card.psaRating}
                  </span>
                </div>
              )}
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
          <div className="flex flex-row sm:flex-col gap-2 sm:ml-4 w-full sm:w-auto">
            <GlassButton
              onClick={() => setIsEditing(true)}
              variant="primary"
              className="px-3 py-2 sm:py-1 text-xs flex-1 sm:flex-none min-h-[44px] sm:min-h-0"
            >
              Edit
            </GlassButton>
            <GlassButton
              onClick={handleSyncFromCatalog}
              variant="glass"
              disabled={isSyncing}
              className="px-3 py-2 sm:py-1 text-xs flex-1 sm:flex-none min-h-[44px] sm:min-h-0 disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              {isSyncing ? "Syncing..." : "🔄 Sync from Catalog"}
            </GlassButton>
            <GlassButton
              onClick={(e) => {
                e.stopPropagation();
                const confirmed = window.confirm(`Remove ${card.name} from collection?`);
                if (confirmed) {
                  try {
                    onRemove(card.id);
                  } catch (error) {
                    console.error("Error removing card:", error);
                  }
                }
              }}
              variant="outline"
              className="px-3 py-2 sm:py-1 text-xs border-red-500 text-red-600 hover:bg-red-500/10 flex-1 sm:flex-none min-h-[44px] sm:min-h-0"
              type="button"
            >
              Remove
            </GlassButton>
          </div>
        )}
      </div>

      {/* Sync Error Message */}
      {syncError && !showSyncDialog && (
        <div className="mt-3 p-2 bg-red-500/20 border border-red-500/50 rounded-lg">
          <p className="text-xs text-red-800">{syncError}</p>
          <button
            onClick={() => setSyncError(null)}
            className="mt-1 text-xs text-red-600 hover:text-red-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Sync Confirmation Dialog */}
      {showSyncDialog && catalogPriceInfo && (
        <div className="mt-3 p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg">
          <h4 className="text-sm font-semibold text-[var(--glass-black-dark)] mb-2">
            Sync Price from Catalog
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--glass-black-dark)]/70">Current Value:</span>
              <span className="font-medium text-[var(--glass-black-dark)]">
                ${catalogPriceInfo.currentValue.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--glass-black-dark)]/70">Catalog Market Price:</span>
              <span className="font-bold text-[var(--glass-primary)]">
                ${catalogPriceInfo.prices.market!.toFixed(2)}
              </span>
            </div>
            <div className="pt-2 border-t border-white/30 flex gap-2">
              <GlassButton
                onClick={handleConfirmSync}
                variant="primary"
                className="px-3 py-1 text-xs flex-1"
              >
                Update to ${catalogPriceInfo.prices.market!.toFixed(2)}
              </GlassButton>
              <GlassButton
                onClick={handleCancelSync}
                variant="glass"
                className="px-3 py-1 text-xs flex-1"
              >
                Cancel
              </GlassButton>
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

