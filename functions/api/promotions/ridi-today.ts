import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as cheerio from "cheerio";

type PromotionInfo = {
  timeFreeType?: "none" | "waitFree" | "threeHour" | "pass";
  tag?: string;
  freeEpisodes?: number | null;
  daysLeft?: number | null;
  eventBanners?: { title: string; subtitle: string }[];
  notices?: { title: string; body: string; date?: string }[];
  ridiWaitFree?: boolean;
  ridiFreeLabel?: string | null;
};

type PromotionPayload = {
  date: string;
  platform: "ridi";
  items: { title: string; promotion: PromotionInfo }[];
};

const CATEGORY_URLS = [
  "https://ridibooks.com/bestsellers/romance_serial",
  "https://ridibooks.com/bestsellers/romance_fantasy_serial",
  "https://ridibooks.com/bestsellers/fantasy_serial",
  "https://ridibooks.com/bestsellers/bl-webnovel",
];

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
};

function parseRidiPromotion($item: cheerio.Cheerio<any>): PromotionInfo | null {
  const thumbLink =
    $item.find("a.fig-1q776eq, a.fig-1q776eq.e1ftn9sh1, a.fig-w1hthz").first();

  if (!thumbLink.length) return null;

  const badgeEls = thumbLink.find("ul.fig-1i4k0g9 li[aria-label]").toArray();

  const tagParts: string[] = [];
  let freeEpisodes: number | null = null;
  let ridiFreeLabel: string | null = null;
  let ridiWaitFree = false;
  let timeFreeType: PromotionInfo["timeFreeType"] = "none";

  for (const el of badgeEls) {
    const label = ($item.find(el).attr("aria-label") || "").trim();
    if (!label) continue;

    tagParts.push(label);

    if (label.includes("리다무")) {
      timeFreeType = "waitFree";
      ridiWaitFree = true;
    }

    const m = label.match(/(\d+)\s*화\s*무료/);
    if (m) {
      freeEpisodes = Number(m[1]);
      ridiFreeLabel = m[0];
    }
  }

  if (!tagParts.length && freeEpisodes == null && !ridiWaitFree) {
    return null;
  }

  return {
    timeFreeType,
    tag: tagParts.join(" "),
    freeEpisodes,
    daysLeft: null,
    eventBanners: [],
    notices: [],
    ridiWaitFree,
    ridiFreeLabel,
  };
}

export default async function handler(
  _req: VercelRequest,
  res: VercelResponse<PromotionPayload | { error: string }>
) {
  try {
    const itemsMap = new Map<string, PromotionInfo>();

    for (const url of CATEGORY_URLS) {
      const response = await fetch(url, { headers: HEADERS });
      if (!response.ok) continue;

      const html = await response.text();
      const $ = cheerio.load(html);
      const cards = $("li.fig-1m9tqaj").toArray();

      for (const card of cards) {
        const $card = $(card);
        const title = $card.find("a.fig-w1hthz").first().text().trim();
        if (!title) continue;

        const promotion = parseRidiPromotion($card);
        if (!promotion) continue;

        const key = title.trim();

        if (!itemsMap.has(key)) {
          itemsMap.set(key, promotion);
        } else {
          itemsMap.set(key, {
            ...itemsMap.get(key),
            ...promotion,
          });
        }
      }
    }

    const items = Array.from(itemsMap.entries()).map(([title, promotion]) => ({
      title,
      promotion,
    }));

    return res.status(200).json({
      date: new Date().toISOString().slice(0, 10),
      platform: "ridi",
      items,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error?.message || "Failed to fetch Ridi promotions",
    });
  }
}
