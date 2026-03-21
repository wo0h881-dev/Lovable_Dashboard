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

  // 모든 통계 수치 및 차트 데이터 계산
  const stats = useMemo(() => {
    if (!novels || novels.length === 0) return null;

    let newWorksCount = 0;
    let rankMovedCount = 0;
    let reEntryCount = 0;
    
    const platformCounts = { naver: 0, kakao: 0, ridi: 0 };
    const genreDataMap: Record<string, any> = {};

    novels.forEach((n) => {
      // 1. KPI 숫자
      if (n.isNew) newWorksCount++;
      if (n.isReEntry) reEntryCount++;
      if (n.prevRank && n.prevRank !== n.todayRank) rankMovedCount++;

      // 2. 플랫폼 점유율
      platformCounts[n.platform]++;

      // 3. 장르 분포 (차트용)
      const g = n.genre || "기타";
      if (!genreDataMap[g]) {
        genreDataMap[g] = { genre: g, naver: 0, kakao: 0, ridi: 0 };
      }
      genreDataMap[g][n.platform]++;
    });

    const total = novels.length;
    const shareData = [
      { name: "네이버", value: Math.round((platformCounts.naver / total) * 100), color: "hsl(var(--naver))" },
      { name: "카카오", value: Math.round((platformCounts.kakao / total) * 100), color: "hsl(var(--kakao))" },
      { name: "리디", value: Math.round((platformCounts.ridi / total) * 100), color: "hsl(var(--ridi))" },
    ].filter(d => d.value > 0);

    return { 
      newWorksCount, 
      rankMovedCount, 
      reEntryCount, 
      shareData, 
      genreBarData: Object.values(genreDataMap) 
    };
  }, [novels]);

  if (error) return <div className="p-8 text-red-500">데이터 로드 실패: {error}</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="text-xl font-black tracking-tight">전체 개요</h1>
        <p className="mt-0.5 text-xs font-mono text-muted-foreground">통합 플랫폼 실시간 트렌드</p>
      </header>

      {/* KPI 영역 */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard title="전체 분석 작품" value={novels?.length || 0} icon={BookOpen} suffix="편" />
        <KpiCard title="신작 (오늘)" value={stats?.newWorksCount || 0} icon={Zap} suffix="편" />
        <KpiCard title="순위 변동" value={stats?.rankMovedCount || 0} icon={TrendingUp} suffix="편" />
        <KpiCard title="재진입" value={stats?.reEntryCount || 0} icon={RefreshCw} suffix="편" />
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="surface-card">
          <h2 className="mb-4 text-sm font-bold">플랫폼별 점유율</h2>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats?.shareData || []} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={80}>
                  {stats?.shareData.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-card xl:col-span-2">
          <h2 className="mb-4 text-sm font-bold">장르별 플랫폼 분포</h2>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.genreBarData || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="genre" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar dataKey="naver" name="네이버" fill="hsl(var(--naver))" stackId="a" />
                <Bar dataKey="kakao" name="카카오" fill="hsl(var(--kakao))" stackId="a" />
                <Bar dataKey="ridi" name="리디" fill="hsl(var(--ridi))" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* TOP 10 리스트 영역 */}
      <section>
        <h2 className="mb-4 text-sm font-bold">오늘 통합 TOP 10</h2>
        {isLoading ? (
          <div className="grid gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 w-full animate-pulse rounded-xl bg-surface-elevated" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {novels?.slice(0, 10).map((novel) => (
              <RankingCard 
                key={novel.id} 
                novel={novel} // 훅에서 이미 Novel 형식이므로 그대로 전달
                rank={novel.todayRank} 
                onClick={setSelectedNovel} 
              />
            ))}
          </div>
        )}
      </section>

      <NovelDetailDrawer novel={selectedNovel} onClose={() => setSelectedNovel(null)} />
    </div>
  );
}
