function mapRowToNovel(row: TodayCombinedRow, index: number): Novel {
  const platform = toPlatform(row["출처"]);
  const todayRank = parseInt(String(row["오늘순위"])) || index + 1;
  const { rankChange, isNew, isReEntry } = parseRankChange(row["순위변화"]);

  const todayViewsNumber = parseViewsToNumber(row["오늘조회수"]);
  const prevViewsNumber = parseViewsToNumber(row["전일조회수"]);

  const rawRankHistory = ((row["rankHistory"] ?? []) as { date: string; rank: number | null }[])
    .filter((r) => r?.date)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const rawViewsHistory = ((row["viewsHistory"] ?? []) as { date: string; views: string | number }[])
    .filter((v) => v?.date)
    .map((v) => ({
      date: v.date,
      views: parseViewsToNumber(String(v.views)),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const rankHistory =
    rawRankHistory.length > 0
      ? rawRankHistory
      : [{ date: row["날짜"] || "", rank: typeof todayRank === "number" ? todayRank : null }];

  const viewsHistory =
    rawViewsHistory.length > 0
      ? rawViewsHistory
      : [{ date: row["날짜"] || "", views: todayViewsNumber }];

  const firstAppeared =
    rankHistory.find((h) => h.rank !== null)?.date ||
    rankHistory[0]?.date ||
    row["날짜"] ||
    "";

  const consecutiveDays = (() => {
    const sortedDesc = [...rankHistory].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    let count = 0;
    for (const h of sortedDesc) {
      if (h.rank !== null) count++;
      else break;
    }
    return count;
  })();

  const peakRank = (() => {
    const ranks = rankHistory
      .map((h) => h.rank)
      .filter((r): r is number => typeof r === "number" && r > 0);
    if (ranks.length === 0) return todayRank;
    return Math.min(...ranks);
  })();

  return {
    id: `${platform}-${row["제목"]}-${todayRank}`,
    title: row["제목"] || "(제목 없음)",
    author: row["작가"] || "-",
    genre: toUnifiedGenre(platform, row["장르"] || "기타"),
    publisher: row["출판사"] || "-",
    platform,
    thumbnailUrl: row["썸네일"] && row["썸네일"] !== "-" ? row["썸네일"] : undefined,
    todayRank,
    prevRank: row["전일순위"] === "NEW" ? null : parseInt(String(row["전일순위"])),
    rankChange,
    isNew,
    isReEntry,
    todayViews: todayViewsNumber,
    viewsChange: todayViewsNumber - prevViewsNumber,
    viewsChangePct:
      prevViewsNumber > 0 ? ((todayViewsNumber - prevViewsNumber) / prevViewsNumber) * 100 : 0,
    rating: parseFloat(String(row["평점"])) || 0,
    commentCount: parseCommentCount(row["댓글수"]),
    episodeCount: parseInt(String(row["총회차수"]).match(/\d+/)?.[0] || "0", 10),
    firstAppeared,
    coverGradient:
      platform === "naver"
        ? "from-emerald-900 to-green-700"
        : platform === "kakao"
          ? "from-amber-900 to-orange-700"
          : "from-blue-900 to-indigo-700",
    coverEmoji: platform === "naver" ? "📗" : platform === "kakao" ? "💛" : "📘",
    rankHistory,
    viewsHistory,
    consecutiveDays,
    peakRank,
    promotion: row.promotion,
    status: "none",
    readingGoal: 0,
    currentEpisode: 0,
  };
}
