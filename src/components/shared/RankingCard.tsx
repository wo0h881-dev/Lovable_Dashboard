import { motion } from "framer-motion";
import { MessageCircle, Star, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlatformBadge } from "./PlatformBadge";
import { RankChange } from "./RankChange";
import { NovelCover } from "./NovelCover";
import { formatViews, type Novel } from "@/data/mockData";

interface Props {
  novel: Novel;
  rank: number;
  onClick?: (novel: Novel) => void;
  variant?: "default" | "compact";
}

export function RankingCard({
  novel,
  rank,
  onClick,
  variant = "default",
}: Props) {
  console.log("RankingCard novel ▶", { rank, novel }); // ✅ 디버그

  const viewsUp = novel.viewsChangePct > 0;

  return (
    <motion.div
      className="ranking-card"
      whileHover={{
        scale: 1.018,
        boxShadow:
          "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px hsl(var(--border))",
      }}
      transition={{ duration: 0.18 }}
      onClick={() => onClick?.(novel)}
    >
      {/* Rank number */}
      <div
        className="flex-shrink-0 flex items-center justify-center bg-surface-elevated px-4"
        style={{ minWidth: 64 }}
      >
        <span
          className={cn(
            "font-mono font-black leading-none",
            rank <= 3 ? "text-4xl" : rank <= 9 ? "text-3xl" : "text-2xl",
            rank === 1 && "text-yellow-400",
            rank === 2 && "text-slate-300",
            rank === 3 && "text-amber-600",
            rank > 3 && "text-muted-foreground",
          )}
        >
          {rank}
        </span>
      </div>

      {/* Cover */}
      <div className="flex-shrink-0 py-3 pl-3">
        <NovelCover novel={novel} size="md" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 px-4 py-3 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-foreground flex-1">
              {novel.title}
            </h3>
            <PlatformBadge
              platform={novel.platform}
              className="flex-shrink-0 mt-0.5"
            />
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground flex-wrap">
            <span>{novel.author}</span>
            <span>·</span>
            <span className="text-primary/80">{novel.genre}</span>
            <span>·</span>
            <span>{novel.publisher}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <RankChange novel={novel} />

          {/* 오늘 조회/평가 */}
          <span
            className={cn(
              "font-mono text-xs font-semibold",
              viewsUp ? "text-up" : "text-down",
            )}
          >
            {formatViews(novel.platform, novel.todayViews)}
            {novel.platform !== "ridi" && (
              <span className="text-muted-foreground font-normal ml-1">
                조회
              </span>
            )}
          </span>

          {variant === "default" && (
            <>
              {/* 평점 */}
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <Star size={10} className="text-yellow-400" />
                <span className="font-mono">{novel.rating}</span>
              </span>

              {/* 댓글 */}
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <MessageCircle size={10} />
                <span className="font-mono">
                  {novel.platform === "ridi"
                    ? "-" // 리디는 댓글 데이터 없음
                    : Number(novel.commentCount ?? 0).toLocaleString("ko-KR")}
                </span>
              </span>

              {/* 회차 */}
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <BookOpen size={10} />
                <span className="font-mono">
                  {novel.episodeCount ? `${novel.episodeCount}화` : "-"}
                </span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Views change indicator on right */}
      <div className="flex-shrink-0 flex items-center pr-4">
        <div className={cn("text-right", viewsUp ? "text-up" : "text-down")}>
          <div className="font-mono text-xs font-bold">
            {viewsUp ? "▲" : "▼"} {Math.abs(novel.viewsChangePct).toFixed(1)}%
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            전일 대비
          </div>
        </div>
      </div>
    </motion.div>
  );
}
