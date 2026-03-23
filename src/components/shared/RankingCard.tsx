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
  if (n >= eok) return `${(n / eok).toFixed(1).replace(/\.0$/, "")}억`;
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
  if (typeof value === "number") { n = value; }
  else {
    const s = String(value).trim();
    if (!s) return "-";
    if (/^\d{1,3}(,\d{3})*$/.test(s)) n = Number(s.replace(/,/g, ""));
    else if (s.endsWith("억")) n = (Number(s.replace("억","").replace(/,/g,""))||0)*100_000_000;
    else if (s.endsWith("만")) n = (Number(s.replace("만","").replace(/,/g,""))||0)*10_000;
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
      whileHover={{ scale: 1.018, boxShadow: "0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px hsl(var(--border))" }}
      transition={{ duration: 0.18 }}
      onClick={() => onClick?.(novel)}
    >
      {/* 순위 번호 */}
      <div className="flex-shrink-0 flex items-center justify-center bg-surface-elevated px-4" style={{ minWidth: 64 }}>
        <span className={cn(
          "font-mono font-black leading-none",
          rank <= 3 ? "text-4xl" : rank <= 9 ? "text-3xl" : "text-2xl",
          rank === 1 && "text-yellow-400",
          rank === 2 && "text-slate-400",
          rank === 3 && "text-amber-600",
          rank > 3 && "text-muted-foreground",
        )}>
          {rank}
        </span>
      </div>

      {/* 커버 + 오늘 순위 뱃지 (썸네일 상단) */}
      <div className="flex-shrink-0 py-3 pl-3 relative">
        <NovelCover novel={novel} size="md" />
        {/* 오늘 순위 — 썸네일 상단 중앙 */}
        {novel.todayRank != null && (
          <span className="absolute top-1.5 left-3 right-0 flex justify-center pointer-events-none">
            <span className="font-mono font-black text-[10px] px-1.5 py-0.5 rounded-md bg-black/70 text-white leading-none shadow">
              #{novel.todayRank}
            </span>
          </span>
        )}
        {/* 기다무/3다무 — 썸네일 하단 */}
        {timeFreeLabel && (
          <span className="absolute bottom-1.5 left-3 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-400 text-black shadow">
            <Zap size={8} />{timeFreeLabel}
          </span>
        )}
      </div>

      {/* 내용 */}
      <div className="flex-1 min-w-0 px-4 py-3 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-foreground flex-1">
              {novel.title}
            </h3>
            <PlatformBadge platform={novel.platform} className="flex-shrink-0 mt-0.5" />
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground flex-wrap">
            <span>{novel.author}</span>
            <span className="opacity-40">·</span>
            <span className="text-primary/80">{novel.genre}</span>
            <span className="opacity-40">·</span>
            <span>{novel.publisher}</span>
          </div>
        </div>

        {/* 하단 지표: 순위변화 + 조회수 + 기타 */}
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

      {/* 우측: 증감률 */}
      <div className="flex-shrink-0 flex items-center pr-4">
        <div className={cn("text-right", viewsUp ? "text-up" : "text-down")}>
          <div className="font-mono text-xs font-bold">
            {viewsUp ? "▲" : "▼"} {Math.abs(novel.viewsChangePct).toFixed(1)}%
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">전일 대비</div>
        </div>
      </div>
    </motion.div>
  );
}
