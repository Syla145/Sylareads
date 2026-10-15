import { describe, expect, it } from 'vitest';
import { contentSecurityPolicy } from './csp';

describe('content security policy', () => {
  it('allows scripts only from this site and Google sign-in, frames on the auth domain', () => {
    const csp = contentSecurityPolicy('example.firebaseapp.com');
    expect(csp).toContain("script-src 'self' https://apis.google.com;");
    expect(csp).not.toMatch(/script-src[^;]*unsafe/);
    expect(csp).toContain('https://example.firebaseapp.com');
    expect(csp).toContain("object-src 'none'");
  });
});
