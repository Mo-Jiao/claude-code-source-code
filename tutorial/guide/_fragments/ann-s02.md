<details>
<summary><strong>设计决策：为什么恰好四个工具</strong></summary>

四个工具分别是 bash、read_file、write_file 和 edit_file，覆盖了大约 95% 的编程任务。Bash 处理执行和任意命令；read_file 提供带行号的精确文件读取；write_file 创建或覆盖文件；edit_file 做精确的字符串替换。工具越多，模型的认知负担越重——它必须在更多选项中做选择，选错的概率也随之增加。更少的工具也意味着更少的 schema 需要维护、更少的边界情况需要处理。

::: tip 替代方案
- We could add specialized tools (list_directory, search_files, http_request), and later versions do. But at this stage, bash already covers those use cases. The split from v0's single tool to v1's four tools is specifically about giving the model structured I/O for file operations, where bash's quoting and escaping often trips up the model.
:::
</details>

<details>
<summary><strong>设计决策：模型本身就是代理</strong></summary>

核心 agent 循环极其简单：不断调用 LLM，如果返回 tool_use 块就执行并回传结果，如果只返回文本就停止。没有路由器，没有决策树，没有工作流引擎。模型自己决定做什么、何时停止、如何从错误中恢复。代码只是连接模型和工具的管道。这是一种设计哲学：agent 行为从模型中涌现，而非由框架定义。

::: tip 替代方案
- Many agent frameworks add elaborate orchestration layers: ReAct loops with explicit Thought/Action/Observation parsing, LangChain-style chains, AutoGPT-style goal decomposition. These frameworks assume the model needs scaffolding to behave as an agent. Our approach assumes the model already knows how to be an agent -- it just needs tools to act on the world.
:::
</details>

<details>
<summary><strong>设计决策：每个工具都有 JSON Schema</strong></summary>

每个工具都为输入参数定义了严格的 JSON schema。例如，edit_file 要求 old_string 和 new_string 是精确的字符串，而非正则表达式。这消除了一整类错误：模型无法传递格式错误的输入，因为 API 会在执行前校验 schema。这也使模型的意图变得明确——当它用特定字符串调用 edit_file 时，不存在关于它想修改什么的解析歧义。

::: tip 替代方案
- Some agent systems let the model output free-form text that gets parsed with regex or heuristics (e.g., extracting code from markdown blocks). This is fragile -- the model might format output slightly differently and break the parser. JSON schemas trade flexibility for reliability.
:::
</details>
