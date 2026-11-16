import React, { useState } from 'react';
import { readPreviewPreferences, savePreviewPreferences } from './previewPreferences';
import { Palette, Check, Save, RotateCcw, CheckCircle2, Sparkles, Layout, Sliders, Eye } from 'lucide-react';

interface ThemePreset {
  id: string;
  name: string;
  primary: string;
  accent: string;
  bgDark: string;
  description: string;
}

export const ThemeLayoutView: React.FC = () => {
  // 7 Discovered Color Themes
  const themes: ThemePreset[] = [
    { id: 'graphite-emerald', name: 'Graphite Emerald', primary: '#047857', accent: '#10b981', bgDark: '#0f172a', description: 'Flagship Kreya emerald green with deep slate accents' },
    { id: 'deep-graphite', name: 'Deep Graphite', primary: '#334155', accent: '#64748b', bgDark: '#020617', description: 'Understated dark luxury charcoal and platinum' },
    { id: 'royal-gold', name: 'Royal Gold', primary: '#b45309', accent: '#f59e0b', bgDark: '#1c1917', description: 'Traditional Indian bullion gold & warm champagne' },
    { id: 'classic-light', name: 'Classic Light', primary: '#0369a1', accent: '#0284c7', bgDark: '#f8fafc', description: 'High-contrast bright daylight showroom billing' },
    { id: 'sapphire', name: 'Sapphire', primary: '#1d4ed8', accent: '#3b82f6', bgDark: '#0f172a', description: 'Deep royal sapphire blue gemstone aesthetic' },
    { id: 'rose-gold', name: 'Rose Gold', primary: '#be185d', accent: '#fb7185', bgDark: '#1e1b18', description: 'Warm antique bronze and blush pink gold' },
    { id: 'kreya-violet', name: 'Kreya Violet', primary: '#6d28d9', accent: '#8b5cf6', bgDark: '#180f28', description: 'Modern imperial amethyst & vibrant violet' }
  ];

  const storageKey = 'kreya:theme-preview';
  const [baseline, setBaseline] = useState(() => readPreviewPreferences(storageKey, {
    theme: 'graphite-emerald', style: 'Gradient' as 'Gradient' | 'Solid',
    layout: 'Side menu' as 'Side menu' | 'Top menu'
  }));
  const [selectedTheme, setSelectedTheme] = useState(baseline.theme);
  const [stylePreset, setStylePreset] = useState(baseline.style);
  const [layout, setLayout] = useState(baseline.layout);
  const [saveMessage, setSaveMessage] = useState('');
  const [discardNotice, setDiscardNotice] = useState(false);

  const activeThemeObj = themes.find(t => t.id === selectedTheme) || themes[0];

  const handleSaveTheme = () => {
    const preferences = { theme: selectedTheme, style: stylePreset, layout };
    const saved = savePreviewPreferences(storageKey, preferences);
    if (saved) setBaseline(preferences);
    setSaveMessage(saved ? 'Theme preview saved in this browser.' : 'The browser could not save the theme preview.');
    setDiscardNotice(false);
  };

  const handleDiscard = () => {
    setSelectedTheme(baseline.theme);
    setStylePreset(baseline.style);
    setLayout(baseline.layout);
    setSaveMessage('');
    setDiscardNotice(true);
    setTimeout(() => setDiscardNotice(false), 2500);
  };

  return (
    <div className="page" style={{ padding: '16px 20px', maxWidth: '100%' }}>
      {/* Page Header */}
      <div className="page-hdr" style={{ marginBottom: 14 }}>
        <div className="page-hdr-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 20, fontWeight: 700, margin: 0 }}>
              <Palette size={22} style={{ color: activeThemeObj.primary }} />
              Theme & Layout
            </h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fef8ee] text-[#92400e] rounded-full border border-[#efdcb6] text-xs font-semibold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
              <span>Counter MAIN</span>
              <span className="font-normal opacity-80"> · REG-2026-00001 · closing</span>
            </div>
          </div>
          <p className="helper" style={{ margin: '4px 0 0', fontSize: 12 }}>
            Customise your showroom visual appearance, color palette, surface styling and interface density · S.B Borana Jewellers
          </p>
        </div>

        {/* Header Action Buttons: "Save theme", "Discard" */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={handleDiscard}
            className="btn btn-outline btn-sm flex items-center gap-1.5"
            title="Restore saved theme preview"
          >
            <RotateCcw size={14} />
            <span>Discard</span>
          </button>
          <button
            onClick={handleSaveTheme}
            className="btn btn-primary btn-sm flex items-center gap-1.5"
            style={{ fontWeight: 700, background: activeThemeObj.primary, borderColor: activeThemeObj.primary }}
            title="Save theme preview preferences"
          >
            <Save size={14} />
            <span>Save theme</span>
          </button>
        </div>
      </div>

      {saveMessage && (
        <div style={{ padding: 12, background: 'var(--primary-xl)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--primary-d)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <CheckCircle2 size={16} />
          <span role="status" style={{ fontWeight: 600 }}>{saveMessage}</span>
        </div>
      )}

      {discardNotice && (
        <div style={{ padding: 12, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span>Unsaved theme changes discarded.</span>
        </div>
      )}

      {/* 7 Color Themes Selection Cards */}
      <div className="card" style={{ padding: 18, marginBottom: 16 }}>
        <div className="card-header" style={{ marginBottom: 14 }}>
          <span className="card-title">Color Themes (7 Distinct Palettes)</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {themes.map(t => {
            const isSelected = selectedTheme === t.id;
            return (
              <div
                key={t.id}
                onClick={() => setSelectedTheme(t.id)}
                style={{
                  padding: 14,
                  borderRadius: 10,
                  border: isSelected ? `2px solid ${t.primary}` : '1px solid var(--border)',
                  background: isSelected ? 'var(--surface2)' : 'var(--surface)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div 
                    style={{ 
                      width: 24, 
                      height: 24, 
                      borderRadius: '50%', 
                      background: t.primary,
                      border: '2px solid #fff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)' 
                    }} 
                  />
                  <div 
                    style={{ 
                      width: 16, 
                      height: 16, 
                      borderRadius: '50%', 
                      background: t.accent,
                      marginLeft: -12,
                      border: '2px solid #fff' 
                    }} 
                  />
                  <span style={{ fontWeight: 700, fontSize: 13, color: isSelected ? t.primary : 'var(--text)' }}>
                    {t.name}
                  </span>
                  {isSelected && <Check size={16} style={{ color: t.primary, marginLeft: 'auto' }} />}
                </div>
                <p className="helper" style={{ fontSize: 11, margin: 0 }}>
                  {t.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Style Presets: "Gradient" vs "Solid" */}
      <div className="card" style={{ padding: 18, marginBottom: 16 }}>
        <div className="card-header" style={{ marginBottom: 14 }}>
          <span className="card-title">Surface Style Presets</span>
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {(['Gradient', 'Solid'] as const).map(preset => (
            <button
              key={preset}
              type="button"
              onClick={() => setStylePreset(preset)}
              style={{
                padding: '12px 24px',
                borderRadius: 8,
                border: stylePreset === preset ? `2px solid ${activeThemeObj.primary}` : '1px solid var(--border)',
                background: stylePreset === preset ? 'var(--surface2)' : 'var(--surface)',
                fontWeight: stylePreset === preset ? 700 : 500,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <Sparkles size={16} style={{ color: activeThemeObj.primary }} />
              <span>{preset}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 18, marginBottom: 16 }}>
        <div className="card-header"><span className="card-title">Menu layout</span></div>
        <div className="seg" style={{ marginTop: 12 }}>
          {(['Side menu', 'Top menu'] as const).map(option => (
            <button key={option} type="button" aria-pressed={layout === option} onClick={() => setLayout(option)}>
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Live Interactive Preview Box */}
      <div className="card" style={{ padding: 20 }}>
        <div className="card-header" style={{ marginBottom: 14 }}>
          <span className="card-title">Live Interface Simulation</span>
        </div>
        <div 
          style={{ 
            padding: 20, 
            borderRadius: 12, 
            background: stylePreset === 'Gradient' 
              ? `linear-gradient(135deg, ${activeThemeObj.bgDark} 0%, #1e293b 100%)` 
              : activeThemeObj.bgDark,
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}
        >
          <div style={{ display: 'flex', flexDirection: layout === 'Side menu' ? 'row' : 'column', gap: 10 }}>
            <div aria-label={layout} style={{
              display: 'flex', flexDirection: layout === 'Side menu' ? 'column' : 'row',
              gap: 8, background: activeThemeObj.primary, borderRadius: 8, padding: 10
            }}>
              <span>Dashboard</span><span>Customers</span><span>Sales</span>
            </div>
            <div style={{ minWidth: 0, fontWeight: 700 }}>Dashboard preview</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', color: activeThemeObj.accent, fontWeight: 700, letterSpacing: '0.05em' }}>
                Previewing Theme: {activeThemeObj.name} ({stylePreset})
              </div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>S.B Borana Jewellers · Showroom Terminal</div>
            </div>
            <button 
              type="button"
              style={{ 
                background: activeThemeObj.primary, 
                color: '#fff', 
                border: 'none', 
                padding: '6px 14px', 
                borderRadius: 6, 
                fontWeight: 700, 
                fontSize: 12,
                cursor: 'pointer' 
              }}
            >
              Action Button
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            <div style={{ background: 'rgba(255,255,255,0.08)', padding: 10, borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>24K Gold Bullion</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fcd34d' }}>₹7,850 / g</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', padding: 10, borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>Daily Invoices</div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>14 Billed</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', padding: 10, borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>Cash Drawer</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#4ade80' }}>₹1,45,200</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeLayoutView;

