# s00 — Harness Engineering 导论

> The model is the engine; the harness is everything else.

## Key Takeaways

- **Harness** = 模型之外的一切工程基础设施：工具调度、权限控制、上下文管理、记忆系统、多 Agent 协作
- **同样的模型，不同的 Harness，表现天差地别** — 这就是 Claude Code 优于同类工具的核心原因
- **2026 行业共识**：AI Agent 的竞争壁垒不在模型，而在 Harness
- **Context Engineering** 是贯穿本教程的核心框架：Write / Select / Compress / Isolate 四策略

---

## 什么是 Harness Engineering

![Harness Architecture Overview](/diagrams/harness-overview.png)

一个 AI Agent 由两部分组成：

```
┌─────────────────────────────────────────────────────┐
│                    AI Agent                          │
│                                                     │
│   ┌───────────┐    ┌─────────────────────────────┐  │
│   │   Model   │    │          Harness             │  │
│   │           │    │                              │  │
│   │  Claude   │◄──►│  工具调度 · 权限控制         │  │
│   │  Sonnet   │    │  上下文管理 · 记忆系统       │  │
│   │  Opus     │    │  任务规划 · 多 Agent 协作    │  │
│   │           │    │  安全沙箱 · 配置管理         │  │
│   └───────────┘    └─────────────────────────────┘  │
│     ~1% 代码量            ~99% 代码量               │
└─────────────────────────────────────────────────────┘
```

- **Model**：大语言模型本身，负责理解、推理、生成
- **Harness**：包裹模型的一切工程基础设施

Claude Code 的源码有 51 万行、1,884 个文件。其中 Agent 核心循环不到 100 行，剩下的 **99%+ 都是 Harness**。

> *"AI 编码工具的护城河不是模型，而是 Harness。"* — 社区共识

### 一个类比

| 概念 | 汽车 | AI Agent |
|------|------|----------|
| 引擎 | 发动机 | LLM 模型 |
| Harness | 变速箱 + 底盘 + 转向 + 刹车 + 仪表 | 工具系统 + 权限 + 上下文 + 记忆 + UI |
| 效果 | 同一台发动机，底盘不同，赛道表现天差地别 | 同一个模型，Harness 不同，编码能力天差地别 |

---

## 为什么是 Harness 而不是 Framework

你可能想问：这和 LangChain、CrewAI 有什么区别？

| 维度 | Framework (LangChain 等) | Harness (Claude Code 等) |
|------|--------------------------|--------------------------|
| 定位 | 通用积木，组装各种 Agent | 特定 Agent 的完整运行时 |
| 包含 | Chain/Tool/Memory 抽象 | 权限、沙箱、压缩、持久化、UI... |
| 代码量 | 开发者写数百行 | 系统自带数十万行 |
| 关注点 | 如何调用模型 | 模型调用之外的一切 |
| 类比 | React (UI 库) | Chrome (完整浏览器) |

**Framework 是积木，Harness 是成品。** 研究 Harness 的意义在于：理解成品级 Agent 需要解决哪些 Framework 不覆盖的问题。

---

## 行业背景：2026 年的共识

Harness Engineering 已从小众概念升级为 AI 工程核心范式：

**Anthropic 官方认可：**
- 发布《Effective harnesses for long-running agents》和《Harness design for long-running application development》两篇博客
- 《2026 Agentic Coding Trends Report》提出 8 大趋势，其中"Context Engineering 成为核心技能"排第 4

**行业共识：**
- Aaron Levie (Box CEO)：*"Agent harness engineering 是当前时代的力量倍增器"*
- Anthropic re:Invent 演讲：*"构建 Agent 的大部分时间花在 prompt/context engineering 上，而非代码"*
- sketch.dev 经典文章：*"The Unreasonable Effectiveness of an LLM Agent Loop"* — 核心循环惊人地简单，复杂度全在 Harness

---

## Context Engineering 四策略

![Context Engineering 四策略](/diagrams/context-engineering.png)

"Context Engineering" 正在取代 "Prompt Engineering" 成为更准确的术语。核心问题：**如何管理模型在每次推理时看到的信息？**

LangChain 团队将其归纳为四大策略，它们恰好映射到本教程的 16 课：

```
┌───────────────────────────────────────────────────────────┐
│                  Context Engineering                       │
│                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐  │
│  │   WRITE     │  │   SELECT    │  │    COMPRESS      │  │
│  │  持久化到    │  │  选择放入    │  │   压缩已有       │  │
│  │  窗口之外    │  │  窗口的内容  │  │   窗口内容       │  │
│  │             │  │             │  │                  │  │
│  │ s08 Memory  │  │ s03 Prompt  │  │ s07 Compact      │  │
│  │ s06 Settings│  │ s09 Skills  │  │                  │  │
│  │ s11 Tasks   │  │ s05 Hooks   │  │                  │  │
│  └─────────────┘  └─────────────┘  └──────────────────┘  │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                    ISOLATE                           │  │
│  │           给子任务独立的上下文空间                     │  │
│  │                                                     │  │
│  │  s12 Sub-Agents  ·  s13 Teams  ·  s14 Worktree      │  │
│  └─────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

| 策略 | 含义 | 解决的问题 | 对应课程 |
|------|------|-----------|---------|
| **Write** | 把信息持久化到上下文窗口之外 | 跨会话记忆、配置持久化 | s06 s08 s11 |
| **Select** | 选择性地把什么放进上下文 | 避免填满无关信息 | s03 s05 s09 |
| **Compress** | 压缩已有上下文，腾出空间 | 长会话不爆窗口 | s07 |
| **Isolate** | 给子任务独立的上下文空间 | 并行任务互不干扰 | s12 s13 s14 |

在后续每课中，你会看到标注 `[Context: Write/Select/Compress/Isolate]`，帮助你将局部知识连接到这个统一框架。

---

## 本教程的 16 课地图

### 总览

本教程基于 Claude Code v2.1.88 源码 (51 万行, 1,884 文件)，拆解为 6 层 16 课：

```
第一层：核心引擎 ─────────── "Agent 能跑起来"
  s01 Agent 循环          while(true) + tool_use，一切的起点
  s02 工具系统             40+ 工具的注册、调度、并发安全
  s03 系统提示词           四层提示词结构，Prompt Cache 优化

第二层：安全与控制 ────────── "Agent 跑得安全"
  s04 权限系统             五种权限模式，六阶段评估流水线
  s05 Hooks               27 种生命周期钩子，自动化扩展
  s06 设置层级             六层配置合并，企业 MDM 支持

第三层：智能与记忆 ────────── "Agent 跑得聪明"
  s07 上下文压缩           三层压缩策略，长会话续航
  s08 Memory 系统          跨会话记忆，四种记忆类型
  s09 Skills              两层知识注入，按需加载

第四层：规划与任务 ────────── "Agent 跑得有计划"
  s10 Plan 模式            状态机设计，缓存友好
  s11 任务系统             文件 DAG，依赖追踪

第五层：多 Agent 协作 ──────── "Agent 能组队"
  s12 子 Agent             上下文隔离，四种 Agent 类型
  s13 Agent 团队           团队生命周期，消息邮箱
  s14 Worktree             Git 工作树隔离

第六层：生态与全景 ────────── "Agent 连接世界"
  s15 MCP 集成             六种传输协议，OAuth 认证
  s16 全景架构             启动流程，查询生命周期，设计哲学
```

### 三种学习路线

根据你的背景和目标，选择合适的路线：

| 路线 | 时间 | 课程 | 适合人群 |
|------|------|------|---------|
| **速览路线** | 2-3h | s00 → s01 → s02 → s07 → s16 | 想快速了解整体架构 |
| **完整路线** | 2-3 天 | s00 → s01 → ... → s16 | 想系统掌握 Harness 设计 |
| **专项路线** | 半天 | 选择你关注的层 | 只关心特定子系统 |

**专项路线建议：**
- 安全方向：s04 → s05 → s06
- 上下文管理：s03 → s07 → s09
- 多 Agent：s11 → s12 → s13 → s14

---

## 推荐阅读

开始课程前，推荐先浏览这些外部资源，建立更完整的背景认知：

| 资源 | 类型 | 说明 |
|------|------|------|
| [The Unreasonable Effectiveness of an LLM Agent Loop](https://sketch.dev/blog/agent-loop) | 博客 | 核心循环为什么如此简单却有效 |
| [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/harness-design-for-coding-agents) | Anthropic 官方 | Harness 设计的官方指导 |
| [Claude Code Architecture (Reverse Engineered)](https://vrungta.substack.com/) | 博客 | 社区视角的架构分析 |
| [2026 Agentic Coding Trends Report](https://resources.anthropic.com/) | Anthropic 报告 | 行业趋势全景 |
| [Context Management for Deep Agents](https://blog.langchain.com/) | LangChain 博客 | Context Engineering 四策略的来源 |

---

## 下一课

准备好了吗？让我们从 Agent 的心脏开始：

→ [s01 Agent 循环：One loop is all you need](./s01-agent-loop)
