// src/pages/GenreAnalysis.tsx
import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { RankingCard } from "@/components/shared/RankingCard";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import { RankChange } from "@/components/shared/RankChange";
import { NovelDetailDrawer } from "@/components/shared/NovelDetailDrawer";
import { useTodayCombined } from "@/hooks/useTodayCombined";
import { formatViews, type Novel, type Genre } from "@/data/mockData";
import { LoadingScreen } from "@/components/shared/LoadingScreen";

const genres: (Genre | "전체")[] = ["전체", "로판", "판타지", "로맨스", "현판", "BL", "무협", "기타"];

const genreColors: Record<string, string> = {
  로판:   "hsl(var(--ridi))",
  판타지: "hsl(var(--naver))",
  로맨스: "hsl(350,100%,60%)",
  BL:     "hsl(var(--kakao))",
  현판:   "#f97316",
  무협:   "#a855f7",
  기타:   "#94a3b8",
};

export default function GenrePage() {
  const { data: sourceData, isLoading, error, latestDate } = useTodayCombined();
  const [selectedGenre, setSelectedGenre] = useState<Genre | "전체">("전체");
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);

  const novels: Novel[] = sourceData ?? [];

  // ── 장르 필터링된 작품 목록 ─────────────────────────
  const genreNovels = useMemo(() => {
    const filtered = selectedGenre === "전체"
      ? novels
      : novels.filter((n) => n.genre === selectedGenre);
    return [...filtered].sort((a, b) => (a.todayRank ?? 999) - (b.todayRank ?? 999));
  }, [novels, selectedGenre]);

  // ── 장르별 플랫폼 작품 수 바 차트 ───────────────────
  const genreBarData = useMemo(() => {
    const map: Record<string, { genre: string; naver: number; kakao: number; ridi: number }> = {};
    for (const n of novels) {
      if (!map[n.genre]) map[n.genre] = { genre: n.genre, naver: 0, kakao: 0, ridi: 0 };
      map[n.genre][n.platform] += 1;
    }
    return Object.values(map).sort((a, b) => (b.naver + b.kakao + b.ridi) - (a.naver + a.kakao + a.ridi));
  }, [novels]);

  // ── 급상승 / 하락 작품 ──────────────────────────────
  const rising = useMemo(() =>
  [...novels]
    .filter((n) => !n.isNew && !n.isReEntry && (n.rankChange ?? 0) > 0)
    .sort((a, b) => (b.rankChange ?? 0) - (a.rankChange ?? 0))
    .slice(0, 5),
  [novels]
);

const falling = useMemo(() =>
  [...novels]
    .filter((n) => !n.isNew && !n.isReEntry && (n.rankChange ?? 0) < 0)
    .sort((a, b) => (a.rankChange ?? 0) - (b.rankChange ?? 0))
    .slice(0, 5),
  [novels]
);

  // ── 장르별 작품 수 요약 (탭 옆 숫자) ────────────────
  const genreCount = useMemo(() => {
    const map: Record<string, number> = {};
    for (const n of novels) {
      map[n.genre] = (map[n.genre] || 0) + 1;
    }
    return map;
  }, [novels]);

  if (isLoading) return <LoadingScreen />;
  if (error) return <div className="p-8 text-center text-red-500 font-bold">{error}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-black tracking-tight">장르 분석</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {latestDate} 기준 · 총 {novels.length}개 작품
        </p>
      </div>


      {/* 장르 탭 */}
      <div className="flex items-center gap-2 flex-wrap">
        {genres.map((g) => (
          <button
            key={g}
            onClick={() => setSelectedGenre(g)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5",
              selectedGenre === g
                ? "bg-primary text-primary-foreground"
                : "bg-surface border border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {g}
            {g !== "전체" && genreCount[g] ? (
              <span className={cn(
                "text-[10px] font-mono px-1 rounded",
                selectedGenre === g ? "bg-white/20" : "bg-surface-elevated text-muted-foreground"
              )}>
                {genreCount[g]}
              </span>
            ) : null}
          </button>
        ))}
      </div>


      {/* 장르별 평균 지표 요약 */}
      <div className="surface-card">
        <h2 className="text-sm font-bold mb-4">장르별 평균 지표 요약</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {["장르", "작품 수", "평균 순위", "평균 조회수", "평균 별점", "신작 수", "재진입 수"].map((h) => (
                  <th key={h} className="py-2 px-3 text-left text-muted-foreground font-medium whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(
                novels.reduce<Record<string, Novel[]>>((acc, n) => {
                  if (!acc[n.genre]) acc[n.genre] = [];
                  acc[n.genre].push(n);
                  return acc;
                }, {})
              )
                .sort((a, b) => b[1].length - a[1].length)
                .map(([genre, list]) => {
                  const avgRank = list.reduce((s, n) => s + (n.todayRank ?? 0), 0) / list.length;
                  const avgViews = list.reduce((s, n) => s + n.todayViews, 0) / list.length;
                  const avgRating = list.reduce((s, n) => s + n.rating, 0) / list.length;
                  const newCount = list.filter((n) => n.isNew).length;
                  const reEntryCount = list.filter((n) => n.isReEntry).length;
                  const color = genreColors[genre] || "#94a3b8";
                  return (
                    <tr
                      key={genre}
                      className="border-b border-border hover:bg-surface-elevated cursor-pointer transition-colors"
                      onClick={() => setSelectedGenre(genre as Genre)}
                    >
                      <td className="py-2.5 px-3">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                          <span className="font-semibold">{genre}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold">{list.length}</td>
                      <td className="py-2.5 px-3 font-mono text-muted-foreground">
                        #{avgRank.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-emerald-500">
                        {avgViews >= 100_000_000
                          ? `${(avgViews / 100_000_000).toFixed(1)}억`
                          : avgViews >= 10_000
                          ? `${(avgViews / 10_000).toFixed(0)}만`
                          : avgViews.toFixed(0)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-yellow-400">
                        ★ {avgRating.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-primary">{newCount}</td>
                      <td className="py-2.5 px-3 font-mono text-violet-400">{reEntryCount}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>


      {/* TOP 작품 + 바 차트 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 장르 TOP 작품 목록 */}
        <div className="surface-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold">
              {selectedGenre === "전체" ? "전체" : selectedGenre} TOP 작품
            </h2>
            <span className="text-[10px] text-muted-foreground font-mono">
              {genreNovels.length}개
            </span>
          </div>
          <div className="space-y-1">
            {genreNovels.slice(0, 10).map((n, i) => (
              <div
                key={n.id}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-elevated cursor-pointer transition-colors"
                onClick={() => setSelectedNovel(n)}
              >
                <span className="font-mono text-sm font-bold text-muted-foreground w-5 text-right shrink-0">
                  {i + 1}
                </span>
                <PlatformBadge platform={n.platform} />
                <span className="flex-1 text-xs font-medium line-clamp-1 min-w-0">{n.title}</span>
                <span className="font-mono text-[10px] text-muted-foreground shrink-0 hidden sm:block">{n.author}</span>
                <RankChange novel={n} />
                <span className="font-mono text-xs font-semibold shrink-0">
                  {formatViews(n.platform, n.todayViews)}
                </span>
              </div>
            ))}
            {genreNovels.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">해당 장르 작품 없음</p>
            )}
          </div>
        </div>

        {/* 장르별 플랫폼 작품 수 */}
        <div className="surface-card">
          <h2 className="text-sm font-bold mb-4">장르별 플랫폼 작품 수</h2>
          {genreBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={genreBarData}
                layout="vertical"
                margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "Roboto Mono" }}
                />
                <YAxis
                  type="category"
                  dataKey="genre"
                  tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--surface))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="kakao" name="카카오" fill="hsl(var(--kakao))" stackId="a" />
                <Bar dataKey="naver" name="네이버" fill="hsl(var(--naver))" stackId="a" />
                <Bar dataKey="ridi"  name="리디"  fill="hsl(var(--ridi))"  stackId="a" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8">데이터 없음</p>
          )}
        </div>
      </div>

      {/* 급상승 / 하락 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="surface-card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-up" />
            <h2 className="text-sm font-bold">오늘 급상승 TOP 5</h2>
          </div>
          <div className="space-y-2">
            {rising.length > 0
              ? rising.map((n, i) => (
                  <RankingCard key={n.id} novel={n} rank={i + 1} onClick={setSelectedNovel} variant="compact" />
                ))
              : <p className="text-xs text-muted-foreground py-4 text-center">급상승 작품 없음</p>
            }
          </div>
        </div>

        <div className="surface-card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-down" />
            <h2 className="text-sm font-bold">오늘 하락 TOP 5</h2>
          </div>
          <div className="space-y-2">
            {falling.length > 0
              ? falling.map((n, i) => (
                  <RankingCard key={n.id} novel={n} rank={i + 1} onClick={setSelectedNovel} variant="compact" />
                ))
              : <p className="text-xs text-muted-foreground py-4 text-center">하락 작품 없음</p>
            }
          </div>
        </div>
      </div>

      

      <NovelDetailDrawer
        novel={selectedNovel}
        onClose={() => setSelectedNovel(null)}
        latestDate={latestDate}
        allNovels={novels}
        onSelectNovel={setSelectedNovel}
      />
    </div>
  );
}
