"use client";

import { DocRenderer } from "@/components/docs/doc-renderer";
import { AgentLoopSimulator } from "@/components/simulator/agent-loop-simulator";
import { Tabs } from "@/components/ui/tabs";

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

export function LessonDetailClient({ lesson, learn, source, deepDive }: LessonDetailClientProps) {
  return (
    <div className="space-y-6">
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
