import kakaoData from "../../../public/data/kakao-promotions-today.json";
import type { PromotionInfo, PromotionNotice } from "src/data/mockData"; // 경로 맞춰서

function normalizePromotion(raw: any): PromotionInfo {
  if (!raw) return {};

  const notices: PromotionNotice[] =
    raw.notices?.map((n: any) => {
      const label = n.label || "안내";
      const fullTitle = n.title || "";
      const body =
        fullTitle.replace(/^안내/, "") || fullTitle || label;

      return {
        title: label,
        body,
        date: n.date,
      };
    }) ?? [];

  return {
    timeFreeType: raw.timeFreeType ?? "none",
    eventBanners: raw.eventBanners ?? [],
    notices,
  };
}

export const onRequestGet: PagesFunction = async () => {
  const normalized = {
    date: kakaoData.date,
    platform: kakaoData.platform,
    items: kakaoData.items.map((item: any) => ({
      title: item.title,
      promotion: normalizePromotion(item.promotion),
    })),
  };

  return new Response(JSON.stringify(normalized), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
};
