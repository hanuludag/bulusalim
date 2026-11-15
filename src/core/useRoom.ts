// useRoom: bir odanın verisini okuyan ve değişince yeniden okuyan React hook'u.
// Hook = bileşenlere durum (state) ve yan etki ekleyen, "use" ile başlayan fonksiyon.
// Konudan bağımsız: veri kaynağını (get + subscribe) parametre olarak alır.
import { useCallback, useEffect, useRef, useState } from 'react';

export interface RoomSource<T> {
  getRoom(roomId: string): Promise<T | null>;
  subscribe(roomId: string, onChange: () => void): () => void;
}

export type RoomStatus = 'loading' | 'ready' | 'not-found';

export function useRoom<T>(source: RoomSource<T>, roomId: string | undefined) {
  const [status, setStatus] = useState<RoomStatus>('loading');
  const [data, setData] = useState<T | null>(null);
  const reqId = useRef(0);

  const refresh = useCallback(async () => {
    if (!roomId) {
      setStatus('not-found');
      return;
    }
    const id = ++reqId.current;
    try {
      const snap = await source.getRoom(roomId);
      if (id !== reqId.current) return; // daha yeni bir okuma başladı
      setData(snap);
      setStatus(snap ? 'ready' : 'not-found');
    } catch (e) {
      console.error('[useRoom] Oda okunamadı', e);
      if (id === reqId.current) setStatus('not-found');
    }
  }, [source, roomId]);

  useEffect(() => {
    setStatus('loading');
    setData(null);
    void refresh();
    if (!roomId) return;
    const stop = source.subscribe(roomId, () => void refresh());
    return stop; // sayfadan çıkınca aboneliği kapat
  }, [source, roomId, refresh]);

  return { status, data, refresh };
}
