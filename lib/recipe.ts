import { createClient } from '@/utils/supabase/server';
import { 
  Recipe, 
  RecipeIngredient,
  RecipeStep,
  RecipeCategory,
  RecipeWithDetails,
  Ingredient,
  RecipeIngredientUsage
} from '@/types/recipe';

// 获取所有已发布的菜谱
export async function getPublishedRecipes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching published recipes:', error);
    return [];
  }

  return data as Recipe[];
}

// 获取菜谱详情（包括配料、步骤和分类）
export async function getRecipeById(id: string): Promise<RecipeWithDetails | null> {
  const supabase = await createClient();
  
  // 获取菜谱基本信息
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single();

  if (recipeError || !recipe) {
    console.error('Error fetching recipe:', recipeError);
    return null;
  }

  // 获取菜谱配料（使用JOIN查询获取配料详情）
  const { data: ingredients, error: ingredientsError } = await supabase
    .from('recipe_ingredient_usage')
    .select(`
      *,
      ingredient:ingredient_id(*)
    `)
    .eq('recipe_id', id)
    .order('order');

  if (ingredientsError) {
    console.error('Error fetching ingredients:', ingredientsError);
    return null;
  }

  // 获取菜谱步骤
  const { data: steps, error: stepsError } = await supabase
    .from('recipe_steps')
    .select('*')
    .eq('recipe_id', id)
    .order('step_number');

  if (stepsError) {
    console.error('Error fetching steps:', stepsError);
    return null;
  }

  // 获取菜谱分类
  const { data: categoryMappings, error: categoriesError } = await supabase
    .from('recipe_category_mappings')
    .select('category_id')
    .eq('recipe_id', id);

  if (categoriesError) {
    console.error('Error fetching category mappings:', categoriesError);
    return null;
  }

  // 如果有分类映射，获取分类详情
  let categories: RecipeCategory[] = [];
  if (categoryMappings && categoryMappings.length > 0) {
    const categoryIds = categoryMappings.map(mapping => mapping.category_id);
    const { data: categoriesData, error: categoriesDetailError } = await supabase
      .from('recipe_categories')
      .select('*')
      .in('id', categoryIds);

    if (categoriesDetailError) {
      console.error('Error fetching categories details:', categoriesDetailError);
    } else {
      categories = categoriesData;
    }
  }

  return {
    ...recipe as Recipe,
    ingredients: ingredients as RecipeIngredientUsage[],
    steps: steps as RecipeStep[],
    categories: categories
  };
}

// 获取所有菜谱（用于管理界面）
export async function getAllRecipes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all recipes:', error);
    return [];
  }

  return data as Recipe[];
}

// 创建新菜谱
export async function createRecipe(
  recipe: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('recipes')
    .insert(recipe)
    .select()
    .single();

  if (error) {
    console.error('Error creating recipe:', error);
    return null;
  }

  return data as Recipe;
}

// 更新菜谱
export async function updateRecipe(
  id: string,
  recipe: Partial<Recipe>
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('recipes')
    .update(recipe)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating recipe:', error);
    return null;
  }

  return data as Recipe;
}

// 删除菜谱
export async function deleteRecipe(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting recipe:', error);
    return false;
  }

  return true;
}

// 添加配料使用
export async function addIngredientUsage(usage: Omit<RecipeIngredientUsage, 'id'>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('recipe_ingredient_usage')
    .insert(usage)
    .select();

  if (error) {
    console.error('Error adding ingredient usage:', error);
    return null;
  }

  return data[0] as RecipeIngredientUsage;
}

// 获取所有配料
export async function getAllIngredients() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching ingredients:', error);
    return [];
  }

  return data as Ingredient[];
}

// 创建配料
export async function createIngredient(ingredient: Omit<Ingredient, 'id' | 'created_at'>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('ingredients')
    .insert(ingredient)
    .select()
    .single();

  if (error) {
    console.error('Error creating ingredient:', error);
    return null;
  }

  return data as Ingredient;
}

// 搜索配料
export async function searchIngredients(query: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(10);

  if (error) {
    console.error('Error searching ingredients:', error);
    return [];
  }

  return data as Ingredient[];
}

// 添加步骤
export async function addStep(step: Omit<RecipeStep, 'id'>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('recipe_steps')
    .insert(step)
    .select();

  if (error) {
    console.error('Error adding step:', error);
    return null;
  }

  return data[0] as RecipeStep;
}

// 获取所有分类
export async function getAllCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('recipe_categories')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return data as RecipeCategory[];
}

// 添加分类
export async function addCategory(category: Omit<RecipeCategory, 'id'>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('recipe_categories')
    .insert(category)
    .select();

  if (error) {
    console.error('Error adding category:', error);
    return null;
  }

  return data[0] as RecipeCategory;
}

// 将菜谱添加到分类中
export async function addRecipeToCategory(recipeId: string, categoryId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('recipe_category_mappings')
    .insert({
      recipe_id: recipeId,
      category_id: categoryId
    });

  if (error) {
    console.error('Error adding recipe to category:', error);
    return false;
  }

  return true;
}

// 上传图片到存储桶
export async function uploadRecipeImage(file: File) {
  const supabase = await createClient();
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = `recipes/${fileName}`;

  const { data, error } = await supabase
    .storage
    .from('recipe-images')
    .upload(filePath, file);

  if (error) {
    console.error('Error uploading recipe image:', error);
    return null;
  }

  // 获取公共URL
  const { data: { publicUrl } } = supabase
    .storage
    .from('recipe-images')
    .getPublicUrl(filePath);

  return publicUrl;
} 