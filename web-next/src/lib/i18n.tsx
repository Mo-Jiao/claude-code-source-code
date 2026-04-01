"use client";

// Stub i18n: returns English strings from a static map, no locale switching.

const messages: Record<string, Record<string, string>> = {
  viz: {
    s01: "The Agent While-Loop",
    s02: "Tool Dispatch Map",
    s03: "TodoWrite Nag System",
    s04: "Subagent Context Isolation",
    s05: "On-Demand Skill Loading",
    s06: "Three-Layer Context Compression",
    s07: "Task Dependency Graph",
    s08: "Background Task Lanes",
    s09: "Agent Team Mailboxes",
    s10: "FSM Team Protocols",
    s11: "Autonomous Agent Cycle",
    s12: "Worktree Task Isolation",
  },
  version: {
    tab_learn: "Learn",
    tab_simulate: "Simulate",
    tab_code: "Code",
    tab_deep_dive: "Deep Dive",
    execution_flow: "Execution Flow",
    architecture: "Architecture",
    design_decisions: "Design Decisions",
    alternatives: "Alternatives Considered",
    tools: "tools",
    prev: "Previous",
    next: "Next",
  },
  sim: {
    play: "Play",
    pause: "Pause",
    step: "Step",
    reset: "Reset",
    speed: "Speed",
    step_of: "of",
  },
};

export function useTranslations(namespace?: string) {
  return (key: string) => {
    if (namespace && messages[namespace]) {
      return messages[namespace][key] || key;
    }
    return key;
  };
}

export function useLocale() {
  return "en";
}
