<details>
<summary><strong>设计决策：Skill 通过 tool_result 注入，而非系统提示词</strong></summary>

当 agent 调用 Skill 工具时，Skill 内容（SKILL.md 文件）作为 tool_result 在用户消息中返回，而非注入系统提示词。这是一个刻意的缓存优化：系统提示词在各轮次间保持静态，API 提供商可以缓存它（Anthropic 的 prompt caching、OpenAI 的 system message caching）。如果 Skill 内容在系统提示词中，每次加载新 Skill 都会使缓存失效。将动态内容放在 tool_result 中，既保持了昂贵的系统提示词可缓存，又让 Skill 知识进入了上下文。

::: tip 替代方案
- Injecting skills into the system prompt is simpler and gives skills higher priority in the model's attention. But it breaks prompt caching (every skill load creates a new system prompt variant) and bloats the system prompt over time as skills accumulate. The tool_result approach keeps things cache-friendly at the cost of slightly lower attention priority.
:::
</details>

<details>
<summary><strong>设计决策：按需加载 Skill 而非预加载</strong></summary>

Skill 不会在启动时加载。Agent 初始只拥有 Skill 名称和描述（来自 frontmatter）。当 agent 判断需要特定 Skill 时，调用 Skill 工具将完整的 SKILL.md 内容加载到上下文中。这保持了初始提示词的精简。一个正在修复 Python bug 的 agent 不需要加载 Kubernetes 部署 Skill——那会浪费上下文窗口空间，还可能用无关指令干扰模型。

::: tip 替代方案
- Loading all skills upfront guarantees the model always has all knowledge available, but wastes tokens on irrelevant skills and may hit context limits. A recommendation system (model suggests skills, human approves) adds latency. Lazy loading lets the model self-serve the knowledge it needs, when it needs it.
:::
</details>

<details>
<summary><strong>设计决策：SKILL.md 采用 YAML Frontmatter + Markdown 正文</strong></summary>

每个 SKILL.md 文件有两部分：YAML frontmatter（名称、描述、globs）和 markdown 正文（实际指令）。Frontmatter 作为 Skill 注册表的元数据——当 agent 问'有哪些可用 Skill'时，展示的就是这些信息。正文是按需加载的有效负载。这种分离意味着可以列出 100 个 Skill（每个只读几字节的 frontmatter）而不必加载 100 套完整指令集（每套可能数千 token）。

::: tip 替代方案
- A separate metadata file (skill.yaml + skill.md) would work but doubles the number of files. Embedding metadata in the markdown (as headings or comments) requires parsing the full file to extract metadata. Frontmatter is a well-established convention (Jekyll, Hugo, Astro) that keeps metadata and content co-located but separately parseable.
:::
</details>
