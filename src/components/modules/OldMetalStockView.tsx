import React, { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  Flame, Layers, Plus, Search, ShieldCheck, ArrowRight, 
  CheckCircle2, Clock, Factory, Scale, FileText, Download, Printer, X, FileSpreadsheet, RefreshCw
} from 'lucide-react';
import { OldMetalStockItem, StoreProfile } from '../../types';

interface OldMetalStockViewProps {
  store: StoreProfile;
  stock: OldMetalStockItem[];
}

interface ScrapPiece {
  id: string;
  date: string;
  source: string;
  metal: 'gold' | 'silver';
  purity: string;
  testedTouch?: number; // e.g. 84.5% or 91.6%
  testStatus: 'Pending test' | 'Tested';
  grossWeight: number;
  stoneWeight: number;
  otherDeductions: number;
  netWeight: number;
  fineWeight: number;
  ratePer10g: number;
  rateBasis: 'fine_per_10g' | 'net_per_10g';
  totalValue: number;
  stage: 'INTAKE' | 'TESTED' | 'MELTED' | 'BAR_REFINING';
  status?: string;
  refineryJobId?: string;
  vaultLocation: string;
  notes?: string;
}

export const OldMetalStockView: React.FC<OldMetalStockViewProps> = ({
  store,
  stock
}) => {
  // Rich scrap records matching Scrap vault stages
  const [pieces, setPieces] = useState<ScrapPiece[]>([
    {
      id: 'sc-01',
      date: '15-Nov-2026',
      source: 'Buyback: INV-2026-00276 (Sujal Shah)',
      metal: 'gold',
      purity: '22K (916)',
      testedTouch: 91.6,
      testStatus: 'Tested',
      grossWeight: 8.500,
      stoneWeight: 0.200,
      otherDeductions: 0.100,
      netWeight: 8.200,
      fineWeight: 7.511,
      ratePer10g: 78500,
      rateBasis: 'fine_per_10g',
      totalValue: 58962.85,
      stage: 'TESTED',
      vaultLocation: 'Vault Drawer G-01',
      notes: 'Old chain with stones removed'
    },
    {
      id: 'sc-02',
      date: '14-Nov-2026',
      source: 'Exchange: INV-2026-00274',
      metal: 'gold',
      purity: '18K (750)',
      testedTouch: 75.0,
      testStatus: 'Tested',
      grossWeight: 14.200,
      stoneWeight: 0.000,
      otherDeductions: 0.200,
      netWeight: 14.000,
      fineWeight: 10.500,
      ratePer10g: 78500,
      rateBasis: 'fine_per_10g',
      totalValue: 82425.00,
      stage: 'MELTED',
      vaultLocation: 'Melting Vault MV-01',
      notes: 'Melted into 14.0g dhal'
    },
    {
      id: 'sc-03',
      date: '12-Nov-2026',
      source: 'Old Gold Purchase: OG-2026-0019',
      metal: 'gold',
      purity: '20K Antique',
      testedTouch: undefined,
      testStatus: 'Pending test',
      grossWeight: 9.600,
      stoneWeight: 0.500,
      otherDeductions: 0.400,
      netWeight: 8.700,
      fineWeight: 7.221,
      ratePer10g: 78500,
      rateBasis: 'fine_per_10g',
      totalValue: 56684.85,
      stage: 'INTAKE',
      vaultLocation: 'Intake Drawer T-01',
      notes: 'Antique bangles received, requires touchstone assay'
    },
    {
      id: 'sc-04',
      date: '10-Nov-2026',
      source: 'Batch #REF-2026-003',
      metal: 'gold',
      purity: '999.9 Fine Bar',
      testedTouch: 99.9,
      testStatus: 'Tested',
      grossWeight: 100.000,
      stoneWeight: 0.000,
      otherDeductions: 0.000,
      netWeight: 100.000,
      fineWeight: 99.900,
      ratePer10g: 78500,
      rateBasis: 'fine_per_10g',
      totalValue: 784215.00,
      stage: 'BAR_REFINING',
      refineryJobId: 'MMTC-JOB-981',
      vaultLocation: 'Bullion Safe B-02',
      notes: 'Assayed 999.9 Fine Gold Bar refined by refinery'
    },
    {
      id: 'sc-05',
      date: '13-Nov-2026',
      source: 'Old Silver Purchase: OS-2026-0008',
      metal: 'silver',
      purity: '80% Silver Scrap',
      testedTouch: 80.0,
      testStatus: 'Tested',
      grossWeight: 120.000,
      stoneWeight: 0.000,
      otherDeductions: 2.000,
      netWeight: 118.000,
      fineWeight: 94.400,
      ratePer10g: 950,
      rateBasis: 'fine_per_10g',
      totalValue: 8968.00,
      stage: 'TESTED',
      vaultLocation: 'Silver Vault Drawer S-01',
      notes: 'Old silver utensils & anklets melted lot'
    }
  ]);

  const [activeStageFilter, setActiveStageFilter] = useState<string>('ALL');
  const [selectedMetal, setSelectedMetal] = useState<string>('ALL');
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState<string>('');
  const [activeMainTab, setActiveMainTab] = useState<'batches' | 'refinery_jobs' | 'refined_stock'>('batches');

  // Refinery Jobs state
  const [refineryJobs, setRefineryJobs] = useState([
    {
      id: 'rj-1',
      jobNo: 'RJ-2026-00041',
      sentDate: '12-Nov-2026',
      metal: 'Gold',
      refiner: 'MMTC-PAMP India Ltd.',
      carriedBy: 'Suresh Patil (Senior Escort)',
      pieces: 5,
      sentFine: 45.220,
      receivedFine: 44.980,
      lossFine: 0.240,
      status: 'REFINED_BACK' as const
    },
    {
      id: 'rj-2',
      jobNo: 'RJ-2026-00042',
      sentDate: '15-Nov-2026',
      metal: 'Gold',
      refiner: 'Valcambi Refining Labs',
      carriedBy: 'Ramesh Sharma',
      pieces: 3,
      sentFine: 28.500,
      receivedFine: 0.000,
      lossFine: 0.000,
      status: 'IN_PROCESS' as const
    },
    {
      id: 'rj-3',
      jobNo: 'RJ-2026-00040',
      sentDate: '08-Nov-2026',
      metal: 'Silver',
      refiner: 'Kalyan Silver Refinery',
      carriedBy: 'Courier (Safe Logistics)',
      pieces: 12,
      sentFine: 850.000,
      receivedFine: 844.500,
      lossFine: 5.500,
      status: 'REFINED_BACK' as const
    }
  ]);

  // Refined Pure Bullion Stock in Vault (Available to Pay Supplier Bills)
  const [refinedStock, setRefinedStock] = useState([
    {
      id: 'rb-01',
      barNo: 'MMTC-24K-999-001',
      metal: 'Gold 24K (999.9)',
      type: 'Fine Gold Bar',
      weight: 44.980,
      fineTouch: 99.99,
      receivedFromJob: 'RJ-2026-00041',
      dateReceived: '14-Nov-2026',
      vaultSafe: 'Bullion Safe B-02',
      status: 'AVAILABLE' as const,
      purpose: 'Supplier Bill Settlement / New Casting'
    },
    {
      id: 'rb-02',
      barNo: 'SILVER-999-DHAL-01',
      metal: 'Silver 999',
      type: 'Pure Silver Dhal',
      weight: 844.500,
      fineTouch: 99.90,
      receivedFromJob: 'RJ-2026-00040',
      dateReceived: '11-Nov-2026',
      vaultSafe: 'Bullion Safe S-01',
      status: 'AVAILABLE' as const,
      purpose: 'Supplier Bill Settlement'
    },
    {
      id: 'rb-03',
      barNo: 'AU24-BAR-00001',
      metal: 'Gold 24K (999.9)',
      type: 'Casting Grain Bar',
      weight: 100.000,
      fineTouch: 99.98,
      receivedFromJob: 'PO-2026-00001 / GRN-2026-00001 (Rajesh Bullion)',
      dateReceived: '04-Nov-2026',
      vaultSafe: 'Bullion Safe Drawer G-01',
      status: 'AVAILABLE' as const,
      purpose: 'Raw Material for Casting / Ornaments'
    }
  ]);

  type MetalStockTab = 'Pending test' | 'In stock' | 'At refiner' | 'Closed' | 'Refinery jobs' | 'Refined stock';
  const [activeTab, setActiveTab] = useState<MetalStockTab>('In stock');

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showMoveStageModal, setShowMoveStageModal] = useState<boolean>(false);
  const [showRefineryJobModal, setShowRefineryJobModal] = useState<boolean>(false);
  const [showReceiveBarModal, setShowReceiveBarModal] = useState<boolean>(false);
  const [activePieceForMove, setActivePieceForMove] = useState<ScrapPiece | null>(null);
  const [targetStage, setTargetStage] = useState<'INTAKE' | 'TESTED' | 'MELTED' | 'BAR_REFINING'>('TESTED');
  const [moveTouchInput, setMoveTouchInput] = useState<string>('91.6');
  const [moveMeltingLossInput, setMoveMeltingLossInput] = useState<string>('0.050');

  // Refinery Return Modal State
  const [activeJobForReturn, setActiveJobForReturn] = useState<any>(null);
  const [returnBarGrossWeight, setReturnBarGrossWeight] = useState<string>('0');
  const [returnTouchPurity, setReturnTouchPurity] = useState<string>('99.90');
  const [returnRefiningLoss, setReturnRefiningLoss] = useState<string>('0.150');
  const [returnAssayCert, setReturnAssayCert] = useState<string>('');
  const [returnRefiningCharges, setReturnRefiningCharges] = useState<string>('1200');
  const [returnVaultSafe, setReturnVaultSafe] = useState<string>('Bullion Safe B-02');

  // Refinery Job Form State
  const [jobMetal, setJobMetal] = useState<'Gold' | 'Silver'>('Gold');
  const [jobRefiner, setJobRefiner] = useState('MMTC-PAMP India Ltd.');
  const [jobCarriedBy, setJobCarriedBy] = useState('Suresh Patil (Escort)');

  // Form State for New Scrap Batch
  const [sourceInput, setSourceInput] = useState('Customer Buyback');
  const [metalInput, setMetalInput] = useState<'gold' | 'silver'>('gold');
  const [purityInput, setPurityInput] = useState('22K (916)');
  const [grossInput, setGrossInput] = useState('10.000');
  const [stoneInput, setStoneInput] = useState('0.000');
  const [deductionInput, setDeductionInput] = useState('0.000');
  const [touchInput, setTouchInput] = useState('91.6');
  const [rateInput, setRateInput] = useState('78500');
  const [vaultInput, setVaultInput] = useState('Vault Drawer G-01');
  const [notesInput, setNotesInput] = useState('');

  // Derived calculations for New Batch
  const parsedGross = parseFloat(grossInput) || 0;
  const parsedStone = parseFloat(stoneInput) || 0;
  const parsedDeduct = parseFloat(deductionInput) || 0;
  const computedNet = Math.max(0, parsedGross - parsedStone - parsedDeduct);
  const parsedTouch = parseFloat(touchInput) || 91.6;
  const computedFine = (computedNet * parsedTouch) / 100;
  const parsedRate = parseFloat(rateInput) || 78500;
  const computedTotalValue = (computedFine * parsedRate) / 10;

  // Stage Metrics Calculations
  const intakePieces = pieces.filter(p => p.stage === 'INTAKE');
  const testedPieces = pieces.filter(p => p.stage === 'TESTED');
  const meltedPieces = pieces.filter(p => p.stage === 'MELTED');
  const refinedPieces = pieces.filter(p => p.stage === 'BAR_REFINING');

  const intakeFine = intakePieces.reduce((a, b) => a + b.fineWeight, 0);
  const testedFine = testedPieces.reduce((a, b) => a + b.fineWeight, 0);
  const meltedFine = meltedPieces.reduce((a, b) => a + b.fineWeight, 0);
  const refinedFine = refinedPieces.reduce((a, b) => a + b.fineWeight, 0);

  const totalFineGoldInVault = pieces
    .filter(p => p.metal === 'gold')
    .reduce((a, b) => a + b.fineWeight, 0);

  const totalScrapValuation = pieces.reduce((a, b) => a + b.totalValue, 0);

  const belongsToTab = (piece: ScrapPiece, tab: MetalStockTab) => {
    const closed = piece.status === 'Settled' || refineryJobs.some(job =>
      (job.id === piece.refineryJobId || job.jobNo === piece.refineryJobId) && job.status === 'REFINED_BACK');
    const atRefiner = !closed && Boolean(piece.refineryJobId || piece.stage === 'BAR_REFINING');
    if (tab === 'Closed') return closed;
    if (tab === 'At refiner') return atRefiner;
    if (closed || atRefiner) return false;
    if (tab === 'Pending test') return piece.testStatus === 'Pending test' || piece.stage === 'INTAKE';
    return tab === 'In stock' && piece.testStatus === 'Tested' && (piece.stage === 'TESTED' || piece.stage === 'MELTED');
  };
  const filteredPieces = pieces.filter(p => {
    if (!belongsToTab(p, activeTab)) return false;
    if (activeStageFilter !== 'ALL' && p.stage !== activeStageFilter) return false;
    if (selectedMetal !== 'ALL' && p.metal !== selectedMetal) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return (
        p.id.toLowerCase().includes(q) ||
        p.source.toLowerCase().includes(q) ||
        p.purity.toLowerCase().includes(q) ||
        p.vaultLocation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const canSelect = activeTab === 'Pending test' || activeTab === 'In stock';
  const selectedPieces = filteredPieces.filter(piece => selectedBatchIds.includes(piece.id));
  const allSelected = canSelect && filteredPieces.length > 0 && selectedPieces.length === filteredPieces.length;
  const jobMetalSelection = selectedPieces[0]?.metal;
  const dispatchFine = selectedPieces.reduce((sum, piece) => sum + piece.fineWeight, 0);
  const canDispatch = activeTab === 'In stock' && selectedPieces.length > 0 && selectedPieces.every(piece =>
    piece.metal === jobMetalSelection && Number.isFinite(piece.fineWeight) && piece.fineWeight > 0);

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = selectedPieces.length > 0 && !allSelected;
  }, [selectedPieces.length, allSelected]);

  const showTab = (tab: MetalStockTab) => {
    setSelectedBatchIds([]);
    setActiveTab(tab);
  };
  const refinerLabel = (piece: ScrapPiece) => refineryJobs.find(job =>
    job.id === piece.refineryJobId || job.jobNo === piece.refineryJobId)?.refiner ?? piece.refineryJobId ?? '';

  const downloadStock = (name: string, headers: string[], rows: Array<Array<string | number | undefined>>, format: 'csv' | 'xlsx') => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([headers, ...rows]), 'Metal stock');
    XLSX.writeFile(workbook, `${name}_${new Date().toISOString().slice(0, 10)}.${format}`, { bookType: format });
  };

  const handleExport = (format: 'csv' | 'xlsx') => {
    if (activeTab === 'Refinery jobs') {
      const headers = ['Job No', 'Sent Date', 'Metal', 'Refiner', 'Carrier', 'Pieces', 'Sent Fine (g)', 'Received Fine (g)', 'Loss (g)', 'Status'];
      const rows = refineryJobs.map(j => [
        j.jobNo, j.sentDate, j.metal, j.refiner, j.carriedBy, j.pieces, j.sentFine.toFixed(3), j.receivedFine.toFixed(3), j.lossFine.toFixed(3), j.status
      ]);
      downloadStock('refinery_jobs', headers, rows, format);
    } else if (activeTab === 'Refined stock') {
      const headers = ['Bar No', 'Metal', 'Type', 'Weight (g)', 'Fine Touch %', 'Received From Job', 'Date', 'Vault', 'Status', 'Purpose'];
      const rows = refinedStock.map(b => [
        b.barNo, b.metal, b.type, b.weight.toFixed(3), b.fineTouch, b.receivedFromJob, b.dateReceived, b.vaultSafe, b.status, b.purpose
      ]);
      downloadStock('refined_bullion_bars', headers, rows, format);
    } else {
      const headers = ['Batch ID', 'Date', 'Source', 'Metal', 'Purity', 'Gross Wt (g)', 'Net Wt (g)', 'Touch %', 'Fine Wt (g)', 'Stage', 'Tested', 'Vault', 'Refiner'];
      const rows = filteredPieces.map(p => [
        p.id, p.date, p.source, p.metal, p.purity, p.grossWeight.toFixed(3), p.netWeight.toFixed(3), p.testedTouch, p.fineWeight.toFixed(3), p.stage, p.testStatus, p.vaultLocation, refinerLabel(p)
      ]);
      downloadStock('old_metal_stock', headers, rows, format);
    }
  };

  const handleTriggerMove = () => {
    if (!canSelect || selectedPieces.length !== 1) return;
    const [piece] = selectedPieces;
    setActivePieceForMove(piece);
    setMoveTouchInput(piece.testedTouch?.toString() ?? '');
    setMoveMeltingLossInput('0');
    setTargetStage(piece.stage === 'INTAKE' ? 'TESTED' : piece.stage === 'TESTED' ? 'MELTED' : 'TESTED');
    setShowMoveStageModal(true);
  };

  const handleCreateScrapBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedGross <= 0) {
      alert('Gross weight must be greater than 0');
      return;
    }

    const newPiece: ScrapPiece = {
      id: `sc-${Date.now().toString().slice(-4)}`,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      source: sourceInput,
      metal: metalInput,
      purity: purityInput,
      testedTouch: parsedTouch,
      testStatus: parsedTouch > 0 ? 'Tested' : 'Pending test',
      grossWeight: parsedGross,
      stoneWeight: parsedStone,
      otherDeductions: parsedDeduct,
      netWeight: computedNet,
      fineWeight: computedFine,
      ratePer10g: parsedRate,
      rateBasis: 'fine_per_10g',
      totalValue: computedTotalValue,
      stage: 'INTAKE',
      vaultLocation: vaultInput,
      notes: notesInput
    };

    setPieces([newPiece, ...pieces]);
    setShowAddModal(false);
  };

  const handleConfirmStageMove = () => {
    if (!activePieceForMove || targetStage === 'BAR_REFINING') return;
    const parsedTouch = Number(moveTouchInput);
    if (!(parsedTouch > 0 && parsedTouch <= 100)) {
      alert('Enter an assay value greater than zero and at most 100%.');
      return;
    }
    const meltingLoss = targetStage === 'MELTED' ? Number(moveMeltingLossInput) : 0;
    if (!Number.isFinite(meltingLoss) || meltingLoss < 0 || meltingLoss >= activePieceForMove.netWeight) {
      alert('Enter a non-negative melting loss below the net weight.');
      return;
    }
    const adjustedNet = Math.max(0, activePieceForMove.netWeight - meltingLoss);
    const adjustedFine = adjustedNet * (parsedTouch / 100);

    setPieces(pieces.map(p => {
      if (p.id === activePieceForMove.id) {
        return {
          ...p,
          stage: targetStage,
          testStatus: targetStage === 'INTAKE' ? p.testStatus : 'Tested',
          testedTouch: parsedTouch,
          netWeight: adjustedNet,
          fineWeight: adjustedFine,
          vaultLocation: targetStage === 'INTAKE' ? 'Intake Drawer T-01' :
                         targetStage === 'TESTED' ? 'Vault Drawer G-01' :
                         targetStage === 'MELTED' ? 'Melting Vault MV-01' : 'Bullion Safe B-02',
          notes: targetStage === 'MELTED' ? `Melted into ${adjustedNet.toFixed(3)}g dhal (Touch: ${parsedTouch}%, Loss: ${meltingLoss.toFixed(3)}g)` : p.notes
        };
      }
      return p;
    }));
    setSelectedBatchIds([]);
    setShowMoveStageModal(false);
  };

  const handleOpenReceiveReturn = (job: any) => {
    setActiveJobForReturn(job);
    const estFine = job.sentFine * 0.995;
    setReturnBarGrossWeight(estFine.toFixed(3));
    setReturnTouchPurity('99.90');
    setReturnRefiningLoss((job.sentFine - estFine).toFixed(3));
    setReturnAssayCert(`${job.refiner.split(' ')[0].toUpperCase()}-CERT-${Math.floor(1000 + Math.random() * 9000)}`);
    setReturnRefiningCharges('1500');
    setReturnVaultSafe(job.metal === 'Gold' ? 'Bullion Safe B-02' : 'Silver Vault SV-01');
    setShowReceiveBarModal(true);
  };

  const handleConfirmReceiveReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJobForReturn || !refineryJobs.some(job => job.id === activeJobForReturn.id && job.status === 'IN_PROCESS')) return;
    const gross = parseFloat(returnBarGrossWeight) || 0;
    const touch = parseFloat(returnTouchPurity) || 99.9;
    const fineRec = gross * (touch / 100);
    const loss = Math.max(0, activeJobForReturn.sentFine - fineRec);

    setRefineryJobs(prev => prev.map(j => j.id === activeJobForReturn.id ? {
      ...j,
      receivedFine: fineRec,
      lossFine: loss,
      status: 'REFINED_BACK' as const
    } : j));

    const isGold = activeJobForReturn.metal === 'Gold';
    const newBar = {
      id: `rb-${Date.now()}`,
      barNo: `${isGold ? 'GOLD-999-BAR' : 'SILVER-999-DHAL'}-${String(refinedStock.length + 1).padStart(3, '0')}`,
      metal: isGold ? 'Gold 24K (999.9)' : 'Silver 999',
      type: isGold ? 'Fine Gold Bar' : 'Pure Silver Dhal',
      weight: fineRec,
      fineTouch: touch,
      receivedFromJob: activeJobForReturn.jobNo,
      dateReceived: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      vaultSafe: returnVaultSafe,
      status: 'AVAILABLE' as const,
      purpose: 'Supplier Bill Settlement / Minting'
    };
    setRefinedStock(prev => [newBar, ...prev]);

    setPieces(prev => prev.map(p => p.refineryJobId === activeJobForReturn.jobNo ? {
      ...p,
      stage: 'BAR_REFINING' as const,
      vaultLocation: returnVaultSafe
    } : p));

    setShowReceiveBarModal(false);
    alert(`Refined 999.9 Bar ${newBar.barNo} (${fineRec.toFixed(3)}g) received back from ${activeJobForReturn.refiner} and deposited into ${returnVaultSafe}!`);
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Old Metal Stock</h1>
          <p>Old gold and melted buy-back pieces → refinery jobs (gold and silver separately) → refined metal, which can pay supplier bills.</p>
        </div>
        <div className="btn-group">
          <button 
            type="button" 
            className="btn btn-outline"
            onClick={handleTriggerMove}
            disabled={!canSelect || selectedPieces.length !== 1}
            title="Move / Advance stage for piece"
          >
            <ArrowRight size={14} />
            <span>Move</span>
          </button>
          <button 
            type="button" 
            className="btn btn-outline"
            disabled={!canDispatch}
            onClick={() => {
              if (!canDispatch) return;
              setJobMetal(jobMetalSelection === 'gold' ? 'Gold' : 'Silver');
              setJobCarriedBy('');
              setShowRefineryJobModal(true);
            }}
            title="Send to refinery for pure bullion conversion"
          >
            <Factory size={14} />
            <span>Send to refinery</span>
          </button>
          <button 
            type="button" 
            className="btn btn-outline"
            onClick={() => handleExport('csv')}
            title="Export CSV"
          >
            <Download size={14} />
            <span>CSV</span>
          </button>
          <button 
            type="button" 
            className="btn btn-outline"
            onClick={() => handleExport('xlsx')}
            title="Export Excel"
          >
            <FileSpreadsheet size={14} />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs: Pending test, In stock, At refiner, Closed, Refinery jobs, Refined stock */}
      <div className="tabs" style={{ marginBottom: 14 }}>
        <button 
          type="button" 
          className={`tab ${activeTab === 'Pending test' ? 'active' : ''}`}
          onClick={() => showTab('Pending test')}
        >
          Pending test ({pieces.filter(piece => belongsToTab(piece, 'Pending test')).length})
        </button>
        <button 
          type="button" 
          className={`tab ${activeTab === 'In stock' ? 'active' : ''}`}
          onClick={() => showTab('In stock')}
        >
          In stock ({pieces.filter(piece => belongsToTab(piece, 'In stock')).length})
        </button>
        <button 
          type="button" 
          className={`tab ${activeTab === 'At refiner' ? 'active' : ''}`}
          onClick={() => showTab('At refiner')}
        >
          At refiner ({pieces.filter(piece => belongsToTab(piece, 'At refiner')).length})
        </button>
        <button 
          type="button" 
          className={`tab ${activeTab === 'Closed' ? 'active' : ''}`}
          onClick={() => showTab('Closed')}
        >
          Closed ({pieces.filter(piece => belongsToTab(piece, 'Closed')).length})
        </button>
        <button 
          type="button" 
          className={`tab ${activeTab === 'Refinery jobs' ? 'active' : ''}`}
          onClick={() => showTab('Refinery jobs')}
        >
          Refinery jobs ({refineryJobs.length})
        </button>
        <button 
          type="button" 
          className={`tab ${activeTab === 'Refined stock' ? 'active' : ''}`}
          onClick={() => showTab('Refined stock')}
        >
          Refined stock ({refinedStock.length})
        </button>
      </div>

      {/* TAB 1-4: Scrap Batches */}
      {['Pending test', 'In stock', 'At refiner', 'Closed'].includes(activeTab) && (
        <>
          {/* Scrap Vault Stages (4 Stage KPI Cards) */}
      <div className="sum-grid">
        {/* Stage 1: Intake */}
        <div 
          className="sum-box" 
          style={{ 
            cursor: 'pointer',
            borderColor: activeStageFilter === 'INTAKE' ? 'var(--primary)' : undefined,
            background: activeStageFilter === 'INTAKE' ? 'var(--primary-l)' : undefined 
          }}
          onClick={() => setActiveStageFilter(activeStageFilter === 'INTAKE' ? 'ALL' : 'INTAKE')}
        >
          <div className="sum-val">{intakePieces.length} batches</div>
          <div className="sum-lbl">1. Intake (Raw Scrap)</div>
          <div className="helper" style={{ marginTop: 4 }}>
            Fine Eqv: {intakeFine.toFixed(3)}g
          </div>
        </div>

        {/* Stage 2: Tested */}
        <div 
          className="sum-box"
          style={{ 
            cursor: 'pointer',
            borderColor: activeStageFilter === 'TESTED' ? 'var(--primary)' : undefined,
            background: activeStageFilter === 'TESTED' ? 'var(--primary-l)' : undefined 
          }}
          onClick={() => setActiveStageFilter(activeStageFilter === 'TESTED' ? 'ALL' : 'TESTED')}
        >
          <div className="sum-val">{testedPieces.length} batches</div>
          <div className="sum-lbl">2. Tested & Assayed</div>
          <div className="helper" style={{ marginTop: 4 }}>
            Fine Eqv: {testedFine.toFixed(3)}g
          </div>
        </div>

        {/* Stage 3: Melted */}
        <div 
          className="sum-box"
          style={{ 
            cursor: 'pointer',
            borderColor: activeStageFilter === 'MELTED' ? 'var(--primary)' : undefined,
            background: activeStageFilter === 'MELTED' ? 'var(--primary-l)' : undefined 
          }}
          onClick={() => setActiveStageFilter(activeStageFilter === 'MELTED' ? 'ALL' : 'MELTED')}
        >
          <div className="sum-val">{meltedPieces.length} batches</div>
          <div className="sum-lbl">3. Melted Ingot / Dhal</div>
          <div className="helper" style={{ marginTop: 4 }}>
            Fine Eqv: {meltedFine.toFixed(3)}g
          </div>
        </div>

        {/* Stage 4: Bar Refining */}
        <div 
          className="sum-box"
          style={{ 
            cursor: 'pointer',
            borderColor: activeStageFilter === 'BAR_REFINING' ? 'var(--primary)' : undefined,
            background: activeStageFilter === 'BAR_REFINING' ? 'var(--primary-l)' : undefined 
          }}
          onClick={() => setActiveStageFilter(activeStageFilter === 'BAR_REFINING' ? 'ALL' : 'BAR_REFINING')}
        >
          <div className="sum-val" style={{ color: 'var(--primary)' }}>{refinedPieces.length} batches</div>
          <div className="sum-lbl">4. Bar Refining (999.9)</div>
          <div className="helper" style={{ marginTop: 4 }}>
            Fine Eqv: {refinedFine.toFixed(3)}g
          </div>
        </div>
      </div>

      {/* Aggregate Vault Value Banner */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ padding: '12px 18px', background: 'var(--zebra)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="badge badge-yellow" style={{ fontWeight: 700 }}>
              VAULT TOTAL
            </span>
            <span style={{ fontSize: 13 }}>
              Total Vault Fine Gold Eqv: <b>{totalFineGoldInVault.toFixed(3)} g</b> (Net: {pieces.reduce((a, b) => a + b.netWeight, 0).toFixed(3)}g)
            </span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }} className="mono">
            Vault Valuation: ₹{Math.round(totalScrapValuation).toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Search & Filter Row */}
      <div className="search-row">
        <div className="search-box">
          <Search size={14} style={{ color: 'var(--muted)', flexShrink: 0 }} />
          <input 
            type="text" 
            placeholder="Search…"
            value={search}
            onChange={(e) => { setSelectedBatchIds([]); setSearch(e.target.value); }}
            style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent', fontSize: '13px' }}
          />
          {search && (
            <button 
              type="button" 
              onClick={() => { setSelectedBatchIds([]); setSearch(''); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
            >
              ✕
            </button>
          )}
        </div>

        <select 
          className="input input-sm" 
          style={{ width: 'auto' }}
          value={activeStageFilter} 
          onChange={(e) => { setSelectedBatchIds([]); setActiveStageFilter(e.target.value); }}
        >
          <option value="ALL">All Stages</option>
          <option value="INTAKE">1. Intake (Raw Scrap)</option>
          <option value="TESTED">2. Tested & Assayed</option>
          <option value="MELTED">3. Melted Ingot / Dhal</option>
          <option value="BAR_REFINING">4. Bar Refining</option>
        </select>

        <select 
          className="input input-sm" 
          style={{ width: 'auto' }}
          value={selectedMetal} 
          onChange={(e) => { setSelectedBatchIds([]); setSelectedMetal(e.target.value); }}
        >
          <option value="ALL">All Metals</option>
          <option value="gold">Gold</option>
          <option value="silver">Silver</option>
        </select>
      </div>

      {/* Main Scrap Register Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Scrap Batch Register & Fine Metal Accounting</span>
          <span className="helper">
            Showing {filteredPieces.length} of {pieces.length} batches
          </span>
          {activeTab === 'Pending test' && (
            <button type="button" className="btn btn-outline btn-xs" onClick={() => setShowAddModal(true)}>
              <Plus size={14} /> New scrap batch
            </button>
          )}
        </div>
        <div className="tbl-wrap">
          <table className="tbl-desktop-only">
            <thead>
              <tr>
                <th><input ref={selectAllRef} type="checkbox" aria-label="Select all visible batches"
                  checked={allSelected} disabled={!canSelect || filteredPieces.length === 0}
                  onChange={event => setSelectedBatchIds(event.target.checked ? filteredPieces.map(piece => piece.id) : [])} /></th>
                <th>Batch ID</th>
                <th>Date & Source</th>
                <th>Metal & Purity</th>
                <th style={{ textAlign: 'right' }}>Gross Wt</th>
                <th style={{ textAlign: 'right' }}>Net Wt</th>
                <th style={{ textAlign: 'center' }}>Tested</th>
                <th style={{ textAlign: 'right' }}>Fine Gold Eqv</th>
                <th style={{ textAlign: 'right' }}>Rate / Total Value</th>
                <th style={{ textAlign: 'center' }}>Current Stage</th>
                <th>Vault Location</th>
                <th>Refiner</th>
              </tr>
            </thead>
            <tbody>
              {filteredPieces.length === 0 && <tr><td colSpan={12} className="empty">No matching batches.</td></tr>}
              {filteredPieces.map(piece => {
                const stageBadgeClass = 
                  piece.stage === 'INTAKE' ? 'badge-gray' :
                  piece.stage === 'TESTED' ? 'badge-blue' :
                  piece.stage === 'MELTED' ? 'badge-yellow' : 'badge-green';

                const stageLabel = 
                  piece.stage === 'INTAKE' ? 'Intake' :
                  piece.stage === 'TESTED' ? 'Tested' :
                  piece.stage === 'MELTED' ? 'Melted' : 'Refined Bar';

                return (
                  <tr key={piece.id}>
                    <td><input type="checkbox" aria-label={`Select batch ${piece.id}`}
                      checked={selectedBatchIds.includes(piece.id)} disabled={!canSelect}
                      onChange={event => setSelectedBatchIds(previous => event.target.checked
                        ? [...previous, piece.id] : previous.filter(id => id !== piece.id))} /></td>
                    <td className="mono" style={{ fontWeight: 700 }}>{piece.id}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{piece.source}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{piece.date}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, textTransform: 'uppercase' }}>{piece.metal}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{piece.purity}</div>
                    </td>
                    <td style={{ textAlign: 'right' }} className="mono">{piece.grossWeight.toFixed(3)} g</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }} className="mono">{piece.netWeight.toFixed(3)} g</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${piece.testStatus === 'Tested' ? 'badge-green' : 'badge-yellow'}`}>
                        {piece.testedTouch ? `${piece.testedTouch.toFixed(1)}% Touch` : 'Pending Test'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }} className="mono">
                      {piece.fineWeight.toFixed(3)} g
                    </td>
                    <td style={{ textAlign: 'right' }} className="mono">
                      <div>₹{Math.round(piece.totalValue).toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>@ ₹{piece.ratePer10g}/10g</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${stageBadgeClass}`}>
                        {stageLabel}
                      </span>
                    </td>
                    <td>{piece.vaultLocation}</td>
                    <td>{refinerLabel(piece) || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {/* TAB 2: Refinery Jobs */}
      {activeTab === 'Refinery jobs' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Refinery Jobs Register</span>
            <span className="helper">Dispatched scrap sent to refiners for pure bullion conversion</span>
          </div>
          <div className="tbl-wrap">
            <table className="tbl-desktop-only">
              <thead>
                <tr>
                  <th>Job No</th>
                  <th>Sent Date</th>
                  <th>Metal</th>
                  <th>Refinery</th>
                  <th>Carried By</th>
                  <th style={{ textAlign: 'center' }}>Pieces</th>
                  <th style={{ textAlign: 'right' }}>Fine Sent (g)</th>
                  <th style={{ textAlign: 'right' }}>Refined Back (g)</th>
                  <th style={{ textAlign: 'right' }}>Loss (g)</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {refineryJobs.map(job => (
                  <tr key={job.id}>
                    <td className="mono" style={{ fontWeight: 700 }}>{job.jobNo}</td>
                    <td className="mono">{job.sentDate}</td>
                    <td>
                      <span className={`badge ${job.metal === 'Gold' ? 'badge-yellow' : 'badge-gray'}`}>
                        {job.metal}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{job.refiner}</td>
                    <td>{job.carriedBy}</td>
                    <td style={{ textAlign: 'center' }}>{job.pieces} pcs</td>
                    <td style={{ textAlign: 'right' }} className="mono">{job.sentFine.toFixed(3)} g</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--primary)' }} className="mono">
                      {job.receivedFine > 0 ? `${job.receivedFine.toFixed(3)} g` : 'Pending'}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--danger)' }} className="mono">
                      {job.lossFine > 0 ? `${job.lossFine.toFixed(3)} g` : '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${job.status === 'REFINED_BACK' ? 'badge-green' : 'badge-yellow'}`}>
                        {job.status === 'REFINED_BACK' ? 'Refined Back' : 'At Refinery'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {job.status === 'REFINED_BACK' ? (
                        <span className="badge badge-green">Received Back</span>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary btn-xs"
                          onClick={() => handleOpenReceiveReturn(job)}
                        >
                          Receive Bar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Refined Bullion Stock */}
      {activeTab === 'Refined stock' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Refined Bullion Stock (Available for Settlement)</span>
            <span className="helper">Pure 99.9% 24K Gold Bars & 999 Silver Dhal to pay supplier bills or cast into new jewellery</span>
          </div>
          <div className="tbl-wrap">
            <table className="tbl-desktop-only">
              <thead>
                <tr>
                  <th>Bar / Dhal Tag</th>
                  <th>Metal Specification</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'right' }}>Pure Net Weight</th>
                  <th style={{ textAlign: 'center' }}>Touch Assay</th>
                  <th>Refinery Job Source</th>
                  <th>Vault Safe</th>
                  <th>Intended Purpose</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {refinedStock.map(bar => (
                  <tr key={bar.id}>
                    <td className="mono" style={{ fontWeight: 700 }}>{bar.barNo}</td>
                    <td>
                      <span className={`badge ${bar.metal.includes('Gold') ? 'badge-yellow' : 'badge-gray'}`}>
                        {bar.metal}
                      </span>
                    </td>
                    <td>{bar.type}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }} className="mono">
                      {bar.weight.toFixed(3)} g
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{bar.fineTouch}%</td>
                    <td className="mono">{bar.receivedFromJob}</td>
                    <td>{bar.vaultSafe}</td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>{bar.purpose}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-green">Ready in Safe</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Add New Scrap Batch */}
      {showAddModal && (
        <div className="overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Create New Scrap Batch (Intake)</h3>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="btn btn-outline btn-xs"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateScrapBatch}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="section-divider">
                  <span>1. SCRAP ORIGIN & METAL</span>
                </div>
                <div className="g3">
                  <div className="form-group">
                    <label className="label">Scrap Source *</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={sourceInput} 
                      onChange={(e) => setSourceInput(e.target.value)}
                      required 
                    />
                    <div className="helper">e.g. Customer Buyback, Exchange</div>
                  </div>

                  <div className="form-group">
                    <label className="label">Metal Type</label>
                    <select 
                      className="input" 
                      value={metalInput} 
                      onChange={(e) => setMetalInput(e.target.value as any)}
                    >
                      <option value="gold">Gold</option>
                      <option value="silver">Silver</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="label">Purity Grade</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={purityInput} 
                      onChange={(e) => setPurityInput(e.target.value)}
                    />
                    <div className="helper">e.g. 22K (916), 18K (750)</div>
                  </div>
                </div>

                <div className="section-divider">
                  <span>2. WEIGHTS & ASSAY TOUCH (FINE CALCULATION)</span>
                </div>
                <div className="g4">
                  <div className="form-group">
                    <label className="label">Gross Wt (g) *</label>
                    <input 
                      type="number" 
                      step="0.001" 
                      min="0.001"
                      className="input" 
                      value={grossInput} 
                      onChange={(e) => setGrossInput(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="label">Stone Wt (g)</label>
                    <input 
                      type="number" 
                      step="0.001" 
                      min="0"
                      className="input" 
                      value={stoneInput} 
                      onChange={(e) => setStoneInput(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="label">Deductions (g)</label>
                    <input 
                      type="number" 
                      step="0.001" 
                      min="0"
                      className="input" 
                      value={deductionInput} 
                      onChange={(e) => setDeductionInput(e.target.value)}
                    />
                    <div className="helper">Wax / Enamel / Dirt</div>
                  </div>

                  <div className="form-group">
                    <label className="label">Assay Touch %</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      min="0" 
                      max="100"
                      className="input" 
                      value={touchInput} 
                      onChange={(e) => setTouchInput(e.target.value)}
                    />
                    <div className="helper">Purity % (e.g. 91.6)</div>
                  </div>
                </div>

                {/* Fine Weight Summary Card */}
                <div className="sum-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 4 }}>
                  <div className="sum-box">
                    <div className="sum-val">{computedNet.toFixed(3)} g</div>
                    <div className="sum-lbl">Net Metal Weight</div>
                  </div>
                  <div className="sum-box">
                    <div className="sum-val" style={{ color: 'var(--primary)' }}>
                      {computedFine.toFixed(3)} g
                    </div>
                    <div className="sum-lbl">Fine Gold Equivalent (24K)</div>
                  </div>
                  <div className="sum-box">
                    <div className="sum-val">₹{Math.round(computedTotalValue).toLocaleString('en-IN')}</div>
                    <div className="sum-lbl">Calculated Value (@ ₹{parsedRate}/10g)</div>
                  </div>
                </div>

                <div className="section-divider">
                  <span>3. VAULT LOCATION & STORAGE</span>
                </div>
                <div className="g2">
                  <div className="form-group">
                    <label className="label">Vault Location</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={vaultInput} 
                      onChange={(e) => setVaultInput(e.target.value)}
                    />
                    <div className="helper">e.g. Vault Drawer G-01</div>
                  </div>

                  <div className="form-group">
                    <label className="label">Internal Notes</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={notesInput} 
                      onChange={(e) => setNotesInput(e.target.value)}
                      placeholder="Optional notes..."
                    />
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
                  Intake Scrap Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Advance Scrap Vault Stage */}
      {showMoveStageModal && activePieceForMove && (
        <div className="overlay" onClick={() => setShowMoveStageModal(false)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Advance Stage for Batch {activePieceForMove.id}</h3>
              <button 
                type="button" 
                onClick={() => setShowMoveStageModal(false)}
                className="btn btn-outline btn-xs"
              >
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: 'var(--zebra)', padding: '12px 14px', borderRadius: '10px' }}>
                <div style={{ fontWeight: 700 }}>{activePieceForMove.source}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  Net: {activePieceForMove.netWeight.toFixed(3)}g · Fine: {activePieceForMove.fineWeight.toFixed(3)}g · Touch: {activePieceForMove.testedTouch == null ? 'Pending test' : `${activePieceForMove.testedTouch}%`}
                </div>
              </div>

              <div className="form-group">
                <label className="label">Select New Vault Stage</label>
                <select 
                  className="input" 
                  value={targetStage} 
                  onChange={(e) => setTargetStage(e.target.value as any)}
                >
                  <option value="INTAKE">1. Intake (Raw Scrap)</option>
                  <option value="TESTED">2. Tested & Assayed</option>
                  <option value="MELTED">3. Melted Ingot / Dhal</option>
                  <option value="BAR_REFINING">4. Bar Refining (999.9 Bullion)</option>
                </select>
              </div>

              {(targetStage === 'TESTED' || targetStage === 'MELTED') && (
                <div className="g2">
                  <div className="form-group">
                    <label className="label">Tested Touch Purity (%)</label>
                    <input 
                      type="number"
                      step="0.1"
                      className="input"
                      value={moveTouchInput}
                      onChange={(e) => setMoveTouchInput(e.target.value)}
                      placeholder="e.g. 91.6"
                    />
                    <div className="helper">Assayed touchstone / XRF %</div>
                  </div>
                  {targetStage === 'MELTED' && (
                    <div className="form-group">
                      <label className="label">Melting Slag / Loss (g)</label>
                      <input 
                        type="number"
                        step="0.001"
                        className="input"
                        value={moveMeltingLossInput}
                        onChange={(e) => setMoveMeltingLossInput(e.target.value)}
                        placeholder="e.g. 0.050"
                      />
                      <div className="helper">Crucible burning deduction</div>
                    </div>
                  )}
                </div>
              )}

              {targetStage === 'MELTED' && (
                <div className="alert alert-warn">
                  Melting transition will account for crucible melting loss and cast into dhal.
                </div>
              )}

              {targetStage === 'BAR_REFINING' && (
                <div className="alert alert-success">
                  Batch will be dispatched to refinery for 999.9 Fine Gold Bar refining.
                </div>
              )}
            </div>

            <div className="modal-foot">
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={() => setShowMoveStageModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleConfirmStageMove}
              >
                Confirm Stage Transition
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Dispatch to Refinery */}
      {showRefineryJobModal && (
        <div className="overlay" onClick={() => setShowRefineryJobModal(false)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Create Refinery Job (Dispatch Scrap)</h3>
              <button 
                type="button" 
                onClick={() => setShowRefineryJobModal(false)}
                className="btn btn-outline btn-xs"
              >
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: 'var(--zebra)', padding: '12px 14px', borderRadius: '10px' }}>
                <div style={{ fontWeight: 700 }}>Dispatch Summary</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  Selected Scrap Batches: {selectedPieces.length} · Fine Weight: {dispatchFine.toFixed(3)}g
                </div>
              </div>

              <div className="form-group">
                <label className="label">Metal Group</label>
                <select 
                  className="input"
                  value={jobMetal}
                  disabled
                >
                  <option value="Gold">Gold (Fine Au Bullion)</option>
                  <option value="Silver">Silver (Fine Ag Bullion)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="label">Assay & Refining Partner</label>
                <select 
                  className="input"
                  value={jobRefiner}
                  onChange={(e) => setJobRefiner(e.target.value)}
                >
                  <option value="MMTC-PAMP India Ltd.">MMTC-PAMP India Ltd.</option>
                  <option value="Valcambi Refining Labs">Valcambi Refining Labs</option>
                  <option value="Kalyan Assay & Refining">Kalyan Assay & Refining</option>
                  <option value="Shirpur Gold Refinery">Shirpur Gold Refinery</option>
                </select>
              </div>

              <div className="form-group">
                <label className="label">Courier / Carried By *</label>
                <input 
                  type="text" 
                  className="input" 
                  value={jobCarriedBy}
                  onChange={(e) => setJobCarriedBy(e.target.value)}
                  placeholder="Escort personnel or secure courier tracking..."
                />
              </div>

              <div style={{ background: '#fef3c7', border: '1px solid #fde68a', padding: '10px 14px', borderRadius: '8px', fontSize: 12, color: '#92400e' }}>
                Selected batches move to At refiner when you record the job. Record the returned bars from Refinery jobs.
              </div>
            </div>

            <div className="modal-foot">
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={() => setShowRefineryJobModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                disabled={!canDispatch || !jobCarriedBy.trim()}
                onClick={() => {
                  if (!canDispatch || !jobCarriedBy.trim()) return;
                  const now = new Date();
                  const id = crypto.randomUUID();
                  const newJob = {
                    id,
                    jobNo: `RJ-${now.getFullYear()}-${id.slice(0, 8).toUpperCase()}`,
                    sentDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                    metal: jobMetal,
                    refiner: jobRefiner,
                    carriedBy: jobCarriedBy.trim(),
                    pieces: selectedPieces.length,
                    sentFine: dispatchFine,
                    receivedFine: 0.000,
                    lossFine: 0.000,
                    status: 'IN_PROCESS' as const
                  };
                  const dispatchIds = new Set(selectedPieces.map(piece => piece.id));
                  setRefineryJobs(current => [newJob, ...current]);
                  setPieces(current => current.map(piece => dispatchIds.has(piece.id)
                    ? { ...piece, stage: 'BAR_REFINING', refineryJobId: newJob.jobNo } : piece));
                  setShowRefineryJobModal(false);
                  showTab('At refiner');
                  alert(`Refinery job ${newJob.jobNo} recorded for ${jobRefiner}.`);
                }}
              >
                Confirm & Dispatch to Refinery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Receive Refined Bar (Refinery Return) */}
      {showReceiveBarModal && activeJobForReturn && (
        <div className="overlay" onClick={() => setShowReceiveBarModal(false)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Receive Refined Bar from {activeJobForReturn.refiner}</h3>
              <button 
                type="button" 
                onClick={() => setShowReceiveBarModal(false)}
                className="btn btn-outline btn-xs"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleConfirmReceiveReturn}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: 'var(--zebra)', padding: '12px 14px', borderRadius: '10px' }}>
                  <div style={{ fontWeight: 700 }}>Job: {activeJobForReturn.jobNo} ({activeJobForReturn.metal})</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                    Dispatched Fine Weight: <strong>{activeJobForReturn.sentFine.toFixed(3)}g</strong> · Sent: {activeJobForReturn.sentDate}
                  </div>
                </div>

                <div className="g2">
                  <div className="form-group">
                    <label className="label">Received Bar Gross Wt (g) *</label>
                    <input 
                      type="number"
                      step="0.001"
                      required
                      className="input"
                      value={returnBarGrossWeight}
                      onChange={(e) => setReturnBarGrossWeight(e.target.value)}
                    />
                    <div className="helper">Scale verified weight</div>
                  </div>

                  <div className="form-group">
                    <label className="label">Assay Touch Purity (%) *</label>
                    <input 
                      type="number"
                      step="0.01"
                      required
                      className="input"
                      value={returnTouchPurity}
                      onChange={(e) => setReturnTouchPurity(e.target.value)}
                    />
                    <div className="helper">Certified e.g. 99.90% / 99.99%</div>
                  </div>
                </div>

                <div className="g2">
                  <div className="form-group">
                    <label className="label">Refining Loss (g)</label>
                    <input 
                      type="number"
                      step="0.001"
                      className="input"
                      value={returnRefiningLoss}
                      onChange={(e) => setReturnRefiningLoss(e.target.value)}
                    />
                    <div className="helper">Dispatched vs received loss</div>
                  </div>

                  <div className="form-group">
                    <label className="label">Refining Charges (₹)</label>
                    <input 
                      type="number"
                      step="1"
                      className="input"
                      value={returnRefiningCharges}
                      onChange={(e) => setReturnRefiningCharges(e.target.value)}
                    />
                    <div className="helper">Processing invoice fee</div>
                  </div>
                </div>

                <div className="g2">
                  <div className="form-group">
                    <label className="label">Assay Certificate No *</label>
                    <input 
                      type="text"
                      required
                      className="input mono"
                      value={returnAssayCert}
                      onChange={(e) => setReturnAssayCert(e.target.value)}
                    />
                    <div className="helper">Refiner lab cert number</div>
                  </div>

                  <div className="form-group">
                    <label className="label">Store into Safe Vault *</label>
                    <select
                      className="input"
                      value={returnVaultSafe}
                      onChange={(e) => setReturnVaultSafe(e.target.value)}
                    >
                      <option value="Bullion Safe B-01">Bullion Safe B-01 (Primary)</option>
                      <option value="Bullion Safe B-02">Bullion Safe B-02 (Showroom)</option>
                      <option value="Silver Vault SV-01">Silver Vault SV-01</option>
                    </select>
                  </div>
                </div>

                <div className="alert alert-success" style={{ fontSize: 12 }}>
                  Upon confirmation, job status changes to <strong>Refined Back</strong>, and pure bullion bar will be added to <strong>Refined Bullion Stock</strong> available to settle supplier invoices.
                </div>
              </div>

              <div className="modal-foot">
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => setShowReceiveBarModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  Confirm Receipt &amp; Mint Bullion Bar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

