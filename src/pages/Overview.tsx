// src/pages/Overview.tsx

import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, RefreshCw, TrendingUp, Zap } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { KpiCard } from "@/components/shared/KpiCard";
import { RankingCard } from "@/components/shared/RankingCard";
import { NovelDetailDrawer } from "@/components/shared/NovelDetailDrawer";
import {
  kpiData,
  platformShareData,
  genreBarData,
  heatmapData,
  type Novel,
  type Genre,
  type Platform,
} from "@/data/mockData";
import { useTodayCombined } from "@/hooks/useTodayCombined";

const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function OverviewPage() {
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);

  const { data: todayCombined, isLoading, error } = useTodayCombined();
  const top10 = todayCombined ? todayCombined.slice(0, 10) : [];

  // 통합 JSON → Novel 타입으로 매핑
  const mapToNovel = (item: any, rank: number): Novel => {
  console.error("MAP_TO_NOVEL CALLED", rank);
  console.log("raw item ▶", item);

  // 1) 회차 수: 다양한 키 이름 대비
  const totalEpisodesRaw =
    item.총회차수 ??
    item.총회차 ??
    item.회차수 ??
    item.회차 ??
    item.episodes ??
    item.episodeCount;

  const episodeCount =
    typeof totalEpisodesRaw === "number"
      ? totalEpisodesRaw
      : typeof totalEpisodesRaw === "string"
      ? Number(totalEpisodesRaw.replace(/[^0-9]/g, "")) || 0
      : 0;

 // 2) 오늘 조회수: "1,071만", "3.5억", "60.1만" 등 처리
const todayViews = (() => {
  const v = item.오늘조회수 ?? item.todayViews ?? item.조회수;
  if (!v) return 0;
  if (typeof v === "number") return v;

  const s = String(v);
  const num = Number(s.replace(/[^0-9.]/g, ""));
  if (Number.isNaN(num)) return 0;

  if (s.includes("억")) {
    // 3.5억 → 3.5 * 100,000,000
    return num * 100_000_000;
  }
  if (s.includes("만")) {
    // 1,071만 / 60.1만 → 1071 * 10,000 / 60.1 * 10,000
    return num * 10_000;
  }
  // 단위 없으면 그냥 숫자
  return num;
})();


  // 3) 조회수 증감률
  const viewsChangePct = (() => {
    const v = item.조회수증감률 ?? item.viewsChangePct ?? item.증감률;
    if (!v) return 0;
    if (typeof v === "number") return v;
    const n = Number(String(v).replace(/[^0-9.-]/g, ""));
    return Number.isNaN(n) ? 0 : n;
  })();

  // 4) 플랫폼 매핑
  const rawSource: string = item.출처 || item.source || "";
  let platform: Platform = "kakao";
  if (rawSource.includes("네이버") || rawSource.toLowerCase().includes("naver")) {
    platform = "naver";
  } else if (rawSource.includes("리디") || rawSource.toLowerCase().includes("ridi")) {
    platform = "ridi";
  }

 // 5) 장르 / 출판사 / 평점 / 댓글
const rawGenre =
  item.장르 ??
  item.genre ??
  item.카테고리 ??
  item.분류 ??
  "";

const rawPublisher =
  item.출판사 ??
  item.publisher ??
  item.제공사 ??
  "-";

const rawRating =
  item.평점 ??
  item.rating ??
  item.별점 ??
  0;

// "1.2만", "60.1만", "185" → 숫자
const parseCount = (v: unknown): number => {
  if (!v) return 0;
  if (typeof v === "number") return v;
  const s = String(v);
  const num = Number(s.replace(/[^0-9.]/g, ""));
  if (Number.isNaN(num)) return 0;
  if (s.includes("만")) return num * 10_000;
  return num;
};

const rawComments =
  item.댓글수 ??
  item.댓글 ??
  item.commentCount ??
  0;


 return {
  id: `${rawSource}-${item.제목 || ""}-${rank}`,
  title: item.제목 || item.title || "제목 없음",
  author: item.작가 || item.author || "-",
  genre: (rawGenre as Genre) || "기타",
  publisher: rawPublisher || "-",
  rating: Number(rawRating) || 0,
  commentCount: parseCount(rawComments), // ← "1.2만", "60.1만" 처리
  platform,
  coverGradient: "from-slate-800 to-slate-700",
  coverEmoji: "📚",
  // 아래에 todayRank, todayViews, episodeCount 등 나머지 필드 계속…
};


    todayRank: Number(item.오늘순위 ?? item.rank ?? rank) || rank,
    prevRank: item.전일순위
      ? Number(item.전일순위)
      : item.prevRank
      ? Number(item.prevRank)
      : null,
    rankChange: null,

    isNew: false,
    isReEntry: false,

    todayViews,
    viewsChange: 0,
    viewsChangePct,

    rating: Number(rawRating) || 0,
    commentCount: Number(rawComments) || 0,
    episodeCount,

    firstAppeared: item.날짜 || item.date || "",
    consecutiveDays: 1,
    peakRank: Number(item.오늘순위 ?? item.rank ?? rank) || rank,
  };
};


  const formattedDate =
    todayCombined && todayCombined.length > 0
      ? (() => {
          const v = todayCombined[0].날짜;
          const d = v instanceof Date ? v : new Date(v);
          if (Number.isNaN(d.getTime())) return "오늘 기준";
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return `${y}.${m}.${day} 기준`;
        })()
      : "오늘 기준";

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-xl font-black tracking-tight">전체 개요</h1>
        <p className="mt-0.5 text-xs font-mono text-muted-foreground">
          {formattedDate} · 실시간 업데이트
        </p>
      </div>

      {/* KPI Cards */}
      <motion.div
        className="grid grid-cols-2 gap-4 xl:grid-cols-4"
        {...fadeInUp}
        transition={{ delay: 0.05 }}
      >
        <KpiCard
          title="전체 작품 수"
          value={kpiData.totalWorks.value}
          change={kpiData.totalWorks.change}
          icon={BookOpen}
          suffix="편"
        />
        <KpiCard
          title="신작 (이번 달)"
          value={kpiData.newWorks.value}
          change={kpiData.newWorks.change}
          icon={Zap}
          suffix="편"
        />
        <KpiCard
          title="순위 변동 작품"
          value={kpiData.rankMoved.value}
          change={kpiData.rankMoved.change}
          icon={TrendingUp}
          suffix="편"
        />
        <KpiCard
          title="재진입 작품"
          value={kpiData.reEntry.value}
          change={kpiData.reEntry.change}
          icon={RefreshCw}
          suffix="편"
        />
      </motion.div>

      {/* Charts row */}
      <motion.div
        className="grid grid-cols-1 gap-4 xl:grid-cols-3"
        {...fadeInUp}
        transition={{ delay: 0.1 }}
      >
        {/* Donut chart */}
        <div className="surface-card">
          <h2 className="mb-4 text-sm font-bold">플랫폼별 점유율</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={platformShareData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                dataKey="value"
                paddingAngle={3}
              >
                {platformShareData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--surface))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 11,
                }}
                formatter={(v: number) => [`${v}%`, ""]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex items-center justify-center gap-4">
            {platformShareData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: d.color }}
                />
                <span className="text-xs text-muted-foreground">
                  {d.name}
                </span>
                <span
                  className="font-mono text-xs font-bold"
                  style={{ color: d.color }}
                >
                  {d.value}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar chart - Genre */}
        <div className="surface-card xl:col-span-2">
          <h2 className="mb-4 text-sm font-bold">장르별 TOP 작품 수</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={genreBarData}
              margin={{ top: 4, right: 8, bottom: 4, left: -20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="genre"
                tick={{
                  fontSize: 11,
                  fill: "hsl(var(--muted-foreground))",
                }}
              />
              <YAxis
                tick={{
                  fontSize: 10,
                  fill: "hsl(var(--muted-foreground))",
                  fontFamily: "Roboto Mono",
                }}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--surface))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 11,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar
                dataKey="naver"
                name="네이버"
                fill="hsl(var(--naver))"
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="kakao"
                name="카카오"
                fill="hsl(var(--kakao))"
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="ridi"
                name="리디"
                fill="hsl(var(--ridi))"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Heatmap */}
      <motion.div
        className="surface-card"
        {...fadeInUp}
        transition={{ delay: 0.15 }}
      >
        <h2 className="mb-4 text-sm font-bold">
          플랫폼 × 장르 히트맵 (점유율 지수)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="w-20 py-2 pr-4 text-left font-medium text-muted-foreground">
                  장르
                </th>
                {["네이버", "카카오", "리디"].map((p) => (
                  <th
                    key={p}
                    className="py-2 px-3 text-center font-medium text-muted-foreground"
                  >
                    {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmapData.map((row) => (
                <tr key={row.genre} className="border-t border-border">
                  <td className="py-2 pr-4 font-medium text-foreground">
                    {row.genre}
                  </td>
                  {[row.naver, row.kakao, row.ridi].map((val, ci) => {
                    const alpha = val / 100;
                    const colors = [
                      "hsl(138,100%,39%)",
                      "hsl(50,100%,50%)",
                      "hsl(210,76%,51%)",
                    ];
                    return (
                      <td key={ci} className="py-2 px-3 text-center">
                        <div
                          className="flex h-7 w-14 items-center justify-center rounded font-mono font-bold"
                          style={{
                            background: `${colors[ci]}${Math.round(
                              alpha * 45 + 10
                            )
                              .toString(16)
                              .padStart(2, "0")}`,
                            color:
                              val > 50
                                ? "#fff"
                                : "hsl(var(--muted-foreground))",
                          }}
                        >
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
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold">오늘 TOP 10 랭킹</h2>
          <span className="font-mono text-xs text-muted-foreground">
            전체 플랫폼
          </span>
        </div>

        <p className="text-xs text-muted-foreground">
          build: 2026-03-13 useTodayCombined 적용됨
        </p>

        {isLoading && (
          <div className="text-xs text-muted-foreground">
            랭킹 불러오는 중…
          </div>
        )}
        {error && (
          <div className="text-xs text-red-500">
            데이터를 불러오지 못했습니다.
          </div>
        )}

        {!isLoading && !error && (
          <div className="space-y-2">
            {top10.map((item, i) => {
              const novel = mapToNovel(item, i + 1);
              return (
                <motion.div
                  key={novel.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.04 }}
                >
                  <RankingCard
                    novel={novel}
                    rank={novel.todayRank}
                    onClick={setSelectedNovel}
                  />
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      <NovelDetailDrawer
        novel={selectedNovel}
        onClose={() => setSelectedNovel(null)}
      />
    </div>
  );
}
