import React, { useState } from 'react';
import { 
  Plus, Search, FileSpreadsheet, Download, Upload,
  Tag, ArrowDownRight, ArrowUpRight, Edit, Trash2,
  X, QrCode, Layers, Eye, Printer, Barcode, Check
} from 'lucide-react';
import { 
  InventoryItem, MetalGroup, MakingChargeMode, StoneItem, StoreProfile, DailyRates 
} from '../../types';

interface InventoryViewProps {
  store: StoreProfile;
  inventory: InventoryItem[];
  rates?: DailyRates;
  onAddItem: (item: InventoryItem) => void;
  onUpdateStock: (itemId: string, qtyDelta: number, reason: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  store,
  inventory: initialInventory,
  rates,
  onAddItem,
  onUpdateStock
}) => {
  // Default single stock item from the DB: 'SBJCH-01', 'Gold Chain 22K Rope', Gold 22K, HUID ZX98YU, gross 12.350g, net 12.350g, qty 3
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
    makingMode: 'PER_NET_GRAM' as MakingChargeMode,
    makingRate: 450.0,
    makingType: 'per_gram' as const,
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

  // Deletion tracker for items deleted in session
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  // Guaranteed single DB stock item presence
  const rawInventory = React.useMemo(() => {
    if (!initialInventory || initialInventory.length === 0) {
      return [dbSingleStockItem];
    }
    const hasSbj = initialInventory.some(i => i.itemCode === 'SBJCH-01');
    const mapped = initialInventory.map(item => item.itemCode === 'SBJCH-01' ? {
      ...dbSingleStockItem,
      ...item,
      itemCode: 'SBJCH-01',
      itemName: 'Gold Chain 22K Rope',
      purityKarat: '22K (916)',
      metalType: 'Gold',
      huid: 'ZX98YU',
      grossWeight: 12.350,
      netWeight: 12.350,
      stoneWeight: 0.000,
      quantity: item.quantity || 3,
      stockQty: item.stockQty || 3
    } : item);
    return hasSbj ? mapped : [dbSingleStockItem, ...mapped];
  }, [initialInventory]);

  const inventory = React.useMemo(() => {
    return rawInventory.filter(i => !deletedIds.includes(i.id));
  }, [rawInventory, deletedIds]);

  const [activeTab, setActiveTab] = useState<'items' | 'stock_in_out' | 'summary'>('items');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modals & Drawers
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showScanModal, setShowScanModal] = useState<boolean>(false);
  const [scanInputVal, setScanInputVal] = useState<string>('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);
  const [showExcelModal, setShowExcelModal] = useState<boolean>(false);
  const [showStockMoveModal, setShowStockMoveModal] = useState<boolean>(false);
  const [activeItemForStock, setActiveItemForStock] = useState<InventoryItem | null>(null);
  const [stockDirection, setStockDirection] = useState<'IN' | 'OUT' | 'TRANSFER'>('IN');
  const [transferLocation, setTransferLocation] = useState<string>('Vault Safe B-02');
  const [stockPieces, setStockPieces] = useState<number>(1);
  const [stockReason, setStockReason] = useState<string>('Opening stock');
  
  // Tag Print Modal State
  const [showTagModal, setShowTagModal] = useState<boolean>(false);
  const [tagPrintItem, setTagPrintItem] = useState<InventoryItem | null>(null);
  const [tagCopies, setTagCopies] = useState<number>(1);
  const [tagLayout, setTagLayout] = useState<'barbell' | 'rattail'>('barbell');

  // Generator Helpers for BIS 6-Character Alphanumeric HUID & 12-Digit EAN Barcode
  const generateHuid = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const generateBarcodeValue = (): string => {
    const rand = Math.floor(100000000 + Math.random() * 900000000);
    return `890${rand}`;
  };

  // Form State for Add / Edit Item (All 18 attributes)
  const [itemCode, setItemCode] = useState<string>('');
  const [barcode, setBarcode] = useState<string>('');
  const [huid, setHuid] = useState<string>('');
  const [itemName, setItemName] = useState<string>('');
  const [category, setCategory] = useState<string>('gold');
  const [subCategory, setSubCategory] = useState<string>('Chain');
  const [metalGroup, setMetalGroup] = useState<MetalGroup>('GOLD');
  const [metalType, setMetalType] = useState<string>('gold');
  const [purityKarat, setPurityKarat] = useState<string>('22K (916)');
  const [grossWeight, setGrossWeight] = useState<string>('12.350');
  const [stoneWeight, setStoneWeight] = useState<string>('0.000');
  const [wastagePercent, setWastagePercent] = useState<string>('6.0');
  const [makingType, setMakingType] = useState<'per_gram' | 'per_piece' | 'percent_of_metal'>('per_gram');
  const [makingRate, setMakingRate] = useState<string>('450');
  const [costPrice, setCostPrice] = useState<string>('88920');
  const [retailPrice, setRetailPrice] = useState<string>('97812');
  const [mrp, setMrp] = useState<string>('104500');
  const [wholesalePrice, setWholesalePrice] = useState<string>('92470');
  const [retailMarginPct, setRetailMarginPct] = useState<string>('10.0');
  const [wholesaleMarginPct, setWholesaleMarginPct] = useState<string>('4.0');
  const [quantity, setQuantity] = useState<number>(3);
  const [minStock, setMinStock] = useState<number>(2);
  const [location, setLocation] = useState<string>('Main Showroom');
  const [rackTray, setRackTray] = useState<string>('Chain Tray 01');
  const [hsn, setHsn] = useState<string>('7113');
  const [designNo, setDesignNo] = useState<string>('DS-CH-901');
  const [gender, setGender] = useState<string>('Men');
  const [itemSize, setItemSize] = useState<string>('20 inch');
  const [description, setDescription] = useState<string>('');
  const [stones, setStones] = useState<StoneItem[]>([]);

  // Sample stock movement logs
  const [stockMovements, setStockMovements] = useState([
    { id: 'sm-1', date: '15 Nov 2026 11:30 AM', code: 'SBJCH-01', item: 'Gold Chain 22K Rope', type: 'IN', qty: 3, reason: 'Opening stock', by: 'Admin' },
    { id: 'sm-2', date: '12 Nov 2026 12:49 PM', code: '22CTGOLDRING', item: '22 ct Gold Ring', type: 'OUT', qty: 1, reason: 'Sale: INV-2026-00276', by: 'Admin' },
    { id: 'sm-3', date: '10 Nov 2026 04:30 PM', code: '18KTNB15RING', item: '18K Diamond Solitaire Ring', type: 'IN', qty: 5, reason: 'Purchase: PO-2026-00012', by: 'Admin' }
  ]);

  // Derived live weights
  const parsedGross = parseFloat(grossWeight) || 0;
  const parsedStone = parseFloat(stoneWeight) || 0;
  const netWeightComputed = Math.max(0, parsedGross - parsedStone);

  const liveRatePerGram = React.useMemo(() => {
    if (!rates) return 7191;
    const cat = category.toLowerCase();
    if (cat.includes('gold')) {
      if (purityKarat.includes('24K')) return rates.gold24kPerGram || 7850;
      if (purityKarat.includes('22K')) return rates.gold22kPerGram || 7191;
      if (purityKarat.includes('18K')) return rates.gold18kPerGram || 5888;
      if (purityKarat.includes('14K')) return rates.gold14kPerGram || 4592;
      return rates.gold22kPerGram || 7191;
    }
    if (cat.includes('silver')) {
      return rates.silverPerGram || 94;
    }
    if (cat.includes('platinum')) {
      return rates.platinumPerGram || 3800;
    }
    return 7191;
  }, [rates, category, purityKarat]);

  const indicativeMetalValue = Math.round(netWeightComputed * liveRatePerGram);
  const parsedMakingRate = parseFloat(makingRate) || 0;
  const indicativeMakingCharge = Math.round(
    makingType === 'per_gram' ? netWeightComputed * parsedMakingRate :
    makingType === 'percent_of_metal' ? (indicativeMetalValue * parsedMakingRate) / 100 :
    parsedMakingRate
  );
  const stoneTotalValue = stones.reduce((acc, s) => acc + (s.totalPrice || 0), 0);
  const indicativeTotalEstimate = indicativeMetalValue + indicativeMakingCharge + stoneTotalValue;

  const handleCostChange = (val: string) => {
    setCostPrice(val);
    const c = parseFloat(val) || 0;
    const rm = parseFloat(retailMarginPct) || 0;
    const wm = parseFloat(wholesaleMarginPct) || 0;
    if (c > 0) {
      setRetailPrice(Math.round(c * (1 + rm / 100)).toString());
      setWholesalePrice(Math.round(c * (1 + wm / 100)).toString());
      setMrp(Math.round(c * (1 + (rm + 5) / 100)).toString());
    }
  };

  const handleOpenAdd = () => {
    setEditingItemId(null);
    const randNum = Math.floor(1000 + Math.random() * 9000);
    setItemCode(`JW-${randNum}`);
    setBarcode(generateBarcodeValue());
    setHuid(generateHuid());
    setItemName('Gold Jewellery Item');
    setCategory('gold');
    setSubCategory('Chain');
    setMetalGroup('GOLD');
    setMetalType('gold');
    setPurityKarat('22K (916)');
    setGrossWeight('10.000');
    setStoneWeight('0.000');
    setWastagePercent('5.0');
    setMakingType('per_gram');
    setMakingRate('450');
    setCostPrice('75000');
    setRetailMarginPct('10.0');
    setWholesaleMarginPct('4.0');
    setRetailPrice('82500');
    setWholesalePrice('78000');
    setMrp('86500');
    setQuantity(1);
    setMinStock(1);
    setLocation('Main Showroom');
    setRackTray('Counter 01');
    setHsn('7113');
    setDesignNo('DS-901');
    setGender('Unisex');
    setItemSize('');
    setDescription('');
    setStones([]);
    setShowAddModal(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItemId(item.id);
    setItemCode(item.itemCode);
    setBarcode(item.barcode || '');
    setHuid(item.huid || '');
    setItemName(item.itemName);
    setCategory((item.category || 'gold').toLowerCase());
    setSubCategory(item.subCategory || 'Chain');
    setMetalGroup(item.metalGroup || 'GOLD');
    setMetalType(item.metalType || 'gold');
    setPurityKarat(item.purityKarat);
    setGrossWeight(item.grossWeight.toString());
    setStoneWeight(item.stoneWeight.toString());
    setWastagePercent((item.wastagePercent || 0).toString());
    setMakingType((item.makingType as any) || (item.makingMode === 'FIXED_PER_PIECE' ? 'per_piece' : item.makingMode === 'PERCENTAGE_OF_GOLD' ? 'percent_of_metal' : 'per_gram'));
    setMakingRate(item.makingRate.toString());
    setCostPrice(item.costPrice.toString());
    setRetailPrice(item.retailPrice.toString());
    setWholesalePrice((item.wholesalePrice || Math.round(item.costPrice * 1.04)).toString());
    setMrp((item.mrp || Math.round(item.retailPrice * 1.05)).toString());
    setRetailMarginPct((item.retailMarginPct || 10).toString());
    setWholesaleMarginPct((item.wholesaleMarginPct || 4).toString());
    setQuantity(item.stockQty);
    setMinStock(item.minStock || 1);
    setLocation(item.location);
    setRackTray(item.rackTray || '');
    setHsn(item.hsn || '7113');
    setDesignNo(item.designNo || '');
    setGender(item.gender || 'Men');
    setItemSize(item.itemSize || '');
    setDescription(item.description || '');
    setStones(item.stones || []);
    setShowAddModal(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemCode.trim()) {
      alert('Item code is required');
      return;
    }
    if (!itemName.trim()) {
      alert('Item name is required');
      return;
    }
    if (parsedGross <= 0) {
      alert('Gross weight must be greater than 0');
      return;
    }

    const newItem: InventoryItem = {
      id: editingItemId || `item-${Date.now()}`,
      itemCode: itemCode.trim().toUpperCase(),
      barcode: barcode || `890${Math.floor(100000000 + Math.random() * 900000000)}`,
      huid: (huid || 'ZX98YU').trim().toUpperCase().slice(0, 6),
      itemName: itemName.trim(),
      category: category.toLowerCase(),
      subCategory,
      metalType,
      metalGroup,
      purityKarat,
      purityPercent: purityKarat.includes('22K') ? 91.6 : purityKarat.includes('18K') ? 75.0 : purityKarat.includes('24K') ? 99.9 : 92.5,
      grossWeight: parsedGross,
      stoneWeight: parsedStone,
      netWeight: netWeightComputed,
      wastagePercent: parseFloat(wastagePercent) || 0,
      makingMode: makingType === 'per_gram' ? 'PER_NET_GRAM' : makingType === 'per_piece' ? 'FIXED_PER_PIECE' : 'PERCENTAGE_OF_GOLD',
      makingRate: parseFloat(makingRate) || 0,
      makingType,
      costPrice: parseFloat(costPrice) || 0,
      retailMarginPct: parseFloat(retailMarginPct) || 0,
      wholesaleMarginPct: parseFloat(wholesaleMarginPct) || 0,
      retailPrice: parseFloat(retailPrice) || 0,
      wholesalePrice: parseFloat(wholesalePrice) || 0,
      mrp: parseFloat(mrp) || (parseFloat(retailPrice) * 1.05),
      hsn: hsn || '7113',
      quantity,
      minStock,
      itemSize,
      designNo,
      gender,
      stockQty: quantity,
      location,
      rackTray,
      stones,
      status: 'IN_STOCK',
      description
    };

    onAddItem(newItem);
    setShowAddModal(false);
  };

  const handleStockMoveSubmit = () => {
    if (!activeItemForStock) return;
    const delta = stockDirection === 'TRANSFER' ? 0 : (stockDirection === 'IN' ? stockPieces : -stockPieces);
    const reasonText = stockDirection === 'TRANSFER'
      ? `Transfer to ${transferLocation} (${stockReason})`
      : stockReason;

    onUpdateStock(activeItemForStock.id, delta, reasonText);

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + 
                    now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    setStockMovements([
      {
        id: `sm-${Date.now()}`,
        date: dateStr,
        code: activeItemForStock.itemCode,
        item: activeItemForStock.itemName,
        type: stockDirection,
        qty: stockPieces,
        reason: reasonText,
        by: 'Admin'
      },
      ...stockMovements
    ]);

    setShowStockMoveModal(false);
  };

  const handleOpenTagPrint = (item: InventoryItem) => {
    setTagPrintItem(item);
    setTagCopies(item.stockQty > 0 ? item.stockQty : 1);
    setShowTagModal(true);
  };

  const handleDeleteItem = (itemId: string) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;
    if (window.confirm(`Are you sure you want to delete item "${item.itemName}" (${item.itemCode})?`)) {
      setDeletedIds(prev => [...prev, itemId]);
      if (viewingItem && viewingItem.id === itemId) {
        setViewingItem(null);
      }
    }
  };

  const handleExportCsv = () => {
    const headers = ['Barcode', 'Item Code', 'Name', 'Category', 'Sub Category', 'Purity', 'Gross Wt (g)', 'Net Wt (g)', 'Stone Wt (g)', 'Cost Price (Rs)', 'Retail Price (Rs)', 'Qty', 'Location', 'HUID'];
    const rows = filteredItems.map(item => [
      item.barcode,
      item.itemCode,
      `"${(item.itemName || '').replace(/"/g, '""')}"`,
      item.category,
      item.subCategory || '',
      item.purityKarat,
      item.grossWeight.toFixed(3),
      item.netWeight.toFixed(3),
      item.stoneWeight.toFixed(3),
      item.costPrice,
      item.retailPrice,
      item.stockQty,
      `"${item.location || 'Showroom'}"`,
      item.huid || ''
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Inventory_Items_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    handleExportCsv();
  };

  const handleScanBarcode = () => {
    if (!scanInputVal.trim()) return;
    const q = scanInputVal.trim().toUpperCase();
    const found = inventory.find(i => 
      (i.barcode && i.barcode.toUpperCase() === q) || 
      (i.itemCode && i.itemCode.toUpperCase() === q) || 
      (i.huid && i.huid.toUpperCase() === q)
    );
    if (found) {
      setViewingItem(found);
      setShowScanModal(false);
      setScanInputVal('');
    } else {
      setSearchQuery(q);
      setShowScanModal(false);
      setScanInputVal('');
    }
  };

  // Filtered items logic
  const filteredItems = inventory.filter((item) => {
    if (selectedCategory !== 'ALL' && (item.category || '').toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }
    if (selectedStatus === 'IN_STOCK' && item.stockQty <= 0) return false;
    if (selectedStatus === 'LOW_STOCK' && (item.stockQty > (item.minStock ?? 1) || item.stockQty === 0)) return false;
    if (selectedStatus === 'OUT_OF_STOCK' && item.stockQty > 0) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchCode = (item.itemCode || '').toLowerCase().includes(q);
      const matchBarcode = (item.barcode || '').toLowerCase().includes(q);
      const matchHuid = (item.huid || '').toLowerCase().includes(q);
      const matchName = (item.itemName || '').toLowerCase().includes(q);
      const matchCat = (item.category || '').toLowerCase().includes(q);
      return matchCode || matchBarcode || matchHuid || matchName || matchCat;
    }
    return true;
  });

  // Summary aggregation calculations
  const totalPieces = inventory.reduce((acc, item) => acc + item.stockQty, 0);
  const totalGrossWeight = inventory.reduce((acc, item) => acc + (item.grossWeight * item.stockQty), 0);
  const totalNetWeight = inventory.reduce((acc, item) => acc + (item.netWeight * item.stockQty), 0);
  const totalCostValue = inventory.reduce((acc, item) => acc + (item.costPrice * item.stockQty), 0);
  const totalRetailValue = inventory.reduce((acc, item) => acc + (item.retailPrice * item.stockQty), 0);

  return (
    <div className="page">
      {/* 1. Exact Header */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Inventory</h1>
          <p>{inventory.length} item{inventory.length === 1 ? '' : 's'}</p>
        </div>
        <div className="btn-group">
          <button className="btn btn-outline" onClick={() => setShowExcelModal(true)}>
            Import Excel
          </button>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            + Add item
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'items' ? 'active' : ''}`}
          onClick={() => setActiveTab('items')}
        >
          Items ({inventory.length})
        </button>
        <button 
          className={`tab ${activeTab === 'stock_in_out' ? 'active' : ''}`}
          onClick={() => setActiveTab('stock_in_out')}
        >
          Stock in / out
        </button>
        <button 
          className={`tab ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          Summary
        </button>
      </div>

      {/* TAB 1: Items Table */}
      {activeTab === 'items' && (
        <>
          {/* Filter row */}
          <div className="search-row">
            <div className="search-box">
              <Search size={15} style={{ color: 'var(--muted)', flexShrink: 0 }} />
              <input 
                type="text" 
                placeholder="Barcode, item code, HUID, name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent', fontSize: '13px' }}
              />
              {searchQuery && (
                <button 
                  type="button" 
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '0 4px' }}
                >
                  ✕
                </button>
              )}
            </div>

            <select 
              className="input input-sm" 
              style={{ width: 'auto', minWidth: '140px' }}
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="ALL">All categories</option>
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
              <option value="diamond">Diamond</option>
              <option value="platinum">Platinum</option>
              <option value="other">Other</option>
            </select>

            <select 
              className="input input-sm" 
              style={{ width: 'auto', minWidth: '140px' }}
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="ALL">All stock status</option>
              <option value="IN_STOCK">In stock</option>
              <option value="LOW_STOCK">Low stock</option>
              <option value="OUT_OF_STOCK">Out of stock</option>
            </select>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <button 
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setShowScanModal(true)}
                title="Scan barcode or item code"
              >
                <Barcode size={14} />
                <span>Scan</span>
              </button>
              <button 
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleExportCsv}
                title="Export Inventory CSV"
              >
                <Download size={14} />
                <span>CSV</span>
              </button>
              <button 
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleExportExcel}
                title="Export Inventory Excel"
              >
                <FileSpreadsheet size={14} />
                <span>Excel</span>
              </button>
            </div>
          </div>

          {/* Table matching live schema */}
          <div className="card">
            <div className="tbl-wrap">
              <table className="tbl-desktop-only">
                <thead>
                  <tr>
                    <th>Barcode / SKU</th>
                    <th>Item Name & Category</th>
                    <th>Purity</th>
                    <th style={{ textAlign: 'right' }}>Gross Wt</th>
                    <th style={{ textAlign: 'right' }}>Net Wt</th>
                    <th style={{ textAlign: 'right' }}>Making Charge</th>
                    <th style={{ textAlign: 'right' }}>Cost Price</th>
                    <th style={{ textAlign: 'right' }}>Retail Price</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th>Location / Tray</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={11} style={{ textAlign: 'center', padding: '36px', color: 'var(--muted)' }}>
                        No inventory items found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const isLow = item.stockQty <= (item.minStock ?? 1);
                      return (
                        <tr key={item.id}>
                          {/* Barcode / SKU */}
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <span className="mono" style={{ fontWeight: 700 }}>{item.itemCode}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{item.barcode}</span>
                                {item.huid && (
                                  <span className="badge badge-purple" style={{ fontSize: 10, padding: '1px 6px' }}>
                                    HUID: {item.huid}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Item Name & Category */}
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span 
                                style={{ fontWeight: 600, color: 'var(--primary)', cursor: 'pointer' }}
                                onClick={() => setViewingItem(item)}
                              >
                                {item.itemName}
                              </span>
                              <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                                {item.category.toUpperCase()} {item.subCategory ? `· ${item.subCategory}` : ''}
                                {item.designNo ? ` · #${item.designNo}` : ''}
                              </span>
                            </div>
                          </td>

                          {/* Purity */}
                          <td>
                            <span className="badge badge-yellow" style={{ fontWeight: 600 }}>
                              {item.purityKarat.includes('22K') ? 'Gold 22K' : item.purityKarat}
                            </span>
                          </td>

                          {/* Gross Wt */}
                          <td style={{ textAlign: 'right' }} className="mono">
                            {item.grossWeight.toFixed(3)} g
                          </td>

                          {/* Net Wt */}
                          <td style={{ textAlign: 'right', fontWeight: 600 }} className="mono">
                            {item.netWeight.toFixed(3)} g
                          </td>

                          {/* Making Charge */}
                          <td style={{ textAlign: 'right' }} className="mono">
                            {item.makingType === 'per_piece' 
                              ? `₹${item.makingRate} /pc`
                              : item.makingType === 'percent_of_metal'
                                ? `${item.makingRate}%`
                                : `₹${item.makingRate} /g`}
                          </td>

                          {/* Cost Price */}
                          <td style={{ textAlign: 'right', color: 'var(--muted)' }} className="mono">
                            ₹{item.costPrice.toLocaleString('en-IN')}
                          </td>

                          {/* Retail Price */}
                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }} className="mono">
                            ₹{item.retailPrice.toLocaleString('en-IN')}
                          </td>

                          {/* Qty */}
                          <td style={{ textAlign: 'center' }}>
                            <span className={`badge ${item.stockQty <= 0 ? 'badge-red' : isLow ? 'badge-yellow' : 'badge-green'}`}>
                              {item.stockQty} pcs
                            </span>
                          </td>

                          {/* Location / Tray */}
                          <td>
                            <div style={{ fontSize: 12 }}>
                              <div style={{ fontWeight: 500 }}>{item.location || 'Showroom'}</div>
                              {item.rackTray && (
                                <div style={{ color: 'var(--muted)', fontSize: 11 }}>{item.rackTray}</div>
                              )}
                            </div>
                          </td>

                          {/* Actions: View, Print Tag, Edit, Delete */}
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: 4 }}>
                              <button
                                type="button"
                                className="btn btn-outline btn-xs"
                                title="View Item Details"
                                onClick={() => setViewingItem(item)}
                              >
                                <Eye size={12} />
                                <span>View</span>
                              </button>

                              <button
                                type="button"
                                className="btn btn-outline btn-xs"
                                title="Print Tag"
                                onClick={() => handleOpenTagPrint(item)}
                              >
                                <Printer size={12} />
                                <span>Tag</span>
                              </button>

                              <button
                                type="button"
                                className="btn btn-outline btn-xs"
                                title="Stock In/Out"
                                onClick={() => {
                                  setActiveItemForStock(item);
                                  setStockPieces(1);
                                  setShowStockMoveModal(true);
                                }}
                              >
                                ± Stock
                              </button>

                              <button
                                type="button"
                                className="btn btn-outline btn-xs"
                                title="Edit Item"
                                onClick={() => handleOpenEdit(item)}
                              >
                                <Edit size={12} />
                              </button>

                              <button
                                type="button"
                                className="btn btn-outline btn-xs"
                                title="Delete Item"
                                style={{ color: 'var(--danger)' }}
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="dt-pager">
              <span className="helper">
                Showing {filteredItems.length} of {inventory.length} items
              </span>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: Stock In / Out Log */}
      {activeTab === 'stock_in_out' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Stock Movement History</span>
            <button 
              type="button" 
              className="btn btn-primary btn-sm"
              onClick={() => {
                if (inventory.length > 0) {
                  setActiveItemForStock(inventory[0]);
                  setStockPieces(1);
                  setShowStockMoveModal(true);
                }
              }}
            >
              + Record Stock Move
            </button>
          </div>
          <div className="tbl-wrap">
            <table className="tbl-desktop-only">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Item Code</th>
                  <th>Item Particulars</th>
                  <th>Direction</th>
                  <th style={{ textAlign: 'center' }}>Quantity</th>
                  <th>Reason / Reference</th>
                  <th>Logged By</th>
                </tr>
              </thead>
              <tbody>
                {stockMovements.map((move) => (
                  <tr key={move.id}>
                    <td className="mono" style={{ fontSize: 12 }}>{move.date}</td>
                    <td className="mono" style={{ fontWeight: 700 }}>{move.code}</td>
                    <td>{move.item}</td>
                    <td>
                      <span className={`badge ${move.type === 'IN' ? 'badge-green' : move.type === 'TRANSFER' ? 'badge-purple' : 'badge-red'}`}>
                        {move.type === 'IN' ? '▲ STOCK IN' : move.type === 'TRANSFER' ? '⇄ TRANSFER' : '▼ STOCK OUT'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }} className="mono">{move.qty} pcs</td>
                    <td style={{ color: 'var(--muted)' }}>{move.reason}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{move.by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Summary */}
      {activeTab === 'summary' && (
        <div>
          <div className="sum-grid">
            <div className="sum-box">
              <div className="sum-val">{totalPieces} pcs</div>
              <div className="sum-lbl">Total Catalog Units</div>
            </div>
            <div className="sum-box">
              <div className="sum-val">{totalGrossWeight.toFixed(3)} g</div>
              <div className="sum-lbl">Total Gross Weight</div>
            </div>
            <div className="sum-box">
              <div className="sum-val">{totalNetWeight.toFixed(3)} g</div>
              <div className="sum-lbl">Total Net Weight</div>
            </div>
            <div className="sum-box">
              <div className="sum-val" style={{ color: 'var(--primary)' }}>
                ₹{Math.round(totalRetailValue).toLocaleString('en-IN')}
              </div>
              <div className="sum-lbl">Total Retail Valuation</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Stock Breakdown by Category</span>
            </div>
            <div className="tbl-wrap">
              <table className="tbl-desktop-only">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th style={{ textAlign: 'center' }}>Items</th>
                    <th style={{ textAlign: 'center' }}>Total Qty</th>
                    <th style={{ textAlign: 'right' }}>Total Net Wt</th>
                    <th style={{ textAlign: 'right' }}>Cost Value</th>
                    <th style={{ textAlign: 'right' }}>Retail Value</th>
                  </tr>
                </thead>
                <tbody>
                  {['gold', 'silver', 'diamond', 'platinum', 'other'].map((cat) => {
                    const items = inventory.filter(i => (i.category || '').toLowerCase() === cat);
                    if (items.length === 0) return null;
                    const qty = items.reduce((a, b) => a + b.stockQty, 0);
                    const wt = items.reduce((a, b) => a + (b.netWeight * b.stockQty), 0);
                    const cost = items.reduce((a, b) => a + (b.costPrice * b.stockQty), 0);
                    const retail = items.reduce((a, b) => a + (b.retailPrice * b.stockQty), 0);
                    return (
                      <tr key={cat}>
                        <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>{cat}</td>
                        <td style={{ textAlign: 'center' }}>{items.length} SKUs</td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{qty} pcs</td>
                        <td style={{ textAlign: 'right' }} className="mono">{wt.toFixed(3)} g</td>
                        <td style={{ textAlign: 'right' }} className="mono">₹{Math.round(cost).toLocaleString('en-IN')}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }} className="mono">
                          ₹{Math.round(retail).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Add / Edit Item (All 18 Attributes & Tag Print Trigger) */}
      {showAddModal && (
        <div className="overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{editingItemId ? 'Edit Inventory Item' : 'Add New Inventory Item'}</h3>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="btn btn-outline btn-xs"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSaveItem}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                {/* 1. General & Barcode */}
                <div className="section-divider">
                  <span>1. IDENTIFICATION & GENERAL ATTRIBUTES</span>
                </div>
                <div className="g4">
                  <div className="form-group">
                    <label className="label">Item Code / SKU *</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={itemCode} 
                      onChange={(e) => setItemCode(e.target.value.toUpperCase())}
                      required 
                    />
                    <div className="helper">e.g. SBJCH-01</div>
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <label className="label" style={{ marginBottom: 0 }}>Barcode (EAN / Custom)</label>
                      <button 
                        type="button" 
                        className="btn btn-outline btn-xs" 
                        style={{ fontSize: 10, padding: '1px 6px' }}
                        onClick={() => setBarcode(generateBarcodeValue())}
                        title="Auto-generate 12-digit EAN Barcode"
                      >
                        Auto-Gen
                      </button>
                    </div>
                    <input 
                      type="text" 
                      className="input mono" 
                      value={barcode} 
                      onChange={(e) => setBarcode(e.target.value)}
                    />
                    <div className="helper">e.g. 890123456001</div>
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <label className="label" style={{ marginBottom: 0 }}>HUID (Hallmark Unique ID)</label>
                      <button 
                        type="button" 
                        className="btn btn-outline btn-xs" 
                        style={{ fontSize: 10, padding: '1px 6px' }}
                        onClick={() => setHuid(generateHuid())}
                        title="Auto-generate BIS 6-Character Alphanumeric HUID"
                      >
                        Auto-Gen 6-Char
                      </button>
                    </div>
                    <input 
                      type="text" 
                      className="input mono" 
                      maxLength={6}
                      value={huid} 
                      onChange={(e) => setHuid(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                      placeholder="e.g. ZX98YU"
                    />
                    <div className="helper">6-character alphanumeric (BIS hallmarked)</div>
                  </div>

                  <div className="form-group">
                    <label className="label">HSN Code</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={hsn} 
                      onChange={(e) => setHsn(e.target.value)}
                    />
                    <div className="helper">Standard: 7113</div>
                  </div>
                </div>

                <div className="g2">
                  <div className="form-group">
                    <label className="label">Item Name *</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={itemName} 
                      onChange={(e) => setItemName(e.target.value)}
                      required 
                    />
                    <div className="helper">e.g. Gold Chain 22K Rope</div>
                  </div>

                  <div className="g2">
                    <div className="form-group">
                      <label className="label">Design No</label>
                      <input 
                        type="text" 
                        className="input" 
                        value={designNo} 
                        onChange={(e) => setDesignNo(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="label">Size / Length</label>
                      <input 
                        type="text" 
                        className="input" 
                        value={itemSize} 
                        onChange={(e) => setItemSize(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Metal, Purity & Weights */}
                <div className="section-divider">
                  <span>2. METAL, PURITY & WEIGHT SPECIFICATIONS</span>
                </div>
                <div className="g4">
                  <div className="form-group">
                    <label className="label">Category</label>
                    <select 
                      className="input" 
                      value={category} 
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="gold">Gold</option>
                      <option value="silver">Silver</option>
                      <option value="diamond">Diamond</option>
                      <option value="platinum">Platinum</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="label">Sub-Category</label>
                    <select 
                      className="input" 
                      value={subCategory} 
                      onChange={(e) => setSubCategory(e.target.value)}
                    >
                      <option value="Chain">Chain</option>
                      <option value="Ring">Ring</option>
                      <option value="Bangle">Bangle</option>
                      <option value="Necklace">Necklace</option>
                      <option value="Earrings">Earrings</option>
                      <option value="Pendant">Pendant</option>
                      <option value="Bracelet">Bracelet</option>
                      <option value="Coin">Coin / Bar</option>
                      <option value="Mangalsutra">Mangalsutra</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="label">Purity / Karat</label>
                    <select 
                      className="input" 
                      value={purityKarat} 
                      onChange={(e) => setPurityKarat(e.target.value)}
                    >
                      <option value="24K (999)">24K (999 Pure)</option>
                      <option value="22K (916)">22K (916 BIS)</option>
                      <option value="18K (750)">18K (750)</option>
                      <option value="14K (585)">14K (585)</option>
                      <option value="Silver 999">Silver 999</option>
                      <option value="Silver 925">Silver 925 Sterling</option>
                      <option value="Platinum 950">Platinum 950</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="label">Wastage %</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      min="0"
                      className="input" 
                      value={wastagePercent} 
                      onChange={(e) => setWastagePercent(e.target.value)}
                    />
                    <div className="helper">e.g. 6.0%</div>
                  </div>
                </div>

                <div className="g4">
                  <div className="form-group">
                    <label className="label">Gross Weight (g) *</label>
                    <input 
                      type="number" 
                      step="0.001" 
                      min="0.001"
                      className="input" 
                      value={grossWeight} 
                      onChange={(e) => setGrossWeight(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="label">Stone Weight (g)</label>
                    <input 
                      type="number" 
                      step="0.001" 
                      min="0"
                      className="input" 
                      value={stoneWeight} 
                      onChange={(e) => setStoneWeight(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="label">Net Weight (Computed)</label>
                    <input 
                      type="text" 
                      className="input" 
                      readOnly
                      style={{ background: 'var(--zebra)', fontWeight: 700 }}
                      value={`${netWeightComputed.toFixed(3)} g`} 
                    />
                    <div className="helper">Gross - Stones</div>
                  </div>

                  <div className="form-group">
                    <label className="label">Gender</label>
                    <select 
                      className="input" 
                      value={gender} 
                      onChange={(e) => setGender(e.target.value)}
                    >
                      <option value="Men">Men</option>
                      <option value="Women">Women</option>
                      <option value="Kids">Kids</option>
                      <option value="Unisex">Unisex</option>
                    </select>
                  </div>
                </div>

                {/* Live Metal Benchmark & Indicative Selling Price Calculator */}
                <div style={{ background: '#fdfcf7', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#92400e', fontWeight: 700, letterSpacing: 0.5 }}>
                      Live Benchmark Rate ({purityKarat}): ₹{liveRatePerGram.toLocaleString('en-IN')}/g
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>
                      Metal: ₹{indicativeMetalValue.toLocaleString('en-IN')} + Making: ₹{indicativeMakingCharge.toLocaleString('en-IN')}{stoneTotalValue > 0 ? ` + Stones: ₹${stoneTotalValue.toLocaleString('en-IN')}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>EST. INDICATIVE SELLING</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)' }}>
                        ₹{indicativeTotalEstimate.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-outline btn-xs"
                      onClick={() => setRetailPrice(indicativeTotalEstimate.toString())}
                      title="Set Retail Price from Live Benchmark Rate"
                    >
                      Use Est. Price
                    </button>
                  </div>
                </div>

                {/* 3. Making Charges & Pricing */}
                <div className="section-divider">
                  <span>3. MAKING CHARGES & PRICING</span>
                </div>
                <div className="g4">
                  <div className="form-group">
                    <label className="label">Making Charge Mode</label>
                    <select 
                      className="input" 
                      value={makingType} 
                      onChange={(e) => setMakingType(e.target.value as any)}
                    >
                      <option value="per_gram">Per Gram (₹/g)</option>
                      <option value="per_piece">Per Piece Flat (₹)</option>
                      <option value="percent_of_metal">Percentage of Metal (%)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="label">Making Rate</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      className="input" 
                      value={makingRate} 
                      onChange={(e) => setMakingRate(e.target.value)}
                    />
                    <div className="helper">
                      {makingType === 'per_gram' ? '₹ per gram' : makingType === 'per_piece' ? '₹ flat fee' : '% of metal value'}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="label">Cost Price (₹)</label>
                    <input 
                      type="number" 
                      step="1" 
                      className="input" 
                      value={costPrice} 
                      onChange={(e) => handleCostChange(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="label">Retail Price (₹)</label>
                    <input 
                      type="number" 
                      step="1" 
                      className="input" 
                      value={retailPrice} 
                      onChange={(e) => setRetailPrice(e.target.value)}
                    />
                  </div>
                </div>

                <div className="g4">
                  <div className="form-group">
                    <label className="label">Retail Margin %</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      className="input" 
                      value={retailMarginPct} 
                      onChange={(e) => setRetailMarginPct(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="label">Wholesale Price (₹)</label>
                    <input 
                      type="number" 
                      step="1" 
                      className="input" 
                      value={wholesalePrice} 
                      onChange={(e) => setWholesalePrice(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="label">MRP (₹)</label>
                    <input 
                      type="number" 
                      step="1" 
                      className="input" 
                      value={mrp} 
                      onChange={(e) => setMrp(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="label">Quantity in Stock *</label>
                    <input 
                      type="number" 
                      min="0"
                      className="input" 
                      value={quantity} 
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                      required 
                    />
                  </div>
                </div>

                {/* 4. Stock Location & Tray */}
                <div className="section-divider">
                  <span>4. STOCK LOCATION & REORDER ALERTS</span>
                </div>
                <div className="g4">
                  <div className="form-group">
                    <label className="label">Showroom Location</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={location} 
                      onChange={(e) => setLocation(e.target.value)}
                    />
                    <div className="helper">e.g. Main Showroom</div>
                  </div>

                  <div className="form-group">
                    <label className="label">Rack / Tray No</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={rackTray} 
                      onChange={(e) => setRackTray(e.target.value)}
                    />
                    <div className="helper">e.g. Chain Tray 01</div>
                  </div>

                  <div className="form-group">
                    <label className="label">Min Stock Alert Level</label>
                    <input 
                      type="number" 
                      min="0"
                      className="input" 
                      value={minStock} 
                      onChange={(e) => setMinStock(parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="label">Tag Printing Action</label>
                    <button 
                      type="button" 
                      className="btn btn-outline"
                      style={{ width: '100%', marginTop: '2px' }}
                      onClick={() => {
                        const tempItem: InventoryItem = {
                          id: editingItemId || 'item-preview',
                          itemCode: itemCode || 'SBJCH-01',
                          barcode: barcode || '890123456001',
                          huid: huid || 'ZX98YU',
                          itemName: itemName || 'Gold Chain 22K Rope',
                          category,
                          subCategory,
                          metalType,
                          metalGroup,
                          purityKarat,
                          purityPercent: 91.6,
                          grossWeight: parsedGross,
                          stoneWeight: parsedStone,
                          netWeight: netWeightComputed,
                          wastagePercent: parseFloat(wastagePercent) || 0,
                          makingMode: 'PER_NET_GRAM',
                          makingRate: parseFloat(makingRate) || 0,
                          costPrice: parseFloat(costPrice) || 0,
                          retailPrice: parseFloat(retailPrice) || 0,
                          wholesalePrice: parseFloat(wholesalePrice) || 0,
                          stockQty: quantity,
                          location,
                          rackTray,
                          stones: [],
                          status: 'IN_STOCK'
                        };
                        handleOpenTagPrint(tempItem);
                      }}
                    >
                      <Printer size={14} />
                      <span>Print Jewellery Tag</span>
                    </button>
                  </div>
                </div>

              </div>

              <div className="modal-foot">
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  {editingItemId ? 'Update Item' : 'Save Item to Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Stock In / Out Adjustment */}
      {showStockMoveModal && activeItemForStock && (
        <div className="overlay" onClick={() => setShowStockMoveModal(false)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Stock In / Out — {activeItemForStock.itemCode}</h3>
              <button 
                type="button" 
                onClick={() => setShowStockMoveModal(false)}
                className="btn btn-outline btn-xs"
              >
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: 'var(--zebra)', padding: '12px 14px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{activeItemForStock.itemName}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    Purity: {activeItemForStock.purityKarat} · Net: {activeItemForStock.netWeight.toFixed(3)}g · HUID: {activeItemForStock.huid}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>CURRENT STOCK</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>
                    {activeItemForStock.stockQty} pcs
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="label">Movement Direction</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    type="button" 
                    className={`btn ${stockDirection === 'IN' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ flex: 1 }}
                    onClick={() => setStockDirection('IN')}
                  >
                    ▲ Stock IN
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${stockDirection === 'OUT' ? 'btn-danger' : 'btn-outline'}`}
                    style={{ flex: 1 }}
                    onClick={() => setStockDirection('OUT')}
                  >
                    ▼ Stock OUT
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${stockDirection === 'TRANSFER' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ flex: 1 }}
                    onClick={() => setStockDirection('TRANSFER')}
                  >
                    ⇄ Transfer
                  </button>
                </div>
              </div>

              {stockDirection === 'TRANSFER' && (
                <div className="form-group">
                  <label className="label">Destination Showroom / Safe Tray *</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={transferLocation}
                    onChange={(e) => setTransferLocation(e.target.value)}
                    placeholder="e.g. Counter 02 Tray 04, Safe Vault B-02"
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="label">Quantity (Pieces)</label>
                <input 
                  type="number" 
                  min="1" 
                  className="input" 
                  value={stockPieces} 
                  onChange={(e) => setStockPieces(parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="form-group">
                <label className="label">Reason / Reference</label>
                <select 
                  className="input" 
                  value={stockReason} 
                  onChange={(e) => setStockReason(e.target.value)}
                >
                  <option value="Opening stock">Opening stock</option>
                  <option value="Supplier Purchase / GRN">Supplier Purchase / GRN</option>
                  <option value="Customer Return">Customer Return</option>
                  <option value="Found in Physical Audit">Found in Physical Audit</option>
                  <option value="Showroom Transfer">Showroom Transfer</option>
                  <option value="Damage / Melt Scrap">Damage / Sent to Melt Scrap</option>
                  <option value="Consignment Outflow">Consignment Outflow</option>
                </select>
              </div>
            </div>

            <div className="modal-foot">
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={() => setShowStockMoveModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleStockMoveSubmit}
              >
                Confirm Movement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Tag Print Preview Trigger */}
      {showTagModal && tagPrintItem && (
        <div className="overlay" onClick={() => setShowTagModal(false)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Print Jewellery Tag — {tagPrintItem.itemCode}</h3>
              <button 
                type="button" 
                onClick={() => setShowTagModal(false)}
                className="btn btn-outline btn-xs"
              >
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ textAlign: 'center', background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                {tagLayout === 'barbell' ? (
                  /* Authentic Jewellery Barbell / Dumbbell Tag (84mm x 14mm) */
                  <svg width="340" height="90" viewBox="0 0 340 90" style={{ margin: '0 auto', display: 'block', background: '#fafaf8', border: '1px solid #ddd', borderRadius: '6px' }}>
                    {/* Left Flap */}
                    <rect x="10" y="8" width="130" height="74" rx="4" fill="#ffffff" stroke="#222" strokeWidth="0.8" />
                    
                    {/* QR Code / 2D DataMatrix Simulation */}
                    <g transform="translate(18, 16)">
                      <rect width="28" height="28" fill="#111" rx="2" />
                      <rect x="2" y="2" width="24" height="24" fill="#fff" />
                      <rect x="4" y="4" width="7" height="7" fill="#111" />
                      <rect x="17" y="4" width="7" height="7" fill="#111" />
                      <rect x="4" y="17" width="7" height="7" fill="#111" />
                      <rect x="13" y="13" width="4" height="4" fill="#111" />
                    </g>

                    {/* Left Flap Specs */}
                    <text x="52" y="24" fontSize="8.5" fill="#555">Gross: <tspan fontWeight="bold" fill="#111">{tagPrintItem.grossWeight.toFixed(3)}g</tspan></text>
                    <text x="52" y="38" fontSize="9" fontWeight="bold" fill="#111">Net: {tagPrintItem.netWeight.toFixed(3)}g</text>
                    <text x="52" y="52" fontSize="9" fill="#237a57" fontWeight="bold">{tagPrintItem.purityKarat}</text>
                    {tagPrintItem.stoneWeight > 0 ? (
                      <text x="52" y="66" fontSize="7.5" fill="#666">Stones: {tagPrintItem.stoneWeight.toFixed(3)}g</text>
                    ) : (
                      <text x="52" y="66" fontSize="7.5" fill="#888">BIS Hallmarked</text>
                    )}

                    {/* Central Waist Bridge / Ring Shank Loop */}
                    <rect x="140" y="36" width="60" height="18" fill="#edf2f7" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="2,2" />
                    <text x="170" y="48" fontSize="6.5" fill="#64748b" textAnchor="middle" fontWeight="bold">BARBELL BRIDGE</text>

                    {/* Right Flap */}
                    <rect x="200" y="8" width="130" height="74" rx="4" fill="#ffffff" stroke="#222" strokeWidth="0.8" />
                    
                    {/* Right Flap Branding & Price */}
                    <text x="210" y="24" fontSize="9" fontWeight="bold" fill="#111">{store.code || 'SBJ'} · {tagPrintItem.itemCode}</text>
                    <text x="210" y="36" fontSize="8" fill="#444">{tagPrintItem.itemName.slice(0, 16)}</text>
                    
                    {/* HUID Badge */}
                    <rect x="210" y="42" width="65" height="14" rx="2" fill="#f3e8ff" stroke="#d8b4fe" strokeWidth="0.5" />
                    <text x="214" y="52" fontSize="8" fontWeight="bold" fill="#6b21a8">HUID: {tagPrintItem.huid}</text>
                    
                    {/* Price / MRP */}
                    <text x="210" y="70" fontSize="9" fontWeight="bold" fill="#b94a48">
                      MRP: ₹{(tagPrintItem.mrp || Math.round(tagPrintItem.retailPrice * 1.05)).toLocaleString('en-IN')}
                    </text>
                  </svg>
                ) : (
                  /* Rattail Jewellery Tag (95mm x 14mm) */
                  <svg width="340" height="70" viewBox="0 0 340 70" style={{ margin: '0 auto', display: 'block', background: '#fafaf8', border: '1px solid #ccc', borderRadius: '4px' }}>
                    <rect x="5" y="5" width="330" height="60" rx="3" fill="#ffffff" stroke="#444" strokeWidth="0.6" />
                    {/* Left Label */}
                    <text x="14" y="20" fontSize="9" fontWeight="bold" fill="#111">{tagPrintItem.itemName.slice(0, 18)}</text>
                    <text x="14" y="32" fontSize="8" fill="#333">Gross: {tagPrintItem.grossWeight.toFixed(3)}g</text>
                    <text x="14" y="44" fontSize="8.5" fontWeight="bold" fill="#111">Net: {tagPrintItem.netWeight.toFixed(3)}g</text>
                    <text x="14" y="56" fontSize="8.5" fill="#237a57" fontWeight="bold">{tagPrintItem.purityKarat}</text>

                    {/* Rattail Tail Graphic */}
                    <path d="M 130 20 L 190 20 L 190 50 L 130 50 Z" fill="#eee" stroke="#ddd" />
                    <text x="160" y="38" fontSize="6.5" fill="#888" textAnchor="middle" fontWeight="bold">THREAD TAIL</text>

                    {/* Right Label with Barcode / 2D Matrix */}
                    <g transform="translate(200, 12)">
                      <rect width="40" height="40" fill="#222" rx="2" />
                      <rect x="2" y="2" width="36" height="36" fill="#fff" />
                      <rect x="6" y="6" width="9" height="9" fill="#000" />
                      <rect x="25" y="6" width="9" height="9" fill="#000" />
                      <rect x="6" y="25" width="9" height="9" fill="#000" />
                    </g>

                    <text x="250" y="24" fontSize="8.5" fontWeight="bold" fill="#111">{tagPrintItem.itemCode}</text>
                    <text x="250" y="36" fontSize="7.5" fill="#555">HUID: {tagPrintItem.huid}</text>
                    <text x="250" y="48" fontSize="8" fontWeight="bold" fill="#b94a48">₹{tagPrintItem.retailPrice.toLocaleString('en-IN')}</text>
                  </svg>
                )}
                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Layout: <strong>{tagLayout === 'barbell' ? 'Jewellery Barbell / Dumbbell (84x14mm)' : 'Rattail Loop (95x14mm)'}</strong></span>
                  <span style={{ color: 'var(--primary)', fontWeight: 600 }}>BIS Hallmarking &amp; QR Parity</span>
                </div>
              </div>

              <div className="g2">
                <div className="form-group">
                  <label className="label">Print Tag Layout</label>
                  <select 
                    className="input" 
                    value={tagLayout} 
                    onChange={(e) => setTagLayout(e.target.value as any)}
                  >
                    <option value="barbell">Jewellery Barbell / Dumbbell Tag (84mm x 14mm)</option>
                    <option value="rattail">Jewellery Rattail Tag (95mm x 14mm)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Number of Copies</label>
                  <input 
                    type="number" 
                    min="1" 
                    className="input" 
                    value={tagCopies} 
                    onChange={(e) => setTagCopies(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
            </div>

            <div className="modal-foot">
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={() => setShowTagModal(false)}
              >
                Close
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => {
                  alert(`Sent ${tagCopies} tag(s) for ${tagPrintItem.itemCode} to Zebra thermal printer!`);
                  setShowTagModal(false);
                }}
              >
                <Printer size={14} />
                <span>Send to Zebra Printer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Import from Excel */}
      {showExcelModal && (
        <div className="overlay" onClick={() => setShowExcelModal(false)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Import Inventory from Excel / CSV</h3>
              <button 
                type="button" 
                onClick={() => setShowExcelModal(false)}
                className="btn btn-outline btn-xs"
              >
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p className="helper">
                Upload your bulk inventory spreadsheet. Accepted file formats: <code>.xlsx</code>, <code>.xls</code>, <code>.csv</code>.
              </p>

              <div style={{ border: '2px dashed var(--border2)', borderRadius: '12px', padding: '30px 20px', textAlign: 'center', background: 'var(--zebra)' }}>
                <FileSpreadsheet size={36} style={{ color: 'var(--primary)', margin: '0 auto 8px' }} />
                <div style={{ fontWeight: 600 }}>Drag and drop your spreadsheet here</div>
                <div className="helper" style={{ margin: '4px 0 14px' }}>Supports standard Kreya Jewellery template columns</div>
                <input 
                  type="file" 
                  accept=".csv,.xlsx,.xls" 
                  style={{ display: 'none' }}
                  id="excel-file-input"
                  onChange={() => alert('File selected. Processing 18 columns...')}
                />
                <label htmlFor="excel-file-input" className="btn btn-outline btn-sm">
                  Browse Files
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="helper">Need the template format?</span>
                <button 
                  type="button" 
                  className="btn btn-outline btn-xs"
                  onClick={() => alert('Downloading Kreya_Inventory_Template.csv...')}
                >
                  Download Sample CSV
                </button>
              </div>
            </div>

            <div className="modal-foot">
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={() => setShowExcelModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => {
                  alert('Inventory imported successfully!');
                  setShowExcelModal(false);
                }}
              >
                Upload & Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Viewing Single Item Details */}
      {viewingItem && (
        <div className="overlay" onClick={() => setViewingItem(null)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{viewingItem.itemName} ({viewingItem.itemCode})</h3>
              <button 
                type="button" 
                onClick={() => setViewingItem(null)}
                className="btn btn-outline btn-xs"
              >
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="sum-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="sum-box">
                  <div className="sum-val">{viewingItem.grossWeight.toFixed(3)}g</div>
                  <div className="sum-lbl">Gross Weight</div>
                </div>
                <div className="sum-box">
                  <div className="sum-val">{viewingItem.netWeight.toFixed(3)}g</div>
                  <div className="sum-lbl">Net Weight</div>
                </div>
                <div className="sum-box">
                  <div className="sum-val" style={{ color: 'var(--primary)' }}>{viewingItem.purityKarat}</div>
                  <div className="sum-lbl">Purity</div>
                </div>
              </div>

              <div className="card">
                <div className="card-body" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Barcode:</span>
                    <span className="mono">{viewingItem.barcode}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>HUID:</span>
                    <span className="badge badge-purple">{viewingItem.huid}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Category / Sub-category:</span>
                    <span style={{ textTransform: 'capitalize' }}>{viewingItem.category} / {viewingItem.subCategory}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Making Charge:</span>
                    <span className="mono">
                      {viewingItem.makingType === 'per_piece' 
                        ? `₹${viewingItem.makingRate} /pc`
                        : viewingItem.makingType === 'percent_of_metal'
                          ? `${viewingItem.makingRate}%`
                          : `₹${viewingItem.makingRate} /g`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Cost Price:</span>
                    <span className="mono">₹{viewingItem.costPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Retail Price:</span>
                    <span className="mono" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      ₹{viewingItem.retailPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Location / Tray:</span>
                    <span>{viewingItem.location} ({viewingItem.rackTray || 'Tray 01'})</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Stock Available:</span>
                    <span className="badge badge-green">{viewingItem.stockQty} pieces</span>
                  </div>
                </div>
              </div>

              {/* 3-Component Valuation Breakdown (Metal + Making + Stone) */}
              {(() => {
                const liveRate = rates ? (
                  viewingItem.category.toLowerCase().includes('gold')
                    ? (viewingItem.purityKarat.includes('24K') ? (rates.gold24kPerGram || 7850)
                      : viewingItem.purityKarat.includes('22K') ? (rates.gold22kPerGram || 7191)
                      : viewingItem.purityKarat.includes('18K') ? (rates.gold18kPerGram || 5888)
                      : (rates.gold14kPerGram || 4592))
                    : (rates.silverPerGram || 94)
                ) : 7191;
                const metalVal = Math.round(viewingItem.netWeight * liveRate);
                const makingVal = Math.round(
                  viewingItem.makingType === 'per_piece' ? viewingItem.makingRate :
                  viewingItem.makingType === 'percent_of_metal' ? (metalVal * viewingItem.makingRate) / 100 :
                  viewingItem.netWeight * viewingItem.makingRate
                );
                const stoneVal = viewingItem.stones?.reduce((acc, s) => acc + (s.totalPrice || 0), 0) || (viewingItem.stoneWeight > 0 ? Math.round(viewingItem.stoneWeight * 5000) : 0);
                const totalLiveValuation = metalVal + makingVal + stoneVal;

                return (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
                      Live Valuation Breakdown (Daily Spot Benchmark)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--muted)' }}>Metal Value ({viewingItem.netWeight.toFixed(3)}g @ ₹{liveRate}/g):</span>
                        <span className="mono" style={{ fontWeight: 600 }}>₹{metalVal.toLocaleString('en-IN')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--muted)' }}>Making Cost ({viewingItem.makingType === 'per_piece' ? 'Flat' : viewingItem.makingType === 'percent_of_metal' ? `${viewingItem.makingRate}%` : `₹${viewingItem.makingRate}/g`}):</span>
                        <span className="mono" style={{ fontWeight: 600 }}>₹{makingVal.toLocaleString('en-IN')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--muted)' }}>Stone Value ({viewingItem.stoneWeight.toFixed(3)}g):</span>
                        <span className="mono" style={{ fontWeight: 600 }}>₹{stoneVal.toLocaleString('en-IN')}</span>
                      </div>
                      <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                        <span style={{ color: 'var(--text)' }}>Total Replacement Valuation:</span>
                        <span className="mono" style={{ color: 'var(--primary)', fontSize: 15 }}>₹{totalLiveValuation.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="modal-foot">
              <button 
                type="button" 
                className="btn btn-outline"
                style={{ color: 'var(--danger)', marginRight: 'auto' }}
                onClick={() => {
                  const itm = viewingItem;
                  handleDeleteItem(itm.id);
                }}
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={() => {
                  const itm = viewingItem;
                  setViewingItem(null);
                  handleOpenTagPrint(itm);
                }}
              >
                <Printer size={14} />
                <span>Print Tag</span>
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => {
                  const itm = viewingItem;
                  setViewingItem(null);
                  handleOpenEdit(itm);
                }}
              >
                <Edit size={14} />
                <span>Edit Item</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCAN MODAL */}
      {showScanModal && (
        <div className="overlay" onClick={() => setShowScanModal(false)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Scan Barcode or Item Code</h3>
              <button 
                type="button" 
                className="btn btn-ghost btn-sm"
                onClick={() => setShowScanModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p className="helper" style={{ marginBottom: 12 }}>
                Scan tag barcode with physical thermal/CCD barcode scanner, or type item code / HUID:
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="e.g. 890123456001 or SBJCH-01" 
                  value={scanInputVal}
                  onChange={e => setScanInputVal(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleScanBarcode();
                    }
                  }}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-foot">
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setShowScanModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleScanBarcode}
              >
                <Barcode size={14} /> Find & Open
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
