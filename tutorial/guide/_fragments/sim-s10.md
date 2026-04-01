<div class="simulator-container">
<h4>Plan 模式切换</h4>
<p class="sim-description">Plan 模式通过切换工具权限实现只读探索，退出后恢复写操作，且不破坏 prompt cache</p>
<div class="sim-step sim-user_message">
  <div class="sim-step-header">👤 用户消息</div>
  <div class="sim-step-content">帮我实现用户认证系统</div>
  <div class="sim-step-annotation">复杂任务适合先用 Plan 模式设计方案</div>
</div>
<div class="sim-step sim-assistant_text">
  <div class="sim-step-header">🤖 助手回复</div>
  <div class="sim-step-content">这是一个复杂的任务，让我先进入 Plan 模式来设计方案。</div>
  <div class="sim-step-annotation">Agent 判断任务复杂度后建议先规划</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">进入 Plan 模式:<br>- 权限切换: 禁用 Edit/Write/Bash 写操作<br>- 保留: Read/Glob/Grep (只读探索)<br>- 系统提示词不变 → prompt cache 保持稳定</div>
  <div class="sim-step-annotation">Plan 模式的关键设计：切换的是权限而非工具集。系统提示词不变，因此 prompt cache 不会失效，节省 token 和延迟</div>
</div>
<div class="sim-step sim-tool_call">
  <div class="sim-step-header">🔧 Tool Call · Glob</div>
  <div class="sim-step-content">src/auth/**/*.ts</div>
  <div class="sim-step-annotation">只读工具正常可用，用于探索项目结构</div>
</div>
<div class="sim-step sim-tool_result">
  <div class="sim-step-header">✅ Tool Result · Glob</div>
  <div class="sim-step-content">src/auth/login.ts<br>src/auth/session.ts<br>src/auth/middleware.ts</div>
  <div class="sim-step-annotation">发现现有的认证模块文件</div>
</div>
<div class="sim-step sim-tool_call">
  <div class="sim-step-header">🔧 Tool Call · Read</div>
  <div class="sim-step-content">src/auth/login.ts</div>
  <div class="sim-step-annotation">读取现有实现以了解架构</div>
</div>
<div class="sim-step sim-tool_result">
  <div class="sim-step-header">✅ Tool Result · Read</div>
  <div class="sim-step-content">// current auth implementation<br>export function login(username: string, password: string) {<br>  // basic password check, no JWT<br>  ...<br>}</div>
  <div class="sim-step-annotation">当前实现缺少 JWT 和 refresh token</div>
</div>
<div class="sim-step sim-assistant_text">
  <div class="sim-step-header">🤖 助手回复</div>
  <div class="sim-step-content">方案设计完成：<br>1. 添加 JWT token 验证<br>2. 实现 refresh token 机制<br>3. 添加 middleware 拦截<br><br>准备好实施了吗？</div>
  <div class="sim-step-annotation">Plan 模式下 Agent 只探索和分析，不做任何修改</div>
</div>
<div class="sim-step sim-user_message">
  <div class="sim-step-header">👤 用户消息</div>
  <div class="sim-step-content">开始吧</div>
  <div class="sim-step-annotation">用户确认方案，准备进入实施阶段</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">退出 Plan 模式:<br>- 恢复所有工具权限<br>- Edit/Write/Bash 重新可用<br>- 对话历史完整保留</div>
  <div class="sim-step-annotation">退出 Plan 模式后，之前探索的所有上下文都保留在对话历史中，Agent 可以直接开始实施</div>
</div>
<div class="sim-step sim-tool_call">
  <div class="sim-step-header">🔧 Tool Call · Edit</div>
  <div class="sim-step-content">修改 src/auth/login.ts: 添加 JWT token 生成和验证逻辑</div>
  <div class="sim-step-annotation">写操作权限恢复，开始实施方案</div>
</div>
<div class="sim-step sim-tool_result">
  <div class="sim-step-header">✅ Tool Result · Edit</div>
  <div class="sim-step-content">✓ File edited</div>
  <div class="sim-step-annotation">文件修改成功</div>
</div>
<div class="sim-step sim-assistant_text">
  <div class="sim-step-header">🤖 助手回复</div>
  <div class="sim-step-content">JWT 验证已添加到 login.ts。</div>
  <div class="sim-step-annotation">Plan 模式切换权限而非工具集，prompt cache 不失效，是一个低开销的模式切换设计</div>
</div>
</div>
