import { useMemo } from "react";
import { Trophy, TrendingUp, Star, BookOpen, Zap, RefreshCw, LogIn } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { useTodayCombined } from "@/hooks/useTodayCombined";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import { NovelCover } from "@/components/shared/NovelCover";
import { 
  getPlatformMaxStats, 
  attachRidiInnerRank, 
  computeUnifiedScore, 
  computeTrendScore,
  type UnifiedNovel 
} from "@/lib/rankingScore";
import { cn } from "@/lib/utils";

// 플랫폼 테마 색상 (차트 및 UI용)
const PLATFORM_COLORS: Record<string, string> = {
  naver: "#10b981", // 네이버 그린
  kakao: "#facc15", // 카카오 옐로우
  ridi: "#1e40af",  // 리디 블루
};

export default function OverviewPage() {
  const { data: sourceData, isLoading, error, latestDate } = useTodayCombined();

  // 1. 데이터 가공 및 랭킹 산출 (제공해주신 rankingScore.ts 로직 적용)
  const { overallTop5, trendTop5, stats, platformData, genreStackedData } = useMemo(() => {
    if (!sourceData || sourceData.length === 0) {
      return { overallTop5: [], trendTop5: [], stats: { total: 0, new: 0, changed: 0, reEntry: 0 }, platformData: [], genreStackedData: [] };
    }

    // 🔹 A. 플랫폼별 Max 스탯 계산 (정규화용)
    const maxStats = getPlatformMaxStats(sourceData as UnifiedNovel[]);

    // 🔹 B. 리디북스 선행 순위(ridiInnerRank) 주입
    // 이 과정을 거쳐야 리디 작품들이 공정한 Rank Score를 부여받습니다.
    const enrichedData = attachRidiInnerRank(
      sourceData as UnifiedNovel[],
      maxStats.maxCommentsByPlatform,
      maxStats.maxDeltaByPlatform
    );

    // 🔹 C. [종합 인기 TOP 5] 정렬 (시장 점유율 + 누적 체급 중심)
    const overall = [...enrichedData]
      .sort((a, b) => {
        const scoreA = computeUnifiedScore(a, maxStats.maxViewsByPlatform, maxStats.maxCommentsByPlatform, maxStats.maxDeltaByPlatform);
        const scoreB = computeUnifiedScore(b, maxStats.maxViewsByPlatform, maxStats.maxCommentsByPlatform, maxStats.maxDeltaByPlatform);
        return scoreB - scoreA; // 점수 높은 순
      })
      .slice(0, 5);

    // 🔹 D. [실시간 트렌드 TOP 5] 정렬 (기세/증감률 중심 - 플랫폼 가중치 제외)
    const trend = [...enrichedData]
      .sort((a, b) => {
        const scoreA = computeTrendScore(a, maxStats.maxViewsByPlatform, maxStats.maxCommentsByPlatform, maxStats.maxDeltaByPlatform);
        const scoreB = computeTrendScore(b, maxStats.maxViewsByPlatform, maxStats.maxCommentsByPlatform, maxStats.maxDeltaByPlatform);
        return scoreB - scoreA; // 점수 높은 순
      })
      .slice(0, 5);

    // 🔹 E. 상단 통계 카드 데이터
    const total = sourceData.length;
    const newCount = sourceData.filter(n => n.isNew).length;
    const reEntryCount = sourceData.filter(n => n.isReEntry).length;
    const changedCount = sourceData.filter(n => (n.rankChange || 0) !== 0).length;

    // 🔹 F. 차트 데이터 (플랫폼 점유율)
    const pMap: Record<string, number> = {};
    sourceData.forEach(n => { pMap[n.platform] = (pMap[n.platform] || 0) + 1; });
    const pData = Object.entries(pMap).map(([name, value]) => ({ name: name.toUpperCase(), value, key: name }));

    // 🔹 G. 차트 데이터 (장르별 플랫폼 누적 분포)
    const gMap: Record<string, any> = {};
    sourceData.forEach(n => {
      if (!gMap[n.genre]) gMap[n.genre] = { name: n.genre, naver: 0, kakao: 0, ridi: 0, total: 0 };
      gMap[n.genre][n.platform] += 1;
      gMap[n.genre].total += 1;
    });
    const gData = Object.values(gMap).sort((a: any, b: any) => b.total - a.total).slice(0, 8);

    return { 
      overallTop5: overall, 
      trendTop5: trend, 
      stats: { total, new: newCount, changed: changedCount, reEntry: reEntryCount },
      platformData: pData,
      genreStackedData: gData
    };
  }, [sourceData]);

  if (isLoading) return <div className="p-8 text-center animate-pulse text-muted-foreground">웹소설 시장 데이터 분석 중...</div>;
  if (error) return <div className="p-8 text-center text-red-500 font-bold">데이터 로드 에러: {error}</div>;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* 헤더 */}
      <header>
        <h1 className="text-2xl font-black tracking-tight text-foreground italic">MARKET OVERVIEW</h1>
        <p className="text-sm text-muted-foreground mt-1 font-medium">{latestDate} 기준 실시간 통합 대시보드</p>
      </header>

      {/* 1. 상단 요약 카드 (4가지 지표) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<BookOpen size={18} />} label="분석 작품" value={`${stats.total}개`} color="text-blue-500" />
        <StatCard icon={<Zap size={18} />} label="오늘의 신작" value={`${stats.new}개`} color="text-amber-500" />
        <StatCard icon={<RefreshCw size={18} />} label="순위 변동" value={`${stats.changed}개`} color="text-emerald-500" />
        <StatCard icon={<LogIn size={18} />} label="차트 재진입" value={`${stats.reEntry}개`} color="text-purple-500" />
      </div>

      {/* 2. 차트 섹션 (점유율 & 누적 분포) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 플랫폼 점유율 (원형) */}
        <div className="surface-card h-[350px] flex flex-col shadow-sm border border-border/40">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" /> 플랫폼별 작품 점유율
          </h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={platformData} innerRadius={70} outerRadius={95} paddingAngle={8} dataKey="value">
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

        {/* 장르별 플랫폼 분포 (누적 막대) */}
        <div className="surface-card h-[350px] flex flex-col shadow-sm border border-border/40">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" /> 장르별 플랫폼 상세 분포
          </h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={genreStackedData} layout="vertical" margin={{ left: 10, right: 30 }}>
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

      {/* 3. 하단 2열 랭킹 (종합 vs 트렌드 차별화) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 종합 인기 (누적/가중치 중심) */}
        <RankingBox 
          title="종합 인기 TOP 5" 
          subtitle="체급 및 시장 점유율 기반 대작 랭킹"
          icon={<Trophy className="text-amber-500" size={20} />} 
          data={overallTop5} 
          type="overall" 
        />

        {/* 실시간 트렌드 (증감/기세 중심) */}
        <RankingBox 
          title="실시간 트렌드 TOP 5" 
          subtitle="오늘 조회수 증감 및 화제성 중심 랭킹"
          icon={<TrendingUp className="text-blue-500" size={20} />} 
          data={trendTop5} 
          type="trend" 
        />
      </div>
    </div>
  );
}

// --- 내부 보조 컴포넌트 ---

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
  return (
    <div className="surface-card p-4 flex flex-col items-center gap-1 border border-border/40 transition-transform hover:scale-[1.02]">
      <div className={cn("p-2 rounded-full bg-surface-elevated mb-1 shadow-inner", color)}>{icon}</div>
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
      <p className="text-xl font-black">{value}</p>
    </div>
  );
}

function RankingBox({ title, subtitle, icon, data, type }: { title: string, subtitle: string, icon: React.ReactNode, data: any[], type: 'overall' | 'trend' }) {
  return (
    <div className="surface-card border border-border/50 shadow-sm relative overflow-hidden">
      {/* 배경 장식 */}
      <div className={cn("absolute top-0 right-0 w-24 h-24 opacity-[0.03] -mr-8 -mt-8", type === 'overall' ? "bg-amber-500" : "bg-blue-500")} style={{ borderRadius: '50%' }} />
      
      <div className="flex flex-col mb-6">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="font-extrabold text-lg tracking-tight">{title}</h2>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5 ml-7 font-medium uppercase">{subtitle}</p>
      </div>

      <div className="space-y-4">
        {data.map((novel, idx) => (
          <div key={novel.id} className="flex items-center gap-4 py-1 group cursor-default">
            {/* 순위 */}
            <span className={cn(
              "w-6 text-center font-mono font-black text-lg transition-colors", 
              idx === 0 ? "text-primary scale-110" : "text-muted-foreground/30 group-hover:text-muted-foreground"
            )}>
              {idx + 1}
            </span>
            
            {/* 커버 */}
            <NovelCover novel={novel} size="sm" className="rounded-md shadow-md shrink-0 border border-border/20 group-hover:ring-2 ring-primary/20 transition-all" />
            
            {/* 정보 */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold truncate text-foreground group-hover:text-primary transition-colors leading-tight">{novel.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <PlatformBadge platform={novel.platform} size="sm" />
                <span className="text-[11px] text-muted-foreground font-medium">{novel.genre}</span>
              </div>
            </div>

            {/* 우측 수치 (모드별 차별화 표시) */}
            <div className="text-right shrink-0">
              {type === 'overall' ? (
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-0.5 text-amber-500 font-mono text-xs font-black">
                    <Star size={10} fill="currentColor" /> {novel.rating.toFixed(1)}
                  </div>
                  <span className="text-[9px] text-muted-foreground font-bold tracking-tighter uppercase">
                    {novel.platform === 'ridi' && novel.ridiInnerRank ? `RIDI #${novel.ridiInnerRank}` : "STABLE"}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-end">
                  <div className={cn("text-xs font-mono font-black", (novel.viewsChangePct || 0) >= 0 ? "text-up" : "text-down")}>
                    {(novel.viewsChangePct || 0) >= 0 ? '▲' : '▼'}{Math.abs(novel.viewsChangePct || 0).toFixed(1)}%
                  </div>
                  <span className="text-[9px] text-primary font-black tracking-tighter uppercase">Trending</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
