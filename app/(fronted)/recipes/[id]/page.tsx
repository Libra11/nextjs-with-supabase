import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getRecipeById } from '@/lib/recipe';
import { Card } from '@/components/ui/card';

export const revalidate = 3600; // 每小时重新验证一次

interface RecipeDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const { id } = await params;
  const recipe = await getRecipeById(id);

  if (!recipe || !recipe.is_published) {
    notFound();
  }

  // 处理步骤图片，将分隔符分隔的URL字符串拆分成数组
  const stepsWithImageArrays = recipe.steps.map(step => {
    const imageUrls = step.image_url ? step.image_url.split('||').filter(url => !!url) : [];
    return {
      ...step,
      imageUrls
    };
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 菜谱标题和图片 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">{recipe.title}</h1>
          
          {recipe.featured_image_url && (
            <div className="relative h-[400px] w-full overflow-hidden rounded-lg mb-6">
              <Image 
                src={recipe.featured_image_url} 
                alt={recipe.title}
                fill
                priority
                sizes="(max-width: 1920px) 100vw, 320px"
                className="object-cover"
              />
            </div>
          )}

          {recipe.description && (
            <p className="text-gray-600 mb-4">{recipe.description}</p>
          )}

          <div className="flex items-center text-sm text-gray-500 mb-6">
            {recipe.difficulty_level && (
              <span className="mr-4">难度: {recipe.difficulty_level}</span>
            )}
            <span>发布于: {new Date(recipe.created_at).toLocaleDateString()}</span>
          </div>

          {recipe.categories && recipe.categories.length > 0 && (
            <div className="flex gap-2 mb-6">
              {recipe.categories.map(category => (
                <span key={category.id} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                  {category.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 配料部分 */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">配料</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <ul className="space-y-3">
              {recipe.ingredients.map((item) => (
                <li key={item.id} className="flex items-start">
                  <span className="flex-shrink-0 bg-gray-200 p-1 rounded-full mr-3">
                    {item.ingredient?.icon ? (
                      <img src={item.ingredient.icon} alt="" className="w-5 h-5" />
                    ) : (
                      <span className="w-5 h-5 block"></span>
                    )}
                  </span>
                  <div>
                    <span className="font-medium">{item.ingredient?.name}</span>
                    {(item.quantity || item.unit) && (
                      <span className="text-gray-600"> - {item.quantity} {item.unit}</span>
                    )}
                    {item.notes && (
                      <p className="text-sm text-gray-500">{item.notes}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 步骤部分 */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">烹饪步骤</h2>
          <div className="space-y-8">
            {stepsWithImageArrays
              .sort((a, b) => a.step_number - b.step_number)
              .map((step) => (
                <div key={step.id} className="border-l-4 border-gray-200 pl-6">
                  <div className="flex items-center mb-3">
                    <span className="bg-gray-200 text-gray-800 rounded-full w-8 h-8 flex items-center justify-center mr-3">
                      {step.step_number}
                    </span>
                    <span className="text-sm text-gray-500 uppercase">
                      {step.step_type === 'preparation'
                        ? '准备'
                        : step.step_type === 'cooking'
                        ? '烹饪'
                        : '成品'}
                    </span>
                  </div>
                  
                  <p className="mb-4">{step.instruction}</p>
                  
                  {step.imageUrls && step.imageUrls.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                      {step.imageUrls.map((imageUrl, imgIndex) => (
                        <div key={imgIndex} className="relative h-60 rounded-lg overflow-hidden">
                          <Image 
                            src={imageUrl} 
                            alt={`步骤 ${step.step_number} 图片 ${imgIndex + 1}`} 
                            fill
                            priority
                            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
} 