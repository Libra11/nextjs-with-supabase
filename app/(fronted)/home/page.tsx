/**
 * Author: Libra
 * Date: 2025-03-07 17:42:40
 * LastEditors: Libra
 * Description:
 */

"use client";
import LetterGlitch from "@/components/blocks/Backgrounds/LetterGlitch/LetterGlitch";
import GradientText from "@/components/blocks/TextAnimations/GradientText/GradientText";
import { Typewriter } from "@/components/ui/typewriter-text";
import { Satisfy, Saira } from "next/font/google";
import { useEffect, useRef, useState } from "react";
import VariableProximity from "@/components/blocks/TextAnimations/VariableProximity/VariableProximity";
import Marquee from "react-fast-marquee";
import { icons } from "@/icons.config";

const satisfy = Satisfy({
  subsets: ["latin"],
  weight: ["400"],
});

const saira = Saira({
  subsets: ["latin"],
  weight: ["400"],
});

export default function Home() {
  const containerRef = useRef(null);
  const [loadedIcons, setLoadedIcons] = useState<Record<string, any>>({});

  useEffect(() => {
    console.log("nextjs 15");
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
    <div className="w-full h-full py-6 md:py-8 md:mt-[150px]">
      {/* 主要内容区域 - 移动端上下布局，桌面端左右布局 */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-8 md:gap-4">
        {/* 左侧内容 */}
        <div className="w-full md:w-[560px]">
          <div
            className={`${satisfy.className} text-2xl md:text-4xl font-bold flex flex-wrap md:flex-nowrap items-center gap-2 justify-start italic`}
          >
            <span className="text-3xl md:text-5xl font-bold">A</span>
            <GradientText
              colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]}
              animationSpeed={3}
              showBorder={false}
              className="font-bold text-3xl md:text-5xl"
            >
              creative developer
            </GradientText>
          </div>
          <Typewriter
            text={["<Developer />"]}
            speed={100}
            loop={true}
            className={`${saira.className} text-xl md:text-2xl font-medium my-3 md:my-4 block text-green-500`}
          />
          <div
            ref={containerRef}
            style={{ position: "relative" }}
            className="text-base md:text-lg text-gray-500"
          >
            <VariableProximity
              label={
                "我是Libra，一个创意开发者，我擅长设计impactful,mission-focused websites，驱动结果和实现业务目标。"
              }
              className={"variable-proximity-demo"}
              fromFontVariationSettings="'wght' 400, 'opsz' 9"
              toFontVariationSettings="'wght' 1000, 'opsz' 40"
              containerRef={containerRef}
              radius={100}
              falloff="linear"
            />
          </div>
        </div>

        {/* 右侧内容 */}
        <div className="w-full h-[250px] md:w-[600px] md:h-[300px]">
          <LetterGlitch
            glitchSpeed={50}
            centerVignette={true}
            outerVignette={true}
            smooth={true}
            glitchColors={["#2b4539", "#61dca3", "#61b3dc"]}
          />
        </div>
      </div>

      {/* Marquee 区域 */}
      <div className="relative mt-8 md:mt-16">
        <div className="absolute left-0 w-16 md:w-32 h-full bg-gradient-to-r from-[hsl(var(--background))] to-transparent z-10"></div>
        <div className="absolute right-0 w-16 md:w-32 h-full bg-gradient-to-l from-[hsl(var(--background))] to-transparent z-10"></div>
        <Marquee speed={40} className="py-2">
          {Object.entries(loadedIcons).map(([icon, IconComponent]) => (
            <div
              key={icon}
              className="mx-3 md:mx-4 flex items-center gap-1 md:gap-2 bg-gray-900 rounded-full px-3 md:px-5 py-1.5 md:py-2"
            >
              <IconComponent className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-xs md:text-sm">{icon}</span>
            </div>
          ))}
        </Marquee>
      </div>
    </div>
  );
}
