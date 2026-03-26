// src/pages/ReadingGoal.tsx

import React, { useState } from "react";
import { useTodayCombined } from "@/hooks/useTodayCombined";
import { Novel } from "@/lib/types";

export const ReadingGoalPage: React.FC = () => {
  const { data } = useTodayCombined();
  const novels = data ?? [];
  const [goalDays, setGoalDays] = useState(5); // 기본 5일
  const [statusFilter, setStatusFilter] = useState<"all" | "reading" | "wish">("all"); // 상태 필터

  // 상태로 필터
  const filteredNovels = novels.filter((novel: Novel) => {
    if (statusFilter === "all") return true;
    return novel.status === statusFilter;
  });

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold">독서 목표</h2>
      <div className="mt-4 flex gap-4">
        <button
          onClick={() => setStatusFilter("all")}
          className={statusFilter === "all" ? "font-bold underline" : ""}
        >
          전체
        </button>
        <button
          onClick={() => setStatusFilter("reading")}
          className={statusFilter === "reading" ? "font-bold underline" : ""}
        >
          읽는 중
        </button>
        <button
          onClick={() => setStatusFilter("wish")}
          className={statusFilter === "wish" ? "font-bold underline" : ""}
        >
          보고 싶은 책
        </button>
      </div>

      {/* 책장 형태 (카드 리스트) */}
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredNovels.map((novel: Novel) => {
          const totalEpisodes = novel.episodes;
          const currentEpisode = novel.currentEpisode;
          const remainingEpisodes = totalEpisodes - currentEpisode;
          const dailyGoal = remainingEpisodes / goalDays;
          const progressRate = (currentEpisode / totalEpisodes) * 100;

          return (
            <div
              key={novel.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <h3 className="text-lg font-semibold">{novel.title}</h3>
              <p className="text-sm text-gray-600">{novel.author}</p>
              <div className="mt-2">
                <p className="text-sm">총회차: {totalEpisodes}화</p>
                <p className="text-sm">현재: {currentEpisode}화</p>
                <p className="text-sm">
                  하루 권장: {dailyGoal.toFixed(1)} 회화
                </p>
                <p className="text-sm">
                  달성률: {progressRate.toFixed(1)}%
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 표 형식 */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">독서 목표 표</h3>
        <input
          type="number"
          value={goalDays}
          onChange={(e) => setGoalDays(parseInt(e.target.value, 10))}
          className="border px-2 py-1"
        />
        <table className="min-w-full border-collapse mt-2">
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
            {filteredNovels.map((novel: Novel) => {
              const totalEpisodes = novel.episodes;
              const currentEpisode = novel.currentEpisode;
              const remainingEpisodes = totalEpisodes - currentEpisode;
              const dailyGoal = remainingEpisodes / goalDays;
              const progressRate = (currentEpisode / totalEpisodes) * 100;

              return (
                <tr key={novel.id}>
                  <td className="border px-4 py-2">{novel.title}</td>
                  <td className="border px-4 py-2">{novel.author}</td>
                  <td className="border px-4 py-2">{totalEpisodes}</td>
                  <td className="border px-4 py-2">{currentEpisode}</td>
                  <td className="border px-4 py-2">{novel.status}</td>
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
  );
};

export default ReadingGoalPage;
