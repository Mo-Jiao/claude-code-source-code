"use client";

import { useSimulator } from "@/hooks/useSimulator";
import { SimulatorMessage } from "./simulator-message";
import type { SimulatorStep } from "@/types/agent-data";
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";

import s01 from "@/data/scenarios/s01.json";
import s02 from "@/data/scenarios/s02.json";
import s03 from "@/data/scenarios/s03.json";
import s04 from "@/data/scenarios/s04.json";
import s05 from "@/data/scenarios/s05.json";
import s07 from "@/data/scenarios/s07.json";
import s08 from "@/data/scenarios/s08.json";
import s09 from "@/data/scenarios/s09.json";
import s10 from "@/data/scenarios/s10.json";
import s06 from "@/data/scenarios/s06.json";
import s11 from "@/data/scenarios/s11.json";
import s12 from "@/data/scenarios/s12.json";

import type { Scenario } from "@/types/agent-data";

const SCENARIOS: Record<string, Scenario> = {
  s01: s01 as unknown as Scenario,
  s02: s02 as unknown as Scenario,
  s03: s03 as unknown as Scenario,
  s04: s04 as unknown as Scenario,
  s05: s05 as unknown as Scenario,
  s06: s06 as unknown as Scenario,
  s07: s07 as unknown as Scenario,
  s08: s08 as unknown as Scenario,
  s09: s09 as unknown as Scenario,
  s10: s10 as unknown as Scenario,
  s11: s11 as unknown as Scenario,
  s12: s12 as unknown as Scenario,
};

interface AgentLoopSimulatorProps {
  version: string;
}

function SimulatorInner({ scenario }: { scenario: { title: string; description: string; steps: SimulatorStep[] } }) {
  const {
    visibleSteps,
    currentIndex,
    totalSteps,
    isPlaying,
    isComplete,
    play,
    pause,
    stepForward,
    reset,
    speed,
    setSpeed,
  } = useSimulator(scenario.steps);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
        <h3 className="font-semibold">{scenario.title}</h3>
        <p className="mt-1 text-sm text-zinc-500">{scenario.description}</p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {isPlaying ? (
          <button onClick={pause} className="rounded-md bg-zinc-100 p-2 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700">
            <Pause size={16} />
          </button>
        ) : (
          <button onClick={isComplete ? reset : play} className="rounded-md bg-zinc-100 p-2 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700">
            {isComplete ? <RotateCcw size={16} /> : <Play size={16} />}
          </button>
        )}
        <button onClick={stepForward} disabled={isComplete} className="rounded-md bg-zinc-100 p-2 hover:bg-zinc-200 disabled:opacity-50 dark:bg-zinc-800 dark:hover:bg-zinc-700">
          <SkipForward size={16} />
        </button>
        <button onClick={reset} className="rounded-md bg-zinc-100 p-2 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700">
          <RotateCcw size={16} />
        </button>

        {/* Speed */}
        <div className="ml-auto flex items-center gap-1 text-xs text-zinc-500">
          {[0.5, 1, 2].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`rounded px-2 py-1 ${speed === s ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "bg-zinc-100 dark:bg-zinc-800"}`}
            >
              {s}x
            </button>
          ))}
        </div>

        <span className="text-xs text-zinc-500">
          {currentIndex + 1} / {totalSteps}
        </span>
      </div>

      {/* Messages */}
      <div className="space-y-3">
        {visibleSteps.map((step, i) => (
          <SimulatorMessage key={i} step={step} index={i} />
        ))}
        {currentIndex === -1 && (
          <div className="py-8 text-center text-sm text-zinc-400">
            点击播放按钮开始模拟
          </div>
        )}
      </div>
    </div>
  );
}

export function AgentLoopSimulator({ version }: AgentLoopSimulatorProps) {
  const scenario = SCENARIOS[version];

  if (!scenario) {
    return (
      <div className="rounded-lg border border-zinc-200 p-8 text-center text-zinc-500 dark:border-zinc-700">
        本课暂无模拟场景
      </div>
    );
  }

  return <SimulatorInner scenario={scenario} />;
}
