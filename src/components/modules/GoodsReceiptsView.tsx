import React, { useState, useMemo } from 'react';
import { 
  Truck, Plus, Search, Filter, Calendar, Eye, 
  CheckCircle2, AlertCircle, X, Download, Printer, 
  Trash2, ChevronRight, ShoppingBag, Receipt, CreditCard, 
  Building2, ArrowRight, RotateCcw, Tag, Scale, Sparkles, 
  Check, ShieldAlert, ShieldCheck, QrCode
} from 'lucide-react';
import { 
  Supplier, PurchaseOrder, GoodsReceipt, GoodsReceiptLine, 
  SupplierBill 
} from '../../types';

interface GoodsReceiptsViewProps {
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  goodsReceipts: GoodsReceipt[];
  supplierBills?: SupplierBill[];
  onAddGRN?: (grn: GoodsReceipt) => void;
  onAddBill?: (bill: SupplierBill) => void;
  onNavigate?: (tab: string, id?: string) => void;
}

const DEFAULT_SAMPLE_GRNS: GoodsReceipt[] = [
  {
    id: "grn-0001",
    grnNumber: "GRN-2026-00001",
    poNumber: "PO-2026-00001",
    poId: "po-0001",
    supplierName: "Rajesh Bullion Refinery Ltd",
    supplierId: "sup-004",
    receiptDate: "2026-11-04",
    challanNo: "DC/RBR/2026/089",
    receivedPieces: 1,
    receivedGrossWeight: 100.000,
    receivedNetWeight: 100.000,
    hallmarkedPurity: "24K (999.9)",
    inspectedBy: "Admin (Shop Owner)",
    status: "POSTED",
    billedPieces: 1,
    stockValue: 785000.00,
    notes: "100g 24K casting gold grain bar confirmed. Calibrated precision scale reading 100.000g verified. Assay report #AR-999-041 certifies 99.98% Au. Barcode tag AU24-BAR-00001 assigned to Vault Drawer G-01.",
    lines: [
      {
        id: "grnl-0001",
        poLineId: "pol-0001",
        description: "24K Casting Gold Grain Bar (999.9 Pure)",
        metalType: "gold",
        purity: "24K (999.9)",
        category: "Bullion",
        receivedQty: 1,
        acceptedQty: 1,
        rejectedQty: 0,
        grossWeight: 100.000,
        netWeight: 100.000,
        stoneWeight: 0,
        expectedNetWeight: 100.000,
        toleranceOk: true,
        scaleReading: 100.000,
        stockMode: "single_code",
        costPerPiece: 785000.00,
        retailMarginPct: 2,
        wholesaleMarginPct: 0.5,
        retailRate: 800700.00,
        wholesaleRate: 788925.00,
        billedQty: 1,
        assayPurity: "99.98% Au (Refinery Assay Cert #AR-999-041)",
        generatedTags: ["AU24-BAR-00001"]
      }
    ],
    generatedBarcodes: [
      { pieceNo: 1, barcode: "AU24-BAR-00001", itemCode: "BLN-24K-100G", huid: "9999AU", purity: "24K (999.9)", netWeight: 100.000, spoolStatus: "Spooling Ready" }
    ]
  },
  {
    id: "grn-001",
    grnNumber: "GRN-2026-00024",
    poNumber: "PO-2026-00018",
    poId: "po-002",
    supplierName: "Rajkot Fine Chains Pvt. Ltd.",
    supplierId: "sup-002",
    receiptDate: "2026-11-06",
    challanNo: "DC/RAJ/8941",
    receivedPieces: 12,
    receivedGrossWeight: 64.200,
    receivedNetWeight: 64.200,
    hallmarkedPurity: "22K (916)",
    inspectedBy: "Admin (Shop Owner)",
    status: "POSTED",
    billedPieces: 12,
    stockValue: 502044.00,
    notes: "Batch 1 inward from PO-2026-00018. All pieces hallmarked with BIS HUID.",
    lines: [
      {
        id: "grnl-1",
        poLineId: "pol-3",
        description: "22K Hollow Rope Chain 20 inches",
        metalType: "gold",
        purity: "22K (916)",
        category: "Chain",
        receivedQty: 12,
        acceptedQty: 12,
        rejectedQty: 0,
        grossWeight: 64.200,
        netWeight: 64.200,
        stoneWeight: 0,
        expectedNetWeight: 64.180,
        toleranceOk: true,
        stockMode: "tag_per_piece",
        costPerPiece: 41837.00,
        retailMarginPct: 15,
        wholesaleMarginPct: 6,
        retailRate: 48112.55,
        wholesaleRate: 44347.22,
        billedQty: 12,
        assayPurity: "91.68% Au",
        generatedTags: ["G22-00481", "G22-00482", "G22-00483", "G22-00484"]
      }
    ],
    generatedBarcodes: [
      { pieceNo: 1, barcode: "G22-00481", itemCode: "CHN-22K-481", huid: "8K9P2X", purity: "22K (916)", netWeight: 5.350, spoolStatus: "Spooling Ready" },
      { pieceNo: 2, barcode: "G22-00482", itemCode: "CHN-22K-482", huid: "8K9P2Y", purity: "22K (916)", netWeight: 5.340, spoolStatus: "Spooling Ready" },
      { pieceNo: 3, barcode: "G22-00483", itemCode: "CHN-22K-483", huid: "8K9P2Z", purity: "22K (916)", netWeight: 5.360, spoolStatus: "Spooling Ready" },
      { pieceNo: 4, barcode: "G22-00484", itemCode: "CHN-22K-484", huid: "8K9P3A", purity: "22K (916)", netWeight: 5.350, spoolStatus: "Spooling Ready" }
    ]
  },
  {
    id: "grn-002",
    grnNumber: "GRN-2026-00025",
    poNumber: "PO-2026-00017",
    poId: "po-003",
    supplierName: "Surat Diamond Cutters",
    supplierId: "sup-003",
    receiptDate: "2026-11-08",
    challanNo: "DC/SDC/1102",
    receivedPieces: 5,
    receivedGrossWeight: 15.200,
    receivedNetWeight: 13.800,
    hallmarkedPurity: "18K (750)",
    inspectedBy: "Admin (Shop Owner)",
    status: "POSTED",
    billedPieces: 5,
    stockValue: 530000.00,
    notes: "Solitaire rings inward with IGI diamond certificates.",
    lines: [
      {
        id: "grnl-2",
        poLineId: "pol-4",
        description: "18K White Gold Solitaire Diamond Ring (VVS-EF)",
        metalType: "gold",
        purity: "18K (750)",
        category: "Ring",
        receivedQty: 5,
        acceptedQty: 5,
        rejectedQty: 0,
        grossWeight: 15.200,
        netWeight: 13.800,
        stoneWeight: 1.400,
        expectedNetWeight: 13.800,
        toleranceOk: true,
        stockMode: "tag_per_piece",
        costPerPiece: 106000.00,
        retailMarginPct: 25,
        wholesaleMarginPct: 10,
        retailRate: 132500.00,
        wholesaleRate: 116600.00,
        billedQty: 5,
        assayPurity: "75.12% Au",
        generatedTags: ["D18-00101", "D18-00102", "D18-00103"]
      }
    ],
    generatedBarcodes: [
      { pieceNo: 1, barcode: "D18-00101", itemCode: "RNG-DIA-101", huid: "9M4T1A", purity: "18K (750)", netWeight: 2.760, spoolStatus: "Spooling Ready" },
      { pieceNo: 2, barcode: "D18-00102", itemCode: "RNG-DIA-102", huid: "9M4T1B", purity: "18K (750)", netWeight: 2.750, spoolStatus: "Spooling Ready" }
    ]
  },
  {
    id: "grn-003",
    grnNumber: "GRN-2026-00026",
    poNumber: "",
    supplierName: "Surat Gold Works Ltd.",
    supplierId: "sup-001",
    receiptDate: "2026-11-12",
    challanNo: "DC/SGW/7721",
    receivedPieces: 8,
    receivedGrossWeight: 80.500,
    receivedNetWeight: 80.500,
    hallmarkedPurity: "24K (999)",
    inspectedBy: "Admin",
    status: "POSTED",
    billedPieces: 0,
    stockValue: 680225.00,
    notes: "Direct bullion intake without PO. Fine gold minted coins.",
    lines: [
      {
        id: "grnl-3",
        description: "24K Minted Gold Coins 10g (999)",
        metalType: "gold",
        purity: "24K (999)",
        category: "Coins",
        receivedQty: 8,
        acceptedQty: 8,
        rejectedQty: 0,
        grossWeight: 80.500,
        netWeight: 80.500,
        stoneWeight: 0,
        toleranceOk: true,
        stockMode: "single_code",
        costPerPiece: 85028.00,
        retailMarginPct: 5,
        wholesaleMarginPct: 2,
        retailRate: 89279.40,
        wholesaleRate: 86728.56,
        billedQty: 0,
        assayPurity: "99.92% Au"
      }
    ]
  }
];

export const GoodsReceiptsView: React.FC<GoodsReceiptsViewProps> = ({
  suppliers,
  purchaseOrders,
  goodsReceipts: initialGRNs,
  supplierBills = [],
  onAddGRN,
  onAddBill,
  onNavigate
}) => {
  // Merge prop GRNs with default samples
  const [grnList, setGrnList] = useState<GoodsReceipt[]>(() => {
    if (initialGRNs && initialGRNs.length > 0) {
      return initialGRNs.map((g, idx) => {
        const sample = DEFAULT_SAMPLE_GRNS.find(s => s.id === g.id || s.grnNumber === g.grnNumber) || DEFAULT_SAMPLE_GRNS[idx] || DEFAULT_SAMPLE_GRNS[0];
        return {
          ...sample,
          ...g,
          lines: g.lines || sample.lines || []
        };
      });
    }
    return DEFAULT_SAMPLE_GRNS;
  });

  React.useEffect(() => {
    if (initialGRNs && initialGRNs.length > 0) {
      setGrnList(initialGRNs.map((g, idx) => {
        const sample = DEFAULT_SAMPLE_GRNS.find(s => s.id === g.id || s.grnNumber === g.grnNumber) || DEFAULT_SAMPLE_GRNS[idx] || DEFAULT_SAMPLE_GRNS[0];
        return {
          ...sample,
          ...g,
          lines: g.lines || sample.lines || []
        };
      }));
    }
  }, [initialGRNs]);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [billedFilter, setBilledFilter] = useState('ALL');

  // Modals state
  const [showInwardModal, setShowInwardModal] = useState(false);
  const [selectedGrnDetail, setSelectedGrnDetail] = useState<GoodsReceipt | null>(null);
  const [inspectingGrn, setInspectingGrn] = useState<GoodsReceipt | null>(null);
  const [verifyingWeightGrn, setVerifyingWeightGrn] = useState<GoodsReceipt | null>(null);
  const [detailTab, setDetailTab] = useState<'lines' | 'po' | 'bills' | 'history'>('lines');
  const [showPrintTagsModal, setShowPrintTagsModal] = useState(false);
  const [selectedTagGrn, setSelectedTagGrn] = useState<GoodsReceipt | null>(null);
  const [showReverseModal, setShowReverseModal] = useState(false);
  const [reverseReasonText, setReverseReasonText] = useState('');
  const [isSimulatingScale, setIsSimulatingScale] = useState(false);

  // Inward Form state
  const [intakeMode, setIntakeMode] = useState<'po' | 'direct'>('po');
  const [formPoNumber, setFormPoNumber] = useState(purchaseOrders[0]?.poNumber || 'PO-2026-00019');
  const [formSupplierId, setFormSupplierId] = useState(suppliers[0]?.id || 'sup-001');
  const [formReceiptDate, setFormReceiptDate] = useState(new Date().toISOString().slice(0, 10));
  const [formChallanNo, setFormChallanNo] = useState(`DC/SUP/${Math.floor(1000 + Math.random() * 9000)}`);
  const [formNotes, setFormNotes] = useState('');
  const [formOverrideReason, setFormOverrideReason] = useState('');
  const [formLines, setFormLines] = useState<GoodsReceiptLine[]>([
    {
      id: `grnl-${Date.now()}`,
      description: '22K Gold Antique Broad Bridal Bangles (Pair)',
      metalType: 'gold',
      purity: '22K (916)',
      category: 'Bangles',
      receivedQty: 4,
      acceptedQty: 4,
      rejectedQty: 0,
      grossWeight: 42.150,
      netWeight: 40.050,
      stoneWeight: 2.100,
      expectedNetWeight: 40.000,
      toleranceOk: true,
      stockMode: 'tag_per_piece',
      costPerPiece: 78500,
      retailMarginPct: 18,
      wholesaleMarginPct: 8,
      retailRate: 92630,
      wholesaleRate: 84780,
      assayPurity: '91.65% Au',
      scaleReading: 42.150
    }
  ]);

  // Sync PO lines when formPoNumber changes in PO intake mode
  const handlePoChange = (poNum: string) => {
    setFormPoNumber(poNum);
    const po = purchaseOrders.find(p => p.poNumber === poNum);
    if (po) {
      setFormSupplierId(po.supplier.id);
      if (po.lines && po.lines.length > 0) {
        setFormLines(po.lines.map((l, i) => ({
          id: `grnl-${Date.now()}-${i}`,
          poLineId: l.id,
          description: l.description,
          metalType: l.metalType,
          purity: l.purity,
          category: l.category,
          receivedQty: l.qty,
          acceptedQty: l.qty,
          rejectedQty: 0,
          grossWeight: l.grossWeight,
          netWeight: l.netWeight,
          stoneWeight: l.stoneWeight || 0,
          expectedNetWeight: l.netWeight,
          toleranceOk: true,
          stockMode: 'tag_per_piece',
          costPerPiece: l.lineTotal ? Math.round(l.lineTotal / l.qty) : 78500,
          retailMarginPct: 18,
          wholesaleMarginPct: 8,
          retailRate: Math.round((l.lineTotal ? l.lineTotal / l.qty : 78500) * 1.18),
          wholesaleRate: Math.round((l.lineTotal ? l.lineTotal / l.qty : 78500) * 1.08),
          assayPurity: '91.68% Au',
          scaleReading: l.grossWeight
        })));
      }
    }
  };

  // Filtered GRNs
  const filteredGRNs = useMemo(() => {
    return grnList.filter(grn => {
      const matchSearch = 
        grn.grnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grn.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (grn.poNumber && grn.poNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (grn.challanNo && grn.challanNo.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'ALL' || grn.status === statusFilter;
      
      let matchBilled = true;
      if (billedFilter === 'BILLED') {
        matchBilled = (grn.billedPieces || 0) >= grn.receivedPieces;
      } else if (billedFilter === 'PARTIAL') {
        matchBilled = (grn.billedPieces || 0) > 0 && (grn.billedPieces || 0) < grn.receivedPieces;
      } else if (billedFilter === 'UNBILLED') {
        matchBilled = (grn.billedPieces || 0) === 0;
      }

      return matchSearch && matchStatus && matchBilled;
    });
  }, [grnList, searchTerm, statusFilter, billedFilter]);

  // KPI calculations
  const kpis = useMemo(() => {
    const totalCount = grnList.length;
    const totalPieces = grnList.reduce((acc, g) => acc + g.receivedPieces, 0);
    const totalWeight = grnList.reduce((acc, g) => acc + g.receivedNetWeight, 0);
    const totalStockValue = grnList.reduce((acc, g) => acc + (g.stockValue || 0), 0);
    const unbilledPcs = grnList.reduce((acc, g) => acc + Math.max(0, g.receivedPieces - (g.billedPieces || 0)), 0);

    return {
      totalCount,
      totalPieces,
      totalWeight,
      totalStockValue,
      unbilledPcs
    };
  }, [grnList]);

  // Scale Reading Simulation
  const handleSimulateScale = (lineIdx: number) => {
    setIsSimulatingScale(true);
    setTimeout(() => {
      // Simulate reading accurate grams from digital Mettler Toledo scale
      const randomJitter = (Math.random() * 0.04 - 0.02);
      setFormLines(formLines.map((l, i) => {
        if (i === lineIdx) {
          const simulatedGross = Math.round((l.grossWeight + randomJitter) * 1000) / 1000;
          const simulatedNet = Math.max(0, Math.round((simulatedGross - (l.stoneWeight || 0)) * 1000) / 1000);
          const diff = l.expectedNetWeight ? Math.abs(simulatedNet - l.expectedNetWeight) : 0;
          return {
            ...l,
            scaleReading: simulatedGross,
            grossWeight: simulatedGross,
            netWeight: simulatedNet,
            toleranceOk: diff <= 0.050
          };
        }
        return l;
      }));
      setIsSimulatingScale(false);
    }, 600);
  };

  // Post GRN & Add Stock
  const handleSaveGRN = () => {
    const selectedSupplier = suppliers.find(s => s.id === formSupplierId) || suppliers[0];
    const grnNumber = `GRN-2026-${String(grnList.length + 27).padStart(5, '0')}`;
    const totalPcs = formLines.reduce((acc, l) => acc + l.acceptedQty, 0);
    const totalGross = formLines.reduce((acc, l) => acc + l.grossWeight, 0);
    const totalNet = formLines.reduce((acc, l) => acc + l.netWeight, 0);
    const stockVal = formLines.reduce((acc, l) => acc + (l.costPerPiece || 0) * l.acceptedQty, 0);

    // Generate barcodes stream for accepted pieces
    const generatedBarcodes = [];
    let counter = 501;
    for (const line of formLines) {
      for (let p = 1; p <= line.acceptedQty; p++) {
        const barcode = `${line.purity.startsWith('18') ? 'D18' : 'G22'}-${String(counter).padStart(5, '0')}`;
        generatedBarcodes.push({
          pieceNo: generatedBarcodes.length + 1,
          barcode,
          itemCode: `SKU-${barcode}`,
          huid: `BIS${Math.floor(100000 + Math.random() * 900000)}`,
          purity: line.purity,
          netWeight: Math.round((line.netWeight / line.acceptedQty) * 1000) / 1000,
          spoolStatus: 'Ready to Print'
        });
        counter++;
      }
    }

    const newGRN: GoodsReceipt = {
      id: `grn-${Date.now()}`,
      grnNumber,
      poNumber: intakeMode === 'po' ? formPoNumber : '',
      poId: intakeMode === 'po' ? purchaseOrders.find(p => p.poNumber === formPoNumber)?.id : undefined,
      supplierName: selectedSupplier.tradeName,
      supplierId: selectedSupplier.id,
      receiptDate: formReceiptDate,
      challanNo: formChallanNo,
      receivedPieces: totalPcs,
      receivedGrossWeight: totalGross,
      receivedNetWeight: totalNet,
      hallmarkedPurity: formLines[0]?.purity || '22K (916)',
      inspectedBy: 'Admin (Shop Owner)',
      status: 'POSTED',
      notes: formNotes,
      lines: formLines,
      billedPieces: 0,
      stockValue: stockVal,
      overrideReason: formOverrideReason || undefined,
      generatedBarcodes
    };

    const nextList = [newGRN, ...grnList];
    setGrnList(nextList);
    if (onAddGRN) onAddGRN(newGRN);
    setShowInwardModal(false);
    setSelectedGrnDetail(newGRN);
  };

  // Reverse GRN
  const handleReverseGRN = (grn: GoodsReceipt, reason: string) => {
    const updated: GoodsReceipt = {
      ...grn,
      status: 'REVERSED',
      reverseReason: reason
    };
    const nextList = grnList.map(g => g.id === grn.id ? updated : g);
    setGrnList(nextList);
    setSelectedGrnDetail(updated);
    setShowReverseModal(false);
    setReverseReasonText('');
  };

  return (
    <div className="page">
      {/* 1. Header */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Goods Receipts</h1>
          <p>
            Goods received from suppliers go into stock here. Open a receipt for its PO, supplier bills and payments.
          </p>
        </div>

        <div className="btn-group">
          <button 
            type="button" 
            className="btn btn-outline btn-sm"
            onClick={() => {
              const csv = [
                ['GRN Number', 'Date', 'Supplier', 'PO Number', 'Challan', 'Pieces', 'Net Weight g', 'Status'],
                ...grnList.map(g => [
                  g.grnNumber, g.receiptDate, g.supplierName, g.poNumber || 'DIRECT',
                  g.challanNo || '', g.receivedPieces, g.receivedNetWeight, g.status
                ])
              ].map(r => r.join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `goods_receipts_${new Date().toISOString().slice(0,10)}.csv`;
              a.click();
            }}
          >
            <Download size={14} /> Export CSV
          </button>
          <button 
            type="button" 
            className="btn btn-outline btn-sm"
            onClick={() => {
              setIntakeMode('direct');
              setFormReceiptDate(new Date().toISOString().slice(0, 10));
              setFormChallanNo(`DC/DIR/${Math.floor(1000 + Math.random() * 9000)}`);
              setFormNotes('Direct inward receipt without PO');
              setFormOverrideReason('');
              setShowInwardModal(true);
            }}
          >
            <Plus size={14} /> Receive without PO
          </button>
          <button 
            type="button" 
            className="btn btn-primary btn-sm"
            onClick={() => {
              setIntakeMode('po');
              setFormReceiptDate(new Date().toISOString().slice(0, 10));
              setFormChallanNo(`DC/SUP/${Math.floor(1000 + Math.random() * 9000)}`);
              setFormNotes('');
              setFormOverrideReason('');
              setShowInwardModal(true);
            }}
          >
            <Plus size={14} /> Inward Goods Receipt
          </button>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="sum-grid">
        <div className="sum-box">
          <div className="sum-val">{kpis.totalCount}</div>
          <div className="sum-lbl">Total Goods Receipts</div>
        </div>

        <div className="sum-box">
          <div className="sum-val" style={{ color: 'var(--success)' }}>
            {kpis.totalPieces} pc
          </div>
          <div className="sum-lbl">Total Pieces Inward</div>
        </div>

        <div className="sum-box">
          <div className="sum-val mono" style={{ color: 'var(--gold)' }}>
            {kpis.totalWeight.toFixed(3)} g
          </div>
          <div className="sum-lbl">Net Metal Inward</div>
        </div>

        <div className="sum-box">
          <div className="sum-val" style={{ color: 'var(--gold)' }}>
            ₹{(kpis.totalStockValue / 100000).toFixed(2)} L
          </div>
          <div className="sum-lbl">Stock Value ({kpis.unbilledPcs} pcs unbilled)</div>
        </div>
      </div>

      {/* 3. Filter & Search Toolbar */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-body" style={{ padding: "12px 16px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 10, flex: "1 1 320px", alignItems: "center", flexWrap: "wrap" }}>
            <div className="search-box" style={{ flex: 1, minWidth: 260 }}>
              <Search size={14} />
              <input 
                type="text" 
                placeholder="Search GRN #, supplier, PO #, challan..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              {(['ALL', 'POSTED', 'REVERSED'] as const).map(st => (
                <button
                  key={st}
                  type="button"
                  className={`filter-pill ${statusFilter === st ? 'active' : ''}`}
                  onClick={() => setStatusFilter(st)}
                >
                  {st === 'ALL' ? 'All Status' : st}
                </button>
              ))}
              {(['ALL', 'BILLED', 'PARTIAL', 'UNBILLED'] as const).map(bt => (
                <button
                  key={bt}
                  type="button"
                  className={`filter-pill ${billedFilter === bt ? 'active' : ''}`}
                  onClick={() => setBilledFilter(bt)}
                >
                  {bt === 'ALL' ? 'All Billing' : bt}
                </button>
              ))}
            </div>
          </div>

          <div className="helper">
            Showing <b>{filteredGRNs.length}</b> of <b>{grnList.length}</b> receipts
          </div>
        </div>
      </div>

      {/* 4. Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="tbl-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 140 }}>GRN</th>
                <th>Date</th>
                <th>Supplier</th>
                <th>PO</th>
                <th>Challan</th>
                <th className="num">Pieces</th>
                <th style={{ textAlign: 'center' }}>Billed</th>
                <th className="num">Bills</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'right', width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGRNs.map((grn) => {
                const isFullyBilled = (grn.billedPieces || 0) >= grn.receivedPieces;
                const isPartiallyBilled = (grn.billedPieces || 0) > 0 && (grn.billedPieces || 0) < grn.receivedPieces;

                return (
                  <tr 
                    key={grn.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedGrnDetail(grn);
                      setDetailTab('lines');
                    }}
                  >
                    <td>
                      <span className="mono" style={{ fontWeight: 700, color: 'var(--success, #059669)' }}>
                        {grn.grnNumber}
                      </span>
                    </td>
                    <td>{new Date(grn.receiptDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{grn.supplierName}</div>
                      <div className="helper mono" style={{ fontSize: 11 }}>{grn.hallmarkedPurity}</div>
                    </td>
                    <td>
                      {grn.poNumber ? (
                        <span className="mono" style={{ color: 'var(--gold, #b45309)', fontWeight: 600 }}>
                          {grn.poNumber}
                        </span>
                      ) : (
                        <span className="helper">Direct (No PO)</span>
                      )}
                    </td>
                    <td><span className="mono">{grn.challanNo || '—'}</span></td>
                    <td className="num mono" style={{ fontWeight: 700 }}>{grn.receivedPieces} pc</td>
                    <td style={{ textAlign: 'center' }}>
                      {grn.status !== 'POSTED' ? (
                        <span className="helper">—</span>
                      ) : isFullyBilled ? (
                        <span className="badge badge-green">Billed</span>
                      ) : isPartiallyBilled ? (
                        <span className="badge badge-orange">{grn.billedPieces} / {grn.receivedPieces} pc</span>
                      ) : (
                        <span className="badge badge-gray">Unbilled</span>
                      )}
                    </td>
                    <td className="num mono">
                      {supplierBills.filter(bill =>
                        bill.status.toUpperCase() !== 'CANCELLED' && bill.grnNumbers?.includes(grn.grnNumber)
                      ).length}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {grn.status === 'POSTED' ? (
                        <span className="badge badge-green">Posted</span>
                      ) : (
                        <span className="badge badge-red">Reversed</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-xs"
                          title="Inspect"
                          onClick={() => setInspectingGrn(grn)}
                        >
                          <ShieldCheck size={13} />
                          <span>Inspect</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-xs"
                          title="Verify Weight"
                          onClick={() => setVerifyingWeightGrn(grn)}
                        >
                          <Scale size={13} />
                          <span>Verify Weight</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-xs"
                          title="View GRN Details"
                          onClick={() => {
                            setSelectedGrnDetail(grn);
                            setDetailTab('lines');
                          }}
                        >
                          <Eye size={13} />
                        </button>
                        {grn.status === 'POSTED' && (
                          <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            title="Print Rattail Barcode Tags"
                            onClick={() => {
                              setSelectedTagGrn(grn);
                              setShowPrintTagsModal(true);
                            }}
                          >
                            <Tag size={13} />
                          </button>
                        )}
                        {grn.status === 'POSTED' && (grn.receivedPieces - (grn.billedPieces || 0)) > 0 && (
                          <button
                            type="button"
                            className="btn btn-primary btn-xs"
                            title="Generate Supplier Bill"
                            onClick={() => {
                              if (onNavigate) {
                                onNavigate('supplier-bills', grn.id);
                              } else {
                                setSelectedGrnDetail(grn);
                                setDetailTab('bills');
                              }
                            }}
                          >
                            <Receipt size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredGRNs.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <Truck size={36} style={{ color: 'var(--muted)', opacity: 0.5 }} />
                      <div style={{ fontWeight: 600, fontSize: 15 }}>No Goods Receipts Found</div>
                      <div className="helper" style={{ maxWidth: 360 }}>
                        {searchTerm || statusFilter !== 'ALL' || billedFilter !== 'ALL'
                          ? 'No receipts match your filter criteria. Clear filters or create an inward entry.'
                          : 'No goods receipts are recorded. Click "+ Inward Goods Receipt" to receive consignment stock from suppliers.'}
                      </div>
                      <button 
                        type="button" 
                        className="btn btn-primary btn-sm" 
                        style={{ marginTop: 8 }}
                        onClick={() => setShowInwardModal(true)}
                      >
                        <Plus size={14} /> Inward First Consignment
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Inward Consignment Intake Modal (`GrnForm`) */}
      {showInwardModal && (
        <div className="modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-card modal-lg" style={{ maxWidth: 950, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-head">
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Inward Goods Consignment (GRN)</h3>
                <div className="helper">Weigh incoming jewellery, verify purity assays, and stream barcode tags into stock.</div>
              </div>
              <button 
                type="button" 
                className="btn btn-ghost btn-sm" 
                onClick={() => setShowInwardModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ overflowY: 'auto', padding: 20 }}>
              {/* Intake Mode Switcher */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <button
                  type="button"
                  className={`btn btn-sm ${intakeMode === 'po' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setIntakeMode('po')}
                >
                  <ShoppingBag size={14} /> Inward against Purchase Order (PO)
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${intakeMode === 'direct' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setIntakeMode('direct')}
                >
                  <Truck size={14} /> Direct Inward (Without PO)
                </button>
              </div>

              {/* Header Fields */}
              <div className="g3" style={{ marginBottom: 16 }}>
                {intakeMode === 'po' ? (
                  <div>
                    <label className="label">Link to Purchase Order *</label>
                    <select 
                      className="input"
                      value={formPoNumber}
                      onChange={e => handlePoChange(e.target.value)}
                    >
                      {purchaseOrders.map(p => (
                        <option key={p.id} value={p.poNumber}>
                          {p.poNumber} · {p.supplier.tradeName} ({p.orderedWeightGrams}g)
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="label">Supplier *</label>
                    <select 
                      className="input"
                      value={formSupplierId}
                      onChange={e => setFormSupplierId(e.target.value)}
                    >
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.tradeName} · {s.city}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="label">Receipt Date *</label>
                  <input 
                    type="date" 
                    className="input"
                    value={formReceiptDate}
                    onChange={e => setFormReceiptDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="label">Delivery Challan / LR # *</label>
                  <input 
                    type="text" 
                    className="input"
                    value={formChallanNo}
                    onChange={e => setFormChallanNo(e.target.value)}
                  />
                </div>
              </div>

              {/* Line Items Verification */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {formLines.map((line, idx) => {
                  const weightVariance = line.expectedNetWeight 
                    ? Math.round((line.netWeight - line.expectedNetWeight) * 1000) / 1000 
                    : 0;
                  const isWeightWarning = Math.abs(weightVariance) > 0.050;

                  return (
                    <div 
                      key={line.id || idx}
                      style={{ 
                        padding: 16, borderRadius: 10, border: '1px solid var(--border)', 
                        background: 'var(--surface-2, #faf7ef)' 
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="badge badge-gold" style={{ fontWeight: 700 }}>
                            Line #{idx + 1}
                          </span>
                          <span style={{ fontWeight: 600 }}>{line.description}</span>
                          <span className="badge badge-teal">{line.purity}</span>
                        </div>

                        <div className="btn-group">
                          <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            onClick={() => handleSimulateScale(idx)}
                            disabled={isSimulatingScale}
                          >
                            <Scale size={13} /> {isSimulatingScale ? 'Reading Scale...' : 'Read Electronic Scale'}
                          </button>
                        </div>
                      </div>

                      <div className="g4">
                        <div>
                          <label className="label">Received Pcs *</label>
                          <input 
                            type="number" 
                            className="input"
                            min="1"
                            value={line.receivedQty}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setFormLines(formLines.map((l, i) => i === idx ? { ...l, receivedQty: val, acceptedQty: val } : l));
                            }}
                          />
                        </div>

                        <div>
                          <label className="label">Accepted Pcs *</label>
                          <input 
                            type="number" 
                            className="input"
                            min="0"
                            max={line.receivedQty}
                            value={line.acceptedQty}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setFormLines(formLines.map((l, i) => i === idx ? { 
                                ...l, 
                                acceptedQty: val, 
                                rejectedQty: Math.max(0, l.receivedQty - val) 
                              } : l));
                            }}
                          />
                        </div>

                        <div>
                          <label className="label">Gross Wt (Scale reading g)</label>
                          <input 
                            type="number" 
                            step="0.001"
                            className="input mono"
                            value={line.grossWeight}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setFormLines(formLines.map((l, i) => i === idx ? { ...l, grossWeight: val } : l));
                            }}
                          />
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label className="label">Net Weight (Metal g) *</label>
                            {line.expectedNetWeight ? (
                              <span style={{ 
                                fontSize: 11, 
                                fontWeight: 600, 
                                color: Math.abs(line.netWeight - line.expectedNetWeight) > 0.050 ? 'var(--danger)' : 'var(--success)' 
                              }}>
                                Var: {line.netWeight - line.expectedNetWeight >= 0 ? '+' : ''}{(line.netWeight - line.expectedNetWeight).toFixed(3)}g
                                {Math.abs(line.netWeight - line.expectedNetWeight) <= 0.050 ? ' (±0.050g OK)' : ' (Exceeds tol)'}
                              </span>
                            ) : null}
                          </div>
                          <input 
                            type="number" 
                            step="0.001"
                            className="input mono"
                            value={line.netWeight}
                            onChange={e => {
                              const val = Number(e.target.value);
                              const diff = line.expectedNetWeight ? Math.abs(val - line.expectedNetWeight) : 0;
                              setFormLines(formLines.map((l, i) => i === idx ? { 
                                ...l, 
                                netWeight: val, 
                                toleranceOk: diff <= 0.050 
                              } : l));
                            }}
                          />
                        </div>

                        {line.receivedQty > line.acceptedQty && (
                          <div style={{ gridColumn: 'span 2' }}>
                            <label className="label" style={{ color: 'var(--danger)' }}>
                              Rejection Reason ({line.receivedQty - line.acceptedQty} pcs rejected) *
                            </label>
                            <input 
                              type="text" 
                              className="input"
                              placeholder="e.g. Porosity on casting, broken solder joint..."
                              value={line.rejectReason || ''}
                              onChange={e => {
                                const val = e.target.value;
                                setFormLines(formLines.map((l, i) => i === idx ? { ...l, rejectReason: val } : l));
                              }}
                            />
                          </div>
                        )}

                        <div>
                          <label className="label">Purity Assay Verification</label>
                          <input 
                            type="text" 
                            className="input mono"
                            value={line.assayPurity || '91.68% Au'}
                            onChange={e => {
                              const val = e.target.value;
                              setFormLines(formLines.map((l, i) => i === idx ? { ...l, assayPurity: val } : l));
                            }}
                          />
                        </div>

                        <div>
                          <label className="label">Stock Tagging Mode</label>
                          <select 
                            className="input"
                            value={line.stockMode}
                            onChange={e => {
                              const val = e.target.value;
                              setFormLines(formLines.map((l, i) => i === idx ? { ...l, stockMode: val } : l));
                            }}
                          >
                            <option value="tag_per_piece">New Tag per Piece (G22-000001...)</option>
                            <option value="single_code">One SKU Code, Bulk Quantity</option>
                            <option value="add_existing">Add to Existing Stock Item</option>
                          </select>
                        </div>

                        <div>
                          <label className="label">Retail Margin %</label>
                          <input 
                            type="number" 
                            className="input"
                            value={line.retailMarginPct}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setFormLines(formLines.map((l, i) => i === idx ? { 
                                ...l, 
                                retailMarginPct: val, 
                                retailRate: Math.round((l.costPerPiece || 0) * (1 + val / 100)) 
                              } : l));
                            }}
                          />
                        </div>

                        <div>
                          <label className="label">Wholesale Margin %</label>
                          <input 
                            type="number" 
                            className="input"
                            value={line.wholesaleMarginPct}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setFormLines(formLines.map((l, i) => i === idx ? { 
                                ...l, 
                                wholesaleMarginPct: val, 
                                wholesaleRate: Math.round((l.costPerPiece || 0) * (1 + val / 100)) 
                              } : l));
                            }}
                          />
                        </div>
                      </div>

                      {/* Weight Tolerance Warning Alert */}
                      {isWeightWarning && (
                        <div className="alert alert-warn" style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <AlertCircle size={16} />
                          <div>
                            <b>Weight Tolerance Alert:</b> Actual net weight differs from expected by <b>{weightVariance > 0 ? `+${weightVariance}` : weightVariance} g</b> (standard limit is ±0.050g). Admin override justification required below.
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Admin Override Reason if weight variance triggered */}
              {formLines.some(l => l.expectedNetWeight && Math.abs(l.netWeight - l.expectedNetWeight) > 0.050) && (
                <div style={{ marginTop: 14 }}>
                  <label className="label" style={{ color: 'var(--gold, #b45309)' }}>
                    Admin Override Approval Reason *
                  </label>
                  <input 
                    type="text" 
                    className="input"
                    placeholder="State reason why higher/lower weight is acceptable..."
                    value={formOverrideReason}
                    onChange={e => setFormOverrideReason(e.target.value)}
                  />
                </div>
              )}

              {/* Notes */}
              <div style={{ marginTop: 14 }}>
                <label className="label">Consignment Inward Notes</label>
                <textarea 
                  className="input" 
                  rows={2}
                  placeholder="Security seal numbers, delivery package condition..."
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-foot" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="helper">
                Total Inward: <b>{formLines.reduce((s, l) => s + l.acceptedQty, 0)}</b> accepted pcs · <b>{formLines.reduce((s, l) => s + l.netWeight, 0).toFixed(3)}</b> g
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowInwardModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveGRN}
                >
                  <CheckCircle2 size={16} /> Post GRN & Add Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. GRN Details Modal (`GrnDetail`) */}
      {selectedGrnDetail && (
        <div className="modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-card modal-lg" style={{ maxWidth: 900, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-head">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{selectedGrnDetail.grnNumber}</h3>
                  <span className={`badge ${selectedGrnDetail.status === 'POSTED' ? 'badge-green' : 'badge-red'}`}>
                    {selectedGrnDetail.status}
                  </span>
                </div>
                <div className="helper" style={{ marginTop: 2 }}>
                  Supplier: <b>{selectedGrnDetail.supplierName}</b> · Challan: <span className="mono">{selectedGrnDetail.challanNo || '—'}</span>
                </div>
              </div>
              <button 
                type="button" 
                className="btn btn-ghost btn-sm" 
                onClick={() => setSelectedGrnDetail(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ overflowY: 'auto', padding: 20 }}>
              {/* Progress Pipeline */}
              <div style={{ 
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, 
                padding: '12px 16px', background: 'var(--surface-2, #faf7ef)', borderRadius: 10, marginBottom: 16 
              }}>
                <div>
                  <div className="helper" style={{ fontSize: 11 }}>1. Purchase Order</div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{selectedGrnDetail.poNumber || 'Direct Inward'}</div>
                  <div className="helper">Approved Order</div>
                </div>
                <div>
                  <div className="helper" style={{ fontSize: 11 }}>2. Goods Received</div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{selectedGrnDetail.receivedPieces} pc · {selectedGrnDetail.receivedNetWeight.toFixed(3)}g</div>
                  <div className="helper">{selectedGrnDetail.status}</div>
                </div>
                <div>
                  <div className="helper" style={{ fontSize: 11 }}>3. Supplier Bills</div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>
                    {selectedGrnDetail.billedPieces || 0} / {selectedGrnDetail.receivedPieces} pc
                  </div>
                  <div className="helper">{(selectedGrnDetail.billedPieces || 0) >= selectedGrnDetail.receivedPieces ? 'Fully Billed' : 'Pending Invoice'}</div>
                </div>
                <div>
                  <div className="helper" style={{ fontSize: 11 }}>4. Payments</div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>
                    {(selectedGrnDetail.billedPieces || 0) > 0 ? 'Linked to Bills' : '—'}
                  </div>
                  <div className="helper">Disbursed</div>
                </div>
              </div>

              {/* KPI Summary Strip */}
              <div className="s360-grid" style={{ marginBottom: 16 }}>
                <div className="card s360-card">
                  <div className="s360-label">Pieces Accepted</div>
                  <div className="s360-val" style={{ color: 'var(--success)' }}>{selectedGrnDetail.receivedPieces} pc</div>
                  <div className="helper">All pieces pass assay</div>
                </div>
                <div className="card s360-card">
                  <div className="s360-label">Net Metal Weight</div>
                  <div className="s360-val mono">{selectedGrnDetail.receivedNetWeight.toFixed(3)} g</div>
                  <div className="helper">{selectedGrnDetail.hallmarkedPurity}</div>
                </div>
                <div className="card s360-card">
                  <div className="s360-label">Stock Value (Cost)</div>
                  <div className="s360-val" style={{ color: 'var(--gold)' }}>
                    ₹{((selectedGrnDetail.stockValue || 0) / 100000).toFixed(2)} L
                  </div>
                  <div className="helper">₹{(selectedGrnDetail.stockValue || 0).toLocaleString('en-IN')}</div>
                </div>
                <div className="card s360-card">
                  <div className="s360-label">Billing Progress</div>
                  <div className="s360-val" style={{ color: (selectedGrnDetail.billedPieces || 0) >= selectedGrnDetail.receivedPieces ? 'var(--success)' : 'var(--warning, #f59e0b)' }}>
                    {selectedGrnDetail.billedPieces || 0} / {selectedGrnDetail.receivedPieces}
                  </div>
                  <div className="helper">Pieces invoiced</div>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--border)', marginBottom: 14 }}>
                <button
                  type="button"
                  className={`btn btn-sm ${detailTab === 'lines' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setDetailTab('lines')}
                >
                  Lines & Stock Tags ({selectedGrnDetail.generatedBarcodes?.length || selectedGrnDetail.lines?.length || 0})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${detailTab === 'po' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setDetailTab('po')}
                >
                  Purchase Order Info
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${detailTab === 'history' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setDetailTab('history')}
                >
                  Audit Log
                </button>
              </div>

              {/* Tab 1: Generated Tags & Barcodes */}
              {detailTab === 'lines' && (
                <div>
                  <div className="tbl-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th style={{ width: 40 }}>#</th>
                          <th>Barcode</th>
                          <th>SKU Code</th>
                          <th>HUID</th>
                          <th>Purity</th>
                          <th className="num">Net Wt</th>
                          <th style={{ textAlign: 'center' }}>Spool Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedGrnDetail.generatedBarcodes || []).map((tag) => (
                          <tr key={tag.pieceNo}>
                            <td>{tag.pieceNo}</td>
                            <td>
                              <span className="mono" style={{ fontWeight: 700, color: 'var(--gold, #b45309)' }}>
                                {tag.barcode}
                              </span>
                            </td>
                            <td><span className="mono">{tag.itemCode}</span></td>
                            <td><span className="badge badge-purple">{tag.huid}</span></td>
                            <td>{tag.purity}</td>
                            <td className="num mono">{tag.netWeight.toFixed(3)} g</td>
                            <td style={{ textAlign: 'center' }}>
                              <span className="badge badge-green">Ready to Print</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 2: PO Details */}
              {detailTab === 'po' && (
                <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8 }}>
                  <div style={{ fontWeight: 600 }}>PO Reference: {selectedGrnDetail.poNumber || 'Direct inward without PO'}</div>
                  <div className="helper" style={{ marginTop: 4 }}>
                    Challan Number: {selectedGrnDetail.challanNo} · Inspected by {selectedGrnDetail.inspectedBy}
                  </div>
                </div>
              )}

              {/* Tab 3: History */}
              {detailTab === 'history' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>Inward Receipt Posted</div>
                    <div className="helper">By {selectedGrnDetail.inspectedBy} on {selectedGrnDetail.receiptDate}</div>
                  </div>
                  {selectedGrnDetail.reverseReason && (
                    <div style={{ color: 'var(--danger)' }}>
                      <div style={{ fontWeight: 600 }}>Consignment Reversed</div>
                      <div className="helper">Reason: {selectedGrnDetail.reverseReason}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-foot" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setSelectedTagGrn(selectedGrnDetail);
                    setShowPrintTagsModal(true);
                  }}
                >
                  <Tag size={14} /> Spool & Print Tags
                </button>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                {selectedGrnDetail.status === 'POSTED' && (selectedGrnDetail.receivedPieces - (selectedGrnDetail.billedPieces || 0)) > 0 && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      if (onNavigate) {
                        onNavigate('supplier-bills', selectedGrnDetail.id);
                      }
                    }}
                  >
                    <Receipt size={14} /> Create Supplier Bill ({selectedGrnDetail.receivedPieces - (selectedGrnDetail.billedPieces || 0)} pc)
                  </button>
                )}

                {selectedGrnDetail.status === 'POSTED' && (
                  <button
                    type="button"
                    className="btn btn-danger-outline"
                    onClick={() => setShowReverseModal(true)}
                  >
                    <RotateCcw size={14} /> Reverse GRN
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setSelectedGrnDetail(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Barcode Tag Spooler Modal (`printTags`) */}
      {showPrintTagsModal && selectedTagGrn && (
        <div className="modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-card modal-lg" style={{ maxWidth: 800 }}>
            <div className="modal-head">
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                Spool & Print Rattail Barcode Tags ({selectedTagGrn.grnNumber})
              </h3>
              <button 
                type="button" 
                className="btn btn-ghost btn-sm" 
                onClick={() => setShowPrintTagsModal(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label className="label">Tag Label Template</label>
                  <select className="input input-sm">
                    <option value="rattail">Rattail Jewellery Tag (95x14mm)</option>
                    <option value="dumbbell">Dumbbell Ring Tag (84x14mm)</option>
                    <option value="butterfly">Butterfly Tag (68x18mm)</option>
                  </select>
                </div>
                <div style={{ width: 140 }}>
                  <label className="label">Barcode Type</label>
                  <select className="input input-sm">
                    <option value="code128">Code 128</option>
                    <option value="datamatrix">2D DataMatrix</option>
                    <option value="qr">QR Code</option>
                  </select>
                </div>
              </div>

              {/* Tag Preview Cards */}
              <div style={{ 
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, 
                maxHeight: 340, overflowY: 'auto', padding: 8, background: 'var(--surface-2)', borderRadius: 8 
              }}>
                {(selectedTagGrn.generatedBarcodes || []).map((tag, idx) => (
                  <div 
                    key={idx}
                    style={{ 
                      padding: 12, background: '#fff', border: '1px solid #cbd5e1', 
                      borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 4 
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700 }}>
                      <span>KRIYA 360</span>
                      <span className="mono">{tag.purity}</span>
                    </div>
                    <div style={{ textAlign: 'center', margin: '4px 0' }}>
                      <div className="mono" style={{ fontSize: 14, fontWeight: 800, letterSpacing: 1 }}>
                        {tag.barcode}
                      </div>
                      <div className="helper mono" style={{ fontSize: 10 }}>||| || ||||| |||| |||</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                      <span className="mono">Net: {tag.netWeight.toFixed(3)}g</span>
                      <span className="badge badge-purple" style={{ fontSize: 9 }}>{tag.huid}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-foot" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div className="helper">
                Total <b>{selectedTagGrn.generatedBarcodes?.length || 0}</b> tags ready for thermal transfer print
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setShowPrintTagsModal(false)}
                >
                  Close
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => {
                    alert(`Thermal Spooler: Sent ${selectedTagGrn.generatedBarcodes?.length || 0} tags to Zebra ZD421 / TSC thermal printer on COM3`);
                    setShowPrintTagsModal(false);
                  }}
                >
                  <Printer size={15} /> Print Tags to Spooler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Reverse GRN Modal */}
      {showReverseModal && selectedGrnDetail && (
        <div className="modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-card" style={{ maxWidth: 460 }}>
            <div className="modal-head">
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--danger)' }}>
                Reverse {selectedGrnDetail.grnNumber}?
              </h3>
              <button 
                type="button" 
                className="btn btn-ghost btn-sm" 
                onClick={() => setShowReverseModal(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ margin: '0 0 12px 0', fontSize: 13, color: 'var(--muted)' }}>
                Stock added by this receipt is taken out again (newest lines first). Not possible once billed or if a piece was sold.
              </p>
              <label className="label">Reversal Reason *</label>
              <textarea 
                className="input" 
                rows={3}
                placeholder="State why this consignment is being reversed out of stock..."
                value={reverseReasonText}
                onChange={e => setReverseReasonText(e.target.value)}
              />
            </div>
            <div className="modal-foot">
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setShowReverseModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-danger"
                disabled={!reverseReasonText.trim()}
                onClick={() => handleReverseGRN(selectedGrnDetail, reverseReasonText)}
              >
                Confirm Reversal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT MODAL */}
      {inspectingGrn && (
        <div className="overlay" onClick={() => setInspectingGrn(null)}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Goods Inspection: {inspectingGrn.grnNumber}</h3>
              <button 
                type="button" 
                className="btn btn-ghost btn-sm"
                onClick={() => setInspectingGrn(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'var(--zebra)', padding: 12, borderRadius: 8, marginBottom: 14 }}>
                <div style={{ fontWeight: 700 }}>{inspectingGrn.supplierName}</div>
                <div className="helper">Challan: {inspectingGrn.challanNo} · Items: {inspectingGrn.receivedPieces} pcs · Net: {inspectingGrn.receivedNetWeight}g</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" defaultChecked />
                  <span>XRF Purity Assay check passed (22K 91.6% / 18K 75.0%)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" defaultChecked />
                  <span>BIS Hallmark 6-digit laser HUID verified on pieces</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" defaultChecked />
                  <span>Diamond & gemstone counts matched against delivery challan</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" defaultChecked />
                  <span>Finish quality, clasp integrity and soldering inspected</span>
                </label>
              </div>
            </div>
            <div className="modal-foot">
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setInspectingGrn(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={() => {
                  alert(`Inspection completed and certified for ${inspectingGrn.grnNumber}! Certificate stamped.`);
                  setInspectingGrn(null);
                }}
              >
                <ShieldCheck size={14} /> Approve Quality Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VERIFY WEIGHT MODAL */}
      {verifyingWeightGrn && (
        <div className="overlay" onClick={() => setVerifyingWeightGrn(null)}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Electronic Weight Verification: {verifyingWeightGrn.grnNumber}</h3>
              <button 
                type="button" 
                className="btn btn-ghost btn-sm"
                onClick={() => setVerifyingWeightGrn(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', padding: '16px', background: '#0f172a', color: '#38bdf8', borderRadius: 10, marginBottom: 14 }}>
                <div style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: '#94a3b8' }}>
                  Calibrated Electronic Scale (3 Decimal Grams)
                </div>
                <div className="mono" style={{ fontSize: 32, fontWeight: 800, marginTop: 4 }}>
                  {verifyingWeightGrn.receivedNetWeight.toFixed(3)} g
                </div>
                <div style={{ fontSize: 12, color: '#4ade80', marginTop: 4 }}>
                  ● Scale Zeroed &amp; Stable (COM3 9600 Baud)
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                <div className="card" style={{ padding: 10 }}>
                  <span className="helper">Challan Declared Weight:</span>
                  <div className="mono" style={{ fontSize: 15, fontWeight: 700 }}>{verifyingWeightGrn.receivedNetWeight.toFixed(3)} g</div>
                </div>
                <div className="card" style={{ padding: 10 }}>
                  <span className="helper">Physical Scale Net:</span>
                  <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary)' }}>{verifyingWeightGrn.receivedNetWeight.toFixed(3)} g</div>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setVerifyingWeightGrn(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={() => {
                  alert(`Weight verified for ${verifyingWeightGrn.grnNumber}! Scale certificate attached to receipt.`);
                  setVerifyingWeightGrn(null);
                }}
              >
                <Scale size={14} /> Confirm Verified Weight
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

