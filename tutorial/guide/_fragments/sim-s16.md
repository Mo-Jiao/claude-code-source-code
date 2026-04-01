<div class="simulator-container">
<h4>架构全景</h4>
<p class="sim-description">Claude Code 从启动到完成一次查询的完整生命周期：引导链、系统 Prompt 组装、API 调用</p>
<div class="sim-step sim-user_message">
  <div class="sim-step-header">👤 用户消息</div>
  <div class="sim-step-content">用户在终端输入: claude "解释这个项目的架构"</div>
  <div class="sim-step-annotation">这是 Claude Code 的入口点。一条简单的命令触发完整的引导链</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">Bootstrap 序列启动:<br>1. 解析 CLI 参数（query, flags, model）<br>2. 加载配置: ~/.claude/settings.json<br>3. 检测项目根目录（git root）<br>4. 加载权限配置: allowedTools, blockedTools</div>
  <div class="sim-step-annotation">引导链第一阶段：环境感知。从 CLI 参数、用户配置、项目配置三层收集信息</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">并行预取（Parallel Prefetch）:<br>同时启动以下操作，不阻塞主流程:<br>- Git 状态: branch, recent commits, dirty files<br>- CLAUDE.md 加载: 全局 → 项目 → 本地<br>- MCP 服务器连接: 启动已配置的 MCP 进程<br>- 模型预热: 建立 API 连接</div>
  <div class="sim-step-annotation">并行预取是关键性能优化：4 个独立 I/O 操作同时执行，将冷启动时间从串行的 ~2s 压缩到 ~500ms</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">System Prompt 组装:<br>┌─ 基础指令（角色、安全规则）<br>├─ 工具定义（内置 + MCP 工具 schema）<br>├─ 环境信息（OS, shell, CWD, git status）<br>├─ CLAUDE.md 内容（三层合并）<br>└─ System Reminder（权限、可用 Skills）<br><br>总 token 数: ~4,200</div>
  <div class="sim-step-annotation">System Prompt 分为静态段和动态段。静态段命中 prompt 缓存，动态段按需注入。分段设计直接影响 API 成本</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">Fast-Path 检测:<br>- 输入: "解释这个项目的架构"<br>- 检查: 是否为 bash 单命令？→ 否<br>- 检查: 是否命中快捷路由？→ 否<br>- 结果: 走标准 Agent 循环</div>
  <div class="sim-step-annotation">Fast-Path 为简单命令提供捷径（如 'claude "ls"' 直接执行）。复杂查询走标准循环，保证完整的推理能力</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">API 调用构建:<br>{<br>  model: "claude-sonnet-4-20250514",<br>  max_tokens: 16384,<br>  system: [系统 prompt 段落...],<br>  messages: [{role: "user", content: "解释这个项目的架构"}],<br>  tools: [Read, Glob, Grep, Bash, Edit, ...],<br>  stream: true<br>}</div>
  <div class="sim-step-annotation">请求以流式模式发送。工具定义包含完整的 JSON Schema，模型据此生成合法的工具调用参数</div>
</div>
<div class="sim-step sim-tool_call">
  <div class="sim-step-header">🔧 Tool Call · Glob</div>
  <div class="sim-step-content">Agent 首次推理决定先了解项目结构:<br>Glob: **/*.{ts,js,json}<br><br>返回 47 个文件路径</div>
  <div class="sim-step-annotation">Agent 循环第一步：收集信息。Glob 比 find 更快且不会挂起，这是内置工具设计的考量</div>
</div>
<div class="sim-step sim-tool_call">
  <div class="sim-step-header">🔧 Tool Call · Read</div>
  <div class="sim-step-content">读取关键文件:<br>- package.json（依赖和脚本）<br>- src/index.ts（入口点）<br>- tsconfig.json（编译配置）</div>
  <div class="sim-step-annotation">Agent 循环第二步：深入分析。每次工具调用都是一轮 API 请求，工具结果作为新消息追加到上下文</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">Agent 循环追踪:<br>Turn 1: Glob（结构概览）→ 47 files<br>Turn 2: Read × 3（关键文件）→ 内容<br>Turn 3: Grep（模式搜索）→ 依赖关系<br>Turn 4: 生成最终回复<br><br>共 4 轮 API 调用，总 token: ~12,000</div>
  <div class="sim-step-annotation">每轮循环: 发送上下文 → 模型推理 → 工具调用 → 结果追加 → 重复。Token 随轮次累积，这就是上下文管理至关重要的原因</div>
</div>
<div class="sim-step sim-assistant_text">
  <div class="sim-step-header">🤖 助手回复</div>
  <div class="sim-step-content">这是一个 TypeScript monorepo 项目，核心架构分为三层：<br>- CLI 层: 命令解析和用户交互<br>- Agent 层: 工具循环和上下文管理<br>- API 层: 模型调用和流式响应处理<br><br>入口点是 src/index.ts，通过 Commander.js 分发子命令...</div>
  <div class="sim-step-annotation">最终回复通过流式传输逐字输出到终端。整个过程从启动到回复完成约 8-15 秒</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">请求完成:<br>- 总耗时: 11.2s（引导 0.5s + 4 轮 API 10.7s）<br>- 输入 token: 8,420（其中 prompt 缓存命中 4,200）<br>- 输出 token: 3,580<br>- 工具调用: 5 次<br>- 会话已保存，可用 claude --continue 继续</div>
  <div class="sim-step-annotation">prompt 缓存命中率约 50%：系统 prompt 的静态部分被缓存，显著降低后续请求的延迟和成本</div>
</div>
</div>
