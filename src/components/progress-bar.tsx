import { cn } from "@/lib/utils";

const TONE_CLASS = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
} as const;

export function ProgressBar({
  value,
  label,
  tone = "primary",
}: {
  value: number;
  label: string;
  tone?: keyof typeof TONE_CLASS;
}) {
  const percentage = Math.max(0, Math.min(100, value * 100));

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(percentage)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-2 w-full overflow-hidden rounded-full bg-muted/80 ring-1 ring-border/50"
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-700 ease-out",
          TONE_CLASS[tone],
          percentage > 0 && "shadow-[0_0_12px_currentColor]",
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
