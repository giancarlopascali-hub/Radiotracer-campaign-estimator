import React, { useState, useMemo } from 'react';
import { PhaseRow, TierConfig, CellItem, CostCategoryId, ALL_COST_CATEGORY_IDS } from './types';
import { FALLYPRIDE_DEFAULT_ROWS, DEFAULT_TIERS, TRACER_PRESETS } from './data/defaultData';
import { calculateRowCosts, calculateCategoryBreakdown, calculateTierSummaries } from './utils/calculator';
import { Header } from './components/Header';
import { TierComparison } from './components/TierComparison';
import { CampaignTable } from './components/CampaignTable';
import { CostCharts } from './components/CostCharts';
import { FormulaGuideModal } from './components/FormulaGuideModal';
import { PhaseModal } from './components/PhaseModal';
import { TierModal } from './components/TierModal';
import { ExportModal } from './components/ExportModal';
import { ImportModal } from './components/ImportModal';
import { ImportedCampaignData } from './utils/importer';
import { CheckCircle2, X } from 'lucide-react';

export default function App() {
  // Session-isolated state: opens with a clean blank canvas on the landing page
  const [tracerName, setTracerName] = useState<string>('Custom Radiotracer');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('custom');
  const [tiers, setTiers] = useState<TierConfig[]>([]);
  const [rows, setRows] = useState<PhaseRow[]>([]);

  // Dynamic active cost categories selection
  const [activeCostCategories, setActiveCostCategories] = useState<CostCategoryId[]>(ALL_COST_CATEGORY_IDS);

  // Multi-tier filtering selection (empty array = show all tiers)
  const [selectedTiers, setSelectedTiers] = useState<number[]>([]);

  // Modals
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importToast, setImportToast] = useState<string | null>(null);

  const [isFormulaHelpOpen, setIsFormulaHelpOpen] = useState<boolean>(false);
  const [isPhaseModalOpen, setIsPhaseModalOpen] = useState<boolean>(false);
  const [editingRow, setEditingRow] = useState<PhaseRow | null>(null);
  const [defaultAddTierNum, setDefaultAddTierNum] = useState<number>(1);

  const [isTierModalOpen, setIsTierModalOpen] = useState<boolean>(false);
  const [editingTier, setEditingTier] = useState<TierConfig | null>(null);

  // Recompute calculated rows using the active categories mathematical model
  const calculatedRows = useMemo(() => {
    return rows.map(r => calculateRowCosts(r, activeCostCategories));
  }, [rows, activeCostCategories]);

  const tierSummaries = useMemo(() => {
    return calculateTierSummaries(calculatedRows, tiers);
  }, [calculatedRows, tiers]);

  // Filtered dataset for table & analytics tabs
  const filteredCalculatedRows = useMemo(() => {
    if (selectedTiers.length === 0) return calculatedRows;
    return calculatedRows.filter(c => selectedTiers.includes(c.row.tier));
  }, [calculatedRows, selectedTiers]);

  const filteredCategoryBreakdown = useMemo(() => {
    return calculateCategoryBreakdown(filteredCalculatedRows, activeCostCategories);
  }, [filteredCalculatedRows, activeCostCategories]);

  const filteredTierSummaries = useMemo(() => {
    if (selectedTiers.length === 0) return tierSummaries;
    return tierSummaries.filter(t => selectedTiers.includes(t.tierNumber));
  }, [tierSummaries, selectedTiers]);

  // Toggle active cost category
  const handleToggleCostCategory = (id: CostCategoryId) => {
    setActiveCostCategories(prev => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Keep at least one category selected
        return prev.filter(c => c !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Select all cost categories
  const handleSelectAllCostCategories = () => {
    setActiveCostCategories(ALL_COST_CATEGORY_IDS);
  };

  // Select preset cost categories
  const handleSelectPresetCostCategories = (presetCategoryIds: CostCategoryId[]) => {
    if (presetCategoryIds.length > 0) {
      setActiveCostCategories(presetCategoryIds);
    }
  };

  // Handle tracer preset switch
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    if (presetId === 'custom') return;

    const found = TRACER_PRESETS.find(p => p.id === presetId);
    if (found) {
      setTracerName(found.name);
      setTiers(found.defaultTiers || DEFAULT_TIERS);
      setRows(found.defaultRows);
      setSelectedTiers([]);
    }
  };

  // Load example parameters preset ([18F]Fallypride dataset)
  const handleLoadExample = () => {
    setSelectedPresetId('fallypride');
    setTracerName('[18F]Fallypride');
    setTiers(DEFAULT_TIERS);
    setRows(FALLYPRIDE_DEFAULT_ROWS);
    setActiveCostCategories(ALL_COST_CATEGORY_IDS);
    setSelectedTiers([]);
  };

  // Completely clear matrix: delete all tiers, phases, summaries and analyses
  const handleBlankMatrix = () => {
    setSelectedPresetId('custom');
    setTracerName('Custom Radiotracer');
    setTiers([]);
    setRows([]);
    setSelectedTiers([]);
  };

  // Toggle tier in multi-select filter
  const handleToggleTier = (tierNum: number) => {
    setSelectedTiers(prev => {
      if (prev.includes(tierNum)) {
        return prev.filter(t => t !== tierNum);
      } else {
        return [...prev, tierNum];
      }
    });
  };

  // Clear tier filter
  const handleClearTierFilter = () => {
    setSelectedTiers([]);
  };

  // Inline field update with parametric rules (n_s <= n_a, n_bio <= n_a - n_s)
  const handleUpdateRowField = (id: string, field: keyof PhaseRow, value: any) => {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r;

      const updated = { ...r, [field]: value };

      if (field === 'numAnimals') {
        const n_a = Math.max(0, Number(value) || 0);
        let n_s = updated.numScans;
        if (n_s > n_a) n_s = n_a;
        const maxBio = Math.max(0, n_a - n_s);
        let n_bio = updated.numBiodistributions;
        if (n_bio > maxBio) n_bio = maxBio;

        updated.numAnimals = n_a;
        updated.numScans = n_s;
        updated.numBiodistributions = n_bio;
      } else if (field === 'numScans') {
        const n_a = updated.numAnimals;
        const n_s = Math.min(n_a, Math.max(0, Number(value) || 0));
        const maxBio = Math.max(0, n_a - n_s);
        let n_bio = updated.numBiodistributions;
        if (n_bio > maxBio) n_bio = maxBio;

        updated.numScans = n_s;
        updated.numBiodistributions = n_bio;
      } else if (field === 'numBiodistributions') {
        const n_a = updated.numAnimals;
        const n_s = updated.numScans;
        const maxBio = Math.max(0, n_a - n_s);
        const n_bio = Math.min(maxBio, Math.max(0, Number(value) || 0));

        updated.numBiodistributions = n_bio;
      }

      return updated;
    }));
  };

  // Cell Itemization Update
  const handleUpdateCellItemization = (id: string, fieldKey: string, items: CellItem[] | null, totalValue: number) => {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updatedItemizations = { ...(r.itemizations || {}) };
      if (items && items.length > 0) {
        updatedItemizations[fieldKey] = items;
      } else {
        delete updatedItemizations[fieldKey];
      }
      return {
        ...r,
        [fieldKey]: totalValue,
        itemizations: updatedItemizations,
      };
    }));
  };

  // Copy & Paste buffer state
  const [copiedRow, setCopiedRow] = useState<PhaseRow | null>(null);

  // Copy phase to buffer
  const handleCopyRow = (row: PhaseRow) => {
    setCopiedRow(row);
  };

  // Clear copied row
  const handleClearCopiedRow = () => {
    setCopiedRow(null);
  };

  // Paste copied phase into target tier
  const handlePasteRow = (targetTierNumber: number) => {
    if (!copiedRow) return;
    const newRow: PhaseRow = {
      ...JSON.parse(JSON.stringify(copiedRow)),
      id: crypto.randomUUID ? crypto.randomUUID() : `phase-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tier: targetTierNumber,
      phase: `${copiedRow.phase} (Copy)`
    };
    setRows(prev => [...prev, newRow]);
  };

  // Duplicate row in same tier
  const handleDuplicateRow = (row: PhaseRow) => {
    const newRow: PhaseRow = {
      ...JSON.parse(JSON.stringify(row)),
      id: crypto.randomUUID ? crypto.randomUUID() : `phase-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      phase: `${row.phase} (Copy)`
    };
    setRows(prev => {
      const idx = prev.findIndex(r => r.id === row.id);
      if (idx === -1) return [...prev, newRow];
      const next = [...prev];
      next.splice(idx + 1, 0, newRow);
      return next;
    });
  };

  // Move row up or down within its Tier
  const handleMoveRow = (rowId: string, direction: 'up' | 'down') => {
    setRows(prevRows => {
      const targetIndex = prevRows.findIndex(r => r.id === rowId);
      if (targetIndex === -1) return prevRows;
      const targetRow = prevRows[targetIndex];

      const sameTierIndices = prevRows
        .map((r, idx) => (r.tier === targetRow.tier ? idx : -1))
        .filter(idx => idx !== -1);

      const posInTier = sameTierIndices.indexOf(targetIndex);
      if (posInTier === -1) return prevRows;

      const swapTierPos = direction === 'up' ? posInTier - 1 : posInTier + 1;
      if (swapTierPos < 0 || swapTierPos >= sameTierIndices.length) return prevRows;

      const swapIndex = sameTierIndices[swapTierPos];
      const newRows = [...prevRows];
      const temp = newRows[targetIndex];
      newRows[targetIndex] = newRows[swapIndex];
      newRows[swapIndex] = temp;
      return newRows;
    });
  };

  // Delete phase row
  const handleDeleteRow = (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  // Add / Save Phase
  const handleSavePhase = (savedPhase: PhaseRow) => {
    // If saving into a tier that doesn't exist in tiers array, create it automatically
    if (!tiers.some(t => t.tierNumber === savedPhase.tier)) {
      setTiers(prev => [
        ...prev,
        {
          tierNumber: savedPhase.tier,
          name: `Tier ${savedPhase.tier} Package`,
          subtitle: 'Campaign phase package'
        }
      ].sort((a, b) => a.tierNumber - b.tierNumber));
    }

    if (rows.some(r => r.id === savedPhase.id)) {
      setRows(prev => prev.map(r => r.id === savedPhase.id ? savedPhase : r));
    } else {
      setRows(prev => [...prev, savedPhase]);
    }
  };

  // Open add phase modal for a specific tier
  const handleOpenAddPhase = (tierNumber?: number) => {
    setEditingRow(null);
    setDefaultAddTierNum(tierNumber || (selectedTiers.length > 0 ? selectedTiers[0] : (tiers[0]?.tierNumber || 1)));
    setIsPhaseModalOpen(true);
  };

  // Open edit phase modal
  const handleEditRowModal = (row: PhaseRow) => {
    setEditingRow(row);
    setIsPhaseModalOpen(true);
  };

  // Add / Save Tier
  const handleSaveTier = (savedTier: TierConfig) => {
    setTiers(prev => {
      if (prev.some(t => t.tierNumber === savedTier.tierNumber)) {
        return prev.map(t => t.tierNumber === savedTier.tierNumber ? savedTier : t);
      } else {
        return [...prev, savedTier].sort((a, b) => a.tierNumber - b.tierNumber);
      }
    });
  };

  // Open Edit Tier Modal
  const handleEditTierModal = (tier: TierConfig) => {
    setEditingTier(tier);
    setIsTierModalOpen(true);
  };

  // Move Tier Order Up / Down
  const handleMoveTier = (tierNumber: number, direction: 'up' | 'down') => {
    const sortedTiers = [...tiers].sort((a, b) => a.tierNumber - b.tierNumber);
    const index = sortedTiers.findIndex(t => t.tierNumber === tierNumber);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedTiers.length) return;

    const currentTier = sortedTiers[index];
    const targetTier = sortedTiers[targetIndex];

    const numCurrent = currentTier.tierNumber;
    const numTarget = targetTier.tierNumber;

    // Swap tier numbers in tiers config
    const updatedTiers = sortedTiers.map(t => {
      if (t.tierNumber === numCurrent) return { ...t, tierNumber: numTarget };
      if (t.tierNumber === numTarget) return { ...t, tierNumber: numCurrent };
      return t;
    }).sort((a, b) => a.tierNumber - b.tierNumber);

    // Swap tier assignments in phase rows
    const updatedRows = rows.map(r => {
      if (r.tier === numCurrent) return { ...r, tier: numTarget };
      if (r.tier === numTarget) return { ...r, tier: numCurrent };
      return r;
    });

    setTiers(updatedTiers);
    setRows(updatedRows);
  };

  // Delete Tier
  const handleDeleteTier = (tierNumber: number) => {
    setTiers(prev => prev.filter(t => t.tierNumber !== tierNumber));
    setRows(prev => prev.filter(r => r.tier !== tierNumber));
    setSelectedTiers(prev => prev.filter(t => t !== tierNumber));
  };

  // Handle report file import success
  const handleImportSuccess = (importedData: ImportedCampaignData) => {
    if (importedData.tracerName) {
      setTracerName(importedData.tracerName);
    }
    setSelectedPresetId(importedData.selectedPresetId || 'custom');
    if (importedData.tiers && importedData.tiers.length > 0) {
      setTiers(importedData.tiers);
    }
    if (importedData.rows && importedData.rows.length > 0) {
      setRows(importedData.rows);
    }
    if (importedData.activeCostCategories && importedData.activeCostCategories.length > 0) {
      setActiveCostCategories(importedData.activeCostCategories);
    }
    setSelectedTiers([]);
    setImportToast(`Successfully restored estimate report for "${importedData.tracerName}" (${importedData.rows.length} phases)!`);
    setTimeout(() => setImportToast(null), 6000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white pb-12">
      
      {/* Top Navigation Header */}
      <Header
        tracerName={tracerName}
        setTracerName={setTracerName}
        selectedPresetId={selectedPresetId}
        onSelectPreset={handleSelectPreset}
        onLoadExample={handleLoadExample}
        onBlankMatrix={handleBlankMatrix}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
      />

      {/* SUCCESS IMPORT TOAST NOTIFICATION */}
      {importToast && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3">
          <div className="bg-emerald-900 text-emerald-100 border border-emerald-700 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-lg animate-in slide-in-from-top-2">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{importToast}</span>
            </div>
            <button
              onClick={() => setImportToast(null)}
              className="text-emerald-300 hover:text-white p-1 hover:bg-emerald-800 rounded transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Campaign Service Tiers Cards */}
        <TierComparison
          tierSummaries={tierSummaries}
          tiers={tiers}
          selectedTiers={selectedTiers}
          activeCostCategories={activeCostCategories}
          onToggleTier={handleToggleTier}
          onClearTierFilter={handleClearTierFilter}
          onAddTier={() => {
            setEditingTier(null);
            setIsTierModalOpen(true);
          }}
          onEditTier={handleEditTierModal}
          onMoveTier={handleMoveTier}
          onDeleteTier={handleDeleteTier}
        />

        {/* Campaign Parametric Matrix Table */}
        <CampaignTable
          calculatedRows={calculatedRows}
          tiers={tiers}
          tierSummaries={tierSummaries}
          selectedTiers={selectedTiers}
          activeCostCategories={activeCostCategories}
          onToggleCostCategory={handleToggleCostCategory}
          onSelectAllCostCategories={handleSelectAllCostCategories}
          onSelectPresetCostCategories={handleSelectPresetCostCategories}
          onEditRow={handleEditRowModal}
          onDeleteRow={handleDeleteRow}
          onAddRow={handleOpenAddPhase}
          onAddTier={() => {
            setEditingTier(null);
            setIsTierModalOpen(true);
          }}
          onUpdateRowField={handleUpdateRowField}
          onUpdateCellItemization={handleUpdateCellItemization}
          onOpenFormulaModal={() => setIsFormulaHelpOpen(true)}
          copiedRow={copiedRow}
          onCopyRow={handleCopyRow}
          onClearCopiedRow={handleClearCopiedRow}
          onPasteRow={handlePasteRow}
          onDuplicateRow={handleDuplicateRow}
          onMoveRow={handleMoveRow}
        />

        {/* Cost Distribution & Visual Analytics */}
        <CostCharts
          calculatedRows={filteredCalculatedRows}
          categoryBreakdown={filteredCategoryBreakdown}
          tierSummaries={filteredTierSummaries}
          activeCostCategories={activeCostCategories}
        />

      </main>

      {/* Modals */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        tracerName={tracerName}
        calculatedRows={calculatedRows}
        tiers={tiers}
        tierSummaries={tierSummaries}
        activeCostCategories={activeCostCategories}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      <FormulaGuideModal
        isOpen={isFormulaHelpOpen}
        onClose={() => setIsFormulaHelpOpen(false)}
      />

      <PhaseModal
        isOpen={isPhaseModalOpen}
        onClose={() => setIsPhaseModalOpen(false)}
        onSaveRow={handleSavePhase}
        tiers={tiers}
        initialRow={editingRow}
        defaultTierNumber={defaultAddTierNum}
        activeCostCategories={activeCostCategories}
      />

      <TierModal
        isOpen={isTierModalOpen}
        onClose={() => setIsTierModalOpen(false)}
        onSaveTier={handleSaveTier}
        existingTiers={tiers}
        initialTier={editingTier}
      />

    </div>
  );
}

