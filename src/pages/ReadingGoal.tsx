import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Search, X, Target, Calendar, Plus,
  CheckCircle2, Clock, BookMarked, PauseCircle, Trash2,
  Edit2, Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTodayCombined } from "@/hooks/useTodayCombined";
import { NovelCover } from "@/components/shared/NovelCover";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import { type Novel } from "@/data/mockData";

// ── 타입 ─────────────────────────────────────────────────
type ReadingStatus = "reading" | "want" | "done" | "paused";

interface ReadingGoal {
  id: string;
  novelId: string;
  title: string;
  author: string;
  publisher: string;
  platform: string;
  genre: string;
  thumbnailUrl?: string;
  coverGradient: string;
  coverEmoji: string;
  episodeCount: number;
  status: ReadingStatus;
  currentEpisode: number;
  targetDays?: number;
  dailyTarget?: number;
  targetDate?: string;
  addedAt: string;
  startedAt?: string;
  completedAt?: string;
}

const STORAGE_KEY = "webnovel_reading_goals";

function loadGoals(): ReadingGoal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveGoals(goals: ReadingGoal[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}

const STATUS_CONFIG: Record<ReadingStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  reading: { label: "읽는 중", icon: BookOpen, color: "text-primary", bg: "bg-primary/10" },
  want: { label: "읽고 싶어요", icon: BookMarked, color: "text-sky-500", bg: "bg-sky-500/10" },
  done: { label: "완독", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  paused: { label: "중단", icon: PauseCircle, color: "text-slate-500", bg: "bg-slate-500/10" },
};

function calcStats(goal: ReadingGoal) {
  const remaining = Math.max(0, goal.episodeCount - goal.currentEpisode);
  const progress = goal.episodeCount > 0 ? Math.min(100, Math.round((goal.currentEpisode / goal.episodeCount) * 100)) : 0;
  let daysNeeded: number | null = null;
  let dailyNeeded: number | null = null;

  if (goal.targetDays && goal.targetDays > 0) {
    dailyNeeded = Math.ceil(remaining / goal.targetDays);
    daysNeeded = goal.targetDays;
  } else if (goal.dailyTarget && goal.dailyTarget > 0) {
    daysNeeded = Math.ceil(remaining / goal.dailyTarget);
    dailyNeeded = goal.dailyTarget;
  }
  return { remaining, progress, daysNeeded, dailyNeeded };
}

// ── 목표 설정 모달 ───────────────────────────────────────
function GoalModal({ novel, existingGoal, onSave, onClose }: { novel?: Novel; existingGoal?: ReadingGoal; onSave: (goal: ReadingGoal) => void; onClose: () => void; }) {
  const base = existingGoal;
  const [status, setStatus] = useState<ReadingStatus>(base?.status ?? "want");
  const [currentEpisode, setCurrentEpisode] = useState<number | "">(base?.currentEpisode ?? 0);
  const [goalMode, setGoalMode] = useState<"days" | "daily" | "date">(base?.targetDate ? "date" : base?.dailyTarget ? "daily" : "days");
  const [targetDays, setTargetDays] = useState<number | "">(base?.targetDays ?? 30);
  const [dailyTarget, setDailyTarget] = useState<number | "">(base?.dailyTarget ?? 5);
  const [targetDate, setTargetDate] = useState(base?.targetDate ?? "");

  const ep = novel?.episodeCount ?? base?.episodeCount ?? 0;
  const title = novel?.title ?? base?.title ?? "";

  const stats = useMemo(() => {
    const cur = currentEpisode === "" ? 0 : currentEpisode;
    const remaining = Math.max(0, ep - cur);
    if (goalMode === "days" && typeof targetDays === "number" && targetDays > 0)
      return { daily: Math.ceil(remaining / targetDays), days: targetDays };
    if (goalMode === "daily" && typeof dailyTarget === "number" && dailyTarget > 0)
      return { daily: dailyTarget, days: Math.ceil(remaining / dailyTarget) };
    return null;
  }, [goalMode, targetDays, dailyTarget, currentEpisode, ep]);

  const handleSave = () => {
    const now = new Date().toISOString().slice(0, 10);
    const finalCurrent = currentEpisode === "" ? 0 : currentEpisode;
    const goal: ReadingGoal = {
      id: base?.id ?? `goal_${Date.now()}`,
      novelId: novel?.id ?? base?.novelId ?? "",
      title,
      author: novel?.author ?? base?.author ?? "",
      publisher: novel?.publisher ?? base?.publisher ?? "",
      platform: novel?.platform ?? base?.platform ?? "",
      genre: novel?.genre ?? base?.genre ?? "",
      thumbnailUrl: novel?.thumbnailUrl ?? base?.thumbnailUrl,
      coverGradient: novel?.coverGradient ?? base?.coverGradient ?? "from-slate-800 to-gray-600",
      coverEmoji: novel?.coverEmoji ?? base?.coverEmoji ?? "📖",
      episodeCount: ep,
      status,
      currentEpisode: finalCurrent,
      targetDays: goalMode === "days" && targetDays !== "" ? targetDays : undefined,
      dailyTarget: goalMode === "daily" && dailyTarget !== "" ? dailyTarget : undefined,
      targetDate: goalMode === "date" ? targetDate : undefined,
      addedAt: base?.addedAt ?? now,
      startedAt: status === "reading" ? (base?.startedAt ?? now) : base?.startedAt,
      completedAt: (status === "done" || finalCurrent >= ep) ? (base?.completedAt ?? now) : base?.completedAt,
    };
    onSave(goal);
    onClose();
  };

  const inputClass = "w-20 px-2.5 py-1.5 text-xs rounded-lg bg-surface-elevated border border-border text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-foreground">{base ? "목표 수정" : "독서 목표 추가"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-elevated text-muted-foreground"><X size={16} /></button>
        </div>

        <div className="flex items-center gap-3 mb-5 p-3 bg-surface-elevated rounded-xl border border-border">
          {novel ? <NovelCover novel={novel} size="sm" /> : <div className={`w-10 h-12 rounded-lg bg-gradient-to-br ${base?.coverGradient} flex items-center justify-center text-lg`}>{base?.coverEmoji}</div>}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground line-clamp-1">{title}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">총 {ep}화</p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-[11px] font-semibold text-muted-foreground mb-2 uppercase tracking-wide">상태</p>
          <div className="grid grid-cols-4 gap-1.5">
            {(Object.entries(STATUS_CONFIG) as [ReadingStatus, typeof STATUS_CONFIG[ReadingStatus]][]).map(([key, cfg]) => (
              <button key={key} onClick={() => setStatus(key)} className={cn("flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-[10px] font-semibold border transition-colors", status === key ? `${cfg.bg} ${cfg.color} border-current/30` : "border-border text-muted-foreground hover:bg-surface-elevated")}>
                <cfg.icon size={13} />{cfg.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-[11px] font-semibold text-muted-foreground mb-2 uppercase tracking-wide">현재 진도 (화수 입력)</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={currentEpisode}
              onChange={e => {
                const val = e.target.value;
                setCurrentEpisode(val === "" ? "" : Math.min(ep, Number(val)));
              }}
              className={inputClass}
            />
            <span className="text-xs text-muted-foreground">/ {ep}화</span>
          </div>
        </div>

        <div className="mb-5">
          <p className="text-[11px] font-semibold text-muted-foreground mb-2 uppercase tracking-wide">목표 설정</p>
          <div className="flex gap-1.5 mb-3">
            {[{ key: "days", label: "기간 입력" }, { key: "daily", label: "하루 편수" }].map(({ key, label }) => (
              <button key={key} onClick={() => setGoalMode(key as any)} className={cn("flex-1 py-1.5 text-[11px] font-semibold rounded-lg border transition-colors", goalMode === key ? "bg-primary/15 text-primary border-primary/30" : "border-border text-muted-foreground hover:bg-surface-elevated")}>{label}</button>
            ))}
          </div>
          {goalMode === "days" && (
            <div className="flex items-center gap-2">
              <input type="number" value={targetDays} onChange={e => setTargetDays(e.target.value === "" ? "" : Number(e.target.value))} className={inputClass} />
              <span className="text-xs text-muted-foreground">일 안에 완독</span>
            </div>
          )}
          {goalMode === "daily" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">하루</span>
              <input type="number" value={dailyTarget} onChange={e => setDailyTarget(e.target.value === "" ? "" : Number(e.target.value))} className={inputClass} />
              <span className="text-xs text-muted-foreground">편씩 읽기</span>
            </div>
          )}
        </div>

        {stats && (
          <div className="mb-5 p-3 bg-primary/5 border border-primary/20 rounded-xl flex justify-around text-center">
            <div><p className="text-[10px] text-muted-foreground">하루 목표</p><p className="font-mono text-sm font-black text-primary">{stats.daily}편</p></div>
            <div><p className="text-[10px] text-muted-foreground">완독까지</p><p className="font-mono text-sm font-black text-primary">{stats.days}일</p></div>
          </div>
        )}

        <button onClick={handleSave} className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:opacity-90 transition-opacity">
          {base ? "수정 완료" : "책장에 추가"}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── 책장 카드 ─────────────────────────────────────────────
function GoalCard({ goal, onEdit, onDelete, onUpdateEpisode }: { goal: ReadingGoal; onEdit: () => void; onDelete: () => void; onUpdateEpisode: (ep: number) => void; }) {
  const cfg = STATUS_CONFIG[goal.status];
  const { remaining, progress, daysNeeded, dailyNeeded } = calcStats(goal);
  const [showEpEdit, setShowEpEdit] = useState(false);
  const [epInput, setEpInput] = useState<number | "">(goal.currentEpisode);

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="surface-card border border-border">
      <div className="flex gap-3">
        <div className="shrink-0">
          {goal.thumbnailUrl ? <img src={goal.thumbnailUrl} className="w-14 h-18 rounded-lg object-cover shadow-md" style={{ height: 72 }} /> : <div className={`w-14 h-[72px] rounded-lg bg-gradient-to-br ${goal.coverGradient} flex items-center justify-center text-2xl shadow-md`}>{goal.coverEmoji}</div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0"><h3 className="text-sm font-bold text-foreground line-clamp-1">{goal.title}</h3><p className="text-[10px] text-muted-foreground">{goal.author}</p></div>
            <div className="flex items-center gap-1">
              <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5", cfg.bg, cfg.color)}><cfg.icon size={9} />{cfg.label}</span>
              <button onClick={onEdit} className="p-1 rounded hover:bg-surface-elevated text-muted-foreground"><Edit2 size={12} /></button>
              <button onClick={onDelete} className="p-1 rounded hover:bg-surface-elevated text-rose-400"><Trash2 size={12} /></button>
            </div>
          </div>
          <div className="mt-2">
            <div className="flex justify-between mb-1"><span className="text-[10px] text-muted-foreground">{goal.currentEpisode} / {goal.episodeCount}화</span><span className="text-[10px] font-bold text-primary">{progress}%</span></div>
            <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden"><motion.div className="h-full bg-primary" initial={{ width: 0 }} animate={{ width: `${progress}%` }} /></div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            {showEpEdit ? (
              <>
                <input type="number" value={epInput} onChange={e => setEpInput(e.target.value === "" ? "" : Number(e.target.value))} className="w-16 px-1.5 py-0.5 text-xs rounded bg-surface-elevated border border-border [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" autoFocus />
                <button onClick={() => { onUpdateEpisode(Number(epInput)); setShowEpEdit(false); }} className="text-[10px] font-bold text-primary px-2 py-0.5 rounded bg-primary/10">저장</button>
                <button onClick={() => setShowEpEdit(false)} className="text-[10px] text-muted-foreground">취소</button>
              </>
            ) : goal.status === "reading" && (
              <button onClick={() => { setEpInput(goal.currentEpisode); setShowEpEdit(true); }} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"><Edit2 size={9} />진도 업데이트</button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── 메인 페이지 ──────────────────────────────────────────
export default function ReadingGoalsPage() {
  const { data: sourceData, latestDate } = useTodayCombined();
  const novels: Novel[] = sourceData ?? [];
  const [goals, setGoals] = useState<ReadingGoal[]>(loadGoals);
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<Novel[]>([]);
  const [modalNovel, setModalNovel] = useState<Novel | null>(null);
  const [editGoal, setEditGoal] = useState<ReadingGoal | null>(null);
  const [filterStatus, setFilterStatus] = useState<ReadingStatus | "all">("all");

  useEffect(() => { saveGoals(goals); }, [goals]);

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    setSearchResults(novels.filter(n => n.title.includes(search) || n.author.includes(search)).slice(0, 6));
  }, [search, novels]);

  const addOrUpdateGoal = (goal: ReadingGoal) => {
    setGoals(prev => {
      const exists = prev.findIndex(g => g.id === goal.id);
      if (exists >= 0) { const next = [...prev]; next[exists] = goal; return next; }
      return [goal, ...prev];
    });
  };

  const deleteGoal = (id: string) => setGoals(prev => prev.filter(g => g.id !== id));
  const updateEpisode = (id: string, ep: number) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, currentEpisode: ep, status: ep >= g.episodeCount ? "done" : g.status } : g));
  };

  const filteredGoals = goals.filter(g => filterStatus === "all" || g.status === filterStatus);

  // 1️⃣ [복구] 통계 요약 데이터
  const statsSummary = useMemo(() => ({
    total: goals.length,
    reading: goals.filter(g => g.status === "reading").length,
    done: goals.filter(g => g.status === "done").length,
    want: goals.filter(g => g.status === "want").length,
    paused: goals.filter(g => g.status === "paused").length,
  }), [goals]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-black tracking-tight">독서 목표</h1>
        <p className="text-xs text-muted-foreground mt-0.5">{latestDate} 기준 · 나만의 책장</p>
      </div>

      {/* 2️⃣ [복구] 상단 KPI 통계 요약 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "전체", value: statsSummary.total, color: "text-foreground", icon: BookOpen },
          { label: "읽는 중", value: statsSummary.reading, color: "text-primary", icon: BookOpen },
          { label: "완독", value: statsSummary.done, color: "text-emerald-500", icon: CheckCircle2 },
          { label: "읽고 싶어요", value: statsSummary.want, color: "text-sky-500", icon: BookMarked },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="kpi-card flex items-center gap-3">
            <Icon size={18} className={color} />
            <div>
              <p className="text-[10px] text-muted-foreground">{label}</p>
              <p className={cn("font-mono text-xl font-black", color)}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="surface-card space-y-3">
        <h2 className="text-sm font-bold flex items-center gap-2"><Plus size={14} className="text-primary" />작품 검색 & 추가</h2>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            placeholder="제목 또는 작가명으로 검색…"
            className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-surface-elevated border border-border focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <AnimatePresence>
          {(search || isSearchFocused) && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="border border-border rounded-xl overflow-hidden divide-y divide-border bg-surface-elevated shadow-xl">
              {search ? (
                searchResults.map(n => (
                  <div key={n.id} onClick={() => { setModalNovel(n); setSearch(""); }} className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface transition-colors cursor-pointer">
                    <NovelCover novel={n} size="sm" />
                    <div className="flex-1 min-w-0"><p className="text-xs font-semibold line-clamp-1">{n.title}</p><p className="text-[10px] text-muted-foreground">{n.author}</p></div>
                  </div>
                ))
              ) : (
                <>
                  <div className="px-3 py-2 bg-surface/50 text-[10px] font-bold text-primary flex items-center gap-1"><Flame size={10}/> 실시간 종합 인기 순위</div>
                  {novels.slice(0, 5).map((n, idx) => (
                    <div key={n.id} onClick={() => setModalNovel(n)} className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface transition-colors cursor-pointer">
                      <span className="text-xs font-black text-primary/50 w-4">{idx + 1}</span>
                      <NovelCover novel={n} size="sm" />
                      <div className="flex-1 min-w-0"><p className="text-xs font-semibold line-clamp-1">{n.title}</p><p className="text-[10px] text-muted-foreground">{n.author}</p></div>
                    </div>
                  ))}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3️⃣ [복구] 상세 필터 탭 (전체, 읽는 중, 읽고 싶어요, 완독, 중단) */}
      <div className="flex items-center gap-2 flex-wrap">
        {([
          { key: "all", label: "전체", count: statsSummary.total },
          { key: "reading", label: "읽는 중", count: statsSummary.reading },
          { key: "want", label: "읽고 싶어요", count: statsSummary.want },
          { key: "done", label: "완독", count: statsSummary.done },
          { key: "paused", label: "중단", count: statsSummary.paused },
        ] as const).map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilterStatus(key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
              filterStatus === key
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-surface border border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
            <span className={cn("text-[10px] font-mono px-1 rounded", filterStatus === key ? "bg-white/20" : "bg-surface-elevated")}>{count}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredGoals.map(goal => (
            <GoalCard key={goal.id} goal={goal} onEdit={() => setEditGoal(goal)} onDelete={() => deleteGoal(goal.id)} onUpdateEpisode={ep => updateEpisode(goal.id, ep)} />
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {modalNovel && <GoalModal novel={modalNovel} onSave={addOrUpdateGoal} onClose={() => setModalNovel(null)} />}
        {editGoal && <GoalModal existingGoal={editGoal} onSave={addOrUpdateGoal} onClose={() => setEditGoal(null)} />}
      </AnimatePresence>
    </div>
  );
}
