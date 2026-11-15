import { beforeEach, describe, expect, it } from 'vitest';
import { createDevice } from './device';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('device', () => {
  it('üyeyi hatırlar, ipuçlarını günceller', () => {
    const d = createDevice('bs');
    expect(d.getMemberId('r')).toBeNull();
    d.bindMember('r', 'm1');
    expect(d.getMemberId('r')).toBe('m1');
    d.updateRoomState('r', { hints: { rating: true } });
    expect(d.getRoomState('r')?.hints).toEqual({ rating: true, gridHold: false });
    expect(localStorage.getItem('bs:room:r')).toContain('m1');
  });
  it('sekmeye özel test kimliği önce gelir', () => {
    const d = createDevice('bs');
    d.bindMember('r', 'm1');
    d.actAs('r', 'm2');
    expect(d.getMemberId('r')).toBe('m2');
    d.updateRoomState('r', { guideDone: true });
    expect(d.getRoomState('r')?.guideDone).toBe(true);
    // cihazın kendi kaydı etkilenmedi
    expect(JSON.parse(localStorage.getItem('bs:room:r')!).guideDone).toBe(false);
    d.actAs('r', null);
    expect(d.getMemberId('r')).toBe('m1');
  });
  it('kimliksiz sekme Katıl görür, katılınca bağlama sadece o sekmede kalır', () => {
    const d = createDevice('bs');
    d.bindMember('r', 'm1');
    d.actAsNobody('r');
    expect(d.getMemberId('r')).toBeNull();
    d.bindMember('r', 'm9');
    expect(d.getMemberId('r')).toBe('m9');
    expect(JSON.parse(localStorage.getItem('bs:room:r')!).memberId).toBe('m1');
  });
  it('önek ile ayrışır ve temizlenir', () => {
    const a = createDevice('bs');
    const b = createDevice('oo');
    a.setLastName('Emirhan');
    b.setLastName('Kaan');
    expect(a.getLastName()).toBe('Emirhan');
    a.clearAll();
    expect(a.getLastName()).toBe('');
    expect(b.getLastName()).toBe('Kaan');
  });
});
