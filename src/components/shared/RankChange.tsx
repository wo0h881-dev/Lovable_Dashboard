// src/components/shared/RankChange.tsx
import { cn } from "@/lib/utils";
import { getRankChangeLabel, type Novel } from "@/data/mockData";

export function RankChange({ novel, className }: { novel: Novel; className?: string }) {
  const { label, type } = getRankChangeLabel(novel);
  return (
    <span
      className={cn(
        "font-mono text-xs font-bold px-1.5 py-0.5 rounded whitespace-nowrap",
        // 상승: 진한 빨간 배경 + 흰 글씨
        type === "up"      && "bg-red-600 text-white",
        // 하락: 진한 파란 배경 + 흰 글씨
        type === "down"    && "bg-blue-600 text-white",
        // NEW: 초록 배경
        type === "new"     && "bg-primary/20 text-primary border border-primary/30",
        // 재진입: 파란 배경
        type === "reentry" && "bg-ridi/20 text-ridi border border-ridi/30",
        // 유지: 회색 텍스트만
        type === "same"    && "text-muted-foreground",
        className
      )}
    >
      {label}
    </span>
  );
}
