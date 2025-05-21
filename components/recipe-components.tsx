/**
 * Author: Libra
 * Date: 2025-05-21 14:49:20
 * LastEditors: Libra
 * Description:
 */

// Client Components with interactive elements
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Share2, Printer, BookMarked } from "lucide-react";

// Action buttons for the top toolbar
function ActionButtons() {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-primary"
        onClick={() => {}}
      >
        <Heart className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-primary"
        onClick={() => {}}
      >
        <Share2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-primary"
        onClick={() => window.print()}
      >
        <Printer className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Save recipe button
function SaveRecipeButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full gap-1.5 text-xs"
      onClick={() => {}}
    >
      <BookMarked className="h-3.5 w-3.5" />
      <span>保存食谱</span>
    </Button>
  );
}

interface RecipeTabsProps {
  ingredientsCount: number;
  ingredients: any[];
}

function RecipeTabs({ ingredientsCount, ingredients }: RecipeTabsProps) {
  const [activeTab, setActiveTab] = useState<"steps" | "ingredients">("steps");

  return (
    <div>
      <div className="flex border-b">
        <button
          className={`flex-1 py-2 px-4 font-medium text-center ${activeTab === "steps" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
          onClick={() => setActiveTab("steps")}
        >
          步骤说明
        </button>
        <button
          className={`flex-1 py-2 px-4 font-medium text-center ${activeTab === "ingredients" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
          onClick={() => setActiveTab("ingredients")}
        >
          配料清单 ({ingredientsCount})
        </button>
      </div>

      {/* Only render this for mobile and only when ingredients tab is active */}
      {activeTab === "ingredients" && (
        <div className="mt-4">
          <MobileIngredientsPanel ingredients={ingredients} />
        </div>
      )}
    </div>
  );
}

interface MobileIngredientsPanelProps {
  ingredients: any[];
}

function MobileIngredientsPanel({ ingredients }: MobileIngredientsPanelProps) {
  return (
    <div className="md:hidden">
      <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
        <ul className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
          {ingredients.map((item) => (
            <li
              key={item.id}
              className="flex items-center p-1.5 rounded-md hover:bg-accent/10 transition-colors"
            >
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
    </div>
  );
}

export { ActionButtons, SaveRecipeButton, RecipeTabs, MobileIngredientsPanel };
