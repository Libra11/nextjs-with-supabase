# LibraSpace 全栈知识空间

> 基于 **Next.js 16 + Supabase** 构建的个人知识与内容聚合平台，集文章创作、算法演练、作品集、多媒体管理于一体。

**[项目预览链接](https://penlibra.xin)**

## 📚 目录

- [项目简介](#项目简介)
- [主要功能](#主要功能)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [脚本与命令](#脚本与命令)
- [常见问题](#常见问题)
- [版权说明](#版权说明)

## 项目简介

LibraSpace 是一个围绕「学习 × 创作 × 可视化」打造的全栈应用，前台提供沉浸式浏览体验，后台提供内容管理能力。项目默认接入 Supabase 作为后端服务，配合 Tailwind 与 shadcn/ui 构建出高度可定制的 UI 体系，同时集成了大量动画与可视化组件，适合作为个人站点或全栈实践模板。

## 主要功能

- **前台展示**
  - 首页：个性化介绍、动态内容流、视觉动效。
  - 博客系统：支持 Markdown 渲染、高亮、阅读时长统计。
  - 算法实验室：LeetCode 题库、动画演示、知识点整理。
  - 标签、代码片段、菜谱、HTML 文档等多内容类型。
  - 关于 / 简历页：统一的品牌视觉与动效。
- **后台管理**
  - Supabase 表结构驱动的内容管理后台。
  - 博客、标签、算法题目、菜谱等统一 CRUD。
  - 编辑器集成（@uiw/react-md-editor）、实时预览。
- **系统能力**
  - Supabase Auth Cookie 化封装（`@supabase/ssr`）。
  - `cmdk` 驱动的全局搜索、命令面板。
  - 响应式导航（Glow Menu + Mobile Drawer）。
  - 动画库：Framer Motion、自定义可视化组件。

## 技术栈

| 类别      | 说明                                                         |
| --------- | ------------------------------------------------------------ |
| 前端框架  | [Next.js 16](https://nextjs.org)（App Router）               |
| UI & 样式 | Tailwind CSS · shadcn/ui · Framer Motion · custom animations |
| 后端服务  | [Supabase](https://supabase.com)（Auth、数据库、存储）       |
| 数据处理  | React Hook Form · Zod · date-fns                             |
| Markdown  | react-markdown · remark/rehype 插件链 · @uiw/react-md-editor |
| 其他      | CMDK 搜索、Lucide 图标、Sonner 通知、Reading-time 阅读统计等 |

## 快速开始

### 1. 环境要求

- Node.js ≥ 20
- 包管理器：yarn（项目默认 `yarn@1.22.x`）
- Docker 自部署 Supabase

### 2. 克隆仓库

```bash
git clone https://github.com/Libra11/libra-supabase-project.git
cd libra-supabase-project
yarn install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env.local`，并填入 Supabase 项目信息：

```env
NEXT_PUBLIC_SUPABASE_URL=你的-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的-supabase-anon-key
```

### 4. 启动开发服务器

```bash
yarn dev
```

默认访问：<http://localhost:3000>

## 项目结构

```
├── app/                    # Next.js App Router 页面
│   ├── (fronted)/          # 前台页面（home、blogs、about、leetcode 等）
│   ├── dashboard/          # 管理后台
│   ├── auth/               # 认证流程
│   └── globals.css         # 全局样式
├── components/             # 复用组件（UI、动画、业务组件）
├── lib/                    # Supabase 封装、数据访问层、工具函数
├── hooks/                  # 自定义 hooks
├── public/                 # 静态资源
├── types/                  # TypeScript 类型定义
├── utils/                  # 工具方法
└── README.md
```

## 脚本与命令

| 命令             | 作用                   |
| ---------------- | ---------------------- |
| `yarn dev`       | 启动开发服务器（3000） |
| `yarn dev:turbo` | 使用 Turbopack 启动    |
| `yarn build`     | 构建生产版本           |
| `yarn start`     | 运行生产构建后的应用   |
