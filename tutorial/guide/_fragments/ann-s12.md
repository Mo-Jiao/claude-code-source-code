<details>
<summary><strong>设计决策：共享任务板 + 隔离执行通道</strong></summary>

任务板继续集中在 `.tasks/`，而文件改动发生在按任务划分的 worktree 目录中。这样既保留了全局可见性（谁在做什么、完成到哪），又避免所有人同时写同一目录导致冲突。协调层简单（一个任务板），执行层安全（多条隔离通道）。

::: tip 替代方案
- A single shared workspace is simpler but causes edit collisions and mixed git state. Fully independent task stores per lane avoid collisions but lose team-level visibility and make planning harder.
:::
</details>

<details>
<summary><strong>设计决策：显式 worktree 生命周期索引</strong></summary>

`.worktrees/index.json` 记录每个 worktree 的名称、路径、分支、task_id 与状态。即使上下文压缩或进程重启，这些生命周期状态仍可检查和恢复。它也为 list/status/remove 提供了确定性的本地数据源。

::: tip 替代方案
- Relying only on `git worktree list` removes local bookkeeping but loses task binding metadata and custom lifecycle states. Keeping all state only in memory is simpler in code but breaks recoverability.
:::
</details>

<details>
<summary><strong>设计决策：按通道 cwd 路由 + 禁止重入</strong></summary>

命令通过 `worktree_run(name, command)` 使用 `cwd` 参数路由到 worktree 目录。重入保护避免了在已激活的 worktree 上下文中意外二次进入，保持生命周期归属清晰。

::: tip 替代方案
- Global cwd mutation is easy to implement but can leak context across parallel work. Allowing silent re-entry makes lifecycle ownership ambiguous and complicates teardown behavior.
:::
</details>

<details>
<summary><strong>设计决策：追加式生命周期事件流</strong></summary>

生命周期事件写入 `.worktrees/events.jsonl`（如 `worktree.create.*`、`worktree.remove.*`、`task.completed`）。这样状态迁移可查询、可追踪，失败也会以 `*.failed` 显式暴露，而不是静默丢失。

::: tip 替代方案
- Relying only on console logs is lighter but fragile during long sessions and hard to audit. A full event bus infrastructure is powerful but heavier than needed for this teaching baseline.
:::
</details>

<details>
<summary><strong>设计决策：任务与工作区一起收尾</strong></summary>

`worktree_remove(..., complete_task=true)` 允许在一个动作里完成收尾：删除隔离目录并把绑定任务标记为 completed。收尾保持为显式工具驱动迁移（`worktree_keep` / `worktree_remove`），而不是隐藏的自动清理。这样可减少状态悬挂（任务已完成但临时工作区仍活跃，或反过来）。

::: tip 替代方案
- Keeping closeout fully manual gives flexibility but increases operational drift. Fully automatic removal on every completion risks deleting a workspace before final review.
:::
</details>

<details>
<summary><strong>设计决策：事件流是观测旁路，不是状态机替身</strong></summary>

生命周期事件提升可审计性，但真实状态源仍是任务/工作区状态文件。事件更适合做迁移轨迹，而不是替代主状态机。

::: tip 替代方案
- Using logs alone hides structured transitions; using events as the only state source risks drift when replay/repair semantics are undefined.
:::
</details>
