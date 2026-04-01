<div class="simulator-container">
<h4>设置层级合并</h4>
<p class="sim-description">四层配置从默认值到企业策略逐级合并，高优先级覆盖低优先级</p>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">── 配置加载开始 ──</div>
  <div class="sim-step-annotation">每次会话启动时，按优先级加载四层配置</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">Layer 1: 默认值<br>{<br>  "permissions": "default",<br>  "theme": "auto",<br>  "maxTokens": 200000<br>}</div>
  <div class="sim-step-annotation">最低优先级 — 硬编码在源码中的默认值</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">Layer 2: 用户配置<br>~/.claude/settings.json<br>{<br>  "permissions": "auto-edit",<br>  "theme": "dark"<br>}</div>
  <div class="sim-step-annotation">用户级配置 — 覆盖默认值</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">Layer 3: 项目配置<br>.claude/settings.json<br>{<br>  "permissions": "default",<br>  "hooks": { "PreToolUse": [...] }<br>}</div>
  <div class="sim-step-annotation">项目级配置 — 可覆盖用户配置</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">Layer 4: 企业策略<br>Managed Settings (MDM 分发)<br>{<br>  "permissions": "default",<br>  "disableTools": ["Bash"]<br>}</div>
  <div class="sim-step-annotation">最高优先级 — 企业管理员强制策略，用户无法覆盖</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">── 合并结果 ──<br>{<br>  "permissions": "default",     // 企业策略覆盖<br>  "theme": "dark",              // 用户配置<br>  "maxTokens": 200000,          // 默认值<br>  "hooks": { "PreToolUse": [...] }, // 项目配置<br>  "disableTools": ["Bash"]      // 企业策略<br>}</div>
  <div class="sim-step-annotation">高优先级覆盖低优先级，未设置的字段继承下一层</div>
</div>
<div class="sim-step sim-user_message">
  <div class="sim-step-header">👤 用户消息</div>
  <div class="sim-step-content">帮我执行 npm test</div>
  <div class="sim-step-annotation">用户请求调用 Bash 工具</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">权限检查: Bash 工具<br>→ disableTools 包含 "Bash"<br>→ 来源: 企业策略 (不可覆盖)<br>→ 结果: 拒绝</div>
  <div class="sim-step-annotation">企业策略的 disableTools 生效，阻止 Bash 调用</div>
</div>
<div class="sim-step sim-assistant_text">
  <div class="sim-step-header">🤖 助手回复</div>
  <div class="sim-step-content">抱歉，Bash 工具被企业安全策略禁用。请联系管理员或使用其他方式运行测试。</div>
  <div class="sim-step-annotation">Agent 告知用户限制来源，而非静默失败</div>
</div>
</div>
