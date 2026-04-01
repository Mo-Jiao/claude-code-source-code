import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(
  defineConfig({
    title: 'Claude Code 源码解读',
    description: '从源码理解第一梯队 AI Agent 的工程架构',
    lang: 'zh-CN',
    base: '/claude-code-source-code/',
    lastUpdated: true,
    ignoreDeadLinks: true,

    themeConfig: {
      nav: [
        { text: '教程', link: '/guide/' },
        { text: '源码索引', link: '/reference/source-map' },
      ],

      sidebar: {
        '/guide/': [
          {
            text: '学习路径',
            link: '/guide/',
          },
          {
            text: '导论',
            items: [
              { text: 's00 — Harness Engineering', link: '/guide/s00-harness-engineering' },
            ],
          },
          {
            text: '第一层：核心引擎',
            items: [
              { text: 's01 — Agent 循环', link: '/guide/s01-agent-loop' },
              { text: 's02 — 工具系统', link: '/guide/s02-tools' },
              { text: 's03 — 系统提示词', link: '/guide/s03-system-prompt' },
            ],
          },
          {
            text: '第二层：安全与控制',
            items: [
              { text: 's04 — 权限系统', link: '/guide/s04-permissions' },
              { text: 's05 — Hooks', link: '/guide/s05-hooks' },
              { text: 's06 — 设置层级', link: '/guide/s06-settings' },
            ],
          },
          {
            text: '第三层：智能与记忆',
            items: [
              { text: 's07 — 上下文压缩', link: '/guide/s07-compact' },
              { text: 's08 — Memory 系统', link: '/guide/s08-memory' },
              { text: 's09 — Skills', link: '/guide/s09-skills' },
            ],
          },
          {
            text: '第四层：规划与任务',
            items: [
              { text: 's10 — Plan 模式', link: '/guide/s10-plan-mode' },
              { text: 's11 — 任务系统', link: '/guide/s11-tasks' },
            ],
          },
          {
            text: '第五层：多 Agent 协作',
            items: [
              { text: 's12 — 子 Agent', link: '/guide/s12-subagents' },
              { text: 's13 — Agent 团队', link: '/guide/s13-teams' },
              { text: 's14 — Worktree', link: '/guide/s14-worktree' },
            ],
          },
          {
            text: '第六层：生态与全景',
            items: [
              { text: 's15 — MCP 集成', link: '/guide/s15-mcp' },
              { text: 's16 — 全景架构', link: '/guide/s16-architecture' },
            ],
          },
        ],
      },

      outline: {
        level: [2, 3],
        label: '目录',
      },

      lastUpdated: {
        text: '最后更新',
      },

      search: {
        provider: 'local',
      },
    },
  })
)
