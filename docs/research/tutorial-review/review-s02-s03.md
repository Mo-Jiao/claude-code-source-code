# 教程审查报告：s02-tools & s03-system-prompt

**审查日期**: 2026-04-01
**审查范围**: `tutorial/guide/s02-tools.md`, `tutorial/guide/s03-system-prompt.md`
**对照源码**: `src/Tool.ts`, `src/tools.ts`, `src/context.ts`, `src/constants/prompts.ts`, `src/utils/api.ts`, `src/services/api/claude.ts`, `src/tools/ToolSearchTool/prompt.ts`
**源码版本**: main@a0c16b3

---

## 审查摘要（200 字）

两节课整体质量高，架构叙事清晰，Python 伪代码可运行性强。源码验证发现 **3 处关键不一致**需修正：s02 中 `isDeferredTool` 的默认返回值与真实代码方向相反（教程写 `?? true` 即默认延迟，实际是 `=== true` 即默认不延迟）；Agent 工具"永不延迟"实际有 feature flag 前置条件；`getTools()` 的简化版省略了 deny rules 过滤和 REPL 模式处理等关键步骤。s03 的缓存分段逻辑描述准确，`splitSysPromptPrefix` 和 `addCacheBreakpoints` 源码引用全部正确，但动态段内容仅列出 4 个（实际 10+），遗漏了 `cache_reference`/`cache_edits` 等新机制。技术深度方面，两课缺少 `assembleToolPool()` 的 cache 稳定排序、`systemPromptSection()` 注册机制、以及 `description()` 实为异步函数等重要细节。竞品对比已提及 Vercel/Manus，但对 Cursor Apply Model、Aider repo-map、Codex CLI 沙箱策略的具体对比不足。

---

## S02 — 工具系统：注册、分发与执行

### 1. 源码一致性验证

| # | 教程声明 | 源码验证 | 结论 |
|---|---------|---------|------|
| 1 | `Tool` 接口定义在 `src/Tool.ts` | `src/Tool.ts:362` 定义了 `Tool` 泛型类型 | ✅准确 |
| 2 | `buildTool()` 在 `src/Tool.ts` | `src/Tool.ts:783` 导出 `buildTool` 函数 | ✅准确 |
| 3 | `TOOL_DEFAULTS` 中 `isConcurrencySafe` 默认 `false` | `src/Tool.ts:759` 确认 `isConcurrencySafe: (_input?) => false` | ✅准确 |
| 4 | `getTools()` 在 `src/tools.ts` | `src/tools.ts:271` 导出 `getTools(permissionContext)` | ✅准确 |
| 5 | `findToolByName()` 在 `src/Tool.ts` | `src/Tool.ts:358` 导出该函数 | ✅准确 |
| 6 | `toolMatchesName()` 在 `src/Tool.ts` | `src/Tool.ts:348` 导出该函数 | ✅准确 |
| 7 | BashTool 在 `src/tools/BashTool/BashTool.tsx` | 文件存在，扩展名 `.tsx` | ✅准确 |
| 8 | FileReadTool 在 `src/tools/FileReadTool/FileReadTool.ts` | 文件存在 | ✅准确 |
| 9 | FileEditTool 在 `src/tools/FileEditTool/FileEditTool.ts` | 文件存在 | ✅准确 |
| 10 | ToolSearch 在 `src/tools/ToolSearchTool/ToolSearchTool.ts` | 文件存在 | ✅准确 |
| 11 | 工具延迟判定在 `src/tools/ToolSearchTool/prompt.ts` | `prompt.ts:62` 导出 `isDeferredTool()` | ✅准确 |
| 12 | 工具执行在 `src/services/tools/toolOrchestration.ts` | `toolOrchestration.ts:19` 导出 `runTools()` | ✅准确 |
| 13 | 流式执行器在 `src/services/tools/StreamingToolExecutor.ts` | `StreamingToolExecutor.ts:40` 导出 `StreamingToolExecutor` 类 | ✅准确 |
| 14 | 大结果持久化在 `src/utils/toolResultStorage.ts` | 文件存在，含 `maxResultSizeChars` 引用 | ✅准确 |
| 15 | `isDeferredTool()` 默认返回 `tool.shouldDefer ?? true` | **实际代码**: `return tool.shouldDefer === true`（`prompt.ts:107`） | ❌不一致 |
| 16 | `isDeferredTool()` 对 Agent 工具"永不延迟" | 实际仅在 `feature('FORK_SUBAGENT')` 且 `isForkSubagentEnabled()` 时才不延迟 | ❌不一致（简化过度） |
| 17 | MCP 工具 "标记 `alwaysLoad` 的不延迟" | `alwaysLoad` 检查在最前面，MCP 工具默认**总是延迟**（`tool.isMcp === true`） | ✅准确（但教程漏掉 MCP 默认延迟） |
| 18 | `getTools()` 返回 `ALL_TOOLS.filter(t => t.isEnabled())` | 实际远更复杂：`getAllBaseTools()` → `filterToolsByDenyRules()` → REPL 过滤 → `isEnabled()` | ❌不一致（严重简化） |
| 19 | 教程写 `description(input): string` | 真实签名 `description(input, options): Promise<string>`，是异步的 | ❌不一致 |
| 20 | 教程写 `validateInput(input, context): boolean` | 真实签名 `validateInput?(input, context): Promise<ValidationResult>`（可选、异步、非 boolean） | ❌不一致 |
| 21 | 教程写 `checkPermissions` 返回 `{ behavior: 'allow', updatedInput }` | 教程伪代码的 `TOOL_DEFAULTS.checkPermissions` 返回结构一致 | ✅准确 |
| 22 | 教程称注册是"显式导入 + 数组" | 真实代码大量使用 `feature()` 条件加载和 lazy `require()` | ⚠️部分准确 |

**关键不一致详解**：

**#15 — `isDeferredTool` 默认行为方向相反（最严重）**

教程写 `return tool.shouldDefer ?? true`（即"默认延迟"），但真实代码是 `return tool.shouldDefer === true`（即"默认不延迟"，只有显式标记 `shouldDefer: true` 的工具才延迟）。

- **为什么改**：这是教程最严重的技术错误。"默认延迟 vs 默认不延迟"是完全不同的策略，会误导读者理解 ToolSearch 机制的设计方向。
- **怎么改**：将伪代码改为 `return tool.shouldDefer === true`，并补充说明"只有显式标记 `shouldDefer: true` 的内置工具和所有 MCP 工具才被延迟"。

**#16 — Agent 工具延迟逻辑的条件性**

教程简单说"Agent 工具必须立即可用"，但实际代码中 Agent 不延迟依赖 `FORK_SUBAGENT` feature flag。

- **怎么改**：添加注释说明这是条件性的，或改为更通用的描述。

**#18 — `getTools()` 的过度简化**

真实 `getTools()` 流程：`getAllBaseTools()` → `filterToolsByDenyRules(tools, permissionContext)` → REPL 模式下隐藏原语 → `isEnabled()` 过滤。教程的简化版丢失了权限过滤这一关键安全环节。

- **怎么改**：至少在注释中提及 `filterToolsByDenyRules()` 步骤，说明"工具注册后还要经过权限过滤"。

**#19-20 — 接口签名简化**

`description` 实际是异步函数（`Promise<string>`），接收权限上下文等参数；`validateInput` 是可选的、异步的、返回 `ValidationResult` 而非 `boolean`。

- **怎么改**：在 Tool 接口代码块后加注释"注意：以上为简化签名，真实代码中 `description` 和 `validateInput` 都是异步函数，参数更丰富"。

### 2. 技术深度补充

#### 2.1 `assembleToolPool()` — 被遗漏的 cache 稳定排序

`src/tools.ts:345-367` 的 `assembleToolPool()` 函数是教程未提及的关键设计：built-in 工具和 MCP 工具分别排序后拼接（而非混合排序），以保持 prompt cache 的 built-in 前缀稳定。注释明确说明了这个设计意图："a flat sort would interleave MCP tools into built-ins and invalidate all downstream cache keys"。

**为什么重要**：这是工具系统与缓存系统交汇的关键点——工具注册顺序直接影响 s03 讲的 prompt cache 命中率。

**怎么补充**：在工具注册部分添加 `assembleToolPool()` 的说明，展示"先 built-in 排序、再 MCP 排序"的策略，并引用 s03 的缓存概念形成跨课连接。

#### 2.2 Feature Flag 条件加载的工程模式

`src/tools.ts` 大量使用 `feature()` 门控和 lazy `require()`：

```typescript
const REPLTool = process.env.USER_TYPE === 'ant' ? require('...').REPLTool : null
const SleepTool = feature('PROACTIVE') || feature('KAIROS') ? require('...').SleepTool : null
const cronTools = feature('AGENT_TRIGGERS') ? [...] : []
```

`feature()` 是 `bun:bundle` 的编译时宏，在打包时成为布尔常量，实现 dead code elimination。

**为什么重要**：这是生产级工具系统的关键模式——功能门控用于渐进式发布、A/B 测试和条件编译，且零运行时开销。教程称"就是显式导入 + 数组"掩盖了这一复杂性。

**怎么补充**：在工具注册部分增加一段，解释 `feature()` 宏和 lazy `require()` 的用途，以及它们如何打破循环依赖（如 `TeamCreateTool`、`SendMessageTool` 的 lazy require）。

#### 2.3 工具权限的真实层级

教程流水线写 `validateInput → checkPermissions → canUseTool → call`，但遗漏了：
- `preparePermissionMatcher()` — hook `if` 条件的模式匹配器
- `toAutoClassifierInput()` — auto 模式安全分类器的输入转换
- `backfillObservableInput()` — 可观测输入的后填充
- `DenialTrackingState` — 权限否认追踪

**怎么补充**：在"设计决策"部分增加多层权限模型的说明：工具自检 → hook 模式匹配 → 安全分类器 → 全局权限 → 用户确认。

#### 2.4 `description()` 是异步函数的设计意义

真实 `description(input, options): Promise<string>` 接收 `isNonInteractiveSession`、`toolPermissionContext`、`tools` 等参数，允许工具根据运行时上下文动态调整描述。

**为什么重要**：这意味着同一个工具在交互模式 vs 非交互模式下可以有不同的描述，比如 BashTool 在非交互模式下可能省略"用户确认"相关的说明。

**怎么补充**：在 Tool 接口讲解中加一句："真实的 `description()` 是异步函数，可根据会话模式和权限上下文动态调整工具说明。"

### 3. 竞品对比洞察

#### 3.1 Cursor 的 Apply Model vs Claude Code 的 Edit 工具

Cursor 使用一个专门的小模型（Apply Model）将 AI 生成的代码变更合并到文件：

| 维度 | Claude Code | Cursor |
|------|------------|--------|
| 编辑方式 | `Edit(old_string, new_string)` 精确替换 | Apply Model 智能合并 |
| 代码搜索 | ripgrep 精确匹配 | 语义搜索 + ripgrep 混合 |
| 工具数量 | 6 核心 + ToolSearch 按需 | 20+ 全量注入 |
| 额外模型调用 | 无 | Apply Model 额外推理 |

**值得补充**：Claude Code 的 Edit 工具要求 `old_string` 唯一且精确匹配，优点是确定性强、无额外成本；缺点是大范围修改需多次调用。Cursor 的 Apply Model 可处理模糊匹配但引入额外延迟和成本。

#### 3.2 Aider 的 Repo Map vs Claude Code 的 Grep+Glob

Aider 用 tree-sitter 解析代码生成 repo-map（函数签名、类定义的全局索引），作为上下文注入。Claude Code 完全依赖 ripgrep 按需搜索。

**值得补充**：Aider 的 repo-map 提供"全局视图"但需前置索引（在大仓库可能耗时数十秒）；Claude Code 的 Grep 零索引成本但依赖模型知道搜什么。两种策略在大仓库（100k+ 文件）上的表现差异值得讨论。

#### 3.3 Codex CLI 的沙箱优先方案

OpenAI Codex CLI 使用 Docker/Firecracker 级别隔离，所有操作默认在沙箱中运行。Claude Code 虽有沙箱选项（`shouldUseSandbox.ts`），但默认直接在用户环境执行，通过权限系统控制安全。

**值得补充**：在"Bash 是皇冠上的宝石"部分加一段对比——Claude Code 选择"权限控制 > 沙箱隔离"，Codex CLI 选择"沙箱隔离 > 灵活性"，两种策略各有利弊。

### 4. 教学法优化

#### 4.1 难度曲线

当前结构：接口 → 工厂 → 注册 → 延迟加载 → 执行流水线 → 分类示例。逻辑递进合理，但 **ToolSearch 部分跳跃过大**——从简单数组注册直接跳到延迟加载的 token 优化。

**建议**：在 ToolSearch 之前增加一段成本分析："40 个工具的 schema 约 3000-5000 token，以 Sonnet 价格计算，每轮对话固定消耗 $0.01+ 仅在工具描述上"。让读者先感受痛点再看解决方案。

从接口直接跳到 `buildTool` 也缺少过渡——读者可能不理解"为什么需要工厂函数"。

**建议**：先展示一个不用工厂直接创建工具的反例（手动填写所有默认值），再引出工厂函数的价值。

#### 4.2 示例质量

- Python 伪代码质量高（471 行完整实现），可独立运行
- BashTool 伪代码中 `READ_ONLY_COMMANDS` 过于简化，真实 BashTool 用 `parseForSecurity()` 做 AST 级解析——建议加注释说明
- 练习 3 中 `--tools` 参数的用法是验证"最小工具集"原则的最佳方式

**建议**：在 BashTool 示例后添加一个"真实代码对比"框，指出 3-5 个被简化的关键差异（AST 解析、沙箱、命令语义分析等）。

#### 4.3 动手练习设计

**练习 1** 范围偏大（4 个工具 + 注册中心 + 执行器），建议拆分：
- 1a: 实现单个 BashTool 并手动调用
- 1b: 添加 ToolRegistry 管理多个工具
- 1c: 添加并发控制

**练习 2** 缺少验证标准。建议增加预期指标："全量注入 vs ToolSearch 的 token 消耗减少 20-40%"。

**新增练习建议**：
- **练习 4**: 实现 `isConcurrencySafe()` 测试——同时调用 Read+Read（应并发）和 Read+Write（应串行），用计时验证并发控制效果。

### 5. 实战陷阱与案例

#### 5.1 `maxResultSizeChars` 的循环引用陷阱

`FileReadTool` 的 `maxResultSizeChars` 设为 `Infinity`（`src/Tool.ts:466` 注释说明），因为如果 Read 结果被持久化到磁盘，模型再用 Read 去读那个文件，会形成 Read→file→Read 循环。教程提到了 `maxResultSizeChars` 但没提到 `Infinity` 例外。

**建议补充**：在 `maxResultSizeChars` 说明后加注——"Read 工具例外：`maxResultSizeChars` 为 Infinity，因为持久化 Read 结果会导致循环引用"。

#### 5.2 工具名称冲突与 `uniqBy` 去重

当 MCP 工具与内置工具同名时，`assembleToolPool()` 中的 `uniqBy('name')` 保证内置工具优先。MCP 工具名通常有 `mcp__server__tool` 前缀，但在 `CLAUDE_AGENT_SDK_MCP_NO_PREFIX` 模式下可能冲突。

**建议补充**：在工具注册部分加注意事项——"MCP 工具与内置工具同名时，内置工具优先"。

#### 5.3 `isConcurrencySafe` 的管道命令假阳性

BashTool 基于命令前缀判断只读性，但管道命令可能绕过：`grep foo | rm` 的第一个命令是 `grep`（只读），但整体是破坏性的。真实代码用 `parseForSecurity()` 做 AST 级解析来处理这种情况。

**建议补充**：在并发安全部分加警告——"伪代码中基于命令前缀的判断是简化版，生产环境必须解析完整的 shell 管道"。

#### 5.4 ToolSearch 的冷启动延迟

如果模型第一轮就需要非核心工具（如 NotebookEdit），必须先调用 ToolSearch 获取 schema 再调用工具，增加一个 API round-trip。

**建议补充**：可通过 MCP 工具的 `_meta['anthropic/alwaysLoad']` 将高频非核心工具标记为立即加载。

#### 5.5 `--tools` 参数与 ToolSearch 的交互

教程练习 3 建议用 `--tools "Bash"` 限制工具，但没说明这会同时排除 ToolSearch——意味着无法动态发现其他工具。建议在练习中注明这一行为。

---

## S03 — 系统提示词组装：字节级的缓存博弈

### 1. 源码一致性验证

| # | 教程声明 | 源码验证 | 结论 |
|---|---------|---------|------|
| 1 | `getSystemPrompt()` 在 `src/constants/prompts.ts` | `prompts.ts:444` 导出该函数 | ✅准确 |
| 2 | `SYSTEM_PROMPT_DYNAMIC_BOUNDARY` 在 `src/constants/prompts.ts` | `prompts.ts:114-115` 定义 `'__SYSTEM_PROMPT_DYNAMIC_BOUNDARY__'` | ✅准确 |
| 3 | `splitSysPromptPrefix()` 在 `src/utils/api.ts` | `api.ts:321` 导出该函数 | ✅准确 |
| 4 | `buildSystemPromptBlocks()` 在 `src/services/api/claude.ts` | `claude.ts:3213` 导出该函数 | ✅准确 |
| 5 | `addCacheBreakpoints()` 在 `src/services/api/claude.ts` | `claude.ts:3063` 导出该函数 | ✅准确 |
| 6 | `getUserContext()` 在 `src/context.ts` | `context.ts:155` 导出该函数 | ✅准确 |
| 7 | `getSystemContext()` 在 `src/context.ts` | `context.ts:116` 导出该函数 | ✅准确 |
| 8 | `prependUserContext()` 在 `src/utils/api.ts` | `api.ts:449` 导出该函数 | ✅准确 |
| 9 | `fetchSystemPromptParts()` 在 `src/utils/queryContext.ts` | `queryContext.ts:44` 导出该函数 | ✅准确 |
| 10 | CLAUDE.md 加载在 `src/utils/claudemd.ts` | `claudemd.ts:1153` 导出 `getClaudeMds` | ✅准确 |
| 11 | `getCacheControl()` 在 `src/services/api/claude.ts` | `claude.ts:358` 导出该函数 | ✅准确 |
| 12 | 静态段组装顺序 7 个函数 | `prompts.ts:562-571` 完全一致 | ✅准确 |
| 13 | BOUNDARY 后拼接动态内容 | `prompts.ts:573-575` 确认 `resolvedDynamicSections` | ✅准确 |
| 14 | BOUNDARY 注释 `=== BOUNDARY MARKER ===` | `prompts.ts:572` 存在该注释 | ✅准确 |
| 15 | `getUserContext()` 使用 `memoize` | `context.ts:155` `memoize(async () => ...)` | ✅准确 |
| 16 | `getSystemContext()` 并发获取 5 个 git 命令 | `context.ts:61` `Promise.all([branch, mainBranch, status, log, userName])` | ✅准确 |
| 17 | MAX_STATUS_CHARS = 2000 | `context.ts:20` 确认 | ✅准确 |
| 18 | `appendSystemContext()` 在 `src/utils/api.ts` | `api.ts:437` 导出 | ✅准确 |
| 19 | 教程称动态段包含"语言/Hooks/MCP/输出样式" | 真实代码有 10+ 个动态段（含 `session_guidance`、`memory`、`ant_model_override`、`scratchpad`、`frc`、`summarize_tool_results`、`token_budget`、`brief` 等） | ❌不一致（遗漏较多） |
| 20 | 教程称 `getSimpleDoingTasksSection()` 无条件包含 | 真实代码有条件：`outputStyleConfig === null \|\| keepCodingInstructions === true` | ⚠️部分准确 |

**关键不一致详解**：

**#19 — 动态段列表严重不完整**

教程只列了 4 个动态段（语言/Hooks/MCP/输出样式），真实代码有 10+ 个，使用了 `systemPromptSection()` 注册机制。遗漏的段包括：
- `session_guidance` — 会话特定指导（含 skill 工具命令等）
- `memory` — 记忆提示词
- `scratchpad` — 草稿板指令
- `frc` — function result clearing（清理大结果的指令）
- `summarize_tool_results` — 工具结果摘要指令
- `token_budget` — token 预算指令
- `brief` — Brief 模式指令

**怎么改**：将动态段列表扩展为完整版（或标注"以下为主要动态段，完整列表见源码"），并补充 `systemPromptSection()` / `DANGEROUS_uncachedSystemPromptSection()` 两种注册方式的区别。

### 2. 技术深度补充

#### 2.1 `cache_reference` 和 `cache_edits` 机制（重要遗漏）

教程覆盖了 `cache_control` 的 `scope` 参数，但 `src/services/api/claude.ts` 中还有 600+ 行关于 `cache_reference` 和 `cache_edits` 的代码：

- **`cache_reference`**: 引用之前请求中已缓存的内容块，避免重复传输整个消息历史
- **`cache_edits`**: 传输缓存内容的增量编辑，而非完整重传

**为什么重要**：这是 Claude Code 在多轮对话中实现高缓存命中率的核心——不仅复用系统提示词缓存，还复用历史消息的缓存。这比教程描述的简单 prefix caching 高级得多。

**怎么补充**：可作为"进阶阅读"指引，或在设计决策部分简要提及存在和用途。建议补充一句："真实代码还使用 `cache_reference`（引用已缓存内容）和 `cache_edits`（增量更新缓存）来进一步优化多轮对话的 token 成本。"

#### 2.2 `systemPromptSection()` 注册机制

`src/constants/prompts.ts` 有一个轻量注册系统：

- `systemPromptSection(name, getter)` — 包装异步 getter，支持缓存和诊断日志
- `DANGEROUS_uncachedSystemPromptSection(name, getter, reason)` — 标记不可缓存的 section（如 MCP 指令），必须提供原因

这展示了"静态 vs 动态"二分法在实践中并不简单——存在"缓存友好的动态"和"不可缓存的动态"之分。

**为什么重要**：新特性可以通过注册 section 注入提示词，无需修改核心组装逻辑——这是可扩展性的关键设计。

**怎么补充**：在动态段部分增加 2-3 句说明这个注册机制，以及 `DANGEROUS_uncached` 变体的存在和用途。

#### 2.3 `setSystemPromptInjection()` — 缓存主动失效

`src/context.ts:29-34` 提供了 `setSystemPromptInjection()` 函数，可注入任意字符串到系统上下文中，同时清除 `getUserContext` 和 `getSystemContext` 的 memoize 缓存。

**为什么重要**：这是一个 debug/ops 机制，允许在运行时强制 cache bust，对调试缓存问题非常有用。

#### 2.4 `outputStyleConfig` 对"静态段"的条件影响

真实代码中 `getSimpleDoingTasksSection()` 依赖 `outputStyleConfig`：
```typescript
outputStyleConfig === null || outputStyleConfig.keepCodingInstructions === true
  ? getSimpleDoingTasksSection()
  : null
```

**为什么重要**：这意味着"静态段"并非 100% 静态——但这些条件变化频率极低（通常在整个会话中不变），所以对缓存影响可忽略。

**怎么补充**：在静态段讲解中加注："某些静态 section 有条件开关，但开关在会话内不变，不影响缓存"。

### 3. 竞品对比洞察

#### 3.1 Claude Code vs 竞品的缓存策略深度

教程的对比表已很好，补充具体数据点：

| 工具 | 缓存策略 | 缓存代码量 | 独有优势 |
|------|---------|-----------|---------|
| **Claude Code** | 3 层 scope + BOUNDARY 分段 + cache_reference/edits + 单标记优化 | ~800 行 | `scope: 'global'` 跨所有用户共享 |
| **OpenCode** | 2-part 数组 | ~50 行 | 无 |
| **Aider** | 手动开启，简单 cache_control | ~100 行 | 无 |
| **Cline** | 基础 prompt caching | ~150 行 | 无 |

**值得补充的洞察**：Claude Code 的缓存投入合理的根本原因是它是 Anthropic 第一方产品——`scope: 'global'` 跨所有用户共享是第三方工具不可能做到的。这个"第一方优势"应在教程中明确点出。

#### 3.2 Cursor 的 Prompt 组装策略

Cursor 支持多家 LLM 提供商，不能使用 Anthropic 特有的 `scope: 'global'`。其策略：
- 使用 OpenAI 的 `developer` role 消息（不同于 `system`）
- `.cursorrules` 文件（类似 CLAUDE.md）直接注入 system prompt
- 无类似 BOUNDARY 的缓存分段

**对比价值**：Claude Code 把 CLAUDE.md 注入消息列表（而非 system prompt）以保护全局缓存；Cursor 不需要这个优化因为 OpenAI 缓存机制不同（无 scope 分级）。

#### 3.3 Windsurf 的 Cascade 上下文引擎

Windsurf 用独立的"Cascade"引擎管理上下文，包含索引、嵌入和检索。与 Claude Code"纯文本拼接 + 手工缓存优化"形成对比——Claude Code 没有任何向量搜索或预索引。

**对比价值**：两种完全不同的优化方向——Claude Code 优化 API 层的 prompt cache，Windsurf 优化应用层的 context retrieval。

### 4. 教学法优化

#### 4.1 难度曲线

当前结构合理：四层结构 → 前缀匹配 → 分段逻辑 → cache_control 标记 → 构建管道 → CLAUDE.md 注入。但"前缀匹配"概念对不熟悉 KV-cache 的读者可能突然。

**建议 1**：在前缀匹配之前增加 2-3 句 KV-cache 背景："LLM 推理时，每个 token 的 attention 计算结果可以被缓存。前缀匹配意味着如果两个请求的开头完全相同，这些计算结果可以直接复用。"

**建议 2**：增加具体 token 成本计算示例：
```
假设系统提示词共 5000 token：
- 静态段 4000 token + 动态段 1000 token
- 缓存命中：4000 × 10% + 1000 × 100% = 1400 token 等效成本
- 无缓存：5000 × 100% = 5000 token 等效成本
- 节省：72%
```

#### 4.2 示例质量

- 缓存分段的 ASCII 示意图非常清晰——这是教程的亮点
- `splitSysPromptPrefix` 的三种模式解释可以更具体，建议增加条件表：

| 条件 | 模式 | 缓存行为 |
|------|------|----------|
| 1P API + 无 MCP | 模式 2 (global) | 静态段全局共享，动态段不缓存 |
| 1P API + 有 MCP | 模式 1 (org) | 全部 org 级缓存 |
| 3P API | 模式 3 (org) | 全部 org 级缓存 |

- Python 伪代码中模型名硬编码为 `claude-sonnet-4-20250514`，建议改为变量避免过时
- 缺少真实 API 响应示例——展示 `cache_creation_input_tokens` 和 `cache_read_input_tokens` 的实际数值

#### 4.3 动手练习设计

**练习 1** 设计好——直接用 Anthropic API 验证缓存效果。建议补充预期结果："第二次请求 `cache_read_input_tokens` 应接近第一次的 `cache_creation_input_tokens`"。

**练习 2** 建议增加可视化：用终端表格或 matplotlib 展示每轮缓存命中率曲线。

**练习 3** 中 `--dump-system-prompt` 参数需确认是否存在，建议添加备选方案。

**新增练习建议**：
- **练习 4**: "破坏缓存实验"——故意把动态内容（时间戳）放到 system prompt 最前面，观察 `cache_read_input_tokens` 降到 0。这会让"前缀匹配"概念非常直观。

### 5. 实战陷阱与案例

#### 5.1 CLAUDE.md 修改不会立即生效

`getUserContext()` 使用 `memoize`（`context.ts:155`），CLAUDE.md 内容在会话中只加载一次。如果用户在对话中修改了 CLAUDE.md，修改不会在当前会话生效。

**建议补充**：在 CLAUDE.md 注入部分加注——"CLAUDE.md 内容被 memoize 缓存，仅在会话开始时加载一次"。

#### 5.2 `scope: 'global'` 的环境依赖

全局缓存（BOUNDARY 分段）只在直连 Anthropic API 时启用。通过 AWS Bedrock 或 Google Vertex 使用 Claude 时不可用，退回 org 级缓存。教程应明确说明这个限制。

**建议补充**：在"全局缓存"部分加注——"此优化仅适用于直连 Anthropic API 的场景"。

#### 5.3 Git Status 截断的行为影响

`git status` 输出超过 2000 字符时被截断（`context.ts:85-89`），截断消息提示模型"用 BashTool 运行 `git status`"。在大仓库中可能导致 agent 第一轮就消耗一次工具调用获取完整状态。

**建议补充**：大仓库应通过 `.gitignore` 减少 untracked 文件以控制 `git status` 输出长度。

#### 5.4 MCP 指令与缓存的冲突

`DANGEROUS_uncachedSystemPromptSection('mcp_instructions', ...)` 标记 MCP 指令为不可缓存，因为 MCP 服务器可能在 turn 之间连接/断开。太多 MCP 服务器 = 更多不可缓存 token = 更高成本。

新版本的 `isMcpInstructionsDeltaEnabled()` 通过 attachment delta 机制缓解了这个问题——MCP 指令不再放在 system prompt 中，而是通过 persisted attachment 传递。

**建议补充**：提及 MCP 指令从 system prompt 迁移到 attachment 的演进，说明为什么这对缓存很重要。

#### 5.5 全局缓存的版本更新成本

`scope: 'global'` 跨所有用户共享。Claude Code 发版更新系统提示词时，全局缓存失效，所有用户的第一次请求都会触发 cache creation。这是可预期的、短暂的成本增加。

---

## 交叉审查：两节课之间的衔接

1. **s02 → s03 的连接点**：s02 讲工具 schema 发送给 API，s03 讲系统提示词组装，但缺少一个关键连接——**工具描述在 system prompt 中的位置**。`getUsingYourToolsSection(enabledTools)` 属于静态段（BOUNDARY 之前），意味着启用的工具列表变化会影响全局缓存。而 `assembleToolPool()` 的排序稳定性正是为了缓解这个问题。建议在 s03 架构图中标注工具 schema 的位置。

2. **ToolSearch 与 cache 的关系**：s02 讲 ToolSearch 减少 token，但没从 cache 角度分析——deferred 工具不在系统提示词中，所以 ToolSearch 加载新工具不影响 system prompt cache。这个联系值得在两课之间明确。

3. **伪代码一致性（亮点）**：s03 的 `build_full_api_request()` 引用了 s02 的 `create_default_registry()`，形成跨课代码连接，设计很好。

---

## 参考文献

### 源码文件

1. `src/Tool.ts` — Tool 接口定义、buildTool 工厂函数、findToolByName、toolMatchesName
2. `src/tools.ts` — 工具注册中心、getTools/getAllBaseTools/assembleToolPool/filterToolsByDenyRules
3. `src/context.ts` — getUserContext/getSystemContext/getGitStatus/setSystemPromptInjection
4. `src/constants/prompts.ts` — getSystemPrompt 及所有 section 函数、SYSTEM_PROMPT_DYNAMIC_BOUNDARY
5. `src/utils/api.ts` — splitSysPromptPrefix/prependUserContext/appendSystemContext
6. `src/services/api/claude.ts` — buildSystemPromptBlocks/addCacheBreakpoints/getCacheControl
7. `src/tools/ToolSearchTool/prompt.ts` — isDeferredTool 延迟判定逻辑
8. `src/tools/ToolSearchTool/ToolSearchTool.ts` — ToolSearch 工具实现
9. `src/tools/BashTool/BashTool.tsx` — BashTool 完整实现
10. `src/utils/toolResultStorage.ts` — 大结果持久化机制
11. `src/utils/claudemd.ts` — CLAUDE.md 文件发现和加载
12. `src/utils/queryContext.ts` — fetchSystemPromptParts 管道
13. `src/services/tools/toolOrchestration.ts` — runTools 执行流水线
14. `src/services/tools/StreamingToolExecutor.ts` — 流式并发执行器

### 教程引用的外部参考

15. Vercel 案例 [R2-4][R2-5] — "15→2 工具精简，准确率 80%→100%，token 减少约 37%"
16. Manus AI [R2-11][R2-12] — KV-cache 命中率、工具遮蔽 vs 工具移除
17. sketch.dev [R2-1] — "Bash Is All You Need" + 文本编辑工具必要性
18. Arcade.dev [R2-7] — "From the agent's perspective, it's all just tools"
19. Simon Willison — "Context Engineering" 概念
20. LangChain [R1-3] — 上下文工程四策略框架 Write/Select/Compress/Isolate
21. The AI Corner [R1-6] — 推理模型不需要"think step by step"
22. Anthropic 文档 — Prompt Caching 官方指南（https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching）
