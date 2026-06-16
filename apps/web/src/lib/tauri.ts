/**
 * Lightweight Tauri environment detection and utilities.
 * Uses raw __TAURI_INTERNALS__ IPC to avoid bundling/import issues on Android.
 *
 * Deep-link flow (no full page reloads — uses React Router navigate()):
 *   1. Tauri deep-link plugin receives URL via intent/custom-scheme.
 *   2. processDeepLinkUrl stores the target path in sessionStorage +
 *      dispatches a custom DOM event.
 *   3. <DeepLinkRouterHandler /> inside <RouterProvider> picks it up and
 *      calls navigate(), keeping the React app alive.
 */

let _isTauri: boolean | null = null;

export function isTauri(): boolean {
  if (_isTauri !== null) return _isTauri;
  _isTauri =
    typeof window !== 'undefined' &&
    '__TAURI_INTERNALS__' in window;
  return _isTauri;
}

/** Get the Tauri IPC invoke function directly from the global internals. */
function tauriInvoke(): (cmd: string, args?: Record<string, unknown>) => Promise<unknown> {
  const T = (window as any).__TAURI_INTERNALS__;
  if (!T?.invoke) throw new Error('Tauri IPC not available');
  return T.invoke.bind(T);
}

export async function openUrl(url: string): Promise<void> {
  if (!isTauri()) {
    window.location.href = url;
    return;
  }
  try {
    const invoke = tauriInvoke();
    await invoke('plugin:opener|open_url', { url });
  } catch (err) {
    console.error('Tauri openUrl failed, trying fallback:', err);
    window.location.href = url;
  }
}

// ── Deep link handling (no full reload) ─────────────────────────────────

const DEEP_LINK_KEY = 'zeavis_pending_deeplink';
const DEEP_LINK_EVENT = 'zeavis:deeplink';

/** Store a target path for the React Router to pick up without page reload. */
function storeDeepLinkTarget(target: string): void {
  try { sessionStorage.setItem(DEEP_LINK_KEY, target); } catch { /* ignore */ }
}

/** Read and clear the stored deep link target. */
export function consumeDeepLinkTarget(): string | null {
  try {
    const v = sessionStorage.getItem(DEEP_LINK_KEY);
    if (v) sessionStorage.removeItem(DEEP_LINK_KEY);
    return v;
  } catch { return null; }
}


export async function setupDeepLinkHandler(): Promise<void> {
  if (!isTauri()) return;

  try {
    const invoke = tauriInvoke();

    // Cold-start: app opened via intent:// (e.g. from Google OAuth callback).
    // Use window.location.href for this (full page reload) — at cold start there
    // is no SPA state to lose, so redirecting via location.href avoids orphaned
    // IPC promises that cause "Cannot read properties of undefined (reading 'runCallback')".
    invoke('plugin:deep-link|get_current')
      .then((urls: any) => {
        if (!urls?.[0]) return;
        const target = extractDeepLinkTarget(urls[0]);
        if (target && target !== window.location.pathname + window.location.search + window.location.hash) {
          window.location.href = target;
        }
      })
      .catch(() => {});

    // Warm-start: listen for new URLs (already running app).
    // Use React Router navigate() here since we have SPA state.
    const { listen } = await import('@tauri-apps/api/event');
    listen('deep-link://new-url', (event: any) => {
      const urls = event.payload as string[];
      for (const url of urls) {
        const target = extractDeepLinkTarget(url);
        if (target) {
          storeDeepLinkTarget(target);
          window.dispatchEvent(new CustomEvent(DEEP_LINK_EVENT, { detail: target }));
        }
      }
    });
  } catch (err) {
    console.error('Tauri deep-link setup failed:', err);
  }
}

/** Extract path+query+hash from a deep-link URL. */
function extractDeepLinkTarget(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname + u.search + u.hash;
  } catch {
    let m = url.match(/^[^:]+:\/\/(?:[^/]+)?(\/.*)?$/);
    if (!m) m = url.match(/^[^:]+:\/(\/.*)?$/);
    return m?.[1] ?? '';
  }
}
