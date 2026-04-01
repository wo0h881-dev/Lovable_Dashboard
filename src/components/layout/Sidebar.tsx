import {
  BarChart3,
  BookOpen,
  Building2,
  Home,
  Menu,
  Sparkles,
  TrendingUp,
  X,
  ChevronLeft,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { icon: Home, label: "전체 개요", path: "/" },
  { icon: BarChart3, label: "순위표", path: "/rankings" },
  { icon: BookOpen, label: "장르 분석", path: "/genres" },
  { icon: Building2, label: "출판사", path: "/publishers" },
  { icon: TrendingUp, label: "트렌드", path: "/trends" },
  { icon: Sparkles, label: "신작", path: "/new-works" },
  { icon: BookOpen, label: "독서 목표", path: "/reading-goal" },
];

export type SidebarMode = "expanded" | "collapsed" | "hidden";

interface Props {
  mode: SidebarMode;
  onChangeMode: (mode: SidebarMode) => void;
}

const SIDEBAR_WIDTH = {
  expanded: 220,
  collapsed: 64,
  hidden: 0,
};

export function Sidebar({ mode, onChangeMode }: Props) {
  const location = useLocation();

  const isExpanded = mode === "expanded";
  const isCollapsed = mode === "collapsed";
  const isHidden = mode === "hidden";

  const cycleMode = () => {
    if (mode === "expanded") {
      onChangeMode("collapsed");
      return;
    }
    if (mode === "collapsed") {
      onChangeMode("hidden");
      return;
    }
    onChangeMode("expanded");
  };

  return (
    <>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-20 lg:hidden"
            onClick={() => onChangeMode("hidden")}
          />
        )}
      </AnimatePresence>

      <motion.aside
        animate={{
          width: SIDEBAR_WIDTH[mode],
          x: isHidden ? -16 : 0,
          opacity: isHidden ? 0 : 1,
        }}
        transition={{ duration: 0.22, ease: "easeInOut" }}
        className={cn(
          "fixed left-0 top-14 bottom-0 z-30 flex flex-col overflow-hidden border-r border-border",
          isHidden && "pointer-events-none"
        )}
        style={{ background: "hsl(var(--sidebar-background))" }}
      >
        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map(({ icon: Icon, label, path }) => {
            const active =
              path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(path);

            return (
              <NavLink key={path} to={path}>
                <motion.div
                  className={cn(
                    "flex items-center rounded-lg transition-colors duration-150 cursor-pointer",
                    isExpanded ? "gap-3 px-3 py-2.5" : "justify-center px-2 py-3",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                  )}
                  whileHover={{ x: isExpanded ? 2 : 0 }}
                  transition={{ duration: 0.1 }}
                  title={!isExpanded ? label : undefined}
                >
                  <Icon size={18} className="flex-shrink-0" />

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.15 }}
                        className="text-sm font-medium whitespace-nowrap overflow-hidden"
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {active && (
                    <motion.div
                      layoutId="activeIndicator"
                      className={cn(
                        "rounded-full bg-primary flex-shrink-0",
                        isExpanded ? "ml-auto w-1.5 h-1.5" : "absolute right-2 w-1.5 h-1.5"
                      )}
                    />
                  )}
                </motion.div>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <button
            onClick={cycleMode}
            className={cn(
              "w-full flex items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors",
              isExpanded ? "justify-center gap-2 px-3 py-2" : "justify-center px-2 py-2.5"
            )}
            title={
              mode === "expanded"
                ? "아이콘만 보기"
                : mode === "collapsed"
                ? "사이드바 숨기기"
                : "사이드바 열기"
            }
          >
            {mode === "expanded" && <ChevronLeft size={16} />}
            {mode === "collapsed" && <X size={16} />}
            {mode === "hidden" && <Menu size={16} />}

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-xs whitespace-nowrap overflow-hidden"
                >
                  접기
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
