# Harness Engineering & Context Engineering 深度调研报告

**日期:** 2026-04-01
**来源数:** 12
**方法:** Tavily Extract 深度阅读 + Tavily Search 补充搜索

---

## 一、Harness Engineering 的定义与演进

### 什么是 Agent Harness？

Agent Harness 是**包裹在 AI 模型外围、管理长时间运行任务的基础设施系统**。它不是 Agent 本身，而是治理 Agent 运行方式的软件系统，确保 Agent 在长任务中保持可靠、高效和可操控 [1]。

Harness 与 Framework 的关键区别在于**层次不同**：Framework 提供工具调用、Agent 循环等基础构建块；而 Harness 在此之上提供 prompt 预设、工具调用的定制化处理、生命周期钩子（lifecycle hooks）、以及开箱即用的能力如规划、文件系统访问和子 Agent 管理 [1]。正如 Harrison Chase 所说："A term I've heard recently is agent 'harness'. We're building DeepAgents to be that." [4] 他将三者区分为：Framework 提供积木，Runtime 提供执行环境，Harness 则是**带观点的、面向生产的完整系统** [4]。

### CPU/RAM/OS/App 类比

Philschmid 提出了一个精准的计算机类比来理解 Harness 的角色 [1]：

| 计算机组件 | Agent 系统对应 | 职责 |
|-----------|-------------|------|
| **CPU** | 模型 | 提供原始算力（推理能力） |
| **RAM** | 上下文窗口 | 有限的、易失的工作记忆 |
| **OS** | Agent Harness | 管理上下文、处理"启动序列"（prompts/hooks）、提供标准驱动（工具处理） |
| **App** | Agent | 运行在 OS 之上的用户逻辑 |

这个类比最早由 Andrej Karpathy 在 2023 年底首次提出核心思路——"LLM 是 CPU，上下文窗口是 RAM，而你是负责为每个任务加载正确信息的操作系统"，并在 2025 年 6 月的 AI Startup School 演讲中再次详细阐述 [6]。Philschmid 将其进一步发展，明确了 Harness 就是这个 OS 层。

### 演进路径：Prompt → Context → Harness

行业经历了三个清晰的阶段 [6][7]：

1. **Prompt Engineering（2023-2024）**：聚焦于"怎么问"——精心设计提示词。"Think step by step"等技巧曾是核心方法论。
2. **Context Engineering（2025）**：聚焦于"带什么信息进去"——瓶颈不再是你问什么，而是问题周围提供了什么信息 [6]。LangChain 提出 Write/Select/Compress/Isolate 四策略框架 [3]。
3. **Harness Engineering（2026）**：聚焦于"整个系统如何运作"——Harness Engineering 是关于系统的工程，你在模型周围构建工具链来优化任务性能、Token 效率和延迟等目标 [2]。

值得注意的是：**旧的 prompt 技巧在推理模型上反而有害**。GPT-5 的路由架构在内部处理推理，显式的 chain-of-thought 指令现在是冗余甚至有害的 [6]。ALL-CAPS、"YOU MUST"、"NEVER EVER" 等激进格式会过度触发 Claude，产生更差的结果 [6]。

---

## 二、Anthropic 官方 Harness 架构

### 长时间运行 Agent 的核心挑战

Anthropic 在 2025 年 11 月发布了关于长运行 Agent 的权威文章 [5]。核心挑战被精确描述为：

> "The core challenge of long-running agents is that they must work in discrete sessions, and each new session begins with no memory of what came before. Imagine a software project staffed by engineers working in shifts, where each new engineer arrives with no memory of what happened on the previous shift." [5]

即使有 Compaction（上下文压缩）机制，仅靠 Opus 4.5 在 Claude Agent SDK 上循环运行多个上下文窗口，面对"构建一个 claude.ai 克隆"这样的高层指令，仍然无法交付生产级 Web 应用 [5]。

### 初始化 Agent + 编码 Agent 双体架构

Anthropic 的解决方案是**双 Agent 架构** [5]：

- **Initializer Agent（初始化 Agent）**：仅在首次运行时执行，负责搭建结构化环境——功能列表、Git 仓库、进度跟踪文件等 [5][8]。它的产出是后续所有 session 的"共享记忆"。
- **Coding Agent（编码 Agent）**：在每个 session 中被调度，负责做增量进展，同时为下一个 session 留下清晰的制品（artifacts）[5]。

这种设计的核心洞察是：**与其试图让一个 Agent 记住一切，不如将状态外化到文件系统**，让每个新 session 通过读取这些文件来恢复上下文 [5][8]。

### 自评估偏差问题

Anthropic 发现了一个关键问题：**当你让 Agent 评估自己的输出时，它几乎总是会批准** [5][9][10]。这被称为"自评估偏差"（Self-Evaluation Bias）。

经过迭代，他们找到了三个使评估 Agent 有效工作的要求 [9][10]：
1. 评估 Agent 必须使用**不同于编码 Agent 的模型**（或至少不同的上下文）
2. 评估标准必须**具体且可量化**，而非主观判断
3. 必须有**结构化的评估框架**，而非开放式的"这代码好不好"

这对 Claude Code 源码教程有直接启示：理解为什么 Claude Code 的权限系统和 hooks 机制不是可选的"安全特性"，而是**对抗模型固有偏差的工程必需品**。

---

## 三、Context Engineering 六策略

### 原始四策略（LangChain 框架）

LangChain 将 Context Engineering 归纳为四个核心策略 [3]：

**1. Write（写入）**：将信息保存到上下文窗口之外，以备后续使用。包括将对话记忆写入外部存储、将中间结果写入文件系统、scratchpad 模式等。在 Claude Code 中的映射：`memory` 系统（s08）将用户偏好和项目知识持久化到 CLAUDE.md 文件。

**2. Select（选取）**：从外部来源选择性地加载相关信息进入上下文。包括 RAG、向量检索、基于规则的文件选取等。在 Claude Code 中的映射：`system-prompt` 的分层加载机制（s03），按需读取 CLAUDE.md、.claude/settings.json 等配置文件。

**3. Compress（压缩）**：缩减已积累的上下文历史。在 Claude Code 中的映射：`compact` 机制（s07）在上下文接近窗口上限时自动触发，将历史对话压缩为摘要。

**4. Isolate（隔离）**：将不同关注点分离到独立的上下文窗口中。在 Claude Code 中的映射：`subagents`（s12）和 `teams`（s13）将子任务派发到独立的上下文窗口，避免主对话被无关信息污染。

### 新增两策略（2026 扩展）

2026 年的实践扩展了两个重要策略 [11][12]：

**5. Progressive Disclosure（渐进披露）**：不在启动时加载所有指令，而是按需分层注入。Claude Code 的 Skills 机制（s09）是典型实现——只有当任务匹配特定 skill 时，相关指令才被注入上下文 [11]。这源自 90 年代 UX 设计中的同名原则，现在被应用于 Agent 的"Just-In-Time Context"架构 [12]。

**6. Routing（路由）**：将查询导向正确的信息源，而非将所有信息都塞入上下文。Plan Mode（s10）中根据任务类型选择不同的执行策略即是一种路由。

### Tool-as-Context 模式

一个值得特别关注的模式是**将工具作为上下文加载机制**。工具的描述本身就是注入上下文的手段——当你定义一个工具时，它的 schema 和说明文字会进入模型的上下文窗口。Claude Code 的工具系统（s02）中，每个工具的描述不仅告诉模型"能做什么"，更隐含了"应该怎么做"的指导信息 [3][11]。

---

## 四、生产级 Harness 设计模式

### 约束悖论：限制 Agent 反而提高生产力

行业形成的核心共识是："Agents aren't hard; the Harness is hard." [7] Constraining an agent's solution space with rules, feedback loops, and linters **paradoxically increases its productivity and reliability** [7]。

LangChain 的实验用数据证明了这一点：仅通过调整 harness（不换模型），他们的编码 Agent 在 Terminal Bench 2.0 上从 52.8 提升到 66.5——**纯靠 harness 工程提升了 13.7 个百分点** [2]。他们总结 harness 上的三个关键调节旋钮：system prompt、tool choice 和 execution flow [2]。

这在 Claude Code 中的体现是：permissions 系统（s04）不是在"限制"Agent，而是通过约束解空间来提高可靠性；hooks（s05）不是"额外功能"，而是生产级 Agent 的核心基础设施。

### Durability：长任务中的指令遵循衰减

Philschmid 指出了一个被 benchmark 忽视的关键指标——**durability**（持久性）[1]：

> "The gap between models becomes clear the longer and more complex a task gets. It comes down to durability: How well a model follows instructions while executing hundreds of tool calls over time. A 1% difference on a leaderboard cannot detect the reliability if a model drifts off-track after fifty steps." [1]

静态 leaderboard 上的 1% 差异无法检测模型在 50 步之后是否偏离轨道。这解释了为什么 Claude Code 需要 compact（s07）和 memory（s08）的组合——compact 防止窗口溢出，memory 确保关键指令在压缩后仍能被恢复。

### 可观测性从第一天建入

LangChain 强调使用 Traces 来理解 Agent 在规模化运行中的失败模式 [2]：

> "Models today are largely black-boxes, their inner mechanisms are hard to interpret. But we can see their inputs and outputs in text space which we then use in our improvement loops." [2]

他们采用的改进循环是：运行 → 追踪 → 分析失败 → 调整 harness → 再运行。这种方法论的前提是可观测性必须从第一天就建入系统，而非事后添加。

### 配置链（全局 → 项目 → 本地 → 远程策略）

Claude Code 的 settings 系统（s06）实现了一条完整的配置链：全局设置（`~/.claude/settings.json`）→ 项目设置（`.claude/settings.json`）→ 本地设置（`.claude/settings.local.json`）→ 远程策略（企业级的 MDM 策略推送）。这种分层设计是 Harness Engineering 的经典模式——每一层都能覆盖上一层，同时保留最高层的安全底线 [1][5]。

---

## 五、行业共识与争议

### "Agent 不难，Harness 才难"

这已成为 2026 年初的行业共识 [7]。Aakash Gupta 总结道："2025 was the year of agents. 2026 is the year of agent harnesses. The model is one component. The harness is what makes it reliable." [13] 强模型有帮助，但没有坚实的 harness，你只是得到了"更快的失败模式"（faster failure modes）[13]。

Claude Code 被反复引用为现有最佳 harness 的代表案例 [1][13]——它之所以优于几乎所有其他 Agent，不是因为模型更强，而是因为它拥有正确的文件系统访问、正确的 harness 控制流、以及正确的上下文管理策略 [13]。

### Context Window 不随任务复杂度线性扩展

一个重要但反直觉的发现：简单地增大上下文窗口并不能线性提升 Agent 在复杂任务上的表现。推理能力在约 3,000 token 处开始衰减，prompt 的实际甜蜜点在 150-300 词 [6]。这意味着 harness 层面的 compress 和 isolate 策略不是"有更好"，而是**结构性必需**。

### 推理模型 vs 非推理模型的策略差异

2026 年出现了一个重要分化 [6]：
- **推理模型**（GPT-5、Claude 4.6 with extended thinking）：不需要"think step by step"等显式推理引导，这些指令反而有害
- **非推理模型**：传统的 chain-of-thought 技巧仍然有效
- **通用建议**：few-shot 的唯一剩余功能是格式对齐，而非推理引导 [6]

这对 Claude Code 的 system prompt 设计（s03）有直接影响：prompt 的设计需要区分"引导推理"和"提供上下文"两种目的，前者在新模型上需要谨慎使用。

---

## 六、对教程的启示

### 发现与教程课程的映射

| 发现 | 对应课程 | 建议新增的 Why 讨论点 |
|------|---------|---------------------|
| Harness = OS 类比 | s00 Harness Engineering | 为什么 Claude Code 不是一个"聊天机器人"，而是一个操作系统？ |
| 双体架构（Initializer + Coding Agent） | s12 Subagents | 为什么 Anthropic 选择用两个 Agent 而非一个？状态外化到文件系统的设计哲学。 |
| 自评估偏差 | s04 Permissions, s05 Hooks | 为什么权限系统不是"安全特性"而是"质量特性"？模型会系统性地高估自己的输出。 |
| 约束悖论 | s04 Permissions | 为什么限制 Agent 反而让它更强？LangChain 仅改 harness 提升 13.7 分的案例。 |
| Durability 衰减 | s07 Compact, s08 Memory | 为什么 compact 不够，还需要 memory？指令遵循在 50 步后显著衰减。 |
| Progressive Disclosure | s09 Skills | 为什么不把所有指令一次性塞进 system prompt？渐进披露的 UX 智慧。 |
| Write/Select/Compress/Isolate | s07, s08, s12, s13 | 四策略如何分别映射到 Claude Code 的四个子系统？ |
| 配置链分层 | s06 Settings | 为什么需要四层配置而非一个配置文件？安全底线 vs 灵活性的设计权衡。 |
| Tool-as-Context | s02 Tools | 工具描述不仅定义能力，更是注入上下文的隐藏通道。 |
| 推理模型的 prompt 差异 | s03 System Prompt | 为什么 Claude Code 的 system prompt 避免 "think step by step"？新一代模型的 prompt 反模式。 |

### 建议新增讨论点

1. **s00 课程**增加"为什么 2026 是 Harness 年"的时代背景，引用 Philschmid 的 OS 类比和 Aakash 的"faster failure modes"观点。
2. **s07 课程**增加 durability 衰减的量化讨论——为什么 benchmark 上的 1% 差距在 50 步后会被放大。
3. **s12 课程**增加 Anthropic 双体架构的 Why 讨论——为什么状态外化比上下文保持更可靠。

---

## 参考文献

- [1] Philschmid, "The importance of Agent Harness in 2026" — https://www.philschmid.de/agent-harness-2026
- [2] LangChain Blog, "Improving Deep Agents with harness engineering" — https://blog.langchain.com/improving-deep-agents-with-harness-engineering/
- [3] LangChain, "Context Engineering for Agents" — https://blog.langchain.com/context-engineering/ (via Tavily search results)
- [4] Harrison Chase, "Agent Framework vs Runtime vs Harness" — https://www.linkedin.com/posts/harrison-chase-961287118_agent-framework-vs-runtime-vs-harness-activity-7387885717261078529-_Mn_
- [5] Anthropic, "Effective harnesses for long-running agents" — https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
- [6] The AI Corner, "Prompt Engineering Is Dead. Context Engineering Is What Matters Now." — https://www.the-ai-corner.com/p/context-engineering-guide-2026
- [7] Epsilla Blog, "Why Harness Engineering Replaced Prompting in 2026" — https://www.epsilla.com (via Tavily search results)
- [8] ZenML, "Long-Running Agent Harness for Multi-Context Software Development" — https://www.zenml.io (via Tavily search results)
- [9] The AI Automators, "Anthropic Just Dropped the New Blueprint for Long-Running AI Agents" — https://www.theaiautomators.com (via Tavily search results)
- [10] Reddit r/ClaudeAI, "Anthropic shares how to make Claude code better with a harness" — https://www.reddit.com/r/ClaudeAI/ (via Tavily search results)
- [11] Kushal Banda, "State of Context Engineering in 2026" — https://medium.com (via Tavily search results)
- [12] AI Positive Substack, "Progressive Disclosure Matters: Applying 90s UX Wisdom to 2026 AI Agents" — https://aipositive.substack.com (via Tavily search results)
- [13] Aakash Gupta, "2025 Was Agents. 2026 Is Agent Harnesses. Here's Why That Changes Everything." — https://aakashgupta.medium.com/2025-was-agents-2026-is-agent-harnesses-heres-why-that-changes-everything-073e9877655e
