<div class="simulator-container">
<h4>三层压缩触发</h4>
<p class="sim-description">上下文增长时 Micro、Auto、Manual 三层压缩机制如何依次介入</p>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">当前上下文: 15,000 tokens (阈值: 80,000)</div>
  <div class="sim-step-annotation">会话开始时上下文较小，三层压缩均未触发</div>
</div>
<div class="sim-step sim-user_message">
  <div class="sim-step-header">👤 用户消息</div>
  <div class="sim-step-content">帮我重构整个 auth 模块</div>
  <div class="sim-step-annotation">大型重构任务会产生大量上下文</div>
</div>
<div class="sim-step sim-assistant_text">
  <div class="sim-step-header">🤖 助手回复</div>
  <div class="sim-step-content">让我先了解现有的认证架构...</div>
  <div class="sim-step-annotation">Agent 开始探索代码库</div>
</div>
<div class="sim-step sim-tool_call">
  <div class="sim-step-header">🔧 Tool Call · Read</div>
  <div class="sim-step-content">读取 src/auth/login.ts, src/auth/session.ts, src/auth/middleware.ts, src/auth/types.ts, src/auth/utils.ts</div>
  <div class="sim-step-annotation">批量读取文件会产生大量 token</div>
</div>
<div class="sim-step sim-tool_result">
  <div class="sim-step-header">✅ Tool Result · Read</div>
  <div class="sim-step-content">[5,000 tokens 的文件内容...]</div>
  <div class="sim-step-annotation">工具返回大量代码内容</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">Micro 压缩触发: 工具结果超过阈值<br>- 截断 Read 结果: 5,000 → 2,000 tokens<br>- 零 API 调用开销</div>
  <div class="sim-step-annotation">第一层 Micro 压缩：纯字符串截断，不调用 LLM，零额外开销。对超长工具结果自动裁剪</div>
</div>
<div class="sim-step sim-tool_call">
  <div class="sim-step-header">🔧 Tool Call · Bash</div>
  <div class="sim-step-content">grep -r "authenticate" src/auth/</div>
  <div class="sim-step-annotation">继续探索代码引用关系</div>
</div>
<div class="sim-step sim-tool_result">
  <div class="sim-step-header">✅ Tool Result · Bash</div>
  <div class="sim-step-content">[匹配结果...]</div>
  <div class="sim-step-annotation">更多上下文积累</div>
</div>
<div class="sim-step sim-tool_call">
  <div class="sim-step-header">🔧 Tool Call · Read</div>
  <div class="sim-step-content">读取 src/routes/api.ts, src/middleware/cors.ts, tests/auth.test.ts</div>
  <div class="sim-step-annotation">持续读取更多文件</div>
</div>
<div class="sim-step sim-tool_result">
  <div class="sim-step-header">✅ Tool Result · Read</div>
  <div class="sim-step-content">[更多文件内容...]</div>
  <div class="sim-step-annotation">上下文持续增长</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">当前上下文: 72,000 tokens (接近 80,000 阈值)</div>
  <div class="sim-step-annotation">经过多轮工具调用，上下文接近阈值</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">Auto 压缩触发:<br>1. 调用 LLM 生成对话摘要<br>2. 保留最近 3 轮对话<br>3. 历史消息替换为摘要<br>4. 压缩后: 72,000 → 18,000 tokens</div>
  <div class="sim-step-annotation">第二层 Auto 压缩：调用 LLM 生成摘要，保留近期对话细节，远期历史压缩为摘要。第三层 Manual 压缩由用户通过 /compact 命令手动触发，机制与 Auto 相同</div>
</div>
<div class="sim-step sim-assistant_text">
  <div class="sim-step-header">🤖 助手回复</div>
  <div class="sim-step-content">[继续工作，上下文已自动压缩]</div>
  <div class="sim-step-annotation">压缩对用户透明，Agent 继续工作不中断。三层压缩: Micro(零开销截断) → Auto(AI 摘要, 自动触发) → Manual(/compact 命令, 手动触发)</div>
</div>
</div>
