# ⚠️ 已废弃 — Claude Code 教程交互式学习平台

> **本项目已废弃。** 所有内容（模拟器场景、设计决策注解、可视化图表）已迁移至 VitePress 教程站 `tutorial/`。
>
> 请访问：[Claude Code 源码解读](https://dailingyun.github.io/claude-code-source-code/)

---

基于 Next.js 的交互式学习平台（已废弃），配合 `tutorial/guide/` 的 17 节课程使用。

## 功能
- 交互式模拟器：模拟 Claude Code 的工具调用、权限请求等场景
- 设计决策注解：每课核心架构决策的多语言解读
- 源码可视化：关键流程的交互式图表

## 开发
```bash
npm install
npm run dev     # 开发模式
npm run build   # 静态导出到 out/
```

## 目录结构
- `src/data/scenarios/` — 模拟器场景定义 (s01-s16)
- `src/data/annotations/` — 设计决策注解数据
- `src/components/` — React 组件
- `scripts/` — 内容提取和构建脚本
