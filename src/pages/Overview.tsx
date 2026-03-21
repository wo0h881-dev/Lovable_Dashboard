import { useMemo } from "react";
import { Trophy, TrendingUp, Star, BookOpen, Zap, RefreshCw, LogIn } from "lucide-react"; // Zap 대문자 확인
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { useTodayCombined, type ScoredNovel } from "@/hooks/useTodayCombined";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import { NovelCover } from "@/components/shared/NovelCover";
import { cn } from "@/lib/utils";

const PLATFORM_COLORS: Record<string, string> = {
  naver: "#10b981", // 초록
  kakao: "#facc15", // 노랑
  ridi: "#1e40af",  // 파랑
};

export default function OverviewPage() {
  const { data, isLoading, error, latestDate } = useTodayCombined();

  // 1. 데이터 가공
  const { overallTop5, trendTop5, stats, platformData, genreStackedData } = useMemo(() => {
    if (!data || data.length === 0) {
      return { overallTop5: [], trendTop5: [], stats: { total: 0, new: 0, changed: 0, reEntry: 0 }, platformData: [], genreStackedData: [] };
    }

    // 상단 카드 데이터
    const total = data.length;
    const newCount = data.filter(n => n.isNew).length;
    const reEntryCount = data.filter(n => n.isReEntry).length;
    const changedCount = data.filter(n => n.rankChange !== 0 && n.rankChange !== null).length;

    // 플랫폼 점유율 데이터
    const pMap: Record<string, number> = {};
    data.forEach(n => { pMap[n.platform] = (pMap[n.platform] || 0) + 1; });
    const pData = Object.entries(pMap).map(([name, value]) => ({ name: name.toUpperCase(), value, key: name }));

    // 🔥 장르별 플랫폼 누적 데이터 (Stacked Bar)
    const gMap: Record<string, any> = {};
    data.forEach(n => {
      if (!gMap[n.genre]) {
        gMap[n.genre] = { name: n.genre, naver: 0, kakao: 0, ridi: 0, total: 0 };
      }
      gMap[n.genre][n.platform] += 1;
      gMap[n.genre].total += 1;
    });
    
    const gData = Object.values(gMap)
      .sort((a: any, b: any) => b.total - a.total)
      .slice(0, 8); // 상위 8개 장르만

    return { 
      overallTop5: [...data].sort((a, b) => b.overallScore - a.overallScore).slice(0, 5),
      trendTop5: [...data].sort((a, b) => b.trendScore - a.trendScore).slice(0, 5),
      stats: { total, new: newCount, changed: changedCount, reEntry: reEntryCount },
      platformData: pData,
      genreStackedData: gData
    };
  }, [data]);

  if (isLoading) return <div className="p-8 text-center animate-pulse">데이터 분석 중...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <header>
        <h1 className="text-2xl font-black tracking-tight">오늘의 대시보드</h1>
        <p className="text-sm text-muted-foreground mt-1">{latestDate} 기준 분석</p>
      </header>

      {/* 2. 상단 카드 (신작 Zap 아이콘 포함) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<BookOpen size={18} />} label="분석 작품" value={`${stats.total}개`} color="text-blue-500" />
        <StatCard icon={<Zap size={18} />} label="신작" value={`${stats.new}개`} color="text-amber-500" />
        <StatCard icon={<RefreshCw size={18} />} label="순위 변동" value={`${stats.changed}개`} color="text-emerald-500" />
        <StatCard icon={<LogIn size={18} />} label="재진입" value={`${stats.reEntry}개`} color="text-purple-500" />
      </div>

      {/* 3. 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 플랫폼 점유율 */}
        <div className="surface-card h-[350px] flex flex-col shadow-sm">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">플랫폼 점유율</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={platformData} innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value">
                  {platformData.map((entry) => (
                    <Cell key={entry.key} fill={PLATFORM_COLORS[entry.key]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 🔥 장르별 분포 (플랫폼 누적 바 차트) */}
        <div className="surface-card h-[350px] flex flex-col shadow-sm">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">장르별 플랫폼 분포</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={genreStackedData} layout="vertical" margin={{ left: 10, right: 30 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 11 }} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Legend verticalAlign="top" align="right" />
                <Bar dataKey="kakao" stackId="a" fill={PLATFORM_COLORS.kakao} name="카카오" radius={[0, 0, 0, 0]} />
                <Bar dataKey="naver" stackId="a" fill={PLATFORM_COLORS.naver} name="네이버" radius={[0, 0, 0, 0]} />
                <Bar dataKey="ridi" stackId="a" fill={PLATFORM_COLORS.ridi} name="리디" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. 하단 2열 랭킹 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RankingBox title="종합 인기 TOP 5" icon={<Trophy className="text-amber-500" size={20} />} data={overallTop5} type="overall" />
        <RankingBox title="실시간 트렌드 TOP 5" icon={<TrendingUp className="text-blue-500" size={20} />} data={trendTop5} type="trend" />
      </div>
    </div>
  );
}

// --- 보조 컴포넌트들 ---

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
  return (
    <div className="surface-card p-4 flex flex-col items-center gap-1 border border-border/40">
      <div className={cn("p-2 rounded-full bg-surface-elevated mb-1", color)}>{icon}</div>
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-xl font-black">{value}</p>
    </div>
  );
}

function RankingBox({ title, icon, data, type }: { title: string, icon: React.ReactNode, data: ScoredNovel[], type: 'overall' | 'trend' }) {
  return (
    <div className="surface-card border border-border/50">
      <div className="flex items-center gap-2 mb-6">
        {icon}
        <h2 className="font-bold text-lg">{title}</h2>
      </div>
      <div className="space-y-4">
        {data.map((novel, idx) => (
          <div key={novel.id} className="flex items-center gap-4 py-1 group">
            <span className={cn("w-6 text-center font-mono font-black text-lg", idx === 0 ? "text-primary" : "text-muted-foreground/30")}>
              {idx + 1}
            </span>
            <NovelCover novel={novel} size="sm" className="rounded shadow-sm" />
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
        ))}
      </div>
    </div>
  );
}
