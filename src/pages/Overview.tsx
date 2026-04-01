// src/pages/Overview.tsx
import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  BookOpen,
  Zap,
  RefreshCw,
  LogIn,
  Trophy,
  TrendingUp,
  Building2,
  Sparkles,
  Star,
  Clock,
  Ticket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type Novel } from "@/data/mockData";
import { useTodayCombined } from "@/hooks/useTodayCombined";
import { NovelCover } from "@/components/shared/NovelCover";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import { NovelDetailDrawer } from "@/components/shared/NovelDetailDrawer";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import {
  computeUnifiedScore,
  computeTrendScore,
  getPlatformMaxStats,
  type UnifiedNovel,
  attachRidiInnerRank,
} from "@/lib/rankingScore";

const PLATFORM_COLORS: Record<string, string> = {
  naver: "#20C997",
  kakao: "#FACC15",
  ridi: "#5B74FF",
  etc: "#94A3B8",
};

type InsightItem = {
  title: string;
  body: string;
};


function normalizeBannerText(text?: string | null) {
  return (text ?? "")
    .toLowerCase()
    .replace(/\.\.\.|…/g, "")
    .replace(/\s+/g, "")
    .replace(/[!！?？.,·•[\](){}<>《》"'`~:;|/\\+-]/g, "")
    .trim();
}

function buildBannerFrequencyMaps(sourceData: Novel[]) {
  const globalMap = new Map<string, number>();
  const platformMap = new Map<string, number>();

  sourceData.forEach((novel) => {
    const banners = novel.promotion?.eventBanners ?? [];

    banners.forEach((banner) => {
      const text = `${banner.title ?? ""} ${banner.subtitle ?? ""}`.trim();
      const normalized = normalizeBannerText(text);
      if (!normalized) return;

      globalMap.set(normalized, (globalMap.get(normalized) ?? 0) + 1);

      const platformKey = `${novel.platform}::${normalized}`;
      platformMap.set(platformKey, (platformMap.get(platformKey) ?? 0) + 1);
    });
  });

  return { globalMap, platformMap };
}

function isRepeatedBanner(
  novel: Novel,
  banner: { title?: string; subtitle?: string },
  globalMap: Map<string, number>,
  platformMap: Map<string, number>,
) {
  const text = `${banner.title ?? ""} ${banner.subtitle ?? ""}`.trim();
  const normalized = normalizeBannerText(text);
  if (!normalized) return false;

  const globalCount = globalMap.get(normalized) ?? 0;
  const platformCount =
    platformMap.get(`${novel.platform}::${normalized}`) ?? 0;

  return platformCount >= 2 || globalCount >= 3;
}

function bannerMatchesNovelTitle(bannerText: string, novelTitle: string) {
  const banner = normalizeBannerText(bannerText);
  const title = normalizeBannerText(novelTitle);

  if (!banner || !title) return false;

  // 완전 포함
  if (banner.includes(title) || title.includes(banner)) return true;

  // 말줄임표/잘림 대응: 제목 앞부분 6자 이상이면 일치로 인정
  const minPrefix = Math.min(Math.max(6, Math.floor(title.length * 0.45)), title.length);
  const titlePrefix = title.slice(0, minPrefix);

  if (titlePrefix && banner.includes(titlePrefix)) return true;

  // 배너가 더 긴 경우에도 앞부분 비교
  const bannerPrefix = banner.slice(0, minPrefix);
  if (bannerPrefix && title.includes(bannerPrefix)) return true;

  return false;
}

function hasConservativePromoBanner(
  novel: Novel,
  globalMap: Map<string, number>,
  platformMap: Map<string, number>,
) {
  const banners = novel.promotion?.eventBanners ?? [];
  if (banners.length === 0) return false;

  return banners.some((banner) => {
    const text = `${banner.title ?? ""} ${banner.subtitle ?? ""}`.trim();
    if (!text) return false;

    if (isRepeatedBanner(novel, banner, globalMap, platformMap)) {
      return false;
    }

    return bannerMatchesNovelTitle(text, novel.title);
  });
}

function isConservativeMeaningfulPromo(
  novel: Novel,
  globalMap: Map<string, number>,
  platformMap: Map<string, number>,
) {
  const p = novel.promotion;
  if (!p) return false;

  if (novel.platform === "naver") {
    return p.tag?.trim() === "타임딜";
  }

  if (novel.platform === "kakao" || novel.platform === "ridi") {
    return hasConservativePromoBanner(novel, globalMap, platformMap);
  }

  return false;
}


function InsightCard({ item }: { item: InsightItem }) {
  return (
    <div className="bg-surface-elevated border border-border/40 rounded-xl p-3">
      <p className="text-xs font-bold text-foreground">{item.title}</p>
      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
        {item.body}
      </p>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="surface-card p-4 flex flex-col items-center gap-1 border border-border/40">
      <div className={cn("p-2 rounded-full bg-surface-elevated mb-1", color)}>
        {icon}
      </div>
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
        {label}
      </p>
      <p className="text-xl font-black">{value}</p>
    </div>
  );
}

type PromoBadge = {
  label: string;
  icon: "clock" | "ticket" | "none";
  className: string;
} | null;

function getPromoBadgeClass(platform: Novel["platform"]): string {
  if (platform === "naver") return "bg-naver text-black";
  if (platform === "ridi") return "bg-ridi text-white";
  return "bg-kakao text-black";
}

function getOverviewPromoBadge(novel: Novel): PromoBadge {
  const promo = novel.promotion;
  if (!promo) return null;

  const className = getPromoBadgeClass(novel.platform);
  const tag = promo.tag?.trim();
  const ridiFreeLabel = promo.ridiFreeLabel?.trim();

  if (novel.platform === "kakao") {
    if (promo.timeFreeType === "threeHour") {
      return { label: "3다무", icon: "clock", className };
    }
    if (promo.timeFreeType === "waitFree") {
      return { label: "기다무", icon: "clock", className };
    }
  }

  if (novel.platform === "naver") {
    if (tag === "타임딜") {
      return { label: "타임딜", icon: "none", className };
    }
    if (promo.timeFreeType === "waitFree") {
      return { label: "기다무", icon: "clock", className };
    }
    if (tag === "기다무" || tag === "기다리면 무료") {
      return { label: "기다무", icon: "clock", className };
    }
  }

  if (novel.platform === "ridi") {
    if (ridiFreeLabel) {
      if (/화무|무료/.test(ridiFreeLabel)) {
        return { label: ridiFreeLabel, icon: "ticket", className };
      }
      return { label: ridiFreeLabel, icon: "none", className };
    }

    if (promo.ridiWaitFree || promo.timeFreeType === "waitFree") {
      return { label: "리다무", icon: "clock", className };
    }

    if (tag === "리다무" || tag === "기다리면 무료") {
      return { label: "리다무", icon: "clock", className };
    }
  }

  return null;
}

function getAnalysisBadges(novel: Novel): string[] {
  const badges: string[] = [];
  if (novel.isNew) badges.push("NEW");
  if (novel.isReEntry) badges.push("RE-ENTRY");
  if (novel.promotion?.timeFreeType && novel.promotion.timeFreeType !== "none") {
    badges.push("PROMOTION");
  }
  if ((novel.viewsChangePct || 0) >= 20 && !novel.promotion?.timeFreeType) {
    badges.push("VIRAL");
  }
  if ((novel.consecutiveDays || 0) >= 14) {
    badges.push("STEADY");
  }
  return badges.slice(0, 3);
}

function RankingColumn({
  title,
  subtitle,
  icon,
  data,
  mode,
  onSelect,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  data: Novel[];
  mode: "overall" | "trend" | "publisher" | "new";
  onSelect?: (novel: Novel) => void;
}) {
  return (
    <div className="surface-card border border-border/50 shadow-sm">
      <div className="flex flex-col mb-5">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="font-extrabold text-lg tracking-tight">{title}</h2>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5 ml-7 font-medium uppercase">
          {subtitle}
        </p>
      </div>

      <div className="space-y-1">
        {data.slice(0, 10).map((novel, idx) => {
          const promoBadge = getOverviewPromoBadge(novel);
          const badges = getAnalysisBadges(novel);

          const primaryLabel =
            mode === "publisher" ? (novel.publisher || "-") : novel.title;

          return (
            <div
              key={`${mode}-${novel.id}-${idx}`}
              onClick={() => onSelect?.(novel)}
              className={cn(
                "flex items-center gap-3 py-2 px-2 rounded-lg transition-colors",
                onSelect ? "hover:bg-surface-elevated cursor-pointer group" : "cursor-default",
              )}
            >
              <span
                className={cn(
                  "w-5 text-center font-mono font-black text-sm",
                  idx < 3 ? "text-primary" : "text-muted-foreground/40",
                )}
              >
                {idx + 1}
              </span>

              <div className="relative shrink-0">
                <NovelCover
                  novel={novel}
                  size="sm"
                  className="rounded shadow-sm shrink-0 w-8 h-10"
                />
                {promoBadge && (
  <span
    className={cn(
      "absolute -bottom-1 -right-1 inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-bold leading-none shadow whitespace-nowrap",
      promoBadge.className,
    )}
  >
    {promoBadge.icon === "clock" && <Clock size={8} />}
    {promoBadge.icon === "ticket" && <Ticket size={8} />}
    {promoBadge.label}
  </span>
)}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold truncate group-hover:text-primary transition-colors">
                  {primaryLabel}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <PlatformBadge platform={novel.platform as any} size="sm" />
                  {mode === "publisher" ? (
                    <span className="text-[10px] text-muted-foreground truncate">
                      {novel.title}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground truncate">
                      {novel.author}
                    </span>
                  )}
                  {badges.slice(0, 2).map((badge) => (
                    <span
                      key={badge}
                      className="text-[9px] px-1.5 py-0.5 rounded-full bg-surface-elevated border border-border/40 text-muted-foreground font-bold"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-right shrink-0">
                {mode === "overall" && (
                  <div className="flex items-center gap-0.5 text-amber-500 font-mono text-xs font-bold justify-end">
                    <Star size={10} fill="currentColor" />
                    {novel.rating.toFixed(1)}
                  </div>
                )}
                {mode === "trend" && (
                  <div
                    className={cn(
                      "text-xs font-mono font-black",
                      (novel.viewsChangePct || 0) >= 0 ? "text-up" : "text-down",
                    )}
                  >
                    {(novel.viewsChangePct || 0) >= 0 ? "+" : ""}
                    {(novel.viewsChangePct || 0).toFixed(1)}%
                  </div>
                )}
                {mode === "publisher" && (
                  <div className="text-xs font-mono font-bold text-primary/90">
                    #{novel.todayRank ?? "-"}
                  </div>
                )}
                {mode === "new" && (
                  <div className="text-xs font-mono font-black text-emerald-400">
                    NEW
                  </div>
                )}
                {mode !== "publisher" && (
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {novel.publisher}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type PublisherStats = {
  count: number;
  totalViews: number;
  bestRank: number;
  sumRank: number;
  trendHits: number;
  bestNovel: Novel | null;
};

export default function OverviewPage() {
  const { data: sourceData, isLoading, error, latestDate } = useTodayCombined();
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);

  const {
    overallTop10,
    trendTop10,
    publisherTop10,
    newTop10,
    stats,
    platformData,
    genreStackedData,
    overviewInsights,
    overallLeader,
    trendLeader,
  } = useMemo(() => {
    if (!sourceData || sourceData.length === 0) {
      return {
        overallTop10: [] as Novel[],
        trendTop10: [] as Novel[],
        publisherTop10: [] as Novel[],
        newTop10: [] as Novel[],
        stats: { total: 0, new: 0, changed: 0, reEntry: 0 },
        platformData: [] as { name: string; value: number; key: string }[],
        genreStackedData: [] as any[],
        overviewInsights: [] as InsightItem[],
        overallLeader: "kakao",
        trendLeader: "kakao",
      };
    }

    const maxStats = getPlatformMaxStats(sourceData as UnifiedNovel[]);
    const { globalMap: bannerGlobalMap, platformMap: bannerPlatformMap } =
  buildBannerFrequencyMaps(sourceData);
    const enrichedData = attachRidiInnerRank(
      sourceData as UnifiedNovel[],
      maxStats.maxCommentsByPlatform,
      maxStats.maxDeltaByPlatform,
    ) as Novel[];

    const overall = [...enrichedData]
      .sort((a, b) => {
        const scoreA = computeUnifiedScore(
          a as UnifiedNovel,
          maxStats.maxViewsByPlatform,
          maxStats.maxCommentsByPlatform,
          maxStats.maxDeltaByPlatform,
        );
        const scoreB = computeUnifiedScore(
          b as UnifiedNovel,
          maxStats.maxViewsByPlatform,
          maxStats.maxCommentsByPlatform,
          maxStats.maxDeltaByPlatform,
        );
        return scoreB - scoreA;
      })
      .slice(0, 10);

    const trend = [...enrichedData]
      .sort((a, b) => {
        const scoreA = computeTrendScore(
          a as UnifiedNovel,
          maxStats.maxViewsByPlatform,
          maxStats.maxCommentsByPlatform,
          maxStats.maxDeltaByPlatform,
        );
        const scoreB = computeTrendScore(
          b as UnifiedNovel,
          maxStats.maxViewsByPlatform,
          maxStats.maxCommentsByPlatform,
          maxStats.maxDeltaByPlatform,
        );
        return scoreB - scoreA;
      })
      .slice(0, 10);

    const newTop = [...enrichedData]
      .filter((n) => n.isNew)
      .sort((a, b) => (b.viewsChangePct || 0) - (a.viewsChangePct || 0))
      .slice(0, 10);

    // --- 출판사 스코어 (3번 균형형) ---
    const publisherMap = new Map<string, PublisherStats>();
    const trendIds = new Set(trend.map((n) => n.id));

    enrichedData.forEach((n) => {
      const key = n.publisher || "-";
      const prev: PublisherStats =
        publisherMap.get(key) || {
          count: 0,
          totalViews: 0,
          bestRank: 999,
          sumRank: 0,
          trendHits: 0,
          bestNovel: null,
        };

      const rank = typeof n.todayRank === "number" ? n.todayRank : 999;

      prev.count += 1;
      prev.totalViews += Number(n.todayViews || 0);
      prev.sumRank += rank;
      if (trendIds.has(n.id)) prev.trendHits += 1;

      if (rank < prev.bestRank) {
        prev.bestRank = rank;
        prev.bestNovel = n;
      }

      publisherMap.set(key, prev);
    });

    const publisherScores = [...publisherMap.entries()]
      .map(([publisher, s]) => {
        const avgRank = s.count > 0 ? s.sumRank / s.count : 999;

        const volumeScore =
          Math.log10(s.totalViews + 1) * 25 + s.count * 4;

        const qualityScore =
          (s.bestRank < 999 ? 80 - s.bestRank : 0) +
          (avgRank < 999 ? 60 - Math.min(avgRank, 60) : 0);

        const trendScore = s.trendHits * 30;

        const score = volumeScore + qualityScore + trendScore;

        return { publisher, score, stats: s };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    const topPublisher = publisherScores[0];
    const leadingPublisher = topPublisher?.publisher || "-";
    const leadingStats = topPublisher?.stats;
    const leadingAvgRank =
      leadingStats && leadingStats.count > 0
        ? leadingStats.sumRank / leadingStats.count
        : null;

    const publisherTop10: Novel[] = publisherScores
      .map((p) => p.stats.bestNovel)
      .filter((n): n is Novel => !!n);

    const total = sourceData.length;
    const newCount = sourceData.filter((n) => n.isNew).length;
    const reEntryCount = sourceData.filter((n) => n.isReEntry).length;
    const changedCount = sourceData.filter((n) => (n.rankChange || 0) !== 0).length;

    const pMap: Record<string, number> = {};
    sourceData.forEach((n) => {
      pMap[n.platform] = (pMap[n.platform] || 0) + 1;
    });
    const pData = Object.entries(pMap).map(([name, value]) => ({
      name: name.toUpperCase(),
      value,
      key: name,
    }));

    const gMap: Record<string, any> = {};
    sourceData.forEach((n) => {
      if (!gMap[n.genre]) {
        gMap[n.genre] = { name: n.genre, naver: 0, kakao: 0, ridi: 0, total: 0 };
      }
      gMap[n.genre][n.platform] += 1;
      gMap[n.genre].total += 1;
    });
    const gData = Object.values(gMap)
      .sort((a: any, b: any) => b.total - a.total)
      .slice(0, 8);

   const promoCount = sourceData.filter((n) =>
  isConservativeMeaningfulPromo(
    n,
    bannerGlobalMap,
    bannerPlatformMap,
  ),
).length;
    
    const viralCount = sourceData.filter(
      (n) =>
        (n.viewsChangePct || 0) >= 20 &&
        (!n.promotion || n.promotion.timeFreeType === "none"),
    ).length;

    const overallPlatformMap: Record<string, number> = {};
    overall.forEach((n) => {
      overallPlatformMap[n.platform] =
        (overallPlatformMap[n.platform] || 0) + 1;
    });
    const overallLeader =
      Object.entries(overallPlatformMap).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      "kakao";

    const trendPlatformMap: Record<string, number> = {};
    trend.forEach((n) => {
      trendPlatformMap[n.platform] =
        (trendPlatformMap[n.platform] || 0) + 1;
    });
    const trendLeader =
      Object.entries(trendPlatformMap).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      "kakao";

    const overviewInsights: InsightItem[] = [
      {
        title: "시장 중심축",
        body: `종합 인기 TOP 10에서는 ${overallLeader.toUpperCase()} 플랫폼이, 실시간 트렌드 TOP 10에서는 ${trendLeader.toUpperCase()} 플랫폼이 주도권을 잡고 있어요.`,
      },
      {
        title: "프로모션 영향",
        body: `작품별 개별 이벤트 프로모션이 확인된 작품은 총 ${promoCount}개예요.`,
      },
      {
        title: "바이럴 움직임",
        body: `프로모션 없이도 조회수가 20% 이상 급등한 작품이 ${viralCount}개 감지돼, 후기·입소문 중심의 상승도 동시에 나타나고 있어요.`,
      },
      {
        title: "출판사 포인트",
        body:
          leadingStats && leadingAvgRank !== null
            ? `${leadingPublisher}는 총 ${leadingStats.count}편, 평균 순위 ${leadingAvgRank.toFixed(
                1,
              )}위, 트렌드 TOP10 진입 ${leadingStats.trendHits}회로 오늘 가장 강한 존재감을 보이고 있어요.`
            : "오늘은 특정 출판사가 두드러지게 앞서는 패턴이 뚜렷하지 않아요.",
      },
    ];

    return {
      overallTop10: overall,
      trendTop10: trend,
      publisherTop10,
      newTop10: newTop,
      stats: { total, new: newCount, changed: changedCount, reEntry: reEntryCount },
      platformData: pData,
      genreStackedData: gData,
      overviewInsights,
      overallLeader,
      trendLeader,
    };
  }, [sourceData]);

  const sourceNovels: Novel[] = sourceData && sourceData.length > 0 ? sourceData : [];

  if (isLoading) return <LoadingScreen />;
  if (error) {
    return <div className="p-8 text-center text-red-500 font-bold">{error}</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground italic">
            MARKET OVERVIEW
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            {latestDate} 기준 실시간 통합 대시보드
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<BookOpen size={18} />}
          label="분석 작품"
          value={`${stats.total}개`}
          color="text-blue-500"
        />
        <StatCard
          icon={<Zap size={18} />}
          label="오늘의 신작"
          value={`${stats.new}개`}
          color="text-amber-500"
        />
        <StatCard
          icon={<RefreshCw size={18} />}
          label="순위 변동"
          value={`${stats.changed}개`}
          color="text-emerald-500"
        />
        <StatCard
          icon={<LogIn size={18} />}
          label="차트 재진입"
          value={`${stats.reEntry}개`}
          color="text-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <div className="surface-card border border-border/40 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-primary" />
            <h3 className="text-sm font-bold">오늘의 인사이트 자동요약</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {overviewInsights.map((item) => (
              <InsightCard key={item.title} item={item} />
            ))}
          </div>
        </div>

        <div className="surface-card border border-border/40 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-primary" />
            <h3 className="text-sm font-bold">오버뷰 빠른요약</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-surface-elevated border border-border/40 rounded-xl p-3">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                플랫폼 강세
              </p>
              <p className="font-semibold mt-2 text-foreground">
                종합 TOP10은 {overallLeader.toUpperCase()}, 트렌드 TOP10은{" "}
                {trendLeader.toUpperCase()} 중심이에요.
              </p>
            </div>
            <div className="bg-surface-elevated border border-border/40 rounded-xl p-3">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                주도 장르
              </p>
              <p className="font-semibold mt-2 text-foreground">
                {genreStackedData[0]?.name ?? "-"}
              </p>
            </div>
            <div className="bg-surface-elevated border border-border/40 rounded-xl p-3">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                출판사 포인트
              </p>
              <p className="font-semibold mt-2 text-foreground">
                {publisherTop10[0]?.publisher ?? "-"}
              </p>
            </div>
            <div className="bg-surface-elevated border border-border/40 rounded-xl p-3">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                신작 반응
              </p>
              <p className="font-semibold mt-2 text-foreground">
                상위 {newTop10.length}작품 집계
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 플랫폼/장르 차트 */}
      <div className="surface-card border border-border/40 shadow-sm">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="min-w-0">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              플랫폼별 작품 점유율
            </h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={platformData}
                    innerRadius={58}
                    outerRadius={82}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {platformData.map((entry) => (
                      <Cell
                        key={entry.key}
                        fill={PLATFORM_COLORS[entry.key] || "#94A3B8"}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              장르별 플랫폼 상세 분포
            </h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={genreStackedData} layout="vertical">
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.05)"
                    horizontal={false}
                  />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={72}
                    tick={{ fontSize: 11, fontWeight: "bold" }}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="naver"
                    stackId="a"
                    fill={PLATFORM_COLORS.naver}
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="kakao"
                    stackId="a"
                    fill={PLATFORM_COLORS.kakao}
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="ridi"
                    stackId="a"
                    fill={PLATFORM_COLORS.ridi}
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* TOP10 4열 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-4 gap-6">
        <RankingColumn
          title="종합 인기 TOP 10"
          subtitle="체급 및 시장 점유율 기반 대작 랭킹"
          icon={<Trophy className="text-amber-500" size={20} />}
          data={overallTop10}
          mode="overall"
          onSelect={setSelectedNovel}
        />
        <RankingColumn
          title="실시간 트렌드 TOP 10"
          subtitle="조회수 급증 및 화제성 중심 랭킹"
          icon={<TrendingUp className="text-blue-500" size={20} />}
          data={trendTop10}
          mode="trend"
          onSelect={setSelectedNovel}
        />
        <RankingColumn
          title="출판사 TOP 10"
          subtitle="출판사별 대표작(현재 최고 순위 기준)"
          icon={<Building2 className="text-violet-500" size={20} />}
          data={publisherTop10}
          mode="publisher"
          onSelect={setSelectedNovel}
        />
        <RankingColumn
          title="신작 TOP 10"
          subtitle="초기 반응이 빠른 신작 랭킹"
          icon={<Sparkles className="text-emerald-500" size={20} />}
          data={newTop10}
          mode="new"
          onSelect={setSelectedNovel}
        />
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
