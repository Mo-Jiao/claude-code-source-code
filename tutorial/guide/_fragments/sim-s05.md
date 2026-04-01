<div class="simulator-container">
<h4>Hooks 拦截流程</h4>
<p class="sim-description">PreToolUse hook 如何拦截危险命令并引导 Agent 采用安全替代方案</p>
<div class="sim-step sim-user_message">
  <div class="sim-step-header">👤 用户消息</div>
  <div class="sim-step-content">删除所有临时文件</div>
  <div class="sim-step-annotation">用户发出一个可能触发危险命令的请求</div>
</div>
<div class="sim-step sim-assistant_text">
  <div class="sim-step-header">🤖 助手回复</div>
  <div class="sim-step-content">我来清理临时文件...</div>
  <div class="sim-step-annotation">Agent 开始规划操作，尚未执行任何命令</div>
</div>
<div class="sim-step sim-tool_call">
  <div class="sim-step-header">🔧 Tool Call · Bash</div>
  <div class="sim-step-content">rm -rf /tmp/project-cache/*</div>
  <div class="sim-step-annotation">Agent 选择了 rm -rf —— 一个潜在危险的命令</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">PreToolUse hook 触发: .claude/settings.json 中配置了 Bash 工具的 hook</div>
  <div class="sim-step-annotation">Hook 系统支持 27 种事件类型，PreToolUse 在工具执行前触发，PostToolUse 在执行后触发</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">执行 hook 命令: bash .claude/hooks/check-dangerous-cmd.sh<br>参数: {"tool": "Bash", "command": "rm -rf /tmp/project-cache/*"}</div>
  <div class="sim-step-annotation">Hook 脚本通过 stdin 接收 JSON 参数，可以检查工具名称和具体命令内容</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">Hook 返回: {"decision": "block", "reason": "rm -rf 命令被安全策略阻止"}</div>
  <div class="sim-step-annotation">Hook 有三种决策: approve(允许执行), block(阻止并告知原因), skip(跳过不执行但不报错)</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">工具调用被 hook 拦截，不执行</div>
  <div class="sim-step-annotation">block 决策会阻止工具执行，并将 reason 反馈给 Agent，引导其调整策略</div>
</div>
<div class="sim-step sim-assistant_text">
  <div class="sim-step-header">🤖 助手回复</div>
  <div class="sim-step-content">抱歉，rm -rf 命令被项目的安全 hook 阻止了。让我用更安全的方式...</div>
  <div class="sim-step-annotation">Agent 收到 block 原因后，自动切换到更安全的替代方案</div>
</div>
<div class="sim-step sim-tool_call">
  <div class="sim-step-header">🔧 Tool Call · Bash</div>
  <div class="sim-step-content">find /tmp/project-cache -type f -mtime +7 -delete</div>
  <div class="sim-step-annotation">替代方案：只删除 7 天前的文件，更安全可控</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">PreToolUse hook 触发 → 执行检查 → 返回 {"decision": "approve"}</div>
  <div class="sim-step-annotation">同一个 hook 对安全命令返回 approve，工具正常执行</div>
</div>
<div class="sim-step sim-tool_result">
  <div class="sim-step-header">✅ Tool Result · Bash</div>
  <div class="sim-step-content">已删除 23 个过期文件</div>
  <div class="sim-step-annotation">命令通过 hook 检查后正常执行并返回结果</div>
</div>
<div class="sim-step sim-assistant_text">
  <div class="sim-step-header">🤖 助手回复</div>
  <div class="sim-step-content">已安全清理了 23 个超过 7 天的临时文件。</div>
  <div class="sim-step-annotation">Hook 机制让 Agent 在项目安全策略内自主工作，无需人工干预</div>
</div>
</div>
