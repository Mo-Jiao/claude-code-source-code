import { cn } from "@/lib/utils";

const LAYER_COLORS = {
  intro:
    "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  core:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  safety:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  context:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  planning:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  agents:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  ecosystem:
    "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
} as const;

interface BadgeProps {
  layer: keyof typeof LAYER_COLORS;
  children: React.ReactNode;
  className?: string;
}

export function LayerBadge({ layer, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        LAYER_COLORS[layer],
        className
      )}
    >
      {children}
    </span>
  );
}
