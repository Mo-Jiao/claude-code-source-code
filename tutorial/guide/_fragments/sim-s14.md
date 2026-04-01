<div class="simulator-container">
<h4>Worktree 隔离</h4>
<p class="sim-description">使用 Git Worktree 在隔离分支上修复 Bug，不影响当前工作区</p>
<div class="sim-step sim-user_message">
  <div class="sim-step-header">👤 用户消息</div>
  <div class="sim-step-content">线上有个紧急 bug：用户登录后 token 过期时间设成了 10 秒。帮我在单独分支上修复，别影响我当前的工作</div>
  <div class="sim-step-annotation">用户当前分支有未完成的工作，需要在不丢失当前状态的前提下修复紧急 bug</div>
</div>
<div class="sim-step sim-assistant_text">
  <div class="sim-step-header">🤖 助手回复</div>
  <div class="sim-step-content">我用 Worktree 创建一个隔离的工作区来修复这个 bug，不会影响你当前的代码。</div>
  <div class="sim-step-annotation">Worktree 是 Git 原生能力：在同一仓库下创建独立工作目录，避免 stash/commit 未完成的工作</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">EnterWorktree:<br>- 位置: .claude/worktrees/hotfix-token-expiry<br>- 新分支: hotfix/token-expiry (基于 HEAD)<br>- 当前工作区: 完全不受影响</div>
  <div class="sim-step-annotation">Worktree 在 .claude/worktrees/ 下创建，自动基于 HEAD 创建新分支。原工作目录保持不变</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">工作目录已切换:<br>/project → /project/.claude/worktrees/hotfix-token-expiry<br><br>会话的 CWD 自动更新，所有后续操作在隔离环境中执行</div>
  <div class="sim-step-annotation">CWD 切换是自动的：后续的文件读写、Git 操作都在 worktree 中进行，无需手动管理路径</div>
</div>
<div class="sim-step sim-tool_call">
  <div class="sim-step-header">🔧 Tool Call · Grep</div>
  <div class="sim-step-content">定位问题: src/auth/token.ts<br><br>const TOKEN_EXPIRY = 10; // 秒 ← bug 在这里<br>应该是: 10 * 60 * 60 // 10 小时</div>
  <div class="sim-step-annotation">在隔离的 worktree 中搜索和定位 bug，所有操作与主工作区完全独立</div>
</div>
<div class="sim-step sim-tool_call">
  <div class="sim-step-header">🔧 Tool Call · Edit</div>
  <div class="sim-step-content">修复 src/auth/token.ts:<br>- const TOKEN_EXPIRY = 10;<br>+ const TOKEN_EXPIRY = 10 * 60 * 60; // 10 小时</div>
  <div class="sim-step-annotation">在 worktree 中修改文件，主工作区的同一文件不受影响</div>
</div>
<div class="sim-step sim-tool_result">
  <div class="sim-step-header">✅ Tool Result · Edit</div>
  <div class="sim-step-content">✓ File edited</div>
  <div class="sim-step-annotation">修改只存在于 worktree 分支，主分支的 token.ts 保持原样</div>
</div>
<div class="sim-step sim-tool_call">
  <div class="sim-step-header">🔧 Tool Call · Bash</div>
  <div class="sim-step-content">运行测试: npm test -- --grep 'token expiry'<br><br>✓ token should expire after 10 hours<br>✓ refresh token should work before expiry<br>2 passing (45ms)</div>
  <div class="sim-step-annotation">在隔离环境中运行测试验证修复，确保不引入回归问题</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">Git commit:<br>branch: hotfix/token-expiry<br>message: "fix: set token expiry to 10 hours instead of 10 seconds"<br><br>1 file changed, 1 insertion(+), 1 deletion(-)</div>
  <div class="sim-step-annotation">在 worktree 分支上提交修复。此 commit 独立于主分支，可以直接推送或创建 PR</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">ExitWorktree (action: keep):<br>- 保留 worktree 和分支 hotfix/token-expiry<br>- CWD 恢复到原工作目录<br>- 缓存已清理，会话状态回到主工作区</div>
  <div class="sim-step-annotation">选择 keep 保留 worktree：用户可以后续 review、推送或合并。选择 remove 则清理所有痕迹</div>
</div>
<div class="sim-step sim-assistant_text">
  <div class="sim-step-header">🤖 助手回复</div>
  <div class="sim-step-content">Bug 已修复并提交到 hotfix/token-expiry 分支：<br>- 问题：TOKEN_EXPIRY 设为 10 秒<br>- 修复：改为 10 * 60 * 60（10 小时）<br>- 测试通过，你的当前工作完全没有受影响</div>
  <div class="sim-step-annotation">Worktree 的核心价值：紧急修复不打断当前工作流。修完即走，主工作区纹丝不动</div>
</div>
</div>
