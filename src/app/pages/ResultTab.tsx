// Sonuç sekmesi (§6, §27): kazanan, durum, katılım, getirilecekler, yeni plan, sıralama, en iyi zamanlar.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { copy } from '../copy';
import { device, store } from '../runtime';
import { computeResult } from '../result';
import { slotLower } from '../slots';
import { remindText, resultText, waitingNames, firstShareText } from '../share';
import { ItemTakenError } from '../store';
import type { Item, RoomSnapshot } from '../types';
import { formatAvg, formatDate, formatRatio, joinNames, withSuffix } from '../../core/format';
import { shareToWhatsApp } from '../../core/share';
import { useToast } from '../../core/useToast';
import { ShareIcon } from '../../core/components/Icons';
import { WinnerBlock } from '../components/WinnerBlock';
import { AttendanceSwitch } from '../components/AttendanceSwitch';
import { BringList } from '../components/BringList';
import { NewPlanSheet } from '../components/NewPlanSheet';
import type { RoomCtx } from './roomCtx';
import './ResultTab.css';

export default function ResultTab({ ctx }: { ctx: RoomCtx }) {
  const { snap, me, dev, updateDev, mutate, goTab, link, refresh } = ctx;
  const navigate = useNavigate();
  const toast = useToast();
  const result = useMemo(() => computeResult(snap), [snap]);
  const [planOpen, setPlanOpen] = useState(false);

  // Kesin sonuç anı: bu cihazda ilk kez görülünce bir kez kayarak gelsin
  const [animate] = useState(() => result.isFinal && !dev.finalSeen);
  const marked = useRef(false);
  useEffect(() => {
    if (result.isFinal && !dev.finalSeen && !marked.current) {
      marked.current = true;
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (!reduce && typeof navigator.vibrate === 'function') navigator.vibrate(30);
      updateDev({ finalSeen: true });
    }
  }, [result.isFinal, dev.finalSeen, updateDev]);

  // Getirilecekler: kesin sonuç ilk kez çıkınca şablon maddeleri bir kez eklenir
  const winnerSuggestion = result.winnerIdea?.suggestionId ?? null;
  useEffect(() => {
    if (result.isFinal && !snap.room.itemsSeeded) {
      void store.seedItemsIfNeeded(snap.room.id, winnerSuggestion).catch((e) => console.error('[bulusalim] Maddeler eklenemedi', e));
    }
  }, [result.isFinal, snap.room.itemsSeeded, snap.room.id, winnerSuggestion]);

  const nameOf = (id: string) => snap.members.find((m) => m.id === id)?.name ?? '';
  const myAttendance = snap.attendance.find((a) => a.memberId === me.id)?.status ?? null;

  function setAttendance(v: 'yes' | 'no') {
    const status = myAttendance === v ? null : v; // aynı düğmeye tekrar basmak seçimi kaldırır
    const apply = (s: RoomSnapshot): RoomSnapshot => ({
      ...s,
      attendance: [
        ...s.attendance.filter((a) => a.memberId !== me.id),
        ...(status ? [{ roomId: s.room.id, memberId: me.id, status }] : []),
      ],
    });
    void mutate(apply, () => store.setAttendance({ roomId: snap.room.id, memberId: me.id, status }));
  }

  function claim(item: Item, take: boolean) {
    const memberId = take ? me.id : null;
    const apply = (s: RoomSnapshot): RoomSnapshot => ({
      ...s,
      items: s.items.map((i) => (i.id === item.id ? { ...i, claimedBy: memberId } : i)),
    });
    void mutate(apply, async () => {
      try {
        await store.claimItem(item.id, memberId);
      } catch (e) {
        if (e instanceof ItemTakenError) console.warn('[bulusalim] Madde başkası tarafından alınmış');
        throw e;
      }
    });
  }

  async function addItem(name: string): Promise<boolean> {
    try {
      await store.addItem(snap.room.id, { name, createdBy: me.id });
      await refresh();
      return true;
    } catch {
      toast.show(copy.common.saveFailed);
      return false;
    }
  }

  async function createPlan(name: string) {
    try {
      const { room, me: newMe } = await store.createRoomFrom(snap.room.id, { name, creatorId: me.id });
      device.bindMember(room.id, newMe.id);
      device.setLastRoom({ id: room.id, name: room.name });
      setPlanOpen(false);
      navigate(`/r/${room.id}/hazir`);
    } catch {
      toast.show(copy.common.saveFailed);
    }
  }

  // Boş hâl: hiç cevap yok
  if (result.voters.length === 0) {
    return (
      <>
        <div className="grow" />
        <div className="pad">
          <div className="win neutral">
            <h2 className="h1">{copy.result.emptyTitle}</h2>
            <p className="s17 sec res-empty-sub">{copy.result.emptySub}</p>
          </div>
        </div>
        <div className="grow" />
        <div className="pad res-empty-actions">
          <button className="btn" type="button" onClick={() => goTab('fikirler')}>
            {copy.result.emptyRate}
          </button>
          <button className="tb sm" type="button" onClick={() => void shareToWhatsApp(firstShareText(snap.room.name, link))}>
            <ShareIcon size={16} />
            {copy.result.emptyShare}
          </button>
        </div>
      </>
    );
  }

  const allOut = snap.ideas.length > 0 && result.ideas.every((i) => i.eliminated);
  const noTime = result.bestSlot === null;
  const showWinner = !!result.winnerIdea || !noTime;
  // Ekranda tek ana buton: "Saat seç" ya da "Fikir ekle" varsa hatırlat/paylaş ikinci buton olur
  const otherPrimary = noTime || allOut;
  const statusBtnClass = otherPrimary ? 'btn2' : 'btn';

  return (
    <>
      {showWinner && (
        <section className="pad res-sec">
          <WinnerBlock result={result} animate={animate} />
        </section>
      )}

      {allOut && (
        <section className="pad res-sec">
          <div className="res-box">
            <p className="s17 m">{copy.result.allOut}</p>
            <button className="btn" type="button" onClick={() => goTab('fikirler')}>
              {copy.result.addIdea}
            </button>
          </div>
        </section>
      )}

      {noTime && (
        <section className="pad res-sec">
          <div className="res-box">
            <p className="s17 m">{copy.result.noTime}</p>
            {!allOut && (
              <button className="btn" type="button" onClick={() => goTab('zaman')}>
                {copy.result.pickTime}
              </button>
            )}
            {allOut && (
              <button className="btn2" type="button" onClick={() => goTab('zaman')}>
                {copy.result.pickTime}
              </button>
            )}
          </div>
        </section>
      )}

      <section className="pad res-status">
        {result.isFinal ? (
          <>
            <p>
              <span className="b">{copy.result.finalLead}</span> {copy.result.finalRest}
            </p>
            <button
              className={statusBtnClass}
              type="button"
              onClick={() => void shareToWhatsApp(resultText(snap, result, link))}
            >
              <ShareIcon size={20} />
              {copy.result.shareResult}
            </button>
          </>
        ) : (
          <>
            <p>{copy.result.partial(result.totalMembers, withSuffix(result.voters.length))}</p>
            <p className="sec">{copy.result.waiting(waitingNames(snap, result))}</p>
            <button className={statusBtnClass} type="button" onClick={() => void shareToWhatsApp(remindText(snap, result, link))}>
              {copy.result.remind}
            </button>
          </>
        )}
      </section>

      <section className="pad res-sec-lg">
        <AttendanceSwitch value={myAttendance} yes={result.attendance.yes} total={result.totalMembers} onChange={setAttendance} />
      </section>

      {result.isFinal && snap.room.itemsSeeded && (
        <section className="pad res-sec-xl">
          <BringList items={snap.items} members={snap.members} meId={me.id} onClaim={claim} onAdd={addItem} />
        </section>
      )}

      <section className="pad res-sec">
        <button className="btn2" type="button" onClick={() => setPlanOpen(true)}>
          {copy.result.newPlan}
        </button>
      </section>

      {result.ideas.length > 0 && (
        <section className="pad res-sec-xl" aria-labelledby="rank-title">
          <h2 id="rank-title" className="h2 section-title">
            {copy.result.rankingTitle}
          </h2>
          <ol>
            {(() => {
              let rank = 0;
              return result.ideas.map((r) => {
                const label = `${r.idea.name}${r.idea.place ? ` · ${r.idea.place}` : ''}`;
                if (r.eliminated) {
                  return (
                    <li key={r.idea.id} className="br rank-row">
                      <span className="mono sec rank-n">–</span>
                      <div className="rank-main">
                        <p className="strike">{label}</p>
                        <p className="s13 rank-veto">{copy.result.vetoBy(joinNames(r.vetoedBy.map(nameOf)))}</p>
                      </div>
                    </li>
                  );
                }
                rank += 1;
                return (
                  <li key={r.idea.id} className="br rank-row">
                    <span className="mono rank-n">{r.avg === null ? '–' : rank}</span>
                    <div className="rank-main">
                      <p className="b">
                        {r.idea.name}
                        {r.idea.place && <span className="sec rank-place"> · {r.idea.place}</span>}
                      </p>
                      <div className="rank-bar">
                        <span className="trk" aria-hidden="true">
                          <i style={{ width: `${((r.avg ?? 0) / 5) * 100}%` }} />
                        </span>
                        <span className="mono">{formatAvg(r.avg)}</span>
                      </div>
                    </div>
                  </li>
                );
              });
            })()}
          </ol>
        </section>
      )}

      {result.topSlots.length > 0 && (
        <section className="pad res-sec res-last" aria-labelledby="times-title">
          <h2 id="times-title" className="h2 section-title">
            {copy.result.timesTitle}
          </h2>
          <ul>
            {result.topSlots.map((t) => (
              <li key={`${t.day}-${t.slot}`} className="br">
                <span className="mono">
                  {formatDate(t.day)} {slotLower(t.slot)}
                </span>
                <span className="mono sec">{copy.result.timeFree(formatRatio(t.freeCount, result.voters.length))}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="grow res-spacer" />

      <NewPlanSheet open={planOpen} roomName={snap.room.name} onClose={() => setPlanOpen(false)} onSubmit={createPlan} />
    </>
  );
}
