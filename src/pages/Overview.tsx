// src/pages/Overview.tsx
import { useMemo } from "react";
import { Trophy, TrendingUp, Star, MessageSquare, BookOpen, Users } from "lucide-react";
import { useTodayCombined, type ScoredNovel } from "@/hooks/useTodayCombined";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import { NovelCover } from "@/components/shared/NovelCover";
import { cn } from "@/lib/utils";

export default function OverviewPage() {
  const { data, isLoading, error, latestDate } = useTodayCombined();

  // 1. 데이터 분석 및 정렬
  const { overallTop5, trendTop5, stats } = useMemo(() => {
    if (!data || data.length === 0) {
      return { overallTop5: [], trendTop5: [], stats: { total: 0, avgRating: 0 } };
    }

    const overall = [...data]
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 5);

    const trend = [...data]
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, 5);

    const total = data.length;
    const avgRating = data.reduce((acc, curr) => acc + curr.rating, 0) / total;

    return { overallTop5: overall, trendTop5: trend, stats: { total, avgRating } };
  }, [data]);

  if (isLoading) return <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">데이터를 분석하고 있습니다...</div>;
  if (error) return <div className="p-8 text-center text-sm text-red-500 font-medium">데이터 로드 실패: {error}</div>;

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* 헤더 섹션 */}
      <section>
        <h1 className="text-2xl font-black tracking-tight text-foreground">오늘의 대시보드</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {latestDate} 기준 · 플랫폼 통합 랭킹 및 트렌드 분석
        </p>
      </section>

      {/* 요약 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<BookOpen size={16} />} label="분석 작품 수" value={`${stats.total}개`} color="text-blue-500" />
        <StatCard icon={<Star size={16} />} label="평균 평점" value={stats.avgRating.toFixed(2)} color="text-amber-500" />
        <StatCard icon={<Users size={16} />} label="수집 플랫폼" value="3개" color="text-emerald-500" />
        <StatCard icon={<TrendingUp size={16} />} label="업데이트" value="실시간" color="text-purple-500" />
      </div>

      {/* 2열 랭킹 리스트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 왼쪽: 종합 랭킹 (Overall) */}
        <div className="surface-card shadow-sm border border-border/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Trophy size={20} className="text-amber-500" />
              </div>
              <h2 className="font-bold text-lg tracking-tight">종합 랭킹 TOP 5</h2>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full uppercase tracking-widest">Overall</span>
          </div>
          
          <div className="divide-y divide-border/40">
            {overallTop5.map((novel, idx) => (
              <RankingItem key={`overall-${novel.id}`} novel={novel} rank={idx + 1} scoreType="overall" />
            ))}
          </div>
        </div>

        {/* 오른쪽: 급상승 트렌드 (Trend) */}
        <div className="surface-card shadow-sm border border-border/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <TrendingUp size={20} className="text-blue-500" />
              </div>
              <h2 className="font-bold text-lg tracking-tight">급상승 트렌드 TOP 5</h2>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full uppercase tracking-widest">Trending</span>
          </div>
          
          <div className="divide-y divide-border/40">
            {trendTop5.map((novel, idx) => (
              <RankingItem key={`trend-${novel.id}`} novel={novel} rank={idx + 1} scoreType="trend" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** 1. 상단 통계 카드 컴포넌트 */
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="surface-card p-4 flex flex-col items-center text-center gap-1 border border-border/40">
      <div className={cn("p-1.5 rounded-full bg-surface-elevated mb-1", color)}>
        {icon}
      </div>
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tighter">{label}</p>
      <p className="text-lg font-black">{value}</p>
    </div>
  );
}

/** 2. 랭킹 리스트 아이템 컴포넌트 */
function RankingItem({ novel, rank, scoreType }: { novel: ScoredNovel; rank: number; scoreType: 'overall' | 'trend' }) {
  return (
    <div className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0 group cursor-default">
      {/* 순위 숫자 */}
      <div className="w-6 text-center">
        <span className={cn(
          "font-mono font-black text-lg",
          rank === 1 ? "text-primary" : "text-muted-foreground/40"
        )}>
          {rank}
        </span>
      </div>
      
      {/* 커버 이미지 */}
      <div className="relative shrink-0">
        <NovelCover novel={novel} size="sm" className="shadow-md rounded-md overflow-hidden" />
        <div className="absolute -top-1 -left-1">
          <PlatformBadge platform={novel.platform} size="sm" className="scale-75 shadow-sm" />
        </div>
      </div>
      
      {/* 제목 및 작가 정보 */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold truncate text-foreground group-hover:text-primary transition-colors duration-200">
          {novel.title}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] text-muted-foreground truncate">{novel.author}</span>
          <span className="w-px h-2 bg-border shrink-0" />
          <span className="text-[11px] text-primary/70 font-medium">{novel.genre}</span>
        </div>
      </div>

      {/* 우측 지표 (종합 vs 트렌드에 따라 다름) */}
      <div className="text-right shrink-0">
        {scoreType === 'overall' ? (
          <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-0.5 text-amber-500 font-mono text-xs font-black">
              <Star size={10} fill="currentColor" />
              {novel.rating.toFixed(1)}
            </div>
            <div className="text-[10px] font-mono text-muted-foreground">
              Score: {Math.round(novel.overallScore).toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-end gap-0.5">
            <div className={cn(
              "text-xs font-mono font-black",
              novel.viewsChangePct >= 0 ? "text-up" : "text-down"
            )}>
              {novel.viewsChangePct >= 0 ? '▲' : '▼'}{Math.abs(novel.viewsChangePct).toFixed(1)}%
            </div>
            <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-0.5 leading-none">
              <MessageSquare size={9} />
              {novel.commentCount > 10000 ? `${(novel.commentCount / 10000).toFixed(1)}만` : novel.commentCount.toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
