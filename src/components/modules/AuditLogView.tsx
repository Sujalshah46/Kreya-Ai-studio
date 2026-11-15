import React, { useState } from 'react';
import { History, Search, Download, Filter, Shield, Calendar, UserCheck } from 'lucide-react';

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  counter: string;
  action: string;
  target: string;
  details: string;
  ip: string;
  severity: 'normal' | 'warn' | 'critical';
}

export const AuditLogView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  const [logs] = useState<AuditEntry[]>([
    {
      id: 'aud-109',
      timestamp: '15 Nov 2026 12:49 PM',
      user: 'Admin (Sujal Shah)',
      counter: 'Counter MAIN',
      action: 'CREATE_INVOICE',
      target: 'INV-2026-00276',
      details: 'Created sales invoice for Sujal Shah (₹94,650.00). Item: 22 ct Gold Ring (6.000g). Full payment via Cash.',
      ip: '192.168.1.102',
      severity: 'normal'
    },
    {
      id: 'aud-108',
      timestamp: '15 Nov 2026 12:40 PM',
      user: 'Admin (Sujal Shah)',
      counter: 'Counter MAIN',
      action: 'UPDATE_RATES',
      target: 'DAILY_RATES',
      details: 'Updated daily board rates: Gold 24K: ₹78,500/10g, Gold 22K: ₹71,906/10g, Silver: ₹92,000/1kg.',
      ip: '192.168.1.101',
      severity: 'warn'
    },
    {
      id: 'aud-107',
      timestamp: '15 Nov 2026 11:15 AM',
      user: 'Rahul Jain (Cashier)',
      counter: 'Counter MAIN',
      action: 'OPEN_CASH_DRAWER',
      target: 'DRAWER_MANUAL',
      details: 'Manual cash drawer open triggered for change dispensing.',
      ip: '192.168.1.102',
      severity: 'warn'
    },
    {
      id: 'aud-106',
      timestamp: '15 Nov 2026 10:30 AM',
      user: 'Sandeep Shah (Manager)',
      counter: 'Counter MAIN',
      action: 'DISBURSE_LOAN',
      target: 'LOAN-2026-00014',
      details: 'Pledged Gold Chain (12.500g). Disbursed principal ₹50,000 cash to Amul Baranwal @ 2% pm.',
      ip: '192.168.1.101',
      severity: 'normal'
    },
    {
      id: 'aud-105',
      timestamp: '15 Nov 2026 10:00 AM',
      user: 'Rahul Jain (Cashier)',
      counter: 'Counter MAIN',
      action: 'CASH_REGISTER_OPEN',
      target: 'REG-2026-00021',
      details: 'Opened morning register session. Opening cash verified: ₹25,000.',
      ip: '192.168.1.102',
      severity: 'normal'
    },
    {
      id: 'aud-104',
      timestamp: '14 Nov 2026 07:30 PM',
      user: 'Admin (Sujal Shah)',
      counter: 'Counter MAIN',
      action: 'CANCEL_ORDER',
      target: 'CAN-2026-00004',
      details: 'Cancelled advance booking for Priya Verma. Cash refund of ₹5,000 issued.',
      ip: '192.168.1.101',
      severity: 'critical'
    }
  ]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.target.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = filterAction === 'ALL' || log.action === filterAction;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="page">
      {/* Page Header */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>System Audit Log</h1>
          <p>
            Immutable statutory security trail tracking financial transactions, rate modifications, and operator actions · S.B Borana Jewellers
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button 
            onClick={() => alert('Exporting full audit trail as CSV...')}
            className="btn btn-primary btn-sm"
          >
            <Download size={14} />
            <span>Export Audit CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="search-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
        <div className="search-box" style={{ flex: 1, maxWidth: 440 }}>
          <Search size={14} style={{ color: 'var(--muted)' }} />
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail by user, invoice, loan or keyword..."
            className="input input-sm"
            style={{ border: 'none', width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={14} style={{ color: 'var(--muted)' }} />
          <span className="label" style={{ margin: 0, fontSize: 12 }}>Filter Action:</span>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="input input-sm"
          >
            <option value="ALL">All Actions</option>
            <option value="CREATE_INVOICE">CREATE_INVOICE</option>
            <option value="UPDATE_RATES">UPDATE_RATES</option>
            <option value="OPEN_CASH_DRAWER">OPEN_CASH_DRAWER</option>
            <option value="DISBURSE_LOAN">DISBURSE_LOAN</option>
            <option value="CANCEL_ORDER">CANCEL_ORDER</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={16} style={{ color: 'var(--primary)' }} />
            <span className="card-title">Security & Transaction Events</span>
          </div>
          <span className="helper">
            {filteredLogs.length} Events Logged
          </span>
        </div>

        <div className="tbl-wrap tbl-desktop-only">
          <table className="tbl">
            <thead>
              <tr>
                <th>TIMESTAMP</th>
                <th>USER</th>
                <th>COUNTER</th>
                <th>ACTION</th>
                <th>TARGET</th>
                <th>DETAILS</th>
                <th>IP ADDRESS</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{log.timestamp}</td>
                  <td><strong>{log.user}</strong></td>
                  <td className="helper">{log.counter}</td>
                  <td>
                    <span className={`badge ${
                      log.severity === 'critical' ? 'badge-red' :
                      log.severity === 'warn' ? 'badge-yellow' :
                      'badge-gray'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{log.target}</td>
                  <td style={{ maxWidth: 440 }}>{log.details}</td>
                  <td style={{ fontFamily: 'monospace' }}>{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="dt-pager">
          <span className="helper">Showing 1-6 of {filteredLogs.length} audit entries · Retained 7 years</span>
        </div>
      </div>
    </div>
  );
};
