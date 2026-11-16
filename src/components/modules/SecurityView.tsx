import React, { useState } from 'react';
import { 
  Lock, Shield, Save, Check, ShieldAlert, Key, Globe, CheckCircle2, 
  AlertTriangle, Users, FileCheck, Clock, Smartphone
} from 'lucide-react';

interface SecurityViewProps {
  onNavigate?: (module: string) => void;
}

export const SecurityView: React.FC<SecurityViewProps> = ({ onNavigate }) => {
  // 11 Discovered Security Toggles & Inputs
  const [twoFactorAdmin, setTwoFactorAdmin] = useState(true);
  const [highValueOtpRefund, setHighValueOtpRefund] = useState(true);
  const [maxFailedAttempts, setMaxFailedAttempts] = useState('3');
  const [sessionIdleTimeout, setSessionIdleTimeout] = useState('15');
  const [auditRetentionPeriod, setAuditRetentionPeriod] = useState('7-years');
  const [enforcePasswordComplexity, setEnforcePasswordComplexity] = useState(true);
  const [restrictToLanSubnet, setRestrictToLanSubnet] = useState(true);
  const [blockConcurrentLogins, setBlockConcurrentLogins] = useState(true);
  const [mandateSupervisorCancellationPin, setMandateSupervisorCancellationPin] = useState(true);
  const [lockBackdatedVouchers, setLockBackdatedVouchers] = useState(true);
  const [mandatoryPanThreshold, setMandatoryPanThreshold] = useState('200000');

  const [saved, setSaved] = useState(false);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="page" style={{ padding: '16px 20px', maxWidth: '100%' }}>
      {/* Licence Banner Parity */}
      <div 
        className="license-banner rounded-lg mb-3 flex items-center justify-between p-3" 
        style={{ background: '#fef8ee', borderColor: '#fde68a', borderWidth: 1 }}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-xs font-medium text-amber-950">
            ⚠️ Licence status is unavailable. Open Licence for verification details.
          </span>
        </div>
        <button 
          onClick={() => onNavigate ? onNavigate('licence') : (window.location.pathname = '/admin/license')}
          className="font-semibold text-amber-900 hover:text-amber-950 cursor-pointer flex items-center gap-1 text-xs px-2 py-1 bg-amber-100 hover:bg-amber-200 rounded border border-amber-300 transition-colors"
        >
          <span>Licence</span>
          <span>→</span>
        </button>
      </div>

      {/* Page Header */}
      <div className="page-hdr" style={{ marginBottom: 14 }}>
        <div className="page-hdr-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 20, fontWeight: 700, margin: 0 }}>
              <Shield size={22} style={{ color: 'var(--primary)' }} />
              Security
            </h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fef8ee] text-[#92400e] rounded-full border border-[#efdcb6] text-xs font-semibold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
              <span>Counter MAIN</span>
              <span className="font-normal opacity-80"> · REG-2026-00001 · closing</span>
            </div>
          </div>
          <p className="helper" style={{ margin: '4px 0 0', fontSize: 12 }}>
            Configure terminal authentication safeguards, high-value transaction approvals and Section 269ST statutory rules · S.B Borana Jewellers
          </p>
        </div>

        {/* Action Button: "Save" */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => handleSave()}
            className="btn btn-primary btn-sm flex items-center gap-1.5"
            style={{ fontWeight: 700 }}
            title="Save security settings"
          >
            <Save size={14} />
            <span>Save</span>
          </button>
        </div>
      </div>

      {saved && (
        <div style={{ padding: 12, background: 'var(--primary-xl)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--primary-d)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <CheckCircle2 size={16} />
          <span style={{ fontWeight: 600 }}>Security choices recorded for this preview session.</span>
        </div>
      )}

      {/* 11 Security Toggles & Inputs Container */}
      <div className="card" style={{ padding: 20 }}>
        <div className="card-header" style={{ marginBottom: 16 }}>
          <span className="card-title">11 Security Policies & Statutory Controls</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Toggle 1: Two-Factor Authentication */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
            <input 
              type="checkbox" 
              checked={twoFactorAdmin} 
              onChange={e => setTwoFactorAdmin(e.target.checked)} 
              style={{ marginTop: 3 }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>1. Two-Factor Authentication (OTP on Admin Login)</div>
              <div className="helper" style={{ fontSize: 11.5 }}>
                Sends a 6-digit WhatsApp/SMS OTP to registered store owner mobile (9324773823) whenever admin settings or exports are accessed.
              </div>
            </div>
          </label>

          {/* Toggle 2: High-Value Refund OTP */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
            <input 
              type="checkbox" 
              checked={highValueOtpRefund} 
              onChange={e => setHighValueOtpRefund(e.target.checked)} 
              style={{ marginTop: 3 }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>2. High-Value Refund & Cancellation Approval (&gt; ₹50,000)</div>
              <div className="helper" style={{ fontSize: 11.5 }}>
                Mandates real-time supervisor or owner approval before cash outflow vouchers or refunds above ₹50,000 can be disbursed.
              </div>
            </div>
          </label>

          {/* Input 3: Max Failed PIN Attempts */}
          <div style={{ paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 4 }}>3. Maximum Failed PIN Attempts Before Terminal Lockout</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: 300 }}>
              <select
                value={maxFailedAttempts}
                onChange={e => setMaxFailedAttempts(e.target.value)}
                className="input input-sm"
              >
                <option value="3">3 Attempts (Recommended)</option>
                <option value="5">5 Attempts</option>
                <option value="10">10 Attempts</option>
              </select>
            </div>
            <div className="helper" style={{ fontSize: 11.5, marginTop: 4 }}>
              Locks the operator session and notifies supervisor after consecutive wrong PIN inputs.
            </div>
          </div>

          {/* Input 4: Session Idle Timeout */}
          <div style={{ paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 4 }}>4. Inactivity Session Auto-Lock Timeout</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: 300 }}>
              <select
                value={sessionIdleTimeout}
                onChange={e => setSessionIdleTimeout(e.target.value)}
                className="input input-sm"
              >
                <option value="5">5 Minutes</option>
                <option value="10">10 Minutes</option>
                <option value="15">15 Minutes (Standard showroom)</option>
                <option value="30">30 Minutes</option>
                <option value="never">Never (Stay Unlocked)</option>
              </select>
            </div>
            <div className="helper" style={{ fontSize: 11.5, marginTop: 4 }}>
              Counter switches to quick PIN lock screen after this idle period.
            </div>
          </div>

          {/* Input 5: Audit Log Retention */}
          <div style={{ paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 4 }}>5. Statutory Audit Log Retention Policy</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: 440 }}>
              <select
                value={auditRetentionPeriod}
                onChange={e => setAuditRetentionPeriod(e.target.value)}
                className="input input-sm"
              >
                <option value="7-years">7 Years (Mandatory under Indian GST & Companies Act 2013)</option>
                <option value="3-years">3 Years</option>
                <option value="permanent">Indefinite (Immutable append-only journal)</option>
              </select>
            </div>
            <div className="helper" style={{ fontSize: 11.5, marginTop: 4 }}>
              Preserves chronological tamper-evident logs of all rate edits, invoice voids and stock reconciliations.
            </div>
          </div>

          {/* Toggle 6: Enforce Password Complexity */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
            <input 
              type="checkbox" 
              checked={enforcePasswordComplexity} 
              onChange={e => setEnforcePasswordComplexity(e.target.checked)} 
              style={{ marginTop: 3 }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>6. Enforce Strong Staff Password Complexity</div>
              <div className="helper" style={{ fontSize: 11.5 }}>
                Requires minimum 8 characters with at least one uppercase letter, one digit and one special character for user logins.
              </div>
            </div>
          </label>

          {/* Toggle 7: Showroom LAN Whitelist */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
            <input 
              type="checkbox" 
              checked={restrictToLanSubnet} 
              onChange={e => setRestrictToLanSubnet(e.target.checked)} 
              style={{ marginTop: 3 }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>7. Restrict Counter Access to Showroom LAN (192.168.1.0/24)</div>
              <div className="helper" style={{ fontSize: 11.5 }}>
                Prevents billing counters from operating outside showroom Wi-Fi/LAN perimeter.
              </div>
            </div>
          </label>

          {/* Toggle 8: Block Concurrent Logins */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
            <input 
              type="checkbox" 
              checked={blockConcurrentLogins} 
              onChange={e => setBlockConcurrentLogins(e.target.checked)} 
              style={{ marginTop: 3 }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>8. Block Concurrent Multi-Device Sessions for Same Staff</div>
              <div className="helper" style={{ fontSize: 11.5 }}>
                Terminates existing terminal session if cashier logs in from another terminal counter.
              </div>
            </div>
          </label>

          {/* Toggle 9: Mandatory Supervisor PIN for Cancellations */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
            <input 
              type="checkbox" 
              checked={mandateSupervisorCancellationPin} 
              onChange={e => setMandateSupervisorCancellationPin(e.target.checked)} 
              style={{ marginTop: 3 }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>9. Mandatory Supervisor PIN for Invoice Voiding & Cancellations</div>
              <div className="helper" style={{ fontSize: 11.5 }}>
                Standard cashiers cannot void billed invoices without manager PIN override on the active POS screen.
              </div>
            </div>
          </label>

          {/* Toggle 10: Lock Backdated Accounting Vouchers */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
            <input 
              type="checkbox" 
              checked={lockBackdatedVouchers} 
              onChange={e => setLockBackdatedVouchers(e.target.checked)} 
              style={{ marginTop: 3 }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>10. Lock Backdated Vouchers After Monthly GST Return Period</div>
              <div className="helper" style={{ fontSize: 11.5 }}>
                Prevents editing or backdating sales/purchase entries for months where GSTR-1 & 3B have already been filed.
              </div>
            </div>
          </label>

          {/* Input 11: Section 269ST PAN/Aadhaar Threshold */}
          <div>
            <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 4 }}>11. Mandatory PAN / Aadhaar Threshold (Section 269ST & Rule 114B)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, maxWidth: 300 }}>
              <span style={{ fontWeight: 700 }}>₹</span>
              <input 
                type="text" 
                value={mandatoryPanThreshold} 
                onChange={e => setMandatoryPanThreshold(e.target.value)} 
                className="input input-sm" 
              />
            </div>
            <div className="helper" style={{ fontSize: 11.5, marginTop: 4 }}>
              Statutory ₹2,00,000 threshold under Income Tax Act: cash transactions above this mandate verified customer PAN.
            </div>
          </div>
        </div>
      </div>
      <section className="card mt-4">
        <div className="card-header"><span className="card-title">Activity</span></div>
        <div className="tbl-wrap"><table className="tbl">
          <thead><tr>{['When', 'Who', 'Action', 'Record', 'Details', 'IP'].map(column => <th scope="col" key={column}>{column}</th>)}</tr></thead>
          <tbody><tr><td colSpan={6} className="text-center py-8">No security activity source is connected.</td></tr></tbody>
        </table></div>
      </section>
    </div>
  );
};

export default SecurityView;

