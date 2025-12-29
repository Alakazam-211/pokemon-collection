import { sql } from '@vercel/postgres';
import { PokemonCard } from '@/types/pokemon';

// @vercel/postgres reads from POSTGRES_URL by default
// If your provider uses DATABASE_URL, set POSTGRES_URL to the same value in Vercel env vars
// Or update the environment variable name in your provider's Vercel integration settings

export async function getAllCards(): Promise<PokemonCard[]> {
  try {
    const { rows } = await sql`
      SELECT 
        id,
        name,
        set,
        number,
        rarity,
        condition,
        value,
        quantity,
        image_url as "imageUrl",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM pokemon_cards
      ORDER BY created_at DESC
    `;
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      set: row.set,
      number: row.number || '',
      rarity: row.rarity || '',
      condition: row.condition as PokemonCard['condition'],
      value: parseFloat(row.value),
      quantity: row.quantity,
      imageUrl: row.imageUrl || undefined,
    }));
  } catch (error) {
    console.error('Error fetching cards:', error);
    throw error;
  }
}

export async function getCardById(id: string): Promise<PokemonCard | null> {
  try {
    const { rows } = await sql`
      SELECT 
        id,
        name,
        set,
        number,
        rarity,
        condition,
        value,
        quantity,
        image_url as "imageUrl",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM pokemon_cards
      WHERE id = ${id}
    `;
    
    if (rows.length === 0) {
      return null;
    }
    
    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      set: row.set,
      number: row.number || '',
      rarity: row.rarity || '',
      condition: row.condition as PokemonCard['condition'],
      value: parseFloat(row.value),
      quantity: row.quantity,
      imageUrl: row.imageUrl || undefined,
    };
  } catch (error) {
    console.error('Error fetching card:', error);
    throw error;
  }
}

export async function createCard(card: Omit<PokemonCard, 'id'>): Promise<PokemonCard> {
  try {
    const { rows } = await sql`
      INSERT INTO pokemon_cards (
        name,
        set,
        number,
        rarity,
        condition,
        value,
        quantity,
        image_url
      )
      VALUES (
        ${card.name},
        ${card.set},
        ${card.number || null},
        ${card.rarity || null},
        ${card.condition},
        ${card.value},
        ${card.quantity || 1},
        ${card.imageUrl || null}
      )
      RETURNING 
        id,
        name,
        set,
        number,
        rarity,
        condition,
        value,
        quantity,
        image_url as "imageUrl",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;
    
    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      set: row.set,
      number: row.number || '',
      rarity: row.rarity || '',
      condition: row.condition as PokemonCard['condition'],
      value: parseFloat(row.value),
      quantity: row.quantity,
      imageUrl: row.imageUrl || undefined,
    };
  } catch (error) {
    console.error('Error creating card:', error);
    throw error;
  }
}

export async function updateCard(
  id: string,
  updates: Partial<Omit<PokemonCard, 'id'>>
): Promise<PokemonCard> {
  try {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.set !== undefined) {
      updateFields.push(`set = $${paramIndex++}`);
      values.push(updates.set);
    }
    if (updates.number !== undefined) {
      updateFields.push(`number = $${paramIndex++}`);
      values.push(updates.number || null);
    }
    if (updates.rarity !== undefined) {
      updateFields.push(`rarity = $${paramIndex++}`);
      values.push(updates.rarity || null);
    }
    if (updates.condition !== undefined) {
      updateFields.push(`condition = $${paramIndex++}`);
      values.push(updates.condition);
    }
    if (updates.value !== undefined) {
      updateFields.push(`value = $${paramIndex++}`);
      values.push(updates.value);
    }
    if (updates.quantity !== undefined) {
      updateFields.push(`quantity = $${paramIndex++}`);
      values.push(updates.quantity);
    }
    if (updates.imageUrl !== undefined) {
      updateFields.push(`image_url = $${paramIndex++}`);
      values.push(updates.imageUrl || null);
    }

    if (updateFields.length === 0) {
      // No updates, just return the existing card
      const card = await getCardById(id);
      if (!card) {
        throw new Error('Card not found');
      }
      return card;
    }

    values.push(id);
    const query = `
      UPDATE pokemon_cards
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING 
        id,
        name,
        set,
        number,
        rarity,
        condition,
        value,
        quantity,
        image_url as "imageUrl",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const { rows } = await sql.query(query, values);
    
    if (rows.length === 0) {
      throw new Error('Card not found');
    }

    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      set: row.set,
      number: row.number || '',
      rarity: row.rarity || '',
      condition: row.condition as PokemonCard['condition'],
      value: parseFloat(row.value),
      quantity: row.quantity,
      imageUrl: row.imageUrl || undefined,
    };
  } catch (error) {
    console.error('Error updating card:', error);
    throw error;
  }
}

export async function deleteCard(id: string): Promise<void> {
  try {
    const result = await sql`
      DELETE FROM pokemon_cards
      WHERE id = ${id}
    `;
    
    if (result.rowCount === 0) {
      throw new Error('Card not found');
    }
  } catch (error) {
    console.error('Error deleting card:', error);
    throw error;
  }
}

