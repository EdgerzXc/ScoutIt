"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

// Items are tier-filtered by the server layout before crossing the RSC boundary.
export default function SidebarNav({ items }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Mission Control" className="flex-1 px-4 pb-4 overflow-y-auto">
      {items.map((item, index) => {
        const isActive = item.href === "/dashboard"
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
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
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
      })}
    </nav>
  );
}