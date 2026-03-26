// src/lib/types.ts

export type NovelStatus = "reading" | "wish" | "none";

export interface Novel {
  id: string;
  title: string;
  author: string;
  platform: "kakao" | "naver" | "ridi" | "etc";
  genre: string;
  weekly: number;
  clicks?: number;
  episodes: number;
  status: NovelStatus;
  readingGoal: number;
  currentEpisode: number;
}
