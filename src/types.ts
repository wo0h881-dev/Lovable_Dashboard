// src/types.ts

export type NovelStatus = "reading" | "wish" | "none";

export interface Novel {
  id: string;
  title: string;
  author: string;
  platform: "kakao" | "naver" | "ridi" | "etc"; // 플랫폼
  genre: string; // 통일된 상위 장르 (세부장르 rawGenre는 사용 안 함)

  // 현재 랭킹/클릭 관련 필드 (예시)
  weekly: number;
  clicks?: number;
  episodes: number;

  // 독서 관리 필드
  status: NovelStatus;        // 현재 상태
  readingGoal: number;        // 목표 일수
  currentEpisode: number;     // 현재 읽은 회차
}
