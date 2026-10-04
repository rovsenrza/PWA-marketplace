/**
 * Bridge from modules to legacy code: publishes module functions (and constants) as globals, because inline
 * handlers in the markup (onclick="…") and the remaining classic scripts call them by name.
 * Once a domain moves to data-action handlers, its line here goes away.
 *
 * Timing: modules run after the classic scripts (deferred), but before DOMContentLoaded
 * and window.onload. Expose only functions that nothing calls while the page is parsing.
 */
export function exposeToLegacy(api: Record<string, unknown>): void {
  for (const [name, fn] of Object.entries(api)) {
    const prev = window[name];
    if (prev !== undefined && prev !== fn) {
      console.warn(`[legacy bridge] global "${name}" is already defined, overwriting it`);
    }
    window[name] = fn;
  }
}
