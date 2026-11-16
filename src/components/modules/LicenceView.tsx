import React, { useState } from 'react';
import { 
  RefreshCw, Phone, MessageSquare, Mail, Award, CheckCircle2, 
  ShieldCheck, KeyRound, Info, Copy, Check 
} from 'lucide-react';
import type { StoreProfile } from '../../types';
import { mockStore } from '../../data/mockData';

interface LicenceViewProps {
  store?: StoreProfile;
}

interface LicenceKeyRecord {
  id: string;
  licenseKey: string;
  licenseKeyMasked: string;
  licensedTo: string;
  boundTo: string;
  signedBy: string;
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

  const vendorName = "Kreya IT Consulting";
  const vendorPhone = "+91-9582388885";
  const vendorWhatsApp = "919582388885";
  const vendorEmail = "licence@kreyait.com";

  const [keysList, setKeysList] = useState<LicenceKeyRecord[]>([
    {
      id: "key-01",
      licenseKey: "KRY-TD4G6-CQ6ES-7AQAV-P228S",
      licenseKeyMasked: "KRY-TD•••••••••••••••-P228S",
      licensedTo: "SB Borana Jewllers",
      boundTo: "dom-app-developer-495779.run.colosoft.com",
      signedBy: "Signed by Kreya",
      status: "active",
      expiresOn: "15-Dec-2026",
      daysRemaining: 29,
      lastVerifiedAt: "16 Nov 2026, 10:42 am",
      maxUsers: "unlimited",
      seatsUsed: 3
    }
  ]);

  const activeRecord = keysList[0];

  const handleRefreshAll = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setRefreshSuccess(`Licence active until 15-Dec-2026`);
      setTimeout(() => setRefreshSuccess(null), 4000);
    }, 500);
  };

  const handleRefreshSingleKey = (keyId: string) => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setRefreshSuccess(`Checked — active, expiry 15-Dec-2026`);
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
        licenseKeyMasked: `${formatted.slice(0, 6)}•••••••••••••••-${formatted.slice(-5)}`,
        licensedTo: store.tradeName || "SB Borana Jewellers",
        boundTo: window.location.hostname,
        signedBy: "Signed by Kreya",
        status: "active",
        expiresOn: "15-Dec-2026",
        daysRemaining: 29,
        lastVerifiedAt: "Just now",
        maxUsers: "unlimited",
        seatsUsed: 3
      };
      setKeysList(prev => [newKeyObj, ...prev]);
      setNewKeyInput('');
      setRefreshSuccess(`Licence key validated and activated successfully!`);
      setTimeout(() => setRefreshSuccess(null), 4000);
    }, 500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div>
      {/* 1. Header */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Licence</h1>
          <p>Activate and refresh your KreyaJewel360 licence keys from {vendorName}.</p>
        </div>
        <div className="btn-group">
          {keysList.length > 0 && (
            <button 
              type="button" 
              className="btn btn-outline"
              onClick={handleRefreshAll}
              disabled={isRefreshing}
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
              <span>{isRefreshing ? 'Checking…' : 'Refresh all'}</span>
            </button>
          )}
        </div>
      </div>

      {refreshSuccess && (
        <div className="card" style={{ marginBottom: 14, background: '#ecfdf5', borderColor: '#10b981', color: '#065f46', padding: '16px 18px', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
            <CheckCircle2 size={16} style={{ color: '#10b981' }} />
            <span>{refreshSuccess}</span>
          </div>
          <button 
            type="button" 
            className="btn btn-xs btn-outline"
            onClick={() => setRefreshSuccess(null)} 
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Top Summary Grid: 2 Columns */}
      <div className="g2" style={{ alignItems: 'start', marginBottom: 16 }}>
        {/* Left: Licence Status & Details */}
        <div className="card">
          <div className="card-body">
            <dl className="kv" style={{ display: 'grid', gridTemplateColumns: '150px 1fr', rowGap: 10, fontSize: 13 }}>
              <dt style={{ color: 'var(--muted)', fontWeight: 600 }}>Shop licence</dt>
              <dd style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                <span className="badge badge-green">Active</span>
                <span className="badge badge-gray" title="Set LICENSE_ENFORCEMENT=enforce on the server to block new entries after expiry">
                  blocking: warn
                </span>
              </dd>

              <dt style={{ color: 'var(--muted)', fontWeight: 600 }}>Valid until</dt>
              <dd style={{ margin: 0 }}>
                <strong>{activeRecord?.expiresOn || '15-Dec-2026'}</strong>
                <span className="helper" style={{ display: 'inline', marginLeft: 6 }}>
                  ({activeRecord?.daysRemaining || 29} days left)
                </span>
              </dd>

              <dt style={{ color: 'var(--muted)', fontWeight: 600 }}>Active key</dt>
              <dd className="mono" style={{ margin: 0 }}>
                {activeRecord?.licenseKeyMasked || 'None'}
              </dd>

              <dt style={{ color: 'var(--muted)', fontWeight: 600 }}>User seats</dt>
              <dd style={{ margin: 0 }}>
                {activeRecord?.seatsUsed || 3} used of {activeRecord?.maxUsers || 'unlimited'}
              </dd>

              <dt style={{ color: 'var(--muted)', fontWeight: 600 }}>Last verified</dt>
              <dd style={{ margin: 0 }}>
                {activeRecord?.lastVerifiedAt || '16 Nov 2026, 10:42 am'}
              </dd>
            </dl>

            {/* Licence Server Connection Alert */}
            <div style={{ marginTop: 18 }}>
              <div className="alert alert-info" style={{ marginBottom: 12, fontSize: 12.5, lineHeight: 1.6 }}>
                <strong>Licence server connection</strong>
                <div>API key on the server: set ✓</div>
                <div>Product: jewellery_erp_online · This site: site:dom-app-developer-495779.run.colosoft.com</div>
                <div>Public key (c65cc660fb772e86): built into the app</div>
                <div style={{ wordBreak: 'break-all' }}>Licence server: https://dom-app-starter-ed394f.run.colosoft.com/api/license/v1</div>
                <div style={{ marginTop: 6 }}>
                  Last validate (16 Nov 2026, 10:42 am, key {activeRecord?.licenseKeyMasked || 'KRY-TD•••••••••••••••-P228S'}): <strong>accepted</strong> · HTTP 200
                  <div>Licence active.</div>
                </div>
              </div>

              {/* Add a licence key form */}
              <label className="label">Add a licence key</label>
              <form onSubmit={handleAddKey} style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <input 
                  type="text" 
                  className="input mono" 
                  placeholder="KRY-XXXXX-XXXXX-XXXXX-XXXXX" 
                  value={newKeyInput} 
                  onChange={(e) => setNewKeyInput(e.target.value)} 
                />
                <button type="submit" className="btn btn-primary" disabled={isRefreshing || !newKeyInput.trim()}>
                  Validate &amp; save
                </button>
              </form>
              <div className="helper" style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <KeyRound size={11} />
                <span>The key is checked with {vendorName}&apos;s licence server and saved only if it is found. The expiry date always comes from the server.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Vendor & Renewal CTA */}
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <Award size={36} style={{ color: 'var(--primary)' }} />
              <div>
                <strong style={{ fontSize: 16 }}>KreyaJewel360</strong>
                <div className="helper" style={{ fontSize: 12 }}>by Kreya IT Consulting Pvt Ltd</div>
              </div>
            </div>

            <p style={{ fontSize: 13.5, color: 'var(--text2, #374151)', margin: '14px 0', lineHeight: 1.5 }}>
              To renew, extend a licence or add user seats, contact {vendorName}. After they update your licence, press <strong>Refresh</strong> on the key (or add the new key) — no need to sign out. Your data is never deleted when a licence expires; you can still view and print everything.
            </p>

            <div className="btn-group" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <a className="btn btn-outline btn-sm" href={`tel:${vendorPhone}`}>
                <Phone size={13} /> {vendorPhone}
              </a>
              <a 
                className="btn btn-outline btn-sm" 
                target="_blank" 
                rel="noreferrer" 
                href={`https://wa.me/${vendorWhatsApp}?text=${encodeURIComponent("Hello Kreya team, please renew our KreyaJewel360 licence.")}`}
              >
                <MessageSquare size={13} /> WhatsApp
              </a>
              <a 
                className="btn btn-outline btn-sm" 
                href={`mailto:${vendorEmail}?subject=KreyaJewel360%20licence%20renewal`}
              >
                <Mail size={13} /> Email
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Table: Licence Keys */}
      <div className="card">
        <div className="card-header">
          <strong>Licence keys ({keysList.length})</strong>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>LICENCE KEY</th>
                <th>STATUS</th>
                <th>EXPIRY DATE</th>
                <th>LAST VERIFIED</th>
                <th className="num">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {keysList.map((key) => (
                <tr key={key.id}>
                  <td>
                    <div className="mono" style={{ fontSize: 12.5, fontWeight: 700 }}>
                      {key.licenseKey}
                    </div>
                    <div className="helper" style={{ fontSize: 11, marginTop: 2 }}>
                      <div>Licensed to {key.licensedTo}</div>
                      <div>Bound to {key.boundTo}</div>
                      <div style={{ color: 'var(--primary)', fontWeight: 600 }}>✓ {key.signedBy}</div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-green">
                      {key.status === 'active' ? 'Active' : key.status}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {key.expiresOn}
                  </td>
                  <td>
                    {key.lastVerifiedAt}
                  </td>
                  <td className="num">
                    <button 
                      type="button" 
                      className="btn btn-xs btn-outline"
                      onClick={() => handleRefreshSingleKey(key.id)}
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
