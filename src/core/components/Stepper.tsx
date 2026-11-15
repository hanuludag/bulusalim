// Stepper: ince adım göstergesi ("1 Puanla · 2 Zaman · 3 Sonuç").
import { Fragment } from 'react';
import './Stepper.css';

export function Stepper({ steps, current, separator }: { steps: readonly string[]; current: number; separator: string }) {
  return (
    <ol className="steps">
      {steps.map((s, i) => (
        <Fragment key={s}>
          {i > 0 && (
            <li aria-hidden="true" className="sep">
              {separator}
            </li>
          )}
          <li className={i === current ? 'on' : undefined} aria-current={i === current ? 'step' : undefined}>
            {s}
          </li>
        </Fragment>
      ))}
    </ol>
  );
}
