"use client";

import { useActionState } from "react";
import { UploadCloud } from "lucide-react";
import { importPropertiesCsv } from "./actions";

export default function ImportForm() {
  const [state, formAction, isPending] = useActionState(importPropertiesCsv, null);

  return (
    <form action={formAction} className="space-y-4">
      <label className="flex flex-col items-center justify-center gap-2 border border-dashed border-white/15 rounded-xl py-10 cursor-pointer hover:border-white/30 transition-colors">
        <UploadCloud className="w-6 h-6 text-white/70" />
        <span className="text-sm text-white/60">Click to choose a .csv file</span>
        <input type="file" name="file" accept=".csv" required className="hidden" />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 bg-[#E8AE3C] text-black rounded-lg text-sm font-medium hover:bg-[#F7C64E] transition-colors disabled:opacity-50"
      >
        {isPending ? "Importing..." : "Import properties"}
      </button>

      {state && !state.success && (
        <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl p-4">
          {state.error}
        </div>
      )}

      {state && state.success && (
        <div className="text-sm text-white/70 bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
          <div>
            Imported <span className="text-[#E8AE3C]">{state.inserted}</span> of{" "}
            {state.totalRows} rows into the Review Queue as pending.
          </div>
          {state.failedRows.length > 0 && (
            <ul className="text-xs text-white/70 space-y-1">
              {state.failedRows.map((f) => (
                <li key={f.row}>
                  Row {f.row}: {f.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}
