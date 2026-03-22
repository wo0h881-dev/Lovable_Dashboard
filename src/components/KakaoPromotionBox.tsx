import type { PromotionInfo } from "@/data/mockData"; // 실제 경로에 맞게 수정

interface Props {
  promotion?: PromotionInfo;
}

export function KakaoPromotionBox({ promotion }: Props) {
  if (!promotion) return null;

  const { eventTitle, eventSubtitle, notices } = promotion;

  if (!eventTitle && !notices?.length) return null;

  return (
    <div className="mt-4 space-y-3">
      {eventTitle && (
        <div className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-2 text-xs text-white">
          <div className="font-semibold">{eventTitle}</div>
          {eventSubtitle && (
            <div className="opacity-80">{eventSubtitle}</div>
          )}
        </div>
      )}

      {notices && notices.length > 0 && (
        <div className="rounded-lg bg-el-20 p-3">
          <div className="mb-2 text-xs font-semibold text-el-60">소식</div>
          {notices.slice(0, 4).map((n, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-[11px] text-el-70"
            >
              <span className="truncate">
                [{n.title}] {n.body}
              </span>
              {n.date && (
                <span className="ml-2 shrink-0 text-el-50">{n.date}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
