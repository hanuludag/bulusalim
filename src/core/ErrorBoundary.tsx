// Hata sınırı: bir bileşen çökerse beyaz ekran yerine kısa bir mesaj gösterir.
import { Component, type ReactNode } from 'react';

interface Props {
  message: string;
  children: ReactNode;
}

export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[bulusalim] Beklenmeyen hata:', error);
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="page">
          <p className="center-msg s17 m">{this.props.message}</p>
        </main>
      );
    }
    return this.props.children;
  }
}
