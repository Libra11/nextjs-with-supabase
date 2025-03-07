/**
 * Author: Libra
 * Date: 2025-03-07 18:03:42
 * LastEditors: Libra
 * Description:
 */
"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

  // 确保我们有有效的数组
  const safeOptions = Array.isArray(options) ? options : [];
  const safeSelected = Array.isArray(selected) ? selected : [];

  // 获取已选项的标签
  const selectedLabels = safeOptions
    .filter((option) => safeSelected.includes(option.value))
    .map((option) => option.label);

  // 处理选择/取消选择
  const handleSelect = (value: number) => {
    if (safeSelected.includes(value)) {
      onChange(safeSelected.filter((v) => v !== value));
    } else {
      onChange([...safeSelected, value]);
    }
  };

  // 移除标签
  const handleRemove = (value: number) => {
    onChange(safeSelected.filter((v) => v !== value));
  };

  // 清除所有选择
  const handleClear = () => {
    onChange([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <div className="flex flex-wrap gap-1 max-w-[90%] overflow-hidden">
            {selectedLabels.length > 0 ? (
              selectedLabels.map((label, i) => (
                <Badge key={i} variant="secondary" className="mr-1">
                  {label}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="搜索选项..." />
          <CommandEmpty>未找到选项</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-y-auto">
            {safeOptions.map((option) => (
              <CommandItem
                key={option.value}
                onSelect={() => handleSelect(option.value)}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        safeSelected.includes(option.value)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {option.label}
                  </div>
                  {safeSelected.includes(option.value) && (
                    <X
                      className="h-4 w-4 opacity-50 hover:opacity-100 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(option.value);
                      }}
                    />
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
          {safeSelected.length > 0 && (
            <div className="p-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={handleClear}
              >
                清除所有选择
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
