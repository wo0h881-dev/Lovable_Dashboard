// functions/api/promotions/kakao-today.ts 같은 곳
import raw from "../../public/data/kakao-promotions-today.json";

function normalizePromotion(p: any): PromotionInfo {
  const eventTitle = p.eventBanner?.title;
  const eventSubtitle = p.eventBanner?.subtitle;

  const notices: PromotionNotice[] =
    p.notices?.map((n: any) => {
      // "안내외전 오픈 안내(3/22)" → title: "안내", body: "외전 오픈 안내(3/22)"
      const full = n.title || "";
      const label = n.label || "안내";
      const body = full.replace(/^안내/, "");
      return {
        title: label,
        body: body || full || label,
        date: n.date,
      };
    }) ?? [];

  return {
    timeFreeType: p.timeFreeType ?? "none",
    eventTitle,
    eventSubtitle,
    notices,
  };
}

export const onRequestGet: PagesFunction = async () => {
  const normalized = {
    date: raw.date,
    platform: raw.platform,
    items: raw.items.map((item: any) => ({
      title: item.title,
      promotion: normalizePromotion(item.promotion || {}),
    })),
  };

  return new Response(JSON.stringify(normalized), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
};
