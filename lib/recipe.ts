import { createClient } from '@/utils/supabase/server';
import { 
  Recipe, 
  RecipeIngredient,
  RecipeStep,
  RecipeCategory,
  RecipeWithDetails,
  Ingredient,
  RecipeIngredientUsage,
  RecipeCategoryMapping,
  IngredientCategory
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

  // 获取菜谱配料（使用JOIN查询获取配料详情和配料分类）
  const { data: ingredients, error: ingredientsError } = await supabase
    .from('recipe_ingredient_usage')
    .select(`
      *,
      ingredient:ingredient_id(*, ingredient_category:category_id(*))
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

// 获取单个分类
export async function getCategoryById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('recipe_categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching category:', error);
    return null;
  }

  return data as RecipeCategory;
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

// 更新分类
export async function updateCategory(id: string, category: Partial<RecipeCategory>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('recipe_categories')
    .update(category)
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating category:', error);
    return null;
  }

  return data[0] as RecipeCategory;
}

// 删除分类
export async function deleteCategory(id: string) {
  const supabase = await createClient();
  
  // 首先删除所有关联的映射关系
  const { error: mappingError } = await supabase
    .from('recipe_category_mappings')
    .delete()
    .eq('category_id', id);
  
  if (mappingError) {
    console.error('Error deleting category mappings:', mappingError);
    return false;
  }
  
  // 然后删除分类本身
  const { error } = await supabase
    .from('recipe_categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting category:', error);
    return false;
  }

  return true;
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

// 从分类中移除菜谱
export async function removeRecipeFromCategory(recipeId: string, categoryId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('recipe_category_mappings')
    .delete()
    .eq('recipe_id', recipeId)
    .eq('category_id', categoryId);

  if (error) {
    console.error('Error removing recipe from category:', error);
    return false;
  }

  return true;
}

// 批量更新菜谱的分类
export async function updateRecipeCategories(recipeId: string, categoryIds: string[]) {
  const supabase = await createClient();
  
  // 首先删除所有现有的映射关系
  const { error: deleteError } = await supabase
    .from('recipe_category_mappings')
    .delete()
    .eq('recipe_id', recipeId);
    
  if (deleteError) {
    console.error('Error removing existing category mappings:', deleteError);
    return false;
  }
  
  // 如果没有要添加的分类，则提前返回成功
  if (categoryIds.length === 0) {
    return true;
  }
  
  // 创建新的映射记录
  const mappings: RecipeCategoryMapping[] = categoryIds.map(categoryId => ({
    recipe_id: recipeId,
    category_id: categoryId
  }));
  
  const { error: insertError } = await supabase
    .from('recipe_category_mappings')
    .insert(mappings);
    
  if (insertError) {
    console.error('Error adding new category mappings:', insertError);
    return false;
  }
  
  return true;
}

// 获取菜谱已分配的分类
export async function getRecipeCategories(recipeId: string) {
  const supabase = await createClient();
  const { data: mappings, error: mappingsError } = await supabase
    .from('recipe_category_mappings')
    .select('category_id')
    .eq('recipe_id', recipeId);
    
  if (mappingsError) {
    console.error('Error fetching recipe category mappings:', mappingsError);
    return [];
  }
  
  if (!mappings.length) {
    return [];
  }
  
  const categoryIds = mappings.map(m => m.category_id);
  
  const { data: categories, error: categoriesError } = await supabase
    .from('recipe_categories')
    .select('*')
    .in('id', categoryIds);
    
  if (categoriesError) {
    console.error('Error fetching recipe categories:', categoriesError);
    return [];
  }
  
  return categories as RecipeCategory[];
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

// 根据分类获取已发布的菜谱
export async function getPublishedRecipesByCategory(categoryId: string) {
  const supabase = await createClient();
  
  // 首先获取指定分类的菜谱ID
  const { data: mappings, error: mappingError } = await supabase
    .from('recipe_category_mappings')
    .select('recipe_id')
    .eq('category_id', categoryId);

  if (mappingError) {
    console.error('Error fetching recipe mappings by category:', mappingError);
    return [];
  }

  if (!mappings || mappings.length === 0) {
    return [];
  }

  // 从映射中获取菜谱ID列表
  const recipeIds = mappings.map(mapping => mapping.recipe_id);
  
  // 获取已发布的菜谱
  const { data: recipes, error: recipesError } = await supabase
    .from('recipes')
    .select('*')
    .in('id', recipeIds)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (recipesError) {
    console.error('Error fetching recipes by category:', recipesError);
    return [];
  }

  return recipes as Recipe[];
}

// =========== 调料分类函数 ===========

// 获取所有调料分类
export async function getAllIngredientCategories() {
  const supabase = await createClient();
  
  // 直接从ingredient_categories表查询
  const { data, error } = await supabase
    .from('ingredient_categories')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching ingredient categories:', error);
    return [];
  }

  return data as IngredientCategory[];
}

// 获取某个分类下的所有配料
export async function getIngredientsByCategory(categoryId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('ingredients')
    .select(`
      *,
      ingredient_category:category_id(*)
    `)
    .eq('category_id', categoryId)
    .order('name');

  if (error) {
    console.error('Error fetching ingredients by category:', error);
    return [];
  }

  return data as Ingredient[];
}

// 更新配料的分类
export async function updateIngredientCategory(id: string, newCategoryId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('ingredients')
    .update({ 
      category_id: newCategoryId,
    })
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating ingredient category:', error);
    return null;
  }

  return data[0] as Ingredient;
}

// 更新配料
export async function updateIngredient(id: string, ingredient: Partial<Ingredient>) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('ingredients')
    .update(ingredient)
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating ingredient:', error);
    return null;
  }

  return data[0] as Ingredient;
}

// 删除配料
export async function deleteIngredient(id: string) {
  const supabase = await createClient();
  
  // 首先检查是否有关联的使用记录
  const { data: usageData, error: usageError } = await supabase
    .from('recipe_ingredient_usage')
    .select('id')
    .eq('ingredient_id', id)
    .limit(1);
    
  if (usageError) {
    console.error('Error checking ingredient usage:', usageError);
    return false;
  }
  
  // 如果有关联的使用记录，不允许删除
  if (usageData && usageData.length > 0) {
    console.error('Cannot delete ingredient that is in use');
    return false;
  }
  
  // 删除配料
  const { error } = await supabase
    .from('ingredients')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting ingredient:', error);
    return false;
  }

  return true;
} 