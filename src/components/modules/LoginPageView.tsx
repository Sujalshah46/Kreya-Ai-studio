import React, { useState, useEffect } from 'react';
import type { StoreProfile } from '../../types';

export interface LoginCustomizationConfig {
  layout: 'split' | 'image' | 'centered';
  logoUrl?: string;
  backgroundImage?: string;
  colorSource: 'theme' | 'custom';
  bgFrom: string;
  bgTo: string;
  tagline: string;
  description: string;
  welcomeText: string;
  contactLine: string;
  highlights: string[];
  showPoweredBy: boolean;
}

const DEFAULT_LOGIN_CONFIG: LoginCustomizationConfig = {
  layout: 'split',
  logoUrl: '',
  backgroundImage: '',
  colorSource: 'theme',
  bgFrom: '#171c19',
  bgTo: '#202522',
  tagline: 'Complete jewellery management in one powerful software',
  description: 'Billing, stock, schemes, loans and reports for jewellery retailers, in one secure system.',
  welcomeText: 'Sign in to your shop',
  contactLine: '3-5 Niwas, Vile Parle East Mumbai · +91 9324773823',
  highlights: [
    'Billing & GST invoices',
    'Gold / silver loans',
    'Advance metal booking',
    'Stock & valuation',
    'Real-time GST Compliant',
    'Multi-branch Inventory'
  ],
  showPoweredBy: true
};

const STORAGE_KEY = 'kj_login_page_v1';

export const LoginPageView: React.FC<{ store?: StoreProfile }> = ({ store }) => {
  const [config, setConfig] = useState<LoginCustomizationConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...DEFAULT_LOGIN_CONFIG, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_LOGIN_CONFIG;
  });

  const [device, setDevice] = useState<'desktop' | 'phone'>('desktop');
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const shopName = store?.tradeName || 'S.B Borana Jewellers';

  const updateConfig = <K extends keyof LoginCustomizationConfig>(key: K, val: LoginCustomizationConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: val }));
  };

  const updateHighlight = (index: number, val: string) => {
    setConfig(prev => {
      const list = [...prev.highlights];
      list[index] = val;
      return { ...prev, highlights: list };
    });
  };

  const handleFileUpload = (field: 'logoUrl' | 'backgroundImage') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
      alert('Use a PNG, JPG or WebP image');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateConfig(field, reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = () => {
    setSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      setToastMessage('Login page saved');
    } catch {
      setToastMessage('Could not save login page');
    } finally {
      setSaving(false);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Reset login page customization to factory defaults?')) {
      setConfig(DEFAULT_LOGIN_CONFIG);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LOGIN_CONFIG));
      setToastMessage('Reset to defaults');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Compute live gradient
  const leftPanelBg = config.colorSource === 'theme'
    ? 'linear-gradient(150deg, #f5f2eb 0%, color-mix(in srgb, #f5f2eb 86%, var(--primary) 14%) 100%)'
    : `linear-gradient(150deg, ${config.bgFrom} 0%, ${config.bgTo} 100%)`;

  const leftPanelTextColor = config.colorSource === 'theme' ? '#202522' : '#ffffff';

  return (
    <div className="page" id="main">
      {toastMessage && (
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
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Login Page</h1>
          <p>What your staff see before they sign in: logo, background, tagline and contact line.</p>
        </div>
        <div className="btn-group">
          <button type="button" className="btn btn-outline" onClick={handleResetDefaults}>
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em">
              <polyline points="1 4 1 10 7 10"></polyline>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
            </svg> Reset to Defaults
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg> {saving ? 'Saving…' : 'Save login page'}
          </button>
        </div>
      </div>

      {/* Layout Columns */}
      <div className="lp-cols" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 420px) minmax(0, 1fr)', gap: 16 }}>
        {/* Left Column: Customization Controls */}
        <div className="card">
          <div className="card-body">
            {/* Layout */}
            <div className="form-group">
              <label className="label">Layout</label>
              <div className="seg">
                {[
                  ['split', 'Split'],
                  ['image', 'Large image'],
                  ['centered', 'Centred card']
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={config.layout === key ? 'on' : ''}
                    onClick={() => updateConfig('layout', key as any)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Logo */}
            <div className="form-group">
              <label className="label">Logo</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {config.logoUrl ? (
                  <img src={config.logoUrl} alt="" className="img-preview-sm" style={{ objectFit: 'contain', width: 44, height: 44, borderRadius: 8, border: '1px solid var(--border)' }} />
                ) : (
                  <div className="td-no-img" style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="20" width="20" style={{ color: 'var(--muted)' }}>
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                )}
                <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                  Upload
                  <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={handleFileUpload('logoUrl')} />
                </label>
                {config.logoUrl && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => updateConfig('logoUrl', '')}>
                    Remove
                  </button>
                )}
              </div>
              <div className="helper">Empty = the shop logo from Shop Settings, or the KreyaJewel360 mark.</div>
            </div>

            {/* Background image */}
            <div className="form-group">
              <label className="label">Background image</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                  Upload
                  <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={handleFileUpload('backgroundImage')} />
                </label>
                {config.backgroundImage && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => updateConfig('backgroundImage', '')}>
                    Remove
                  </button>
                )}
              </div>
              <input 
                className="input" 
                style={{ marginTop: 8 }} 
                placeholder="…or paste an https:// image link" 
                value={config.backgroundImage?.startsWith('data:') ? '' : (config.backgroundImage || '')} 
                onChange={e => updateConfig('backgroundImage', e.target.value)} 
              />
            </div>

            {/* Left panel colours */}
            <div className="form-group">
              <label className="label">Left panel colours</label>
              <div className="seg" role="radiogroup" aria-label="Left panel colours">
                <button 
                  type="button" 
                  className={config.colorSource === 'theme' ? 'on' : ''} 
                  onClick={() => updateConfig('colorSource', 'theme')}
                >
                  Follow shop theme
                </button>
                <button 
                  type="button" 
                  className={config.colorSource === 'custom' ? 'on' : ''} 
                  onClick={() => updateConfig('colorSource', 'custom')}
                >
                  Own colours
                </button>
              </div>
              <div className="helper">
                {config.colorSource === 'theme' ? (
                  <>The panel uses the side-menu, button and accent colours from <a href="/admin/theme" style={{ fontWeight: 600, color: 'var(--primary)' }}>Theme &amp; Layout</a>, so it changes with the theme.</>
                ) : (
                  'Pick a gradient for the panel below. It stays the same when the shop theme changes.'
                )}
              </div>
            </div>

            {config.colorSource === 'custom' && (
              <>
                <div className="g2">
                  <div className="form-group">
                    <label className="label">Gradient from</label>
                    <input 
                      type="color" 
                      className="swatch" 
                      value={config.bgFrom} 
                      onChange={e => updateConfig('bgFrom', e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">Gradient to</label>
                    <input 
                      type="color" 
                      className="swatch" 
                      value={config.bgTo} 
                      onChange={e => updateConfig('bgTo', e.target.value)} 
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="label">Quick colours</label>
                  <div className="btn-group" style={{ flexWrap: 'wrap', gap: 6 }}>
                    {[
                      ['Graphite', '#171c19', '#202522'],
                      ['Graphite and emerald', '#171c19', '#185b40'],
                      ['Graphite and gold', '#171c19', '#5c4a2c'],
                      ['Warm ivory', '#f5f2eb', '#e9e2d3']
                    ].map(([name, from, to]) => (
                      <button
                        key={name}
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          setConfig(prev => ({ ...prev, colorSource: 'custom', bgFrom: from, bgTo: to }));
                        }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        <span 
                          style={{ 
                            width: 14, 
                            height: 14, 
                            borderRadius: 4, 
                            background: `linear-gradient(135deg, ${from}, ${to})`, 
                            display: 'inline-block', 
                            border: '1px solid var(--border)' 
                          }} 
                        />
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Tagline */}
            <div className="form-group">
              <label className="label">Tagline</label>
              <input 
                className="input" 
                maxLength={120} 
                value={config.tagline} 
                onChange={e => updateConfig('tagline', e.target.value)} 
              />
            </div>

            {/* Short description */}
            <div className="form-group">
              <label className="label">Short description</label>
              <textarea 
                className="input" 
                rows={2} 
                maxLength={240} 
                value={config.description} 
                onChange={e => updateConfig('description', e.target.value)} 
                placeholder="One line about the shop or the software" 
              />
            </div>

            {/* Welcome text */}
            <div className="form-group">
              <label className="label">Welcome text</label>
              <input 
                className="input" 
                maxLength={200} 
                value={config.welcomeText} 
                onChange={e => updateConfig('welcomeText', e.target.value)} 
              />
            </div>

            {/* Contact line */}
            <div className="form-group">
              <label className="label">Contact line</label>
              <input 
                className="input" 
                maxLength={200} 
                placeholder="e.g. 7-57 Ithum Galleria, Gr. Noida · +91 98xxxxxxx" 
                value={config.contactLine} 
                onChange={e => updateConfig('contactLine', e.target.value)} 
              />
            </div>

            {/* Highlights */}
            <div className="form-group">
              <label className="label">Highlights (up to 6)</label>
              {[0, 1, 2, 3, 4, 5].map(idx => (
                <input
                  key={idx}
                  className="input input-sm"
                  style={{ marginBottom: 6 }}
                  maxLength={60}
                  value={config.highlights?.[idx] || ''}
                  onChange={e => updateHighlight(idx, e.target.value)}
                  placeholder={`Highlight ${idx + 1}`}
                />
              ))}
            </div>

            {/* Show Powered by */}
            <label className="check">
              <input 
                type="checkbox" 
                checked={config.showPoweredBy} 
                onChange={e => updateConfig('showPoweredBy', e.target.checked)} 
              />
              Show “Powered by KreyaJewel360”
            </label>
          </div>
        </div>

        {/* Right Column: Live Interactive Device Preview Frame */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title">Preview</span>
            <div className="seg">
              <button 
                type="button"
                className={device === 'desktop' ? 'on' : ''} 
                onClick={() => setDevice('desktop')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="13" width="13">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                Desktop
              </button>
              <button 
                type="button"
                className={device === 'phone' ? 'on' : ''} 
                onClick={() => setDevice('phone')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="13" width="13">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
                Phone
              </button>
            </div>
          </div>

          <div className="card-body" style={{ background: 'var(--bg)', display: 'flex', justifyContent: 'center' }}>
            <div 
              style={{ 
                width: device === 'phone' ? 380 : '100%', 
                height: 560, 
                overflow: 'hidden', 
                borderRadius: 14, 
                border: '1px solid var(--border)', 
                position: 'relative' 
              }}
            >
              <div 
                style={{ 
                  transform: device === 'phone' ? 'none' : 'scale(.62)', 
                  transformOrigin: 'top left', 
                  width: device === 'phone' ? '100%' : '161%', 
                  pointerEvents: 'none' 
                }} 
                className={device === 'phone' ? 'lp-phone' : ''}
              >
                <div 
                  className={`login-wrap ${config.layout === 'centered' ? 'login-centered-wrap' : ''}`}
                  style={{
                    minHeight: device === 'phone' ? 560 : 640,
                    backgroundImage: config.backgroundImage ? `url(${config.backgroundImage})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    '--lb-text': leftPanelTextColor,
                    '--lb-muted': config.colorSource === 'theme' ? '#59615b' : 'rgba(255,255,255,0.7)',
                    '--lb-soft': config.colorSource === 'theme' ? '#89918b' : 'rgba(255,255,255,0.5)',
                    '--lb-accent': 'var(--accent)',
                    '--lb-tick-bg': 'color-mix(in srgb, var(--primary) 14%, transparent)',
                    '--lb-tick': 'var(--primary)',
                    '--lb-tick-border': 'color-mix(in srgb, var(--primary) 35%, transparent)',
                    '--lb-line': 'color-mix(in srgb, var(--accent) 45%, transparent)'
                  } as any}
                >
                  {/* Left Brand Panel */}
                  {config.layout !== 'centered' && (
                    <section 
                      className="login-brand"
                      style={{
                        background: leftPanelBg,
                        flex: config.layout === 'image' ? '1.5 1 0%' : '1.1 1 0%'
                      }}
                    >
                      <div className="login-brand-head">
                        {config.logoUrl ? (
                          <img src={config.logoUrl} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'contain' }} />
                        ) : (
                          <svg width="44" height="44" viewBox="0 0 64 64" aria-hidden="true" style={{ flexShrink: 0, display: 'block' }}>
                            <defs>
                              <linearGradient id="lg-g-sub" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0" stopColor="#242b27"></stop>
                                <stop offset="1" stopColor="#171c19"></stop>
                              </linearGradient>
                            </defs>
                            <rect width="64" height="64" rx="16.64" fill="url(#lg-g-sub)"></rect>
                            <rect x=".75" y=".75" width="62.5" height="62.5" rx="15.89" fill="none" stroke="#c5a46d" strokeOpacity=".35" strokeWidth="1.5"></rect>
                            <g fill="none" strokeLinejoin="round" strokeLinecap="round">
                              <path d="M18 25 L24 17 H40 L46 25 L32 49 Z" fill="#c5a46d"></path>
                              <path d="M18 25 H46 M24 17 L28 25 L32 17 L36 25 L40 17 M28 25 L32 49 L36 25" stroke="#171c19" strokeOpacity=".55" strokeWidth="1.6"></path>
                            </g>
                          </svg>
                        )}
                        <div>
                          <div className="login-shop">{shopName}</div>
                        </div>
                      </div>

                      <div className="login-pitch">
                        <span className="login-rule"></span>
                        <h2>{config.tagline}</h2>
                        {config.description && <p className="login-desc">{config.description}</p>}
                        
                        <ul className="login-highlights">
                          {config.highlights.filter(Boolean).map((h, i) => (
                            <li key={i}>
                              <span className="login-tick">
                                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="12" width="12">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              </span>
                              {h}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {config.contactLine && (
                        <div className="login-contact" style={{ fontSize: 11, marginTop: 'auto', paddingTop: 16 }}>
                          {config.contactLine}
                        </div>
                      )}

                      {config.showPoweredBy && (
                        <div className="login-powered" style={{ marginTop: 12 }}>
                          Powered by <strong>KreyaJewel360</strong>
                        </div>
                      )}
                    </section>
                  )}

                  {/* Form Side */}
                  <section className="login-form-side">
                    <form className="login-card" onSubmit={e => e.preventDefault()}>
                      <div className="login-card-head">
                        <h1>{config.welcomeText}</h1>
                        <p className="login-card-sub">{shopName}</p>
                      </div>

                      <div className="form-group">
                        <label className="label">Email or user name</label>
                        <input className="input" placeholder="you@shop.in" defaultValue="" />
                      </div>

                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                          <label className="label" style={{ margin: 0 }}>Password</label>
                          <span style={{ fontSize: 12.5, color: 'var(--primary)', fontWeight: 600 }}>Forgot password?</span>
                        </div>
                        <input className="input" type="password" defaultValue="" />
                      </div>

                      <button type="button" className="btn btn-primary login-submit">Sign in</button>

                      <div className="login-recover">
                        Shop owner locked out? <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Use your recovery code</span>
                      </div>
                    </form>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:1023px){.lp-cols{grid-template-columns:1fr!important}}
        .lp-phone .login-brand{display:none}
        .lp-phone .login-wrap{min-height:560px}
      `}</style>
    </div>
  );
};

export default LoginPageView;
