<details>
<summary><strong>设计决策：Harness（完整运行时）而非 Framework（积木）</strong></summary>

Claude Code 是完整的 Harness——权限、沙箱、压缩、持久化、UI 一应俱全——而非像 LangChain 那样提供可组合原语的 Framework。Framework 给你 Chain/Tool/Memory 抽象，Harness 给你生产就绪的运行时，其中约 99% 的代码量是模型之外的基础设施。研究 Harness 能揭示 Framework 不覆盖的问题。

::: tip 替代方案
- Using a framework like LangChain or CrewAI is faster to start but leaves permission control, context compression, prompt caching, and enterprise management as exercises for the developer. The resulting agent may work in demos but fails in production.
:::
</details>

<details>
<summary><strong>设计决策：上下文工程四策略：Write / Select / Compress / Isolate</strong></summary>

所有上下文管理围绕四大策略组织，统一对抗 Context Rot：Write（持久化到窗口之外，对抗遗忘）、Select（选择放入窗口的内容，对抗稀释）、Compress（压缩已有内容，对抗溢出）、Isolate（给子任务独立空间，对抗污染）。这个统一框架将教程的每一课映射到具体的反腐败目的。

::: tip 替代方案
- Treating context management as ad-hoc prompt tweaking misses the systematic nature of the problem. A single strategy (e.g., only RAG retrieval) addresses dilution but ignores overflow and contamination.
:::
</details>

<details>
<summary><strong>设计决策：应用层安全 vs 内核层沙箱</strong></summary>

Claude Code 在应用层使用六级权限瀑布（Hook + 规则 + 分类器 + 用户确认），而 Codex CLI 使用内核层 OS 沙箱（网络拒绝、文件系统只读）。应用层安全更灵活——规则可按工具、路径、项目精细配置——但依赖正确配置。内核层沙箱更刚性但限制了 agent 的能力边界。

::: tip 替代方案
- Kernel-layer sandboxing (Codex CLI approach) provides stronger isolation guarantees but restricts the agent to read-only filesystem and no network access, making interactive development difficult. A hybrid approach is possible but adds complexity.
:::
</details>

<details>
<summary><strong>设计决策：约束悖论：限制 Agent 反而提高生产力</strong></summary>

用规则、反馈循环和 linter 来约束 Agent 的解空间，悖论性地提高了其生产力和可靠性。LangChain 证明仅通过 harness 工程（不换模型）就在 Terminal Bench 2.0 上提升了 13.7 个百分点。这一反直觉发现驱动了 Claude Code 的权限系统、Hooks 和结构化配置设计。

::: tip 替代方案
- Giving the agent maximum freedom (no permission checks, no rules) is simpler to implement but leads to more errors, harder-to-audit behavior, and the self-consistency bias problem where the agent always approves its own output.
:::
</details>
