/**
 * Author: Libra
 * Date: 2025-05-20 14:19:13
 * LastEditors: Libra
 * Description:
 */
import {
  getPublishedRecipes,
  getAllCategories,
  getRecipeById,
} from "@/lib/recipe";
import { RecipeCard } from "@/components/ui/recipe-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { RecipeWithDetails } from "@/types/recipe";

export const revalidate = 3600; // 1小时重新验证一次

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  // 获取分类ID（如果有）
  const categoryId = (await searchParams).category;

  // 获取所有分类
  const categories = await getAllCategories();

  // 获取菜谱
  const recipes = await getPublishedRecipes();

  // 为每个菜谱获取完整详情（包括分类信息）
  const recipesWithDetails: RecipeWithDetails[] = await Promise.all(
    recipes.map(async (recipe) => {
      const details = await getRecipeById(recipe.id);
      return (
        details || {
          ...recipe,
          ingredients: [],
          steps: [],
          categories: [],
        }
      );
    })
  );

  // 根据分类筛选菜谱
  const filteredRecipes = categoryId
    ? recipesWithDetails.filter((recipe) =>
        recipe.categories?.some((cat) => cat.id === categoryId)
      )
    : recipesWithDetails;

  // 过滤掉获取失败的菜谱
  const validRecipes = filteredRecipes.filter(
    (recipe) => recipe !== null
  ) as RecipeWithDetails[];

  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-8 md:py-12 px-0 md:px-6">
        <div className="mb-8">
          <h1 className="title-gradient">美食菜谱</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            发现美食，享受烹饪乐趣。探索我们精选的菜谱，让每一餐都成为独特体验。
          </p>
        </div>

        {/* 分类筛选 */}
        {categories.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <Link href="/recipes">
              <Button
                variant={!categoryId ? "default" : "outline"}
                size="sm"
                className="rounded-full"
              >
                全部
              </Button>
            </Link>

            {categories.map((category) => (
              <Link key={category.id} href={`/recipes?category=${category.id}`}>
                <Button
                  variant={categoryId === category.id ? "default" : "outline"}
                  size="sm"
                  className="rounded-full"
                >
                  {category.name}
                </Button>
              </Link>
            ))}
          </div>
        )}

        {validRecipes.length === 0 ? (
          <div className="text-center py-20">
            <div className="mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mx-auto text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <p className="text-xl font-medium text-gray-500 mb-2">
              {categoryId ? "该分类下暂无菜谱" : "暂无菜谱"}
            </p>
            <p className="text-gray-400">我们的厨师正在精心准备，敬请期待...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {validRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="transform hover:-translate-y-1 transition-all duration-300"
                >
                  <RecipeCard recipe={recipe} />
                </div>
              ))}
            </div>

            {validRecipes.length > 9 && (
              <div className="mt-16 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  显示 {validRecipes.length} 个菜谱中的{" "}
                  {Math.min(validRecipes.length, 9)} 个
                </p>
                <button className="inline-flex items-center px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium bg-background hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                  加载更多菜谱
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
