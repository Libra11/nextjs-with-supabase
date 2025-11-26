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
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">{recipe.title}</h1>
        <div className="flex gap-3">
          <Link href={`/dashboard/recipes/${recipe.id}/edit`}>
            <Button variant="outline" size="sm" className="shadow-sm">
              编辑菜谱
            </Button>
          </Link>
          <Link href={`/recipes/${recipe.id}`} target="_blank">
            <Button size="sm" className="shadow-sm">
              查看前台页面
            </Button>
          </Link>
        </div>
      </div>

      {/* 菜谱信息卡片 */}
      <Card className="mb-10 shadow-sm border border-gray-100 overflow-hidden">
        <CardContent className="pt-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-5 text-gray-800">基本信息</h2>
              <dl className="space-y-3">
                <div className="flex">
                  <dt className="w-24 font-medium text-gray-600">难度:</dt>
                  <dd className="text-gray-800">{recipe.difficulty_level || '未设置'}</dd>
                </div>
                <div className="flex">
                  <dt className="w-24 font-medium text-gray-600">发布状态:</dt>
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
                  <dt className="w-24 font-medium text-gray-600">创建时间:</dt>
                  <dd className="text-gray-800">
                    {new Date(recipe.created_at).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </dd>
                </div>
                <div className="flex">
                  <dt className="w-24 font-medium text-gray-600">更新时间:</dt>
                  <dd className="text-gray-800">
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
                  <h3 className="font-medium mb-2 text-gray-600">描述:</h3>
                  <p className="text-gray-600 italic">{recipe.description}</p>
                </div>
              )}
            </div>

            {recipe.featured_image_url && (
              <div className="flex justify-center items-center">
                <div className="relative h-72 w-full rounded-lg overflow-hidden shadow-md">
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
      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-5 text-gray-800 pb-2 border-b border-gray-100">配料 ({recipe.ingredients.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recipe.ingredients.map((ingredient) => (
            <Card key={ingredient.id} className="border border-gray-100 shadow-sm hover:shadow transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                {ingredient.ingredient?.icon && (
                  <div className="w-10 h-10 flex-shrink-0 bg-gray-50 rounded-full p-1.5 flex items-center justify-center">
                    <Image
                      src={ingredient.ingredient.icon}
                      alt={ingredient.ingredient.name}
                      width={32}
                      height={32}
                    />
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-800">{ingredient.ingredient?.name}</p>
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
      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-5 text-gray-800 pb-2 border-b border-gray-100">烹饪步骤 ({recipe.steps.length})</h2>
        <div className="space-y-6">
          {sortedSteps.map((step) => (
            <Card key={step.id} className="border-l-4 border-l-primary border-t-0 border-r border-b border-gray-100 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-semibold shadow-sm">
                    {step.step_number}
                  </div>
                  <h3 className="font-medium text-lg text-gray-800">
                    {step.step_type === 'preparation' && '准备: '}
                    {step.step_type === 'cooking' && '烹饪: '}
                    {step.step_type === 'final' && '成品: '}
                  </h3>
                </div>
                
                <p className="text-gray-700 mb-6 ml-12">{step.instruction}</p>
                
                {step.image_url && (
                  <div className="ml-12">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {step.image_url.split('||').filter(url => !!url).map((imageUrl, index) => (
                        <div key={index} className="relative h-44 rounded-lg overflow-hidden shadow-sm hover:shadow transition-shadow">
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
        <div className="mb-10">
          <h2 className="text-2xl font-semibold mb-5 text-gray-800 pb-2 border-b border-gray-100">分类</h2>
          <div className="flex flex-wrap gap-2">
            {recipe.categories.map((category) => (
              <span
                key={category.id}
                className="px-4 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-full text-sm text-gray-700 transition-colors"
              >
                {category.name}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex justify-end mt-10 border-t border-gray-100 pt-6">
        <Link href="/dashboard/recipes">
          <Button variant="outline" className="shadow-sm">
            返回列表
          </Button>
        </Link>
      </div>
    </div>
  );
} 