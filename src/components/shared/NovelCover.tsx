import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Novel } from "@/data/mockData";

interface Props {
  novel: Novel;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-10 h-14",
  md: "w-16 h-[5.625rem]",
  lg: "w-20 h-28",
};

const emojiSizeClasses = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
};

export function NovelCover({ novel, className, size = "md" }: Props) {
  const [imageError, setImageError] = useState(false);
  const hasThumbnail = !!novel.thumbnailUrl && !imageError;

  if (hasThumbnail) {
    return (
      <div
        className={cn(
          "flex-shrink-0 rounded overflow-hidden bg-surface-elevated",
          sizeClasses[size],
          className,
        )}
      >
        <img
          src={novel.thumbnailUrl}
          alt={novel.title}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex-shrink-0 rounded overflow-hidden flex items-center justify-center bg-gradient-to-br",
        novel.coverGradient,
        sizeClasses[size],
        className,
      )}
    >
      <span className={emojiSizeClasses[size]}>
        {novel.coverEmoji}
      </span>
    </div>
  );
}
