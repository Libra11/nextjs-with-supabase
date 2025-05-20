import { getPublishedRecipes } from '@/lib/recipe';
import { RecipeCard } from '@/components/ui/recipe-card';

export const revalidate = 3600; // 1小时重新验证一次

export default async function RecipesPage() {
  const recipes = await getPublishedRecipes();

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <h1 className="text-4xl font-bold text-center mb-12">美食菜谱</h1>
      
      {recipes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">暂无菜谱，敬请期待...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
} 