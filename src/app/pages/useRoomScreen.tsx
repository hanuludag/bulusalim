// Oda ekranlarının (Fikirler, Zaman, Sonuç) ortak kısmı: veriyi okur, "bu cihaz kim" kontrolü yapar,
// iyimser güncellemeyi sağlar. İyimser güncelleme = değişikliği kaydı beklemeden ekranda göstermek;
// kayıt başarısız olursa geri alınır ve "Kaydedilemedi. Tekrar dene." çıkar.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { copy } from '../copy';
import { device, store } from '../runtime';
import { firstShareText, roomLink } from '../share';
import type { Member, RoomSnapshot } from '../types';
import { useRoom } from '../../core/useRoom';
import { useToast } from '../../core/useToast';
import { shareToWhatsApp } from '../../core/share';
import { Loading, Offline, RoomNotFound } from '../components/Status';

export interface RoomCtx {
  snap: RoomSnapshot;
  me: Member;
  link: string;
  refresh: () => Promise<void>;
  mutate: (apply: (s: RoomSnapshot) => RoomSnapshot, action: () => Promise<unknown>) => Promise<boolean>;
  shareFirst: () => void;
}

export function useRoomScreen(): { gate: ReactNode; ctx: RoomCtx | null } {
  const { roomId } = useParams();
  const toast = useToast();
  const { status, data, refresh } = useRoom(store, roomId);
  const [pending, setPending] = useState<{ id: number; apply: (s: RoomSnapshot) => RoomSnapshot }[]>([]);
  const counter = useRef(0);
  const view = useMemo(() => (data ? pending.reduce((s, p) => p.apply(s), data) : null), [data, pending]);
  const memberId = roomId ? device.getMemberId(roomId) : null;
  const me = view?.members.find((m) => m.id === memberId) ?? null;

  useEffect(() => {
    if (view && me) device.setLastRoom({ id: view.room.id, name: view.room.name });
  }, [view, me]);

  const mutate = useCallback<RoomCtx['mutate']>(
    async (apply, action) => {
      const id = ++counter.current;
      setPending((p) => [...p, { id, apply }]);
      try {
        await action();
        await refresh();
        return true;
      } catch (e) {
        console.error('[bulusalim] Kaydedilemedi', e);
        toast.show(copy.common.saveFailed, 2500);
        await refresh();
        return false;
      } finally {
        setPending((p) => p.filter((x) => x.id !== id));
      }
    },
    [refresh, toast],
  );

  if (status === 'loading') return { gate: <Loading />, ctx: null };
  if (status === 'error') return { gate: <Offline onRetry={() => void refresh()} />, ctx: null };
  if (status === 'not-found' || !view || !roomId) return { gate: <RoomNotFound />, ctx: null };
  if (!me) return { gate: <Navigate to={`/r/${roomId}`} replace />, ctx: null };

  const link = roomLink(roomId);
  return {
    gate: null,
    ctx: {
      snap: view,
      me,
      link,
      refresh,
      mutate,
      shareFirst: () => void shareToWhatsApp(firstShareText(view.room.name, link)),
    },
  };
}
