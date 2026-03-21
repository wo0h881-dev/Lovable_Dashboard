import { useMemo } from "react";
import { Trophy, TrendingUp, Star, MessageSquare } from "lucide-react";
import { useTodayCombined, type ScoredNovel } from "@/hooks/useTodayCombined";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import { NovelCover } from "@/components/shared/NovelCover";
import { cn } from "@/lib/utils";

// 기존에 상단에서 사용하시던 컴포넌트들이 있다면 여기서 import 하세요.
// 예: import { StatsOverview } from "@/components/overview/StatsOverview";
// 예: import { GenreChart } from "@/components/overview/GenreChart";

export default function OverviewPage() {
  const { data, isLoading, error, latestDate } = useTodayCombined();

  // 1. 데이터 정렬 (종합 vs 트렌드)
  const { overallTop5, trendTop5 } = useMemo(() => {
    if (!data) return { overallTop5: [], trendTop5: [] };

    const overall = [...data]
      .sort((a, b) => (b as any).overallScore - (a as any).overallScore)
      .slice(0, 5);

    const trend = [...data]
      .sort((a, b) => (b as any).trendScore - (a as any).trendScore)
      .slice(0, 5);

    return { overallTop5: overall, trendTop5: trend };
  }, [data]);

  if (isLoading) return <div className="p-8 text-center text-sm text-muted-foreground">데이터 분석 중...</div>;
  if (error) return <div className="p-8 text-center text-sm text-red-500">에러: {error}</div>;

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* --- [상단 섹션]: 원래 쓰시던 코드 자리 --- */}
      {/* 여기에 원래 있던 <StatsOverview />, <GenreChart /> 등을 그대로 두시면 됩니다.
          기존 코드를 제가 다 알지 못해, 헤더 부분만 간단히 유지해 두었습니다.
      */}
      <div>
        <h1 className="text-2xl font-black tracking-tight">오늘의 대시보드</h1>
        <p className="text-sm text-muted-foreground mt-1">{latestDate} 업데이트</p>
      </div>

      {/* 기존에 있던 차트나 통계 카드가 이 자리에 있었다면 그대로 두세요! */}
      {/* ------------------------------------------ */}


      {/* --- [하단 섹션]: 순위표 자리를 2열 랭킹으로 교체 --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 왼쪽: 종합 랭킹 */}
        <div className="surface-card">
          <div className="flex items-center gap-2 mb-5">
            <Trophy size={18} className="text-amber-500" />
            <h2 className="font-bold">종합 인기 TOP 5</h2>
          </div>
          <div className="space-y-4">
            {overallTop5.map((novel, idx) => (
              <RankingRow key={`ov-${novel.id}`} novel={novel} rank={idx + 1} type="overall" />
            ))}
          </div>
        </div>

        {/* 오른쪽: 급상승 트렌드 */}
        <div className="surface-card">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={18} className="text-blue-500" />
            <h2 className="font-bold">실시간 트렌드 TOP 5</h2>
          </div>
          <div className="space-y-4">
            {trendTop5.map((novel, idx) => (
              <RankingRow key={`tr-${novel.id}`} novel={novel} rank={idx + 1} type="trend" />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

/**
 * 하단 순위표 전용 심플한 로우 컴포넌트
 */
function RankingRow({ novel, rank, type }: { novel: ScoredNovel; rank: number; type: 'overall' | 'trend' }) {
  return (
    <div className="flex items-center gap-3 group cursor-pointer">
      <span className="w-5 text-center font-mono font-black text-muted-foreground/40 group-hover:text-primary transition-colors">
        {rank}
      </span>
      <NovelCover novel={novel} size="sm" className="rounded shadow-sm" />
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold truncate leading-none mb-1">{novel.title}</h3>
        <div className="flex items-center gap-1.5">
          <PlatformBadge platform={novel.platform} size="sm" />
          <span className="text-[10px] text-muted-foreground">{novel.genre}</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        {type === 'overall' ? (
          <div className="flex items-center gap-0.5 text-amber-500 font-mono text-xs font-bold">
            <Star size={10} fill="currentColor" />
            {novel.rating.toFixed(1)}
          </div>
        ) : (
          <div className={cn(
            "text-[11px] font-mono font-bold",
            novel.viewsChangePct >= 0 ? "text-up" : "text-down"
          )}>
            {novel.viewsChangePct >= 0 ? '▲' : '▼'}{Math.abs(novel.viewsChangePct).toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
}
