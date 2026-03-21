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
import {
  type Novel,
  type Genre,
  type Platform,
} from "@/data/mockData";
import { useTodayCombined } from "@/hooks/useTodayCombined";

// 장르 정규화 함수
const normalizeGenre = (raw: unknown): Genre => {
  const g = String(raw ?? "").trim();
  if (!g) return "기타";
  if (g.includes("로맨스")) return "로맨스";
  if (g.includes("로판")) return "로판";
  if (g.includes("판타지") || g.includes("현판")) return "판타지";
  if (g.includes("무협")) return "무협";
  if (g.includes("BL")) return "BL";
  return "기타";
};

// 숫자 변환 함수 ("1.2만" 등 처리)
const parseCount = (v: unknown): number => {
  if (!v) return 0;
  if (typeof v === "number") return v;
  const s = String(v);
  const num = Number(s.replace(/[^0-9.]/g, ""));
  if (Number.isNaN(num)) return 0;
  if (s.includes("억")) return num * 100_000_000;
  if (s.includes("만")) return num * 10_000;
  return num;
};

export default function OverviewPage() {
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);
  const { data: todayCombined, isLoading, error } = useTodayCombined();

  // [통계 계산 로직] 통합시트 컬럼명 기준
  const stats = useMemo(() => {
    if (!todayCombined || todayCombined.length === 0) return null;

    let newWorksCount = 0;
    let rankMovedCount = 0;
    let reEntryCount = 0;
    const platformCounts = { naver: 0, kakao: 0, ridi: 0 };
    const genreDataMap: Record<string, any> = {};

    const mappedList = todayCombined.map((item: any, i: number) => {
      // 1. 플랫폼 판별 (출처 컬럼 기준)
      const sourceStr = String(item.출처 || "").toLowerCase();
      let platform: Platform = "kakao";
      if (sourceStr.includes("naver") || sourceStr.includes("네이버")) platform = "naver";
      else if (sourceStr.includes("ridi") || sourceStr.includes("리디")) platform = "ridi";
      
      platformCounts[platform]++;

      // 2. 신작/변동 계산 (통합시트 컬럼명 기준)
      const todayRank = Number(item.오늘순위 || i + 1);
      const prevRank = item.전일순위 ? Number(item.전일순위) : null;
      
      // 순위변화가 "NEW"거나 전일순위가 없으면 신작으로 간주
      if (item.순위변화 === "NEW" || !prevRank) newWorksCount++;
      // 전일순위와 오늘순위가 다르면 변동으로 간주
      if (prevRank && prevRank !== todayRank) rankMovedCount++;
      // 순위변화가 "RE"거나 특정 조건일 때 재진입 (필요시 수정)
      if (item.순위변화 === "RE") reEntryCount++;

      // 3. 장르 데이터 집계
      const genre = normalizeGenre(item.장르);
      if (!genreDataMap[genre]) {
        genreDataMap[genre] = { genre, naver: 0, kakao: 0, ridi: 0 };
      }
      genreDataMap[genre][platform]++;

      // 4. Novel 객체 매핑 (썸네일 컬럼 적용)
      return {
        id: `${platform}-${item.제목}-${i}`,
        title: item.제목 || "제목 없음",
        author: item.작가 || "-",
        coverImage: item.썸네일, // 제공해주신 '썸네일' 컬럼명 적용
        genre,
        rawGenre: String(item.장르 || ""),
        platform,
        todayRank,
        prevRank,
        todayViews: parseCount(item.오늘조회수),
        viewsChangePct: parseFloat(String(item.조회수증감률 || "0")),
        rating: Number(item.평점 || 0),
        publisher: item.출판사 || "-",
      } as Novel;
    });

    // 차트용 점유율 데이터
    const total = mappedList.length;
    const shareData = [
      { name: "네이버", value: Math.round((platformCounts.naver / total) * 100), color: "hsl(var(--naver))" },
      { name: "카카오", value: Math.round((platformCounts.kakao / total) * 100), color: "hsl(var(--kakao))" },
      { name: "리디", value: Math.round((platformCounts.ridi / total) * 100), color: "hsl(var(--ridi))" },
    ].filter(d => d.value > 0);

    return { 
      mappedList, 
      newWorksCount, 
      rankMovedCount, 
      reEntryCount, 
      shareData,
      genreBarData: Object.values(genreDataMap)
    };
  }, [todayCombined]);

  const top10 = stats?.mappedList.slice(0, 10) || [];

  const fadeInUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-xl font-black tracking-tight">전체 개요</h1>
        <p className="mt-0.5 text-xs font-mono text-muted-foreground">실시간 통합 데이터 분석</p>
      </div>

      {/* KPI Cards: 실제 계산된 수치 연동 */}
      <motion.div className="grid grid-cols-2 gap-4 xl:grid-cols-4" {...fadeInUp}>
        <KpiCard title="전체 분석 작품" value={todayCombined?.length || 0} icon={BookOpen} suffix="편" />
        <KpiCard title="신작 (오늘)" value={stats?.newWorksCount || 0} icon={Zap} suffix="편" />
        <KpiCard title="순위 변동" value={stats?.rankMovedCount || 0} icon={TrendingUp} suffix="편" />
        <KpiCard title="재진입" value={stats?.reEntryCount || 0} icon={RefreshCw} suffix="편" />
      </motion.div>

      {/* Charts: 실제 데이터 기반 */}
      <motion.div className="grid grid-cols-1 gap-4 xl:grid-cols-3" {...fadeInUp} transition={{ delay: 0.1 }}>
        <div className="surface-card">
          <h2 className="mb-4 text-sm font-bold">플랫폼별 점유율</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={stats?.shareData || []} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={80}>
                {stats?.shareData.map((entry: any, i: number) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="surface-card xl:col-span-2">
          <h2 className="mb-4 text-sm font-bold">장르별 분포</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats?.genreBarData || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="genre" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="naver" name="네이버" fill="hsl(var(--naver))" stackId="a" />
              <Bar dataKey="kakao" name="카카오" fill="hsl(var(--kakao))" stackId="a" />
              <Bar dataKey="ridi" name="리디" fill="hsl(var(--ridi))" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Ranking List */}
      <motion.div {...fadeInUp} transition={{ delay: 0.2 }}>
        <h2 className="mb-4 text-sm font-bold">오늘 통합 TOP 10</h2>
        {isLoading && <p className="text-xs text-muted-foreground">데이터 로딩 중...</p>}
        <div className="space-y-2">
          {top10.map((novel) => (
            <RankingCard key={novel.id} novel={novel} rank={novel.todayRank} onClick={setSelectedNovel} />
          ))}
        </div>
      </motion.div>

      <NovelDetailDrawer novel={selectedNovel} onClose={() => setSelectedNovel(null)} />
    </div>
  );
}
