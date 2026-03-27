// src/pages/ReadingGoals.tsx
import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Search,
  X,
  Target,
  Plus,
  CheckCircle2,
  Clock,
  BookMarked,
  PauseCircle,
  Trash2,
  ChevronDown,
  Edit2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTodayCombined } from "@/hooks/useTodayCombined";
import { NovelCover } from "@/components/shared/NovelCover";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import { type Novel } from "@/data/mockData";
import {
  computeTrendScore,
  getPlatformMaxStats,
  type UnifiedNovel,
  attachRidiInnerRank,
} from "@/lib/rankingScore";

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
  } catch {
    return [];
  }
}

function saveGoals(goals: ReadingGoal[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}

const STATUS_CONFIG: Record<
  ReadingStatus,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  reading: {
    label: "읽는 중",
    icon: BookOpen,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  want: {
    label: "읽고 싶어요",
    icon: BookMarked,
    color: "text-sky-500",
    bg: "bg-sky-500/10",
  },
  done: {
    label: "완독",
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  paused: {
    label: "중단",
    icon: PauseCircle,
    color: "text-slate-500",
    bg: "bg-slate-500/10",
  },
};

function parseOptionalNumber(
  value: string,
  options?: { min?: number; max?: number }
): number | "" {
  if (value === "") return "";
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return "";

  let next = parsed;
  if (typeof options?.min === "number") next = Math.max(options.min, next);
  if (typeof options?.max === "number") next = Math.min(options.max, next);
  return next;
}

function numberOr(value: number | "", fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function calcStats(goal: ReadingGoal) {
  const remaining = Math.max(0, goal.episodeCount - goal.currentEpisode);
  const progress =
    goal.episodeCount > 0
      ? Math.min(100, Math.round((goal.currentEpisode / goal.episodeCount) * 100))
      : 0;

  let daysNeeded: number | null = null;
  let dailyNeeded: number | null = null;
  let daysLeft: number | null = null;

  if (goal.targetDays && goal.targetDays > 0) {
    dailyNeeded = Math.ceil(remaining / goal.targetDays);
    daysNeeded = goal.targetDays;
  } else if (goal.dailyTarget && goal.dailyTarget > 0) {
    daysNeeded = Math.ceil(remaining / goal.dailyTarget);
    dailyNeeded = goal.dailyTarget;
  } else if (goal.targetDate) {
    const today = new Date();
    const target = new Date(goal.targetDate);
    daysLeft = Math.max(
      0,
      Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    );
    dailyNeeded = daysLeft > 0 ? Math.ceil(remaining / daysLeft) : null;
    daysNeeded = daysLeft;
  }

  return { remaining, progress, daysNeeded, dailyNeeded, daysLeft };
}

function ModalCover({
  novel,
  goal,
}: {
  novel?: Novel;
  goal?: ReadingGoal;
}) {
  if (novel) {
    return <NovelCover novel={novel} size="sm" />;
  }

  if (goal?.thumbnailUrl) {
    return (
      <img
        src={goal.thumbnailUrl}
        alt={goal.title}
        className="w-10 h-12 rounded-lg object-cover shadow-sm"
      />
    );
  }

  return (
    <div
      className={`w-10 h-12 rounded-lg bg-gradient-to-br ${
        goal?.coverGradient ?? "from-slate-800 to-gray-600"
      } flex items-center justify-center text-lg`}
    >
      {goal?.coverEmoji ?? "📖"}
    </div>
  );
}

function StatusDropdown({
  status,
  onChange,
}: {
  status: ReadingStatus;
  onChange: (status: ReadingStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const cfg = STATUS_CONFIG[status];

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className={cn(
          "text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5",
          cfg.bg,
          cfg.color
        )}
      >
        <cfg.icon size={9} />
        {cfg.label}
        <ChevronDown size={10} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            className="absolute right-0 top-full mt-1 w-32 rounded-xl border border-border bg-surface shadow-xl z-20 overflow-hidden"
          >
            {(
              Object.entries(STATUS_CONFIG) as [
                ReadingStatus,
                (typeof STATUS_CONFIG)[ReadingStatus],
              ][]
            ).map(([key, item]) => (
              <button
                key={key}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(key);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors hover:bg-surface-elevated",
                  status === key ? item.color : "text-foreground"
                )}
              >
                <item.icon size={12} />
                <span>{item.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GoalModal({
  novel,
  existingGoal,
  onSave,
  onClose,
}: {
  novel?: Novel;
  existingGoal?: ReadingGoal;
  onSave: (goal: ReadingGoal) => void;
  onClose: () => void;
}) {
  const base = existingGoal;
  const [status, setStatus] = useState<ReadingStatus>(base?.status ?? "want");
  const [currentEpisode, setCurrentEpisode] = useState<number | "">(
    base?.currentEpisode ?? ""
  );
  const [goalMode, setGoalMode] = useState<"days" | "daily" | "date">(
    base?.targetDate ? "date" : base?.dailyTarget ? "daily" : "days"
  );
  const [targetDays, setTargetDays] = useState<number | "">(base?.targetDays ?? "");
  const [dailyTarget, setDailyTarget] = useState<number | "">(base?.dailyTarget ?? "");
  const [targetDate, setTargetDate] = useState(base?.targetDate ?? "");

  const ep = novel?.episodeCount ?? base?.episodeCount ?? 0;
  const title = novel?.title ?? base?.title ?? "";
  const currentEpisodeNumber = numberOr(currentEpisode, 0);

  const stats = useMemo(() => {
    const remaining = Math.max(0, ep - currentEpisodeNumber);

    if (goalMode === "days") {
      if (typeof targetDays === "number" && targetDays > 0) {
        return { daily: Math.ceil(remaining / targetDays), days: targetDays };
      }
      return { daily: null, days: null };
    }

    if (goalMode === "daily") {
      if (typeof dailyTarget === "number" && dailyTarget > 0) {
        return { daily: dailyTarget, days: Math.ceil(remaining / dailyTarget) };
      }
      return { daily: null, days: null };
    }

    if (goalMode === "date") {
      if (targetDate) {
        const d = Math.max(
          0,
          Math.ceil((new Date(targetDate).getTime() - Date.now()) / 86400000)
        );
        return { daily: d > 0 ? Math.ceil(remaining / d) : null, days: d };
      }
      return { daily: null, days: null };
    }

    return { daily: null, days: null };
  }, [goalMode, targetDays, dailyTarget, targetDate, currentEpisodeNumber, ep]);

  const handleSave = () => {
    const today = new Date().toISOString().slice(0, 10);
    const safeCurrent = Math.min(ep, Math.max(0, numberOr(currentEpisode, 0)));

    const goal: ReadingGoal = {
      id: base?.id ?? `goal_${Date.now()}`,
      novelId: novel?.id ?? base?.novelId ?? "",
      title: novel?.title ?? base?.title ?? "",
      author: novel?.author ?? base?.author ?? "",
      publisher: novel?.publisher ?? base?.publisher ?? "",
      platform: novel?.platform ?? base?.platform ?? "",
      genre: novel?.genre ?? base?.genre ?? "",
      thumbnailUrl: novel?.thumbnailUrl ?? base?.thumbnailUrl,
      coverGradient:
        novel?.coverGradient ?? base?.coverGradient ?? "from-slate-800 to-gray-600",
      coverEmoji: novel?.coverEmoji ?? base?.coverEmoji ?? "📖",
      episodeCount: ep,
      status,
      currentEpisode: safeCurrent,
      targetDays:
        goalMode === "days" && typeof targetDays === "number" && targetDays > 0
          ? targetDays
          : undefined,
      dailyTarget:
        goalMode === "daily" && typeof dailyTarget === "number" && dailyTarget > 0
          ? dailyTarget
          : undefined,
      targetDate: goalMode === "date" && targetDate ? targetDate : undefined,
      addedAt: base?.addedAt ?? today,
      startedAt: status === "reading" ? base?.startedAt ?? today : base?.startedAt,
      completedAt: status === "done" || safeCurrent >= ep ? base?.completedAt ?? today : undefined,
    };

    onSave(goal);
    onClose();
  };

  const statDailyText = stats.daily == null ? "-" : `${stats.daily}편`;
  const statDaysText = stats.days == null ? "-" : `${stats.days}일`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-foreground">
            {base ? "목표 수정" : "독서 목표 추가"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-elevated text-muted-foreground"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-5 p-3 bg-surface-elevated rounded-xl border border-border">
          <ModalCover novel={novel} goal={base} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground line-clamp-1">{title}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">총 {ep}화</p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-[11px] font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            상태
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {(
              Object.entries(STATUS_CONFIG) as [
                ReadingStatus,
                (typeof STATUS_CONFIG)[ReadingStatus],
              ][]
            ).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setStatus(key)}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-[10px] font-semibold border transition-colors",
                  status === key
                    ? `${cfg.bg} ${cfg.color} border-current/30`
                    : "border-border text-muted-foreground hover:bg-surface-elevated"
                )}
              >
                <cfg.icon size={13} />
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-[11px] font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            현재 진도
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={ep}
              value={currentEpisode}
              onChange={(e) =>
                setCurrentEpisode(parseOptionalNumber(e.target.value, { min: 0, max: ep }))
              }
              className="w-24 px-2.5 py-1.5 text-xs rounded-lg bg-surface-elevated border border-border text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-xs text-muted-foreground">/ {ep}화</span>
            <div className="flex-1 h-1.5 bg-surface-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{
                  width: `${ep > 0 ? (currentEpisodeNumber / ep) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="text-xs font-mono text-primary">
              {ep > 0 ? Math.round((currentEpisodeNumber / ep) * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="mb-5">
          <p className="text-[11px] font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            목표 설정
          </p>

          <div className="flex gap-1.5 mb-3">
            {[
              { key: "days", label: "기간 입력" },
              { key: "daily", label: "하루 편수" },
              { key: "date", label: "완독일" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setGoalMode(key as "days" | "daily" | "date")}
                className={cn(
                  "flex-1 py-1.5 text-[11px] font-semibold rounded-lg border transition-colors",
                  goalMode === key
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "border-border text-muted-foreground hover:bg-surface-elevated"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {goalMode === "days" && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={targetDays}
                onChange={(e) =>
                  setTargetDays(parseOptionalNumber(e.target.value, { min: 1 }))
                }
                className="w-24 px-2.5 py-1.5 text-xs rounded-lg bg-surface-elevated border border-border text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-xs text-muted-foreground">일 안에 완독</span>
            </div>
          )}

          {goalMode === "daily" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">하루</span>
              <input
                type="number"
                min={1}
                value={dailyTarget}
                onChange={(e) =>
                  setDailyTarget(parseOptionalNumber(e.target.value, { min: 1 }))
                }
                className="w-24 px-2.5 py-1.5 text-xs rounded-lg bg-surface-elevated border border-border text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-xs text-muted-foreground">편씩 읽기</span>
            </div>
          )}

          {goalMode === "date" && (
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-surface-elevated border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          )}
        </div>

        <div className="mb-5 p-3 bg-primary/5 border border-primary/20 rounded-xl">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-[10px] text-muted-foreground">하루 목표</p>
              <p className="font-mono text-sm font-black text-primary">{statDailyText}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">완독까지</p>
              <p className="font-mono text-sm font-black text-primary">{statDaysText}</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:opacity-90 transition-opacity"
        >
          {base ? "수정 완료" : "책장에 추가"}
        </button>
      </motion.div>
    </motion.div>
  );
}

function GoalCard({
  goal,
  onEdit,
  onDelete,
  onUpdateEpisode,
  onChangeStatus,
}: {
  goal: ReadingGoal;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateEpisode: (ep: number) => void;
  onChangeStatus: (status: ReadingStatus) => void;
}) {
  const { remaining, progress, daysNeeded, dailyNeeded } = calcStats(goal);
  const [showEpEdit, setShowEpEdit] = useState(false);
  const [epInput, setEpInput] = useState<number | "">(goal.currentEpisode);

  useEffect(() => {
    setEpInput(goal.currentEpisode);
  }, [goal.currentEpisode]);

  const canShowProgressUpdate = goal.status !== "done";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="surface-card border border-border cursor-pointer"
      onClick={onEdit}
    >
      <div className="flex gap-3">
        <div className="shrink-0 relative">
          {goal.thumbnailUrl ? (
            <img
              src={goal.thumbnailUrl}
              alt={goal.title}
              className="w-14 h-18 rounded-lg object-cover shadow-md"
              style={{ height: 72 }}
            />
          ) : (
            <div
              className={`w-14 rounded-lg bg-gradient-to-br ${goal.coverGradient} flex items-center justify-center text-2xl shadow-md`}
              style={{ height: 72 }}
            >
              {goal.coverEmoji}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground line-clamp-1">
                {goal.title}
              </h3>
              <p className="text-[10px] text-muted-foreground">
                {goal.author} · {goal.publisher}
              </p>
            </div>

            <div
              className="flex items-center gap-1 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <StatusDropdown status={goal.status} onChange={onChangeStatus} />
              <button
                onClick={onDelete}
                className="p-1 rounded hover:bg-surface-elevated text-rose-400"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground font-mono">
                {goal.currentEpisode} / {goal.episodeCount}화
              </span>
              <span className="text-[10px] font-mono font-bold text-primary">
                {progress}%
              </span>
            </div>
            <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {(daysNeeded || dailyNeeded) && goal.status !== "done" && (
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {dailyNeeded != null && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Target size={9} className="text-primary" />
                  하루 <span className="font-mono font-bold text-foreground">{dailyNeeded}편</span>
                </span>
              )}
              {daysNeeded != null && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock size={9} className="text-primary" />
                  완독까지 <span className="font-mono font-bold text-foreground">{daysNeeded}일</span>
                </span>
              )}
              {remaining > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  남은 <span className="font-mono font-bold">{remaining}화</span>
                </span>
              )}
            </div>
          )}

          {canShowProgressUpdate && (
            <div
              className="mt-2 flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              {showEpEdit ? (
                <>
                  <input
                    type="number"
                    min={0}
                    max={goal.episodeCount}
                    value={epInput}
                    onChange={(e) =>
                      setEpInput(
                        parseOptionalNumber(e.target.value, {
                          min: 0,
                          max: goal.episodeCount,
                        })
                      )
                    }
                    className="w-16 px-1.5 py-0.5 text-xs rounded bg-surface-elevated border border-border font-mono focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      onUpdateEpisode(
                        Math.min(goal.episodeCount, Math.max(0, numberOr(epInput, 0)))
                      );
                      setShowEpEdit(false);
                    }}
                    className="text-[10px] font-bold text-primary px-2 py-0.5 rounded bg-primary/10"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => {
                      setEpInput(goal.currentEpisode);
                      setShowEpEdit(false);
                    }}
                    className="text-[10px] text-muted-foreground"
                  >
                    취소
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setEpInput(goal.currentEpisode);
                    setShowEpEdit(true);
                  }}
                  className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <Edit2 size={9} />
                  진도 업데이트
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function ReadingGoalsPage() {
  const { data: sourceData, latestDate } = useTodayCombined();
  const novels: Novel[] = sourceData ?? [];

  const [goals, setGoals] = useState<ReadingGoal[]>(loadGoals);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Novel[]>([]);
  const [showTrendList, setShowTrendList] = useState(false);
  const [modalNovel, setModalNovel] = useState<Novel | null>(null);
  const [editGoal, setEditGoal] = useState<ReadingGoal | null>(null);
  const [filterStatus, setFilterStatus] = useState<ReadingStatus | "all">("all");
  const searchWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    saveGoals(goals);
  }, [goals]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (!searchWrapRef.current) return;
      if (!searchWrapRef.current.contains(e.target as Node)) {
        setShowTrendList(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const trendingTop5 = useMemo(() => {
    if (!novels.length) return [];

    const sourceNovels = novels as UnifiedNovel[];
    const { maxViewsByPlatform, maxCommentsByPlatform, maxDeltaByPlatform } =
      getPlatformMaxStats(sourceNovels);

    const novelsWithRidiInner = attachRidiInnerRank(
      sourceNovels,
      maxCommentsByPlatform,
      maxDeltaByPlatform
    );

    return [...novelsWithRidiInner]
      .sort((a, b) => {
        const scoreA = computeTrendScore(
          a,
          maxViewsByPlatform,
          maxCommentsByPlatform,
          maxDeltaByPlatform
        );
        const scoreB = computeTrendScore(
          b,
          maxViewsByPlatform,
          maxCommentsByPlatform,
          maxDeltaByPlatform
        );
        if (scoreA !== scoreB) return scoreB - scoreA;
        return (b.todayViews ?? 0) - (a.todayViews ?? 0);
      })
      .slice(0, 5) as Novel[];
  }, [novels]);

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }

    const keyword = search.trim();
    setSearchResults(
      novels
        .filter(
          (n) =>
            n.title.includes(keyword) ||
            n.author.includes(keyword) ||
            n.publisher?.includes?.(keyword)
        )
        .slice(0, 6)
    );
  }, [search, novels]);

  const addOrUpdateGoal = (goal: ReadingGoal) => {
    setGoals((prev) => {
      const exists = prev.findIndex((g) => g.id === goal.id);
      if (exists >= 0) {
        const next = [...prev];
        next[exists] = goal;
        return next;
      }
      return [goal, ...prev];
    });
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const updateEpisode = (id: string, ep: number) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === id
          ? {
              ...g,
              currentEpisode: ep,
              status: ep >= g.episodeCount ? "done" : g.status,
              completedAt:
                ep >= g.episodeCount
                  ? new Date().toISOString().slice(0, 10)
                  : g.completedAt,
            }
          : g
      )
    );
  };

  const updateGoalStatus = (id: string, status: ReadingStatus) => {
    const today = new Date().toISOString().slice(0, 10);

    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;

        let nextCurrentEpisode = g.currentEpisode;
        if (status === "done" && g.currentEpisode < g.episodeCount) {
          nextCurrentEpisode = g.episodeCount;
        }

        return {
          ...g,
          status,
          currentEpisode: nextCurrentEpisode,
          startedAt: status === "reading" ? g.startedAt ?? today : g.startedAt,
          completedAt: status === "done" ? g.completedAt ?? today : undefined,
        };
      })
    );
  };

  const isAlreadyAdded = (novelId: string) => goals.some((g) => g.novelId === novelId);

  const filteredGoals = goals.filter(
    (g) => filterStatus === "all" || g.status === filterStatus
  );

  const stats = useMemo(
    () => ({
      total: goals.length,
      reading: goals.filter((g) => g.status === "reading").length,
      done: goals.filter((g) => g.status === "done").length,
      want: goals.filter((g) => g.status === "want").length,
    }),
    [goals]
  );

  const visibleResults = search.trim()
    ? searchResults
    : showTrendList
      ? trendingTop5
      : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-black tracking-tight">독서 목표</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {latestDate} 기준 · 나만의 책장 & 독서 계획
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "전체", value: stats.total, color: "text-foreground", icon: BookOpen },
          { label: "읽는 중", value: stats.reading, color: "text-primary", icon: BookOpen },
          { label: "완독", value: stats.done, color: "text-emerald-500", icon: CheckCircle2 },
          { label: "읽고 싶어요", value: stats.want, color: "text-sky-500", icon: BookMarked },
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
        <h2 className="text-sm font-bold flex items-center gap-2">
          <Plus size={14} className="text-primary" />
          작품 검색 & 추가
        </h2>

        <div ref={searchWrapRef} className="relative">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(e) => {
              const next = e.target.value;
              setSearch(next);
              if (next.trim()) setShowTrendList(false);
            }}
            onClick={() => {
              if (!search.trim()) setShowTrendList(true);
            }}
            placeholder="제목 / 작가 검색…"
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-surface-elevated border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />

          {search && (
            <button
              onClick={() => {
                setSearch("");
                setSearchResults([]);
                setShowTrendList(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={13} />
            </button>
          )}

          <AnimatePresence>
            {visibleResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-2 border border-border rounded-xl overflow-hidden divide-y divide-border bg-surface"
              >
                {!search.trim() && showTrendList && (
                  <div className="px-3 py-2 bg-surface-elevated/60 text-[10px] font-semibold text-muted-foreground">
                    트렌드 순위 TOP 5
                  </div>
                )}

                {visibleResults.map((n, idx) => {
                  const added = isAlreadyAdded(n.id);

                  return (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (!added) {
                          setModalNovel(n);
                        } else {
                          const existing = goals.find((g) => g.novelId === n.id);
                          if (existing) setEditGoal(existing);
                        }
                        setSearch("");
                        setSearchResults([]);
                        setShowTrendList(false);
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-elevated transition-colors cursor-pointer"
                    >
                      {!search.trim() && showTrendList && (
                        <div className="w-6 shrink-0 text-center">
                          <span className="text-xs font-black text-primary">#{idx + 1}</span>
                        </div>
                      )}

                      <NovelCover novel={n} size="sm" />

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground line-clamp-1">
                          {n.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <PlatformBadge platform={n.platform as any} size="sm" />
                          <span className="text-[10px] text-muted-foreground">
                            {n.author} · {n.episodeCount}화
                          </span>
                        </div>
                      </div>

                      {added ? (
                        <span className="text-[10px] text-muted-foreground px-2 py-1 rounded-full bg-surface-elevated">
                          추가됨
                        </span>
                      ) : (
                        <button className="flex items-center gap-1 text-[10px] font-bold text-primary px-2.5 py-1 rounded-full bg-primary/10 pointer-events-none">
                          <Plus size={10} />
                          추가
                        </button>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {([
          { key: "all", label: "전체", count: goals.length },
          { key: "reading", label: "읽는 중", count: stats.reading },
          { key: "want", label: "읽고 싶어요", count: stats.want },
          { key: "done", label: "완독", count: stats.done },
          { key: "paused", label: "중단", count: goals.filter((g) => g.status === "paused").length },
        ] as { key: ReadingStatus | "all"; label: string; count: number }[]).map(
          ({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5",
                filterStatus === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface border border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
              <span
                className={cn(
                  "text-[10px] font-mono px-1 rounded",
                  filterStatus === key ? "bg-white/20" : "bg-surface-elevated"
                )}
              >
                {count}
              </span>
            </button>
          )
        )}
      </div>

      {filteredGoals.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={() => setEditGoal(goal)}
                onDelete={() => deleteGoal(goal.id)}
                onUpdateEpisode={(ep) => updateEpisode(goal.id, ep)}
                onChangeStatus={(status) => updateGoalStatus(goal.id, status)}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="surface-card text-center py-16 text-muted-foreground">
          <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-semibold">아직 추가된 작품이 없어요</p>
          <p className="text-xs mt-1">위 검색창에서 작품을 찾아 추가해보세요</p>
        </div>
      )}

      <AnimatePresence>
        {modalNovel && (
          <GoalModal
            novel={modalNovel}
            onSave={addOrUpdateGoal}
            onClose={() => setModalNovel(null)}
          />
        )}
        {editGoal && (
          <GoalModal
            existingGoal={editGoal}
            onSave={addOrUpdateGoal}
            onClose={() => setEditGoal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
