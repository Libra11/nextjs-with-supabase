/**
 * Author: Libra
 * Date: 2025-03-12 15:03:04
 * LastEditors: Libra
 * Description: 标签组件
 */

"use client";
import { createElement, useEffect, useState } from "react";
import { icons } from "@/icons.config";
import { cn } from "@/lib/utils";

export function TagBadge({
  icon_name,
  color,
  name,
  className,
  iconOnly = false,
}: {
  icon_name: string;
  color: string;
  name?: string;
  className?: string;
  iconOnly?: boolean;
}) {
  const [loadedIcons, setLoadedIcons] = useState<Record<string, any>>({});

  useEffect(() => {
    Promise.all(
      Object.entries(icons).map(async ([name, importFn]: any) => {
        const icon = await importFn();
        return [name, icon.default] as const;
      })
    ).then((loadedPairs) => {
      setLoadedIcons(Object.fromEntries(loadedPairs));
    });
  }, []);

  return (
    <div
      key={icon_name}
      className={cn(
        "flex items-center",
        !iconOnly && "px-3 py-1 rounded-full gap-2 w-fit",
        iconOnly && "w-5 h-5 rounded-md justify-center",
        className
      )}
      style={{
        backgroundColor: color ? `${color}20` : "#6c757d20",
        color: color || "#6c757d",
        borderColor: color ? `${color}40` : "#6c757d40",
        borderWidth: "1px",
        borderStyle: "solid",
      }}
    >
      {icon_name && loadedIcons[icon_name] && (
        <div
          className={cn(
            "flex items-center justify-center",
            iconOnly ? "w-3 h-3" : "w-4 h-4"
          )}
        >
          {createElement(loadedIcons[icon_name], {
            className: iconOnly ? "w-3 h-3" : "w-4 h-4",
          })}
        </div>
      )}
      {!iconOnly && <span>{name || icon_name}</span>}
    </div>
  );
}
