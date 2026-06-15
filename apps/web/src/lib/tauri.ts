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
function processDeepLinkUrl(url: string): void {
  // url looks like: zeavisedu://login/login?token=xxx
  // We need to extract path+query and navigate the WebView there
  try {
    const u = new URL(url);
    const target = u.pathname + u.search + u.hash;
    if (target && target !== '/') {
      window.location.href = target;
      return;
    }
  } catch { /* try fallback below */ }

  // Fallback: handle both double-slash (://) and single-slash (:/) schemes
  let match = url.match(/^[^:]+:\/\/(?:[^/]+)?(\/.*)?$/);
  if (!match) {
    match = url.match(/^[^:]+:\/(\/.*)?$/);
  }
  if (match?.[1]) {
    window.location.href = match[1];
  }
}

export async function setupDeepLinkHandler(): Promise<void> {
  if (!isTauri()) return;

  const { onOpenUrl, getCurrent } = await import('@tauri-apps/plugin-deep-link');

  // Handle cold-start deep links (app opened via intent)
  getCurrent().then((urls) => {
    if (urls?.[0]) processDeepLinkUrl(urls[0]);
  }).catch(() => { /* ignore */ });

  // Handle warm-start deep links (app already running, new intent received)
  onOpenUrl((urls) => {
    for (const url of urls) {
      processDeepLinkUrl(url);
    }
  });
}
