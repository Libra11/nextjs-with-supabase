"use client";

import { useState } from 'react';
import { Badge } from "@/components/ui/badge";

interface RecipeTabsProps {
  ingredientsCount: number;
  ingredients: any[];
  categorizedIngredients: Array<{
    id: string;
    name: string;
    icon: string | null;
    ingredients: any[];
  }>;
}

export function RecipeTabs({ ingredientsCount, ingredients, categorizedIngredients }: RecipeTabsProps) {
  const [activeTab, setActiveTab] = useState<'steps' | 'ingredients'>('steps');
  
  return (
    <div>
      <div className="flex border-b">
        <button 
          className={`flex-1 py-2 px-4 font-medium text-center ${activeTab === 'steps' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('steps')}
        >
          步骤说明
        </button>
        <button 
          className={`flex-1 py-2 px-4 font-medium text-center ${activeTab === 'ingredients' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('ingredients')}
        >
          配料清单 ({ingredientsCount})
        </button>
      </div>
      
      {/* Only render this for mobile and only when ingredients tab is active */}
      {activeTab === 'ingredients' && (
        <div className="mt-4">
          <MobileIngredientsPanel 
            categorizedIngredients={categorizedIngredients}
          />
        </div>
      )}
    </div>
  );
}

interface MobileIngredientsPanelProps {
  categorizedIngredients: Array<{
    id: string;
    name: string;
    icon: string | null;
    ingredients: any[];
  }>;
}

function MobileIngredientsPanel({ categorizedIngredients }: MobileIngredientsPanelProps) {
  return (
    <div className="md:hidden">
      <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
        <div className="max-h-[70vh] overflow-y-auto pr-1">
          {categorizedIngredients.map((category) => (
            <div key={category.id} className="mb-4">
              <div className="flex items-center bg-muted/50 rounded-md py-1.5 px-2 mb-2">
                {category.icon && (
                  <img src={category.icon} alt="" className="w-4 h-4 mr-1.5" />
                )}
                <h3 className="text-xs font-medium">{category.name}</h3>
                <Badge variant="outline" className="ml-2 text-[10px] rounded-full h-4 px-1.5">
                  {category.ingredients.length}
                </Badge>
              </div>
              
              <ul className="space-y-2">
                {category.ingredients.map((item) => (
                  <li key={item.id} className="flex items-center p-1.5 rounded-md hover:bg-accent/10 transition-colors">
                    <div className="flex-shrink-0 bg-background shadow-sm rounded-full p-1 mr-2 border border-border">
                      {item.ingredient?.icon ? (
                        <img src={item.ingredient.icon} alt="" className="w-5 h-5" />
                      ) : (
                        <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-[9px] text-primary">配料</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <span className="font-medium text-xs block truncate">{item.ingredient?.name}</span>
                      {(item.quantity || item.unit) && (
                        <span className="text-xs text-muted-foreground block truncate">{item.quantity} {item.unit}</span>
                      )}
                    </div>
                    {item.notes && (
                      <div className="ml-1 text-[10px] text-muted-foreground italic max-w-[80px] truncate" title={item.notes}>
                        {item.notes}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 