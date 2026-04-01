<details>
<summary><strong>设计决策：轮询未认领任务而非事件驱动通知</strong></summary>

自主队友每隔约 1 秒轮询共享任务板以寻找未认领的任务，而非等待事件驱动的通知。轮询从根本上比发布/订阅更简单：没有订阅管理、没有事件路由、没有事件丢失的 bug。在基于文件的持久化下，轮询就是'读取目录列表'——一个低成本操作，无论有多少 agent 在运行都能正常工作。1 秒的间隔平衡了响应性（新任务被快速发现）和文件系统开销（不会过度读取磁盘）。

::: tip 替代方案
- Event-driven notification (file watchers via inotify/fsevents, or a pub/sub channel) would reduce latency from seconds to milliseconds. But file watchers are platform-specific and unreliable across network filesystems. A message broker would work but adds infrastructure. For a system where tasks take minutes to complete, discovering new tasks in 1 second instead of 10 milliseconds makes no practical difference.
:::
</details>

<details>
<summary><strong>设计决策：空闲 60 秒后自动终止</strong></summary>

当自主队友没有任务可做且收件箱中没有消息时，它最多等待 60 秒后放弃并关闭。这防止了永远等待不会到来的工作的僵尸队友——这在组长忘记发送关闭请求、或所有剩余任务都被外部事件阻塞时是真实存在的问题。60 秒窗口足够长，不会因为任务完成到新任务创建之间的短暂间隔而导致过早关闭；又足够短，不会让闲置队友浪费资源。

::: tip 替代方案
- No timeout (wait forever) risks zombie processes. A very short timeout (5s) causes premature exits when the lead is simply thinking or typing. A heartbeat system (lead periodically pings teammates to keep them alive) works but adds protocol complexity. The 60-second fixed timeout is a good default that balances false-positive exits against resource waste.
:::
</details>

<details>
<summary><strong>设计决策：上下文压缩后重新注入队友身份</strong></summary>

自动压缩对话时，生成的摘要会丢失关键元数据：队友的名称、所属团队和 agent_id。没有这些信息，队友无法认领任务（任务按名称归属）、无法检查收件箱（收件箱文件以 agent_id 为键）、也无法在消息中表明身份。因此每次自动压缩后，系统会向对话中重新注入一个结构化的身份块：'你是 [team] 团队的 [name]，你的 agent_id 是 [id]，你的收件箱在 [path]。'这是队友在记忆丢失后保持功能所需的最小上下文。

::: tip 替代方案
- Putting identity in the system prompt (which survives compression) would avoid this problem, but violates the cache-friendly static-system-prompt design from s05. Embedding identity in the summary prompt ('when summarizing, always include your name and team') is unreliable -- the LLM might omit it. Explicit post-compression injection is deterministic and guaranteed to work.
:::
</details>
