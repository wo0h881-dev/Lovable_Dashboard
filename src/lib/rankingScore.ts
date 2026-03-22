// src/lib/rankingScore.ts
import type { Novel } from "@/data/mockData";

export type Platform = "kakao" | "naver" | "ridi" | "etc";
export type UnifiedNovel = Novel;

// 순위 점수: 1위=20, 20위=1, 그 외 0
export function rankToScore(rank: number | null | undefined): number {
  if (!rank || typeof rank !== "number") return 0;
  if (rank > 20) return 0;
  return 21 - rank;
}

// 시장 점유율 기반 플랫폼 가중치 (종합 랭킹에만 사용)
// 리디의 비중을 0.08 -> 0.12로 살짝 보정하여 리디 1위가 전체 랭킹에서 소외되지 않게 했습니다.
export function platformWeight(p: Platform): number {
  if (p === "naver") return 0.55; 
  if (p === "kakao") return 0.25;
  if (p === "ridi") return 0.12; 
  return 0.08; // 기타
}

// 플랫폼별 최대값 계산 (정규화용)
export function getPlatformMaxStats(novels: UnifiedNovel[]) {
  const maxViewsByPlatform: Record<Platform, number> = { naver: 0, kakao: 0, ridi: 0, etc: 0 };
  const maxCommentsByPlatform: Record<Platform, number> = { naver: 0, kakao: 0, ridi: 0, etc: 0 };
  const maxDeltaByPlatform: Record<Platform, number> = { naver: 0, kakao: 0, ridi: 0, etc: 0 };

  for (const n of novels) {
    const p = n.platform as Platform;
    if (n.todayViews > (maxViewsByPlatform[p] || 0)) maxViewsByPlatform[p] = n.todayViews;
    if (n.commentCount > (maxCommentsByPlatform[p] || 0)) maxCommentsByPlatform[p] = n.commentCount;
    const delta = Math.max(0, n.viewsChangePct || 0);
    if (delta > (maxDeltaByPlatform[p] || 0)) maxDeltaByPlatform[p] = delta;
  }
  return { maxViewsByPlatform, maxCommentsByPlatform, maxDeltaByPlatform };
}

/**
 * 0) 리디 내부 종합 점수 계산용 (선행 순위 산출용)
 * - 리디 안에서의 상대적 순서를 정하기 위한 내부 로직
 */
export function computeRidiInnerScore(
  n: UnifiedNovel,
  maxCommentsByPlatform: Record<Platform, number>,
  maxDeltaByPlatform: Record<Platform, number>,
): number {
  if (n.platform !== "ridi") return 0;

  const rs = rankToScore(n.todayRank);
  const maxC = maxCommentsByPlatform["ridi"] || 0;
  const maxD = maxDeltaByPlatform["ridi"] || 0;

  const commentRatio = maxC > 0 ? n.commentCount / maxC : 0;
  const deltaRaw = Math.max(0, n.viewsChangePct || 0);
  const deltaRatio = maxD > 0 ? deltaRaw / maxD : 0;

  return rs * 0.5 + deltaRatio * 0.3 + commentRatio * 0.2;
}

/**
 * 리디 선행 순위 주입 헬퍼
 * - RankingsPage 및 Overview에서 이 결과를 사용하여 리디의 todayRank를 보정함
 */
export function attachRidiInnerRank(
  novels: UnifiedNovel[],
  maxCommentsByPlatform: Record<Platform, number>,
  maxDeltaByPlatform: Record<Platform, number>,
): (UnifiedNovel & { ridiInnerRank?: number })[] {
  const cloned = novels.map((n) => ({ ...n })) as (UnifiedNovel & { ridiInnerRank?: number })[];
  const ridiOnly = cloned.filter((n) => n.platform === "ridi");

  const scoredRidi = ridiOnly
    .map((n) => ({
      novel: n,
      score: computeRidiInnerScore(n, maxCommentsByPlatform, maxDeltaByPlatform),
    }))
    .sort((a, b) => b.score - a.score);

  scoredRidi.forEach((item, idx) => {
    item.novel.ridiInnerRank = idx + 1;
  });

  return cloned;
}

/**
 * 1) 종합 랭킹용 점수 (사용자 제안 수치 반영)
 * - 네이버/카카오: 순위 0.4 + 조회 0.25 + 증감 0.15 + 댓글 0.1 + 플랫폼 0.1
 * - 리디: 순위 0.3 + 증감 0.1 + 댓글 0.05 + 플랫폼 0.3
 */
export function computeUnifiedScore(
  n: UnifiedNovel & { ridiInnerRank?: number },
  maxViewsByPlatform: Record<Platform, number>,
  maxCommentsByPlatform: Record<Platform, number>,
  maxDeltaByPlatform: Record<Platform, number>,
): number {
  const p = n.platform as Platform;

  // 리디는 ridiInnerRank, 네이버/카카오는 todayRank 사용
  const effectiveRank =
    p === "ridi" && n.ridiInnerRank ? n.ridiInnerRank : n.todayRank;
  const rs = rankToScore(effectiveRank);

  const maxV = maxViewsByPlatform[p] || 0;
  const maxC = maxCommentsByPlatform[p] || 0;
  const maxD = maxDeltaByPlatform[p] || 0;

  // 조회수 비율 (네이버/카카오 전용)
  const viewRatio = p === "ridi" || maxV <= 0 ? 0 : n.todayViews / maxV;

  // 증감률 비율
  const deltaRaw = Math.max(0, n.viewsChangePct || 0);
  const deltaRatio = maxD > 0 ? deltaRaw / maxD : 0;

  // 댓글/평가 비율
  const commentRatio = maxC > 0 ? n.commentCount / maxC : 0;

  // 플랫폼 가중치
  const pw = platformWeight(p);

  if (p === "ridi") {
    // 리디: 순위 0.3 + 증감 0.1 + 댓글 0.05 + 플랫폼 0.3
    return (
      rs * 0.3 +
      deltaRatio * 0.1 +
      commentRatio * 0.05 +
      pw * 0.3
    );
  }

  // 네이버/카카오: 순위 0.4 + 조회 0.25 + 증감 0.15 + 댓글 0.1 + 플랫폼 0.1
  return (
    rs * 0.4 +
    viewRatio * 0.25 +
    deltaRatio * 0.15 +
    commentRatio * 0.1 +
    pw * 0.1
  );
}

/**
 * 2) 트렌드 랭킹용 점수
 * - 플랫폼 가중치 제거
 * - 순위 > 증감률 > 조회수 > 댓글
 * - 리디도 ridiInnerRank 기반 순위 사용 (원하면 todayRank로 다시 바꿔도 됨)
 */
export function computeTrendScore(
  n: UnifiedNovel & { ridiInnerRank?: number },
  maxViewsByPlatform: Record<Platform, number>,
  maxCommentsByPlatform: Record<Platform, number>,
  maxDeltaByPlatform: Record<Platform, number>,
): number {
  const p = n.platform as Platform;

  const effectiveRank =
    p === "ridi" && n.ridiInnerRank ? n.ridiInnerRank : n.todayRank;
  const rs = rankToScore(effectiveRank);

  const maxV = maxViewsByPlatform[p] || 0;
  const maxC = maxCommentsByPlatform[p] || 0;
  const maxD = maxDeltaByPlatform[p] || 0;

  const viewRatio = maxV <= 0 ? 0 : n.todayViews / maxV;

  const deltaRaw = Math.max(0, n.viewsChangePct || 0);
  const deltaRatio = maxD > 0 ? deltaRaw / maxD : 0;

  const commentRatio = maxC > 0 ? n.commentCount / maxC : 0;

  // 트렌드에서는 플랫폼 가중치 완전히 제거
  if (p === "ridi") {
    // 리디도 순위/증감/댓글만 반영 (조회수 없음)
    return rs * 0.4 + deltaRatio * 0.35 + commentRatio * 0.25;
  }

  return (
    rs * 0.4 +
    deltaRatio * 0.35 +
    viewRatio * 0.15 +
    commentRatio * 0.1
  );
}
