/**
 * Author: Libra
 * Date: 2025-03-16
 * LastEditors: Libra
 * Description: 炫酷动画Logo组件
 */
"use client";

import { useState, useEffect } from "react";
import {
  motion,
  useAnimationControls,
  MotionConfig,
  Variants,
} from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";

interface AnimatedLogoProps {
  href?: string;
  className?: string;
}

export function AnimatedLogo({
  href = "/",
  className = "",
}: AnimatedLogoProps) {
  const controls = useAnimationControls();
  const [isHovered, setIsHovered] = useState(false);
  const { theme, systemTheme } = useTheme();
  const [particles, setParticles] = useState<
    Array<{ id: number; top: number; left: number }>
  >([]);
  const [mounted, setMounted] = useState(false);

  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDarkTheme = mounted ? currentTheme === "dark" : false;

  useEffect(() => {
    setMounted(true);
    controls.start("active");

    // 只在客户端运行时初始化粒子
    if (typeof window !== "undefined") {
      const initialParticles = Array.from({ length: 5 }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
      }));
      setParticles(initialParticles);

      const particleInterval = setInterval(() => {
        setParticles((prev) =>
          prev.map((p) => ({
            ...p,
            top: Math.random() * 100,
            left: Math.random() * 100,
          }))
        );
      }, 3000);

      return () => clearInterval(particleInterval);
    }
  }, [controls]);

  const handleHoverStart = () => {
    setIsHovered(true);
    controls.start("hover");
  };

  const handleHoverEnd = () => {
    setIsHovered(false);
    controls.start("active");
  };

  const logoVariants: Variants = {
    initial: {
      rotate: 0,
      scale: 1,
    },
    active: {
      rotate: [0, -2, 2, -1, 1, 0],
      scale: [1, 1.05, 1],
      transition: {
        rotate: {
          duration: 5,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "reverse",
        },
        scale: {
          duration: 3,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "reverse",
        },
      },
    },
    hover: {
      rotate: [0, -5, 5, -3, 3, 0],
      scale: 1.1,
      transition: {
        rotate: {
          duration: 0.8,
          ease: "easeInOut",
        },
        scale: {
          duration: 0.3,
          ease: "easeOut",
        },
      },
    },
  };

  const glowVariants: Variants = {
    initial: {
      opacity: 0.4,
      scale: 1.1,
    },
    active: {
      scale: [1.1, 1.3, 1.1],
      opacity: [0.4, 0.65, 0.4],
      transition: {
        duration: 4,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse",
      },
    },
    hover: {
      opacity: 0.8,
      scale: 1.5,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  };

  const ringVariants: Variants = {
    initial: {
      opacity: 0,
      scale: 0.8,
      rotate: 0,
    },
    active: {
      opacity: [0.3, 0.6, 0.3],
      scale: [0.95, 1.1, 0.95],
      rotate: [0, 180, 360],
      transition: {
        opacity: {
          duration: 3,
          repeat: Infinity,
          repeatType: "reverse",
        },
        scale: {
          duration: 3,
          repeat: Infinity,
          repeatType: "reverse",
        },
        rotate: {
          duration: 10,
          repeat: Infinity,
          ease: "linear",
        },
      },
    },
    hover: {
      opacity: 0.9,
      scale: 1.15,
      rotate: 90,
      transition: { duration: 0.3 },
    },
  };

  // 预定义的粒子动画，而不是每次使用随机值
  const particleVariantsByIndex = [
    { x: [-10, 10, -10], y: [-12, 8, -12], scale: [0, 0.7, 0], delay: 0 },
    { x: [8, -5, 8], y: [5, -10, 5], scale: [0, 0.8, 0], delay: 0.3 },
    { x: [-5, 15, -5], y: [10, -5, 10], scale: [0, 0.6, 0], delay: 0.1 },
    { x: [12, -8, 12], y: [-8, 12, -8], scale: [0, 0.9, 0], delay: 0.4 },
    { x: [0, -12, 0], y: [-15, 0, -15], scale: [0, 0.7, 0], delay: 0.2 },
  ];

  // 不再使用随机值定义粒子变体
  const getParticleVariants = (index: number) => {
    const preset =
      particleVariantsByIndex[index % particleVariantsByIndex.length];
    return {
      initial: {
        x: 0,
        y: 0,
        opacity: 0,
        scale: 0,
      },
      animate: {
        x: preset.x,
        y: preset.y,
        opacity: [0, 0.7, 0],
        scale: preset.scale,
        transition: {
          x: {
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: preset.delay,
          },
          y: {
            duration: 2.5,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: preset.delay,
          },
          opacity: {
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: preset.delay,
          },
          scale: {
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: preset.delay,
          },
        },
      },
    };
  };

  // 初始静态粒子位置，避免在服务器端使用随机值
  const staticParticlePositions = [
    { id: 0, top: 20, left: 80 },
    { id: 1, top: 65, left: 70 },
    { id: 2, top: 75, left: 30 },
    { id: 3, top: 30, left: 20 },
    { id: 4, top: 50, left: 50 },
  ];

  // 如果组件还没挂载，使用静态粒子位置，否则使用动态生成的粒子
  const displayParticles = mounted
    ? particles.length > 0
      ? particles
      : staticParticlePositions
    : staticParticlePositions;

  // 如果组件还没挂载，返回一个占位符，避免水合不匹配
  if (!mounted) {
    return (
      <Link href={href}>
        <div className={`relative ${className}`}>
          <div className="relative z-10 w-12 h-12 flex items-center justify-center">
            <Image
              src="/logo.svg"
              alt="logo"
              width={60}
              height={60}
              priority
              className="w-full h-full object-contain relative z-10"
            />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={href}>
      <MotionConfig reducedMotion="user">
        <div className={`relative ${className}`}>
          {/* Backdrop glow effect */}
          <motion.div
            className="absolute -inset-2 rounded-full blur-sm z-0 pointer-events-none"
            style={{
              background: isDarkTheme
                ? "radial-gradient(circle, rgba(59,130,246,0.6) 0%, rgba(147,51,234,0.35) 60%, rgba(0,0,0,0) 100%)"
                : "radial-gradient(circle, rgba(59,130,246,0.35) 0%, rgba(147,51,234,0.2) 60%, rgba(0,0,0,0) 100%)",
            }}
            variants={glowVariants}
            initial="initial"
            animate={isHovered ? "hover" : "active"}
          />

          {/* Secondary outer glow for more dramatic effect */}
          <motion.div
            className="absolute -inset-3 rounded-full blur-lg opacity-40 z-0 pointer-events-none"
            style={{
              background: isDarkTheme
                ? "radial-gradient(circle, rgba(96,165,250,0.3) 0%, rgba(168,85,247,0.15) 50%, rgba(0,0,0,0) 100%)"
                : "radial-gradient(circle, rgba(96,165,250,0.2) 0%, rgba(168,85,247,0.1) 50%, rgba(0,0,0,0) 100%)",
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.35, 0.2],
              transition: {
                duration: 6,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "reverse",
              },
            }}
          />

          {/* Interactive logo container */}
          <motion.div
            className="relative z-10 w-12 h-12 flex items-center justify-center"
            variants={logoVariants}
            initial="initial"
            animate={controls}
            onHoverStart={handleHoverStart}
            onHoverEnd={handleHoverEnd}
            whileTap={{ scale: 0.95 }}
          >
            {/* Original logo image */}
            <Image
              src="/logo.svg"
              alt="logo"
              width={60}
              height={60}
              priority
              className="w-full h-full object-contain relative z-10"
            />

            {/* Rotating ring effect */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-blue-500/40"
              variants={ringVariants}
              initial="initial"
              animate={isHovered ? "hover" : "active"}
            />
          </motion.div>

          {/* Permanent particle effects */}
          {displayParticles.map((particle, i) => {
            const variants: any = getParticleVariants(i);
            return (
              <motion.div
                key={`particle-${particle.id}`}
                className="absolute w-1.5 h-1.5 rounded-full bg-blue-500/70"
                style={{
                  top: `${particle.top}%`,
                  left: `${particle.left}%`,
                }}
                variants={variants}
                initial="initial"
                animate="animate"
              />
            );
          })}
        </div>
      </MotionConfig>
    </Link>
  );
}
