// src/lib/types.ts

export type NovelStatus = "reading" | "wish" | "none";

export interface Novel {
  id: string;
  title: string;
  author: string;
  platform: "kakao" | "naver" | "ridi" | "etc";

  // 통합 장르 (세부장르 rawGenre는 사용하지 않음)
  genre: string;

  // 기본 랭킹/클릭 정보 예시 (실제 컬럼에 맞게 조정 가능)
  weekly: number;
  clicks?: number;
  episodes: number;

  // 독서 관리 필드
  status: NovelStatus;        // 현재 독서 상태
  readingGoal: number;        // 목표 일수 (하루권장량 계산용)
  currentEpisode: number;     // 현재 읽은 회차
}
