// Recipe Types
export interface Recipe {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  tags: string[];
  servings: number;
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  ingredients: RecipeIngredient[];
  instructions: string[];
  sourceUrl?: string;
  sourceType?: 'instagram' | 'youtube' | 'website' | 'original';
  createdAt: string;
  updatedAt: string;
}

export interface RecipeIngredient {
  ingredientId: string;
  name: string;
  amount: string;
  unit: string;
}

export interface Ingredient {
  id: string;
  name: string;
  category: string;
  unit: string;
}

// Form Types
export interface RecipeFormData {
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  tags: string[];
  servings: number;
  prepTime: number;
  cookTime: number;
  ingredients: RecipeIngredient[];
  instructions: string[];
  sourceUrl?: string;
  sourceType?: 'instagram' | 'youtube' | 'website' | 'original';
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Filter Types
export interface RecipeFilters {
  category?: string;
  tags?: string[];
  search?: string;
  ingredientIds?: string[];
}

// Notion Property Types (for mapping)
export interface NotionRecipeProperties {
  Name: { title: Array<{ plain_text: string }> };
  Description: { rich_text: Array<{ plain_text: string }> };
  ImageURL: { url: string | null };
  Category: { select: { name: string } | null };
  Tags: { multi_select: Array<{ name: string }> };
  Servings: { number: number | null };
  PrepTime: { number: number | null };
  CookTime: { number: number | null };
  Instructions: { rich_text: Array<{ plain_text: string }> };
  SourceURL: { url: string | null };
  SourceType: { select: { name: string } | null };
  Ingredients: { relation: Array<{ id: string }> };
  CreatedAt: { created_time: string };
  UpdatedAt: { last_edited_time: string };
}

export interface NotionIngredientProperties {
  Name: { title: Array<{ plain_text: string }> };
  Category: { select: { name: string } | null };
  Unit: { select: { name: string } | null };
}
