/**
 * Author: Libra
 * Date: 2025-03-19 15:06:34
 * LastEditors: Libra
 * Description: 使用 Framer Motion 实现的水平重叠卡片组件
 */
"use client";
import React, { useState, ReactNode, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface OverlappingCardsProps<T> {
  items: T[]; // 要渲染的数据项数组
  renderItem: (item: T, index: number) => ReactNode; // 自定义渲染函数
  className?: string; // 容器类名
  cardWidth?: number; // 卡片宽度
  cardSpacing?: number; // 卡片间距
  cardClassName?: string; // 卡片类名
  showHoverEffect?: boolean; // 是否显示悬停效果
}

export function OverlappingCards<T>({
  items,
  renderItem,
  className = "",
  cardWidth = 300,
  cardSpacing = 150,
  cardClassName = "",
}: OverlappingCardsProps<T>) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [previousHoveredIndex, setPreviousHoveredIndex] = useState<
    number | null
  >(null);
  const [isFirstHover, setIsFirstHover] = useState(true);

  // 使用 useMemo 缓存动画配置
  const animationConfig = useMemo(
    () => ({
      transition: {
        type: "tween", // 改用 tween 类型，使动画更线性
        duration: 0.2, // 减少动画时间
        ease: "easeOut",
        // 允许动画立即中断
        // immediate: true,
      },
      hoverTransition: {
        type: "tween",
        duration: 0.15,
        ease: "easeOut",
        // 允许动画立即中断
        // immediate: true,
      },
    }),
    []
  );

  // 使用 useCallback 缓存位置计算函数
  const getCardPosition = useCallback(
    (index: number) => {
      // 默认位置
      const defaultPosition = index * cardSpacing;

      // 如果没有hover的卡片，返回默认位置
      if (hoveredIndex === null) return defaultPosition;

      // 第一次hover时
      if (isFirstHover) {
        // hover的卡片保持原位
        if (index <= hoveredIndex) return defaultPosition;
        // 后面的卡片都向右移动
        return defaultPosition + cardWidth - cardSpacing;
      }

      // 非第一次hover时
      if (hoveredIndex !== null && previousHoveredIndex !== null) {
        // 如果是新hover的卡片，且它在之前hover卡片的右边
        if (index === hoveredIndex && hoveredIndex > previousHoveredIndex) {
          // 向左移动到原始位置
          return defaultPosition;
        }
      }

      // 其他情况保持当前位置
      return (
        defaultPosition + (index > hoveredIndex ? cardWidth - cardSpacing : 0)
      );
    },
    [hoveredIndex, previousHoveredIndex, isFirstHover, cardWidth, cardSpacing]
  );

  // 使用 useCallback 缓存事件处理函数
  const handleHoverStart = useCallback(
    (index: number) => {
      requestAnimationFrame(() => {
        if (hoveredIndex === null) {
          // 第一次hover
          setIsFirstHover(true);
        } else {
          // 后续hover
          setIsFirstHover(false);
        }
        setPreviousHoveredIndex(hoveredIndex);
        setHoveredIndex(index);
      });
    },
    [hoveredIndex]
  );

  const handleHoverEnd = useCallback(() => {
    requestAnimationFrame(() => {
      setPreviousHoveredIndex(hoveredIndex);
      setHoveredIndex(null);
    });
  }, [hoveredIndex]);

  // 使用 useMemo 缓存容器样式
  const containerStyle = useMemo(
    () => ({
      willChange: "transform", // 优化动画性能
    }),
    [items.length, cardSpacing]
  );

  // 使用 useMemo 缓存基础卡片样式
  const baseCardStyle = useMemo(
    () => ({
      width: `${cardWidth}px`,
      originX: 0,
      originY: 0.5,
      willChange: "transform, left",
      transform: "translateZ(0)",
    }),
    [cardWidth]
  );

  return (
    <div
      className={cn("relative overflow-x-auto flex", className)}
      style={containerStyle}
    >
      {items.map((item, index) => (
        <motion.div
          key={index}
          className={cn("absolute shadow-2xl shadow-black", cardClassName)}
          style={{
            ...baseCardStyle,
            perspective: "1000px",
          }}
          initial={false}
          animate={{
            left: `${getCardPosition(index)}px`,
            zIndex: hoveredIndex === index ? 50 : index,
            rotateY: hoveredIndex === index ? 0 : index % 2 === 0 ? 2 : -2,
          }}
          transition={
            {
              ...animationConfig.transition,
              rotateY: { duration: 0.3 },
            } as any
          }
          onHoverStart={() => handleHoverStart(index)}
          onHoverEnd={handleHoverEnd}
        >
          {renderItem(item, index)}
        </motion.div>
      ))}
    </div>
  );
}

// 使用 memo 包装整个组件
export default React.memo(OverlappingCards);
