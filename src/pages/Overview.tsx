import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, RefreshCw, TrendingUp, Zap } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { KpiCard } from "@/components/shared/KpiCard";
import { RankingCard } from "@/components/shared/RankingCard";
import { NovelDetailDrawer } from "@/components/shared/NovelDetailDrawer";
import { novels, kpiData, platformShareData, genreBarData, heatmapData, type Novel } from "@/data/mockData";
import { useTodayCombined } from "@/hooks/useTodayCombined"; // ✅ 추가

const fadeInUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

export default function OverviewPage() {
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);
  const top10 = novels.slice(0, 10);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-xl font-black tracking-tight">전체 개요</h1>
        <p className="text-xs text-muted-foreground mt-0.5 font-mono">2024.03.13 기준 · 실시간 업데이트</p>
      </div>

      {/* KPI Cards */}
      <motion.div className="grid grid-cols-2 xl:grid-cols-4 gap-4" {...fadeInUp} transition={{ delay: 0.05 }}>
        <KpiCard title="전체 작품 수" value={kpiData.totalWorks.value} change={kpiData.totalWorks.change} icon={BookOpen} suffix="편" />
        <KpiCard title="신작 (이번 달)" value={kpiData.newWorks.value} change={kpiData.newWorks.change} icon={Zap} suffix="편" />
        <KpiCard title="순위 변동 작품" value={kpiData.rankMoved.value} change={kpiData.rankMoved.change} icon={TrendingUp} suffix="편" />
        <KpiCard title="재진입 작품" value={kpiData.reEntry.value} change={kpiData.reEntry.change} icon={RefreshCw} suffix="편" />
      </motion.div>

      {/* Charts row */}
      <motion.div className="grid grid-cols-1 xl:grid-cols-3 gap-4" {...fadeInUp} transition={{ delay: 0.1 }}>
        {/* Donut chart */}
        <div className="surface-card">
          <h2 className="text-sm font-bold mb-4">플랫폼별 점유율</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={platformShareData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                {platformShareData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                formatter={(v: number) => [`${v}%`, ""]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-4 mt-2">
            {platformShareData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                <span className="text-xs text-muted-foreground">{d.name}</span>
                <span className="font-mono text-xs font-bold" style={{ color: d.color }}>{d.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar chart - Genre */}
        <div className="surface-card xl:col-span-2">
          <h2 className="text-sm font-bold mb-4">장르별 TOP 작품 수</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={genreBarData} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="genre" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "Roboto Mono" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="naver" name="네이버" fill="hsl(var(--naver))" radius={[2,2,0,0]} />
              <Bar dataKey="kakao" name="카카오" fill="hsl(var(--kakao))" radius={[2,2,0,0]} />
              <Bar dataKey="ridi"  name="리디"  fill="hsl(var(--ridi))"  radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Heatmap */}
      <motion.div className="surface-card" {...fadeInUp} transition={{ delay: 0.15 }}>
        <h2 className="text-sm font-bold mb-4">플랫폼 × 장르 히트맵 (점유율 지수)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium w-20">장르</th>
                {["네이버", "카카오", "리디"].map(p => (
                  <th key={p} className="py-2 px-3 text-center text-muted-foreground font-medium">{p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmapData.map(row => (
                <tr key={row.genre} className="border-t border-border">
                  <td className="py-2 pr-4 font-medium text-foreground">{row.genre}</td>
                  {[row.naver, row.kakao, row.ridi].map((val, ci) => {
                    const alpha = val / 100;
                    const colors = ["hsl(138,100%,39%)", "hsl(50,100%,50%)", "hsl(210,76%,51%)"];
                    return (
                      <td key={ci} className="py-2 px-3 text-center">
                        <div className="mx-auto w-14 h-7 rounded flex items-center justify-center font-mono font-bold"
                             style={{ background: `${colors[ci]}${Math.round(alpha * 45 + 10).toString(16).padStart(2,"0")}`, color: val > 50 ? "#fff" : "hsl(var(--muted-foreground))" }}>
                          {val}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* TOP 10 Ranking Cards */}
      <motion.div {...fadeInUp} transition={{ delay: 0.2 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold">오늘 TOP 10 랭킹</h2>
          <span className="text-xs text-muted-foreground font-mono">전체 플랫폼</span>
        </div>
        <div className="space-y-2">
          {top10.map((novel, i) => (
            <motion.div key={novel.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.04 }}>
              <RankingCard novel={novel} rank={i + 1} onClick={setSelectedNovel} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      <NovelDetailDrawer novel={selectedNovel} onClose={() => setSelectedNovel(null)} />
    </div>
  );
}
