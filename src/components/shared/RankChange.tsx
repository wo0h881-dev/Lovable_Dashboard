import { cn } from "@/lib/utils";
import { getRankChangeLabel, type Novel } from "@/data/mockData";

export function RankChange({ novel, className }: { novel: Novel; className?: string }) {
  const { label, type } = getRankChangeLabel(novel);
  return (
    <span
      className={cn(
        "font-mono text-xs font-semibold px-1.5 py-0.5 rounded",
        type === "up"      && "text-up bg-up",
        type === "down"    && "text-down bg-down",
        type === "new"     && "bg-naver/20 text-naver",
        type === "reentry" && "bg-ridi/20 text-ridi",
        type === "same"    && "text-muted-foreground",
        className
      )}
    >
      {label}
    </span>
  );
}
