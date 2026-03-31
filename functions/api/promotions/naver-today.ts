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
  platform: "naver";
  items: { title: string; promotion: PromotionInfo }[];
};

const RANKING_URL =
  "https://series.naver.com/novel/top100List.series?rankingTypeCode=DAILY&categoryCode=ALL";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36",
};

function parsePromotionFromListItem($li: cheerio.Cheerio<any>): PromotionInfo | null {
  const thumbA = $li.find("a.pic").first();
  const tagParts: string[] = [];
  let timeFreeType: PromotionInfo["timeFreeType"] = "none";

  if (thumbA.length) {
    thumbA.find("em").each((_, el) => {
      const $em = cheerio.load(el).root();
      let text = cheerio.load(el).text().trim();

      if (!text) {
        text = $em.find(".blind").text().trim();
      }
      if (!text) return;

      tagParts.push(text);

      if (text.includes("매일10시무료")) {
        timeFreeType = "waitFree";
      } else if (text.includes("타임딜")) {
        timeFreeType = "threeHour";
      }
    });
  }

  const metaText =
    $li.find(".comic_cont .info").first().text().trim() ||
    $li.find(".info").first().text().trim() ||
    "";

  const freeMatch = metaText.match(/(\d+)\s*화\s*무료/);
  const daysMatch = metaText.match(/(\d+)\s*일\s*남음/);

  const freeEpisodes = freeMatch ? Number(freeMatch[1]) : null;
  const daysLeft = daysMatch ? Number(daysMatch[1]) : null;

  const tag = tagParts.join(" ").trim();
  const fullText = `${tag} ${metaText}`;

  if (timeFreeType === "none") {
    if (fullText.includes("에디션") || fullText.includes("프리패스")) {
      timeFreeType = "pass";
    }
  }

  if (
    timeFreeType === "none" &&
    freeEpisodes == null &&
    daysLeft == null &&
    !tag
  ) {
    return null;
  }

  return {
    timeFreeType,
    tag: tag || "프로모션",
    freeEpisodes,
    daysLeft,
    eventBanners: [],
    notices: [],
  };
}

export default async function handler(
  _req: VercelRequest,
  res: VercelResponse<PromotionPayload | { error: string }>
) {
  try {
    const response = await fetch(RANKING_URL, { headers: HEADERS });
    if (!response.ok) {
      throw new Error(`NAVER fetch failed: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const lis = $("#content > div > ul > li").toArray();

    const items: PromotionPayload["items"] = [];

    for (const li of lis.slice(0, 20)) {
      const $li = $(li);
      const title =
        $li.find("div.comic_cont h3 a").first().text().trim() ||
        $li.find("h3 a").first().text().trim();

      if (!title) continue;

      const promotion = parsePromotionFromListItem($li);
      if (!promotion) continue;

      items.push({ title, promotion });
    }

    return res.status(200).json({
      date: new Date().toISOString().slice(0, 10),
      platform: "naver",
      items,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error?.message || "Failed to fetch Naver promotions",
    });
  }
}
