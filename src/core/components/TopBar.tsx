// Üst çubuk: (isteğe bağlı geri oku) + başlık · metin link + paylaş ikonu. Metinler dışarıdan gelir.
import { Link } from 'react-router-dom';
import { BackIcon, ShareIcon } from './Icons';
import './TopBar.css';

export interface TopBarProps {
  title: string;
  back?: { to: string; label: string };
  link: { to: string; label: string };
  share: { label: string; onClick: () => void };
}

export function TopBar({ title, back, link, share }: TopBarProps) {
  return (
    <header className="topbar">
      {back && (
        <Link to={back.to} className="ib topbar-back" aria-label={back.label}>
          <BackIcon />
        </Link>
      )}
      <p className="h2 topbar-title">{title}</p>
      <Link to={link.to} className="tb sm topbar-link">
        {link.label}
      </Link>
      <button className="ib" type="button" aria-label={share.label} onClick={share.onClick}>
        <ShareIcon />
      </button>
    </header>
  );
}
