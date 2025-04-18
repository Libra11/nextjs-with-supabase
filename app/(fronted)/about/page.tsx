/**
 * Author: Libra
 * Date: 2025-03-08 22:46:12
 * LastEditors: Libra
 * Description: 关于页面
 */
"use client";

import { useState, useEffect, useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import Image from "next/image";
import {
  Github,
  Mail,
  BookOpen,
  ExternalLink,
  MousePointerClick,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Meteors } from "@/components/ui/meteors";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

// 关于我的内容
const aboutContent = {
  name: "Libra",
  avatar:
    "https://api.penlibra.xin/storage/v1/object/public/libra-bucket/covers/z0rzlcz3q5w4.jpg",
  bio: "嗨，我是 Libra，一个热爱技术、阅读和创作的程序员。这个博客是我分享思考和记录成长的地方，希望能与你产生共鸣。",
  contact: {
    email: "libra085925@gmail.com",
    github: "https://github.com/Libra11",
    website: "https://penlibra.xin",
  },
};

// 页面组件
export default function About() {
  const [mounted, setMounted] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  const containerRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [hovered, setHovered] = useState(false);
  const [sparkPosition, setSparkPosition] = useState({ x: 0, y: 0 });
  const [showSparks, setShowSparks] = useState(false);

  // 滚动效果
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // 鼠标移动效果
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mouseX.set(x);
    mouseY.set(y);
  };

  // 鼠标跟踪平滑动画
  const springConfig = { damping: 25, stiffness: 200 };
  const xSpring = useSpring(mouseX, springConfig);
  const ySpring = useSpring(mouseY, springConfig);

  // 生成随机星星效果
  const createSparks = (x, y) => {
    setSparkPosition({ x, y });
    setShowSparks(true);
    setTimeout(() => setShowSparks(false), 1000);
  };

  // 确保组件挂载后再渲染，避免SSR与客户端渲染不匹配
  useEffect(() => {
    setMounted(true);

    // 添加全局鼠标移动监听
    const handleGlobalMouseMove = (e) => {
      if (Math.random() > 0.98) {
        // 偶尔生成星星
        createSparks(e.clientX, e.clientY);
      }
    };

    window.addEventListener("mousemove", handleGlobalMouseMove);
    return () => window.removeEventListener("mousemove", handleGlobalMouseMove);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-20 w-20 rounded-full" />
      </div>
    );
  }

  // 确定使用的主题颜色
  const currentTheme = resolvedTheme || theme;
  const isDark = currentTheme === "dark";

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-background via-background to-background"
      onMouseMove={handleMouseMove}
    >
      {/* 交互式背景元素 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute w-full h-full bg-grid-small-white/[0.2] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
        </div>

        {/* 跟随鼠标的发光元素 */}
        <motion.div
          className="absolute w-[40vw] h-[40vw] rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 blur-3xl pointer-events-none"
          style={{
            x: xSpring,
            y: ySpring,
            translateX: "-50%",
            translateY: "-50%",
          }}
        />

        {/* 随机星星效果 */}
        <AnimatePresence>
          {showSparks && (
            <motion.div
              className="absolute pointer-events-none z-10"
              style={{ left: sparkPosition.x, top: sparkPosition.y }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Sparkles className="text-purple-500 w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 内容容器 */}
      <div className="relative z-10 pt-24 pb-32 flex flex-col items-center justify-center gap-32">
        {/* 页面标题 - 3D变换效果 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="relative text-center"
        >
          <motion.h1
            className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-blue-500 via-purple-600 to-blue-600 mb-4 px-4"
            initial={{ backgroundPosition: "0% 50%" }}
            animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
            transition={{ duration: 10, repeat: Infinity }}
          >
            关于我
          </motion.h1>
          <motion.div
            className="h-1 w-32 mx-auto bg-gradient-to-r from-blue-600 to-purple-600"
            animate={{ width: ["0%", "80%", "60%", "80%"] }}
            transition={{ duration: 5, repeat: Infinity }}
          />
        </motion.div>

        {/* 个人简介 - 浮动3D卡片效果 */}
        <div className="perspective-1000 w-full max-w-5xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            className="relative overflow-hidden rounded-3xl shadow-2xl transform-gpu"
            style={{
              transformStyle: "preserve-3d",
              backgroundImage: `radial-gradient(circle at center, ${isDark ? "rgba(30, 30, 30, 0.8)" : "rgba(255, 255, 255, 0.9)"}, ${isDark ? "rgba(20, 20, 20, 0.6)" : "rgba(245, 245, 245, 0.7)"})`,
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              boxShadow: isDark
                ? "0 0 40px 5px rgba(124, 58, 237, 0.15), 0 0 15px 2px rgba(96, 165, 250, 0.1)"
                : "0 0 40px 5px rgba(124, 58, 237, 0.1), 0 0 15px 2px rgba(96, 165, 250, 0.08)",
            }}
          >
            {/* 背景装饰元素 */}
            <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-blue-600/10 blur-2xl" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-purple-600/10 blur-2xl" />

            <div className="p-8 md:p-12 flex flex-col md:flex-row gap-12 items-center">
              {/* 头像区域 - 3D 悬浮效果 */}
              <motion.div
                className="relative shrink-0 z-10"
                animate={{
                  rotateY: hovered ? [0, 5, 0, -5, 0] : 0,
                  rotateX: hovered ? [0, 5, 0, -5, 0] : 0,
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  repeatType: "mirror",
                }}
              >
                <div className="relative">
                  {/* 光环效果 */}
                  <motion.div
                    className="absolute -inset-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 opacity-70 blur-md"
                    animate={{
                      scale: [1, 1.05, 1],
                      opacity: [0.6, 0.8, 0.6],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />

                  {/* 主头像容器 */}
                  <div className="relative w-40 h-40 md:w-52 md:h-52 rounded-full border-4 border-background overflow-hidden shadow-xl">
                    <Image
                      src={aboutContent.avatar}
                      alt={aboutContent.name}
                      fill
                      sizes="(max-width: 768px) 160px, 208px"
                      className="object-cover"
                      priority
                    />

                    {/* 头像叠加的渐变光效 */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/20 mix-blend-overlay" />
                  </div>

                  {/* 旋转的装饰线条 */}
                  <motion.div
                    className="absolute -inset-4 rounded-full border-2 border-dashed border-purple-500/30"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                </div>

                {/* 头像下方的装饰元素 */}
                <motion.div
                  className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3/4 h-4 bg-gradient-to-r from-blue-500/40 to-purple-600/40 rounded-full blur-md"
                  animate={{
                    width: ["60%", "75%", "60%"],
                    opacity: [0.3, 0.7, 0.3],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>

              {/* 个人介绍内容 */}
              <motion.div
                className="relative z-10 text-center md:text-left space-y-6 max-w-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <div className="relative">
                  <motion.h2
                    className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"
                    initial={{ backgroundPosition: "0% 50%" }}
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{ duration: 5, repeat: Infinity }}
                  >
                    {aboutContent.name}
                  </motion.h2>
                  <motion.div
                    className="h-0.5 w-0 bg-gradient-to-r from-blue-600 to-purple-600 mt-2"
                    animate={{ width: hovered ? "100%" : "0%" }}
                    transition={{ duration: 0.5 }}
                  />
                </div>

                <motion.p
                  className="text-xl text-foreground/80 leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                >
                  {aboutContent.bio}
                </motion.p>

                <motion.div
                  className="flex flex-wrap justify-center md:justify-start gap-4 pt-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.9 }}
                >
                  <Link href={`mailto:${aboutContent.contact.email}`}>
                    <Button
                      size="lg"
                      className="relative overflow-hidden rounded-full group"
                      style={{
                        background:
                          "linear-gradient(to right, #4f46e5, #8b5cf6, #4f46e5)",
                        backgroundSize: "200% 100%",
                      }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600"
                        animate={{
                          backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"],
                        }}
                        transition={{ duration: 5, repeat: Infinity }}
                      />
                      <span className="relative flex items-center">
                        <Mail className="w-5 h-5 mr-2 " />
                        联系我
                      </span>

                      {/* 悬停时的光效 */}
                      <motion.div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white/20"
                        initial={{ scale: 0, x: "100%", y: "100%" }}
                        whileHover={{ scale: 3, x: 0, y: 0 }}
                        transition={{ duration: 0.4 }}
                        style={{
                          transformOrigin: "100% 100%",
                          borderRadius: "9999px",
                        }}
                      />
                    </Button>
                  </Link>

                  <Link
                    href={`https://${aboutContent.contact.github}`}
                    target="_blank"
                  >
                    <Button
                      size="lg"
                      variant="outline"
                      className="rounded-full border-purple-500/30 bg-background/50 backdrop-blur-sm group relative overflow-hidden"
                    >
                      <span className="relative z-10 flex items-center">
                        <Github className="w-5 h-5 mr-2 group-hover:text-purple-600 transition-colors" />
                        <span className="group-hover:text-purple-600 transition-colors">
                          Github
                        </span>
                      </span>

                      {/* 悬停时显示的背景 */}
                      <motion.div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-blue-600/10 to-purple-600/10"
                        initial={{ scale: 0, x: "-100%", y: "-100%" }}
                        whileHover={{ scale: 1, x: 0, y: 0 }}
                        transition={{ duration: 0.4 }}
                      />
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* 感谢阅读 - 宇宙特效区域 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="relative w-full max-w-5xl px-4"
        >
          <div className="relative overflow-hidden rounded-3xl">
            {/* 星空背景 */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-purple-950 to-blue-950">
              <Meteors number={20} />

              {/* 背景上的装饰星星 */}
              <div className="absolute inset-0">
                {Array.from({ length: 50 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full bg-white"
                    style={{
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      width: `${Math.max(1, Math.random() * 3)}px`,
                      height: `${Math.max(1, Math.random() * 3)}px`,
                    }}
                    animate={{
                      opacity: [0.4, Math.random() * 0.8 + 0.2, 0.4],
                      scale: [1, Math.random() * 0.5 + 0.8, 1],
                    }}
                    transition={{
                      duration: Math.random() * 3 + 2,
                      repeat: Infinity,
                      delay: Math.random() * 5,
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="relative z-10 px-8 py-20 text-center">
              <motion.div
                className="flex flex-col items-center"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  delay: 0.8,
                }}
              >
                {/* 图标容器 */}
                <div className="relative mb-8">
                  {/* 背景光环 */}
                  <motion.div
                    className="absolute -inset-6 rounded-full bg-gradient-to-r from-blue-600/30 to-purple-600/30 blur-xl"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.4, 0.8, 0.4],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />

                  {/* 图标背景 */}
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 p-0.5">
                    <div className="w-full h-full rounded-full bg-blue-950 flex items-center justify-center">
                      <motion.div
                        animate={{
                          rotate: [0, 10, 0, -10, 0],
                          scale: [1, 1.1, 1, 1.1, 1],
                        }}
                        transition={{
                          duration: 5,
                          repeat: Infinity,
                          repeatType: "mirror",
                        }}
                      >
                        <Sparkles className="w-10 h-10 text-purple-400" />
                      </motion.div>
                    </div>
                  </div>

                  {/* 装饰性光线 */}
                  {Array.from({ length: 8 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute top-1/2 left-1/2 h-0.5 bg-gradient-to-r from-blue-500 to-transparent"
                      style={{
                        width: "50px",
                        transformOrigin: "0 0",
                        rotate: `${i * 45}deg`,
                        opacity: 0.6,
                      }}
                      animate={{
                        width: ["40px", "60px", "40px"],
                        opacity: [0.3, 0.7, 0.3],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>

                <motion.h2
                  className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 glow-text-white"
                  style={{ textShadow: "0 0 20px rgba(167, 139, 250, 0.5)" }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    delay: 1,
                    duration: 0.8,
                  }}
                >
                  感谢阅读
                </motion.h2>

                <motion.p
                  className="text-xl mb-10 max-w-2xl mx-auto leading-relaxed text-blue-100"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.8 }}
                >
                  很高兴您能够浏览我的个人介绍。如果您有任何问题、想法或者合作意向，欢迎随时联系我。期待与您交流！
                </motion.p>

                <motion.div
                  className="flex flex-wrap justify-center gap-5"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.4, duration: 0.8 }}
                >
                  <Link href="/blogs">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        size="lg"
                        className="relative overflow-hidden rounded-full group px-6 py-6"
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-blue-600 via-violet-600 to-blue-600"
                          animate={{
                            backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"],
                          }}
                          transition={{ duration: 5, repeat: Infinity }}
                        />
                        <span className="relative z-10 flex items-center text-lg">
                          <BookOpen className="w-5 h-5 mr-2" />
                          探索博客
                        </span>

                        {/* 按钮上的光效 */}
                        <motion.div
                          className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-white/0 via-white/40 to-white/0 skew-x-[-20deg]"
                          initial={{ x: "-100%" }}
                          animate={{ x: "200%" }}
                          transition={{
                            repeat: Infinity,
                            repeatDelay: 3,
                            duration: 1.5,
                            ease: "easeInOut",
                          }}
                        />
                      </Button>
                    </motion.div>
                  </Link>

                  <Link href={`mailto:${aboutContent.contact.email}`}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        size="lg"
                        variant="outline"
                        className="rounded-full border-purple-400/50 backdrop-blur-sm bg-purple-950/30 text-purple-100 px-6 py-6 group"
                      >
                        <span className="relative z-10 flex items-center text-lg">
                          <ExternalLink className="w-5 h-5 mr-2 transition-transform group-hover:rotate-45" />
                          联系方式
                        </span>

                        {/* 鼠标悬停时的扩散效果 */}
                        <motion.div
                          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100"
                          initial={{ scale: 0 }}
                          whileHover={{ scale: 1 }}
                          transition={{ duration: 0.3 }}
                          style={{
                            background:
                              "radial-gradient(circle, rgba(167, 139, 250, 0.3) 0%, rgba(0,0,0,0) 70%)",
                          }}
                        />
                      </Button>
                    </motion.div>
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* 鼠标提示 */}
        <motion.div
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 text-muted-foreground flex items-center gap-2 opacity-50 hover:opacity-80 transition-opacity"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.5, y: 0 }}
          transition={{ delay: 2, duration: 0.8 }}
        >
          <MousePointerClick className="w-4 h-4" />
          <span className="text-sm">移动鼠标，探索交互效果</span>
        </motion.div>
      </div>

      {/* 自定义背景网格 */}
      <style jsx global>{`
        .bg-grid-small-white {
          background-size: 30px 30px;
          background-image:
            linear-gradient(
              to right,
              ${isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)"}
                1px,
              transparent 1px
            ),
            linear-gradient(
              to bottom,
              ${isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)"}
                1px,
              transparent 1px
            );
        }

        .glow-text-white {
          text-shadow: 0 0 20px rgba(167, 139, 250, 0.5);
        }
      `}</style>
    </div>
  );
}
