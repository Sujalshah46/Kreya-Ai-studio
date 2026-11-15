import React, { useState } from 'react';
import { readPreviewPreferences, savePreviewPreferences } from './previewPreferences';
import type { StoreProfile } from '../../types';
import { LogIn, Save, Check, Image, KeyRound, Clock, ShieldCheck, CheckCircle2, Monitor, Smartphone, Palette, Sparkles } from 'lucide-react';

type LoginStyle = 'Split' | 'Large image' | 'Centred card';
type PreviewDevice = 'Desktop' | 'Phone';

interface ColorPreset {
  id: string;
  name: string;
  primary: string;
  gradient: string;
}

export const LoginPageView: React.FC<{ store?: StoreProfile }> = ({ store }) => {
  const key = 'kreya:login-preview:' + (store?.id ?? 'default');
  const [initial] = useState(() => readPreviewPreferences(key, {
    style: 'Split' as LoginStyle, color: 'emerald', ownColours: false
  }));
  const [loginStyle, setLoginStyle] = useState<LoginStyle>(
    ['Split', 'Large image', 'Centred card'].includes(initial.style) ? initial.style : 'Split'
  );
  const [selectedColor, setSelectedColor] = useState(initial.color);
  const [ownColours, setOwnColours] = useState(initial.ownColours);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('Desktop');
  const storeName = store?.tradeName || 'S.B Borana Jewellers';
  const [tagline, setTagline] = useState('Exclusive Gold & Diamond Jewellery · Mumbai');
  const [saveMessage, setSaveMessage] = useState('');

  // Color Presets
  const colorPresets: ColorPreset[] = [
    { id: 'emerald', name: 'Emerald', primary: '#047857', gradient: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)' },
    { id: 'graphite', name: 'Graphite', primary: '#334155', gradient: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)' },
    { id: 'royal-gold', name: 'Royal Gold', primary: '#b45309', gradient: 'linear-gradient(135deg, #78350f 0%, #d97706 100%)' },
    { id: 'sapphire', name: 'Sapphire', primary: '#1d4ed8', gradient: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)' },
    { id: 'ruby', name: 'Ruby', primary: '#be123c', gradient: 'linear-gradient(135deg, #881337 0%, #e11d48 100%)' }
  ];

  const activeColor = ownColours
    ? colorPresets.find(c => c.id === selectedColor) || colorPresets[0]
    : { primary: 'var(--primary)', gradient: 'linear-gradient(135deg, var(--primary-d), var(--primary))' };

  const handleSave = () => {
    setSaveMessage(savePreviewPreferences(key, { style: loginStyle, color: selectedColor, ownColours })
      ? 'Login preview settings saved in this browser.' : 'The browser could not save the login preview settings.');
  };

  return (
    <div className="page" style={{ padding: '16px 20px', maxWidth: '100%' }}>
      {/* Page Header */}
      <div className="page-hdr" style={{ marginBottom: 14 }}>
        <div className="page-hdr-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 20, fontWeight: 700, margin: 0 }}>
              <LogIn size={22} style={{ color: activeColor.primary }} />
              Login Page
            </h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fef8ee] text-[#92400e] rounded-full border border-[#efdcb6] text-xs font-semibold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
              <span>Counter MAIN</span>
              <span className="font-normal opacity-80"> · REG-2026-00001 · closing</span>
            </div>
          </div>
          <p className="helper" style={{ margin: '4px 0 0', fontSize: 12 }}>
            Customise login screen layout style, showroom wallpaper, color accents and responsive mobile lock screen · S.B Borana Jewellers
          </p>
        </div>

        {/* Action Button: "Save login page" */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={handleSave}
            className="btn btn-primary btn-sm flex items-center gap-1.5"
            style={{ fontWeight: 700, background: activeColor.primary, borderColor: activeColor.primary }}
            title="Save login page branding and layout"
          >
            <Save size={14} />
            <span>Save login page</span>
          </button>
        </div>
      </div>

      {saveMessage && (
        <div style={{ padding: 12, background: 'var(--primary-xl)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--primary-d)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <CheckCircle2 size={16} />
          <span role="status" style={{ fontWeight: 600 }}>{saveMessage}</span>
        </div>
      )}

      {/* Configuration Cards */}
      <div className="g2" style={{ gap: 16, marginBottom: 16, alignItems: 'start' }}>
        {/* Left Column: Layout Styles & Colors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Required Styles: "Split", "Large image", "Centred card" */}
          <div className="card" style={{ padding: 18 }}>
            <div className="card-header" style={{ marginBottom: 12 }}>
              <span className="card-title">Layout Style</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(['Split', 'Large image', 'Centred card'] as LoginStyle[]).map(style => (
                <label
                  key={style}
                  onClick={() => setLoginStyle(style)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 12,
                    borderRadius: 8,
                    border: loginStyle === style ? `2px solid ${activeColor.primary}` : '1px solid var(--border)',
                    background: loginStyle === style ? 'var(--surface2)' : 'var(--surface)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: loginStyle === style ? activeColor.primary : 'var(--text)' }}>
                      {style}
                    </div>
                    <div className="helper" style={{ fontSize: 11 }}>
                      {style === 'Split' && 'Two-column layout: showroom visual on left, PIN & login form on right'}
                      {style === 'Large image' && 'Full-bleed showroom photo backdrop with floating glassmorphism card'}
                      {style === 'Centred card' && 'Minimalist centred focus card with dark luxury wallpaper'}
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="login_style"
                    checked={loginStyle === style}
                    onChange={() => setLoginStyle(style)}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Color Presets */}
          <div className="card" style={{ padding: 18 }}>
            <div className="card-header" style={{ marginBottom: 12 }}>
              <span className="card-title">Colours</span>
            </div>
            <div className="seg" style={{ marginBottom: 10 }}>
              <button type="button" aria-pressed={!ownColours} onClick={() => setOwnColours(false)}>Follow shop theme</button>
              <button type="button" aria-pressed={ownColours} onClick={() => setOwnColours(true)}>Own colours</button>
            </div>
            {ownColours && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {colorPresets.map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedColor(preset.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: selectedColor === preset.id ? `2px solid ${preset.primary}` : '1px solid var(--border)',
                    background: selectedColor === preset.id ? 'var(--surface2)' : 'var(--surface)',
                    cursor: 'pointer',
                    fontWeight: selectedColor === preset.id ? 700 : 500,
                    fontSize: 12
                  }}
                >
                  <span style={{ width: 14, height: 14, borderRadius: '50%', background: preset.primary }} />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>}
          </div>
        </div>

        {/* Right Column: Live Interactive Device Preview Frame */}
        <div className="card" style={{ padding: 18 }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span className="card-title">Device Preview Simulation</span>

            {/* "Desktop" / "Phone" preview toggle */}
            <div className="seg" style={{ display: 'flex', borderRadius: 6, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => setPreviewDevice('Desktop')}
                className={`btn btn-sm ${previewDevice === 'Desktop' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '4px 10px', fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Monitor size={13} />
                <span>Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('Phone')}
                className={`btn btn-sm ${previewDevice === 'Phone' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '4px 10px', fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Smartphone size={13} />
                <span>Phone</span>
              </button>
            </div>
          </div>

          {/* Preview Container */}
          <div 
            style={{ 
              background: '#0f172a', 
              padding: previewDevice === 'Desktop' ? 16 : '24px 40px', 
              borderRadius: 12,
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            {/* Desktop Frame */}
            {previewDevice === 'Desktop' && (
              <div 
                style={{ 
                  width: '100%', 
                  height: 280, 
                  background: loginStyle === 'Large image' ? activeColor.gradient : '#1e293b', 
                  borderRadius: 8,
                  overflow: 'hidden',
                  display: 'flex',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                {loginStyle === 'Split' && (
                  <div style={{ flex: 1, background: activeColor.gradient, padding: 20, color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 800 }}>{storeName}</div>
                    <div style={{ fontSize: 10, opacity: 0.8, marginTop: 4 }}>{tagline}</div>
                  </div>
                )}

                <div 
                  style={{ 
                    flex: loginStyle === 'Split' ? 1 : 'unset', 
                    width: loginStyle === 'Split' ? 'unset' : 280,
                    margin: loginStyle === 'Split' ? 0 : 'auto',
                    background: '#ffffff', 
                    padding: 20, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center',
                    borderRadius: loginStyle === 'Split' ? 0 : 8,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Sign in to your shop</div>
                  <div style={{ fontSize: 10, color: '#64748b', marginBottom: 10 }}>Sign in</div>
                  <div style={{ background: '#f1f5f9', padding: '6px 10px', borderRadius: 4, fontSize: 11, marginBottom: 8, color: '#334155' }}>
                    ••••
                  </div>
                  <button 
                    type="button" disabled
                    style={{ background: activeColor.primary, color: '#fff', border: 'none', padding: '6px', borderRadius: 4, fontWeight: 700, fontSize: 11 }}
                  >
                    Sign in
                  </button>
                </div>
              </div>
            )}

            {/* Phone Frame */}
            {previewDevice === 'Phone' && (
              <div 
                style={{ 
                  width: 180, 
                  height: 320, 
                  background: activeColor.gradient, 
                  borderRadius: 24,
                  border: '4px solid #334155',
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                }}
              >
                <div style={{ textAlign: 'center', color: '#fff', marginTop: 12 }}>
                  <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11 }}>
                    SB
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700 }}>{storeName}</div>
                </div>

                <div style={{ background: '#fff', padding: 10, borderRadius: 10 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#0f172a', textAlign: 'center', marginBottom: 6 }}>PIN Pad</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, textAlign: 'center', fontSize: 10, fontWeight: 700 }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((k, i) => (
                      <div key={i} style={{ background: '#f8fafc', padding: 4, borderRadius: 4 }}>{k}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPageView;

