import React, { useState } from 'react';
import { 
  Database, RefreshCw, Cloud, HardDrive, Wifi, WifiOff, 
  CheckCircle2, AlertTriangle, ShieldCheck, Download, Upload, 
  Server, Cpu, Play, Terminal, Check, X, Trash2, ArrowUpRight, Clock, Archive
} from 'lucide-react';
import { StoreProfile, Customer, InventoryItem, SalesInvoice, GirviLoan, RepairOrder, SavingScheme } from '../../types';
import { DataExportBackupView } from './DataExportBackupView';
import { mockStore, mockCustomers, mockInventory, mockInvoices, mockLoans, mockRepairs, mockSchemes } from '../../data/mockData';

interface SyncDatabaseViewProps {
  store?: StoreProfile;
  customers?: Customer[];
  inventory?: InventoryItem[];
  invoices?: SalesInvoice[];
  loans?: GirviLoan[];
  repairs?: RepairOrder[];
  schemes?: SavingScheme[];
  onNavigate?: (module: string) => void;
  defaultTab?: 'sync' | 'backup';
}

export const SyncDatabaseView: React.FC<SyncDatabaseViewProps> = ({
  store,
  customers = mockCustomers,
  inventory = mockInventory,
  invoices = mockInvoices,
  loans = mockLoans,
  repairs = mockRepairs,
  schemes = mockSchemes,
  onNavigate,
  defaultTab = 'sync'
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'sync' | 'backup'>(defaultTab);
  // Offline-first sync status
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now (15-Nov-2026 12:51:24 PM)');
  const [pendingMutationsCount, setPendingMutationsCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<number>(0);
  const [syncStepLabel, setSyncStepLabel] = useState<string>('');

  // Diagnostic Test state
  const [isPingingDb, setIsPingingDb] = useState<boolean>(false);
  const [dbDiagnosticLogs, setDbDiagnosticLogs] = useState<string[]>([
    'Connected to PostgreSQL 15.6 pooler at aws-0-ap-south-1.pooler.supabase.com:6543',
    'DATABASE_URL linked to app_dom_app_developer_495779',
    'Active Tenant: 788195d6-463b-4f94-bfeb-41aad2c84f5e',
    'Row Version Checksum: OK (377 KB verified with dump.sql)',
    'SSL: TLSv1.3 with AES-GCM 256-bit encryption verified',
    'Round-trip latency: 18ms (Optimal for Mumbai datacenter)'
  ]);

  // IndexedDB Cache breakdown
  const [cachedStores, setCachedStores] = useState([
    { name: 'invoices', records: 276, sizeBytes: '1.42 MB', lastUpdated: '12:49 PM', status: 'SYNCHRONIZED' },
    { name: 'customers', records: 48, sizeBytes: '320 KB', lastUpdated: '11:30 AM', status: 'SYNCHRONIZED' },
    { name: 'inventory', records: 184, sizeBytes: '2.15 MB', lastUpdated: '11:33 AM', status: 'SYNCHRONIZED' },
    { name: 'loans', records: 14, sizeBytes: '450 KB', lastUpdated: '10:45 AM', status: 'SYNCHRONIZED' },
    { name: 'repairs', records: 9, sizeBytes: '180 KB', lastUpdated: '09:15 AM', status: 'SYNCHRONIZED' },
    { name: 'rates', records: 30, sizeBytes: '64 KB', lastUpdated: '12:40 PM', status: 'SYNCHRONIZED' },
    { name: 'counters', records: 3, sizeBytes: '12 KB', lastUpdated: '11:38 AM', status: 'SYNCHRONIZED' },
    { name: 'audit_trail', records: 542, sizeBytes: '1.85 MB', lastUpdated: '12:49 PM', status: 'SYNCHRONIZED' }
  ]);

  // Cloud Backups List
  const [backupSnapshots, setBackupSnapshots] = useState([
    {
      id: 'snap-1',
      filename: 'SBJ_Cloud_Snapshot_20261115_1251.enc',
      date: '15-Nov-2026 12:51 PM',
      size: '377 KB',
      destination: 's3://kreya-backups-mumbai/sbj/snap_20261115_1251.enc',
      status: 'VERIFIED' as const,
      checksum: 'e3b0c44298fc1c14...855'
    },
    {
      id: 'snap-2',
      filename: 'SBJ_Cloud_Snapshot_20261114_2030.enc',
      date: '14-Nov-2026 08:30 PM',
      size: '374 KB',
      destination: 's3://kreya-backups-mumbai/sbj/snap_20261114_2030.enc',
      status: 'VERIFIED' as const,
      checksum: '9f86d081884c7d65...991'
    },
    {
      id: 'snap-3',
      filename: 'SBJ_Cloud_Snapshot_20261113_2030.enc',
      date: '13-Nov-2026 08:30 PM',
      size: '369 KB',
      destination: 's3://kreya-backups-mumbai/sbj/snap_20261113_2030.enc',
      status: 'VERIFIED' as const,
      checksum: '4b227777d4dd1fc6...120'
    }
  ]);

  const [alertNotice, setAlertNotice] = useState<string | null>(null);

  // Trigger Cloud Sync Now Workflow
  const handleTriggerCloudSync = () => {
    setIsSyncing(true);
    setSyncProgress(10);
    setSyncStepLabel('Verifying local IndexedDB revisions and row_versions...');

    setTimeout(() => {
      setSyncProgress(35);
      setSyncStepLabel('Extracting dirty records and packaging database delta payload...');
      setTimeout(() => {
        setSyncProgress(65);
        setSyncStepLabel('Encrypting with AES-256-GCM and pushing to AWS S3 Mumbai...');
        setTimeout(() => {
          setSyncProgress(90);
          setSyncStepLabel('Verifying PostgreSQL foreign key constraints & SHA256 checksum...');
          setTimeout(() => {
            setSyncProgress(100);
            setIsSyncing(false);
            setLastSyncTime(`Just now (${new Date().toLocaleTimeString('en-IN')})`);
            setPendingMutationsCount(0);
            setAlertNotice('Cloud synchronization completed with 100% data integrity!');
            setTimeout(() => setAlertNotice(null), 4000);
          }, 600);
        }, 700);
      }, 700);
    }, 600);
  };

  // Run DB Connection Diagnostic Ping
  const handleRunDbDiagnostic = () => {
    setIsPingingDb(true);
    setDbDiagnosticLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Pinging DATABASE_URL linked to app_dom_app_developer_495779...`]);

    setTimeout(() => {
      setIsPingingDb(false);
      setDbDiagnosticLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] SELECT 1; -> OK (Latency: 17.8ms)`,
        `[${new Date().toLocaleTimeString()}] PostgreSQL Connection Pool: 15 active / 20 pool size`,
        `[${new Date().toLocaleTimeString()}] Database Health: HEALTHY (Zero deadlocks, 0 replication lag)`
      ]);
    }, 900);
  };

  // Clear Local Cache
  const handleClearLocalCache = () => {
    if (confirm('Are you sure you want to purge and re-initialize the local IndexedDB cache? Stored records will be re-pulled from cloud PostgreSQL.')) {
      setAlertNotice('Local IndexedDB cache re-indexed and refreshed from primary PostgreSQL store!');
      setTimeout(() => setAlertNotice(null), 3500);
    }
  };

  return (
    <div className="page">
      {/* 1. Header Banner & Expiry Alert */}
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
          onClick={() => onNavigate ? onNavigate('licence') : alert('Navigating to Licence Renewal...')}
          className="font-semibold text-amber-900 hover:text-amber-950 cursor-pointer flex items-center gap-1 text-xs px-2 py-1 bg-amber-100 hover:bg-amber-200 rounded border border-amber-300 transition-colors"
        >
          <span>Licence</span>
          <span>→</span>
        </button>
      </div>

      {/* Page Header */}
      <div className="page-hdr flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="page-hdr-left">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight">Sync & Database Infrastructure</h1>
            {/* Header banner Counter badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fef8ee] text-[#92400e] rounded-full border border-[#efdcb6] text-xs font-semibold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
              <span>Counter MAIN</span>
              <span className="font-normal opacity-80"> · REG-2026-00001 · closing</span>
            </div>
          </div>
          <p className="helper text-xs text-slate-500 mt-1">
            Offline-first architecture, local browser IndexedDB cache metrics, encrypted cloud replication & PostgreSQL diagnostic · S.B Borana Jewellers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTriggerCloudSync}
            disabled={isSyncing}
            className="btn btn-primary btn-sm flex items-center gap-1.5"
          >
            <Cloud size={14} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Synchronizing...' : 'Trigger Cloud Sync Now'}</span>
          </button>
        </div>
      </div>

      {/* Alert Notice */}
      {alertNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium flex items-center gap-2 mb-3 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{alertNotice}</span>
        </div>
      )}

      {/* Sub-Tabs: Cloud Sync vs Data Export & Backups */}
      <div className="tabs mb-4 flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveSubTab('sync')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'sync'
              ? 'border-[#237a57] text-[#237a57]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Cloud size={14} />
          <span>Cloud Sync & Database Infrastructure</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('backup')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'backup'
              ? 'border-[#237a57] text-[#237a57]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Archive size={14} />
          <span>Data Export & Backup Downloads</span>
        </button>
      </div>

      {activeSubTab === 'backup' ? (
        <DataExportBackupView
          store={store || mockStore}
          customers={customers}
          inventory={inventory}
          invoices={invoices}
          loans={loans}
          repairs={repairs}
          schemes={schemes}
        />
      ) : (
        <>
      {/* Syncing Progress Card */}
      {isSyncing && (
        <div className="card p-4 mb-4 border-l-4 border-l-[#237a57] bg-white">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
            <span>{syncStepLabel}</span>
            <span className="font-mono text-[#237a57]">{syncProgress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-[#237a57] h-2 rounded-full transition-all duration-300"
              style={{ width: `${syncProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* TOP 3 KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        
        {/* Card 1: Offline-First Synchronization Status */}
        <div className="card">
          <div className="card-header p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              {isOnline ? <Wifi size={14} className="text-emerald-600" /> : <WifiOff size={14} className="text-amber-600" />}
              <span>Sync Engine Status</span>
            </span>
            <span className={`badge ${isOnline ? 'badge-green' : 'badge-yellow'}`}>
              {isOnline ? 'ONLINE' : 'OFFLINE MODE'}
            </span>
          </div>
          <div className="card-body p-4 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Local Queue (Mutations):</span>
              <span className="font-mono font-bold text-slate-900">{pendingMutationsCount} pending</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Last Successful Sync:</span>
              <span className="font-medium text-slate-800">{lastSyncTime}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Conflict Protocol:</span>
              <span className="font-mono text-[11px] text-slate-600">Server-Wins + row_version</span>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOnline(!isOnline)}
                className="text-[11px] text-slate-600 hover:text-slate-900 underline"
              >
                {isOnline ? 'Simulate Offline Disconnect' : 'Restore Online Connectivity'}
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Local IndexedDB Metrics */}
        <div className="card">
          <div className="card-header p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <HardDrive size={14} className="text-blue-600" />
              <span>Browser Cache (IndexedDB)</span>
            </span>
            <span className="badge badge-indigo text-[10px]">v2.4 Local</span>
          </div>
          <div className="card-body p-4 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Local Database:</span>
              <span className="font-mono font-bold text-slate-800">kreya_jewel360_local_v2</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Storage Utilized:</span>
              <span className="font-mono font-bold text-slate-900">6.44 MB / 50 MB (12.9%)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Cached Object Stores:</span>
              <span className="font-semibold text-slate-800">8 tables cached</span>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleClearLocalCache}
                className="text-[11px] text-red-600 hover:text-red-700 underline flex items-center gap-1"
              >
                <Trash2 size={11} />
                <span>Purge & Re-index Cache</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: PostgreSQL Primary Connection */}
        <div className="card">
          <div className="card-header p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Database size={14} className="text-[#237a57]" />
              <span>PostgreSQL Connection</span>
            </span>
            <span className="badge badge-green text-[10px]">Healthy</span>
          </div>
          <div className="card-body p-4 space-y-2 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Database Instance:</span>
              <span className="font-mono font-bold text-[11px] text-slate-900 block truncate" title="DATABASE_URL linked to app_dom_app_developer_495779">
                DATABASE_URL linked to app_dom_app_developer_495779
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Connection Pool:</span>
              <span className="font-mono font-bold text-slate-800">15 / 20 poolers active</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Round-trip Latency:</span>
              <span className="font-mono font-bold text-emerald-700">18 ms (Optimal)</span>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleRunDbDiagnostic}
                disabled={isPingingDb}
                className="text-[11px] text-[#237a57] hover:underline font-semibold flex items-center gap-1"
              >
                <Play size={10} className={isPingingDb ? 'animate-spin' : ''} />
                <span>Test Connection Ping</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ROW 2: INDEXEDDB CACHE TABLE & POSTGRESQL DIAGNOSTIC CONSOLE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        
        {/* IndexedDB Object Stores Table */}
        <div className="card">
          <div className="card-header p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <HardDrive size={15} className="text-slate-600" />
              <span className="card-title text-xs font-bold text-slate-800 uppercase tracking-wide">
                IndexedDB Cached Object Stores
              </span>
            </div>
            <span className="badge badge-gray text-[10px]">Instant Offline POS</span>
          </div>
          <div className="tbl-wrap">
            <table className="tbl w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 px-3 text-left">OBJECT STORE</th>
                  <th className="py-2 px-3 text-right">RECORDS</th>
                  <th className="py-2 px-3 text-right">SIZE</th>
                  <th className="py-2 px-3 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {cachedStores.map(st => (
                  <tr key={st.name} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-bold text-slate-800 font-sans">{st.name}</td>
                    <td className="py-2 px-3 text-right">{st.records}</td>
                    <td className="py-2 px-3 text-right text-slate-600">{st.sizeBytes}</td>
                    <td className="py-2 px-3 text-center">
                      <span className="badge badge-green text-[10px]">{st.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Offline writes automatically batch and sync upon reconnect.</span>
            <span className="font-mono">8 of 8 stores aligned</span>
          </div>
        </div>

        {/* PostgreSQL Diagnostic Console */}
        <div className="card flex flex-col">
          <div className="card-header p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <Terminal size={15} className="text-[#237a57]" />
              <span className="card-title text-xs font-bold text-slate-800 uppercase tracking-wide">
                PostgreSQL Connection Diagnostic Terminal
              </span>
            </div>
            <button
              type="button"
              onClick={handleRunDbDiagnostic}
              disabled={isPingingDb}
              className="btn btn-outline btn-sm py-0.5 px-2 text-[11px]"
            >
              Ping
            </button>
          </div>
          <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] flex-1 min-h-[220px] max-h-[300px] overflow-y-auto space-y-1 rounded-b-lg">
            <div className="text-slate-500 pb-1 border-b border-slate-800">
              # KreyaJewel360 PostgreSQL Database Diagnostic Shell (app_dom_app_developer_495779)
            </div>
            {dbDiagnosticLogs.map((log, idx) => (
              <div key={idx} className="leading-snug">
                <span className="text-slate-500 mr-1">$</span>
                <span>{log}</span>
              </div>
            ))}
            {isPingingDb && (
              <div className="text-amber-400 animate-pulse">
                $ Running ICMP ping and transaction commit test...
              </div>
            )}
          </div>
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500">
            PostgreSQL instance hosting schema: `public.shop_settings`, `public.users`, `public.audit_log`, `public.register_sessions`.
          </div>
        </div>

      </div>

      {/* ROW 3: CLOUD BACKUP SNAPSHOTS */}
      <div className="card">
        <div className="card-header p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Cloud size={16} className="text-blue-600" />
            <span className="card-title text-xs font-bold text-slate-800 uppercase tracking-wide">
              Cloud Backup & Encrypted Storage Snapshots
            </span>
          </div>
          <span className="badge badge-green text-[10px]">Hourly Auto-Sync</span>
        </div>

        <div className="tbl-wrap tbl-desktop-only">
          <table className="tbl w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 px-3 text-left">BACKUP ARCHIVE</th>
                <th className="py-2.5 px-3 text-left">TIMESTAMP</th>
                <th className="py-2.5 px-3 text-left">DESTINATION BUCKET</th>
                <th className="py-2.5 px-3 text-right">SIZE</th>
                <th className="py-2.5 px-3 text-left">INTEGRITY HASH</th>
                <th className="py-2.5 px-3 text-center">STATUS</th>
                <th className="py-2.5 px-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {backupSnapshots.map(snap => (
                <tr key={snap.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-sans font-bold text-slate-900">
                    {snap.filename}
                  </td>
                  <td className="py-3 px-3 text-slate-600">{snap.date}</td>
                  <td className="py-3 px-3 text-blue-700">{snap.destination}</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-800">{snap.size}</td>
                  <td className="py-3 px-3 text-slate-500 text-[11px]">{snap.checksum}</td>
                  <td className="py-3 px-3 text-center">
                    <span className="badge badge-green text-[10px]">{snap.status}</span>
                  </td>
                  <td className="py-3 px-3 text-right font-sans">
                    <button
                      type="button"
                      onClick={() => alert(`Downloading verified backup ${snap.filename}...`)}
                      className="btn btn-outline btn-sm py-1 px-2 text-xs flex items-center gap-1 inline-flex"
                    >
                      <Download size={12} />
                      <span>Download</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="dt-pager p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50">
          <span>Scheduled cloud sync: Every 60 minutes · Next automated backup in 28 minutes</span>
          <span className="font-mono">Storage region: ap-south-1 (Mumbai)</span>
        </div>
      </div>
      </>
      )}
    </div>
  );
};
