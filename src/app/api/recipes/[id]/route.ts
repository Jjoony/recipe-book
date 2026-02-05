import { NextRequest, NextResponse } from 'next/server';
import { getRecipeById, updateRecipe, deleteRecipe } from '@/lib/notion';
import type { RecipeFormData } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/recipes/[id] - Get single recipe
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const recipe = await getRecipeById(id);

    if (!recipe) {
      return NextResponse.json(
        { success: false, error: 'Recipe not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: recipe,
    });
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recipe' },
      { status: 500 }
    );
  }
}

// PATCH /api/recipes/[id] - Update recipe
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Check admin password
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const data: Partial<RecipeFormData> = await request.json();

    const recipe = await updateRecipe(id, data);

    return NextResponse.json({
      success: true,
      data: recipe,
    });
  } catch (error) {
    console.error('Error updating recipe:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update recipe' },
      { status: 500 }
    );
  }
}

// DELETE /api/recipes/[id] - Delete recipe
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Check admin password
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    await deleteRecipe(id);

    return NextResponse.json({
      success: true,
      data: { message: 'Recipe deleted successfully' },
    });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete recipe' },
      { status: 500 }
    );
  }
}
