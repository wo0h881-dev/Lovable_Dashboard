import naverData from "../../../public/data/naver-promotions-today.json";
import type { PromotionInfo } from "src/data/mockData";

type RawPromotion = {
  timeFreeType?: "none" | "waitFree" | "threeHour" | "pass";
  tag?: string;
  freeEpisodes?: number | null;
  daysLeft?: number | null;
  eventBanners?: { title: string; subtitle: string }[];
  notices?: { label?: string; title?: string; body?: string; date?: string }[];
};

type RawPayload = {
  date: string;
  platform: "naver";
  items: {
    title: string;
    promotion?: RawPromotion | null;
  }[];
};

function normalizePromotion(raw: RawPromotion | null | undefined): PromotionInfo {
  if (!raw) return {};

  return {
    timeFreeType: raw.timeFreeType ?? "none",
    tag: raw.tag ?? "",
    freeEpisodes: raw.freeEpisodes ?? null,
    daysLeft: raw.daysLeft ?? null,
    eventBanners: raw.eventBanners ?? [],
    notices:
      raw.notices?.map((n) => ({
        title: n.label || "안내",
        body: n.body || n.title || "",
        date: n.date,
      })) ?? [],
  };
}

export const onRequestGet: PagesFunction = async () => {
  const source = naverData as RawPayload;

  const normalized = {
    date: source.date,
    platform: "naver" as const,
    items: (source.items ?? [])
      .filter((item) => item?.title && item?.promotion)
      .map((item) => ({
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
