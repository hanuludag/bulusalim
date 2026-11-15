// Avatar: 4px köşeli kare, baş harf.
import { initial } from '../names';
import './Avatar.css';

export function Avatar({ name }: { name: string }) {
  return (
    <span className="av" aria-hidden="true">
      {initial(name)}
    </span>
  );
}
