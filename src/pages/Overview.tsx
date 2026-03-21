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
  
  // 훅에서 이미 Novel[] 형태로 변환된 데이터를 가져옵니다.
  const { data: novels, isLoading, error } = useTodayCombined();

  const stats = useMemo(() => {
    if (!novels || novels.length === 0) return null;

    let newWorksCount = 0;
    let rankMovedCount = 0;
    let reEntryCount = 0;
    
    // 플랫폼별 카운트 (훅에서 정의된 platform 값 기준)
    const platformCounts = { naver: 0, kakao: 0, ridi: 0 };
    const genreDataMap: Record<string, any> = {};

    novels.forEach((novel) => {
      // 1. KPI 숫자 계산
      if (novel.isNew) newWorksCount++;
      if (novel.isReEntry) reEntryCount++;
      if (novel.prevRank && novel.prevRank !== novel.todayRank) rankMovedCount++;

      // 2. 플랫폼 점유율 계산
      platformCounts[novel.platform]++;

      // 3. 장르 분포 데이터 생성
      const g = novel.genre || "기타";
      if (!genreDataMap[g]) {
        genreDataMap[g] = { genre: g, naver: 0, kakao: 0, ridi: 0 };
      }
      genreDataMap[g][novel.platform]++;
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

  // 랭킹 리스트 (TOP 10)
  const top10 = novels ? novels.slice(0, 10) : [];

  if (error) return <div className="p-8 text-red-500">에러 발생: {error}</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-xl font-black tracking-tight">전체 개요</h1>
        <p className="mt-0.5 text-xs font-mono text-muted-foreground">실시간 통합 데이터 분석 중</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard title="전체 분석 작품" value={novels?.length || 0} icon={BookOpen} suffix="편" />
        <KpiCard title="신작 (오늘)" value={stats?.newWorksCount || 0} icon={Zap} suffix="편" />
        <KpiCard title="순위 변동" value={stats?.rankMovedCount || 0} icon={TrendingUp} suffix="편" />
        <KpiCard title="재진입" value={stats?.reEntryCount || 0} icon={RefreshCw} suffix="편" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="surface-card">
          <h2 className="mb-4 text-sm font-bold">플랫폼별 점유율</h2>
          <div className="h-[200px] w-full">
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
          <h2 className="mb-4 text-sm font-bold">장르별 분포</h2>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.genreBarData || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="genre" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="naver" name="네이버" fill="hsl(var(--naver))" stackId="a" />
                <Bar dataKey="kakao" name="카카오" fill="hsl(var(--kakao))" stackId="a" />
                <Bar dataKey="ridi" name="리디" fill="hsl(var(--ridi))" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Ranking List */}
      <section>
        <h2 className="mb-4 text-sm font-bold">오늘 통합 TOP 10</h2>
        {isLoading ? (
          <div className="text-xs text-muted-foreground">로딩 중...</div>
        ) : (
          <div className="space-y-2">
            {top10.map((novel) => (
              <RankingCard 
                key={novel.id} 
                novel={{
                  ...novel,
                  // [중요] Hook의 thumbnailUrl을 RankingCard가 기대하는 coverImage로 연결
                  coverImage: novel.thumbnailUrl 
                }} 
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
