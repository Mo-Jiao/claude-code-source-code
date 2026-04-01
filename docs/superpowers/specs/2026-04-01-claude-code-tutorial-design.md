# Claude Code 源码解读教程 — 设计文档

**日期**: 2026-04-01
**作者**: 鱼哥 + Claude
**状态**: Draft

## 概述

基于 Claude Code v2.1.88 泄露源码，制作一个循序渐进的源码解读教程。参考 [learn.shareai.run](https://learn.shareai.run/zh/) 的"每次只加一个机制"教学法，但增强为：

- **真实架构映射**：每课对应源码中的真实模块
- **Python 伪代码**：用 Python 重写核心逻辑，降低 TypeScript 门槛
- **设计决策分析**：不仅讲"怎么做"，更讲"为什么这样做"

## 目标读者

Agent 开发者：有编程基础，想理解 Claude Code 架构原理并用于自己的 agent 开发。

## 输出形式

VitePress 静态站点，中文为主（代码/术语保留英文）。

## 每课模板

每一课遵循统一结构：

```
# sXX — 课程标题

> 一句话英文 motto

## 问题
这一课要解决什么问题？

## 架构图
ASCII 或 Mermaid 图解核心数据流

## 核心机制
原理讲解 + 源码路径标注

## Python 伪代码
可运行的 Python 参考实现（精简版）

## 源码映射
| 概念 | 真实源码路径 | 说明 |
|------|-------------|------|

## 设计决策
为什么 Claude Code 这样设计？有什么 trade-off？

## 变化表
与上一课相比，新增了什么？

## 动手试试
给读者的练习建议
```

---

## 课程大纲

### 第一层：核心引擎 (s01-s03)

#### s01 — Agent 循环：一切的起点
> "One loop is all you need"

**问题**: 一个 AI 编程助手的核心运转机制是什么？

**内容**:
- 入口调用链：`cli.tsx` → `main.tsx` → `QueryEngine.ts`
- 核心循环：`while(stop_reason !== 'end_turn')` 的消息-工具循环
- 双运行模式：
  - REPL 模式（Ink TUI 驱动，面向人类交互）
  - SDK 模式（纯 JSON 流，面向程序集成）
- 启动优化：`main.tsx` 中配置/密钥与模块加载并行执行
- 消息列表的累积：每轮 tool_result 追加到 messages

**Python 伪代码要点**:
```python
def agent_loop(prompt: str) -> str:
    messages = [{"role": "user", "content": prompt}]
    while True:
        response = call_llm(messages)
        if response.stop_reason == "end_turn":
            return response.content
        # 执行工具调用
        for tool_call in response.tool_calls:
            result = execute_tool(tool_call)
            messages.append(tool_result(result))
```

**源码映射**:
| 概念 | 源码路径 | 说明 |
|------|---------|------|
| CLI 入口 | `src/entrypoints/cli.tsx` | 快速路径优化（--version） |
| 主函数 | `src/main.tsx` | 4683 LOC，参数解析+启动 |
| 查询引擎 | `src/QueryEngine.ts` | 核心消息循环 |
| 查询执行 | `src/query.ts` | 消息处理+附件+auto-memory |

**设计决策**:
- 为什么用 React（Ink）做 CLI？流式输出+多工具并发下的状态管理用声明式 UI 最合理
- 为什么分 REPL/SDK 两种模式？便于嵌入 IDE（类 Cursor）和 CI/CD 流程

---

#### s02 — 工具系统：注册、分发与执行
> "Tools are the hands of the agent"

**问题**: 40+ 工具如何注册、分发、执行？工具多了怎么省 token？

**内容**:
- Tool 接口设计：
  - `name` + `description`（给 LLM 看）
  - `checkPermissions()` — 执行前权限校验
  - `validateInput()` — 参数验证
  - `isConcurrencySafe()` — 是否支持并发执行
  - `call()` — 实际执行逻辑
- 工厂模式注册：所有工具注册到统一 registry
- Dispatch map 分发：`{tool_name: handler}` 字典映射
- ToolSearch 延迟加载：
  - 非核心工具标记 `defer_loading: true`
  - 超阈值时隐藏工具描述，按需通过 ToolSearch 查找
  - 核心优化：省下大量 system prompt token
- 工具分类：文件操作 / Shell / Agent / Task / Web / MCP

**Python 伪代码要点**:
```python
class Tool:
    name: str
    description: str
    defer_loading: bool = False

    def check_permissions(self, input) -> bool: ...
    def validate_input(self, input) -> bool: ...
    def call(self, input) -> str: ...

TOOL_REGISTRY: dict[str, Tool] = {}

def register_tool(tool: Tool):
    TOOL_REGISTRY[tool.name] = tool

def dispatch(tool_name: str, input: dict) -> str:
    tool = TOOL_REGISTRY[tool_name]
    if not tool.check_permissions(input):
        raise PermissionDenied()
    tool.validate_input(input)
    return tool.call(input)
```

**源码映射**:
| 概念 | 源码路径 | 说明 |
|------|---------|------|
| 工具定义 | `src/tools/` | 40+ 工具实现 |
| 命令注册 | `src/commands.ts` | 101 个命令 |
| Bash 工具 | `src/tools/BashTool/` | 含权限校验 |
| 文件工具 | `src/tools/FileReadTool/` 等 | 安全路径校验 |

**设计决策**:
- 为什么用 ToolSearch 而不是全部注入？40+ 工具的描述太长，每次请求浪费几千 token
- 为什么需要 `isConcurrencySafe()`？多工具并发执行时避免竞态（如两个写操作同时修改同一文件）

---

#### s03 — 系统提示词组装：字节级的缓存博弈
> "Every token in the prompt has a price tag"

**问题**: Claude 每次回复前，它"看到"的完整提示词是怎么拼出来的？为什么顺序很重要？

**内容**:
- 分段缓存架构：
  - **静态段**（全局可缓存）：模型身份、安全规则、工具使用指南
  - **`SYSTEM_PROMPT_DYNAMIC_BOUNDARY`** — 硬编码分界线
  - **动态段**（会话级）：CWD、Git 状态、MCP 指令、用户配置
- 前缀匹配优化原理：
  - Anthropic Prompt Cache 采用前缀匹配
  - 静态段必须放最前面，确保跨请求缓存命中
  - 动态段变化不会穿透静态段缓存
- Cache breakpoint 策略：
  - 在关键位置设置 cache_control 标记
  - 防止微小变化（如 CWD 改变）导致全量缓存失效
- CLAUDE.md 注入：
  - 用户级 `~/.claude/CLAUDE.md`
  - 项目级 `.claude/CLAUDE.md`
  - 注入到 system prompt 的动态段

**Python 伪代码要点**:
```python
def build_system_prompt(session) -> list[dict]:
    sections = []

    # 静态段 — 跨请求可缓存
    sections.append({
        "text": IDENTITY + SAFETY_RULES + TOOL_GUIDE,
        "cache_control": {"type": "ephemeral"}
    })

    # 动态分界线
    sections.append({"text": "SYSTEM_PROMPT_DYNAMIC_BOUNDARY"})

    # 动态段 — 每次可能变化
    sections.append({
        "text": f"CWD: {session.cwd}\n"
                f"Git: {session.git_status}\n"
                f"CLAUDE.md: {load_claude_md()}\n"
                f"MCP: {session.mcp_tools}"
    })

    return sections
```

**源码映射**:
| 概念 | 源码路径 | 说明 |
|------|---------|------|
| 上下文组装 | `src/context.ts` | 系统提示词拼装 |
| 会话初始化 | `src/setup.ts` | CWD/Git/MCP 状态收集 |
| 缓存边界 | `src/services/api/claude.ts` | 3419 LOC，cache breakpoint 策略 |

**设计决策**:
- 为什么不把所有信息都放 system prompt？token 成本 + 缓存命中率的权衡
- 为什么用硬编码分界线而不是动态计算？简单可靠，避免缓存键不稳定
- 行业洞察：当前 AI 应用层开发的核心竞争力之一就是"贪婪且精细地压榨 API 缓存系统的价值"

---

### 第二层：安全与控制 (s04-s06)

#### s04 — 权限系统：5种模式与风险分类
> "Trust, but verify"

**问题**: 如何在自主性和安全性之间找到平衡？

**内容**:
- 5种权限模式：
  - `default` — 每次工具调用都需要用户确认
  - `acceptEdits` — 文件编辑自动通过，其他仍需确认
  - `plan` — 只读模式，禁止写操作
  - `bypassPermissions` — 全部自动通过（危险）
  - `dontAsk` — 合理操作自动通过，危险操作仍拦截
- Bash 命令分类器（`bashClassifier.ts`）：
  - 解析命令 → 匹配模式库 → 分类为 safe/risky/dangerous
  - 危险模式：`rm -rf`, `git push --force`, `DROP TABLE` 等
- 权限规则匹配：allow/deny/ask 规则链
- 否决追踪（`denialTracking.ts`）：避免重复请求已被拒绝的操作

**Python 伪代码要点**:
```python
class PermissionMode(Enum):
    DEFAULT = "default"
    ACCEPT_EDITS = "acceptEdits"
    PLAN = "plan"
    BYPASS = "bypassPermissions"
    DONT_ASK = "dontAsk"

DANGEROUS_PATTERNS = [
    r"rm\s+-rf", r"git\s+push\s+--force",
    r"DROP\s+TABLE", r"DELETE\s+FROM",
]

def classify_bash(command: str) -> str:
    for pattern in DANGEROUS_PATTERNS:
        if re.search(pattern, command):
            return "dangerous"
    return "safe"

def check_permission(mode: PermissionMode, tool: str, input: dict) -> bool:
    if mode == PermissionMode.BYPASS:
        return True
    if mode == PermissionMode.PLAN and tool in WRITE_TOOLS:
        return False
    if tool == "bash":
        risk = classify_bash(input["command"])
        if risk == "dangerous":
            return ask_user(f"Allow dangerous command: {input['command']}?")
    return mode != PermissionMode.DEFAULT or ask_user(f"Allow {tool}?")
```

**源码映射**:
| 概念 | 源码路径 | 说明 |
|------|---------|------|
| 权限模式 | `src/utils/permissions/PermissionMode.ts` | 5种模式定义 |
| 权限引擎 | `src/utils/permissions/permissions.ts` | 规则评估逻辑 |
| Bash 分类器 | `src/utils/permissions/bashClassifier.ts` | 命令风险分级 |
| 危险模式库 | `src/utils/permissions/dangerousPatterns.ts` | 危险命令匹配 |
| 否决追踪 | `src/utils/permissions/denialTracking.ts` | 避免重复请求 |

---

#### s05 — Hooks：用户可编程的自动化钩子
> "Don't just react, automate"

**问题**: 如何让用户在 agent 的工作流中注入自定义逻辑？

**内容**:
- 7种钩子类型：
  - `SessionStart` — 会话启动时
  - `CwdChanged` — 工作目录切换时
  - `FileChanged` — 文件变化时
  - `BeforeToolUse` / `AfterToolUse` — 工具调用前后
  - `QueryStart` / `QueryEnd` — LLM 请求前后
- 执行机制：
  - 钩子定义在 `settings.json`
  - 以子进程方式执行 shell 命令
  - JSON I/O：接收上下文，返回指令（环境变量、continue/abort）
- 实战场景：
  - `AfterToolUse(FileWriteTool)` → 自动执行 `eslint --fix`
  - `BeforeToolUse(BashTool)` → 安全审计
  - `SessionStart` → 注入团队规范

**Python 伪代码要点**:
```python
@dataclass
class Hook:
    event: str       # "BeforeToolUse", "AfterToolUse", etc.
    tool: str | None # 可选，过滤特定工具
    command: str     # shell 命令

class HookRegistry:
    hooks: dict[str, list[Hook]] = {}

    def register(self, hook: Hook):
        self.hooks.setdefault(hook.event, []).append(hook)

    def fire(self, event: str, context: dict) -> list[dict]:
        results = []
        for hook in self.hooks.get(event, []):
            result = subprocess.run(
                hook.command, input=json.dumps(context),
                capture_output=True, text=True
            )
            results.append(json.loads(result.stdout))
        return results
```

**源码映射**:
| 概念 | 源码路径 | 说明 |
|------|---------|------|
| 钩子执行 | `src/utils/hooks/` | 27 个文件 |
| 类型定义 | `src/types/hooks.ts` | 7种钩子类型 |
| Agent 钩子 | `src/utils/hooks/execAgentHook.ts` | 子进程执行 |
| 注册表 | `src/utils/hooks/AsyncHookRegistry.ts` | 异步注册 |
| 配置管理 | `src/utils/hooks/hooksConfigManager.ts` | settings.json 解析 |

---

#### s06 — 设置层级：从全局到策略的配置链
> "Configuration is a contract between user and system"

**问题**: 多层配置如何合并？企业策略如何覆盖个人设置？

**内容**:
- 5层配置链（按优先级从低到高）：
  1. **全局** `~/.claude/settings.json` — 用户级默认
  2. **项目** `.claude.settings.json` — 项目级配置
  3. **本地** `.claude.local.settings.json` — 个人本地覆盖（不提交 git）
  4. **环境变量** `CLAUDE_CODE_*` — CI/CD 场景
  5. **远程策略** — 企业管控，强制锁定某些选项
- 合并策略：后者覆盖前者，但策略层可标记 `locked: true` 禁止被覆盖
- 配置内容：模型选择、权限模式、hooks、MCP 服务器、effort level 等

**Python 伪代码要点**:
```python
def load_settings() -> dict:
    settings = {}
    layers = [
        load_json("~/.claude/settings.json"),       # 全局
        load_json(".claude.settings.json"),           # 项目
        load_json(".claude.local.settings.json"),     # 本地
        load_env("CLAUDE_CODE_"),                     # 环境变量
        fetch_remote_policy(),                        # 远程策略
    ]
    for layer in layers:
        for key, value in layer.items():
            if settings.get(f"{key}__locked"):
                continue  # 策略锁定，跳过覆盖
            settings[key] = value
    return settings
```

**源码映射**:
| 概念 | 源码路径 | 说明 |
|------|---------|------|
| 设置加载 | `src/utils/settings/settings.ts` | 多层合并 |

---

### 第三层：智能与记忆 (s07-s09)

#### s07 — 上下文压缩：无限对话的秘密
> "Forget wisely, remember what matters"

**问题**: 对话越来越长，上下文窗口装不下了怎么办？

**内容**:
- 三层压缩策略：
  - **Layer 1 — 微压缩**：每轮自动将 3 轮前的 tool_result 替换为占位符
  - **Layer 2 — 自动压缩**：token 超 50k 阈值时，LLM 自动摘要全部对话
  - **Layer 3 — 手动压缩**：agent 主动调用 `compact` 工具
- 转录持久化：压缩前保存完整记录到 `.transcripts/`
- 信息永远不会真正丢失：磁盘上有完整历史

**Python 伪代码要点**:
```python
class CompactionEngine:
    def micro_compact(self, messages: list, current_turn: int) -> list:
        """Layer 1: 替换旧 tool_result"""
        for msg in messages:
            if msg.get("turn", 0) < current_turn - 3 and msg["role"] == "tool":
                msg["content"] = f"[Result from {msg['tool_name']} — compacted]"
        return messages

    def auto_compact(self, messages: list) -> list:
        """Layer 2: LLM 摘要"""
        if count_tokens(messages) < 50_000:
            return messages
        # 保存完整转录到磁盘
        save_transcript(messages)
        summary = call_llm_summarize(messages)
        return [{"role": "system", "content": f"[Previous conversation summary]\n{summary}"}]

    def manual_compact(self, messages: list) -> list:
        """Layer 3: 显式调用"""
        save_transcript(messages)
        summary = call_llm_summarize(messages)
        return [{"role": "system", "content": summary}]
```

**源码映射**:
| 概念 | 源码路径 | 说明 |
|------|---------|------|
| 压缩服务 | `src/services/compact/` | 三层压缩策略 |

---

#### s08 — Memory 系统：CLAUDE.md 与自动记忆
> "An agent without memory starts every conversation as a stranger"

**问题**: 如何让 agent 跨对话保持记忆？

**内容**:
- CLAUDE.md — 项目知识库：
  - 用户级 `~/.claude/CLAUDE.md`
  - 项目级 `.claude/CLAUDE.md`
  - 注入到系统提示词的动态段
  - 内容：项目规范、用户偏好、架构约定
- Auto-memory — 自动记忆：
  - 对话中识别有价值的信息
  - 按类型分类存储：user / feedback / project / reference
  - memory 目录：`~/.claude/projects/{project}/memory/`
  - MEMORY.md 索引文件：一行一条，指向具体 memory 文件
- 记忆 vs 其他持久化：
  - 记忆：跨对话有价值的知识
  - 计划：当前任务的实施方案
  - 任务：当前会话的工作进度

**Python 伪代码要点**:
```python
@dataclass
class Memory:
    name: str
    type: str  # user, feedback, project, reference
    description: str
    content: str

class MemorySystem:
    base_dir: Path

    def save(self, memory: Memory):
        path = self.base_dir / f"{memory.type}_{slugify(memory.name)}.md"
        path.write_text(
            f"---\nname: {memory.name}\n"
            f"description: {memory.description}\n"
            f"type: {memory.type}\n---\n\n{memory.content}"
        )
        self._update_index(memory, path)

    def load_all(self) -> list[Memory]:
        return [parse_memory(f) for f in self.base_dir.glob("*.md")
                if f.name != "MEMORY.md"]

    def inject_to_prompt(self) -> str:
        index = (self.base_dir / "MEMORY.md").read_text()
        return f"# Memory\n{index}"
```

**源码映射**:
| 概念 | 源码路径 | 说明 |
|------|---------|------|
| 记忆目录 | `src/memdir/` | 记忆系统实现 |

---

#### s09 — Skills：两层知识注入
> "Know what's available; load how on demand"

**问题**: 如何让 agent 拥有可扩展的领域知识？

**内容**:
- 两层注入策略：
  - **Layer 1 — 名称层**：skill 名称+描述放入 system prompt（便宜，始终可见）
  - **Layer 2 — 内容层**：调用时按需加载完整 SKILL.md（贵，仅在需要时加载）
- Skill 定义：YAML frontmatter + Markdown 正文
  ```yaml
  ---
  name: commit
  description: 创建 git commit
  ---
  # 使用说明...
  ```
- 内置 Skills vs 用户自定义：
  - 内置：`remember`, `loop`, `verify`, `claudeApi`, `debug`
  - 用户：`~/.claude/skills/` 目录
  - MCP 衍生：从 MCP 工具自动生成 skill

**Python 伪代码要点**:
```python
@dataclass
class Skill:
    name: str
    description: str
    content: str  # 完整 SKILL.md 内容

class SkillSystem:
    skills: dict[str, Skill] = {}

    def inject_layer1(self) -> str:
        """放入 system prompt 的轻量级索引"""
        lines = ["Available skills:"]
        for s in self.skills.values():
            lines.append(f"- {s.name}: {s.description}")
        return "\n".join(lines)

    def load_layer2(self, skill_name: str) -> str:
        """按需加载完整内容，作为 tool_result 返回"""
        skill = self.skills[skill_name]
        return skill.content
```

**源码映射**:
| 概念 | 源码路径 | 说明 |
|------|---------|------|
| Skill 加载 | `src/skills/loadSkillsDir.ts` | 目录扫描 |
| 内置 Skills | `src/skills/bundledSkills.ts` | 5个内置 |
| MCP Skills | `src/skills/mcpSkillBuilders.ts` | MCP 衍生 |

---

### 第四层：规划与任务 (s10-s11)

#### s10 — Plan 模式：先想后做
> "Measure twice, cut once"

**问题**: 如何让 agent 在动手之前先对齐方案？

**内容**:
- 状态机：`Normal` → `EnterPlanMode` → `Plan Mode`(只读探索) → `ExitPlanMode`(提交计划) → `Normal`
- Plan 模式下的约束：
  - 可用工具限制：只能 Read/Glob/Grep/WebFetch/WebSearch/Agent
  - 禁止：Edit/Write/Bash（写操作）
  - 可以使用 AskUserQuestion 澄清需求
- 计划审批循环：
  - agent 写计划 → 用户 review → 批准 or 要求修改
  - 可附带 `allowedPrompts` 定义后续操作权限
- 文件持久化：计划写入 `.claude/plans/` 目录

**Python 伪代码要点**:
```python
class PlanMode:
    ALLOWED_TOOLS = {"read_file", "glob", "grep", "web_search", "ask_user"}
    active: bool = False
    plan_content: str = ""

    def enter(self):
        self.active = True

    def check_tool(self, tool_name: str) -> bool:
        if not self.active:
            return True
        return tool_name in self.ALLOWED_TOOLS

    def exit(self, plan: str, allowed_prompts: list[str] = None):
        self.plan_content = plan
        self.active = False
        # 等待用户审批
        return {"plan": plan, "allowed_prompts": allowed_prompts}
```

**源码映射**:
| 概念 | 源码路径 | 说明 |
|------|---------|------|
| 进入计划模式 | `src/tools/EnterPlanModeTool/` | 状态切换 |
| 退出计划模式 | `src/tools/ExitPlanModeTool/` | 计划提交+审批 |

---

#### s11 — 任务系统：DAG 依赖与进度追踪
> "Plan the work, work the plan"

**问题**: 复杂任务如何拆解、追踪依赖、管理进度？

**内容**:
- 文件型 DAG：每个任务一个 JSON 文件，存储在 `.claude/tasks/{team}/`
- 任务结构：
  - `id`, `subject`, `description`, `status`
  - `blockedBy: [taskId]` — 前置依赖
  - `blocks: [taskId]` — 后续任务
  - `owner` — 负责的 agent
- 状态流转：`pending` → `in_progress` → `completed`
- 依赖自动解析：完成任务时自动从下游的 `blockedBy` 中移除
- 三个核心问题：什么能做？什么被阻塞？什么已完成？

**Python 伪代码要点**:
```python
@dataclass
class Task:
    id: str
    subject: str
    description: str
    status: str = "pending"  # pending | in_progress | completed
    blocked_by: list[str] = field(default_factory=list)
    blocks: list[str] = field(default_factory=list)
    owner: str | None = None

class TaskManager:
    tasks_dir: Path

    def create(self, subject: str, description: str) -> Task: ...

    def complete(self, task_id: str):
        task = self.get(task_id)
        task.status = "completed"
        # 自动解除下游阻塞
        for blocked_id in task.blocks:
            blocked = self.get(blocked_id)
            blocked.blocked_by.remove(task_id)
            self.save(blocked)
        self.save(task)

    def available(self) -> list[Task]:
        """返回可执行的任务：pending + 无阻塞"""
        return [t for t in self.all()
                if t.status == "pending" and not t.blocked_by]
```

**源码映射**:
| 概念 | 源码路径 | 说明 |
|------|---------|------|
| 任务创建 | `src/tools/TaskCreateTool/` | 创建+持久化 |
| 任务更新 | `src/tools/TaskUpdateTool/` | 状态+依赖管理 |
| 任务列表 | `src/tools/TaskListTool/` | 查询可用任务 |
| 任务管理 | `src/tasks/` | DAG 引擎 |

---

### 第五层：多 Agent 协作 (s12-s14)

#### s12 — 子 Agent：干净上下文的委派
> "Clean context per subtask"

**问题**: 父 agent 的消息列表越来越长，工具结果堆积怎么办？

**内容**:
- 核心思想：子 agent 拥有独立的 `messages=[]`，执行完只返回摘要
- 父 agent 得到干净的 `tool_result`，子 agent 的完整历史被丢弃
- Agent 类型选择：
  - `Explore` — 只读搜索，无写权限
  - `general-purpose` — 全能 agent
  - `Plan` — 规划型，只能读+分析
  - 自定义 agent — `.claude/agents/` 目录
- 防递归控制：子 agent 可配置是否能再派子 agent
- 隔离模式：`isolation: "worktree"` 给子 agent 独立的 git 工作目录

**Python 伪代码要点**:
```python
def spawn_subagent(prompt: str, agent_type: str = "general") -> str:
    """派发子 agent，返回摘要结果"""
    # 子 agent 拥有独立的消息历史
    child_messages = [{"role": "user", "content": prompt}]

    # 根据类型限制可用工具
    available_tools = get_tools_for_type(agent_type)

    # 运行子 agent 的独立循环
    while True:
        response = call_llm(child_messages, tools=available_tools)
        if response.stop_reason == "end_turn":
            return response.content  # 只返回最终摘要
        for tool_call in response.tool_calls:
            result = execute_tool(tool_call)
            child_messages.append(tool_result(result))
    # child_messages 在这里被丢弃 — 父 agent 永远不会看到
```

**源码映射**:
| 概念 | 源码路径 | 说明 |
|------|---------|------|
| Agent 工具 | `src/tools/AgentTool/` | 子 agent 派发 |
| 进程内 Agent | `src/tasks/InProcessTeammateTask.ts` | 同进程执行 |
| 远程 Agent | `src/tasks/RemoteAgentTask.ts` | 远程执行 |

---

#### s13 — Agent 团队：生命周期与协议
> "A team is more than the sum of its agents"

**问题**: 多个 agent 如何组成团队、分工协作？

**内容**:
- 团队创建：`TeamCreate` → `.claude/teams/{name}/config.json`
- 团队生命周期：
  - Spawn → WORKING → IDLE → SHUTDOWN
  - IDLE 是正常状态（等待新任务），不是错误
- 通信机制：
  - `SendMessage` — agent 间直接通信
  - 消息自动投递，无需轮询
  - 广播：`to: "*"` 给所有成员（慎用）
- 结构化协议：
  - `shutdown_request` / `shutdown_response` — 优雅关闭
  - `plan_approval_request` / `plan_approval_response` — 计划审批
  - 共享 `request_id` 关联请求-响应
- 任务板协作：
  - 共享 `TaskList` — 所有成员可见
  - 认领机制：`TaskUpdate(owner=my_name)` 领取任务
  - 优先 ID 顺序认领（低 ID 优先）

**Python 伪代码要点**:
```python
class Team:
    name: str
    members: list[dict]  # [{name, agent_id, agent_type}]
    task_dir: Path

    def spawn_member(self, name: str, agent_type: str, prompt: str):
        member = start_agent_thread(name, agent_type, prompt)
        self.members.append({"name": name, "agent_id": member.id})

    def send_message(self, to: str, message: str):
        if to == "*":
            for member in self.members:
                deliver(member["name"], message)
        else:
            deliver(to, message)

    def shutdown(self):
        for member in self.members:
            self.send_message(member["name"], {
                "type": "shutdown_request",
                "reason": "All tasks completed"
            })
```

**源码映射**:
| 概念 | 源码路径 | 说明 |
|------|---------|------|
| 团队创建 | `src/tools/TeamCreateTool/` | 配置初始化 |
| 团队删除 | `src/tools/TeamDeleteTool/` | 清理资源 |
| 消息发送 | `src/tools/SendMessageTool/` | agent 间通信 |

---

#### s14 — Worktree：文件隔离与并行开发
> "Tasks manage WHAT, worktrees manage WHERE"

**问题**: 多个 agent 同时修改文件怎么避免冲突？

**内容**:
- Git worktree 基础：同一仓库、不同目录、独立分支
- 创建与管理：
  - `EnterWorktree` → `.claude/worktrees/` 下创建工作目录
  - 自动创建新分支基于 HEAD
  - 工作完成后：keep（保留）或 remove（清理）
- 任务绑定：
  - 控制平面：`.tasks/` 管理目标（WHAT）
  - 执行平面：`.worktrees/` 管理目录（WHERE）
  - 通过 task ID 绑定：`task_1.json` → `auth-refactor/` worktree
- 子 agent 隔离：`isolation: "worktree"` 参数让子 agent 在独立工作树中工作
- 两个状态机：
  - Task：`pending` → `in_progress` → `completed`
  - Worktree：`absent` → `active` → `removed` | `kept`

**Python 伪代码要点**:
```python
class WorktreeManager:
    base_dir: Path  # .claude/worktrees/

    def create(self, name: str) -> Path:
        worktree_path = self.base_dir / name
        branch = f"claude/{name}"
        subprocess.run(["git", "worktree", "add", "-b", branch, str(worktree_path)])
        return worktree_path

    def remove(self, name: str, discard_changes: bool = False):
        worktree_path = self.base_dir / name
        if not discard_changes and has_uncommitted(worktree_path):
            raise Error("Worktree has uncommitted changes")
        subprocess.run(["git", "worktree", "remove", str(worktree_path)])

    def bind_to_task(self, task_id: str, worktree_name: str):
        """绑定任务到工作树"""
        task = load_task(task_id)
        task.metadata["worktree"] = worktree_name
        save_task(task)
```

**源码映射**:
| 概念 | 源码路径 | 说明 |
|------|---------|------|
| 进入工作树 | `src/tools/EnterWorktreeTool/` | 创建+切换 |
| 退出工作树 | `src/tools/ExitWorktreeTool/` | keep/remove |
| 工作树工具 | `src/utils/worktree.ts` | git worktree 封装 |

---

### 第六层：生态与全景 (s15-s16)

#### s15 — MCP 集成：连接外部世界
> "The agent is only as powerful as the tools it can reach"

**问题**: 如何让 agent 连接数据库、API、第三方服务？

**内容**:
- MCP 协议基础：
  - 标准化的工具协议，让 LLM 与外部服务交互
  - 传输方式：stdio（本地进程）/ SSE（远程服务）
- 服务发现：
  - 从 `settings.json` 解析 MCP 服务器配置
  - 官方注册表：`officialRegistry.ts`
  - 支持 stdio, SSE, 自定义传输
- 工具映射：
  - MCP 工具自动注册为 Claude Code 工具
  - 命名规则：`mcp__{server}__{tool}`
  - 工具描述、参数 schema 透传
- 连接管理：
  - `MCPConnectionManager` 维护持久连接
  - 自动重连策略
  - 资源缓存

**Python 伪代码要点**:
```python
class MCPClient:
    servers: dict[str, MCPConnection] = {}

    def connect(self, name: str, config: dict):
        if config["transport"] == "stdio":
            proc = subprocess.Popen(config["command"], stdin=PIPE, stdout=PIPE)
            self.servers[name] = StdioConnection(proc)
        elif config["transport"] == "sse":
            self.servers[name] = SSEConnection(config["url"])

    def list_tools(self, server: str) -> list[dict]:
        return self.servers[server].request("tools/list")

    def call_tool(self, server: str, tool: str, args: dict) -> str:
        return self.servers[server].request("tools/call", {
            "name": tool, "arguments": args
        })

    def register_as_claude_tools(self) -> list[Tool]:
        """将 MCP 工具映射为 Claude Code 工具"""
        tools = []
        for server_name, conn in self.servers.items():
            for mcp_tool in self.list_tools(server_name):
                tools.append(Tool(
                    name=f"mcp__{server_name}__{mcp_tool['name']}",
                    description=mcp_tool["description"],
                    call=lambda args: self.call_tool(server_name, mcp_tool["name"], args)
                ))
        return tools
```

**源码映射**:
| 概念 | 源码路径 | 说明 |
|------|---------|------|
| MCP 客户端 | `src/services/mcp/client.ts` | 服务发现+缓存 |
| 连接管理 | `src/services/mcp/MCPConnectionManager.tsx` | 持久连接 |
| 类型定义 | `src/services/mcp/types.ts` | 连接/资源类型 |
| 配置解析 | `src/services/mcp/config.ts` | settings.json |
| 官方注册表 | `src/services/mcp/officialRegistry.ts` | Anthropic 官方 |

---

#### s16 — 全景架构：从 CLI 启动到完整交互
> "See the forest, then the trees"

**问题**: 所有模块如何协同工作？端到端的完整流程是什么？

**内容**:
- 端到端启动流程：
  ```
  cli.tsx (入口, --version 快速路径)
  → main.tsx (参数解析, 并发预取配置/密钥)
  → setup.ts (会话初始化, worktree, hooks)
  → context.ts (系统提示词组装, 缓存分段)
  → QueryEngine.ts (核心循环启动)
  → REPL.tsx / SDK mode (交互/无头)
  ```
- 单次查询的完整生命流：
  ```
  用户输入
  → HookRegistry.fire("QueryStart")
  → build_system_prompt (静态段 + 动态段)
  → load_skills (Layer 1 名称注入)
  → load_memory (CLAUDE.md + auto-memory)
  → call_llm (流式输出)
  → parse_tool_calls
  → check_permissions (5种模式)
  → HookRegistry.fire("BeforeToolUse")
  → execute_tool
  → HookRegistry.fire("AfterToolUse")
  → micro_compact (旧结果替换)
  → check_auto_compact (token 阈值)
  → append_to_messages
  → loop or end_turn
  → HookRegistry.fire("QueryEnd")
  ```
- 为什么 CLI 用 React（Ink）：
  - 流式输出 + 多工具并发 = 复杂的局部刷新
  - 声明式 UI + Zustand 风格 store = 最佳实践
  - `REPL.tsx`（5005 LOC）的复杂度证明了这个选择
- 架构决策总结：
  - 分段缓存 = 贪婪压榨 API 缓存价值
  - 权限系统 = 自主性与安全性的平衡
  - 多层配置 = 个人/项目/企业的灵活管控
  - 两层 skill = token 成本优化
  - Worktree 隔离 = 多 agent 并发安全

**无 Python 伪代码**（本课为全景综合，用架构图和流程图代替）

**源码映射**:
| 概念 | 源码路径 | 说明 |
|------|---------|------|
| CLI 入口 | `src/entrypoints/cli.tsx` | 启动优化 |
| 主函数 | `src/main.tsx` | 4683 LOC |
| REPL UI | `src/screens/REPL.tsx` | 5005 LOC，Ink TUI |
| 状态管理 | `src/state/AppState.tsx` | React Context + Store |
| 分析遥测 | `src/services/analytics/` | OpenTelemetry + Datadog |

---

## VitePress 站点结构

```
tutorial/
├── .vitepress/
│   └── config.ts            # VitePress 配置
├── index.md                  # 首页
├── guide/
│   ├── index.md              # 学习路径总览
│   ├── s01-agent-loop.md
│   ├── s02-tools.md
│   ├── s03-system-prompt.md
│   ├── s04-permissions.md
│   ├── s05-hooks.md
│   ├── s06-settings.md
│   ├── s07-compact.md
│   ├── s08-memory.md
│   ├── s09-skills.md
│   ├── s10-plan-mode.md
│   ├── s11-tasks.md
│   ├── s12-subagents.md
│   ├── s13-teams.md
│   ├── s14-worktree.md
│   ├── s15-mcp.md
│   └── s16-architecture.md
├── reference/
│   └── source-map.md         # 源码路径索引
└── public/
    └── images/               # 架构图等
```

## 贯穿全教程的隐藏主线：Harness Engineering 优势

教程表面是源码解读，但隐藏主线是回答一个核心问题：**同样的模型，为什么 Claude Code 表现更好？**

通过与 OpenCode（开源竞品）和 Cursor 的工程对比，我们提炼出以下设计思想，将作为"设计决策"板块的核心素材分散在各课中：

### 贯穿性主题

#### 1. "苦涩教训"哲学 — 做减法而不是做加法（s01, s16）
Boris Cherny（Claude Code 创始人）办公室挂着 Rich Sutton 的 "The Bitter Lesson"。核心原则：
- 给模型工具和目标，让它自己想办法，比精心设计工作流效果更好
- 每次新模型发布就删掉一堆代码（4.0 模型发布时删了一半系统提示词）
- 代码库没有超过 6 个月的组件
- 为 6 个月后的模型设计，而不是为当前模型打补丁

**对比**：Cursor 构建复杂的 embedding 索引、投机编辑流水线、验证步骤来优化当前模型能力。Claude Code 信任模型本身。

#### 2. 主动推理 vs 被动检索（s01, s02）
Claude Code 让模型自己决定需要什么信息，然后主动搜索（grep/read/glob）。搜索决策留在模型推理链内。

**对比**：Cursor 的 RAG 系统在模型看到代码之前就预选了上下文。一个真实 bug 案例：前端显示空白是因为后端返回 `data.items` 但前端读 `data.list`。Cursor 锚定在当前文件，一直建议前端修复。Claude Code 跟着数据流走，grep 到后端，找到不匹配，修了正确的文件。

#### 3. Prompt Cache 是第一优先级（s03）
Claude Code 的分段缓存设计是最大的工程差异化：
- 静态段放最前面，跨请求缓存命中
- cache breakpoint 随对话推进自动向前移动
- 第一轮之后，几乎所有 input token 来自缓存
- Plan 模式不切换工具集（否则会打破工具缓存前缀），而是用行为模式实现

**对比**：OpenCode 只有简单的 2-part 系统数组 + 固定缓存策略。Aider 需要显式开启缓存。

#### 4. 最小工具集原则（s02, s09）
Vercel 验证过：删掉 80% 的专用工具，只给 bash + 基础文件操作，准确率从 80% 提升到 100%，token 用量减少 40%，速度快 3.5 倍。

Claude Code 的做法：
- Bash 是"皇冠上的宝石"——整个 Unix 工具链都变成了可用工具
- Skills 用两层注入（名称层便宜，内容层按需），不在系统提示词里堆描述
- ToolSearch 延迟加载非核心工具

**对比**：OpenCode 启动时并发全量初始化所有工具，没有延迟加载机制。

#### 5. 上下文管理的精细度（s07, s12）
Claude Code 的三层压缩比 OpenCode 的两层更渐进：
- 微压缩只替换旧 tool_result（低成本）
- 自动压缩用 LLM 摘要（中成本）
- 手动压缩由 agent 决定（高控制）

子 Agent 隔离是另一个关键：探索型子 agent 在独立上下文中运行，父 agent 的上下文保持干净。

#### 6. 权限系统的分层思想（s04）
Claude Code 用 5 种模式 + bash 启发式分类器，在自主性和安全性之间提供渐进式选择。

**对比**：OpenCode 用 tree-sitter AST 解析 bash 命令提取文件路径（结构化方法），而 Claude Code 用模式匹配（启发式方法）。各有优劣，但 Claude Code 的 5 模式设计提供了更灵活的用户体验。

#### 7. Grep vs 向量搜索（s02 附录）
Claude Code 只用 grep/ripgrep 搜索代码，不用 embedding 或向量数据库。
- 代码信息密度极高（~80 字符/行），好的 regex 比语义搜索更精准
- LLM 擅长写人类不会写的复杂 regex
- 搜索决策留在推理链内，没有黑盒
- Aider 和 Codex 团队独立得出相同结论：treesitter + 模糊搜索 > 向量搜索

### 各课分配

| 主题 | 融入课程 | 对比对象 |
|------|---------|---------|
| 苦涩教训哲学 | s01 引言, s16 总结 | Cursor 的复杂管线 |
| 主动推理 vs 被动检索 | s01 Agent 循环 | Cursor RAG |
| Prompt Cache 分段 | s03 系统提示词 | OpenCode 2-part, Aider 手动 |
| 最小工具集 | s02 工具系统 | Vercel 实验数据 |
| 三层压缩 | s07 上下文压缩 | OpenCode 两层 |
| 权限分层 | s04 权限系统 | OpenCode wildcard+tree-sitter |
| Grep vs 向量搜索 | s02 附录 | Cursor/Milvus |
| 两层 Skill 注入 | s09 Skills | OpenCode 单层 |
| Worktree 隔离 | s14 Worktree | OpenCode session-based |
| 文件型 vs SQLite 持久化 | s11 任务系统 | OpenCode SQLite |

---

## 技术选型

- **VitePress** — 静态站点生成器，Markdown 驱动
- **中文为主** — 代码/术语保留英文
- **Python 伪代码** — 降低 TypeScript 门槛，每课附可理解的参考实现
- **Mermaid 图** — VitePress 内置支持，用于架构图和流程图

## 非目标

- 不是 Claude Code 使用教程（不教怎么用，教怎么建）
- 不覆盖 UI/Ink 渲染细节（s16 简要提及，不深入 React 组件）
- 不覆盖遥测/分析系统（属于运营层，非架构核心）
- 不提供可直接运行的完整 Python agent（伪代码用于理解原理）
