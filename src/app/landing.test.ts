import { describe, expect, it } from 'vitest';
import { landingTab } from './landing';
import { addIdea, free, makeSnap, rate } from './testHelpers';

describe('landingTab', () => {
  it('hiç girdi yok → fikirler', () => {
    expect(landingTab(makeSnap(['A']), 'm0')).toBe('fikirler');
  });
  it('puan var, saat yok → zaman', () => {
    const s = makeSnap(['A']);
    addIdea(s, 'a', 1);
    rate(s, 'm0', 'a', 4);
    expect(landingTab(s, 'm0')).toBe('zaman');
  });
  it('ikisi de var → sonuç', () => {
    const s = makeSnap(['A']);
    addIdea(s, 'a', 1);
    rate(s, 'm0', 'a', 4);
    free(s, 'm0', '2026-11-14', 'ogle');
    expect(landingTab(s, 'm0')).toBe('sonuc');
  });
  it('kaldırılmış puan (null) sayılmaz', () => {
    const s = makeSnap(['A']);
    addIdea(s, 'a', 1);
    rate(s, 'm0', 'a', null);
    expect(landingTab(s, 'm0')).toBe('fikirler');
  });
  it('başkasının girdisi beni etkilemez', () => {
    const s = makeSnap(['A', 'B']);
    addIdea(s, 'a', 1);
    rate(s, 'm1', 'a', 4);
    free(s, 'm1', '2026-11-14', 'ogle');
    expect(landingTab(s, 'm0')).toBe('fikirler');
  });
});
