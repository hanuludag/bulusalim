// "Bu cihaz kim?" Konudan bağımsız: anahtar öneki dışarıdan verilir (createDevice('bs')).
// localStorage: bu tarayıcıda kalıcı, bütün sekmeler paylaşır.
// sessionStorage: sadece bu sekmeye özel (test panelinde "bu sekmede kim olayım").
// Okuma/yazma hata verirse (gizli sekme vb.) uygulama çökmez, sadece hatırlamaz.

export interface LastRoom { id: string; name: string }

const NOBODY = '-';
const local = () => window.localStorage;
const session = () => window.sessionStorage;

function get(st: () => Storage, key: string): string | null {
  try {
    return st().getItem(key);
  } catch {
    return null;
  }
}
function set(st: () => Storage, key: string, value: string) {
  try {
    st().setItem(key, value);
  } catch {
    /* hatırlayamıyoruz, sorun değil */
  }
}
function del(st: () => Storage, key: string) {
  try {
    st().removeItem(key);
  } catch {
    /* yok say */
  }
}
function json<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function createDevice(prefix: string) {
  const roomKey = (roomId: string) => `${prefix}:room:${roomId}`;
  const asKey = (roomId: string) => `${prefix}:as:${roomId}`;
  const lastNameKey = `${prefix}:lastName`;
  const lastRoomKey = `${prefix}:lastRoom`;

  return {
    /** Bu cihazın (ya da test sekmesinin) bu odadaki üye kimliği. */
    getMemberId(roomId: string): string | null {
      const as = get(session, asKey(roomId));
      if (as === NOBODY) return null;
      if (as) return as;
      // Eski biçimde ({memberId, guideDone, …}) kayıt olabilir: sadece memberId alınır
      const saved = json<{ memberId?: unknown }>(get(local, roomKey(roomId)));
      return typeof saved?.memberId === 'string' ? saved.memberId : null;
    },

    /** Bu cihazı odadaki bir üyeye bağlar. Test sekmesindeyse bağlama sadece o sekmede kalır. */
    bindMember(roomId: string, memberId: string) {
      if (get(session, asKey(roomId)) !== null) set(session, asKey(roomId), memberId);
      else set(local, roomKey(roomId), JSON.stringify({ memberId }));
    },

    /** Test paneli: bu sekmede başka biri ol (null = test kimliğini bırak). */
    actAs(roomId: string, memberId: string | null) {
      if (memberId) set(session, asKey(roomId), memberId);
      else del(session, asKey(roomId));
    },
    /** Test paneli: bu sekmede kimse olma (Katıl ekranını görmek için). */
    actAsNobody(roomId: string) {
      set(session, asKey(roomId), NOBODY);
    },

    getLastName: () => get(local, lastNameKey) ?? '',
    setLastName: (name: string) => set(local, lastNameKey, name),
    getLastRoom(): LastRoom | null {
      const r = json<LastRoom>(get(local, lastRoomKey));
      return r && typeof r.id === 'string' && typeof r.name === 'string' ? r : null;
    },
    setLastRoom: (room: LastRoom) => set(local, lastRoomKey, JSON.stringify(room)),

    /** Bu önekle başlayan bütün anahtarları siler (local + session). */
    clearAll() {
      for (const st of [local, session]) {
        try {
          const s = st();
          const keys: string[] = [];
          for (let i = 0; i < s.length; i++) {
            const k = s.key(i);
            if (k?.startsWith(`${prefix}:`)) keys.push(k);
          }
          keys.forEach((k) => s.removeItem(k));
        } catch {
          /* yok say */
        }
      }
    },
  };
}

export type Device = ReturnType<typeof createDevice>;
