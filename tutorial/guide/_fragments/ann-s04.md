<details>
<summary><strong>设计决策：子代理获得全新上下文，而非共享历史</strong></summary>

当父代理通过 Task 工具创建子代理时，子代理从全新的消息历史开始，只包含系统提示词和委派的任务描述，不继承父代理的对话。这就是上下文隔离：子代理可以完全专注于特定子任务，不会被父代理长达数百条消息的对话干扰。结果作为单条 tool_result 返回给父代理，将子代理可能数十轮的交互压缩为一个简洁的回答。

::: tip 替代方案
- Sharing the parent's full context would give the subagent more information, but it would also flood the subagent with irrelevant details. Context window is finite -- filling it with parent history leaves less room for the subagent's own work. Fork-based approaches (copy the parent context) are a middle ground but still waste tokens on irrelevant history.
:::
</details>

<details>
<summary><strong>设计决策：Explore 代理不能写入文件</strong></summary>

创建 Explore 类型的子代理时，它只获得只读工具：bash（有限制）、read_file 和搜索工具，不能调用 write_file 或 edit_file。这实现了最小权限原则：一个被委派'查找函数 X 所有使用位置'的代理不需要写权限。移除写工具消除了探索过程中误修改文件的风险，同时缩小了工具空间，让模型在更少的选项中做出更好的决策。

::: tip 替代方案
- Giving all subagents full tool access is simpler to implement but violates least privilege. A permission-request system (subagent asks parent for write access) adds complexity and latency. Static tool filtering by role is the pragmatic middle ground -- simple to implement, effective at preventing accidents.
:::
</details>

<details>
<summary><strong>设计决策：子代理不能再创建子代理</strong></summary>

Task 工具不包含在子代理的工具集中。子代理必须直接完成工作，不能继续委派。这防止了无限委派循环：没有这个约束，一个代理可能创建子代理，子代理又创建子代理，每一层都用略微不同的措辞重新委派同一任务，消耗 token 却毫无进展。一层委派足以处理绝大多数场景。如果任务对单个子代理来说太复杂，应该由父代理重新分解。

::: tip 替代方案
- Allowing recursive delegation (bounded by depth) would handle deeply nested tasks but adds complexity and the risk of runaway token consumption. In practice, single-level delegation covers most real-world coding tasks. Multi-level delegation is addressed in later versions (v6+) through persistent team structures instead of recursive spawning.
:::
</details>
