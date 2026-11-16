import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, TrendingUp, Users, CreditCard, ShoppingCart, 
  CalendarClock, XCircle, DollarSign, RotateCcw, Truck, Wrench, 
  Coins, Flame, PiggyBank, ArrowDownRight, Package, BarChart3, 
  Tag, CheckSquare, Layers, Building2, ShoppingBag, Receipt, 
  FileSpreadsheet, History, Database, Upload, Settings, KeyRound, 
  Palette, LogIn, Lock, Award, AlertCircle, Search, X, 
  ChevronDown, ChevronsLeft, ChevronsRight, LogOut, LucideIcon 
} from 'lucide-react';
import { StoreProfile } from '../../types';

export interface NavItemDef {
  to: string;
  label: string;
  mod: string;
  icon: LucideIcon;
}

export interface NavGroupDef {
  group: string;
  items: NavItemDef[];
}

export const NAV_GROUPS: NavGroupDef[] = [
  {
    group: 'Main',
    items: [
      { to: '/', label: 'Dashboard', mod: 'dashboard', icon: LayoutDashboard },
      { to: '/daily-rates', label: 'Daily Metal Rates', mod: 'daily-rates', icon: TrendingUp },
    ],
  },
  {
    group: 'Customers',
    items: [
      { to: '/customers', label: 'Customers', mod: 'customers', icon: Users },
      { to: '/payments', label: 'Payments & Pending', mod: 'payments-pending', icon: CreditCard },
    ],
  },
  {
    group: 'Sales',
    items: [
      { to: '/orders', label: 'Orders & Billing', mod: 'billing', icon: ShoppingCart },
      { to: '/bookings', label: 'Metal Advance Booking', mod: 'metal-booking', icon: CalendarClock },
      { to: '/cancellations', label: 'Cancellations', mod: 'cancellations', icon: XCircle },
      { to: '/register', label: 'Cash Register', mod: 'cash-register', icon: DollarSign },
      { to: '/buybacks', label: 'Returns / Buy-back', mod: 'returns-buyback', icon: RotateCcw },
      { to: '/shipments', label: 'Shipments', mod: 'shipments', icon: Truck },
    ],
  },
  {
    group: 'Services',
    items: [
      { to: '/repairs', label: 'Repair Orders', mod: 'repairs', icon: Wrench },
    ],
  },
  {
    group: 'Finance',
    items: [
      { to: '/loans', label: 'Gold / Silver Loans', mod: 'loans', icon: Coins },
      { to: '/old-gold', label: 'Old Gold/Silver Purchase', mod: 'old-metal', icon: Flame },
      { to: '/deposits', label: 'Savings Schemes', mod: 'schemes', icon: PiggyBank },
      { to: '/outflows', label: 'Cash Outflows', mod: 'cash-outflows', icon: ArrowDownRight },
    ],
  },
  {
    group: 'Stock',
    items: [
      { to: '/inventory', label: 'Inventory', mod: 'inventory', icon: Package },
      { to: '/stock', label: 'Stock & Valuation', mod: 'valuation', icon: BarChart3 },
      { to: '/stock-ledger', label: 'Stock Ledger & Tags', mod: 'stock-ledger', icon: Tag },
      { to: '/stock-verification', label: 'Inventory Verification', mod: 'inventory-verification', icon: CheckSquare },
      { to: '/metal-stock', label: 'Old Metal Stock', mod: 'old-metal-stock', icon: Layers },
    ],
  },
  {
    group: 'Suppliers & Purchasing',
    items: [
      { to: '/suppliers', label: 'Suppliers', mod: 'suppliers', icon: Building2 },
      { to: '/purchase-orders', label: 'Purchase Orders', mod: 'purchase-orders', icon: ShoppingBag },
      { to: '/goods-receipts', label: 'Goods Receipts', mod: 'goods-receipts', icon: Truck },
      { to: '/supplier-bills', label: 'Supplier Bills', mod: 'supplier-bills', icon: Receipt },
      { to: '/supplier-payments', label: 'Supplier Payments', mod: 'supplier-payments', icon: CreditCard },
      { to: '/purchase-reports', label: 'Purchase Reports', mod: 'purchase-reports', icon: FileSpreadsheet },
    ],
  },
  {
    group: 'Reports',
    items: [
      { to: '/sales-reports', label: 'Sales Reports', mod: 'sales-reports', icon: BarChart3 },
      { to: '/gst-reports', label: 'GST Reports', mod: 'gst-reports', icon: FileSpreadsheet },
      { to: '/reports', label: 'Reports (classic)', mod: 'reports-classic', icon: History },
      { to: '/export', label: 'Export / Backup', mod: 'backup-settings', icon: Database },
      { to: '/data-import', label: 'Data Import', mod: 'import', icon: Upload },
    ],
  },
  {
    group: 'Admin',
    items: [
      { to: '/settings', label: 'Shop Settings', mod: 'settings', icon: Settings },
      { to: '/admin/business', label: 'Business Settings', mod: 'business-settings', icon: Building2 },
      { to: '/admin/integrations', label: 'Integrations', mod: 'integrations', icon: TrendingUp },
      { to: '/admin/users', label: 'Users', mod: 'users', icon: Users },
      { to: '/admin/roles', label: 'Roles & Permissions', mod: 'roles-permissions', icon: KeyRound },
      { to: '/admin/theme', label: 'Theme & Layout', mod: 'theme-layout', icon: Palette },
      { to: '/admin/login-page', label: 'Login Page', mod: 'login-page', icon: LogIn },
      { to: '/admin/security', label: 'Security', mod: 'security', icon: Lock },
      { to: '/admin/license', label: 'Licence', mod: 'licence', icon: Award },
      { to: '/admin/audit', label: 'Audit Log', mod: 'audit-logs', icon: History },
      { to: '/admin/errors', label: 'Error Log', mod: 'error-log', icon: AlertCircle },
    ],
  },
];

export function isNavActive(currentModule: string, itemMod: string): boolean {
  if (currentModule === itemMod) return true;
  if (itemMod === 'settings' && (currentModule === 'profile' || currentModule === 'shop-settings' || currentModule === 'settings-shop')) return true;
  if (itemMod === 'audit-logs' && (currentModule === 'audit-log' || currentModule === 'audit-logs' || currentModule === 'settings-audit')) return true;
  if (itemMod === 'backup-settings' && (currentModule === 'sync' || currentModule === 'backup' || currentModule === 'backup-settings')) return true;
  if (itemMod === 'returns-buyback' && (currentModule === 'buyback' || currentModule === 'returns-buyback' || currentModule === 'buybacks')) return true;
  if (itemMod === 'old-metal' && (currentModule === 'old-gold' || currentModule === 'old-metal')) return true;
  if (itemMod === 'stock-ledger' && (currentModule === 'tags' || currentModule === 'stock-ledger')) return true;
  return false;
}

export interface SidebarProps {
  currentModule: string;
  onNavigate: (module: string) => void;
  store?: StoreProfile;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  openLoansCount?: number;
  openRepairsCount?: number;
  activeSchemesCount?: number;
  pendingReceivablesCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  onNavigate,
  store,
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
  openLoansCount,
  openRepairsCount,
  activeSchemesCount,
  pendingReceivablesCount,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const query = searchQuery.trim().toLowerCase();

  const getItemCount = (mod: string): number | undefined => {
    if (mod === 'loans' && openLoansCount && openLoansCount > 0) return openLoansCount;
    if (mod === 'repairs' && openRepairsCount && openRepairsCount > 0) return openRepairsCount;
    if (mod === 'schemes' && activeSchemesCount && activeSchemesCount > 0) return activeSchemesCount;
    if (mod === 'payments-pending' && pendingReceivablesCount && pendingReceivablesCount > 0) return pendingReceivablesCount;
    return undefined;
  };

  // 9 Nav Groups open state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    try {
      const shut = new Set(JSON.parse(localStorage.getItem('kj_nav_shut') || '[]'));
      const initial: Record<string, boolean> = {};
      NAV_GROUPS.forEach(g => {
        initial[g.group] = !shut.has(g.group);
      });
      return initial;
    } catch {
      return {
        Main: true,
        Customers: true,
        Sales: true,
        Services: true,
        Finance: true,
        Stock: true,
        'Suppliers & Purchasing': true,
        Reports: true,
        Admin: true,
      };
    }
  });

  const toggleSection = (groupName: string) => {
    setOpenSections(prev => {
      const next = { ...prev, [groupName]: !prev[groupName] };
      try {
        const shutList = Object.keys(next).filter(k => !next[k]);
        localStorage.setItem('kj_nav_shut', JSON.stringify(shutList));
      } catch {}
      return next;
    });
  };

  const shopName = store?.tradeName || store?.shopName || store?.name || 'S.B Borana Jewellers';
  const city = store?.city || store?.address || 'Mumbai';
  const storeInitials = String(shopName || 'SB')
    .replace(/[^A-Za-z0-9 ]/g, ' ')
    .trim()
    .split(/\s+/)
    .map(e => e[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'SB';

  const groupHasCurrent = (group: NavGroupDef) => {
    return group.items.some(item => isNavActive(currentModule, item.mod));
  };

  const isMini = collapsed && !mobileOpen;

  // Calculate filtered items across all groups for search
  const renderedGroups = NAV_GROUPS.map(group => {
    const filteredItems = query
      ? group.items.filter(
          item =>
            item.label.toLowerCase().includes(query) ||
            group.group.toLowerCase().includes(query)
        )
      : group.items;
    return {
      ...group,
      filteredItems,
    };
  }).filter(group => group.filteredItems.length > 0);

  const totalFilteredCount = renderedGroups.reduce(
    (sum, g) => sum + g.filteredItems.length,
    0
  );

  return (
    <aside className={`sidebar${mobileOpen ? ' open' : ''}`}>
      {/* Brand Header */}
      <div className={`brand${isMini ? ' mini' : ''}`}>
        <span
          className="brand-logo brand-mono"
          title="Add your logo in Settings → Logo & Branding"
        >
          {storeInitials}
        </span>
        {!isMini && (
          <div className="brand-info">
            <h1>{shopName}</h1>
            <p>{city}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sb-nav" aria-label="Main">
        {!isMini && (
          <div className="nav-search">
            <Search size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Escape') setSearchQuery('');
              }}
              placeholder="Find a screen…"
              aria-label="Find a screen"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {/* 9 Nav Groups */}
        {renderedGroups.map(group => {
          const isOpen = query ? true : (openSections[group.group] ?? true);
          const hasCurrent = groupHasCurrent(group);

          return (
            <div
              key={group.group}
              className={`nav-group${isOpen ? ' open' : ''}`}
            >
              {!isMini && (
                <button
                  type="button"
                  className={`nav-label${hasCurrent ? ' has-current' : ''}`}
                  onClick={() => toggleSection(group.group)}
                  aria-expanded={isOpen}
                >
                  <span>{group.group}</span>
                  <span className="nav-count">{group.filteredItems.length}</span>
                  <ChevronDown size={13} className="nav-chev" />
                </button>
              )}

              {isOpen &&
                group.filteredItems.map(item => {
                  const isActive = isNavActive(currentModule, item.mod);
                  const Icon = item.icon;
                  const count = getItemCount(item.mod);

                  return (
                    <a
                      key={item.to}
                      className={`nav-item${isActive ? ' active' : ''}`}
                      href={item.to}
                      title={isMini ? item.label : undefined}
                      onClick={e => {
                        e.preventDefault();
                        setSearchQuery('');
                        onNavigate(item.mod);
                        onCloseMobile?.();
                      }}
                    >
                      <Icon size={16} />
                      {!isMini && <span className="nav-text">{item.label}</span>}
                      {!isMini && count !== undefined && (
                        <span className="counter-badge">{count}</span>
                      )}
                    </a>
                  );
                })}
            </div>
          );
        })}

        {/* Nav empty search state */}
        {query && totalFilteredCount === 0 && (
          <div className="nav-empty">No screen called “{searchQuery}”.</div>
        )}
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <button
          type="button"
          className="nav-item collapse-btn hidden-mobile"
          onClick={onToggleCollapse}
          title={collapsed ? "Expand menu (Ctrl+M)" : "Collapse menu (Ctrl+M)"}
        >
          {collapsed ? (
            <ChevronsRight size={16} />
          ) : (
            <>
              <ChevronsLeft size={16} />
              <span className="nav-text">Collapse</span>
            </>
          )}
        </button>
        <button
          type="button"
          className="nav-item signout"
          title="Sign out"
          onClick={() => {
            if (confirm('Sign out of KreyaJewel360?')) {
              window.location.reload();
            }
          }}
        >
          <LogOut size={16} />
          {!isMini && <span className="nav-text">Sign out</span>}
        </button>
        {!isMini && (
          <div className="powered">
            Powered by <strong>KreyaJewel360</strong>
          </div>
        )}
      </div>
    </aside>
  );
};
