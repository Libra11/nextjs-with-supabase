import { createClient } from '@/utils/supabase/client';
import { Ingredient, RecipeCategory, IngredientCategory, RecipeWithDetails } from '@/types/recipe';

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

// 从JSON导入菜谱
export async function importRecipeFromJson(recipeData: RecipeWithDetails) {
  const supabase = createClient();
  try {
    // 1. 创建菜谱基本信息
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        title: recipeData.title,
        description: recipeData.description,
        difficulty_level: recipeData.difficulty_level,
        is_published: recipeData.is_published || false,
        featured_image_url: recipeData.featured_image_url,
      })
      .select()
      .single();

    if (recipeError || !recipe) {
      console.error('Error creating recipe:', recipeError);
      throw new Error(`创建菜谱失败: ${recipeError?.message || '未知错误'}`);
    }

    const recipeId = recipe.id;

    // 2. 添加分类
    if (recipeData.categories && recipeData.categories.length > 0) {
      const mappings = recipeData.categories.map(category => ({
        recipe_id: recipeId,
        category_id: category.id,
      }));

      const { error: categoryError } = await supabase
        .from('recipe_category_mappings')
        .insert(mappings);

      if (categoryError) {
        console.error('Error adding categories:', categoryError);
        // 继续执行，即使分类添加失败
      }
    }

    // 3. 添加配料
    if (recipeData.ingredients && recipeData.ingredients.length > 0) {
      const ingredientUsages = recipeData.ingredients.map((ingredient, index) => ({
        recipe_id: recipeId,
        ingredient_id: ingredient.ingredient_id,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        notes: ingredient.notes,
        order: index + 1,
      }));

      const { error: ingredientsError } = await supabase
        .from('recipe_ingredient_usage')
        .insert(ingredientUsages);

      if (ingredientsError) {
        console.error('Error adding ingredients:', ingredientsError);
        throw new Error(`添加配料失败: ${ingredientsError.message}`);
      }
    }

    // 4. 添加步骤
    if (recipeData.steps && recipeData.steps.length > 0) {
      const recipeSteps = recipeData.steps.map(step => ({
        recipe_id: recipeId,
        step_number: step.step_number,
        instruction: step.instruction,
        image_url: step.image_url,
        step_type: step.step_type || 'cooking',
      }));

      const { error: stepsError } = await supabase
        .from('recipe_steps')
        .insert(recipeSteps);

      if (stepsError) {
        console.error('Error adding steps:', stepsError);
        throw new Error(`添加步骤失败: ${stepsError.message}`);
      }
    }

    return {
      success: true,
      message: '菜谱导入成功',
      recipeId: recipeId
    };
  } catch (error: any) {
    console.error('Error importing recipe:', error);
    return {
      success: false,
      message: error.message || '导入菜谱失败',
      error
    };
  }
} 