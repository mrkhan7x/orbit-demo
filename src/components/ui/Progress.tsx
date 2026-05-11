import { cn } from "@/utils/cn";

// ─── Determinate Progress Bar ─────────────────────────────
interface ProgressBarProps {
  value: number;          // 0–100
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  color?: "accent" | "success" | "warning" | "danger" | "auto";
  animated?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  size = "md",
  showLabel = false,
  color = "auto",
  animated = true,
  className,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  const autoColor =
    clamped >= 80 ? "bg-green-500"
    : clamped >= 40 ? "bg-[var(--accent)]"
    : clamped >= 20 ? "bg-yellow-500"
    : "bg-red-500";

  const colorMap = {
    accent:  "bg-[var(--accent)]",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    danger:  "bg-red-500",
    auto:    autoColor,
  };

  const heights = { sm: "h-1", md: "h-1.5", lg: "h-2.5" };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-xs text-[var(--text-muted)]">Progress</span>
          <span className="text-xs font-medium text-[var(--text-primary)]">{clamped}%</span>
        </div>
      )}
      <div className={cn("w-full rounded-full bg-white/5", heights[size])}>
        <div
          className={cn(
            "h-full rounded-full",
            colorMap[color],
            animated && "transition-all duration-700 ease-out"
          )}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

// ─── Progress Ring (circular) ─────────────────────────────
interface ProgressRingProps {
  value: number;          // 0–100
  size?: number;          // diameter in px
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  color?: string;
  className?: string;
}

export function ProgressRing({
  value,
  size = 80,
  strokeWidth = 6,
  label,
  sublabel,
  color = "var(--accent)",
  className,
}: ProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {(label || sublabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {label && <span className="text-sm font-semibold text-[var(--text-primary)]">{label}</span>}
          {sublabel && <span className="text-[10px] text-[var(--text-muted)]">{sublabel}</span>}
        </div>
      )}
    </div>
  );
}

// ─── Spinner (indeterminate) ──────────────────────────────
interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  const sizes = { sm: "w-4 h-4 border-2", md: "w-6 h-6 border-2", lg: "w-8 h-8 border-[3px]" };
  return (
    <div
      className={cn(
        "rounded-full border-white/10 border-t-[var(--accent)] animate-spin",
        sizes[size],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

// ─── Throbber (pulse dots) ────────────────────────────────
export function Throbber({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)} role="status" aria-label="Processing">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse"
          style={{ animationDelay: `${i * 200}ms` }}
        />
      ))}
    </div>
  );
}
