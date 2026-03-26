// src/pages/ReadingGoal.tsx

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sparkles, Plus, Search } from "lucide-react";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import { RankingCard } from "@/components/shared/RankingCard";
import { RankChange } from "@/components/shared/RankChange";
import { NovelCover } from "@/components/shared/NovelCover";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import { useTodayCombined } from "@/hooks/useTodayCombined";
import { type Novel } from "@/lib/types";

// 책장용 타입
type ReadingGoalItem = {
  id: string;
  novel: Novel;
  goalDays: number;
  currentEpisode: number;
};

export default function ReadingGoalPage() {
  const { data: sourceData, isLoading, error, latestDate } = useTodayCombined();
  const novels: Novel[] = sourceData || [];

  // 🔥 Reading Goal 전용 상태 (여기만 기억)
  const [readingGoals, setReadingGoals] = useState<ReadingGoalItem[]>([]);

  // 검색 + 추가 관련
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Novel[]>([]);

  // 독서 목표에서 제거
  const removeFromReadingGoal = (id: string) => {
    setReadingGoals(prev => prev.filter(it => it.id !== id));
  };

  // goalDays / currentEpisode 수정 핸들러
  const updateGoalDays = (id: string, days: number) => {
    setReadingGoals(prev => prev.map(it =>
      it.id === id ? { ...it, goalDays: Math.max(1, days) } : it
    ));
  };

  const updateCurrentEpisode = (id: string, epi: number) => {
    setReadingGoals(prev => prev.map(it =>
      it.id === id ? { ...it, currentEpisode: epi } : it
    ));
  };

  // 검색어에 맞는 작품 필터
  const matchingNovels = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    return novels.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.author.toLowerCase().includes(q) ||
      n.genre.toLowerCase().includes(q)
    );
  }, [novels, searchQuery]);

  // 독서 목표로 추가 (버튼 클릭 시)
  const addNovelToReadingGoal = (novel: Novel) => {
    // 이미 있으면 업데이트, 없으면 새로 추가
    setReadingGoals(prev => {
      const existing = prev.find(it => it.novel.id === novel.id);
      if (existing) {
        return prev.map(it =>
          it.novel.id === novel.id
            ? { ...it, novel }
            : it
        );
      }

      // 새로 추가 (초기 값: goalDays = 14일, currentEpisode = 0)
      return [
        ...prev,
        {
          id: novel.id,
          novel: novel,
          goalDays: 14,
          currentEpisode: 0,
        },
      ];
    });

    setSearchQuery(""); // 검색창 클리어
    setSearchResults([]); // 후보 리스트 숨기기
  };

  if (isLoading) return <LoadingScreen />;
  if (error)
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        에러: {error}
      </div>
    );

  // Reading Goal 카드에서 사용할 “진행률” 계산
  const getProgress = (item: ReadingGoalItem): number => {
    const episodes = item.novel.episodes ?? 1;
    const current = item.currentEpisode;
    return episodes > 0 ? (current / episodes) * 100 : 0;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-black tracking-tight">독서 목표</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {latestDate} 기준·독서 목표)
        </p>
      </div>

      {/* 검색 영역 */}
      <div className="surface-card p-4 rounded-lg">
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="작품 제목/작가로 검색..."
              value={searchQuery}
              onChange={e => {
                const q = e.target.value.trim();
                setSearchQuery(q);
                if (q) {
                  setSearchResults(matchingNovels.slice(0, 8)); // 8개까지 보여주기
                } else {
                  setSearchResults([]);
                }
              }}
              className="w-full bg-surface-elevated border-0 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            />
            <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
          <button
            className="shrink-0 bg-primary text-on-primary px-3.5 py-2 rounded-lg font-bold text-sm hover:bg-primary/80 transition-colors"
            onClick={() => {
              setSearchQuery("");
              setSearchResults([]);
            }}
          >
            초기화
          </button>
        </div>

        {/* 결과 팝업 */}
        {searchResults.length > 0 && (
          <div className="mt-2 bg-surface border border-border rounded-lg overflow-hidden">
            {searchResults.map(n => (
              <div
                key={n.id}
                className="flex items-center gap-3 p-2.5 hover:bg-surface-elevated cursor-pointer group"
                onClick={() => addNovelToReadingGoal(n)}
              >
                <NovelCover novel={n} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold line-clamp-1">{n.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {n.author} · {n.genre}
                  </div>
                </div>
                <div className="w-10 h-10 shrink-0 rounded-full bg-primary text-on-primary flex items-center justify-center">
                  <Plus size={14} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 독서 목표 카드 */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={15} className="text-primary" />
          <h2 className="text-sm font-bold">독서 목표</h2>
          <span className="ml-auto font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {readingGoals.length} 편
          </span>
        </div>

        {readingGoals.length === 0 ? (
          <div className="surface-card text-center py-10 text-muted-foreground text-sm">
            독서 목표가 없습니다
          </div>
        ) : (
          <div className="space-y-3">
            {readingGoals.map((item, i) => {
              const n = item.novel;
              const totalEpisodes = n.episodes ?? 1;
              const current = item.currentEpisode;
              const progress = getProgress(item);
              const remaining = totalEpisodes - current;
              const dailyGoal = item.goalDays > 0 ? remaining / item.goalDays : 0;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  transition={{ duration: 0.2 }}
                  className="surface-card rounded-lg border-l-2 border-l-primary p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <NovelCover novel={n} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold line-clamp-1">{n.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {n.author} · {n.genre}
                        </div>
                      </div>
                    </div>

                    <button
                      className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 hover:bg-red-200 transition-colors"
                      onClick={() => removeFromReadingGoal(item.id)}
                    >
                      <Plus size={14} className="rotate-45" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-xs text-muted-foreground">
                      달성률: {progress.toFixed(1)}% · 남은 회차: {remaining}화
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] items-center gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground font-semibold block">
                          목표 일수
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.goalDays}
                          onChange={e =>
                            updateGoalDays(item.id, Number(e.target.value))
                          }
                          className="w-full bg-surface-elevated border border-border rounded px-2 py-1 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground font-semibold block">
                          현재 회차
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={totalEpisodes}
                          value={item.currentEpisode}
                          onChange={e =>
                            updateCurrentEpisode(
                              item.id,
                              Math.min(totalEpisodes, Number(e.target.value))
                            )
                          }
                          className="w-full bg-surface-elevated border border-border rounded px-2 py-1 text-sm"
                        />
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        하루 권장량: {dailyGoal.toFixed(1)}화
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        목표 {item.goalDays}일
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
