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
  
  // 从ingredients表中提取唯一的category值
  const { data, error } = await supabase
    .from('ingredients')
    .select('category')
    .not('category', 'is', null)
    .order('category');

  if (error) {
    console.error('Error fetching ingredient categories:', error);
    return [];
  }

  // 去重并转换为IngredientCategory格式
  const uniqueCategories = Array.from(new Set(data.map(item => item.category)))
    .filter(Boolean) // 过滤掉null和空字符串
    .map(category => ({
      id: category, // 使用category名称作为id
      name: category,
      description: null,
      icon: null,
      created_at: new Date().toISOString()
    }));

  return uniqueCategories as IngredientCategory[];
}

// 创建新的调料分类（实际上是创建一个具有该分类的新配料）
export async function createIngredientCategory(categoryData: { name: string; description: string | null; icon: string | null }) {
  // 为新分类创建一个示例配料
  const supabase = createClient();
  const { data, error } = await supabase
    .from('ingredients')
    .insert({
      name: `${categoryData.name} 分类示例`,
      category: categoryData.name,
      icon: categoryData.icon,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating ingredient category:', error);
    return null;
  }
  
  // 返回分类对象
  return {
    id: categoryData.name,
    name: categoryData.name,
    description: categoryData.description,
    icon: categoryData.icon,
    created_at: new Date().toISOString()
  } as IngredientCategory;
}

// 更新调料分类（批量更新该分类下的所有配料）
export async function updateIngredientCategory(oldCategoryName: string, categoryData: { name: string; description?: string | null; icon?: string | null }) {
  const supabase = createClient();
  
  // 更新所有使用此分类的配料
  const { data, error } = await supabase
    .from('ingredients')
    .update({ category: categoryData.name })
    .eq('category', oldCategoryName);

  if (error) {
    console.error('Error updating ingredient category:', error);
    return null;
  }

  return {
    id: categoryData.name,
    name: categoryData.name,
    description: categoryData.description || null,
    icon: categoryData.icon || null,
    created_at: new Date().toISOString()
  } as IngredientCategory;
}

// 删除调料分类（将该分类下所有配料的分类设为null）
export async function deleteIngredientCategory(categoryName: string) {
  const supabase = createClient();
  
  // 将所有使用此分类的配料的category字段设为null
  const { error } = await supabase
    .from('ingredients')
    .update({ category: null })
    .eq('category', categoryName);
    
  if (error) {
    console.error('Error deleting ingredient category:', error);
    return false;
  }
  
  return true;
}

// 获取某个分类下的所有配料
export async function getIngredientsByCategory(categoryName: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .eq('category', categoryName)
    .order('name');
    
  if (error) {
    console.error('Error fetching ingredients by category:', error);
    return [];
  }
  
  return data as Ingredient[];
} 