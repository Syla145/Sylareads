/**
 * Content Security Policy for the built page (set as <meta> by vite.config.ts;
 * GitHub Pages allows no own HTTP headers). A second belt: even if a bug ever
 * let foreign text become code, the browser would only run scripts from this
 * site and talk only to this site and Google (sign-in, Firestore).
 *
 * - styles: 'unsafe-inline' because React sets style attributes (widths of bars);
 *   scripts stay strict.
 * - Google sign-in: script from apis.google.com, a hidden frame on the Firebase
 *   auth domain, requests to *.googleapis.com.
 */
export function contentSecurityPolicy(authDomain?: string): string {
  const frames = ["'self'", 'https://accounts.google.com', ...(authDomain ? [`https://${authDomain}`] : [])];
  const rules: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", 'https://apis.google.com'],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'", 'https://*.googleapis.com', 'https://apis.google.com'],
    'frame-src': frames,
    'worker-src': ["'self'"],
    'manifest-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  };
  return Object.entries(rules)
    .map(([k, v]) => `${k} ${v.join(' ')}`)
    .join('; ');
}
