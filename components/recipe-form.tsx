"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createClient } from "@/utils/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Recipe,
  RecipeIngredient,
  RecipeStep,
  Ingredient,
  RecipeIngredientUsage,
  RecipeCategory,
  RecipeWithDetails,
} from "@/types/recipe";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { createIngredient, searchIngredients, getAllCategories, createCategory } from "@/lib/recipe-client";
import { Search, Plus, ChevronDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { uploadFile, getPublicUrl } from "@/lib/bucket";
import { BUCKET_NAME } from "@/const";

// 表单验证schema
const recipeFormSchema = z.object({
  title: z.string().min(1, "标题不能为空"),
  description: z.string().optional(),
  difficulty_level: z.string().optional(),
  is_published: z.boolean().default(false),
  featured_image_url: z.string().optional(),
  categories: z.array(z.string()),
  ingredients: z.array(
    z.object({
      ingredient_id: z.string().min(1, "请选择或添加配料"),
      quantity: z.number().optional().nullable(),
      unit: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
      order: z.number().optional(),
    })
  ),
  steps: z.array(
    z.object({
      step_number: z.number().int().min(1, "步骤编号必须大于0"),
      instruction: z.string().min(1, "步骤说明不能为空"),
      image_urls: z.array(z.string().optional()).optional(),
      step_type: z.enum(["preparation", "cooking", "final"]).default("cooking"),
    })
  ),
});

type RecipeFormValues = z.infer<typeof recipeFormSchema>;

interface RecipeFormProps {
  recipe?: RecipeWithDetails;
  isEditing?: boolean;
}

export default function RecipeForm({
  recipe,
  isEditing = false,
}: RecipeFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null);
  const [featuredImagePreview, setFeaturedImagePreview] = useState<
    string | null
  >(recipe?.featured_image_url || null);
  const [stepImageFiles, setStepImageFiles] = useState<{
    [key: number]: File[];
  }>({});
  const [stepImagePreviews, setStepImagePreviews] = useState<{
    [key: number]: string[];
  }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Ingredient[]>([]);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<
    Map<string, Ingredient>
  >(new Map());
  const [showAddIngredientDialog, setShowAddIngredientDialog] = useState(false);
  const [newIngredient, setNewIngredient] = useState({
    name: "",
    icon: "",
    category: "",
  });
  const [isSearching, setIsSearching] = useState(false);
  const [categories, setCategories] = useState<RecipeCategory[]>([]);
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
  });

  // 初始化表单
  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      title: recipe?.title || "",
      description: recipe?.description || "",
      difficulty_level: recipe?.difficulty_level || "",
      is_published: recipe?.is_published || false,
      featured_image_url: recipe?.featured_image_url || "",
      categories: recipe?.categories?.map((cat) => cat.id) || [],
      ingredients: recipe?.ingredients?.map((ingredient, index) => ({
        ingredient_id: ingredient.ingredient_id,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        notes: ingredient.notes,
        order: ingredient.order || index + 1,
      })) || [
        {
          ingredient_id: "",
          quantity: null,
          unit: null,
          notes: null,
          order: 1,
        },
      ],
      steps: recipe?.steps?.map((step) => ({
        step_number: step.step_number,
        instruction: step.instruction,
        image_urls: step.image_url
          ? step.image_url.split("||").filter((url) => !!url)
          : [],
        step_type: step.step_type || "cooking",
      })) || [
        {
          step_number: 1,
          instruction: "",
          image_urls: [],
          step_type: "cooking",
        },
      ],
    },
  });

  // 加载已选择的配料信息
  useEffect(() => {
    const loadSelectedIngredients = async () => {
      if (recipe?.ingredients?.length) {
        const newSelectedIngredients = new Map<string, Ingredient>();

        recipe.ingredients.forEach((usage) => {
          if (usage.ingredient) {
            newSelectedIngredients.set(usage.ingredient_id, usage.ingredient);
          }
        });

        setSelectedIngredients(newSelectedIngredients);
      }
    };

    loadSelectedIngredients();
  }, [recipe]);

  // 初始化步骤图片预览
  useEffect(() => {
    if (recipe?.steps) {
      const previews: { [key: number]: string[] } = {};
      recipe.steps.forEach((step, index) => {
        if (step.image_url) {
          // 将分隔符分隔的URL字符串拆分成数组
          previews[index] = step.image_url.split("||").filter((url) => !!url);
        }
      });
      setStepImagePreviews(previews);
    }
  }, [recipe]);

  // 配料字段数组
  const {
    fields: ingredientFields,
    append: appendIngredient,
    remove: removeIngredient,
    update: updateIngredient,
  } = useFieldArray({
    name: "ingredients",
    control: form.control,
  });

  // 步骤字段数组
  const {
    fields: stepFields,
    append: appendStep,
    remove: removeStep,
  } = useFieldArray({
    name: "steps",
    control: form.control,
  });

  // 加载所有分类
  useEffect(() => {
    const loadCategories = async () => {
      const loadedCategories = await getAllCategories();
      setCategories(loadedCategories);
    };
    
    loadCategories();
  }, []);

  // 处理新增分类
  const handleAddNewCategory = async () => {
    if (!newCategory.name.trim()) {
      return;
    }
    
    const createdCategory = await createCategory({
      name: newCategory.name.trim(),
      description: newCategory.description.trim() || null,
    });
    
    if (createdCategory) {
      // 添加新分类到列表
      setCategories((prev) => [...prev, createdCategory]);
      
      // 清空并关闭对话框
      setNewCategory({ name: "", description: "" });
      setShowAddCategoryDialog(false);
    }
  };

  // 处理特色图片上传
  const handleFeaturedImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFeaturedImageFile(file);
      
      // 创建本地预览URL
      const previewUrl = URL.createObjectURL(file);
      setFeaturedImagePreview(previewUrl);
      
      // 注意：这里不立即更新表单值，而是保持原有值
      // 只有在提交表单时才会上传图片并更新URL
      console.log("特色图片已选择，保存在state中等待上传");
    }
  };

  // 处理步骤图片上传
  const handleStepImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setStepImageFiles((prev) => ({
        ...prev,
        [index]: [...(prev[index] || []), ...files],
      }));

      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setStepImagePreviews((prev) => ({
        ...prev,
        [index]: [...(prev[index] || []), ...newPreviews],
      }));
    }
  };

  // 删除步骤图片
  const handleRemoveStepImage = (stepIndex: number, imageIndex: number) => {
    setStepImagePreviews((prev) => {
      const newPreviews = { ...prev };
      if (newPreviews[stepIndex]) {
        newPreviews[stepIndex] = newPreviews[stepIndex].filter(
          (_, idx) => idx !== imageIndex
        );
      }
      return newPreviews;
    });

    setStepImageFiles((prev) => {
      const newFiles = { ...prev };
      if (newFiles[stepIndex]) {
        newFiles[stepIndex] = newFiles[stepIndex].filter(
          (_, idx) => idx !== imageIndex
        );
      }
      return newFiles;
    });

    // 更新表单值
    const steps = form.getValues("steps");
    if (steps[stepIndex].image_urls) {
      steps[stepIndex].image_urls = steps[stepIndex].image_urls.filter(
        (_, idx) => idx !== imageIndex
      );
      form.setValue("steps", steps);
    }
  };

  // 搜索配料
  const handleSearchIngredients = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchIngredients(query);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching ingredients:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // 加载所有配料
  const loadAllIngredients = async () => {
    setIsSearching(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .order('name')
        .limit(50);
        
      if (error) {
        console.error("Error loading ingredients:", error);
        return;
      }
      
      setAllIngredients(data || []);
    } catch (error) {
      console.error("Error loading ingredients:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // 选择配料
  const handleSelectIngredient = (
    ingredient: Ingredient,
    fieldIndex: number
  ) => {
    const currentField = ingredientFields[fieldIndex];
    const newSelectedIngredients = new Map(selectedIngredients);
    newSelectedIngredients.set(ingredient.id, ingredient);
    setSelectedIngredients(newSelectedIngredients);

    updateIngredient(fieldIndex, {
      ...currentField,
      ingredient_id: ingredient.id,
    });

    setSearchQuery("");
    setSearchResults([]);
  };

  // 添加新配料到配料库
  const handleAddNewIngredient = async () => {
    if (!newIngredient.name.trim()) return;

    try {
      const ingredient = await createIngredient({
        name: newIngredient.name,
        icon: newIngredient.icon || null,
        category: newIngredient.category || null,
      });

      if (ingredient) {
        const newSelectedIngredients = new Map(selectedIngredients);
        newSelectedIngredients.set(ingredient.id, ingredient);
        setSelectedIngredients(newSelectedIngredients);

        setNewIngredient({ name: "", icon: "", category: "" });
        setShowAddIngredientDialog(false);
      }
    } catch (error) {
      console.error("Error creating ingredient:", error);
    }
  };

  // 上传图片到Supabase存储
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      console.log("开始上传图片:", file.name);
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `recipes/${fileName}`;

      console.log("上传到路径:", filePath);
      const data = await uploadFile(BUCKET_NAME, filePath, file, {
        upsert: true,
      });
      
      if (!data) {
        console.error("上传失败，返回数据为空");
        return null;
      }
      
      console.log("上传成功，获取公共URL");
      const publicUrl = await getPublicUrl(BUCKET_NAME, filePath);
      console.log("获取到公共URL:", publicUrl);
      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  };

  // 表单提交
  const onSubmit = async (data: RecipeFormValues) => {
    setIsSubmitting(true);
    try {
      const supabase = createClient();

      // 上传特色图片（如果有）
      let featuredImageUrl = data.featured_image_url;
      if (featuredImageFile) {
        console.log("准备上传特色图片");
        const uploadedUrl = await uploadImage(featuredImageFile);
        if (uploadedUrl) {
          console.log("特色图片上传成功，URL:", uploadedUrl);
          featuredImageUrl = uploadedUrl;
        } else {
          console.error("特色图片上传失败");
        }
      } else {
        console.log("没有新的特色图片需要上传，使用现有URL:", featuredImageUrl);
      }

      // 处理步骤图片
      const stepsWithImages = await Promise.all(
        data.steps.map(async (step, index) => {
          let imageUrls = step.image_urls || [];
          
          // 上传该步骤的新图片
          if (stepImageFiles[index] && stepImageFiles[index].length > 0) {
            const uploadedUrls = await Promise.all(
              stepImageFiles[index].map((file) => uploadImage(file))
            );
            
            // 过滤掉上传失败的图片
            const validUrls = uploadedUrls.filter(
              (url) => url !== null
            ) as string[];
            imageUrls = [...(step.image_urls || []), ...validUrls];
          }
          
          return { 
            ...step, 
            image_urls: imageUrls,
          };
        })
      );

      // 准备更新数据
      const recipeData = {
        title: data.title,
        description: data.description,
        difficulty_level: data.difficulty_level,
        is_published: data.is_published,
        featured_image_url: featuredImageUrl,
      };
      
      console.log("更新的菜谱数据:", recipeData);

      // 创建或更新菜谱
      let recipeId: string;
      if (isEditing && recipe) {
        // 更新菜谱
        const { error } = await supabase
          .from("recipes")
          .update(recipeData)
          .eq("id", recipe.id);

        if (error) {
          console.error("Error updating recipe:", error);
          return;
        }
        
        console.log("菜谱更新成功");
        recipeId = recipe.id;
      } else {
        // 创建新菜谱
        const { data: newRecipe, error } = await supabase
          .from("recipes")
          .insert({
            title: data.title,
            description: data.description,
            difficulty_level: data.difficulty_level,
            is_published: data.is_published,
            featured_image_url: featuredImageUrl,
          })
          .select()
          .single();

        if (error || !newRecipe) {
          console.error("Error creating recipe:", error);
          return;
        }

        recipeId = newRecipe.id;
      }

      // 更新菜谱分类
      if (recipeId) {
        // 先删除现有分类映射
        await supabase
          .from('recipe_category_mappings')
          .delete()
          .eq('recipe_id', recipeId);
        
        // 如果有选择分类，创建新的映射
        if (data.categories.length > 0) {
          const mappings = data.categories.map((categoryId) => ({
            recipe_id: recipeId,
            category_id: categoryId,
          }));
          
          await supabase
            .from('recipe_category_mappings')
            .insert(mappings);
        }
      }

      // 删除现有配料并添加新配料
      await supabase
        .from("recipe_ingredient_usage")
        .delete()
        .eq("recipe_id", recipeId);
      await supabase.from("recipe_ingredient_usage").insert(
        data.ingredients.map((ingredient, index) => ({
          recipe_id: recipeId,
          ingredient_id: ingredient.ingredient_id,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          notes: ingredient.notes,
          order: index + 1,
        }))
      );

      // 删除现有步骤并添加新步骤
      await supabase.from("recipe_steps").delete().eq("recipe_id", recipeId);
      await supabase.from("recipe_steps").insert(
        stepsWithImages.map((step) => ({
          recipe_id: recipeId,
          step_number: step.step_number,
          instruction: step.instruction,
          image_url:
            step.image_urls && step.image_urls.length > 0
              ? step.image_urls.join("||") // 用||分隔符连接多张图片URL
              : null,
          step_type: step.step_type,
        }))
      );

      router.push("/dashboard/recipes");
      router.refresh();
    } catch (error) {
      console.error("Error creating/updating recipe:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 max-w-3xl"
        >
          {/* 基本信息 */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">基本信息</h2>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>标题</FormLabel>
                  <FormControl>
                    <Input placeholder="输入菜谱标题" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>描述</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="输入菜谱描述"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="difficulty_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>难度</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择难度级别" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="简单">简单</SelectItem>
                        <SelectItem value="中等">中等</SelectItem>
                        <SelectItem value="困难">困难</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_published"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">发布状态</FormLabel>
                    <p className="text-sm text-gray-500">
                      {field.value ? "此菜谱将公开显示" : "此菜谱将保存为草稿"}
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="featured_image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>特色图片</FormLabel>
                  <div className="flex items-center space-x-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFeaturedImageChange}
                      className="max-w-sm"
                    />
                    <Input 
                      type="hidden" 
                      {...field} 
                      value={field.value || ""}
                    />
                    {featuredImagePreview && (
                      <div className="relative h-20 w-20 overflow-hidden rounded-md">
                        <img
                          src={featuredImagePreview}
                          alt="特色图片预览"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* 分类选择部分 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">分类</h3>
              <Dialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" /> 新增分类
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>新增分类</DialogTitle>
                    <DialogDescription>
                      创建新的菜谱分类，便于分类整理菜谱。
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <FormLabel htmlFor="new-category-name">名称</FormLabel>
                      <Input
                        id="new-category-name"
                        placeholder="输入分类名称"
                        value={newCategory.name}
                        onChange={(e) =>
                          setNewCategory({ ...newCategory, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <FormLabel htmlFor="new-category-description">
                        描述（可选）
                      </FormLabel>
                      <Textarea
                        id="new-category-description"
                        placeholder="输入分类描述"
                        value={newCategory.description}
                        onChange={(e) =>
                          setNewCategory({
                            ...newCategory,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      onClick={handleAddNewCategory}
                      disabled={!newCategory.name.trim()}
                    >
                      添加
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            <FormField
              control={form.control}
              name="categories"
              render={({ field }) => (
                <FormItem>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Badge
                        key={category.id}
                        variant={
                          field.value.includes(category.id)
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() => {
                          if (field.value.includes(category.id)) {
                            field.onChange(
                              field.value.filter((id) => id !== category.id)
                            );
                          } else {
                            field.onChange([...field.value, category.id]);
                          }
                        }}
                      >
                        {category.name}
                        {field.value.includes(category.id) && (
                          <X className="ml-1 h-3 w-3" />
                        )}
                      </Badge>
                    ))}
                    {categories.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        暂无分类，请点击"新增分类"按钮创建分类
                      </p>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* 配料部分 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">配料</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendIngredient({
                    ingredient_id: "",
                    quantity: null,
                    unit: null,
                    notes: null,
                    order: ingredientFields.length + 1,
                  })
                }
              >
                添加配料
              </Button>
            </div>

            <div className="space-y-4">
              {ingredientFields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start p-4 border rounded-lg"
                >
                  <div className="md:col-span-3">
                    <FormField
                      control={form.control}
                      name={`ingredients.${index}.ingredient_id`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>配料</FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="justify-between w-full"
                                    type="button"
                                    onClick={() => {
                                      if (allIngredients.length === 0) {
                                        loadAllIngredients();
                                      }
                                    }}
                                  >
                                    {field.value &&
                                    selectedIngredients.has(field.value)
                                      ? selectedIngredients.get(field.value)
                                          ?.name
                                      : "选择配料"}
                                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px]">
                                  <div className="space-y-2">
                                    <div className="flex gap-2">
                                      <Input
                                        placeholder="搜索配料..."
                                        value={searchQuery}
                                        onChange={(e) =>
                                          handleSearchIngredients(
                                            e.target.value
                                          )
                                        }
                                        className="flex-1"
                                      />
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        type="button"
                                        disabled={isSearching}
                                      >
                                        <Search className="h-4 w-4" />
                                      </Button>
                                    </div>

                                    <div className="max-h-[200px] overflow-y-auto space-y-1 py-2">
                                      {searchQuery.length > 1 ? (
                                        searchResults.length > 0 ? (
                                          searchResults.map((ingredient) => (
                                            <Button
                                              key={ingredient.id}
                                              variant="ghost"
                                              className="w-full justify-start"
                                              type="button"
                                              onClick={() =>
                                                handleSelectIngredient(
                                                  ingredient,
                                                  index
                                                )
                                              }
                                            >
                                              {ingredient.icon && (
                                                <img
                                                  src={ingredient.icon}
                                                  alt={ingredient.name}
                                                  className="h-4 w-4 mr-2"
                                                />
                                              )}
                                              <span>{ingredient.name}</span>
                                              {ingredient.category && (
                                                <Badge
                                                  variant="outline"
                                                  className="ml-2 text-xs"
                                                >
                                                  {ingredient.category}
                                                </Badge>
                                              )}
                                            </Button>
                                          ))
                                        ) : (
                                          <div className="text-center py-2 text-sm text-gray-500">
                                            未找到配料
                                          </div>
                                        )
                                      ) : allIngredients.length > 0 ? (
                                        allIngredients.map((ingredient) => (
                                          <Button
                                            key={ingredient.id}
                                            variant="ghost"
                                            className="w-full justify-start"
                                            type="button"
                                            onClick={() =>
                                              handleSelectIngredient(
                                                ingredient,
                                                index
                                              )
                                            }
                                          >
                                            {ingredient.icon && (
                                              <img
                                                src={ingredient.icon}
                                                alt={ingredient.name}
                                                className="h-4 w-4 mr-2"
                                              />
                                            )}
                                            <span>{ingredient.name}</span>
                                            {ingredient.category && (
                                              <Badge
                                                variant="outline"
                                                className="ml-2 text-xs"
                                              >
                                                {ingredient.category}
                                              </Badge>
                                            )}
                                          </Button>
                                        ))
                                      ) : (
                                        <div className="text-center py-2 text-sm text-gray-500">
                                          {isSearching ? "加载中..." : "没有配料数据"}
                                        </div>
                                      )}
                                    </div>

                                    <div className="pt-2 border-t">
                                      <Dialog
                                        open={showAddIngredientDialog}
                                        onOpenChange={
                                          setShowAddIngredientDialog
                                        }
                                      >
                                        <DialogTrigger asChild>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full"
                                          >
                                            <Plus className="h-4 w-4 mr-2" />
                                            添加新配料
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                          <DialogHeader>
                                            <DialogTitle>
                                              添加新配料
                                            </DialogTitle>
                                            <DialogDescription>
                                              添加一个新的配料到配料库中
                                            </DialogDescription>
                                          </DialogHeader>
                                          <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                              <FormLabel>配料名称</FormLabel>
                                              <Input
                                                placeholder="例如：番茄"
                                                value={newIngredient.name}
                                                onChange={(e) =>
                                                  setNewIngredient({
                                                    ...newIngredient,
                                                    name: e.target.value,
                                                  })
                                                }
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <FormLabel>
                                                图标URL（可选）
                                              </FormLabel>
                                              <Input
                                                placeholder="图标图片URL"
                                                value={newIngredient.icon}
                                                onChange={(e) =>
                                                  setNewIngredient({
                                                    ...newIngredient,
                                                    icon: e.target.value,
                                                  })
                                                }
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <FormLabel>
                                                分类（可选）
                                              </FormLabel>
                                              <Input
                                                placeholder="例如：蔬菜、肉类"
                                                value={newIngredient.category}
                                                onChange={(e) =>
                                                  setNewIngredient({
                                                    ...newIngredient,
                                                    category: e.target.value,
                                                  })
                                                }
                                              />
                                            </div>
                                          </div>
                                          <DialogFooter>
                                            <Button
                                              type="button"
                                              variant="outline"
                                              onClick={() =>
                                                setShowAddIngredientDialog(
                                                  false
                                                )
                                              }
                                            >
                                              取消
                                            </Button>
                                            <Button
                                              type="button"
                                              onClick={handleAddNewIngredient}
                                              disabled={
                                                !newIngredient.name.trim()
                                              }
                                            >
                                              添加
                                            </Button>
                                          </DialogFooter>
                                        </DialogContent>
                                      </Dialog>
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                              <input type="hidden" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name={`ingredients.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>数量</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="数量"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(
                                  value ? parseFloat(value) : null
                                );
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name={`ingredients.${index}.unit`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>单位</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="单位"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="md:col-span-3">
                    <FormField
                      control={form.control}
                      name={`ingredients.${index}.notes`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>备注</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="备注"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="md:col-span-2 flex items-end">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="mt-8"
                      onClick={() => removeIngredient(index)}
                      disabled={ingredientFields.length === 1}
                    >
                      移除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 步骤部分 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">烹饪步骤</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const nextStepNumber = stepFields.length + 1;
                  appendStep({
                    step_number: nextStepNumber,
                    instruction: "",
                    image_urls: [],
                    step_type: "cooking",
                  });
                }}
              >
                添加步骤
              </Button>
            </div>

            <div className="space-y-6">
              {stepFields.map((field, index) => (
                <div key={field.id} className="space-y-4 p-4 border rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name={`steps.${index}.step_number`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>步骤编号</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="1"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value, 10))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="md:col-span-3">
                      <FormField
                        control={form.control}
                        name={`steps.${index}.step_type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>步骤类型</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="preparation">
                                    准备
                                  </SelectItem>
                                  <SelectItem value="cooking">烹饪</SelectItem>
                                  <SelectItem value="final">成品</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="md:col-span-7">
                      <FormField
                        control={form.control}
                        name={`steps.${index}.instruction`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>步骤说明</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="输入步骤说明"
                                className="h-20"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <FormLabel>步骤图片</FormLabel>
                    <div className="flex flex-col space-y-4">
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleStepImageChange(e, index)}
                        className="max-w-sm"
                      />

                      {stepImagePreviews[index] &&
                        stepImagePreviews[index].length > 0 && (
                          <div className="flex flex-wrap gap-3 mt-2">
                            {stepImagePreviews[index].map(
                              (preview, imgIndex) => (
                                <div
                                  key={imgIndex}
                                  className="relative h-24 w-24 overflow-hidden rounded-md group"
                                >
                                  <img
                                    src={preview}
                                    alt={`步骤 ${index + 1} 图片预览 ${imgIndex + 1}`}
                                    className="h-full w-full object-cover"
                                  />
                                  <div
                                    className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                    onClick={() =>
                                      handleRemoveStepImage(index, imgIndex)
                                    }
                                  >
                                    <button
                                      type="button"
                                      className="text-white bg-red-500 hover:bg-red-600 rounded-full p-1"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeStep(index)}
                      disabled={stepFields.length === 1}
                    >
                      移除步骤
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/recipes")}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "保存中..." : isEditing ? "更新菜谱" : "创建菜谱"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
