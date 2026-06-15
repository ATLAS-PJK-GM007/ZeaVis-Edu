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
  // Lazy-import Tauri opener only in Tauri context
  const { openUrl: tauriOpenUrl } = await import('@tauri-apps/plugin-opener');
  await tauriOpenUrl(url);
}
