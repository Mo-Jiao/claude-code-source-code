<div class="simulator-container">
<h4>MCP 服务器集成</h4>
<p class="sim-description">通过 MCP 协议连接外部服务器，发现并调用第三方工具扩展 Agent 能力</p>
<div class="sim-step sim-user_message">
  <div class="sim-step-header">👤 用户消息</div>
  <div class="sim-step-content">帮我看看 GitHub 上 #42 这个 issue 的详情，然后创建一个 PR 修复它</div>
  <div class="sim-step-annotation">用户需要与 GitHub 交互，这超出了内置工具的能力范围，需要 MCP 服务器提供扩展工具</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">检查 MCP 配置 (.claude/settings.json):<br>mcpServers: {<br>  "github": {<br>    "command": "npx",<br>    "args": ["-y", "@modelcontextprotocol/server-github"],<br>    "env": { "GITHUB_TOKEN": "***" }<br>  }<br>}</div>
  <div class="sim-step-annotation">MCP 服务器在 settings.json 中声明式配置。启动时自动连接，无需用户手动管理进程</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">MCP 握手:<br>1. 启动 server-github 进程（stdio 传输）<br>2. 发送 initialize 请求<br>3. 服务器返回能力清单:<br>   - tools: [get_issue, create_pull_request, list_commits, ...]<br>   - resources: [repo://owner/name]<br>4. 握手完成，工具已注册</div>
  <div class="sim-step-annotation">MCP 使用 JSON-RPC over stdio 通信。握手阶段交换能力声明，Agent 动态获知可用工具列表</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">工具发现:<br>新增 MCP 工具已合并到 Agent 工具列表:<br>- mcp__github__get_issue<br>- mcp__github__create_pull_request<br>- mcp__github__create_branch<br>共 12 个工具可用</div>
  <div class="sim-step-annotation">MCP 工具以 mcp__{server}__{tool} 格式命名，与内置工具统一管理。Agent 像调用内置工具一样调用 MCP 工具</div>
</div>
<div class="sim-step sim-tool_call">
  <div class="sim-step-header">🔧 Tool Call · mcp__github__get_issue</div>
  <div class="sim-step-content">mcp__github__get_issue:<br>  owner: "acme-corp"<br>  repo: "web-app"<br>  issue_number: 42</div>
  <div class="sim-step-annotation">Agent 通过标准工具调用接口调用 MCP 工具，底层自动序列化为 JSON-RPC 请求发送给 MCP 服务器</div>
</div>
<div class="sim-step sim-tool_result">
  <div class="sim-step-header">✅ Tool Result · mcp__github__get_issue</div>
  <div class="sim-step-content">Issue #42: "登录页面在 Safari 上样式错乱"<br>- 状态: open<br>- 标签: bug, ui<br>- 描述: Safari 16 下 flex gap 不生效，按钮堆叠在一起</div>
  <div class="sim-step-annotation">MCP 服务器处理 GitHub API 调用并返回结构化结果，Agent 无需知道 GitHub API 细节</div>
</div>
<div class="sim-step sim-tool_call">
  <div class="sim-step-header">🔧 Tool Call · Edit</div>
  <div class="sim-step-content">修复 src/pages/login.css:<br>- display: flex; gap: 16px;<br>+ display: flex; gap: 16px;<br>+ /* Safari fallback */<br>+ &gt; * + * { margin-left: 16px; }</div>
  <div class="sim-step-annotation">Agent 使用内置工具修复代码，MCP 工具和内置工具在同一工作流中无缝配合</div>
</div>
<div class="sim-step sim-tool_result">
  <div class="sim-step-header">✅ Tool Result · Edit</div>
  <div class="sim-step-content">✓ File edited</div>
  <div class="sim-step-annotation">代码修复完成，接下来用 MCP 工具创建 PR</div>
</div>
<div class="sim-step sim-tool_call">
  <div class="sim-step-header">🔧 Tool Call · mcp__github__create_pull_request</div>
  <div class="sim-step-content">mcp__github__create_pull_request:<br>  owner: "acme-corp"<br>  repo: "web-app"<br>  title: "fix: Safari flex gap fallback for login page"<br>  body: "Fixes #42. 添加 Safari 16 的 flex gap 降级方案。"<br>  head: "fix/safari-login-layout"<br>  base: "main"</div>
  <div class="sim-step-annotation">通过 MCP 工具创建 PR，底层由 MCP 服务器调用 GitHub API，Agent 只需提供参数</div>
</div>
<div class="sim-step sim-tool_result">
  <div class="sim-step-header">✅ Tool Result · mcp__github__create_pull_request</div>
  <div class="sim-step-content">✓ Pull Request #58 created<br>https://github.com/acme-corp/web-app/pull/58</div>
  <div class="sim-step-annotation">MCP 的核心价值：Agent 通过标准协议获得无限扩展能力，无需为每个外部服务编写定制集成</div>
</div>
<div class="sim-step sim-assistant_text">
  <div class="sim-step-header">🤖 助手回复</div>
  <div class="sim-step-content">已完成：<br>- Issue #42 是 Safari flex gap 兼容性问题<br>- 已添加 margin-left 降级方案<br>- PR #58 已创建并关联 Issue<br><br>https://github.com/acme-corp/web-app/pull/58</div>
  <div class="sim-step-annotation">整个流程中 MCP 工具与内置工具无缝衔接：MCP 负责外部服务交互，内置工具负责本地文件操作</div>
</div>
</div>
