import kakaoData from "../../../public/data/kakao-promotions-today.json";

type PromotionNotice = {
  title: string;
  body: string;
  date?: string;
};

type PromotionInfo = {
  timeFreeType?: "none" | "waitFree" | "threeHour";
  eventTitle?: string;
  eventSubtitle?: string;
  notices?: PromotionNotice[];
};

function normalizePromotion(raw: any): PromotionInfo {
  if (!raw) return {};

  const eventTitle = raw.eventBanner?.title;
  const eventSubtitle = raw.eventBanner?.subtitle;

  const notices: PromotionNotice[] =
    raw.notices?.map((n: any) => {
      const label = n.label || "안내";
      const fullTitle = n.title || "";
      // "안내외전 오픈 안내(3/22)" → label: "안내", body: "외전 오픈 안내(3/22)"
      const body = fullTitle.replace(/^안내/, "") || fullTitle || label;

      return {
        title: label,
        body,
        date: n.date,
      };
    }) ?? [];

  return {
    timeFreeType: raw.timeFreeType ?? "none",
    eventTitle,
    eventSubtitle,
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
