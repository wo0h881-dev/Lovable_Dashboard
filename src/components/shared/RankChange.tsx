import { cn } from "@/lib/utils";
import { getRankChangeLabel, type Novel } from "@/data/mockData";

export function RankChange({ novel, className }: { novel: Novel; className?: string }) {
  const { label, type } = getRankChangeLabel(novel);
  return (
    <span
      className={cn(
        "font-mono text-xs font-semibold whitespace-nowrap",
        type === "up"      && "text-up",
        type === "down"    && "text-down",
        type === "new"     && "bg-primary/15 text-primary px-1.5 py-0.5 rounded",
        type === "reentry" && "bg-ridi/20 text-ridi px-1.5 py-0.5 rounded",
        type === "same"    && "text-muted-foreground",
        className
      )}
    >
      {label}
    </span>
  );
}
