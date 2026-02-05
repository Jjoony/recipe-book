import { Client } from '@notionhq/client';
import type {
  Recipe,
  Ingredient,
  RecipeFormData,
  RecipeFilters,
  RecipeIngredient
} from '@/types';

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const NOTION_API_KEY = process.env.NOTION_API_KEY!;
const RECIPES_DB_ID = process.env.NOTION_RECIPES_DB_ID!;
const INGREDIENTS_DB_ID = process.env.NOTION_INGREDIENTS_DB_ID!;

// Direct API call for database query (workaround for SDK issue)
async function queryDatabaseDirect(databaseId: string, body: object = {}) {
  const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to query database');
  }

  return response.json();
}

// Helper function to extract text from rich_text
function extractText(richText: Array<{ plain_text: string }> | undefined): string {
  if (!richText || richText.length === 0) return '';
  return richText.map(t => t.plain_text).join('');
}

// Helper function to parse instructions from text
function parseInstructions(text: string): string[] {
  if (!text) return [];
  return text
    .split(/\n+/)
    .map(line => line.replace(/^\d+\.\s*/, '').trim())
    .filter(line => line.length > 0);
}

// Transform Notion page to Recipe
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformToRecipe(page: any, ingredientDetails?: Map<string, Ingredient>): Recipe {
  const props = page.properties;

  const ingredientRelations = props.Ingredients?.relation || [];
  const ingredients: RecipeIngredient[] = ingredientRelations.map((rel: { id: string }) => {
    const ingredient = ingredientDetails?.get(rel.id);
    return {
      ingredientId: rel.id,
      name: ingredient?.name || '',
      amount: '',
      unit: ingredient?.unit || '',
    };
  });

  return {
    id: page.id,
    title: extractText(props.Name?.title),
    description: extractText(props.Description?.rich_text),
    imageUrl: props.ImageURL?.url || '',
    category: props.Category?.select?.name || '',
    tags: props.Tags?.multi_select?.map((t: { name: string }) => t.name) || [],
    servings: props.Servings?.number || 0,
    prepTime: props.PrepTime?.number || 0,
    cookTime: props.CookTime?.number || 0,
    ingredients,
    instructions: parseInstructions(extractText(props.Instructions?.rich_text)),
    sourceUrl: props.SourceURL?.url || undefined,
    sourceType: props.SourceType?.select?.name as Recipe['sourceType'] || undefined,
    createdAt: page.created_time,
    updatedAt: page.last_edited_time,
  };
}

// Transform Notion page to Ingredient
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformToIngredient(page: any): Ingredient {
  const props = page.properties;

  return {
    id: page.id,
    name: extractText(props.Name?.title),
    category: props.Category?.select?.name || '',
    unit: props.Unit?.select?.name || '',
  };
}

// Get all recipes
export async function getRecipes(filters?: RecipeFilters): Promise<Recipe[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filterConditions: any[] = [];

  if (filters?.category) {
    filterConditions.push({
      property: 'Category',
      select: { equals: filters.category },
    });
  }

  if (filters?.tags && filters.tags.length > 0) {
    filters.tags.forEach(tag => {
      filterConditions.push({
        property: 'Tags',
        multi_select: { contains: tag },
      });
    });
  }

  if (filters?.search) {
    filterConditions.push({
      property: 'Name',
      title: { contains: filters.search },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queryBody: any = {
    sorts: [{ timestamp: 'created_time', direction: 'descending' }],
  };

  if (filterConditions.length > 0) {
    queryBody.filter = { and: filterConditions };
  }

  const response = await queryDatabaseDirect(RECIPES_DB_ID, queryBody);

  const ingredients = await getIngredients();
  const ingredientMap = new Map(ingredients.map(i => [i.id, i]));

  return response.results.map((page: unknown) => transformToRecipe(page, ingredientMap));
}

// Get single recipe by ID
export async function getRecipeById(id: string): Promise<Recipe | null> {
  try {
    const page = await notion.pages.retrieve({ page_id: id });
    const ingredients = await getIngredients();
    const ingredientMap = new Map(ingredients.map(i => [i.id, i]));
    return transformToRecipe(page, ingredientMap);
  } catch {
    return null;
  }
}

// Create new recipe
export async function createRecipe(data: RecipeFormData): Promise<Recipe> {
  const response = await notion.pages.create({
    parent: { database_id: RECIPES_DB_ID },
    properties: {
      Name: {
        title: [{ text: { content: data.title } }],
      },
      Description: {
        rich_text: [{ text: { content: data.description } }],
      },
      ImageURL: {
        url: data.imageUrl || null,
      },
      Category: {
        select: data.category ? { name: data.category } : null,
      },
      Tags: {
        multi_select: data.tags.map(tag => ({ name: tag })),
      },
      Servings: {
        number: data.servings,
      },
      PrepTime: {
        number: data.prepTime,
      },
      CookTime: {
        number: data.cookTime,
      },
      Instructions: {
        rich_text: [{
          text: {
            content: data.instructions.map((inst, i) => `${i + 1}. ${inst}`).join('\n')
          }
        }],
      },
      SourceURL: {
        url: data.sourceUrl || null,
      },
      SourceType: {
        select: data.sourceType ? { name: data.sourceType } : null,
      },
      Ingredients: {
        relation: data.ingredients.map(ing => ({ id: ing.ingredientId })),
      },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  });

  return transformToRecipe(response);
}

// Update recipe
export async function updateRecipe(id: string, data: Partial<RecipeFormData>): Promise<Recipe> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const properties: any = {};

  if (data.title !== undefined) {
    properties.Name = { title: [{ text: { content: data.title } }] };
  }
  if (data.description !== undefined) {
    properties.Description = { rich_text: [{ text: { content: data.description } }] };
  }
  if (data.imageUrl !== undefined) {
    properties.ImageURL = { url: data.imageUrl || null };
  }
  if (data.category !== undefined) {
    properties.Category = { select: data.category ? { name: data.category } : null };
  }
  if (data.tags !== undefined) {
    properties.Tags = { multi_select: data.tags.map(tag => ({ name: tag })) };
  }
  if (data.servings !== undefined) {
    properties.Servings = { number: data.servings };
  }
  if (data.prepTime !== undefined) {
    properties.PrepTime = { number: data.prepTime };
  }
  if (data.cookTime !== undefined) {
    properties.CookTime = { number: data.cookTime };
  }
  if (data.instructions !== undefined) {
    properties.Instructions = {
      rich_text: [{
        text: {
          content: data.instructions.map((inst, i) => `${i + 1}. ${inst}`).join('\n')
        }
      }],
    };
  }
  if (data.sourceUrl !== undefined) {
    properties.SourceURL = { url: data.sourceUrl || null };
  }
  if (data.sourceType !== undefined) {
    properties.SourceType = { select: data.sourceType ? { name: data.sourceType } : null };
  }
  if (data.ingredients !== undefined) {
    properties.Ingredients = { relation: data.ingredients.map(ing => ({ id: ing.ingredientId })) };
  }

  const response = await notion.pages.update({
    page_id: id,
    properties,
  });

  return transformToRecipe(response);
}

// Delete recipe (archive in Notion)
export async function deleteRecipe(id: string): Promise<void> {
  await notion.pages.update({
    page_id: id,
    archived: true,
  });
}

// Get all ingredients
export async function getIngredients(): Promise<Ingredient[]> {
  const response = await queryDatabaseDirect(INGREDIENTS_DB_ID, {
    sorts: [{ property: 'Name', direction: 'ascending' }],
  });

  return response.results.map((page: unknown) => transformToIngredient(page));
}

// Get single ingredient by ID
export async function getIngredientById(id: string): Promise<Ingredient | null> {
  try {
    const page = await notion.pages.retrieve({ page_id: id });
    return transformToIngredient(page);
  } catch {
    return null;
  }
}

// Create new ingredient
export async function createIngredient(data: Omit<Ingredient, 'id'>): Promise<Ingredient> {
  const response = await notion.pages.create({
    parent: { database_id: INGREDIENTS_DB_ID },
    properties: {
      Name: {
        title: [{ text: { content: data.name } }],
      },
      Category: {
        select: data.category ? { name: data.category } : null,
      },
      Unit: {
        select: data.unit ? { name: data.unit } : null,
      },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  });

  return transformToIngredient(response);
}

// Get recipes by ingredient IDs
export async function getRecipesByIngredients(ingredientIds: string[]): Promise<Recipe[]> {
  if (ingredientIds.length === 0) return getRecipes();

  const filterConditions = ingredientIds.map(id => ({
    property: 'Ingredients',
    relation: { contains: id },
  }));

  const response = await queryDatabaseDirect(RECIPES_DB_ID, {
    filter: { or: filterConditions },
    sorts: [{ timestamp: 'created_time', direction: 'descending' }],
  });

  const ingredients = await getIngredients();
  const ingredientMap = new Map(ingredients.map(i => [i.id, i]));

  return response.results.map((page: unknown) => transformToRecipe(page, ingredientMap));
}

// Get unique categories from recipes
export async function getCategories(): Promise<string[]> {
  const response = await notion.databases.retrieve({
    database_id: RECIPES_DB_ID,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categoryProperty = (response as any).properties?.Category;
  if (categoryProperty?.select?.options) {
    return categoryProperty.select.options.map((opt: { name: string }) => opt.name);
  }

  return [];
}

// Get unique tags from recipes
export async function getTags(): Promise<string[]> {
  const response = await notion.databases.retrieve({
    database_id: RECIPES_DB_ID,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tagsProperty = (response as any).properties?.Tags;
  if (tagsProperty?.multi_select?.options) {
    return tagsProperty.multi_select.options.map((opt: { name: string }) => opt.name);
  }

  return [];
}
