// src/hooks/useTodayCombined.ts
import { useQuery } from "@tanstack/react-query";

export type NovelItem = {
  출처: string;
  오늘순위: number;
  제목: string;
  작가: string;
  날짜: string | Date;
  장르: string;
  오늘조회수: string;
  전일순위: string | number;
  순위변화: string;
  조회수증감: string;
  조회수증감률: string;
  썸네일: string;
  // 필요하면 출판사, 평점 등 추가
};

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string;

export function useTodayCombined() {
  return useQuery<NovelItem[]>({
    queryKey: ["todayCombined"],
    queryFn: async () => {
      const url = `${APPS_SCRIPT_URL}?action=getTodayCombined`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Apps Script 호출 실패");
      return res.json();
    },
  });
}
