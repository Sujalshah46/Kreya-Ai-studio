import React, { useState, useMemo } from 'react';
import { Save, Search, Check, AlertTriangle, Shield, Lock, LogOut } from 'lucide-react';

interface SecurityViewProps {
  onNavigate?: (module: string) => void;
}

interface SecuritySettings {
  pwdMinLength: number;
  requireLetterDigit: boolean;
  loginMaxAttempts: number;
  loginLockMinutes: number;
  sessionHours: number;
  mfaForAdmins: boolean;
}

interface SecurityAuditEntry {
  id: string;
  at: string;
  actor_name: string;
  actor_type: string;
  action: string;
  entity: string;
  entity_id?: string;
  ref_no?: string;
  reason?: string;
  details: Record<string, any>;
  ip: string;
}

const INITIAL_SETTINGS: SecuritySettings = {
  pwdMinLength: 8,
  requireLetterDigit: true,
  loginMaxAttempts: 5,
  loginLockMinutes: 15,
  sessionHours: 12,
  mfaForAdmins: false
};

const INITIAL_SECURITY_LOGS: SecurityAuditEntry[] = [
  {
    id: "sec-001",
    at: "2026-11-16T08:20:53.580Z",
    actor_name: "Admin",
    actor_type: "user",
    action: "LOGIN_OK",
    entity: "session",
    entity_id: "sid_981a2f",
    details: { method: "password", userAgent: "Chrome 131.0 macOS" },
    ip: "192.168.1.102"
  },
  {
    id: "sec-002",
    at: "2026-11-16T07:15:10.120Z",
    actor_name: "Admin",
    actor_type: "user",
    action: "SETTINGS_SAVED",
    entity: "settings",
    entity_id: "security",
    reason: "Updated session timeout to 12h",
    details: { section: "security", sessionHours: 12 },
    ip: "192.168.1.102"
  },
  {
    id: "sec-003",
    at: "2026-11-15T11:27:00.180Z",
    actor_name: "Admin",
    actor_type: "user",
    action: "USER_CREATED",
    entity: "user",
    entity_id: "3",
    ref_no: "Rahul Jain",
    details: { email: "sbjrahul01@gmail.com", roles: ["Accountant", "Viewer"] },
    ip: "192.168.1.102"
  },
  {
    id: "sec-004",
    at: "2026-11-15T11:25:56.396Z",
    actor_name: "Admin",
    actor_type: "user",
    action: "USER_CREATED",
    entity: "user",
    entity_id: "2",
    ref_no: "Sandeep Shah",
    details: { email: "sandeepshah2000@gmail.com", roles: ["Cashier", "Sales"] },
    ip: "192.168.1.102"
  },
  {
    id: "sec-005",
    at: "2026-11-15T11:15:54.270Z",
    actor_name: "Admin",
    actor_type: "user",
    action: "PASSWORD_CHANGED",
    entity: "user",
    entity_id: "1",
    ref_no: "Admin",
    details: { forced: false },
    ip: "192.168.1.102"
  },
  {
    id: "sec-006",
    at: "2026-11-15T10:55:11.977Z",
    actor_name: "System",
    actor_type: "system",
    action: "LICENSE_ACTIVATED",
    entity: "license",
    ref_no: "LIC-2026-SBJ-001",
    details: { vendor: "Kreya IT Consulting", expiresOn: "2026-12-15" },
    ip: "127.0.0.1"
  }
];

export const SecurityView: React.FC<SecurityViewProps> = ({ onNavigate }) => {
  const [settings, setSettings] = useState<SecuritySettings>(INITIAL_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Security Log filtering
  const [auditLogs, setAuditLogs] = useState<SecurityAuditEntry[]>(INITIAL_SECURITY_LOGS);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast("Security settings saved");
      // Append audit entry
      const newEntry: SecurityAuditEntry = {
        id: `sec-${Date.now()}`,
        at: new Date().toISOString(),
        actor_name: "Admin",
        actor_type: "user",
        action: "SETTINGS_SAVED",
        entity: "settings",
        entity_id: "security",
        details: { ...settings },
        ip: "192.168.1.102"
      };
      setAuditLogs(prev => [newEntry, ...prev]);
    }, 400);
  };

  const handleForceLogoutAll = () => {
    if (window.confirm("Log out all active sessions across all devices? Every user including you will need to sign in again.")) {
      showToast("Signed out everywhere");
      const newEntry: SecurityAuditEntry = {
        id: `sec-${Date.now()}`,
        at: new Date().toISOString(),
        actor_name: "Admin",
        actor_type: "user",
        action: "SESSION_REVOKED",
        entity: "session",
        reason: "Force logout all active sessions",
        details: { scope: "all_sessions" },
        ip: "192.168.1.102"
      };
      setAuditLogs(prev => [newEntry, ...prev]);
    }
  };

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const actorMatch = log.actor_name.toLowerCase().includes(q);
        const actionMatch = log.action.toLowerCase().includes(q);
        const refMatch = log.ref_no ? log.ref_no.toLowerCase().includes(q) : false;
        const entityMatch = log.entity.toLowerCase().includes(q);
        const detailsMatch = JSON.stringify(log.details).toLowerCase().includes(q);
        if (!actorMatch && !actionMatch && !refMatch && !entityMatch && !detailsMatch) return false;
      }
      if (fromDate) {
        if (new Date(log.at) < new Date(fromDate)) return false;
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        if (new Date(log.at) > to) return false;
      }
      return true;
    });
  }, [auditLogs, search, fromDate, toDate]);

  const formatDate = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  const getActionBadgeClass = (action: string) => {
    if (/FAILED|LOCKED|EXPIRED|DEACTIVATED|REVOKED|CANCELLED/.test(action)) {
      return "badge-red";
    }
    if (/OK|CREATED|ACTIVATED|RENEWED/.test(action)) {
      return "badge-green";
    }
    return "badge-indigo";
  };

  return (
    <div className="page" id="main">
      {/* Toast Notification */}
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
          <Check size={16} style={{ color: 'var(--primary)' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Security</h1>
          <p>Password rules, lock-out and how long a sign-in lasts. Every change is written to the security log.</p>
        </div>
        <div className="btn-group">
          <button 
            className="btn btn-outline"
            onClick={handleForceLogoutAll}
            title="Invalidate all active sessions across all devices"
          >
            <LogOut size={14} /> Force logout all sessions
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSave} 
            disabled={saving}
          >
            <Save size={14} /> {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* Card 1: Security Settings */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div className="g4">
            <div className="form-group">
              <label className="label">Minimum password length</label>
              <input 
                className="input" 
                type="number" 
                min={8} 
                max={64} 
                value={settings.pwdMinLength} 
                onChange={e => setSettings({ ...settings, pwdMinLength: Number(e.target.value) || 8 })} 
              />
            </div>

            <div className="form-group">
              <label className="label">Wrong tries before lock-out</label>
              <input 
                className="input" 
                type="number" 
                min={3} 
                max={20} 
                value={settings.loginMaxAttempts} 
                onChange={e => setSettings({ ...settings, loginMaxAttempts: Number(e.target.value) || 5 })} 
              />
            </div>

            <div className="form-group">
              <label className="label">Lock-out minutes</label>
              <input 
                className="input" 
                type="number" 
                min={1} 
                max={1440} 
                value={settings.loginLockMinutes} 
                onChange={e => setSettings({ ...settings, loginLockMinutes: Number(e.target.value) || 15 })} 
              />
            </div>

            <div className="form-group">
              <label className="label">Sign-in lasts (hours)</label>
              <input 
                className="input" 
                type="number" 
                min={1} 
                max={720} 
                value={settings.sessionHours} 
                onChange={e => setSettings({ ...settings, sessionHours: Number(e.target.value) || 12 })} 
              />
              <div className="helper">After this, users sign in again.</div>
            </div>
          </div>

          <label className="check" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input 
              type="checkbox" 
              checked={settings.requireLetterDigit} 
              onChange={e => setSettings({ ...settings, requireLetterDigit: e.target.checked })} 
            />
            <span>Passwords must contain a letter and a digit</span>
          </label>

          <label className="check" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input 
              type="checkbox" 
              checked={settings.mfaForAdmins} 
              disabled 
            />
            <span>
              One-time code (OTP) for the owner and admins
              <span className="badge badge-gray" style={{ marginLeft: 6 }}>coming with SMS / WhatsApp setup</span>
            </span>
          </label>
        </div>
      </div>

      {/* Card 2: Security Log */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Security log</span>
          <span className="helper">Sign-ins, users, roles, settings and licence</span>
        </div>
        <div className="card-body">
          <div className="search-row">
            <div className="search-box">
              <Search size={14} />
              <input 
                placeholder="Search user, reference, details…" 
                value={search} 
                onChange={e => { setSearch(e.target.value); setPage(1); }} 
              />
            </div>

            <input 
              className="input" 
              type="date" 
              style={{ width: "auto" }} 
              value={fromDate} 
              onChange={e => { setFromDate(e.target.value); setPage(1); }} 
              aria-label="From" 
            />

            <input 
              className="input" 
              type="date" 
              style={{ width: "auto" }} 
              value={toDate} 
              onChange={e => { setToDate(e.target.value); setPage(1); }} 
              aria-label="To" 
            />
          </div>

          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Who</th>
                  <th>Action</th>
                  <th>Record</th>
                  <th>Details</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {formatDate(log.at)}
                    </td>
                    <td>
                      {log.actor_name || <span className="badge badge-gray">{log.actor_type}</span>}
                    </td>
                    <td>
                      <span className={`badge ${getActionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      {log.entity}
                      {log.entity_id ? ` #${log.entity_id}` : ''}
                      {log.ref_no ? ` · ${log.ref_no}` : ''}
                      {log.reason && (
                        <div className="helper">Reason: {log.reason}</div>
                      )}
                    </td>
                    <td>
                      {Object.entries(log.details).map(([k, v]) => (
                        <span key={k} style={{ marginRight: 6 }}>
                          <span style={{ color: 'var(--muted)' }}>{k}:</span>{' '}
                          <strong>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</strong>
                        </span>
                      ))}
                    </td>
                    <td className="mono">{log.ip || "—"}</td>
                  </tr>
                ))}

                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty">No entries for these filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="dt-pager" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, fontSize: 12, color: 'var(--muted)' }}>
            <div>
              Showing {filteredLogs.length} entries
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <select 
                className="input" 
                style={{ width: 'auto', padding: '3px 8px', fontSize: 12 }} 
                value={pageSize} 
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              >
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityView;
