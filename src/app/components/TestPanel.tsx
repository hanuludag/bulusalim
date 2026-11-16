// Test paneli: sadece geliştirme modunda (npm run dev). Tasarım dışı geliştirici aracı; metinleri bilerek copy.ts'te değil.
import { useEffect, useState } from 'react';
import { useMatch, useNavigate } from 'react-router-dom';
import { device, isOnline, localStore, store } from '../runtime';
import { DEMO_NAMES, DEMO_ROOM_NAME, seedDemo, type DemoKind } from '../demo';
import { SLOTS } from '../slots';
import type { Member, RoomSnapshot } from '../types';
import { todayString } from '../../core/format';
import { roomDays } from '../days';
import { findByName } from '../../core/names';
import { Sheet } from '../../core/components/Sheet';
import { ConfirmDialog } from '../../core/components/ConfirmDialog';
import './TestPanel.css';

export default function TestPanel() {
  const navigate = useNavigate();
  const roomId = useMatch('/r/:roomId/*')?.params.roomId ?? null;
  const [open, setOpen] = useState(false);
  const [snap, setSnap] = useState<RoomSnapshot | null>(null);
  const [latency, setLatency] = useState(localStore?.getLatency() ?? false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!open || !roomId) return;
    const load = () => void store.getRoom(roomId).then(setSnap).catch(() => setSnap(null));
    load();
    return store.subscribe(roomId, load);
  }, [open, roomId]);

  const currentId = roomId ? device.getMemberId(roomId) : null;
  const say = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(''), 2500);
  };

  function become(m: Member | null) {
    if (!roomId) return;
    if (m) device.actAs(roomId, m.id);
    else device.actAsNobody(roomId);
    window.location.assign(`/r/${roomId}`);
  }

  async function addFake() {
    if (!roomId || !snap) return;
    const name = DEMO_NAMES.find((n) => !findByName(snap.members, n));
    if (!name) return say('Havuzdaki bütün isimler odada.');
    await store.joinRoom(roomId, name);
    say(`${name} eklendi.`);
  }

  async function randomAnswers() {
    if (!roomId || !snap) return;
    say('Çalışıyor…');
    const others = snap.members.filter((m) => m.id !== currentId);
    const days = roomDays(snap.room);
    // Önce eski cevapları temizle
    await Promise.allSettled([
      ...snap.votes.filter((v) => v.memberId !== currentId).map((v) => store.setVote({ roomId, memberId: v.memberId, ideaId: v.ideaId, value: null })),
      ...snap.availability.filter((a) => a.memberId !== currentId).map((a) => store.toggleAvailability({ roomId, memberId: a.memberId, day: a.day, slot: a.slot })),
    ]);
    const jobs: Promise<unknown>[] = [];
    others.forEach((m, idx) => {
      if (idx % 3 === 2) return; // her 3 kişiden biri bilerek boş kalır → "eksik sonuç"
      snap.ideas.forEach((idea) => {
        const r = Math.random();
        if (r < 0.2) return;
        jobs.push(store.setVote({ roomId, memberId: m.id, ideaId: idea.id, value: r < 0.7 ? 'yes' : 'no' }));
      });
      days.forEach((day) => SLOTS.forEach((slot) => Math.random() < 0.35 && jobs.push(store.toggleAvailability({ roomId, memberId: m.id, day, slot }))));
    });
    await Promise.allSettled(jobs);
    say('Rastgele cevaplar yazıldı.');
  }

  async function demo(kind: DemoKind) {
    say('Demo oda kuruluyor…');
    try {
      const { roomId: id, meId } = await seedDemo(store, kind, todayString());
      device.bindMember(id, meId);
      device.setLastRoom({ id, name: DEMO_ROOM_NAME });
      setOpen(false);
      navigate(`/r/${id}/sonuc`);
    } catch (e) {
      console.error(e);
      say('Demo oda kurulamadı.');
    }
  }

  async function resetAll() {
    setConfirmReset(false);
    await store.resetAll();
    device.clearAll();
    window.location.assign('/');
  }

  const kb = localStore ? Math.round(localStore.usedBytes() / 1024) : null;

  return (
    <>
      <button className="tp-fab" type="button" onClick={() => setOpen(true)}>
        test
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} label="Test paneli">
        <h2 className="h2">Test paneli · {isOnline ? 'çevrimiçi (Supabase)' : 'çevrimdışı (localStorage)'}</h2>
        {roomId && snap ? (
          <div className="tp-group">
            <p className="sec s13">Bu sekmede kim olayım?</p>
            <div className="tp-row">
              {snap.members.map((m) => (
                <button key={m.id} type="button" className="btn2 sm" aria-pressed={m.id === currentId} onClick={() => become(m)}>
                  {m.name}
                </button>
              ))}
              <button type="button" className="btn2 sm" aria-pressed={currentId === null} onClick={() => become(null)}>
                Kimse (Katıl ekranı)
              </button>
            </div>
            <div className="tp-row">
              <button type="button" className="btn2 sm" onClick={() => void addFake()}>Sahte üye ekle</button>
              <button type="button" className="btn2 sm" onClick={() => void randomAnswers()}>Diğerlerine rastgele cevap</button>
            </div>
          </div>
        ) : (
          <p className="sec s13">Oda işlevleri için bir odaya gir.</p>
        )}
        <div className="tp-group">
          <div className="tp-row">
            <button type="button" className="btn2 sm" onClick={() => void demo('eksik')}>Demo oda (eksik)</button>
            <button type="button" className="btn2 sm" onClick={() => void demo('kesin')}>Demo oda (kesin)</button>
          </div>
          <div className="tp-row">
            {localStore && (
              <button
                type="button"
                className="btn2 sm"
                aria-pressed={latency}
                onClick={() => {
                  localStore?.setLatency(!latency);
                  setLatency(!latency);
                }}
              >
                Yapay gecikme: {latency ? 'açık' : 'kapalı'}
              </button>
            )}
            <button type="button" className="btn2 sm" onClick={() => setConfirmReset(true)}>
              {isOnline ? 'Bu cihazın kayıtlarını sil' : 'Her şeyi sil'}
            </button>
          </div>
        </div>
        {msg && <p className="s13 b" role="status">{msg}</p>}
        {kb !== null && <p className="sec s13 mono">localStorage: ~{kb} KB / ~5000 KB</p>}
      </Sheet>
      <ConfirmDialog
        open={confirmReset}
        title={isOnline ? 'Bu cihazın kayıtları silinsin mi?' : 'Bütün veriler silinsin mi?'}
        body={isOnline ? 'Bu tarayıcı hangi odalarda kim olduğunu unutur. Sunucudaki odalar silinmez.' : 'Odalar ve bu tarayıcıdaki bütün kayıtlar silinir.'}
        confirmLabel="Sil"
        cancelLabel="Vazgeç"
        onConfirm={() => void resetAll()}
        onCancel={() => setConfirmReset(false)}
      />
    </>
  );
}
