// src/pages/Rankings.tsx

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { RankingCard } from "@/components/shared/RankingCard";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import { RankChange } from "@/components/shared/RankChange";
import { NovelCover } from "@/components/shared/NovelCover";
import { NovelDetailDrawer } from "@/components/shared/NovelDetailDrawer";
import { type Novel, type Platform, type Genre } from "@/data/mockData";
import { useTodayCombined } from "@/hooks/useTodayCombined";
import {
  computeUnifiedScore,
  computeTrendScore,
  getPlatformMaxStats,
  type UnifiedNovel,
  attachRidiInnerRank, // 🔹 추가
} from "@/lib/rankingScore";

type PlatformTab = "all" | Platform;
const platformTabs: { key: PlatformTab; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "naver", label: "네이버" },
  { key: "kakao", label: "카카오" },
  { key: "ridi", label: "리디" },
];

const genres: (Genre | "전체")[] = [
  "전체",
  "로판",
  "판타지",
  "로맨스",
  "현판",
  "BL",
  "무협",
  "기타",
];

// 공통 숫자 포맷터: 35,000만 -> 3.5억, 1,114만 -> 1,114만
function toKoreanUnit(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "-";

  const eok = 100_000_000;
  const man = 10_000;

  // 1) 억 이상
  if (n >= eok) {
    const val = n / eok;
    const s = val.toFixed(1).replace(/\.0$/, "");
    return `${s}억`;
  }

  // 2) 만 이상 억 미만
  if (n >= man) {
    const manVal = n / man;

    if (manVal < 100) {
      const s = manVal.toFixed(1).replace(/\.0$/, "");
      return `${s}만`;
    }

    const intVal = Math.round(manVal);
    return `${intVal.toLocaleString("ko-KR")}만`;
  }

  // 3) 1만 미만
  return n.toLocaleString("ko-KR");
}

// 조회수 포맷: 네이버/카카오는 억/만 단위, 리디는 평가수 그대로
function formatViews(platform: Platform, views: number): string {
  const v = Number(views ?? 0);
  if (!Number.isFinite(v) || v <= 0) return "-";

  if (platform === "ridi") {
    return v.toLocaleString("ko-KR") + " 평가";
  }

  return toKoreanUnit(v);
}

// 댓글 포맷: 숫자 기준으로 억/만 단위
function formatComments(value: string | number | null | undefined): string {
  if (value == null) return "-";

  let n: number;

  if (typeof value === "number") {
    n = value;
  } else {
    const s = String(value).trim();
    if (!s) return "-";

    if (/^\d{1,3}(,\d{3})*$/.test(s)) {
      n = Number(s.replace(/,/g, ""));
    } else if (s.endsWith("억")) {
      const base = s.replace("억", "");
      const v = Number(base.replace(/,/g, ""));
      n = Number.isFinite(v) ? v * 100_000_000 : 0;
    } else if (s.endsWith("만")) {
      const base = s.replace("만", "");
      const v = Number(base.replace(/,/g, ""));
      n = Number.isFinite(v) ? v * 10_000 : 0;
    } else {
      n = Number(s.replace(/,/g, ""));
    }
  }

  if (!Number.isFinite(n) || n <= 0) return "-";

  return toKoreanUnit(n);
}

export default function RankingsPage() {
  const [platform, setPlatform] = useState<PlatformTab>("all");
  const [genre, setGenre] = useState<Genre | "전체">("전체");
  const [showNew, setShowNew] = useState(false);
  const [showReEntry, setShowReEntry] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);
  const [sortKey, setSortKey] =
    useState<"rank" | "views" | "rating">("rank");
  const [mode, setMode] = useState<"overall" | "trend">("overall");

  const { data: combinedNovels, isLoading, error, latestDate } = useTodayCombined();
  
  const sourceNovels: Novel[] =
    combinedNovels && combinedNovels.length > 0 ? combinedNovels : [];

  // 🔹 1단계: 플랫폼별 max 값 계산 (리디 내부 점수용도 같이 씀)
  const {
    maxViewsByPlatform,
    maxCommentsByPlatform,
    maxDeltaByPlatform,
  } = getPlatformMaxStats(sourceNovels as UnifiedNovel[]);

  // 🔹 2단계: 리디 내부 종합순위를 먼저 계산해서 ridiInnerRank 필드로 붙이기
  const novelsWithRidiInner = attachRidiInnerRank(
    sourceNovels as UnifiedNovel[],
    maxCommentsByPlatform,
    maxDeltaByPlatform,
  );


   const filtered = novelsWithRidiInner
    .filter((n) => platform === "all" || n.platform === platform)
    .filter((n) => genre === "전체" || n.genre === genre)
    .filter((n) => !showNew || n.isNew)
    .filter((n) => !showReEntry || n.isReEntry)
    .filter(
      (n) =>
        !search ||
        n.title.includes(search) ||
        n.author.includes(search),
    )
    .sort((a, b) => {
      if (sortKey === "rank") {
        const scorer =
          mode === "overall" ? computeUnifiedScore : computeTrendScore;

        const scoreA = scorer(
          a as UnifiedNovel & { ridiInnerRank?: number },
          maxViewsByPlatform,
          maxCommentsByPlatform,
          maxDeltaByPlatform,
        );
        const scoreB = scorer(
          b as UnifiedNovel & { ridiInnerRank?: number },
          maxViewsByPlatform,
          maxCommentsByPlatform,
          maxDeltaByPlatform,
        );

        if (scoreA !== scoreB) return scoreB - scoreA;
        return b.todayViews - a.todayViews;
      }

      if (sortKey === "views") {
        return b.todayViews - a.todayViews;
      }

      if (sortKey === "rating") {
        return b.rating - a.rating;
      }

      return 0;
    });


  const topCards = filtered.slice(0, 4);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-black tracking-tight">순위표</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          플랫폼 · 장르별 상세 랭킹
        </p>
        {isLoading && (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            오늘 통합 랭킹 불러오는 중…
          </p>
        )}
        {error && (
          <p className="text-[10px] text-red-500 mt-0.5">
            데이터 로딩 실패: {error}
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="surface-card space-y-4">
        {/* Platform tabs + Genre */}
        <div className="flex items-center gap-2 flex-wrap">
          {platformTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setPlatform(t.key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                platform === t.key
                  ? t.key === "naver"
                    ? "bg-naver text-black"
                    : t.key === "kakao"
                    ? "bg-kakao text-black"
                    : t.key === "ridi"
                    ? "bg-ridi text-white"
                    : "bg-primary text-primary-foreground"
                  : "bg-surface-elevated text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
          <div className="h-5 w-px bg-border mx-1" />
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setGenre(g)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs transition-colors",
                genre === g
                  ? "bg-primary/15 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="제목 / 작가 검색…"
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-surface-elevated border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* NEW / 재진입 토글 */}
          {[
            { label: "NEW만 보기", value: showNew, setter: setShowNew },
            {
              label: "재진입만 보기",
              value: showReEntry,
              setter: setShowReEntry,
            },
          ].map(({ label, value, setter }) => (
            <button
              key={label}
              onClick={() => setter(!value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}

          {/* 모드 토글: 종합 / 트렌드 */}
          <div className="flex items-center gap-1 ml-auto">
            {([
              { key: "overall" as const, label: "종합" },
              { key: "trend" as const, label: "트렌드" },
            ]).map((m) => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={cn(
                  "px-2.5 py-1 rounded text-xs",
                  mode === m.key
                    ? "bg-primary/15 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1">
            <SlidersHorizontal size={13} className="text-muted-foreground" />
            {[
              { key: "rank" as const, label: "순위" },
              { key: "views" as const, label: "조회수" },
              { key: "rating" as const, label: "평점" },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => setSortKey(s.key)}
                className={cn(
                  "px-2.5 py-1 rounded text-xs",
                  sortKey === s.key
                    ? "bg-surface-elevated text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top 4 cards */}
      {topCards.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-3 font-medium">
            주요 작품 ({mode === "overall" ? "종합" : "트렌드"} TOP 4)
          </p>
          <div className="space-y-2">
            {topCards.map((n, idx) => (
              <RankingCard
                key={n.id}
                novel={n}
                rank={idx + 1}
                onClick={setSelectedNovel}
              />
            ))}
          </div>
        </div>
      )}

      {/* Full Table */}
      <div className="surface-card overflow-hidden p-0">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-bold">
            전체 순위표 ({mode === "overall" ? "종합" : "트렌드"})
          </h2>
          <span className="font-mono text-xs text-muted-foreground">
            {filtered.length}개 작품
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {[
                  "플랫폼",
                  "순위",
                  "제목",
                  "작가",
                  "장르",
                  "조회수/평가수",
                  "전일 순위",
                  "순위 변화",
                  "증감률",
                  "출판사",
                  "평점",
                  "댓글",
                  "회차",
                ].map((h) => (
                  <th
                    key={h}
                    className="py-3 px-3 text-left text-muted-foreground font-medium whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((n, i) => (
                <motion.tr
                  key={n.id}
                  className="data-table-row"
                  onClick={() => setSelectedNovel(n)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <td className="py-2.5 px-3">
                    <PlatformBadge platform={n.platform} />
                  </td>
                  {/* 화면용 순위: 필터/정렬 결과 기준 1,2,3... */}
                  <td className="py-2.5 px-3 font-mono font-bold text-sm">
                    {i + 1}
                  </td>
                  <td className="py-2.5 px-3 max-w-[180px]">
                    <div className="flex items-center gap-2">
                      <NovelCover novel={n} size="sm" />
                      <span className="line-clamp-2 font-medium text-foreground">
                        {n.title}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground">
                    {n.author}
                  </td>
                  <td className="py-2.5 px-3 text-primary/80 whitespace-nowrap">
                    {n.genre}
                  </td>

                  {/* 조회수/평가수 */}
                  <td className="py-2.5 px-3 font-mono font-semibold whitespace-nowrap">
                    {formatViews(n.platform, n.todayViews)}
                  </td>

                  <td className="py-2.5 px-3 font-mono text-muted-foreground">
                    {n.prevRank ?? "—"}
                  </td>
                  <td className="py-2.5 px-3">
                    <RankChange novel={n} />
                  </td>
                  <td
                    className={cn(
                      "py-2.5 px-3 font-mono font-semibold",
                      n.viewsChangePct > 0 ? "text-up" : "text-down",
                    )}
                  >
                    {n.viewsChangePct > 0 ? "+" : ""}
                    {n.viewsChangePct.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                    {n.publisher}
                  </td>
                  <td className="py-2.5 px-3 font-mono flex items-center gap-0.5">
                    <Star size={10} className="text-yellow-400" />
                    {n.rating}
                  </td>

                  {/* 댓글 */}
                  <td className="py-2.5 px-3 font-mono text-muted-foreground">
                    {n.platform === "ridi"
                      ? "-"
                      : formatComments(n.commentCount)}
                  </td>

                  <td className="py-2.5 px-3 font-mono text-muted-foreground">
                    {n.episodeCount
                      ? Number(n.episodeCount).toLocaleString("ko-KR")
                      : "-"}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <NovelDetailDrawer
  novel={selectedNovel}
  onClose={() => setSelectedNovel(null)}
  latestDate={latestDate}
  allNovels={sourceNovels}
  onSelectNovel={setSelectedNovel}
/>
    </div>
  );
}
