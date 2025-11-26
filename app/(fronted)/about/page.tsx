"use client";

/**
 * Author: Libra
 * Date: 2025-03-08 22:46:12
 * LastEditors: Libra
 * Description: 关于页面（2025 刷新）
 */

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Code,
  Github,
  Globe,
  Layers,
  Mail,
  MapPin,
  Rocket,
  Sparkles,
} from "lucide-react";

const heroContact = [
  { label: "北京，中国", icon: MapPin },
  {
    label: "libra085925@gmail.com",
    icon: Mail,
    href: "mailto:libra085925@gmail.com",
  },
  {
    label: "GitHub",
    icon: Github,
    href: "https://github.com/Libra11",
  },
  {
    label: "个人网站",
    icon: Globe,
    href: "https://penlibra.xin",
  },
];

const stats = [
  {
    value: "7+",
    label: "深耕 Web 与桌面端体验的年份",
  },
  {
    value: "20+",
    label: "跨团队端到端交付的产品数量",
  },
  {
    value: "3",
    label: "主导落地的设计系统与组件库",
  },
  {
    value: "2s",
    label: "关键用户路径的目标首屏时间",
  },
];

const focusAreas = [
  {
    title: "界面工程",
    description:
      "为复杂信息架构落地 pixel-perfect 体验，沉迷于动画、微交互与语义化组件。",
    icon: Sparkles,
  },
  {
    title: "性能与可靠性",
    description:
      "以性能预算、监控与 DevOps 流程保障高并发场景稳定，持续打磨体验基线。",
    icon: Rocket,
  },
  {
    title: "设计系统与开发体验",
    description:
      "搭建组件库、脚手架与规范，帮助团队在强类型与自动化测试体系下高效协作。",
    icon: Layers,
  },
  {
    title: "学习与分享",
    description:
      "乐于在博客与社区输出，整理知识地图，助力更多人拥抱现代前端与全栈能力。",
    icon: BookOpen,
  },
];

const journey = [
  {
    period: "2021 — 至今",
    role: "前端技术负责人",
    summary:
      "主导 Vue 3 + Electron 客户端架构，保障国家级考试场景的可靠性、性能与安全合规。",
    highlights: [
      "打造离线优先与断网续考机制，覆盖万量级考生",
      "设计多角色权限、实时通信与监控体系",
      "引入 Vitest + Cypress + CI/CD，全链路自动化发布",
    ],
  },
  {
    period: "2018 — 2021",
    role: "教育 & 培训行业 · 全栈开发",
    summary:
      "跨端交付报名、考试、内容平台等系统，沉淀 JSON 驱动表单引擎与可配置流程。",
    highlights: [
      "构建 Vue / React 双栈工程化体系，推行 TypeScript",
      "设计多租户组件库与主题系统，加速交付效率",
      "维护实时推送、消息与票据中心等基础能力",
    ],
  },
  {
    period: "更早之前",
    role: "自由职业 & Side Projects",
    summary:
      "在高校期间尝试多种方向——从 UI 设计、前端动效到 Electron 工具，保持好奇心与执行力。",
    highlights: [
      "发布开源跨平台文件工具箱，覆盖 20+ 媒体处理场景",
      "运营个人站点与技术博客，沉淀架构与实践经验",
      "持续探索 OpenAI / LangChain 等 AI 能力的产品化",
    ],
  },
];

const nowPlaying = [
  "研究多租户设计系统与主题管线的搭建与演进",
  "尝试 Next.js 15 + Supabase 的 RSC 优先工作流",
  "持续学习以 OpenTelemetry + ClickHouse 为核心的可观测方案",
];

export default function About() {
  return (
    <div className="mx-auto max-w-[1100px] px-4 md:px-6 lg:px-0 pt-4 pb-16 md:pt-4 md:pb-20 space-y-16">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/70 dark:border-primary/15 bg-gradient-to-br from-white via-slate-100 to-slate-200 dark:from-zinc-900/80 dark:via-zinc-950 dark:to-black shadow-[0_24px_60px_-32px_rgba(15,23,42,0.2)] dark:shadow-[0_40px_70px_-35px_rgba(15,23,42,0.55)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.15),transparent_55%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.22),transparent_55%)]" />
        <div className="relative z-10 flex flex-col gap-10 px-6 pt-10 pb-14 md:px-12 md:pt-14 md:pb-16 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-6 max-w-2xl">
            <Badge
              variant="outline"
              className="border-slate-300 text-slate-600 bg-white/80 dark:border-amber-400/30 dark:text-amber-200 dark:bg-amber-500/10"
            >
              Libra · 前端 / 全栈工程师
            </Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Libra
            </h1>
            <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              我热衷于把复杂问题拆解成清晰的界面和顺滑的用户旅程。从前端工程、桌面端客户端到
              DevOps 打造的交付流程，希望与团队一起，将美感与可维护性同等对待。
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="mailto:libra085925@gmail.com">
                <Button className="rounded-full px-5" size="lg">
                  <Mail className="w-4 h-4 mr-2" />
                  与我交流
                </Button>
              </Link>
              <Link href="https://github.com/Libra11" target="_blank">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full border-slate-300 bg-white/80 text-slate-700 hover:bg-white dark:border-amber-400/40 dark:bg-transparent dark:text-amber-200 dark:hover:bg-amber-500/10"
                >
                  <Github className="w-4 h-4 mr-2" />
                  访问 GitHub
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap gap-3 pt-4 text-sm text-slate-600 dark:text-slate-300">
              {heroContact.map(({ label, icon: Icon, href }) =>
                href ? (
                  <Link
                    key={label}
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel={
                      href.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-1.5 transition hover:border-slate-400 hover:text-slate-800 dark:border-amber-400/30 dark:bg-amber-500/5 dark:text-slate-100 dark:hover:border-amber-400/60"
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {label}
                  </Link>
                ) : (
                  <span
                    key={label}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-1.5 dark:border-amber-400/30 dark:bg-amber-500/5"
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {label}
                  </span>
                )
              )}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative mx-auto"
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400/25 via-orange-300/20 to-transparent blur-3xl" />
            <div className="relative rounded-full border-4 border-white shadow-[0_30px_60px_-35px_rgba(15,23,42,0.35)] dark:border-slate-950">
              <Image
                src="https://api.penlibra.xin/storage/v1/object/public/libra-bucket/covers/z0rzlcz3q5w4.jpg"
                alt="Libra avatar"
                width={240}
                height={240}
                className="h-[220px] w-[220px] rounded-full object-cover md:h-[240px] md:w-[240px]"
                priority
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.22)] dark:border-amber-400/20 dark:bg-zinc-900/70 dark:shadow-[0_22px_55px_-35px_rgba(15,15,15,0.65)]"
          >
            <p className="text-3xl font-semibold text-slate-900 dark:text-white">
              {item.value}
            </p>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              {item.label}
            </p>
          </div>
        ))}
      </section>

      {/* Focus areas */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h2 className="title-gradient text-xl md:text-2xl !m-0">
            我关注的方向
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {focusAreas.map(({ title, description, icon: Icon }) => (
            <div
              key={title}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-6 transition hover:-translate-y-1 hover:border-slate-400/70 hover:shadow-[0_25px_50px_-32px_rgba(15,23,42,0.28)] dark:border-amber-400/25 dark:bg-zinc-900/70 dark:hover:border-amber-400/40"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:bg-amber-500/15 dark:text-amber-200">
                  <Icon className="w-6 h-6" />
                </span>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Journey */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Code className="w-5 h-5 text-amber-400" />
          <h2 className="title-gradient text-xl md:text-2xl !m-0">
            历程与影响
          </h2>
        </div>
        <div className="space-y-5">
          {journey.map(({ period, role, summary, highlights }) => (
            <div
              key={role}
              className="rounded-2xl border border-slate-200 bg-white/85 p-6 md:p-7 shadow-[0_24px_45px_-32px_rgba(15,23,42,0.2)] dark:border-amber-400/25 dark:bg-zinc-900/70"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-baseline md:justify-between">
                <span className="text-sm font-medium uppercase tracking-wide text-amber-600 dark:text-amber-300">
                  {period}
                </span>
                <h3 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-white">
                  {role}
                </h3>
              </div>
              <p className="mt-4 text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                {summary}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                {highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Current focus */}
      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white/85 p-6 md:p-7 dark:border-amber-400/20 dark:bg-zinc-900/70">
          <div className="flex items-center gap-3">
            <Rocket className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Now · 正在专注
            </h2>
          </div>
          <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {nowPlaying.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-amber-400 dark:bg-amber-300" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-amber-400/15 via-orange-300/10 to-transparent p-6 md:p-7 dark:border-amber-400/25 dark:from-amber-400/25 dark:via-amber-500/10">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              想了解更多？
            </h2>
          </div>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            我的博客记录了性能优化、架构经验、设计系统笔记以及 Electron /
            Supabase 的踩坑。欢迎订阅或留言交流。
          </p>
          <div className="mt-5">
            <Link href="/blogs">
              <Button
                variant="outline"
                className="rounded-full border-amber-400/40 text-amber-300 hover:bg-amber-500/10"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                阅读最新博文
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
