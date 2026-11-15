// Sekmeler arası canlı güncelleme (§11).
// Bu, çevrimiçi sürümdeki "canlı güncellemenin" (ör. Supabase Realtime) yerine geçen bir simülasyondur.
// BroadcastChannel sadece mesaj taşır, hiçbir şey saklamaz: mesaj "tekrar oku" demektir,
// veri her zaman localStorage'dan okunur.
// Kanal adı dışarıdan verilir, böylece iki uygulama aynı kodu farklı adlarla kullanabilir.

export interface Sync {
  /** Diğer sekmelere "bu oda değişti" de. */
  notify(roomId: string): void;
  /** Başka sekmeden mesaj gelince çağrılır. Dönen fonksiyon dinlemeyi bırakır. */
  listen(onRoomChanged: (roomId: string) => void): () => void;
  close(): void;
}

interface Message {
  type: 'room-changed';
  roomId: string;
  from: string;
}

export function createSync(channelName: string, storageKeyPrefix?: string): Sync {
  // Bu sekmenin kimliği: kendi mesajımızı tekrar işlememek için
  const tabId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Math.random());
  const listeners = new Set<(roomId: string) => void>();
  const pingKey = `${storageKeyPrefix ?? channelName}:ping`;

  let channel: BroadcastChannel | null = null;
  try {
    if (typeof BroadcastChannel !== 'undefined') channel = new BroadcastChannel(channelName);
  } catch {
    channel = null;
  }

  const emit = (roomId: string) => listeners.forEach((fn) => fn(roomId));

  const onMessage = (ev: MessageEvent<Message>) => {
    const msg = ev.data;
    if (msg && msg.type === 'room-changed' && msg.from !== tabId) emit(msg.roomId);
  };
  channel?.addEventListener('message', onMessage);

  // Yedek: BroadcastChannel olmayan tarayıcılar için "storage" olayı.
  // storage olayı zaten sadece DİĞER sekmelerde tetiklenir.
  const onStorage = (ev: StorageEvent) => {
    if (channel || ev.key !== pingKey || !ev.newValue) return;
    try {
      const msg = JSON.parse(ev.newValue) as Message;
      if (msg.from !== tabId) emit(msg.roomId);
    } catch {
      /* bozuk ping: yok say */
    }
  };
  if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);

  return {
    notify(roomId) {
      const msg: Message = { type: 'room-changed', roomId, from: tabId };
      if (channel) {
        channel.postMessage(msg);
      } else {
        try {
          localStorage.setItem(pingKey, JSON.stringify({ ...msg, t: Date.now() }));
        } catch {
          /* yazılamadı: canlı güncelleme olmaz, veri yine de kayıtlı */
        }
      }
    },
    listen(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    close() {
      channel?.removeEventListener('message', onMessage);
      channel?.close();
      if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
      listeners.clear();
    },
  };
}
