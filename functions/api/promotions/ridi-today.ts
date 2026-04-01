import ridiData from "../../../public/data/ridi-promotions-today.json";
import type { PromotionInfo } from "src/data/mockData";

type RawPromotion = {
  timeFreeType?: "none" | "waitFree" | "threeHour" | "pass";
  tag?: string;
  freeEpisodes?: number | null;
  daysLeft?: number | null;
  eventBanners?: { title: string; subtitle: string }[];
  notices?: { label?: string; title?: string; body?: string; date?: string }[];
  ridiWaitFree?: boolean;
  ridiFreeLabel?: string | null;
  serialSchedule?: string;
  exclusiveText?: string;
  ridiWaitFreeText?: string;
  benefits?: any[];
};

type RawPayload = {
  date: string;
  platform: "ridi";
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

    // 🔥 핵심 수정: 구조 보존
    notices:
      raw.notices?.map((n) => ({
        label: n.label ?? "공지",
        title: n.title ?? n.body ?? "",
        body: n.body ?? undefined,
        date: n.date,
      })) ?? [],

    // 🔥 누락됐던 필드들 추가
    serialSchedule: (raw as any).serialSchedule ?? undefined,
    exclusiveText: (raw as any).exclusiveText ?? undefined,
    ridiWaitFreeText: (raw as any).ridiWaitFreeText ?? undefined,

    benefits: (raw as any).benefits ?? [],

    ridiWaitFree: raw.ridiWaitFree ?? false,
    ridiFreeLabel: raw.ridiFreeLabel ?? null,
  };
}

export const onRequestGet: PagesFunction = async () => {
  const source = ridiData as RawPayload;

  const normalized = {
    date: source.date,
    platform: "ridi" as const,
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
