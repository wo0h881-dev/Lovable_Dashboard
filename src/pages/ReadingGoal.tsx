// src/pages/ReadingGoal.tsx

import React from "react";
import { useTodayCombined } from "@/hooks/useTodayCombined";
import { Novel } from "@/lib/types";

export const ReadingGoal: React.FC = () => {
  const { data } = useTodayCombined();
  const novels = data ?? [];

  // 상태 필터: reading, wish
  const filteredNovels = novels.filter(
    (novel: Novel) => novel.status === "reading" || novel.status === "wish"
  );

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold">Reading Goal</h2>
      <div className="mt-4">
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
            {filteredNovels.map((novel: Novel) => {
              const totalEpisodes = novel.episodes;
              const currentEpisode = novel.currentEpisode;
              const goalDays = novel.readingGoal || 1;

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

export default ReadingGoal;
