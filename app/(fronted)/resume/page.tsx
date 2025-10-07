/**
 * Author: Libra
 * Date: 2025-03-08 22:45:45
 * LastEditors: Libra
 * Description:
 */
"use client";

import { Badge } from "@/components/ui/badge";
import type { LucideIcon } from "lucide-react";
import {
  Award,
  Briefcase,
  CircleUser,
  FolderGit,
  Gauge,
  GraduationCap,
  Heart,
  Languages,
  Mail,
  MapPin,
  Monitor,
  PenTool,
  Phone,
  Server,
  Wrench,
  Github,
  Globe,
  Share2,
} from "lucide-react";

type ContactItem = {
  label: string;
  href?: string;
  icon?: LucideIcon;
};

type SkillSection = {
  title: string;
  items: string[];
  icon: LucideIcon;
};

type ProjectOverview = {
  name: string;
  stack: string;
  highlight: string;
  link?: string;
};

type DetailedProject = {
  name: string;
  stack: string;
  summary?: string;
  bullets: string[];
  meta?: string[];
  extraSections?: { title: string; items: string[] }[];
};

const contactItems: ContactItem[] = [
  { label: "北京，中国", icon: MapPin },
  {
    label: "libra085925@gmail.com",
    href: "mailto:libra085925@gmail.com",
    icon: Mail,
  },
  {
    label: "+86 176 3663 6079",
    href: "tel:+8617636636079",
    icon: Phone,
  },
  { label: "GitHub", href: "https://github.com/Libra11", icon: Github },
  { label: "个人网站", href: "https://penlibra.xin/", icon: Globe },
];

const summaryItems: string[] = [
  "负责并交付 15+ 个 Web / 桌面端项目，覆盖教育考试、效率工具、知识分享等业务，稳定支撑万量级真实用户",
  "擅长将设计系统落地为像素级体验，结合性能预算、监控与骨架屏策略，将核心流程首屏时间控制在 2s 内",
  "在 React、Vue 2/3、Next.js、Electron、NestJS 生态深耕，跨栈协作涉及 Supabase、PostgreSQL、Docker、CI/CD 等全链路",
  "推动团队建立自动化测试与质量规范，实践 a11y / 性能巡检与知识分享，持续提升交付效率与一致性",
];

const skillSections: SkillSection[] = [
  {
    title: "前端与交互",
    items: [
      "React · Vue 2/3 · Next.js 14/15",
      "Tailwind CSS · shadcn/ui · Framer Motion",
      "组件库设计与 Design System 落地",
      "复杂动效与像素级交互实现",
    ],
    icon: PenTool,
  },
  {
    title: "全栈与客户端",
    items: [
      "Node.js · NestJS · Prisma",
      "Electron 桌面端构建与自动更新",
      "Supabase · PostgreSQL 数据建模",
      "OpenAI / Google Generative AI 集成",
    ],
    icon: Server,
  },
  {
    title: "工程化与质量",
    items: [
      "TypeScript · 强类型约束",
      "Webpack · Vite 构建优化",
      "ESLint · Prettier · Husky · Git Hooks",
      "Vitest · Cypress · 端到端测试",
    ],
    icon: Wrench,
  },
  {
    title: "性能与体验",
    items: [
      "性能预算制定与监控",
      "离线优先 · IndexedDB · 缓存策略",
      "可访问性 (a11y) 审查",
      "DevOps 协同 · Docker 化部署",
    ],
    icon: Gauge,
  },
];

const selectedProjects: ProjectOverview[] = [
  {
    name: "个人网站",
    stack: "Next.js 15 · Tailwind CSS · Supabase · PostgreSQL",
    highlight: "个人品牌与作品集平台，支持 Markdown 博客、标签检索与自动化部署",
    link: "https://penlibra.xin/",
  },
  {
    name: "工具客户端",
    stack: "React · Electron · shadcn/ui",
    highlight:
      "跨平台文件处理桌面应用，提供 20+ 媒体转换、批处理与考试资料工具",
    link: "https://github.com/Libra11/file-toolkit",
  },
  {
    name: "AI / 算法集成网站",
    stack: "React · Prisma · shadcn/ui · PostgreSQL",
    highlight: "聚合 AI 助手与算法可视化，整合登录、订阅及实时推送服务",
    link: "https://tool.penlibra.xin/",
  },
];

const personalProjects: DetailedProject[] = [
  {
    name: "Libra 文件工具箱",
    stack: "Electron · React 18 · TypeScript · Tailwind CSS · FFmpeg",
    bullets: [
      "端到端负责产品规划与实现，Electron + React 构建跨平台文件处理桌面应用",
      "封装 FFmpeg / Sharp 多进程流水线，覆盖 20+ 媒体格式转换、批处理与智能压缩",
      "引入自动更新、国际化与 Tailwind 主题系统，将版本迭代周期缩短至 1 周内",
    ],
  },
  {
    name: "LibraSpace 全栈学习平台",
    stack: "Next.js 14 · TypeScript · Prisma · NextAuth · OpenAI API",
    bullets: [
      "搭建 Next.js 14 + Prisma + Supabase 架构，整合算法练习、英语工具与 AI 聊天等学习模块",
      "实现邮箱验证、密码重置、角色权限等认证流程，结合 NextAuth 与 OpenAI / Google AI 能力",
      "设计 Framer Motion 动画与云存储音视频管线，提供学习进度追踪与多终端响应式体验",
    ],
  },
  {
    name: "个人博客与美食分享平台",
    stack:
      "Next.js 15 · TypeScript · Supabase · PostgreSQL · Tailwind CSS · Framer Motion",
    bullets: [
      "使用 Next.js 15 + Supabase 构建多内容类型平台，支撑菜谱、博客、文件存储等场景",
      "实现无限滚动、拖拽上传、主题切换等交互，优化创作者内容管理效率",
      "建立标签与权限模型及 Supabase 实时能力，保障多角色协作与数据一致性",
    ],
  },
];

const companyProjects: DetailedProject[] = [
  {
    name: "国考云考试机客户端",
    stack: "Vue 3 · TypeScript · Vite · Electron 21.x · Pinia · Tailwind CSS",
    summary:
      "面向国家级考试场景的桌面端客户端，覆盖考试全流程，需兼顾高并发、高可靠与严格的安全合规要求。",
    meta: ["职责：前端技术负责人", "周期：2021 — 至今", "场景：国家级考试中心"],
    bullets: [
      "主导 Vue 3 + Electron 模块化架构与 TypeScript 规范，支撑主/副监考、考生端协同",
      "构建离线优先策略与 IndexedDB 数据同步，保障断网续考与万量级考生状态持久化",
      "设计多角色权限体系、科学计算器、复杂题型编辑等核心功能，覆盖完整考试流程",
      "引入 Vitest + Cypress + CI/CD 流程，结合 ESLint / Husky 构建全链路自动化发布",
    ],
    extraSections: [
      {
        title: "多层级实时通信",
        items: [
          "基于 Socket.IO 搭建服务端→考机、一级→二级管理、主进程↔渲染进程三层拓扑",
          "心跳检测 + 自动重连保障链路稳定，统一消息协议覆盖考生数据、考场态势",
        ],
      },
      {
        title: "可靠性与安全",
        items: [
          "实现连接状态追踪与超时恢复策略，确保异常场景快速回收与重连",
          "结合 IP 白名单、身份校验、XXTEA 加密，满足国家级考试安全要求",
        ],
      },
    ],
  },
  {
    name: "在线考试报名管理系统",
    stack: "Vue 3 · TypeScript · Vite · Element Plus · Tailwind CSS · Pinia",
    summary:
      "面向教育培训机构的在线考试报名平台，覆盖报名、缴费、预约、成绩、证书的全流程数字化体验。",
    meta: ["职责：前端负责人", "周期：2020 — 2021", "场景：教育培训机构"],
    bullets: [
      "搭建 Vue 3 + Vite + Element Plus 架构体系，支持多租户主题与组件按需加载",
      "实现 JSON 驱动的动态表单引擎，自研 10+ 基础组件支持联动校验与分组布局",
      "串联报名、资格审核、缴费、准考证打印、成绩、公示等业务流程，实现流程自动化",
      "结合 Pinia 持久化与 MQTT 实时推送，构建客服、消息中心与票据处理能力",
    ],
    extraSections: [
      {
        title: "动态表单核心能力",
        items: [
          "配置化生成复杂业务表单，接入身份证、手机号等行业校验规则",
          "移动端优先设计，组件自适应不同终端确保一致输入体验",
        ],
      },
      {
        title: "体验与性能",
        items: [
          "通过路由懒加载、资源拆分与缓存策略，优化首屏与交互响应",
          "结合 HTML2Canvas、jsPDF、QRCode 提供 PDF、票据、二维码等一站式输出",
        ],
      },
    ],
  },
  {
    name: "国考云在线考试系统（桌面端）",
    stack:
      "Vue 2.6 · Electron 12 · Vue Router · Vuex · Agora RTC · TRTC · MQTT",
    summary:
      "跨平台桌面端考试系统，集成实时音视频监控、防作弊与自动更新能力，支撑多考场协同。",
    meta: ["职责：前端核心开发", "周期：2018 — 2020", "场景：跨平台桌面考试"],
    bullets: [
      "负责 Electron + Vue 2 架构落地，支持 Windows / macOS / Web 多端发布与自动更新",
      "集成 Agora / 腾讯云 TRTC 音视频、Face-API.js 人脸识别及快捷键防护，实现实时监考",
      "实现多题型题库编辑、设备检测、黑名单管理等模块，保障考试流程合规稳定",
      "优化构建与按需加载策略，缩小安装包体积并提升增量发布效率",
    ],
  },
];

const personalInfo = {
  languages: ["中文（母语）", "英语"],
  interests: ["游戏", "UI 设计", "3D 打印"],
  community: [
    "开源：Libra 文件工具箱（Electron 跨平台文件处理套件）",
    "写作：维护 penlibra.xin 技术博客，沉淀前端架构与性能实践",
  ],
} as const;

const SectionTitle = ({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon?: LucideIcon;
}) => (
  <div className="flex items-center gap-3">
    {Icon && (
      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
    )}
    <h2 className="title-gradient text-xl md:text-2xl !m-0">{children}</h2>
  </div>
);

export default function Resume() {
  return (
    <div className="mx-auto max-w-[1100px] px-0 md:px-6 lg:px-0 py-10 md:py-16 !pt-0 space-y-12">
      <header className="relative overflow-hidden rounded-xl border border-primary/10 bg-gradient-to-br from-zinc-900/80 via-zinc-950 to-black shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(79,70,229,0.25),transparent_60%)]" />
        <div className="relative z-10 flex flex-col gap-6 p-8 md:p-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                Libra ｜ 前端工程师
              </h1>
              <p className="text-base md:text-lg text-muted-foreground">
                擅长以工程化思维将体验设计落地为高性能产品，专注于前端架构、实时通信与桌面端研发。
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="border-primary/40 text-primary"
                >
                  7+ 年经验 · 前端 / 全栈
                </Badge>
                <Badge
                  variant="outline"
                  className="border-primary/40 text-primary"
                >
                  架构设计 · 可访问性 · 性能优化
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm md:text-base text-primary/90">
              {contactItems.map((item) =>
                item.href ? (
                  <a
                    key={item.label}
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={
                      item.href.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                    className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 transition-colors hover:bg-primary/10"
                  >
                    {item.icon && (
                      <item.icon className="h-4 w-4 text-primary" />
                    )}
                    {item.label}
                  </a>
                ) : (
                  <span
                    key={item.label}
                    className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5"
                  >
                    {item.icon && (
                      <item.icon className="h-4 w-4 text-primary" />
                    )}
                    {item.label}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="space-y-6">
        <SectionTitle icon={CircleUser}>个人简介</SectionTitle>
        <div className="rounded-xl border border-primary/10 bg-card/70 backdrop-blur-md p-6 md:p-8">
          <ul className="space-y-3 text-sm md:text-base leading-relaxed text-muted-foreground">
            {summaryItems.map((item) => (
              <li key={item} className="pl-5 relative">
                <span className="absolute left-0 top-2 w-2 h-2 rounded-full bg-primary/70" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-6">
        <SectionTitle icon={Monitor}>核心技能</SectionTitle>
        <div className="grid gap-5 md:grid-cols-2">
          {skillSections.map((section) => (
            <div
              key={section.title}
              className="group relative overflow-hidden rounded-xl border border-primary/10 bg-card/60 p-6 transition-shadow hover:shadow-lg hover:shadow-primary/10"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
                    <section.icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-lg font-semibold">{section.title}</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 block h-2 w-2 rounded-full bg-primary/60" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionTitle icon={GraduationCap}>教育背景</SectionTitle>
        <div className="rounded-xl border border-primary/10 bg-gradient-to-br from-zinc-900/60 via-zinc-950 to-black p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-4">
            <div>
              <h3 className="text-lg md:text-xl font-semibold">
                山西大学（双一流） · 计算机科学与技术
              </h3>
              <p className="text-sm text-muted-foreground">
                高考 580+ · 扎实的计算机与算法基础
              </p>
            </div>
            <div className="text-sm md:text-base text-primary/80">
              2014 — 2018
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <SectionTitle icon={Award}>精选项目</SectionTitle>
        <div className="overflow-hidden rounded-xl border border-primary/10 bg-card/80 backdrop-blur-lg">
          <table className="min-w-full divide-y divide-primary/15 text-sm md:text-base">
            <thead className="bg-primary/10 uppercase tracking-wide text-xs md:text-sm text-primary">
              <tr>
                <th className="px-6 py-4 text-left font-medium">项目</th>
                <th className="px-6 py-4 text-left font-medium">亮点</th>
                <th className="px-6 py-4 text-left font-medium">主要技术</th>
                <th className="px-6 py-4 text-left font-medium">体验地址</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10 text-muted-foreground">
              {selectedProjects.map((project) => (
                <tr
                  key={project.name}
                  className="transition-colors hover:bg-primary/5"
                >
                  <td className="px-6 py-4 font-medium text-foreground">
                    {project.name}
                  </td>
                  <td className="px-6 py-4 text-foreground/80">
                    {project.highlight}
                  </td>
                  <td className="px-6 py-4">{project.stack}</td>
                  <td className="px-6 py-4">
                    {project.link ? (
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline underline-offset-4 hover:text-primary/80"
                      >
                        {project.link.replace(/^https?:\/\//, "")}
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-6">
        <SectionTitle icon={FolderGit}>个人项目</SectionTitle>
        <div className="grid gap-5 md:grid-cols-2">
          {personalProjects.map((project) => (
            <div
              key={project.name}
              className="rounded-xl border border-primary/10 bg-card/70 p-6 md:p-7 space-y-4 transition-colors hover:border-primary/30"
            >
              <div className="flex flex-col gap-1">
                <h3 className="text-lg md:text-xl font-semibold">
                  {project.name}
                </h3>
                <span className="text-xs md:text-sm uppercase tracking-wide text-primary/80">
                  {project.stack}
                </span>
              </div>
              <ul className="space-y-2.5 text-sm text-muted-foreground leading-relaxed">
                {project.bullets.map((bullet) => (
                  <li key={bullet} className="pl-5 relative">
                    <span className="absolute left-0 top-2 h-2 w-2 rounded-full bg-primary/60" />
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionTitle icon={Briefcase}>公司项目</SectionTitle>
        <div className="space-y-6">
          {companyProjects.map((project) => (
            <div
              key={project.name}
              className="rounded-xl border border-primary/10 bg-gradient-to-br from-zinc-900/70 via-zinc-950 to-black p-6 md:p-8 space-y-5"
            >
              <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-3">
                <h3 className="text-lg md:text-xl font-semibold">
                  {project.name}
                </h3>
                <span className="text-xs md:text-sm uppercase tracking-wide text-primary/70">
                  {project.stack}
                </span>
              </div>
              {project.meta && project.meta.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs md:text-sm text-primary/70">
                  {project.meta.map((meta) => (
                    <span
                      key={meta}
                      className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1"
                    >
                      {meta}
                    </span>
                  ))}
                </div>
              )}
              {project.summary && (
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {project.summary}
                </p>
              )}
              <ul className="space-y-2.5 text-sm md:text-base text-muted-foreground leading-relaxed">
                {project.bullets.map((bullet) => (
                  <li key={bullet} className="pl-5 relative">
                    <span className="absolute left-0 top-2 h-2 w-2 rounded-full bg-primary/60" />
                    {bullet}
                  </li>
                ))}
              </ul>
              {project.extraSections?.map((section) => (
                <div
                  key={section.title}
                  className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-4 md:px-5 md:py-5 space-y-2.5"
                >
                  <p className="text-xs md:text-sm font-semibold uppercase tracking-wide text-primary">
                    {section.title}
                  </p>
                  <ul className="space-y-2 text-xs md:text-sm text-primary/80">
                    {section.items.map((item) => (
                      <li key={item} className="pl-4 relative">
                        <span className="absolute left-0 top-2 h-1.5 w-1.5 rounded-full bg-primary/60" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionTitle icon={Languages}>个人信息</SectionTitle>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-primary/10 bg-card/70 p-5 space-y-3">
            <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
              <Languages className="h-4 w-4 text-primary" />
              语言
            </p>
            <div className="flex flex-wrap gap-2">
              {personalInfo.languages.map((language) => (
                <Badge
                  key={language}
                  variant="outline"
                  className="border-primary/40 text-primary"
                >
                  {language}
                </Badge>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-primary/10 bg-card/70 p-5 space-y-3">
            <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
              <Heart className="h-4 w-4 text-primary" />
              兴趣
            </p>
            <div className="flex flex-wrap gap-2">
              {personalInfo.interests.map((interest) => (
                <Badge
                  key={interest}
                  variant="outline"
                  className="border-primary/40 text-primary"
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-primary/10 bg-card/70 p-5 space-y-3">
            <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
              <Share2 className="h-4 w-4 text-primary" />
              社区 & 分享
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {personalInfo.community.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-primary/60" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
