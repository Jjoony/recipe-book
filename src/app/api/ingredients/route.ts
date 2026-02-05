import { NextRequest, NextResponse } from 'next/server';
import { getIngredients, createIngredient } from '@/lib/notion';
import type { Ingredient } from '@/types';

// GET /api/ingredients - Get all ingredients
export async function GET() {
  try {
    const ingredients = await getIngredients();

    return NextResponse.json({
      success: true,
      data: ingredients,
    });
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ingredients' },
      { status: 500 }
    );
  }
}

// POST /api/ingredients - Create new ingredient
export async function POST(request: NextRequest) {
  try {
    // Check admin password
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data: Omit<Ingredient, 'id'> = await request.json();

    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    const ingredient = await createIngredient(data);

    return NextResponse.json({
      success: true,
      data: ingredient,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating ingredient:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create ingredient' },
      { status: 500 }
    );
  }
}
