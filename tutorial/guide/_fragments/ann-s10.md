<details>
<summary><strong>设计决策：JSONL 收件箱文件而非共享内存</strong></summary>

每个队友都有自己的收件箱文件（团队目录中的 JSONL 文件）。发送消息意味着向接收者的收件箱文件追加一行 JSON。读取消息意味着读取收件箱文件并追踪上次读到的行。JSONL 天然是仅追加的，这意味着并发写入不会破坏彼此的数据（追加到不同的文件位置）。这在无需共享内存、互斥锁或 IPC 机制的情况下跨进程工作。它也是崩溃安全的：如果写入者在追加中途崩溃，最坏情况是一行不完整的数据，读取者可以跳过。

::: tip 替代方案
- Shared memory (Python multiprocessing.Queue) would be faster but doesn't work if agents are separate processes launched independently. A message broker (Redis, RabbitMQ) provides robust pub/sub but adds infrastructure dependencies. Unix domain sockets would work but are harder to debug (no human-readable message log). JSONL files are the simplest approach that provides persistence, cross-process communication, and debuggability.
:::
</details>

<details>
<summary><strong>设计决策：恰好五种消息类型覆盖所有协调模式</strong></summary>

消息系统恰好支持五种类型：(1) message 用于两个 agent 间的点对点通信；(2) broadcast 用于全团队公告；(3) shutdown_request 用于优雅终止；(4) shutdown_response 用于确认终止；(5) plan_approval_response 用于组长批准或拒绝队友的计划。这五种类型映射到基本协调模式：直接通信、广播、生命周期管理和审批流程。

::: tip 替代方案
- A single generic message type with metadata fields would be more flexible but makes it harder to enforce protocol correctness. Many more types (10+) would provide finer-grained semantics but increase the model's decision burden. Five types is the sweet spot where every type has a clear, distinct purpose.
:::
</details>

<details>
<summary><strong>设计决策：每次 LLM 调用前检查收件箱</strong></summary>

队友在每次 agent 循环迭代的顶部、调用 LLM API 之前检查收件箱文件。这确保了对传入消息的最大响应性：一个终止请求会在一个循环迭代内被看到（通常几秒钟），而非在当前任务完成后（可能数分钟）。收件箱检查成本很低（读取小文件，检查是否有新行），相比 LLM 调用（秒级延迟，数千 token）微不足道。这个位置还意味着传入消息可以影响下一次 LLM 调用——一条'停止 X，转去做 Y'的消息会立即生效。

::: tip 替代方案
- Checking inbox after each tool execution would be more responsive but adds overhead to every tool call, which is more frequent than LLM calls. A separate watcher thread could monitor the inbox continuously but adds threading complexity. Checking once per LLM call is the pragmatic sweet spot: responsive enough for coordination, cheap enough to not impact performance.
:::
</details>
