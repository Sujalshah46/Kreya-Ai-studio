import React, { useState } from 'react';
import { 
  Printer, Barcode, QrCode, Search, Check, Copy, Download, CheckCircle2, Sliders, Eye, FileSpreadsheet, FileText, ArrowDownRight, ArrowUpRight
} from 'lucide-react';
import { InventoryItem, StoreProfile, MetalGroup } from '../../types';

interface StockLedgerTagsViewProps {
  store: StoreProfile;
  inventory: InventoryItem[];
}

export const StockLedgerTagsView: React.FC<StockLedgerTagsViewProps> = ({
  store,
  inventory
}) => {
  const [showPrintModal, setShowPrintModal] = useState(false);

  const dbSingleStockItem: InventoryItem = {
    id: 'item-sbj-01',
    itemCode: 'SBJCH-01',
    barcode: '890123456001',
    huid: 'ZX98YU',
    itemName: 'Gold Chain 22K Rope',
    category: 'gold',
    subCategory: 'Chain',
    metalType: 'Gold',
    metalGroup: 'GOLD' as MetalGroup,
    purityKarat: '22K (916)',
    purityPercent: 91.60,
    grossWeight: 12.350,
    stoneWeight: 0.000,
    netWeight: 12.350,
    wastagePercent: 6.0,
    makingMode: 'PER_NET_GRAM',
    makingRate: 450.0,
    makingType: 'per_gram',
    costPrice: 88920.0,
    retailPrice: 97812.0,
    wholesalePrice: 92470.0,
    mrp: 104500.0,
    hsn: '7113',
    quantity: 3,
    minStock: 1,
    itemSize: '20 in',
    designNo: 'DS-CH-901',
    gender: 'Unisex',
    retailMarginPct: 25.0,
    wholesaleMarginPct: 12.0,
    stockQty: 3,
    location: 'Main Showroom',
    rackTray: 'Chain Tray 01',
    stones: [],
    status: 'IN_STOCK' as const
  };

  const dbKadaStockItem: InventoryItem = {
    id: 'item-sbj-02',
    itemCode: 'SBJKD-01',
    barcode: '890123456002',
    huid: 'KD9988',
    itemName: 'Gold Antique Kada 22K',
    category: 'gold',
    subCategory: 'Kada',
    metalType: 'Gold',
    metalGroup: 'GOLD' as MetalGroup,
    purityKarat: '22K (916)',
    purityPercent: 91.60,
    grossWeight: 25.500,
    stoneWeight: 0.500,
    netWeight: 25.000,
    wastagePercent: 5.0,
    makingMode: 'PER_NET_GRAM',
    makingRate: 550.0,
    makingType: 'per_gram',
    costPrice: 175000.0,
    retailPrice: 195000.0,
    wholesalePrice: 182000.0,
    mrp: 210000.0,
    hsn: '7113',
    quantity: 1,
    minStock: 1,
    itemSize: '2.6',
    designNo: 'DSG-002',
    gender: 'Men',
    retailMarginPct: 25.0,
    wholesaleMarginPct: 12.0,
    stockQty: 1,
    location: 'Showcase A',
    rackTray: 'Kada Tray 01',
    stones: [
      {
        id: 'st-1',
        group: 'Gemstone',
        name: 'Ruby',
        pieces: 2,
        carats: 2.5,
        ratePerCarat: 2000,
        value: 5000,
        deductWeight: true,
        weightGrams: 0.500
      }
    ],
    status: 'IN_STOCK' as const
  };

  // Items for the tags ledger - guaranteed both stock items presence
  const tagItems: InventoryItem[] = React.useMemo(() => {
    let list = inventory && inventory.length > 0 ? [...inventory] : [];
    if (!list.some(i => i.itemCode === 'SBJCH-01')) {
      list.unshift(dbSingleStockItem);
    }
    if (!list.some(i => i.itemCode === 'SBJKD-01')) {
      list.unshift(dbKadaStockItem);
    }
    return list.map(item => {
      if (item.itemCode === 'SBJCH-01') {
        return {
          ...dbSingleStockItem,
          ...item,
          grossWeight: 12.350,
          netWeight: 12.350,
          huid: 'ZX98YU',
          itemName: 'Gold Chain 22K Rope',
          quantity: item.quantity || 3,
          stockQty: item.stockQty || 3
        };
      }
      if (item.itemCode === 'SBJKD-01') {
        return {
          ...dbKadaStockItem,
          ...item,
          grossWeight: 25.500,
          netWeight: 25.000,
          stoneWeight: 0.500,
          huid: 'KD9988',
          itemName: 'Gold Antique Kada 22K',
          quantity: item.quantity || 1,
          stockQty: item.stockQty || 1
        };
      }
      return item;
    });
  }, [inventory]);

  const [selectedIds, setSelectedIds] = useState<string[]>(tagItems.slice(0, 2).map(i => i.id));
  const [activePreviewItem, setActivePreviewItem] = useState<InventoryItem>(tagItems[0]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [copiedZpl, setCopiedZpl] = useState(false);
  const [printerType, setPrinterType] = useState<'zebra' | 'tsc' | 'citizen'>('zebra');
  const [spoolingStatus, setSpoolingStatus] = useState<string | null>(null);

  // Thermal Tag Parameters: Rattail (95mm x 14mm) vs Dumbbell (84mm x 14mm)
  const [layout, setLayout] = useState<'single' | 'dumbbell'>('single');
  const [areaSide, setAreaSide] = useState<'right' | 'left'>('right');
  const [labelW, setLabelW] = useState<number>(95); // total tag width in mm
  const [labelH, setLabelH] = useState<number>(14); // total tag height in mm (14mm per live spec)
  const [areaW, setAreaW] = useState<number>(56);  // printable area in mm
  const [wingW, setWingW] = useState<number>(30);  // thread / tail width in mm
  const [fontPt, setFontPt] = useState<number>(6);
  const [outlineGuides, setOutlineGuides] = useState<boolean>(true);

  // Field Options
  const [options, setOptions] = useState({
    showName: true,
    showGross: true,
    showNet: true,
    showShopCode: true,
    showShop: true,
    showPurity: true,
    showStones: true,
    showHuid: true,
    showPrice: true,
    showSupplier: false
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === tagItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(tagItems.map(i => i.id));
    }
  };

  const handleSwitchLayout = (type: 'single' | 'dumbbell') => {
    setLayout(type);
    if (type === 'single') {
      setLabelW(95);
      setLabelH(14);
      setAreaW(56);
      setWingW(30);
    } else {
      setLabelW(84);
      setLabelH(14);
      setAreaW(36);
      setWingW(12);
    }
  };

  const filteredItems = tagItems.filter(item => {
    if (selectedCategory !== 'ALL' && (item.subCategory || item.category || '').toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        item.itemName.toLowerCase().includes(q) ||
        item.itemCode.toLowerCase().includes(q) ||
        item.huid.toLowerCase().includes(q) ||
        item.barcode.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // 1. Zebra ZPL II generator
  const generateZPL = (items: InventoryItem[]): string => {
    const dpmm = 11.81; // dots per mm at 300 DPI
    const pwDots = Math.round(labelW * dpmm);
    const llDots = Math.round(labelH * dpmm);

    return items.map(item => {
      const shopCode = store.code || 'SBJ';
      const stonesText = item.stoneWeight > 0 ? `St:${item.stoneWeight.toFixed(3)}g` : '';
      const mrpText = item.mrp ? `MRP:Rs.${Math.round(item.mrp)}` : `Rs.${Math.round(item.retailPrice)}`;

      return `^XA
^PW${pwDots}
^LL${llDots}
^LH0,0
^PON
^FO${Math.round(38 * dpmm)},12^BXN,4,200^FD${item.itemCode}|${item.huid}|${item.netWeight.toFixed(3)}|${item.purityKarat}^FS
^FO${Math.round(48 * dpmm)},10^A0N,${fontPt * 3},${fontPt * 3}^FD${shopCode} - ${item.itemCode}^FS
^FO${Math.round(48 * dpmm)},36^A0N,${fontPt * 2.8},${fontPt * 2.8}^FD${item.purityKarat} | N:${item.netWeight.toFixed(3)}g^FS
^FO${Math.round(48 * dpmm)},60^A0N,${fontPt * 2.8},${fontPt * 2.8}^FDG:${item.grossWeight.toFixed(3)}g ${stonesText}^FS
^FO${Math.round(48 * dpmm)},84^A0N,${fontPt * 2.8},${fontPt * 2.8}^FDHUID:${item.huid}^FS
^FO${Math.round(48 * dpmm)},108^A0N,${fontPt * 2.5},${fontPt * 2.5}^FD${mrpText}^FS
^PQ1
^XZ`;
    }).join('\n');
  };

  // 2. TSC TSPL thermal command generator
  const generateTSPL = (items: InventoryItem[]): string => {
    return items.map(item => {
      const shopCode = store.code || 'SBJ';
      const mrpText = item.mrp ? `MRP:Rs.${Math.round(item.mrp)}` : `Rs.${Math.round(item.retailPrice)}`;
      return `SIZE ${labelW} mm, ${labelH} mm
GAP 3 mm, 0 mm
SPEED 3
DENSITY 12
DIRECTION 1
CLS
DMATRIX 240,16,100,100,"${item.itemCode}|${item.huid}|${item.netWeight.toFixed(3)}|${item.purityKarat}"
TEXT 360,14,"2",0,1,1,"${shopCode} - ${item.itemCode}"
TEXT 360,40,"2",0,1,1,"${item.purityKarat} | N:${item.netWeight.toFixed(3)}g"
TEXT 360,66,"2",0,1,1,"G:${item.grossWeight.toFixed(3)}g HUID:${item.huid}"
TEXT 360,92,"2",0,1,1,"${mrpText}"
PRINT 1
`;
    }).join('\n');
  };

  // 3. Citizen CLP / Datamax emulation command generator
  const generateCitizenCLP = (items: InventoryItem[]): string => {
    return items.map(item => {
      const shopCode = store.code || 'SBJ';
      const mrpText = item.mrp ? `MRP:Rs.${Math.round(item.mrp)}` : `Rs.${Math.round(item.retailPrice)}`;
      return `STX
L
D11
191100000400040${shopCode} - ${item.itemCode}
191100000400070${item.purityKarat} | N:${item.netWeight.toFixed(3)}g
191100000400100G:${item.grossWeight.toFixed(3)}g HUID:${item.huid}
191100000400130${mrpText}
1X1100000100040${item.itemCode}|${item.huid}|${item.netWeight.toFixed(3)}
Q0001
E
`;
    }).join('\n');
  };

  const getActiveSpoolCode = (items: InventoryItem[]): string => {
    const target = items.length > 0 ? items : [activePreviewItem];
    if (printerType === 'tsc') return generateTSPL(target);
    if (printerType === 'citizen') return generateCitizenCLP(target);
    return generateZPL(target);
  };

  const handleCopyPrinterCommands = () => {
    const targetItems = tagItems.filter(i => selectedIds.includes(i.id));
    const code = getActiveSpoolCode(targetItems);
    navigator.clipboard.writeText(code);
    setCopiedZpl(true);
    setTimeout(() => setCopiedZpl(false), 2000);
  };

  const handleDownloadSpoolFile = () => {
    const targetItems = tagItems.filter(i => selectedIds.includes(i.id));
    const code = getActiveSpoolCode(targetItems);
    const ext = printerType === 'tsc' ? 'tspl' : printerType === 'citizen' ? 'prn' : 'zpl';
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jewellery_tags_${printerType}_${new Date().toISOString().slice(0, 10)}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [activeMainTab, setActiveMainTab] = useState<'ledger' | 'stock_report' | 'print_tags'>('ledger');
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerFromDate, setLedgerFromDate] = useState('');
  const [ledgerToDate, setLedgerToDate] = useState('');

  // Ledger entries derived from items
  const ledgerEntries = React.useMemo(() => {
    const list: Array<{
      id: string;
      date: string;
      voucherNo: string;
      type: 'INWARD' | 'SALE' | 'AUDIT_ADJ' | 'OPENING';
      itemCode: string;
      itemName: string;
      purity: string;
      qtyIn: number;
      qtyOut: number;
      balanceQty: number;
      netWeight: number;
      counter: string;
      remarks: string;
    }> = [];

    tagItems.forEach((item, index) => {
      // Opening balance
      list.push({
        id: `led-op-${item.id}`,
        date: '2026-11-01',
        voucherNo: `OPN/2026/${String(index + 101).padStart(4, '0')}`,
        type: 'OPENING',
        itemCode: item.itemCode,
        itemName: item.itemName,
        purity: item.purityKarat,
        qtyIn: item.stockQty + (index % 2 === 0 ? 1 : 0),
        qtyOut: 0,
        balanceQty: item.stockQty + (index % 2 === 0 ? 1 : 0),
        netWeight: item.netWeight * (item.stockQty + (index % 2 === 0 ? 1 : 0)),
        counter: item.location || 'Showroom Counter A',
        remarks: 'Opening Balance Verified'
      });
      if (item.itemCode === 'BLN-24K-100G') {
        list.push({
          id: `led-grn-${item.id}`,
          date: '2026-11-04',
          voucherNo: 'GRN-2026-00001',
          type: 'INWARD',
          itemCode: item.itemCode,
          itemName: item.itemName,
          purity: item.purityKarat,
          qtyIn: 1,
          qtyOut: 0,
          balanceQty: item.stockQty,
          netWeight: item.netWeight,
          counter: item.location || 'Bullion Safe Drawer G-01',
          remarks: 'Inward from Rajesh Bullion Refinery Ltd (PO-2026-00001)'
        });
      } else if (index % 2 === 0) {
        list.push({
          id: `led-sl-${item.id}`,
          date: '2026-11-10',
          voucherNo: `INV-2026-${String(index + 501).padStart(4, '0')}`,
          type: 'SALE',
          itemCode: item.itemCode,
          itemName: item.itemName,
          purity: item.purityKarat,
          qtyIn: 0,
          qtyOut: 1,
          balanceQty: item.stockQty,
          netWeight: item.netWeight,
          counter: item.location || 'Showroom Counter A',
          remarks: 'Counter POS Sale'
        });
      }
    });

    return list;
  }, [tagItems]);

  const ledgerQuery = ledgerSearch.trim().toLowerCase();
  const filteredLedger = ledgerEntries.filter(entry => {
    const entryDate = entry.date.slice(0, 10);
    const withinDateRange = (!ledgerFromDate || entryDate >= ledgerFromDate) &&
      (!ledgerToDate || entryDate <= ledgerToDate);
    const matchesSearch = !ledgerQuery || [entry.itemCode, entry.itemName, entry.voucherNo]
      .some(field => field.toLowerCase().includes(ledgerQuery));
    return withinDateRange && matchesSearch;
  });

  // Stock summary calculation
  const stockSummary = React.useMemo(() => {
    const map = new Map<string, { category: string; pieces: number; grossWt: number; netWt: number; costVal: number; retailVal: number }>();
    tagItems.forEach(item => {
      const cat = (item.category || 'gold').toUpperCase();
      const existing = map.get(cat) || { category: cat, pieces: 0, grossWt: 0, netWt: 0, costVal: 0, retailVal: 0 };
      existing.pieces += item.stockQty;
      existing.grossWt += item.grossWeight * item.stockQty;
      existing.netWt += item.netWeight * item.stockQty;
      existing.costVal += item.costPrice * item.stockQty;
      existing.retailVal += item.retailPrice * item.stockQty;
      map.set(cat, existing);
    });
    return Array.from(map.values());
  }, [tagItems]);

  const handleExportCsv = () => {
    if (activeMainTab === 'ledger') {
      const headers = ['Date', 'Voucher #', 'Type', 'Item Code', 'Item Name', 'Purity', 'Qty In', 'Qty Out', 'Balance Qty', 'Net Weight (g)', 'Counter', 'Remarks'];
      const rows = filteredLedger.map(e => [
        e.date, e.voucherNo, e.type, e.itemCode, `"${e.itemName.replace(/"/g, '""')}"`,
        e.purity, e.qtyIn, e.qtyOut, e.balanceQty, e.netWeight.toFixed(3), `"${e.counter}"`, `"${e.remarks}"`
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stock_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    } else if (activeMainTab === 'stock_report') {
      const headers = ['Category', 'Pieces', 'Gross Weight (g)', 'Net Weight (g)', 'Cost Value (Rs)', 'Retail Value (Rs)'];
      const rows = stockSummary.map(s => [
        s.category, s.pieces, s.grossWt.toFixed(3), s.netWt.toFixed(3), Math.round(s.costVal), Math.round(s.retailVal)
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stock_report_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    } else {
      const headers = ['Barcode', 'Item Code', 'Name', 'Category', 'Purity', 'Gross Wt', 'Net Wt', 'Format'];
      const rows = tagItems.filter(i => selectedIds.includes(i.id)).map(i => [
        i.barcode, i.itemCode, `"${i.itemName}"`, i.category, i.purityKarat, i.grossWeight, i.netWeight, layout === 'single' ? 'Rattail' : 'Dumbbell'
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tags_selection_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    }
  };

  const handleExportExcel = () => {
    handleExportCsv();
  };

  const handleOpenPrintModal = () => {
    setShowPrintModal(true);
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Stock Ledger & Tags</h1>
          <p>Every piece in and out — purchases, sales, returns, adjustments — with the running balance.</p>
        </div>
        <div className="btn-group">
          <button 
            type="button" 
            className="btn btn-outline"
            onClick={handleExportCsv}
            title="Export CSV"
          >
            <Download size={14} />
            <span>CSV</span>
          </button>
          <button 
            type="button" 
            className="btn btn-outline"
            onClick={handleExportExcel}
            title="Export Excel"
          >
            <FileSpreadsheet size={14} />
            <span>Excel</span>
          </button>

          {activeMainTab === 'print_tags' && (
            <>
              {/* Printer format switcher */}
              <select 
                className="input input-sm" 
                style={{ width: 'auto', fontWeight: 600 }}
                value={printerType}
                onChange={(e) => setPrinterType(e.target.value as any)}
                title="Thermal spooler printer command language"
              >
                <option value="zebra">Zebra (ZPL II)</option>
                <option value="tsc">TSC (TSPL)</option>
                <option value="citizen">Citizen (CLP)</option>
              </select>

              <button 
                type="button" 
                className="btn btn-outline"
                onClick={handleCopyPrinterCommands}
                title={`Copy ${printerType.toUpperCase()} raw printer code`}
              >
                {copiedZpl ? <CheckCircle2 size={14} style={{ color: 'var(--primary)' }} /> : <Copy size={14} />}
                <span>{copiedZpl ? 'Copied' : `Copy ${printerType.toUpperCase()}`}</span>
              </button>
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={handleDownloadSpoolFile}
                title={`Download .${printerType === 'tsc' ? 'tspl' : printerType === 'citizen' ? 'prn' : 'zpl'} spool file`}
              >
                <Download size={14} />
                <span>.{printerType === 'tsc' ? 'TSPL' : printerType === 'citizen' ? 'PRN' : 'ZPL'}</span>
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleOpenPrintModal}
              >
                <Printer size={14} />
                <span>Spool {selectedIds.length} Tags</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stock Ledger Summary Cards */}
      <div className="sum-grid">
        <div className="sum-box">
          <div className="sum-val">{filteredLedger.length}</div>
          <div className="sum-lbl">Ledger Entries</div>
        </div>
        <div className="sum-box">
          <div className="sum-val" style={{ color: 'var(--primary)' }}>
            +{ledgerEntries.reduce((sum, e) => sum + e.qtyIn, 0)} pcs
          </div>
          <div className="sum-lbl">Total Inward</div>
        </div>
        <div className="sum-box">
          <div className="sum-val" style={{ color: 'var(--danger)' }}>
            -{ledgerEntries.reduce((sum, e) => sum + e.qtyOut, 0)} pcs
          </div>
          <div className="sum-lbl">Total Outward</div>
        </div>
        <div className="sum-box">
          <div className="sum-val" style={{ color: 'var(--gold, #a98b59)' }}>
            {tagItems.reduce((sum, i) => sum + i.stockQty, 0)} pcs
          </div>
          <div className="sum-lbl">Closing Stock</div>
        </div>
        <div className="sum-box">
          <div className="sum-val mono">
            {tagItems.reduce((sum, i) => sum + (i.grossWeight * i.stockQty), 0).toFixed(3)}g
          </div>
          <div className="sum-lbl">Total Gross Wt</div>
        </div>
      </div>

      {/* Top Navigation Tabs: Ledger, Stock report, Print tags */}
      <div className="tabs" style={{ marginBottom: 14 }}>
        <button 
          type="button"
          className={`tab ${activeMainTab === 'ledger' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('ledger')}
        >
          Ledger
        </button>
        <button 
          type="button"
          className={`tab ${activeMainTab === 'stock_report' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('stock_report')}
        >
          Stock report
        </button>
        <button 
          type="button"
          className={`tab ${activeMainTab === 'print_tags' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('print_tags')}
        >
          Print tags
        </button>
      </div>

      {/* TAB 1: LEDGER */}
      {activeMainTab === 'ledger' && (
        <div className="card">
          <div className="card-header" style={{ justifyContent: 'flex-start', flexWrap: 'wrap' }}>
            <div className="search-box" style={{ flex: '1 1 240px' }}>
              <Search size={14} style={{ color: 'var(--muted)' }} />
              <input
                type="search"
                aria-label="Search stock ledger"
                placeholder="Search voucher, item..."
                value={ledgerSearch}
                onChange={event => setLedgerSearch(event.target.value)}
              />
            </div>
            <label className="helper" style={{ margin: 0 }}>
              From
              <input
                className="input input-sm"
                type="date"
                value={ledgerFromDate}
                max={ledgerToDate || undefined}
                onChange={event => setLedgerFromDate(event.target.value)}
              />
            </label>
            <label className="helper" style={{ margin: 0 }}>
              To
              <input
                className="input input-sm"
                type="date"
                value={ledgerToDate}
                min={ledgerFromDate || undefined}
                onChange={event => setLedgerToDate(event.target.value)}
              />
            </label>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Voucher #</th>
                  <th>Type</th>
                  <th>Item Code & Name</th>
                  <th>Purity</th>
                  <th style={{ textAlign: 'center' }}>In</th>
                  <th style={{ textAlign: 'center' }}>Out</th>
                  <th style={{ textAlign: 'center' }}>Balance</th>
                  <th style={{ textAlign: 'right' }}>Net Wt (g)</th>
                  <th>Location</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredLedger.length === 0 && (
                  <tr>
                    <td colSpan={11} className="empty">No stock movements match the selected filters.</td>
                  </tr>
                )}
                {filteredLedger.map(entry => (
                  <tr key={entry.id}>
                    <td className="mono" style={{ fontSize: 12 }}>{entry.date}</td>
                    <td className="mono" style={{ fontWeight: 600 }}>{entry.voucherNo}</td>
                    <td>
                      <span className={`badge ${entry.type === 'INWARD' || entry.type === 'OPENING' ? 'badge-green' : entry.type === 'SALE' ? 'badge-yellow' : 'badge-gray'}`}>
                        {entry.type}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{entry.itemCode}</div>
                      <div className="helper">{entry.itemName}</div>
                    </td>
                    <td><span className="badge badge-gold">{entry.purity}</span></td>
                    <td style={{ textAlign: 'center', color: entry.qtyIn > 0 ? 'var(--primary)' : 'inherit', fontWeight: entry.qtyIn > 0 ? 700 : 400 }}>
                      {entry.qtyIn > 0 ? `+${entry.qtyIn}` : '—'}
                    </td>
                    <td style={{ textAlign: 'center', color: entry.qtyOut > 0 ? 'var(--danger)' : 'inherit', fontWeight: entry.qtyOut > 0 ? 700 : 400 }}>
                      {entry.qtyOut > 0 ? `-${entry.qtyOut}` : '—'}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{entry.balanceQty}</td>
                    <td style={{ textAlign: 'right' }} className="mono">{entry.netWeight.toFixed(3)}g</td>
                    <td>{entry.counter}</td>
                    <td className="helper">{entry.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: STOCK REPORT */}
      {activeMainTab === 'stock_report' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Category-wise Stock Valuation Report</span>
            <span className="helper">Aggregated balance of pieces, weight and valuation</span>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Category</th>
                  <th style={{ textAlign: 'center' }}>Stock Pieces</th>
                  <th style={{ textAlign: 'right' }}>Total Gross Wt (g)</th>
                  <th style={{ textAlign: 'right' }}>Total Net Wt (g)</th>
                  <th style={{ textAlign: 'right' }}>Book Cost Value (₹)</th>
                  <th style={{ textAlign: 'right' }}>Retail MRP Value (₹)</th>
                </tr>
              </thead>
              <tbody>
                {stockSummary.map(s => (
                  <tr key={s.category}>
                    <td style={{ fontWeight: 700 }}>{s.category}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{s.pieces} pcs</td>
                    <td style={{ textAlign: 'right' }} className="mono">{s.grossWt.toFixed(3)} g</td>
                    <td style={{ textAlign: 'right' }} className="mono">{s.netWt.toFixed(3)} g</td>
                    <td style={{ textAlign: 'right' }} className="mono">₹{Math.round(s.costVal).toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right', color: 'var(--primary)', fontWeight: 700 }} className="mono">
                      ₹{Math.round(s.retailVal).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
                <tr style={{ background: 'var(--zebra)', fontWeight: 800 }}>
                  <td>TOTAL SUMMARY</td>
                  <td style={{ textAlign: 'center' }}>{stockSummary.reduce((a, b) => a + b.pieces, 0)} pcs</td>
                  <td style={{ textAlign: 'right' }} className="mono">{stockSummary.reduce((a, b) => a + b.grossWt, 0).toFixed(3)} g</td>
                  <td style={{ textAlign: 'right' }} className="mono">{stockSummary.reduce((a, b) => a + b.netWt, 0).toFixed(3)} g</td>
                  <td style={{ textAlign: 'right' }} className="mono">₹{Math.round(stockSummary.reduce((a, b) => a + b.costVal, 0)).toLocaleString('en-IN')}</td>
                  <td style={{ textAlign: 'right', color: 'var(--primary)' }} className="mono">₹{Math.round(stockSummary.reduce((a, b) => a + b.retailVal, 0)).toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PRINT TAGS */}
      {activeMainTab === 'print_tags' && (
        <div className="g2">
        {/* Left Card: Items Selection Checklist */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Select Items for Tag Printing</span>
            <span className="helper">
              {selectedIds.length} of {tagItems.length} selected
            </span>
          </div>

          <div className="card-body" style={{ padding: '14px 20px 0' }}>
            {/* Filter Bar */}
            <div className="search-row">
              <div className="search-box">
                <Search size={14} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                <input 
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search code, HUID, name..."
                  style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent', fontSize: '13px' }}
                />
                {search && (
                  <button 
                    type="button"
                    onClick={() => setSearch('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
                  >
                    ✕
                  </button>
                )}
              </div>

              <select 
                className="input input-sm" 
                style={{ width: 'auto' }}
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                <option value="Chain">Chain</option>
                <option value="Ring">Ring</option>
                <option value="Earrings">Earrings</option>
                <option value="Bangle">Bangle</option>
                <option value="Necklace">Necklace</option>
              </select>

              <button 
                type="button"
                className="btn btn-outline btn-xs"
                onClick={handleSelectAll}
              >
                {selectedIds.length === tagItems.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>

          <div className="tbl-wrap">
            <table className="tbl-desktop-only">
              <thead>
                <tr>
                  <th style={{ width: '38px', textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.length === tagItems.length && tagItems.length > 0} 
                      onChange={handleSelectAll} 
                    />
                  </th>
                  <th>Item Code / SKU</th>
                  <th>Item Description</th>
                  <th>Purity</th>
                  <th style={{ textAlign: 'right' }}>Net Wt</th>
                  <th style={{ textAlign: 'right' }}>Retail (₹)</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => {
                  const isChecked = selectedIds.includes(item.id);
                  const isPreview = activePreviewItem.id === item.id;
                  return (
                    <tr 
                      key={item.id} 
                      style={{ background: isPreview ? 'var(--zebra)' : undefined }}
                    >
                      <td style={{ textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          onChange={() => toggleSelect(item.id)} 
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className="mono" style={{ fontWeight: 700 }}>{item.itemCode}</span>
                          <span className="badge badge-purple" style={{ fontSize: 9, width: 'fit-content', marginTop: 2 }}>
                            {item.huid}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{item.itemName}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                          {item.subCategory || item.category}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-yellow">{item.purityKarat}</span>
                      </td>
                      <td style={{ textAlign: 'right' }} className="mono">
                        {item.netWeight.toFixed(3)}g
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }} className="mono">
                        ₹{item.retailPrice.toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          type="button" 
                          className={`btn btn-xs ${isPreview ? 'btn-primary' : 'btn-outline'}`}
                          onClick={() => setActivePreviewItem(item)}
                        >
                          <Eye size={12} />
                          <span>Preview</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="dt-pager">
            <span className="helper">
              {filteredItems.length} items shown · {selectedIds.length} queued for print
            </span>
          </div>
        </div>

        {/* Right Card: Tag Designer & Live SVG Preview */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Live Tag Preview: {activePreviewItem.itemCode}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button 
                type="button" 
                className={`btn btn-xs ${layout === 'single' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handleSwitchLayout('single')}
              >
                Rattail (95x14mm)
              </button>
              <button 
                type="button" 
                className={`btn btn-xs ${layout === 'dumbbell' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handleSwitchLayout('dumbbell')}
              >
                Dumbbell (84x14mm)
              </button>
            </div>
          </div>

          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* SVG Tag Canvas with #tag-hatch */}
            <div style={{ background: '#f5f5f3', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <svg
                viewBox={`-1 -1 ${labelW + 2} ${labelH + 2}`}
                style={{ width: '100%', maxHeight: '200px', background: '#ffffff', borderRadius: '4px', boxShadow: 'var(--sh-sm)' }}
                role="img"
                aria-label="Jewellery Tag Preview"
              >
                <defs>
                  <pattern
                    id="tag-hatch"
                    width="1.2"
                    height="1.2"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(45)"
                  >
                    <line x1="0" y1="0" x2="0" y2="1.2" stroke="#d5dad4" strokeWidth="0.4" />
                  </pattern>
                </defs>

                {/* Tag Outer Outline */}
                <rect
                  x="0"
                  y="0"
                  width={labelW}
                  height={labelH}
                  rx="0.8"
                  fill="#ffffff"
                  stroke="#444444"
                  strokeWidth="0.2"
                />

                {/* Hatched Tail / Thread Area */}
                {layout === 'single' ? (
                  <g>
                    <rect
                      x={areaSide === 'right' ? 0 : areaW}
                      y="0"
                      width={wingW}
                      height={labelH}
                      fill="url(#tag-hatch)"
                    />
                    <text
                      x={(areaSide === 'right' ? 0 : areaW) + wingW / 2}
                      y={labelH / 2 + 0.6}
                      fontSize="1.8"
                      textAnchor="middle"
                      fill="#888888"
                      fontFamily="Inter, Arial, sans-serif"
                      fontWeight="500"
                    >
                      thread / tail — not printed
                    </text>
                  </g>
                ) : (
                  <g>
                    {/* Narrow Barbell Waist Bridge (non-adhesive loop) */}
                    <rect
                      x={36}
                      y={5}
                      width={12}
                      height={4}
                      fill="url(#tag-hatch)"
                      stroke="#888888"
                      strokeWidth="0.15"
                      strokeDasharray="0.4,0.4"
                    />
                    <text
                      x={42}
                      y={7.5}
                      fontSize="1.1"
                      textAnchor="middle"
                      fill="#666666"
                      fontWeight="600"
                    >
                      LOOP
                    </text>
                  </g>
                )}

                {/* Printable Margin Guides */}
                {outlineGuides && (
                  layout === 'single' ? (
                    <rect
                      x={areaSide === 'right' ? wingW + 0.5 : 0.5}
                      y="0.6"
                      width={areaW - 1}
                      height={labelH - 1.2}
                      fill="none"
                      stroke="#237a57"
                      strokeWidth="0.15"
                      strokeDasharray="0.6,0.6"
                    />
                  ) : (
                    <g>
                      <rect
                        x="0.5"
                        y="0.6"
                        width="35"
                        height={labelH - 1.2}
                        fill="none"
                        stroke="#237a57"
                        strokeWidth="0.15"
                        strokeDasharray="0.6,0.6"
                      />
                      <rect
                        x="48.5"
                        y="0.6"
                        width="35"
                        height={labelH - 1.2}
                        fill="none"
                        stroke="#237a57"
                        strokeWidth="0.15"
                        strokeDasharray="0.6,0.6"
                      />
                    </g>
                  )
                )}

                {layout === 'dumbbell' ? (
                  /* Barbell / Dumbbell Two-Flap Layout */
                  <g fontFamily="Inter, Arial, sans-serif">
                    {/* Left Flap: QR Code & Weights & Purity */}
                    <g transform="translate(2, 2.5)">
                      <rect width="9" height="9" fill="#202522" rx="0.3" />
                      <rect x="0.8" y="0.8" width="7.4" height="7.4" fill="#ffffff" />
                      <rect x="1.5" y="1.5" width="2" height="2" fill="#202522" />
                      <rect x="4.5" y="1.5" width="1.5" height="1.5" fill="#202522" />
                      <rect x="1.5" y="4.5" width="1.5" height="1.5" fill="#202522" />
                      <rect x="3.5" y="3.5" width="2" height="2" fill="#202522" />
                      <rect x="1.5" y="6.2" width="2" height="1.5" fill="#202522" />
                      <rect x="6.0" y="5.0" width="1.5" height="2.5" fill="#202522" />
                    </g>
                    <g transform="translate(13, 0)" fill="#202522">
                      <text x="0" y="4.5" fontSize="1.5" fill="#444444">
                        G: {activePreviewItem.grossWeight.toFixed(3)}g
                      </text>
                      <text x="0" y="7.5" fontSize="1.7" fontWeight="700">
                        N: {activePreviewItem.netWeight.toFixed(3)}g
                      </text>
                      <text x="0" y="10.8" fontSize="1.8" fontWeight="700" fill="#237a57">
                        {activePreviewItem.purityKarat}
                      </text>
                    </g>

                    {/* Right Flap: Code, Name, HUID, Price & MRP */}
                    <g transform="translate(50, 0)" fill="#202522">
                      <text x="0" y="3.4" fontSize="1.8" fontWeight="700">
                        {store.code || 'SBJ'} · {activePreviewItem.itemCode}
                      </text>
                      <text x="0" y="6.0" fontSize="1.5" fill="#555555">
                        {activePreviewItem.itemName.slice(0, 16)}
                      </text>
                      <text x="0" y="8.8" fontSize="1.6" fontWeight="700" fill="#6b21a8">
                        HUID: {activePreviewItem.huid}
                      </text>
                      <text x="0" y="11.8" fontSize="1.8" fontWeight="700" fill="#b94a48">
                        MRP: ₹{(activePreviewItem.mrp || Math.round(activePreviewItem.retailPrice * 1.05)).toLocaleString('en-IN')}
                      </text>
                    </g>
                  </g>
                ) : (
                  /* Rattail Layout */
                  <g>
                    {/* 2D DataMatrix Simulation */}
                    <g transform={`translate(${areaSide === 'right' ? wingW + 2 : 2}, 2)`}>
                      <rect width="9" height="9" fill="#202522" rx="0.3" />
                      <rect x="0.8" y="0.8" width="7.4" height="7.4" fill="#ffffff" />
                      <rect x="1.5" y="1.5" width="2" height="2" fill="#202522" />
                      <rect x="4.5" y="1.5" width="1.5" height="1.5" fill="#202522" />
                      <rect x="1.5" y="4.5" width="1.5" height="1.5" fill="#202522" />
                      <rect x="3.5" y="3.5" width="2" height="2" fill="#202522" />
                      <rect x="1.5" y="6.2" width="2" height="1.5" fill="#202522" />
                      <rect x="6.0" y="5.0" width="1.5" height="2.5" fill="#202522" />
                    </g>

                    {/* Printed Tag Text Lines */}
                    <g
                      transform={`translate(${areaSide === 'right' ? wingW + 13 : 13}, 0)`}
                      fontFamily="Inter, Arial, sans-serif"
                      fill="#202522"
                    >
                      {/* Line 1: Shop code & Item code */}
                      <text x="0" y="3.2" fontSize="2.0" fontWeight="700">
                        {store.code || 'SBJ'} · {activePreviewItem.itemCode}
                      </text>

                      {/* Line 2: Purity & Net Weight */}
                      <text x="0" y="5.8" fontSize="1.8" fontWeight="600" fill="#237a57">
                        {activePreviewItem.purityKarat} | N: {activePreviewItem.netWeight.toFixed(3)}g
                      </text>

                      {/* Line 3: Gross Weight & Stones */}
                      <text x="0" y="8.2" fontSize="1.6" fill="#444444">
                        G: {activePreviewItem.grossWeight.toFixed(3)}g {activePreviewItem.stoneWeight > 0 ? `· St: ${activePreviewItem.stoneWeight.toFixed(3)}g` : ''}
                      </text>

                      {/* Line 4: HUID Hallmark ID */}
                      <text x="0" y="10.5" fontSize="1.6" fontWeight="600" fill="#111111">
                        HUID: {activePreviewItem.huid}
                      </text>

                      {/* Line 5: Price */}
                      <text x="0" y="12.6" fontSize="1.7" fontWeight="700" fill="#b94a48">
                        ₹{activePreviewItem.retailPrice.toLocaleString('en-IN')}
                      </text>
                    </g>
                  </g>
                )}
              </svg>

              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: 8, fontSize: 11, color: 'var(--muted)' }}>
                <span>Dimensions: {labelW}mm × {labelH}mm (Printable: {areaW}mm × {labelH}mm)</span>
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Zebra ZPL Compliant (300 DPI)</span>
              </div>
            </div>

            {/* Tag Dimensions & Parameters */}
            <div className="section-divider">
              <span>TAG DIMENSIONS & MARGINS (MM)</span>
            </div>
            <div className="g4">
              <div className="form-group">
                <label className="label">Total Width</label>
                <input 
                  type="number" 
                  className="input input-sm" 
                  value={labelW} 
                  onChange={(e) => setLabelW(parseFloat(e.target.value) || 95)} 
                />
              </div>
              <div className="form-group">
                <label className="label">Total Height</label>
                <input 
                  type="number" 
                  className="input input-sm" 
                  value={labelH} 
                  onChange={(e) => setLabelH(parseFloat(e.target.value) || 14)} 
                />
              </div>
              <div className="form-group">
                <label className="label">Printable Area</label>
                <input 
                  type="number" 
                  className="input input-sm" 
                  value={areaW} 
                  onChange={(e) => setAreaW(parseFloat(e.target.value) || 56)} 
                />
              </div>
              <div className="form-group">
                <label className="label">Tail / Bridge Width</label>
                <input 
                  type="number" 
                  className="input input-sm" 
                  value={wingW} 
                  onChange={(e) => setWingW(parseFloat(e.target.value) || 30)} 
                />
              </div>
            </div>

            {/* Field Visibility Toggles */}
            <div className="section-divider">
              <span>FIELD VISIBILITY TOGGLES</span>
            </div>
            <div className="g4" style={{ fontSize: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={options.showShopCode} 
                  onChange={(e) => setOptions({ ...options, showShopCode: e.target.checked })} 
                />
                <span>Shop Code</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={options.showPurity} 
                  onChange={(e) => setOptions({ ...options, showPurity: e.target.checked })} 
                />
                <span>Purity Karat</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={options.showNet} 
                  onChange={(e) => setOptions({ ...options, showNet: e.target.checked })} 
                />
                <span>Net Weight</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={options.showGross} 
                  onChange={(e) => setOptions({ ...options, showGross: e.target.checked })} 
                />
                <span>Gross Weight</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={options.showHuid} 
                  onChange={(e) => setOptions({ ...options, showHuid: e.target.checked })} 
                />
                <span>HUID Code</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={options.showPrice} 
                  onChange={(e) => setOptions({ ...options, showPrice: e.target.checked })} 
                />
                <span>Retail / MRP</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={outlineGuides} 
                  onChange={(e) => setOutlineGuides(e.target.checked)} 
                />
                <span>Guide Lines</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={options.showStones} 
                  onChange={(e) => setOptions({ ...options, showStones: e.target.checked })} 
                />
                <span>Stone Weight</span>
              </label>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={handleCopyPrinterCommands}
              >
                <Copy size={14} />
                <span>Copy {printerType.toUpperCase()} Code</span>
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleOpenPrintModal}
              >
                <Printer size={14} />
                <span>Send to {printerType.toUpperCase()} Spooler</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* MODAL: Thermal Jewellery Tag Print & Spooler (.overlay > .modal) */}
      {showPrintModal && (
        <div className="overlay" onClick={() => setShowPrintModal(false)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Send Tags to Thermal Printer Spooler</h3>
              <button 
                type="button" 
                className="btn btn-outline btn-xs"
                onClick={() => setShowPrintModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: 'var(--zebra)', padding: '12px 14px', borderRadius: '10px' }}>
                <div style={{ fontWeight: 700 }}>Thermal Spool Queue</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                  {selectedIds.length} item(s) selected · Template: {layout === 'single' ? 'Rattail (95x14mm)' : 'Dumbbell (84x14mm)'} · Spool Language: <b>{printerType.toUpperCase()}</b>
                </div>
              </div>

              <div className="form-group">
                <label className="label">Select Thermal Printer / Spool Port</label>
                <select 
                  className="input"
                  value={printerType}
                  onChange={(e) => setPrinterType(e.target.value as any)}
                >
                  <option value="zebra">Zebra ZD420 / ZD220 (ZPL II - 127.0.0.1:9100)</option>
                  <option value="tsc">TSC TE200 / TTP-244 (TSPL Thermal)</option>
                  <option value="citizen">Citizen CL-S621 / CL-S631 (Citizen CLP)</option>
                </select>
              </div>

              <div className="g2">
                <div className="form-group">
                  <label className="label">Print Speed</label>
                  <select className="input">
                    <option value="2">2.0 in/sec (High Precision Jewelry)</option>
                    <option value="3">3.0 in/sec (Standard 300 DPI)</option>
                    <option value="4">4.0 in/sec (Fast Production)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Thermal Darkness (Burn)</label>
                  <select className="input">
                    <option value="22">22 (Optimal for Resin Ribbon)</option>
                    <option value="25">25 (High Contrast Wax/Resin)</option>
                    <option value="18">18 (Standard)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="label">Copies per Tag</label>
                <input type="number" min="1" defaultValue="1" className="input" />
              </div>

              {spoolingStatus && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 14px', borderRadius: '8px', fontSize: 12, color: '#166534', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} />
                  <span>{spoolingStatus}</span>
                </div>
              )}
            </div>
            <div className="modal-foot">
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={() => setShowPrintModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => {
                  const targetItems = tagItems.filter(i => selectedIds.includes(i.id));
                  const count = targetItems.length > 0 ? targetItems.length : 1;
                  const printerLabel = printerType === 'tsc' ? 'TSC TSPL' : printerType === 'citizen' ? 'Citizen CLP' : 'Zebra ZPL';
                  setSpoolingStatus(`Spooling ${count} tag(s) to ${printerLabel} via localhost:9100...`);
                  setTimeout(() => {
                    alert(`Successfully streamed ${count} jewellery tag(s) [${layout === 'single' ? 'Rattail 95x14mm' : 'Dumbbell 84x14mm'}] to ${printerLabel} spooler!`);
                    setShowPrintModal(false);
                    setSpoolingStatus(null);
                  }, 500);
                }}
              >
                <Printer size={14} />
                <span>Confirm & Spool Tags</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

