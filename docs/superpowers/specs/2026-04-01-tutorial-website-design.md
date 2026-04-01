# Tutorial Website Design Spec

**Date:** 2026-04-01
**Status:** Approved
**Approach:** Fork [learn-claude-code](https://github.com/shareAI-lab/learn-claude-code) web/ directory, adapt for 17 lessons of deep content

---

## Overview

Transform the existing VitePress static tutorial into an interactive Next.js web application by forking the learn-claude-code web app. The fork replaces their 12-lesson progressive Python agent content with our 17-lesson Claude Code source analysis content, adding Excalidraw diagrams and per-lesson simulators.

## Tech Stack (inherited)

- **Framework:** Next.js 16 + React 19
- **Styling:** Tailwind CSS 4
- **Animation:** Framer Motion
- **Icons:** Lucide React
- **MD rendering:** unified + remark + rehype (+ rehype-highlight)
- **Deploy:** Vercel

## Content Structure

### 17 Lessons (s00-s16)

Each lesson maps to a route `/[lesson]` (e.g., `/s01`). No locale prefix (Chinese only).

Lessons are grouped into layers for sidebar organization:

| Layer | Color | Lessons |
|-------|-------|---------|
| 导论 | Gray | s00 |
| 核心循环 | Blue | s01, s02, s03 |
| 安全与扩展 | Green | s04, s05, s06 |
| 上下文管理 | Purple | s07, s08, s09 |
| 规划与调度 | Amber | s10, s11 |
| Agent 协作 | Red | s12, s13, s14 |
| 生态与总结 | Teal | s15, s16 |

### Per-Lesson Page Structure

Each lesson page has:

1. **Header** — lesson ID badge, title, layer badge, key insight quote
2. **Hero Visualization** — Excalidraw-generated stepped flow diagram (always visible above tabs)
3. **Four Tabs:**
   - **学习 (Learn)** — Key Takeaways, problem statement, core mechanisms, design decisions. Rendered from MD sections.
   - **模拟 (Simulate)** — Agent Loop Simulator with scenario JSON. Playback controls, message flow, step annotations.
   - **源码 (Source)** — Source code mapping table + pseudocode blocks. Rendered from MD.
   - **深入 (Deep Dive)** — Why sections (industry context), exercises, recommended reading. Rendered from MD.
4. **Prev/Next navigation** — linear lesson order

### No Diff/Compare

Unlike the original learn-claude-code which shows progressive code diffs, our tutorial analyzes existing source code. We remove:
- `WhatsNew` diff component
- `/compare` and `/diff` routes
- `SourceViewer` (Python source viewer)
- `timeline/` and `layers/` page routes
- `extract-content.ts` (Python parser) — replaced with MD parser

## Key Components

### 1. `extract-content.ts` (rewrite)

**Input:** `tutorial/guide/s00-*.md` through `s16-*.md`
**Output:** `src/data/generated/docs.json`

Parses each MD file into sections using heading-level splitting:
- `## 问题` + `## 核心机制` + `## 设计决策` → learn tab
- `## 源码映射` + `## Python 伪代码` → source tab
- `## Why` + `## 动手试试` + `## 推荐阅读` → deep dive tab
- `::: info Key Takeaways` → extracted as structured data
- Front matter or first heading → metadata (title, subtitle)

### 2. `DocRenderer` (enhance)

Enhance the existing MD renderer to support:
- `::: info` / `::: warning` / `::: tip` container directives (remark-directive)
- Code block syntax highlighting (rehype-highlight, already a dependency)
- Tables (remark-gfm, already a dependency)
- Mermaid diagrams (render as static SVG or use mermaid.js client-side)

### 3. `SessionVisualization` (rewrite per lesson)

Each lesson gets an Excalidraw-generated diagram exported as PNG/SVG, displayed with stepped highlighting via the existing `useSteppedVisualization` hook + `StepControls` component.

Generation approach:
- Use Excalidraw skill to create `.excalidraw` files for each lesson
- Export to PNG via `export-to-png.mjs`
- For stepped visualization: either use multiple PNGs per step, or overlay CSS highlights on a single diagram

### 4. Simulator Scenarios (new, 17 JSON files)

Each `src/data/scenarios/s{XX}.json` defines a realistic interaction sequence:

```json
{
  "version": "s01",
  "title": "Agent Loop",
  "description": "A minimal agent loop processing a user request",
  "steps": [
    { "type": "user_message", "content": "Fix the login bug", "annotation": "User sends task" },
    { "type": "assistant_text", "content": "I'll search for the error...", "annotation": "Model decides action" },
    { "type": "tool_call", "content": "grep -r 'login' src/", "toolName": "bash", "annotation": "Tool call" },
    { "type": "tool_result", "content": "src/auth.ts:42: loginHandler()", "toolName": "bash", "annotation": "Result returned" }
  ]
}
```

### 5. `constants.ts` (rewrite)

```typescript
export const LESSON_ORDER = [
  "s00", "s01", "s02", "s03", "s04", "s05", "s06", "s07",
  "s08", "s09", "s10", "s11", "s12", "s13", "s14", "s15", "s16"
] as const;

export const LESSON_META: Record<string, {
  title: string;
  subtitle: string;
  keyInsight: string;
  layer: LayerId;
  readingTime: string;
}> = {
  s00: { title: "Harness Engineering 导论", subtitle: "模型之外的一切", ... },
  s01: { title: "Agent 循环", subtitle: "一切的起点", ... },
  // ... all 17
};
```

### 6. Sidebar (adapt)

Group lessons by layer with collapsible sections. Show current lesson highlighted. No locale switching.

### 7. Homepage (adapt)

Replace the original timeline/layer visualization with:
- Hero section: project title + description
- Layer overview: clickable layer cards showing grouped lessons
- Quick start: link to s00

## Components to Remove

| Original Component | Reason |
|---|---|
| `i18n/`, `[locale]/` routing | Chinese only |
| `WhatsNew`, `diff/` | No progressive diffs |
| `compare/`, `timeline/`, `layers/` pages | Not applicable |
| `SourceViewer` | No Python source to view |
| `extract-content.ts` (Python parser) | Replaced with MD parser |

## Components to Reuse

| Component | Modifications |
|---|---|
| `AgentLoopSimulator` | Scenario data only — component unchanged |
| `SimulatorControls` | Unchanged |
| `SimulatorMessage` | Unchanged |
| `Tabs` | Rename tab labels to Chinese |
| `StepControls` | Unchanged |
| `useSteppedVisualization` | Unchanged |
| `useSimulator` | Unchanged |
| `header.tsx` | Simplify — remove language switcher |
| `sidebar.tsx` | Adapt for 17 lessons + layer groups |

## Data Flow

```
tutorial/guide/s*.md ──→ scripts/extract-content.ts ──→ src/data/generated/docs.json
                                                            ├── per-lesson sections (learn/source/deepDive)
                                                            └── metadata

src/data/scenarios/s*.json ──→ AgentLoopSimulator

public/diagrams/s*-*.png ──→ SessionVisualization (hero)
```

## Build Pipeline

1. `npm run extract` — parse MD files into `docs.json`
2. `npm run build` — Next.js static build (SSG via `generateStaticParams`)
3. Deploy to Vercel

## Implementation Priority

### Phase 1: Core scaffold (must have)
- Fork web/, strip i18n and diff components
- Rewrite `constants.ts` with 17 lesson metadata
- Rewrite `extract-content.ts` for MD parsing
- Adapt sidebar, header, homepage
- Wire up lesson pages with Learn tab rendering MD content

### Phase 2: Interactive features
- Create 17 simulator scenario JSONs
- Wire up Simulate tab with AgentLoopSimulator
- Create Excalidraw diagrams for key lessons (s01, s02, s03, s04, s07, s12)
- Wire up hero visualizations with step controls

### Phase 3: Polish
- Source tab: render source mapping tables + pseudocode
- Deep Dive tab: Why sections + exercises + reading
- Responsive design verification
- Dark mode verification
- Deploy to Vercel

## Success Criteria

- All 17 lessons render correctly with four tabs
- Simulator works for at least s01-s04 lessons
- Hero flow diagrams display for at least 6 key lessons
- Site builds and deploys to Vercel
- Mobile responsive
- Dark mode support (inherited from original)
