"use client";

import { Button } from "@/components/ui/button";
import { BookMarked, Heart, Printer, Share2 } from "lucide-react";

// Action buttons for the top toolbar
export function ActionButtons() {
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
export function SaveRecipeButton() {
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