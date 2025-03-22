/**
 * Author: Libra
 * Date: 2025-03-22 11:50:07
 * LastEditors: Libra
 * Description:
 */
"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";

export const Meteors = ({
  number,
  className,
}: {
  number?: number;
  className?: string;
}) => {
  const [meteorStyles, setMeteorStyles] = useState<
    Array<{ top: string; left: string; delay: string; duration: string }>
  >([]);

  // 在客户端生成随机样式
  useEffect(() => {
    const meteorsCount = number || 10;
    const styles = Array.from({ length: meteorsCount }, () => ({
      top: "0px",
      left: Math.floor(Math.random() * (400 - -400) + -400) + "px",
      delay: (Math.random() * (0.8 - 0.2) + 0.2).toFixed(2) + "s",
      duration: Math.floor(Math.random() * (10 - 2) + 2) + "s",
    }));

    setMeteorStyles(styles);
  }, [number]);

  if (meteorStyles.length === 0) {
    return null; // 不渲染任何内容，直到客户端生成样式
  }

  return (
    <>
      {meteorStyles.map((style, idx) => (
        <span
          key={"meteor" + idx}
          className={cn(
            "animate-meteor-effect absolute top-1/2 left-1/2 h-0.5 w-0.5 rounded-[9999px] bg-slate-500 shadow-[0_0_0_1px_#ffffff10] rotate-[215deg]",
            "before:content-[''] before:absolute before:top-1/2 before:transform before:-translate-y-[50%] before:w-[50px] before:h-[1px] before:bg-gradient-to-r before:from-[#64748b] before:to-transparent",
            className
          )}
          style={{
            top: style.top,
            left: style.left,
            animationDelay: style.delay,
            animationDuration: style.duration,
          }}
        ></span>
      ))}
    </>
  );
};
