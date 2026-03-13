import { useState } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, Star, MessageCircle, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { RankingCard } from "@/components/shared/RankingCard";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import { RankChange } from "@/components/shared/RankChange";
import { NovelCover } from "@/components/shared/NovelCover";
import { NovelDetailDrawer } from "@/components/shared/NovelDetailDrawer";
import { novels, formatViews, type Novel, type Platform, type Genre } from "@/data/mockData";

type PlatformTab = "all" | Platform;
const platformTabs: { key: PlatformTab; label: string }[] = [
  { key: "all",   label: "전체" },
  { key: "naver", label: "네이버" },
  { key: "kakao", label: "카카오" },
  { key: "ridi",  label: "리디" },
];
const genres: (Genre | "전체")[] = ["전체", "로판", "판타지", "로맨스", "현판", "BL", "무협", "기타"];

export default function RankingsPage() {
  const [platform, setPlatform] = useState<PlatformTab>("all");
  const [genre, setGenre] = useState<Genre | "전체">("전체");
  const [showNew, setShowNew]         = useState(false);
  const [showReEntry, setShowReEntry] = useState(false);
  const [search, setSearch]           = useState("");
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);
  const [sortKey, setSortKey]         = useState<"rank" | "views" | "rating">("rank");

  const filtered = novels
    .filter(n => platform === "all" || n.platform === platform)
    .filter(n => genre === "전체" || n.genre === genre)
    .filter(n => !showNew || n.isNew)
    .filter(n => !showReEntry || n.isReEntry)
    .filter(n => !search || n.title.includes(search) || n.author.includes(search))
    .sort((a, b) => {
      if (sortKey === "views")  return b.todayViews - a.todayViews;
      if (sortKey === "rating") return b.rating - a.rating;
      return a.todayRank - b.todayRank;
    });

  const topCards = filtered.slice(0, 4);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-black tracking-tight">순위표</h1>
        <p className="text-xs text-muted-foreground mt-0.5">플랫폼 · 장르별 상세 랭킹</p>
      </div>

      {/* Filters */}
      <div className="surface-card space-y-4">
        {/* Platform tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {platformTabs.map(t => (
            <button key={t.key} onClick={() => setPlatform(t.key)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                platform === t.key
                  ? t.key === "naver" ? "bg-naver text-black"
                    : t.key === "kakao" ? "bg-kakao text-black"
                    : t.key === "ridi"  ? "bg-ridi text-white"
                    : "bg-primary text-primary-foreground"
                  : "bg-surface-elevated text-muted-foreground hover:text-foreground"
              )}>
              {t.label}
            </button>
          ))}
          <div className="h-5 w-px bg-border mx-1" />
          {genres.map(g => (
            <button key={g} onClick={() => setGenre(g)}
              className={cn("px-2.5 py-1 rounded-md text-xs transition-colors",
                genre === g ? "bg-primary/15 text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
              )}>
              {g}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="제목 / 작가 검색…"
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-surface-elevated border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          {/* Toggle chips */}
          {[
            { label: "NEW만 보기", value: showNew,     setter: setShowNew },
            { label: "재진입만 보기", value: showReEntry, setter: setShowReEntry },
          ].map(({ label, value, setter }) => (
            <button key={label} onClick={() => setter(!value)}
              className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
              )}>
              {label}
            </button>
          ))}
          {/* Sort */}
          <div className="flex items-center gap-1 ml-auto">
            <SlidersHorizontal size={13} className="text-muted-foreground" />
            {[
              { key: "rank" as const, label: "순위" },
              { key: "views" as const, label: "조회수" },
              { key: "rating" as const, label: "평점" },
            ].map(s => (
              <button key={s.key} onClick={() => setSortKey(s.key)}
                className={cn("px-2.5 py-1 rounded text-xs",
                  sortKey === s.key ? "bg-primary/15 text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                )}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top 4 cards */}
      {topCards.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-3 font-medium">주요 작품</p>
          <div className="space-y-2">
            {topCards.map((n, i) => (
              <RankingCard key={n.id} novel={n} rank={n.todayRank} onClick={setSelectedNovel} />
            ))}
          </div>
        </div>
      )}

      {/* Full Table */}
      <div className="surface-card overflow-hidden p-0">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-bold">전체 순위표</h2>
          <span className="font-mono text-xs text-muted-foreground">{filtered.length}개 작품</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {["플랫폼", "순위", "제목", "작가", "장르", "조회수/평가수", "전일 순위", "순위 변화", "증감률", "출판사", "평점", "댓글", "회차"].map(h => (
                  <th key={h} className="py-3 px-3 text-left text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((n, i) => (
                <motion.tr key={n.id} className="data-table-row" onClick={() => setSelectedNovel(n)}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                  <td className="py-2.5 px-3"><PlatformBadge platform={n.platform} /></td>
                  <td className="py-2.5 px-3 font-mono font-bold text-sm">{n.todayRank}</td>
                  <td className="py-2.5 px-3 max-w-[180px]">
                    <div className="flex items-center gap-2">
                      <NovelCover novel={n} size="sm" />
                      <span className="line-clamp-2 font-medium text-foreground">{n.title}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground">{n.author}</td>
                  <td className="py-2.5 px-3 text-primary/80 whitespace-nowrap">{n.genre}</td>
                  <td className="py-2.5 px-3 font-mono font-semibold whitespace-nowrap">{formatViews(n.platform, n.todayViews)}</td>
                  <td className="py-2.5 px-3 font-mono text-muted-foreground">{n.prevRank ?? "—"}</td>
                  <td className="py-2.5 px-3"><RankChange novel={n} /></td>
                  <td className={cn("py-2.5 px-3 font-mono font-semibold", n.viewsChangePct > 0 ? "text-up" : "text-down")}>
                    {n.viewsChangePct > 0 ? "+" : ""}{n.viewsChangePct.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">{n.publisher}</td>
                  <td className="py-2.5 px-3 font-mono flex items-center gap-0.5">
                    <Star size={10} className="text-yellow-400" />{n.rating}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-muted-foreground">{n.commentCount.toLocaleString("ko-KR")}</td>
                  <td className="py-2.5 px-3 font-mono text-muted-foreground">{n.episodeCount}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <NovelDetailDrawer novel={selectedNovel} onClose={() => setSelectedNovel(null)} />
    </div>
  );
}
