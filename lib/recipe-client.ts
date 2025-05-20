import { createClient } from '@/utils/supabase/client';
import { Ingredient } from '@/types/recipe';

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