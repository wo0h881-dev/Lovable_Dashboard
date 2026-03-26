// src/pages/ReadingGoal.tsx

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sparkles, AlertTriangle, RefreshCw, Plus } from "lucide-react";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import { RankingCard } from "@/components/shared/RankingCard";
import { RankChange } from "@/components/shared/RankChange";
import { NovelCover } from "@/components/shared/NovelCover";
import { NovelDetailDrawer } from "@/components/shared/NovelDetailDrawer";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import { useTodayCombined } from "@/hooks/useTodayCombined";
import { type Novel } from "@/lib/types";

export default function ReadingGoalPage() {
  const { data: sourceData, isLoading, error, latestDate } = useTodayCombined();
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);
  const [goalDays, setGoalDays] = useState(5); // 기본 5일
  const [statusFilter, setStatusFilter] = useState<"all" | "reading" | "wish">("all");

  const novels: Novel[] = sourceData ?? [];

  // 상태로 필터
  const filteredNovels = useMemo(() =>
    novels.filter((n) => {
      if (statusFilter === "all") return true;
      return n.status === statusFilter;
    }),
    [novels, statusFilter]
  );

  if (isLoading) return <LoadingScreen />;
  if (error) return <div className="p-8 text-center text-red-500 font-bold">{error}</div>;

  // 현재 독서 목표 소설 (예: 첫 번째)
  const currentNovel = filteredNovels.find((n) => n.status === "reading");
  const totalEpisodes = currentNovel?.episodes || 0;
  const currentEpisode = currentNovel?.currentEpisode || 0;
  const progressRate = totalEpisodes > 0 ? (currentEpisode / totalEpisodes) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-black tracking-tight">독서 목표</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {latestDate} 기준 · 독서 목표 작품 목록
        </p>
      </div>

      {/* 독서 프로그레스 카드 */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-lg bg-emerald-400/10 flex items-center justify-center">
            <AlertTriangle size={13} className="text-emerald-400" />
          </div>
          <h2 className="text-sm font-bold">독서 프로그레스</h2>
          <span className="ml-auto font-mono text-xs bg-emerald-400/10 text-emerald-600 px-2 py-0.5 rounded-full">
            {currentNovel ? "1번" : "0번"}
          </span>
        </div>
        <div className="space-y-2">
          <div className="bg-surface-elevated rounded-lg p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-muted-foreground">진행률: {progressRate.toFixed(0)}%</span>
            </div>
            <div className="mt-2 text-sm">
              <p>오늘의 목표: 15 회차</p>
              <p>남은 날: {Math.max(0, goalDays - 1)}일</p>
            </div>
          </div>
        </div>
      </div>

      {/* 책장(카드) */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={15} className="text-primary" />
          <h2 className="text-sm font-bold">독서 목표</h2>
          <span className="ml-auto font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {filteredNovels.length}편
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredNovels.map((n, i) => {
            const totalEpisodes = n.episodes;
            const currentEpisode = n.currentEpisode;
            const remainingEpisodes = totalEpisodes - currentEpisode;
            const dailyGoal = remainingEpisodes / goalDays;
            const progressRate = (currentEpisode / totalEpisodes) * 100;

            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="ranking-card border-l-2 cursor-pointer"
                onClick={() => setSelectedNovel(n)}
              >
                <div className="flex-shrink-0 flex items-center justify-center px-4 bg-surface-elevated" style={{ minWidth: 52 }}>
                  <span className="font-mono font-black text-2xl text-muted-foreground">
                    {n.todayRank ?? "-"}
                  </span>
                </div>
                <div className="flex-shrink-0 py-3 pl-3 relative">
                  <NovelCover novel={n} size="md" />
                  {/* 기다무/3다무 */}
                  {n.promotion?.timeFreeType && n.promotion.timeFreeType !== "none" && (
                    <span className="absolute left-1 top-1 inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold bg-amber-400 text-black shadow">
                      {n.promotion.timeFreeType === "threeHour" ? "3다무" : "기다무"}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0 px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold line-clamp-2 flex-1">{n.title}</h3>
                    <PlatformBadge platform={n.platform} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {n.author} · {n.genre} · {n.publisher}
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <RankChange novel={n} />
                    {n.status === "reading" && (
                      <span className="text-xs bg-emerald-400/15 text-emerald-600 px-2 py-0.5 rounded-full font-semibold">
                        독서중
                      </span>
                    )}
                    {n.status === "wish" && (
                      <span className="text-xs bg-slate-400/15 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                        보고싶음
                      </span>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {currentEpisode}/{totalEpisodes} 회차
                    </div>
                    <div className="text-xs text-muted-foreground">
                      하루 권장: {dailyGoal.toFixed(1)} 회차
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* + 버튼 */}
      <div className="flex items-center gap-2 mt-6">
        <button
          className="w-full py-2 px-4 bg-primary text-on-primary rounded-full font-bold flex items-center justify-center gap-2 hover:bg-primary-container transition-colors active:scale-95"
          onClick={() => {
            // + 버튼 클릭 시
            console.log("Add New Novel");
          }}
        >
          <span className="material-symbols-outlined" data-icon="add">add</span>
          <span className="text-xs uppercase tracking-widest">Add New Novel</span>
        </button>
      </div>

      {/* 표 형식 */}
      <div>
        <h2 className="text-sm font-bold mb-3">독서 목표 표</h2>
        <div className="overflow-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="border px-4 py-2">제목</th>
                <th className="border px-4 py-2">작가</th>
                <th className="border px-4 py-2">총회차</th>
                <th className="border px-4 py-2">현재 회차</th>
                <th className="border px-4 py-2">상태</th>
                <th className="border px-4 py-2">하루 권장량</th>
                <th className="border px-4 py-2">달성률</th>
              </tr>
            </thead>
            <tbody>
              {filteredNovels.map((n) => {
                const totalEpisodes = n.episodes;
                const currentEpisode = n.currentEpisode;
                const remainingEpisodes = totalEpisodes - currentEpisode;
                const dailyGoal = remainingEpisodes / goalDays;
                const progressRate = (currentEpisode / totalEpisodes) * 100;

                return (
                  <tr key={n.id}>
                    <td className="border px-4 py-2">{n.title}</td>
                    <td className="border px-4 py-2">{n.author}</td>
                    <td className="border px-4 py-2">{totalEpisodes}</td>
                    <td className="border px-4 py-2">{currentEpisode}</td>
                    <td className="border px-4 py-2">{n.status}</td>
                    <td className="border px-4 py-2">
                      {dailyGoal.toFixed(1)} 회차
                    </td>
                    <td className="border px-4 py-2">
                      {progressRate.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <NovelDetailDrawer
        novel={selectedNovel}
        onClose={() => setSelectedNovel(null)}
        latestDate={latestDate}
        allNovels={novels}
        onSelectNovel={setSelectedNovel}
      />
    </div>
  );
}
