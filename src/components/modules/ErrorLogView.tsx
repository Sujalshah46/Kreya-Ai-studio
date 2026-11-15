import React, { useState } from 'react';
import { AlertCircle, Trash2, RefreshCw, CheckCircle2, Bug, Terminal, AlertTriangle, Check, Copy } from 'lucide-react';

interface ErrorItem {
  id: string;
  timestamp: string;
  source: string;
  message: string;
  stack?: string;
  resolved: boolean;
}

interface ErrorLogViewProps {
  onNavigate?: (module: string) => void;
}

type ErrorFilterTab = 'Open' | 'Resolved' | 'All';

export const ErrorLogView: React.FC<ErrorLogViewProps> = ({ onNavigate }) => {
  const [filterTab, setFilterTab] = useState<ErrorFilterTab>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [errors, setErrors] = useState<ErrorItem[]>([
    {
      id: 'err-1',
      timestamp: '15 Nov 2026 12:14:02 PM',
      source: 'Hardware / RS-232 Scale',
      message: 'Serial COM3 connection closed unexpectedly: Device disconnected or power off.',
      stack: 'Error: COM3 disconnected at SerialPort.onDisconnect (serial_worker.ts:42:15)',
      resolved: true
    },
    {
      id: 'err-2',
      timestamp: '14 Nov 2026 05:22:11 PM',
      source: 'Zebra ZPL Print Spooler',
      message: 'Zebra ZD220 head open warning: Tag roll re-aligned by operator.',
      stack: 'PrinterWarning: HEAD_OPEN at ZebraDriver.statusCheck (zpl_spooler.ts:88:9)',
      resolved: true
    },
    {
      id: 'err-3',
      timestamp: '13 Nov 2026 09:41:00 AM',
      source: 'Network / WhatsApp API',
      message: 'Cloud API Webhook HTTP 504 Gateway Timeout while posting template preview.',
      stack: 'AxiosError: timeout of 10000ms exceeded at dispatchHttpRequest (http_client.ts:114:7)',
      resolved: false
    }
  ]);

  const filteredErrors = errors.filter(e => {
    if (filterTab === 'Open') return !e.resolved;
    if (filterTab === 'Resolved') return e.resolved;
    return true;
  });

  const toggleResolved = (id: string) => {
    setErrors(prev => prev.map(e => e.id === id ? { ...e, resolved: !e.resolved } : e));
  };

  const clearAll = () => {
    if (confirm('Clear resolved system exception traces?')) {
      setErrors(errors.filter(e => !e.resolved));
    }
  };

  const handleCopyStack = (stack: string, id: string) => {
    navigator.clipboard?.writeText(stack);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
            ⚠️ Licence expires in 30 days (15-Dec-2026). Contact Kreya IT Consulting to renew.
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
              <Bug size={22} style={{ color: 'var(--danger)' }} />
              Error Log
            </h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fef8ee] text-[#92400e] rounded-full border border-[#efdcb6] text-xs font-semibold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
              <span>Counter MAIN</span>
              <span className="font-normal opacity-80"> · REG-2026-00001 · closing</span>
            </div>
          </div>
          <p className="helper" style={{ margin: '4px 0 0', fontSize: 12 }}>
            Diagnostic exception captures, hardware communication retries, and network telemetry for technical support · S.B Borana Jewellers
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button 
            onClick={clearAll}
            className="btn btn-outline btn-sm flex items-center gap-1.5"
            title="Clear all resolved exception records"
          >
            <Trash2 size={14} />
            <span>Clear Resolved</span>
          </button>
        </div>
      </div>

      {/* Required Tabs/Filters: "Open", "Resolved", "All" */}
      <div className="tabs" style={{ marginBottom: 14 }}>
        <button
          onClick={() => setFilterTab('Open')}
          className={`tab ${filterTab === 'Open' ? 'active' : ''}`}
        >
          Open ({errors.filter(e => !e.resolved).length})
        </button>
        <button
          onClick={() => setFilterTab('Resolved')}
          className={`tab ${filterTab === 'Resolved' ? 'active' : ''}`}
        >
          Resolved ({errors.filter(e => e.resolved).length})
        </button>
        <button
          onClick={() => setFilterTab('All')}
          className={`tab ${filterTab === 'All' ? 'active' : ''}`}
        >
          All ({errors.length})
        </button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Terminal size={16} style={{ color: 'var(--primary)' }} />
            <span className="card-title">Diagnostics Stream ({filterTab} filter)</span>
          </div>
          <span className="helper">
            Showing {filteredErrors.length} of {errors.length} events
          </span>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {filteredErrors.map((err) => (
            <div key={err.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--muted)' }}>{err.timestamp}</span>
                  <span className="badge badge-gray">{err.source}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {err.resolved ? (
                    <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={12} />
                      <span>Resolved</span>
                    </span>
                  ) : (
                    <span className="badge badge-red" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertCircle size={12} />
                      <span>Open / Attention</span>
                    </span>
                  )}

                  <button
                    onClick={() => toggleResolved(err.id)}
                    className="btn btn-outline btn-xs"
                    title={err.resolved ? "Reopen issue" : "Mark as resolved"}
                  >
                    {err.resolved ? "Reopen" : "Mark Resolved"}
                  </button>
                </div>
              </div>

              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
                {err.message}
              </p>

              {err.stack && (
                <div style={{ position: 'relative' }}>
                  <div style={{ background: '#0f172a', color: '#a7f3d0', padding: '10px 14px', borderRadius: 8, fontFamily: 'monospace', fontSize: 11.5, overflowX: 'auto' }}>
                    {err.stack}
                  </div>
                  <button
                    onClick={() => handleCopyStack(err.stack!, err.id)}
                    className="btn btn-ghost btn-xs"
                    style={{ position: 'absolute', top: 6, right: 6, color: 'rgba(255,255,255,0.7)' }}
                    title="Copy Stack Trace"
                  >
                    <Copy size={12} />
                    {copiedId === err.id && <span style={{ fontSize: 10, color: '#4ade80', marginLeft: 4 }}>Copied!</span>}
                  </button>
                </div>
              )}
            </div>
          ))}

          {filteredErrors.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              No {filterTab.toLowerCase()} diagnostic records found.
            </div>
          )}
        </div>
        <div className="dt-pager" style={{ padding: '8px 16px', background: 'var(--surface2)', fontSize: 11, color: 'var(--muted)' }}>
          Real-time diagnostic error channel · S.B Borana Jewellers
        </div>
      </div>
    </div>
  );
};

export default ErrorLogView;
