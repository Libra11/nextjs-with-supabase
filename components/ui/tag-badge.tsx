/**
 * Author: Libra
 * Date: 2025-03-12 15:03:04
 * LastEditors: Libra
 * Description: 标签组件
 */

"use client";
import { createElement, useEffect, useState } from "react";
import { icons } from "@/icons.config";

export function TagBadge({
  icon_name,
  color,
  name,
}: {
  icon_name: string;
  color: string;
  name?: string;
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
      className="w-fit px-3 py-1 rounded-full flex items-center gap-2"
      style={{
        backgroundColor: color ? `${color}20` : "#6c757d20",
        color: color || "#6c757d",
        borderColor: color ? `${color}40` : "#6c757d40",
        borderWidth: "1px",
        borderStyle: "solid",
      }}
    >
      {icon_name && loadedIcons[icon_name] && (
        <div className="w-4 h-4 flex items-center justify-center">
          {createElement(loadedIcons[icon_name], {
            className: "w-4 h-4",
          })}
        </div>
      )}
      <span>{name || icon_name}</span>
    </div>
  );
}
