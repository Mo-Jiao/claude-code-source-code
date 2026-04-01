"use client";

import { ArchDiagram } from "@/components/architecture/arch-diagram";
import { DesignDecisions } from "@/components/architecture/design-decisions";
import { DocRenderer } from "@/components/docs/doc-renderer";
import { AgentLoopSimulator } from "@/components/simulator/agent-loop-simulator";
import { ExecutionFlow } from "@/components/architecture/execution-flow";
import { SessionVisualization } from "@/components/visualizations";
import { Tabs } from "@/components/ui/tabs";

interface VersionDetailClientProps {
  version: string;
  diff: {
    from: string;
    to: string;
    newClasses: string[];
    newFunctions: string[];
    newTools: string[];
    locDelta: number;
  } | null;
  source: string;
  filename: string;
}

export function VersionDetailClient({
  version,
  diff,
  source,
  filename,
}: VersionDetailClientProps) {
  const tabs = [
    { id: "learn", label: "Learn" },
    { id: "simulate", label: "Simulate" },
    { id: "deep-dive", label: "Deep Dive" },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Visualization */}
      <SessionVisualization version={version} />

      {/* Tabbed content */}
      <Tabs tabs={tabs} defaultTab="learn">
        {(activeTab) => (
          <>
            {activeTab === "learn" && <DocRenderer version={version} />}
            {activeTab === "simulate" && (
              <AgentLoopSimulator version={version} />
            )}
            {activeTab === "deep-dive" && (
              <div className="space-y-8">
                <section>
                  <h2 className="mb-4 text-xl font-semibold">
                    Execution Flow
                  </h2>
                  <ExecutionFlow version={version} />
                </section>
                <section>
                  <h2 className="mb-4 text-xl font-semibold">
                    Architecture
                  </h2>
                  <ArchDiagram version={version} />
                </section>
                <DesignDecisions version={version} />
              </div>
            )}
          </>
        )}
      </Tabs>
    </div>
  );
}
