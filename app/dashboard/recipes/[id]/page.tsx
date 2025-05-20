import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getRecipeById } from '@/lib/recipe';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface RecipeDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const { id } = await params;
  const recipe = await getRecipeById(id);
  console.log(recipe);

  if (!recipe) {
    notFound();
  }

  // 获取步骤，按步骤号排序
  const sortedSteps = [...recipe.steps].sort((a, b) => a.step_number - b.step_number);

  return (
    <div className="py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{recipe.title}</h1>
        <div className="flex gap-4">
          <Link href={`/dashboard/recipes/${recipe.id}/edit`}>
            <Button variant="outline">编辑菜谱</Button>
          </Link>
          <Link href={`/recipes/${recipe.id}`} target="_blank">
            <Button>查看前台页面</Button>
          </Link>
        </div>
      </div>

      {/* 菜谱信息卡片 */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">基本信息</h2>
              <dl className="space-y-2">
                <div className="flex">
                  <dt className="w-24 font-medium">难度:</dt>
                  <dd>{recipe.difficulty_level || '未设置'}</dd>
                </div>
                <div className="flex">
                  <dt className="w-24 font-medium">发布状态:</dt>
                  <dd>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        recipe.is_published
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {recipe.is_published ? '已发布' : '草稿'}
                    </span>
                  </dd>
                </div>
                <div className="flex">
                  <dt className="w-24 font-medium">创建时间:</dt>
                  <dd>
                    {new Date(recipe.created_at).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </dd>
                </div>
                <div className="flex">
                  <dt className="w-24 font-medium">更新时间:</dt>
                  <dd>
                    {new Date(recipe.updated_at).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </dd>
                </div>
              </dl>
              
              {recipe.description && (
                <div className="mt-6">
                  <h3 className="font-medium mb-2">描述:</h3>
                  <p className="text-gray-600">{recipe.description}</p>
                </div>
              )}
            </div>

            {recipe.featured_image_url && (
              <div className="flex justify-center">
                <div className="relative h-64 w-full md:w-80 rounded-lg overflow-hidden">
                  <Image
                    src={recipe.featured_image_url}
                    alt={recipe.title}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 320px"
                    className="object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 配料部分 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">配料 ({recipe.ingredients.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recipe.ingredients.map((ingredient) => (
            <Card key={ingredient.id}>
              <CardContent className="p-4 flex items-center gap-3">
                {ingredient.ingredient?.icon && (
                  <div className="w-8 h-8 flex-shrink-0">
                    <Image
                      src={ingredient.ingredient.icon}
                      alt={ingredient.ingredient.name}
                      width={32}
                      height={32}
                    />
                  </div>
                )}
                <div>
                  <p className="font-medium">{ingredient.ingredient?.name}</p>
                  <div className="text-sm text-gray-500">
                    {(ingredient.quantity || ingredient.unit) && (
                      <span>
                        {ingredient.quantity && ingredient.quantity}
                        {ingredient.unit && ` ${ingredient.unit}`}
                      </span>
                    )}
                    {ingredient.notes && <span> - {ingredient.notes}</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 步骤部分 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">步骤 ({recipe.steps.length})</h2>
        <div className="space-y-4">
          {sortedSteps.map((step) => (
            <Card key={step.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                    {step.step_number}
                  </div>
                  <h3 className="font-medium">
                    {step.step_type === 'preparation' && '准备: '}
                    {step.step_type === 'cooking' && '烹饪: '}
                    {step.step_type === 'final' && '成品: '}
                  </h3>
                </div>
                
                <p className="text-gray-700 ml-10 mb-4">{step.instruction}</p>
                
                {step.image_url && (
                  <div className="ml-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {step.image_url.split('||').filter(url => !!url).map((imageUrl, index) => (
                        <div key={index} className="relative h-40 rounded-lg overflow-hidden">
                          <Image
                            src={imageUrl}
                            alt={`步骤 ${step.step_number} 图片 ${index + 1}`}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 分类部分 */}
      {recipe.categories.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">分类</h2>
          <div className="flex flex-wrap gap-2">
            {recipe.categories.map((category) => (
              <span
                key={category.id}
                className="px-3 py-1 bg-gray-100 rounded-full text-sm"
              >
                {category.name}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex justify-end mt-8">
        <Link href="/dashboard/recipes">
          <Button variant="outline">返回列表</Button>
        </Link>
      </div>
    </div>
  );
} 