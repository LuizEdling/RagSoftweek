import { NavLink } from 'react-router-dom';
import { Brain } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Laboratóriosss' },
  { to: '/pratica', label: 'Modo Prática' },
  { to: '/como-funciona', label: 'Como funciona' },
  { to: '/base-de-conhecimento', label: 'Base de Conhecimento' },
  { to: '/sobre', label: 'Sobre' },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-primary to-blue-light shadow-[0_0_18px_rgba(0,73,255,0.45)]">
            <Brain className="h-5 w-5 text-white" strokeWidth={2} />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">RAG Lab</span>
        </div>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-md px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden shrink-0 rounded-full border border-blue-light/30 bg-blue-primary/10 px-3 py-1.5 text-xs font-medium text-blue-glow sm:block">
          Workshop RAG
        </div>
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto border-t border-white/5 px-4 py-2 lg:hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ${
                isActive ? 'bg-white/10 text-white' : 'text-slate-400'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
