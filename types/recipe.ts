export type Recipe = {
  id: string;
  title: string;
  description: string | null;
  difficulty_level: string | null;
  created_at: string;
  updated_at: string;
  is_published: boolean;
  featured_image_url: string | null;
};

export type IngredientCategory = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  created_at: string;
  updated_at?: string;
};

export type Ingredient = {
  id: string;
  name: string;
  icon: string | null;
  category_id: string | null;
  created_at: string;
  ingredient_category?: IngredientCategory;
};

export type RecipeIngredientUsage = {
  id: string;
  recipe_id: string;
  ingredient_id: string;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
  order: number | null;
  ingredient?: Ingredient;
};

export type RecipeIngredient = {
  id: string;
  recipe_id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
  icon: string | null;
};

export type RecipeStep = {
  id: string;
  recipe_id: string;
  step_number: number;
  instruction: string;
  image_url: string | null;
  step_type: 'preparation' | 'cooking' | 'final';
};

export type RecipeCategory = {
  id: string;
  name: string;
  description: string | null;
};

export type RecipeCategoryMapping = {
  recipe_id: string;
  category_id: string;
};

export type RecipeWithDetails = Recipe & {
  ingredients: RecipeIngredientUsage[];
  steps: RecipeStep[];
  categories: RecipeCategory[];
}; 