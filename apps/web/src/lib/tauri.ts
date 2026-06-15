/**
 * Lightweight Tauri environment detection and utilities.
 * Uses raw __TAURI_INTERNALS__ IPC to avoid bundling/import issues on Android.
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
    // Not in Tauri — normal browser navigation
    window.location.href = url;
    return;
  }
  try {
    const invoke = tauriInvoke();
    await invoke('plugin:opener|open_url', { url });
  } catch (err) {
    console.error('Tauri openUrl failed, trying fallback:', err);
    // Fallback: navigate the WebView (Google will block, but best effort)
    window.location.href = url;
  }
}

function processDeepLinkUrl(url: string): void {
  try {
    const u = new URL(url);
    const target = u.pathname + u.search + u.hash;
    if (target && target !== '/') {
      window.location.href = target;
      return;
    }
  } catch { /* fall through */ }

  // Fallback: handle both :// and :/ custom schemes
  let match = url.match(/^[^:]+:\/\/(?:[^/]+)?(\/.*)?$/);
  if (!match) match = url.match(/^[^:]+:\/(\/.*)?$/);
  if (match?.[1]) window.location.href = match[1];
}

export async function setupDeepLinkHandler(): Promise<void> {
  if (!isTauri()) return;

  try {
    const invoke = tauriInvoke();

    // Cold-start: app just opened via intent:// or custom scheme
    invoke('plugin:deep-link|get_current')
      .then((urls: any) => {
        if (urls?.[0]) processDeepLinkUrl(urls[0]);
      })
      .catch(() => { /* plugin may not be registered yet */ });

    // Warm-start: listen for new URLs while app is running
    const { listen } = await import('@tauri-apps/api/event');
    listen('deep-link://new-url', (event: any) => {
      const urls = event.payload as string[];
      for (const url of urls) processDeepLinkUrl(url);
    });
  } catch (err) {
    console.error('Tauri deep-link setup failed:', err);
  }
}
