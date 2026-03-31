// src/lib/promotion.ts
import type { Novel } from "@/data/mockData";

export function getRidiPromotionLabels(novel: Novel) {
  const promo = novel.promotion;
  if (!promo) return [];

  const labels: string[] = [];

  if (promo.ridiWaitFree) {
    labels.push("리다무");
  }

  if (promo.ridiFreeLabel) {
    labels.push(promo.ridiFreeLabel); // "3화 무료"
  } else if (promo.freeEpisodes) {
    labels.push(`${promo.freeEpisodes}화 무료`);
  }

  return labels;
}
