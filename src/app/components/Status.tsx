// Yükleniyor ve "Oda bulunamadı" hâlleri.
import { Link } from 'react-router-dom';
import { copy } from '../copy';
import { buttonClass } from '../../core/components/buttonClass';
import '../../core/components/Button.css';

export function Loading() {
  return (
    <main className="page">
      <header className="bar">
        <span className="logo">{copy.common.logo}</span>
      </header>
      <p className="center-msg sec" role="status">
        {copy.common.loading}
      </p>
    </main>
  );
}

export function RoomNotFound() {
  return (
    <main className="page">
      <header className="bar">
        <Link to="/" className="logo">
          {copy.common.logo}
        </Link>
      </header>
      <div className="center-msg">
        <p className="s17 m">{copy.common.roomNotFound}</p>
        <Link to="/" className={buttonClass('secondary', true)}>
          {copy.common.goHome}
        </Link>
      </div>
    </main>
  );
}
