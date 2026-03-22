// src/lib/rankingScore.ts
import type { Novel } from "@/data/mockData";

export type Platform = "kakao" | "naver" | "ridi" | "etc";
export type UnifiedNovel = Novel;

// 1. 순위 점수: 1위=20점 ~ 20위=1점 (플랫폼 체급을 이기는 기초 체력)
export function rankToScore(rank: number | null | undefined): number {
  if (!rank || typeof rank !== "number") return 0;
  if (rank > 20) return 0;
  return 21 - rank;
}

// 2. 시장 점유율 기반 가중치 (보너스 개념으로 축소)
export function platformWeight(p: Platform): number {
  if (p === "naver") return 0.3; // 네이버 쏠림 방지를 위해 하향 조정
  if (p === "kakao") return 0.2;
  if (p === "ridi") return 0.1;
  return 0.05;
}

// 3. 종합 순위 계산 (수정된 로직)
export function computeUnifiedScore(
  n: UnifiedNovel,
  maxViewsByPlatform: Record<Platform, number>,
  maxCommentsByPlatform: Record<Platform, number>,
  maxDeltaByPlatform: Record<Platform, number>
): number {
  const p = n.platform as Platform;
  const rs = rankToScore(n.todayRank);

  // 플랫폼별 정규화 수치 (0~1)
  const viewRatio = n.views / (maxViewsByPlatform[p] || 1);
  const commentRatio = n.commentCount / (maxCommentsByPlatform[p] || 1);
  const deltaRatio = (n.viewsChangePct || 0) / (maxDeltaByPlatform[p] || 1);
  const pw = platformWeight(p);

  // 리디 별점 보정 (5점 만점 -> 10점 만점 환산)
  const normalizedRating = p === "ridi" ? n.rating * 2 : n.rating;
  const ratingScore = normalizedRating / 10;

  if (p === "ridi") {
    // 리디 전용 공식: 순위(50%) + 평가수(30%) + 증감률(10%) + 가중치/평점(10%)
    return (
      rs * 0.5 + 
      commentRatio * 0.3 + 
      deltaRatio * 0.1 + 
      (pw + ratingScore * 0.1)
    );
  }

  // 네이버 & 카카오 공식: 순위(40%) + 조회수(25%) + 댓글(15%) + 증감률(10%) + 가중치/평점(10%)
  return (
    rs * 0.4 +
    viewRatio * 0.25 +
    commentRatio * 0.15 +
    deltaRatio * 0.1 +
    (pw + ratingScore * 0.1)
  );
}

// 4. 트렌드 랭킹용 점수 (기존 로직 유지)
export function computeTrendScore(
  n: UnifiedNovel & { ridiInnerRank?: number },
  maxViewsByPlatform: Record<Platform, number>,
  maxCommentsByPlatform: Record<Platform, number>,
  maxDeltaByPlatform: Record<Platform, number>
): number {
  const p = n.platform as Platform;
  
  // 트렌드는 기세를 중시하므로 ridiInnerRank가 있다면 사용
  const effectiveRank = (p === "ridi" && n.ridiInnerRank) ? n.ridiInnerRank : n.todayRank;
  const rs = rankToScore(effectiveRank);

  const viewRatio = n.views / (maxViewsByPlatform[p] || 1);
  const commentRatio = n.commentCount / (maxCommentsByPlatform[p] || 1);
  const deltaRatio = (n.viewsChangePct || 0) / (maxDeltaByPlatform[p] || 1);

  // 트렌드 점수 공식: 증감률(45%) + 순위(35%) + 조회/댓글(20%)
  return (
    deltaRatio * 0.45 +
    rs * 0.35 +
    viewRatio * 0.1 +
    commentRatio * 0.1
  );
}

// 플랫폼별 최대값 계산 함수 (정규화용)
export function getPlatformMaxStats(novels: UnifiedNovel[]) {
  const maxViewsByPlatform: Record<Platform, number> = { naver: 0, kakao: 0, ridi: 0, etc: 0 };
  const maxCommentsByPlatform: Record<Platform, number> = { naver: 0, kakao: 0, ridi: 0, etc: 0 };
  const maxDeltaByPlatform: Record<Platform, number> = { naver: 0, kakao: 0, ridi: 0, etc: 0 };

  novels.forEach((n) => {
    const p = n.platform as Platform;
    if (n.views > maxViewsByPlatform[p]) maxViewsByPlatform[p] = n.views;
    if (n.commentCount > maxCommentsByPlatform[p]) maxCommentsByPlatform[p] = n.commentCount;
    if (Math.abs(n.viewsChangePct) > maxDeltaByPlatform[p]) maxDeltaByPlatform[p] = Math.abs(n.viewsChangePct);
  });

  return { maxViewsByPlatform, maxCommentsByPlatform, maxDeltaByPlatform };
}

// 리디 내부 순위 보정용 (필요 시)
export function attachRidiInnerRank(novels: UnifiedNovel[]): (UnifiedNovel & { ridiInnerRank?: number })[] {
  const ridiOnly = novels
    .filter((n) => n.platform === "ridi")
    .sort((a, b) => (b.viewsChangePct || 0) - (a.viewsChangePct || 0));

  return novels.map((n) => {
    if (n.platform === "ridi") {
      const idx = ridiOnly.findIndex((r) => r.id === n.id);
      return { ...n, ridiInnerRank: idx + 1 };
    }
    return n;
  });
}
