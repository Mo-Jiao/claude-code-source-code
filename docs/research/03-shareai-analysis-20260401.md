# shareAI-lab/learn-claude-code 竞品分析

**日期:** 2026-04-01
**仓库:** https://github.com/shareAI-lab/learn-claude-code
**本地克隆:** /tmp/learn-claude-code/

## 仓库结构

```
learn-claude-code/
├── agents/          # 13 个可运行 Python agent（118→782 行递增）
├── docs/zh/         # 12 课中文文档
├── web/             # Next.js 交互平台
│   └── src/
│       ├── components/   # Tab 切换、模拟器、Diff 对比等
│       ├── app/          # 页面路由
│       └── types/        # 数据类型
├── skills/          # 教学用 SKILL.md 文件
└── tests/           # 测试文件
```

## 每课固定结构模板

1. **标题行**: `# s0X: 英文名 (中文名)`
2. **进度导航条**: `s01 > s02 > [ s03 ] > s04 > ...`
3. **格言引用**: 一句话核心思想 (blockquote)
4. **Harness 层标注**: 本课在 harness 体系中的定位
5. **问题** (`## 问题`): 描述痛点 (2-4 句)
6. **解决方案** (`## 解决方案`): ASCII 架构图 + 说明
7. **工作原理** (`## 工作原理`): 分步骤 + 代码片段
8. **变更表** (`## 相对 sXX 的变更`): Diff 表格
9. **试一试** (`## 试一试`): 3-5 个可运行 prompt

## Web 平台亮点（Next.js）

### 四 Tab 切换
- **学习**: 主要课程内容
- **模拟**: Agent 循环模拟器（可播放/暂停/调速）
- **源码**: 对应 Python 文件查看
- **深入探索**: 扩展阅读

### 交互组件
- Agent 循环模拟器：步进动画展示 Tool Call → Tool Result
- 变更对比（Diff）视图
- 彩色分类侧边栏
- 进度导航

## 数据统计

| 指标 | shareAI | 我们 |
|------|---------|------|
| 课程数 | 12 | 16 (+s00 导论) |
| 文档总行数 | ~1,393 | ~13,230 |
| 图片数 | 0 (纯 ASCII) | 7 张 Excalidraw PNG |
| 可运行代码 | 4,619 行 Python | 无（伪代码） |
| 技术栈 | Next.js + React | VitePress + Vue |
| 语言支持 | en/zh/ja | zh |

## 他们做得好的（可借鉴）

1. **递进式架构设计**: 每课只加一个机制，变更表标出增量
2. **"问题→方案"驱动**: 先痛点再方案，零废话
3. **可运行代码 1:1**: 不是伪代码，是真能跑的 agent
4. **设计哲学输出**: "Agent 是模型，不是框架"品牌标识
5. **ASCII 图代替图片**: 维护成本低，版本控制友好

## 他们缺什么（我们的差异化）

1. **零图片**: 复杂流程缺乏直观理解
2. **无源码级深度剖析**: 教学重写 ≠ 逆向分析真实源码
3. **缺 "Why" 讨论**: 偏 what & how，少 why not
4. **无性能/成本分析**: 无 token 消耗量化
5. **覆盖面窄**: 缺 MCP、权限治理、Hooks、prompt 缓存
6. **无安全讨论**: 无 ToxicSkills、Memory Poisoning 等
