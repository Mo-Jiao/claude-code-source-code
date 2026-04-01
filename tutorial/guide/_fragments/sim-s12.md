<div class="simulator-container">
<h4>子 Agent 委派</h4>
<p class="sim-description">父 Agent 创建子 Agent 并行处理任务，子 Agent 拥有干净上下文，只返回摘要结果</p>
<div class="sim-step sim-user_message">
  <div class="sim-step-header">👤 用户消息</div>
  <div class="sim-step-content">重构 auth 模块并同时更新所有相关测试</div>
  <div class="sim-step-annotation">任务可拆分为两个独立子任务，适合并行处理</div>
</div>
<div class="sim-step sim-assistant_text">
  <div class="sim-step-header">🤖 助手回复</div>
  <div class="sim-step-content">这个任务可以并行处理。我来派一个子 Agent 负责测试更新。</div>
  <div class="sim-step-annotation">父 Agent 识别出可并行的子任务</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">父 Agent 创建子 Agent:<br>- 类型: general-purpose<br>- 继承: 工具权限、CLAUDE.md 规则<br>- 不继承: 父 Agent 的消息历史<br>- 上下文: 全新的干净对话</div>
  <div class="sim-step-annotation">子 Agent 隔离消息历史是核心设计：避免父 Agent 的大量上下文污染子 Agent，让子 Agent 专注于单一任务</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">子 Agent 收到的 prompt:<br>"你是一个测试工程师。请更新 src/auth/ 下所有模块的测试文件，确保覆盖 JWT 验证和 token refresh 逻辑。"</div>
  <div class="sim-step-annotation">父 Agent 通过精简的 prompt 描述任务，而非传递完整对话历史</div>
</div>
<div class="sim-step sim-assistant_text">
  <div class="sim-step-header">🤖 助手回复</div>
  <div class="sim-step-content">[父 Agent] 子 Agent 已启动，我继续重构 auth 模块...</div>
  <div class="sim-step-annotation">父 Agent 不阻塞等待，继续处理自己的任务</div>
</div>
<div class="sim-step sim-tool_call">
  <div class="sim-step-header">🔧 Tool Call · Edit</div>
  <div class="sim-step-content">重构 src/auth/login.ts: 添加 JWT 验证、token refresh 逻辑</div>
  <div class="sim-step-annotation">父 Agent 并行工作在主代码重构上</div>
</div>
<div class="sim-step sim-tool_result">
  <div class="sim-step-header">✅ Tool Result · Edit</div>
  <div class="sim-step-content">✓ File edited</div>
  <div class="sim-step-annotation">父 Agent 完成自己的修改</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">子 Agent 工作中:<br>- 读取 tests/auth/*.test.ts<br>- 添加 JWT 测试用例<br>- 运行测试: 12/12 通过</div>
  <div class="sim-step-annotation">子 Agent 在自己的干净上下文中独立完成工作</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">子 Agent 完成，返回摘要:<br>"已更新 3 个测试文件，新增 8 个测试用例，全部通过。"</div>
  <div class="sim-step-annotation">子 Agent 只返回摘要结果给父 Agent，不返回完整的对话历史，避免上下文膨胀</div>
</div>
<div class="sim-step sim-assistant_text">
  <div class="sim-step-header">🤖 助手回复</div>
  <div class="sim-step-content">重构完成。子 Agent 也更新了测试：3 个文件、8 个新用例、全部通过。</div>
  <div class="sim-step-annotation">子 Agent 隔离消息历史 + 只返回摘要，是避免上下文污染的关键设计。父 Agent 获得结果而不承担子 Agent 的上下文开销</div>
</div>
</div>
