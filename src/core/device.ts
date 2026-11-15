// "Bu cihaz kim?" (§12). Konudan bağımsız: anahtar öneki dışarıdan verilir (createDevice('bs')).
// localStorage: tarayıcıda kalıcı, aynı tarayıcıdaki bütün sekmeler paylaşır.
// sessionStorage: sadece bu sekmeye özel, sekme kapanınca silinir.
// Test panelinde "bu sekmede kim olayım" seçimi sessionStorage'a yazılır, böylece
// aynı bilgisayarda her sekme farklı bir arkadaşı taklit edebilir.
// Okuma/yazma hata verirse (gizli sekme vb.) uygulama çökmez, sadece hatırlamaz.

export interface RoomDeviceState {
  memberId: string;
  guideDone: boolean;
  hints: { rating: boolean; gridHold: boolean };
  finalSeen: boolean;
}

export interface LastRoom {
  id: string;
  name: string;
}

function safeGet(storage: () => Storage, key: string): string | null {
  try {
    return storage().getItem(key);
  } catch {
    return null;
  }
}

function safeSet(storage: () => Storage, key: string, value: string): void {
  try {
    storage().setItem(key, value);
  } catch {
    /* hatırlayamıyoruz, sorun değil */
  }
}

function safeRemove(storage: () => Storage, key: string): void {
  try {
    storage().removeItem(key);
  } catch {
    /* yok say */
  }
}

const local = () => window.localStorage;
const NOBODY = '-';
const session = () => window.sessionStorage;

function readJson<T>(raw: string | null): T | null {
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

  const fresh = (memberId: string): RoomDeviceState => ({
    memberId,
    guideDone: false,
    hints: { rating: false, gridHold: false },
    finalSeen: false,
  });

  /** Odadaki kayıt (önce bu sekmenin test kimliği, yoksa cihazın kimliği). */
  function getRoomState(roomId: string): RoomDeviceState | null {
    const saved = readJson<RoomDeviceState>(safeGet(local, roomKey(roomId)));
    const asMember = safeGet(session, asKey(roomId));
    if (asMember === NOBODY) return null; // test: bu sekmede kimse değilim
    if (asMember) {
      // Test kimliği: ipucu/rehber durumu da sekmeye özel tutulur
      const tabState = readJson<RoomDeviceState>(safeGet(session, roomKey(roomId)));
      if (tabState && tabState.memberId === asMember) return tabState;
      return fresh(asMember);
    }
    if (!saved || typeof saved.memberId !== 'string') return null;
    return { ...fresh(saved.memberId), ...saved, hints: { ...fresh('').hints, ...saved.hints } };
  }

  function writeRoomState(roomId: string, state: RoomDeviceState): void {
    if (safeGet(session, asKey(roomId))) {
      safeSet(session, roomKey(roomId), JSON.stringify(state));
    } else {
      safeSet(local, roomKey(roomId), JSON.stringify(state));
    }
  }

  return {
    getRoomState,

    getMemberId(roomId: string): string | null {
      return getRoomState(roomId)?.memberId ?? null;
    },

    /** Bu cihazı odadaki bir üyeye bağlar. */
    bindMember(roomId: string, memberId: string): void {
      // Bu sekme test kimliği kullanıyorsa bağlama da sadece bu sekmede kalır
      if (safeGet(session, asKey(roomId)) !== null) {
        safeSet(session, asKey(roomId), memberId);
        safeSet(session, roomKey(roomId), JSON.stringify(fresh(memberId)));
        return;
      }
      safeSet(local, roomKey(roomId), JSON.stringify(fresh(memberId)));
    },

    updateRoomState(roomId: string, patch: Partial<Omit<RoomDeviceState, 'hints'>> & { hints?: Partial<RoomDeviceState['hints']> }): void {
      const cur = getRoomState(roomId);
      if (!cur) return;
      writeRoomState(roomId, { ...cur, ...patch, hints: { ...cur.hints, ...patch.hints } });
    },

    /** Test paneli: bu sekmede kimse olma (Katıl ekranını görmek için). */
    actAsNobody(roomId: string): void {
      safeRemove(session, roomKey(roomId));
      safeSet(session, asKey(roomId), NOBODY);
    },

    /** Test paneli: bu sekmede başka biri ol. null = test kimliğini bırak. */
    actAs(roomId: string, memberId: string | null): void {
      safeRemove(session, roomKey(roomId));
      if (memberId) safeSet(session, asKey(roomId), memberId);
      else safeRemove(session, asKey(roomId));
    },

    /** Test paneli: bu sekmenin rehber ve ipucu durumunu sıfırla. */
    resetGuide(roomId: string): void {
      const cur = getRoomState(roomId);
      if (!cur) return;
      writeRoomState(roomId, { ...fresh(cur.memberId) });
    },

    getLastName(): string {
      return safeGet(local, lastNameKey) ?? '';
    },
    setLastName(name: string): void {
      safeSet(local, lastNameKey, name);
    },

    getLastRoom(): LastRoom | null {
      const r = readJson<LastRoom>(safeGet(local, lastRoomKey));
      return r && typeof r.id === 'string' && typeof r.name === 'string' ? r : null;
    },
    setLastRoom(room: LastRoom): void {
      safeSet(local, lastRoomKey, JSON.stringify(room));
    },

    /** Bu önekle başlayan bütün anahtarları siler (local + session). */
    clearAll(): void {
      for (const st of [local, session]) {
        try {
          const s = st();
          const keys: string[] = [];
          for (let i = 0; i < s.length; i++) {
            const k = s.key(i);
            if (k && k.startsWith(`${prefix}:`)) keys.push(k);
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
