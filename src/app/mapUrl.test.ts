import { describe, expect, it } from 'vitest';
import { isValidMapUrl } from './mapUrl';

describe('harita linki', () => {
  it('boş geçerli (isteğe bağlı)', () => expect(isValidMapUrl('  ')).toBe(true));
  it('https ve http kabul', () => {
    expect(isValidMapUrl('https://maps.app.goo.gl/abc123')).toBe(true);
    expect(isValidMapUrl('http://maps.google.com/?q=moda')).toBe(true);
  });
  it('tehlikeli protokoller red', () => {
    expect(isValidMapUrl('javascript:alert(1)')).toBe(false);
    expect(isValidMapUrl('JavaScript:alert(1)')).toBe(false);
    expect(isValidMapUrl('data:text/html,<script>1</script>')).toBe(false);
    expect(isValidMapUrl('ftp://x.com')).toBe(false);
  });
  it('link olmayan metin red', () => {
    expect(isValidMapUrl('moda sahili')).toBe(false);
    expect(isValidMapUrl('maps.google.com')).toBe(false);
  });
});
