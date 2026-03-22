// src/lib/rankingScore.ts
import type { Novel } from "@/data/mockData";

export type Platform = "kakao" | "naver" | "ridi" | "etc";
export type UnifiedNovel = Novel;

// 1. 순위 점수 (기존 유지)
export function rankToScore(rank: number | null | undefined): number {
  if (!rank || typeof rank !== "number") return 0;
  if (rank > 20) return 0;
  return 21 - rank;
}

// 2. 플랫폼 가중치 보정
// 플랫폼 간 기본 점수 차이를 줄여서 개별 작품의 성적이 더 중요하게 작용하도록 함
export function platformWeight(p: Platform): number {
  if (p === "naver") return 0.3;  // 네이버 독점 방지
  if (p === "kakao") return 0.2;
  if (p === "ridi") return 0.15;  // 리디의 저력 반영
  return 0.05;
}

// 3. 플랫폼별 최대값 계산 (정규화용)
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
 * 4. 리디 내부 순위 주입
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
 * 5. 종합 랭킹용 점수 (공평성 중심 수정본)
 * - 리디의 '평가수' 비중을 높여 네이버의 '조회수'와 대등하게 보정
 * - 별점 보너스를 통한 질적 지표 반영
 */
export function computeUnifiedScore(
  n: UnifiedNovel & { ridiInnerRank?: number },
  maxViewsByPlatform: Record<Platform, number>,
  maxCommentsByPlatform: Record<Platform, number>,
  maxDeltaByPlatform: Record<Platform, number>,
): number {
  const p = n.platform as Platform;
  const effectiveRank = p === "ridi" && n.ridiInnerRank ? n.ridiInnerRank : n.todayRank;
  const rs = rankToScore(effectiveRank);

  const maxV = maxViewsByPlatform[p] || 0;
  const maxC = maxCommentsByPlatform[p] || 0;
  const maxD = maxDeltaByPlatform[p] || 0;

  const viewRatio = p === "ridi" || maxV <= 0 ? 0 : n.todayViews / maxV;
  const deltaRatio = maxD > 0 ? Math.max(0, n.viewsChangePct || 0) / maxD : 0;
  const commentRatio = maxC > 0 ? n.commentCount / maxC : 0;
  const pw = platformWeight(p);

  // 별점 보너스 (리디는 조회수가 없는 대신 별점 비중을 높여 공평성 유지)
  const normalizedRating = p === "ridi" ? n.rating * 2 : n.rating;
  const ratingBonus = (normalizedRating / 10) * 0.1;

  if (p === "ridi") {
    // 리디: 순위(0.4) + 평가수(0.4) + 증감(0.1) + 플랫폼/별점(0.1)
    return (
      rs * 0.4 +
      commentRatio * 0.4 +
      deltaRatio * 0.1 +
      (pw * 0.05 + ratingBonus)
    );
  }

  // 네이버/카카오: 순위(0.4) + 조회(0.25) + 증감(0.15) + 댓글(0.1) + 플랫폼(0.1)
  return (
    rs * 0.4 +
    viewRatio * 0.25 +
    deltaRatio * 0.15 +
    commentRatio * 0.1 +
    pw * 0.1
  );
}

/**
 * 6. 트렌드 랭킹용 점수 (기존 로직 유지)
 */
export function computeTrendScore(
  n: UnifiedNovel & { ridiInnerRank?: number },
  maxViewsByPlatform: Record<Platform, number>,
  maxCommentsByPlatform: Record<Platform, number>,
  maxDeltaByPlatform: Record<Platform, number>,
): number {
  const p = n.platform as Platform;
  const effectiveRank = p === "ridi" && n.ridiInnerRank ? n.ridiInnerRank : n.todayRank;
  const rs = rankToScore(effectiveRank);

  const maxV = maxViewsByPlatform[p] || 0;
  const maxC = maxCommentsByPlatform[p] || 0;
  const maxD = maxDeltaByPlatform[p] || 0;

  const viewRatio = maxV <= 0 ? 0 : n.todayViews / maxV;
  const deltaRatio = maxD > 0 ? Math.max(0, n.viewsChangePct || 0) / maxD : 0;
  const commentRatio = maxC > 0 ? n.commentCount / maxC : 0;

  if (p === "ridi") {
    return rs * 0.4 + deltaRatio * 0.35 + commentRatio * 0.25;
  }

  return (
    rs * 0.4 +
    deltaRatio * 0.35 +
    viewRatio * 0.15 +
    commentRatio * 0.1
  );
}
