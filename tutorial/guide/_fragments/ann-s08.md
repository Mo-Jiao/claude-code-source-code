<details>
<summary><strong>设计决策：用 threading.Queue 作为通知总线</strong></summary>

后台任务结果通过 threading.Queue 传递，而非直接回调。后台线程在工作完成时向队列放入通知，主 agent 循环在每次 LLM 调用前轮询队列。这种解耦很重要：后台线程无需了解主循环的状态或时序，只需往队列放入消息然后继续。主循环按自己的节奏取出消息——永远不会在 API 调用中途或工具执行中途。没有竞争条件，没有回调地狱。

::: tip 替代方案
- Direct callbacks (background thread calls a function in the main thread) would deliver results faster but create thread-safety issues -- the callback might fire while the main thread is in the middle of building a request. Event-driven systems (asyncio, event emitters) work but add complexity. A queue is the simplest thread-safe communication primitive.
:::
</details>

<details>
<summary><strong>设计决策：后台任务以守护线程运行</strong></summary>

后台任务线程以 daemon=True 创建。在 Python 中，守护线程在主线程退出时自动被终止。这防止了一个常见问题：如果主 agent 完成工作并退出，但后台线程仍在运行（等待一个长时间 API 调用或陷入循环），进程会无限挂起。使用守护线程，退出是干净的——主线程结束，所有守护线程自动终止，进程退出。没有僵尸进程，不需要清理代码。

::: tip 替代方案
- Non-daemon threads with explicit cleanup (join with timeout, then terminate) give more control over shutdown but require careful lifecycle management. Process-based parallelism (multiprocessing) provides stronger isolation but higher overhead. Daemon threads are the pragmatic choice: minimal code, correct behavior in the common case.
:::
</details>

<details>
<summary><strong>设计决策：带类型标签的结构化通知格式</strong></summary>

后台任务的通知使用结构化格式：{"type": "attachment", "attachment": {status, result, ...}}，而非纯文本字符串。类型标签让主循环可以区别处理不同通知类型：attachment 可能作为 tool_result 注入对话，而 status_update 可能只更新进度指示器。机器可读的通知还支持程序化过滤（只显示错误、抑制进度更新）和 UI 渲染（将状态显示为进度条而非原始文本）。

::: tip 替代方案
- Plain text notifications are simpler but lose structure. The main loop would have to parse free-form text to determine what happened, which is fragile. A class hierarchy (StatusNotification, ResultNotification, ErrorNotification) is more Pythonic but less portable -- JSON structures work the same way regardless of language or serialization format.
:::
</details>
