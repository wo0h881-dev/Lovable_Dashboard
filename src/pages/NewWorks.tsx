// src/pages/NewWorks.tsx
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sparkles, AlertTriangle, RefreshCw } from "lucide-react";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import { RankingCard } from "@/components/shared/RankingCard";
import { RankChange } from "@/components/shared/RankChange";
import { NovelCover } from "@/components/shared/NovelCover";
import { NovelDetailDrawer } from "@/components/shared/NovelDetailDrawer";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import { useTodayCombined } from "@/hooks/useTodayCombined";
import { type Novel } from "@/data/mockData";

export default function NewWorksPage() {
  const { data: sourceData, isLoading, error, latestDate } = useTodayCombined();
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);

  const novels: Novel[] = sourceData ?? [];

  // ── 신규 진입 / 재진입 / 주목 작품 ───────────────────────
  const newEntries = useMemo(() =>
    novels.filter(n => n.isNew).sort((a, b) => (a.todayRank ?? 999) - (b.todayRank ?? 999)),
    [novels]
  );

  const reEntries = useMemo(() =>
    novels.filter(n => n.isReEntry).sort((a, b) => (a.todayRank ?? 999) - (b.todayRank ?? 999)),
    [novels]
  );

  // 주목 작품: 신작 + 재진입 + 순위 급상승(5위 이상) + 조회수 급증(50% 이상)
  const notableWorks = useMemo(() =>
    novels
      .filter(n =>
        n.isNew ||
        n.isReEntry ||
        (n.rankChange ?? 0) >= 5 ||
        n.viewsChangePct >= 50
      )
      .sort((a, b) => {
        // 우선순위: NEW > 재진입 > 급상승 > 조회수급증
        const scoreA = (a.isNew ? 100 : 0) + (a.isReEntry ? 50 : 0) + (a.rankChange ?? 0) + Math.min(a.viewsChangePct / 10, 10);
        const scoreB = (b.isNew ? 100 : 0) + (b.isReEntry ? 50 : 0) + (b.rankChange ?? 0) + Math.min(b.viewsChangePct / 10, 10);
        return scoreB - scoreA;
      })
      .slice(0, 10),
    [novels]
  );

  if (isLoading) return <LoadingScreen />;
  if (error) return <div className="p-8 text-center text-red-500 font-bold">{error}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-black tracking-tight">신작</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {latestDate} 기준 · 신규 진입 · 재진입 · 주목 작품
        </p>
      </div>

      {/* 주목 작품 */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-lg bg-yellow-400/10 flex items-center justify-center">
            <AlertTriangle size={13} className="text-yellow-400" />
          </div>
          <h2 className="text-sm font-bold">주목 작품</h2>
          <span className="text-xs text-muted-foreground">급상승 · NEW · 재진입 · 조회수 급증</span>
          <span className="ml-auto font-mono text-xs bg-yellow-400/10 text-yellow-600 px-2 py-0.5 rounded-full">
            {notableWorks.length}편
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {notableWorks.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "ranking-card border-l-2 cursor-pointer",
                n.isNew ? "border-l-naver" : n.isReEntry ? "border-l-ridi" : "border-l-up"
              )}
              onClick={() => setSelectedNovel(n)}
            >
              <div className="flex-shrink-0 flex items-center justify-center px-4 bg-surface-elevated" style={{ minWidth: 52 }}>
                <span className="font-mono font-black text-2xl text-muted-foreground">
                  {n.todayRank ?? "-"}
                </span>
              </div>
              <div className="flex-shrink-0 py-3 pl-3 relative">
                <NovelCover novel={n} size="md" />
                {/* 기다무/3다무 */}
                {n.promotion?.timeFreeType && n.promotion.timeFreeType !== "none" && (
                  <span className="absolute left-1 top-1 inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold bg-amber-400 text-black shadow">
                    {n.promotion.timeFreeType === "threeHour" ? "3다무" : "기다무"}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0 px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold line-clamp-2 flex-1">{n.title}</h3>
                  <PlatformBadge platform={n.platform} />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {n.author} · {n.genre} · {n.publisher}
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <RankChange novel={n} />
                  {n.isNew && (
                    <span className="text-xs bg-naver/15 text-naver px-2 py-0.5 rounded-full font-semibold">첫 등장</span>
                  )}
                  {n.isReEntry && (
                    <span className="text-xs bg-ridi/15 text-ridi px-2 py-0.5 rounded-full font-semibold">재진입</span>
                  )}
                  {n.viewsChangePct >= 50 && !n.isNew && (
                    <span className="text-xs bg-up/15 text-up px-2 py-0.5 rounded-full font-semibold">
                      조회수 +{n.viewsChangePct.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        {notableWorks.length === 0 && (
          <div className="surface-card text-center py-10 text-muted-foreground text-sm">
            주목 작품이 없습니다
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 신규 진입 */}
        <div className="surface-card">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={15} className="text-naver" />
            <h2 className="text-sm font-bold">신규 진입 작품</h2>
            <span className="ml-auto font-mono text-xs bg-naver/10 text-naver px-2 py-0.5 rounded-full">
              {newEntries.length}편
            </span>
          </div>
          {newEntries.length > 0 ? (
            <div className="space-y-1">
              {newEntries.map(n => (
                <div
                  key={n.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-elevated cursor-pointer transition-colors"
                  onClick={() => setSelectedNovel(n)}
                >
                  <NovelCover novel={n} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold line-clamp-1">{n.title}</div>
                    <div className="text-[10px] text-muted-foreground">{n.author} · {n.publisher}</div>
                  </div>
                  <PlatformBadge platform={n.platform} />
                  <div className="text-right shrink-0">
                    <div className="font-mono text-sm font-bold text-primary">#{n.todayRank}</div>
                    <div className="text-[10px] text-muted-foreground">{n.genre}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-6">오늘 신규 진입 없음</p>
          )}
        </div>

        {/* 재진입 */}
        <div className="surface-card">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw size={15} className="text-ridi" />
            <h2 className="text-sm font-bold">재진입 작품</h2>
            <span className="ml-auto font-mono text-xs bg-ridi/10 text-ridi px-2 py-0.5 rounded-full">
              {reEntries.length}편
            </span>
          </div>
          {reEntries.length > 0 ? (
            <div className="space-y-1">
              {reEntries.map(n => (
                <div
                  key={n.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-elevated cursor-pointer transition-colors"
                  onClick={() => setSelectedNovel(n)}
                >
                  <NovelCover novel={n} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold line-clamp-1">{n.title}</div>
                    <div className="text-[10px] text-muted-foreground">{n.author} · {n.publisher}</div>
                  </div>
                  <PlatformBadge platform={n.platform} />
                  <div className="text-right shrink-0">
                    <div className="font-mono text-sm font-bold text-up">#{n.todayRank}</div>
                    <RankChange novel={n} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-6">오늘 재진입 없음</p>
          )}
        </div>
      </div>

      {/* 급상승 TOP (rankChange 5위 이상, NEW/재진입 제외) */}
      {novels.filter(n => !n.isNew && !n.isReEntry && (n.rankChange ?? 0) >= 5).length > 0 && (
        <div>
          <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-up inline-block" />
            오늘 급상승 (5위 이상 상승)
          </h2>
          <div className="space-y-2">
            {novels
              .filter(n => !n.isNew && !n.isReEntry && (n.rankChange ?? 0) >= 5)
              .sort((a, b) => (b.rankChange ?? 0) - (a.rankChange ?? 0))
              .slice(0, 5)
              .map((n, i) => (
                <RankingCard key={n.id} novel={n} rank={i + 1} onClick={setSelectedNovel} variant="compact" />
              ))}
          </div>
        </div>
      )}

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
