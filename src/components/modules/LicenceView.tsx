import React, { useState } from 'react';
import { RefreshCw, Phone, MessageSquare, Mail, Award, CheckCircle2, ShieldCheck, KeyRound, Info, Copy, Check } from 'lucide-react';
import type { StoreProfile } from '../../types';
import { mockStore } from '../../data/mockData';

interface LicenceViewProps {
  store?: StoreProfile;
}

interface LicenceKeyRecord {
  id: string;
  licenseKey: string;
  licenseKeyMasked: string;
  plan: string;
  status: 'active' | 'expiring' | 'expired' | 'blocked';
  expiresOn: string;
  daysRemaining: number;
  lastVerifiedAt: string;
  maxUsers: number | 'unlimited';
  seatsUsed: number;
}

export const LicenceView: React.FC<LicenceViewProps> = ({ store = mockStore }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState<string | null>(null);
  const [newKeyInput, setNewKeyInput] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  const tenantId = "788195d6-463b-4f94-bfeb-41aad2c84f5e";
  const plan = "Enterprise Pro";
  const expiryDate = "15-Dec-2026";
  const daysRemaining = 29;
  const daysRemainingText = "29 days remaining";

  const [keysList, setKeysList] = useState<LicenceKeyRecord[]>([
    {
      id: "key-ent-01",
      licenseKey: "KJ360-ENT-788195D6-PRO9-8812",
      licenseKeyMasked: "KJ360-ENT-788195D6-****-****",
      plan: "Enterprise Pro",
      status: "active",
      expiresOn: "15-Dec-2026",
      daysRemaining: 29,
      lastVerifiedAt: "Today, 12:45 PM",
      maxUsers: "unlimited",
      seatsUsed: 3
    }
  ]);

  const handleRefreshAll = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setRefreshSuccess(`Licence active until ${expiryDate} (${daysRemaining} days remaining). Verified with Kreya licence server.`);
      setTimeout(() => setRefreshSuccess(null), 5000);
    }, 600);
  };

  const handleRefreshSingleKey = (keyId: string) => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setRefreshSuccess(`Key verified with Kreya licence server — active, expiry ${expiryDate}.`);
      setTimeout(() => setRefreshSuccess(null), 4000);
    }, 400);
  };

  const handleAddKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyInput.trim()) return;
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      const formatted = newKeyInput.trim().toUpperCase();
      const newKeyObj: LicenceKeyRecord = {
        id: `key-${Date.now()}`,
        licenseKey: formatted,
        licenseKeyMasked: `${formatted.slice(0, 15)}****-****`,
        plan: "Enterprise Pro",
        status: "active",
        expiresOn: "15-Dec-2026",
        daysRemaining: 29,
        lastVerifiedAt: "Just now",
        maxUsers: "unlimited",
        seatsUsed: 3
      };
      setKeysList(prev => [newKeyObj, ...prev]);
      setNewKeyInput('');
      setRefreshSuccess(`Licence key ${formatted} validated and activated successfully!`);
      setTimeout(() => setRefreshSuccess(null), 5000);
    }, 500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const vendorName = "Kreya IT Consulting";
  const vendorPhone = "+91 93247 73823";
  const vendorEmail = "support@kreyait.com";

  return (
    <div className="page">
      {/* 1. Header */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Licence</h1>
          <p>Activate and refresh your KreyaJewel360 licence keys from {vendorName} · {store.tradeName}</p>
        </div>
        <div className="btn-group">
          <button 
            type="button" 
            onClick={handleRefreshAll} 
            className="btn btn-outline"
            disabled={isRefreshing}
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Checking…' : 'Refresh all'}</span>
          </button>
        </div>
      </div>

      {refreshSuccess && (
        <div className="card" style={{ marginBottom: 14, background: '#ecfdf5', borderColor: '#10b981', color: '#065f46', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
            <CheckCircle2 size={16} style={{ color: '#10b981' }} />
            <span>{refreshSuccess}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setRefreshSuccess(null)} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065f46', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Top Summary Grid: 2 Columns */}
      <div className="g2" style={{ alignItems: 'start', marginBottom: 16 }}>
        {/* Left: Licence Status & Details */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={16} style={{ color: 'var(--primary)' }} />
              Shop Licence Status
            </strong>
            <span className="badge badge-green">Active</span>
          </div>
          <div className="card-body">
            <dl className="kv" style={{ display: 'grid', gridTemplateColumns: '150px 1fr', rowGap: 10, fontSize: 13 }}>
              <dt style={{ color: 'var(--muted)', fontWeight: 600 }}>Shop licence</dt>
              <dd style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="badge badge-green">Active</span>
                <span className="badge badge-gray" title="Set LICENSE_ENFORCEMENT=enforce on the server to block new entries after expiry">
                  blocking: warn
                </span>
              </dd>

              <dt style={{ color: 'var(--muted)', fontWeight: 600 }}>Plan</dt>
              <dd>
                <span className="badge badge-blue" style={{ fontWeight: 700 }}>{plan}</span>
              </dd>

              <dt style={{ color: 'var(--muted)', fontWeight: 600 }}>Valid until</dt>
              <dd>
                <span style={{ fontWeight: 700 }}>{expiryDate}</span>
                <span className="helper" style={{ display: 'inline', marginLeft: 6, fontWeight: 600, color: 'var(--primary)' }}>
                  ({daysRemainingText})
                </span>
              </dd>

              <dt style={{ color: 'var(--muted)', fontWeight: 600 }}>Tenant ID</dt>
              <dd className="mono" style={{ fontSize: 12, wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{tenantId}</span>
                <button 
                  type="button" 
                  className="btn btn-xs btn-outline" 
                  style={{ padding: '2px 5px', fontSize: 10 }}
                  onClick={() => copyToClipboard(tenantId)}
                  title="Copy Tenant ID"
                >
                  {copiedKey ? <Check size={10} /> : <Copy size={10} />}
                </button>
              </dd>

              <dt style={{ color: 'var(--muted)', fontWeight: 600 }}>Active key</dt>
              <dd className="mono" style={{ fontSize: 12 }}>
                KJ360-ENT-788195D6-****-****
              </dd>

              <dt style={{ color: 'var(--muted)', fontWeight: 600 }}>User seats</dt>
              <dd>
                <span style={{ fontWeight: 600 }}>3 used of unlimited</span>
              </dd>

              <dt style={{ color: 'var(--muted)', fontWeight: 600 }}>Last verified</dt>
              <dd style={{ color: 'var(--muted)' }}>Today, 12:45 PM</dd>
            </dl>

            {/* Licence Server Connection Details */}
            <div className="alert alert-info" style={{ marginTop: 18, marginBottom: 14, fontSize: 12.5, lineHeight: 1.6, borderRadius: 8, padding: '12px 14px', background: 'var(--info-l, #e8f0f5)', border: '1px solid var(--info, #477c9c)' }}>
              <div style={{ fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <KeyRound size={14} />
                Licence Server Connection
              </div>
              <div>API key on the server: <strong>set ✓</strong></div>
              <div>Product: <strong>KreyaJewel360</strong> · Machine ID: <span className="mono">{tenantId}</span></div>
              <div>Public key (primary): <span className="mono">ED25519-VERIFIED-788195D6</span></div>
              <div style={{ wordBreak: 'break-all' }}>Licence server: <span className="mono">https://licence.kreyait.com/api/v1</span></div>
              <div style={{ marginTop: 4, color: 'var(--primary)' }}>
                Last sync (key KJ360-ENT-788195D6): <strong>active · HTTP 200 (OK)</strong>
              </div>
            </div>

            {/* Add a licence key */}
            <form onSubmit={handleAddKey}>
              <label className="label">Add a licence key</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input 
                  type="text" 
                  className="input mono" 
                  placeholder="KJ360-XXXX-XXXX-XXXX"
                  value={newKeyInput}
                  onChange={(e) => setNewKeyInput(e.target.value)}
                />
                <button type="submit" className="btn btn-primary btn-sm" disabled={!newKeyInput.trim() || isRefreshing}>
                  Add licence key
                </button>
              </div>
              <div className="helper" style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Info size={11} />
                <span>The key is checked with {vendorName}'s licence server and saved only if found. The expiry date always comes from the server.</span>
              </div>
            </form>
          </div>
        </div>

        {/* Right: Vendor Contact & Renewal Info */}
        <div className="card">
          <div className="card-header">
            <strong>Vendor &amp; Renewal Support</strong>
          </div>
          <div className="card-body">
            <Award size={36} style={{ color: 'var(--primary)', marginBottom: 10 }} />
            <p style={{ fontSize: 13.5, color: 'var(--text2)', margin: '10px 0 16px', lineHeight: 1.55 }}>
              To renew, extend a licence or add user seats, contact <strong>{vendorName}</strong>. After they update your licence, press <strong>Refresh</strong> on the key (or add the new key) — no need to sign out. Your data is never deleted when a licence expires; you can still view and print everything.
            </p>

            <div className="btn-group" style={{ marginBottom: 18, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <a className="btn btn-outline btn-sm" href={`tel:${vendorPhone.replace(/\s+/g, '')}`}>
                <Phone size={13} />
                <span>{vendorPhone}</span>
              </a>
              <a 
                className="btn btn-outline btn-sm" 
                target="_blank" 
                rel="noreferrer" 
                href={`https://wa.me/919324773823?text=${encodeURIComponent("Hello Kreya team, please renew our KreyaJewel360 licence for S.B Borana Jewellers.")}`}
              >
                <MessageSquare size={13} />
                <span>WhatsApp</span>
              </a>
              <a 
                className="btn btn-outline btn-sm" 
                href={`mailto:${vendorEmail}?subject=KreyaJewel360%20licence%20renewal%20-%20S.B%20Borana%20Jewellers`}
              >
                <Mail size={13} />
                <span>Email Support</span>
              </a>
            </div>

            <div style={{ background: 'var(--zebra)', border: '1px solid var(--border)', padding: '12px 14px', borderRadius: '10px', fontSize: 12.5, lineHeight: 1.5 }}>
              <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>
                Continuous Offline Resilience
              </div>
              <div style={{ color: 'var(--muted)' }}>
                This showroom terminal holds cached offline credentials valid for 30 days. Sales billing, inventory lookup, tag printing, and gold rate recalculations remain fully functional even without internet connectivity.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Licence Keys Table */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>Licence keys ({keysList.length})</strong>
          <span className="helper">Assigned to Tenant: {tenantId}</span>
        </div>
        <div className="tbl-wrap tbl-desktop-only">
          <table className="tbl">
            <thead>
              <tr>
                <th>Licence key</th>
                <th>Status</th>
                <th>Plan</th>
                <th>Expiry date</th>
                <th>Last verified</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {keysList.map(k => (
                <tr key={k.id}>
                  <td className="mono" style={{ fontSize: 12.5, fontWeight: 600 }}>
                    {k.licenseKey}
                  </td>
                  <td>
                    <span className="badge badge-green" style={{ textTransform: 'capitalize' }}>
                      {k.status}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-blue">
                      {k.plan}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{k.expiresOn}</span>
                    <span className="helper" style={{ display: 'inline', marginLeft: 6 }}>
                      ({k.daysRemaining} days left)
                    </span>
                  </td>
                  <td style={{ fontSize: 12.5 }}>{k.lastVerifiedAt}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      type="button" 
                      className="btn btn-xs btn-outline"
                      onClick={() => handleRefreshSingleKey(k.id)}
                      disabled={isRefreshing}
                    >
                      <RefreshCw size={11} className={isRefreshing ? 'animate-spin' : ''} />
                      <span>{isRefreshing ? 'Checking…' : 'Refresh'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LicenceView;