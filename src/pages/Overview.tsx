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
  ComposedChart,
  Line,
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
  Megaphone,
  Flame,
  ArrowUpRight,
  Eye,
  MessageCircle,
  Star,
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

type ReasonSummary = {
  title: string;
  body: string;
  confidence: "높음" | "중간" | "낮음";
  evidence: string[];
};

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

function formatViews(platform: string, views: number): string {
  const v = Number(views ?? 0);
  if (!Number.isFinite(v) || v <= 0) return "-";
  if (platform === "ridi") return `${v.toLocaleString("ko-KR")} 평가`;
  return toKoreanUnit(v);
}

function getTimeFreeLabel(novel: Novel): string | null {
  const type = novel.promotion?.timeFreeType;
  if (type === "waitFree") return "기다무";
  if (type === "threeHour") return "3다무";
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

function getReasonSummary(novel: Novel): ReasonSummary {
  const delta = novel.viewsChangePct || 0;
  const noticeCount = novel.promotion?.notices?.length || 0;
  const timeFree = novel.promotion?.timeFreeType;
  const badges = getAnalysisBadges(novel);

  if (timeFree === "waitFree" || timeFree === "threeHour") {
    return {
      title: "프로모션 영향 가능성이 높아요",
      body:
        timeFree === "waitFree"
          ? "기다무 적용과 함께 유입이 늘어난 패턴으로 보여요."
          : "3다무 적용과 함께 단기 유입이 강하게 붙은 패턴으로 보여요.",
      confidence: "높음",
      evidence: [
        timeFree === "waitFree" ? "기다무 적용" : "3다무 적용",
        `조회수 증감률 ${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`,
        noticeCount > 0 ? `관련 공지 ${noticeCount}건` : "프로모션 정보 감지",
      ],
    };
  }

  if (novel.isNew && delta >= 15) {
    return {
      title: "신작 효과가 크게 작용하고 있어요",
      body: "초기 노출과 첫 유입이 빠르게 붙으면서 급상승한 흐름으로 보여요.",
      confidence: "높음",
      evidence: [
        "NEW 작품",
        `조회수 증감률 ${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`,
        `${novel.episodeCount || 0}화 초기 구간`,
      ],
    };
  }

  if (novel.isReEntry) {
    return {
      title: "재진입 + 재노출 효과로 보여요",
      body: "이전에 차트에 있었던 작품이 다시 유입을 받으며 재상승한 패턴이에요.",
      confidence: "중간",
      evidence: [
        "재진입 감지",
        `조회수 증감률 ${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`,
        noticeCount > 0 ? `관련 공지 ${noticeCount}건` : "추가 이슈 가능성",
      ],
    };
  }

  if (delta >= 20) {
    return {
      title: "바이럴 또는 후기 확산 영향으로 보여요",
      body: "프로모션 없이 조회수와 화제성이 동시에 뛰는 바이럴형 상승 패턴이에요.",
      confidence: "중간",
      evidence: [
        "프로모션 정보 없음",
        `조회수 증감률 ${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`,
        badges.includes("STEADY") ? "기존 체급 보유" : "후기 확산 가능성",
      ],
    };
  }

  return {
    title: "기존 체급과 누적 반응이 유지되는 흐름이에요",
    body: "급격한 프로모션보다는 평점, 댓글, 누적 노출이 작용한 안정적 상승으로 보여요.",
    confidence: "낮음",
    evidence: [
      `평점 ${novel.rating?.toFixed?.(1) ?? novel.rating ?? "-"}`,
      `댓글 ${Number(novel.commentCount || 0).toLocaleString("ko-KR")}개`,
      `${novel.consecutiveDays || 0}일 연속 차트인`,
    ],
  };
}

function buildCombinedChartData(novel: Novel) {
  const rankHistory = (novel.rankHistory || []).slice().sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const viewsHistory = (novel.viewsHistory || []).slice().sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const rankMap = new Map(rankHistory.map((r) => [r.date, r.rank]));
  const viewsMap = new Map(viewsHistory.map((v) => [v.date, v.views]));
  const allDates = Array.from(new Set([...rankMap.keys(), ...viewsMap.keys()])).sort();

  return allDates.map((date) => ({
    date: date.slice(5),
    rank: rankMap.get(date) ?? null,
    views: typeof viewsMap.get(date) === "number" ? Number(viewsMap.get(date)) : null,
  }));
}

function InsightCard({ item }: { item: InsightItem }) {
  return (
    <div className="bg-surface-elevated border border-border/40 rounded-xl p-3">
      <p className="text-xs font-bold text-foreground">{item.title}</p>
      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{item.body}</p>
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
      <div className={cn("p-2 rounded-full bg-surface-elevated mb-1", color)}>{icon}</div>
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
        {label}
      </p>
      <p className="text-xl font-black">{value}</p>
    </div>
  );
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
          const timeFreeLabel = getTimeFreeLabel(novel);
          const badges = getAnalysisBadges(novel);

          return (
            <div
              key={`${mode}-${novel.id}-${idx}`}
              onClick={() => onSelect?.(novel)}
              className={cn(
                "flex items-center gap-3 py-2 px-2 rounded-lg transition-colors",
                onSelect ? "hover:bg-surface-elevated cursor-pointer group" : "cursor-default"
              )}
            >
              <span
                className={cn(
                  "w-5 text-center font-mono font-black text-sm",
                  idx < 3 ? "text-primary" : "text-muted-foreground/40"
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
                {timeFreeLabel && (
                  <span className="absolute -bottom-1 -right-1 inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-bold bg-amber-400 text-black leading-none shadow">
                    <Zap size={8} />
                    {timeFreeLabel}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold truncate group-hover:text-primary transition-colors">
                  {novel.title}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <PlatformBadge platform={novel.platform as any} size="sm" />
                  <span className="text-[10px] text-muted-foreground truncate">
                    {novel.author}
                  </span>
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
                      (novel.viewsChangePct || 0) >= 0 ? "text-up" : "text-down"
                    )}
                  >
                    {(novel.viewsChangePct || 0) >= 0 ? "+" : ""}
                    {(novel.viewsChangePct || 0).toFixed(1)}%
                  </div>
                )}
                {mode === "publisher" && (
                  <div className="text-xs font-mono font-black text-primary/90">
                    #{novel.todayRank ?? "-"}
                  </div>
                )}
                {mode === "new" && (
                  <div className="text-xs font-mono font-black text-emerald-400">
                    NEW
                  </div>
                )}
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {novel.publisher}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
    const enrichedData = attachRidiInnerRank(
      sourceData as UnifiedNovel[],
      maxStats.maxCommentsByPlatform,
      maxStats.maxDeltaByPlatform
    ) as Novel[];

    const overall = [...enrichedData]
      .sort((a, b) => {
        const scoreA = computeUnifiedScore(
          a as UnifiedNovel,
          maxStats.maxViewsByPlatform,
          maxStats.maxCommentsByPlatform,
          maxStats.maxDeltaByPlatform
        );
        const scoreB = computeUnifiedScore(
          b as UnifiedNovel,
          maxStats.maxViewsByPlatform,
          maxStats.maxCommentsByPlatform,
          maxStats.maxDeltaByPlatform
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
          maxStats.maxDeltaByPlatform
        );
        const scoreB = computeTrendScore(
          b as UnifiedNovel,
          maxStats.maxViewsByPlatform,
          maxStats.maxCommentsByPlatform,
          maxStats.maxDeltaByPlatform
        );
        return scoreB - scoreA;
      })
      .slice(0, 10);

    const newTop = [...enrichedData]
      .filter((n) => n.isNew)
      .sort((a, b) => (b.viewsChangePct || 0) - (a.viewsChangePct || 0))
      .slice(0, 10);

    type PublisherStats = {
  count: number;          // 작품 수
  totalViews: number;     // 총 조회수
  bestRank: number;       // 최고 순위 (작을수록 좋음)
  sumRank: number;        // 순위 합 (avgRank 계산용)
  top5Count: number;      // 오늘 순위 5위 이내 작품 수
  trendHits: number;      // 트렌드 TOP10 진입 수
};

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
      top5Count: 0,
      trendHits: 0,
    };

  const rank = typeof n.todayRank === "number" ? n.todayRank : 999;

  prev.count += 1;
  prev.totalViews += Number(n.todayViews || 0);
  prev.bestRank = Math.min(prev.bestRank, rank);
  prev.sumRank += rank;
  if (rank > 0 && rank <= 5) prev.top5Count += 1;
  if (trendIds.has(n.id)) prev.trendHits += 1;

  publisherMap.set(key, prev);
});

    const publisherTop = [...publisherMap.entries()]
  .map(([publisher, s]) => {
    const avgRank = s.count > 0 ? s.sumRank / s.count : 999;

    const volumeScore =
      Math.log10(s.totalViews + 1) * 25 + // 조회수 체급
      s.count * 4;                        // 작품 수

    const qualityScore =
      (s.bestRank < 999 ? 80 - s.bestRank : 0) + // 최고 순위 보너스
      (avgRank < 999 ? 60 - Math.min(avgRank, 60) : 0); // 평균 순위 보너스

    const trendScore = s.trendHits * 30; // 트렌드 진입 보너스

    const score = volumeScore + qualityScore + trendScore;

    return { publisher, score };
  })
  .sort((a, b) => b.score - a.score)
  .slice(0, 10);

const publisherTop10: Novel[] = publisherTop
  .map((p) =>
    enrichedData.find((n) => (n.publisher || "-") === p.publisher)
  )
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

    const promoCount = sourceData.filter(
      (n) => n.promotion?.timeFreeType && n.promotion.timeFreeType !== "none"
    ).length;
    const viralCount = sourceData.filter(
      (n) =>
        (n.viewsChangePct || 0) >= 20 &&
        (!n.promotion || n.promotion.timeFreeType === "none")
    ).length;
    const leadingPublisher = publisherTop[0]?.publisher || "-";

    // ✅ 종합 TOP10, 트렌드 TOP10 기준 플랫폼 리더 계산
    const overallPlatformMap: Record<string, number> = {};
    overall.forEach((n) => {
      overallPlatformMap[n.platform] = (overallPlatformMap[n.platform] || 0) + 1;
    });
    const overallLeader =
      Object.entries(overallPlatformMap).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      "kakao";

    const trendPlatformMap: Record<string, number> = {};
    trend.forEach((n) => {
      trendPlatformMap[n.platform] = (trendPlatformMap[n.platform] || 0) + 1;
    });
    const trendLeader =
      Object.entries(trendPlatformMap).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      "kakao";

    const insights: InsightItem[] = [
      {
        title: "시장 중심축",
        body: `종합 인기 TOP 10에서는 ${overallLeader.toUpperCase()} 플랫폼이, 실시간 트렌드 TOP 10에서는 ${trendLeader.toUpperCase()} 플랫폼이 주도권을 잡고 있어요.`,
      },
      {
        title: "프로모션 영향",
        body: `시간제 무료·프로모션이 적용된 작품이 총 ${promoCount}개로, 상위권 흐름에 상당한 영향을 주는 구간이에요.`,
      },
      {
        title: "바이럴 움직임",
        body: `프로모션 없이도 조회수가 20% 이상 급등한 작품이 ${viralCount}개 감지돼, 후기·입소문 중심의 상승도 동시에 나타나고 있어요.`,
      },
      {
        title: "출판사 포인트",
        body: `${leadingPublisher}가 오늘 기준 대표작 성과와 상위 노출에서 가장 두드러진 출판사예요.`,
      },
    ];

    return {
      overallTop10: overall,
      trendTop10: trend,
      publisherTop10: publisherTop,
      newTop10: newTop,
      stats: { total, new: newCount, changed: changedCount, reEntry: reEntryCount },
      platformData: pData,
      genreStackedData: gData,
      overviewInsights: insights,
      overallLeader,
      trendLeader,
    };
  }, [sourceData]);

  const sourceNovels: Novel[] = sourceData && sourceData.length > 0 ? sourceData : [];
  const fixedDetailNovel = selectedNovel ?? trendTop10[0] ?? overallTop10[0] ?? null;

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

      {/* 차트 두 개를 한 카드로 묶음 */}
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
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false} />
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
          subtitle="출판사 대표작 기준 존재감 랭킹"
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
