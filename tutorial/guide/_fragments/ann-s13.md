<details>
<summary><strong>设计决策：共享任务板 + 隔离执行通道</strong></summary>

团队共享集中在 `.claude/tasks/{teamName}/` 的 TaskList 用于协调，每个队友在自己的进程或 worktree 中执行。这样既保留了全局可见性（谁在做什么、进展如何），又避免在同一目录中并发编辑文件。任务板是规划的唯一数据源，执行通道处理实际工作。

::: tip 替代方案
- A single shared workspace is simpler but causes edit collisions and mixed git state. Fully independent task stores per agent avoid collisions but lose team-level visibility and make planning harder.
:::
</details>

<details>
<summary><strong>设计决策：文件系统邮箱用于 Agent 间通信</strong></summary>

团队成员通过向对方的 inbox 目录写入 JSON 文件通信（`.claude/teams/{name}/inbox/{agent}/`）。无需引入消息队列依赖，天然支持跨进程通信（tmux 队友是独立进程），且消息持久化——崩溃后不丢失。对 in-process 队友有快速路径优化，直接通过 queuePendingMessage 绕过文件系统。

::: tip 替代方案
- An in-memory message queue is faster but cannot cross process boundaries and loses messages on crash. A full message broker (Redis, RabbitMQ) adds infrastructure complexity that is unnecessary for single-machine multi-agent scenarios.
:::
</details>

<details>
<summary><strong>设计决策：多运行时后端：In-Process、Tmux 和 iTerm2</strong></summary>

队友可在进程内运行（共享事件循环、无 IPC 开销）、在 tmux pane 中运行（独立进程、可视化调试）或在 iTerm2 标签页中运行。选择按成员粒度，I/O 密集任务留在进程内提速，CPU 密集或需隔离的任务用 tmux 独立进程。所有后端共享同一套邮箱协议。

::: tip 替代方案
- A single backend simplifies implementation but forces a one-size-fits-all trade-off: in-process cannot provide full isolation, and tmux adds IPC overhead for lightweight tasks. Docker containers provide the strongest isolation but have seconds-long startup and GB-level image costs.
:::
</details>

<details>
<summary><strong>设计决策：请求-响应式关闭而非直接杀进程</strong></summary>

关闭队友需要结构化的 shutdown_request/shutdown_response 握手。队友可以在有未完成工作时拒绝关闭请求。这防止了中断文件写入导致的数据损坏、未提交 git 修改的丢失以及后台 shell 任务变成孤儿进程。队友比 leader 更清楚自己的工作状态。

::: tip 替代方案
- Directly killing the process is simpler and faster but risks corrupted files, lost git state, and orphan processes. A timeout-based forced kill after a grace period is a middle ground but still lacks the ability for the agent to negotiate.
:::
</details>

<details>
<summary><strong>设计决策：IDLE 是正常状态，不是错误</strong></summary>

与完成即退出的子 agent（s12）不同，团队成员完成任务后进入 IDLE 状态等待新消息。这避免了长期协作者频繁创建/销毁的开销。只有显式的 shutdown_request 才触发关闭流程，使生命周期确定且可观测。

::: tip 替代方案
- Auto-exiting after each task (sub-agent model) is simpler but causes repeated spawn overhead and loses accumulated context. Always-running without an IDLE concept wastes resources and makes it hard to distinguish between 'waiting for work' and 'stuck'.
:::
</details>
