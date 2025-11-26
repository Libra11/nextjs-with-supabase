/**
 * Description: 菜谱卡片组件，参考博客卡片风格
 */
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Recipe, RecipeWithDetails } from '@/types/recipe';
import { Card } from '@/components/ui/card';
import { ChefHat, Clock, Utensils } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MagicCard } from '@/components/magicui/magic-card';
import { useTheme } from 'next-themes';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';

interface RecipeCardProps {
  recipe: RecipeWithDetails;
  className?: string;
  bgClassName?: string;
}

export function RecipeCard({ 
  recipe, 
  className = "", 
  bgClassName = "" 
}: RecipeCardProps) {
  // 解决hydration不匹配问题
  const [mounted, setMounted] = useState(false);
  const { theme, systemTheme } = useTheme();
  const [gradientColor, setGradientColor] = useState("transparent");
  
  useEffect(() => {
    setMounted(true);
    const currentTheme = theme === 'system' ? systemTheme : theme;
    setGradientColor(currentTheme === "dark" ? "#262626" : "#D9D9D955");
  }, [theme, systemTheme]);

  // 如果未挂载，渲染一个简单版本避免hydration错误
  if (!mounted) {
    return (
      <Link href={`/recipes/${recipe.id}`} className="block group">
        <div className={cn("rounded-xl bg-card h-full w-full overflow-hidden", className)}>
          <div className="flex flex-col p-3">
            <div className="relative w-full h-[180px] bg-muted rounded-lg"></div>
            <div className="px-1 py-2">
              <div className="text-base my-1 font-semibold line-clamp-1">
                {recipe.title}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 h-8">
                {recipe.description || "这是一道美味的菜谱，快来试试吧！"}
              </p>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  const mainCategory = recipe.categories?.[0]; // 获取第一个分类作为主要分类

  return (
    <Link href={`/recipes/${recipe.id}`} className="block group">
      <MagicCard
        gradientColor={gradientColor}
        backgroundClassName={cn(bgClassName, "bg-card")}
        className={cn("h-full w-full rounded-xl", className)}
      >
        <div className="flex flex-col p-3">
          <div className="relative w-full h-[180px]">
            {recipe.featured_image_url ? (
              <Image
                src={recipe.featured_image_url}
                alt={recipe.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                className="object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                <Utensils className="w-8 h-8 text-muted-foreground/50" />
              </div>
            )}
            
            {recipe.difficulty_level && (
              <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white px-2 py-0.5 rounded-md flex items-center gap-1">
                <ChefHat className="w-3 h-3" />
                <span className="text-xs">{recipe.difficulty_level}</span>
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="px-1 py-2">
              <div className="flex items-center gap-2">
                {mainCategory && (
                  <Badge variant="outline" className="px-2 py-0 h-5 text-[10px] bg-primary/10 hover:bg-primary/20">
                    {mainCategory.name}
                  </Badge>
                )}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-base my-1 font-semibold group-hover:text-primary transition-colors line-clamp-1">
                        {recipe.title}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{recipe.title}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 h-8">
                      {recipe.description || "这是一道美味的菜谱，快来试试吧！"}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{recipe.description || "这是一道美味的菜谱，快来试试吧！"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <div className="flex items-center gap-3 mt-2 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs">
                    {new Date(recipe.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short', 
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Utensils className="w-3 h-3" />
                  <span className="text-xs">{recipe.ingredients?.length || 0} 种材料</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MagicCard>
    </Link>
  );
} 