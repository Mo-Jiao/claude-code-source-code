<details>
<summary><strong>设计决策：并行启动副作用：MDM + Keychain + 模块加载</strong></summary>

main.tsx 的前几行在 135ms 模块加载开始前就启动了 MDM 子进程读取和 Keychain 预取。三个独立操作并发执行——模块加载完成时子进程大概率已完成。如未完成，显式 await 函数仅在实际需要结果时阻塞。这将子进程完整延迟从关键启动路径上移除。

::: tip 替代方案
- Sequential startup (load modules, then read MDM, then fetch keychain) adds 200-400ms of avoidable latency. Lazy initialization on first use avoids startup cost but introduces unpredictable latency spikes during the first user interaction.
:::
</details>

<details>
<summary><strong>设计决策：热路径 vs 冷路径：优化 Agent 循环而非异常分支</strong></summary>

Agent 循环（callModel → 流式接收 → 工具执行 → 追加消息）每轮都执行，是热路径——Prompt Cache 命中率和流式延迟在此至关重要。Auto-compact、Skill 匹配和 Memory 检索是冷路径，仅在特定条件下触发。性能优化聚焦热路径；冷路径操作如 compact 可以较慢但不影响整体体验。

::: tip 替代方案
- Treating all code paths equally leads to premature optimization of rarely-executed code. Optimizing only cold paths (e.g., making compact faster) has minimal user impact since it rarely runs. Ignoring the hot path distinction makes it hard to prioritize engineering effort.
:::
</details>

<details>
<summary><strong>设计决策：分层系统提示词实现接近 100% 的缓存命中率</strong></summary>

六层系统提示词将稳定内容（环境、工具描述、角色）放在动态内容（CLAUDE.md、记忆、条件规则）之前。缓存断点设在稳定层之后，使前约 80% 的 token 几乎总是命中 Prompt Cache。与无缓存相比，20 轮对话中输入 token 成本降低约 7 倍。分层不仅是内容组织——更是缓存优化策略。

::: tip 替代方案
- A flat system prompt invalidates the entire cache whenever any part changes (CLAUDE.md edit, tool list update). Putting dynamic content first would still break the cache on every change. No caching at all means linear cost growth with conversation length.
:::
</details>

<details>
<summary><strong>设计决策：主动推理（工具调用）而非被动检索（RAG）</strong></summary>

Claude Code 没有向量数据库、没有 embedding 索引、没有 RAG 管道。搜索能力作为工具暴露（Grep、Glob、Read），让模型自己决定何时搜索、搜什么、如何组合结果。这支持多跳搜索策略和基于中间结果的调整——单次 RAG 检索无法做到。代价是更多 API 调用，收益是复杂查询下显著更高的结果质量。

::: tip 替代方案
- RAG (embedding-based retrieval + generation) is cheaper per query but limited to single-hop search with no ability to refine strategy based on intermediate results. A hybrid approach combining RAG for initial retrieval with tool-based follow-up adds complexity. Pure RAG fails at multi-hop reasoning like 'when was this bug introduced?'.
:::
</details>

<details>
<summary><strong>设计决策：苦涩教训哲学：模型进步时删除脚手架</strong></summary>

Claude Code 没有 AST 解析器、没有 RAG 管道、没有语法检查器、没有代码模板——模型通过原生能力和基础工具处理所有这些。每次新模型发布，团队审查并删除为弥补旧模型不足而添加的脚手架代码。这与大多数不断添加工程组件的 agent 框架方向相反。赌注是：模型会持续进步，干净的工具接口加优秀的 harness 会比任何定制方案更持久。

::: tip 替代方案
- Building specialized components (AST parser, RAG, linters) provides immediate accuracy gains but creates maintenance burden and may become obsolete when the next model handles those tasks natively. The risk of the bitter lesson approach is underperformance with current models while waiting for future improvements.
:::
</details>
