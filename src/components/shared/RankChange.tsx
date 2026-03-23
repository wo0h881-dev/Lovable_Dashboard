// src/components/shared/RankChange.tsx
import { cn } from "@/lib/utils";
import { getRankChangeLabel, type Novel } from "@/data/mockData";

export function RankChange({ novel, className }: { novel: Novel; className?: string }) {
  const { label, type } = getRankChangeLabel(novel);
  return (
    <span
      className={cn(
        "font-mono text-xs font-bold px-1.5 py-0.5 rounded whitespace-nowrap",
        // bg-up(빨강)/bg-down(파랑) 배경 유지 + 흰 글씨로 가독성 확보
        type === "up"      && "bg-red-600 text-white",
        type === "down"    && "bg-blue-600 text-white",
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
