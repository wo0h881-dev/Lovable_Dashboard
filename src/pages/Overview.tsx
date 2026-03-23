// src/pages/Overview.tsx
import { useMemo, useState } from "react";
import { Trophy, TrendingUp, Star, BookOpen, Zap, RefreshCw, LogIn, ChevronRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { useTodayCombined } from "@/hooks/useTodayCombined";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import { NovelCover } from "@/components/shared/NovelCover";
import { NovelDetailDrawer } from "@/components/shared/NovelDetailDrawer";
import { 
  getPlatformMaxStats, 
  attachRidiInnerRank, 
  computeUnifiedScore, 
  computeTrendScore,
  type UnifiedNovel 
} from "@/lib/rankingScore";
import { cn } from "@/lib/utils";
import { type Novel } from "@/data/mockData";
import { LoadingScreen } from "@/components/shared/LoadingScreen";

const PLATFORM_COLORS: Record<string, string> = {
  naver: "#10b981",
  kakao: "#facc15",
  ridi: "#1e40af",
};

export default function OverviewPage() {
  const { data: sourceData, isLoading, error, latestDate } = useTodayCombined();
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);

  const { overallTop10, trendTop10, stats, platformData, genreStackedData } = useMemo(() => {
    if (!sourceData || sourceData.length === 0) {
      return { overallTop10: [], trendTop10: [], stats: { total: 0, new: 0, changed: 0, reEntry: 0 }, platformData: [], genreStackedData: [] };
    }

    const maxStats = getPlatformMaxStats(sourceData as UnifiedNovel[]);
    const enrichedData = attachRidiInnerRank(
      sourceData as UnifiedNovel[],
      maxStats.maxCommentsByPlatform,
      maxStats.maxDeltaByPlatform
    );

    const overall = [...enrichedData]
      .sort((a, b) => {
        const scoreA = computeUnifiedScore(a, maxStats.maxViewsByPlatform, maxStats.maxCommentsByPlatform, maxStats.maxDeltaByPlatform);
        const scoreB = computeUnifiedScore(b, maxStats.maxViewsByPlatform, maxStats.maxCommentsByPlatform, maxStats.maxDeltaByPlatform);
        return scoreB - scoreA;
      })
      .slice(0, 10);

    const trend = [...enrichedData]
      .sort((a, b) => {
        const scoreA = computeTrendScore(a, maxStats.maxViewsByPlatform, maxStats.maxCommentsByPlatform, maxStats.maxDeltaByPlatform);
        const scoreB = computeTrendScore(b, maxStats.maxViewsByPlatform, maxStats.maxCommentsByPlatform, maxStats.maxDeltaByPlatform);
        return scoreB - scoreA;
      })
      .slice(0, 10);

    const total = sourceData.length;
    const newCount = sourceData.filter(n => n.isNew).length;
    const reEntryCount = sourceData.filter(n => n.isReEntry).length;
    const changedCount = sourceData.filter(n => (n.rankChange || 0) !== 0).length;

    const pMap: Record<string, number> = {};
    sourceData.forEach(n => { pMap[n.platform] = (pMap[n.platform] || 0) + 1; });
    const pData = Object.entries(pMap).map(([name, value]) => ({ name: name.toUpperCase(), value, key: name }));

    const gMap: Record<string, any> = {};
    sourceData.forEach(n => {
      if (!gMap[n.genre]) gMap[n.genre] = { name: n.genre, naver: 0, kakao: 0, ridi: 0, total: 0 };
      gMap[n.genre][n.platform] += 1;
      gMap[n.genre].total += 1;
    });
    const gData = Object.values(gMap).sort((a: any, b: any) => b.total - a.total).slice(0, 8);

    return { 
      overallTop10: overall, 
      trendTop10: trend, 
      stats: { total, new: newCount, changed: changedCount, reEntry: reEntryCount },
      platformData: pData,
      genreStackedData: gData
    };
  }, [sourceData]);

  // sourceNovels: 경쟁작 비교용 전체 목록
  const sourceNovels: Novel[] = sourceData && sourceData.length > 0 ? sourceData : [];

  if (isLoading) return <LoadingScreen />;
  if (error) return <div className="p-8 text-center text-red-500 font-bold">{error}</div>;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground italic">MARKET OVERVIEW</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">{latestDate} 기준 실시간 통합 대시보드</p>
        </div>
      </header>

      {/* 통계 요약 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<BookOpen size={18} />} label="분석 작품" value={`${stats.total}개`} color="text-blue-500" />
        <StatCard icon={<Zap size={18} />} label="오늘의 신작" value={`${stats.new}개`} color="text-amber-500" />
        <StatCard icon={<RefreshCw size={18} />} label="순위 변동" value={`${stats.changed}개`} color="text-emerald-500" />
        <StatCard icon={<LogIn size={18} />} label="차트 재진입" value={`${stats.reEntry}개`} color="text-purple-500" />
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="surface-card h-[350px] flex flex-col shadow-sm border border-border/40">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">플랫폼별 작품 점유율</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={platformData} innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value">
                  {platformData.map((entry) => (
                    <Cell key={entry.key} fill={PLATFORM_COLORS[entry.key]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-card h-[350px] flex flex-col shadow-sm border border-border/40">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">장르별 플랫폼 상세 분포</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={genreStackedData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 11, fontWeight: 'bold' }} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                <Legend verticalAlign="top" align="right" iconType="rect" />
                <Bar dataKey="kakao" stackId="a" fill={PLATFORM_COLORS.kakao} name="카카오" />
                <Bar dataKey="naver" stackId="a" fill={PLATFORM_COLORS.naver} name="네이버" />
                <Bar dataKey="ridi" stackId="a" fill={PLATFORM_COLORS.ridi} name="리디" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 랭킹 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RankingBox 
          title="종합 인기 TOP 10" 
          subtitle="체급 및 시장 점유율 기반 대작 랭킹"
          icon={<Trophy className="text-amber-500" size={20} />} 
          data={overallTop10} 
          type="overall"
          onSelect={setSelectedNovel}
        />
        <RankingBox 
          title="실시간 트렌드 TOP 10" 
          subtitle="조회수 급증 및 화제성 중심 랭킹"
          icon={<TrendingUp className="text-blue-500" size={20} />} 
          data={trendTop10} 
          type="trend"
          onSelect={setSelectedNovel}
        />
      </div>

      {/* 상세 정보 Drawer — allNovels, latestDate, onSelectNovel 전달 */}
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

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
  return (
    <div className="surface-card p-4 flex flex-col items-center gap-1 border border-border/40">
      <div className={cn("p-2 rounded-full bg-surface-elevated mb-1", color)}>{icon}</div>
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
      <p className="text-xl font-black">{value}</p>
    </div>
  );
}

function RankingBox({ title, subtitle, icon, data, type, onSelect }: any) {
  return (
    <div className="surface-card border border-border/50 shadow-sm">
      <div className="flex flex-col mb-6">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="font-extrabold text-lg tracking-tight">{title}</h2>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5 ml-7 font-medium uppercase">{subtitle}</p>
      </div>

      <div className="space-y-1">
        {data.map((novel: any, idx: number) => (
          <div 
            key={novel.id} 
            onClick={() => onSelect(novel)}
            className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-surface-elevated cursor-pointer group transition-colors"
          >
            <span className={cn(
              "w-5 text-center font-mono font-black text-sm", 
              idx < 3 ? "text-primary" : "text-muted-foreground/30"
            )}>
              {idx + 1}
            </span>
            <NovelCover novel={novel} size="sm" className="rounded shadow-sm shrink-0 w-8 h-10" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold truncate group-hover:text-primary transition-colors">{novel.title}</h3>
              <div className="flex items-center gap-2">
                <PlatformBadge platform={novel.platform} size="sm" />
                <span className="text-[10px] text-muted-foreground truncate">{novel.author}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              {type === 'overall' ? (
                <div className="flex items-center gap-0.5 text-amber-500 font-mono text-xs font-bold">
                  <Star size={10} fill="currentColor" /> {novel.rating.toFixed(1)}
                </div>
              ) : (
                <div className={cn("text-xs font-mono font-black", (novel.viewsChangePct || 0) >= 0 ? "text-up" : "text-down")}>
                  {(novel.viewsChangePct || 0) >= 0 ? '▲' : '▼'}{Math.abs(novel.viewsChangePct || 0).toFixed(1)}%
                </div>
              )}
            </div>
            <ChevronRight size={14} className="text-muted-foreground/20 group-hover:text-primary transition-colors" />
          </div>
        ))}
      </div>
    </div>
  );
}
