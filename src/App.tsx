// Sayfa yönlendirmeleri (§14).
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './core/ErrorBoundary';
import { ToastProvider } from './core/useToast';
import { copy } from './app/copy';
import Home from './app/pages/Home';
import CreateRoom from './app/pages/CreateRoom';
import RoomReady from './app/pages/RoomReady';
import RoomGate from './app/pages/RoomGate';
import IdeasScreen from './app/pages/IdeasScreen';
import TimeScreen from './app/pages/TimeScreen';
import ResultScreen from './app/pages/ResultScreen';
import GuestScreen from './app/pages/GuestScreen';
import GuestPlan from './app/pages/GuestPlan';

// Test paneli sadece geliştirme modunda yüklenir (build'e girmez)
const TestPanel = import.meta.env.DEV ? lazy(() => import('./app/components/TestPanel')) : null;

export default function App() {
  return (
    <ErrorBoundary message={copy.common.crashed}>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/yeni" element={<CreateRoom />} />
          <Route path="/r/:roomId" element={<RoomGate />} />
          <Route path="/r/:roomId/hazir" element={<RoomReady />} />
          <Route path="/r/:roomId/fikirler" element={<IdeasScreen />} />
          <Route path="/r/:roomId/zaman" element={<TimeScreen />} />
          <Route path="/r/:roomId/sonuc" element={<ResultScreen />} />
          <Route path="/r/:roomId/cevap" element={<GuestScreen />} />
          <Route path="/r/:roomId/plan" element={<GuestPlan />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {TestPanel && (
          <Suspense fallback={null}>
            <TestPanel />
          </Suspense>
        )}
      </ToastProvider>
    </ErrorBoundary>
  );
}
