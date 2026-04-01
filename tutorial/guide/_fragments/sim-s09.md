<div class="simulator-container">
<h4>Skills 按需加载</h4>
<p class="sim-description">Skill 名称始终在系统提示词中，完整定义按需加载以节省 token</p>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">系统提示词组装 — Skills 列表注入:<br>"Available skills: commit, review-pr, debug, excalidraw..." (仅名称，不含完整内容)</div>
  <div class="sim-step-annotation">Skill 名称列表注入系统提示词，让 Agent 知道有哪些能力可用，但不占用大量 token</div>
</div>
<div class="sim-step sim-user_message">
  <div class="sim-step-header">👤 用户消息</div>
  <div class="sim-step-content">/commit</div>
  <div class="sim-step-annotation">用户通过斜杠命令触发 skill</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">Skill 触发: 用户输入匹配 skill 名称 'commit'</div>
  <div class="sim-step-annotation">系统检测到用户输入匹配已注册的 skill 名称</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">按需加载完整 Skill 定义:<br>读取 skills/commit/SKILL.md (2,400 tokens)<br>注入到当前消息上下文</div>
  <div class="sim-step-annotation">两层注入策略：名称在系统提示词中始终存在(几十 tokens)，完整定义仅在触发时加载(数千 tokens)，大幅节省 token</div>
</div>
<div class="sim-step sim-assistant_text">
  <div class="sim-step-header">🤖 助手回复</div>
  <div class="sim-step-content">我来检查变更并创建 commit...</div>
  <div class="sim-step-annotation">Agent 加载了完整的 commit skill 指令，知道该如何规范地执行 commit 流程</div>
</div>
<div class="sim-step sim-tool_call">
  <div class="sim-step-header">🔧 Tool Call · Bash</div>
  <div class="sim-step-content">git status &amp;&amp; git diff --stat</div>
  <div class="sim-step-annotation">按照 skill 定义的流程，先检查变更状态</div>
</div>
<div class="sim-step sim-tool_result">
  <div class="sim-step-header">✅ Tool Result · Bash</div>
  <div class="sim-step-content">M src/auth.ts<br>M src/types.ts<br>2 files changed, 45 insertions(+)</div>
  <div class="sim-step-annotation">检测到 2 个文件有改动</div>
</div>
<div class="sim-step sim-assistant_text">
  <div class="sim-step-header">🤖 助手回复</div>
  <div class="sim-step-content">检测到 2 个文件变更，正在生成 commit message...</div>
  <div class="sim-step-annotation">Skill 指导 Agent 按规范流程操作：先查看变更，再生成语义化 commit message</div>
</div>
<div class="sim-step sim-tool_call">
  <div class="sim-step-header">🔧 Tool Call · Bash</div>
  <div class="sim-step-content">git add src/auth.ts src/types.ts &amp;&amp; git commit -m 'feat: add token refresh to auth flow'</div>
  <div class="sim-step-annotation">按照 Conventional Commits 规范生成 commit message</div>
</div>
<div class="sim-step sim-tool_result">
  <div class="sim-step-header">✅ Tool Result · Bash</div>
  <div class="sim-step-content">[main abc1234] feat: add token refresh to auth flow</div>
  <div class="sim-step-annotation">Commit 成功创建</div>
</div>
<div class="sim-step sim-assistant_text">
  <div class="sim-step-header">🤖 助手回复</div>
  <div class="sim-step-content">已提交。Commit: abc1234</div>
  <div class="sim-step-annotation">Skill 通过两层注入实现了「知道能做什么」(名称层) 和「知道怎么做」(定义层) 的分离，平衡了 token 开销与能力覆盖</div>
</div>
</div>
