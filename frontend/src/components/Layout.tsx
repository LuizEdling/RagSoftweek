import type { ReactNode } from 'react';
import Header from './Header';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-navy-950 text-slate-200">
      <div
        className="pointer-events-none fixed inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,73,255,0.25), transparent)',
        }}
      />
      <div className="relative">
        <Header />
        <main className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6">{children}</main>
        <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
          RAG Lab — projeto educacional para o workshop "Construindo uma IA com Memória"
        </footer>
      </div>
    </div>
  );
}
