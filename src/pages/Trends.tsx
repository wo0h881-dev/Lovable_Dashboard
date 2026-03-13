import { useState } from "react";
import { Search, X } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ScatterChart, Scatter, ZAxis
} from "recharts";
import { cn } from "@/lib/utils";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import { NovelCover } from "@/components/shared/NovelCover";
import { novels, trendData, formatViews, type Novel } from "@/data/mockData";

const lineColors = ["hsl(var(--primary))", "hsl(var(--ridi))", "hsl(var(--kakao))"];

type ColorBy = "publisher" | "genre";

const bubbleColors: Record<string, string> = {
  "카카오엔터": "hsl(var(--kakao))", "문피아": "hsl(var(--naver))", "디앤씨미디어": "hsl(var(--ridi))",
  "조아라": "#c084fc", "로크미디어": "#f97316", "대원씨아이": "#22d3ee",
  "로판": "hsl(var(--ridi))", "판타지": "hsl(var(--naver))", "로맨스": "hsl(350,100%,60%)",
  "현판": "#f97316", "BL": "hsl(var(--kakao))", "무협": "#a3e635",
};

export default function TrendsPage() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Novel[]>([novels[0]]);
  const [colorBy, setColorBy] = useState<ColorBy>("publisher");

  const results = query
    ? novels.filter(n => n.title.includes(query) || n.author.includes(query)).slice(0, 6)
    : [];

  const addNovel = (n: Novel) => {
    if (selected.find(s => s.id === n.id)) return;
    if (selected.length >= 3) return;
    setSelected([...selected, n]);
    setQuery("");
  };
  const removeNovel = (id: string) => setSelected(selected.filter(s => s.id !== id));

  const bubbleData = novels.map(n => ({
    x: n.todayRank,
    y: n.platform === "ridi" ? n.todayViews * 500 : n.todayViews,
    z: Math.min(n.consecutiveDays * 2, 60),
    name: n.title,
    publisher: n.publisher,
    genre: n.genre,
    color: bubbleColors[colorBy === "publisher" ? n.publisher : n.genre] ?? "hsl(var(--muted-foreground))",
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-black tracking-tight">트렌드</h1>
        <p className="text-xs text-muted-foreground mt-0.5">작품별 순위/조회수 추이 및 포트폴리오 분석</p>
      </div>

      {/* Novel search & compare */}
      <div className="surface-card space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-sm font-bold flex-1">작품 트렌드 비교</h2>
          {selected.map((n, i) => (
            <div key={n.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium"
                 style={{ borderColor: lineColors[i], color: lineColors[i] }}>
              <span className="line-clamp-1 max-w-28">{n.title}</span>
              <button onClick={() => removeNovel(n.id)}><X size={12} /></button>
            </div>
          ))}
          {selected.length < 3 && (
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="작품 추가…"
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg bg-surface-elevated border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-48" />
              {results.length > 0 && (
                <div className="absolute top-full mt-1 left-0 w-64 bg-surface border border-border rounded-lg shadow-xl z-10 overflow-hidden">
                  {results.map(n => (
                    <button key={n.id} onClick={() => addNovel(n)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-elevated transition-colors text-left">
                      <NovelCover novel={n} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium line-clamp-1">{n.title}</div>
                        <div className="text-[10px] text-muted-foreground">{n.author} · <PlatformBadge platform={n.platform} /></div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rank chart */}
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium">일별 순위 추이</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} interval={4} />
              <YAxis reversed domain={[1, 20]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "Roboto Mono" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                formatter={(v: number) => [`#${v}위`, ""]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {selected.map((n, i) => (
                <Line key={n.id} type="monotone"
                  dataKey={i === 0 ? "novel1Rank" : "novel2Rank"}
                  name={n.title.slice(0, 12) + "…"}
                  stroke={lineColors[i]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Views chart */}
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium">일별 조회수/평가수 추이</p>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} interval={4} />
              <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "Roboto Mono" }}
                     tickFormatter={(v) => `${(v/10000).toFixed(0)}만`} />
              <Tooltip contentStyle={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
              {selected.map((n, i) => (
                <Line key={n.id} type="monotone"
                  dataKey={i === 0 ? "novel1Views" : "novel2Views"}
                  name={n.title.slice(0, 12) + "…"}
                  stroke={lineColors[i]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {selected.map((n, i) => (
          <div key={n.id} className="kpi-card border-l-2" style={{ borderLeftColor: lineColors[i] }}>
            <div className="flex items-center gap-2 mb-3">
              <NovelCover novel={n} size="sm" />
              <div className="min-w-0">
                <div className="text-xs font-semibold line-clamp-2">{n.title}</div>
                <PlatformBadge platform={n.platform} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-muted-foreground">최고 순위</span><div className="font-mono font-bold">#{n.peakRank}</div></div>
              <div><span className="text-muted-foreground">연속 진입</span><div className="font-mono font-bold">{n.consecutiveDays}일</div></div>
              <div><span className="text-muted-foreground">오늘 순위</span><div className="font-mono font-bold">#{n.todayRank}</div></div>
              <div><span className="text-muted-foreground">첫 등장</span><div className="font-mono font-bold">{n.firstAppeared}</div></div>
            </div>
          </div>
        ))}
      </div>

      {/* Portfolio bubble chart */}
      <div className="surface-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold">포트폴리오 버블 차트</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">색상 기준:</span>
            {(["publisher", "genre"] as ColorBy[]).map(k => (
              <button key={k} onClick={() => setColorBy(k)}
                className={cn("px-2.5 py-1 rounded text-xs",
                  colorBy === k ? "bg-primary/15 text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                )}>
                {k === "publisher" ? "출판사" : "장르"}
              </button>
            ))}
          </div>
        </div>
        <div className="text-xs text-muted-foreground mb-3">X축: 오늘 순위 · Y축: 조회수/평가수 · 크기: 랭킹 유지일</div>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" dataKey="x" name="순위" reversed domain={[1, 15]}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "Roboto Mono" }}
              label={{ value: "순위", position: "insideBottom", offset: -4, fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis type="number" dataKey="y" name="조회수"
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "Roboto Mono" }}
              tickFormatter={v => `${(v/10000).toFixed(0)}만`} />
            <ZAxis type="number" dataKey="z" range={[40, 400]} />
            <Tooltip cursor={false}
              contentStyle={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
              content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-surface border border-border rounded-lg p-3 text-xs">
                    <div className="font-semibold mb-1">{d.name}</div>
                    <div className="text-muted-foreground">순위: #{d.x}</div>
                    <div className="text-muted-foreground">{colorBy === "publisher" ? d.publisher : d.genre}</div>
                  </div>
                );
              }}
            />
            {bubbleData.map((d, i) => (
              <Scatter key={i} data={[d]} fill={d.color} fillOpacity={0.7} />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
