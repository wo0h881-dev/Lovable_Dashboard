// src/pages/Overview.tsx 전체 코드

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BookOpen, RefreshCw, TrendingUp, Zap, Calendar } from "lucide-react"; // Calendar 아이콘 추가
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import { KpiCard } from "@/components/shared/KpiCard";
import { RankingCard } from "@/components/shared/RankingCard";
import { NovelDetailDrawer } from "@/components/shared/NovelDetailDrawer";
import { useTodayCombined } from "@/hooks/useTodayCombined";

const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function OverviewPage() {
  const [selectedNovel, setSelectedNovel] = useState<any>(null);
  
  // 훅에서 데이터와 함께 최신 날짜(latestDate)를 가져옵니다.
  const { data: novels, isLoading, error, latestDate } = useTodayCombined();

  const stats = useMemo(() => {
    if (!novels || novels.length === 0) return null;
    let newWorksCount = 0;
    let rankMovedCount = 0;
    let reEntryCount = 0;
    const platformCounts = { naver: 0, kakao: 0, ridi: 0 };
    const genreDataMap: Record<string, any> = {};

    novels.forEach((n) => {
      if (n.isNew) newWorksCount++;
      if (n.isReEntry) reEntryCount++;
      if (n.prevRank && n.prevRank !== n.todayRank) rankMovedCount++;
      platformCounts[n.platform]++;
      const g = n.genre || "기타";
      if (!genreDataMap[g]) genreDataMap[g] = { genre: g, naver: 0, kakao: 0, ridi: 0 };
      genreDataMap[g][n.platform]++;
    });

    const total = novels.length;
    return {
      newWorksCount, rankMovedCount, reEntryCount,
      shareData: [
        { name: "네이버", value: Math.round((platformCounts.naver / total) * 100), color: "hsl(var(--naver))" },
        { name: "카카오", value: Math.round((platformCounts.kakao / total) * 100), color: "hsl(var(--kakao))" },
        { name: "리디", value: Math.round((platformCounts.ridi / total) * 100), color: "hsl(var(--ridi))" },
      ].filter(d => d.value > 0),
      genreBarData: Object.values(genreDataMap)
    };
  }, [novels]);

  if (error) return <div className="p-10 text-red-500">에러: {error}</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight">전체 개요</h1>
          {/* 날짜 표시 부분: 최신 데이터 날짜를 보여줌 */}
          <div className="mt-1 flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
            <Calendar size={12} className="text-primary" />
            <span>{latestDate ? `${latestDate.replace(/-/g, '.')} 데이터` : "데이터 확인 중..."}</span>
            <span className="opacity-50">·</span>
            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">LATEST</span>
          </div>
        </div>
      </header>

      {/* KPI 카드 */}
      <motion.div className="grid grid-cols-2 gap-4 xl:grid-cols-4" {...fadeInUp}>
        <KpiCard title="분석 작품" value={novels?.length || 0} icon={BookOpen} suffix="편" />
        <KpiCard title="신작" value={stats?.newWorksCount || 0} icon={Zap} />
        <KpiCard title="순위 변동" value={stats?.rankMovedCount || 0} icon={TrendingUp} />
        <KpiCard title="재진입" value={stats?.reEntryCount || 0} icon={RefreshCw} />
      </motion.div>

      {/* 차트 섹션 */}
      <motion.div className="grid grid-cols-1 gap-4 xl:grid-cols-3" {...fadeInUp} transition={{ delay: 0.1 }}>
        <div className="surface-card">
          <h2 className="mb-4 text-sm font-bold">플랫폼 점유율</h2>
          <div className="h-[200px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={stats?.shareData || []} dataKey="value" innerRadius={55} outerRadius={80}>
                  {stats?.shareData.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="surface-card xl:col-span-2">
          <h2 className="mb-4 text-sm font-bold">장르별 분포</h2>
          <div className="h-[200px]">
            <ResponsiveContainer>
              <BarChart data={stats?.genreBarData || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="genre" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="naver" fill="hsl(var(--naver))" stackId="a" />
                <Bar dataKey="kakao" fill="hsl(var(--kakao))" stackId="a" />
                <Bar dataKey="ridi" fill="hsl(var(--ridi))" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* 리스트 */}
      <section>
        <h2 className="mb-4 text-sm font-bold">통합 TOP 10</h2>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <div key={i} className="h-20 w-full animate-pulse rounded-xl bg-surface-elevated" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {novels?.slice(0, 10).map((novel) => (
              <RankingCard key={novel.id} novel={novel} rank={novel.todayRank} onClick={setSelectedNovel} />
            ))}
          </div>
        )}
      </section>

      <NovelDetailDrawer novel={selectedNovel} onClose={() => setSelectedNovel(null)} />
    </div>
  );
}
