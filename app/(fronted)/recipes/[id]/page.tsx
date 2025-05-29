/**
 * Author: Libra
 * Date: 2025-05-20 14:20:07
 * LastEditors: Libra
 * Description:
 */
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecipeById } from "@/lib/recipe";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, ChefHat, Utensils, ArrowLeft } from "lucide-react";
import { RecipeTabs } from "./components/recipe-tabs";
import { ActionButtons, SaveRecipeButton } from "./components/recipe-actions";
import { ImageViewer } from "./components/image-viewer";

export const revalidate = 3600; // 每小时重新验证一次

interface RecipeDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RecipeDetailPage({
  params,
}: RecipeDetailPageProps) {
  const { id } = await params;
  const recipe = await getRecipeById(id);

  if (!recipe || !recipe.is_published) {
    notFound();
  }

  // 处理步骤图片，将分隔符分隔的URL字符串拆分成数组
  const stepsWithImageArrays = recipe.steps
    .map((step) => {
      const imageUrls = step.image_url
        ? step.image_url.split("||").filter((url) => !!url)
        : [];
      return {
        ...step,
        imageUrls,
      };
    })
    .sort((a, b) => a.step_number - b.step_number);

  // 计算步骤分类
  const preparationSteps = stepsWithImageArrays.filter(
    (step) => step.step_type === "preparation"
  );
  const cookingSteps = stepsWithImageArrays.filter(
    (step) => step.step_type === "cooking"
  );
  const finalSteps = stepsWithImageArrays.filter(
    (step) => step.step_type === "final"
  );

  // 对配料进行分类
  const ingredientsByCategory = recipe.ingredients.reduce(
    (grouped, ingredient) => {
      const categoryId = ingredient.ingredient?.category_id || "uncategorized";
      const categoryName =
        ingredient.ingredient?.ingredient_category?.name || "未分类";

      if (!grouped[categoryId]) {
        grouped[categoryId] = {
          id: categoryId,
          name: categoryName,
          icon: ingredient.ingredient?.ingredient_category?.icon || null,
          ingredients: [],
        };
      }

      grouped[categoryId].ingredients.push(ingredient);
      return grouped;
    },
    {} as Record<
      string,
      {
        id: string;
        name: string;
        icon: string | null;
        ingredients: typeof recipe.ingredients;
      }
    >
  );

  // 转换为数组并按名称排序
  const sortedCategories = Object.values(ingredientsByCategory).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div className="min-h-screen pb-8 bg-muted/20">
      {/* 返回栏 - 固定在顶部 */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/40 py-2">
        <div className="container px-3 sm:px-4 flex items-center justify-between">
          <Link
            href="/recipes"
            className="flex items-center text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span className="text-sm">返回列表</span>
          </Link>
          <ActionButtons />
        </div>
      </div>

      {/* 英雄区域 */}
      <div className="relative">
        {recipe.featured_image_url ? (
          <div className="relative h-[35vh] sm:h-[40vh] md:h-[45vh] w-full">
            {/* 渐变叠加层 */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background z-10" />
            <Image
              src={recipe.featured_image_url}
              alt={recipe.title}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="h-24 sm:h-32 bg-gradient-to-r from-primary/10 to-secondary/10" />
        )}

        {/* 顶部信息浮动卡片 */}
        <div className="container px-3 sm:px-4 relative z-20 -mt-20">
          <Card className="p-4 sm:p-6 border shadow-md backdrop-blur-sm bg-card/95">
            {/* 分类标签 */}
            {recipe.categories && recipe.categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {recipe.categories.map((category) => (
                  <Badge
                    key={category.id}
                    variant="secondary"
                    className="text-xs rounded-full py-0.5"
                  >
                    {category.name}
                  </Badge>
                ))}
              </div>
            )}

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              {recipe.title}
            </h1>

            {recipe.description && (
              <p className="text-muted-foreground text-sm sm:text-base mb-4">
                {recipe.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-2">
              {recipe.difficulty_level && (
                <div className="flex items-center text-muted-foreground text-xs sm:text-sm">
                  <ChefHat className="h-4 w-4 mr-1 text-primary" />
                  <span>
                    难度:{" "}
                    <span className="font-medium text-foreground">
                      {recipe.difficulty_level}
                    </span>
                  </span>
                </div>
              )}
              <div className="flex items-center text-muted-foreground text-xs sm:text-sm">
                <Clock className="h-4 w-4 mr-1 text-primary" />
                <span>
                  发布于:{" "}
                  <span className="font-medium text-foreground">
                    {new Date(recipe.created_at).toLocaleDateString("zh-CN")}
                  </span>
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="container px-3 sm:px-4 mt-6 sm:mt-8">
        {/* 移动端 Tab 形式显示配料和步骤 */}
        <div className="md:hidden mb-6">
          <RecipeTabs
            ingredientsCount={recipe.ingredients.length}
            ingredients={recipe.ingredients}
            categorizedIngredients={sortedCategories}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* 配料部分 - 移动端隐藏，桌面端显示 */}
          <div className="hidden md:block md:col-span-1 space-y-6">
            <div className="bg-card rounded-lg border border-border p-4 md:p-5 shadow-sm sticky top-[3.5rem]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold flex items-center">
                  <Utensils className="h-4 w-4 mr-1.5 text-primary" />
                  <span>配料清单</span>
                </h2>
                <Badge variant="outline" className="text-xs rounded-full">
                  {recipe.ingredients.length}项
                </Badge>
              </div>
              <Separator className="mb-3" />

              <div className="max-h-[calc(100vh-15rem)] overflow-y-auto pr-1">
                {sortedCategories.map((category) => (
                  <div key={category.id} className="mb-4">
                    <div className="flex items-center bg-muted/50 rounded-md py-1.5 px-2 mb-2">
                      {category.icon && (
                        <img
                          src={category.icon}
                          alt=""
                          className="w-4 h-4 mr-1.5"
                        />
                      )}
                      <h3 className="text-xs font-medium">{category.name}</h3>
                      <Badge
                        variant="outline"
                        className="ml-2 text-[10px] rounded-full h-4 px-1.5"
                      >
                        {category.ingredients.length}
                      </Badge>
                    </div>

                    <ul className="space-y-2">
                      {category.ingredients.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center p-1.5 rounded-md hover:bg-accent/10 transition-colors"
                        >
                          <div className="flex-shrink-0 bg-background shadow-sm rounded-full p-1 mr-2 border border-border">
                            {item.ingredient?.icon ? (
                              <img
                                src={item.ingredient.icon}
                                alt=""
                                className="w-5 h-5"
                              />
                            ) : (
                              <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-[9px] text-primary">
                                  配料
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-grow min-w-0">
                            <span className="font-medium text-xs block truncate">
                              {item.ingredient?.name}
                            </span>
                            {(item.quantity || item.unit) && (
                              <span className="text-xs text-muted-foreground block truncate">
                                {item.quantity} {item.unit}
                              </span>
                            )}
                          </div>
                          {item.notes && (
                            <div
                              className="ml-1 text-[10px] text-muted-foreground italic max-w-[80px] truncate"
                              title={item.notes}
                            >
                              {item.notes}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <SaveRecipeButton />
            </div>
          </div>

          {/* 右侧主要内容 - 步骤说明 */}
          <div className="md:col-span-2">
            <div className="space-y-8">
              {/* 菜谱介绍卡片 */}
              <Card className="overflow-hidden border-border/60 shadow-sm">
                <div className="bg-gradient-to-r from-primary/20 to-primary/5 px-4 py-3 border-b">
                  <h2 className="text-base sm:text-lg font-semibold">
                    步骤指南
                  </h2>
                </div>
                <div className="p-4">
                  <p className="text-muted-foreground text-sm">
                    按照以下步骤制作{recipe.title}。制作过程分为
                    {preparationSteps.length > 0 ? "准备、" : ""}
                    {cookingSteps.length > 0 ? "烹饪" : ""}
                    {finalSteps.length > 0 ? "和完成" : ""}阶段。
                  </p>
                </div>
              </Card>

              {/* 准备步骤 */}
              {preparationSteps.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                      <span className="font-semibold text-primary text-sm">
                        1
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold">准备工作</h3>
                  </div>

                  <div className="space-y-4">
                    {preparationSteps.map((step, index) => (
                      <Card
                        key={step.id}
                        className="overflow-hidden border-border/60 hover:shadow-sm transition-shadow"
                      >
                        <div className="bg-muted/50 border-b border-border/60 p-2.5 flex items-center">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                            <span className="text-xs font-medium text-primary">
                              {step.step_number}
                            </span>
                          </div>
                          <h4 className="font-medium text-sm">准备步骤</h4>
                        </div>

                        <div className="p-4">
                          <p className="text-card-foreground text-sm">
                            {step.instruction}
                          </p>

                          {step.imageUrls && step.imageUrls.length > 0 && (
                            <div className="grid grid-cols-2 xs:grid-cols-2 gap-2 mt-3 relative">
                              {step.imageUrls.map((imageUrl, imgIndex) => (
                                <ImageViewer
                                  key={imgIndex}
                                  imageUrl={imageUrl}
                                  alt={`步骤 ${step.step_number} 图片 ${imgIndex + 1}`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* 烹饪步骤 */}
              {cookingSteps.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                      <span className="font-semibold text-primary text-sm">
                        {preparationSteps.length > 0 ? "2" : "1"}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold">烹饪过程</h3>
                  </div>

                  <div className="space-y-4">
                    {cookingSteps.map((step, index) => (
                      <Card
                        key={step.id}
                        className="overflow-hidden border-border/60 hover:shadow-sm transition-shadow"
                      >
                        <div className="bg-primary/10 border-b border-border/60 p-2.5 flex items-center">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                            <span className="text-xs font-medium text-primary">
                              {step.step_number}
                            </span>
                          </div>
                          <h4 className="font-medium text-sm">烹饪步骤</h4>
                        </div>

                        <div className="p-4">
                          <p className="text-card-foreground text-sm">
                            {step.instruction}
                          </p>

                          {step.imageUrls && step.imageUrls.length > 0 && (
                            <div className="grid grid-cols-2 xs:grid-cols-2 gap-2 mt-3 relative">
                              {step.imageUrls.map((imageUrl, imgIndex) => (
                                <ImageViewer
                                  key={imgIndex}
                                  imageUrl={imageUrl}
                                  alt={`步骤 ${step.step_number} 图片 ${imgIndex + 1}`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* 完成步骤 */}
              {finalSteps.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                      <span className="font-semibold text-primary text-sm">
                        {(preparationSteps.length > 0 ? 1 : 0) +
                          (cookingSteps.length > 0 ? 1 : 0) +
                          1}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold">完成步骤</h3>
                  </div>

                  <div className="space-y-4">
                    {finalSteps.map((step, index) => (
                      <Card
                        key={step.id}
                        className="overflow-hidden border-border/60 hover:shadow-sm transition-shadow"
                      >
                        <div className="bg-green-50 dark:bg-green-950/20 border-b border-border/60 p-2.5 flex items-center">
                          <div className="w-6 h-6 rounded-full bg-green-200 dark:bg-green-800/30 flex items-center justify-center mr-2">
                            <span className="text-xs font-medium text-green-700 dark:text-green-400">
                              {step.step_number}
                            </span>
                          </div>
                          <h4 className="font-medium text-sm">成品步骤</h4>
                        </div>

                        <div className="p-4">
                          <p className="text-card-foreground text-sm">
                            {step.instruction}
                          </p>

                          {step.imageUrls && step.imageUrls.length > 0 && (
                            <div className="grid grid-cols-2 xs:grid-cols-2 gap-2 mt-3 relative">
                              {step.imageUrls.map((imageUrl, imgIndex) => (
                                <ImageViewer
                                  key={imgIndex}
                                  imageUrl={imageUrl}
                                  alt={`步骤 ${step.step_number} 图片 ${imgIndex + 1}`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* 完成提示 */}
              <Card className="p-4 bg-gradient-to-r from-green-50/70 to-blue-50/70 dark:from-green-950/20 dark:to-blue-950/20 border-green-100 dark:border-green-900/30">
                <div className="flex items-center">
                  <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-1.5 mr-3">
                    <ChefHat className="h-5 w-5 text-green-700 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium mb-0.5">恭喜完成!</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm">
                      享用您的美味{recipe.title}吧！
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
