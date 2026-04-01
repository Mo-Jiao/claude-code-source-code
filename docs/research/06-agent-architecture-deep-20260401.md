# 生产级 Agent 架构模式深度调研报告

**日期:** 2026-04-01
**来源数:** 14
**方法:** Tavily 深度搜索与内容提取 + 多轮补充检索

---

## 一、Agent Loop 设计哲学

### 核心循环极简：while + tool_call

2025 年最令人意外的共识是：生产级 Agent 的核心循环可以压缩到 9 行代码。sketch.dev 的 Philip Zeyliger 用 Python 演示了这一本质：

```python
def loop(llm):
    msg = user_input()
    while True:
        output, tool_calls = llm(msg)
        if tool_calls:
            msg = [handle_tool_call(tc) for tc in tool_calls]
        else:
            msg = user_input()
```

他写道："The thing I've been most surprised by is how shockingly simple the main loop of using an LLM with tool use is." [1] 这个循环的全部状态就是对话历史本身——Agent 不需要额外的状态机、工作流引擎或决策树。

Browser Use 团队将这一理念提炼为一句话：**"The only state an agent should have is: keep going until the model stops calling tools."** [2] 他们的 agent-sdk 仓库开宗明义："An agent is just a for-loop." [3]

### Done Tool 模式

Browser Use 指出了一个反直觉的细节：朴素的"模型不再调用工具时停止"策略会失败——Agent 会过早地结束任务。正确做法是强制显式完成：提供一个 `done` 工具，只有当模型主动调用它时才认为任务结束 [3]。这个设计选择在 Claude Code 的 `AgentTool` 实现中也能看到类似思路。

### 为什么简单有效

Vercel 的 Andrew Qu 总结得最直接："Models are getting smarter and context windows are getting larger, so maybe the best agent architecture is almost no architecture at all." [4] 当模型能力足够强时，复杂的编排框架反而成为瓶颈——它限制了模型的自由度，而这正是"苦涩教训"的核心。

---

## 二、工具系统设计权衡

### Vercel 实验：删 80% 工具，准确率 80% → 100%

这是 2025 年最有说服力的工具设计案例。Vercel 团队花了数月构建内部 text-to-SQL agent（d0），配备了专用工具、重度 prompt engineering 和精细的上下文管理。结果："It worked... kind of. But it was fragile, slow, and required constant maintenance." [4]

他们做了一个激进决定：**删掉大部分工具，只保留一个——执行任意 bash 命令**。结果令人震惊：
- 成功率：80% → **100%**
- token 消耗减少 **40%**
- 步骤数减少 **40%**
- 速度提升 **3.5 倍** [4][5]

"The agent got simpler and better at the same time. 100% success rate instead of 80%. Fewer steps, fewer tokens, faster responses. All by doing less." [4]

### Bash 是"皇冠上的宝石"

The New Stack 的报道标题直接用了 "BASH Is All You Need" [6]。背后的逻辑是：bash 提供了一个**完整的行动空间**（complete action space）。与其给模型 20 个专用工具让它选择，不如给一个 bash 让它自己用 `grep`、`cat`、`ls` 组合出解决方案。

sketch.dev 的实践也印证了这一点："With just that one very general purpose tool, the current models can nail many problems, some of them in one shot." 但他们也发现少量额外工具能提升质量——特别是文本编辑工具，因为 "seeing the LLM struggle with sed one-liners re-affirms that visual editors are a marvel." [1]

### "From the agent's perspective, it's all just tools"

Arcade.dev 在 Skills vs Tools 讨论中揭示了一个被忽略的真相：**"From the agent's perspective, it's all just tools. Skills, toolkits, functions, MCP servers: they all end up as options presented to the model."** [7] 这意味着 skill/tool/function 的分类是给人看的——对模型而言，它只关心工具描述是否清晰、行动空间是否完整。

LinkedIn 上 Alex Salazar 进一步指出：skill 和 tool 的区别不是分类问题，而是**架构问题**——关键在于执行边界、模型需要多少自主权、以及错误恢复策略 [8]。

### 工具数量的甜蜜点

Vercel 的实验表明每个工具都是模型必须做的一个决策，工具过多会导致选择困难。但另一个极端——只给 bash——也不总是最优。Browser Use 的经验是："Give the LLM as much freedom as possible, then vibe-restrict based on evals." [3] 实践中的甜蜜点是：**1 个通用工具（bash）+ 少量高频专用工具（文件编辑、搜索）**。

---

## 三、上下文压缩策略

### Factory AI 的 36K+ 生产消息评估

Factory AI 开发了目前最系统的上下文压缩评估框架，覆盖了 36,000+ 条来自调试、代码审查和功能开发的生产消息 [9]。他们测试了三种主要策略：

1. **截断法**（Truncation）：简单丢弃早期消息——快速但信息损失不可控
2. **基于嵌入的压缩**（Embedding-based）：使用 OpenAI/Anthropic 的压缩 API——中等质量
3. **结构化摘要**（Structured Summarization）：保留关键决策和上下文——效果最好

核心发现：**结构化摘要在保留有用信息方面显著优于 OpenAI 和 Anthropic 的替代方案** [9]。一个令人印象深刻的数字：优秀的压缩策略能实现 **98.7% 的 token 缩减**，同时保持任务完成质量 [10]。

### Manus 的上下文工程实践

Manus AI 的上下文工程方案提供了另一个生产级视角。他们的核心策略包括：
- **KV-cache 命中率**作为最重要的生产指标——比 token 数更重要 [11]
- **工具遮蔽而非移除**（tool masking instead of removal）：不改变工具列表以保持 KV-cache 稳定 [12]
- **文件系统作为上下文管理器**：将长输出写入文件而非直接塞入对话 [12]

### 三层压缩架构

综合多个生产系统的经验，当前最佳实践是三层架构：
- **微压缩**：每轮工具输出的即时处理（Browser Use 的 ephemeral messages——只保留最近 N 条大型输出）[3]
- **自动压缩**：接近上下文窗口限制时自动触发摘要（Browser Use 的 context compaction 功能）[3]
- **手动压缩**：用户主动要求的完整会话压缩

关键设计原则：**压缩前保存完整转录，信息永不真正丢失**。Cursor 的实践是将长工具输出转换为文件引用，用 chat history 摘要替代完整历史 [13]。

---

## 四、多 Agent 协作模式

### 五种核心编排模式

当前生产系统中最常见的五种多 Agent 编排模式 [14][15]：

1. **Chaining（链式）**：Agent A 的输出作为 Agent B 的输入，适用于严格顺序的流水线
2. **Routing（路由）**：一个路由器 Agent 根据任务类型分发给专用 Agent
3. **Parallelization（并行）**：多个 Agent 同时处理独立子任务，类似 MapReduce
4. **Orchestrator-Worker（编排-工人）**：一个编排器分解任务并协调多个 worker
5. **Evaluator-Optimizer（评估-优化）**：一个 Agent 执行，另一个评估并要求改进

AgileSoftLabs 的报告称，部署多 Agent 架构的企业报告了 **3 倍任务完成速度提升**和 **60% 精度改善** [16]。

### Google ADK 的多 Agent 模式

Google 的 Agent Development Kit 提供了原生的多 Agent 支持，包括层级组织（hierarchical）和动态路由 [17]。这标志着多 Agent 模式从学术概念进入主流框架。

### 文件系统邮箱 vs 消息队列

在 Agent 间通信机制上存在两种流派：
- **文件系统邮箱**：Manus 和 Claude Code 采用文件系统作为 Agent 间的共享状态——简单、可审计、不需要额外基础设施 [12]
- **消息队列/事件驱动**：从微服务架构迁移而来，适合大规模分布式 Agent 系统 [15]

实践中，文件系统方案在单机多 Agent 场景下更实用——Agent 可以直接读写共享目录，天然支持版本控制和审计。

---

## 五、权限与安全模型

### Deny-by-default 为什么是正确选择

安全领域的共识越来越明确：AI Agent 必须采用 deny-by-default 模型。Dev.to 上的讨论总结道："Default-deny isn't paranoia; it's the minimum viable security for AI agents with real funds. Start with everything blocked, then explicitly allow." [18]

关键原因：**AI Agent 能快速测试数千种权限路径**，传统的 allow-by-default 模型在人类用户身上勉强可用，但面对 Agent 的速度和自动化能力完全不够 [19]。

### 渐进式权限模型

Claude Code 的权限系统体现了当前最成熟的设计 [20]：
- **Plan 模式**：只读，不执行任何修改
- **Auto-approve 读操作**：自动允许文件读取和搜索
- **Ask-once 写操作**：首次写入时询问，之后自动允许同类操作
- **dontAsk 模式**：除预审批工具外全部自动拒绝

这种 3-4 档渐进模型让用户可以根据信任程度逐步放开权限。

### Bash 命令分类器

给 Agent 一个 bash 工具意味着需要精确的命令安全分类。Claude Code 的实现将 bash 命令分为安全（只读如 `ls`、`cat`）和危险（写入、网络、进程管理）两大类，对危险命令要求显式授权 [20]。

### Hooks 作为可编程安全层

Claude Code 的 Hooks 机制允许用户在工具调用前后插入自定义脚本——这本质上是一个**可编程的权限中间件** [21]。例如，可以用 hook 脚本在每次 bash 调用前检查命令是否包含危险操作，实现比静态规则更灵活的安全策略。Penligent 的安全研究也指出了这种模型的边界：project-level 配置不应影响安全姿态 [22]。

---

## 六、"苦涩教训"在 Agent 设计中的应用

### Rich Sutton 的原始论述

Richard Sutton 在 2019 年写道："The biggest lesson that can be read from 70 years of AI research is that general methods that leverage computation are ultimately the most effective, and by a large margin." [23] 更关键的一句："We want AI agents that can discover like we can, not which contain what we have discovered."

### 从 Agent 框架到 Agent 循环

Browser Use 团队用自己的经历验证了这一教训："The first version of Browser Use was a classic agent framework: a model wrapped in a complex message manager..." 然后他们发现：**"Agent frameworks fail not because models are weak, but because their action spaces are incomplete."** [2] 解决方案不是增加更多框架代码，而是让行动空间更完整。

一个更激进的验证来自 Browser Use 内部：**"A prototype agent that only wrote code did better than one with all of our tools."** [24] 一个只会写代码的原型 Agent 打败了拥有全部工具的正式版本。

### Daniel Miessler 的"苦涩教训工程"

Daniel Miessler 将 Sutton 的理论提炼为实践原则——Bitter Lesson Engineering (BLE)："Be extremely specific about what you want, and then give the best tools you have to the best AI you have." [25] 核心规则：

- **分清 what 和 how**：告诉 AI 你想要什么结果，不要规定它怎么做
- **不要用人类发现去污染 AI 的原生能力**："Not only will it not be better if we try to help, but it will likely be far worse." [25]
- **每次模型升级时审视你的脚手架代码**：如果新模型能直接做到，就删掉旧代码

### "给工具不给工作流"

这一原则的实践含义是：为 6 个月后的模型设计系统，而非为当前模型打补丁。Browser Use 的 agent-sdk 哲学："All the value is in the RL'd model, not your 10,000 lines of abstractions." [3] 与其写 10,000 行抽象层来弥补模型不足，不如等模型进步然后删代码。Armin Ronacher（Flask 作者）在其博客中也呼应了这一趋势，认为极简 Agent（如他的 Pi Agent）是"a glimpse into the future of software" [26]。

---

## 七、对教程的启示

| 发现 | 对应教程课程 | 建议新增讨论点 |
|------|------------|-------------|
| 9 行核心循环 | 第 2 课：Agent 循环 | Why: 为什么不用状态机？因为对话历史就是状态 |
| Bash 是最有价值的工具 | 第 5 课：工具系统 | Why: Vercel 删 80% 工具的实验数据 |
| Done Tool 模式 | 第 2 课：Agent 循环 | Why: 朴素停止策略为什么失败 |
| 结构化摘要最优 | 第 7 课：上下文管理 | Why: Factory AI 36K 消息评估的三种策略对比 |
| KV-cache 优先 | 第 7 课：上下文管理 | Why: Manus 为什么用工具遮蔽而非移除 |
| deny-by-default | 第 6 课：权限模型 | Why: Agent 测试权限路径的速度远超人类 |
| Hooks 可编程安全层 | 第 12 课：Hooks | Why: 静态规则无法覆盖的场景 |
| 苦涩教训 | 第 1 课：总览 | Why: 为什么"每次新模型发布就删代码"是正确策略 |
| 五种编排模式 | 第 11 课：多 Agent | Why: 什么场景用 chaining vs orchestrator |
| Skills vs Tools 只是人类分类 | 第 5 课：工具系统 | Why: 对模型而言一切都是工具 |

---

## 参考文献

- [1] Philip Zeyliger, "The Unreasonable Effectiveness of an LLM Agent Loop with Tool Use" — https://sketch.dev/blog/agent-loop
- [2] Browser Use, "The Bitter Lesson of Agent Frameworks" — https://browser-use.com/posts/bitter-lesson
- [3] Browser Use, "agent-sdk: An agent is just a for-loop" — https://github.com/browser-use/agent-sdk
- [4] Vercel, "We removed 80% of our agent's tools" — https://vercel.com/blog/we-removed-80-percent-of-our-agents-tools
- [5] Vercel (X/Twitter), "40% fewer tokens, 40% fewer steps, 3.5x faster" — https://x.com/vercel
- [6] The New Stack, "The Key to Agentic Success? BASH Is All You Need" — https://thenewstack.io
- [7] Arcade.dev, "Agent Skills vs Tools: What Actually Matters" — https://www.arcade.dev/blog/skills-vs-tools
- [8] Alex Salazar, "Limitations of Tools vs Skills in AI Architecture" — https://www.linkedin.com
- [9] ZenML / Factory AI, "Evaluating Context Compression Strategies for Long-Running AI Agents" — https://www.zenml.io/blog/evaluating-context-compression-strategies
- [10] Factory AI (Facebook), "98.7% fewer tokens" — https://www.facebook.com
- [11] Medium, "Manus Open Agent Research Findings" — https://medium.com
- [12] ZenML, "Manus: Context Engineering Strategies for Production AI Agents" — https://www.zenml.io
- [13] ZenML, "Cursor: Dynamic Context Discovery for Production Coding Agents" — https://www.zenml.io
- [14] Level Up Coding, "Multi-Agent Orchestration Patterns That Actually Work in Production" — https://levelup.gitconnected.com
- [15] Indium, "5 Multi-Agent Orchestration Methods for 2026 Workflows" — https://www.indium.tech
- [16] AgileSoftLabs, "Multi-Agent AI Systems Enterprise Guide 2026" — https://www.agilesoftlabs.com
- [17] Google Developers Blog, "Developer's guide to multi-agent patterns in ADK" — https://developers.googleblog.com
- [18] Dev.to, "Default-Deny Policies: Why Your AI Agent Can't Touch What You..." — https://dev.to
- [19] Infosec Conferences, "Default Deny: Hardening Your Cloud for Agentic AI" — https://infosec-conferences.com
- [20] Claude Code Docs, "Configure permissions" — https://code.claude.com
- [21] MorphLLM, "Claude Code Hooks: Automate Every Edit, Commit, and Tool Call" — https://morphllm.com
- [22] Penligent, "Claude Code Security Bypass Research" — https://www.penligent.ai
- [23] Rich Sutton, "The Bitter Lesson" — http://www.incompleteideas.net/IncIdeas/BitterLesson.html
- [24] Alexander Yue (LinkedIn), "Code-Enabled Agents Outperform Tool-Rich Ones" — https://www.linkedin.com
- [25] Daniel Miessler, "Bitter Lesson Engineering" — https://danielmiessler.com/p/bitter-lesson-engineering
- [26] Armin Ronacher, "Pi: The Minimal Agent Within OpenClaw" — https://lucumr.pocoo.org
