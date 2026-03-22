import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, Star, MessageCircle, BookOpen, Calendar, Trophy, Zap, ArrowRightLeft, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import { NovelCover } from "@/components/shared/NovelCover";
import { RankChange } from "@/components/shared/RankChange";
import { formatViews, type Novel } from "@/data/mockData";
import { computeNovelStats } from "@/lib/novelStats";

interface Props {
  novel: Novel | null;
  onClose: () => void;
}

export function NovelDetailDrawer({ novel, onClose }: Props) {
  const stats = useMemo(() => (novel ? computeNovelStats(novel) : null), [novel]);

  // 차트 데이터 가공 (자연스러운 곡선을 위해 정렬 및 필터링)
  const { rankData, viewsData } = useMemo(() => {
    if (!novel) return { rankData: [], viewsData: [] };
    
    // 데이터가 끊기지 않도록 날짜순 정렬
    const sortedRanks = [...(novel.rankHistory || [])]
      .filter(h => h.rank !== null)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
    const sortedViews = [...(novel.viewsHistory || [])]
      .filter(h => h.views !== null)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { rankData: sortedRanks, viewsData: sortedViews };
  }, [novel]);

  return (
    <AnimatePresence>
      {novel && stats && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={onClose} />
          
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 overflow-y-auto border-l border-white/10 shadow-2xl bg-[#0f0f12] text-slate-200"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-white/5 bg-[#0f0f12]/90 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <PlatformBadge platform={novel.platform} size="md" />
                <span className="text-sm font-bold text-slate-400 tracking-tight">작품 상세 분석</span>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-7">
              {/* Cover & Title Section */}
              <div className="flex gap-5">
                <NovelCover novel={novel} size="lg" className="shadow-2xl shrink-0 ring-1 ring-white/10 rounded-lg" />
                <div className="flex-1 min-w-0 py-1">
                  {novel.isPromotion && (
                    <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm mb-2 inline-flex items-center gap-1">
                      <Zap size={10} fill="currentColor" /> PROMOTION
                    </span>
                  )}
                  <h2 className="font-bold text-xl leading-tight text-white mb-2 line-clamp-2">{novel.title}</h2>
                  <p className="text-sm text-slate-400 font-medium">{novel.author} <span className="text-slate-600 mx-1">|</span> <span className="text-primary">{novel.genre}</span></p>
                  <div className="flex items-center gap-2 mt-4">
                    <RankChange novel={novel} />
                    <span className="font-mono text-lg font-black text-white italic">#{novel.todayRank}</span>
                  </div>
                </div>
              </div>

              {/* 6개 핵심 지표 그리드 */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "오늘 조회/평가", value: formatViews(novel.platform, novel.todayViews), icon: TrendingUp, color: "text-emerald-400" },
                  { label: "평점", value: novel.rating.toFixed(1), icon: Star, color: "text-yellow-400" },
                  { label: "누적 댓글", value: Number(novel.commentCount || 0).toLocaleString(), icon: MessageCircle, color: "text-sky-400" },
                  { label: "총 회차", value: `${novel.episodeCount}화`, icon: BookOpen, color: "text-indigo-400" },
                  { label: "연속 진입", value: `${stats.currentStreakDays}일`, icon: Calendar, color: "text-orange-400" },
                  { label: "데이터 기준일", value: novel.date, icon: Clock, color: "text-slate-400" },
                ].map((item) => (
                  <div key={item.label} className="bg-white/5 rounded-xl p-3.5 border border-white/5 shadow-inner">
                    <div className="flex items-center gap-2 mb-1.5 opacity-60">
                      <item.icon size={13} className={item.color} />
                      <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-tighter">{item.label}</span>
                    </div>
                    <div className="font-mono text-base font-bold text-slate-100">{item.value}</div>
                  </div>
                ))}
              </div>

              {/* 차트: 순위 추이 (자연스러운 곡선) */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 flex items-center gap-2 px-1">
                  <Trophy size={14} className="text-primary" /> 실시간 순위 변동 (최근 30일)
                </h3>
                <div className="bg-[#16161a] rounded-2xl p-4 border border-white/5 h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={rankData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
                      <XAxis dataKey="date" hide />
                      <YAxis reversed domain={[1, 'auto']} tick={{fontSize: 10, fill: '#4b5563'}} width={20} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#1e1e22', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }} />
                      <Line type="monotone" dataKey="rank" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 3, fill: 'hsl(var(--primary))', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 차트: 조회수 추이 (복구 완료) */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 flex items-center gap-2 px-1">
                  <TrendingUp size={14} className="text-emerald-500" /> {novel.platform === 'ridi' ? '평가수' : '조회수'} 증가 추이
                </h3>
                <div className="bg-[#16161a] rounded-2xl p-4 border border-white/5 h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={viewsData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
                      <XAxis dataKey="date" hide />
                      <YAxis tick={{fontSize: 10, fill: '#4b5563'}} width={35} axisLine={false} tickLine={false} 
                        tickFormatter={(v) => v >= 10000 ? `${(v/10000).toFixed(0)}만` : v} />
                      <Tooltip contentStyle={{ background: '#1e1e22', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }}
                        formatter={(v: any) => [formatViews(novel.platform, v), novel.platform === 'ridi' ? '평가수' : '조회수']} />
                      <Line type="monotone" dataKey="views" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 순위 기록 및 차트인 정보 (최고/최저 순위 통합) */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 flex items-center gap-2 px-1">
                  <ArrowRightLeft size={14} className="text-indigo-400" /> 순위 히스토리 상세
                </h3>
                <div className="bg-white/5 rounded-2xl p-5 border border-white/5 space-y-4">
                  <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-4">
                    <div>
                      <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider font-bold">Best Rank</p>
                      <p className="text-lg font-mono font-black text-amber-400 italic">#{stats.bestRank || novel.peakRank}위</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider font-bold">Worst Rank</p>
                      <p className="text-lg font-mono font-black text-slate-500 italic">#{stats.worstRank || '-'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-xs">최초 진입일</span>
                      <span className="text-slate-300 font-mono text-xs">{stats.firstAppearDate || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-xs">최종 차트아웃</span>
                      <span className="text-rose-400 font-mono text-xs">{stats.lastChartOutDate || '현재 차트인'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-xs">총 차트인 횟수</span>
                      <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {stats.chartInCount}회 재진입
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 시스템 정보 */}
              <p className="text-[10px] text-center text-slate-600 font-medium pb-4">
                Powered by Google Apps Script Analysis System
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
