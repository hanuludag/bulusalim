// Oda sekmelerine verilen ortak bilgiler.
import type { Member, RoomSnapshot, TabKey } from '../types';
import type { RoomDeviceState } from '../../core/device';
import type { Device } from '../../core/device';

export interface RoomCtx {
  snap: RoomSnapshot;
  me: Member;
  dev: RoomDeviceState;
  updateDev: (patch: Parameters<Device['updateRoomState']>[1]) => void;
  /** İyimser değişiklik: apply ekrana hemen uygulanır, action kaydeder. Başarılıysa true. */
  mutate: (
    apply: (s: RoomSnapshot) => RoomSnapshot,
    action: () => Promise<unknown>,
    opts?: { toast?: boolean },
  ) => Promise<boolean>;
  refresh: () => Promise<void>;
  goTab: (t: TabKey) => void;
  link: string;
  guide: boolean;
}
