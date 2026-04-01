<div class="simulator-container">
<h4>Agent Loop</h4>
<p class="sim-description">一个完整的 agent 循环：用户请求 → 模型思考 → 工具调用 → 结果返回 → 继续或结束</p>
<div class="sim-step sim-user_message">
  <div class="sim-step-header">👤 用户消息</div>
  <div class="sim-step-content">请修复 login.ts 中的认证 bug</div>
  <div class="sim-step-annotation">用户提交任务，进入 agent 循环</div>
</div>
<div class="sim-step sim-assistant_text">
  <div class="sim-step-header">🤖 助手回复</div>
  <div class="sim-step-content">我来搜索一下相关的错误信息...</div>
  <div class="sim-step-annotation">模型决定第一步行动：搜索</div>
</div>
<div class="sim-step sim-tool_call">
  <div class="sim-step-header">🔧 Tool Call · Bash</div>
  <div class="sim-step-content">grep -r 'AuthError' src/</div>
  <div class="sim-step-annotation">stop_reason='tool_use'，进入工具执行分支</div>
</div>
<div class="sim-step sim-tool_result">
  <div class="sim-step-header">✅ Tool Result · Bash</div>
  <div class="sim-step-content">src/login.ts:42: throw new AuthError('token expired')<br>src/login.ts:58: catch(AuthError)</div>
  <div class="sim-step-annotation">工具结果追加到消息列表，循环继续</div>
</div>
<div class="sim-step sim-assistant_text">
  <div class="sim-step-header">🤖 助手回复</div>
  <div class="sim-step-content">找到了错误位置，让我读取这个文件...</div>
  <div class="sim-step-annotation">模型看到结果，决定下一步</div>
</div>
<div class="sim-step sim-tool_call">
  <div class="sim-step-header">🔧 Tool Call · Read</div>
  <div class="sim-step-content">login.ts</div>
  <div class="sim-step-annotation">第二轮工具调用</div>
</div>
<div class="sim-step sim-tool_result">
  <div class="sim-step-header">✅ Tool Result · Read</div>
  <div class="sim-step-content">// login.ts<br>function authenticate(token) {<br>  if (isExpired(token)) {<br>    throw new AuthError('token expired')<br>  }<br>  // missing: refresh logic<br>}</div>
  <div class="sim-step-annotation">文件内容返回</div>
</div>
<div class="sim-step sim-assistant_text">
  <div class="sim-step-header">🤖 助手回复</div>
  <div class="sim-step-content">问题是缺少 token 刷新逻辑。让我修复它。</div>
  <div class="sim-step-annotation">模型理解了 bug 原因</div>
</div>
<div class="sim-step sim-tool_call">
  <div class="sim-step-header">🔧 Tool Call · Edit</div>
  <div class="sim-step-content">if (isExpired(token)) {<br>  token = await refreshToken(token)<br>  if (!token) throw new AuthError('refresh failed')<br>}</div>
  <div class="sim-step-annotation">Edit 工具调用修复代码</div>
</div>
<div class="sim-step sim-tool_result">
  <div class="sim-step-header">✅ Tool Result · Edit</div>
  <div class="sim-step-content">✓ File edited successfully</div>
  <div class="sim-step-annotation">修复完成</div>
</div>
<div class="sim-step sim-assistant_text">
  <div class="sim-step-header">🤖 助手回复</div>
  <div class="sim-step-content">已修复 login.ts 中的认证 bug。问题是 token 过期后没有刷新逻辑，现在添加了 refreshToken 调用。</div>
  <div class="sim-step-annotation">stop_reason='end_turn'，循环退出</div>
</div>
</div>
