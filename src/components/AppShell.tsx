"use client";

import { useEffect, useState } from "react";
import { BarChart3, Bell, LayoutDashboard, List, RefreshCcw, Star } from "lucide-react";
import { GlobalStockSearch } from "./GlobalStockSearch";
import { ThemeToggle } from "./ThemeToggle";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/stocks", label: "Stocks", icon: List },
  { href: "/watchlist", label: "Watchlist", icon: Star }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [pathname, setPathname] = useState("/");

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/">
          <span className="brand-mark">
            <BarChart3 size={19} />
          </span>
          Stockviewer
        </a>
        <div className="menu-label">Menu</div>
        {nav.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <a className={`nav-link ${active ? "active" : ""}`} href={item.href} key={item.href}>
              <Icon size={17} />
              {item.label}
            </a>
          );
        })}
      </aside>
      <main className="content" id="app-scroll" tabIndex={-1}>
        <header className="topbar">
          <GlobalStockSearch />
          <div className="row">
            <ThemeToggle />
            <span className="freshness">
              <RefreshCcw size={14} />
              Live NSE
            </span>
            <Bell size={19} className="muted" />
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
