import { useOutletContext } from "react-router-dom";
import type { DateRange } from "@/hooks/useTodayCombined";

interface DashboardOutletContext {
  dateRange?: DateRange;
  latestDate?: string;
}

export function useDashboardDateRange(): DateRange {
  const context = useOutletContext<DashboardOutletContext | undefined>();
  return context?.dateRange ?? "today";
}
