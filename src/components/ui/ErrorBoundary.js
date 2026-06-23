"use client";

import { Component } from "react";
import { reportError } from "@/lib/reportError";

/**
 * Global crash catcher. If any child component throws during render, this shows a
 * calm fallback instead of a broken screen, and logs the crash to Supabase so we
 * see it. Must be a class component (React has no functional error boundary yet).
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    this.setState({ errorMessage: error?.message || String(error), errorStack: error?.stack });
    reportError({
      kind: "crash",
      message: error?.message || String(error),
      stack: `${error?.stack || ""}\n--- component stack ---${info?.componentStack || ""}`,
    });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-background text-text-primary flex flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl mb-6">🛸</div>
        <h1 className="font-headline-editorial text-3xl md:text-4xl text-on-surface mb-3">
          Something went sideways.
        </h1>
        <p className="text-text-secondary max-w-md mb-8">
          This screen hit a snag — and our team has automatically been notified. Try reloading;
          if it keeps happening, use “Report a problem.”
        </p>
        <div className="bg-error/10 text-error p-4 text-left font-mono text-xs w-full max-w-4xl overflow-auto mb-6">
          <p className="font-bold">{this.state.errorMessage}</p>
          <pre>{this.state.errorStack}</pre>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            className="bg-gold-accent text-background font-working-title font-bold px-6 py-3 rounded hover:opacity-90 transition-opacity"
            onClick={() => { if (typeof window !== "undefined") window.location.reload(); }}
          >
            Reload
          </button>
          <a
            href="/"
            className="border border-surface-variant text-on-surface font-working-title font-bold px-6 py-3 rounded hover:border-gold-accent transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }
}
