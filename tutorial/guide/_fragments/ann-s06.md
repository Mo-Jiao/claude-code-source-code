<details>
<summary><strong>设计决策：三层压缩策略</strong></summary>

上下文管理使用三个独立的层次，各有不同的成本收益比。(1) 微压缩每轮都运行，几乎零成本：它截断旧消息中的 tool_result 块，去除不再需要的冗长命令输出。(2) 自动压缩在 token 数超过阈值时触发：调用 LLM 生成对话摘要，代价高但能大幅缩减上下文。(3) 手动压缩由用户触发，用于明确的'重新开始'场景。分层意味着低成本操作持续运行（保持上下文整洁），而高成本操作很少触发（仅在真正需要时）。

::: tip 替代方案
- A single compression strategy (e.g., always summarize at 80% capacity) would be simpler but wasteful -- most of the time, microcompact alone keeps things manageable. A sliding window (drop oldest N messages) is cheap but loses important context. The three-layer approach gives the best token efficiency: cheap cleanup constantly, expensive summarization rarely.
:::
</details>

<details>
<summary><strong>设计决策：最小节省量 = 20,000 Token 才触发压缩</strong></summary>

自动压缩仅在估算节省量（当前 token 数减去预估摘要大小）超过 20,000 token 时才触发。压缩不是免费的：摘要本身会消耗 token，还有生成摘要的 API 调用成本。如果对话只有 25,000 token，压缩可能节省 5,000 token，但需要一次 API 调用，且产出的摘要可能不如原文连贯。20K 的阈值确保只在节省量明显超过开销时才进行压缩。

::: tip 替代方案
- A percentage-based threshold (compress when context is 80% full) adapts to different context window sizes but doesn't account for the fixed cost of generating a summary. A fixed threshold of 10K would compress more aggressively but often isn't worth it. The 20K value was chosen empirically: it's the point where compression savings consistently outweigh the quality loss from summarization.
:::
</details>

<details>
<summary><strong>设计决策：摘要替换全部消息，而非保留部分历史</strong></summary>

自动压缩触发时，生成摘要并替换全部消息历史，不会在摘要旁保留最近的 N 条消息。这避免了一个微妙的连贯性问题：如果同时保留近期消息和旧消息的摘要，模型会看到重叠内容的两种表示。摘要可能说'我们决定使用方案 X'，而近期消息仍在展示讨论过程，产生矛盾信号。干净的摘要是一个连贯的单一叙述。

::: tip 替代方案
- Keeping the last 5-10 messages alongside the summary preserves recent detail and gives the model more to work with. But it creates the overlap problem described above, and makes the total context size less predictable. Some systems use a 'sliding window + summary' approach which works but requires careful tuning of the overlap region.
:::
</details>

<details>
<summary><strong>设计决策：完整对话以 JSONL 格式归档到磁盘</strong></summary>

尽管上下文在内存中被压缩，完整的未压缩对话仍会追加到磁盘上的 JSONL 文件中。每条消息、每次工具调用、每个结果都不会丢失。压缩对内存上下文是有损操作，但对永久记录是无损的。事后分析（调试 agent 行为、计算 token 用量、提取训练数据）始终可以基于完整记录进行。JSONL 格式仅追加写入，对并发写入安全，易于流式处理。

::: tip 替代方案
- Not archiving saves disk space but makes debugging hard -- when the agent makes a mistake, you can't see what it was 'thinking' 200 messages ago because that context was compressed away. Database storage (SQLite) would provide queryability but adds a dependency. JSONL is the simplest format that supports append-only writes and line-by-line processing.
:::
</details>
