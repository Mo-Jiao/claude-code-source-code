"use client";

import { DocRenderer } from "@/components/docs/doc-renderer";
import { AgentLoopSimulator } from "@/components/simulator/agent-loop-simulator";
import { Tabs } from "@/components/ui/tabs";
import { LESSON_META, type LessonId } from "@/lib/constants";

interface LessonDetailClientProps {
  lesson: string;
  learn: string;
  source: string;
  deepDive: string;
}

const TABS = [
  { id: "learn", label: "学习" },
  { id: "simulate", label: "模拟" },
  { id: "source", label: "源码" },
  { id: "deep-dive", label: "深入" },
];

const DIAGRAM_MAP: Record<string, string> = {
  s01: "agent-loop",
  s02: "tool-pipeline",
  s03: "prompt-layers",
  s04: "permission-waterfall",
  s05: "hooks",
  s06: "settings",
  s07: "compression",
  s08: "memory",
  s09: "skills",
  s10: "plan",
  s11: "tasks",
  s12: "subagent",
  s14: "worktree",
  s15: "mcp",
  s16: "architecture",
};

export function LessonDetailClient({ lesson, learn, source, deepDive }: LessonDetailClientProps) {
  const diagramName = DIAGRAM_MAP[lesson];

  return (
    <div className="space-y-6">
      {diagramName && (
        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
          <img
            src={`/diagrams/${lesson}-${diagramName}.png`}
            alt={`${LESSON_META[lesson as LessonId]?.title ?? lesson} 架构图`}
            className="w-full"
          />
        </div>
      )}
      <Tabs tabs={TABS} defaultTab="learn">
        {(activeTab) => (
          <>
            {activeTab === "learn" && <DocRenderer content={learn} />}
            {activeTab === "simulate" && <AgentLoopSimulator version={lesson} />}
            {activeTab === "source" && <DocRenderer content={source} />}
            {activeTab === "deep-dive" && <DocRenderer content={deepDive} />}
          </>
        )}
      </Tabs>
    </div>
  );
}
