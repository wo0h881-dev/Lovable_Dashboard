import type { Novel } from "@/data/mockData";

export function getTimeFreeLabel(novel: Novel) {
  const promo = novel.promotion;
  if (!promo) return null;

  if (promo.timeFreeType === "waitFree") return "기다무";
  if (promo.timeFreeType === "threeHour") return "3시간 무료";
  if (promo.timeFreeType === "pass") return "프리패스";
  return null;
}

export function getRidiPromotionLabels(novel: Novel) {
  const promo = novel.promotion;
  if (!promo) return [];

  const labels: string[] = [];

  if (promo.ridiWaitFree) {
    labels.push("리다무");
  }

  if (promo.ridiFreeLabel) {
    labels.push(promo.ridiFreeLabel);
  } else if (promo.freeEpisodes) {
    labels.push(`${promo.freeEpisodes}화 무료`);
  }

  return labels;
}
