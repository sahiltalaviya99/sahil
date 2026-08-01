import { Component, type ErrorInfo, type ReactNode } from 'react';

import { site } from '@/content/site';

/**
 * Last line of defence around the whole app.
 *
 * Without one of these, a single throw anywhere in the tree — including inside
 * a `useEffect`, which runs after a successful render — makes React unmount the
 * entire root. The visitor gets a white page and the only clue is in a console
 * they will never open.
 *
 * A blank site is the worst possible failure mode for a portfolio, so this
 * trades it for a legible one: the visitor still sees who this is and how to
 * make contact, and in dev the actual error is on screen instead of guessed at.
 *
 * Class component because error boundaries have no hooks equivalent — this is
 * the one place React still requires one.
 */
type Props = {
  children: ReactNode;
  /**
   * Change this to clear a caught error and try rendering again.
   *
   * The instance mounted inside the router passes the pathname, so a throw on
   * one route stops poisoning the others. Without it, a boundary that catches
   * once keeps showing the fallback for the life of the mount — and since the
   * outermost one sits above `<Routes>`, a transient failure on /lab makes the
   * home page look broken too, which is exactly how this read as "it's on all
   * the pages".
   */
  resetKey?: string;
};
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[portfolio] uncaught error', error, info.componentStack);
    // A component may have locked scrolling on the way down (the preloader
    // does). Hand it back, or the fallback itself would be unusable.
    document.body.style.overflow = '';
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-[100svh] flex-col items-center justify-center gap-6 bg-background px-6 text-center">
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.25em] text-primary">
          Something broke
        </p>

        <h1 className="max-w-lg font-display text-[clamp(1.6rem,6vw,2.6rem)] font-bold leading-tight tracking-tight text-foreground">
          This page hit an error while loading.
        </h1>

        <p className="max-w-md text-muted-foreground">
          That&apos;s on me, not on you. Reloading usually clears it — and my inbox works
          regardless.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button onClick={() => window.location.reload()} className="btn-primary">
            Reload the page
          </button>
          {/* A full navigation, not a router Link: if the failure was a stale
              or missing chunk, client-side routing would try to load it again
              and land straight back here. */}
          <a href="/" className="btn-ghost">
            Back to the start
          </a>
          <a href={`mailto:${site.email}`} className="btn-ghost">
            Email me instead
          </a>
        </div>

        {import.meta.env.DEV && (
          <pre className="mt-4 max-h-64 max-w-2xl overflow-auto rounded-xl border border-border bg-surface p-4 text-left font-mono text-[0.7rem] leading-relaxed text-muted-foreground">
            {error.message}
            {error.stack ? `\n\n${error.stack}` : ''}
          </pre>
        )}
      </div>
    );
  }
}
