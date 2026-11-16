// Ana sayfa: "Odalarım" (bu cihazın odaları) + Yeni oda kur. Hiç oda yoksa doğrudan oda kurma formu.
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { copy } from '../copy';
import { device } from '../runtime';
import CreateRoom from './CreateRoom';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [rooms] = useState(() => {
    const forget = (location.state as { forget?: string } | null)?.forget;
    if (forget) device.forgetRoom(forget); // oda silindi ya da "Listemden kaldır"
    return device.getRooms();
  });
  if (rooms.length === 0) return <CreateRoom showBack={false} />;

  return (
    <main className="page">
      <header className="bar">
        <span className="logo">{copy.common.logo}</span>
      </header>
      <div className="pad home-head">
        <h1 className="h1">{copy.home.myRooms}</h1>
        <p className="sec">{copy.home.myRoomsSub}</p>
      </div>
      <ul className="room-list">
        {rooms.map((r) => (
          <li key={r.id}>
            <Link to={`/r/${r.id}`} className="pad room-item">
              <span className="s17 m">{r.name}</span>
              <span aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="grow" />
      <div className="dock">
        <button className="btn" type="button" onClick={() => navigate('/yeni')}>
          {copy.home.newRoom}
        </button>
      </div>
    </main>
  );
}
