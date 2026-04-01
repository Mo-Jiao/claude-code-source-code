# 源码路径索引

> Claude Code v2.1.88 源码路径速查，按模块分类

## 入口与启动

| 路径 | 说明 | 相关课程 |
|:-----|:-----|:---------|
| `src/entrypoints/cli.tsx` | CLI 入口，`--version` 快速路径优化 | s01, s16 |
| `src/main.tsx` | 主函数（4683 LOC），参数解析 + 启动 | s01, s16 |
| `src/setup.ts` | 会话初始化，worktree, hooks 注册 | s01, s03 |

## 核心循环

| 路径 | 说明 | 相关课程 |
|:-----|:-----|:---------|
| `src/QueryEngine.ts` | 核心消息循环 | s01 |
| `src/query.ts` | 查询执行，消息处理 + 附件 + auto-memory | s01 |

## 上下文组装

| 路径 | 说明 | 相关课程 |
|:-----|:-----|:---------|
| `src/context.ts` | 系统提示词拼装 | s03 |
| `src/services/api/claude.ts` | API 交互（3419 LOC），cache breakpoint 策略 | s03 |

## 工具系统

| 路径 | 说明 | 相关课程 |
|:-----|:-----|:---------|
| `src/tools/` | 40+ 工具实现目录 | s02 |
| `src/commands.ts` | 101 个命令注册 | s02 |
| `src/tools/BashTool/` | Bash 工具，含权限校验 | s02, s04 |
| `src/tools/FileReadTool/` | 文件读取工具 | s02 |
| `src/tools/FileWriteTool/` | 文件写入工具 | s02 |
| `src/tools/FileEditTool/` | 文件编辑工具 | s02 |
| `src/tools/GlobTool/` | 文件搜索工具 | s02 |
| `src/tools/GrepTool/` | 内容搜索工具 | s02 |

## 权限系统

| 路径 | 说明 | 相关课程 |
|:-----|:-----|:---------|
| `src/utils/permissions/PermissionMode.ts` | 5 种权限模式定义 | s04 |
| `src/utils/permissions/permissions.ts` | 权限评估引擎 | s04 |
| `src/utils/permissions/bashClassifier.ts` | Bash 命令风险分级 | s04 |
| `src/utils/permissions/dangerousPatterns.ts` | 危险命令模式库 | s04 |
| `src/utils/permissions/denialTracking.ts` | 否决追踪 | s04 |
| `src/utils/permissions/permissionSetup.ts` | 权限初始化 | s04 |

## Hooks 系统

| 路径 | 说明 | 相关课程 |
|:-----|:-----|:---------|
| `src/utils/hooks/` | Hooks 系统（27 个文件） | s05 |
| `src/types/hooks.ts` | 7 种钩子类型定义 | s05 |
| `src/utils/hooks/execAgentHook.ts` | 子进程执行钩子 | s05 |
| `src/utils/hooks/AsyncHookRegistry.ts` | 异步钩子注册表 | s05 |
| `src/utils/hooks/hooksConfigManager.ts` | 钩子配置管理 | s05 |

## 设置系统

| 路径 | 说明 | 相关课程 |
|:-----|:-----|:---------|
| `src/utils/settings/settings.ts` | 多层设置加载与合并 | s06 |

## 上下文压缩

| 路径 | 说明 | 相关课程 |
|:-----|:-----|:---------|
| `src/services/compact/` | 三层压缩策略 | s07 |

## 记忆系统

| 路径 | 说明 | 相关课程 |
|:-----|:-----|:---------|
| `src/memdir/` | 记忆系统实现 | s08 |

## Skills 系统

| 路径 | 说明 | 相关课程 |
|:-----|:-----|:---------|
| `src/skills/loadSkillsDir.ts` | Skill 目录扫描加载 | s09 |
| `src/skills/bundledSkills.ts` | 5 个内置 Skill | s09 |
| `src/skills/mcpSkillBuilders.ts` | MCP 衍生 Skill | s09 |

## Plan 模式

| 路径 | 说明 | 相关课程 |
|:-----|:-----|:---------|
| `src/tools/EnterPlanModeTool/` | 进入 Plan 模式 | s10 |
| `src/tools/ExitPlanModeTool/` | 退出 Plan 模式 + 计划审批 | s10 |

## 任务系统

| 路径 | 说明 | 相关课程 |
|:-----|:-----|:---------|
| `src/tasks/` | 任务 DAG 引擎 | s11 |
| `src/tools/TaskCreateTool/` | 任务创建 | s11 |
| `src/tools/TaskUpdateTool/` | 任务更新 + 依赖管理 | s11 |
| `src/tools/TaskListTool/` | 任务列表查询 | s11 |
| `src/tools/TaskGetTool/` | 任务详情获取 | s11 |

## 多 Agent

| 路径 | 说明 | 相关课程 |
|:-----|:-----|:---------|
| `src/tools/AgentTool/` | 子 Agent 派发 | s12 |
| `src/tasks/InProcessTeammateTask.ts` | 进程内 Agent 执行 | s12 |
| `src/tasks/RemoteAgentTask.ts` | 远程 Agent 执行 | s12 |
| `src/tools/TeamCreateTool/` | 团队创建 | s13 |
| `src/tools/TeamDeleteTool/` | 团队删除 | s13 |
| `src/tools/SendMessageTool/` | Agent 间消息通信 | s13 |

## Worktree

| 路径 | 说明 | 相关课程 |
|:-----|:-----|:---------|
| `src/utils/worktree.ts` | Git worktree 封装 | s14 |
| `src/tools/EnterWorktreeTool/` | 创建 + 进入工作树 | s14 |
| `src/tools/ExitWorktreeTool/` | 退出工作树 (keep/remove) | s14 |

## MCP 集成

| 路径 | 说明 | 相关课程 |
|:-----|:-----|:---------|
| `src/services/mcp/client.ts` | MCP 客户端，服务发现 + 缓存 | s15 |
| `src/services/mcp/MCPConnectionManager.tsx` | 持久连接管理 | s15 |
| `src/services/mcp/types.ts` | MCP 连接/资源类型定义 | s15 |
| `src/services/mcp/config.ts` | MCP 配置解析 | s15 |
| `src/services/mcp/officialRegistry.ts` | Anthropic 官方注册表 | s15 |

## UI 与状态

| 路径 | 说明 | 相关课程 |
|:-----|:-----|:---------|
| `src/screens/REPL.tsx` | 终端 UI（5005 LOC），Ink TUI | s16 |
| `src/state/AppState.tsx` | React Context + Zustand 风格状态 | s16 |
| `src/services/analytics/` | OpenTelemetry + Datadog 遥测 | s16 |
