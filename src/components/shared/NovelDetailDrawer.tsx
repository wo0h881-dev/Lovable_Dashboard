import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, TrendingUp, TrendingDown, Star, MessageCircle, 
  BookOpen, Calendar, Trophy, Zap, ArrowRightLeft, Clock 
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import { NovelCover } from "@/components/shared/NovelCover";
import { RankChange } from "@/components/shared/RankChange";
import { formatViews, type Novel } from "@/data/mockData";
import { computeNovelStats } from "@/lib/novelStats";
import { cn } from "@/lib/utils";

interface Props {
  novel: Novel | null;
  onClose: () => void;
}

export function NovelDetailDrawer({ novel, onClose }: Props) {
  const stats = useMemo(() => (novel ? computeNovelStats(novel) : null), [novel]);

  const { rankData, viewsData } = useMemo(() => {
    if (!novel) return { rankData: [], viewsData: [] };
    
    const sortedRanks = [...(novel.rankHistory || [])]
      .filter(h => h.rank !== null)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
    const sortedViews = [...(novel.viewsHistory || [])]
      .filter(h => h.views !== null)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { rankData: sortedRanks, viewsData: sortedViews };
  }, [novel]);

  // 재진입 여부 판단 (stats 기준)
  const isRealReEntry = stats && stats.chartInCount > 1 && novel?.rankDiff === "재진입";

  return (
    <AnimatePresence>
      {novel && stats && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 backdrop-blur-md" 
            onClick={onClose} 
          />
          
          <motion.div 
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 overflow-y-auto border-l border-white/10 shadow-2xl bg-[#0a0a0c] text-slate-200"
          >
            {/* 1. Sticky Header */}
            <div className="sticky top-0 z-20 flex items-center justify-between p-4 border-b border-white/5 bg-[#0a0a0c]/95 backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <PlatformBadge platform={novel.platform} size="sm" />
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Analysis Report</span>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* 2. Top Section: Thumbnail + Info (3단 구성) */}
              <div className="flex gap-5 items-start">
                <div className="shrink-0 w-[105px] h-[150px] relative group">
                  <NovelCover novel={novel} size="lg" className="shadow-2xl ring-1 ring-white/10 rounded-lg w-full h-full object-cover" />
                  {novel.isPromotion && (
                    <div className="absolute -top-2 -left-2 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg flex items-center gap-0.5">
                      <Zap size={10} fill="currentColor" /> PROMO
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-between min-h-[150px] py-1">
                  {/* (1) 제목 */}
                  <div>
                    <h2 className="font-bold text-[19px] leading-[1.3] text-white break-keep line-clamp-2 mb-1">
                      {novel.title}
                    </h2>
                  </div>

                  {/* (2) 작가 | 장르 | 평점 */}
                  <div className="space-y-1.5">
                    <p className="text-[13px] text-slate-400 font-medium">
                      {novel.author} <span className="text-slate-800 mx-1">|</span> 
                      <span className="text-primary font-semibold">{novel.genre}</span>
                    </p>
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[14px]">
                      <Star size={14} fill="currentColor" />
                      {novel.rating.toFixed(1)}
                      <span className="text-slate-600 font-normal text-[11px] ml-0.5">Rating</span>
                    </div>
                  </div>

                  {/* (3) 오늘 순위 (가장 하단) */}
                  <div className="mt-auto flex items-end justify-between">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-tighter">Current Rank</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white italic tracking-tighter leading-none">
                          #{novel.todayRank}
                        </span>
                        <RankChange novel={novel} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. 오늘의 성장 지표 (누적 조회수 증감률 강조) */}
              <div className="bg-gradient-to-br from-white/[0.05] to-transparent rounded-2xl p-5 border border-white/10 shadow-inner">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Zap size={14} className="text-primary" /> Today's Performance
                  </h3>
                  <div className="flex items-center gap-1 text-[10px] text-slate-600 font-mono">
                    <Clock size={10} /> {novel.date}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* 증감률 (변화율) */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">24h Growth Rate</span>
                    <div className={cn(
                      "text-2xl font-black flex items-center gap-1.5",
                      novel.viewsChangePct >= 0 ? "text-red-500" : "text-blue-500"
                    )}>
                      {novel.viewsChangePct >= 0 ? <TrendingUp size={22} strokeWidth={3} /> : <TrendingDown size={22} strokeWidth={3} />}
                      {Math.abs(novel.viewsChangePct).toFixed(2)}%
                    </div>
                  </div>

                  {/* 누적 조회수 */}
                  <div className="space-y-1 border-l border-white/5 pl-6">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Total Views</span>
                    <div className="text-2xl font-black text-slate-100 font-mono tracking-tighter">
                      {formatViews(novel.platform, novel.todayViews)}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. 보조 지표 그리드 (댓글, 회차, 스트릭) */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Comments", value: Number(novel.commentCount || 0).toLocaleString(), icon: MessageCircle, color: "text-sky-400" },
                  { label: "Episodes", value: `${novel.episodeCount}화`, icon: BookOpen, color: "text-indigo-400" },
                  { label: "Streak", value: `${stats.currentStreakDays}일`, icon: Calendar, color: "text-orange-400" },
                ].map((item) => (
                  <div key={item.label} className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
                    <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">{item.label}</p>
                    <p className="text-[13px] font-bold text-slate-200">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* 5. 차트 섹션 (순위 + 조회수) */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold text-slate-500 flex items-center gap-2 px-1 uppercase tracking-wider">
                    <Trophy size={14} className="text-amber-500" /> Rank Trend
                  </h4>
                  <div className="bg-[#121215] rounded-2xl p-4 border border-white/5 h-[160px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={rankData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                        <XAxis dataKey="date" hide />
                        <YAxis reversed domain={[1, 'auto']} tick={{fontSize: 9, fill: '#4b5563'}} width={15} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#1a1a1e', border: '1px solid #333', borderRadius: '8px', fontSize: '11px' }} />
                        <Line type="monotone" dataKey="rank" stroke="#6366f1" strokeWidth={3} dot={{ r: 2, fill: '#6366f1' }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold text-slate-500 flex items-center gap-2 px-1 uppercase tracking-wider">
                    <TrendingUp size={14} className="text-emerald-500" /> Accumulation Trend
                  </h4>
                  <div className="bg-[#121215] rounded-2xl p-4 border border-white/5 h-[140px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={viewsData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                        <XAxis dataKey="date" hide />
                        <YAxis tick={{fontSize: 9, fill: '#4b5563'}} width={35} axisLine={false} tickLine={false} 
                          tickFormatter={(v) => v >= 10000 ? `${(v/10000).toFixed(0)}만` : v} />
                        <Tooltip contentStyle={{ background: '#1a1a1e', border: '1px solid #333', borderRadius: '8px', fontSize: '11px' }} />
                        <Line type="monotone" dataKey="views" stroke="#10b981" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* 6. 상세 히스토리 정보 */}
              <div className="bg-white/[0.02] rounded-2xl p-5 border border-white/5 space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <ArrowRightLeft size={16} />
                    <span className="text-[11px] font-black uppercase tracking-widest">History Log</span>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    stats.lastChartOutDate === '현재 차트인' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                  )}>
                    {stats.lastChartOutDate === '현재 차트인' ? "ACTIVE" : "OUT"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-2">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[9px] text-slate-600 font-bold uppercase mb-1">Highest</p>
                      <p className="text-lg font-black text-amber-500 font-mono italic">#{stats.bestRank || novel.peakRank}위</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-600 font-bold uppercase mb-1">First Entry</p>
                      <p className="text-xs font-bold text-slate-300 font-mono">{stats.firstAppearDate || '-'}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[9px] text-slate-600 font-bold uppercase mb-1">Status</p>
                      <p className="text-xs font-bold text-slate-300">
                        {isRealReEntry ? "진짜 재진입" : novel.rankDiff === "NEW" ? "신규 진입" : "차트 유지"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-600 font-bold uppercase mb-1">Chart-Out</p>
                      <p className="text-xs font-bold text-rose-400 font-mono">{stats.lastChartOutDate || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-white/5 flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 font-bold">총 차트인 기록</span>
                  <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    {stats.chartInCount}회 기록
                  </span>
                </div>
              </div>

              <p className="text-[9px] text-center text-slate-700 font-bold tracking-widest pt-4 pb-2">
                ANALYSIS BY GOOGLE APPS SCRIPT ENGINE
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
