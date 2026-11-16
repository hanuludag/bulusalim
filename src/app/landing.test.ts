import { describe, expect, it } from 'vitest';
import { landingScreen } from './landing';
import { addIdea, free, makeSnap, vote } from './testHelpers';

describe('landingScreen', () => {
  it('cevap yok → fikirler', () => expect(landingScreen(makeSnap(['A']), 'm0')).toBe('fikirler'));
  it('sadece saat var → fikirler', () => {
    const s = makeSnap(['A']);
    free(s, 'm0', '2026-11-14', 'gunduz');
    expect(landingScreen(s, 'm0')).toBe('fikirler');
  });
  it('cevap var saat yok → zaman (no da sayılır)', () => {
    const s = makeSnap(['A']);
    addIdea(s, 'a', 1);
    vote(s, 'm0', 'a', 'no');
    expect(landingScreen(s, 'm0')).toBe('zaman');
  });
  it('ikisi de var → sonuç', () => {
    const s = makeSnap(['A']);
    addIdea(s, 'a', 1);
    vote(s, 'm0', 'a', 'yes');
    free(s, 'm0', '2026-11-14', 'aksam');
    expect(landingScreen(s, 'm0')).toBe('sonuc');
  });
  it('başkasının cevabı beni etkilemez', () => {
    const s = makeSnap(['A', 'B']);
    addIdea(s, 'a', 1);
    vote(s, 'm1', 'a', 'yes');
    expect(landingScreen(s, 'm0')).toBe('fikirler');
  });
});
