"use client";

import { useActionState } from "react";
import { askBrain } from "./actions";
import { Sparkles, Search, FileText, Loader2 } from "lucide-react";

// Client island for the Brain Q&A. Uses useActionState so the server action
// can return an answer + sources without a page navigation. The rest of the
// Brain page (ingest form, document list) stays a Server Component.
export default function BrainSearch({ aiAvailable }) {
  const [state, formAction, isPending] = useActionState(askBrain, null);

  return (
    <div className="space-y-4">
      <form action={formAction} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            name="question"
            required
            placeholder={
              aiAvailable
                ? "Ask anything… e.g. What's our playbook when an owner can't upload a commercial property?"
                : "Search the knowledge base by keyword…"
            }
            className="w-full bg-black/50 border border-white/10 rounded-lg pl-9 pr-3 py-3 text-sm text-white placeholder:text-white/25 focus:border-[rgba(232,174,60,0.4)] outline-none"
          />
        </div>
        <button
          disabled={isPending}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-medium bg-[rgba(232,174,60,0.12)] hover:bg-[rgba(232,174,60,0.20)] text-[#F7C64E] border border-[rgba(232,174,60,0.25)] transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Thinking…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Ask
            </>
          )}
        </button>
      </form>

      {state?.error && (
        <div className="text-xs text-red-400/80 bg-red-400/5 border border-red-400/20 rounded-xl p-4">
          {state.error}
        </div>
      )}

      {state?.empty && (
        <div className="text-sm text-white/50 bg-white/5 border border-white/10 rounded-xl p-5">
          Nothing in the Brain matches that yet. Add the relevant playbook or SOP below and ask again.
        </div>
      )}

      {state?.answer && (
        <div className="bg-[#121212] border border-[rgba(232,174,60,0.20)] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-[#E8AE3C]" />
            <span className="text-[10px] uppercase tracking-wide text-[#E8AE3C]">Brain answer</span>
          </div>
          <p className="text-sm text-white/85 whitespace-pre-wrap leading-relaxed">{state.answer}</p>
        </div>
      )}

      {state?.sources?.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-wide text-white/40 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" />
            {state.answer ? "Sources" : "Top matches"}
            {!state.aiAvailable && (
              <span className="text-white/25 normal-case tracking-normal">
                · keyword mode (add GEMINI_API_KEY for AI answers)
              </span>
            )}
          </div>
          {state.sources.map((s) => (
            <div key={s.id} className="bg-[#121212] border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-white/90 truncate">{s.title}</span>
                {typeof s.similarity === "number" && (
                  <span className="text-[10px] font-mono text-[#E8AE3C]/70">
                    {(s.similarity * 100).toFixed(0)}%
                  </span>
                )}
              </div>
              <p className="text-xs text-white/55 leading-relaxed">{s.snippet}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
