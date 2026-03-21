import { useMemo } from "react";
import { Trophy, TrendingUp, Star, BookOpen, zap, RefreshCw, LogIn } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { useTodayCombined, type ScoredNovel } from "@/hooks/useTodayCombined";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import { NovelCover } from "@/components/shared/NovelCover";
import { cn } from "@/lib/utils";

// --- 상수 및 차트 색상 ---
const PLATFORM_COLORS: Record<string, string> = {
  naver: "#10b981", // Emerald
  kakao: "#facc15", // Yellow
  ridi: "#1e40af",  // Blue
};

const GENRE_COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#8b5cf6", "#64748b"];

export default function OverviewPage() {
  const { data, isLoading, error, latestDate } = useTodayCombined();

  // 1. 데이터 분석 및 차트 데이터 생성
  const { overallTop5, trendTop5, stats, platformData, genreData } = useMemo(() => {
    if (!data || data.length === 0) {
      return { overallTop5: [], trendTop5: [], stats: { total: 0, new: 0, changed: 0, reEntry: 0 }, platformData: [], genreData: [] };
    }

    // 랭킹 데이터
    const overall = [...data].sort((a, b) => b.overallScore - a.overallScore).slice(0, 5);
    const trend = [...data].sort((a, b) => b.trendScore - a.trendScore).slice(0, 5);

    // 상단 카드 통계
    const total = data.length;
    const newCount = data.filter(n => n.isNew).length;
    const reEntryCount = data.filter(n => n.isReEntry).length;
    const changedCount = data.filter(n => n.rankChange !== 0 && n.rankChange !== null).length;

    // 플랫폼 점유율 (원형 차트)
    const pMap: Record<string, number> = {};
    data.forEach(n => { pMap[n.platform] = (pMap[n.platform] || 0) + 1; });
    const pData = Object.entries(pMap).map(([name, value]) => ({ name: name.toUpperCase(), value, key: name }));

    // 장르별 분포 (바 차트)
    const gMap: Record<string, number> = {};
    data.forEach(n => { gMap[n.genre] = (gMap[n.genre] || 0) + 1; });
    const gData = Object.entries(gMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return { 
      overallTop5: overall, 
      trendTop5: trend, 
      stats: { total, new: newCount, changed: changedCount, reEntry: reEntryCount },
      platformData: pData,
      genreData: gData
    };
  }, [data]);

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">데이터 로드 중...</div>;
  if (error) return <div className="p-8 text-center text-red-500 font-medium">{error}</div>;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* 1. 헤더 */}
      <header>
        <h1 className="text-2xl font-black tracking-tight text-foreground">오늘의 대시보드</h1>
        <p className="text-sm text-muted-foreground mt-1">{latestDate} 기준 통합 분석</p>
      </header>

      {/* 2. 상단 요약 카드 4종 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<BookOpen size={16} />} label="분석 작품" value={`${stats.total}개`} color="text-blue-500" />
        <StatCard icon={<zap size={16} />} label="신작" value={`${stats.new}개`} color="text-emerald-500" />
        <StatCard icon={<RefreshCw size={16} />} label="순위 변동" value={`${stats.changed}개`} color="text-amber-500" />
        <StatCard icon={<LogIn size={16} />} label="재진입" value={`${stats.reEntry}개`} color="text-purple-500" />
      </div>

      {/* 3. 차트 섹션 (점유율 & 장르분포) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 플랫폼 점유율 */}
        <div className="surface-card h-[300px] flex flex-col">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <div className="w-1 h-3 bg-primary rounded-full" /> 플랫폼 점유율
          </h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={platformData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {platformData.map((entry) => (
                    <Cell key={entry.key} fill={PLATFORM_COLORS[entry.key] || "#ccc"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 장르별 분포 */}
        <div className="surface-card h-[300px] flex flex-col">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <div className="w-1 h-3 bg-primary rounded-full" /> 장르별 분포
          </h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={genreData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={60} tick={{fontSize: 12}} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {genreData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={GENRE_COLORS[index % GENRE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. 하단 2열 랭킹 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 종합 인기 TOP 5 */}
        <div className="surface-card border border-border/50 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Trophy size={20} className="text-amber-500" />
            <h2 className="font-bold text-lg tracking-tight">종합 인기 TOP 5</h2>
          </div>
          <div className="space-y-4">
            {overallTop5.map((novel, idx) => (
              <RankingRow key={`ov-${novel.id}`} novel={novel} rank={idx + 1} type="overall" />
            ))}
          </div>
        </div>

        {/* 실시간 트렌드 TOP 5 */}
        <div className="surface-card border border-border/50 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={20} className="text-blue-500" />
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

// --- 보조 컴포넌트 (StatCard, RankingRow) ---
function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
  return (
    <div className="surface-card p-4 flex flex-col items-center gap-1 border border-border/30">
      <div className={cn("p-1.5 rounded-full bg-surface-elevated mb-1", color)}>{icon}</div>
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-lg font-black">{value}</p>
    </div>
  );
}

function RankingRow({ novel, rank, type }: { novel: ScoredNovel, rank: number, type: 'overall' | 'trend' }) {
  return (
    <div className="flex items-center gap-4 py-1 group">
      <span className={cn("w-6 text-center font-mono font-black text-lg", rank === 1 ? "text-primary" : "text-muted-foreground/30")}>
        {rank}
      </span>
      <NovelCover novel={novel} size="sm" className="rounded-md shadow-sm shrink-0" />
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold truncate group-hover:text-primary transition-colors">{novel.title}</h3>
        <div className="flex items-center gap-2 mt-1">
          <PlatformBadge platform={novel.platform} size="sm" />
          <span className="text-[11px] text-muted-foreground">{novel.genre}</span>
        </div>
      </div>
      <div className="text-right">
        {type === 'overall' ? (
          <div className="flex items-center gap-0.5 text-amber-500 font-mono text-xs font-black">
            <Star size={10} fill="currentColor" /> {novel.rating.toFixed(1)}
          </div>
        ) : (
          <div className={cn("text-xs font-mono font-black", novel.viewsChangePct >= 0 ? "text-up" : "text-down")}>
            {novel.viewsChangePct >= 0 ? '▲' : '▼'}{Math.abs(novel.viewsChangePct).toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
}
