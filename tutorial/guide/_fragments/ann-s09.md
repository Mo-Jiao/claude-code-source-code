<details>
<summary><strong>设计决策：持久化队友 vs 一次性 Subagent</strong></summary>

在 s04 中，Subagent 是临时的：创建、执行一个任务、返回结果、销毁。它们的知识随之消亡。在 s09 中，队友是具有身份（名称、角色）和配置文件的持久化线程。队友可以完成任务 A，然后被分配任务 B，并携带之前学到的所有知识。持久化队友积累项目知识，理解已建立的模式，不需要为每个任务重新阅读相同的文件。

::: tip 替代方案
- One-shot subagents (s04 style) are simpler and provide perfect context isolation -- no risk of one task's context polluting another. But the re-learning cost is high: every new task starts from zero. A middle ground (subagents with shared memory/knowledge base) was considered but adds complexity without the full benefit of persistent identity and state.
:::
</details>

<details>
<summary><strong>设计决策：团队配置持久化到 .teams/{name}/config.json</strong></summary>

团队结构（成员名称、角色、agent ID）存储在 JSON 配置文件中，而非任何 agent 的内存中。任何 agent 都可以通过读取配置文件发现队友——无需发现服务或共享内存。如果 agent 崩溃并重启，它读取配置即可知道团队中还有谁。这与 s07 的理念一致：文件系统就是协调层。配置文件人类可读，便于手动添加或移除团队成员、调试团队配置问题。

::: tip 替代方案
- In-memory team registries are faster but don't survive process restarts and require a central process to maintain. Service discovery (like DNS or a discovery server) is more robust at scale but overkill for a local multi-agent system. File-based config is the simplest approach that works across independent processes.
:::
</details>

<details>
<summary><strong>设计决策：队友获得工具子集，组长获得全部工具</strong></summary>

团队组长获得 ALL_TOOLS（包括 spawn、send、read_inbox 等），而队友获得 TEAMMATE_TOOLS（专注于任务执行的精简工具集）。这强制了清晰的职责分离：队友专注于做事（编码、测试、研究），组长专注于协调（创建任务、分配工作、管理沟通）。给队友协调工具会让他们创建自己的子团队或重新分配任务，破坏组长维持连贯计划的能力。

::: tip 替代方案
- Giving all agents identical tools is simpler and more egalitarian, but in practice leads to coordination chaos -- multiple agents trying to manage each other, creating conflicting task assignments. Static role-based filtering is predictable and easy to reason about.
:::
</details>
