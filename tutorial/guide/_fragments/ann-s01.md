<details>
<summary><strong>设计决策：为什么仅靠 Bash 就够了</strong></summary>

Bash 能读写文件、运行任意程序、在进程间传递数据、管理文件系统。任何额外的工具（read_file、write_file 等）都只是 bash 已有能力的子集。增加工具并不会解锁新能力，只会增加模型需要理解的接口。模型只需学习一个工具的 schema，实现代码不超过 100 行。这就是最小可行 agent：一个工具，一个循环。

::: tip 替代方案
- We could have started with a richer toolset (file I/O, HTTP, database), but that would obscure the core insight: an LLM with a shell is already a general-purpose agent. Starting minimal also makes it obvious what each subsequent version actually adds.
:::
</details>

<details>
<summary><strong>设计决策：用递归进程创建实现子代理机制</strong></summary>

当 agent 执行 `python v0.py "subtask"` 时，它会创建一个全新的进程，拥有全新的 LLM 上下文。这个子进程实际上就是一个子代理：有自己的系统提示词、对话历史和任务焦点。子进程完成后，父进程通过 stdout 获取结果。这就是不依赖任何框架的子代理委派——纯粹的 Unix 进程语义。每个子进程天然隔离关注点，因为它根本看不到父进程的上下文。

::: tip 替代方案
- A framework-level subagent system (like v3's Task tool) gives more control over what tools the subagent can access and how results are returned. But at v0, the point is to show that process spawning is the most primitive form of agent delegation -- no shared memory, no message passing, just stdin/stdout.
:::
</details>

<details>
<summary><strong>设计决策：没有规划框架——由模型自行决策</strong></summary>

没有规划器，没有任务队列，没有状态机。系统提示词告诉模型如何处理问题，模型根据对话历史决定下一步执行什么 bash 命令。这是有意为之的：在这个层级，添加规划层属于过早抽象。模型的思维链本身就是计划。agent 循环只是不断询问模型下一步做什么，直到模型不再请求工具为止。

::: tip 替代方案
- Later versions (v2) add explicit planning via TodoWrite. But v0 proves that implicit planning through the model's reasoning is sufficient for many tasks. The planning framework only becomes necessary when you need external visibility into the agent's intentions.
:::
</details>
