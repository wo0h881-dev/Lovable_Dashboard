// src/pages/Publishers.tsx
import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";
import { RankingCard } from "@/components/shared/RankingCard";
import { NovelDetailDrawer } from "@/components/shared/NovelDetailDrawer";
import { dateRangeLabels, useTodayCombined } from "@/hooks/useTodayCombined";
import { useDashboardDateRange } from "@/hooks/useDashboardDateRange";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import { type Novel } from "@/data/mockData";

const PUB_COLORS = [
  "hsl(var(--kakao))",
  "hsl(var(--naver))",
  "hsl(var(--ridi))",
  "#c084fc",
  "#f97316",
  "#22d3ee",
  "#f43f5e",
  "#10b981",
  "#a78bfa",
  "#f59e0b",
];

function toKoreanUnit(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "-";
  if (n >= 100_000_000) {
    return `${(n / 100_000_000).toFixed(1).replace(/\.0$/, "")}억`;
  }
  if (n >= 10_000) {
    const manVal = n / 10_000;
    if (manVal < 100) return `${manVal.toFixed(1).replace(/\.0$/, "")}만`;
    return `${Math.round(manVal).toLocaleString("ko-KR")}만`;
  }
  return n.toLocaleString("ko-KR");
}

export default function PublishersPage() {
  const dateRange = useDashboardDateRange();
  const periodLabel = dateRangeLabels[dateRange];
  const { data: sourceData, isLoading, error, latestDate } = useTodayCombined(dateRange);
  const [search, setSearch] = useState("");
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);

  const novels: Novel[] = sourceData ?? [];

  const publisherStats = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        novels: Novel[];
        naverCount: number;
        kakaoCount: number;
        ridiCount: number;
        totalViews: number;
        avgRank: number;
        trendHits: number;
        newCount: number;
      }
    >();

    for (const n of novels) {
      const pub = n.publisher || "-";
      if (!map.has(pub)) {
        map.set(pub, {
          name: pub,
          novels: [],
          naverCount: 0,
          kakaoCount: 0,
          ridiCount: 0,
          totalViews: 0,
          avgRank: 0,
          trendHits: 0,
          newCount: 0,
        });
      }
      const entry = map.get(pub)!;
      entry.novels.push(n);

      if (n.platform === "naver") entry.naverCount++;
      if (n.platform === "kakao") entry.kakaoCount++;
      if (n.platform === "ridi") entry.ridiCount++;

      entry.totalViews += n.todayViews || 0;

      if ((n.viewsChangePct || 0) >= 15) entry.trendHits++;
      if (n.isNew) entry.newCount++;
    }

    for (const entry of map.values()) {
      const ranks = entry.novels
        .map((n) => n.todayRank)
        .filter((r): r is number => r != null && r > 0);

      entry.avgRank =
        ranks.length > 0
          ? ranks.reduce((a, b) => a + b, 0) / ranks.length
          : 0;
    }

    return Array.from(map.values()).sort((a, b) => b.novels.length - a.novels.length);
  }, [novels]);

  const pubColorMap = useMemo(() => {
    return Object.fromEntries(
      publisherStats.map((p, i) => [p.name, PUB_COLORS[i % PUB_COLORS.length]]),
    );
  }, [publisherStats]);

  const bubbleData = useMemo(() => {
    return publisherStats.map((p) => ({
      x: p.novels.length,
      y: p.avgRank > 0 ? p.avgRank : 999,
      z: Math.max(60, p.trendHits * 30 + p.newCount * 15),
      name: p.name,
      color: pubColorMap[p.name],
      totalViews: p.totalViews,
      trendHits: p.trendHits,
      newCount: p.newCount,
    }));
  }, [publisherStats, pubColorMap]);

  const [selectedPub, setSelectedPub] = useState<string>("");

  const activePub = selectedPub || publisherStats[0]?.name || "";
  const pubData = publisherStats.find((p) => p.name === activePub);
  const pubNovels = (pubData?.novels ?? []).sort(
    (a, b) => (a.todayRank ?? 999) - (b.todayRank ?? 999),
  );

  const filteredPubs = publisherStats.filter((p) => !search || p.name.includes(search));

  if (isLoading) return <LoadingScreen />;
  if (error) {
    return <div className="p-8 text-center text-red-500 font-bold">{error}</div>;
  }

  return (
    <div className="space-y-5 md:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-black tracking-tight">출판사</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {latestDate} 기준 · {periodLabel} · 총 {publisherStats.length}개 출판사
        </p>
      </div>

      {/* 버블 차트 */}
      <div className="surface-card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
          <h2 className="text-sm font-bold">출판사 포트폴리오 버블 차트</h2>
          <div className="text-xs text-muted-foreground">
            X축: 작품 수 · Y축: 평균 순위 · 버블 크기: 급상승 + 신작 반응
          </div>
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart margin={{ top: 12, right: 16, bottom: 12, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              type="number"
              dataKey="x"
              name="작품 수"
              tick={{
                fontSize: 10,
                fill: "hsl(var(--muted-foreground))",
                fontFamily: "Roboto Mono",
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="평균 순위"
              reversed
              tick={{
                fontSize: 10,
                fill: "hsl(var(--muted-foreground))",
                fontFamily: "Roboto Mono",
              }}
              tickFormatter={(v) => `#${Number(v).toFixed(0)}`}
            />
            <ZAxis type="number" dataKey="z" range={[80, 700]} />
            <Tooltip
              cursor={false}
              contentStyle={{
                background: "hsl(var(--surface))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 11,
              }}
              content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-surface border border-border rounded-lg p-3 text-xs space-y-1">
                    <div className="font-semibold">{d.name}</div>
                    <div className="text-muted-foreground">작품 수: {d.x}편</div>
                    <div className="text-muted-foreground">
                      평균 순위: #{Number(d.y).toFixed(1)}위
                    </div>
                    <div className="text-muted-foreground">
                      총 조회수/평가수: {toKoreanUnit(d.totalViews)}
                    </div>
                    <div className="text-muted-foreground">급상승작: {d.trendHits}편</div>
                    <div className="text-muted-foreground">신작: {d.newCount}편</div>
                  </div>
                );
              }}
            />
            {bubbleData.map((d) => (
              <Scatter
                key={d.name}
                data={[d]}
                fill={d.color}
                fillOpacity={0.72}
                onClick={() => setSelectedPub(d.name)}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>

        <div className="flex gap-2 mt-3 overflow-x-auto whitespace-nowrap pb-1">
          {publisherStats.slice(0, 10).map((p) => (
            <button
              key={p.name}
              onClick={() => setSelectedPub(p.name)}
              className={cn(
                "flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border transition-colors shrink-0",
                activePub === p.name
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-surface-elevated text-muted-foreground border-border hover:text-foreground",
              )}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: pubColorMap[p.name] }}
              />
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5 md:gap-6">
        {/* 출판사 목록 */}
        <div className="surface-card space-y-3">
          <div className="relative">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="출판사 검색…"
              className="w-full pl-8 pr-3 py-2 md:py-1.5 text-xs rounded-lg bg-surface-elevated border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-1 max-h-[420px] xl:max-h-[600px] overflow-y-auto">
            {filteredPubs.map((p) => (
              <button
                key={p.name}
                onClick={() => setSelectedPub(p.name)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-lg transition-colors",
                  activePub === p.name
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-surface-elevated text-muted-foreground hover:text-foreground",
                )}
              >
                <div className="text-sm font-semibold">{p.name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-xs text-muted-foreground">
                    {p.novels.length}편
                  </span>
                  <div className="flex items-center gap-1">
                    {p.naverCount > 0 && (
                      <span className="text-[9px] font-bold text-naver">
                        N{p.naverCount}
                      </span>
                    )}
                    {p.kakaoCount > 0 && (
                      <span className="text-[9px] font-bold text-kakao">
                        K{p.kakaoCount}
                      </span>
                    )}
                    {p.ridiCount > 0 && (
                      <span className="text-[9px] font-bold text-ridi">
                        R{p.ridiCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 출판사 상세 */}
        <div className="xl:col-span-3 space-y-5">
          {pubData ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "전체 작품 수", value: `${pubData.novels.length}편`, color: "" },
                  { label: "네이버", value: `${pubData.naverCount}편`, color: "text-naver" },
                  { label: "카카오", value: `${pubData.kakaoCount}편`, color: "text-kakao" },
                  { label: "리디", value: `${pubData.ridiCount}편`, color: "text-ridi" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="kpi-card">
                    <div className="text-xs text-muted-foreground mb-1">{label}</div>
                    <div
                      className={cn(
                        "font-mono text-xl md:text-2xl font-bold",
                        color || "text-foreground",
                      )}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    label: "총 조회수/평가수",
                    value: toKoreanUnit(pubData.totalViews),
                    color: "text-emerald-500",
                  },
                  {
                    label: "평균 순위",
                    value: pubData.avgRank > 0 ? `#${pubData.avgRank.toFixed(1)}위` : "-",
                    color: "text-amber-500",
                  },
                  {
                    label: "신작 수",
                    value: `${pubData.newCount}편`,
                    color: "text-primary",
                  },
                  {
                    label: "급상승작 수",
                    value: `${pubData.trendHits}편`,
                    color: "text-violet-500",
                  },
                ].map(({ label, value, color }) => (
                  <div key={label} className="kpi-card">
                    <div className="text-xs text-muted-foreground mb-1">{label}</div>
                    <div className={cn("font-mono text-lg md:text-xl font-bold", color)}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="surface-card overflow-hidden p-0">
                <div className="px-4 md:px-5 py-4 border-b border-border">
                  <h2 className="text-sm font-bold">{pubData.name} 플랫폼 분포</h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[640px]">
                    <thead>
                      <tr className="border-b border-border">
                        {["플랫폼", "작품 수", "점유율", "평균 순위", "총 조회수/평가수"].map(
                          (h) => (
                            <th
                              key={h}
                              className="py-3 px-4 md:px-5 text-left text-muted-foreground font-medium"
                            >
                              {h}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          name: "네이버",
                          count: pubData.naverCount,
                          color: "text-naver",
                          platform: "naver" as const,
                        },
                        {
                          name: "카카오",
                          count: pubData.kakaoCount,
                          color: "text-kakao",
                          platform: "kakao" as const,
                        },
                        {
                          name: "리디",
                          count: pubData.ridiCount,
                          color: "text-ridi",
                          platform: "ridi" as const,
                        },
                      ].map((row) => {
                        const platformNovels = pubData.novels.filter(
                          (n) => n.platform === row.platform,
                        );
                        const platformViews = platformNovels.reduce(
                          (s, n) => s + (n.todayViews || 0),
                          0,
                        );
                        const platformRanks = platformNovels
                          .map((n) => n.todayRank)
                          .filter((r): r is number => r != null && r > 0);

                        const platformAvgRank =
                          platformRanks.length > 0
                            ? (
                                platformRanks.reduce((a, b) => a + b, 0) /
                                platformRanks.length
                              ).toFixed(1)
                            : "-";

                        return (
                          <tr
                            key={row.name}
                            className="border-b border-border hover:bg-surface-elevated"
                          >
                            <td className={cn("py-3 px-4 md:px-5 font-semibold", row.color)}>
                              {row.name}
                            </td>
                            <td className="py-3 px-4 md:px-5 font-mono font-bold">
                              {row.count}
                            </td>
                            <td className="py-3 px-4 md:px-5">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-surface-elevated rounded-full max-w-24">
                                  <div
                                    className="h-full rounded-full bg-primary"
                                    style={{
                                      width: `${
                                        pubData.novels.length > 0
                                          ? Math.round((row.count / pubData.novels.length) * 100)
                                          : 0
                                      }%`,
                                    }}
                                  />
                                </div>
                                <span className="font-mono text-xs">
                                  {pubData.novels.length > 0
                                    ? Math.round((row.count / pubData.novels.length) * 100)
                                    : 0}
                                  %
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 md:px-5 font-mono text-muted-foreground">
                              {platformAvgRank !== "-" ? `#${platformAvgRank}위` : "-"}
                            </td>
                            <td className="py-3 px-4 md:px-5 font-mono text-emerald-500">
                              {platformViews > 0 ? toKoreanUnit(platformViews) : "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {pubData.novels.length > 0 && (
                <div className="surface-card">
                  <h2 className="text-sm font-bold mb-3">장르 분포</h2>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(
                      pubData.novels.reduce<Record<string, number>>((acc, n) => {
                        acc[n.genre] = (acc[n.genre] || 0) + 1;
                        return acc;
                      }, {}),
                    )
                      .sort((a, b) => b[1] - a[1])
                      .map(([genre, count]) => (
                        <span
                          key={genre}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-elevated border border-border whitespace-nowrap"
                        >
                          <span className="text-primary">{genre}</span>
                          <span className="font-mono text-muted-foreground">{count}</span>
                        </span>
                      ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-sm font-bold mb-3">
                  {pubData.name} 차트인 작품
                  <span className="font-mono text-xs text-muted-foreground ml-2">
                    {pubNovels.length}편
                  </span>
                </h2>

                {pubNovels.length > 0 ? (
                  <div className="space-y-2">
                    {pubNovels.map((n, i) => (
                      <RankingCard
                        key={n.id}
                        novel={n}
                        rank={i + 1}
                        onClick={setSelectedNovel}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="surface-card text-center py-10 text-muted-foreground text-sm">
                    현재 랭킹 내 {pubData.name} 작품이 없습니다
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="surface-card text-center py-10 text-muted-foreground text-sm">
              출판사를 선택해주세요
            </div>
          )}
        </div>
      </div>

      <NovelDetailDrawer
        novel={selectedNovel}
        onClose={() => setSelectedNovel(null)}
        latestDate={latestDate}
        allNovels={novels}
        onSelectNovel={setSelectedNovel}
      />
    </div>
  );
}
