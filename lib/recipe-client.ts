import { createClient } from '@/utils/supabase/client';
import { Ingredient, RecipeCategory, IngredientCategory } from '@/types/recipe';

// 创建配料
export async function createIngredient(ingredient: Omit<Ingredient, 'id' | 'created_at'>) {
  const supabase = createClient();
  
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

// 更新配料
export async function updateIngredient(id: string, ingredient: Partial<Ingredient>) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('ingredients')
    .update(ingredient)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating ingredient:', error);
    return null;
  }

  return data as Ingredient;
}

// 删除配料
export async function deleteIngredient(id: string) {
  const supabase = createClient();
  
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

// 搜索配料
export async function searchIngredients(query: string) {
  const supabase = createClient();
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

// 获取所有分类
export async function getAllCategories() {
  const supabase = createClient();
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

// 创建分类
export async function createCategory(category: Omit<RecipeCategory, 'id'>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('recipe_categories')
    .insert(category)
    .select()
    .single();

  if (error) {
    console.error('Error creating category:', error);
    return null;
  }

  return data as RecipeCategory;
}

// 更新分类
export async function updateCategory(id: string, category: Partial<RecipeCategory>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('recipe_categories')
    .update(category)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating category:', error);
    return null;
  }

  return data as RecipeCategory;
}

// 删除分类
export async function deleteCategory(id: string) {
  const supabase = createClient();
  
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

// 获取菜谱的所有分类
export async function getRecipeCategories(recipeId: string) {
  const supabase = createClient();
  const { data: mappings, error: mappingsError } = await supabase
    .from('recipe_category_mappings')
    .select('category_id')
    .eq('recipe_id', recipeId);
    
  if (mappingsError) {
    console.error('Error fetching recipe category mappings:', mappingsError);
    return [];
  }
  
  if (!mappings || mappings.length === 0) {
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

// 获取所有调料分类
export async function getAllIngredientCategories() {
  const supabase = createClient();
  
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

// 创建新的调料分类
export async function createIngredientCategory(categoryData: { name: string; description: string | null; icon: string | null }) {
  const supabase = createClient();
  
  // 直接向ingredient_categories表插入数据
  const { data, error } = await supabase
    .from('ingredient_categories')
    .insert({
      name: categoryData.name,
      description: categoryData.description,
      icon: categoryData.icon
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating ingredient category:', error);
    return null;
  }
  
  return data as IngredientCategory;
}

// 更新调料分类
export async function updateIngredientCategory(categoryId: string, categoryData: { name: string; description?: string | null; icon?: string | null }) {
  const supabase = createClient();
  
  // 直接更新ingredient_categories表中的记录
  const { data, error } = await supabase
    .from('ingredient_categories')
    .update({
      name: categoryData.name,
      description: categoryData.description,
      icon: categoryData.icon,
      updated_at: new Date().toISOString()
    })
    .eq('id', categoryId)
    .select()
    .single();

  if (error) {
    console.error('Error updating ingredient category:', error);
    return null;
  }

  // 同时更新所有使用该分类的配料的category_id
  const { error: updateIngredientsError } = await supabase
    .from('ingredients')
    .update({ category_id: categoryId })
    .eq('category_id', categoryId);
    
  if (updateIngredientsError) {
    console.error('Error updating ingredients category_id:', updateIngredientsError);
  }

  return data as IngredientCategory;
}

// 删除调料分类
export async function deleteIngredientCategory(categoryId: string) {
  const supabase = createClient();
  
  // 首先将使用该分类的配料的category_id设为null
  const { error: updateIngredientsError } = await supabase
    .from('ingredients')
    .update({ category_id: null })
    .eq('category_id', categoryId);
    
  if (updateIngredientsError) {
    console.error('Error clearing ingredients category_id:', updateIngredientsError);
  }
  
  // 然后从ingredient_categories表中删除该分类
  const { error } = await supabase
    .from('ingredient_categories')
    .delete()
    .eq('id', categoryId);
    
  if (error) {
    console.error('Error deleting ingredient category:', error);
    return false;
  }
  
  return true;
}

// 获取某个分类下的所有配料
export async function getIngredientsByCategory(categoryId: string) {
  const supabase = createClient();
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