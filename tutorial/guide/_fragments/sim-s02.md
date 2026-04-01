<div class="simulator-container">
<h4>工具分发</h4>
<p class="sim-description">工具注册、查找、权限检查与执行的完整流程</p>
<div class="sim-step sim-user_message">
  <div class="sim-step-header">👤 用户消息</div>
  <div class="sim-step-content">帮我在 utils.ts 里添加一个 formatDate 函数</div>
  <div class="sim-step-annotation">用户请求触发工具选择</div>
</div>
<div class="sim-step sim-assistant_text">
  <div class="sim-step-header">🤖 助手回复</div>
  <div class="sim-step-content">让我先查看 utils.ts 的现有内容...</div>
  <div class="sim-step-annotation">模型选择 Read 工具</div>
</div>
<div class="sim-step sim-tool_call">
  <div class="sim-step-header">🔧 Tool Call · Read</div>
  <div class="sim-step-content">src/utils.ts</div>
  <div class="sim-step-annotation">findToolByName('Read') → 权限检查 → 执行</div>
</div>
<div class="sim-step sim-tool_result">
  <div class="sim-step-header">✅ Tool Result · Read</div>
  <div class="sim-step-content">export function formatNumber(n: number) {<br>  return n.toLocaleString();<br>}<br><br>export function capitalize(s: string) {<br>  return s[0].toUpperCase() + s.slice(1);<br>}</div>
  <div class="sim-step-annotation">Read 工具始终允许（只读操作）</div>
</div>
<div class="sim-step sim-assistant_text">
  <div class="sim-step-header">🤖 助手回复</div>
  <div class="sim-step-content">文件已有两个工具函数，我来添加 formatDate。</div>
  <div class="sim-step-annotation">模型分析结果，决定编辑</div>
</div>
<div class="sim-step sim-tool_call">
  <div class="sim-step-header">🔧 Tool Call · Edit</div>
  <div class="sim-step-content">在文件末尾添加:<br><br>export function formatDate(date: Date): string {<br>  return date.toISOString().split('T')[0];<br>}</div>
  <div class="sim-step-annotation">findToolByName('Edit') → 权限检查（需用户确认）</div>
</div>
<div class="sim-step sim-tool_result">
  <div class="sim-step-header">✅ Tool Result · Edit</div>
  <div class="sim-step-content">✓ File edited: src/utils.ts</div>
  <div class="sim-step-annotation">权限通过，编辑完成</div>
</div>
<div class="sim-step sim-assistant_text">
  <div class="sim-step-header">🤖 助手回复</div>
  <div class="sim-step-content">已添加 formatDate 函数到 utils.ts。</div>
  <div class="sim-step-annotation">end_turn，循环结束</div>
</div>
</div>
