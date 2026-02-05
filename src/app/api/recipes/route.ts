import { NextRequest, NextResponse } from 'next/server';
import {
  getRecipes,
  createRecipe,
  getCategories,
  getTags
} from '@/lib/notion';
import type { RecipeFormData, RecipeFilters } from '@/types';

// GET /api/recipes - Get all recipes with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const tags = searchParams.get('tags');
    const search = searchParams.get('search');
    const meta = searchParams.get('meta'); // Get categories and tags metadata

    // If meta is requested, return categories and tags
    if (meta === 'true') {
      const [categories, allTags] = await Promise.all([
        getCategories(),
        getTags(),
      ]);
      return NextResponse.json({
        success: true,
        data: { categories, tags: allTags },
      });
    }

    const filters: RecipeFilters = {};
    if (category) filters.category = category;
    if (tags) filters.tags = tags.split(',');
    if (search) filters.search = search;

    const recipes = await getRecipes(filters);

    return NextResponse.json({
      success: true,
      data: recipes,
    });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recipes' },
      { status: 500 }
    );
  }
}

// POST /api/recipes - Create new recipe
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

    const data: RecipeFormData = await request.json();

    // Validate required fields
    if (!data.title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    const recipe = await createRecipe(data);

    return NextResponse.json({
      success: true,
      data: recipe,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating recipe:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create recipe' },
      { status: 500 }
    );
  }
}
