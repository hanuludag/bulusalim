import { beforeEach, describe, expect, it } from 'vitest';
import { createDevice } from './device';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('device v2', () => {
  it('üyeyi hatırlar; kayıt sadece memberId', () => {
    const d = createDevice('bs');
    expect(d.getMemberId('r')).toBeNull();
    d.bindMember('r', 'm1');
    expect(d.getMemberId('r')).toBe('m1');
    expect(JSON.parse(localStorage.getItem('bs:room:r')!)).toEqual({ memberId: 'm1' });
  });
  it('eski biçimdeki kayıttan sadece memberId alınır', () => {
    localStorage.setItem('bs:room:r', JSON.stringify({ memberId: 'm7', guideDone: true, hints: {} }));
    expect(createDevice('bs').getMemberId('r')).toBe('m7');
  });
  it('sekmeye özel test kimliği', () => {
    const d = createDevice('bs');
    d.bindMember('r', 'm1');
    d.actAs('r', 'm2');
    expect(d.getMemberId('r')).toBe('m2');
    d.actAsNobody('r');
    expect(d.getMemberId('r')).toBeNull();
    d.bindMember('r', 'm9');
    expect(d.getMemberId('r')).toBe('m9');
    expect(JSON.parse(localStorage.getItem('bs:room:r')!).memberId).toBe('m1');
    d.actAs('r', null);
    expect(d.getMemberId('r')).toBe('m1');
  });
  it('önek ile ayrışır ve temizlenir', () => {
    const a = createDevice('bs');
    const b = createDevice('oo');
    a.setLastName('Emirhan');
    b.setLastName('Kaan');
    a.clearAll();
    expect(a.getLastName()).toBe('');
    expect(b.getLastName()).toBe('Kaan');
  });
});
