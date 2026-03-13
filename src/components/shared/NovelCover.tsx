import { cn } from "@/lib/utils";
import type { Novel } from "@/data/mockData";

interface Props {
  novel: Novel;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = { sm: "w-10 h-14", md: "w-16 h-22", lg: "w-20 h-28" };

export function NovelCover({ novel, className, size = "md" }: Props) {
  const style =
    size === "md"
      ? { width: 64, height: 90 }
      : size === "lg"
      ? { width: 80, height: 112 }
      : { width: 40, height: 56 };

  // ✅ 썸네일 있으면 이미지 우선
  if (novel.thumbnailUrl) {
    return (
      <div
        className={cn(
          "flex-shrink-0 rounded overflow-hidden",
          sizes[size],
          className
        )}
        style={style}
      >
        <img
          src={novel.thumbnailUrl}
          alt={novel.title}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // ✅ 썸네일 없으면 기존 그라데이션 + 이모지
  return (
    <div
      className={cn(
        "flex-shrink-0 rounded overflow-hidden flex items-center justify-center",
        `bg-gradient-to-br ${novel.coverGradient}`,
        sizes[size],
        className
      )}
      style={style}
    >
      <span
        className={cn(
          size === "sm"
            ? "text-lg"
            : size === "md"
            ? "text-2xl"
            : "text-3xl"
        )}
      >
        {novel.coverEmoji}
      </span>
    </div>
  );
}
