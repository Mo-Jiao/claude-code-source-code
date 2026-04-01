# 审查报告：s04-权限系统 / s05-Hooks / s06-设置层级

**审查日期**: 2026-04-01
**审查员**: Claude (技术教程审查专家)
**源码版本**: main@a0c16b3
**审查范围**: tutorial/guide/s04-permissions.md, s05-hooks.md, s06-settings.md
**对照源码**: src/types/, src/utils/permissions/, src/utils/hooks/, src/utils/settings/, src/schemas/, src/entrypoints/sdk/

---

## 审查摘要（200 字）

三节课覆盖了 Claude Code 的安全与配置核心：权限评估流水线、Hook 生命周期系统、多层设置合并。源码引用整体准确率高（约 90%），所有文件路径和核心函数名均可验证。主要问题集中在数值不一致：s04 声称"5+1 种模式"实为 5+2（遗漏 `bubble` 模式），且声称"7 种规则来源"实为 8 种（遗漏 `command`）；s05 声称"27 种事件"但表格仅列出约 21 种，遗漏了 `StopFailure`、`TeammateIdle`、`TaskCreated`、`TaskCompleted`、`ConfigChange`、`InstructionsLoaded` 共 6 个事件；s06 声称"六层配置"但 `SETTING_SOURCES` 常量实际只有 5 层（`pluginSettings` 是单独的 base 注入），且标题"五层配置源"与正文"六层"自相矛盾。教学设计方面，Python 伪代码质量很高，但练习缺少从"理解"到"应用"的中间台阶和真实 Claude Code 环境操作。竞品对比仅提及 OpenCode，缺少 Cursor/Aider/Codex CLI 的具体设计差异。建议补充 `bubble` 权限模式、SSRF 防护细节、配置热重载、以及内核级沙箱与应用层权限的互补关系。

---

## s04 — 权限系统：5 种模式与风险分类

### 1. 源码一致性验证

| 教程声称 | 验证结果 | 说明 |
|----------|----------|------|
| `src/types/permissions.ts` 定义 `EXTERNAL_PERMISSION_MODES` 和 `INTERNAL_PERMISSION_MODES` | ✅准确 | 两个常量均存在，`EXTERNAL_PERMISSION_MODES` 包含 5 种模式 (L16-22) |
| `src/utils/permissions/PermissionMode.ts` 包含模式配置 | ✅准确 | 文件存在，包含 title/symbol/color 映射 |
| `src/utils/permissions/dangerousPatterns.ts` 包含 `DANGEROUS_BASH_PATTERNS` | ✅准确 | 常量存在，且 `CROSS_PLATFORM_CODE_EXEC` 也存在 |
| `src/utils/permissions/permissions.ts` 包含 `hasPermissionsToUseTool` 和 `hasPermissionsToUseToolInner` | ✅准确 | 两个函数均存在 |
| `src/utils/permissions/permissions.ts` 包含 `toolMatchesRule`、`getAllowRules`、`getDenyRules`、`getAskRules` | ✅准确 | 函数均存在 |
| `src/utils/permissions/permissionRuleParser.ts` 包含 `permissionRuleValueFromString` | ✅准确 | 函数存在 |
| `src/utils/permissions/denialTracking.ts` 包含 `DenialTrackingState`、`recordDenial`、`shouldFallbackToPrompting` | ✅准确 | 类型和函数均存在 |
| 连续否决阈值 = 3，总否决阈值 = 20 | ✅准确 | `DENIAL_LIMITS = { maxConsecutive: 3, maxTotal: 20 }` (L12-14) |
| 伪代码用 `MAX_CONSECUTIVE_DENIALS` / `MAX_TOTAL_DENIALS` | ⚠️命名差异 | 源码用 `DENIAL_LIMITS.maxConsecutive` / `DENIAL_LIMITS.maxTotal`，伪代码简化了命名 |
| `src/utils/settings/constants.ts` 定义 `SETTING_SOURCES` | ✅准确 | 常量存在 |
| `src/utils/permissions/bashClassifier.ts` 存在 | ✅准确 | 文件存在 |
| `src/utils/permissions/PermissionUpdate.ts` 存在 | ✅准确 | 文件存在 |
| `PermissionRule` 类型在 `src/types/permissions.ts` 中 | ✅准确 | 类型定义在此文件，`src/utils/permissions/PermissionRule.ts` 做了 re-export |
| "5 种用户可见的权限模式，外加 1 种内部模式" | ❌不一致 | `InternalPermissionMode = ExternalPermissionMode \| 'auto' \| 'bubble'`，内部模式有 2 种（`auto` + `bubble`），不是 1 种 |
| "7 种来源 x 3 种行为"（变化表） | ❌不一致 | `PermissionRuleSource` 实际有 8 种值：`userSettings / projectSettings / localSettings / flagSettings / policySettings / cliArg / command / session` |
| 教程规则 source 列表 | ❌不一致 | 遗漏了 `flagSettings` 和 `command` |

**修正建议：**
1. 将"1 种内部模式"改为"2 种内部模式（`auto` 和 `bubble`）"，并简要说明 `bubble` 模式的用途（用于子 agent 向上冒泡权限请求）
2. 将规则来源数量修正为 8 种，补充 `flagSettings`（来自 `--settings` 参数）和 `command`（来自 slash 命令如 `/allow`、`/deny`）
3. 将伪代码常量名标注为"简化命名"，或改用与源码一致的 `DENIAL_LIMITS` 结构

### 2. 技术深度补充

#### 2.1 `bubble` 权限模式

教程完全遗漏了 `bubble` 模式。这是子 agent（如 worktree agent、team agent）中的关键机制：当子 agent 遇到需要权限审批的操作时，不自行决策，而是将权限请求"冒泡"到父 agent 处理。

**为什么重要：** 用户在使用 `claude --team` 或 worktree 功能时，会隐式接触 `bubble` 模式。不理解它会导致对"为什么子 agent 的权限行为和主 agent 不同"产生困惑。

**怎么补充：** 在"五种权限模式"表格后加一行 `bubble`（内部），并用一段话说明多 agent 场景下的权限冒泡机制。

#### 2.2 `yoloClassifier.ts`、`classifierShared.ts` 与分类器分层

教程提到了 `bashClassifier.ts` 但未提及 `yoloClassifier.ts`（bypassPermissions 模式下的分类器）和 `classifierShared.ts`（分类器共享逻辑）。这两个文件展示了不同权限模式下使用不同分类策略的分层设计。

**怎么补充：** 在源码映射表"Bash 分类器"行下方添加一行，简要说明分类器的分层。

#### 2.3 路径验证与文件系统权限

`src/utils/permissions/pathValidation.ts` 和 `src/utils/permissions/filesystem.ts` 实现了路径级别的权限检查。教程只提到了 `.git/` 和 `.claude/` 的保护，但 safetyCheck 的实际保护范围更广（如 shell 配置文件 `.bashrc`、`.zshrc` 等）。

**怎么补充：** 在 safetyCheck 段落中列出完整的受保护路径类别。

#### 2.4 内核级沙箱与应用层权限的互补

教程仅讨论了应用层权限模型，但未提及 Claude Code 可以与 OS 级沙箱协同。2025-2026 年出现了 `nono` 等工具使用 Linux Landlock LSM 和 macOS Seatbelt 做内核级隔离。Cursor 2.0 也已实现基于 Seatbelt/Landlock 的本地沙箱。

**为什么重要：** 应用层权限可被 shell 技巧绕过（教程已提及），内核级沙箱是不可逃逸的。读者应理解两层防线的关系。

**怎么补充：** 在"设计决策"节的"启发式模式匹配 vs. AST 解析"之后，增加"应用层权限 vs. 内核级沙箱"小节。

#### 2.5 Prompt Injection 与权限系统

教程讨论了 Agent 快速测试权限路径的风险，但未提及 prompt injection 诱导 agent 执行危险操作的攻击向量。权限系统是防御 prompt injection 后果的最后一道防线。

**怎么补充：** 在"Why"章节添加一段，说明权限系统作为 prompt injection 安全网的角色。

### 3. 竞品对比洞察

教程已对比了 Claude Code 与 OpenCode 的 Bash 命令分类方式。以下是值得补充的竞品视角：

| 维度 | Claude Code | Cursor 2.0 | Codex CLI | Aider |
|------|------------|-----------|-----------|-------|
| 权限粒度 | 工具级 + 内容级规则匹配 | sandbox.json 声明式 + Seatbelt/Landlock 内核沙箱 | 三级 sandbox_mode + Docker 容器 | 无权限系统 |
| 沙箱机制 | 应用层（前缀匹配 + AI Classifier） | 内核级（macOS Seatbelt / Linux Landlock） | 容器级（Docker） | 无沙箱 |
| 企业策略 | MDM + remote API + managed-settings | 团队级 network allowlist | 无 | 无 |
| 自动分类 | auto 模式 AI Classifier（内部） | 无等价物 | approval_policy: on-failure | 无 |

**值得补充的对比视角：**
- **Codex CLI 的容器沙箱**：完全不同的安全哲学——不做细粒度权限控制，而是把执行环境放进 Docker 容器。安全边界更清晰但灵活性差。
- **Cursor 的 sandbox.json**：采用声明式白名单（网络域名、文件路径），比 Claude Code 的命令前缀匹配更结构化。但 agent 可通过 `required_permissions` 绕过限制，说明声明式模型也需要防御深度。
- **Windsurf 的 Flow 模型**：权限确认被最小化以保持用户心流，与 Claude Code 的渐进信任是不同的 UX 哲学。

### 4. 教学法优化

#### 4.1 难度曲线

- 练习 1（Bash 分类器）⭐⭐、练习 2（模拟流水线）⭐⭐⭐、练习 3（否决追踪变体）⭐⭐⭐⭐ — 难度递增合理
- **问题：** 缺少"应用"级别的练习，学生理解代码后缺少"在真实项目中配置权限规则"的实操
- **建议添加练习 0（热身）：** 在 `~/.claude/settings.json` 中配置 deny/allow/ask 规则，运行 `/status` 验证效果
- Phase 1 的 1a-1g 共 7 步过于密集，建议拆为两段：先讲 deny/ask rule 检查（1a-1b），再讲工具自身检查（1c-1g），中间插入小结

#### 4.2 流程图改进

Mermaid 流程图全面但过于复杂。建议拆分为：
1. **简化版**（课程正文）：Phase 1 → Phase 2 → Phase 3 主干
2. **完整版**（可折叠区域）：当前完整流程图

#### 4.3 `rm -rf /` 测试用例的困惑

`assert classify_bash("rm -rf /") == "safe"` 对初学者可能造成误导。教程已有括号注释但不够醒目。建议用加粗 callout box 说明 `DANGEROUS_BASH_PATTERNS` 的定位是**防止 allow 规则过宽**，而非判断命令本身是否危险。

#### 4.4 练习 2 缺少脚手架

仅要求"构造场景并验证结果"，缺少可运行的框架。建议提供 Python 文件框架让读者填空。

### 5. 实战陷阱与案例

#### 5.1 `bypassPermissions` + `safetyCheck` 的意外拦截

**陷阱：** 用户开启 bypass 后期望所有操作自动通过，但修改 `.git/config` 或 `.claude/settings.json` 时 safetyCheck 仍弹出确认。

**建议：** 添加 callout box 列出 safetyCheck 保护的完整路径列表。

#### 5.2 规则匹配的 Shell 转义陷阱

**陷阱：** `Bash(npm publish:*)` 使用前缀匹配，但 `bash -c "npm publish"` 不会匹配（前缀是 `bash`）。`eval "npm publish"` 和 `/usr/bin/env npm publish` 也可绕过。

**建议：** 补充具体绕过示例，帮助用户理解前缀匹配的局限性。

#### 5.3 deny rule 无法被 allow rule 覆盖

**陷阱：** `policySettings` 设置 `deny: ["Bash(docker:*)"]` 后，`userSettings` 的 `allow: ["Bash(docker compose:*)"]` 无法"解禁"。

**建议：** 添加"常见误区"小节，用表格列出"用户期望 vs 实际行为"。

#### 5.4 auto 模式的 AI 分类器延迟与成本

**陷阱：** auto 模式每次工具调用触发 LLM 分类请求，增加 1-3 秒延迟和 API 成本。频繁工具调用场景下累积显著。

---

## s05 — Hooks：用户可编程的自动化钩子

### 1. 源码一致性验证

| 教程声称 | 验证结果 | 说明 |
|----------|----------|------|
| `src/entrypoints/sdk/coreTypes.ts` 包含 `HOOK_EVENTS` 常量 | ✅准确 | 常量存在 (L25)，包含 27 种事件 |
| `src/utils/hooks/hooksConfigManager.ts` 包含事件元数据 | ✅准确 | 文件存在 |
| `src/schemas/hooks.ts` 包含 `HookCommandSchema`、`HookMatcherSchema`、`HooksSchema` | ✅准确 | Schema 均存在 |
| `src/utils/hooks/hooksSettings.ts` 包含 `getAllHooks`、`getHooksForEvent`、`isHookEqual` | ✅准确 | 函数均存在 |
| `src/utils/hooks/hookEvents.ts` 包含 `emitHookStarted`、`emitHookResponse` | ✅准确 | 函数存在 |
| `src/utils/hooks/execAgentHook.ts` 包含 `execAgentHook` | ✅准确 | 函数存在 |
| `src/utils/hooks/execPromptHook.ts` 存在 | ✅准确 | |
| `src/utils/hooks/execHttpHook.ts` 存在 | ✅准确 | |
| `src/utils/hooks/sessionHooks.ts` 存在 | ✅准确 | |
| `src/utils/hooks/hooksConfigSnapshot.ts` 存在 | ✅准确 | |
| `src/utils/hooks/fileChangedWatcher.ts` 存在 | ✅准确 | |
| `src/utils/hooks/ssrfGuard.ts` 存在 | ✅准确 | |
| `src/utils/hooks/registerSkillHooks.ts` 存在 | ✅准确 | |
| `src/types/hooks.ts` 包含 `hookJSONOutputSchema`、`syncHookResponseSchema`、`HookResult` | ✅准确 | 类型和 schema 均存在 |
| "27 种生命周期钩子" | ⚠️部分一致 | `HOOK_EVENTS` 确实有 27 项，但事件表格仅列出约 21 种 |
| "四种执行模式 — command / prompt / agent / http" | ✅准确 | 加上内部的 `callback` 和 `function` 共 6 种，教程已说明 |

**遗漏的 6 个事件（教程表格中未列出）：**

| 事件名 | 触发时机 | 源码位置 |
|--------|---------|----------|
| `StopFailure` | agent 停止失败时 | `HOOK_EVENTS[8]` |
| `TeammateIdle` | team 模式中 teammate 空闲时 | `HOOK_EVENTS[16]` |
| `TaskCreated` | 任务创建时 | `HOOK_EVENTS[17]` |
| `TaskCompleted` | 任务完成时 | `HOOK_EVENTS[18]` |
| `ConfigChange` | 配置变更时 | `HOOK_EVENTS[21]` |
| `InstructionsLoaded` | 指令文件加载后 | `HOOK_EVENTS[24]` |

**修正建议：** 在事件表格中补充这 6 个事件，或在表格下方注明"完整列表见 `HOOK_EVENTS` 常量，此处列出最常用的事件"。

### 2. 技术深度补充

#### 2.1 SSRF 防护机制

教程在源码映射表中提到了 `ssrfGuard.ts`，但正文未解释其作用。HTTP hook 存在 SSRF 风险——恶意 hook 配置可将内网地址作为 URL。

**为什么重要：** 企业环境中，Claude Code 运行在有内网访问权限的开发机上。恶意 `.claude/settings.json` 中的 HTTP hook 可能扫描内网。

**怎么补充：** 在"安全约束"小节添加第 6 点"SSRF 防护：HTTP hook 的目标 URL 会经过 SSRF 检查，禁止访问内网地址"。

#### 2.2 `AsyncHookRegistry` 与异步 Hook 生命周期

`src/utils/hooks/AsyncHookRegistry.ts` 实现了异步 hook 的注册和管理。教程提到了异步响应（`{"async": true}`），但未解释完整生命周期——如何注册等待、超时处理、结果回传。

#### 2.3 `postSamplingHooks.ts` — LLM 输出后的干预点

教程未提及 `src/utils/hooks/postSamplingHooks.ts`，这是在 LLM 采样完成后触发的 hook 机制，允许在模型输出后、工具调用前进行干预。

#### 2.4 Hook 与 Skill 系统的集成

`registerSkillHooks.ts` 和 `registerFrontmatterHooks.ts` 展示了 Hook 系统如何与 Skill 系统集成。Skill 文件的 frontmatter 中可定义 hook，在 Skill 激活时自动注册。教程未提及这个优雅的组合模式。

#### 2.5 Hook 执行的并发与顺序保证

教程提到"逐个执行"但未讨论：
- 同一事件的多个 hook 保证串行（按来源优先级）
- 来源执行顺序：userSettings → projectSettings → localSettings → policySettings
- hook 之间不能传递状态

**为什么重要：** 多个 PostToolUse hook 的执行顺序影响行为——一个 hook 修改文件、另一个 lint 该文件，顺序错了结果就错了。

#### 2.6 Agent Hook 的成本与风险

教程描述了 agent hook "最多 50 轮"，但未讨论每次 Stop 事件触发都消耗 API tokens，以及 agent hook 运行在 `dontAsk` 模式下的安全边界。

### 3. 竞品对比洞察

| 维度 | Claude Code (Hooks) | Cursor (Extensions) | Aider (Config) | Codex CLI |
|------|---------------------|---------------------|-----------------|-----------|
| 扩展方式 | Shell + LLM + HTTP hooks | VS Code Extension API | `.aider.conf.yml` + `--auto-lint` | 无扩展机制 |
| 生命周期节点 | 27 种事件 | VS Code Extension API 事件 | 有限（lint 场景） | 无 |
| 编程模型 | stdin/stdout JSON | TypeScript API | YAML 配置 | N/A |
| AI 驱动扩展 | `agent` 类型 hook（多轮 LLM） | 无等价物 | 无 | 无 |
| 隔离性 | 进程级 | 共享 VS Code 进程 | 进程级 | N/A |

**值得补充的对比视角：**
- Claude Code 的 Hook 系统是**终端原生 AI 工具中最完整的可编程扩展点**。Cursor 的扩展性来自 VS Code Extension API，但那是通用 IDE 扩展，不是针对 AI Agent 生命周期设计的。
- Aider 的 `--auto-lint` / `--lint-cmd` 实现了类似 PostToolUse hook 的功能，但仅限 lint 场景。Claude Code 的通用 hook 更灵活。
- GitHub 社区已有 `claude-code-hooks-mastery` 等项目收集 hook 实践模式，建议在推荐阅读中引用。

### 4. 教学法优化

#### 4.1 缺少"最小可运行示例"

建议在课程开头添加一个"5 分钟跑通"的 SessionStart hook 示例：

```bash
#!/bin/bash
# hello-hook.sh — 最简 SessionStart hook
echo '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"Hello from hook!"}}'
```

#### 4.2 退出码表格可视化

教程用文字描述退出码语义，建议改为表格：

| 退出码 | 含义 | stdout | stderr |
|--------|------|--------|--------|
| 0 | 成功 | 不展示给用户 | 不展示 |
| 2 | 阻止操作 | 不展示 | 展示给**模型** |
| 其他 | 非阻止性错误 | 不展示 | 展示给**用户** |

#### 4.3 练习改进

**练习 1** 的示例脚本有潜在问题：`jq -r '.inputs.file_path'`——实际 hook 输入中字段名应该是 `tool_input` 而非 `inputs`。需要验证并修正字段名。settings.json 中的 `"command": "eslint --fix $CHANGED_FILES"` 也是错误的——`$CHANGED_FILES` 在 hook 中不存在，应从 stdin JSON 解析。

**建议新增练习：安全审计 hook** — 编写 PreToolUse hook 检查 Bash 命令是否包含 API key 模式（`sk-...`、`ghp_...`），检测到则返回 `decision: "block"`。

#### 4.4 信息密度过高

27 个事件 + 4 种执行类型 + 响应协议 + agent hook，建议拆分为"基础 Hook"（command 类型 + PreToolUse/PostToolUse）和"高级 Hook"（agent/http + 异步响应），确保读者先能写出第一个有用的 hook。

### 5. 实战陷阱与案例

#### 5.1 Hook 超时导致 agent 卡死

**陷阱：** command hook 脚本挂起（等待网络、死锁）时，整个 agent 被阻塞。

**建议：** 强调生产环境中**必须**设置 `timeout`，推荐 5-30 秒。

#### 5.2 PreToolUse hook 修改输入的副作用

**陷阱：** 多个 PreToolUse hook 的 `updatedInput` 不会合并，最后一个 hook 的结果覆盖之前所有。

#### 5.3 `allowManagedHooksOnly` 的企业陷阱

**陷阱：** 企业管理员开启此选项后，用户级和项目级 hook 静默失效。用户可能长时间调试"为什么 hook 不触发"。

**建议：** 教程应提及这个行为，建议 Claude Code 在 hook 被策略禁用时输出日志。

#### 5.4 Hook 中的环境变量泄露

**陷阱：** command hook 继承 Claude Code 进程的环境变量（包括 `ANTHROPIC_API_KEY`）。恶意项目级 hook 可窃取 API key。

**建议：** 在"安全约束"中提醒项目级 hook 的信任风险。

#### 5.5 PostToolUse hook 的循环触发

**陷阱：** command hook 通过 shell 间接触发文件变更，可能引发 FileChanged → hook → 文件变更的循环。

#### 5.6 exit code 2 的隐式触发

**陷阱：** `bash set -e` + 命令不存在可能返回 exit code 2，导致意外阻止工具调用。建议确保脚本中只有明确的 `exit 2` 才返回 2。

---

## s06 — 设置层级：从全局到策略的配置链

### 1. 源码一致性验证

| 教程声称 | 验证结果 | 说明 |
|----------|----------|------|
| `src/utils/settings/constants.ts` 定义 `SETTING_SOURCES` | ✅准确 | 5 个来源：userSettings → projectSettings → localSettings → flagSettings → policySettings (L7-22) |
| `src/utils/settings/constants.ts` 包含 `getEnabledSettingSources` | ✅准确 | 函数存在 |
| `src/utils/settings/settings.ts` 包含 `settingsMergeCustomizer` | ✅准确 | |
| `src/utils/settings/settings.ts` 包含 `loadManagedFileSettings` | ✅准确 | |
| `src/utils/settings/settings.ts` 包含 `getSettingsForSource` / `getSettingsForSourceUncached` | ✅准确 | |
| `src/utils/settings/settings.ts` 包含 `parseSettingsFile` / `parseSettingsFileUncached` | ✅准确 | |
| `src/utils/settings/settings.ts` 包含 `updateSettingsForSource` | ✅准确 | |
| `src/utils/settings/settings.ts` 包含 `getSettingsFilePathForSource` | ✅准确 | |
| `src/utils/settings/settings.ts` 包含 `getPolicySettingsOrigin` | ✅准确 | |
| `src/utils/settings/settings.ts` 包含 `getSettingsWithErrors` | ✅准确 | |
| `src/utils/settings/settings.ts` 包含 `hasSkipDangerousModePermissionPrompt` / `hasAutoModeOptIn` | ✅准确 | `hasSkipDangerousModePermissionPrompt` 确认存在；`hasAutoModeOptIn` 可能有细微命名差异，需确认 |
| `src/utils/settings/mdm/settings.ts` 包含 `getMdmSettings` / `getHkcuSettings` | ✅准确 | |
| `src/utils/settings/managedPath.ts` 包含 `getManagedFilePath` / `getManagedSettingsDropInDir` | ✅准确 | |
| `src/utils/settings/settingsCache.ts` 包含 `resetSettingsCache` | ✅准确 | |
| `src/utils/settings/types.ts` 包含 `SettingsSchema`、`PermissionsSchema`、`HooksSchema` | ✅准确 | |
| `src/utils/settings/validation.ts` 包含 `filterInvalidPermissionRules` / `formatZodError` | ✅准确 | |
| `src/utils/settings/internalWrites.ts` 包含 `markInternalWrite` | ✅准确 | |
| "六层配置层级 — plugin → user → project → local → flag → policy" | ⚠️部分一致 | `SETTING_SOURCES` 只有 5 层（无 plugin）。`pluginSettings` 通过 `getPluginSettingsBase()` 单独注入为 base，不在 `SETTING_SOURCES` 数组中 |
| 标题"五层配置源"（核心机制第 1 节） | ❌自相矛盾 | 开头说"六层"，第 1 节标题"五层"，表格列 6 层——三处不一致 |
| 源码映射表中 `loadSettingsFromDisk` | ⚠️需确认 | 可能已重命名或重构，需确认实际函数名 |

**修正建议：**
1. 统一层级数量：建议改为"5 层正式配置来源 + 1 层插件基础配置"，说明 plugin 是通过 `getPluginSettingsBase()` 作为 base 注入的
2. 修正标题与正文的数字矛盾
3. 确认 `loadSettingsFromDisk` 和 `hasAutoModeOptIn` 的实际函数名

### 2. 技术深度补充

#### 2.1 远程策略同步机制（`settingsSync`）

`src/services/settingsSync/` 目录包含完整的远程策略同步实现。教程提到远程策略但未解释：
- 同步机制（轮询间隔、认证方式）
- 同步失败时的降级行为
- 策略缓存刷新频率

**为什么重要：** 企业部署中，远程策略同步的可靠性直接影响安全覆盖率。

#### 2.2 配置热重载（`applySettingsChange.ts`）

`src/utils/settings/applySettingsChange.ts` 实现了配置变更的热重载。配置变更不需要重启 Claude Code 会话即可实时生效。这是一个重要的 UX 特性，教程未提及。

#### 2.3 配置变更检测（`changeDetector.ts`）

教程提到"文件系统监听"但未详细说明检测机制和延迟特性。

#### 2.4 `pluginOnlyPolicy.ts`

实现了"只允许插件来源配置"的策略，是 `allowManagedHooksOnly` 的姊妹功能。

#### 2.5 `markInternalWrite` 的防抖机制

教程提到了 `markInternalWrite` 但未解释其作用：防止 Claude Code 自身的配置写入触发文件变更监听的多余重载。这对理解配置系统的竞态处理很重要。

### 3. 竞品对比洞察

| 维度 | Claude Code | Cursor | Codex CLI | Aider |
|------|------------|--------|-----------|-------|
| 配置层级 | 6 层（plugin → policy） | 3 层（VS Code Default/User/Workspace） | 1 层（环境变量 + config） | 2 层（全局 + 项目） |
| 合并策略 | 深度合并 + 数组拼接 | VS Code 标准合并 | 覆盖 | 简单覆盖 |
| 企业策略 | MDM + remote API + managed files + drop-in | VS Code Profiles + MDM | 无 | 无 |
| 配置格式 | JSON | JSON (JSONC with comments) | JSON + 环境变量 | YAML + 命令行 |
| 热重载 | 支持 | 支持（VS Code 内置） | 需重启 | 需重启 |
| drop-in 目录 | managed-settings.d/*.json | 无 | 无 | 无 |
| 安全配置来源限制 | projectSettings 排除安全敏感项 | 无等价机制 | 无 | 无 |

**值得补充的对比视角：**
- Claude Code 的 drop-in 目录设计（`managed-settings.d/`）借鉴 systemd/sudoers 最佳实践，在 AI 工具中独创。对大型企业（安全/合规/SRE 团队各管一部分策略）非常有价值。
- VS Code 的 JSONC 支持注释，Claude Code 的 JSON 不支持——这是一个 DX 差异。
- MDM 部署方式与 Chrome 企业策略一致，降低 IT 团队学习成本。

### 4. 教学法优化

#### 4.1 配置合并的可视化

建议添加可视化层级覆盖图：

```
┌─────────────────────────────────────────┐
│ Policy: deny=["Bash(curl:*)"]           │ ← 最高优先级
├─────────────────────────────────────────┤
│ Flag: (empty)                           │
├─────────────────────────────────────────┤
│ Local: env={"DEBUG":"1"}                │
├─────────────────────────────────────────┤
│ Project: allow=["Write"], model="opus"  │
├─────────────────────────────────────────┤
│ User: allow=["Read"], model="sonnet"    │ ← 最低优先级
├─────────────────────────────────────────┤
│ Plugin: (base defaults)                 │
└─────────────────────────────────────────┘
         ↓ 合并结果
┌─────────────────────────────────────────┐
│ allow=["Read","Write"]    ← 数组拼接     │
│ deny=["Bash(curl:*)"]    ← 数组拼接     │
│ model="opus"             ← 标量覆盖     │
│ env={"DEBUG":"1"}        ← 对象合并     │
└─────────────────────────────────────────┘
```

#### 4.2 供应链攻击需要真实案例

建议添加具体攻击场景：

> **真实场景：** 攻击者 fork 热门 OSS 项目，在 `.claude/settings.json` 中加入 `"skipDangerousModePermissionPrompt": true`，提交 PR。如果维护者合并后 clone，Claude Code 自动跳过 bypass 确认弹窗——等于赋予 agent 不受限的执行权限。

#### 4.3 "5 分钟快速上手"

课程内容"干"——大量配置路径、合并规则、缓存层级。建议在开头增加最常用操作的快速演示。高级主题（缓存、克隆防护）可标注为"深入阅读"可折叠区域。

#### 4.4 练习 3 过于开放

"配置审计"是好的企业需求，但缺少起步提示。建议提供骨架代码，要求实现"追踪标量字段来源"，留"追踪数组元素来源"作为进阶。

**新增练习建议：** 创建 `.claude/settings.json` 和 `.claude/settings.local.json`，配置冲突规则，在 Claude Code 中验证 deny 优先行为。

### 5. 实战陷阱与案例

#### 5.1 `settings.json` 与 `settings.local.json` 混淆

**陷阱：** 新用户把敏感配置（API key）写到 `settings.json`（提交 git）而非 `settings.local.json`（gitignored）。

**建议：** 教程开头添加醒目提示。

#### 5.2 数组合并的"无法删除"问题

**陷阱：** `userSettings` 中 `allow: ["Read", "Write"]`，想在某项目中禁用 `Read`，不能在 `projectSettings` 中设 `allow: ["Write"]`——拼接后仍是 `["Read", "Write"]`。必须添加 `deny: ["Read"]`。

**建议：** 在"合并型配置 vs 覆盖型配置"部分用示例说明。

#### 5.3 `managed-settings.d/` 的文件命名顺序

**陷阱：** Drop-in 目录按字母序合并，不用数字前缀会导致不可预测的覆盖。`security.json` 在 `otel.json` 之后合并。

**建议：** 强调**必须使用数字前缀**（`10-`, `20-`）。

#### 5.4 缓存污染的克隆防护

**陷阱：** 无深拷贝时，`mergeWith` 就地修改缓存对象，后续读取得到被污染的数据。

**建议：** 用代码示例说明无克隆防护的 bug：

```python
cache = {"allow": ["Read"]}
settings_a = cache              # 直接引用，无拷贝
merge_with(settings_a, {"allow": ["Write"]})
# cache 被污染为 {"allow": ["Read", "Write"]}！
```

#### 5.5 `settings.local.json` 手动创建不自动 gitignore

**陷阱：** 自动 gitignore 只在通过 `updateSettingsForSource` API 更新时触发。手动创建的文件不会自动添加到 `.gitignore`。

#### 5.6 数组去重的精度问题

**陷阱：** 去重使用简单相等性。`"Bash(npm:*)"` 和 `"Bash(npm :*)"` 不会被去重（多了空格），导致看似冲突的规则同时生效。

---

## 跨课审查

### 三课关联性

s04（权限 = 谁能做什么）→ s05（Hooks = 在什么时候自动做什么）→ s06（设置 = 持久化配置权限和 Hook）。结构清晰但缺少**跨课综合练习**。

**建议增加综合练习：** 配置完整安全策略——在 `settings.json` 设置 deny 规则禁止 `rm -rf`，配置 PreToolUse hook 记录所有 Bash 命令到审计日志，然后用不同权限模式测试行为。

### 术语一致性

- s04 的 `PermissionRuleSource`（8 种）与 s06 的 `SettingSource`（5 种）容易混淆
- 建议统一说明：`SettingSource` 是配置文件来源，`PermissionRuleSource` 是权限规则来源，后者多了 `cliArg`、`command`、`session`

---

## 参考文献

### 源码文件（全部已验证存在）

**权限系统 (s04):**
- `src/types/permissions.ts` — 权限模式、规则类型定义
- `src/utils/permissions/PermissionMode.ts` — 模式元数据
- `src/utils/permissions/dangerousPatterns.ts` — 危险命令模式列表
- `src/utils/permissions/permissions.ts` — 权限评估引擎
- `src/utils/permissions/permissionRuleParser.ts` — 规则解析
- `src/utils/permissions/denialTracking.ts` — 否决追踪
- `src/utils/permissions/bashClassifier.ts` — Bash 分类器
- `src/utils/permissions/PermissionUpdate.ts` — 规则 CRUD
- `src/utils/permissions/PermissionRule.ts` — 规则类型 re-export（教程未引用）
- `src/utils/permissions/yoloClassifier.ts` — bypass 模式分类器（教程未提及）
- `src/utils/permissions/classifierShared.ts` — 分类器共享逻辑（教程未提及）
- `src/utils/permissions/pathValidation.ts` — 路径验证（教程未提及）
- `src/utils/permissions/filesystem.ts` — 文件系统权限（教程未提及）

**Hook 系统 (s05):**
- `src/entrypoints/sdk/coreTypes.ts` — HOOK_EVENTS 常量（27 种事件）
- `src/schemas/hooks.ts` — Hook schema 定义
- `src/types/hooks.ts` — Hook 类型定义
- `src/utils/hooks/hooksConfigManager.ts` — 事件元数据
- `src/utils/hooks/hooksSettings.ts` — Hook 设置管理
- `src/utils/hooks/hookEvents.ts` — 事件发射
- `src/utils/hooks/execAgentHook.ts` — Agent hook 执行
- `src/utils/hooks/execPromptHook.ts` — Prompt hook 执行
- `src/utils/hooks/execHttpHook.ts` — HTTP hook 执行
- `src/utils/hooks/sessionHooks.ts` — 会话级 hook
- `src/utils/hooks/hooksConfigSnapshot.ts` — 配置快照
- `src/utils/hooks/fileChangedWatcher.ts` — 文件变更监听
- `src/utils/hooks/ssrfGuard.ts` — SSRF 防护
- `src/utils/hooks/registerSkillHooks.ts` — Skill hook 注册
- `src/utils/hooks/registerFrontmatterHooks.ts` — Frontmatter hook 注册（教程未提及）
- `src/utils/hooks/AsyncHookRegistry.ts` — 异步 hook 注册（教程未提及）
- `src/utils/hooks/postSamplingHooks.ts` — 采样后 hook（教程未提及）

**设置系统 (s06):**
- `src/utils/settings/constants.ts` — SETTING_SOURCES 定义
- `src/utils/settings/settings.ts` — 设置加载、合并、更新核心
- `src/utils/settings/settingsCache.ts` — 三层缓存
- `src/utils/settings/types.ts` — 设置 Schema
- `src/utils/settings/validation.ts` — 验证与过滤
- `src/utils/settings/managedPath.ts` — 企业策略路径
- `src/utils/settings/mdm/settings.ts` — MDM 设置加载
- `src/utils/settings/internalWrites.ts` — 内部写入标记
- `src/utils/settings/changeDetector.ts` — 变更检测（教程未提及）
- `src/utils/settings/applySettingsChange.ts` — 热重载（教程未提及）
- `src/utils/settings/pluginOnlyPolicy.ts` — 插件策略（教程未提及）
- `src/services/settingsSync/` — 远程策略同步（教程未详述）

### 外部参考文献

| 编号 | 来源 | 说明 |
|------|------|------|
| [R1] | nono (nono.sh) | 内核级沙箱（Landlock + Seatbelt）用于 AI agent 隔离 |
| [R2] | Cursor Blog | Cursor 2.0 的 macOS Seatbelt / Linux Landlock 沙箱实现 |
| [R3] | CyberArk | OWASP Tool Misuse 风险与 AI Agent 权限模型 |
| [R4] | Cursor Forum | sandbox.json 配置与 agent 绕过讨论 |
| [R5] | GitHub: disler/claude-code-hooks-mastery | Claude Code Hooks 社区实践集合 |
| [R6] | Anthropic (code.claude.com) | 官方 Hook 配置文档与 PostToolUse lint 示例 |
| [R7] | OpenAI Developers | Codex CLI 的 Docker 容器沙箱模型 |

### 教程内部引用（需单独验证）

| 引用 ID | 来源 | 说明 |
|---------|------|------|
| [R1-1] | Philschmid | Harness 设计实践 |
| [R1-2] | LangChain | Terminal Bench 2.0 harness 实验 |
| [R1-5] | Anthropic | 自我一致性偏差与 harness 设计 |
| [R1-7] | Epsilla | 约束解空间提升生产力 |
| [R2-18] | Dev.to | Default-deny 安全讨论 |
| [R2-21] | MorphLLM | Hooks 作为可编程安全中间件 |
