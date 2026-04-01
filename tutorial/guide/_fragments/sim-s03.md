<div class="simulator-container">
<h4>系统提示词组装</h4>
<p class="sim-description">展示系统提示词的六层组装过程和缓存策略</p>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">── 系统提示词组装开始 ──</div>
  <div class="sim-step-annotation">每次 API 调用前，重新组装系统提示词</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">Layer 1: 角色定义<br>"You are Claude Code, Anthropic's official CLI..."</div>
  <div class="sim-step-annotation">静态层 — 永不变化，100% 缓存命中</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">Layer 2: 工具使用规范<br>"Use dedicated tools instead of Bash..."</div>
  <div class="sim-step-annotation">静态层 — 工具使用指南</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">Layer 3: CLAUDE.md 内容<br>"# Project Rules\n- Use TypeScript strict mode..."</div>
  <div class="sim-step-annotation">半静态层 — 文件变化时才更新</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">Layer 4: Skills 列表<br>"Available skills: commit, review-pr, debug..."</div>
  <div class="sim-step-annotation">半静态层 — 只注入名称，不注入完整内容</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">── cache_control: ephemeral ──<br>以下内容不缓存</div>
  <div class="sim-step-annotation">cache_control 断点 — 之后的内容每次都变</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">Layer 5: Git 状态<br>"Branch: feat/auth, Modified: 3 files"</div>
  <div class="sim-step-annotation">动态层 — 每次请求都不同</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">Layer 6: 环境信息<br>"OS: macOS, Shell: zsh, Date: 2026-04-01"</div>
  <div class="sim-step-annotation">动态层 — 运行时信息</div>
</div>
<div class="sim-step sim-assistant_text">
  <div class="sim-step-header">🤖 助手回复</div>
  <div class="sim-step-content">系统提示词组装完成。前 4 层约 12KB（缓存），后 2 层约 1KB（动态）。</div>
  <div class="sim-step-annotation">缓存命中率接近 100% 的关键：静态前置 + 动态后置</div>
</div>
</div>
