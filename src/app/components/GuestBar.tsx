// Arkadaş ekranlarının sade üst çubuğu: Odalarım · oda adı · paylaş.
import { Link } from 'react-router-dom';
import { copy } from '../copy';
import { BackIcon, ShareIcon } from '../../core/components/Icons';

export function GuestBar({ title, onShare, back }: { title: string; onShare: () => void; back?: string }) {
  return (
    <header className="topbar">
      <Link to={back ?? '/'} className="ib topbar-back" aria-label={back ? copy.bar.back : copy.guest.myRooms}>
        <BackIcon />
      </Link>
      <p className="h2 topbar-title">{title}</p>
      <button className="ib" type="button" aria-label={copy.bar.share} onClick={onShare}>
        <ShareIcon />
      </button>
    </header>
  );
}
