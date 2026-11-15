// Oda: üst çubuk + adım göstergesi + sekme içeriği + sabit buton + sekme çubuğu.
// İyimser güncelleme burada: değişiklik önce ekranda görünür, sonra kaydedilir; hata olursa geri alınır.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { copy } from '../copy';
import { device, store } from '../runtime';
import { hasMyRating, hasMyTime } from '../landing';
import { firstShareText, roomLink } from '../share';
import type { RoomSnapshot, TabKey } from '../types';
import type { RoomDeviceState } from '../../core/device';
import { useRoom } from '../../core/useRoom';
import { useToast } from '../../core/useToast';
import { shareToWhatsApp } from '../../core/share';
import { TabBar } from '../../core/components/TabBar';
import { Stepper } from '../../core/components/Stepper';
import { CalendarIcon, FlagIcon, ListIcon, ShareIcon } from '../../core/components/Icons';
import { Loading, RoomNotFound } from '../components/Status';
import IdeasTab from './IdeasTab';
import TimeTab from './TimeTab';
import ResultTab from './ResultTab';
import type { RoomCtx } from './roomCtx';
import './Room.css';

const TABS: TabKey[] = ['fikirler', 'zaman', 'sonuc'];

export default function Room() {
  const { roomId, tab: tabParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { status, data, refresh } = useRoom(store, roomId);

  // Bekleyen iyimser değişiklikler: kaydedilene kadar verinin üstüne uygulanır
  const [pending, setPending] = useState<{ id: number; apply: (s: RoomSnapshot) => RoomSnapshot }[]>([]);
  const counter = useRef(0);
  const view = useMemo(() => (data ? pending.reduce((s, p) => p.apply(s), data) : null), [data, pending]);

  // Bu cihazın oda durumu (rehber, ipuçları); değişince ekranı yenilemek için state'te tutulur
  const [devState, setDevState] = useState<RoomDeviceState | null>(() => (roomId ? device.getRoomState(roomId) : null));
  useEffect(() => {
    if (roomId) setDevState(device.getRoomState(roomId));
  }, [roomId]);
  const updateDev = useCallback(
    (patch: Parameters<typeof device.updateRoomState>[1]) => {
      if (!roomId) return;
      device.updateRoomState(roomId, patch);
      setDevState(device.getRoomState(roomId));
    },
    [roomId],
  );

  const tab = TABS.includes(tabParam as TabKey) ? (tabParam as TabKey) : null;
  const memberId = devState?.memberId ?? null;
  const me = view?.members.find((m) => m.id === memberId) ?? null;

  // "Tekrar hoş geldin" bildirimi (bir kez)
  const welcomed = useRef(false);
  useEffect(() => {
    const st = location.state as { welcome?: boolean } | null;
    if (!welcomed.current && st?.welcome && me) {
      welcomed.current = true;
      toast.show(copy.join.welcomeBack(me.name), 2000);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, me, toast, navigate]);

  // Son oda + Sonuç sekmesi bir kez açılınca rehber biter
  useEffect(() => {
    if (view && me) device.setLastRoom({ id: view.room.id, name: view.room.name });
  }, [view, me]);
  useEffect(() => {
    if (tab === 'sonuc' && devState && !devState.guideDone) updateDev({ guideDone: true });
  }, [tab, devState, updateDev]);

  // Sekme değişince sayfanın başına dön
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab]);

  const mutate = useCallback<RoomCtx['mutate']>(
    async (apply, action, opts) => {
      const id = ++counter.current;
      setPending((p) => [...p, { id, apply }]);
      try {
        await action();
        await refresh();
        if (opts?.toast !== false) toast.show(copy.common.saved);
        return true;
      } catch (e) {
        console.error('[bulusalim] Kaydedilemedi', e);
        toast.show(copy.common.saveFailed);
        await refresh();
        return false;
      } finally {
        setPending((p) => p.filter((x) => x.id !== id));
      }
    },
    [refresh, toast],
  );

  if (status === 'loading') return <Loading />;
  if (status === 'not-found' || !view || !roomId) return <RoomNotFound />;
  if (!tab) return <Navigate to={`/r/${roomId}`} replace />;
  if (!me || !devState) return <Navigate to={`/r/${roomId}`} replace />;

  const link = roomLink(roomId);
  const guide = !devState.guideDone;
  const goTab = (t: TabKey) => navigate(`/r/${roomId}/${t}`);

  const ctx: RoomCtx = {
    snap: view,
    me,
    dev: devState,
    updateDev,
    mutate,
    refresh,
    goTab,
    link,
    guide,
  };

  return (
    <main className="page room">
      <header className="bar">
        <p className="h2">{view.room.name}</p>
        <button
          className="ib"
          type="button"
          aria-label={copy.room.share}
          onClick={() => void shareToWhatsApp(firstShareText(view.room.name, link))}
        >
          <ShareIcon />
        </button>
      </header>
      {guide && <Stepper steps={copy.room.steps} current={TABS.indexOf(tab)} separator={copy.room.stepSep} />}

      <div className="room-body">
        {tab === 'fikirler' && <IdeasTab ctx={ctx} />}
        {tab === 'zaman' && <TimeTab ctx={ctx} />}
        {tab === 'sonuc' && <ResultTab ctx={ctx} />}
      </div>

      <TabBar
        active={tab}
        onSelect={goTab}
        items={[
          { key: 'fikirler', label: copy.room.tabs.fikirler, icon: <ListIcon />, dot: !hasMyRating(view, me.id) },
          { key: 'zaman', label: copy.room.tabs.zaman, icon: <CalendarIcon />, dot: !hasMyTime(view, me.id) },
          { key: 'sonuc', label: copy.room.tabs.sonuc, icon: <FlagIcon /> },
        ]}
      />
    </main>
  );
}
