export interface PokemonCard {
  id: string;
  name: string;
  set: string;
  number: string;
  rarity: string;
  condition: "Mint" | "Near Mint" | "Excellent" | "Good" | "Fair" | "Poor";
  value: number;
  quantity: number;
  imageUrl?: string;
  isPsa?: boolean;
  psaRating?: number; // 1-10
}

export interface CollectionStats {
  totalCards: number;
  totalValue: number;
  uniqueCards: number;
}

