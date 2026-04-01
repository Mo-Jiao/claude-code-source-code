# 第一轮调研：Claude Code 教程改进研究

**日期:** 2026-04-01
**方法:** 18 路 Tavily 并行搜索，3 个子 Agent（不同角色）
**来源数:** 40+
**完整报告:** ~/Documents/Claude_Code_Tutorial_Improvement_Research_20260401/research_report_20260401_claude_code_tutorial.md

## 核心发现

### 1. Harness Engineering 已成行业共识
- Anthropic 官方发布了两篇 harness 设计博客 + 《2026 Agentic Coding Trends Report》
- Agent 核心循环不到 30 行（sketch.dev 验证），99%+ 代码是 Harness
- Aaron Levie (Box CEO): "Agent harness engineering 是当前时代的力量倍增器"

### 2. Context Engineering 取代 Prompt Engineering
- LangChain 四策略: Write / Select / Compress / Isolate
- Simon Willison、Karpathy 等意见领袖推动术语演变
- Karpathy 类比: LLM 是 CPU，上下文窗口是 RAM

### 3. 安全威胁
- **ToxicSkills** (Snyk): Skill 供应链攻击，恶意 SKILL.md 中嵌入 prompt injection
- **Memory Poisoning**: 跨会话记忆投毒，恶意指令在后续会话持续生效
- **Nested Skill Injection**: 多层 skill 嵌套导致的注入放大

### 4. 协议生态
- **MCP** (Model Context Protocol): Agent → 工具（垂直集成）
- **A2A** (Agent-to-Agent Protocol): Agent → Agent（水平协作）
- 两者互补，非竞争关系

## 产出的 22 条改进建议（按优先级）

### P0（已实施）
- ✅ 新增 s00 导论课，建立 Harness Engineering 框架
- ✅ 新增术语表（30+ 词条）
- ✅ 16 课加 Key Takeaways + 推荐阅读
- ✅ 安全警告（Memory Poisoning / ToxicSkills / MCP vs A2A）

### P1（已实施）
- ✅ 两张 Excalidraw 架构配图（harness-overview + context-engineering）
- ✅ 首页/学习路径重写
- ✅ Context Engineering 四策略映射到 16 课

### P2（部分实施）
- ✅ 5 张课程级架构图（s01/s02/s04/s07/s13）
- ✅ 长伪代码折叠（15 课）
- ✅ 核心洞察单句 + 阅读时间（16 课）
- ⬜ 每课加"学习目标"+"本课小结"
- ⬜ 源码反向索引（文件→课程）

### P3（未实施）
- ⬜ 每课失败模式分析
- ⬜ 可运行 demo 项目
- ⬜ 性能基准数据
