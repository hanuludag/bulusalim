// Button: ana (kırmızı dolu), ikinci (çerçeveli), metin (altı çizili) buton.
import type { ButtonHTMLAttributes } from 'react';
import { buttonClass, type ButtonVariant as Variant } from './buttonClass';
import './Button.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  small?: boolean;
  muted?: boolean;
}

export function Button({ variant = 'primary', small, muted, className = '', type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, small, muted, className)} {...rest} />;
}
