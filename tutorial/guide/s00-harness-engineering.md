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

Claude Code 的源码有 51 万行、1,884 个文件。其中 Agent 核心循环骨架约 30 行（while-true + stop_reason 分发），含完整错误处理、hook、预算管理等分支后约 1500 行，剩下的 **99%+ 都是 Harness**。

> *"AI 编码工具的护城河不是模型，而是 Harness。"* — 社区共识

### 两个类比

**计算机类比** (Philschmid, 2026)：

| 计算机 | AI Agent |
|--------|----------|
| CPU | LLM 模型（计算引擎） |
| RAM | 上下文窗口（工作内存） |
| 操作系统 | Harness（调度一切） |
| 应用程序 | Agent 本身（用户看到的） |

操作系统管理 CPU 和 RAM，让应用程序不需要直接操心硬件。同理，Harness 管理模型和上下文窗口，让 Agent 不需要直接操心 token 预算和工具调度。

**汽车类比**：

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

### Codex CLI 对比：应用层安全 vs 内核层安全

同为 CLI agent，Claude Code 和 OpenAI 的 Codex CLI 选择了截然不同的安全架构。对比有助于理解 Harness 设计的权衡空间：

| 维度 | Claude Code (应用层) | Codex CLI (内核层) |
|------|---------------------|-------------------|
| 安全边界 | 六级权限瀑布（Hook + 规则 + 分类器） | OS sandbox（network deny + fs readonly） |
| 灵活性 | 高（规则可精细配置） | 低（sandbox on/off） |
| 开发体验 | 渐进信任 | 始终隔离 |
| 适合场景 | 交互式开发 | 无人值守自动化 |

两种方案没有绝对优劣：Claude Code 的应用层安全更灵活但依赖正确配置，Codex CLI 的内核层 sandbox 更刚性但限制了 agent 的能力边界。

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

> **Context Rot（上下文腐败）**：随着 agent 循环迭代，上下文窗口中累积过时信息、冗余工具结果、失效的中间推理，导致模型推理质量逐步退化。四策略的统一目标就是对抗 Context Rot——Write 防止重要信息被挤出，Select 防止无关信息进入，Compress 清理已腐败的旧信息，Isolate 阻止子任务污染主上下文。

理解了 Context Rot，四大策略的设计动机就清晰了：

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

| 策略 | 含义 | 解决的问题 | 对抗的 Rot 类型 | 对应课程 |
|------|------|-----------|----------------|---------|
| **Write** | 把信息持久化到上下文窗口之外 | 跨会话记忆、配置持久化 | Amnesia（遗忘） | s06 s08 s11 |
| **Select** | 选择性地把什么放进上下文 | 避免填满无关信息 | Dilution（稀释） | s03 s05 s09 |
| **Compress** | 压缩已有上下文，腾出空间 | 长会话不爆窗口 | Overflow（溢出） | s07 |
| **Isolate** | 给子任务独立的上下文空间 | 并行任务互不干扰 | Contamination（污染） | s12 s13 s14 |

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

## 行业上下文：为什么 2026 是 Harness 年

### 从 Prompt 到 Context 到 Harness

行业经历了三个清晰的演进阶段 [R1-6]：

1. **Prompt Engineering（2023-2024）**：聚焦于"怎么问"——精心设计提示词，"Think step by step" 是核心方法论
2. **Context Engineering（2025）**：聚焦于"带什么信息进去"——瓶颈从"你问什么"转向"问题周围提供了什么信息"（Karpathy）
3. **Harness Engineering（2026）**：聚焦于"整个系统如何运作"——不只是 prompt 和 context，而是工具链、权限、压缩、持久化的完整系统工程

Harrison Chase（LangChain）将三者区分为：**Framework 提供积木，Runtime 提供执行环境，Harness 是带观点的、面向生产的完整系统** [R1-4]。

### 约束悖论：限制 Agent 反而提高生产力

这是 2026 年最反直觉的发现之一。LangChain 用数据证明了这一点：**仅通过调整 harness（不换模型），编码 Agent 在 Terminal Bench 2.0 上从 52.8 提升到 66.5——纯靠 harness 工程提升了 13.7 个百分点** [R1-2]。

Epsilla 总结的核心论点是：用规则、反馈循环和 linter 来**约束 Agent 的解空间，悖论性地提高了它的生产力和可靠性** [R1-7]。

### 自评估偏差：为什么权限不是可选的

LLM 领域存在一个已知的自我一致性偏差（self-consistency bias）：**当你让 Agent 评估自己的输出时，它几乎总是会批准** [R1-5]。Anthropic 在其 harness 设计实践中也强调了这一问题。这意味着 Claude Code 的权限系统（s04）和 Hooks（s05）**不是安全特性，而是质量特性**——它们对抗的是模型固有的自我认可偏差。

### "Agent 不难，Harness 才难"

Aakash Gupta："2025 was the year of agents. 2026 is the year of agent harnesses. The model is one component. The harness is what makes it reliable." 强模型有帮助，但没有坚实的 harness，你只是得到了"更快的失败模式"（faster failure modes）[R1-13]。

Claude Code 被反复引用为现有最佳 harness 的代表案例——它之所以优于几乎所有其他 Agent，不是因为模型更强，而是因为它拥有正确的文件系统访问、正确的 harness 控制流、以及正确的上下文管理策略 [R1-1][R1-13]。

> **参考来源：** Philschmid [R1-1]、LangChain [R1-2]、Anthropic [R1-5]、Harrison Chase [R1-4]、Aakash Gupta [R1-13]。完整引用见 `docs/research/05-harness-trends-deep-20260401.md`。

---

## 推荐阅读

开始课程前，推荐先浏览这些外部资源，建立更完整的背景认知：

| 资源 | 类型 | 说明 |
|------|------|------|
| [The Unreasonable Effectiveness of an LLM Agent Loop](https://sketch.dev/blog/agent-loop) | 博客 | 核心循环为什么如此简单却有效 |
| [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/harness-design-for-coding-agents) | Anthropic 官方 | Harness 设计的官方指导 |
| [Claude Code Architecture (Reverse Engineered)](https://vrungta.substack.com/) | 博客 | 社区视角的架构分析 |
| [2026 Agentic Coding Trends Report](https://resources.anthropic.com/) | Anthropic 报告 | 行业趋势全景 |

---

## 设计决策

<!--@include: ./_fragments/ann-s00.md-->

## 下一课

准备好了吗？让我们从 Agent 的心脏开始：

→ [s01 Agent 循环：One loop is all you need](./s01-agent-loop)
