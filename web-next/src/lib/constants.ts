export const LESSON_ORDER = [
  "s00", "s01", "s02", "s03", "s04", "s05", "s06", "s07",
  "s08", "s09", "s10", "s11", "s12", "s13", "s14", "s15", "s16",
] as const;

export type LessonId = (typeof LESSON_ORDER)[number];

export type LayerId =
  | "intro"
  | "core"
  | "safety"
  | "context"
  | "planning"
  | "agents"
  | "ecosystem";

export const LESSON_META: Record<
  string,
  {
    title: string;
    subtitle: string;
    keyInsight: string;
    layer: LayerId;
    readingTime: string;
  }
> = {
  s00: {
    title: "Harness Engineering 导论",
    subtitle: "模型之外的一切",
    keyInsight: "99% 的代码不在核心循环里，而在包裹它的 Harness 中",
    layer: "intro",
    readingTime: "10 分钟",
  },
  s01: {
    title: "Agent 循环：一切的起点",
    subtitle: "One loop is all you need",
    keyInsight: "核心循环不到 30 行，但包裹它的 Harness 有 51 万行",
    layer: "core",
    readingTime: "15 分钟",
  },
  s02: {
    title: "工具系统：注册、分发与执行",
    subtitle: "Tools are the hands of the agent",
    keyInsight: "6 个核心工具覆盖 90% 场景，其余按需加载",
    layer: "core",
    readingTime: "20 分钟",
  },
  s03: {
    title: "系统提示词组装：字节级的缓存博弈",
    subtitle: "Every byte counts",
    keyInsight: "静态前置 + 动态后置 = 接近 100% 缓存命中",
    layer: "core",
    readingTime: "15 分钟",
  },
  s04: {
    title: "权限系统：5 种模式与风险分类",
    subtitle: "Deny by default",
    keyInsight: "六级权限瀑布，大多数操作在前 4 级决定",
    layer: "safety",
    readingTime: "20 分钟",
  },
  s05: {
    title: "Hooks：用户可编程的自动化钩子",
    subtitle: "Shell commands as middleware",
    keyInsight: "27 种生命周期事件，每个都可编程拦截",
    layer: "safety",
    readingTime: "15 分钟",
  },
  s06: {
    title: "设置层级：从全局到策略的配置链",
    subtitle: "Configuration as code",
    keyInsight: "四层配置合并 + 企业 managed settings",
    layer: "safety",
    readingTime: "15 分钟",
  },
  s07: {
    title: "上下文压缩：无限对话的秘密",
    subtitle: "Compress or die",
    keyInsight: "三层压缩：micro（零开销）→ auto（AI 摘要）→ manual",
    layer: "context",
    readingTime: "20 分钟",
  },
  s08: {
    title: "Memory 系统：CLAUDE.md 与自动记忆",
    subtitle: "Remember everything",
    keyInsight: "规则类写 CLAUDE.md，事实类写 Auto Memory",
    layer: "context",
    readingTime: "15 分钟",
  },
  s09: {
    title: "Skills：两层知识注入",
    subtitle: "Load on demand",
    keyInsight: "系统提示词只注入名称，按需加载完整定义",
    layer: "context",
    readingTime: "15 分钟",
  },
  s10: {
    title: "Plan 模式：先想后做",
    subtitle: "Think before you act",
    keyInsight: "切换权限而非工具集，保持 prompt cache 稳定",
    layer: "planning",
    readingTime: "15 分钟",
  },
  s11: {
    title: "任务系统：DAG 依赖与进度追踪",
    subtitle: "File-based task graph",
    keyInsight: "文件型 DAG 天然持久化，blocks/blockedBy 双向链接",
    layer: "planning",
    readingTime: "15 分钟",
  },
  s12: {
    title: "子 Agent：干净上下文的委派",
    subtitle: "Clean context per subtask",
    keyInsight: "子 Agent 隔离消息历史，只返回摘要结果",
    layer: "agents",
    readingTime: "20 分钟",
  },
  s13: {
    title: "Agent 团队：生命周期与协议",
    subtitle: "Teammates + mailboxes",
    keyInsight: "文件邮箱实现异步通信，结构化协议管理生命周期",
    layer: "agents",
    readingTime: "20 分钟",
  },
  s14: {
    title: "Worktree：文件隔离与并行开发",
    subtitle: "Isolate by directory",
    keyInsight: "Git worktree 提供文件级隔离，无需容器",
    layer: "agents",
    readingTime: "15 分钟",
  },
  s15: {
    title: "MCP 集成：连接外部世界",
    subtitle: "Tools as a protocol",
    keyInsight: "六种传输 + 企业策略过滤 = 可控的生态扩展",
    layer: "ecosystem",
    readingTime: "20 分钟",
  },
  s16: {
    title: "全景架构：从 CLI 启动到完整交互",
    subtitle: "See the forest, then the trees",
    keyInsight: "一次查询经过 8 个阶段、跨越 16 个子系统",
    layer: "ecosystem",
    readingTime: "15 分钟",
  },
};

export const LAYERS: {
  id: LayerId;
  label: string;
  color: string;
  lessons: string[];
}[] = [
  { id: "intro", label: "导论", color: "#6B7280", lessons: ["s00"] },
  { id: "core", label: "核心循环", color: "#3B82F6", lessons: ["s01", "s02", "s03"] },
  { id: "safety", label: "安全与扩展", color: "#10B981", lessons: ["s04", "s05", "s06"] },
  { id: "context", label: "上下文管理", color: "#8B5CF6", lessons: ["s07", "s08", "s09"] },
  { id: "planning", label: "规划与调度", color: "#F59E0B", lessons: ["s10", "s11"] },
  { id: "agents", label: "Agent 协作", color: "#EF4444", lessons: ["s12", "s13", "s14"] },
  { id: "ecosystem", label: "生态与总结", color: "#14B8A6", lessons: ["s15", "s16"] },
];
