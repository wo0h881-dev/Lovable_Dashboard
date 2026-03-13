import { useState } from "react";
import { BarChart3, BookOpen, Building2, Flame, Home, Menu, Sparkles, TrendingUp, X } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { icon: Home,      label: "전체 개요",   path: "/" },
  { icon: BarChart3, label: "순위표",      path: "/rankings" },
  { icon: BookOpen,  label: "장르 분석",   path: "/genres" },
  { icon: Building2, label: "출판사",      path: "/publishers" },
  { icon: TrendingUp,label: "트렌드",      path: "/trends" },
  { icon: Sparkles,  label: "신작",        path: "/new-works" },
];

interface Props {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: Props) {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-20 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        animate={{ width: isOpen ? 220 : 64 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="fixed left-0 top-14 bottom-0 z-30 flex flex-col overflow-hidden border-r border-border"
        style={{ background: "hsl(var(--sidebar-background))" }}
      >
        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map(({ icon: Icon, label, path }) => {
            const active = path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
            return (
              <NavLink key={path} to={path}>
                <motion.div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 cursor-pointer",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                  )}
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.1 }}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  <AnimatePresence>
                    {isOpen && (
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
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"
                    />
                  )}
                </motion.div>
              </NavLink>
            );
          })}
        </nav>

        {/* Toggle button at bottom */}
        <div className="p-3 border-t border-border">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
          >
            {isOpen ? <X size={16} /> : <Menu size={16} />}
            {isOpen && <span className="text-xs">접기</span>}
          </button>
        </div>
      </motion.aside>
    </>
  );
}
