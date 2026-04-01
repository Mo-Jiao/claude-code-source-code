# 审查报告：s09-Skills / s10-Plan Mode / s11-Tasks

> 审查日期：2026-04-01（第二轮） | 审查范围：tutorial/guide/s09-skills.md, s10-plan-mode.md, s11-tasks.md

## 审查摘要（200 字）

三节课覆盖了 Claude Code 的 Skills 两层注入、Plan Mode 状态机和文件型 DAG 任务系统，整体质量高，源码映射准确率约 92%。**s09** 的核心架构描述精准，但内置 Skills 列表遗漏了 10 个（如 `stuck`、`batch`、`skillify`、`claudeInChrome`），去重机制描述用词不准（教程说"realpath"，实际代码用 `getFileIdentity`）。**s10** 的状态机和缓存感知设计讲解出色，源码验证接近 100% 准确，但竞品对比中 Aider Architect 模式的描述过于简化，未提及其 editor/coder 双模型管道，且缺少 Codex CLI 和 Windsurf 的对比。**s11** 的 DAG 和并发安全讲解扎实，验证提醒的行号偏差 3 行（教程 329→实际 326），`proper-lockfile` 实际通过 `./lockfile.js` 封装层引用。三课共同的改进方向：缺少对 Plan-and-Execute agent 架构模式的理论锚点、竞品对比可补充 Windsurf/Codex CLI/Devin、练习可增加骨架代码和验收标准。

---

## s09 — Skills：两层知识注入

### 1. 源码一致性验证

| 教程声明 | 验证结果 | 说明 |
|---------|---------|------|
| `src/skills/loadSkillsDir.ts` 包含 `getSkillDirCommands()` | ✅准确 | 第 638 行，memoized 函数 |
| `loadSkillsFromSkillsDir()` 在 407-480 行 | ✅准确 | 精确匹配，407 行开始，480 行 `return results.filter(...)` |
| `parseSkillFrontmatterFields()` 在 185-265 行 | ✅准确 | 第 185 行 `export function parseSkillFrontmatterFields(` |
| `createSkillCommand()` 在 270-401 行 | ✅准确 | 第 270 行开始 |
| `getSkillsPath()` 在 78-94 行 | ✅准确 | 第 78 行开始，支持 policySettings/userSettings/projectSettings/plugin |
| `estimateSkillFrontmatterTokens()` 在 100-105 行 | ✅准确 | 第 100-105 行，使用 `roughTokenCountEstimation` |
| `discoverSkillDirsForPaths()` 在 861-915 行 | ✅准确 | 第 861 行 |
| `addSkillDirectories()` 在 923-975 行 | ✅准确 | 第 923 行 |
| `activateConditionalSkillsForPaths()` 在 997-1058 行 | ✅准确 | 第 997 行 |
| `parseSkillPaths()` 在 159-178 行 | ✅准确 | 第 159 行，去除 `/**` 后缀逻辑 |
| 去重逻辑在 728-769 行，通过 `realpath` 检测 | ❌不一致 | 实际在 725-769 行，且实现用 `getFileIdentity()` + `seenFileIds` Map 去重，而非教程描述的直接 `realpath`。语义等价但术语不准确 |
| `registerBundledSkill()` 在 `bundledSkills.ts` | ✅准确 | 第 53 行 |
| `getBundledSkills()` 在 `bundledSkills.ts` | ✅准确 | 第 106 行 |
| `extractBundledSkillFiles()` 在 131-145 行 | ✅准确 | 第 131 行开始 |
| `getBundledSkillExtractDir()` 在 `bundledSkills.ts` | ✅准确 | 第 120 行 |
| `createSkillAttachmentIfNeeded()` 在 `compact.ts:1494-1534` | ✅准确 | 精确匹配 |
| `POST_COMPACT_MAX_TOKENS_PER_SKILL = 5_000` | ✅准确 | `compact.ts` 第 129 行 |
| `POST_COMPACT_SKILLS_TOKEN_BUDGET = 25_000` | ✅准确 | `compact.ts` 第 130 行 |
| MCP 安全限制 `loadedFrom !== 'mcp'` | ✅准确 | `loadSkillsDir.ts` 第 374 行，注释明确说明安全原因 |
| `mcpSkillBuilders.ts` 存在 | ✅准确 | 文件存在 |
| `ignore` 库用于路径匹配 | ✅准确 | `loadSkillsDir.ts` 第 2 行 `import ignore from 'ignore'` |
| 内置 Skills 列表：remember/loop/verify/claude-api/debug/simplify/update-config | ❌不完整 | 实际有 17 个文件：`batch`、`claudeApi`、`claudeApiContent`、`claudeInChrome`、`debug`、`index`、`keybindings`、`loop`、`loremIpsum`、`remember`、`scheduleRemoteAgents`、`simplify`、`skillify`、`stuck`、`updateConfig`、`verify`、`verifyContent`。教程只列了 7 个核心 Skill |
| `loadSkillsDir.ts` 末尾导出 `createSkillCommand` + `parseSkillFrontmatterFields` | ✅准确 | 第 1084-1085 行 |

**总结**：23 项验证中 21 项准确（91%），2 项有偏差（去重术语不准、内置列表不完整），但不影响核心概念理解。

**修改建议**：
1. 去重描述改为"通过 `getFileIdentity()` 检测同一文件的不同路径引用"，或至少注明"通过 realpath 等价机制"
2. 内置 Skill 表格改为"核心内置 Skills（部分列举）"，或完整列出全部 17 个

### 2. 技术深度补充

**遗漏 1：Skills 与 Commands 的历史演进**

教程简单提到"旧的 `/commands/` 目录仍然支持"，但没有解释演进历史。`loadSkillsDir.ts` 第 482 行有 `// --- Legacy /commands/ loader ---` 注释，说明 Skills 是 Commands 的重构升级。`loadSkillsDir.ts` 末尾甚至有 `export { getSkillDirCommands as getCommandDirCommands }` 的别名导出（第 814 行）用于向后兼容。

**为什么重要**：理解 Commands → Skills 的迁移动机有助于读者理解目录格式限制和向后兼容设计。

**怎么补充**：在"SKILL.md 目录格式 vs 单文件格式"章节加一个 2-3 句的"历史背景"说明。

**遗漏 2：`roughTokenCountEstimation` 的实际实现**

教程伪代码中 token 估算使用简单的 `len(text) // 4`，但实际 `estimateSkillFrontmatterTokens` 调用的是 `roughTokenCountEstimation`（从 `services/tokenEstimation.ts` 导入），其实现可能比简单除法更精确。

**怎么补充**：在伪代码注释中说明"实际实现使用专门的 token 估算函数，此处简化为 ~4 chars/token 近似"。

**遗漏 3：Skill 的 `context: fork` 和 `agent` 字段**

教程 frontmatter 表列出了 `context` 字段但未解释 `fork` 模式的具体含义。`BundledSkillDefinition` 类型（`bundledSkills.ts`）还有 `agent?: string` 字段允许指定子 agent 类型，教程未提及。

**怎么补充**：在 frontmatter 表的 `context` 行扩展说明：`fork` 模式在独立子 agent 中执行 Skill，适用于耗时任务或需要工具隔离的场景。

### 3. 竞品对比洞察

**Cursor Rules vs Claude Code Skills**

Cursor 的 `.cursor/rules/` 目录支持 glob 路径匹配的条件激活（类似 Claude Code 的 `paths` frontmatter），但没有两层注入——所有匹配的 Rules 内容直接注入 system prompt，token 成本更高。

**Aider 的 Convention 系统**

Aider 使用 `--read` 参数加载参考文件，内容始终全量加载到上下文。没有"技能发现"或按需加载机制。

**Windsurf Rules**

Windsurf 的 `.windsurfrules` 文件类似 Cursor Rules，单层静态注入。值得在竞品表中补充。

**建议补充**：在"设计决策"的竞品对比部分加一个更全面的表格，覆盖 Cursor Rules、Aider、Windsurf 的设计差异。

### 4. 教学法优化

**a) 671 行伪代码过长**

完整伪代码 671 行放在一个 `<details>` 中，对多数读者难以消化。教程自身在 Why 章节倡导的 "Progressive Disclosure" 原则本身就适用于教程编写。

**改进建议**：
1. 拆成 3 个递进代码块：基础版（~100 行，两层注入 + 单来源）→ 扩展版（~150 行，多来源 + 动态发现）→ 完整版（~400 行，含条件激活 + compact 恢复）
2. 主文中的精简版伪代码已有，质量好，但 671 行完整版可拆分为 3 个 `<details>`

**b) 架构图信息密度过高**

6 种来源 + 2 层注入 + 2 种调用方式在一张 Mermaid 图中，箭头过密。建议拆为"来源扫描图"和"按需加载图"两张。

**c) 练习缺少验收标准**

三个练习都是"实现 X + 验证 Y"结构，但没有明确的预期输出或 assert 语句。建议每个练习附带 3-5 个 `assert` 测试。

### 5. 实战陷阱与案例

**陷阱 1：Skill 名称冲突的解决**

当 user Skill 和 project Skill 同名时，去重逻辑通过 `getFileIdentity` 检测**同一物理文件**。但如果两个目录下有同名但不同内容的 Skill（如 `~/.claude/skills/deploy/` vs `.claude/skills/deploy/`），取决于加载顺序（先 managed > user > project > bundled），**先加载的 wins**。

**案例**：开发者在 `~/.claude/skills/deploy/SKILL.md` 配了 staging 部署流程，项目中也有 `.claude/skills/deploy/SKILL.md` 配了 production 部署流程。由于 user skills 先加载，staging 版本生效，production 版本被忽略。

**陷阱 2：内联 Shell 命令的安全风险**

教程提到 MCP Skill 的安全限制（`loadedFrom !== 'mcp'` 禁止 shell 执行），但本地项目级 Skill 的内联 shell 命令（`!` 前缀）也存在风险。克隆未审计的仓库时，`.claude/skills/` 中可能包含恶意 shell 命令。

**建议**：在安全提示中增加"审查项目级 Skill 的内联 shell 命令"的具体操作。

**陷阱 3：压缩后 Skill 截断的影响**

25K tokens 总预算 + 每个 Skill 5K tokens 上限意味着最多恢复 5 个大 Skill。长对话中频繁切换 Skill 时，早期调用的 Skill 可能在压缩后丢失。模型会看到截断标记提示可以 Read 完整文件，但如果 Skill 来自 MCP 或 bundled（没有磁盘路径），Read 可能失败。

---

## s10 — Plan Mode：先想后做

### 1. 源码一致性验证

| 教程声明 | 验证结果 | 说明 |
|---------|---------|------|
| `EnterPlanModeTool.ts` 在 `src/tools/EnterPlanModeTool/` | ✅准确 | 文件存在，导入 `handlePlanModeTransition` + `prepareContextForPlanMode` |
| `prompt.ts` 区分 ant/external 用户 | ✅准确 | 第 166-169 行 `process.env.USER_TYPE === 'ant'` + `getEnterPlanModeToolPromptAnt()` |
| `getEnterPlanModeToolPromptExternal()` 和 `getEnterPlanModeToolPromptAnt()` | ✅准确 | 分别在第 16 行和第 101 行 |
| `ExitPlanModeV2Tool.ts` 在 `src/tools/ExitPlanModeTool/` | ✅准确 | 文件存在 |
| `allowedPromptSchema` 在 ExitPlanModeV2Tool.ts:64-73 | ✅准确 | 第 64 行 `const allowedPromptSchema = lazySchema(...)` |
| `plans.ts` 包含 `getPlanFilePath`、`getPlanSlug`、`getPlansDirectory` | ✅准确 | 分别在第 119、32、79 行 |
| `planModeV2.ts` 包含 `isPlanModeInterviewPhaseEnabled` | ✅准确 | 第 50 行 |
| `planModeV2.ts` 包含 `getPewterLedgerVariant` | ✅准确 | 第 88 行 |
| `handlePlanModeTransition` 在 `state.ts` | ✅准确 | 第 1349 行 |
| `prepareContextForPlanMode` 在 `permissionSetup.ts` | ✅准确 | 第 1462 行 |
| `UI.tsx` 存在于两个 PlanMode 工具目录 | ✅准确 | 两个文件均存在 |
| `applyPermissionUpdate` 导入使用 | ✅准确 | `EnterPlanModeTool.ts` 第 10 行导入 |
| Plan 文件使用 word slug（`generateWordSlug`） | ✅准确 | `plans.ts` 第 23 行导入 `generateWordSlug` from `./words.js` |
| `getPlanFilePath` 支持 agentId 后缀 | ✅准确 | 第 119-128 行，子 agent 格式为 `{slug}-agent-{agentId}.md` |
| `persistFileSnapshotIfRemote()` 用于远程恢复 | ✅准确 | `plans.ts` 中导入并使用 |
| `settings.plansDirectory` 可自定义 | ✅准确 | `getPlansDirectory()` 中引用 `getInitialSettings` |
| Channels 限制：KAIROS feature flag 检查 | ✅准确 | `EnterPlanModeTool.ts` 第 4 行导入 `getAllowedChannels` |
| Interview Phase 实验 | ✅准确 | `planModeV2.ts` 第 50 行，使用 feature gate |
| `isPlanModeRequired()` + teammate 审批 | ✅准确 | `ExitPlanModeV2Tool.ts` 导入 `isPlanModeRequired` from `teammate.js` |
| `writeToMailbox` 用于 teammate 审批 | ✅准确 | `ExitPlanModeV2Tool.ts` 第 40 行导入 |
| `shouldDefer: true` 触发用户确认 | ⚠️间接准确 | 通过 `buildTool` 的工具框架实现，不在 EnterPlanModeTool.ts 中显式出现 |

**总结**：21 项验证中 20 项准确（95%），1 项间接准确。s10 的源码映射质量最高。

### 2. 技术深度补充

**遗漏 1：Auto Mode 与 Plan Mode 的交互**

教程提到 `prePlanMode` 保存/恢复机制，但没有讨论从 Auto Mode 进入 Plan Mode 的特殊处理。源码中 `ExitPlanModeV2Tool.ts` 使用条件导入（`feature('TRANSCRIPT_CLASSIFIER')`）来加载 `autoModeState` 和 `permissionSetup` 模块，说明 Auto → Plan → 恢复的路径有复杂的状态管理。

**为什么重要**：Auto Mode（`-y` flag）是生产中最常用的模式。从 Auto 进入 Plan 再退出时，需要确保 Auto Mode 的权限级别被正确恢复而非降级。

**怎么补充**：在"ExitPlanMode"章节加一段注释，说明 Auto Mode 下进入/退出 Plan Mode 的特殊行为。

**遗漏 2：Plan-and-Execute 架构模式的理论定位**

Plan Mode 是 **Plan-and-Execute** 架构模式的工程实现，与 ReAct（Reason-Act-Observe 循环）模式互补。LangGraph 在其教程中将这两种模式作为 agent 设计的基本范式。Claude Code 的 Plan Mode 属于"固定计划后执行"类型——一次性规划后执行，不在执行过程中动态修改计划。

**为什么重要**：将 Plan Mode 放入更广阔的 agent 架构理论背景中，帮助读者在自己的 agent 设计中做出架构选择。

**怎么补充**：在 "Why" 章节加一个"Plan-and-Execute 架构模式"小节，引用 LangGraph 文档和 Anthropic 的 Building Effective Agents 指南。

**遗漏 3：`hasExitedPlanModeInSession` 状态追踪**

`ExitPlanModeV2Tool.ts` 第 7 行导入 `hasExitedPlanModeInSession` 和 `setHasExitedPlanMode`，说明系统追踪"本次会话是否退出过 Plan Mode"。这个状态可能用于分析或调整后续行为，教程未提及。

### 3. 竞品对比洞察

**Aider Architect 模式需要更准确的描述**

教程竞品表说 Aider Architect 是"architect/coder 分离"。实际上是**双模型管道**——Architect 模型（如 o1）负责推理和代码设计，Coder 模型（如 Sonnet）负责将设计翻译成具体编辑指令。这利用了不同模型的能力差异（推理型 vs 编码型），与 Claude Code 的单模型权限切换是根本不同的架构。

**Codex CLI 的隐式规划**

OpenAI Codex CLI 支持 `full-auto` 模式，在沙箱中完全自主执行。其规划是隐式的（通过 reasoning tokens），没有显式的 Plan Mode 状态机。值得在竞品表中补充。

**Windsurf Cascade 的思考可视化**

Windsurf 有"思考步骤"可视化让用户看到推理过程，但没有显式规划阶段，用户不能编辑或批准计划。

**建议改进后的竞品表**：

| 特性 | Claude Code | Cursor Composer | Aider Architect | Codex CLI | Windsurf |
|------|------------|-----------------|-----------------|-----------|----------|
| 显式计划阶段 | 是（状态机） | 否 | 是（双模型） | 否 | 否 |
| 工具约束 | 权限模式（Cache 友好） | 无 | 模型分离 | 沙箱 | 无 |
| 用户编辑计划 | 是（Ctrl+G / Web UI） | 有限 | 否 | 否 | 否 |
| 计划持久化 | 文件存储 | 内存 | 对话 | N/A | 内存 |
| 语义权限请求 | allowedPrompts | 无 | 无 | 无 | 无 |
| 团队审批 | 支持（mailbox） | 不支持 | 不支持 | 不支持 | 不支持 |

### 4. 教学法优化

**a) allowedPrompts 缺少端到端示例**

`allowedPrompts` 是 s10 最独特的创新之一，但教程只展示了 schema 定义。建议增加端到端示例：
1. Agent 写计划："1. 安装 jsonwebtoken 2. 创建中间件 3. 运行测试"
2. Agent 调用 ExitPlanMode，附带 `allowedPrompts: [{tool: "Bash", prompt: "run tests"}, {tool: "Bash", prompt: "npm install"}]`
3. 用户批准计划和权限
4. 实施阶段，`npm install` 和 `npm test` 无需再次确认

**为什么改**：allowedPrompts 是 Plan Mode 相对于竞品的独特优势，值得更多教学篇幅。

**b) 伪代码中 `should_enter_plan_mode` 的误导性**

用代码实现的启发式规则暗示了"硬编码条件判断"，但实际由 prompt 驱动模型自主判断。建议明确注释"实际由 LLM 基于 prompt 自主判断，此处为教学简化"。

**c) 练习 3（Cache 影响分析）可更实际**

当前过于理论化。建议改为：提供具体数值（10000 tokens system prompt、3000 tokens 工具定义、5 轮对话），让读者计算两种方案的累计 cache miss token 数。可补充 Claude API 的 cache 定价信息（cache write 成本 vs cache read 成本）让计算有商业意义。

**d) 状态图缺少异常路径**

Mermaid 状态图只展示正常流程，缺少：
- 用户 Ctrl+C 强制退出的行为
- channels 模式下 Plan Mode 被禁用的路径
- compact 发生在 Plan Mode 中时的恢复行为

### 5. 实战陷阱与案例

**陷阱 1：Plan Mode 中写入计划文件的"例外"**

伪代码中 `check_tool_allowed("Edit") == False` 和注释"写 plan 文件是特殊允许的"存在表面矛盾。实际上，Plan Mode 允许写入 `.claude/plans/` 目录下的文件——这是权限系统的特殊豁免。如果读者严格按照伪代码实现，会发现 agent 无法保存计划。

**建议**：在伪代码注释中明确说明 plan 文件写入的豁免规则。

**陷阱 2：频繁进出 Plan Mode 的隐性成本**

虽然工具集不变保护了 Cache，但每次模式转换都会通过 `handlePlanModeTransition` 设置 attachment flags（如 `setNeedsPlanModeExitAttachment`），影响后续消息大小。频繁进出会增加 attachment 注入的 token 成本。

**陷阱 3：Teammate Plan Mode 的死锁风险**

如果 team lead 自己也在 Plan Mode 中等待用户审批，而 teammate 发送了 `plan_approval_request` 到 team lead 的 mailbox，team lead 在 Plan Mode 下可能无法处理审批请求。教程没有讨论这种嵌套场景。

**建议**：在 Teammate 场景中提醒这个潜在的协调问题，并说明实际中 team lead 通常不会同时进入 Plan Mode。

---

## s11 — 任务系统：DAG 依赖与进度追踪

### 1. 源码一致性验证

| 教程声明 | 验证结果 | 说明 |
|---------|---------|------|
| `TaskSchema` 在 `src/utils/tasks.ts` | ✅准确 | 第 76 行 `export const TaskSchema = lazySchema(...)` |
| `getTaskListId` | ✅准确 | 第 199 行，包含 5 级优先级解析 |
| `TaskCreateTool.ts` 在 `src/tools/TaskCreateTool/` | ✅准确 | 文件存在 |
| `TaskUpdateTool.ts` 在 `src/tools/TaskUpdateTool/` | ✅准确 | 文件存在 |
| `TaskListTool.ts` 在 `src/tools/TaskListTool/` | ✅准确 | 文件存在 |
| `TaskGetTool.ts` 在 `src/tools/TaskGetTool/` | ✅准确 | 文件存在 |
| `blockTask` 双向链接在 `tasks.ts` | ✅准确 | 第 458 行 |
| `deleteTask` 清理引用 + HWM | ✅准确 | 第 393 行 |
| `claimTask` | ✅准确 | 第 541 行 |
| `claimTaskWithBusyCheck` | ✅准确 | 第 618 行 |
| `unassignTeammateTasks` | ✅准确 | 存在于 tasks.ts 中 |
| `readHighWaterMark` | ✅准确 | 第 114 行 |
| `findHighestTaskId` 同时检查文件和 HWM | ✅准确 | 第 271 行，使用 `Promise.all([findHighestTaskIdFromFiles, readHighWaterMark])` |
| 验证提醒在 TaskUpdateTool.ts:329-349 | ❌不一致 | 实际从第 326 行开始（注释块），逻辑代码在 333-349 行。教程标注 329 漏了开头注释 |
| `proper-lockfile` 用于文件锁 | ⚠️间接准确 | 实际导入的是 `./lockfile.js`（第 10 行），是对 `proper-lockfile` 的封装层。教程直接说"使用 `proper-lockfile` 库"不够精确 |
| `metadata._internal` 过滤 | ✅准确 | TaskListTool 逻辑中确认 |
| `isAgentSwarmsEnabled()` + 自动 owner 分配 | ✅准确 | TaskUpdateTool 中确认 |
| Mailbox 通知 `task_assignment` | ✅准确 | TaskUpdateTool 中确认 |
| 四个 prompt 文件存在 | ✅准确 | 全部存在 |
| `createSignal` 用于任务变更通知 | ✅准确（教程未提及） | `tasks.ts` 第 18 行 `const tasksUpdated = createSignal()` |
| `setLeaderTeamName` / `clearLeaderTeamName` | ✅准确（教程未提及） | `tasks.ts` 第 31、43 行，leader 创建/删除 team 时调用 |
| 验证提醒使用 `/verif/i` 正则匹配 | ✅准确 | `TaskUpdateTool.ts` 第 345 行 |
| 验证提醒需要 `VERIFICATION_AGENT` feature flag | ✅准确 | 第 335 行 `feature('VERIFICATION_AGENT')` |

**总结**：22 项验证中 20 项准确（91%），1 项有行号偏差（329→326），1 项间接准确（lockfile 封装层）。

### 2. 技术深度补充

**遗漏 1：`createSignal` 事件驱动 UI 刷新**

`tasks.ts` 第 18 行创建了 `tasksUpdated` 信号（`createSignal()`），当任务被创建、更新或删除时触发 `notifyTasksUpdated()`。这是 Claude Code 任务 UI（spinner、进度条）实时更新的底层机制——事件驱动而非轮询。

**为什么重要**：这解释了为什么 TaskCreate 后 UI 立即更新，以及多 agent 场景下 UI 如何保持同步。

**怎么补充**：在"核心机制"中增加"UI 通知"小节（2-3 句），解释 signal → subscriber → UI refresh 的事件链。

**遗漏 2：`claimTaskWithBusyCheck` 的忙碌检测**

教程提到了 `claimTaskWithBusyCheck` 但没有解释"忙碌检测"的含义。实际上它在领取任务前检查当前 agent 是否已有 `in_progress` 任务——防止贪心 agent 同时领取多个任务导致其他 agent 饥饿。

**为什么重要**：这是 swarm 调度中防止资源饥饿的关键机制，直接影响并发效率。

**怎么补充**：在"原子领取"小节后添加一段说明，解释为什么需要忙碌检查以及其工作原理。

**遗漏 3：环路检测的设计选择**

`blockTask()` 不做环路检测。教程只在练习 1 中提及，但这是一个值得在正文中讨论的设计选择：(1) DAG 规模小使得环路概率低；(2) 模型通过 prompt 被引导正确建立依赖；(3) 如果发生环路，所有涉及的任务永远 blocked，需要人工干预。

**怎么补充**：在"设计决策"中加一段 3-4 句的说明。

**遗漏 4：`lazySchema` 模式**

`TaskSchema` 使用 `lazySchema()` 包装——延迟 zod schema 初始化直到首次使用。这个模式在整个 Claude Code 中广泛使用（EnterPlanModeTool、ExitPlanModeV2Tool 也用），是 CLI 启动性能优化的重要手段。

### 3. 竞品对比洞察

**竞品表可扩展的维度**：

当前对比了 Claude Code / OpenCode SQLite / Aider TodoList，建议增加：

| 特性 | Claude Code | Devin | Copilot Workspace | Codex CLI |
|------|-----------|-------|-------------------|-----------|
| 存储方式 | JSON 文件/任务 | 数据库 | 云端 | 无 |
| 依赖管理 | DAG (blocks/blockedBy) | 有 | 有限 | 无 |
| 多 Agent | 原生（10+ swarm） | 单 Agent | 单 Agent | 单 Agent |
| Git 可追踪 | 是 | 否 | 否 | N/A |
| 用户直接编辑 | 文本编辑器 | Web UI | Web UI | N/A |

**LLM 任务分解研究的关联**

学术界对 LLM 任务分解的研究指出核心问题是**分解粒度**——太粗会遗漏步骤，太细会增加协调开销。Claude Code 的任务系统支持用户手动创建（粗粒度）、agent 自动分解（模型决定粒度）和 swarm 协作分解（多 agent 协商粒度），覆盖了所有三种模式。

**建议**：在设计决策中引用粒度选择的权衡，帮助读者理解何时使用 3 个大任务 vs 30 个小任务。

### 4. 教学法优化

**a) 缺少与 s10 的显式关联**

Plan Mode（s10）输出计划，Tasks（s11）管理执行。但教程没有说明这个衔接——Plan Mode 批准后，agent 如何根据计划创建 Task DAG。

**建议**：在 s11 开头增加 2-3 句过渡段落，说明 Plan → Tasks 的典型工作流。

**b) DAG 示例可增加"步骤演练"**

Mermaid DAG 图展示了静态依赖关系。建议增加一个步骤演练表格，展示每完成一个任务后 DAG 的变化（哪些任务被解锁）。

**c) 练习缺少骨架代码和入门引导**

- 练习 1（环路检测）：假设读者熟悉 DFS 图遍历，建议提供 DFS 模板
- 练习 2（关键路径）：需要补充关键路径算法的提示（拓扑排序 + 最长路径 / CPM）
- 练习 3（Swarm 模拟器）：建议提供事件驱动模拟器的骨架代码，让读者专注于调度策略

**d) 缺少"何时不用任务系统"的指引**

教程讲了任务系统的强大功能，但没有说明简单任务不需要 DAG。建议加一个"适用场景"判断：3+ 步骤且有依赖关系时才创建 DAG，否则用简单的 TodoWrite 即可。

### 5. 实战陷阱与案例

**陷阱 1：文件锁在网络文件系统上的不可靠性**

`lockfile.js` 依赖文件系统原子操作。在 NFS、CIFS 等网络文件系统上，锁可能不可靠。如果团队通过共享存储运行多个 Claude Code 实例，可能遇到竞态条件。

**案例**：两个 CI agent 通过 NFS 共享 `.claude/tasks/` 目录，同时 `claimTask`，由于 stale lock 导致同一任务被重复领取。

**陷阱 2：High Water Mark 与手动编辑的冲突**

教程强调任务文件的可读性和直接编辑优势，但手动删除任务文件而不更新 `.highwatermark` 可能导致 ID 重用。`findHighestTaskId` 通过同时读取文件和 HWM 来缓解，但在并发场景下仍有窗口期。

**建议**：在"设计决策"中补充"虽然任务文件可手动查看，但修改/删除应通过 TaskUpdate 工具"。

**陷阱 3：大规模 DAG 的 `listTasks` 性能**

教程提到"任务数量通常很小（几十个量级）"，但长期运行的 swarm（如 CI 场景）任务数可能增长到数百。每次 `listTasks` 需要 `readdir + N x readFile`，N=500 时可能产生明显延迟。

**建议**：补充归档策略——将已完成任务移动到 `archived/` 子目录以控制活跃文件数。

**陷阱 4：Agent 崩溃时的任务回收**

`unassignTeammateTasks()` 在 agent 正常退出时执行。但 agent 崩溃（如 OOM kill）时，其拥有的 `in_progress` 任务不会被自动回收，需要 team lead 或其他 agent 发现并重新分配。

**建议**：讨论心跳机制或超时回收策略，虽然 Claude Code 当前未实现，但对生产部署有指导意义。

---

## 跨课程改进建议

### 1. 三课递进关系显式化

Skills（知道什么能力可用）→ Plan Mode（规划怎么做）→ Tasks（管理做什么）构成了从知识到规划到执行的链路。建议在 s11 结尾增加一个"三课总览"图。三课的"变化表"只与上一课比较，缺少全局视角。

### 2. Context Engineering 策略锚点

三课分别实现了 Context Engineering 的不同策略：
- s09 Skills = **Select**（选择放入什么知识）
- s10 Plan Mode = **Route**（路由到不同执行模式）
- s11 Tasks = **Write**（状态外化到文件系统）

建议在每课的 Key Takeaways 中明确标注本课对应的策略，帮助读者形成统一的理论框架。

### 3. 安全主题串联

s09 有 ToxicSkills 供应链攻击，s10 有 channels 限制和权限约束，s11 有文件锁并发安全。建议在 s11 末尾增加一个"安全回顾"汇总三课的安全设计边界。

### 4. 伪代码风格统一

s09 用 `dataclass + async def`，s10 用 `dataclass + 同步方法`，s11 用 `dataclass + threading.Lock`。建议统一为异步风格——三个系统在 Claude Code 中都是异步的。

### 5. 练习难度模板化

建议每课练习遵循统一模式：
1. **基础练习**：实现核心数据结构（~30 行），附 3-5 个 assert 测试
2. **进阶练习**：实现关键算法（~60 行），附预期输出
3. **挑战练习**：模拟生产场景，提供骨架代码让读者填充关键逻辑

---

## 参考文献

### 源码文件

1. `src/skills/loadSkillsDir.ts` — Skills 加载、去重、动态发现、条件激活主逻辑（1086 行）
2. `src/skills/bundledSkills.ts` — 内置 Skill 注册（`registerBundledSkill`）、文件解压（`extractBundledSkillFiles`）
3. `src/skills/bundled/` — 17 个内置 Skill 实现文件
4. `src/skills/mcpSkillBuilders.ts` — MCP Skill 桥接，避免循环依赖
5. `src/tools/EnterPlanModeTool/EnterPlanModeTool.ts` — Plan Mode 进入，状态切换
6. `src/tools/EnterPlanModeTool/prompt.ts` — ant/external 用户区分的 prompt（第 101/16/166 行）
7. `src/tools/ExitPlanModeTool/ExitPlanModeV2Tool.ts` — Plan Mode 退出、审批循环、allowedPrompts（第 64 行）
8. `src/utils/plans.ts` — 计划文件管理、word slug 生成（`generateWordSlug`）
9. `src/utils/planModeV2.ts` — Interview Phase 实验（第 50 行）、PewterLedger 变量（第 88 行）
10. `src/utils/permissions/permissionSetup.ts` — `prepareContextForPlanMode`（第 1462 行）
11. `src/bootstrap/state.ts` — `handlePlanModeTransition`（第 1349 行）
12. `src/utils/tasks.ts` — 任务 CRUD、DAG 依赖（`blockTask` 第 458 行）、HWM（第 114 行）、信号（第 18 行）
13. `src/tools/TaskCreateTool/TaskCreateTool.ts` — 任务创建
14. `src/tools/TaskUpdateTool/TaskUpdateTool.ts` — 任务更新 + 验证提醒（第 326-349 行）
15. `src/tools/TaskListTool/TaskListTool.ts` — 任务列表 + 已完成依赖过滤
16. `src/tools/TaskGetTool/TaskGetTool.ts` — 任务详情
17. `src/services/compact/compact.ts` — `createSkillAttachmentIfNeeded`（第 1494 行），POST_COMPACT 常量（第 129-130 行）

### 外部参考

18. LangGraph. "Plan-and-Execute Agent Tutorial." — Plan-and-Execute 架构模式参考实现。https://langchain-ai.github.io/langgraph/tutorials/plan-and-execute/plan-and-execute/
19. Anthropic. "Building Effective Agents." — Agent 设计模式，包括 routing 和 orchestrator-workers。https://docs.anthropic.com/en/docs/build-with-claude/agent-patterns
20. Aider. "Architect Mode." — 双模型（Architect/Coder）管道设计。https://aider.chat/docs/usage/modes.html
21. Snyk. "ToxicSkills: Agent Skills Supply Chain Compromise." — 335 个恶意 Skills 影响 300K+ 用户的供应链攻击研究
22. OpenAI. "Codex CLI." — 竞品 CLI agent，沙箱执行模型。https://github.com/openai/codex
23. Devin (Cognition). — AI 软件工程 agent，Kanban 式任务管理
24. GitHub Copilot Workspace. — UI 驱动的任务拆解和规划
25. proper-lockfile (npm). — 文件锁库。https://www.npmjs.com/package/proper-lockfile
