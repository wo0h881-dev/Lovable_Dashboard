import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  value: number | string;
  change?: number;
  icon?: LucideIcon;
  iconColor?: string;
  suffix?: string;
  className?: string;
}

export function KpiCard({ title, value, change, icon: Icon, iconColor, suffix, className }: Props) {
  const isUp   = change !== undefined && change > 0;
  const isDown = change !== undefined && change < 0;

  return (
    <div className={cn("kpi-card", className)}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-muted-foreground font-medium tracking-wide uppercase">{title}</span>
        {Icon && (
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", iconColor ?? "bg-primary/10")}>
            <Icon size={16} className={iconColor ? "text-current" : "text-primary"} />
          </div>
        )}
      </div>

      <div className="flex items-end gap-2">
        <span className="font-mono text-3xl font-bold text-foreground">
          {typeof value === "number" ? value.toLocaleString("ko-KR") : value}
        </span>
        {suffix && <span className="text-sm text-muted-foreground mb-1">{suffix}</span>}
      </div>

      {change !== undefined && (
        <div className={cn("flex items-center gap-1 mt-2 text-xs font-mono font-semibold",
          isUp && "text-up", isDown && "text-down", !isUp && !isDown && "text-muted-foreground"
        )}>
          {isUp ? "▲" : isDown ? "▼" : "–"}
          {Math.abs(change).toFixed(1)}% 전일 대비
        </div>
      )}
    </div>
  );
}
