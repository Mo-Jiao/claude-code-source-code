<details>
<summary><strong>设计决策：任务存储为 JSON 文件，而非内存</strong></summary>

任务以 JSON 文件形式持久化在 .tasks/ 目录中，而非保存在内存里。这有三个关键好处：(1) 任务在进程崩溃后仍然存在——如果 agent 在任务中途崩溃，重启后任务板仍在磁盘上；(2) 多个 agent 可以读写同一任务目录，无需共享内存即可实现多代理协调；(3) 人类可以查看和手动编辑任务文件来调试。文件系统就是共享数据库。

::: tip 替代方案
- In-memory storage (like v2's TodoWrite) is simpler and faster but loses state on crash and doesn't work across multiple agent processes. A proper database (SQLite, Redis) would provide ACID guarantees and better concurrency, but adds a dependency and operational complexity. Files are the zero-dependency persistence layer that works everywhere.
:::
</details>

<details>
<summary><strong>设计决策：任务具有 blocks/blockedBy 依赖字段</strong></summary>

每个任务可以声明它阻塞哪些任务（下游依赖）以及它被哪些任务阻塞（上游依赖）。Agent 不会开始有未解决 blockedBy 依赖的任务。这对多代理协调至关重要：当 Agent A 在编写数据库 schema、Agent B 需要写查询时，Agent B 的任务被 Agent A 的任务阻塞。没有依赖关系，两个 agent 可能同时开始，而 Agent B 会针对一个尚不存在的 schema 工作。

::: tip 替代方案
- Simple priority ordering (high/medium/low) doesn't capture 'task B literally cannot start until task A finishes.' A centralized coordinator that assigns tasks in order would work but creates a single point of failure and bottleneck. Declarative dependencies let each agent independently determine what it can work on by reading the task files.
:::
</details>

<details>
<summary><strong>设计决策：Task 为课程主线，Todo 仍有适用场景</strong></summary>

TaskManager 延续了 Todo 的心智模型，并在本课程 s07 之后成为默认主线。两者都管理带状态的任务项，但 TaskManager 增加了文件持久化（崩溃后可恢复）、依赖追踪（blocks/blockedBy）、owner 字段与多进程协作能力。Todo 仍适合短、线性、一次性的轻量跟踪。

::: tip 替代方案
- Using only Todo keeps the model minimal but weak for long-running or collaborative work. Using only Task everywhere maximizes consistency but can feel heavy for tiny one-off tasks.
:::
</details>

<details>
<summary><strong>设计决策：持久化仍需要写入纪律</strong></summary>

文件持久化能降低上下文丢失，但不会自动消除并发写入风险。写任务状态前应先重读 JSON、校验 `status/blockedBy` 是否符合预期，再原子写回，避免不同 agent 悄悄覆盖彼此状态。

::: tip 替代方案
- Blind overwrite writes are simpler but can corrupt coordination state under parallel execution. A database with optimistic locking would enforce stronger safety, but the course keeps file-based state for zero-dependency teaching.
:::
</details>
