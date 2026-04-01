import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { LogOut, Rocket, Menu, X } from "lucide-react";

import { useLogout } from "@auth/infrastructure/ui/hooks/useLogout";

import { useAuthStore } from "@lib/auth";
import { cn } from "@lib/utils";

import {
  ACTIVE_CLASS,
  BASE_CLASS,
  NAV_ITEMS,
} from "@layout/infrastructure/ui/constants/layout.constants";

export const Sidebar: React.FC = memo(function Sidebar() {
  const logout = useLogout();
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [handleEscape]);

  const visibleItems = useMemo(
    () => NAV_ITEMS.filter((item) => !(item as any).adminOnly || user?.role === "admin"),
    [user?.role],
  );

  const nav = (
    <>
      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-5 border-b border-border shrink-0">
        <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
          <Rocket className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-sm tracking-wide">DeployKit</span>
        <button
          className="ml-auto lg:hidden text-text-muted hover:text-text-primary"
          onClick={() => setOpen(false)}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={BASE_CLASS}
            activeProps={{ className: cn(BASE_CLASS, ACTIVE_CLASS) }}
            activeOptions={{ exact: item.exact }}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-border shrink-0">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-danger hover:bg-surface-2 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 h-screen fixed left-0 top-0 bg-surface-1 border-r border-border flex-col z-30">
        {nav}
      </aside>

      {/* Mobile: top bar with hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-surface-1 border-b border-border flex items-center px-4 z-30">
        <button
          onClick={() => setOpen(true)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-2 text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 ml-3">
          <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center">
            <Rocket className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-sm tracking-wide">DeployKit</span>
        </div>
      </div>

      {/* Mobile: drawer backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile: drawer */}
      <aside
        className={cn(
          "lg:hidden fixed top-0 left-0 h-full w-72 bg-surface-1 border-r border-border flex flex-col z-50 transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {nav}
      </aside>
    </>
  );
});
