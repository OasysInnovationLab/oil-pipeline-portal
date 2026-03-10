import { ReactNode } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Dot pattern overlay */}
      <div className="dot-pattern" aria-hidden="true" />
      
      {/* Header */}
      <Header />

      {/* Main content - with top padding for fixed header */}
      <main className="flex-1 relative z-10 pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          {children}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
