// src/pages/Overview.tsx 

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BookOpen, RefreshCw, TrendingUp, Zap } from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import { KpiCard } from "@/components/shared/KpiCard";
import { RankingCard } from "@/components/shared/RankingCard";
import { NovelDetailDrawer } from "@/components/shared/NovelDetailDrawer";
import { type Novel } from "@/data/mockData";
import { useTodayCombined } from "@/hooks/useTodayCombined";

export default function OverviewPage() {
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);
  const { data: novels, isLoading, error } = useTodayCombined();

  const stats = useMemo(() => {
    if (!novels || novels.length === 0) return null;

    let newWorksCount = 0;
    let rankMovedCount = 0;
    let reEntryCount = 0;
    const platformCounts = { naver: 0, kakao: 0, ridi: 0 };
    const genreDataMap: Record<string, any> = {};

    novels.forEach((n) => {
      // 1. KPI 숫자 (isNew 등 훅에서 계산된 값 활용)
      if (n.isNew) newWorksCount++;
      if (n.isReEntry) reEntryCount++;
      if (n.prevRank && n.prevRank !== n.todayRank) rankMovedCount++;

      // 2. 플랫폼 카운트 (이게 이제 'naver', 'ridi'로 잘 들어올 겁니다)
      platformCounts[n.platform]++;

      // 3. 장르 분포
      const g = n.genre || "기타";
      if (!genreDataMap[g]) {
        genreDataMap[g] = { genre: g, naver: 0, kakao: 0, ridi: 0 };
      }
      genreDataMap[g][n.platform]++;
    });

    const total = novels.length;
    return {
      newWorksCount,
      rankMovedCount,
      reEntryCount,
      shareData: [
        { name: "네이버", value: Math.round((platformCounts.naver / total) * 100), color: "hsl(var(--naver))" },
        { name: "카카오", value: Math.round((platformCounts.kakao / total) * 100), color: "hsl(var(--kakao))" },
        { name: "리디", value: Math.round((platformCounts.ridi / total) * 100), color: "hsl(var(--ridi))" },
      ].filter(d => d.value > 0),
      genreBarData: Object.values(genreDataMap)
    };
  }, [novels]);

  if (isLoading) return <div className="p-10 text-center text-xs animate-pulse">데이터를 불러오는 중...</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-xl font-black">전체 개요</h1>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard title="전체 분석 작품" value={novels?.length || 0} icon={BookOpen} suffix="편" />
        <KpiCard title="신작" value={stats?.newWorksCount || 0} icon={Zap} />
        <KpiCard title="순위 변동" value={stats?.rankMovedCount || 0} icon={TrendingUp} />
        <KpiCard title="재진입" value={stats?.reEntryCount || 0} icon={RefreshCw} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* 플랫폼 차트 */}
        <div className="surface-card">
          <h2 className="mb-4 text-sm font-bold">플랫폼 점유율</h2>
          <div className="h-48">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={stats?.shareData || []} dataKey="value" innerRadius={50} outerRadius={70}>
                  {stats?.shareData.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* 장르 차트 */}
        <div className="surface-card xl:col-span-2">
          <h2 className="mb-4 text-sm font-bold">장르별 분포</h2>
          <div className="h-48">
            <ResponsiveContainer>
              <BarChart data={stats?.genreBarData || []}>
                <XAxis dataKey="genre" tick={{fontSize: 11}} />
                <Tooltip />
                <Bar dataKey="naver" fill="hsl(var(--naver))" stackId="a" />
                <Bar dataKey="kakao" fill="hsl(var(--kakao))" stackId="a" />
                <Bar dataKey="ridi" fill="hsl(var(--ridi))" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-bold">오늘 통합 TOP 10</h2>
        {novels?.slice(0, 10).map((novel) => (
          <RankingCard key={novel.id} novel={novel} rank={novel.todayRank} onClick={setSelectedNovel} />
        ))}
      </div>

      <NovelDetailDrawer novel={selectedNovel} onClose={() => setSelectedNovel(null)} />
    </div>
  );
}
