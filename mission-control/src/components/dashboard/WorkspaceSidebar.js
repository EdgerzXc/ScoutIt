"use client";

import { Menu, X } from "lucide-react";
import { useId, useRef, useState } from "react";

export default function WorkspaceSidebar({ children }) {
  const [open, setOpen] = useState(false);
  const toggle = useRef(null);
  const panelId = useId();

  function closeWithKeyboard(event) {
    if (event.key !== "Escape" || !open) return;
    setOpen(false);
    toggle.current?.focus();
  }

  return (
    <div className="shrink-0 border-b border-line bg-surface lg:flex lg:w-64 lg:border-b-0 lg:border-r"
      onKeyDown={closeWithKeyboard}>
      <div className="flex items-center justify-between px-4 lg:hidden">
        <span className="font-semibold tracking-tight">Mission Control</span>
        <button type="button" ref={toggle} aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(!open)}
          className="inline-flex min-h-12 items-center gap-2 rounded px-2 text-sm text-gold focus-visible:outline-2 focus-visible:outline-gold">
          {open ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
          Menu
        </button>
      </div>
      <aside id={panelId} aria-label="Mission Control sidebar"
        className={`${open ? "flex" : "hidden"} max-h-[62dvh] min-h-0 min-w-0 flex-1 flex-col overflow-y-auto lg:flex lg:max-h-none`}
        onClick={(event) => {
          if (event.target instanceof Element && event.target.closest("nav a[href]")) setOpen(false);
        }}>
        {children}
      </aside>
    </div>
  );
}
