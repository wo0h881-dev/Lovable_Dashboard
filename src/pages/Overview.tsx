import {
  AlertTriangle,
  BarChart3,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Flame,
  Lightbulb,
  Medal,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  );
}

function carouselLabel(novel: Novel) {
  if ((novel.consecutiveDays || 0) >= 14) return "장기차트인";
  if (novel.isNew) return "오늘의 분석";
  if ((novel.viewsChangePct || 0) >= 15) return "급상승 후보";
  if (novel.isReEntry) return "재진입 후보";
  return "분석 후보";
}

function topEntry(map: Record<string, number>) {
  return Object.entries(map).sort((a, b) => b[1] - a[1])[0];
}
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
    .slice(0, 10);
}

function MetricPill({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
function MetricPill({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  tone: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/70 bg-white/75 px-3.5 py-2.5 shadow-sm backdrop-blur">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase text-slate-500">
        {icon}
        <span className={cn("grid h-7 w-7 place-items-center rounded-xl", tone)}>{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-1 truncate text-sm font-extrabold tracking-tight text-slate-950 md:text-base">{value}</p>

function SignalLine({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="grid gap-3 border-t border-slate-200 py-4 sm:grid-cols-[150px_minmax(0,1fr)]">
    <div className="grid gap-3 border-t border-slate-200 py-4 sm:grid-cols-[120px_minmax(0,1fr)]">
      <div className="flex items-center gap-2 text-xs font-black text-slate-950">
        <span className="grid h-8 w-8 place-items-center rounded-2xl bg-slate-100 text-slate-600">{icon}</span>
        {title}
  );
}

function PriorityCard({ novel, onSelect }: { novel: Novel; onSelect: (novel: Novel) => void }) {
function CarouselCover({
  novel,
  active,
  side,
  onClick,
}: {
  novel: Novel;
  active?: boolean;
  side?: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(novel)}
      className="group min-w-0 rounded-2xl border border-white/70 bg-white/75 p-4 text-left shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
      onClick={onClick}
      className={cn(
        "group relative shrink-0 transition duration-300",
        active ? "z-10 w-[140px] md:w-[170px]" : "w-[92px] opacity-75 md:w-[120px]",
        side === "left" && "-rotate-6",
        side === "right" && "rotate-6",
      )}
    >
      <p className="line-clamp-2 min-h-[38px] text-[13px] font-extrabold leading-snug text-slate-950">
        {getAnalysisReason(novel)}
      </p>
      <div className="mt-4 flex gap-3">
        <NovelCover novel={novel} size="sm" className="h-16 w-12 rounded-xl object-cover" />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-xs font-extrabold text-slate-800 group-hover:text-slate-950">{novel.title}</p>
          <p className="mt-1 truncate text-[11px] text-slate-500">{novel.publisher}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <PlatformBadge platform={novel.platform as any} size="sm" />
            <span className="rounded-full bg-lime-200 px-2 py-0.5 text-[11px] font-black text-slate-900">
              {formatPct(novel.viewsChangePct)}
            </span>
          </div>
        </div>
      </div>
      <NovelCover novel={novel} size="lg" className="aspect-[3/4] w-full rounded-2xl object-cover shadow-xl ring-1 ring-white/60" />
      <span className="absolute left-3 right-3 top-3 rounded-full bg-white/85 px-2 py-1 text-center text-[10px] font-black text-slate-900 shadow-sm">
        {carouselLabel(novel)}
      </span>
    </button>
  );
}

function PublisherSupportPanel({ items }: { items: PublisherInsight[] }) {
  return (
    <section className="rounded-[28px] border border-white/70 bg-white/60 p-5 shadow-sm backdrop-blur">
    <section className="rounded-[28px] border border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase text-slate-500">Publisher Support</p>
      </div>
      <div className="space-y-3">
        {items.slice(0, 4).map((item) => (
          <div key={item.name} className="rounded-2xl border border-slate-200/70 bg-white/70 p-4">
          <div key={item.name} className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-extrabold text-slate-950">{item.name}</h3>

function RelatedSignals({ novels, onSelect }: { novels: Novel[]; onSelect: (novel: Novel) => void }) {
  return (
    <section className="rounded-[26px] bg-[#f2554b] px-5 py-6 text-white shadow-sm">
      <div className="mb-6 flex items-center justify-center gap-5">
        <div className="hidden h-px flex-1 bg-white/70 sm:block" />
        <h2 className="text-center text-base font-extrabold uppercase tracking-[0.18em]">Related Signals</h2>
        <div className="hidden h-px flex-1 bg-white/70 sm:block" />
    <section className="rounded-[28px] border border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold tracking-tight text-slate-950">Related Signals</h2>
        <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">signal works</span>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        {novels.slice(0, 6).map((novel) => (
          <button key={novel.id} type="button" onClick={() => onSelect(novel)} className="group min-w-0 text-center">
            <NovelCover novel={novel} size="md" className="mx-auto aspect-[3/4] w-full max-w-[110px] rounded-xl object-cover shadow-md" />
            <div className="mt-3 flex justify-center gap-1 text-[10px] text-white">★ ★ ★</div>
            <p className="mt-1 line-clamp-2 min-h-[32px] text-[11px] font-extrabold leading-tight group-hover:underline">{novel.title}</p>
            <p className="mt-1 text-[10px] font-semibold opacity-80">{novel.todayRank ? `#${novel.todayRank}` : "분석"}</p>
          <button
            key={novel.id}
            type="button"
            onClick={() => onSelect(novel)}
            className="group min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
          >
            <NovelCover novel={novel} size="md" className="mx-auto aspect-[3/4] w-full max-w-[96px] rounded-xl object-cover shadow-md" />
            <p className="mt-3 line-clamp-2 min-h-[34px] text-xs font-extrabold leading-tight text-slate-950 group-hover:underline">
              {novel.title}
            </p>
            <p className="mt-1 truncate text-[11px] font-semibold text-slate-500">
              {carouselLabel(novel)} · {platformLabel(novel.platform)}
            </p>
            <p className="mt-2 line-clamp-4 min-h-[62px] text-left text-[11px] leading-relaxed text-slate-600">
              {getAnalysisReason(novel)}
            </p>
            <span className="mt-3 inline-flex rounded-full bg-slate-200 px-2 py-1 text-[10px] font-black text-slate-700">
              취업 활용
            </span>
          </button>
        ))}
      </div>

function MiniRankList({ title, data, onSelect }: { title: string; data: Novel[]; onSelect: (novel: Novel) => void }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur">
    <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
      <h3 className="mb-3 text-sm font-extrabold text-slate-950">{title}</h3>
      <div className="space-y-2">
        {data.slice(0, 5).map((novel, index) => (
        {data.slice(0, 10).map((novel, index) => (
          <button
            key={`${title}-${novel.id}`}
            type="button"
            onClick={() => onSelect(novel)}
            className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-slate-100/80"
            className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2 text-left hover:bg-white"
          >
            <span className="w-5 text-center font-mono text-xs font-extrabold text-slate-500">{index + 1}</span>
            <NovelCover novel={novel} size="sm" className="h-11 w-9 rounded-lg object-cover" />
  const periodLabel = dateRangeLabels[dateRange];
  const { data: sourceData, isLoading, error, latestDate } = useTodayCombined(dateRange);
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(1);

  const derived = useMemo(() => {
    if (!sourceData || sourceData.length === 0) {
        publisherTop10: [] as Novel[],
        newTop10: [] as Novel[],
        analysisPriority: [] as Novel[],
        carouselNovels: [] as Novel[],
        todayFocus: null as Novel | null,
        publisherInsights: [] as PublisherInsight[],
        platformData: [] as { name: string; value: number; key: string }[],
      .slice(0, 10);

    const analysisPriority = [...enriched].sort((a, b) => getAnalysisScore(b) - getAnalysisScore(a)).slice(0, 6);
    const steadyPick = [...enriched]
      .filter((novel) => (novel.consecutiveDays || 0) >= 14)
      .sort((a, b) => (b.consecutiveDays || 0) - (a.consecutiveDays || 0))[0];
    const risingPick = trendTop10.find((novel) => (novel.viewsChangePct || 0) >= 15 && novel.id !== analysisPriority[0]?.id);
    const carouselNovels = [steadyPick, analysisPriority[0], risingPick]
      .filter((novel): novel is Novel => Boolean(novel))
      .filter((novel, index, array) => array.findIndex((item) => item.id === novel.id) === index);

    const newTop10 = [...enriched].filter((novel) => novel.isNew).sort((a, b) => getAnalysisScore(b) - getAnalysisScore(a)).slice(0, 10);
    const publisherInsights = buildPublisherInsights(enriched, trendTop10);
    const publisherTop10 = publisherInsights.map((item) => item.bestNovel).filter((novel): novel is Novel => Boolean(novel));
      publisherTop10,
      newTop10,
      analysisPriority,
      carouselNovels,
      todayFocus: analysisPriority[0] ?? overallTop10[0] ?? null,
      publisherInsights,
      platformData: Object.entries(platformCounts).map(([name, value]) => ({ name: platformLabel(name), value, key: name })),
  if (isLoading) return <LoadingScreen />;
  if (error) return <div className="p-8 text-center font-bold text-red-500">{error}</div>;

  const focus = derived.todayFocus;
  const carouselNovels = derived.carouselNovels.length > 0 ? derived.carouselNovels : derived.todayFocus ? [derived.todayFocus] : [];
  const safeIndex = carouselNovels.length > 0 ? ((carouselIndex % carouselNovels.length) + carouselNovels.length) % carouselNovels.length : 0;
  const focus = carouselNovels[safeIndex] ?? derived.todayFocus;
  const leftCarouselNovel = carouselNovels[(safeIndex - 1 + carouselNovels.length) % carouselNovels.length] ?? focus;
  const rightCarouselNovel = carouselNovels[(safeIndex + 1) % carouselNovels.length] ?? focus;
  const sourceNovels: Novel[] = sourceData && sourceData.length > 0 ? sourceData : [];
  const topPublisher = derived.publisherInsights[0];

  return (
    <div className="-m-6 min-h-screen bg-[#eef1ed] p-5 text-slate-950 md:p-7">
      <div className="mx-auto max-w-[1240px] space-y-6">
        <header className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500">Web Novel Analysis</p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 md:text-3xl">웹소설 분석</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
              {latestDate || "오늘"} 기준 · {periodLabel} 데이터로 작품 반응을 먼저 보고, 출판사는 보조 신호로 확인합니다.
            </p>
          </div>
        <header>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500">Web Novel Analysis</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 md:text-3xl">웹소설 분석</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
            {latestDate || "오늘"} 기준 · {periodLabel} 데이터로 작품 반응을 먼저 보고, 출판사는 보조 신호로 확인합니다.
          </p>
        </header>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <MetricPill icon={<Target size={14} />} label="오늘의 분석 대상" value={focus?.title ?? "-"} />
          <MetricPill icon={<Flame size={14} />} label="급상승 작품" value={`${derived.stats.rising}개`} />
          <MetricPill icon={<Sparkles size={14} />} label="신작 반응" value={`${derived.stats.newCount}개`} />
          <MetricPill icon={<Medal size={14} />} label="장기 차트인" value={`${derived.stats.steady}개`} />
          <MetricPill icon={<Building2 size={14} />} label="주목 출판사" value={topPublisher?.name ?? "-"} />
          <MetricPill icon={<Target size={14} />} label="오늘의 분석 대상" value={focus?.title ?? "-"} tone="bg-violet-100 text-violet-700" />
          <MetricPill icon={<Flame size={14} />} label="급상승 작품" value={`${derived.stats.rising}개`} tone="bg-orange-100 text-orange-700" />
          <MetricPill icon={<Sparkles size={14} />} label="신작 반응" value={`${derived.stats.newCount}개`} tone="bg-cyan-100 text-cyan-700" />
          <MetricPill icon={<Medal size={14} />} label="장기 차트인" value={`${derived.stats.steady}개`} tone="bg-emerald-100 text-emerald-700" />
          <MetricPill icon={<Building2 size={14} />} label="주목 출판사" value={topPublisher?.name ?? "-"} tone="bg-slate-200 text-slate-800" />
        </section>

        {focus && (
          <section className="overflow-hidden rounded-[28px] border border-white/70 bg-white/60 shadow-sm backdrop-blur">
            <div className="grid min-h-[300px] lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
            <div className="relative min-h-[340px] self-start overflow-hidden rounded-[28px] border border-white/70 bg-[radial-gradient(circle_at_74%_22%,rgba(222,255,93,0.72),transparent_24%),linear-gradient(135deg,#d9eade_0%,#eef0eb_52%,#dce5ef_100%)] p-6 shadow-sm">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-700">Today Focus Carousel</p>
              <button
                type="button"
                aria-label="이전 작품"
                onClick={() => setCarouselIndex((value) => value - 1)}
                className="absolute left-4 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-slate-900 shadow-md hover:bg-white"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex h-[270px] items-center justify-center gap-4 px-10">
                {leftCarouselNovel && <CarouselCover novel={leftCarouselNovel} side="left" onClick={() => setCarouselIndex((value) => value - 1)} />}
                <CarouselCover novel={focus} active onClick={() => setSelectedNovel(focus)} />
                {rightCarouselNovel && <CarouselCover novel={rightCarouselNovel} side="right" onClick={() => setCarouselIndex((value) => value + 1)} />}
              </div>
              <button
                type="button"
                onClick={() => setSelectedNovel(focus)}
                className="relative min-h-[300px] overflow-hidden p-5 text-left md:p-7"
                aria-label="다음 작품"
                onClick={() => setCarouselIndex((value) => value + 1)}
                className="absolute right-4 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-slate-900 shadow-md hover:bg-white"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_16%,rgba(222,255,93,0.75),transparent_22%),linear-gradient(135deg,#d7e8dd_0%,#eef0eb_50%,#dde4ed_100%)]" />
                <div className="absolute -bottom-20 -right-12 h-64 w-64 rounded-full bg-slate-950/10 blur-3xl" />
                <div className="relative z-10 flex h-full flex-col justify-between gap-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-700">Today Focus</p>
                      <h2 className="mt-3 max-w-3xl text-2xl font-extrabold leading-tight tracking-tight text-slate-950 md:text-3xl">
                        {focus.title}
                      </h2>
                      <p className="mt-3 text-sm font-semibold text-slate-600">
                        {focus.author} · {focus.publisher}
                      </p>
                    </div>
                    <PlatformBadge platform={focus.platform as any} size="md" />
                  </div>
                  <div className="grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl bg-white/78 p-3 shadow-sm">
                      <p className="text-[11px] font-bold text-slate-500">현재 순위</p>
                      <p className="mt-1 font-mono text-xl font-extrabold">#{focus.todayRank ?? "-"}</p>
                    </div>
                    <div className="rounded-2xl bg-white/78 p-3 shadow-sm">
                      <p className="text-[11px] font-bold text-slate-500">순위 변화</p>
                      <div className="mt-1"><RankChange novel={focus} /></div>
                    </div>
                    <div className="rounded-2xl bg-white/78 p-3 shadow-sm">
                      <p className="text-[11px] font-bold text-slate-500">조회 변화</p>
                      <p className={cn("mt-1 font-mono text-xl font-extrabold", (focus.viewsChangePct || 0) >= 0 ? "text-blue-700" : "text-rose-600")}>
                        {formatPct(focus.viewsChangePct)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/78 p-3 shadow-sm">
                      <p className="text-[11px] font-bold text-slate-500">프로모션</p>
                      <p className="mt-1 truncate text-sm font-extrabold">{promotionLabel(focus)}</p>
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} />
              </button>
              <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-2">
                {carouselNovels.map((novel, index) => (
                  <button
                    key={novel.id}
                    type="button"
                    aria-label={`${index + 1}번 작품 보기`}
                    onClick={() => setCarouselIndex(index)}
                    className={cn("h-2 rounded-full transition-all", index === safeIndex ? "w-6 bg-slate-950" : "w-2 bg-slate-300")}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur">
              <PlatformBadge platform={focus.platform as any} size="md" />
              <h2 className="mt-4 line-clamp-2 text-2xl font-extrabold tracking-tight text-slate-950 md:text-3xl">{focus.title}</h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">{focus.author} · {focus.publisher} · {focus.genre}</p>

              <aside className="hidden flex-col justify-between border-t border-white/80 bg-white/78 p-5 lg:flex lg:border-l lg:border-t-0">
                <div>
                  <NovelCover novel={focus} size="lg" className="mx-auto aspect-[3/4] w-full max-w-[180px] rounded-3xl object-cover shadow-lg" />
                  <div className="mt-4 text-center">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Main Target</p>
                    <h3 className="mt-2 line-clamp-2 text-lg font-extrabold text-slate-950">{focus.title}</h3>
                    <p className="mt-2 text-sm font-medium text-slate-500">{focus.genre} · {toKoreanUnit(focus.todayViews)}</p>
                  </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-bold text-slate-500">현재 순위</p>
                  <p className="mt-1 font-mono text-xl font-extrabold">#{focus.todayRank ?? "-"}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-bold text-slate-500">순위 변화</p>
                  <div className="mt-1"><RankChange novel={focus} /></div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-bold text-slate-500">조회 변화</p>
                  <p className={cn("mt-1 font-mono text-xl font-extrabold", (focus.viewsChangePct || 0) >= 0 ? "text-blue-700" : "text-rose-600")}>
                    {formatPct(focus.viewsChangePct)}
                  </p>
                </div>
              </aside>
            </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-bold text-slate-500">프로모션</p>
                  <p className="mt-1 truncate text-sm font-extrabold">{promotionLabel(focus)}</p>
                </div>
              </div>

            <div className="grid border-t border-slate-200 bg-white/82 px-5 md:px-7 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="py-2">
              <div className="mt-5">
                <SignalLine icon={<Flame size={16} />} title="급상승 이유" body={getAnalysisReason(focus)} />
                <SignalLine icon={<Lightbulb size={16} />} title="PD 관점" body={getPdPerspective(focus)} />
                <SignalLine icon={<BriefcaseBusiness size={16} />} title="취업 활용 포인트" body={getCareerAngle(focus)} />
              </div>
              <div className="border-t border-slate-200 py-5 lg:border-l lg:border-t-0 lg:pl-6">
                <p className="text-xs font-extrabold uppercase text-slate-500">Publisher Note</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {topPublisher?.strength ?? "출판사 보조 분석은 작품 반응을 해석하기 위한 참고 신호입니다."}
                </p>
                <SignalLine icon={<BriefcaseBusiness size={16} />} title="취업 활용" body={getCareerAngle(focus)} />
              </div>
            </div>
          </section>
        )}

        <section>
          <div className="mb-4 flex items-center gap-2">
            <BookOpenCheck size={18} className="text-slate-700" />
            <h2 className="text-lg font-extrabold tracking-tight text-slate-950">분석 우선 작품</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {derived.analysisPriority.map((novel) => (
              <PriorityCard key={novel.id} novel={novel} onSelect={setSelectedNovel} />
            ))}
          </div>
        </section>

        <RelatedSignals novels={derived.analysisPriority} onSelect={setSelectedNovel} />

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-[26px] border border-white/70 bg-white/70 p-5 shadow-sm backdrop-blur">
              <div className="mb-4 flex items-center gap-2">
        <section className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="grid self-start grid-cols-1 items-start gap-5 lg:grid-cols-2">
            <div className="self-start rounded-[26px] border border-white/70 bg-white/70 p-5 shadow-sm backdrop-blur">
              <div className="mb-3 flex items-center gap-2">
                <Eye size={18} className="text-slate-700" />
                <h2 className="text-base font-extrabold text-slate-950">플랫폼 분포</h2>
              </div>
              <div className="h-[280px]">
              <div className="h-[230px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={derived.platformData} innerRadius={58} outerRadius={88} paddingAngle={7} dataKey="value">
                    <Pie data={derived.platformData} innerRadius={50} outerRadius={78} paddingAngle={7} dataKey="value">
                      {derived.platformData.map((entry) => (
                        <Cell key={entry.key} fill={PLATFORM_COLORS[entry.key] || PLATFORM_COLORS.etc} />
                      ))}
              </div>
            </div>

            <div className="rounded-[26px] border border-white/70 bg-white/70 p-5 shadow-sm backdrop-blur">
              <div className="mb-4 flex items-center gap-2">
            <div className="self-start rounded-[26px] border border-white/70 bg-white/70 p-5 shadow-sm backdrop-blur">
              <div className="mb-3 flex items-center gap-2">
                <BarChart3 size={18} className="text-slate-700" />
                <h2 className="text-base font-extrabold text-slate-950">장르별 플랫폼 분포</h2>
              </div>
              <div className="h-[280px]">
              <div className="h-[230px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={derived.genreStackedData} layout="vertical">
                    <CartesianGrid stroke="rgba(148,163,184,0.18)" horizontal={false} />
