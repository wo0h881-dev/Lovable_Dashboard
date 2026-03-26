// src/pages/ReadingGoal.tsx

console.log("ReadingGoal 페이지 렌더링됨");

import React, { useState, useMemo } from "react";
import { useTodayCombined } from "@/hooks/useTodayCombined";
import { Novel } from "@/lib/types";

export const ReadingGoalPage: React.FC = () => {
  const { data } = useTodayCombined();
  const novels = data ?? [];
  const [goalDays, setGoalDays] = useState(5); // 기본 5일

  // 상태 필터
  const [statusFilter, setStatusFilter] = useState<"all" | "reading" | "wish">("all");

  const filteredNovels = novels.filter((novel: Novel) => {
    if (statusFilter === "all") return true;
    return novel.status === statusFilter;
  });

  // 현재 독서 목표 소설 (예: 첫 번째)
  const currentNovel = filteredNovels.find((n) => n.status === "reading");
  const totalEpisodes = currentNovel?.episodes || 0;
  const currentEpisode = currentNovel?.currentEpisode || 0;
  const progressRate = totalEpisodes > 0 ? (currentEpisode / totalEpisodes) * 100 : 0;

  // 통계 데이터 (예시)
  const avgSpeed = useMemo(() => {
    const totalChapters = filteredNovels.reduce((acc, n) => acc + n.episodes, 0);
    const totalRead = filteredNovels.reduce((acc, n) => acc + n.currentEpisode, 0);
    return totalRead / 7; // 평균 7일
  }, [filteredNovels]);

  return (
    <div className="min-h-screen bg-surface text-on-surface p-12">
      {/* 상단 헤더 */}
      <header className="fixed top-0 w-full z-40 bg-surface text-on-surface flex justify-between items-center h-16 px-8 ml-64 border-b border-outline-variant">
        <div className="flex items-center gap-4">
          <span className="font-serif text-2xl font-bold text-primary">The Digital Atelier</span>
        </div>
        <div className="flex items-center gap-6 pr-64">
          <div className="relative group">
            <input
              className="bg-surface-container-low border-none rounded-full px-6 py-2 text-sm focus:ring-2 focus:ring-primary/20 w-64 transition-all"
              placeholder="Search archive..."
              type="text"
            />
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-slate-600 dark:text-slate-400 hover:bg-surface-container-low p-2 rounded-full transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-secondary-container overflow-hidden">
              <img
                alt="User avatar"
                src="https://lh3.googleusercontent.com/...your-avatar-url"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </header>

      {/* 메인 본문 */}
      <main className="ml-64 pt-24 pb-12 min-h-screen">
        {/* 독서 프로그레스 카드 */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-8 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            <div className="relative flex-shrink-0">
              <svg className="w-48 h-48 transform -rotate-90">
                <circle
                  className="text-surface-variant"
                  cx="96"
                  cy="96"
                  r="88"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="12"
                />
                <circle
                  className="text-primary"
                  cx="96"
                  cy="96"
                  r="88"
                  fill="transparent"
                  stroke="currentColor"
                  strokeDasharray="552.92"
                  strokeDashoffset={552.92 - (552.92 * progressRate) / 100}
                  strokeWidth="12"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold font-body">{progressRate.toFixed(0)}%</span>
                <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Progress</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-tertiary text-on-tertiary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  Active Streak: 12 Days
                </span>
              </div>
              <h2 className="font-headline text-4xl mb-4 text-on-surface">
                {currentNovel?.title || "Unknown Title"}
              </h2>
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Current Chapter</p>
                  <p className="text-2xl font-body font-bold text-on-surface">
                    {currentEpisode} <span className="text-sm font-normal text-on-surface-variant">/ {totalEpisodes}</span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Time Remaining</p>
                  <p className="text-2xl font-body font-bold text-on-surface">
                    {Math.max(0, goalDays - 1)} <span className="text-sm font-normal text-on-surface-variant">Days Left</span>
                  </p>
                </div>
              </div>
              <div className="bg-surface-container-low p-5 rounded-xl border-l-4 border-primary">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Today's Goal</p>
                    <p className="text-lg font-headline font-bold">15 Chapters</p>
                  </div>
                  <button
                    className="bg-primary text-on-primary h-10 px-6 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-primary-container transition-colors active:scale-95"
                    onClick={() => {
                      // 로그 진행
                      console.log("Logged progress");
                    }}
                  >
                    Log Progress
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-high rounded-xl p-8 flex flex-col justify-between">
            <div>
              <h3 className="font-headline text-xl mb-6">Quick Insights</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary-container/30 flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined">speed</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-tight text-on-surface-variant">Avg. Speed</p>
                    <p className="text-lg font-bold">{avgSpeed.toFixed(1)} Ch/Day</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-container/30 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">auto_stories</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-tight text-on-surface-variant">Total Chapters</p>
                    <p className="text-lg font-bold">
                      {filteredNovels.reduce((acc, n) => acc + n.episodes, 0)} Read
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-tertiary-fixed-dim/30 flex items-center justify-center text-tertiary">
                    <span className="material-symbols-outlined">calendar_today</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-tight text-on-surface-variant">Reading Year</p>
                    <p className="text-lg font-bold">Vol. 2024</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-outline-variant/20">
              <p className="font-headline italic text-on-surface-variant text-sm text-center">
                "A reader lives a thousand lives before he dies."
              </p>
            </div>
          </div>
        </section>

        {/* Library Queue (책장) */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-headline text-2xl">Library Queue</h3>
            <button
              className="text-secondary font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:underline"
              onClick={() => {
                // 전체 목록 보기
                console.log("View Archive");
              }}
            >
              View Archive{" "}
              <span className="material-symbols-outlined text-sm" data-icon="arrow_forward">
                arrow_forward
              </span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 카드 리스트 */}
            {filteredNovels.slice(0, 4).map((novel: Novel) => {
              const totalEpisodes = novel.episodes;
              const currentEpisode = novel.currentEpisode;
              const remainingEpisodes = totalEpisodes - currentEpisode;
              const dailyGoal = remainingEpisodes / goalDays;
              const progressRate = (currentEpisode / totalEpisodes) * 100;

              return (
                <div key={novel.id} className="group cursor-pointer">
                  <div className="aspect-[3/4] bg-surface-container rounded-xl overflow-hidden mb-4 relative transition-transform hover:-translate-y-2">
                    <img
                      alt="Book cover"
                      src="https://lh3.googleusercontent.com/...your-book-cover-url"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-4xl">play_arrow</span>
                    </div>
                  </div>
                  <h4 className="font-headline text-lg leading-tight mb-1">{novel.title}</h4>
                  <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    {novel.status === "reading" ? "Not Started" : "Paused"} • {totalEpisodes} Chapters
                  </p>
                </div>
              );
            })}
            {/* + 버튼 카드 */}
            <div
              className="aspect-[3/4] border-2 border-dashed border-outline-variant/30 rounded-xl flex flex-col items-center justify-center group cursor-pointer hover:bg-surface-container-low transition-colors"
              onClick={() => {
                // + 버튼 클릭 시
                console.log("Add New Novel");
              }}
            >
              <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-outline">add</span>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-outline">Queue Novel</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ReadingGoalPage;
