import { cn } from "@/lib/utils";
import type { Platform } from "@/data/mockData";

interface Props {
  platform: Platform;
  size?: "sm" | "md";
  className?: string;
}

const labels: Record<Platform, string> = { naver: "네이버", kakao: "카카오", ridi: "리디" };

export function PlatformBadge({ platform, size = "sm", className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-bold tracking-tight rounded",
        size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1",
        platform === "naver" && "badge-naver",
        platform === "kakao" && "badge-kakao",
        platform === "ridi"  && "badge-ridi",
        className
      )}
    >
      {labels[platform]}
    </span>
  );
}
