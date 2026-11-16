import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, X, Check, Monitor, KeyRound, Palette, Moon, LogOut 
} from 'lucide-react';
import { StoreProfile, DailyRates, Counter } from '../../types';
import { NAV_GROUPS, isNavActive } from './Sidebar';

export interface HeaderProps {
  store: StoreProfile;
  rates: DailyRates;
  counters: Counter[];
  activeCounter: Counter;
  onSelectCounter: (counter: Counter) => void;
  onOpenOmnibar?: () => void;
  onNavigate: (module: string) => void;
  currentModule: string;
  mobileOpen?: boolean;
  onToggleMobile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  store,
  counters,
  activeCounter,
  onSelectCounter,
  onNavigate,
  currentModule,
  mobileOpen = false,
  onToggleMobile,
}) => {
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user dropdown on outside click or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Compute breadcrumbs and title matching live production app
  const getBreadcrumb = (mod: string) => {
    for (const g of NAV_GROUPS) {
      for (const item of g.items) {
        if (isNavActive(mod, item.mod)) {
          return { group: g.group, title: item.label };
        }
      }
    }
    return { group: 'Main', title: 'Dashboard' };
  };

  const { group: groupName, title: moduleTitle } = getBreadcrumb(currentModule);

  return (
    <>
      <header className="topbar">
        {/* Topbar Left: Hamburger + Crumbs & Module Title */}
        <div className="topbar-left">
          <button
            className="hamburger"
            aria-label="Toggle navigation"
            onClick={onToggleMobile}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div style={{ minWidth: 0 }}>
            <div className="crumbs hidden-mobile">
              <span>{groupName}</span>
              <span aria-hidden="true">/</span>
              <span>{moduleTitle}</span>
            </div>
            <span className="topbar-title">{moduleTitle}</span>
          </div>
        </div>

        {/* Topbar Right: Active Counter Pill & User Menu Pill */}
        <div className="topbar-right">
          <button
            type="button"
            onClick={() => setShowCounterModal(true)}
            title={`Counter ${activeCounter?.code || 'MAIN'} · ${activeCounter?.activeRegisterId || 'REG-2026-00001'}. Click to switch.`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '5px 11px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              border: '1px solid color-mix(in srgb, var(--success) 25%, transparent)',
              cursor: 'pointer',
              marginRight: 8,
              whiteSpace: 'nowrap',
              transition: 'background 0.15s',
              background: 'var(--success-l)',
              color: 'var(--primary-d)',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: 'var(--success)',
                flexShrink: 0,
              }}
            />
            Counter {activeCounter?.code || 'MAIN'}
            <span className="hidden-mobile" style={{ fontWeight: 500 }}>
              {' '}· {activeCounter?.activeRegisterId || 'REG-2026-00001'}
            </span>
          </button>

          <div className="user-menu" ref={userMenuRef}>
            <button
              className="user-pill"
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
              onClick={() => setUserMenuOpen(prev => !prev)}
            >
              <div className="user-av">A</div>
              <div className="user-pill-text hidden-mobile">
                <strong>Admin</strong>
                <small>Shop Owner</small>
              </div>
            </button>

            {userMenuOpen && (
              <div className="user-dropdown" role="menu">
                <div className="user-dropdown-head">
                  <strong>Admin</strong>
                  <span>{store?.email || 'admin@sbjewellers.com'}</span>
                </div>
                <button
                  role="menuitem"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onNavigate('profile');
                  }}
                >
                  <KeyRound size={14} /> Change my password
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onNavigate('theme-layout');
                  }}
                >
                  <Palette size={14} /> Theme & layout
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    setUserMenuOpen(false);
                    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
                    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
                  }}
                >
                  <Moon size={14} /> Dark mode (this device)
                </button>
                <button
                  role="menuitem"
                  className="danger"
                  onClick={() => {
                    setUserMenuOpen(false);
                    if (confirm('Sign out of KreyaJewel360?')) {
                      window.location.reload();
                    }
                  }}
                >
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Showroom Counter Selection Modal */}
      {showCounterModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Monitor className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-sm">Select Showroom Counter</h3>
              </div>
              <button 
                onClick={() => setShowCounterModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-2">
              <p className="text-xs text-slate-500 mb-3">
                Transactions, cash drawer inflows, and orders will be attributed to this counter.
              </p>
              
              {counters.map(counter => (
                <div
                  key={counter.id}
                  onClick={() => {
                    onSelectCounter(counter);
                    setShowCounterModal(false);
                  }}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between ${
                    counter.id === activeCounter.id
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-slate-800">{counter.name}</span>
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        {counter.code}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Register: {counter.activeRegisterId || 'REG-2026-00021'} · Status: Active
                    </p>
                  </div>
                  {counter.id === activeCounter.id && (
                    <Check className="w-4 h-4 text-emerald-600 font-bold" />
                  )}
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowCounterModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
