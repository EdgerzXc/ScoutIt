"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Client-side sidebar navigation: the active highlight updates the INSTANT a
// link is clicked (usePathname), independent of how long the target page's
// server queries take — paired with dashboard/loading.js this makes
// navigation feel immediate.
//
// `items` come pre-resolved (tier-filtered) from the server layout as
// [{ name, href, icon }] where `icon` is a PRE-RENDERED element — never a
// component/function reference, which cannot cross the RSC boundary.
export default function SidebarNav({ items }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
      {items.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.name}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              isActive
                ? "bg-[rgba(232,174,60,0.10)] text-[#F7C64E] border border-[rgba(232,174,60,0.25)]"
                : "text-white/70 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            {item.icon}
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
