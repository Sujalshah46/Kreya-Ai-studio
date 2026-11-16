import React, { useState, useEffect, useRef } from 'react';
import { 
  DEFAULT_THEME, 
  THEME_PRESETS, 
  FONTS, 
  ThemeConfig, 
  applyTheme, 
  loadSavedTheme 
} from '../../utils/themeEngine';

export const ThemeLayoutView: React.FC = () => {
  const [theme, setThemeState] = useState<ThemeConfig>(() => loadSavedTheme());
  const initialThemeRef = useRef<ThemeConfig>(loadSavedTheme());
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [useThemeColoursForLogin, setUseThemeColoursForLogin] = useState(true);

  // Apply theme live whenever state changes
  useEffect(() => {
    applyTheme(theme, { persist: false });
  }, [theme]);

  // Clean up or restore saved on unmount if needed
  useEffect(() => {
    return () => {
      applyTheme(initialThemeRef.current, { persist: false });
    };
  }, []);

  const updateField = <K extends keyof ThemeConfig>(field: K, value: ThemeConfig[K]) => {
    setThemeState(prev => {
      const next = { ...prev, [field]: value };
      if (['primary', 'secondary', 'accent', 'sidebarBg', 'sidebarStyle', 'buttonStyle', 'gold'].includes(field)) {
        next.preset = 'custom';
      }
      return next;
    });
  };

  const handlePickPreset = (presetKey: string) => {
    const found = THEME_PRESETS.find(p => p.key === presetKey);
    if (!found) return;
    setThemeState(prev => ({
      ...prev,
      preset: found.key,
      primary: found.primary,
      secondary: found.secondary,
      accent: found.accent,
      gold: found.gold,
      sidebarStyle: found.sidebarStyle,
      sidebarBg: found.sidebarBg,
      buttonStyle: found.buttonStyle
    }));
  };

  const handleDiscard = () => {
    setThemeState(initialThemeRef.current);
    applyTheme(initialThemeRef.current, { persist: true });
    setSaveToast('Theme reset to saved state');
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleSave = () => {
    setSaving(true);
    try {
      applyTheme(theme, { persist: true });
      initialThemeRef.current = theme;
      setSaveToast('Theme saved for everyone in this shop');
    } catch {
      setSaveToast('Could not save theme preferences');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveToast(null), 3500);
    }
  };

  return (
    <div className="page" id="main">
      {saveToast && (
        <div 
          className="kj-toast" 
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            padding: '10px 16px',
            background: 'var(--surface)',
            color: 'var(--text)',
            borderRadius: 8,
            boxShadow: 'var(--sh-md)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            fontWeight: 600
          }}
        >
          <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="16" width="16" style={{ color: 'var(--primary)' }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{saveToast}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Theme &amp; Layout</h1>
          <p>Colours, light / dark mode, density and navigation for this shop. Changes preview live; Save applies them for every user.</p>
        </div>
        <div className="btn-group">
          <button type="button" className="btn btn-outline" onClick={handleDiscard}>
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em">
              <polyline points="1 4 1 10 7 10"></polyline>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
            </svg> Discard
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg> {saving ? 'Saving…' : 'Save theme'}
          </button>
        </div>
      </div>

      {/* Preset Grid Card */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title">Start from a preset</span>
        </div>
        <div className="card-body">
          <div className="preset-grid">
            {THEME_PRESETS.map(p => {
              const isOn = theme.preset === p.key;
              const isViolet = p.key === 'kreya_violet_classic';
              return (
                <button
                  key={p.key}
                  type="button"
                  className={`preset ${isOn ? 'on' : ''}`}
                  onClick={() => handlePickPreset(p.key)}
                >
                  <div className="preset-mini">
                    <div 
                      className="s" 
                      style={{ 
                        background: isViolet ? 'linear-gradient(rgb(30, 27, 75) 0%, rgb(44, 29, 101) 100%)' : p.sidebarBg, 
                        borderRight: '1px solid rgb(238, 238, 238)' 
                      }} 
                    />
                    <div className="c">
                      <div className="bar" style={{ width: '70%' }}></div>
                      <div className="bar" style={{ width: '45%' }}></div>
                      <div 
                        className="btnp" 
                        style={{ 
                          background: isViolet 
                            ? 'linear-gradient(135deg, rgb(79, 70, 229) 0%, rgb(109, 40, 217) 55%, rgb(192, 38, 211) 100%)' 
                            : p.primary 
                        }} 
                      />
                    </div>
                  </div>
                  <div className="preset-name">
                    {isOn && (
                      <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" style={{ color: 'var(--primary)', marginRight: 4 }}>
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                    {p.name}
                  </div>
                  <div className="preset-note">{p.note}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Two Column Settings Grid */}
      <div className="theme-cols" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16 }}>
        {/* Left Column: Colours & Navigation */}
        <div className="card">
          <div className="card-body">
            <div className="section-divider">Colours</div>
            <div className="g2">
              <div className="form-group">
                <label className="label">Primary (selection, links)</label>
                <div className="color-row">
                  <input 
                    type="color" 
                    className="swatch" 
                    value={theme.primary} 
                    onChange={e => updateField('primary', e.target.value)} 
                  />
                  <input 
                    className="input mono" 
                    maxLength={7} 
                    value={theme.primary} 
                    onChange={e => updateField('primary', e.target.value)} 
                    style={{ maxWidth: 120 }} 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="label">Secondary (gradient start)</label>
                <div className="color-row">
                  <input 
                    type="color" 
                    className="swatch" 
                    value={theme.secondary} 
                    onChange={e => updateField('secondary', e.target.value)} 
                  />
                  <input 
                    className="input mono" 
                    maxLength={7} 
                    value={theme.secondary} 
                    onChange={e => updateField('secondary', e.target.value)} 
                    style={{ maxWidth: 120 }} 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="label">Accent (gradient end)</label>
                <div className="color-row">
                  <input 
                    type="color" 
                    className="swatch" 
                    value={theme.accent} 
                    onChange={e => updateField('accent', e.target.value)} 
                  />
                  <input 
                    className="input mono" 
                    maxLength={7} 
                    value={theme.accent} 
                    onChange={e => updateField('accent', e.target.value)} 
                    style={{ maxWidth: 120 }} 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="label">Gold highlight (rates)</label>
                <div className="color-row">
                  <input 
                    type="color" 
                    className="swatch" 
                    value={theme.gold} 
                    onChange={e => updateField('gold', e.target.value)} 
                  />
                  <input 
                    className="input mono" 
                    maxLength={7} 
                    value={theme.gold} 
                    onChange={e => updateField('gold', e.target.value)} 
                    style={{ maxWidth: 120 }} 
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="label">Main buttons</label>
              <div className="seg">
                <button 
                  type="button" 
                  className={theme.buttonStyle === 'gradient' ? 'on' : ''} 
                  onClick={() => updateField('buttonStyle', 'gradient')}
                >
                  Gradient
                </button>
                <button 
                  type="button" 
                  className={theme.buttonStyle === 'solid' ? 'on' : ''} 
                  onClick={() => updateField('buttonStyle', 'solid')}
                >
                  Solid
                </button>
              </div>
            </div>

            <div className="section-divider">Navigation</div>
            <div className="form-group">
              <label className="label">Menu position</label>
              <div className="seg">
                <button 
                  type="button" 
                  className={theme.navLayout === 'sidebar' ? 'on' : ''} 
                  onClick={() => updateField('navLayout', 'sidebar')}
                >
                  Side menu
                </button>
                <button 
                  type="button" 
                  className={theme.navLayout === 'top' ? 'on' : ''} 
                  onClick={() => updateField('navLayout', 'top')}
                >
                  Top menu
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="label">Side menu style</label>
              <div className="seg">
                <button 
                  type="button" 
                  className={theme.sidebarStyle === 'brand' ? 'on' : ''} 
                  onClick={() => updateField('sidebarStyle', 'brand')}
                >
                  Brand gradient
                </button>
                <button 
                  type="button" 
                  className={theme.sidebarStyle === 'dark' ? 'on' : ''} 
                  onClick={() => updateField('sidebarStyle', 'dark')}
                >
                  Dark
                </button>
                <button 
                  type="button" 
                  className={theme.sidebarStyle === 'light' ? 'on' : ''} 
                  onClick={() => updateField('sidebarStyle', 'light')}
                >
                  Light
                </button>
              </div>
            </div>

            {theme.sidebarStyle !== 'light' && (
              <div className="form-group">
                <label className="label">Side menu colour</label>
                <div className="color-row">
                  <input 
                    type="color" 
                    className="swatch" 
                    value={theme.sidebarBg} 
                    onChange={e => updateField('sidebarBg', e.target.value)} 
                  />
                  <input 
                    className="input mono" 
                    maxLength={7} 
                    value={theme.sidebarBg} 
                    onChange={e => updateField('sidebarBg', e.target.value)} 
                    style={{ maxWidth: 120 }} 
                  />
                </div>
              </div>
            )}

            <label className="check" style={{ marginBottom: 10 }}>
              <input 
                type="checkbox" 
                checked={theme.sidebarCollapsed} 
                onChange={e => updateField('sidebarCollapsed', e.target.checked)} 
              />
              Start with the side menu collapsed (icons only)
            </label>
          </div>
        </div>

        {/* Right Column: Appearance */}
        <div className="card">
          <div className="card-body">
            <div className="section-divider">Appearance</div>
            <div className="form-group">
              <label className="label">Mode</label>
              <div className="seg">
                <button 
                  type="button" 
                  className={theme.mode === 'light' ? 'on' : ''} 
                  onClick={() => updateField('mode', 'light')}
                >
                  Light
                </button>
                <button 
                  type="button" 
                  className={theme.mode === 'dark' ? 'on' : ''} 
                  onClick={() => updateField('mode', 'dark')}
                >
                  Dark
                </button>
                <button 
                  type="button" 
                  className={theme.mode === 'system' ? 'on' : ''} 
                  onClick={() => updateField('mode', 'system')}
                >
                  System
                </button>
              </div>
              <div className="helper">“System” follows each device's light / dark setting.</div>
            </div>

            <div className="form-group">
              <label className="label">Font</label>
              <select 
                className="input" 
                value={theme.fontFamily} 
                onChange={e => updateField('fontFamily', e.target.value as any)}
              >
                {Object.entries(FONTS).map(([key, f]) => (
                  <option key={key} value={key}>{f.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="label">Text size — {Math.round((theme.fontScale || 1) * 100)}%</label>
              <input 
                type="range" 
                min="0.9" 
                max="1.2" 
                step="0.05" 
                value={theme.fontScale || 1} 
                onChange={e => updateField('fontScale', Number(e.target.value))} 
                style={{ width: '100%', accentColor: 'var(--primary)' }} 
              />
            </div>

            <div className="g2">
              <div className="form-group">
                <label className="label">Density</label>
                <div className="seg">
                  <button 
                    type="button" 
                    className={theme.density === 'comfortable' ? 'on' : ''} 
                    onClick={() => updateField('density', 'comfortable')}
                  >
                    Comfortable
                  </button>
                  <button 
                    type="button" 
                    className={theme.density === 'compact' ? 'on' : ''} 
                    onClick={() => updateField('density', 'compact')}
                  >
                    Compact
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="label">Corners</label>
                <div className="seg">
                  <button 
                    type="button" 
                    className={theme.radius === 'sharp' ? 'on' : ''} 
                    onClick={() => updateField('radius', 'sharp')}
                  >
                    Sharp
                  </button>
                  <button 
                    type="button" 
                    className={theme.radius === 'rounded' ? 'on' : ''} 
                    onClick={() => updateField('radius', 'rounded')}
                  >
                    Rounded
                  </button>
                  <button 
                    type="button" 
                    className={theme.radius === 'pill' ? 'on' : ''} 
                    onClick={() => updateField('radius', 'pill')}
                  >
                    Pill
                  </button>
                </div>
              </div>
            </div>

            <label className="check">
              <input 
                type="checkbox" 
                checked={theme.tableZebra} 
                onChange={e => updateField('tableZebra', e.target.checked)} 
              />
              Striped table rows
            </label>
          </div>
        </div>
      </div>

      {/* Live Billing Screen Preview Frame */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <span className="card-title">Preview</span>
          <span className="helper">How a billing screen will look</span>
        </div>
        <div className="card-body">
          <div 
            className="preview-frame" 
            style={{ 
              borderRadius: 'var(--r-lg)',
              overflow: 'hidden',
              border: '1px solid var(--border)'
            }}
          >
            <div className="preview-sb">
              <div style={{ color: 'var(--sb-text-strong)', fontWeight: 700, fontSize: 13, padding: '2px 8px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="16" height="16" viewBox="0 0 64 64" aria-hidden="true" style={{ flexShrink: 0, display: 'block' }}>
                  <defs>
                    <linearGradient id="tpm-g" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#242b27"></stop>
                      <stop offset="1" stopColor="#171c19"></stop>
                    </linearGradient>
                  </defs>
                  <rect width="64" height="64" rx="16.64" fill="url(#tpm-g)"></rect>
                  <rect x=".75" y=".75" width="62.5" height="62.5" rx="15.89" fill="none" stroke="#c5a46d" strokeOpacity=".35" strokeWidth="1.5"></rect>
                  <g fill="none" strokeLinejoin="round" strokeLinecap="round">
                    <path d="M18 25 L24 17 H40 L46 25 L32 49 Z" fill="#c5a46d"></path>
                    <path d="M18 25 H46 M24 17 L28 25 L32 17 L36 25 L40 17 M28 25 L32 49 L36 25" stroke="#171c19" strokeOpacity=".55" strokeWidth="1.6"></path>
                  </g>
                </svg>
                <span>Your Shop</span>
              </div>
              <div style={{ color: 'var(--sb-label)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', padding: '4px 8px' }}>SALES</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 8, borderRadius: 8, fontSize: '12.5px', background: 'var(--sb-active)', color: 'var(--sb-active-text)' }}>
                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="13" width="13">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg> Dashboard
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 8, borderRadius: 8, fontSize: '12.5px', background: 'transparent', color: 'var(--sb-text)' }}>
                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="13" width="13">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg> Orders
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 8, borderRadius: 8, fontSize: '12.5px', background: 'transparent', color: 'var(--sb-text)' }}>
                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="13" width="13">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg> Customers
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 8, borderRadius: 8, fontSize: '12.5px', background: 'transparent', color: 'var(--sb-text)' }}>
                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="13" width="13">
                  <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg> Inventory
              </div>
            </div>

            <div className="preview-main" style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 18 }}>Bill visit: Pooja Desai</div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10 }}>
                  <span>Gold ring 22K · 4.250 g</span>
                  <strong>₹31,720.00</strong>
                </div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span style={{ padding: '6px 11px', borderRadius: 10, fontSize: 12, fontWeight: 600, background: 'var(--surface)', border: '1px solid var(--border2)', color: 'var(--text2)' }}>Cash</span>
                  <span style={{ padding: '6px 11px', borderRadius: 10, fontSize: 12, fontWeight: 600, background: 'var(--primary)', border: '1px solid var(--primary)', color: '#ffffff' }}>UPI</span>
                  <span style={{ padding: '6px 11px', borderRadius: 10, fontSize: 12, fontWeight: 600, background: 'var(--surface)', border: '1px solid var(--border2)', color: 'var(--text2)' }}>Card</span>
                  <span style={{ padding: '6px 11px', borderRadius: 10, fontSize: 12, fontWeight: 600, background: 'var(--surface)', border: '1px solid var(--border2)', color: 'var(--text2)' }}>Bank transfer</span>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <span style={{ padding: '8px 14px', borderRadius: 'var(--btn-radius)', border: '1px solid var(--border2)', fontSize: 12.5, fontWeight: 600, background: 'var(--surface)' }}>Cancel</span>
                  <span style={{ padding: '8px 14px', borderRadius: 'var(--btn-radius)', background: 'var(--btn-bg)', color: '#ffffff', fontSize: 12.5, fontWeight: 600, boxShadow: 'var(--btn-shadow)' }}>Collect ₹31,720.00</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span className="badge" style={{ background: 'var(--success-l)', color: 'var(--primary-d)' }}>Paid</span>
                <span className="badge" style={{ background: 'var(--champagne-l)', color: 'var(--champagne-d)' }}>Gold 22K ₹72,300/10g</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Page Link Card & Scaled Simulation */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <span className="card-title">Login page</span>
          <a className="btn btn-ghost btn-sm" href="/admin/login-page">Logo, texts and layout</a>
        </div>
        <div className="card-body">
          <label className="check" style={{ marginBottom: 12 }}>
            <input 
              type="checkbox" 
              checked={useThemeColoursForLogin} 
              onChange={e => setUseThemeColoursForLogin(e.target.checked)} 
            />
            Left panel of the login page uses these theme colours
          </label>
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden', height: 300 }}>
            <div style={{ transform: 'scale(0.42)', transformOrigin: 'left top', width: '238%', pointerEvents: 'none' }}>
              <div 
                className="login-wrap"
                style={{
                  '--lb-text': '#202522',
                  '--lb-muted': '#59615b',
                  '--lb-soft': '#89918b',
                  '--lb-accent': theme.accent,
                  '--lb-tick-bg': 'color-mix(in srgb, var(--primary) 14%, transparent)',
                  '--lb-tick': 'var(--primary)',
                  '--lb-tick-border': 'color-mix(in srgb, var(--primary) 35%, transparent)',
                  '--lb-line': 'color-mix(in srgb, var(--accent) 45%, transparent)'
                } as any}
              >
                <section 
                  className="login-brand" 
                  style={{
                    backgroundImage: useThemeColoursForLogin
                      ? `linear-gradient(150deg, #f5f2eb 0%, color-mix(in srgb, #f5f2eb 86%, ${theme.primary} 14%) 100%)`
                      : 'linear-gradient(150deg, #171c19 0%, #202522 100%)',
                    flex: '1.1 1 0%'
                  }}
                >
                  <div className="login-brand-head">
                    <svg width="44" height="44" viewBox="0 0 64 64" aria-hidden="true" style={{ flexShrink: 0, display: 'block' }}>
                      <defs>
                        <linearGradient id="lg-g-preview" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0" stopColor="#242b27"></stop>
                          <stop offset="1" stopColor="#171c19"></stop>
                        </linearGradient>
                      </defs>
                      <rect width="64" height="64" rx="16.64" fill="url(#lg-g-preview)"></rect>
                      <rect x=".75" y=".75" width="62.5" height="62.5" rx="15.89" fill="none" stroke="#c5a46d" strokeOpacity=".35" strokeWidth="1.5"></rect>
                      <g fill="none" strokeLinejoin="round" strokeLinecap="round">
                        <path d="M18 25 L24 17 H40 L46 25 L32 49 Z" fill="#c5a46d"></path>
                        <path d="M18 25 H46 M24 17 L28 25 L32 17 L36 25 L40 17 M28 25 L32 49 L36 25" stroke="#171c19" strokeOpacity=".55" strokeWidth="1.6"></path>
                      </g>
                    </svg>
                    <div>
                      <div className="login-shop">S.B Borana Jewellers</div>
                    </div>
                  </div>
                  <div className="login-pitch">
                    <span className="login-rule"></span>
                    <h2>Complete jewellery management in one powerful software</h2>
                    <p className="login-desc">Billing, stock, schemes, loans and reports for jewellery retailers, in one secure system.</p>
                    <ul className="login-highlights">
                      <li>
                        <span className="login-tick">
                          <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="12" width="12">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </span>
                        Billing &amp; GST invoices
                      </li>
                      <li>
                        <span className="login-tick">
                          <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="12" width="12">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </span>
                        Gold / silver loans
                      </li>
                      <li>
                        <span className="login-tick">
                          <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="12" width="12">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </span>
                        Advance metal booking
                      </li>
                      <li>
                        <span className="login-tick">
                          <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="12" width="12">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </span>
                        Stock &amp; valuation
                      </li>
                    </ul>
                  </div>
                  <div className="login-powered">
                    Powered by <strong style={{ color: 'var(--text)' }}>KreyaJewel360</strong>
                  </div>
                </section>

                <section className="login-form-side">
                  <div className="login-card">
                    <div className="login-card-head">
                      <h1>Sign in to your shop</h1>
                      <p className="login-card-sub">S.B Borana Jewellers</p>
                    </div>
                    <div className="form-group">
                      <label className="label">Email or user name</label>
                      <input className="input" placeholder="you@shop.in" readOnly value="" />
                    </div>
                    <div className="form-group">
                      <label className="label">Password</label>
                      <input className="input" type="password" readOnly value="" />
                    </div>
                    <button type="button" className="btn btn-primary login-submit" disabled>Sign in</button>
                    <div className="login-recover">
                      Shop owner locked out? <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Use your recovery code</span>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:1023px){.theme-cols{grid-template-columns:1fr!important}}
      `}</style>
    </div>
  );
};

export default ThemeLayoutView;
