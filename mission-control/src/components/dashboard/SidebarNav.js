"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import { Menu, Shield, X } from "lucide-react";

function NavGroups({ items, pathname, onNavigate }) {
  return items.map((item, index) => {
    const isActive =
      item.href === "/dashboard"
        ? pathname === "/dashboard"
        : pathname.startsWith(item.href);
    const startsGroup = index === 0 || items[index - 1].group !== item.group;

    return (
      <Fragment key={item.name}>
        {startsGroup && (
          <div className="label-mono px-3 pb-2 pt-5 text-white/70 first:pt-1">
            {item.group}
          </div>
        )}
        <Link
          href={item.href}
          onClick={onNavigate}
          aria-current={isActive ? "page" : undefined}
          className={`flex min-h-[44px] items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
            isActive
              ? "border-gold-muted/60 bg-gold/10 text-gold-bright"
              : "border-transparent text-white/70 hover:bg-white/5 hover:text-white"
          }`}
        >
          {item.icon}
          {item.name}
        </Link>
      </Fragment>
    );
  });
}

// Items are tier-filtered by the server layout before crossing the RSC boundary.
export default function SidebarNav({ items, mobile = false }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  if (mobile) {
    return (
      <div className="lg:hidden border-b border-line bg-surface px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded border border-line bg-black/50">
            <Shield className="h-4 w-4 text-gold" aria-hidden="true" />
          </div>
          <span className="font-semibold tracking-tight text-sm">Mission Control</span>
        </div>
        <button
          type="button"
          onClick={() => setDrawerOpen((prev) => !prev)}
          aria-expanded={drawerOpen}
          aria-label={drawerOpen ? "Close Mission Control navigation" : "Open Mission Control navigation"}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-line bg-black/40 text-white/80 hover:text-white"
        >
          {drawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {drawerOpen && (
          <div
            className="fixed inset-0 z-50 flex bg-black/80 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Mission Control navigation"
          >
            <div className="flex w-72 max-w-[85vw] flex-col border-r border-line bg-surface h-full">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <span className="font-semibold tracking-tight text-sm text-white">Navigation</span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close navigation menu"
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-white/70 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav aria-label="Mission Control Mobile" className="flex-1 px-4 pb-6 pt-3 overflow-y-auto">
                <NavGroups items={items} pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
              </nav>
            </div>
            <button
              type="button"
              aria-label="Close navigation backdrop"
              className="flex-1 cursor-default"
              onClick={() => setDrawerOpen(false)}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <nav aria-label="Mission Control" className="flex-1 px-4 pb-4 overflow-y-auto">
      <NavGroups items={items} pathname={pathname} />
    </nav>
  );
}