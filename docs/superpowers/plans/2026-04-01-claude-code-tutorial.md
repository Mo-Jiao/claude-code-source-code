# Claude Code 源码解读教程 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a VitePress tutorial site that progressively explains Claude Code's architecture through 16 lessons, with Python pseudocode, real source code mapping, and harness engineering analysis.

**Architecture:** VitePress static site in `tutorial/` directory at the repo root. Each lesson is a standalone Markdown file in `tutorial/guide/`. Content is Chinese with English code/terms. Each lesson follows a fixed template: Problem → Architecture Diagram → Core Mechanism → Python Pseudocode → Source Mapping → Design Decisions → Changes Table → Exercises.

**Tech Stack:** VitePress 1.x, Markdown, Mermaid diagrams, Python pseudocode blocks

**Spec:** `docs/superpowers/specs/2026-04-01-claude-code-tutorial-design.md`

---

## File Structure

```
tutorial/
├── package.json                    # VitePress dependencies
├── .vitepress/
│   └── config.ts                   # Site config: nav, sidebar, theme
├── index.md                        # Landing page with hero + features
├── guide/
│   ├── index.md                    # Learning path overview + timeline
│   ├── s01-agent-loop.md           # Layer 1: Core Engine
│   ├── s02-tools.md
│   ├── s03-system-prompt.md
│   ├── s04-permissions.md          # Layer 2: Safety & Control
│   ├── s05-hooks.md
│   ├── s06-settings.md
│   ├── s07-compact.md              # Layer 3: Intelligence & Memory
│   ├── s08-memory.md
│   ├── s09-skills.md
│   ├── s10-plan-mode.md            # Layer 4: Planning & Tasks
│   ├── s11-tasks.md
│   ├── s12-subagents.md            # Layer 5: Multi-Agent
│   ├── s13-teams.md
│   ├── s14-worktree.md
│   ├── s15-mcp.md                  # Layer 6: Ecosystem
│   └── s16-architecture.md
├── reference/
│   └── source-map.md               # Source code path index
└── public/
    └── images/                     # (placeholder for future diagrams)
```

---

## Task 1: VitePress Project Scaffold

**Files:**
- Create: `tutorial/package.json`
- Create: `tutorial/.vitepress/config.ts`
- Create: `tutorial/index.md`
- Create: `tutorial/guide/index.md`
- Create: `tutorial/reference/source-map.md`

- [ ] **Step 1: Create `tutorial/package.json`**

```json
{
  "name": "claude-code-tutorial",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vitepress dev",
    "build": "vitepress build",
    "preview": "vitepress preview"
  },
  "devDependencies": {
    "vitepress": "^1.6.3"
  }
}
```

- [ ] **Step 2: Create `tutorial/.vitepress/config.ts`**

```ts
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Claude Code 源码解读',
  description: '从源码理解第一梯队 AI Agent 的工程架构',
  lang: 'zh-CN',
  lastUpdated: true,

  markdown: {
    mermaid: true,
  },

  themeConfig: {
    nav: [
      { text: '教程', link: '/guide/' },
      { text: '源码索引', link: '/reference/source-map' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '学习路径',
          link: '/guide/',
        },
        {
          text: '第一层：核心引擎',
          items: [
            { text: 's01 — Agent 循环', link: '/guide/s01-agent-loop' },
            { text: 's02 — 工具系统', link: '/guide/s02-tools' },
            { text: 's03 — 系统提示词', link: '/guide/s03-system-prompt' },
          ],
        },
        {
          text: '第二层：安全与控制',
          items: [
            { text: 's04 — 权限系统', link: '/guide/s04-permissions' },
            { text: 's05 — Hooks', link: '/guide/s05-hooks' },
            { text: 's06 — 设置层级', link: '/guide/s06-settings' },
          ],
        },
        {
          text: '第三层：智能与记忆',
          items: [
            { text: 's07 — 上下文压缩', link: '/guide/s07-compact' },
            { text: 's08 — Memory 系统', link: '/guide/s08-memory' },
            { text: 's09 — Skills', link: '/guide/s09-skills' },
          ],
        },
        {
          text: '第四层：规划与任务',
          items: [
            { text: 's10 — Plan 模式', link: '/guide/s10-plan-mode' },
            { text: 's11 — 任务系统', link: '/guide/s11-tasks' },
          ],
        },
        {
          text: '第五层：多 Agent 协作',
          items: [
            { text: 's12 — 子 Agent', link: '/guide/s12-subagents' },
            { text: 's13 — Agent 团队', link: '/guide/s13-teams' },
            { text: 's14 — Worktree', link: '/guide/s14-worktree' },
          ],
        },
        {
          text: '第六层：生态与全景',
          items: [
            { text: 's15 — MCP 集成', link: '/guide/s15-mcp' },
            { text: 's16 — 全景架构', link: '/guide/s16-architecture' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/' },
    ],

    outline: {
      level: [2, 3],
      label: '目录',
    },

    lastUpdated: {
      text: '最后更新',
    },

    search: {
      provider: 'local',
    },
  },
})
```

- [ ] **Step 3: Create `tutorial/index.md` (landing page)**

```markdown
---
layout: home
hero:
  name: Claude Code 源码解读
  text: 从源码理解第一梯队 AI Agent 的工程架构
  tagline: 基于 v2.1.88 源码 · 16 课渐进式教程 · Python 伪代码 · 设计决策分析
  actions:
    - theme: brand
      text: 开始学习
      link: /guide/
    - theme: alt
      text: 源码索引
      link: /reference/source-map

features:
  - title: 真实源码映射
    details: 每课对应 Claude Code 源码中的真实模块，标注文件路径和关键代码
  - title: Python 伪代码
    details: 用 Python 重写核心逻辑，降低 TypeScript 门槛
  - title: 设计决策分析
    details: 不仅讲"怎么做"，更讲"为什么这样做"，对比 OpenCode/Cursor
  - title: 渐进式学习
    details: 从 Agent 循环到多 Agent 协作，每课只加一个机制
---
```

- [ ] **Step 4: Create `tutorial/guide/index.md` (learning path overview)**

这个文件是学习路径总览页，包含：
- 教程定位说明（面向 Agent 开发者的源码解读）
- 六层架构的层级关系图（Mermaid）
- 16 课的完整目录表（带简介和对应源码）
- 学习建议（按层推进，每层可独立阅读）
- 参考资源链接

**内容要点：**
- 用 Mermaid 画六层架构的层级关系
- 用表格列出 16 课，包含：课号、标题、motto、对应源码路径
- 说明每一层解决什么类型的问题
- 标注 harness engineering 优势在哪些课体现

- [ ] **Step 5: Create `tutorial/reference/source-map.md`**

源码路径索引页，按模块分类列出所有教程中引用的源码路径：

**内容结构：**
- 入口与启动：`src/entrypoints/cli.tsx`, `src/main.tsx`, `src/setup.ts`
- 核心循环：`src/QueryEngine.ts`, `src/query.ts`
- 上下文组装：`src/context.ts`
- 工具系统：`src/tools/` 下所有 40+ 工具
- 权限系统：`src/utils/permissions/` 下所有文件
- Hooks：`src/utils/hooks/` 下所有文件
- 设置：`src/utils/settings/settings.ts`
- 压缩：`src/services/compact/`
- 记忆：`src/memdir/`
- Skills：`src/skills/`
- 任务：`src/tasks/`
- Agent：`src/tools/AgentTool/`
- 团队：`src/tools/TeamCreateTool/`, `src/tools/SendMessageTool/`
- Worktree：`src/utils/worktree.ts`
- MCP：`src/services/mcp/`
- API：`src/services/api/claude.ts`
- UI：`src/screens/REPL.tsx`, `src/state/AppState.tsx`

- [ ] **Step 6: Create public directory and install deps**

Run:
```bash
mkdir -p tutorial/public/images
cd tutorial && npm install
```

- [ ] **Step 7: Verify VitePress builds**

Run:
```bash
cd tutorial && npx vitepress build
```
Expected: Build succeeds with warnings about empty guide pages (normal since lessons not yet created)

- [ ] **Step 8: Commit scaffold**

```bash
git add tutorial/
git commit -m "feat: scaffold VitePress tutorial site with config and index pages"
```

---

## Task 2: Layer 1 — Core Engine (s01, s02, s03)

**Files:**
- Create: `tutorial/guide/s01-agent-loop.md`
- Create: `tutorial/guide/s02-tools.md`
- Create: `tutorial/guide/s03-system-prompt.md`

**Context:** These 3 lessons form the foundation. Before writing, read the actual source code to enrich the pseudocode and design decisions beyond the spec.

**Source code to read first:**
- `src/QueryEngine.ts` — understand the actual message loop
- `src/query.ts` — understand query execution flow
- `src/tools/` — understand Tool interface and registration
- `src/context.ts` — understand system prompt assembly
- `src/services/api/claude.ts` — understand cache breakpoint strategy
- `src/entrypoints/cli.tsx` — understand startup flow

- [ ] **Step 1: Read source code for Layer 1**

Read the source files listed above. Extract:
1. The actual agent loop implementation from `QueryEngine.ts`
2. The Tool interface definition and registration pattern
3. The system prompt assembly logic from `context.ts`
4. The `SYSTEM_PROMPT_DYNAMIC_BOUNDARY` usage
5. Cache breakpoint placement in `claude.ts`

- [ ] **Step 2: Write `tutorial/guide/s01-agent-loop.md`**

Follow the lesson template from the spec. This lesson covers:
- **问题**: 一个 AI 编程助手的核心运转机制是什么？
- **架构图**: Mermaid 图展示 `cli.tsx → main.tsx → QueryEngine.ts` 调用链 + 消息循环
- **核心机制**: 
  - 入口调用链解析
  - `while(stop_reason !== 'end_turn')` 核心循环
  - 双模式：REPL (Ink TUI) vs SDK (JSON stream)
  - 启动并发优化（配置/密钥预取并行模块加载）
  - 消息列表累积
- **Python 伪代码**: spec 中的 `agent_loop()` 函数，增加流式输出支持
- **源码映射**: `cli.tsx`, `main.tsx`, `QueryEngine.ts`, `query.ts`
- **设计决策**:
  - 为什么 CLI 用 React(Ink)？→ 流式+并发状态管理
  - 为什么分 REPL/SDK？→ IDE/CI 嵌入
  - **Harness 优势**: "苦涩教训"哲学 + 主动推理 vs 被动检索（对比 Cursor RAG）
- **变化表**: 无（第一课）
- **动手试试**: 用 Python 实现一个最小 agent loop（30行以内）

- [ ] **Step 3: Write `tutorial/guide/s02-tools.md`**

This lesson covers:
- **问题**: 40+ 工具如何注册、分发、执行？
- **架构图**: Mermaid 图展示工具注册 → dispatch → 权限校验 → 执行流程
- **核心机制**:
  - Tool 接口：`name`, `description`, `checkPermissions()`, `validateInput()`, `isConcurrencySafe()`, `call()`
  - 工厂模式注册 + dispatch map 分发
  - ToolSearch 延迟加载机制
  - 工具分类（文件/Shell/Agent/Task/Web/MCP）
- **Python 伪代码**: spec 中的 `Tool` 类 + `TOOL_REGISTRY` + `dispatch()` 函数
- **源码映射**: `src/tools/`, `src/commands.ts`
- **设计决策**:
  - ToolSearch 为什么比全量注入好？→ token 优化
  - `isConcurrencySafe()` 为什么需要？→ 竞态避免
  - **Harness 优势**: 最小工具集原则（Vercel 实验数据）+ Grep vs 向量搜索
- **变化表**: 新增工具注册 + dispatch 机制
- **动手试试**: 实现 4 个基础工具（bash/read/write/edit）

- [ ] **Step 4: Write `tutorial/guide/s03-system-prompt.md`**

This lesson covers:
- **问题**: 系统提示词是怎么拼出来的？为什么顺序很重要？
- **架构图**: Mermaid 图展示分段缓存架构（静态段 → BOUNDARY → 动态段）
- **核心机制**:
  - 分段缓存：静态段/动态分界线/动态段
  - 前缀匹配优化原理
  - Cache breakpoint 策略
  - CLAUDE.md 注入位置和优先级
- **Python 伪代码**: spec 中的 `build_system_prompt()` 函数
- **源码映射**: `src/context.ts`, `src/setup.ts`, `src/services/api/claude.ts`
- **设计决策**:
  - 硬编码分界线 vs 动态计算 → 缓存键稳定性
  - **Harness 优势**: Prompt Cache 是#1工程差异化（对比 OpenCode 2-part, Aider 手动）
  - 行业洞察："贪婪且精细地压榨 API 缓存系统的价值"
- **变化表**: 新增系统提示词组装 + 缓存分段
- **动手试试**: 实现带缓存分段的 prompt builder

- [ ] **Step 5: Verify build**

Run:
```bash
cd tutorial && npx vitepress build
```
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
git add tutorial/guide/s01-agent-loop.md tutorial/guide/s02-tools.md tutorial/guide/s03-system-prompt.md
git commit -m "feat: add Layer 1 lessons — Agent Loop, Tools, System Prompt"
```

---

## Task 3: Layer 2 — Safety & Control (s04, s05, s06)

**Files:**
- Create: `tutorial/guide/s04-permissions.md`
- Create: `tutorial/guide/s05-hooks.md`
- Create: `tutorial/guide/s06-settings.md`

**Source code to read first:**
- `src/utils/permissions/PermissionMode.ts` — 5 modes
- `src/utils/permissions/bashClassifier.ts` — bash command classification
- `src/utils/permissions/dangerousPatterns.ts` — dangerous pattern library
- `src/utils/permissions/permissions.ts` — permission evaluation
- `src/utils/permissions/denialTracking.ts` — denial tracking
- `src/utils/hooks/` — hook types and execution
- `src/types/hooks.ts` — hook type definitions
- `src/utils/settings/settings.ts` — settings layer loading

- [ ] **Step 1: Read source code for Layer 2**

Read all files listed above. Extract:
1. The 5 permission mode definitions and their behavior differences
2. The bash classifier's actual pattern matching logic
3. The dangerous pattern list
4. The 7 hook types and their trigger conditions
5. The settings layer merge logic

- [ ] **Step 2: Write `tutorial/guide/s04-permissions.md`**

Content per spec s04 section. Key additions from source code reading:
- Actual dangerous pattern examples from `dangerousPatterns.ts`
- Real permission evaluation flow from `permissions.ts`
- **Harness 优势**: 对比 OpenCode 的 wildcard+tree-sitter 方法

- [ ] **Step 3: Write `tutorial/guide/s05-hooks.md`**

Content per spec s05 section. Key additions:
- Real hook type definitions from `src/types/hooks.ts`
- Actual hook execution flow from `execAgentHook.ts`
- JSON I/O format examples

- [ ] **Step 4: Write `tutorial/guide/s06-settings.md`**

Content per spec s06 section. Key additions:
- Actual settings merge implementation from `settings.ts`
- Real config keys and their meanings
- Remote policy mechanism details

- [ ] **Step 5: Verify build and commit**

```bash
cd tutorial && npx vitepress build
git add tutorial/guide/s04-permissions.md tutorial/guide/s05-hooks.md tutorial/guide/s06-settings.md
git commit -m "feat: add Layer 2 lessons — Permissions, Hooks, Settings"
```

---

## Task 4: Layer 3 — Intelligence & Memory (s07, s08, s09)

**Files:**
- Create: `tutorial/guide/s07-compact.md`
- Create: `tutorial/guide/s08-memory.md`
- Create: `tutorial/guide/s09-skills.md`

**Source code to read first:**
- `src/services/compact/` — compaction strategies
- `src/memdir/` — memory system
- `src/skills/loadSkillsDir.ts` — skill discovery
- `src/skills/bundledSkills.ts` — built-in skills
- `src/skills/mcpSkillBuilders.ts` — MCP-derived skills

- [ ] **Step 1: Read source code for Layer 3**

Read all files listed above. Extract:
1. The actual compaction trigger thresholds and strategies
2. Memory file format and indexing mechanism
3. Skill YAML frontmatter schema
4. Two-layer injection implementation details
5. Built-in skill list and their functions

- [ ] **Step 2: Write `tutorial/guide/s07-compact.md`**

Content per spec s07 section. Key additions from source reading:
- Actual token thresholds from compaction config
- Real compaction prompt template
- Transcript save format
- **Harness 优势**: 三层压缩 vs OpenCode 两层

- [ ] **Step 3: Write `tutorial/guide/s08-memory.md`**

Content per spec s08 section. Key additions:
- Real memory type definitions (user/feedback/project/reference)
- MEMORY.md index format
- Auto-memory extraction logic
- Memory injection position in system prompt

- [ ] **Step 4: Write `tutorial/guide/s09-skills.md`**

Content per spec s09 section. Key additions:
- Real YAML frontmatter schema fields
- Built-in skill descriptions
- MCP skill builder logic
- **Harness 优势**: 两层注入 vs OpenCode 单层

- [ ] **Step 5: Verify build and commit**

```bash
cd tutorial && npx vitepress build
git add tutorial/guide/s07-compact.md tutorial/guide/s08-memory.md tutorial/guide/s09-skills.md
git commit -m "feat: add Layer 3 lessons — Compact, Memory, Skills"
```

---

## Task 5: Layer 4 — Planning & Tasks (s10, s11)

**Files:**
- Create: `tutorial/guide/s10-plan-mode.md`
- Create: `tutorial/guide/s11-tasks.md`

**Source code to read first:**
- `src/tools/EnterPlanModeTool/` — plan mode entry
- `src/tools/ExitPlanModeTool/` — plan mode exit with approval
- `src/tasks/` — task management system
- `src/tools/TaskCreateTool/` — task creation
- `src/tools/TaskUpdateTool/` — task update with dependency resolution
- `src/tools/TaskListTool/` — task listing

- [ ] **Step 1: Read source code for Layer 4**

Read all files listed above. Extract:
1. Plan mode allowed tool list
2. Plan file persistence format and location
3. `allowedPrompts` mechanism
4. Task JSON schema (id, subject, status, blockedBy, blocks, owner)
5. Dependency auto-resolution logic on task completion

- [ ] **Step 2: Write `tutorial/guide/s10-plan-mode.md`**

Content per spec s10 section. Key additions:
- Actual allowed tools list from source
- Plan file format and directory structure
- User approval flow implementation
- **Harness 优势**: Plan Mode 不切换工具集（保护缓存前缀）

- [ ] **Step 3: Write `tutorial/guide/s11-tasks.md`**

Content per spec s11 section. Key additions:
- Real task JSON schema from source
- Dependency resolution implementation
- Task directory structure: `.claude/tasks/{team}/`
- **Harness 对比**: 文件型 DAG vs OpenCode SQLite 持久化

- [ ] **Step 4: Verify build and commit**

```bash
cd tutorial && npx vitepress build
git add tutorial/guide/s10-plan-mode.md tutorial/guide/s11-tasks.md
git commit -m "feat: add Layer 4 lessons — Plan Mode, Tasks"
```

---

## Task 6: Layer 5 — Multi-Agent Collaboration (s12, s13, s14)

**Files:**
- Create: `tutorial/guide/s12-subagents.md`
- Create: `tutorial/guide/s13-teams.md`
- Create: `tutorial/guide/s14-worktree.md`

**Source code to read first:**
- `src/tools/AgentTool/` — subagent spawning
- `src/tasks/InProcessTeammateTask.ts` — in-process agent
- `src/tasks/RemoteAgentTask.ts` — remote agent
- `src/tools/TeamCreateTool/` — team creation
- `src/tools/TeamDeleteTool/` — team deletion
- `src/tools/SendMessageTool/` — inter-agent communication
- `src/utils/worktree.ts` — worktree management
- `src/tools/EnterWorktreeTool/` — worktree entry
- `src/tools/ExitWorktreeTool/` — worktree exit

- [ ] **Step 1: Read source code for Layer 5**

Read all files listed above. Extract:
1. Agent type definitions and their tool restrictions
2. Subagent isolation mechanism (independent messages list)
3. Team config.json schema
4. Agent lifecycle states (spawn → WORKING → IDLE → SHUTDOWN)
5. SendMessage protocol (plain text + structured shutdown/plan_approval)
6. Worktree creation/removal implementation
7. Task-worktree binding mechanism

- [ ] **Step 2: Write `tutorial/guide/s12-subagents.md`**

Content per spec s12 section. Key additions:
- Real agent type definitions from `AgentTool`
- Tool restriction lists per agent type
- `isolation: "worktree"` implementation
- Context isolation mechanism details

- [ ] **Step 3: Write `tutorial/guide/s13-teams.md`**

Content per spec s13 section. Key additions:
- Real team config.json schema
- Message delivery mechanism (automatic, not polling)
- Structured protocol format with `request_id`
- Task board collaboration pattern
- IDLE state explanation (normal, not error)

- [ ] **Step 4: Write `tutorial/guide/s14-worktree.md`**

Content per spec s14 section. Key additions:
- Git worktree creation command details
- Branch naming convention (`claude/{name}`)
- Keep vs remove decision logic
- Uncommitted changes safety check
- Two state machines: Task FSM + Worktree FSM

- [ ] **Step 5: Verify build and commit**

```bash
cd tutorial && npx vitepress build
git add tutorial/guide/s12-subagents.md tutorial/guide/s13-teams.md tutorial/guide/s14-worktree.md
git commit -m "feat: add Layer 5 lessons — Subagents, Teams, Worktree"
```

---

## Task 7: Layer 6 — Ecosystem & Big Picture (s15, s16)

**Files:**
- Create: `tutorial/guide/s15-mcp.md`
- Create: `tutorial/guide/s16-architecture.md`

**Source code to read first:**
- `src/services/mcp/client.ts` — MCP client
- `src/services/mcp/MCPConnectionManager.tsx` — connection management
- `src/services/mcp/types.ts` — MCP types
- `src/services/mcp/config.ts` — MCP config parsing
- `src/services/mcp/officialRegistry.ts` — official registry
- `src/entrypoints/cli.tsx` — startup flow
- `src/main.tsx` — main function
- `src/screens/REPL.tsx` — TUI (skim structure, don't need full read)
- `src/state/AppState.tsx` — state management

- [ ] **Step 1: Read source code for Layer 6**

Read all files listed above. Extract:
1. MCP server configuration format in settings.json
2. Transport types (stdio/SSE) and connection setup
3. Tool naming convention (`mcp__{server}__{tool}`)
4. Connection lifecycle and reconnection
5. End-to-end startup sequence from cli.tsx to QueryEngine
6. REPL.tsx structure and why React is used

- [ ] **Step 2: Write `tutorial/guide/s15-mcp.md`**

Content per spec s15 section. Key additions:
- Real MCP config format from settings.json
- Server connection lifecycle
- Tool auto-registration flow
- Resource caching mechanism
- Elicitation support

- [ ] **Step 3: Write `tutorial/guide/s16-architecture.md`**

Content per spec s16 section. This is the capstone lesson that ties everything together:
- End-to-end startup flow diagram (Mermaid)
- Single query lifecycle flow diagram (Mermaid)
- Why CLI uses React (Ink) — detailed justification
- Architecture decision summary table
- **Harness Engineering 总结**: All 7 differentiators summarized with rankings
- Comparison table: Claude Code vs OpenCode vs Cursor

- [ ] **Step 4: Verify build and commit**

```bash
cd tutorial && npx vitepress build
git add tutorial/guide/s15-mcp.md tutorial/guide/s16-architecture.md
git commit -m "feat: add Layer 6 lessons — MCP, Architecture Overview"
```

---

## Task 8: Polish & Finalize

**Files:**
- Modify: `tutorial/guide/index.md` — finalize with actual lesson links and timeline
- Modify: `tutorial/reference/source-map.md` — verify all source paths exist
- Modify: `tutorial/.vitepress/config.ts` — add any missing config

- [ ] **Step 1: Finalize `guide/index.md` with timeline visualization**

Add a visual timeline showing the 16-lesson progression:
- Mermaid graph showing layer dependencies
- Table with all lessons, their mottos, and LOC growth
- "Prerequisites" section explaining what readers should know
- "How to use this tutorial" guide

- [ ] **Step 2: Verify all source code paths in `reference/source-map.md`**

Run glob/grep to verify every source path referenced in the tutorial actually exists in the repo:
```bash
# Check each referenced path exists
for path in src/QueryEngine.ts src/query.ts src/context.ts ...; do
  test -f "$path" && echo "OK: $path" || echo "MISSING: $path"
done
```

Fix any broken paths.

- [ ] **Step 3: Cross-reference all lessons for consistency**

Check:
- All lessons follow the same template structure
- Python pseudocode uses consistent variable/function names across lessons
- Source mapping tables use the same format
- "变化表" in each lesson correctly references the previous lesson
- Mermaid diagrams render correctly

- [ ] **Step 4: Full build and local preview**

```bash
cd tutorial && npx vitepress build && npx vitepress preview
```

Open in browser and verify:
- All pages render correctly
- Sidebar navigation works
- Mermaid diagrams render
- Code blocks have syntax highlighting
- Search works

- [ ] **Step 5: Final commit**

```bash
git add tutorial/
git commit -m "feat: finalize Claude Code tutorial — 16 lessons, source mapping, harness analysis"
```

---

## Execution Notes

### Parallelization Opportunities

Tasks 2-7 (the six layer tasks) are **independent** and can be executed in parallel by separate subagents. Each task:
1. Reads its own set of source files
2. Writes its own set of lesson files
3. Has no dependencies on other layer tasks

Recommended parallel dispatch: Tasks 2+3+4 in one batch, Tasks 5+6+7 in a second batch (or all 6 in parallel if resources allow).

Task 1 (scaffold) must complete first. Task 8 (polish) must run last.

### Key Principles for Content Writers

1. **Read the actual source code** before writing each lesson — don't just copy the spec's pseudocode. The spec is a skeleton; the source code provides the flesh.
2. **Python pseudocode should be understandable standalone** — a reader should be able to grasp the concept from the Python code alone, without reading the TypeScript source.
3. **Design decisions must include the "why"** — not just "Claude Code does X", but "Claude Code does X because Y, and this is better than Z because..."
4. **Harness engineering comparisons** are the differentiator of this tutorial. Weave them naturally into the "设计决策" sections, don't treat them as an afterthought.
5. **Mermaid diagrams** should be used for every architecture overview and data flow. Keep them simple and readable.
6. **每课 Motto** should be in English, concise, memorable.
