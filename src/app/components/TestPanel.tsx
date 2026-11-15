// Test paneli (§13): sadece geliştirme modunda (npm run dev) görünür.
// Tasarım dışı bir geliştirici aracıdır; metinleri bilerek copy.ts'te değil.
import { useEffect, useState } from 'react';
import { useMatch, useNavigate } from 'react-router-dom';
import { device, store } from '../runtime';
import { buildDemo, type DemoKind } from '../demo';
import { DEMO_NAMES } from '../demo';
import { SLOTS } from '../slots';
import type { Member, RoomSnapshot, Score } from '../types';
import { todayString, weekDays } from '../../core/format';
import { findByName } from '../../core/names';
import { Sheet } from '../../core/components/Sheet';
import { ConfirmDialog } from '../../core/components/ConfirmDialog';
import './TestPanel.css';

const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];

export default function TestPanel() {
  const navigate = useNavigate();
  const match = useMatch('/r/:roomId/*');
  const roomId = match?.params.roomId ?? null;
  const [open, setOpen] = useState(false);
  const [snap, setSnap] = useState<RoomSnapshot | null>(null);
  const [latency, setLatency] = useState(store.getLatency());
  const [confirmReset, setConfirmReset] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!open || !roomId) {
      setSnap(null);
      return;
    }
    const load = () => void store.getRoom(roomId).then(setSnap);
    load();
    return store.subscribe(roomId, load);
  }, [open, roomId]);

  const currentId = roomId ? device.getMemberId(roomId) : null;
  const say = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(''), 2500);
  };

  function becomeMember(m: Member | null) {
    if (!roomId) return;
    if (m) device.actAs(roomId, m.id);
    else device.actAsNobody(roomId);
    // Sayfayı yeniden yükle: sekmenin kimliği değişti
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
    const others = snap.members.filter((m) => m.id !== currentId);
    const days = weekDays(snap.room.startDate);
    await store._write(roomId, (db) => {
      others.forEach((m, idx) => {
        // eskileri temizle
        db.ratings = db.ratings.filter((r) => !(r.roomId === roomId && r.memberId === m.id));
        db.availability = db.availability.filter((a) => !(a.roomId === roomId && a.memberId === m.id));
        db.attendance = db.attendance.filter((a) => !(a.roomId === roomId && a.memberId === m.id));
        // Bazıları bilerek boş kalsın (her 3 kişiden biri) → "eksik sonuç" görülsün
        if (idx % 3 === 2) return;
        snap.ideas.forEach((idea) => {
          if (Math.random() < 0.15) return;
          const score = pick([2, 3, 3, 4, 4, 5, 5, Math.random() < 0.2 ? 1 : 4]) as Score;
          db.ratings.push({ roomId, memberId: m.id, ideaId: idea.id, score, updatedAt: Date.now() });
        });
        days.forEach((day) =>
          SLOTS.forEach((slot) => {
            if (Math.random() < 0.3) db.availability.push({ roomId, memberId: m.id, day, slot });
          }),
        );
        const r = Math.random();
        if (r < 0.6) db.attendance.push({ roomId, memberId: m.id, status: 'yes' });
        else if (r < 0.8) db.attendance.push({ roomId, memberId: m.id, status: 'no' });
      });
    });
    say('Rastgele cevaplar yazıldı.');
  }

  async function demo(kind: DemoKind) {
    const data = buildDemo(kind, todayString(), () => crypto.randomUUID(), Date.now());
    await store._write(data.room.id, (db) => {
      db.rooms.push(data.room);
      db.members.push(...data.members);
      db.ideas.push(...data.ideas);
      db.ratings.push(...data.ratings);
      db.availability.push(...data.availability);
      db.attendance.push(...data.attendance);
      db.items.push(...data.items);
    });
    const emirhan = data.members[0];
    device.bindMember(data.room.id, emirhan.id);
    device.updateRoomState(data.room.id, { guideDone: true, hints: { rating: true, gridHold: true } });
    device.setLastRoom({ id: data.room.id, name: data.room.name });
    setOpen(false);
    navigate(`/r/${data.room.id}/sonuc`);
  }

  function resetGuide() {
    if (!roomId) return;
    device.resetGuide(roomId);
    window.location.assign(`/r/${roomId}`);
  }

  async function resetAll() {
    setConfirmReset(false);
    await store.resetAll();
    device.clearAll();
    setOpen(false);
    window.location.assign('/');
  }

  const kb = Math.round(store.usedBytes() / 1024);

  return (
    <>
      <button className="tp-fab" type="button" onClick={() => setOpen(true)}>
        test
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} label="Test paneli">
        <h2 className="h2">Test paneli</h2>
        {roomId && snap ? (
          <div className="tp-group">
            <p className="sec s13">Bu sekmede kim olayım?</p>
            <div className="tp-people">
              {snap.members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="btn2 sm"
                  aria-pressed={m.id === currentId}
                  onClick={() => becomeMember(m)}
                >
                  {m.name}
                </button>
              ))}
              <button type="button" className="btn2 sm" aria-pressed={currentId === null} onClick={() => becomeMember(null)}>
                Kimse (Katıl ekranı)
              </button>
            </div>
            <div className="tp-row">
              <button type="button" className="btn2 sm" onClick={() => void addFake()}>
                Sahte üye ekle
              </button>
              <button type="button" className="btn2 sm" onClick={() => void randomAnswers()}>
                Diğerlerine rastgele cevap
              </button>
              <button type="button" className="btn2 sm" onClick={resetGuide}>
                Rehber ve ipuçlarını sıfırla
              </button>
            </div>
          </div>
        ) : (
          <p className="sec s13">Oda işlevleri için bir odaya gir.</p>
        )}
        <div className="tp-group">
          <div className="tp-row">
            <button type="button" className="btn2 sm" onClick={() => void demo('eksik')}>
              Demo oda (eksik)
            </button>
            <button type="button" className="btn2 sm" onClick={() => void demo('kesin')}>
              Demo oda (kesin)
            </button>
          </div>
          <div className="tp-row">
            <button
              type="button"
              className="btn2 sm"
              aria-pressed={latency}
              onClick={() => {
                store.setLatency(!latency);
                setLatency(!latency);
              }}
            >
              Yapay gecikme: {latency ? 'açık' : 'kapalı'}
            </button>
            <button type="button" className="btn2 sm" onClick={() => setConfirmReset(true)}>
              Her şeyi sil
            </button>
          </div>
        </div>
        {msg && (
          <p className="s13 b" role="status">
            {msg}
          </p>
        )}
        <p className="sec s13 mono">localStorage: ~{kb} KB / ~5000 KB</p>
      </Sheet>
      <ConfirmDialog
        open={confirmReset}
        title="Bütün veriler silinsin mi?"
        body="Odalar, üyeler ve bu tarayıcıdaki bütün kayıtlar silinir."
        confirmLabel="Sil"
        cancelLabel="Vazgeç"
        onConfirm={() => void resetAll()}
        onCancel={() => setConfirmReset(false)}
      />
    </>
  );
}
