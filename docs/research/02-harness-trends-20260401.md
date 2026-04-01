# 第二轮调研：Harness Engineering 最新趋势

**日期:** 2026-04-01
**方法:** 6 路 Tavily 搜索
**关键词:** harness engineering, context engineering, AI coding agent architecture, production agents, agent loop design

## 一、Harness Engineering 最新趋势

### CPU/RAM/OS/App 分层类比 (Philschmid, 2026)
| 计算机 | AI Agent |
|--------|----------|
| CPU | LLM 模型（计算引擎） |
| RAM | 上下文窗口（工作内存） |
| 操作系统 | Harness（调度一切） |
| 应用程序 | Agent 本身（用户看到的） |

### 核心观点
1. **"Agent 不难，Harness 才难"** — OpenAI 与 Anthropic 工程师共识
2. **Harness vs Framework 区分** — Framework 提供积木，Harness 提供整个运行时
3. **HumanLayer: Harness Engineering 是 Context Engineering 的子集** — 专注于利用 harness 配置点管理上下文
4. **Durability（持久性）新维度** — 静态 benchmark 无法反映 50 步以上长任务的指令遵循衰减

## 二、Context Engineering 进展（超越四策略）

原始四策略：Write / Select / Compress / Isolate

新增模式：
- **Progressive Disclosure（渐进披露）**: 控制什么信息在什么时机加载
- **Routing（路由）**: 将查询导向正确的知识源
- **Evolved Retrieval（进化检索）**: 基于任务阶段动态调整检索策略
- **Tool-as-Context**: 工具调用结果本身就是上下文注入

### 重要警告
- **"Think step by step" 对推理模型反而有害** — 教程 s03 需区分模型类型

## 三、Agent 架构设计共识

1. **Agent Loop 核心极简** — sketch.dev 用 9 行 Python 展示本质
2. **工具设计决定上限** — 从"只给一个 bash"起步，逐步添加专用工具
3. **多 agent 从简单分层开始** — 确定性 chain → 单 agent → 多 agent 协调
4. **生产经验共识**:
   - Agent ≠ Workflow
   - 简单优先
   - 早期 Retrieval > Memory
   - 工具调用可靠性是成败关键
   - 可观测性从第一天建入

## 四、教程建议（按优先级）

### P0
1. s00 补充 CPU/RAM/OS/App 类比 ✅ 已实施
2. 新增"Durability 与长任务可靠性"讨论（s07 或 s16）

### P1
3. 扩展 Context Engineering 至 6 策略（+Progressive Disclosure, Routing）
4. s02 补充"Tool-as-Context"设计模式
5. 新增"9 行到生产级 Agent"演进路径

### P2
6. s16 加横向对比（Claude Code vs Cursor vs Windsurf vs Codex）
7. 增加"生产化 checklist"
8. s03 区分推理模型 vs 非推理模型的 prompt 策略
