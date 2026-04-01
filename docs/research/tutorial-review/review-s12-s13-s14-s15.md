# 审查报告：s12-s15（子 Agent / 团队 / Worktree / MCP）

> 审查日期：2026-04-01 | 审查范围：tutorial/guide/s12-s15 | 源码基准：src/tools/, src/services/mcp/, src/utils/

## 审查摘要（200 字）

s12-s15 覆盖了 Claude Code 多 Agent 协作栈的完整架构：从单任务委派（子 Agent）到持续协作（团队）、文件隔离（Worktree）、外部工具集成（MCP）。整体源码映射准确率约 92%，主要偏差集中在 s12：教程声称"四种内置 Agent 类型"但实际有 5+ 种（含 `verificationAgent`、`claudeCodeGuideAgent`，通过 feature gate 控制）；Explore Agent 的模型选择有条件分支（Anthropic 内部用 inherit，外部用 haiku）未提及。s13-s15 的源码映射高度准确，所有关键函数名和文件路径均经验证存在。技术深度方面，四节课均遗漏了 feature gate 机制、后端抽象层（swarm/backends/）、XAA 跨应用访问、MCP 延迟加载等重要细节。教学设计方面，s12→s13 的概念跨度过大，缺少过渡；s15 练习 1 是优秀的动手练习但缺少完整可运行代码。竞品对比表提供了有价值的横向视角，但部分对比可能已过时。

---

## s12 — 子 Agent：干净上下文的委派

### 1. 源码一致性验证

| 教程声明 | 验证结果 | 说明 |
|---------|---------|------|
| `src/tools/AgentTool/AgentTool.tsx` 是入口 | ✅准确 | 文件存在 |
| `src/tools/AgentTool/runAgent.ts` 含 `createSubagentContext` | ✅准确 | 第 53 行导入，第 700 行调用 |
| `src/tools/AgentTool/forkSubagent.ts` 含 `isInForkChild`、`FORK_BOILERPLATE_TAG`、`buildWorktreeNotice` | ✅准确 | 第 78、6、205 行 |
| `src/tools/AgentTool/builtInAgents.ts` 含 `getBuiltInAgents()` | ✅准确 | 第 22 行 |
| `src/tools/AgentTool/built-in/exploreAgent.ts` 含 `EXPLORE_AGENT` | ✅准确 | 第 64 行 |
| `src/tools/AgentTool/built-in/generalPurposeAgent.ts` 存在 | ✅准确 | 文件存在 |
| `src/tools/AgentTool/built-in/planAgent.ts` 存在 | ✅准确 | 文件存在 |
| `src/tools/AgentTool/loadAgentsDir.ts` 解析自定义 agent | ✅准确 | 文件存在 |
| `src/tools/AgentTool/agentToolUtils.ts` | ✅准确 | 文件存在 |
| `src/tools/AgentTool/constants.ts` | ✅准确 | 文件存在 |
| `src/tools/AgentTool/prompt.ts` | ✅准确 | 文件存在 |
| 教程称"四种内置 Agent 类型"：Explore / general-purpose / Plan / Fork | ❌不一致 | `builtInAgents.ts` 实际注册了 `GENERAL_PURPOSE_AGENT`、`EXPLORE_AGENT`、`PLAN_AGENT`、`CLAUDE_CODE_GUIDE_AGENT`、`VERIFICATION_AGENT`（后两者通过 feature gate 控制）。Fork 不是独立的 agent 类型定义，而是 `forkSubagent.ts` 中的运行模式 |
| Explore agent `model: 'haiku'` | ❌不一致 | 实际代码：`model: process.env.USER_TYPE === 'ant' ? 'inherit' : 'haiku'`（exploreAgent.ts:78）。Anthropic 内部员工使用 inherit |
| Explore agent `omitClaudeMd: true` | ✅准确 | exploreAgent.ts:81 |
| Plan agent `model: 'inherit'` | ✅准确 | planAgent.ts:87 |
| Plan agent `omitClaudeMd: true` | ✅准确 | planAgent.ts:90 |
| `disallowedTools` 含 `AGENT_TOOL_NAME, FILE_EDIT_TOOL_NAME, FILE_WRITE_TOOL_NAME` | ✅准确 | exploreAgent.ts:68-71 |
| 源码映射表未包含 `resumeAgent.ts`、`agentMemory.ts`、`agentMemorySnapshot.ts`、`agentDisplay.ts`、`agentColorManager.ts`、`UI.tsx` | ⚠️遗漏 | 这些文件存在于 `src/tools/AgentTool/` 但未在教程中提及 |

### 2. 技术深度补充

**a) Feature Gate 机制（重要遗漏）**

`getBuiltInAgents()` 不是简单地返回固定列表，而是通过多个 feature gate 条件组装：
- `feature('BUILTIN_EXPLORE_PLAN_AGENTS')` 控制 Explore 和 Plan 是否可用
- `CLAUDE_CODE_GUIDE_AGENT` 和 `VERIFICATION_AGENT` 各有独立 gate

- **为什么重要**：读者在不同环境中可能看到不同的 agent 类型列表，教程不解释会造成困惑
- **怎么补充**：在"Agent 类型体系"小节增加一段说明："实际可用的内置 agent 取决于 feature flag 配置，部分 agent 类型仅在特定条件下出现"

**b) Agent 恢复机制（resumeAgent.ts）**

`resumeAgentBackground` 函数（被 SendMessageTool 导入使用）负责恢复已暂停的异步 agent。教程讨论了同步/异步执行，但未提及恢复流程。

- **为什么重要**：异步 agent 被暂停后如何恢复执行是完整生命周期的关键环节
- **怎么补充**：在"同步 vs 异步执行"小节末尾补充恢复机制的说明

**c) Agent 记忆与显示**

`agentMemory.ts`、`agentMemorySnapshot.ts` 说明子 agent 有记忆持久化能力；`agentDisplay.ts`、`agentColorManager.ts` 说明子 agent 有独立的 UI 表示层。教程完全没有提及这些方面。

### 3. 竞品对比洞察

教程中的竞品表对比了 Cursor、Devin、AutoGPT。以下补充：

| 系统 | 子任务上下文策略 | 与 Claude Code 关键差异 |
|------|---------------|----------------------|
| Codex CLI | 沙箱文件系统，单 agent 循环 | 无子 agent 概念，依赖被动沙箱隔离 |
| Cursor Agent Mode | 后台 agent 支持，但共享主会话上下文 | 上下文共享 vs Claude Code 的上下文隔离 |
| Windsurf Cascade | 流式上下文，中间结果持续可见 | 透明 vs Claude Code 的封装 |
| Aider | 单 agent，无子 agent 机制 | 无并行能力 |

- **建议**：更新 Cursor 对比为最新的 Agent Mode 和 Background Agents；增加 Codex CLI 和 Windsurf 的对比行

### 4. 教学法优化

**a) 难度曲线**

"防递归控制"跳跃过大——读者可能还没理解 Fork 的作用就要理解防递归了。Fork 模式应从"Agent 类型体系"中独立出来，先解释 prompt cache 优化动机，再解释防递归。

**b) 缺少最小可运行示例**

Python 伪代码质量高但偏长（339 行）。"动手试试"部分缺少具体的提示词模板。

- **建议**：增加可复制的提示词，如 "在 Claude Code 中输入：`请用 Explore agent 搜索所有包含 TODO 的文件并汇总`，然后追问搜索过程中第三个文件的内容——验证上下文隔离"

**c) 建议增加时序图**

当前架构图是静态的数据流图。增加一张同步 vs 异步子 agent 的执行时间线对比图会大幅提升理解。

### 5. 实战陷阱与案例

**陷阱 1：子 agent 摘要信息丢失**。子 agent 只返回最后一条 assistant 消息文本。如果关键发现分散在多轮对话中，最终摘要可能遗漏。**对策**：在 prompt 中明确要求"将所有发现汇总在最终回复中"。

**陷阱 2：自定义 Agent 的 `permissionMode: bypassPermissions`**。教程示例使用了 bypassPermissions 但未警告安全风险。**对策**：生产环境推荐使用 `default` 权限模式，在教程中增加安全警告。

**陷阱 3：Explore Agent 省略 CLAUDE.md 的副作用**。如果 CLAUDE.md 含关键项目结构信息，Explore agent 搜索时看不到。**对策**：关键上下文应通过其他注入通道（如 git status）传递。

**陷阱 4：异步 agent 权限静默失败**。异步 agent 设 `shouldAvoidPermissionPrompts: true`，需要权限的操作会静默跳过。**对策**：异步 agent 的 prompt 中应明确权限限制。

---

## s13 — Agent 团队：生命周期与协议

### 1. 源码一致性验证

| 教程声明 | 验证结果 | 说明 |
|---------|---------|------|
| `src/tools/TeamCreateTool/TeamCreateTool.ts` | ✅准确 | 文件存在，含 `TeamFile`、`writeTeamFileAsync`、`registerTeamForSessionCleanup` |
| `src/tools/TeamDeleteTool/TeamDeleteTool.ts` | ✅准确 | 文件存在 |
| `src/tools/SendMessageTool/SendMessageTool.ts` | ✅准确 | 含 `writeToMailbox`(39)、`queuePendingMessage`(10)、`handleShutdownApproval`(305)、`handleShutdownRejection`(401)、`semanticBoolean`(22)、`resumeAgentBackground`(41) |
| `src/utils/swarm/teamHelpers.ts` 含 TeamFile 类型和读写 | ✅准确 | 第 64 行 `TeamFile` 类型，第 122 行 `getTeamFilePath` |
| `src/utils/swarm/constants.ts` 含 `TEAM_LEAD_NAME` | ✅准确 | 被 TeamCreateTool.ts:17 导入 |
| `src/utils/teammate.ts` | ✅准确 | 文件存在 |
| `src/utils/teammateMailbox.ts` | ✅准确 | 文件存在 |
| `src/utils/swarm/teammateLayoutManager.ts` | ✅准确 | 文件存在 |
| `src/utils/tasks.ts` 含 `resetTaskList`、`setLeaderTeamName` | ✅准确 | 被 TeamCreateTool.ts:29-30 导入 |
| `src/tasks/InProcessTeammateTask/` | ✅准确 | 目录存在 |
| `src/utils/agentSwarmsEnabled.ts` | ✅准确 | 文件存在 |
| `SendMessageTool/constants.ts` 和 `prompt.ts` | ✅准确 | 文件存在 |
| 教程提到 `agentNameRegistry` | ❌不一致 | 源码中实际通过 `appState.tasks` 查找 agent，而非独立的 `agentNameRegistry` 变量 |
| 源码映射表未列出 `src/utils/teammateContext.ts` | ⚠️遗漏 | 文件存在但教程未提及 |
| 源码映射表未列出 `src/utils/swarm/backends/` 目录 | ⚠️重要遗漏 | 含 7+ 个后端实现文件 |

**未在教程源码映射中出现的重要文件：**

| 文件 | 说明 |
|------|------|
| `src/utils/swarm/backends/detection.ts` | 自动检测可用后端 |
| `src/utils/swarm/backends/TmuxBackend.ts` | tmux 实现 |
| `src/utils/swarm/backends/ITermBackend.ts` | iTerm2 实现 |
| `src/utils/swarm/backends/InProcessBackend.ts` | 进程内实现 |
| `src/utils/swarm/backends/PaneBackendExecutor.ts` | pane 执行器抽象 |
| `src/utils/swarm/backends/registry.ts` | 后端注册表 |
| `src/utils/swarm/spawnInProcess.ts` | 进程内 spawn 逻辑 |
| `src/utils/swarm/spawnUtils.ts` | spawn 工具函数 |
| `src/utils/swarm/leaderPermissionBridge.ts` | Leader 权限桥接 |
| `src/utils/swarm/permissionSync.ts` | 权限同步 |
| `src/utils/swarm/reconnection.ts` | 断线重连 |
| `src/utils/swarm/teammateModel.ts` | Teammate 模型选择 |
| `src/utils/swarm/teammatePromptAddendum.ts` | Teammate prompt 附加内容 |
| `src/utils/swarm/teammateInit.ts` | Teammate 初始化 |
| `src/utils/teammateContext.ts` | Teammate 上下文管理 |

### 2. 技术深度补充

**a) 后端抽象层架构（重要遗漏）**

`src/utils/swarm/backends/` 包含完整的后端抽象层，是理解"为什么团队能在不同终端环境中运行"的关键。教程只列举了三种后端但没有深入架构。

- **为什么重要**：后端选择直接影响性能（in-process 共享事件循环 vs tmux 独立进程）和调试体验
- **怎么补充**：增加后端选择决策树和性能对比表

**b) 权限同步机制**

`permissionSync.ts` 和 `leaderPermissionBridge.ts` 管理 leader 和 teammate 之间的权限传播。教程在 Plan Approval 中提到"批准后降级权限"，但没有深入这个系统。

- **为什么重要**：权限模式决定 teammate 能否自主执行工具调用，是安全的关键环节
- **怎么补充**：在"结构化协议"小节增加权限传播的流程图

**c) 断线重连（reconnection.ts）**

Teammate 可能因网络或进程问题断线。`reconnection.ts` 处理重连逻辑，教程未提及。

**d) 消息顺序保证**

文件系统 mailbox 使用 `{timestamp}-{uuid}.json` 命名。教程应说明排序机制和潜在的竞态条件（多个消息在同一毫秒写入时的顺序）。

### 3. 竞品对比洞察

教程对比了 CrewAI、AutoGen、LangGraph。补充：

| 系统 | 多 Agent 协作模型 | 关键差异 |
|------|---------------|---------|
| Anthropic Agent SDK | 原生 swarm 支持 | Claude Code Teams 是其具体实现还是独立系统？教程未澄清 |
| AutoGen v0.4 | 已从共享对话进化为事件驱动 | 设计哲学上趋近 Claude Code 的 mailbox |
| Google ADK + A2A | 原生多 Agent + A2A 协议 | HTTP 协议 vs 文件系统邮箱 |
| OpenAI Agents SDK | Handoff 模式 | agent 间任务交接 |

- **建议**：标注各竞品的版本/时间点；增加 Agent SDK 自身 swarm 与 Claude Code Teams 的关系说明

### 4. 教学法优化

**a) 概念跨度**

从 s12 的子 agent（单向委派）到 s13 的团队（双向通信+状态机+协议），跨度非常大。

- **建议**：增加过渡段落，用具体场景说明为什么子 agent 不够用（如"前后端 agent 需要协商 API schema"）

**b) 状态机异常路径**

状态机图只展示了正常流程，缺少异常路径——agent 在 WORKING 时崩溃怎么办？

- **建议**：增加"异常恢复"小节或在状态图中增加异常边

**c) 动手练习**

练习偏向源码阅读和思考题。缺少可直接操作的端到端练习。

- **建议**：增加"创建一个两人团队，让一个 agent 写代码、另一个跑测试"的可执行练习，给出提示词模板

### 5. 实战陷阱与案例

**陷阱 1：团队成员泄漏**。Leader 被 `kill -9` 时，`registerTeamForSessionCleanup` 来不及执行。残留的团队文件导致后续同名团队创建失败。**对策**：手动清理 `.claude/teams/{name}/`。

**陷阱 2：广播风暴**。大团队中频繁 `to: '*'` 唤醒所有 agent，浪费 token。**对策**：优先使用点对点消息和任务板。

**陷阱 3：Shutdown 时序竞争**。Leader 发 shutdown_request 后，teammate 正在执行长时间操作（如大型测试），可能很久才能响应。Leader 可能误判。**对策**：说明 shutdown 的超时行为。

**陷阱 4：Plan Approval 死锁**。成员在 plan 模式下等 leader 审批，但 leader 正忙于其他成员。**对策**：设置审批超时。

---

## s14 — Worktree：文件隔离与并行开发

### 1. 源码一致性验证

| 教程声明 | 验证结果 | 说明 |
|---------|---------|------|
| `src/utils/worktree.ts` 含核心管理函数 | ✅准确 | 含 `getOrCreateWorktree`(235)、`validateWorktreeSlug`(66)、`flattenSlug`(217)、`performPostCreationSetup`(510)、`cleanupStaleAgentWorktrees`(1058)、`createAgentWorktree`(902)、`removeAgentWorktree`(961) |
| `src/tools/EnterWorktreeTool/EnterWorktreeTool.ts` | ✅准确 | 文件存在 |
| `src/tools/ExitWorktreeTool/ExitWorktreeTool.ts` | ✅准确 | 含 `countWorktreeChanges`(79)，调用于 191、256 行 |
| `src/tools/EnterWorktreeTool/prompt.ts` | ✅准确 | 文件存在 |
| `src/tools/ExitWorktreeTool/prompt.ts` | ✅准确 | 文件存在 |
| `src/utils/git/gitFilesystem.ts` 含 `readWorktreeHeadSha` | ✅准确 | 被 worktree.ts:23 导入 |
| `src/utils/git.ts` 含 `findCanonicalGitRoot` | ✅准确 | 被 worktree.ts:28 导入 |
| `containsPathTraversal` | ✅准确 | worktree.ts:39 从 `./path.js` 导入，第 109 行使用 |
| `symlinkDirectories` | ✅准确 | worktree.ts:102 |
| `EPHEMERAL_WORKTREE_PATTERNS` | ✅准确 | worktree.ts:1030 |
| `VALID_WORKTREE_SLUG_SEGMENT` | ✅准确 | 在 `validateWorktreeSlug` 中使用 |
| `countWorktreeChanges` 在 `worktree.ts` | ❌不一致 | 实际定义在 `ExitWorktreeTool.ts:79`，不在 `worktree.ts` 中 |
| 教程 Worktree 通知引用 `src/utils/worktree.ts` | ⚠️部分不准确 | `buildWorktreeNotice` 实际在 `src/tools/AgentTool/forkSubagent.ts:205`，不在 `worktree.ts` |

### 2. 技术深度补充

**a) Sparse Checkout 支持（重要遗漏）**

`WorktreeSession` 类型含 `usedSparsePaths?: boolean`，说明 worktree 支持 sparse checkout。教程完全没有提及。

- **为什么重要**：对超大 monorepo，sparse checkout 是 worktree 方案可行的关键——只检出需要的子目录
- **怎么补充**：增加"大仓库优化"小节

**b) `.worktreeinclude` 机制**

教程提到了但没有深入解释。读者需要知道如何使用它来确保 worktree 中有运行所需的 gitignored 文件（如 `.env.local`、证书文件）。

- **怎么补充**：提供一个示例 `.worktreeinclude` 文件内容和使用场景

**c) Hooks 路径兼容性**

`performPostCreationSetup` 设置 `core.hooksPath` 指向主仓库的 `.husky/`。如果 hooks 依赖相对路径（如 `./node_modules/.bin/lint-staged`），在 worktree 中可能因 node_modules 是符号链接而出现意外行为。

- **怎么补充**：增加关于 hooks 兼容性的注意事项

### 3. 竞品对比洞察

教程对比了 Devin（Docker）、Cursor（无隔离）、Codex（沙箱）。补充：

| 系统 | 方案 | 与 Claude Code 差异 |
|------|------|-------------------|
| Aider | 无并行开发支持 | Claude Code worktree 是显著差异化优势 |
| GitHub Codespaces | 完整云端环境隔离 | 分钟级启动 vs 毫秒级 worktree |
| BAML "12-Factor Agent" | 推荐 git worktree 作为隔离方案 | 验证了 Claude Code 的设计选择 |
| VS Code Multi-Root | 多根工作区，无 git 级隔离 | 互补而非竞争 |

### 4. 教学法优化

**a) Git Worktree 前置知识**

教程假设读者熟悉 Git worktree，但很多开发者从未用过。

- **建议**：在正文前增加"Git Worktree 60 秒速成"插入框，解释 `git worktree add` 的基本原理

**b) 概念引入**

缺少对"为什么不能用 cp -r 复制仓库"的对比解释。

- **建议**：增加对比——`cp -r`（慢、浪费磁盘、不共享 git 历史）vs `git worktree`（快、共享对象库、独立分支）

**c) 练习设计**

练习 1（手动创建 worktree）设计好，是真正可执行的。

- **建议**：增加"在 Claude Code 中要求同时修改前端和后端代码"的端到端练习；增加冲突演示——两个 worktree 修改同一文件后 merge

### 5. 实战陷阱与案例

**陷阱 1：符号链接 node_modules 共享问题**。Worktree 通过 symlink 共享 `node_modules`。如果 worktree 中的代码需要不同依赖版本，`npm install` 会影响主仓库。**对策**：从 `settings.worktree.symlinkDirectories` 移除 `node_modules`，或接受磁盘空间换隔离性。

**陷阱 2：Untracked 文件在清理时被忽略**。`cleanupStaleAgentWorktrees` 使用 `git status -uno`，untracked 文件随 worktree 目录被删。**对策**：agent 应 `git add` 所有有价值的新文件。

**陷阱 3：大仓库 fetch 延迟**。`getOrCreateWorktree` 某些情况需要 `git fetch`，大仓库耗时 6-8 秒。**对策**：定期 `git fetch` 保持本地 `origin/main` 最新。

**陷阱 4：磁盘空间泄漏**。Agent 被 SIGKILL 后 worktree 不清理，默认 30 天清理周期可能导致临时积累。**对策**：CI 环境中缩短清理周期。

---

## s15 — MCP 集成：连接外部世界

### 1. 源码一致性验证

| 教程声明 | 验证结果 | 说明 |
|---------|---------|------|
| `src/services/mcp/types.ts` 含 `TransportSchema`、`McpStdioServerConfigSchema` | ✅准确 | types.ts:23、28 |
| `src/services/mcp/config.ts` 含 `getClaudeCodeMcpConfigs()` | ✅准确 | config.ts:1071 |
| `src/services/mcp/config.ts` 含 `doesEnterpriseMcpConfigExist()` | ✅准确 | config.ts:1470 |
| `src/services/mcp/config.ts` 含 `dedupPluginMcpServers()` | ✅准确 | config.ts:223 |
| `src/services/mcp/config.ts` 含 `dedupClaudeAiMcpServers()` | ✅准确 | config.ts:281 |
| `src/services/mcp/config.ts` 含 `filterMcpServersByPolicy()` | ✅准确 | config.ts:536 |
| `src/services/mcp/config.ts` 含 `isMcpServerAllowedByPolicy()` | ✅准确 | 被 filterMcpServersByPolicy 使用 |
| `src/services/mcp/config.ts` 含 `getMcpServerSignature()` | ✅准确 | config.ts:202 |
| `src/services/mcp/config.ts` 含 `expandEnvVars()` | ✅准确 | config.ts:556（底层调用 envExpansion.ts 的 `expandEnvVarsInString`） |
| `src/services/mcp/config.ts` 含 `getAllMcpConfigs()` | ✅准确 | config.ts:1258 |
| `src/services/mcp/officialRegistry.ts` 含 `prefetchOfficialMcpUrls()` | ✅准确 | 文件存在 |
| `src/services/mcp/client.ts` 含 `connectToServer()` (memoized) | ✅准确 | client.ts:595 |
| `src/services/mcp/client.ts` 含 `getMcpToolsCommandsAndResources()` | ✅准确 | client.ts:2226 |
| `src/services/mcp/client.ts` 含 `callMCPTool()` | ✅准确 | client.ts:2121 |
| `src/services/mcp/client.ts` 含 `callMCPToolWithUrlElicitationRetry()` | ✅准确 | client.ts:2813 |
| `src/services/mcp/client.ts` 含 `isMcpSessionExpiredError()` | ✅准确 | client.ts:193 |
| `src/services/mcp/client.ts` 含 `MAX_MCP_DESCRIPTION_LENGTH = 2048` | ✅准确 | client.ts:218 |
| `src/services/mcp/client.ts` 含 `DEFAULT_MCP_TOOL_TIMEOUT_MS = 100_000_000` | ✅准确 | client.ts:211 |
| `src/services/mcp/client.ts` 含 `MCP_AUTH_CACHE_TTL_MS = 15 * 60 * 1000` | ✅准确 | client.ts:257 |
| `src/services/mcp/mcpStringUtils.ts` 含 `buildMcpToolName()` | ✅准确 | mcpStringUtils.ts:50 |
| `src/services/mcp/normalization.ts` 含 `normalizeNameForMCP()` | ✅准确 | 被 mcpStringUtils.ts:7 导入 |
| `src/services/mcp/MCPConnectionManager.tsx` | ✅准确 | 文件存在 |
| `src/services/mcp/auth.ts` 含 `ClaudeAuthProvider` | ✅准确 | auth.ts:1376 |

**教程源码映射中遗漏的重要文件：**

| 文件 | 说明 | 重要性 |
|------|------|--------|
| `src/services/mcp/normalization.ts` | `normalizeNameForMCP` 的实际定义位置 | 中——教程提到了函数但未列出文件 |
| `src/services/mcp/envExpansion.ts` | 环境变量展开底层实现 | 中——教程提到 expandEnvVars 但路径指向 config.ts |
| `src/services/mcp/claudeai.ts` | claude.ai 连接器集成 | 高——教程提到 claudeai scope 但未给源码路径 |
| `src/services/mcp/xaa.ts` / `xaaIdpLogin.ts` | XAA 跨应用访问 | 高——教程在 Key Takeaways 提到 XAA 但正文无解释 |
| `src/services/mcp/elicitationHandler.ts` | 信息引出处理 | 高——MCP 协议 2025 年新增核心能力 |
| `src/services/mcp/InProcessTransport.ts` | 进程内传输 | 中 |
| `src/services/mcp/SdkControlTransport.ts` | SDK 控制传输 | 中 |
| `src/services/mcp/vscodeSdkMcp.ts` | VS Code SDK MCP 集成 | 中 |
| `src/services/mcp/channelAllowlist.ts` | 频道允许列表 | 中 |
| `src/services/mcp/channelPermissions.ts` | 频道权限 | 中 |

### 2. 技术深度补充

**a) XAA 跨应用访问（重要遗漏）**

教程在 Key Takeaways 提到"OAuth + XAA 认证"和"SEP-990"，但正文完全没有解释 XAA 是什么。源码有 `xaa.ts` 和 `xaaIdpLogin.ts`。

- **为什么重要**：XAA 是 Anthropic 的跨应用访问协议，让不同应用共享 MCP 服务器认证凭据——企业部署的关键能力
- **怎么补充**：在 OAuth 认证小节增加 XAA 简要说明，或增加专门的"认证机制"小节

**b) 信息引出（Elicitation）**

`elicitationHandler.ts` 和 `callMCPToolWithUrlElicitationRetry` 暗示 MCP 支持信息引出——服务器可向客户端请求额外信息。教程未提及。

- **为什么重要**：信息引出是 MCP 协议 2025 年新增的核心能力之一，允许 MCP 服务器在工具调用过程中向用户询问缺失信息
- **怎么补充**：在连接管理小节增加引出机制说明

**c) MCP 三大原语**

教程只讨论 tools，但 MCP 协议还支持 prompts（提示模板）和 resources（资源）。函数名 `getMcpToolsCommandsAndResources` 暗示它也处理 resources。

- **为什么重要**：Resources 是 Context Engineering 的重要手段——通过 `resources/read` 将外部数据注入上下文
- **怎么补充**：增加 MCP 三大原语概述

**d) 延迟加载机制**

教程提到了 `_meta['anthropic/alwaysLoad']` 和 `_meta['anthropic/searchHint']`，但没有展开。大型 MCP 服务器（如 OpenAPI 生成的 100+ 工具）需要延迟加载避免 tool schema 占满上下文。

- **怎么补充**：增加"工具加载策略"小节，对比 always-load vs lazy-load

### 3. 竞品对比洞察

教程对比了 Cursor MCP 和 Continue MCP。补充：

| 特性 | Claude Code | Cursor | Windsurf | VS Code (Copilot) |
|------|------------|--------|----------|-------------------|
| 传输类型 | 6 种（含 IDE 专用） | stdio/sse | stdio/sse | stdio/sse |
| 延迟加载 | 支持 | 不支持 | 不支持 | 支持 |
| 企业策略 | 允许/拒绝双列表 | 无 | 无 | 组织策略 |
| 去重机制 | 签名匹配 | 无 | 无 | 无 |
| XAA 认证 | 支持 | 无 | 无 | 无 |

**MCP vs Function Calling 深入对比**（建议补充）：
- Function Calling 是**请求级**的（每次 API 调用传完整 tool schema），MCP 是**会话级**的（连接后 schema 只传一次）
- Function Calling 没有发现/注册机制，MCP 提供完整生命周期管理
- Function Calling 不支持认证和连接管理，MCP 原生支持

**MCP vs A2A vs ACP**（建议从 tip 提升为正式内容）：
- MCP：Agent → 工具（垂直集成）
- A2A（Google）：Agent → Agent（水平协作）
- ACP（BeeAI/IBM）：Agent → Agent（另一种水平协作协议）
- 三者互补，不是竞争关系

### 4. 教学法优化

**a) 变化表基准不一致**

s15 变化表说"与上一课（s08 Memory 系统）相比"。读者如果按 s12→s15 顺序阅读会困惑。

- **建议**：修改基准为"与内置 tools 系统相比"，或说明 MCP 是对 s03-s04 工具系统的扩展

**b) 练习 1 缺少完整代码**

练习 1（实现最小 MCP 服务器）是出色的设计，但只有注释没有可运行代码。

- **建议**：提供完整的 Python MCP 服务器代码（~15 行）和对应的 `.mcp.json` 配置：

```python
from mcp.server.fastmcp import FastMCP
mcp = FastMCP("weather")

@mcp.tool()
def get_weather(city: str) -> str:
    """获取城市天气"""
    return f"{city}: 晴，25°C"

if __name__ == "__main__":
    mcp.run(transport="stdio")
```

```json
{
  "mcpServers": {
    "weather": {
      "command": "python",
      "args": ["weather_server.py"]
    }
  }
}
```

**c) 增加调试练习**

- 故意配置一个连不上的 MCP 服务器，观察超时行为和错误状态
- 在 MCP 服务器中返回 `isError: true`，观察 Claude Code 如何处理

### 5. 实战陷阱与案例

**陷阱 1：环境变量明文泄露**。stdio 配置中 `env` 字段的 API 密钥明文存储。如果 `.mcp.json` 被提交到 git，密钥泄漏。**对策**：使用 `${ENV_VAR}` 引用，实际密钥放在 `.env` 或 `settings.local.json`。

**陷阱 2：描述截断导致功能缺失**。2048 字符截断可能丢失 OpenAPI 生成工具的关键参数说明。**对策**：为 MCP 工具写精简描述，详细文档放在 resources 中。

**陷阱 3：项目级 `.mcp.json` 首次审批摩擦**。克隆含 `.mcp.json` 的仓库时需逐个审批。**对策**：项目 README 中说明需审批的 MCP 服务器列表和用途。

**陷阱 4：工具超时过长**。`DEFAULT_MCP_TOOL_TIMEOUT_MS = 100_000_000`（约 27.8 小时）——卡住的 MCP 工具调用可能阻塞 agent 极长时间。**对策**：自定义 MCP 服务器应实现自己的超时逻辑。

**陷阱 5：`.mcp.json` 供应链攻击**。恶意仓库通过 `.mcp.json` 配置 MCP 服务器读取 `${SECRET_KEY}` 环境变量。虽有审批机制，但用户可能习惯性点 approve。**对策**：审批时仔细检查命令行参数和环境变量列表。

---

## 跨课程整体评价

### 评分汇总

| 维度 | s12 | s13 | s14 | s15 | 整体 |
|------|-----|-----|-----|-----|------|
| 源码准确性 | ⭐⭐⭐½ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐½ | ⭐⭐⭐⭐ |
| 技术深度 | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐½ | ⭐⭐⭐ | ⭐⭐⭐ |
| 竞品对比 | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐½ | ⭐⭐⭐½ | ⭐⭐⭐ |
| 教学设计 | ⭐⭐⭐½ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐½ | ⭐⭐⭐½ |
| 实战价值 | ⭐⭐⭐½ | ⭐⭐⭐½ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐½ |

### 关键改进建议优先级

| 优先级 | 改进项 | 课节 | 类型 |
|--------|-------|------|------|
| **P0** | 修正"四种内置 Agent 类型"为实际数量，补充 feature gate | s12 | 准确性 |
| **P0** | 修正 Explore agent model 的条件分支说明 | s12 | 准确性 |
| **P0** | 修正 `countWorktreeChanges` 的定义位置（在 ExitWorktreeTool.ts 不在 worktree.ts） | s14 | 准确性 |
| **P1** | 补充后端抽象层（swarm/backends/）架构说明 | s13 | 完整性 |
| **P1** | 补充 XAA、Elicitation、MCP Resources/Prompts 的说明 | s15 | 完整性 |
| **P1** | s15 练习 1 提供完整可运行的 MCP 服务器代码 | s15 | 教学 |
| **P2** | s12→s13 增加过渡段落和渐进练习 | s12/s13 | 教学 |
| **P2** | s14 增加 Git Worktree 前置知识速成 | s14 | 教学 |
| **P2** | 更新所有竞品对比表，标注版本和时间点 | 全部 | 时效性 |
| **P3** | s15 变化表基准从"s08"改为更合理的参照 | s15 | 一致性 |
| **P3** | 各课增加端到端可执行练习（非源码阅读） | 全部 | 教学 |

---

## 参考文献

### 已验证的源码文件

1. `src/tools/AgentTool/AgentTool.tsx` — Agent 工具入口
2. `src/tools/AgentTool/runAgent.ts` — 子 agent 运行器，含 `createSubagentContext`(L700)
3. `src/tools/AgentTool/forkSubagent.ts` — Fork 模式，含 `isInForkChild`(L78)、`buildWorktreeNotice`(L205)
4. `src/tools/AgentTool/builtInAgents.ts` — 内置 agent 注册，含 feature gate(L14,51,61,65)
5. `src/tools/AgentTool/built-in/exploreAgent.ts` — Explore agent，`EXPLORE_AGENT`(L64)，model 条件(L78)
6. `src/tools/AgentTool/built-in/generalPurposeAgent.ts` — 通用 agent
7. `src/tools/AgentTool/built-in/planAgent.ts` — Plan agent，model:'inherit'(L87)
8. `src/tools/AgentTool/built-in/verificationAgent.ts` — Verification agent（教程未提及）
9. `src/tools/AgentTool/built-in/claudeCodeGuideAgent.ts` — Guide agent（教程未提及）
10. `src/tools/AgentTool/loadAgentsDir.ts` — 自定义 agent 加载
11. `src/tools/AgentTool/resumeAgent.ts` — agent 恢复执行（教程未提及）
12. `src/tools/TeamCreateTool/TeamCreateTool.ts` — 团队创建
13. `src/tools/TeamDeleteTool/TeamDeleteTool.ts` — 团队删除
14. `src/tools/SendMessageTool/SendMessageTool.ts` — 消息发送，含 shutdown/plan approval 协议
15. `src/tools/EnterWorktreeTool/EnterWorktreeTool.ts` — 进入 worktree
16. `src/tools/ExitWorktreeTool/ExitWorktreeTool.ts` — 退出 worktree，含 `countWorktreeChanges`(L79)
17. `src/utils/worktree.ts` — Worktree 核心管理（1200+ 行）
18. `src/utils/swarm/teamHelpers.ts` — 团队文件辅助，`TeamFile` 类型(L64)
19. `src/utils/swarm/constants.ts` — `TEAM_LEAD_NAME`
20. `src/utils/swarm/backends/` — 后端抽象层（7+ 文件，教程未详述）
21. `src/utils/teammate.ts` — Teammate 检测
22. `src/utils/teammateMailbox.ts` — 邮箱实现
23. `src/utils/teammateContext.ts` — Teammate 上下文（教程未提及）
24. `src/utils/tasks.ts` — 任务管理
25. `src/utils/agentSwarmsEnabled.ts` — Swarm 开关
26. `src/services/mcp/types.ts` — MCP 类型，`TransportSchema`(L23)
27. `src/services/mcp/config.ts` — MCP 配置发现，`getClaudeCodeMcpConfigs`(L1071)，`doesEnterpriseMcpConfigExist`(L1470)
28. `src/services/mcp/client.ts` — MCP 连接，`connectToServer`(L595)，`getMcpToolsCommandsAndResources`(L2226)
29. `src/services/mcp/mcpStringUtils.ts` — `buildMcpToolName`(L50)
30. `src/services/mcp/normalization.ts` — `normalizeNameForMCP`（教程未列出此文件）
31. `src/services/mcp/officialRegistry.ts` — 官方注册表
32. `src/services/mcp/auth.ts` — `ClaudeAuthProvider`(L1376)
33. `src/services/mcp/MCPConnectionManager.tsx` — 连接管理 React 层
34. `src/services/mcp/envExpansion.ts` — 环境变量展开底层
35. `src/services/mcp/xaa.ts` / `xaaIdpLogin.ts` — XAA 跨应用访问（教程未给路径）
36. `src/services/mcp/claudeai.ts` — claude.ai 连接器（教程未给路径）
37. `src/services/mcp/elicitationHandler.ts` — 信息引出（教程未提及）

### 外部参考

1. Anthropic, "Building effective agents" (2024) — 多 Agent 编排模式
2. Model Context Protocol Specification — https://spec.modelcontextprotocol.io
3. Google A2A Protocol — https://google.github.io/a2a-spec
4. LangChain, "Context Engineering" blog series (2025)
5. Microsoft AutoGen v0.4 Documentation — 事件驱动多 agent 架构
6. CrewAI Documentation — 角色式多 Agent 框架
7. Git Worktree Documentation — https://git-scm.com/docs/git-worktree
8. BAML/BoundaryML, "12-Factor Agent" (2025) — 推荐 git worktree 作为 agent 隔离方案
9. MCP FastMCP Python SDK — https://github.com/modelcontextprotocol/python-sdk
