/**
 * Author: Libra
 * Date: 2025-03-07 18:03:42
 * LastEditors: Libra
 * Description:
 */
"use client";

import * as React from "react";
import { X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export interface Option {
  value: number;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: number[];
  onChange: (values: number[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options = [],
  selected = [],
  onChange,
  placeholder = "选择选项...",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // 过滤选项
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 获取已选项的标签
  const selectedItems = options.filter((option) =>
    selected.includes(option.value)
  );

  // 处理选择/取消选择
  const handleSelect = (value: number) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  // 移除标签
  const handleRemove = (value: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange(selected.filter((v) => v !== value));
  };

  // 清除所有选择
  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between min-h-[2.5rem] h-auto",
            className
          )}
        >
          <div className="flex flex-wrap gap-1 items-center">
            {selectedItems.length > 0 ? (
              selectedItems.map((item) => (
                <Badge
                  key={item.value}
                  variant="secondary"
                  className="mr-1 px-1 py-0"
                >
                  {item.label}
                  <span
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => handleRemove(item.value, e)}
                  >
                    <X className="h-3 w-3" />
                  </span>
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="flex flex-col gap-2 p-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder="搜索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8"
            />
            {selected.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={handleClearAll}
              >
                清除
              </Button>
            )}
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="text-center py-2 text-sm text-muted-foreground">
                未找到选项
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "flex items-center justify-between px-2 py-1.5 cursor-pointer rounded-sm text-sm",
                    "hover:bg-accent hover:text-accent-foreground",
                    selected.includes(option.value) &&
                      "bg-accent text-accent-foreground"
                  )}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                  {selected.includes(option.value) && (
                    <X
                      className="h-4 w-4 opacity-50 hover:opacity-100"
                      onClick={(e) => handleRemove(option.value, e)}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
