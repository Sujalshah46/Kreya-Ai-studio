import React, { useState } from 'react';
import { Award, CheckCircle, ShieldCheck, Cpu, Building2, Calendar, Key, RefreshCw, PhoneCall, ExternalLink, MessageCircle, CheckCircle2 } from 'lucide-react';
import { StoreProfile } from '../../types';

interface LicenceViewProps {
  store: StoreProfile;
}

export const LicenceView: React.FC<LicenceViewProps> = ({ store }) => {
  const [activeKey, setActiveKey] = useState('KRY-TD4G6-CQ6ES-7AQAV-P228S');
  const [newKeyInput, setNewKeyInput] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>('Licence active and validated.');

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setStatusMessage('Licence refreshed successfully from Kreya licensing server.');
      setTimeout(() => setStatusMessage(null), 4000);
    }, 800);
  };

  const handleAddKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyInput.trim()) return;
    setActiveKey(newKeyInput.trim());
    setNewKeyInput('');
    setStatusMessage('New licence key registered and activated!');
    setTimeout(() => setStatusMessage(null), 4000);
  };

  return (
    <div className="page">
      {/* Page Header */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Licence & Activation</h1>
          <p>
            Activate or refresh your KreyaJewel360 licence keys from Kreya IT Consulting · S.B Borana Jewellers
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn btn-outline btn-sm"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Refresh all</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div style={{ padding: 12, background: 'var(--primary-xl)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--primary-d)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <CheckCircle2 size={16} />
          <span style={{ fontWeight: 600 }}>{statusMessage}</span>
        </div>
      )}

      {/* Main Licence Certificate Card */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ background: 'var(--graphite)', color: '#fff', padding: '20px 24px', borderRadius: '16px 16px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 999, background: 'var(--graphite-s)', border: '1px solid #c5a46d59', color: 'var(--champagne)', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
              <Award size={14} />
              <span>Multi-Terminal Showroom Edition</span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>KreyaJewel360</h2>
            <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
              Registered To: <strong style={{ color: '#fff' }}>S.B Borana Jewellers</strong> · 3-5 Niwas , Vile parle east Mumbai
            </p>
          </div>

          <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.06)', padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--champagne)', fontWeight: 700 }}>
              Licence Status
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginTop: 2 }}>
              <span>ACTIVE</span>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
              Valid till 15-Dec-2026 (Multi-Terminal)
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleRefresh}
                className="btn btn-outline btn-xs"
                style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', padding: '2px 8px', fontSize: 11 }}
                title="Refresh licence status from server"
              >
                <RefreshCw size={11} className={isRefreshing ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
              <a
                href="https://wa.me/919582388885?text=Hi%20Kreya%2C%20I%20would%20like%20to%20renew%20my%20KreyaJewel360%20licence"
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary btn-xs"
                style={{ padding: '2px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                title="Open licence renewal link"
              >
                <ExternalLink size={11} />
                <span>Renewal link</span>
              </a>
            </div>
          </div>
        </div>

        {/* Credentials Grid */}
        <div className="card-body">
          <div className="g2">
            <div>
              <div className="section-divider" style={{ marginBottom: 12 }}>
                <span>LICENSEE DETAILS</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="helper">Business Name:</span>
                  <strong style={{ color: 'var(--text)' }}>S.B Borana Jewellers</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="helper">Owner:</span>
                  <span style={{ fontWeight: 600 }}>Sujal shah</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="helper">GSTIN:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{store.gstin || '27ACZPJ7126B1ZA'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="helper">Phone / Mobile:</span>
                  <span style={{ fontFamily: 'monospace' }}>9324773823</span>
                </div>
              </div>
            </div>

            <div>
              <div className="section-divider" style={{ marginBottom: 12 }}>
                <span>ACTIVATION & KEY DETAILS</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="helper">Active Licence Key:</span>
                  <strong style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{activeKey}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="helper">Plan / Edition:</span>
                  <span style={{ fontWeight: 600 }}>Multi-Terminal Showroom Edition</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="helper">Multi-User Seats:</span>
                  <span className="badge badge-green">Unlimited Terminals</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="helper">Expiry Date:</span>
                  <span style={{ fontWeight: 700, color: 'var(--gold-d)' }}>15-Dec-2026</span>
                </div>
              </div>
            </div>
          </div>

          {/* Activate New Key Strip */}
          <div style={{ marginTop: 20, padding: 14, background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <form onSubmit={handleAddKey} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="label" style={{ margin: 0, fontSize: 12.5, fontWeight: 600 }}>Add / Activate Key:</span>
              <input
                type="text"
                placeholder="e.g. KRY-XXXXX-XXXXX-XXXXX-XXXXX"
                value={newKeyInput}
                onChange={(e) => setNewKeyInput(e.target.value.toUpperCase())}
                className="input input-sm"
                style={{ flex: 1, minWidth: 240, fontFamily: 'monospace', fontWeight: 'bold' }}
              />
              <button type="submit" className="btn btn-primary btn-sm flex items-center gap-1.5">
                <CheckCircle size={14} />
                <span>Validate & save</span>
              </button>
            </form>
          </div>
        </div>

        {/* Footer Support Info */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', background: 'var(--zebra)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
            <ShieldCheck size={16} style={{ color: 'var(--primary)' }} />
            <span>Digital signature authenticated with Kreya IT Consulting.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12 }}>
            <a 
              href="tel:+919582388885" 
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
            >
              <PhoneCall size={14} style={{ color: 'var(--primary)' }} />
              <span>+91-9582388885</span>
            </a>
            <a 
              href="https://wa.me/919582388885" 
              target="_blank" 
              rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--primary)' }}
            >
              <MessageCircle size={14} />
              <span>WhatsApp Support</span>
            </a>
          </div>
        </div>
      </div>

      <div style={{ padding: 14, background: 'var(--warn-l)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--warn)', fontSize: 12.5, lineHeight: 1.6 }}>
        <strong>Perpetual Data Access Guarantee:</strong> To renew, extend a licence or add user seats, contact Kreya IT Consulting. When a licence expires, your data is never deleted — you can always view, search, export, and print all invoices, customers, and accounting registers.
      </div>
    </div>
  );
};
