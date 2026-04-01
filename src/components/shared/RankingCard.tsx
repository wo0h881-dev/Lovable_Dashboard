// src/components/shared/RankingCard.tsx
import { motion } from "framer-motion";
import {
  MessageCircle,
  Star,
  BookOpen,
  Clock,
} from "lucide-react";
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

// ── 플랫폼별 프로모션 색상 ────────────────────────────────
function getPromoStyle(platform: Platform) {
  if (platform === "naver") {
    return {
      bg: "bg-naver/15",
      text: "text-naver",
      border: "border-naver/30",
    };
  }
  if (platform === "ridi") {
    return {
      bg: "bg-ridi/15",
      text: "text-ridi",
      border: "border-ridi/30",
    };
  }
  return {
    bg: "bg-amber-400/20",
    text: "text-amber-600",
    border: "border-amber-400/40",
  };
}

function getPrimaryPromoLabel(novel: Novel): string | null {
  const t = novel.promotion?.timeFreeType;

  if (t === "threeHour") return "3다무";
  if (t === "waitFree") {
    if (novel.platform === "ridi") return "리다무";
    return "기다무";
  }
  if (t === "pass") return "패스";

  if (novel.platform === "ridi") {
    if (novel.promotion?.ridiWaitFree) return "리다무";
  }

  if (novel.promotion?.tag) return novel.promotion.tag;

  return null;
}

function getSecondaryPromoLabel(novel: Novel): string | null {
  const freeEpisodes = novel.promotion?.freeEpisodes;

  if (typeof freeEpisodes === "number" && freeEpisodes > 0) {
    return `${freeEpisodes}화 무료`;
  }

  if (novel.platform === "ridi" && novel.promotion?.ridiFreeLabel) {
    return novel.promotion.ridiFreeLabel;
  }

  return null;
}

function getPromoInlineText(novel: Novel): string | null {
  const parts: string[] = [];
  const primaryPromoLabel = getPrimaryPromoLabel(novel);
  const secondaryPromoLabel = getSecondaryPromoLabel(novel);
  const daysLeft = novel.promotion?.daysLeft;

  if (primaryPromoLabel) parts.push(primaryPromoLabel);

  if (secondaryPromoLabel && secondaryPromoLabel !== primaryPromoLabel) {
    parts.push(secondaryPromoLabel);
  }

  if (typeof daysLeft === "number" && daysLeft >= 0) {
    parts.push(`${daysLeft}일 남음`);
  }

  if (parts.length === 0) return null;
  return parts.join(" ");
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
  if (platform === "ridi") return `${v.toLocaleString("ko-KR")} 평가`;
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
    else if (s.endsWith("억")) {
      n = (Number(s.replace("억", "").replace(/,/g, "")) || 0) * 100_000_000;
    } else if (s.endsWith("만")) {
      n = (Number(s.replace("만", "").replace(/,/g, "")) || 0) * 10_000;
    } else {
      n = Number(s.replace(/,/g, ""));
    }
  }

  if (!Number.isFinite(n) || n <= 0) return "-";
  return toKoreanUnit(n);
}

export function RankingCard({
  novel,
  rank,
  onClick,
  variant = "default",
}: Props) {
  const viewsUp = novel.viewsChangePct > 0;
  const promoStyle = getPromoStyle(novel.platform);
  const promoInlineText = getPromoInlineText(novel);

  return (
    <motion.div
      className="ranking-card"
      whileHover={{
        scale: 1.018,
        boxShadow: "0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px hsl(var(--border))",
      }}
      transition={{ duration: 0.18 }}
      onClick={() => onClick?.(novel)}
    >
      {/* 순위 번호 */}
      <div
        className="flex-shrink-0 flex items-center justify-center bg-surface-elevated px-4"
        style={{ minWidth: 64 }}
      >
        <span
          className={cn(
            "font-mono font-black leading-none",
            rank <= 3 ? "text-4xl" : rank <= 9 ? "text-3xl" : "text-2xl",
            rank === 1 && "text-yellow-400",
            rank === 2 && "text-slate-400",
            rank === 3 && "text-amber-600",
            rank > 3 && "text-muted-foreground",
          )}
        >
          {rank}
        </span>
      </div>

      {/* 커버 */}
      <div className="flex-shrink-0 py-3 pl-3">
        <NovelCover novel={novel} size="md" />
      </div>

      {/* 내용 */}
      <div className="flex-1 min-w-0 px-4 py-3 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-foreground">
                {novel.title}
              </h3>

              {/* 오늘 순위 */}
              <div className="flex items-center gap-1.5 mt-1">
                {novel.todayRank != null && (
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] font-black px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25 whitespace-nowrap">
                    <span className="text-[9px] opacity-70">TODAY</span>
                    #{novel.todayRank}위
                  </span>
                )}
              </div>

              {/* 프로모션 한 줄 */}
              {promoInlineText && (
                <div className="mt-1 overflow-x-auto">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap shrink-0",
                      promoStyle.bg,
                      promoStyle.text,
                      promoStyle.border,
                    )}
                  >
                    <Clock size={9} />
                    {promoInlineText}
                  </span>
                </div>
              )}
            </div>

            <PlatformBadge
              platform={novel.platform}
              className="flex-shrink-0 mt-0.5"
            />
          </div>

          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground flex-wrap">
            <span>{novel.author}</span>
            <span className="opacity-40">·</span>
            <span className="text-primary/80">{novel.genre}</span>
            <span className="opacity-40">·</span>
            <span>{novel.publisher}</span>
          </div>
        </div>

        {/* 하단 지표 */}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <RankChange novel={novel} />

          <span
            className={cn(
              "font-mono text-xs font-semibold",
              viewsUp ? "text-up" : "text-down",
            )}
          >
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
                <span className="font-mono">
                  {novel.platform === "ridi"
                    ? "-"
                    : formatComments(novel.commentCount)}
                </span>
              </span>

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

      {/* 우측: 증감률 */}
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
