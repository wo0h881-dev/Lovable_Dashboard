// src/data/mockData.ts


export type Platform = "naver" | "kakao" | "ridi";

export type Genre =
  | "현판"
  | "로판"
  | "로맨스"
  | "판타지"
  | "무협"
  | "BL"
  | "현대물"
  | "역사/시대물"
  | "기타";

export interface PromotionNotice {
  label?: string;
  title: string;
  body?: string;
  date?: string;
}

export interface PromotionBenefit {
  label?: string;
  title: string;
  subtitle?: string;
}

export interface PromotionBanner {
  title: string;
  subtitle?: string;
}

export interface PromotionInfo {
  timeFreeType?: "none" | "waitFree" | "threeHour" | "pass";
  tag?: string;
  freeEpisodes?: number | null;
  daysLeft?: number | null;

  eventBanners?: PromotionBanner[];
  notices?: PromotionNotice[];

  // 리디 확장
  benefits?: PromotionBenefit[];
  serialSchedule?: string;
  exclusiveText?: string;
  ridiWaitFreeText?: string;

  ridiWaitFree?: boolean;
  ridiFreeLabel?: string | null;
}

export interface Novel {
  id: string;
  title: string;
  author: string;
  genre: Genre;
  rawGenre?: string;
  publisher: string;
  platform: Platform;
  coverGradient: string;
  coverEmoji: string;
  todayRank: number | null;
  thumbnailUrl?: string;
  prevRank: number | null;
  rankChange: number | null;
  isNew: boolean;
  isReEntry: boolean;
  todayViews: number;
  viewsChange: number;
  viewsChangePct: number;
  rating: number;
  commentCount: number;
  episodeCount: number;
  firstAppeared: string;
  consecutiveDays: number;
  peakRank: number;
  rankHistory?: { date: string; rank: number | null }[];
  viewsHistory?: { date: string; views: number }[];
  promotion?: PromotionInfo;

  status: "none" | "reading" | "completed" | "wish";
  currentEpisode: number;
  readingGoalDays: number;
  readingStartDate?: string;
  memo?: string;
}

export const novels: Novel[] = [
  {
    id: "1",
    title: "달빛 조각사 리버스: 전생의 검황",
    author: "남희성",
    genre: "판타지",
    rawGenre: "게임판타지 / 성장물", // 세부장르 예시 추가
    publisher: "카카오엔터",
    platform: "kakao",
    coverGradient: "from-amber-900 to-orange-700",
    coverEmoji: "⚔️",
    todayRank: 1,
    prevRank: 2,
    rankChange: 1,
    isNew: false,
    isReEntry: false,
    todayViews: 2840000,
    viewsChange: 124000,
    viewsChangePct: 4.6,
    rating: 9.8,
    commentCount: 45210,
    episodeCount: 1247,
    firstAppeared: "2023-01-15",
    consecutiveDays: 412,
    peakRank: 1,
    // 독서 기록 초기값 예시
    status: 'reading',
    currentEpisode: 120,
    readingGoalDays: 30,
  },
  {
    id: "2",
    title: "황제의 외동딸",
    author: "황제외동딸작가",
    genre: "로판",
    rawGenre: "육아물 / 환생물",
    publisher: "문피아",
    platform: "naver",
    coverGradient: "from-rose-900 to-pink-700",
    coverEmoji: "👑",
    todayRank: 2,
    prevRank: 1,
    rankChange: -1,
    isNew: false,
    isReEntry: false,
    todayViews: 2610000,
    viewsChange: -89000,
    viewsChangePct: -3.3,
    rating: 9.7,
    commentCount: 38920,
    episodeCount: 893,
    firstAppeared: "2022-08-01",
    consecutiveDays: 580,
    peakRank: 1,
    status: 'none',
    currentEpisode: 0,
    readingGoalDays: 14,
  },
  {
    id: "3",
    title: "나 혼자만 레벨업",
    author: "추공",
    genre: "판타지",
    rawGenre: "헌터물 / 상태창",
    publisher: "디앤씨미디어",
    platform: "kakao",
    coverGradient: "from-blue-900 to-indigo-700",
    coverEmoji: "⚡",
    todayRank: 3,
    prevRank: 3,
    rankChange: 0,
    isNew: false,
    isReEntry: false,
    todayViews: 2340000,
    viewsChange: 56000,
    viewsChangePct: 2.4,
    rating: 9.9,
    commentCount: 82340,
    episodeCount: 270,
    firstAppeared: "2021-03-04",
    consecutiveDays: 1120,
    peakRank: 1,
    status: 'none',
    currentEpisode: 0,
    readingGoalDays: 7,
  },
  {
    id: "4",
    title: "전지적 독자 시점",
    author: "싱숑",
    genre: "판타지",
    rawGenre: "성좌물 / 아포칼립스",
    publisher: "문피아",
    platform: "naver",
    coverGradient: "from-slate-800 to-gray-600",
    coverEmoji: "📖",
    todayRank: 4,
    prevRank: 6,
    rankChange: 2,
    isNew: false,
    isReEntry: false,
    todayViews: 2180000,
    viewsChange: 215000,
    viewsChangePct: 10.9,
    rating: 9.9,
    commentCount: 67110,
    episodeCount: 551,
    firstAppeared: "2021-09-15",
    consecutiveDays: 890,
    peakRank: 1,
    status: 'completed',
    currentEpisode: 551,
    readingGoalDays: 30,
  },
  {
    id: "5",
    title: "악역의 엔딩은 죽음뿐",
    author: "로로로",
    genre: "로판",
    rawGenre: "게임빙의 / 역하렘",
    publisher: "조아라",
    platform: "ridi",
    coverGradient: "from-purple-900 to-violet-700",
    coverEmoji: "🌙",
    todayRank: 5,
    prevRank: 9,
    rankChange: 4,
    isNew: false,
    isReEntry: false,
    todayViews: 1890,
    viewsChange: 312,
    viewsChangePct: 19.8,
    rating: 9.5,
    commentCount: 12340,
    episodeCount: 423,
    firstAppeared: "2022-11-20",
    consecutiveDays: 490,
    peakRank: 3,
    status: 'wish',
    currentEpisode: 0,
    readingGoalDays: 14,
  },
  {
    id: "6",
    title: "빙의 게임: 네 남자의 행방불명",
    author: "이금희",
    genre: "로맨스",
    rawGenre: "현대로맨스 / 오피스물",
    publisher: "카카오엔터",
    platform: "kakao",
    coverGradient: "from-teal-900 to-cyan-700",
    coverEmoji: "🎮",
    todayRank: 6,
    prevRank: 4,
    rankChange: -2,
    isNew: false,
    isReEntry: false,
    todayViews: 1750000,
    viewsChange: -95000,
    viewsChangePct: -5.1,
    rating: 9.3,
    commentCount: 18920,
    episodeCount: 312,
    firstAppeared: "2023-03-08",
    consecutiveDays: 360,
    peakRank: 2,
    status: 'none',
    currentEpisode: 0,
    readingGoalDays: 7,
  },
  {
    id: "7",
    title: "SSS급 죽어야 사는 헌터",
    author: "천도운",
    genre: "현판",
    rawGenre: "회귀물 / 탑등반물",
    publisher: "문피아",
    platform: "naver",
    coverGradient: "from-red-900 to-orange-700",
    coverEmoji: "🗡️",
    todayRank: 7,
    prevRank: 12,
    rankChange: 5,
    isNew: false,
    isReEntry: false,
    todayViews: 1620000,
    viewsChange: 380000,
    viewsChangePct: 30.7,
    rating: 9.4,
    commentCount: 9870,
    episodeCount: 187,
    firstAppeared: "2023-06-01",
    consecutiveDays: 290,
    peakRank: 5,
    status: 'none',
    currentEpisode: 0,
    readingGoalDays: 7,
  },
  {
    id: "8",
    title: "오빠라고 부르지 마",
    author: "아이리스",
    genre: "BL",
    rawGenre: "캠퍼스물 / 일상물",
    publisher: "조아라",
    platform: "ridi",
    coverGradient: "from-pink-900 to-rose-700",
    coverEmoji: "🌸",
    todayRank: 8,
    prevRank: 8,
    rankChange: 0,
    isNew: false,
    isReEntry: false,
    todayViews: 2140,
    viewsChange: 45,
    viewsChangePct: 2.1,
    rating: 9.6,
    commentCount: 7450,
    episodeCount: 156,
    firstAppeared: "2023-02-14",
    consecutiveDays: 420,
    peakRank: 6,
    status: 'none',
    currentEpisode: 0,
    readingGoalDays: 7,
  },
  {
    id: "9",
    title: "무림의 표류자",
    author: "진산월",
    genre: "무협",
    rawGenre: "정통무협 / 먼치킨",
    publisher: "디앤씨미디어",
    platform: "kakao",
    coverGradient: "from-yellow-900 to-amber-700",
    coverEmoji: "🏔️",
    todayRank: 9,
    prevRank: null,
    rankChange: null,
    isNew: true,
    isReEntry: false,
    todayViews: 1430000,
    viewsChange: 1430000,
    viewsChangePct: 100,
    rating: 9.1,
    commentCount: 1230,
    episodeCount: 48,
    firstAppeared: "2024-03-12",
    consecutiveDays: 1,
    peakRank: 9,
    status: 'none',
    currentEpisode: 0,
    readingGoalDays: 7,
  },
  {
    id: "10",
    title: "빛바랜 봄날에 너를 만났다",
    author: "봄비",
    genre: "로맨스",
    rawGenre: "잔잔물 / 첫사랑",
    publisher: "문피아",
    platform: "naver",
    coverGradient: "from-emerald-900 to-green-700",
    coverEmoji: "🌷",
    todayRank: 10,
    prevRank: 25,
    rankChange: 15,
    isNew: false,
    isReEntry: true,
    todayViews: 1280000,
    viewsChange: 620000,
    viewsChangePct: 93.9,
    rating: 9.2,
    commentCount: 14560,
    episodeCount: 204,
    firstAppeared: "2022-05-18",
    consecutiveDays: 1,
    peakRank: 7,
    status: 'none',
    currentEpisode: 0,
    readingGoalDays: 7,
  },
  {
    id: "11",
    title: "공작가의 흑막 딸",
    author: "해나",
    genre: "로판",
    rawGenre: "빙의물 / 책략여주",
    publisher: "조아라",
    platform: "ridi",
    coverGradient: "from-violet-900 to-purple-700",
    coverEmoji: "🦋",
    todayRank: 11,
    prevRank: 11,
    rankChange: 0,
    isNew: false,
    isReEntry: false,
    todayViews: 1840,
    viewsChange: 22,
    viewsChangePct: 1.2,
    rating: 9.4,
    commentCount: 6780,
    episodeCount: 289,
    firstAppeared: "2022-12-05",
    consecutiveDays: 480,
    peakRank: 8,
    status: 'none',
    currentEpisode: 0,
    readingGoalDays: 7,
  },
  {
    id: "12",
    title: "아레나 마스터: 랭킹의 왕",
    author: "전기작가",
    genre: "현판",
    rawGenre: "게임판타지 / 프로게이머",
    publisher: "카카오엔터",
    platform: "kakao",
    coverGradient: "from-blue-900 to-sky-700",
    coverEmoji: "🏆",
    todayRank: 12,
    prevRank: 7,
    rankChange: -5,
    isNew: false,
    isReEntry: false,
    todayViews: 1190000,
    viewsChange: -210000,
    viewsChangePct: -15.0,
    rating: 9.0,
    commentCount: 8920,
    episodeCount: 168,
    firstAppeared: "2023-07-22",
    consecutiveDays: 234,
    peakRank: 4,
    status: 'none',
    currentEpisode: 0,
    readingGoalDays: 7,
  },
];

export const publishers = [
  {
    name: "카카오엔터",
    workCount: 342,
    naverCount: 12,
    kakaoCount: 298,
    ridiCount: 32,
    totalViews: 89200000,
    avgRank: 4.2,
  },
  {
    name: "문피아",
    workCount: 287,
    naverCount: 198,
    kakaoCount: 54,
    ridiCount: 35,
    totalViews: 71500000,
    avgRank: 5.1,
  },
  {
    name: "디앤씨미디어",
    workCount: 198,
    naverCount: 45,
    kakaoCount: 123,
    ridiCount: 30,
    totalViews: 52300000,
    avgRank: 6.3,
  },
  {
    name: "조아라",
    workCount: 165,
    naverCount: 32,
    kakaoCount: 41,
    ridiCount: 92,
    totalViews: 38900000,
    avgRank: 8.7,
  },
  {
    name: "로크미디어",
    workCount: 112,
    naverCount: 67,
    kakaoCount: 29,
    ridiCount: 16,
    totalViews: 29100000,
    avgRank: 9.4,
  },
  {
    name: "대원씨아이",
    workCount: 89,
    naverCount: 11,
    kakaoCount: 58,
    ridiCount: 20,
    totalViews: 21400000,
    avgRank: 11.2,
  },
];

export const platformShareData = [
  { name: "네이버", value: 38, color: "hsl(138, 100%, 39%)" },
  { name: "카카오", value: 35, color: "hsl(50, 100%, 50%)" },
  { name: "리디", value: 27, color: "hsl(210, 76%, 51%)" },
];

export const genreBarData = [
  { genre: "로판", naver: 28, kakao: 24, ridi: 19 },
  { genre: "판타지", naver: 35, kakao: 31, ridi: 14 },
  { genre: "로맨스", naver: 18, kakao: 22, ridi: 31 },
  { genre: "현판", naver: 22, kakao: 18, ridi: 8 },
  { genre: "BL", naver: 6, kakao: 8, ridi: 24 },
  { genre: "무협", naver: 12, kakao: 15, ridi: 4 },
];

export const trendData = Array.from({ length: 30 }, (_, i) => {
  const date = new Date("2024-02-12");
  date.setDate(date.getDate() + i);
  return {
    date: `${date.getMonth() + 1}/${date.getDate()}`,
    novel1Rank: Math.max(
      1,
      4 +
        Math.round(
          Math.sin(i / 3) * 3 + (Math.random() - 0.5) * 2,
        ),
    ),
    novel1Views:
      2100000 +
      Math.round(
        Math.sin(i / 4) * 300000 + (Math.random() - 0.5) * 200000,
      ),
    novel2Rank: Math.max(
      1,
      7 +
        Math.round(
          Math.cos(i / 3) * 4 + (Math.random() - 0.5) * 3,
        ),
    ),
    novel2Views:
      1600000 +
      Math.round(
        Math.cos(i / 4) * 250000 + (Math.random() - 0.5) * 150000,
      ),
  };
});

export const kpiData = {
  totalWorks: { value: 4821, change: 2.3 },
  newWorks: { value: 127, change: -8.1 },
  rankMoved: { value: 342, change: 12.4 },
  reEntry: { value: 23, change: 4.5 },
};

export const heatmapData: {
  genre: Genre;
  naver: number;
  kakao: number;
  ridi: number;
}[] = [
  { genre: "로판", naver: 87, kakao: 72, ridi: 54 },
  { genre: "판타지", naver: 93, kakao: 88, ridi: 41 },
  { genre: "로맨스", naver: 61, kakao: 79, ridi: 92 },
  { genre: "현판", naver: 75, kakao: 68, ridi: 23 },
  { genre: "BL", naver: 28, kakao: 34, ridi: 89 },
  { genre: "무협", naver: 49, kakao: 61, ridi: 18 },
];

export const newWorksData = novels
  .filter((n) => n.isNew || n.isReEntry || n.consecutiveDays < 30)
  .slice(0, 8);

export const notableWorks = novels.filter(
  (n) => Math.abs(n.rankChange || 0) >= 4 || n.isNew || n.isReEntry,
);

export function formatViews(platform: Platform, views: number): string {
  if (platform === "ridi") {
    return Number(views ?? 0).toLocaleString("ko-KR") + " 평가";
  }

  const v = Number(views ?? 0);
  if (!Number.isFinite(v) || v <= 0) return "-";

  const man = v / 10_000;
  const s = man.toFixed(1).replace(/\.0$/, "");
  return `${s}만`;
}

export function getRankChangeLabel(
  novel: Novel,
): {
  label: string;
  type: "up" | "down" | "new" | "reentry" | "same";
} {
  if (novel.isNew) return { label: "NEW", type: "new" };
  if (novel.isReEntry) return { label: "재진입", type: "reentry" };
  if (!novel.rankChange || novel.rankChange === 0)
    return { label: "–", type: "same" };
  if (novel.rankChange > 0)
    return { label: `▲${novel.rankChange}`, type: "up" };
  return { label: `▼${Math.abs(novel.rankChange)}`, type: "down" };
}

export function parseKoreanCount(value: string | number | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;

  const s = String(value).trim();
  if (!s) return 0;

  if (/^\d{1,3}(,\d{3})*$/.test(s)) {
    return Number(s.replace(/,/g, "")) || 0;
  }

  if (s.endsWith("만")) {
    const base = s.replace("만", "");
    const n = Number(base.replace(/,/g, ""));
    return Number.isFinite(n) ? Math.round(n * 10_000) : 0;
  }

  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}
