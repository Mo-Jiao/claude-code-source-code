# 审查报告：s07（上下文压缩）& s08（Memory 系统）

**审查日期**：2026-04-01（第二轮源码精校）
**审查范围**：`tutorial/guide/s07-compact.md`、`tutorial/guide/s08-memory.md`
**源码对照目录**：`src/services/compact/`、`src/memdir/`

---

## 审查摘要（200 字）

s07 和 s08 是教程中技术含量最高的两节课，分别覆盖三层上下文压缩引擎和双轨记忆系统。整体质量优秀：源码映射表覆盖面广，Python 伪代码忠于源码逻辑，设计决策解释清晰。**源码一致性**方面，s07 的 20 项源码引用经第二轮精校后仅 1 项行号偏移（`TIME_BASED_MC_CLEARED_MESSAGE` 实际在 36 行而非 32 行）和 1 项工具名简化需注明；s08 的 17 项引用中 `loadMemoryPrompt()`/`buildMemoryLines()`/`buildMemoryPrompt()` 和 `getTeamMemPath()` 均已确认存在，源码映射高度准确。两节课共同的短板在于**技术深度**：s07 遗漏了 API 原生 context_management 策略（`apiMicrocompact.ts`）和 Context Collapse 实验功能；s08 遗漏了 Extract Memories 后台代理机制和团队记忆的详细设计。**竞品对比**可补充 Cursor `/summarize`、Aider repo-map、Windsurf Cascade 记忆差异。**教学法**方面，两节课的难度曲线偏陡，建议增加可视化调试手段和中间过渡练习。

---

## s07 — 上下文压缩：无限对话的秘密

### 1. 源码一致性验证

| # | 教程描述 | 源码位置 | 判定 | 说明 |
|---|---------|---------|------|------|
| 1 | `microcompactMessages()` 入口 | `src/services/compact/microCompact.ts` | ✅准确 | 文件存在，函数为模块主导出 |
| 2 | `COMPACTABLE_TOOLS` 常量在 41-50 行 | `microCompact.ts:41-50` | ✅准确 | 实际在 41-50 行，内容匹配 |
| 3 | `evaluateTimeBasedTrigger()` 在 422-444 行 | `microCompact.ts:422-444` | ✅准确 | 实际位于 422-444 行 |
| 4 | `TIME_BASED_MC_CLEARED_MESSAGE = '[Old tool result content cleared]'` 在第 32 行 | `microCompact.ts:36` | ❌不一致 | 实际在第 **36** 行（教程写 32 行）。偏移原因：行 1-35 有 import 语句和注释，常量声明被推后 |
| 5 | `shouldAutoCompact()` + `autoCompactIfNeeded()` | `autoCompact.ts` | ✅准确 | 函数存在，语义匹配 |
| 6 | `getAutoCompactThreshold()` = effectiveWindow - 13K，在 73-91 行 | `autoCompact.ts:72-91` | ✅准确 | 实际函数签名在 72 行，整体范围 72-91，近似准确 |
| 7 | `MAX_CONSECUTIVE_AUTOCOMPACT_FAILURES = 3` 在 69-70 行 | `autoCompact.ts:70` | ✅准确 | 实际在第 70 行 |
| 8 | `compactConversation()` 核心函数在 387-763 行 | `compact.ts:387+` | ✅准确 | 函数起始于 387 行 |
| 9 | `partialCompactConversation()` 在 772-1106 行 | `compact.ts:772+` | ✅准确 | 函数起始于 772 行 |
| 10 | `BASE_COMPACT_PROMPT` 在 `prompt.ts` | `prompt.ts:61` | ✅准确 | 存在且内容匹配 |
| 11 | `formatCompactSummary()` 在 prompt.ts:311-335 | `prompt.ts:311-335` | ✅准确 | 实际位于 311-335 行 |
| 12 | `truncateHeadForPTLRetry()` 在 compact.ts:243-291 | `compact.ts:243-291` | ✅准确 | 实际位于 243-291 行 |
| 13 | `groupMessagesByApiRound()` 在 `grouping.ts` | `grouping.ts:22` | ✅准确 | 函数存在 |
| 14 | `createPostCompactFileAttachments()` 在 compact.ts:1415-1464 | `compact.ts:1415-1464` | ✅准确 | 实际起始于 1415 行 |
| 15 | `createSkillAttachmentIfNeeded()` 在 compact.ts:1494-1534 | `compact.ts:1494-1534` | ✅准确 | 实际起始于 1494 行 |
| 16 | `sessionMemoryCompact.ts` 存在 | `src/services/compact/sessionMemoryCompact.ts` | ✅准确 | 文件存在 |
| 17 | `getAPIContextManagement()` 在 `apiMicrocompact.ts` | `src/services/compact/apiMicrocompact.ts` | ✅准确 | 文件存在 |
| 18 | `stripImagesFromMessages()` 在 compact.ts:145-200 | `compact.ts:145-200` | ✅准确 | 实际位于 145-200 行 |
| 19 | COMPACTABLE_TOOLS 列出 `Read, Bash, Grep, Glob, WebSearch, WebFetch, Edit, Write` | `microCompact.ts:41-50` | ⚠️部分不一致 | 源码使用常量引用（`FILE_READ_TOOL_NAME`, `SHELL_TOOL_NAMES` 等），教程简化为工具名。`SHELL_TOOL_NAMES` 实际包含多个 shell 工具名（不仅仅是 `Bash`），应注明 |
| 20 | 摘要 prompt 9 个部分 | `prompt.ts:61-143` | ✅准确 | 确实包含 9 个部分 |

**修正建议**：
- 第 4 项：将 `microCompact.ts:32` 改为 `microCompact.ts:36`
- 第 19 项：注明 `SHELL_TOOL_NAMES` 可能包含多个 shell 工具（Bash、SSH 等），不仅是 `Bash`
- 伪代码中的常量名 `POST_COMPACT_MAX_FILES` 应改为 `POST_COMPACT_MAX_FILES_TO_RESTORE`（源码 `compact.ts:122`），`POST_COMPACT_MAX_TOKENS_PER_FILE = 5_000` 源码验证正确（`compact.ts:124`）

### 2. 技术深度补充

#### 2.1 API 原生 context_management（遗漏）

教程提到 `apiMicrocompact.ts` 但未详细解释。源码显示这是一种**服务端压缩策略**，利用 Anthropic API 的原生 `context_management` 能力，可在服务端直接清除旧 tool_result，无需客户端修改消息。这与客户端微压缩形成互补，是理解完整压缩栈的关键环节。

**为什么重要**：业界正在从客户端压缩向 API 原生压缩迁移。2026 年 Anthropic、OpenAI 都在探索服务端 context 管理 API [R1]。教程应点明这是三层策略之外的"第四条路径"。

**怎么补充**：在"核心机制"章节末尾增加一个小节"Layer 0: API 原生上下文管理"，介绍 `apiMicrocompact.ts` 中 `getAPIContextManagement()` 的工作方式，以及它与客户端微压缩的互补关系。

#### 2.2 长上下文 vs 压缩的性能衰减（可深化）

教程引用了 Philschmid 的 durability 衰减观点，但未给出量化数据。研究表明：即使在 200K token 窗口中，模型的推理准确率在超过 50K token 后开始显著下降 [R2]。递归语言模型（RLM）的研究也表明，程序化搜索上下文优于被动读取 [R3]。

**怎么补充**：在"Why"章节增加一段关于"上下文长度 vs 推理质量"的权衡数据，引用 RULER benchmark 或 NIAH 变体实验的退化曲线，强化"压缩不是可选优化，而是结构性必需"的论点。

#### 2.2b 压缩 prompt 的 NO_TOOLS_PREAMBLE 设计（遗漏细节）

`prompt.ts:19-26` 显示压缩 prompt 前置了一个强制性 `NO_TOOLS_PREAMBLE`，明确禁止模型在摘要任务中调用任何工具（"Tool calls will be REJECTED and will waste your only turn"）。源码注释指出这是针对 Sonnet 4.6+ 模型在 `maxTurns: 1` 下仍尝试调用工具的问题（2.79% vs 0.01%）。

**为什么重要**：这是一个实际生产中的模型行为 quirk 的工程应对。教程提到了 `<analysis> + <summary>` 双标签但未提及防工具调用设计，而这在实际开发中是常见的"模型不听话"问题。

#### 2.3 KV-cache 热度与 prompt 缓存的关系（可深化）

教程提到了 Manus 的 KV-cache 优先策略，但未将其与 Claude Code 的 `cache_edits` 微压缩路径深入关联。`cachedMicrocompact` 模块（源码中 feature-gated）正是利用 API 的缓存编辑能力，在不破坏缓存的前提下删除旧内容。

**怎么补充**：在设计决策部分增加"微压缩如何保持 prompt 缓存热度"的技术细节，解释 `cache_edits` 指令如何让 API 在不重建缓存的情况下删除 tool_result 内容块。

#### 2.4 Context Collapse 实验功能（遗漏）

`autoCompact.ts:215-223` 显示 Claude Code 正在实验一种名为 **Context Collapse** 的新机制。当 Context Collapse 启用时，autocompact 被完全抑制——因为 Collapse 自己管理上下文压力（90% 触发 commit、95% 触发 blocking）。源码注释："Collapse IS the context management system when it's on"。

**为什么重要**：这暗示 Claude Code 的压缩架构正在从"事后摘要"向"主动上下文管理"演进。Context Collapse 可能代表了三层压缩之后的下一代方案。

**怎么补充**：在"设计决策"末尾增加一个"未来演进"段落，提及 Context Collapse 和 Reactive Compact 两个实验方向，让读者理解当前架构并非终态。

#### 2.5 Reactive Compact 模式（遗漏）

`autoCompact.ts:192-199` 显示有一个 "reactive-only" 模式：抑制主动的 autocompact，改为在 API 返回 `prompt_too_long` 时才被动触发压缩。这与当前教程描述的"主动阈值触发"形成对比。

**为什么重要**：这涉及一个重要的架构权衡——主动压缩（可能过早丢失上下文）vs 被动压缩（推迟到最后一刻，保留更多上下文但有 API 报错风险）。

### 3. 竞品对比洞察

| 维度 | Claude Code | Cursor | Aider | Codex CLI |
|------|-------------|--------|-------|-----------|
| 压缩层数 | 三层（微压缩 + 自动 + 手动） | 两层（`/summarize` + 自动） | 单层（repo-map + 自动截断） | 一层（API 原生 truncation） |
| 零成本压缩 | ✅ 微压缩替换旧 tool_result | ❌ 无独立层 | ✅ repo-map 是静态索引 | ❌ |
| 缓存感知压缩 | ✅ cached micro compact | ❌ | ❌ | ❌ |
| 结构化摘要 | ✅ 9 section + analysis scratchpad | 基础摘要 | 无 LLM 摘要 | 无 |
| 压缩后恢复 | ✅ 完整恢复体系（文件/Skill/Plan/Agent/Tool） | 部分（文件恢复） | 无 | 无 |
| 转录持久化 | ✅ .transcripts/ | ❌ | ❌ | ❌ |

**值得补充的对比视角**：

1. **Cursor `/summarize`**：Cursor 也提供手动压缩命令，但不区分微压缩和 LLM 压缩。NVIDIA RTX Remix 文档指出 "Most agents support some form of context compaction (Claude Code uses `/compact`, Cursor uses `/summarize`)" [R4]。教程可增加一段对比。

2. **Aider repo-map**：Aider 采用完全不同的策略——用 tree-sitter 生成仓库结构的紧凑"地图"，按需加载上下文，从根本上减少 token 使用。这是"避免膨胀"而非"事后压缩"的路线。教程可讨论这两种哲学的取舍。

3. **Codex CLI**：OpenAI 的 Codex CLI 主要依赖 API 侧的自动截断，无客户端压缩策略。这使其在长会话中的性能不如 Claude Code 稳定。

### 4. 教学法优化

#### 4.1 难度曲线

当前结构是"问题 → 架构图 → 三层机制 → Python 伪代码 → 源码映射 → 设计决策"。问题在于：
- 从"问题"直接跳到三层架构，缺少**渐进式引入**
- 641 行伪代码一次性展开，学习者难以消化

**建议**：
1. 在"核心机制"前增加一个**最小示例**：先展示一个 10 行的 token 计数 + 简单截断，让读者理解基线问题
2. 三层机制按"成本递增"顺序展开，每层都先给一个 5 行的核心逻辑，再展开完整实现
3. 伪代码按层拆分为三个独立的 `<details>` 块，而非一个 641 行的大块

#### 4.2 缺少可观测性教学

教程没有教读者如何**观察**压缩的实际效果。建议增加：
- 如何用 `--debug` 模式查看 token 计数和压缩触发日志
- 如何用 `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` 环境变量降低阈值来测试自动压缩
- 如何查看 `.transcripts/` 中的转录文件来理解压缩前后的差异

#### 4.3 练习设计

当前三个练习都是"实现 X"，难度较高且缺乏中间步骤。建议：
- **练习 0**（新增）：给定一段对话消息列表，手动计算 token 数和压缩触发条件，理解阈值计算
- 练习 1 保持不变但增加**测试用例**：提供 5 个预设的消息序列，验证压缩结果
- **练习 2.5**（新增）：阅读一份真实的压缩摘要，标注 9 个 section 中哪些保留了关键信息、哪些遗漏了

### 5. 实战陷阱与案例

#### 5.1 压缩导致的"任务漂移"

**陷阱**：自动压缩触发后，摘要可能遗漏用户的某些指令（特别是会话早期的隐含约束），导致 agent 在压缩后"忘记"了用户的要求。

**案例**：用户在会话开始时说"所有修改要加测试"，经过 50 轮对话后触发自动压缩，摘要只保留了最近的代码修改细节，丢掉了"加测试"的约束。后续 agent 开始只改代码不写测试。

**应对**：教程应强调 CLAUDE.md 作为"不可压缩的规则"的重要性——关键约束应写入 CLAUDE.md 而非依赖对话记忆。这也是 s08 Memory 系统的核心价值之一，可以在此处做前向引用。

#### 5.2 熔断器触发后的静默失败

**陷阱**：连续自动压缩失败 3 次后，熔断器停止重试。此时对话继续进行但 token 持续积累，最终可能导致 `prompt_too_long` 错误。

**案例**：某些包含大量代码块的会话，压缩摘要本身也超过上下文限制，导致反复失败。源码注释显示："1,279 sessions had 50+ consecutive failures (up to 3,272) in a single session, wasting ~250K API calls/day globally"（`autoCompact.ts:69`）。

**应对**：教程应提及这种场景，并建议用户在看到性能下降时手动 `/compact` 或开新会话。

#### 5.3 微压缩的"看不见的信息丢失"

**陷阱**：微压缩替换旧 tool_result 后，模型无法回溯查看之前 grep/read 的结果。如果用户问"之前那个 grep 结果里有没有 X"，模型会看到 `[Old tool result content cleared]` 而无法回答。

**应对**：教程可增加一个提示：如果需要回溯旧结果，可以让 agent 重新执行工具调用，或查看 `.transcripts/` 中的完整转录。

---

## s08 — Memory 系统：CLAUDE.md 与自动记忆

### 1. 源码一致性验证

| # | 教程描述 | 源码位置 | 判定 | 说明 |
|---|---------|---------|------|------|
| 1 | `loadMemoryPrompt()`, `buildMemoryLines()`, `buildMemoryPrompt()` 在 `memdir.ts` | `src/memdir/memdir.ts` | ✅准确 | 三个函数均存在：`loadMemoryPrompt()` 在 419 行（主入口），`buildMemoryLines()` 在 199 行，`buildMemoryPrompt()` 在 272 行 |
| 2 | `MEMORY_TYPES = ['user', 'feedback', 'project', 'reference']` 在 `memoryTypes.ts` | `memoryTypes.ts:14-19` | ✅准确 | 完全匹配 |
| 3 | `TYPES_SECTION_INDIVIDUAL` 在 memoryTypes.ts:113-178 | `memoryTypes.ts:113-178` | ✅准确 | 实际位于 113-178 行 |
| 4 | `TYPES_SECTION_COMBINED` 含 `<scope>` 标签在 37-106 行 | `memoryTypes.ts:37-106` | ✅准确 | 实际位于 37-106 行 |
| 5 | `WHAT_NOT_TO_SAVE_SECTION` 在 memoryTypes.ts:183-195 | `memoryTypes.ts:183-195` | ✅准确 | 实际位于 183-195 行 |
| 6 | `memoryAgeDays()`, `memoryAge()`, `memoryFreshnessText()` 在 `memoryAge.ts` | `src/memdir/memoryAge.ts` | ✅准确 | 三个函数都存在，语义匹配 |
| 7 | `getAutoMemPath()` 在 `paths.ts`，含 sanitize、worktree、override | `src/memdir/paths.ts:223-235` | ✅准确 | 函数存在，包含 sanitize 和 override 逻辑 |
| 8 | `validateMemoryPath()` 防止路径穿越在 paths.ts:109-150 | `paths.ts:109-150` | ✅准确 | 实际位于 109-150 行 |
| 9 | `scanMemoryFiles()` 在 `memoryScan.ts` | `src/memdir/memoryScan.ts:35` | ✅准确 | 函数存在 |
| 10 | `formatMemoryManifest()` 在 memoryScan.ts:84-94 | `memoryScan.ts:84-94` | ✅准确 | 实际位于 84-94 行 |
| 11 | `findRelevantMemories()` 在 `findRelevantMemories.ts` | `src/memdir/findRelevantMemories.ts:39` | ✅准确 | 函数存在 |
| 12 | `SELECT_MEMORIES_SYSTEM_PROMPT` 在 findRelevantMemories.ts:18-24 | `findRelevantMemories.ts:18-24` | ✅准确 | 实际位于 18-24 行 |
| 13 | `truncateEntrypointContent()` 200 行 + 25KB 限制在 memdir.ts:57-103 | `memdir.ts:57-103` | ✅准确 | 实际位于 57-103 行 |
| 14 | `ensureMemoryDirExists()` 在 memdir.ts:129-147 | `memdir.ts:129-147` | ✅准确 | 实际位于 129-147 行 |
| 15 | `TRUSTING_RECALL_SECTION` 在 memoryTypes.ts:240-256 | `memoryTypes.ts:240-256` | ✅准确 | 实际位于 240-256 行 |
| 16 | `getTeamMemPath()` 在 `teamMemPaths.ts` | `src/memdir/teamMemPaths.ts:84` | ✅准确 | 函数在第 84 行导出，返回团队记忆目录路径。同文件还包含路径安全函数（`sanitizePathKey`、`PathTraversalError`） |
| 17 | 四种记忆类型的 frontmatter 格式 | `memoryTypes.ts` + system prompt | ✅准确 | 源码中有完整的 frontmatter 格式示例（`MEMORY_FRONTMATTER_EXAMPLE`） |

**修正建议**：
- s08 源码映射整体高度准确，17 项引用均通过验证，无需修正
- 可选改进：第 7 项 `getAutoMemPath()` 在 `paths.ts:223` 行（memoized 导出），教程可补充行号

### 2. 技术深度补充

#### 2.1 Extract Memories 后台代理（遗漏）

源码 `paths.ts:69-77` 显示有一个 `isExtractModeActive()` 函数，控制"记忆提取后台代理"的启用。这是一个在对话结束后自动从对话内容中提取值得记住的信息并保存为记忆文件的后台机制。教程完全没有提及这一功能。

**为什么重要**：这是 Memory 系统从"被动存储"到"主动提取"的关键进化。用户不需要显式说"记住这个"，系统会自动识别和提取值得记忆的信息。

**怎么补充**：在"核心机制"末尾增加一节"Extract Memories: 自动记忆提取"，解释后台代理如何在对话结束后异步分析对话内容，提取符合四种类型的信息。

#### 2.2 团队记忆（team memory）深度不足

教程源码映射表提到了 `teamMemPaths.ts`，但正文几乎没有展开团队记忆的设计。源码中有 `teamMemPrompts.ts` 和 `TYPES_SECTION_COMBINED`（含 `<scope>` 标签），说明团队模式下记忆分为 private 和 team 两个作用域。

**为什么重要**：团队记忆是多人协作场景的核心。feedback 类型的记忆需要判断是个人偏好（private）还是项目规范（team）。

**怎么补充**：增加一个"进阶：团队记忆"小节，对比 individual 模式和 combined 模式的差异，解释 `<scope>` 标签的作用。源码 `teamMemPrompts.ts` 和 `teamMemPaths.ts` 提供了完整的团队记忆构建逻辑，可作为伪代码扩展。

#### 2.3 Memory Poisoning 攻击面（可深化）

教程有安全提示但缺乏技术细节。Memory Poisoning 的攻击路径包括：
1. 恶意文件内容中嵌入 prompt injection，触发 agent 将其保存为记忆
2. 被污染的记忆在后续会话中被注入上下文，实现持久化攻击
3. 攻击者可通过 PR 中的恶意注释污染项目级 CLAUDE.md

**怎么补充**：增加一个 "安全深潜" 段落，解释 Claude Code 的防御措施：`validateMemoryPath()` 防路径穿越、freshness caveat 降低过时记忆权重、项目设置排除 `autoMemoryDirectory` 等。

### 3. 竞品对比洞察

| 维度 | Claude Code | Cursor | Aider | Windsurf |
|------|-------------|--------|-------|----------|
| 记忆格式 | Markdown + YAML frontmatter | `.cursorrules` + 内部 DB | `.aider.conf.yml` + repo-map | `.windsurfrules` + Cascade Memory |
| 持久化机制 | 文件系统（可 git） | 内部数据库 | 配置文件 | 内部数据库 |
| 跨会话记忆 | ✅ Auto Memory | ❌（需手动规则） | ❌ | ✅ Cascade 自动记忆 |
| 智能检索 | ✅ Sonnet 相关性判断 | ❌ | ❌ | 部分 |
| 用户可审计 | ✅ 直接编辑 md 文件 | ❌ 不透明 | ✅ 配置文件可编辑 | ❌ 不透明 |
| 类型分类 | ✅ 四种固定类型 | ❌ 无分类 | ❌ 无分类 | ❌ 无分类 |
| 通用标准 | CLAUDE.md（Anthropic 生态） | `.cursorrules` | `.aider.conf.yml` | `.windsurfrules` |

**值得补充的对比视角**：

1. **AGENTS.md 通用标准**：2025 年中，Sourcegraph、OpenAI、Google、Cursor 等合作推出了 AGENTS.md 作为跨工具的通用 agent 配置标准 [R5]。Claude Code 的 CLAUDE.md 是同一理念的 Anthropic 实现。教程可增加对 AGENTS.md 标准的讨论。

2. **Windsurf Cascade Memory**：Windsurf 的 Cascade 系统也实现了自动跨会话记忆，但采用黑盒方式——用户无法直接查看或编辑记忆内容。与 Claude Code 的文件系统透明方案形成鲜明对比。

3. **向量数据库方案**：教程已有"文件系统 vs 数据库"对比表，但缺少对实际向量数据库方案的引用。可参考 Mem0、MemGPT/Letta 等框架 [R6] 的设计，说明为什么 Claude Code 选择了更简单的文件方案。

### 4. 教学法优化

#### 4.1 难度曲线

当前结构一次性铺开所有概念（CLAUDE.md + Auto Memory + 四种类型 + 索引 + 检索 + 新鲜度 + 安全）。信息密度过高。

**建议**：
1. 将内容分为两个逻辑块：**Part A "规则注入"**（CLAUDE.md 部分，概念简单）和 **Part B "智能记忆"**（Auto Memory 部分，概念复杂）
2. 在 Part A 结束后设置一个检查点练习（如：给一个项目场景，让读者设计 CLAUDE.md 层级结构）
3. Part B 按"存 → 索引 → 检索 → 新鲜度"的数据流顺序展开

#### 4.2 示例质量

教程中的四种类型示例直接复用了源码中的 system prompt 示例。这些示例很好，但缺少**反例**。

**建议**：
- 增加"什么不应该存"的具体反例：比如"用户把一个 git log 输出存为 project 记忆"为什么是错误的
- 增加跨类型的边界案例：比如"不要在测试中 mock 数据库"是 feedback 还是 project？（答案是 feedback，因为它跨项目适用）

#### 4.3 练习设计改进

**练习 1**：当前是"实现记忆存储系统"，建议降低门槛：
- 先让读者用实际 Claude Code 存储一条记忆，观察生成的文件结构
- 然后再实现 Python 版本

**练习 2**：当前是"实现智能记忆检索"，建议增加中间步骤：
- 先给定一个 manifest + 查询，让读者人工选择 5 个最相关的记忆（理解选择标准）
- 然后再实现自动化版本

**新增练习 4**：设计一个"记忆审计"脚本——扫描 memory 目录，找出所有超过 30 天的记忆、缺少 frontmatter 的记忆、可能重复的记忆。这个练习兼顾了编码和对记忆系统理解的深化。

### 5. 实战陷阱与案例

#### 5.1 记忆膨胀与索引溢出

**陷阱**：长期使用后，记忆文件可能膨胀到超过 200 行 / 25KB 的 MEMORY.md 索引限制。此时新记忆虽然被保存，但索引被截断后 agent 不知道它们的存在，导致"存了但想不起来"。

**案例**：一个持续 3 个月的项目，积累了 300+ 条记忆，MEMORY.md 超过 200 行被截断。后 100 条记忆完全不可见。

**应对**：
1. 定期清理过时记忆（特别是 project 类型）
2. 合并相关记忆为单条（如多条 feedback 合并为一份"编码规范"）
3. 使用子目录组织记忆（memoryScan 支持递归扫描）

#### 5.2 记忆冲突

**陷阱**：feedback 类型的记忆可能相互矛盾。比如用户先说"用 npm"，后来改口说"用 bun"，两条记忆同时存在。

**案例**：agent 在检索到两条矛盾的 feedback 记忆后，行为变得不确定——有时用 npm，有时用 bun。

**应对**：教程应强调"更新而非追加"的原则——保存新记忆前先检查是否有现有记忆需要更新。源码的 system prompt 中已包含此指导："Do not write duplicate memories. First check if there is an existing memory you can update before writing a new one."

#### 5.3 敏感信息泄露到记忆

**陷阱**：agent 可能将代码中的 API key、密码等敏感信息保存为记忆。由于记忆文件存储在文件系统中，可能被其他工具或用户访问。

**应对**：
1. 定期审计 `~/.claude/projects/*/memory/` 目录
2. 不要将记忆目录添加到版本控制中
3. `validateMemoryPath()` 提供的路径安全校验只防止路径穿越，不防止内容敏感性

#### 5.4 Worktree 记忆共享的陷阱

**陷阱**：源码 `paths.ts` 显示同一 git 仓库的不同 worktree 共享同一个记忆目录（使用 `findCanonicalGitRoot`）。这意味着在 worktree A 中存的记忆会在 worktree B 中可见。

**案例**：在特性分支的 worktree 中存了"当前正在重构 auth 模块"的 project 记忆，切换到 main 分支的 worktree 后，agent 仍然认为在重构 auth。

**应对**：教程应提醒：worktree 间共享记忆时，避免存储与分支状态强相关的 project 记忆。

---

## 参考文献

| 编号 | 来源 | 内容 |
|------|------|------|
| R1 | The Fundamentals of Context Management and Compaction in LLMs (kargarisaac.medium.com) | LLM 上下文管理和压缩的系统性综述 |
| R2 | LLM Context Window Limitations: Impacts, Risks, & Fixes in 2026 (atlan.com) | 上下文窗口限制的影响和修复策略 |
| R3 | Do we still need RAG? Recursive language models and the limits of long context windows (blog.doubleslash.de) | RLM 作为长上下文替代方案的研究 |
| R4 | AI-Assisted Development — NVIDIA RTX Remix (docs.omniverse.nvidia.com) | Claude Code `/compact` 与 Cursor `/summarize` 的并列对比 |
| R5 | The Complete Guide to AI Agent Memory Files — AGENTS.md (medium.com) | AGENTS.md 通用标准的介绍和各工具对比 |
| R6 | The 6 Best AI Agent Memory Frameworks You Should Try in 2026 (machinelearningmastery.com) | Mem0、MemGPT/Letta 等记忆框架对比 |
| R7 | State of Context Engineering in 2026 (medium.com, Kushal Banda) | 2026 年上下文工程模式总结：渐进式披露、压缩、路由、检索 |
| R8 | RAG vs. long-context LLMs: A side-by-side comparison (meilisearch.com) | RAG 与长上下文 LLM 的性能和成本对比 |
| R9 | From RAG to Context — A 2025 year-end review (ragflow.io) | 从 RAG 到上下文工程的演进综述 |
| R10 | I built AI memory features in Oct 2025. Anthropic shipped Auto Memory in 2026 (reddit.com) | Claude Code Memory 系统演进时间线 |
| R11 | OpenClaude: Build a Claude Code Agent with Long-Term Memory (hindsight.vectorize.io) | Claude Code 长期记忆的第三方实现 |
| R12 | How I Built a 4-Level Memory System for My AI Agent (medium.com, Andy.G) | 四层记忆系统的社区实践 |
