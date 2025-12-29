import { NextRequest, NextResponse } from 'next/server';
import { getCardById, updateCard, deleteCard } from '@/lib/db';
import { PokemonCard } from '@/types/pokemon';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const card = await getCardById(params.id);
    
    if (!card) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(card);
  } catch (error) {
    console.error('Error fetching card:', error);
    return NextResponse.json(
      { error: 'Failed to fetch card' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    const updates: Partial<PokemonCard> = {};
    
    if (body.name !== undefined) updates.name = body.name;
    if (body.set !== undefined) updates.set = body.set;
    if (body.number !== undefined) updates.number = body.number;
    if (body.rarity !== undefined) updates.rarity = body.rarity;
    if (body.condition !== undefined) updates.condition = body.condition;
    if (body.value !== undefined) updates.value = parseFloat(body.value);
    if (body.quantity !== undefined) updates.quantity = parseInt(body.quantity);
    if (body.imageUrl !== undefined) updates.imageUrl = body.imageUrl;

    const updatedCard = await updateCard(params.id, updates);
    return NextResponse.json(updatedCard);
  } catch (error) {
    console.error('Error updating card:', error);
    if (error instanceof Error && error.message === 'Card not found') {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update card' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteCard(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting card:', error);
    if (error instanceof Error && error.message === 'Card not found') {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete card' },
      { status: 500 }
    );
  }
}

