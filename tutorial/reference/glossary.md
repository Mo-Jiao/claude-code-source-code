# 术语表

> 本教程中出现的核心术语和概念，按字母/拼音排序

## A

### Agent Loop (Agent 循环)
AI Agent 的核心运行机制：`while(true) { call_model() → check stop_reason → if tool_use → execute_tool → loop }`。参见 [s01](../guide/s01-agent-loop)。

### A2A (Agent-to-Agent Protocol)
Google 提出的 Agent 间通信协议，解决 Agent → Agent 的水平协作。与 MCP（Agent → 工具的垂直集成）互补。

### ACP (Agent Communication Protocol)
BeeAI/IBM 提出的企业级 Agent 互操作协议，面向企业内部多 Agent 系统的可发现性和协作。与 A2A 定位互补，ACP 侧重企业级治理。

### AGENTS.md
跨工具通用的 Agent 配置标准，类似 Claude Code 的 CLAUDE.md 但面向整个行业。旨在让同一份配置文件能被不同 AI 编码工具识别和使用。

### AsyncGenerator (异步生成器)
Python/TypeScript 的流式数据模式，Claude Code 用它实现从 API 到 UI 的全链路流式传输，调用方用 `async for` 逐条消费结果。

## C

### Cache Hit (缓存命中)
API 请求的前缀与之前的请求匹配时，服务端复用已有计算结果，减少 token 成本。Claude Code 通过精心设计 system prompt 顺序实现 90%+ 命中率。参见 [s03](../guide/s03-system-prompt)。

### Context Collapse
实验性上下文管理机制，替代传统的三层压缩（micro / auto / manual）。通过更激进的策略管理上下文窗口空间。

### Context Rot (上下文腐烂)
上下文窗口中信息逐渐退化的现象，包含四种类型：Amnesia（遗忘）、Dilution（稀释）、Overflow（溢出）、Contamination（污染）。是 Agent 长对话中的核心挑战。

### Compact (上下文压缩)
对话过长时，用 LLM 将旧消息摘要为简短总结，腾出上下文窗口空间。Claude Code 有三层压缩：micro / auto / manual。参见 [s07](../guide/s07-compact)。

### Context Engineering (上下文工程)
管理模型每次推理时看到的信息的工程学科，2026 年逐步取代 "Prompt Engineering" 成为主流术语。四大策略：Write / Select / Compress / Isolate。参见 [s00](../guide/s00-harness-engineering)。

### Context Window (上下文窗口)
模型单次推理能处理的最大 token 数量。Claude 的上下文窗口为 200K tokens。超过此限制的内容需要被压缩或丢弃。

## D

### DAG (有向无环图)
Directed Acyclic Graph，一种图数据结构，有方向（A→B）且无环（不能 A→B→C→A）。Claude Code 用文件 DAG 管理任务依赖关系。参见 [s11](../guide/s11-tasks)。

### DCE (死代码消除)
Dead Code Elimination，编译优化技术。Bun 的 `feature()` 函数在编译时决定代码是否保留，npm 发布的 Claude Code 通过 DCE 移除了 108 个内部模块。

### Deny-by-default (默认拒绝)
安全设计原则：在没有明确允许规则时，默认拒绝操作。与 "fail-open"（默认允许）相反。Claude Code 的权限系统采用此原则。参见 [s04](../guide/s04-permissions)。

## E

### Extract Memories (提取记忆)
对话结束后自动运行的后台代理，从对话历史中提取值得跨会话保存的记忆（用户偏好、项目约定等），写入记忆文件供后续会话使用。

## F

### Fail-closed (失败关闭)
安全术语：当系统遇到异常或不确定情况时，选择拒绝/关闭而非允许/放行。例如：工具默认不可用（fail-closed），必须显式注册才能使用。与 "fail-open" 相反。

### Feature Flag (特性开关)
编译时或运行时控制功能是否启用的开关。Claude Code 使用 Bun 的 `feature()` 作为编译时特性开关，`GrowthBook` 作为运行时开关。

### Fork (分叉)
创建子 Agent 的一种模式：子进程继承工具集（利用 Prompt Cache），但消息历史完全隔离。参见 [s12](../guide/s12-subagents)。

## G

### Git Worktree (Git 工作树)
Git 的一个功能，允许在同一仓库中创建多个工作目录，每个目录对应不同的分支。Claude Code 用它实现多 Agent 并行编辑的文件隔离。参见 [s14](../guide/s14-worktree)。

## H

### Harness (工具链 / 治具)
AI Agent 中模型之外的一切工程基础设施：工具调度、权限控制、上下文管理、记忆系统、多 Agent 协作等。Claude Code 51 万行源码中 99%+ 是 Harness。参见 [s00](../guide/s00-harness-engineering)。

### Harness Engineering
设计和构建 AI Agent Harness 的工程学科。2026 年被行业广泛认可为 AI 工程的核心能力。

### High Water Mark (高水位标记)
ID 分配策略：只增不减，即使删除条目也不复用 ID。保证并发环境下 ID 唯一性。

### Hooks (钩子)
在 Agent 工作流的关键节点注入自定义逻辑的机制。Claude Code 支持 27 种生命周期钩子。参见 [s05](../guide/s05-hooks)。

## M

### MCP (Model Context Protocol)
Anthropic 提出的标准协议，让 LLM Agent 通过统一接口连接外部工具和数据源。类似 "AI 的 USB 接口"。参见 [s15](../guide/s15-mcp)。

### Memory Poisoning (记忆投毒)
安全攻击：通过 prompt injection 污染 Agent 的跨会话记忆，使恶意指令在后续会话中持续生效。

### Micro Compact (微压缩)
Claude Code 的第一层压缩：零 API 成本，直接截断过长的工具结果（如大文件内容），将其替换为摘要信息。参见 [s07](../guide/s07-compact)。

## P

### PewterLedger
Plan Mode 中测试计划详细程度影响的 A/B 实验。实验发现：提供过于详细的计划反而降低 Agent 的自主决策能力，验证了"给方向不给步骤"的 Agent 设计原则。

### Path Traversal (路径穿越)
安全攻击：通过构造含 `../` 的文件路径访问预期目录之外的文件。Claude Code 的 Worktree slug 验证防御此攻击。

### Prompt Cache (提示缓存)
Anthropic API 的缓存机制：如果请求的 system prompt 前缀与之前的请求相同，可复用已有的 KV cache，将输入 token 成本降低为原来的 1/10。

## Q

### QueryEngine
Claude Code 的核心引擎类，封装了 Agent 循环的完整逻辑。REPL（交互模式）和 SDK（编程模式）共享同一个 QueryEngine。参见 [s01](../guide/s01-agent-loop)。

## R

### ReAct (Reason + Act)
Yao et al. 2022 提出的 Agent 循环模式：模型交替进行推理（Reason）和行动（Act），每步行动后观察结果再推理下一步。Claude Code 的 Agent Loop 本质上是 ReAct 模式的工程实现。

### ReWOO (Reasoning Without Observation)
先完整规划再批量执行的 Agent 模式，与 ReAct 的逐步交替不同。减少 LLM 调用次数但牺牲了根据中间结果调整计划的灵活性。

## S

### Skill (技能)
可注入 Agent 的领域知识模块，以 Markdown 文件 (SKILL.md) 形式存在。采用两层注入：名称进 system prompt，完整内容按需加载。参见 [s09](../guide/s09-skills)。

### stop_reason
Anthropic API 返回的字段，指示模型为何停止生成：
- `end_turn`：模型主动结束（回复用户）
- `tool_use`：模型请求调用工具
- `max_tokens`：达到输出 token 上限

### System Prompt (系统提示词)
在每次 API 调用中发送的指令文本，包含工具定义、权限规则、CLAUDE.md 内容等。Claude Code 的 system prompt 有四层结构。参见 [s03](../guide/s03-system-prompt)。

## T

### Token
LLM 处理文本的基本单位，大约每个英文单词 1-1.5 个 token，每个中文字 1-2 个 token。API 按 token 计费。

### Tool Use (工具调用)
LLM 不直接执行操作，而是输出结构化的工具调用请求（工具名 + 参数），由 Harness 执行后将结果返回给模型。这是 Agent 与世界交互的核心机制。

### ToxicSkills
Snyk 发现的 335 个恶意 Skills 供应链攻击：恶意 Skill 文件中嵌入有害 prompt injection payload，安装后在 Agent 运行时被注入。
