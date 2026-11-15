// /r/:roomId → Bu cihaz üyeyse açılış sekmesine, değilse Katıl ekranına.
import { Navigate, useParams } from 'react-router-dom';
import { store, device } from '../runtime';
import { landingTab } from '../landing';
import { useRoom } from '../../core/useRoom';
import { Loading, RoomNotFound } from '../components/Status';
import Join from './Join';

export default function RoomGate() {
  const { roomId } = useParams();
  const { status, data } = useRoom(store, roomId);

  if (status === 'loading') return <Loading />;
  if (status === 'not-found' || !data) return <RoomNotFound />;

  const memberId = device.getMemberId(data.room.id);
  const me = data.members.find((m) => m.id === memberId);
  if (!me) return <Join snap={data} />;

  return <Navigate to={`/r/${data.room.id}/${landingTab(data, me.id)}`} replace state={{ welcome: true }} />;
}
