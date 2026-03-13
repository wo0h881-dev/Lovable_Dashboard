import { useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { cn } from "@/lib/utils";
import { RankingCard } from "@/components/shared/RankingCard";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import { RankChange } from "@/components/shared/RankChange";
import { NovelDetailDrawer } from "@/components/shared/NovelDetailDrawer";
import { novels, genreBarData, formatViews, type Novel, type Genre } from "@/data/mockData";

const genres: (Genre | "전체")[] = ["전체", "로판", "판타지", "로맨스", "현판", "BL", "무협"];

const genreTrendData = Array.from({ length: 30 }, (_, i) => ({
  date: `3/${i + 1}`,
  로판: Math.round(15 + Math.sin(i / 5) * 4 + Math.random() * 2),
  판타지: Math.round(12 + Math.cos(i / 4) * 5 + Math.random() * 2),
  로맨스: Math.round(10 + Math.sin(i / 6 + 1) * 3 + Math.random() * 2),
  BL: Math.round(8 + Math.cos(i / 7) * 3 + Math.random() * 2),
}));

const genreColors: Record<string, string> = {
  로판: "hsl(var(--ridi))",
  판타지: "hsl(var(--naver))",
  로맨스: "hsl(350,100%,60%)",
  BL: "hsl(var(--kakao))",
};

export default function GenrePage() {
  const [selectedGenre, setSelectedGenre] = useState<Genre | "전체">("전체");
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);

  const genreNovels = selectedGenre === "전체" ? novels : novels.filter(n => n.genre === selectedGenre);
  const rising = [...novels].filter(n => (n.rankChange ?? 0) > 2).sort((a,b) => (b.rankChange ?? 0) - (a.rankChange ?? 0)).slice(0, 5);
  const falling = [...novels].filter(n => (n.rankChange ?? 0) < -1).sort((a,b) => (a.rankChange ?? 0) - (b.rankChange ?? 0)).slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-black tracking-tight">장르 분석</h1>
        <p className="text-xs text-muted-foreground mt-0.5">장르별 트렌드 및 성과 분석</p>
      </div>

      {/* Genre selector */}
      <div className="flex items-center gap-2 flex-wrap">
        {genres.map(g => (
          <button key={g} onClick={() => setSelectedGenre(g)}
            className={cn("px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
              selectedGenre === g ? "bg-primary text-primary-foreground" : "bg-surface border border-border text-muted-foreground hover:text-foreground"
            )}>
            {g}
          </button>
        ))}
      </div>

      {/* Top novels in genre */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="surface-card">
          <h2 className="text-sm font-bold mb-4">{selectedGenre} TOP 작품</h2>
          <div className="space-y-1.5">
            {genreNovels.slice(0, 8).map((n, i) => (
              <div key={n.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-elevated cursor-pointer transition-colors"
                   onClick={() => setSelectedNovel(n)}>
                <span className="font-mono text-sm font-bold text-muted-foreground w-5 text-right">{i + 1}</span>
                <PlatformBadge platform={n.platform} />
                <span className="flex-1 text-xs font-medium line-clamp-1">{n.title}</span>
                <span className="font-mono text-xs text-muted-foreground">{n.author}</span>
                <RankChange novel={n} />
                <span className="font-mono text-xs font-semibold">{formatViews(n.platform, n.todayViews)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Genre bar chart */}
        <div className="surface-card">
          <h2 className="text-sm font-bold mb-4">장르별 플랫폼 작품 수</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={genreBarData} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "Roboto Mono" }} />
              <YAxis type="category" dataKey="genre" tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} width={36} />
              <Tooltip contentStyle={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="naver" name="네이버" fill="hsl(var(--naver))" radius={[0,2,2,0]} />
              <Bar dataKey="kakao" name="카카오" fill="hsl(var(--kakao))" radius={[0,2,2,0]} />
              <Bar dataKey="ridi"  name="리디"  fill="hsl(var(--ridi))"  radius={[0,2,2,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trend line */}
      <div className="surface-card">
        <h2 className="text-sm font-bold mb-4">장르별 TOP20 진입 작품 수 추이 (최근 30일)</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={genreTrendData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} interval={4} />
            <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "Roboto Mono" }} />
            <Tooltip contentStyle={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {Object.entries(genreColors).map(([key, color]) => (
              <Line key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Rising / Falling */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="surface-card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-up" />
            <h2 className="text-sm font-bold">최근 7일 급상승 작품 TOP5</h2>
          </div>
          <div className="space-y-2">
            {rising.map((n, i) => (
              <RankingCard key={n.id} novel={n} rank={i+1} onClick={setSelectedNovel} variant="compact" />
            ))}
          </div>
        </div>
        <div className="surface-card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-down" />
            <h2 className="text-sm font-bold">최근 7일 하락 작품 TOP5</h2>
          </div>
          <div className="space-y-2">
            {falling.length > 0
              ? falling.map((n, i) => <RankingCard key={n.id} novel={n} rank={i+1} onClick={setSelectedNovel} variant="compact" />)
              : <p className="text-xs text-muted-foreground">해당 기간 하락 작품 없음</p>
            }
          </div>
        </div>
      </div>

      <NovelDetailDrawer novel={selectedNovel} onClose={() => setSelectedNovel(null)} />
    </div>
  );
}
