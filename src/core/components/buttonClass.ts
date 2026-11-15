// Buton sınıf adları: ana (btn), ikinci (btn2), metin (tb). Link'leri buton gibi göstermek için de kullanılır.
export type ButtonVariant = 'primary' | 'secondary' | 'text';

export function buttonClass(variant: ButtonVariant = 'primary', small = false, muted = false, extra = ''): string {
  const base = variant === 'primary' ? 'btn' : variant === 'secondary' ? 'btn2' : 'tb';
  return [base, small && 'sm', muted && 'muted', extra].filter(Boolean).join(' ');
}
