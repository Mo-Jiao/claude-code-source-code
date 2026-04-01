export interface SimulatorStep {
  type: "user_message" | "assistant_text" | "tool_call" | "tool_result";
  content: string;
  toolName?: string;
  annotation: string;
}

export interface Scenario {
  version: string; // lesson ID like "s01"
  title: string;
  description: string;
  steps: SimulatorStep[];
}

export interface DocContent {
  id: string;
  learn: string;
  source: string;
  deepDive: string;
}

export interface DocsData {
  docs: DocContent[];
}

export interface FlowNode {
  id: string;
  label: string;
  type: "start" | "process" | "decision" | "subprocess" | "end";
  x: number;
  y: number;
}

export interface FlowEdge {
  from: string;
  to: string;
  label?: string;
}
