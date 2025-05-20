import Image from 'next/image';
import Link from 'next/link';
import { Recipe } from '@/types/recipe';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Link href={`/recipes/${recipe.id}`}>
      <Card className="overflow-hidden h-full transition-all hover:shadow-lg hover:scale-105 duration-300">
        <div className="relative h-48 w-full overflow-hidden">
          {recipe.featured_image_url ? (
            <Image
              src={recipe.featured_image_url}
              alt={recipe.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <span className="text-gray-400">无图片</span>
            </div>
          )}
        </div>
        <CardContent className="pt-4 px-4">
          <h3 className="text-xl font-semibold line-clamp-1">{recipe.title}</h3>
          {recipe.description && (
            <p className="text-gray-500 mt-2 text-sm line-clamp-2">
              {recipe.description}
            </p>
          )}
        </CardContent>
        <CardFooter className="px-4 py-3 flex justify-between items-center border-t">
          <div className="text-xs text-gray-500">
            {recipe.difficulty_level || '难度未知'}
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>查看详情</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
} 