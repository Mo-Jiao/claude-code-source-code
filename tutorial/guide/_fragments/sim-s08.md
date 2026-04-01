<div class="simulator-container">
<h4>Memory 系统加载与写入</h4>
<p class="sim-description">CLAUDE.md 在会话启动时加载规则，Auto Memory 在对话中自动保存用户偏好</p>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">会话启动 — 加载 Memory 系统</div>
  <div class="sim-step-annotation">Memory 系统在每次会话开始时自动激活</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">扫描 CLAUDE.md 文件:<br>1. ~/.claude/CLAUDE.md (全局规则)<br>2. /project/CLAUDE.md (项目规则)<br>3. /project/src/CLAUDE.md (目录规则)</div>
  <div class="sim-step-annotation">CLAUDE.md 按层级扫描：全局 → 项目根目录 → 当前工作目录的各级父目录</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">合并 3 个 CLAUDE.md → 注入系统提示词 Layer 3</div>
  <div class="sim-step-annotation">所有 CLAUDE.md 内容合并后注入系统提示词的第三层(用户/项目规则层)，每次对话都生效</div>
</div>
<div class="sim-step sim-user_message">
  <div class="sim-step-header">👤 用户消息</div>
  <div class="sim-step-content">我们的 API 统一用 snake_case</div>
  <div class="sim-step-annotation">用户表达了一个编码偏好/项目约定</div>
</div>
<div class="sim-step sim-assistant_text">
  <div class="sim-step-header">🤖 助手回复</div>
  <div class="sim-step-content">好的，我记住了。API 接口统一使用 snake_case 命名风格。</div>
  <div class="sim-step-annotation">Agent 确认理解了用户偏好</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">Auto Memory 触发:<br>检测到用户偏好 → 写入 ~/.claude/memory/feedback_api_style.md<br>---<br>name: API 命名风格<br>type: feedback<br>---<br>API 统一使用 snake_case</div>
  <div class="sim-step-annotation">Auto Memory 自动检测用户偏好和反馈，以 markdown 文件形式持久化存储</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">更新 MEMORY.md 索引:<br>- [API 命名风格](feedback_api_style.md) — snake_case</div>
  <div class="sim-step-annotation">MEMORY.md 作为索引文件，记录所有自动保存的记忆条目</div>
</div>
<div class="sim-step sim-assistant_text">
  <div class="sim-step-header">🤖 助手回复</div>
  <div class="sim-step-content">已保存到记忆系统，后续对话我会遵循 snake_case 规范。</div>
  <div class="sim-step-annotation">两套互补机制：规则类内容(编码规范、项目结构)写入 CLAUDE.md 由用户维护；事实类内容(用户偏好、反馈)由 Auto Memory 自动保存</div>
</div>
</div>
