import type { Novel } from "@/data/mockData";

export type Platform = "kakao" | "naver" | "ridi" | "etc";
export type UnifiedNovel = Novel;

/**
 * 1. 기초 순위 점수 변환
 * 1위에게 20점, 20위에게 1점을 부여합니다. 
 * 플랫폼 간 체급 차이를 극복하기 위한 가장 중요한 기초 지표입니다.
 */
export function rankToScore(rank: number | null | undefined): number {
  if (!rank || typeof rank !== "number") return 0;
  if (rank > 20) return 0;
  return 21 - rank;
}

/**
 * 2. [종합 순위용] 플랫폼별 최소 가중치
 * 시장 점유율을 반영하되, 순위를 뒤엎지 않을 정도로 아주 작게(0.01~0.03) 설정했습니다.
 */
export function platformWeight(p: Platform): number {
  if (p === "naver") return 0.03; 
  if (p === "kakao") return 0.02;
  if (p === "ridi") return 0.01; 
  return 0.005;
}

/**
 * 3. 종합 순위 계산 (Unified Score)
 * 목표: 플랫폼 칸막이를 없애고 각 플랫폼의 상위권이 골고루 섞이게 함
 */
export function computeUnifiedScore(
  n: UnifiedNovel,
  maxViewsByPlatform: Record<Platform, number>,
  maxCommentsByPlatform: Record<Platform, number>,
  maxDeltaByPlatform: Record<Platform, number>
): number {
  const p = n.platform as Platform;
  
  // 플랫폼 내 순위 점수를 0~1 사이 비율로 변환 (1위=1.0, 20위=0.05)
  const rsRatio = rankToScore(n.todayRank) / 20; 

  // 각 지표 정규화 (0~1 사이)
  const viewRatio = n.views / (maxViewsByPlatform[p] || 1);
  const commentRatio = n.commentCount / (maxCommentsByPlatform[p] || 1);
  const deltaRatio = Math.min((n.viewsChangePct || 0) / 100, 1); // 증감률 100%를 1점으로 제한
  
  // 별점 보정 (리디 5점 -> 10점 환산 후 0~1 사이로)
  const normalizedRating = p === "ridi" ? n.rating * 2 : n.rating;
  const ratingScore = normalizedRating / 10;

  const pw = platformWeight(p);

  let baseScore = 0;
  if (p === "ridi") {
    // 리디: 조회수 대신 평가수(commentRatio)에 더 높은 비중을 줌
    baseScore = (rsRatio * 0.5) + (commentRatio * 0.3) + (deltaRatio * 0.1) + (ratingScore * 0.1);
  } else {
    // 네이버/카카오: 순위와 조회수를 중심으로 계산
    baseScore = (rsRatio * 0.5) + (viewRatio * 0.2) + (commentRatio * 0.1) + (deltaRatio * 0.1) + (ratingScore * 0.1);
  }

  return baseScore + pw;
}

/**
 * 4. 트렌드 순위 계산 (Trend Score)
 * 목표: 증감률(기세)을 최우선으로 하여 급상승 작품을 포착 (기존 PD님 만족 로직)
 */
export function computeTrendScore(
  n: UnifiedNovel & { ridiInnerRank?: number },
  maxViewsByPlatform: Record<Platform, number>,
  maxCommentsByPlatform: Record<Platform, number>,
  maxDeltaByPlatform: Record<Platform, number>
): number {
  const p = n.platform as Platform;
  
  // 트렌드용 지표 정규화 (기존 방식 유지)
  const deltaRatio = (n.viewsChangePct || 0) / (maxDeltaByPlatform[p] || 1);
  const effectiveRank = p === "ridi" && n.ridiInnerRank ? n.ridiInnerRank : n.todayRank;
  const rs = rankToScore(effectiveRank);
  const viewRatio = n.views / (maxViewsByPlatform[p] || 1);
  const commentRatio = n.commentCount / (maxCommentsByPlatform[p] || 1);

  // 증감률(45%) + 순위(35%) + 기타(20%)
  return (
    (deltaRatio * 0.45) +
    ((rs / 20) * 0.35) +
    (viewRatio * 0.1) +
    (commentRatio * 0.1)
  );
}

/**
 * 5. 정규화를 위한 플랫폼별 최대치 계산
 */
export function getPlatformMaxStats(novels: UnifiedNovel[]) {
  const maxViewsByPlatform: Record<Platform, number> = { naver: 0, kakao: 0, ridi: 0, etc: 0 };
  const maxCommentsByPlatform: Record<Platform, number> = { naver: 0, kakao: 0, ridi: 0, etc: 0 };
  const maxDeltaByPlatform: Record<Platform, number> = { naver: 0, kakao: 0, ridi: 0, etc: 0 };

  novels.forEach((n) => {
    const p = n.platform as Platform;
    if (n.views > maxViewsByPlatform[p]) maxViewsByPlatform[p] = n.views;
    if (n.commentCount > maxCommentsByPlatform[p]) maxCommentsByPlatform[p] = n.commentCount;
    const absDelta = Math.abs(n.viewsChangePct || 0);
    if (absDelta > maxDeltaByPlatform[p]) maxDeltaByPlatform[p] = absDelta;
  });

  return { maxViewsByPlatform, maxCommentsByPlatform, maxDeltaByPlatform };
}

/**
 * 6. 리디 내부 순위 생성 (트렌드 분석 보조용)
 */
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
