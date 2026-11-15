import React, { useState, useEffect } from 'react';
import { 
  Building2, Search, Bell, User, Clock, TrendingUp, Monitor, 
  ChevronDown, ChevronLeft, ChevronRight, RotateCw, X, Check, ShieldCheck 
} from 'lucide-react';
import { StoreProfile, DailyRates, Counter } from '../../types';

interface HeaderProps {
  store: StoreProfile;
  rates: DailyRates;
  counters: Counter[];
  activeCounter: Counter;
  onSelectCounter: (counter: Counter) => void;
  onOpenOmnibar: () => void;
  onNavigate: (module: string) => void;
  currentModule: string;
}

export const Header: React.FC<HeaderProps> = ({
  store,
  rates,
  counters,
  activeCounter,
  onSelectCounter,
  onOpenOmnibar,
  onNavigate,
  currentModule
}) => {
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [currentTime, setCurrentTime] = useState('Thu 12 Nov 12:38 PM');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = days[now.getDay()];
      const date = now.getDate();
      const month = months[now.getMonth()];
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      setCurrentTime(`${day} ${date} ${month} ${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  const getModuleTitle = () => {
    switch (currentModule) {
      case 'dashboard': return 'Main / Dashboard';
      case 'daily-rates': return 'Main / Daily Metal Rates';
      case 'customers': return 'Customers / Customer 360';
      case 'payments-pending': return 'Customers / Payments & Pending';
      case 'billing': return 'Sales / Orders & Billing';
      case 'metal-booking': return 'Sales / Metal Advance Booking';
      case 'cancellations': return 'Sales / Cancellations';
      case 'cash-register': return 'Sales / Cash Register';
      case 'buyback': return 'Sales / Returns & Buy-back';
      case 'shipments': return 'Sales / Shipments';
      case 'repairs': return 'Services / Repair Orders';
      case 'loans': return 'Finance / Gold & Silver Loans';
      case 'old-metal': return 'Finance / Old Gold & Silver Purchase';
      case 'schemes': return 'Finance / Savings Schemes';
      case 'cash-outflows': return 'Finance / Cash Outflows';
      case 'inventory': return 'Stock / Inventory';
      case 'valuation': return 'Stock / Stock & Valuation';
      case 'tags': return 'Stock / Stock Ledger & Tags';
      case 'inventory-verification': return 'Stock / Inventory Verification';
      case 'old-metal-stock': return 'Stock / Old Metal Stock';
      case 'suppliers': return 'Suppliers & Purchasing / Suppliers';
      case 'purchase-orders': return 'Suppliers & Purchasing / Purchase Orders';
      case 'goods-receipts': return 'Suppliers & Purchasing / Goods Receipts';
      case 'supplier-bills': return 'Suppliers & Purchasing / Supplier Bills';
      case 'supplier-payments': return 'Suppliers & Purchasing / Supplier Payments';
      case 'purchase-reports': return 'Suppliers & Purchasing / Purchase Reports';
      case 'sales-reports': return 'Reports / Sales Reports';
      case 'gst-reports': return 'Reports / GST Reports';
      case 'reports-classic': return 'Reports / Reports (classic)';
      case 'backup-settings': return 'Reports / Export & Backup';
      case 'import': return 'Reports / Data Import';
      case 'sync': return 'Admin / Sync & Database Infrastructure';
      case 'shop-settings': return 'Admin / Store Profile & Counters';
      case 'profile': return 'Admin / Store Profile & Counters';
      case 'business-settings': return 'Admin / Business Settings';
      case 'integrations': return 'Admin / Integrations';
      case 'users': return 'Admin / Users & Security RBAC';
      case 'roles-permissions': return 'Admin / Roles & Permissions';
      case 'theme-layout': return 'Admin / Theme & Layout';
      case 'login-page': return 'Admin / Login Page';
      case 'security': return 'Admin / Security';
      case 'licence': return 'Admin / Licence';
      case 'audit-log': return 'Admin / Audit Logs & Governance';
      case 'audit-logs': return 'Admin / Audit Logs & Governance';
      case 'error-log': return 'Admin / Error Log';
      default: return 'Main / Dashboard';
    }
  };

  return (
    <>
      {/* Main Header Bar Matching Screenshot */}
      <header className="h-[var(--header)] shrink-0 bg-white/[0.92] border-b border-[var(--border)] px-6 flex items-center justify-between sticky top-0 z-20 select-none">
        {/* Left: Breadcrumb & Title */}
        <div className="flex flex-col justify-center">
          <div className="text-[11px] text-slate-400 font-medium">
            {getModuleTitle()}
          </div>
          <h1 className="text-base font-bold text-slate-900 leading-tight">
            {getModuleTitle().split(' / ')[1] || 'Dashboard'}
          </h1>
        </div>

        {/* Right: Counter Pill & User Info */}
        <div className="flex items-center space-x-4">
          {/* Active Counter Badge Matching Screenshot */}
          <button
            onClick={() => setShowCounterModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#fef8ee] hover:bg-[#fdf2dc] text-[#92400e] rounded-full border border-[#efdcb6] transition-colors text-xs font-semibold cursor-pointer whitespace-nowrap shadow-2xs"
            title="Active counter & cash register session"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span>Counter MAIN</span>
            <span className="font-normal opacity-80"> · REG-2026-00001 · closing</span>
          </button>

          {/* User Badge Matching Screenshot */}
          <div className="flex items-center space-x-2 pl-1">
            <div className="w-8 h-8 rounded-full bg-[#111827] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              A
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-slate-900 leading-none">Admin</div>
              <div className="text-[11px] text-slate-400 mt-0.5 leading-none font-medium">Shop Owner</div>
            </div>
          </div>
        </div>
      </header>

      {/* Counter Switching Modal */}
      {showCounterModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Monitor className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-sm">Select Showroom Counter</h3>
              </div>
              <button 
                onClick={() => setShowCounterModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-2">
              <p className="text-xs text-slate-500 mb-3">
                Transactions, cash drawer inflows, and orders will be attributed to this counter.
              </p>
              
              {counters.map(counter => (
                <div
                  key={counter.id}
                  onClick={() => {
                    onSelectCounter(counter);
                    setShowCounterModal(false);
                  }}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between ${
                    counter.id === activeCounter.id
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-slate-800">{counter.name}</span>
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        {counter.code}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Register: {counter.activeRegisterId || 'REG-2026-00021'} · Status: Active
                    </p>
                  </div>
                  {counter.id === activeCounter.id && (
                    <Check className="w-4 h-4 text-emerald-600 font-bold" />
                  )}
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowCounterModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
