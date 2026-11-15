import React, { useState } from 'react';
import { 
  LayoutDashboard, TrendingUp, Users, CreditCard, ShoppingCart, 
  CalendarClock, XCircle, DollarSign, RotateCcw, Truck, Wrench, 
  Coins, Flame, PiggyBank, ArrowDownRight, Package, BarChart3, 
  Tag, CheckSquare, Layers, Building2, ShoppingBag, Receipt, 
  FileSpreadsheet, Database, Settings, ShieldCheck, KeyRound, 
  Palette, LogIn, Lock, Award, History, AlertCircle, ChevronDown, 
  ChevronRight, Search, ChevronsLeft, ChevronsRight, Gem, Upload
} from 'lucide-react';

interface SidebarProps {
  currentModule: string;
  onNavigate: (module: string) => void;
  openLoansCount?: number;
  openRepairsCount?: number;
  activeSchemesCount?: number;
  pendingReceivablesCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  onNavigate,
  openLoansCount = 14,
  openRepairsCount = 3,
  activeSchemesCount = 13,
  pendingReceivablesCount = 2
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  // Group expansion states - all open by default as in the video
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    MAIN: true,
    CUSTOMERS: true,
    SALES: true,
    SERVICES: true,
    FINANCE: true,
    STOCK: true,
    SUPPLIERS: true,
    REPORTS: true,
    ADMIN: true
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const isNavActive = (id: string) => {
    if (currentModule === id) return true;
    if (id === 'shop-settings' && (currentModule === 'profile' || currentModule === 'shop-settings')) return true;
    if (id === 'audit-log' && (currentModule === 'audit-logs' || currentModule === 'audit-log')) return true;
    if (id === 'backup-settings' && (currentModule === 'sync' || currentModule === 'backup-settings')) return true;
    return false;
  };

  const navItemClass = (id: string) => `
    w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-left group
    ${isNavActive(id) 
      ? 'bg-[#eaf7ee] text-[#065f46] font-semibold border border-[#d4eedb]' 
      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'}
  `;

  return (
    <aside 
      className={`${collapsed ? 'w-[var(--sidebar-mini)]' : 'w-[var(--sidebar)]'} bg-white border-r border-[#e2e8f0] flex flex-col h-screen select-none transition-all duration-200 z-10 shrink-0`}
    >
      {/* Top Shop Brand Area Matching User Live PWA */}
      <div className="p-3 border-b border-[#e2e8f0] bg-white">
        {!collapsed ? (
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#111827] flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0 tracking-tight">
              SB
            </div>
            <div className="overflow-hidden">
              <div className="font-bold text-slate-900 text-[13px] leading-tight truncate">
                S.B Borana Jewellers
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                Mumbai
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-lg bg-[#111827] flex items-center justify-center text-white font-bold text-xs shadow-xs">
              SB
            </div>
          </div>
        )}

        {/* Find a screen... Search bar */}
        {!collapsed && (
          <div className="mt-2.5 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Find a screen"
              placeholder="Find a screen…"
              className="w-full bg-[#f9fafb] border border-slate-200 rounded-md pl-8 pr-2 py-1 text-xs text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 focus:bg-white"
            />
          </div>
        )}
      </div>

      {/* Nav Items Accordion */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3 custom-scrollbar text-xs">

        {/* 1. MAIN (2) */}
        <div>
          {!collapsed ? (
            <button 
              onClick={() => toggleSection('MAIN')}
              className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-400 hover:text-slate-600 tracking-wider uppercase"
            >
              <span>MAIN</span>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] text-slate-400 font-normal">2</span>
                {openSections.MAIN ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
              </div>
            </button>
          ) : (
            <div className="h-2" />
          )}

          {(openSections.MAIN || collapsed) && (
            <div className="space-y-0.5 mt-0.5">
              <button
                onClick={() => onNavigate('dashboard')}
                className={navItemClass('dashboard')}
                title="Dashboard"
              >
                <div className="flex items-center space-x-2.5">
                  <LayoutDashboard className={`w-4 h-4 shrink-0 ${isNavActive('dashboard') ? 'text-[#10b981]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  {!collapsed && <span>Dashboard</span>}
                </div>
              </button>

              <button
                onClick={() => onNavigate('daily-rates')}
                className={navItemClass('daily-rates')}
                title="Daily Metal Rates"
              >
                <div className="flex items-center space-x-2.5">
                  <TrendingUp className={`w-4 h-4 shrink-0 ${isNavActive('daily-rates') ? 'text-[#10b981]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  {!collapsed && <span>Daily Metal Rates</span>}
                </div>
              </button>
            </div>
          )}
        </div>

        {/* 2. CUSTOMERS (2) */}
        <div>
          {!collapsed ? (
            <button 
              onClick={() => toggleSection('CUSTOMERS')}
              className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-400 hover:text-slate-600 tracking-wider uppercase"
            >
              <span>CUSTOMERS</span>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] text-slate-400 font-normal">2</span>
                {openSections.CUSTOMERS ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
              </div>
            </button>
          ) : (
            <div className="h-2" />
          )}

          {(openSections.CUSTOMERS || collapsed) && (
            <div className="space-y-0.5 mt-0.5">
              <button
                onClick={() => onNavigate('customers')}
                className={navItemClass('customers')}
                title="Customers"
              >
                <div className="flex items-center space-x-2.5">
                  <Users className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Customers</span>}
                </div>
              </button>

              <button
                onClick={() => onNavigate('payments-pending')}
                className={navItemClass('payments-pending')}
                title="Payments & Pending"
              >
                <div className="flex items-center space-x-2.5">
                  <CreditCard className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Payments & Pending</span>}
                </div>
              </button>
            </div>
          )}
        </div>

        {/* 3. SALES (6) */}
        <div>
          {!collapsed ? (
            <button 
              onClick={() => toggleSection('SALES')}
              className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-400 hover:text-slate-600 tracking-wider uppercase"
            >
              <span>SALES</span>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] text-slate-400 font-normal">6</span>
                {openSections.SALES ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
              </div>
            </button>
          ) : (
            <div className="h-2" />
          )}

          {(openSections.SALES || collapsed) && (
            <div className="space-y-0.5 mt-0.5">
              <button
                onClick={() => onNavigate('billing')}
                className={navItemClass('billing')}
                title="Orders & Billing"
              >
                <div className="flex items-center space-x-2.5">
                  <ShoppingCart className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Orders & Billing</span>}
                </div>
              </button>

              <button
                onClick={() => onNavigate('metal-booking')}
                className={navItemClass('metal-booking')}
                title="Metal Advance Booking"
              >
                <div className="flex items-center space-x-2.5">
                  <CalendarClock className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Metal Advance Booking</span>}
                </div>
              </button>

              <button
                onClick={() => onNavigate('cancellations')}
                className={navItemClass('cancellations')}
                title="Cancellations"
              >
                <div className="flex items-center space-x-2.5">
                  <XCircle className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Cancellations</span>}
                </div>
              </button>

              <button
                onClick={() => onNavigate('cash-register')}
                className={navItemClass('cash-register')}
                title="Cash Register"
              >
                <div className="flex items-center space-x-2.5">
                  <DollarSign className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Cash Register</span>}
                </div>
              </button>

              <button
                onClick={() => onNavigate('buyback')}
                className={navItemClass('buyback')}
                title="Returns / Buy-back"
              >
                <div className="flex items-center space-x-2.5">
                  <RotateCcw className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Returns / Buy-back</span>}
                </div>
              </button>

              <button
                onClick={() => onNavigate('shipments')}
                className={navItemClass('shipments')}
                title="Shipments"
              >
                <div className="flex items-center space-x-2.5">
                  <Truck className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Shipments</span>}
                </div>
              </button>
            </div>
          )}
        </div>

        {/* 4. SERVICES (1) */}
        <div>
          {!collapsed ? (
            <button 
              onClick={() => toggleSection('SERVICES')}
              className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-400 hover:text-slate-600 tracking-wider uppercase"
            >
              <span>SERVICES</span>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] text-slate-400 font-normal">1</span>
                {openSections.SERVICES ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
              </div>
            </button>
          ) : (
            <div className="h-2" />
          )}

          {(openSections.SERVICES || collapsed) && (
            <div className="space-y-0.5 mt-0.5">
              <button
                onClick={() => onNavigate('repairs')}
                className={navItemClass('repairs')}
                title="Repair Orders"
              >
                <div className="flex items-center space-x-2.5">
                  <Wrench className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Repair Orders</span>}
                </div>
              </button>
            </div>
          )}
        </div>

        {/* 5. FINANCE (4) */}
        <div>
          {!collapsed ? (
            <button 
              onClick={() => toggleSection('FINANCE')}
              className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-400 hover:text-slate-600 tracking-wider uppercase"
            >
              <span>FINANCE</span>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] text-slate-400 font-normal">4</span>
                {openSections.FINANCE ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
              </div>
            </button>
          ) : (
            <div className="h-2" />
          )}

          {(openSections.FINANCE || collapsed) && (
            <div className="space-y-0.5 mt-0.5">
              <button
                onClick={() => onNavigate('loans')}
                className={navItemClass('loans')}
                title="Gold / Silver Loans"
              >
                <div className="flex items-center space-x-2.5">
                  <Coins className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Gold / Silver Loans</span>}
                </div>
              </button>

              <button
                onClick={() => onNavigate('old-metal')}
                className={navItemClass('old-metal')}
                title="Old Gold/Silver Purchase"
              >
                <div className="flex items-center space-x-2.5">
                  <Flame className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Old Gold/Silver Purchase</span>}
                </div>
              </button>

              <button
                onClick={() => onNavigate('schemes')}
                className={navItemClass('schemes')}
                title="Savings Schemes"
              >
                <div className="flex items-center space-x-2.5">
                  <PiggyBank className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Savings Schemes</span>}
                </div>
              </button>

              <button
                onClick={() => onNavigate('cash-outflows')}
                className={navItemClass('cash-outflows')}
                title="Cash Outflows"
              >
                <div className="flex items-center space-x-2.5">
                  <ArrowDownRight className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Cash Outflows</span>}
                </div>
              </button>
            </div>
          )}
        </div>

        {/* 6. STOCK (5) */}
        <div>
          {!collapsed ? (
            <button 
              onClick={() => toggleSection('STOCK')}
              className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-400 hover:text-slate-600 tracking-wider uppercase"
            >
              <span>STOCK</span>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] text-slate-400 font-normal">5</span>
                {openSections.STOCK ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
              </div>
            </button>
          ) : (
            <div className="h-2" />
          )}

          {(openSections.STOCK || collapsed) && (
            <div className="space-y-0.5 mt-0.5">
              <button
                onClick={() => onNavigate('inventory')}
                className={navItemClass('inventory')}
                title="Inventory"
              >
                <div className="flex items-center space-x-2.5">
                  <Package className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Inventory</span>}
                </div>
              </button>

              <button
                onClick={() => onNavigate('valuation')}
                className={navItemClass('valuation')}
                title="Stock & Valuation"
              >
                <div className="flex items-center space-x-2.5">
                  <BarChart3 className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Stock & Valuation</span>}
                </div>
              </button>

              <button
                onClick={() => onNavigate('tags')}
                className={navItemClass('tags')}
                title="Stock Ledger & Tags"
              >
                <div className="flex items-center space-x-2.5">
                  <Tag className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Stock Ledger & Tags</span>}
                </div>
              </button>

              <button
                onClick={() => onNavigate('inventory-verification')}
                className={navItemClass('inventory-verification')}
                title="Inventory Verification"
              >
                <div className="flex items-center space-x-2.5">
                  <CheckSquare className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Inventory Verification</span>}
                </div>
              </button>

              <button
                onClick={() => onNavigate('old-metal-stock')}
                className={navItemClass('old-metal-stock')}
                title="Old Metal Stock"
              >
                <div className="flex items-center space-x-2.5">
                  <Layers className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Old Metal Stock</span>}
                </div>
              </button>
            </div>
          )}
        </div>

        {/* 7. SUPPLIERS & PURCHASING (6) */}
        <div>
          {!collapsed ? (
            <button 
              onClick={() => toggleSection('SUPPLIERS')}
              className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-400 hover:text-slate-600 tracking-wider uppercase"
            >
              <span>SUPPLIERS & PURCHASING</span>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] text-slate-400 font-normal">6</span>
                {openSections.SUPPLIERS ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
              </div>
            </button>
          ) : (
            <div className="h-2" />
          )}

          {(openSections.SUPPLIERS || collapsed) && (
            <div className="space-y-0.5 mt-0.5">
              <button
                onClick={() => onNavigate('suppliers')}
                className={navItemClass('suppliers')}
                title="Suppliers"
              >
                <div className="flex items-center space-x-2.5">
                  <Building2 className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Suppliers</span>}
                </div>
              </button>

              <button
                onClick={() => onNavigate('purchase-orders')}
                className={navItemClass('purchase-orders')}
                title="Purchase Orders"
              >
                <div className="flex items-center space-x-2.5">
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Purchase Orders</span>}
                </div>
              </button>

              <button
                onClick={() => onNavigate('goods-receipts')}
                className={navItemClass('goods-receipts')}
                title="Goods Receipts"
              >
                <div className="flex items-center space-x-2.5">
                  <Truck className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Goods Receipts</span>}
                </div>
              </button>

              <button
                onClick={() => onNavigate('supplier-bills')}
                className={navItemClass('supplier-bills')}
                title="Supplier Bills"
              >
                <div className="flex items-center space-x-2.5">
                  <Receipt className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Supplier Bills</span>}
                </div>
              </button>

              <button
                onClick={() => onNavigate('supplier-payments')}
                className={navItemClass('supplier-payments')}
                title="Supplier Payments"
              >
                <div className="flex items-center space-x-2.5">
                  <CreditCard className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Supplier Payments</span>}
                </div>
              </button>

              <button
                onClick={() => onNavigate('purchase-reports')}
                className={navItemClass('purchase-reports')}
                title="Purchase Reports"
              >
                <div className="flex items-center space-x-2.5">
                  <FileSpreadsheet className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Purchase Reports</span>}
                </div>
              </button>
            </div>
          )}
        </div>

        {/* 8. REPORTS (5) */}
        <div>
          {!collapsed ? (
            <button 
              onClick={() => toggleSection('REPORTS')}
              className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-400 hover:text-slate-600 tracking-wider uppercase"
            >
              <span>REPORTS</span>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] text-slate-400 font-normal">5</span>
                {openSections.REPORTS ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
              </div>
            </button>
          ) : (
            <div className="h-2" />
          )}

          {(openSections.REPORTS || collapsed) && (
            <div className="space-y-0.5 mt-0.5">
              <button
                onClick={() => onNavigate('sales-reports')}
                className={navItemClass('sales-reports')}
                title="Sales Reports"
              >
                <div className="flex items-center space-x-2.5">
                  <BarChart3 className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Sales Reports</span>}
                </div>
              </button>

              <button
                onClick={() => onNavigate('gst-reports')}
                className={navItemClass('gst-reports')}
                title="GST Reports"
              >
                <div className="flex items-center space-x-2.5">
                  <FileSpreadsheet className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>GST Reports</span>}
                </div>
              </button>

              <button
                onClick={() => onNavigate('reports-classic')}
                className={navItemClass('reports-classic')}
                title="Reports (classic)"
              >
                <div className="flex items-center space-x-2.5">
                  <History className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Reports (classic)</span>}
                </div>
              </button>

              <button
                onClick={() => onNavigate('sync')}
                className={navItemClass('backup-settings')}
                title="Export / Backup"
              >
                <div className="flex items-center space-x-2.5">
                  <Database className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Export / Backup</span>}
                </div>
              </button>

              <button
                onClick={() => onNavigate('import')}
                className={navItemClass('import')}
                title="Data Import"
              >
                <div className="flex items-center space-x-2.5">
                  <Upload className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Data Import</span>}
                </div>
              </button>
            </div>
          )}
        </div>

        {/* 9. ADMIN (11) */}
        <div>
          {!collapsed ? (
            <button 
              onClick={() => toggleSection('ADMIN')}
              className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-400 hover:text-slate-600 tracking-wider uppercase"
            >
              <span>ADMIN</span>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] text-slate-400 font-normal">11</span>
                {openSections.ADMIN ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
              </div>
            </button>
          ) : (
            <div className="h-2" />
          )}

          {(openSections.ADMIN || collapsed) && (
            <div className="space-y-0.5 mt-0.5">
              <button
                onClick={() => onNavigate('profile')}
                className={navItemClass('shop-settings')}
                title="Store Profile & Counters"
              >
                <div className="flex items-center space-x-2.5">
                  <Settings className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Store Profile & Counters</span>}
                </div>
              </button>

              <button
                onClick={() => onNavigate('business-settings')}
                className={navItemClass('business-settings')}
                title="Business Settings"
              >
                <div className="flex items-center space-x-2.5">
                  <Building2 className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Business Settings</span>}
                </div>
              </button>

              <button
                onClick={() => onNavigate('integrations')}
                className={navItemClass('integrations')}
                title="Integrations"
              >
                <div className="flex items-center space-x-2.5">
                  <TrendingUp className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Integrations</span>}
                </div>
              </button>

              <button
                onClick={() => onNavigate('users')}
                className={navItemClass('users')}
                title="Users"
              >
                <div className="flex items-center space-x-2.5">
                  <Users className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Users</span>}
                </div>
              </button>

              <button
                onClick={() => onNavigate('roles-permissions')}
                className={navItemClass('roles-permissions')}
                title="Roles & Permissions"
              >
                <div className="flex items-center space-x-2.5">
                  <KeyRound className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Roles & Permissions</span>}
                </div>
              </button>

              <button
                onClick={() => onNavigate('theme-layout')}
                className={navItemClass('theme-layout')}
                title="Theme & Layout"
              >
                <div className="flex items-center space-x-2.5">
                  <Palette className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Theme & Layout</span>}
                </div>
              </button>

              <button
                onClick={() => onNavigate('login-page')}
                className={navItemClass('login-page')}
                title="Login Page"
              >
                <div className="flex items-center space-x-2.5">
                  <LogIn className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Login Page</span>}
                </div>
              </button>

              <button
                onClick={() => onNavigate('security')}
                className={navItemClass('security')}
                title="Security"
              >
                <div className="flex items-center space-x-2.5">
                  <Lock className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Security</span>}
                </div>
              </button>

              <button
                onClick={() => onNavigate('licence')}
                className={navItemClass('licence')}
                title="Licence"
              >
                <div className="flex items-center space-x-2.5">
                  <Award className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Licence</span>}
                </div>
              </button>

              <button
                onClick={() => onNavigate('audit-logs')}
                className={navItemClass('audit-log')}
                title="Audit Logs Stream"
              >
                <div className="flex items-center space-x-2.5">
                  <History className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Audit Logs</span>}
                </div>
              </button>

              <button
                onClick={() => onNavigate('error-log')}
                className={navItemClass('error-log')}
                title="Error Log"
              >
                <div className="flex items-center space-x-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Error Log</span>}
                </div>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Collapse Bottom Footer */}
      <div className="p-2 border-t border-[#e2e8f0] bg-slate-50">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-md hover:bg-slate-200/70 text-slate-600 hover:text-slate-900 text-xs font-semibold transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronsRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronsLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
