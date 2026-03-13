import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { RankingCard } from "@/components/shared/RankingCard";
import { NovelDetailDrawer } from "@/components/shared/NovelDetailDrawer";
import { publishers, novels, formatViews, type Novel } from "@/data/mockData";

export default function PublishersPage() {
  const [selectedPub, setSelectedPub] = useState(publishers[0].name);
  const [search, setSearch] = useState("");
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);

  const pub = publishers.find(p => p.name === selectedPub) ?? publishers[0];
  const pubNovels = novels.filter(n => n.publisher === selectedPub);
  const filteredPubs = publishers.filter(p => p.name.includes(search));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-black tracking-tight">출판사</h1>
        <p className="text-xs text-muted-foreground mt-0.5">출판사별 성과 및 대표작 분석</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Publisher list */}
        <div className="surface-card space-y-3">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="출판사 검색…"
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-surface-elevated border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="space-y-1">
            {filteredPubs.map(p => (
              <button key={p.name} onClick={() => setSelectedPub(p.name)}
                className={cn("w-full text-left px-3 py-2.5 rounded-lg transition-colors",
                  selectedPub === p.name ? "bg-primary/10 text-primary" : "hover:bg-surface-elevated text-muted-foreground hover:text-foreground"
                )}>
                <div className="text-sm font-semibold">{p.name}</div>
                <div className="font-mono text-xs text-muted-foreground mt-0.5">{p.workCount}편</div>
              </button>
            ))}
          </div>
        </div>

        {/* Publisher details */}
        <div className="xl:col-span-3 space-y-5">
          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "전체 작품 수", value: pub.workCount + "편" },
              { label: "네이버",        value: pub.naverCount + "편", color: "text-naver" },
              { label: "카카오",        value: pub.kakaoCount + "편", color: "text-kakao" },
              { label: "리디",          value: pub.ridiCount + "편", color: "text-ridi" },
            ].map(({ label, value, color }) => (
              <div key={label} className="kpi-card">
                <div className="text-xs text-muted-foreground mb-1">{label}</div>
                <div className={cn("font-mono text-2xl font-bold", color ?? "text-foreground")}>{value}</div>
              </div>
            ))}
          </div>

          {/* Platform × metric matrix */}
          <div className="surface-card overflow-hidden p-0">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-bold">{pub.name} 플랫폼 × 지표 매트릭스</h2>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-3 px-5 text-left text-muted-foreground font-medium">플랫폼</th>
                  <th className="py-3 px-5 text-left text-muted-foreground font-medium">작품 수</th>
                  <th className="py-3 px-5 text-left text-muted-foreground font-medium">점유율</th>
                  <th className="py-3 px-5 text-left text-muted-foreground font-medium">평균 순위</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "네이버", count: pub.naverCount, color: "text-naver" },
                  { name: "카카오", count: pub.kakaoCount, color: "text-kakao" },
                  { name: "리디",   count: pub.ridiCount,  color: "text-ridi" },
                ].map(row => (
                  <tr key={row.name} className="border-b border-border hover:bg-surface-elevated">
                    <td className={cn("py-3 px-5 font-semibold", row.color)}>{row.name}</td>
                    <td className="py-3 px-5 font-mono font-bold">{row.count}</td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-surface-elevated rounded-full max-w-24">
                          <div className="h-full rounded-full bg-primary"
                               style={{ width: `${Math.round(row.count / pub.workCount * 100)}%` }} />
                        </div>
                        <span className="font-mono text-xs">{Math.round(row.count / pub.workCount * 100)}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-5 font-mono text-muted-foreground">{pub.avgRank.toFixed(1)}위</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top works */}
          <div>
            <h2 className="text-sm font-bold mb-3">{pub.name} 인기작</h2>
            {pubNovels.length > 0 ? (
              <div className="space-y-2">
                {pubNovels.map((n, i) => (
                  <RankingCard key={n.id} novel={n} rank={n.todayRank} onClick={setSelectedNovel} />
                ))}
              </div>
            ) : (
              <div className="surface-card text-center py-10 text-muted-foreground text-sm">
                현재 랭킹 내 {pub.name} 작품이 없습니다
              </div>
            )}
          </div>
        </div>
      </div>

      <NovelDetailDrawer novel={selectedNovel} onClose={() => setSelectedNovel(null)} />
    </div>
  );
}
