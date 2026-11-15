// Oda hazır: linki paylaş (§6). Sadece kuran kişi buraya yönlendirilir.
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { copy } from '../copy';
import { store } from '../runtime';
import { firstShareText, roomLink } from '../share';
import { useRoom } from '../../core/useRoom';
import { copyText, shareToWhatsApp } from '../../core/share';
import { ShareIcon } from '../../core/components/Icons';
import { Loading, RoomNotFound } from '../components/Status';
import './RoomReady.css';

export default function RoomReady() {
  const { roomId } = useParams();
  const { status, data } = useRoom(store, roomId);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  if (status === 'loading') return <Loading />;
  if (status === 'not-found' || !data) return <RoomNotFound />;

  const link = roomLink(data.room.id);

  async function onCopy() {
    if (await copyText(link)) {
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <main className="page">
      <header className="bar">
        <Link to="/" className="logo">
          {copy.common.logo}
        </Link>
        <span className="sec s13 ready-room">{data.room.name}</span>
      </header>
      <div className="pad ready-head">
        <h1 className="h1">{copy.ready.title}</h1>
        <p className="sec">{copy.ready.sub}</p>
      </div>
      <div className="pad ready-link-wrap">
        <p className="mono ready-link">{link}</p>
      </div>
      <div className="grow" />
      <div className="pad ready-actions">
        <button className="btn" type="button" onClick={() => void shareToWhatsApp(firstShareText(data.room.name, link))}>
          <ShareIcon size={20} />
          {copy.ready.whatsapp}
        </button>
        <button className="btn2" type="button" onClick={() => void onCopy()} aria-live="polite">
          {copied ? copy.common.copied : copy.ready.copyLink}
        </button>
        <p className="sec s13 ready-note">{copy.ready.note}</p>
      </div>
      <div className="pad ready-start">
        <Link to={`/r/${data.room.id}/fikirler`} className="tb">
          {copy.ready.start}
        </Link>
      </div>
    </main>
  );
}
