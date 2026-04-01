<div class="simulator-container">
<h4>权限瀑布</h4>
<p class="sim-description">工具调用经过六级权限检查的完整流程</p>
<div class="sim-step sim-tool_call">
  <div class="sim-step-header">🔧 Tool Call · Bash</div>
  <div class="sim-step-content">rm -rf node_modules/</div>
  <div class="sim-step-annotation">模型请求执行一个潜在危险的命令</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">Level 1: 工具风险分类<br>Bash → 'danger' (匹配 rm -rf 规则)</div>
  <div class="sim-step-annotation">每个工具有静态风险等级</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">Level 2: 权限模式检查<br>当前模式: 'default' → 需要用户确认 'danger' 级操作</div>
  <div class="sim-step-annotation">5 种模式: plan &lt; default &lt; auto-edit &lt; full-auto &lt; bypass</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">Level 3: 会话级缓存<br>未找到匹配的会话缓存 → 继续</div>
  <div class="sim-step-annotation">用户之前未批准过类似命令</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">Level 4: 企业策略检查<br>无 managed settings 限制 → 继续</div>
  <div class="sim-step-annotation">企业可通过 managed settings 硬性禁止</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">Level 5: Hooks 检查<br>未配置相关 PreToolUse hook → 继续</div>
  <div class="sim-step-annotation">用户可通过 hooks 自动批准或拒绝</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">Level 6: 用户确认<br>⚠️ 「允许执行 rm -rf node_modules/?」<br>[允许] [拒绝] [允许本次会话]</div>
  <div class="sim-step-annotation">最终防线：交给用户决定</div>
</div>
<div class="sim-step sim-user_message">
  <div class="sim-step-header">👤 用户消息</div>
  <div class="sim-step-content">[允许本次会话]</div>
  <div class="sim-step-annotation">用户选择「允许本次会话」→ 缓存到 Level 3</div>
</div>
<div class="sim-step sim-tool_result">
  <div class="sim-step-header">✅ Tool Result · Bash</div>
  <div class="sim-step-content">✓ 已删除 node_modules/</div>
  <div class="sim-step-annotation">权限通过，执行命令</div>
</div>
</div>
