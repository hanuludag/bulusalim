// Sayfa yönlendirmeleri (§14).
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './core/ErrorBoundary';
import { ToastProvider } from './core/useToast';
import { copy } from './app/copy';
import Home from './app/pages/Home';
import RoomReady from './app/pages/RoomReady';
import RoomGate from './app/pages/RoomGate';
import Room from './app/pages/Room';

// Test paneli sadece geliştirme modunda yüklenir (build'e girmez)
const TestPanel = import.meta.env.DEV ? lazy(() => import('./app/components/TestPanel')) : null;

export default function App() {
  return (
    <ErrorBoundary message={copy.common.crashed}>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/r/:roomId" element={<RoomGate />} />
          <Route path="/r/:roomId/hazir" element={<RoomReady />} />
          <Route path="/r/:roomId/:tab" element={<Room />} />
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
