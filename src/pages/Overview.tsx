import { useMemo } from "react";
import { Trophy, TrendingUp, Star, BookOpen, Users, BarChart3 } from "lucide-react";
import { useTodayCombined, type ScoredNovel } from "@/hooks/useTodayCombined";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import { NovelCover } from "@/components/shared/NovelCover";
import { cn } from "@/lib/utils";

// --- 상단 통계 카드 컴포넌트 ---
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="surface-card p-5 flex flex-col items-center text-center gap-2 border border-border/40">
      <div className={cn("p-2 rounded-full bg-surface-elevated mb-1", color)}>
        {icon}
      </div>
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-xl font-black">{value}</p>
    </div>
  );
}

export default function OverviewPage() {
  const { data, isLoading, error, latestDate } = useTodayCombined();

  // 1. 데이터 정렬 및 통계 계산
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

  if (isLoading) return <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">데이터 로드 중...</div>;
  if (error) return <div className="p-8 text-center text-sm text-red-500 font-medium">오류: {error}</div>;

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* 1. 헤더 섹션 */}
      <section>
        <h1 className="text-2xl font-black tracking-tight text-foreground">오늘의 대시보드</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {latestDate} 기준 · 플랫폼 통합 실시간 분석
        </p>
      </section>

      {/* 2. 상단 통계 카드 (기존 상단 UI 복구) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<BookOpen size={18} />} label="분석 작품" value={`${stats.total}개`} color="text-blue-500" />
        <StatCard icon={<Star size={18} />} label="평균 평점" value={stats.avgRating.toFixed(2)} color="text-amber-500" />
        <StatCard icon={<Users size={18} />} label="플랫폼" value="3개" color="text-emerald-500" />
        <StatCard icon={<BarChart3 size={18} />} label="데이터 상태" value="정상" color="text-purple-500" />
      </div>

      {/* 3. 하단 랭킹 섹션 (순위표 자리를 2열로 교체) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 왼쪽: 종합 랭킹 TOP 5 */}
        <div className="surface-card shadow-sm border border-border/50">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Trophy size={20} className="text-amber-500" />
            </div>
            <h2 className="font-bold text-lg tracking-tight">종합 인기 TOP 5</h2>
          </div>
          
          <div className="space-y-4">
            {overallTop5.map((novel, idx) => (
              <RankingRow key={`ov-${novel.id}`} novel={novel} rank={idx + 1} type="overall" />
            ))}
          </div>
        </div>

        {/* 오른쪽: 급상승 트렌드 TOP 5 */}
        <div className="surface-card shadow-sm border border-border/50">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <TrendingUp size={20} className="text-blue-500" />
            </div>
            <h2 className="font-bold text-lg tracking-tight">실시간 트렌드 TOP 5</h2>
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

/** * 하단 랭킹용 심플 로우 컴포넌트 
 */
function RankingRow({ novel, rank, type }: { novel: ScoredNovel; rank: number; type: 'overall' | 'trend' }) {
  return (
    <div className="flex items-center gap-4 group">
      <span className={cn(
        "w-6 text-center font-mono font-black text-lg",
        rank === 1 ? "text-primary" : "text-muted-foreground/30"
      )}>
        {rank}
      </span>
      <NovelCover novel={novel} size="sm" className="rounded-md shadow-sm shrink-0" />
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold truncate text-foreground group-hover:text-primary transition-colors">
          {novel.title}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <PlatformBadge platform={novel.platform} size="sm" />
          <span className="text-[11px] text-muted-foreground font-medium">{novel.genre}</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        {type === 'overall' ? (
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-0.5 text-amber-500 font-mono text-xs font-black">
              <Star size={10} fill="currentColor" />
              {novel.rating.toFixed(1)}
            </div>
            <span className="text-[10px] text-muted-foreground">Rating</span>
          </div>
        ) : (
          <div className="flex flex-col items-end">
            <div className={cn(
              "text-xs font-mono font-black",
              novel.viewsChangePct >= 0 ? "text-up" : "text-down"
            )}>
              {novel.viewsChangePct >= 0 ? '▲' : '▼'}{Math.abs(novel.viewsChangePct).toFixed(1)}%
            </div>
            <span className="text-[10px] text-muted-foreground">Trending</span>
          </div>
        )}
      </div>
    </div>
  );
}
