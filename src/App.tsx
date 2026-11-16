import { applyInvoiceReceipt, invoiceReceipts } from './data/invoicePayments';
import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';

// Primary Core Modules
import { DashboardView } from './components/modules/DashboardView';
import { DailyMetalRatesView } from './components/modules/DailyMetalRatesView';
import { OrdersBillingView } from './components/modules/OrdersBillingView';
import { InventoryView } from './components/modules/InventoryView';
import { InventoryVerificationView } from './components/modules/InventoryVerificationView';
import { LoansView } from './components/modules/LoansView';
import { RepairsView } from './components/modules/RepairsView';
import { SavingsSchemesView } from './components/modules/SavingsSchemesView';
import { CashRegisterView } from './components/modules/CashRegisterView';
import { Customer360View } from './components/modules/Customer360View';
import { GSTReportsView } from './components/modules/GSTReportsView';
import { BackupSettingsView } from './components/modules/BackupSettingsView';

// Complete Sidebar Model Views
import { MetalAdvanceBookingView } from './components/modules/MetalAdvanceBookingView';
import { CancellationsView } from './components/modules/CancellationsView';
import { ReturnsBuybackView } from './components/modules/ReturnsBuybackView';
import { ShipmentsView } from './components/modules/ShipmentsView';
import { OldGoldPurchaseView } from './components/modules/OldGoldPurchaseView';
import { CashOutflowsView } from './components/modules/CashOutflowsView';
import { StockValuationView } from './components/modules/StockValuationView';
import { StockLedgerTagsView } from './components/modules/StockLedgerTagsView';
import { OldMetalStockView } from './components/modules/OldMetalStockView';
import { PaymentsPendingView } from './components/modules/PaymentsPendingView';
import { SuppliersPurchasingView } from './components/modules/SuppliersPurchasingView';
import { PurchaseOrdersView } from './components/modules/PurchaseOrdersView';
import { GoodsReceiptsView } from './components/modules/GoodsReceiptsView';
import { SupplierBillsView } from './components/modules/SupplierBillsView';
import { SupplierPaymentsView } from './components/modules/SupplierPaymentsView';
import { PurchaseReportsView } from './components/modules/PurchaseReportsView';
import { SalesReportsView } from './components/modules/SalesReportsView';
import { ReportsClassicView } from './components/modules/ReportsClassicView';
import { ShopSettingsUsersView } from './components/modules/ShopSettingsUsersView';
import { ShopSettingsView } from './components/modules/ShopSettingsView';
import { GirviLoansView } from './components/modules/GirviLoansView';
import { StoreProfileCountersView } from './components/modules/StoreProfileCountersView';
import { UsersSecurityView } from './components/modules/UsersSecurityView';
import { AuditLogsView } from './components/modules/AuditLogsView';
import { DataExportBackupView } from './components/modules/DataExportBackupView';
import { SyncDatabaseView } from './components/modules/SyncDatabaseView';
import { BusinessSettingsView } from './components/modules/BusinessSettingsView';
import { IntegrationsView } from './components/modules/IntegrationsView';
import { RolesPermissionsView } from './components/modules/RolesPermissionsView';
import { ThemeLayoutView } from './components/modules/ThemeLayoutView';
import { applyTheme, loadSavedTheme } from './utils/themeEngine';
import { LoginPageView } from './components/modules/LoginPageView';
import { SecurityView } from './components/modules/SecurityView';
import { LicenceView } from './components/modules/LicenceView';
import { AuditLogView } from './components/modules/AuditLogView';
import { ErrorLogView } from './components/modules/ErrorLogView';
import { DataImportView } from './components/modules/DataImportView';

import { 
  mockStore, mockDailyRates, mockCounters, mockCustomers, 
  mockInventory, mockInvoices, mockLoans, mockRepairs, mockSchemes, 
  mockCashRegister, mockMetalBookings, mockCancellations, mockCreditMemos, mockShipments,
  mockOldGoldPurchases, mockCashOutflows, mockOldMetalStock,
  mockSuppliers, mockPurchaseOrders, mockGoodsReceipts, mockSupplierBills,
  mockSupplierPayments, mockUsers
} from './data/mockData';
import { 
  Counter, DailyRates, InventoryItem, SalesInvoice, GirviLoan, 
  RepairOrder, SavingScheme, PaymentTransaction, PaymentMode, 
  DenominationCount, RepairStatus, MetalBooking, CancellationRecord, CreditMemoRecord,
  ShipmentRecord, OldGoldPurchase, CashOutflowRecord, OldMetalStockItem,
  Supplier, PurchaseOrder, GoodsReceipt, SupplierBill, SupplierPayment,
  UserAccount, StoreProfile
} from './types';
import { 
  Search, X, ArrowRight, ShoppingCart, Coins, Wrench, Package, 
  FileSpreadsheet, Users, CreditCard, CalendarClock, RotateCcw, 
  Truck, Flame, ArrowDownRight, BarChart3, Tag, CheckSquare, 
  Layers, Building2, ShoppingBag, Receipt, TrendingUp, Settings, 
  UserCheck, Database, LayoutDashboard, History, KeyRound, Palette, LogIn, Lock, Award, AlertCircle 
} from 'lucide-react';

export function App() {
  const [store, setStore] = useState<StoreProfile>(mockStore);
  const [rates, setRates] = useState<DailyRates>(mockDailyRates);
  const [counters, setCounters] = useState<Counter[]>(mockCounters);
  const [activeCounter, setActiveCounter] = useState<Counter>(mockCounters[0] || { id: "c1", code: "MAIN", name: "Main counter", isOpen: true });
  const [customers, setCustomers] = useState(mockCustomers);
  const [inventory, setInventory] = useState<InventoryItem[]>(mockInventory);
  const [invoices, setInvoices] = useState<SalesInvoice[]>(mockInvoices);
  const [loans, setLoans] = useState<GirviLoan[]>(mockLoans);
  const [repairs, setRepairs] = useState<RepairOrder[]>(mockRepairs);
  const [schemes, setSchemes] = useState<SavingScheme[]>(mockSchemes);
  const [cashRegister, setCashRegister] = useState(mockCashRegister);

  // Extended Sidebar Models State
  const [metalBookings, setMetalBookings] = useState<MetalBooking[]>(mockMetalBookings);
  const [cancellations, setCancellations] = useState<CancellationRecord[]>(mockCancellations);
  const [creditMemos, setCreditMemos] = useState<CreditMemoRecord[]>(mockCreditMemos);
  const [shipments, setShipments] = useState<ShipmentRecord[]>(mockShipments);
  const [oldGoldPurchases, setOldGoldPurchases] = useState<OldGoldPurchase[]>(mockOldGoldPurchases);
  const [cashOutflows, setCashOutflows] = useState<CashOutflowRecord[]>(mockCashOutflows);
  const [oldMetalStock, setOldMetalStock] = useState<OldMetalStockItem[]>(mockOldMetalStock);
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(mockPurchaseOrders);
  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceipt[]>(mockGoodsReceipts);
  const [supplierBills, setSupplierBills] = useState<SupplierBill[]>(mockSupplierBills);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>(mockSupplierPayments);
  const [users, setUsers] = useState<UserAccount[]>(mockUsers);

  const getModuleFromPath = (path: string): string => {
    switch (path) {
      case '/daily-rates': return 'daily-rates';
      case '/customers': return 'customers';
      case '/payments': return 'payments-pending';
      case '/orders': return 'billing';
      case '/bookings': return 'metal-booking';
      case '/cancellations': return 'cancellations';
      case '/register': return 'cash-register';
      case '/buyback':
      case '/buybacks': return 'returns-buyback';
      case '/shipments': return 'shipments';
      case '/repairs': return 'repairs';
      case '/loans': return 'loans';
      case '/old-gold':
      case '/old-metal': return 'old-metal';
      case '/schemes':
      case '/deposits': return 'schemes';
      case '/outflows':
      case '/cash-outflows': return 'cash-outflows';
      case '/inventory': return 'inventory';
      case '/stock': return 'valuation';
      case '/tags':
      case '/stock-ledger': return 'stock-ledger';
      case '/stock-verification': return 'inventory-verification';
      case '/metal-stock': return 'old-metal-stock';
      case '/suppliers': return 'suppliers';
      case '/purchase-orders': return 'purchase-orders';
      case '/goods-receipts': return 'goods-receipts';
      case '/supplier-bills': return 'supplier-bills';
      case '/supplier-payments': return 'supplier-payments';
      case '/purchase-reports': return 'purchase-reports';
      case '/sales-reports': return 'sales-reports';
      case '/gst-reports': return 'gst-reports';
      case '/reports': return 'reports-classic';
      case '/export':
      case '/data-export':
      case '/backup': return 'backup-settings';
      case '/sync': return 'sync';
      case '/import':
      case '/data-import': return 'import';
      case '/profile':
      case '/admin':
      case '/admin/profile':
      case '/admin/store': return 'profile';
      case '/users': return 'users';
      case '/audit-logs': return 'audit-logs';
      case '/settings': return 'settings';
      case '/admin/business': return 'business-settings';
      case '/admin/integrations': return 'integrations';
      case '/admin/users': return 'users';
      case '/admin/roles': return 'roles-permissions';
      case '/admin/theme': return 'theme-layout';
      case '/admin/login-page': return 'login-page';
      case '/admin/security': return 'security';
      case '/admin/license':
      case '/admin/licence': return 'licence';
      case '/admin/audit': return 'audit-logs';
      case '/admin/errors':
      case '/admin/error': return 'error-log';
      default: return 'dashboard';
    }
  };

  const getPathFromModule = (mod: string): string => {
    switch (mod) {
      case 'daily-rates': return '/daily-rates';
      case 'customers': return '/customers';
      case 'payments-pending': return '/payments';
      case 'billing': return '/orders';
      case 'metal-booking': return '/bookings';
      case 'cancellations': return '/cancellations';
      case 'cash-register': return '/register';
      case 'buyback':
      case 'returns-buyback': return '/buybacks';
      case 'shipments': return '/shipments';
      case 'repairs': return '/repairs';
      case 'loans': return '/loans';
      case 'old-gold':
      case 'old-metal': return '/old-gold';
      case 'schemes':
      case 'savings-schemes': return '/deposits';
      case 'outflows':
      case 'cash-outflows': return '/outflows';
      case 'inventory': return '/inventory';
      case 'valuation':
      case 'stock-valuation': return '/stock';
      case 'tags':
      case 'stock-ledger': return '/stock-ledger';
      case 'inventory-verification': return '/stock-verification';
      case 'old-metal-stock': return '/metal-stock';
      case 'suppliers': return '/suppliers';
      case 'purchase-orders': return '/purchase-orders';
      case 'goods-receipts': return '/goods-receipts';
      case 'supplier-bills': return '/supplier-bills';
      case 'supplier-payments': return '/supplier-payments';
      case 'purchase-reports': return '/purchase-reports';
      case 'sales-reports': return '/sales-reports';
      case 'gst-reports': return '/gst-reports';
      case 'reports-classic': return '/reports';
      case 'backup':
      case 'backup-settings': return '/export';
      case 'sync': return '/sync';
      case 'import': return '/data-import';
      case 'profile': return '/profile';
      case 'settings':
      case 'shop-settings':
      case 'settings-shop': return '/settings';
      case 'users': return '/admin/users';
      case 'business-settings':
      case 'settings-business': return '/admin/business';
      case 'integrations':
      case 'settings-integrations': return '/admin/integrations';
      case 'roles-permissions':
      case 'settings-roles': return '/admin/roles';
      case 'theme-layout':
      case 'settings-theme': return '/admin/theme';
      case 'login-page':
      case 'settings-login': return '/admin/login-page';
      case 'security':
      case 'settings-security': return '/admin/security';
      case 'licence':
      case 'settings-licence': return '/admin/license';
      case 'audit-logs':
      case 'audit-log':
      case 'settings-audit': return '/admin/audit';
      case 'error-log':
      case 'settings-error': return '/admin/errors';
      default: return '/';
    }
  };

  const [currentModule, setCurrentModule] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return getModuleFromPath(window.location.pathname);
    }
    return 'dashboard';
  });

  const navigateTo = (mod: string) => {
    setCurrentModule(mod);
    const path = getPathFromModule(mod);
    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
  };

  // Initialize and apply theme with live persistence
  useEffect(() => {
    applyTheme(loadSavedTheme(), { persist: false });
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setCurrentModule(getModuleFromPath(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Fetch initial live state from PostgreSQL backend API
  useEffect(() => {
    async function loadLiveData() {
      try {
        const [settingsRes, ratesRes, custRes, invRes, ordersRes] = await Promise.allSettled([
          fetch('/api/v1/settings').then(r => r.ok ? r.json() : null),
          fetch('/api/v1/daily-rates').then(r => r.ok ? r.json() : null),
          fetch('/api/v1/customers').then(r => r.ok ? r.json() : null),
          fetch('/api/v1/inventory/items').then(r => r.ok ? r.json() : null),
          fetch('/api/v1/sales/orders').then(r => r.ok ? r.json() : null)
        ]);

        if (settingsRes.status === 'fulfilled' && settingsRes.value?.data?.shop_name) {
          const s = settingsRes.value.data;
          setStore(prev => ({
            ...prev,
            tradeName: s.shop_name || prev.tradeName,
            legalName: s.owner_name || prev.legalName,
            name: s.shop_name || prev.name,
            shopName: s.shop_name || prev.shopName,
            address: s.address || prev.address,
            phone: s.phone || prev.phone,
            gstin: s.gst_no || prev.gstin,
            gstNo: s.gst_no || prev.gstNo
          }));
        }

        if (ratesRes.status === 'fulfilled' && ratesRes.value?.data) {
          const r = ratesRes.value.data;
          const g24_10g = Number(r.gold_24k) || 150000;
          const g22_10g = Number(r.gold_22k) || 137400;
          const g18_10g = Number(r.gold_18k) || 112500;
          const g14_10g = Number(r.gold_14k) || 87750;
          const silv_10g = Number(r.silver || r.silver_fine) || 920;

          setRates(prev => ({
            ...prev,
            gold24kPer10g: g24_10g,
            gold24kPerGram: Math.round(g24_10g / 10),
            gold22kPer10g: g22_10g,
            gold22kPerGram: Math.round(g22_10g / 10),
            gold18kPer10g: g18_10g,
            gold18kPerGram: Math.round(g18_10g / 10),
            gold14kPerGram: Math.round(g14_10g / 10),
            silverPer10g: silv_10g,
            silverPerGram: Math.round(silv_10g / 10)
          }));
        }
      } catch (err) {
        console.warn('API sync fallback to mock data:', err);
      }
    }
    loadLiveData();
  }, []);
  const [showOmnibar, setShowOmnibar] = useState<boolean>(false);
  const [omnibarQuery, setOmnibarQuery] = useState<string>('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('kj_sb_collapsed') === '1';
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('kj_sb_collapsed', sidebarCollapsed ? '1' : '0');
    } catch {}
  }, [sidebarCollapsed]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Global Keyboard Shortcuts (F1, F2, F9, Cmd+K, Ctrl+M)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowOmnibar(prev => !prev);
      }
      if (e.key === 'Escape') {
        setShowOmnibar(false);
        setMobileOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'm' || e.key === 'M') && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        setSidebarCollapsed(prev => !prev);
      }
      if (e.key === 'F1') {
        e.preventDefault();
        navigateTo('billing');
      }
      if (e.key === 'F2') {
        e.preventDefault();
        navigateTo('inventory');
      }
      if (e.key === 'F3') {
        e.preventDefault();
        navigateTo('daily-rates');
      }
      if (e.key === 'F4') {
        e.preventDefault();
        navigateTo('cash-register');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers for state updates
  const handleSaveInvoice = (invoice: SalesInvoice) => {
    // Persist to PostgreSQL API
    fetch('/api/v1/sales/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice)
    }).catch(err => console.warn('Offline order sync:', err));

    const previous = invoices.find(existing => existing.id === invoice.id);
    setInvoices(current => previous
      ? current.map(existing => existing.id === invoice.id ? invoice : existing)
      : [invoice, ...current]);

    const itemCount = (source: SalesInvoice | undefined, stock: InventoryItem) =>
      source?.items.filter(item => item.itemId ? item.itemId === stock.id : item.itemCode === stock.itemCode).length ?? 0;
    setInventory(current => current.map(stock => {
      const delta = itemCount(previous, stock) - itemCount(invoice, stock);
      return delta ? { ...stock, stockQty: Math.max(0, stock.stockQty + delta) } : stock;
    }));

    const cash = (source?: SalesInvoice) => source ? invoiceReceipts(source)
      .filter(receipt => receipt.mode.toUpperCase() === 'CASH')
      .reduce((total, receipt) => total + receipt.amount, 0) : 0;
    const cashDelta = cash(invoice) - cash(previous);
    if (cashDelta) {
      setCashRegister(current => ({
        ...current,
        cashInflows: current.cashInflows + cashDelta,
        closingBalanceCalculated: (current.closingBalanceCalculated ?? current.expectedCash) + cashDelta,
        expectedCash: current.expectedCash + cashDelta
      }));
    }
  };

  const handleCancelInvoice = (invoice: SalesInvoice, cancellation: CancellationRecord, memo: CreditMemoRecord | undefined, restock: boolean) => {
    const original = invoices.find(existing => existing.id === invoice.id);
    if (!original || original.status === 'CANCELLED' || original.status === 'ESTIMATE') return;
    setInvoices(current => current.map(existing => existing.id === invoice.id ? invoice : existing));
    setCancellations(current => [cancellation, ...current]);
    if (memo) setCreditMemos(current => [memo, ...current]);
    if (restock) {
      const retained = new Set(invoice.status === 'CANCELLED' ? [] : invoice.items.map(item => item.id));
      const removed = original.items.filter(item => !retained.has(item.id));
      setInventory(current => current.map(stock => {
        const count = removed.filter(item => item.itemId ? item.itemId === stock.id : item.itemCode === stock.itemCode).length;
        return count ? { ...stock, stockQty: stock.stockQty + count } : stock;
      }));
    }
  };

  const handleAddPayment = (invoiceId: string, payment: PaymentTransaction) => {
    setInvoices(current => current.map(invoice =>
      invoice.id === invoiceId ? applyInvoiceReceipt(invoice, payment) ?? invoice : invoice
    ));
  };

  const handleAddItem = (item: InventoryItem) => {
    // Persist to PostgreSQL API
    fetch('/api/v1/inventory/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    }).catch(err => console.warn('Offline item sync:', err));

    setInventory([item, ...inventory]);
  };

  const handleUpdateStock = (itemId: string, qtyDelta: number, reason: string) => {
    setInventory(inventory.map(item => {
      if (item.id === itemId) {
        return { ...item, stockQty: Math.max(0, item.stockQty + qtyDelta) };
      }
      return item;
    }));
  };

  const handleSaveLoan = (loan: GirviLoan) => {
    setLoans(prevLoans => {
      const idx = prevLoans.findIndex(l => l.id === loan.id || l.loanNo === loan.loanNo);
      if (idx >= 0) {
        const copy = [...prevLoans];
        copy[idx] = loan;
        return copy;
      }
      return [loan, ...prevLoans];
    });
  };

  const handleSaveRepair = (repair: RepairOrder) => {
    setRepairs([repair, ...repairs]);
  };

  const handleUpdateRepairStatus = (repairId: string, status: RepairStatus, payment?: PaymentTransaction) => {
    setRepairs(current => current.map(rep => {
      if (rep.id === repairId) {
        if (!payment) return { ...rep, status };
        if (rep.payments.some(receipt => receipt.id === payment.id) || payment.amount > rep.balanceDue) return rep;
        const newAdvance = Math.round((rep.advancePaid + payment.amount) * 100) / 100;
        const newBalance = Math.max(0, Math.round((rep.balanceDue - payment.amount) * 100) / 100);
        return { ...rep, status, advancePaid: newAdvance, balanceDue: newBalance, payments: [...rep.payments, payment] };
      }
      return rep;
    }));
  };

  const handleSaveScheme = (scheme: SavingScheme) => {
    setSchemes(prevSchemes => {
      const idx = prevSchemes.findIndex(s => s.id === scheme.id || s.schemeNo === scheme.schemeNo);
      if (idx >= 0) {
        const copy = [...prevSchemes];
        copy[idx] = scheme;
        return copy;
      }
      return [scheme, ...prevSchemes];
    });
  };

  const handlePaySchemeInstallment = (schemeId: string, amount: number) => {
    setSchemes(schemes.map(sch => {
      if (sch.id === schemeId) {
        const newInstallmentsPaid = (sch.installmentsPaid ?? (sch.installments?.length || 0)) + 1;
        const newTotalPaid = (sch.totalAmountPaid ?? sch.totalPaid ?? 0) + amount;
        return {
          ...sch,
          installmentsPaid: newInstallmentsPaid,
          totalAmountPaid: newTotalPaid,
          totalPaid: newTotalPaid,
          status: newInstallmentsPaid >= sch.totalMonths ? 'MATURED' : 'ACTIVE'
        };
      }
      return sch;
    }));
  };

  const handleCloseRegister = (denominations: DenominationCount, discrepancy: number, notes: string) => {
    setCashRegister(prev => ({
      ...prev,
      isOpen: false,
      denominations,
      actualCashCounted: prev.expectedCash + discrepancy,
      cashDiscrepancy: discrepancy,
      status: 'CLOSED',
      closingNotes: notes,
      closedAt: new Date().toISOString()
    }));
  };

  const handleAddManualCashFlow = (type: 'IN' | 'OUT', amount: number, category: string, notes: string) => {
    const delta = type === 'IN' ? amount : -amount;
    setCashRegister(prev => ({
      ...prev,
      closingBalanceCalculated: (prev.closingBalanceCalculated || prev.expectedCash) + delta,
      expectedCash: prev.expectedCash + delta
    }));
    const newOutflow: CashOutflowRecord = {
      id: `out-${Date.now()}`,
      voucherNo: `VOUCH-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: '2026-11-12',
      amount,
      category,
      paidTo: 'Staff / Vendor',
      paymentMode: 'CASH',
      approvedBy: 'Admin',
      notes
    };
    setCashOutflows([newOutflow, ...cashOutflows]);
  };

  const handleCreateBooking = (booking: MetalBooking) => {
    setMetalBookings(current => current.some(existing => existing.id === booking.id) ? current : [booking, ...current]);
  };

  const handleRecordOldGoldPurchase = (purchase: OldGoldPurchase) => {
    setOldGoldPurchases(prevPurchases => {
      const idx = prevPurchases.findIndex(p => p.id === purchase.id || p.purchaseVoucherNo === purchase.purchaseVoucherNo);
      if (idx >= 0) {
        const copy = [...prevPurchases];
        copy[idx] = purchase;
        return copy;
      }
      return [purchase, ...prevPurchases];
    });
  };

  const handleSaveCashOutflow = (outflow: CashOutflowRecord) => {
    setCashOutflows(prev => [outflow, ...prev]);
  };

  return (
    <div className={`layout${sidebarCollapsed ? ' sb-collapsed' : ''}`}>
      <a className="skip-link" href="#main">Skip to content</a>
      <div 
        className={`sidebar-overlay${mobileOpen ? ' visible' : ''}`}
        onClick={() => setMobileOpen(false)}
      />
      {/* Left Application Sidebar */}
      <Sidebar
        currentModule={currentModule}
        onNavigate={(mod) => {
          setMobileOpen(false);
          navigateTo(mod);
        }}
        store={store}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        openLoansCount={loans.filter(l => l.status === 'ACTIVE').length}
        openRepairsCount={repairs.filter(r => r.status !== 'delivered').length}
        activeSchemesCount={schemes.filter(s => s.status === 'ACTIVE').length}
        pendingReceivablesCount={invoices.filter(i => i.balanceDue > 0).length}
      />

      {/* Main Dynamic Module Workspace */}
      <main className="main" id="main" tabIndex={-1}>
        <Header
          store={store}
          rates={rates}
          counters={counters}
          activeCounter={activeCounter}
          onSelectCounter={setActiveCounter}
          onOpenOmnibar={() => setShowOmnibar(true)}
          onNavigate={navigateTo}
          currentModule={currentModule}
          mobileOpen={mobileOpen}
          onToggleMobile={() => setMobileOpen(prev => !prev)}
        />

        <div className={`flex-1 ${currentModule === 'dashboard' ? '' : 'p-4 md:py-6 md:px-7'}`}>
          
          {/* 1. MAIN */}
          {currentModule === 'dashboard' && (
            <DashboardView
              store={store}
              rates={rates}
              invoices={invoices}
              loans={loans}
              repairs={repairs}
              inventory={inventory}
              customers={customers}
              bookings={metalBookings}
              onNavigate={navigateTo}
            />
          )}

          {currentModule === 'daily-rates' && (
            <DailyMetalRatesView
              store={store}
              rates={rates}
              onUpdateRates={setRates}
            />
          )}

          {/* 2. CUSTOMERS */}
          {currentModule === 'customers' && (
            <Customer360View
              store={store}
              customers={customers}
              invoices={invoices}
              loans={loans}
              repairs={repairs}
              onUpdateCustomers={setCustomers}
            />
          )}

          {currentModule === 'payments-pending' && (
            <PaymentsPendingView
              customers={customers}
              invoices={invoices}
              onRecordPayment={handleAddPayment}
            />
          )}

          {/* 3. SALES */}
          {currentModule === 'billing' && (
            <OrdersBillingView
              store={store}
              rates={rates}
              customers={customers}
              inventory={inventory}
              invoices={invoices}
              onSaveInvoice={handleSaveInvoice}
              cancellations={cancellations}
              onCancelInvoice={handleCancelInvoice}
              onAddPayment={handleAddPayment}
            />
          )}

          {currentModule === 'metal-booking' && (
            <MetalAdvanceBookingView
              store={store}
              rates={rates}
              customers={customers}
              bookings={metalBookings}
              onSaveBooking={handleCreateBooking}
            />
          )}

          {currentModule === 'cancellations' && (
            <CancellationsView
              store={store}
              cancellations={cancellations}
              creditMemos={creditMemos}
              onIssueRefund={memo => setCreditMemos(current => current.map(existing =>
                existing.id === memo.id && existing.refundStatus === 'pending' ? memo : existing
              ))}
            />
          )}

          {currentModule === 'cash-register' && (
            <CashRegisterView
              store={store}
              activeCounter={activeCounter}
              counters={counters}
              session={cashRegister}
              onSelectCounter={setActiveCounter}
              onCloseRegister={handleCloseRegister}
              onAddManualCashFlow={handleAddManualCashFlow}
            />
          )}

          {(currentModule === 'buyback' || currentModule === 'returns-buyback') && (
            <ReturnsBuybackView
              store={store}
              invoices={invoices}
              customers={customers}
            />
          )}

          {currentModule === 'shipments' && (
            <ShipmentsView
              store={store}
              shipments={shipments}
              invoices={invoices}
            />
          )}

          {/* 4. SERVICES */}
          {currentModule === 'repairs' && (
            <RepairsView
              store={store}
              repairs={repairs}
              customers={customers}
              onSaveRepair={handleSaveRepair}
              onUpdateRepairStatus={handleUpdateRepairStatus}
            />
          )}

          {/* 5. FINANCE */}
          {currentModule === 'loans' && (
            <LoansView
              store={store}
              loans={loans}
              customers={customers}
              onSaveLoan={handleSaveLoan}
            />
          )}

          {(currentModule === 'old-metal' || currentModule === 'old-gold') && (
            <OldGoldPurchaseView
              store={store}
              rates={rates}
              purchases={oldGoldPurchases}
              customers={customers}
              onSavePurchase={handleRecordOldGoldPurchase}
            />
          )}

          {currentModule === 'schemes' && (
            <SavingsSchemesView
              store={store}
              schemes={schemes}
              customers={customers}
              onSaveScheme={handleSaveScheme}
              onPayInstallment={handlePaySchemeInstallment}
            />
          )}

          {currentModule === 'cash-outflows' && (
            <CashOutflowsView
              store={store}
              outflows={cashOutflows}
              onSaveOutflow={handleSaveCashOutflow}
            />
          )}

          {/* 6. STOCK */}
          {currentModule === 'inventory' && (
            <InventoryView
              store={store}
              inventory={inventory}
              rates={rates}
              onAddItem={handleAddItem}
              onUpdateStock={handleUpdateStock}
            />
          )}

          {currentModule === 'valuation' && (
            <StockValuationView
              store={store}
              rates={rates}
              inventory={inventory}
            />
          )}

          {(currentModule === 'tags' || currentModule === 'stock-ledger') && (
            <StockLedgerTagsView
              store={store}
              inventory={inventory}
            />
          )}

          {currentModule === 'inventory-verification' && (
            <InventoryVerificationView
              store={store}
              inventory={inventory}
            />
          )}

          {currentModule === 'old-metal-stock' && (
            <OldMetalStockView
              store={store}
              stock={oldMetalStock}
            />
          )}

          {/* 7. SUPPLIERS & PURCHASING */}
          {currentModule === 'suppliers' && (
            <SuppliersPurchasingView
              initialTab="suppliers"
              suppliers={suppliers}
              purchaseOrders={purchaseOrders}
              goodsReceipts={goodsReceipts}
              supplierBills={supplierBills}
              supplierPayments={supplierPayments}
              onAddSupplier={(sup) => setSuppliers([sup, ...suppliers])}
              onRecordSupplierPayment={(spay) => setSupplierPayments([spay, ...supplierPayments])}
            />
          )}

          {currentModule === 'purchase-orders' && (
            <PurchaseOrdersView
              suppliers={suppliers}
              purchaseOrders={purchaseOrders}
              goodsReceipts={goodsReceipts}
              supplierBills={supplierBills}
              supplierPayments={supplierPayments}
              onAddPO={(po) => setPurchaseOrders([po, ...purchaseOrders])}
              onUpdatePO={(po) => setPurchaseOrders(purchaseOrders.map(p => p.id === po.id ? po : p))}
              onAddGRN={(grn) => setGoodsReceipts([grn, ...goodsReceipts])}
              onNavigate={(tab) => navigateTo(tab)}
            />
          )}

          {currentModule === 'goods-receipts' && (
            <GoodsReceiptsView
              suppliers={suppliers}
              purchaseOrders={purchaseOrders}
              goodsReceipts={goodsReceipts}
              supplierBills={supplierBills}
              onAddGRN={(grn) => setGoodsReceipts([grn, ...goodsReceipts])}
              onAddBill={(bill) => setSupplierBills([bill, ...supplierBills])}
              onNavigate={(tab) => navigateTo(tab)}
            />
          )}

          {currentModule === 'supplier-bills' && (
            <SupplierBillsView
              suppliers={suppliers}
              purchaseOrders={purchaseOrders}
              goodsReceipts={goodsReceipts}
              supplierBills={supplierBills}
              supplierPayments={supplierPayments}
              onAddBill={(bill) => setSupplierBills([bill, ...supplierBills])}
              onUpdateBill={(bill) => setSupplierBills(supplierBills.map(b => b.id === bill.id ? bill : b))}
              onRecordPayment={(spay) => setSupplierPayments([spay, ...supplierPayments])}
              onNavigate={(tab) => navigateTo(tab)}
            />
          )}

          {currentModule === 'supplier-payments' && (
            <SupplierPaymentsView
              suppliers={suppliers}
              supplierBills={supplierBills}
              supplierPayments={supplierPayments}
              onRecordSupplierPayment={(spay) => setSupplierPayments([spay, ...supplierPayments])}
              onNavigate={(tab) => navigateTo(tab)}
            />
          )}

          {currentModule === 'purchase-reports' && (
            <PurchaseReportsView
              suppliers={suppliers}
              bills={supplierBills}
              purchaseOrders={purchaseOrders}
            />
          )}

          {/* 8. REPORTS */}
          {currentModule === 'sales-reports' && (
            <SalesReportsView
              store={store}
              invoices={invoices}
              repairs={repairs}
              loans={loans}
              bookings={metalBookings}
              creditMemos={creditMemos}
              onNavigate={navigateTo}
            />
          )}

          {currentModule === 'gst-reports' && (
            <GSTReportsView
              store={store}
              invoices={invoices}
              onNavigate={navigateTo}
            />
          )}

          {currentModule === 'reports-classic' && (
            <ReportsClassicView
              store={store}
              invoices={invoices}
              customers={customers}
              inventory={inventory}
              onNavigate={navigateTo}
            />
          )}

          {currentModule === 'backup-settings' && (
            <DataExportBackupView store={store} customers={customers} inventory={inventory} invoices={invoices}
              loans={loans} repairs={repairs} schemes={schemes} />
          )}

          {currentModule === 'sync' && (
            <SyncDatabaseView
              store={store}
              customers={customers}
              inventory={inventory}
              invoices={invoices}
              loans={loans}
              repairs={repairs}
              schemes={schemes}
              defaultTab="sync"
              onNavigate={navigateTo}
            />
          )}

          {currentModule === 'import' && (
            <DataImportView
              customers={customers}
              inventory={inventory}
              onNavigate={navigateTo}
              onImportCustomers={(imported) => {
                setCustomers(prev => {
                  const map = new Map(prev.map(c => [c.id, c]));
                  imported.forEach(c => map.set(c.id, c));
                  return Array.from(map.values());
                });
              }}
              onImportInventory={(imported: InventoryItem[]) => {
                setInventory(prev => {
                  const map = new Map(prev.map(i => [i.id, i]));
                  imported.forEach(i => map.set(i.id, i));
                  return Array.from(map.values());
                });
              }}
            />
          )}

          {/* 9. ADMIN & SETTINGS */}
          {currentModule === 'settings' && (
            <ShopSettingsView
              store={store}
              users={users}
              onUpdateStore={setStore}
              onAddUser={(u) => setUsers([...users, u])}
              onUpdateUser={(u) => setUsers(users.map(usr => usr.id === u.id ? u : usr))}
              onNavigate={navigateTo}
            />
          )}

          {(currentModule === 'profile' || currentModule === 'shop-settings' || currentModule === 'settings-shop') && (
            <StoreProfileCountersView
              store={store}
              counters={counters}
              users={users}
              onUpdateStore={setStore}
              onNavigate={navigateTo}
            />
          )}

          {(currentModule === 'business-settings' || currentModule === 'settings-business') && (
            <BusinessSettingsView
              store={store}
              onUpdateStore={setStore}
              onNavigate={navigateTo}
            />
          )}

          {(currentModule === 'integrations' || currentModule === 'settings-integrations') && (
            <IntegrationsView onNavigate={navigateTo} />
          )}

          {currentModule === 'users' && (
            <UsersSecurityView
              store={store}
              users={users}
              onNavigate={navigateTo}
              onAddUser={(u) => setUsers([...users, u])}
              onUpdateUser={(u) => setUsers(users.map(usr => usr.id === u.id ? u : usr))}
            />
          )}

          {(currentModule === 'roles-permissions' || currentModule === 'settings-roles') && (
            <RolesPermissionsView onNavigate={navigateTo} />
          )}

          {(currentModule === 'theme-layout' || currentModule === 'settings-theme') && (
            <ThemeLayoutView />
          )}

          {(currentModule === 'login-page' || currentModule === 'settings-login') && (
            <LoginPageView store={store} />
          )}

          {(currentModule === 'security' || currentModule === 'settings-security') && (
            <SecurityView onNavigate={navigateTo} />
          )}

          {(currentModule === 'licence' || currentModule === 'settings-licence') && (
            <LicenceView store={store} />
          )}

          {(currentModule === 'audit-log' || currentModule === 'audit-logs' || currentModule === 'settings-audit') && (
            <AuditLogsView
              store={store}
              onNavigate={navigateTo}
            />
          )}

          {(currentModule === 'error-log' || currentModule === 'settings-error') && (
            <ErrorLogView onNavigate={navigateTo} />
          )}

        </div>
      </main>

      {/* OMNIBAR SEARCH MODAL (Cmd+K) */}
      {showOmnibar && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="p-3 border-b border-slate-200 flex items-center space-x-2 bg-slate-50">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={omnibarQuery}
                onChange={(e) => setOmnibarQuery(e.target.value)}
                placeholder="Find a screen, customer, invoice or barcode..."
                className="w-full bg-transparent text-xs font-medium focus:outline-hidden"
              />
              <button onClick={() => setShowOmnibar(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2 space-y-0.5 text-xs max-h-96 overflow-y-auto">
              {[
                { label: 'Dashboard Overview', mod: 'dashboard', icon: LayoutDashboard },
                { label: 'Daily Metal Rates (Today Bullion Rates)', mod: 'daily-rates', icon: TrendingUp },
                { label: 'Orders & Billing (POS Sales & Invoices)', mod: 'billing', icon: ShoppingCart },
                { label: 'Advance Metal Booking', mod: 'metal-booking', icon: CalendarClock },
                { label: 'Cancellations & Refunds', mod: 'cancellations', icon: RotateCcw },
                { label: 'Cash Register Day Close', mod: 'cash-register', icon: Coins },
                { label: 'Returns & Buy-back Exchange', mod: 'returns-buyback', icon: RotateCcw },
                { label: 'Shipments & Dispatch Tracking', mod: 'shipments', icon: Truck },
                { label: 'Customers Directory', mod: 'customers', icon: Users },
                { label: 'Payments & Pending Balances', mod: 'payments-pending', icon: CreditCard },
                { label: 'Jewellery Repair Orders', mod: 'repairs', icon: Wrench },
                { label: 'Gold & Silver Loans (Girvi)', mod: 'loans', icon: Coins },
                { label: 'Old Gold/Silver Purchase', mod: 'old-metal', icon: Flame },
                { label: 'Savings Schemes (11+1 Chits)', mod: 'schemes', icon: Coins },
                { label: 'Cash Outflows & Petty Vouchers', mod: 'cash-outflows', icon: ArrowDownRight },
                { label: 'Inventory Stock Catalog', mod: 'inventory', icon: Package },
                { label: 'Stock & Valuation Reports', mod: 'valuation', icon: BarChart3 },
                { label: 'Stock Ledger & Barcode Tags', mod: 'stock-ledger', icon: Tag },
                { label: 'Inventory Verification (Stock Audit)', mod: 'inventory-verification', icon: CheckSquare },
                { label: 'Old Metal Vault Stock', mod: 'old-metal-stock', icon: Layers },
                { label: 'Suppliers Directory', mod: 'suppliers', icon: Building2 },
                { label: 'Purchase Orders (PO)', mod: 'purchase-orders', icon: ShoppingBag },
                { label: 'Goods Receipts (GRN)', mod: 'goods-receipts', icon: Truck },
                { label: 'Supplier Bills (Inward)', mod: 'supplier-bills', icon: Receipt },
                { label: 'Supplier Payments', mod: 'supplier-payments', icon: CreditCard },
                { label: 'Purchase Reports (11 Registers)', mod: 'purchase-reports', icon: FileSpreadsheet },
                { label: 'Sales Reports & Day-Book', mod: 'sales-reports', icon: BarChart3 },
                { label: 'GST Reports (GSTR-1, 3% Statutory)', mod: 'gst-reports', icon: FileSpreadsheet },
                { label: 'Reports (classic double-entry ledgers)', mod: 'reports-classic', icon: History },
                { label: 'Export / Backup (Full CSV download)', mod: 'backup-settings', icon: Database },
                { label: 'Sync & Database Infrastructure (IndexedDB, Cloud)', mod: 'sync', icon: Database },
                { label: 'Shop Settings & Counters (/profile)', mod: 'profile', icon: Settings },
                { label: 'Business Settings & Legal Terms', mod: 'business-settings', icon: Building2 },
                { label: 'Integrations & Hardware Scale/Printer', mod: 'integrations', icon: TrendingUp },
                { label: 'Users & Security RBAC (/users)', mod: 'users', icon: UserCheck },
                { label: 'Roles & Permissions (RBAC Matrix)', mod: 'roles-permissions', icon: KeyRound },
                { label: 'Theme & Layout Density', mod: 'theme-layout', icon: Palette },
                { label: 'Login Page & Wallpaper Branding', mod: 'login-page', icon: LogIn },
                { label: 'Security & Two-Factor OTP', mod: 'security', icon: Lock },
                { label: 'Licence Credentials & Support', mod: 'licence', icon: Award },
                { label: 'Audit Logs & Governance Stream (/audit-logs)', mod: 'audit-logs', icon: History },
                { label: 'Error Log (Diagnostics telemetry)', mod: 'error-log', icon: AlertCircle }
              ].filter(item => item.label.toLowerCase().includes(omnibarQuery.toLowerCase())).map((item) => (
                <button
                  key={item.mod}
                  onClick={() => {
                    setCurrentModule(item.mod);
                    setShowOmnibar(false);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-md hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors text-left"
                >
                  <div className="flex items-center space-x-2">
                    <item.icon className="w-4 h-4 text-emerald-700" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

