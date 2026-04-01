<div class="simulator-container">
<h4>团队协作</h4>
<p class="sim-description">父 Agent 创建团队，多个子 Agent 通过任务 DAG 协作完成复杂项目</p>
<div class="sim-step sim-user_message">
  <div class="sim-step-header">👤 用户消息</div>
  <div class="sim-step-content">帮我实现一个完整的用户注册功能，包括前端表单、后端 API 和数据库迁移</div>
  <div class="sim-step-annotation">任务涉及前端、后端、数据库三个独立模块，天然适合团队协作模式</div>
</div>
<div class="sim-step sim-assistant_text">
  <div class="sim-step-header">🤖 助手回复</div>
  <div class="sim-step-content">这个任务涉及多个独立模块，我来创建一个团队并行处理。</div>
  <div class="sim-step-annotation">Agent 识别出任务可分解为多个独立子任务，决定启用团队模式而非串行处理</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">创建团队:<br>- 团队名: user-registration<br>- 成员: frontend-agent, backend-agent<br>- 协调者: 父 Agent 自身<br>- 通信方式: 基于文件的消息传递</div>
  <div class="sim-step-annotation">团队创建时指定成员角色和通信协议。父 Agent 作为协调者负责任务分配和结果聚合</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">构建任务 DAG:<br>1. [db-migration] 创建 users 表 → 无依赖<br>2. [backend-api] 实现 /api/register → 依赖 db-migration<br>3. [frontend-form] 实现注册表单 → 依赖 backend-api 的接口定义</div>
  <div class="sim-step-annotation">任务 DAG 确定执行顺序：数据库迁移无依赖可立即开始，API 和表单有先后依赖关系</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">派发任务:<br>- backend-agent 认领 [db-migration]（无依赖，立即启动）<br>- frontend-agent 等待 [backend-api] 的接口定义后启动</div>
  <div class="sim-step-annotation">基于 DAG 依赖关系调度：无依赖任务立即启动，有依赖任务进入等待队列</div>
</div>
<div class="sim-step sim-tool_call">
  <div class="sim-step-header">🔧 Tool Call · Write</div>
  <div class="sim-step-content">[backend-agent] 创建数据库迁移文件:<br>CREATE TABLE users (<br>  id UUID PRIMARY KEY,<br>  email VARCHAR(255) UNIQUE,<br>  password_hash VARCHAR(255)<br>);</div>
  <div class="sim-step-annotation">backend-agent 在独立上下文中完成数据库迁移，不受其他成员工作干扰</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">backend-agent → 团队消息:<br>"db-migration 完成，users 表已创建。开始实现 /api/register，接口定义: POST /api/register { email, password } → { id, token }"</div>
  <div class="sim-step-annotation">成员通过消息传递共享关键信息。接口定义通过消息广播，frontend-agent 可提前开始工作</div>
</div>
<div class="sim-step sim-tool_call">
  <div class="sim-step-header">🔧 Tool Call · Write</div>
  <div class="sim-step-content">[frontend-agent] 收到接口定义，开始实现注册表单:<br>- React 组件 RegisterForm.tsx<br>- 表单验证: email 格式、密码强度<br>- 调用 POST /api/register</div>
  <div class="sim-step-annotation">frontend-agent 收到消息后立即启动，与 backend-agent 实现 API 逻辑并行工作</div>
</div>
<div class="sim-step sim-tool_call">
  <div class="sim-step-header">🔧 Tool Call · Write</div>
  <div class="sim-step-content">[backend-agent] 实现 /api/register:<br>- 密码 bcrypt 哈希<br>- 邮箱唯一性校验<br>- 返回 JWT token</div>
  <div class="sim-step-annotation">两个 Agent 此时真正并行：backend 写 API 逻辑，frontend 写表单组件</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">任务完成状态:<br>✓ [db-migration] backend-agent 完成<br>✓ [backend-api] backend-agent 完成<br>✓ [frontend-form] frontend-agent 完成<br><br>所有 DAG 节点已完成</div>
  <div class="sim-step-annotation">父 Agent 跟踪 DAG 中每个节点的完成状态，所有节点完成后进入关闭流程</div>
</div>
<div class="sim-step sim-system_event">
  <div class="sim-step-header">⚙️ 系统事件</div>
  <div class="sim-step-content">团队关闭协议:<br>1. 收集所有成员的工作摘要<br>2. 验证跨模块一致性（API 接口 ↔ 前端调用）<br>3. 释放子 Agent 资源<br>4. 团队 user-registration 已解散</div>
  <div class="sim-step-annotation">关闭协议确保工作一致性：父 Agent 在解散前检查各成员产出是否兼容</div>
</div>
<div class="sim-step sim-assistant_text">
  <div class="sim-step-header">🤖 助手回复</div>
  <div class="sim-step-content">注册功能已完成：<br>- 数据库: users 表迁移文件已创建<br>- 后端: POST /api/register 已实现（含密码哈希和 JWT）<br>- 前端: RegisterForm 组件已实现（含表单验证）</div>
  <div class="sim-step-annotation">父 Agent 汇总团队成果，向用户报告。用户只看到最终结果，不需要关心团队协调细节</div>
</div>
</div>
