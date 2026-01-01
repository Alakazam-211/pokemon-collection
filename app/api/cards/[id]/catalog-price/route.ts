import { NextRequest, NextResponse } from 'next/server';
import { getCardById } from '@/lib/db';
import { findMatchingCatalogCard } from '@/lib/db-tcg-catalog';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get the collection card
    const card = await getCardById(id);
    
    if (!card) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      );
    }
    
    // Find matching catalog card
    const catalogCard = await findMatchingCatalogCard(
      card.name,
      card.set,
      card.number || null
    );
    
    if (!catalogCard) {
      return NextResponse.json(
        { error: 'Card not found in catalog' },
        { status: 404 }
      );
    }
    
    // Return price information
    return NextResponse.json({
      catalogCard: {
        id: catalogCard.id,
        name: catalogCard.name,
        set: catalogCard.set_name,
        number: catalogCard.number,
      },
      prices: {
        market: catalogCard.price_normal_market,
        mid: catalogCard.price_normal_mid,
        low: catalogCard.price_normal_low,
        holofoilMarket: catalogCard.price_holofoil_market,
        holofoilMid: catalogCard.price_holofoil_mid,
      },
      currentValue: card.value,
    });
  } catch (error) {
    console.error('Error fetching catalog price:', error);
    return NextResponse.json(
      { error: 'Failed to fetch catalog price' },
      { status: 500 }
    );
  }
}

