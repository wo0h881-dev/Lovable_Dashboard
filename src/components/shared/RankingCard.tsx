// src/components/shared/RankingCard.tsx
import { motion } from "framer-motion";
import { MessageCircle, Star, BookOpen, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlatformBadge } from "./PlatformBadge";
import { RankChange } from "./RankChange";
import { NovelCover } from "./NovelCover";
import { type Novel, type Platform } from "@/data/mockData";

interface Props {
  novel: Novel;
  rank: number;
  onClick?: (novel: Novel) => void;
  variant?: "default" | "compact";
}

function toKoreanUnit(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "-";
  const eok = 100_000_000;
  const man = 10_000;
  if (n >= eok) {
    const val = n / eok;
    return `${val.toFixed(1).replace(/\.0$/, "")}억`;
  }
  if (n >= man) {
    const manVal = n / man;
    if (manVal < 100) return `${manVal.toFixed(1).replace(/\.0$/, "")}만`;
    return `${Math.round(manVal).toLocaleString("ko-KR")}만`;
  }
  return n.toLocaleString("ko-KR");
}

function formatViews(platform: Platform, views: number): string {
  const v = Number(views ?? 0);
  if (!Number.isFinite(v) || v <= 0) return "-";
  if (platform === "ridi") return v.toLocaleString("ko-KR") + " 평가";
  return toKoreanUnit(v);
}

function formatComments(value: string | number | null | undefined): string {
  if (value == null) return "-";
  let n: number;
  if (typeof value === "number") {
    n = value;
  } else {
    const s = String(value).trim();
    if (!s) return "-";
    if (/^\d{1,3}(,\d{3})*$/.test(s)) n = Number(s.replace(/,/g, ""));
    else if (s.endsWith("억")) n = (Number(s.replace("억", "").replace(/,/g, "")) || 0) * 100_000_000;
    else if (s.endsWith("만")) n = (Number(s.replace("만", "").replace(/,/g, "")) || 0) * 10_000;
    else n = Number(s.replace(/,/g, ""));
  }
  if (!Number.isFinite(n) || n <= 0) return "-";
  return toKoreanUnit(n);
}

export function RankingCard({ novel, rank, onClick, variant = "default" }: Props) {
  const viewsUp = novel.viewsChangePct > 0;
  const timeFreeLabel =
    novel.promotion?.timeFreeType === "threeHour" ? "3다무" :
    novel.promotion?.timeFreeType === "waitFree" ? "기다무" : null;

  return (
    <motion.div
      className="ranking-card"
      whileHover={{ scale: 1.018, boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px hsl(var(--border))" }}
      transition={{ duration: 0.18 }}
      onClick={() => onClick?.(novel)}
    >
      {/* 순위 번호 */}
      <div className="flex-shrink-0 flex items-center justify-center bg-surface-elevated px-4" style={{ minWidth: 64 }}>
        <span className={cn(
          "font-mono font-black leading-none",
          rank <= 3 ? "text-4xl" : rank <= 9 ? "text-3xl" : "text-2xl",
          rank === 1 && "text-yellow-400",
          rank === 2 && "text-slate-300",
          rank === 3 && "text-amber-600",
          rank > 3 && "text-muted-foreground",
        )}>
          {rank}
        </span>
      </div>

      {/* 커버 (기다무 뱃지 제거 — 제목 옆으로 이동) */}
      <div className="flex-shrink-0 py-3 pl-3">
        <NovelCover novel={novel} size="md" />
      </div>

      {/* 내용 */}
      <div className="flex-1 min-w-0 px-4 py-3 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* 제목 + 기다무/3다무 뱃지 */}
              <div className="flex items-start gap-1.5 flex-wrap">
                <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-foreground">
                  {novel.title}
                </h3>
                {timeFreeLabel && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-black shrink-0 mt-0.5">
                    <Zap size={9} />
                    {timeFreeLabel}
                  </span>
                )}
              </div>
            </div>
            <PlatformBadge platform={novel.platform} className="flex-shrink-0 mt-0.5" />
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground flex-wrap">
            <span>{novel.author}</span>
            <span>·</span>
            <span className="text-primary/80">{novel.genre}</span>
            <span>·</span>
            <span>{novel.publisher}</span>
            {novel.todayRank && (
              <>
                <span>·</span>
                <span className="font-mono font-bold text-foreground">#{novel.todayRank}위</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <RankChange novel={novel} />
          <span className={cn("font-mono text-xs font-semibold", viewsUp ? "text-up" : "text-down")}>
            {formatViews(novel.platform, novel.todayViews)}
          </span>
          {variant === "default" && (
            <>
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <Star size={10} className="text-yellow-400" />
                <span className="font-mono">{novel.rating}</span>
              </span>
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <MessageCircle size={10} />
                <span className="font-mono">{novel.platform === "ridi" ? "-" : formatComments(novel.commentCount)}</span>
              </span>
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <BookOpen size={10} />
                <span className="font-mono">{novel.episodeCount ? `${novel.episodeCount}화` : "-"}</span>
              </span>
            </>
          )}
        </div>
      </div>

       {/* 증감률 + 순위변화 */}
      <div className="flex-shrink-0 flex items-center pr-4 gap-3">
        {/* 순위변화 */}
        <div className="text-right">
          <RankChange novel={novel} />
          <div className="text-[10px] text-muted-foreground mt-0.5 text-right">
            순위변화
          </div>
        </div>
        {/* 증감률 */}
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
