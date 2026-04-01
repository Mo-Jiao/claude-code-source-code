<details>
<summary><strong>设计决策：用 Git Worktree 而非 Docker 容器实现文件隔离</strong></summary>

Claude Code 使用 `git worktree add` 创建共享 .git 对象库的轻量级工作副本。创建耗时约 100ms（Docker 需要秒级），磁盘开销极小（只有工作文件，无镜像），无需复杂的网络/卷映射配置。对于防止多 agent 文件冲突这个具体问题，文件级隔离已经足够，进程和网络隔离是过度工程。

::: tip 替代方案
- Docker containers provide full process and network isolation but have 2-10s startup, GB-level image costs, and complex configuration. Sandboxed filesystems (Codex approach) are stronger but more restrictive. No isolation at all (Cursor approach) works for single-user but fails with concurrent agents.
:::
</details>

<details>
<summary><strong>设计决策：Fail-Closed 删除：状态不明时拒绝删除</strong></summary>

ExitWorktreeTool 在 git status 或 git rev-list 命令失败（无法确定状态）时拒绝删除 worktree。误删的代价（丢失数小时工作）远大于多保留一个 worktree 的代价（几 MB 磁盘）。陈旧的 worktree 由定期清理机制回收。

::: tip 替代方案
- Fail-open deletion (delete even when state is uncertain) risks destroying user work. Requiring manual cleanup only is safe but accumulates disk waste over time. A timeout-based approach adds complexity without clear benefit.
:::
</details>

<details>
<summary><strong>设计决策：.worktreeinclude：复制 gitignored 文件到 Worktree</strong></summary>

`.worktreeinclude` 文件列出应被复制到新 worktree 的 gitignored 文件（如 `.env.local`、编译缓存）。许多项目缺少这些文件就无法运行，所以裸 worktree 是无用的。该文件使用 glob 模式，在创建后设置阶段处理。

::: tip 替代方案
- Not copying any gitignored files keeps worktrees clean but makes them non-functional for many projects. Copying all gitignored files wastes disk and may include large build artifacts. Symlinking works for some files but not for files that need independent copies (like .env with different configs).
:::
</details>

<details>
<summary><strong>设计决策：findCanonicalGitRoot 防止 Worktree 嵌套堆积</strong></summary>

Agent worktree 始终使用 `findCanonicalGitRoot`（回溯到真正的主仓库根目录）而非 `findGitRoot`（可能返回 worktree 的 .git 指针目录）。这确保所有 worktree 平铺在 `<主仓库>/.claude/worktrees/` 下，避免嵌套 worktree 逃脱定期清理以及父 worktree 被删时连带删除子 worktree。

::: tip 替代方案
- Using `findGitRoot` would create worktrees under the current worktree's `.claude/worktrees/` — invisible to the main cleanup scanner, and risking cascade deletion. Allowing arbitrary nesting adds complexity to the cleanup algorithm.
:::
</details>

<details>
<summary><strong>设计决策：基于模式匹配的清理仅针对临时 Worktree</strong></summary>

陈旧 worktree 清理仅匹配特定临时模式（`agent-a*`、`wf_*`、`bridge-*`），永远不触碰用户命名的 worktree。结合修改时间检查、git status 验证（无未提交修改）和未推送提交检查，提供四层安全网。`-uno` 标志忽略 untracked 文件，因为 30 天前的 agent worktree 中的 untracked 文件几乎肯定是构建产物。

::: tip 替代方案
- Cleaning all old worktrees indiscriminately risks deleting user-created worktrees with valuable work. Never cleaning requires manual management and accumulates disk waste. A single-layer check (mtime only) is not safe enough — a worktree might be old but have uncommitted changes.
:::
</details>
