/**
 * Lightweight Tauri environment detection and utilities.
 * Avoids importing @tauri-apps/api at module level so the web build
 * doesn't bundle Tauri internals.
 */

let _isTauri: boolean | null = null;

export function isTauri(): boolean {
  if (_isTauri !== null) return _isTauri;
  _isTauri =
    typeof window !== 'undefined' &&
    '__TAURI_INTERNALS__' in window;
  return _isTauri;
}

export async function openUrl(url: string): Promise<void> {
  if (!isTauri()) {
    window.location.href = url;
    return;
  }
  const { openUrl: tauriOpenUrl } = await import('@tauri-apps/plugin-opener');
  await tauriOpenUrl(url);
}

/**
 * Listen for deep link URLs when the app is opened from an external link.
 * On Android, after Google OAuth completes in the system browser, the
 * callback page redirects to zeavisedu://... which triggers this listener.
 * We extract the path + query and navigate the WebView there.
 */
export async function setupDeepLinkHandler(): Promise<void> {
  if (!isTauri()) return;

  const { onOpenUrl } = await import('@tauri-apps/plugin-deep-link');
  onOpenUrl((urls) => {
    for (const url of urls) {
      // url looks like: zeavisedu://zeavisedu.asepharyana.my.id/login?token=xxx
      // Extract path + query after the host
      try {
        const u = new URL(url);
        const target = u.pathname + u.search + u.hash;
        if (target && target !== '/') {
          window.location.href = target;
        }
      } catch {
        // If URL parsing fails, try to extract everything after the scheme
        const match = url.match(/^[^:]+:\/\/(?:[^/]+)?(\/.*)?$/);
        if (match?.[1]) {
          window.location.href = match[1];
        }
      }
    }
  });
}
