<details>
<summary><strong>设计决策：MCP 标准协议而非直接工具集成</strong></summary>

Claude Code 使用 MCP（Model Context Protocol）作为外部工具的标准化接口，而非将每个集成直接写入代码库。一个 MCP 服务器编写一次即可在 Claude Code、Cursor、Zed、Windsurf 中使用。协议提供服务发现、安全边界（独立进程）和灵活部署（本地 stdio 或远程 HTTP）。代价是协议开销，收益是生态效应。

::: tip 替代方案
- Direct in-codebase tool integration gives maximum performance and deep integration but requires a new release for every tool addition. A custom plugin protocol avoids the per-release problem but fragments the ecosystem. Raw function calling has no discovery or registration mechanism.
:::
</details>

<details>
<summary><strong>设计决策：双下划线命名空间工具名：mcp__{server}__{tool}</strong></summary>

MCP 工具使用 `mcp__{server}__{tool}` 命名约定映射为 Claude Code 内部工具格式。服务器名和工具名经过归一化（特殊字符替换为下划线）以确保合法标识符。这防止了不同服务器工具间的名称冲突，并使工具来源可追溯。双下划线是已知限制——服务器名不能包含 `__`。

::: tip 替代方案
- Flat tool names without namespacing risk collisions when two MCP servers expose tools with the same name. Using a registry-based approach adds complexity. Prefixing with the server URL would be unique but creates unwieldy tool names.
:::
</details>

<details>
<summary><strong>设计决策：通过 alwaysLoad 和 searchHint 注解实现延迟加载</strong></summary>

大型 MCP 服务器可能暴露 50-200 个工具。全部加载 schema 到上下文窗口浪费 token。标记 `_meta['anthropic/alwaysLoad']` 的工具立即加载，其余通过 `_meta['anthropic/searchHint']` 经 ToolSearch 按需发现。这保持上下文窗口精简的同时保留对完整工具目录的按需访问。

::: tip 替代方案
- Loading all tools eagerly wastes context tokens and reduces prompt cache hit rate. Loading none requires the model to guess tool names. A middle ground of loading the top-N tools by frequency requires usage analytics infrastructure.
:::
</details>

<details>
<summary><strong>设计决策：企业 MCP 配置是排他的：覆盖所有其他来源</strong></summary>

当 `managed-mcp.json` 存在时，所有其他 MCP 配置来源（用户、项目、本地、插件、claude.ai）被完全忽略。这给企业 IT 管理员提供了对员工可用 MCP 服务器的绝对控制。结合 allowedMcpServers/deniedMcpServers 策略过滤（拒绝始终优先），为受监管环境提供完整的安全边界。

::: tip 替代方案
- Merging enterprise config with other sources preserves user flexibility but weakens IT control. A per-server override model is more granular but harder to audit. No enterprise control at all blocks adoption in regulated industries.
:::
</details>

<details>
<summary><strong>设计决策：分级连接并发：本地 3，远程 20</strong></summary>

本地 MCP 服务器（stdio）限制 3 个并发连接，因为每个都需要 spawn 子进程。远程服务器（http/sse）允许 20 个并发，因为只是 HTTP 请求。这种实际划分适配了典型开发者配置（1-5 个本地服务器）同时支持云连接器场景（30+ 个远程服务器），不阻塞启动。

::: tip 替代方案
- A single concurrency limit forces either too few remote connections (slow startup with many cloud connectors) or too many local subprocesses (resource exhaustion). Unlimited concurrency risks fork-bombing on machines with many stdio servers configured.
:::
</details>
