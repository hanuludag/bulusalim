// Uygulama genelinde tek bir veri deposu ve cihaz nesnesi.
// Çevrimiçi sürümde sadece bu dosyadaki createLocalStore() satırı değişecek.
import { createDevice } from '../core/device';
import { createLocalStore } from './localStore';

export const store = createLocalStore();
export const device = createDevice('bs');
