# Tutorial Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fork learn-claude-code's web app and adapt it into an interactive Chinese tutorial site for our 17-lesson Claude Code source analysis.

**Architecture:** Next.js 16 SSG site. Fork shareAI-lab/learn-claude-code `web/` directory, strip i18n and diff features, replace Python-centric content pipeline with Markdown parsing, wire up existing simulator and visualization components to our 17 lessons.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, Framer Motion, unified/remark/rehype, Lucide React

**Spec:** `docs/superpowers/specs/2026-04-01-tutorial-website-design.md`

---

## File Structure

```
web/                              # Root of the Next.js app (forked from learn-claude-code)
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout (simplified, no locale)
│   │   ├── page.tsx              # Homepage with lesson overview
│   │   └── (learn)/
│   │       ├── layout.tsx        # Sidebar + content layout
│   │       └── [lesson]/
│   │           ├── page.tsx      # Lesson detail page (SSG)
│   │           └── client.tsx    # Client-side interactive content
│   ├── components/
│   │   ├── layout/
│   │   │   ├── header.tsx        # Top nav (simplified)
│   │   │   └── sidebar.tsx       # Sidebar with 17 lessons grouped by layer
│   │   ├── simulator/            # REUSE: agent-loop-simulator, controls, message
│   │   ├── visualizations/       # REWRITE: 17 lesson visualizations
│   │   │   ├── index.tsx
│   │   │   ├── s01-agent-loop.tsx
│   │   │   └── shared/step-controls.tsx
│   │   ├── docs/
│   │   │   └── doc-renderer.tsx  # ENHANCE: MD rendering with containers
│   │   ├── architecture/         # REUSE: arch-diagram, design-decisions
│   │   └── ui/                   # REUSE: tabs, badge, card
│   ├── data/
│   │   ├── scenarios/            # NEW: 17 simulator scenario JSONs
│   │   │   ├── s00.json
│   │   │   ├── s01.json
│   │   │   └── ... (s02-s16)
│   │   └── generated/
│   │       └── docs.json         # Generated from MD files
│   ├── hooks/                    # REUSE: useSimulator, useSteppedVisualization, useDarkMode
│   ├── lib/
│   │   ├── constants.ts          # REWRITE: 17 lesson metadata + layers
│   │   └── utils.ts              # REUSE
│   └── types/
│       └── agent-data.ts         # ADAPT: lesson types
├── scripts/
│   └── extract-content.ts        # REWRITE: parse MD instead of Python
├── public/
│   └── diagrams/                 # Excalidraw-exported PNGs
└── package.json
```

---

### Task 1: Fork and clean the web directory

**Files:**
- Create: `web/` (entire directory, copied from learn-claude-code)
- Remove: `web/src/i18n/`, `web/src/app/[locale]/`, `web/src/components/diff/`, various i18n files

- [ ] **Step 1: Clone the reference repo's web directory**

```bash
cd /Users/dailingyun/project/claude-code-source-code
# Clone the repo temporarily
git clone --depth 1 https://github.com/shareAI-lab/learn-claude-code /tmp/learn-claude-code
# Copy the web directory, excluding node_modules
rsync -av --exclude='node_modules' --exclude='.next' --exclude='.gitignore' /tmp/learn-claude-code/web/ web-next/
rm -rf /tmp/learn-claude-code
```

Note: We use `web-next/` to avoid conflicting with the existing `tutorial/` VitePress setup.

- [ ] **Step 2: Remove i18n infrastructure**

Delete these files/directories:
- `web-next/src/lib/i18n.tsx`
- `web-next/src/lib/i18n-server.ts`
- `web-next/src/i18n/` (if exists)
- `web-next/src/app/[locale]/` (entire locale routing)

- [ ] **Step 3: Remove diff/compare/timeline features**

Delete:
- `web-next/src/components/diff/`
- `web-next/src/app/[locale]/(learn)/compare/` (if copied)
- `web-next/src/app/[locale]/(learn)/timeline/`
- `web-next/src/app/[locale]/(learn)/layers/`
- `web-next/src/components/code/source-viewer.tsx` (Python viewer)

- [ ] **Step 4: Restructure app directory for no-locale routing**

Create new flat routing structure:
- `web-next/src/app/layout.tsx` — root layout (from `[locale]/layout.tsx`, remove locale logic)
- `web-next/src/app/page.tsx` — homepage
- `web-next/src/app/(learn)/layout.tsx` — sidebar layout
- `web-next/src/app/(learn)/[lesson]/page.tsx` — lesson detail
- `web-next/src/app/(learn)/[lesson]/client.tsx` — client interactive

- [ ] **Step 5: Install dependencies and verify build skeleton**

```bash
cd web-next && npm install && npm run build
```

Fix any import errors from removed i18n/diff modules. The goal is a building skeleton, not working content yet.

- [ ] **Step 6: Commit**

```bash
git add web-next/
git commit -m "feat: fork learn-claude-code web app, strip i18n and diff features"
```

---

### Task 2: Rewrite constants and types for 17 lessons

**Files:**
- Modify: `web-next/src/lib/constants.ts`
- Modify: `web-next/src/types/agent-data.ts`

- [ ] **Step 1: Rewrite constants.ts**

```typescript
export const LESSON_ORDER = [
  "s00", "s01", "s02", "s03", "s04", "s05", "s06", "s07",
  "s08", "s09", "s10", "s11", "s12", "s13", "s14", "s15", "s16",
] as const;

export type LessonId = (typeof LESSON_ORDER)[number];

export const LESSON_META: Record<
  string,
  {
    title: string;
    subtitle: string;
    keyInsight: string;
    layer: LayerId;
    readingTime: string;
  }
> = {
  s00: {
    title: "Harness Engineering 导论",
    subtitle: "模型之外的一切",
    keyInsight: "99% 的代码不在核心循环里，而在包裹它的 Harness 中",
    layer: "intro",
    readingTime: "10 分钟",
  },
  s01: {
    title: "Agent 循环：一切的起点",
    subtitle: "One loop is all you need",
    keyInsight: "核心循环不到 30 行，但包裹它的 Harness 有 51 万行",
    layer: "core",
    readingTime: "15 分钟",
  },
  s02: {
    title: "工具系统：注册、分发与执行",
    subtitle: "Tools are the hands of the agent",
    keyInsight: "6 个核心工具覆盖 90% 场景，其余按需加载",
    layer: "core",
    readingTime: "20 分钟",
  },
  s03: {
    title: "系统提示词组装：字节级的缓存博弈",
    subtitle: "Every byte counts",
    keyInsight: "静态前置 + 动态后置 = 接近 100% 缓存命中",
    layer: "core",
    readingTime: "15 分钟",
  },
  s04: {
    title: "权限系统：5 种模式与风险分类",
    subtitle: "Deny by default",
    keyInsight: "六级权限瀑布，大多数操作在前 4 级决定",
    layer: "safety",
    readingTime: "20 分钟",
  },
  s05: {
    title: "Hooks：用户可编程的自动化钩子",
    subtitle: "Shell commands as middleware",
    keyInsight: "27 种生命周期事件，每个都可编程拦截",
    layer: "safety",
    readingTime: "15 分钟",
  },
  s06: {
    title: "设置层级：从全局到策略的配置链",
    subtitle: "Configuration as code",
    keyInsight: "四层配置合并 + 企业 managed settings",
    layer: "safety",
    readingTime: "15 分钟",
  },
  s07: {
    title: "上下文压缩：无限对话的秘密",
    subtitle: "Compress or die",
    keyInsight: "三层压缩：micro（零开销）→ auto（AI 摘要）→ manual",
    layer: "context",
    readingTime: "20 分钟",
  },
  s08: {
    title: "Memory 系统：CLAUDE.md 与自动记忆",
    subtitle: "Remember everything",
    keyInsight: "规则类写 CLAUDE.md，事实类写 Auto Memory",
    layer: "context",
    readingTime: "15 分钟",
  },
  s09: {
    title: "Skills：两层知识注入",
    subtitle: "Load on demand",
    keyInsight: "系统提示词只注入名称，按需加载完整定义",
    layer: "context",
    readingTime: "15 分钟",
  },
  s10: {
    title: "Plan 模式：先想后做",
    subtitle: "Think before you act",
    keyInsight: "切换权限而非工具集，保持 prompt cache 稳定",
    layer: "planning",
    readingTime: "15 分钟",
  },
  s11: {
    title: "任务系统：DAG 依赖与进度追踪",
    subtitle: "File-based task graph",
    keyInsight: "文件型 DAG 天然持久化，blocks/blockedBy 双向链接",
    layer: "planning",
    readingTime: "15 分钟",
  },
  s12: {
    title: "子 Agent：干净上下文的委派",
    subtitle: "Clean context per subtask",
    keyInsight: "子 Agent 隔离消息历史，只返回摘要结果",
    layer: "agents",
    readingTime: "20 分钟",
  },
  s13: {
    title: "Agent 团队：生命周期与协议",
    subtitle: "Teammates + mailboxes",
    keyInsight: "文件邮箱实现异步通信，结构化协议管理生命周期",
    layer: "agents",
    readingTime: "20 分钟",
  },
  s14: {
    title: "Worktree：文件隔离与并行开发",
    subtitle: "Isolate by directory",
    keyInsight: "Git worktree 提供文件级隔离，无需容器",
    layer: "agents",
    readingTime: "15 分钟",
  },
  s15: {
    title: "MCP 集成：连接外部世界",
    subtitle: "Tools as a protocol",
    keyInsight: "六种传输 + 企业策略过滤 = 可控的生态扩展",
    layer: "ecosystem",
    readingTime: "20 分钟",
  },
  s16: {
    title: "全景架构：从 CLI 启动到完整交互",
    subtitle: "See the forest, then the trees",
    keyInsight: "一次查询经过 8 个阶段、跨越 16 个子系统",
    layer: "ecosystem",
    readingTime: "15 分钟",
  },
};

export type LayerId =
  | "intro"
  | "core"
  | "safety"
  | "context"
  | "planning"
  | "agents"
  | "ecosystem";

export const LAYERS: {
  id: LayerId;
  label: string;
  color: string;
  lessons: string[];
}[] = [
  { id: "intro", label: "导论", color: "#6B7280", lessons: ["s00"] },
  { id: "core", label: "核心循环", color: "#3B82F6", lessons: ["s01", "s02", "s03"] },
  { id: "safety", label: "安全与扩展", color: "#10B981", lessons: ["s04", "s05", "s06"] },
  { id: "context", label: "上下文管理", color: "#8B5CF6", lessons: ["s07", "s08", "s09"] },
  { id: "planning", label: "规划与调度", color: "#F59E0B", lessons: ["s10", "s11"] },
  { id: "agents", label: "Agent 协作", color: "#EF4444", lessons: ["s12", "s13", "s14"] },
  { id: "ecosystem", label: "生态与总结", color: "#14B8A6", lessons: ["s15", "s16"] },
];
```

- [ ] **Step 2: Adapt types/agent-data.ts**

Rename version-centric types to lesson-centric. Remove diff types, keep simulator types:

```typescript
export interface SimulatorStep {
  type: "user_message" | "assistant_text" | "tool_call" | "tool_result";
  content: string;
  toolName?: string;
  annotation: string;
}

export interface Scenario {
  version: string; // lesson ID like "s01"
  title: string;
  description: string;
  steps: SimulatorStep[];
}

export interface DocContent {
  id: string;
  learn: string;   // MD content for Learn tab
  source: string;  // MD content for Source tab
  deepDive: string; // MD content for Deep Dive tab
}

export interface DocsData {
  docs: DocContent[];
}
```

- [ ] **Step 3: Commit**

```bash
git add web-next/src/lib/constants.ts web-next/src/types/agent-data.ts
git commit -m "feat: rewrite constants and types for 17 lessons"
```

---

### Task 3: Rewrite extract-content.ts for Markdown parsing

**Files:**
- Rewrite: `web-next/scripts/extract-content.ts`

- [ ] **Step 1: Write the MD extraction script**

The script reads `tutorial/guide/s*.md` files, splits each into sections by `## ` headings, and categorizes them into learn/source/deepDive groups.

```typescript
import * as fs from "fs";
import * as path from "path";
import type { DocContent } from "../src/types/agent-data";

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const GUIDE_DIR = path.join(REPO_ROOT, "tutorial", "guide");
const OUT_DIR = path.join(__dirname, "..", "src", "data", "generated");

// Section heading → tab mapping
const SOURCE_SECTIONS = ["源码映射", "Python 伪代码"];
const DEEP_DIVE_SECTIONS = ["Why", "动手试试", "推荐阅读"];
// Everything else goes to "learn"

function extractSections(content: string): { learn: string; source: string; deepDive: string } {
  // Split by ## headings, keeping the heading with the content
  const sections = content.split(/(?=^## )/m);

  const learn: string[] = [];
  const source: string[] = [];
  const deepDive: string[] = [];

  for (const section of sections) {
    const headingMatch = section.match(/^## (.+)/m);
    if (!headingMatch) {
      // Preamble (before first ##) including ::: info blocks → learn
      learn.push(section);
      continue;
    }

    const heading = headingMatch[1].trim();

    if (SOURCE_SECTIONS.some((s) => heading.includes(s))) {
      source.push(section);
    } else if (DEEP_DIVE_SECTIONS.some((s) => heading.includes(s))) {
      deepDive.push(section);
    } else {
      learn.push(section);
    }
  }

  return {
    learn: learn.join("\n").trim(),
    source: source.join("\n").trim(),
    deepDive: deepDive.join("\n").trim(),
  };
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const files = fs.readdirSync(GUIDE_DIR)
    .filter((f) => f.match(/^s\d+-.*\.md$/))
    .sort();

  const docs: DocContent[] = [];

  for (const file of files) {
    const id = file.match(/^(s\d+)/)?.[1];
    if (!id) continue;

    const content = fs.readFileSync(path.join(GUIDE_DIR, file), "utf-8");
    // Remove the first h1 line (redundant with page header)
    const withoutH1 = content.replace(/^# .+\n/, "");
    const sections = extractSections(withoutH1);

    docs.push({ id, ...sections });
    console.log(`  ${id}: learn=${sections.learn.length}c source=${sections.source.length}c deep=${sections.deepDive.length}c`);
  }

  const output = JSON.stringify({ docs }, null, 2);
  fs.writeFileSync(path.join(OUT_DIR, "docs.json"), output);
  console.log(`\nWrote ${docs.length} lessons to docs.json`);
}

main();
```

- [ ] **Step 2: Update package.json scripts**

```json
{
  "scripts": {
    "extract": "tsx scripts/extract-content.ts",
    "predev": "npm run extract",
    "dev": "next dev",
    "prebuild": "npm run extract",
    "build": "next build",
    "start": "next start"
  }
}
```

- [ ] **Step 3: Run extraction and verify output**

```bash
cd web-next && npm run extract
# Verify docs.json was created with 17 entries
cat src/data/generated/docs.json | node -e "const d=require('/dev/stdin');console.log(d.docs.length,'lessons')"
```

- [ ] **Step 4: Commit**

```bash
git add web-next/scripts/extract-content.ts web-next/src/data/generated/docs.json web-next/package.json
git commit -m "feat: rewrite extract-content.ts for MD parsing, generate docs.json"
```

---

### Task 4: Build lesson page layout and routing

**Files:**
- Create/Modify: `web-next/src/app/layout.tsx`
- Create/Modify: `web-next/src/app/page.tsx`
- Create/Modify: `web-next/src/app/(learn)/layout.tsx`
- Create/Modify: `web-next/src/app/(learn)/[lesson]/page.tsx`
- Create/Modify: `web-next/src/app/(learn)/[lesson]/client.tsx`
- Modify: `web-next/src/components/layout/sidebar.tsx`
- Modify: `web-next/src/components/layout/header.tsx`

- [ ] **Step 1: Create root layout.tsx**

```tsx
import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Claude Code 源码教程",
  description: "从 Harness Engineering 视角拆解 Claude Code 51 万行源码",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Create simplified header.tsx**

Remove language switcher, keep dark mode toggle and project title/link:

```tsx
"use client";

import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold">
          Claude Code 源码教程
        </Link>
        <a
          href="https://github.com/anthropics/claude-code"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
        >
          GitHub
        </a>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Create sidebar.tsx with layer groups**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LESSON_ORDER, LESSON_META, LAYERS } from "@/lib/constants";

export function Sidebar() {
  const pathname = usePathname();
  const currentLesson = pathname.split("/").pop();

  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-56 shrink-0 overflow-y-auto py-4 lg:block">
      <nav className="space-y-4">
        {LAYERS.map((layer) => (
          <div key={layer.id}>
            <h3
              className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider"
              style={{ color: layer.color }}
            >
              {layer.label}
            </h3>
            <ul className="space-y-0.5">
              {layer.lessons.map((lessonId) => {
                const meta = LESSON_META[lessonId];
                const isActive = currentLesson === lessonId;
                return (
                  <li key={lessonId}>
                    <Link
                      href={`/${lessonId}`}
                      className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${
                        isActive
                          ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-white"
                          : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-white"
                      }`}
                    >
                      <span className="mr-1.5 font-mono text-xs opacity-50">{lessonId}</span>
                      {meta?.title?.replace(/^.*[：:]\s*/, "") || lessonId}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 4: Create learn layout.tsx**

```tsx
import { Sidebar } from "@/components/layout/sidebar";

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-8">
      <Sidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
```

- [ ] **Step 5: Create lesson page.tsx (SSG)**

```tsx
import { LESSON_ORDER, LESSON_META, LAYERS } from "@/lib/constants";
import { LessonDetailClient } from "./client";
import docsData from "@/data/generated/docs.json";

export function generateStaticParams() {
  return LESSON_ORDER.map((lesson) => ({ lesson }));
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lesson: string }>;
}) {
  const { lesson } = await params;
  const meta = LESSON_META[lesson];
  const doc = (docsData as any).docs.find((d: any) => d.id === lesson);
  const layer = LAYERS.find((l) => l.id === meta?.layer);

  if (!meta || !doc) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold">课程未找到</h1>
        <p className="mt-2 text-zinc-500">{lesson}</p>
      </div>
    );
  }

  const pathIndex = LESSON_ORDER.indexOf(lesson as any);
  const prevLesson = pathIndex > 0 ? LESSON_ORDER[pathIndex - 1] : null;
  const nextLesson = pathIndex < LESSON_ORDER.length - 1 ? LESSON_ORDER[pathIndex + 1] : null;

  return (
    <div className="mx-auto max-w-3xl space-y-10 py-4">
      {/* Header */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-lg bg-zinc-100 px-3 py-1 font-mono text-lg font-bold dark:bg-zinc-800">
            {lesson}
          </span>
          <h1 className="text-2xl font-bold sm:text-3xl">{meta.title}</h1>
          {layer && (
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: layer.color }}
            >
              {layer.label}
            </span>
          )}
        </div>
        <p className="text-lg text-zinc-500 dark:text-zinc-400">{meta.subtitle}</p>
        <div className="flex items-center gap-4 text-sm text-zinc-500">
          <span>预计阅读 {meta.readingTime}</span>
        </div>
        {meta.keyInsight && (
          <blockquote className="border-l-4 border-zinc-300 pl-4 text-sm italic text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
            {meta.keyInsight}
          </blockquote>
        )}
      </header>

      {/* Client interactive sections */}
      <LessonDetailClient
        lesson={lesson}
        learn={doc.learn}
        source={doc.source}
        deepDive={doc.deepDive}
      />

      {/* Prev / Next navigation */}
      <nav className="flex items-center justify-between border-t border-zinc-200 pt-6 dark:border-zinc-700">
        {prevLesson ? (
          <a href={`/${prevLesson}`} className="group flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
            <span className="transition-transform group-hover:-translate-x-1">&larr;</span>
            <div>
              <div className="text-xs text-zinc-400">上一课</div>
              <div className="font-medium">{prevLesson} - {LESSON_META[prevLesson]?.title}</div>
            </div>
          </a>
        ) : <div />}
        {nextLesson ? (
          <a href={`/${nextLesson}`} className="group flex items-center gap-2 text-right text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
            <div>
              <div className="text-xs text-zinc-400">下一课</div>
              <div className="font-medium">{LESSON_META[nextLesson]?.title} - {nextLesson}</div>
            </div>
            <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
          </a>
        ) : <div />}
      </nav>
    </div>
  );
}
```

- [ ] **Step 6: Create client.tsx with tabs**

```tsx
"use client";

import { DocRenderer } from "@/components/docs/doc-renderer";
import { Tabs } from "@/components/ui/tabs";

interface LessonDetailClientProps {
  lesson: string;
  learn: string;
  source: string;
  deepDive: string;
}

const TABS = [
  { id: "learn", label: "学习" },
  { id: "simulate", label: "模拟" },
  { id: "source", label: "源码" },
  { id: "deep-dive", label: "深入" },
];

export function LessonDetailClient({ lesson, learn, source, deepDive }: LessonDetailClientProps) {
  return (
    <div className="space-y-6">
      <Tabs tabs={TABS} defaultTab="learn">
        {(activeTab) => (
          <>
            {activeTab === "learn" && <DocRenderer content={learn} />}
            {activeTab === "simulate" && (
              <div className="rounded-lg border border-zinc-200 p-8 text-center text-zinc-500 dark:border-zinc-700">
                模拟器开发中...
              </div>
            )}
            {activeTab === "source" && <DocRenderer content={source} />}
            {activeTab === "deep-dive" && <DocRenderer content={deepDive} />}
          </>
        )}
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 7: Adapt DocRenderer to accept content prop instead of version**

Modify `doc-renderer.tsx` to accept a `content: string` prop instead of looking up by version:

```tsx
"use client";

import { useMemo } from "react";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";

interface DocRendererProps {
  content: string;
}

function renderMarkdown(md: string): string {
  const result = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeHighlight, { detect: false, ignoreMissing: true })
    .use(rehypeStringify)
    .processSync(md);
  return String(result);
}

export function DocRenderer({ content }: DocRendererProps) {
  const html = useMemo(() => {
    if (!content) return "<p>暂无内容</p>";
    return renderMarkdown(content);
  }, [content]);

  return (
    <article
      className="prose prose-zinc max-w-none dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
```

- [ ] **Step 8: Create homepage**

```tsx
import Link from "next/link";
import { LAYERS, LESSON_META } from "@/lib/constants";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-12 py-8">
      <header className="space-y-4 text-center">
        <h1 className="text-4xl font-bold">Claude Code 源码教程</h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400">
          从 Harness Engineering 视角拆解 51 万行源码 · 17 课完整解析
        </p>
        <Link
          href="/s00"
          className="inline-block rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          开始学习 →
        </Link>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {LAYERS.map((layer) => (
          <div
            key={layer.id}
            className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-700"
          >
            <h3 className="mb-3 font-semibold" style={{ color: layer.color }}>
              {layer.label}
            </h3>
            <ul className="space-y-1.5">
              {layer.lessons.map((id) => (
                <li key={id}>
                  <Link
                    href={`/${id}`}
                    className="block text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                  >
                    <span className="mr-1 font-mono text-xs opacity-50">{id}</span>
                    {LESSON_META[id]?.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Verify build and dev server**

```bash
cd web-next && npm run build && npm run dev
# Open http://localhost:3000 — should see homepage
# Navigate to /s01 — should see lesson with Learn tab rendering MD
```

- [ ] **Step 10: Commit**

```bash
git add web-next/src/
git commit -m "feat: wire up lesson pages with tabs and MD rendering"
```

---

### Task 5: Create simulator scenarios for key lessons

**Files:**
- Create: `web-next/src/data/scenarios/s01.json` through `s04.json` (4 initial scenarios)

- [ ] **Step 1: Create s01 Agent Loop scenario**

```json
{
  "version": "s01",
  "title": "Agent Loop",
  "description": "一个完整的 agent 循环：用户请求 → 模型思考 → 工具调用 → 结果返回 → 继续或结束",
  "steps": [
    { "type": "user_message", "content": "请修复 login.ts 中的认证 bug", "annotation": "用户提交任务，进入 submitMessage()" },
    { "type": "assistant_text", "content": "我来搜索一下相关的错误信息...", "annotation": "模型决定第一步行动：搜索" },
    { "type": "tool_call", "content": "grep -r 'AuthError' src/", "toolName": "Bash", "annotation": "stop_reason='tool_use'，进入工具执行分支" },
    { "type": "tool_result", "content": "src/login.ts:42: throw new AuthError('token expired')\nsrc/login.ts:58: catch(AuthError)", "toolName": "Bash", "annotation": "工具结果追加到消息列表，循环继续" },
    { "type": "assistant_text", "content": "找到了错误位置，让我读取这个文件...", "annotation": "模型看到结果，决定下一步" },
    { "type": "tool_call", "content": "login.ts", "toolName": "Read", "annotation": "第二轮工具调用" },
    { "type": "tool_result", "content": "// login.ts\nfunction authenticate(token) {\n  if (isExpired(token)) {\n    throw new AuthError('token expired')\n  }\n  // missing: refresh logic\n}", "toolName": "Read", "annotation": "文件内容返回" },
    { "type": "assistant_text", "content": "问题是缺少 token 刷新逻辑。让我修复它。", "annotation": "模型理解了 bug 原因" },
    { "type": "tool_call", "content": "// 在 isExpired 检查后添加刷新逻辑\nif (isExpired(token)) {\n  token = await refreshToken(token)\n  if (!token) throw new AuthError('refresh failed')\n}", "toolName": "Edit", "annotation": "Write 工具调用修复代码" },
    { "type": "tool_result", "content": "✓ File edited successfully", "toolName": "Edit", "annotation": "修复完成" },
    { "type": "assistant_text", "content": "已修复 login.ts 中的认证 bug。问题是 token 过期后没有刷新逻辑，现在添加了 refreshToken 调用。", "annotation": "stop_reason='end_turn'，模型选择结束，循环退出" }
  ]
}
```

- [ ] **Step 2: Create s02 Tools scenario**

Similar structure showing tool dispatch — model calls Grep, then Read, then Edit. Focus annotations on `findToolByName()`, permission check, `isConcurrencySafe`.

- [ ] **Step 3: Create s03 System Prompt scenario**

Show the system prompt assembly: annotations highlight the six layers, cache_control injection, and prompt prefix splitting.

- [ ] **Step 4: Create s04 Permissions scenario**

Show a tool call being intercepted by the permission pipeline: annotations walk through the six-level waterfall.

- [ ] **Step 5: Wire simulator into client.tsx**

Update the Simulate tab to use `AgentLoopSimulator`:

```tsx
{activeTab === "simulate" && <AgentLoopSimulator version={lesson} />}
```

Update the simulator's scenario module map to include our lesson IDs.

- [ ] **Step 6: Verify simulator works**

```bash
cd web-next && npm run dev
# Navigate to /s01 → click "模拟" tab → verify step-through works
```

- [ ] **Step 7: Commit**

```bash
git add web-next/src/data/scenarios/ web-next/src/app/
git commit -m "feat: add simulator scenarios for s01-s04"
```

---

### Task 6: Create Excalidraw flow diagrams for key lessons

**Files:**
- Create: Excalidraw diagrams for s01, s02, s03, s04, s07, s12
- Export: PNGs to `web-next/public/diagrams/`

- [ ] **Step 1: Generate s01 Agent Loop flow diagram**

Use the Excalidraw skill to create a flowchart showing:
- cli.tsx → main.tsx → QueryEngine → query() loop
- Inside loop: callModel() → stop_reason check → tool execution → append result → continue
- Exit conditions: end_turn, max_turns, budget

Export to `web-next/public/diagrams/s01-agent-loop-flow.png`

- [ ] **Step 2: Generate s02 Tool Pipeline diagram**

Flowchart: getTools() → ALL_TOOLS array → ToolSearch filter → findToolByName() → validateInput() → checkPermissions() → tool.call() → tool_result

Export to `web-next/public/diagrams/s02-tool-pipeline.png`

- [ ] **Step 3: Generate s03 System Prompt layers diagram**

Layered diagram showing the six layers with cache boundary marker.

Export to `web-next/public/diagrams/s03-prompt-layers.png`

- [ ] **Step 4: Generate remaining key diagrams (s04, s07, s12)**

- s04: Permission six-level waterfall
- s07: Three-layer compression pipeline
- s12: Sub-agent isolation model

- [ ] **Step 5: Wire diagrams into hero visualization area**

Add a simple image display above the tabs for lessons that have diagrams:

```tsx
{diagramExists && (
  <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
    <img src={`/diagrams/${lesson}-flow.png`} alt={`${meta.title} 架构图`} className="w-full" />
  </div>
)}
```

- [ ] **Step 6: Commit**

```bash
git add web-next/public/diagrams/ web-next/src/
git commit -m "feat: add Excalidraw flow diagrams for key lessons"
```

---

### Task 7: Polish and deploy

**Files:**
- Various minor fixes across components

- [ ] **Step 1: Add globals.css prose styling**

Ensure the MD rendered content has proper styling for:
- `::: info` blocks (custom container)
- Code blocks with language labels
- Tables
- Blockquotes

- [ ] **Step 2: Verify dark mode**

Test all pages in dark mode. The original app has dark mode support — verify it works with our content.

- [ ] **Step 3: Verify mobile responsive**

Test sidebar collapse, content width, tab navigation on mobile viewport.

- [ ] **Step 4: Add vercel.json if needed**

```json
{
  "buildCommand": "cd web-next && npm run build",
  "outputDirectory": "web-next/.next"
}
```

- [ ] **Step 5: Build and verify**

```bash
cd web-next && npm run build
# Should build successfully with 17 static pages
```

- [ ] **Step 6: Commit and tag**

```bash
git add web-next/
git commit -m "feat: complete tutorial website with 17 lessons, simulators, and diagrams"
```

---

## Execution Order

Tasks 1-4 are sequential (each builds on the previous).
Tasks 5 and 6 can run in parallel after Task 4.
Task 7 runs after 5 and 6.

```
Task 1 → Task 2 → Task 3 → Task 4 ──→ Task 5 (scenarios) ──→ Task 7
                                    └→ Task 6 (diagrams)   ──┘
```
