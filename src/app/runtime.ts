// Uygulama genelinde tek bir veri deposu ve cihaz nesnesi.
// .env içinde Supabase ayarları varsa ÇEVRİMİÇİ (supabaseStore), yoksa ÇEVRİMDIŞI (localStore) çalışır.
// Ekranlar hangisinin kullanıldığını bilmez: ikisi de aynı DataStore sözleşmesini yerine getirir.
import { createDevice } from '../core/device';
import { createLocalStore, type LocalStore } from './localStore';
import { createSupabaseStore } from './supabaseStore';
import type { DataStore } from './store';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_KEY as string | undefined;
const forceLocal = import.meta.env.VITE_OFFLINE === '1';

export const isOnline = !!(url && key) && !forceLocal;

/** Sadece çevrimdışı modda dolu (test panelinin gecikme/boyut özellikleri için). */
export const localStore: LocalStore | null = isOnline ? null : createLocalStore();

export const store: DataStore = isOnline ? createSupabaseStore(url!, key!) : localStore!;
export const device = createDevice('bs');
