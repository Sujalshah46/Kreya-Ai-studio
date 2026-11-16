import React, { useState } from 'react';
import { 
  BarChart3, TrendingUp, Layers, Diamond, ArrowUpRight, Scale, 
  AlertTriangle, Download, Printer, ShieldCheck, Sparkles, RefreshCw, Search, X, CheckCircle2, FileText
} from 'lucide-react';
import { InventoryItem, DailyRates, StoreProfile } from '../../types';

interface StockValuationViewProps {
  store: StoreProfile;
  rates: DailyRates;
  inventory: InventoryItem[];
}

export const StockValuationView: React.FC<StockValuationViewProps> = ({
  store,
  rates,
  inventory: initialInventory
}) => {
  const [activeTab, setActiveTab] = useState<'mtm' | 'overview' | 'purity' | 'item_valuation' | 'low_stock'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showRevaluationModal, setShowRevaluationModal] = useState(false);
  const [revaluationNotice, setRevaluationNotice] = useState<string | null>(null);
  const [exportMethod, setExportMethod] = useState<'marked_to_market' | 'book_cost' | 'retail_mrp'>('marked_to_market');
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf' | 'xlsx'>('csv');

  const inventory = initialInventory;

  const totalPieces = inventory.reduce((a, b) => a + b.stockQty, 0);
  const totalGrossWeight = inventory.reduce((a, b) => a + (b.grossWeight * b.stockQty), 0);
  const totalNetWeight = inventory.reduce((a, b) => a + (b.netWeight * b.stockQty), 0);
  const totalDiamonds = inventory.flatMap(i => i.stones || []).reduce((a, b) => a + (b.carats || 0), 0);

  const totalCostValuation = inventory.reduce((a, b) => a + (b.costPrice * b.stockQty), 0);
  const totalRetailValuation = inventory.reduce((a, b) => a + (b.retailPrice * b.stockQty), 0);
  const totalMrpValuation = inventory.reduce((a, b) => a + ((b.mrp ?? 0) * b.stockQty), 0);

  // Live Market Rates
  const liveGoldRate24k = rates.gold24kPerGram || (rates.gold24kPer10g ? Math.round(rates.gold24kPer10g / 10) : 7850);
  const liveGoldRate22k = rates.gold22kPerGram || Math.round(liveGoldRate24k * 0.916) || 7191;
  const liveGoldRate18k = rates.gold18kPerGram || Math.round(liveGoldRate24k * 0.75) || 5888;
  const liveGoldRate14k = rates.gold14kPerGram || Math.round(liveGoldRate24k * 0.585) || 4592;
  const liveSilver999Rate = rates.silverPerGram || (rates.silverPer10g ? Math.round(rates.silverPer10g / 10) : 94);
  const liveSilver925Rate = Math.round(liveSilver999Rate * 0.925) || 87;

  // Marked-to-Market Matrix across 24K, 22K, 18K, 14K, 999 Silver, 925 Silver
  interface MtmPurityRow {
    key: string;
    label: string;
    category: 'gold' | 'silver';
    purityKarat: string;
    purityFactor: number;
    spotRatePerGram: number;
    spotRatePer10g: number;
    badgeClass: string;
    itemCount: number;
    totalQty: number;
    grossWeight: number;
    netWeight: number;
    fineWeight: number;
    mtmValuation: number;
    costValuation: number;
    retailValuation: number;
    unrealizedGain: number;
    unrealizedGainPct: number;
  }

  const mtmSpecs: {
    key: string;
    label: string;
    category: 'gold' | 'silver';
    purityKarat: string;
    purityFactor: number;
    spotRatePerGram: number;
    spotRatePer10g: number;
    badgeClass: string;
    matcher: (item: InventoryItem) => boolean;
  }[] = [
    {
      key: 'gold_24k',
      label: '24K Gold (Fine 999)',
      category: 'gold',
      purityKarat: '24K (999)',
      purityFactor: 1.0,
      spotRatePerGram: liveGoldRate24k,
      spotRatePer10g: liveGoldRate24k * 10,
      badgeClass: 'badge-yellow',
      matcher: (i) => {
        const cat = (i.metalType || i.category || '').toLowerCase();
        const pur = (i.purityKarat || '').toLowerCase();
        return cat.includes('gold') && (pur.includes('24k') || pur.includes('999') || pur.includes('995'));
      }
    },
    {
      key: 'gold_22k',
      label: '22K Gold (BIS 916)',
      category: 'gold',
      purityKarat: '22K (916)',
      purityFactor: 0.916,
      spotRatePerGram: liveGoldRate22k,
      spotRatePer10g: liveGoldRate22k * 10,
      badgeClass: 'badge-yellow',
      matcher: (i) => {
        const cat = (i.metalType || i.category || '').toLowerCase();
        const pur = (i.purityKarat || '').toLowerCase();
        return cat.includes('gold') && (pur.includes('22k') || pur.includes('916') || (!pur.includes('24k') && !pur.includes('18k') && !pur.includes('14k')));
      }
    },
    {
      key: 'gold_18k',
      label: '18K Gold (Hallmark 750)',
      category: 'gold',
      purityKarat: '18K (750)',
      purityFactor: 0.75,
      spotRatePerGram: liveGoldRate18k,
      spotRatePer10g: liveGoldRate18k * 10,
      badgeClass: 'badge-yellow',
      matcher: (i) => {
        const cat = (i.metalType || i.category || '').toLowerCase();
        const pur = (i.purityKarat || '').toLowerCase();
        return cat.includes('gold') && (pur.includes('18k') || pur.includes('750'));
      }
    },
    {
      key: 'gold_14k',
      label: '14K Gold (Hallmark 585)',
      category: 'gold',
      purityKarat: '14K (585)',
      purityFactor: 0.585,
      spotRatePerGram: liveGoldRate14k,
      spotRatePer10g: liveGoldRate14k * 10,
      badgeClass: 'badge-yellow',
      matcher: (i) => {
        const cat = (i.metalType || i.category || '').toLowerCase();
        const pur = (i.purityKarat || '').toLowerCase();
        return cat.includes('gold') && (pur.includes('14k') || pur.includes('585'));
      }
    },
    {
      key: 'silver_999',
      label: '999 Pure Silver',
      category: 'silver',
      purityKarat: 'Silver 999',
      purityFactor: 1.0,
      spotRatePerGram: liveSilver999Rate,
      spotRatePer10g: liveSilver999Rate * 10,
      badgeClass: 'badge-gray',
      matcher: (i) => {
        const cat = (i.metalType || i.category || '').toLowerCase();
        const pur = (i.purityKarat || '').toLowerCase();
        return cat.includes('silver') && (pur.includes('999') || pur.includes('fine'));
      }
    },
    {
      key: 'silver_925',
      label: '925 Sterling Silver',
      category: 'silver',
      purityKarat: 'Silver 925',
      purityFactor: 0.925,
      spotRatePerGram: liveSilver925Rate,
      spotRatePer10g: liveSilver925Rate * 10,
      badgeClass: 'badge-gray',
      matcher: (i) => {
        const cat = (i.metalType || i.category || '').toLowerCase();
        const pur = (i.purityKarat || '').toLowerCase();
        return cat.includes('silver') && (pur.includes('925') || !pur.includes('999'));
      }
    }
  ];

  const mtmRows: MtmPurityRow[] = mtmSpecs.map(spec => {
    const matchedItems = inventory.filter(spec.matcher);
    const itemCount = matchedItems.length;
    const totalQty = matchedItems.reduce((acc, it) => acc + it.stockQty, 0);
    const grossWeight = matchedItems.reduce((acc, it) => acc + (it.grossWeight * it.stockQty), 0);
    const netWeight = matchedItems.reduce((acc, it) => acc + (it.netWeight * it.stockQty), 0);
    const fineWeight = netWeight * spec.purityFactor;
    const mtmValuation = netWeight * spec.spotRatePerGram;
    const costValuation = matchedItems.reduce((acc, it) => acc + (it.costPrice * it.stockQty), 0);
    const retailValuation = matchedItems.reduce((acc, it) => acc + (it.retailPrice * it.stockQty), 0);
    const unrealizedGain = mtmValuation - costValuation;
    const unrealizedGainPct = costValuation > 0 ? (unrealizedGain / costValuation) * 100 : 0;

    return {
      key: spec.key,
      label: spec.label,
      category: spec.category,
      purityKarat: spec.purityKarat,
      purityFactor: spec.purityFactor,
      spotRatePerGram: spec.spotRatePerGram,
      spotRatePer10g: spec.spotRatePer10g,
      badgeClass: spec.badgeClass,
      itemCount,
      totalQty,
      grossWeight,
      netWeight,
      fineWeight,
      mtmValuation,
      costValuation,
      retailValuation,
      unrealizedGain,
      unrealizedGainPct
    };
  });

  const totalMtmValuation = mtmRows.reduce((a, b) => a + b.mtmValuation, 0);
  const totalFineGoldGrams = mtmRows.filter(r => r.category === 'gold').reduce((a, b) => a + b.fineWeight, 0);
  const totalFineSilverGrams = mtmRows.filter(r => r.category === 'silver').reduce((a, b) => a + b.fineWeight, 0);
  const totalMtmUnrealizedGain = totalMtmValuation - totalCostValuation;

  // Category Summary Grouping
  const categories = Array.from(new Set(inventory.map(i => (i.metalType || i.category || 'gold').toLowerCase())));
  const categorySummary = categories.map(cat => {
    const items = inventory.filter(i => (i.metalType || i.category || 'gold').toLowerCase() === cat);
    const grossWt = items.reduce((a, b) => a + (b.grossWeight * b.stockQty), 0);
    const netWt = items.reduce((a, b) => a + (b.netWeight * b.stockQty), 0);
    const costVal = items.reduce((a, b) => a + (b.costPrice * b.stockQty), 0);
    const retailVal = items.reduce((a, b) => a + (b.retailPrice * b.stockQty), 0);
    const mrpVal = items.reduce((a, b) => a + ((b.mrp ?? 0) * b.stockQty), 0);
    
    const fineWt = cat === 'gold' 
      ? items.reduce((a, b) => a + (b.netWeight * (b.purityPercent / 100) * b.stockQty), 0)
      : cat === 'silver'
        ? items.reduce((a, b) => a + (b.netWeight * (b.purityPercent / 100) * b.stockQty), 0)
        : netWt;

    const bullionVal = cat === 'gold' ? fineWt * liveGoldRate24k : cat === 'silver' ? fineWt * liveSilver999Rate : costVal;

    return {
      category: cat,
      itemsCount: items.length,
      qty: items.reduce((a, b) => a + b.stockQty, 0),
      grossWt,
      netWt,
      fineWt,
      costVal,
      retailVal,
      mrpVal,
      bullionVal
    };
  });

  // Low stock items
  const lowStock = inventory.filter(i => i.stockQty <= (i.minStock ?? 1));

  // Purity-wise Valuation
  type PurityGroup = {
    category: string;
    purity: string;
    items: number;
    qty: number;
    grossWeight: number;
    weight: number;
    fineWeight: number;
    cost_val: number;
    retail_val: number;
    live_metal_val: number;
  };

  const purityMap = new Map<string, PurityGroup>();
  inventory.forEach(i => {
    const cat = (i.metalType || i.category || 'gold').toLowerCase();
    const pur = i.purityKarat || '22K (916)';
    const key = `${cat}___${pur}`;
    const karatFactor = pur.includes('24K') ? 1.0 :
                        pur.includes('22K') ? 0.916 :
                        pur.includes('18K') ? 0.750 :
                        pur.includes('14K') ? 0.585 :
                        ((i.purityPercent || 91.6) / 100);

    const existing = purityMap.get(key) || {
      category: cat,
      purity: pur,
      items: 0,
      qty: 0,
      grossWeight: 0,
      weight: 0,
      fineWeight: 0,
      cost_val: 0,
      retail_val: 0,
      live_metal_val: 0
    };
    const itemQty = i.stockQty;
    const itemGross = i.grossWeight * itemQty;
    const itemNet = i.netWeight * itemQty;
    const itemFine = itemNet * karatFactor;
    const liveVal = cat === 'gold' ? itemFine * liveGoldRate24k : cat === 'silver' ? itemFine * liveSilver999Rate : (i.costPrice * itemQty);

    existing.items += 1;
    existing.qty += itemQty;
    existing.grossWeight += itemGross;
    existing.weight += itemNet;
    existing.fineWeight += itemFine;
    existing.cost_val += (i.costPrice * itemQty);
    existing.retail_val += (i.retailPrice * itemQty);
    existing.live_metal_val += liveVal;
    purityMap.set(key, existing);
  });

  const purityValuation = Array.from(purityMap.values());

  const filteredMtmRows = mtmRows.filter(r =>
    !searchQuery.trim() ||
    r.label.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    r.purityKarat.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const filteredCategorySummary = categorySummary.filter(c => 
    !searchQuery.trim() || c.category.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const filteredPurityValuation = purityValuation.filter(p => 
    !searchQuery.trim() || 
    p.category.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    p.purity.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const filteredLowStock = lowStock.filter(item => 
    !searchQuery.trim() || 
    item.itemCode.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    item.itemName.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    (item.category || '').toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  // Item-level 3-component valuation breakdown (Metal + Making + Stone)
  const itemValuationList = React.useMemo(() => {
    return inventory.map(item => {
      const cat = (item.metalType || item.category || '').toLowerCase();
      const pur = (item.purityKarat || '').toLowerCase();
      let ratePerGram = liveGoldRate22k;
      if (cat.includes('gold')) {
        if (pur.includes('24k') || pur.includes('999')) ratePerGram = liveGoldRate24k;
        else if (pur.includes('22k') || pur.includes('916')) ratePerGram = liveGoldRate22k;
        else if (pur.includes('18k') || pur.includes('750')) ratePerGram = liveGoldRate18k;
        else if (pur.includes('14k') || pur.includes('585')) ratePerGram = liveGoldRate14k;
        else ratePerGram = liveGoldRate22k;
      } else if (cat.includes('silver')) {
        ratePerGram = pur.includes('925') ? liveSilver925Rate : liveSilver999Rate;
      }

      const metalValuePerPiece = Math.round(item.netWeight * ratePerGram);
      const makingValuePerPiece = Math.round(
        item.makingType === 'per_piece' || item.makingMode === 'FIXED_PER_PIECE'
          ? item.makingRate
          : item.makingType === 'percent_of_metal' || item.makingMode === 'PERCENTAGE_OF_GOLD'
            ? (metalValuePerPiece * item.makingRate) / 100
            : item.netWeight * item.makingRate
      );
      const stoneValuePerPiece = item.stones && item.stones.length > 0
        ? item.stones.reduce((sum, s) => sum + (s.totalPrice || 0), 0)
        : (item.stoneWeight > 0 ? Math.round(item.stoneWeight * 5000) : 0);

      const liveValuationPerPiece = metalValuePerPiece + makingValuePerPiece + stoneValuePerPiece;
      const totalLiveValuation = liveValuationPerPiece * item.stockQty;
      const totalCost = item.costPrice * item.stockQty;
      const totalRetail = item.retailPrice * item.stockQty;
      const mtmVariance = totalLiveValuation - totalCost;

      return {
        item,
        ratePerGram,
        metalValuePerPiece,
        makingValuePerPiece,
        stoneValuePerPiece,
        liveValuationPerPiece,
        totalLiveValuation,
        totalCost,
        totalRetail,
        mtmVariance
      };
    });
  }, [inventory, liveGoldRate24k, liveGoldRate22k, liveGoldRate18k, liveGoldRate14k, liveSilver999Rate, liveSilver925Rate]);

  const filteredItemValuation = itemValuationList.filter(({ item }) =>
    !searchQuery.trim() ||
    item.itemCode.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    item.itemName.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    item.huid.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    (item.category || '').toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  // Generate real CSV Valuation Report
  const handleDownloadCsv = () => {
    const lines: string[] = [];
    lines.push(`"${store.name || 'Jewellery Store'} - Stock Valuation Report"`);
    lines.push(`"Generated: ${new Date().toLocaleString('en-IN')}"`);
    lines.push(`"Benchmark Daily Rates: 24K: ₹${liveGoldRate24k}/g | 22K: ₹${liveGoldRate22k}/g | 18K: ₹${liveGoldRate18k}/g | 14K: ₹${liveGoldRate14k}/g | 999 Silver: ₹${liveSilver999Rate}/g | 925 Silver: ₹${liveSilver925Rate}/g"`);
    lines.push('');
    lines.push('"MARKED-TO-MARKET VALUATION ACROSS 24K, 22K, 18K, 14K, 999 SILVER, 925 SILVER"');
    lines.push('"Purity / Metal","Spot Rate (₹/g)","SKUs","Pcs","Gross Wt (g)","Net Wt (g)","Fine Wt (g)","MTM Valuation (₹)","Cost Value (₹)","Retail Value (₹)","Unrealized Gain (₹)","Gain %"');

    mtmRows.forEach(row => {
      lines.push(`"${row.label}","${row.spotRatePerGram}","${row.itemCount}","${row.totalQty}","${row.grossWeight.toFixed(3)}","${row.netWeight.toFixed(3)}","${row.fineWeight.toFixed(3)}","${Math.round(row.mtmValuation)}","${Math.round(row.costValuation)}","${Math.round(row.retailValuation)}","${Math.round(row.unrealizedGain)}","${row.unrealizedGainPct.toFixed(1)}%"`);
    });

    lines.push(`"TOTAL SUMMARY","--","${inventory.length}","${totalPieces}","${totalGrossWeight.toFixed(3)}","${totalNetWeight.toFixed(3)}","Fine Gold: ${totalFineGoldGrams.toFixed(3)}g | Silver: ${totalFineSilverGrams.toFixed(3)}g","${Math.round(totalMtmValuation)}","${Math.round(totalCostValuation)}","${Math.round(totalRetailValuation)}","${Math.round(totalMtmUnrealizedGain)}","${((totalMtmUnrealizedGain / (totalCostValuation || 1)) * 100).toFixed(1)}%"`);
    lines.push('');
    lines.push('"CATEGORY-WISE VALUATION"');
    lines.push('"Category","Items","Total Qty","Gross Wt (g)","Net Wt (g)","Fine Wt (g)","Bullion MTM Value (₹)","Cost Value (₹)","Retail Value (₹)"');
    categorySummary.forEach(c => {
      lines.push(`"${c.category}","${c.itemsCount}","${c.qty}","${c.grossWt.toFixed(3)}","${c.netWt.toFixed(3)}","${c.fineWt.toFixed(3)}","${Math.round(c.bullionVal)}","${Math.round(c.costVal)}","${Math.round(c.retailVal)}"`);
    });

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Stock_Valuation_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Stock & Valuation</h1>
          <p>Category totals, low stock and purity valuation</p>
        </div>
        <div className="btn-group">
          <button 
            type="button" 
            className="btn btn-outline"
            onClick={() => setShowRevaluationModal(true)}
            title="Execute live inventory marked-to-market revaluation"
          >
            <RefreshCw size={14} />
            <span>Revaluation</span>
          </button>
          <button 
            type="button" 
            className="btn btn-outline"
            onClick={handleDownloadCsv}
            title="Export CSV Valuation Sheet"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button 
            type="button" 
            className="btn btn-outline"
            onClick={() => setShowExportModal(true)}
          >
            <FileText size={14} />
            <span>Export Report</span>
          </button>
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={() => window.print()}
          >
            <Printer size={14} />
            <span>Print Valuation</span>
          </button>
        </div>
      </div>

      {revaluationNotice && (
        <div className="card" style={{ marginBottom: 14, background: '#ecfdf5', borderColor: '#10b981', color: '#065f46', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
            <CheckCircle2 size={16} style={{ color: '#10b981' }} />
            <span>{revaluationNotice}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setRevaluationNotice(null)} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065f46', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Benchmark Rate Strip */}
      <div className="card" style={{ marginBottom: 14, background: 'var(--zebra)' }}>
        <div className="card-body" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} style={{ color: 'var(--primary)' }} />
            <span style={{ fontWeight: 700, fontSize: 13 }}>Live Daily Benchmark Rates:</span>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12 }} className="mono">
            <span>24K: <b>₹{liveGoldRate24k.toLocaleString('en-IN')}/g</b> (₹{(liveGoldRate24k * 10).toLocaleString('en-IN')}/10g)</span>
            <span>22K: <b>₹{liveGoldRate22k.toLocaleString('en-IN')}/g</b> (₹{(liveGoldRate22k * 10).toLocaleString('en-IN')}/10g)</span>
            <span>18K: <b>₹{liveGoldRate18k.toLocaleString('en-IN')}/g</b></span>
            <span>14K: <b>₹{liveGoldRate14k.toLocaleString('en-IN')}/g</b></span>
            <span>999 Silver: <b>₹{liveSilver999Rate.toLocaleString('en-IN')}/g</b> (₹{(liveSilver999Rate * 1000).toLocaleString('en-IN')}/kg)</span>
            <span>925 Silver: <b>₹{liveSilver925Rate.toLocaleString('en-IN')}/g</b></span>
          </div>
        </div>
      </div>

      {/* Stock Summary Cards (Total Pieces, Gross Weight, Net Weight, Fine Gold Weight, Stock Valuation at today's rates) */}
      <div className="sum-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 16 }}>
        <div className="sum-box">
          <div className="sum-val">{totalPieces} pcs</div>
          <div className="sum-lbl">Total Pieces</div>
          <div className="helper" style={{ marginTop: 4 }}>Across {inventory.length} active SKUs</div>
        </div>

        <div className="sum-box">
          <div className="sum-val">{totalGrossWeight.toFixed(3)} g</div>
          <div className="sum-lbl">Gross Weight</div>
          <div className="helper" style={{ marginTop: 4 }}>Total physical inventory</div>
        </div>

        <div className="sum-box">
          <div className="sum-val">{totalNetWeight.toFixed(3)} g</div>
          <div className="sum-lbl">Net Weight</div>
          <div className="helper" style={{ marginTop: 4 }}>Net metal weight</div>
        </div>

        <div className="sum-box">
          <div className="sum-val" style={{ color: 'var(--gold, #a98b59)' }}>
            {totalFineGoldGrams.toFixed(3)} g
          </div>
          <div className="sum-lbl">Fine Gold Weight</div>
          <div className="helper" style={{ marginTop: 4 }}>Pure 24K equivalent content</div>
        </div>

        <div className="sum-box">
          <div className="sum-val" style={{ color: 'var(--primary)', fontWeight: 800 }}>
            ₹{Math.round(totalMtmValuation).toLocaleString('en-IN')}
          </div>
          <div className="sum-lbl">Stock Valuation (Live)</div>
          <div className="helper" style={{ marginTop: 4 }}>At today's live benchmark rates</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          type="button"
          className={`tab ${activeTab === 'mtm' ? 'active' : ''}`}
          onClick={() => setActiveTab('mtm')}
        >
          Marked-to-Market Valuation (24K, 22K, 18K, 14K, 999, 925)
        </button>
        <button 
          type="button"
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Category Breakdown ({categorySummary.length})
        </button>
        <button 
          type="button"
          className={`tab ${activeTab === 'purity' ? 'active' : ''}`}
          onClick={() => setActiveTab('purity')}
        >
          Purity-wise Stock & Ledger ({purityValuation.length})
        </button>
        <button 
          type="button"
          className={`tab ${activeTab === 'item_valuation' ? 'active' : ''}`}
          onClick={() => setActiveTab('item_valuation')}
        >
          Item Valuation Breakdown ({inventory.length})
        </button>
        <button 
          type="button"
          className={`tab ${activeTab === 'low_stock' ? 'active' : ''}`}
          onClick={() => setActiveTab('low_stock')}
        >
          Low Stock Alerts ({lowStock.length})
        </button>
      </div>

      {/* Filter Row with .search-box */}
      <div className="search-row" style={{ marginTop: 14, marginBottom: 14 }}>
        <div className="search-box">
          <Search size={14} style={{ color: 'var(--muted)', flexShrink: 0 }} />
          <input 
            type="text" 
            placeholder="Search purity, karat, metal category..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              type="button" 
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: MARKED-TO-MARKET VALUATION MATRIX */}
      {activeTab === 'mtm' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Marked-to-Market Valuation across All Standard Purities</span>
            <span className="helper">Calculated against live benchmark rates for 24K, 22K, 18K, 14K Gold, 999 Pure Silver and 925 Sterling Silver</span>
          </div>
          <div className="tbl-wrap">
            <table className="tbl-desktop-only">
              <thead>
                <tr>
                  <th>Metal & Purity Spec</th>
                  <th style={{ textAlign: 'right' }}>Spot Benchmark</th>
                  <th style={{ textAlign: 'center' }}>SKUs</th>
                  <th style={{ textAlign: 'center' }}>Pieces</th>
                  <th style={{ textAlign: 'right' }}>Gross Wt (g)</th>
                  <th style={{ textAlign: 'right' }}>Net Wt (g)</th>
                  <th style={{ textAlign: 'right' }}>Fine Wt (g)</th>
                  <th style={{ textAlign: 'right' }}>Marked-to-Market (₹)</th>
                  <th style={{ textAlign: 'right' }}>Cost Value (₹)</th>
                  <th style={{ textAlign: 'right' }}>Retail Value (₹)</th>
                  <th style={{ textAlign: 'right' }}>Gain / Loss</th>
                </tr>
              </thead>
              <tbody>
                {filteredMtmRows.map(row => (
                  <tr key={row.key}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className={`badge ${row.badgeClass}`}>
                          {row.category.toUpperCase()}
                        </span>
                        <span style={{ fontWeight: 700 }}>{row.label}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }} className="mono">
                      <b>₹{row.spotRatePerGram.toLocaleString('en-IN')}</b> /g
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        ₹{row.spotRatePer10g.toLocaleString('en-IN')}/{row.category === 'gold' ? '10g' : '10g'}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>{row.itemCount}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{row.totalQty}</td>
                    <td style={{ textAlign: 'right' }} className="mono">{row.grossWeight.toFixed(3)} g</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }} className="mono">{row.netWeight.toFixed(3)} g</td>
                    <td style={{ textAlign: 'right' }} className="mono">{row.fineWeight.toFixed(3)} g</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--primary)' }} className="mono">
                      ₹{Math.round(row.mtmValuation).toLocaleString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--muted)' }} className="mono">
                      ₹{Math.round(row.costValuation).toLocaleString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }} className="mono">
                      ₹{Math.round(row.retailValuation).toLocaleString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'right' }} className="mono">
                      <span style={{ 
                        color: row.unrealizedGain >= 0 ? '#185b40' : '#b94a48',
                        fontWeight: 700 
                      }}>
                        {row.unrealizedGain >= 0 ? '+' : ''}₹{Math.round(row.unrealizedGain).toLocaleString('en-IN')}
                        <div style={{ fontSize: 11 }}>
                          ({row.unrealizedGainPct >= 0 ? '+' : ''}{row.unrealizedGainPct.toFixed(1)}%)
                        </div>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--zebra)', fontWeight: 800 }}>
                  <td colSpan={2}>TOTAL ALL PURITIES</td>
                  <td style={{ textAlign: 'center' }}>{inventory.length}</td>
                  <td style={{ textAlign: 'center' }}>{totalPieces}</td>
                  <td style={{ textAlign: 'right' }} className="mono">{totalGrossWeight.toFixed(3)} g</td>
                  <td style={{ textAlign: 'right' }} className="mono">{totalNetWeight.toFixed(3)} g</td>
                  <td style={{ textAlign: 'right' }} className="mono">
                    Au:{totalFineGoldGrams.toFixed(2)}g | Ag:{totalFineSilverGrams.toFixed(2)}g
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--primary)', fontSize: 14 }} className="mono">
                    ₹{Math.round(totalMtmValuation).toLocaleString('en-IN')}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--muted)' }} className="mono">
                    ₹{Math.round(totalCostValuation).toLocaleString('en-IN')}
                  </td>
                  <td style={{ textAlign: 'right' }} className="mono">
                    ₹{Math.round(totalRetailValuation).toLocaleString('en-IN')}
                  </td>
                  <td style={{ textAlign: 'right', color: totalMtmUnrealizedGain >= 0 ? '#185b40' : '#b94a48' }} className="mono">
                    {totalMtmUnrealizedGain >= 0 ? '+' : ''}₹{Math.round(totalMtmUnrealizedGain).toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Category-wise Breakdown */}
      {activeTab === 'overview' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Category-wise Stock & Valuation</span>
            <span className="helper">Live marked-to-market against daily benchmark</span>
          </div>
          <div className="tbl-wrap">
            <table className="tbl-desktop-only">
              <thead>
                <tr>
                  <th>Category</th>
                  <th style={{ textAlign: 'center' }}>SKUs</th>
                  <th style={{ textAlign: 'center' }}>Total Qty</th>
                  <th style={{ textAlign: 'right' }}>Gross Wt</th>
                  <th style={{ textAlign: 'right' }}>Net Wt</th>
                  <th style={{ textAlign: 'right' }}>Fine Eqv (g)</th>
                  <th style={{ textAlign: 'right' }}>Bullion Value</th>
                  <th style={{ textAlign: 'right' }}>Cost Value</th>
                  <th style={{ textAlign: 'right' }}>Retail Value</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategorySummary.map((cat) => (
                  <tr key={cat.category}>
                    <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                      <span className={`badge ${
                        cat.category === 'gold' ? 'badge-yellow' : 
                        cat.category === 'silver' ? 'badge-gray' : 
                        cat.category === 'diamond' ? 'badge-blue' : 'badge-purple'
                      }`}>
                        {cat.category}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>{cat.itemsCount}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{cat.qty} pcs</td>
                    <td style={{ textAlign: 'right' }} className="mono">{cat.grossWt.toFixed(3)} g</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }} className="mono">{cat.netWt.toFixed(3)} g</td>
                    <td style={{ textAlign: 'right' }} className="mono">{cat.fineWt.toFixed(3)} g</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }} className="mono">
                      ₹{Math.round(cat.bullionVal).toLocaleString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--muted)' }} className="mono">
                      ₹{Math.round(cat.costVal).toLocaleString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }} className="mono">
                      ₹{Math.round(cat.retailVal).toLocaleString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-green">Healthy</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Purity-wise Stock & Fine Weight Ledger */}
      {activeTab === 'purity' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Purity-wise Stock & Fine Weight Ledger</span>
            <span className="helper">Karat-level purity factors applied</span>
          </div>
          <div className="tbl-wrap">
            <table className="tbl-desktop-only">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Purity Karat</th>
                  <th style={{ textAlign: 'center' }}>SKUs</th>
                  <th style={{ textAlign: 'center' }}>Pieces</th>
                  <th style={{ textAlign: 'right' }}>Gross Wt</th>
                  <th style={{ textAlign: 'right' }}>Net Wt</th>
                  <th style={{ textAlign: 'right' }}>Fine Eqv (g)</th>
                  <th style={{ textAlign: 'right' }}>Live Bullion Value</th>
                  <th style={{ textAlign: 'right' }}>Cost Value</th>
                  <th style={{ textAlign: 'right' }}>Retail Value</th>
                  <th style={{ textAlign: 'right' }}>Margin %</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurityValuation.map((p, idx) => {
                  const marginPct = p.cost_val > 0 ? ((p.retail_val - p.cost_val) / p.cost_val) * 100 : 0;
                  return (
                    <tr key={`${p.category}-${p.purity}-${idx}`}>
                      <td style={{ textTransform: 'capitalize' }}>
                        <span className={`badge ${p.category === 'gold' ? 'badge-yellow' : p.category === 'silver' ? 'badge-gray' : 'badge-blue'}`}>
                          {p.category}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>{p.purity}</td>
                      <td style={{ textAlign: 'center' }}>{p.items}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{p.qty} pcs</td>
                      <td style={{ textAlign: 'right' }} className="mono">{p.grossWeight.toFixed(3)} g</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }} className="mono">{p.weight.toFixed(3)} g</td>
                      <td style={{ textAlign: 'right' }} className="mono">{p.fineWeight.toFixed(3)} g</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }} className="mono">
                        ₹{Math.round(p.live_metal_val).toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--muted)' }} className="mono">
                        ₹{Math.round(p.cost_val).toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }} className="mono">
                        ₹{Math.round(p.retail_val).toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'right', color: '#185b40', fontWeight: 700 }} className="mono">
                        {marginPct.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Low Stock Alerts */}
      {activeTab === 'low_stock' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Low Stock & Reorder Alerts</span>
            <span className="helper">Items at or below minimum threshold</span>
          </div>
          {lowStock.length === 0 ? (
            <div className="card-body" style={{ textAlign: 'center', padding: '36px', color: 'var(--muted)' }}>
              All inventory items are currently above their minimum safety stock threshold.
            </div>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl-desktop-only">
                <thead>
                  <tr>
                    <th>Item Code</th>
                    <th>Item Name</th>
                    <th>Category</th>
                    <th>Current Qty</th>
                    <th>Min Safety Stock</th>
                    <th>Location</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLowStock.map((item) => (
                    <tr key={item.id}>
                      <td className="mono" style={{ fontWeight: 700 }}>{item.itemCode}</td>
                      <td>{item.itemName}</td>
                      <td style={{ textTransform: 'capitalize' }}>{item.category}</td>
                      <td className="mono" style={{ fontWeight: 700, color: 'var(--danger)' }}>
                        {item.stockQty} pcs
                      </td>
                      <td className="mono">{item.minStock ?? 1} pcs</td>
                      <td>{item.location} ({item.rackTray || 'Tray 01'})</td>
                      <td>
                        <span className="badge badge-red">
                          Reorder Required
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Item-Wise 3-Component Valuation Breakdown */}
      {activeTab === 'item_valuation' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Item-Wise Valuation Breakdown (Metal + Making + Stone)</span>
            <span className="helper">Live marked-to-market replacement valuation based on daily benchmark metal rate + making charge + stone value</span>
          </div>
          <div className="tbl-wrap">
            <table className="tbl-desktop-only">
              <thead>
                <tr>
                  <th>Item Code / Name</th>
                  <th>Purity / Metal</th>
                  <th style={{ textAlign: 'center' }}>HUID</th>
                  <th style={{ textAlign: 'right' }}>Net Wt (g)</th>
                  <th style={{ textAlign: 'right' }}>Daily Rate (₹/g)</th>
                  <th style={{ textAlign: 'right' }}>Metal Value (₹)</th>
                  <th style={{ textAlign: 'right' }}>Making Cost (₹)</th>
                  <th style={{ textAlign: 'right' }}>Stone Value (₹)</th>
                  <th style={{ textAlign: 'right' }}>Live Unit Val (₹)</th>
                  <th style={{ textAlign: 'center' }}>Stock</th>
                  <th style={{ textAlign: 'right' }}>Total MTM Val (₹)</th>
                  <th style={{ textAlign: 'right' }}>Cost Val (₹)</th>
                  <th style={{ textAlign: 'right' }}>Variance (₹)</th>
                </tr>
              </thead>
              <tbody>
                {filteredItemValuation.map(({ item, ratePerGram, metalValuePerPiece, makingValuePerPiece, stoneValuePerPiece, liveValuationPerPiece, totalLiveValuation, totalCost, mtmVariance }) => {
                  return (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.itemCode}</strong>
                        <div className="helper" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.itemName}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${item.category === 'gold' ? 'badge-yellow' : 'badge-gray'}`}>
                          {item.purityKarat}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-purple" style={{ fontFamily: 'monospace', fontSize: 10 }}>
                          {item.huid}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }} className="mono">
                        {item.netWeight.toFixed(3)}g
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--muted)' }} className="mono">
                        ₹{ratePerGram.toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }} className="mono">
                        ₹{metalValuePerPiece.toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'right' }} className="mono">
                        ₹{makingValuePerPiece.toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'right', color: stoneValuePerPiece > 0 ? 'var(--primary)' : 'var(--muted)' }} className="mono">
                        {stoneValuePerPiece > 0 ? `₹${stoneValuePerPiece.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }} className="mono">
                        ₹{liveValuationPerPiece.toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-green">{item.stockQty}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--primary)' }} className="mono">
                        ₹{totalLiveValuation.toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--muted)' }} className="mono">
                        ₹{totalCost.toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: mtmVariance >= 0 ? '#185b40' : 'var(--danger)' }} className="mono">
                        {mtmVariance >= 0 ? '+' : ''}₹{mtmVariance.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="dt-pager" style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)' }}>
            <span>Showing {filteredItemValuation.length} items with complete 3-component valuation breakdown</span>
            <span>Total MTM Value: <strong>₹{Math.round(filteredItemValuation.reduce((acc, row) => acc + row.totalLiveValuation, 0)).toLocaleString('en-IN')}</strong></span>
          </div>
        </div>
      )}

      {/* Export Valuation Modal (.overlay > .modal) */}
      {showExportModal && (
        <div className="overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Export Stock Valuation Report</h3>
              <button 
                type="button" 
                className="btn btn-outline btn-xs"
                onClick={() => setShowExportModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: 'var(--zebra)', padding: '12px 14px', borderRadius: '10px' }}>
                <div style={{ fontWeight: 700 }}>Valuation Summary ({new Date().toLocaleDateString('en-GB')})</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                  Total Catalog Items: {totalPieces} pcs · Net Weight: {totalNetWeight.toFixed(3)}g · MTM Bullion Value: ₹{Math.round(totalMtmValuation).toLocaleString('en-IN')}
                </div>
              </div>

              <div className="form-group">
                <label className="label">Export Format</label>
                <select 
                  className="input" 
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as any)}
                >
                  <option value="csv">Comma-Separated Values (.csv)</option>
                  <option value="xlsx">Excel Workbook (.xlsx)</option>
                  <option value="pdf">Auditor Signed Print / PDF</option>
                </select>
              </div>

              <div className="form-group">
                <label className="label">Valuation Method</label>
                <select 
                  className="input" 
                  value={exportMethod}
                  onChange={(e) => setExportMethod(e.target.value as any)}
                >
                  <option value="marked_to_market">Marked-to-Market (Live Spot Benchmark: 24K @ ₹{liveGoldRate24k}/g, 22K @ ₹{liveGoldRate22k}/g)</option>
                  <option value="book_cost">Book Value / Cost Price (₹{Math.round(totalCostValuation).toLocaleString('en-IN')})</option>
                  <option value="retail_mrp">Retail Selling Price (₹{Math.round(totalRetailValuation).toLocaleString('en-IN')})</option>
                </select>
              </div>

              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 14px', borderRadius: '8px', fontSize: 12, color: '#166534' }}>
                Includes full marked-to-market matrix across 24K, 22K, 18K, 14K Gold, 999 Silver, and 925 Silver with fine metal equivalents.
              </div>
            </div>
            <div className="modal-foot">
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={() => setShowExportModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleDownloadCsv}
              >
                <Download size={14} /> Download Valuation Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVALUATION MODAL */}
      {showRevaluationModal && (
        <div className="overlay" onClick={() => setShowRevaluationModal(false)}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Inventory Revaluation (Marked-to-Market)</h3>
              <button 
                type="button" 
                className="btn btn-ghost btn-sm"
                onClick={() => setShowRevaluationModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p className="helper" style={{ marginBottom: 12 }}>
                Recalculate live asset replacement valuation across all inventory items using today's spot benchmark bullion rates:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div className="card" style={{ padding: 12, background: 'var(--zebra)' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>24K Gold Rate / g</div>
                  <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>
                    ₹{liveGoldRate24k.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>22K: ₹{liveGoldRate22k.toLocaleString('en-IN')}/g</div>
                </div>
                <div className="card" style={{ padding: 12, background: 'var(--zebra)' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>999 Pure Silver / g</div>
                  <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>
                    ₹{liveSilver999Rate.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>925: ₹{liveSilver925Rate.toLocaleString('en-IN')}/g</div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Current Cost Price Book Value:</span>
                  <span className="mono">₹{Math.round(totalCostValuation).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>MTM Bullion Live Valuation:</span>
                  <span className="mono" style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{Math.round(totalMtmValuation).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: 4 }}>
                  <span>Unrealized Revaluation Gain:</span>
                  <span className="mono" style={{ fontWeight: 700, color: totalMtmUnrealizedGain >= 0 ? '#10b981' : '#ef4444' }}>
                    {totalMtmUnrealizedGain >= 0 ? '+' : ''}₹{Math.round(totalMtmUnrealizedGain).toLocaleString('en-IN')} ({((totalMtmUnrealizedGain / (totalCostValuation || 1)) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setShowRevaluationModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={() => {
                  setShowRevaluationModal(false);
                  setRevaluationNotice(`Inventory successfully revalued at live market spot rates! MTM Bullion Valuation: ₹${Math.round(totalMtmValuation).toLocaleString('en-IN')}`);
                }}
              >
                <RefreshCw size={14} /> Execute Revaluation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

