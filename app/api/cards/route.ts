import { NextRequest, NextResponse } from 'next/server';
import { getAllCards, createCard } from '@/lib/db';
import { PokemonCard } from '@/types/pokemon';

export async function GET() {
  try {
    const cards = await getAllCards();
    return NextResponse.json(cards);
  } catch (error) {
    console.error('Error fetching cards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cards' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.set || body.value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, set, and value are required' },
        { status: 400 }
      );
    }

    const cardData: Omit<PokemonCard, 'id'> = {
      name: body.name,
      set: body.set,
      number: body.number || '',
      rarity: body.rarity || '',
      condition: body.condition || 'Near Mint',
      value: parseFloat(body.value),
      quantity: parseInt(body.quantity) || 1,
      imageUrl: body.imageUrl || undefined,
    };

    const newCard = await createCard(cardData);
    return NextResponse.json(newCard, { status: 201 });
  } catch (error) {
    console.error('Error creating card:', error);
    return NextResponse.json(
      { error: 'Failed to create card' },
      { status: 500 }
    );
  }
}

