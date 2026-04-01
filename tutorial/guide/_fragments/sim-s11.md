<div class="simulator-container">
<h4>DAG 任务调度</h4>
<p class="sim-description">文件型任务系统通过 blocks/blockedBy 双向链接实现依赖管理和进度追踪</p>
<div class="sim-step sim-user_message">
  <div class="sim-step-header">👤 用户消息</div>
  <div class="sim-step-content">帮我实现用户认证系统，包括登录、注册、权限中间件和测试</div>
  <div class="sim-step-annotation">复杂任务需要拆解为多个子任务</div>
</div>
<div class="sim-step sim-assistant_text">
  <div class="sim-step-header">🤖 助手回复</div>
  <div class="sim-step-content">我来拆解任务并建立依赖关系。</div>
  <div class="sim-step-annotation">Agent 决定使用任务系统管理复杂工作</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">TaskCreate:<br>  #1 「定义用户数据模型」 status=pending<br>  #2 「实现注册接口」     status=pending, blockedBy=[#1]<br>  #3 「实现登录接口」     status=pending, blockedBy=[#1]<br>  #4 「权限中间件」       status=pending, blockedBy=[#2, #3]<br>  #5 「集成测试」         status=pending, blockedBy=[#4]</div>
  <div class="sim-step-annotation">5 个任务形成 DAG：#1 是根节点，#5 是叶节点</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">调度决策:<br>  可执行: #1 (无依赖)<br>  阻塞中: #2, #3 (等待 #1)<br>  阻塞中: #4 (等待 #2, #3)<br>  阻塞中: #5 (等待 #4)</div>
  <div class="sim-step-annotation">只有 blockedBy 为空的任务可以开始</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">TaskUpdate: #1 → in_progress</div>
  <div class="sim-step-annotation">开始第一个可执行任务</div>
</div>
<div class="sim-step sim-tool_call">
  <div class="sim-step-header">🔧 Tool Call · Write</div>
  <div class="sim-step-content">创建 src/models/user.ts</div>
  <div class="sim-step-annotation">实现用户数据模型</div>
</div>
<div class="sim-step sim-tool_result">
  <div class="sim-step-header">✅ Tool Result · Write</div>
  <div class="sim-step-content">✓ File created</div>
  <div class="sim-step-annotation">任务 #1 完成</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">TaskUpdate: #1 → completed<br>依赖解除: #2, #3 的 blockedBy 移除 #1<br>新的可执行任务: #2, #3 (可并行)</div>
  <div class="sim-step-annotation">完成任务自动解除下游依赖</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">TaskUpdate: #2 → in_progress<br>（#3 也可执行，但单 Agent 串行处理）</div>
  <div class="sim-step-annotation">单 Agent 按序执行；多 Agent 团队可并行</div>
</div>
<div class="sim-step sim-assistant_text">
  <div class="sim-step-header">🤖 助手回复</div>
  <div class="sim-step-content">数据模型已完成。现在实现注册接口，然后是登录接口。</div>
  <div class="sim-step-annotation">任务进度通过文件持久化，会话中断后可恢复</div>
</div>
</div>
