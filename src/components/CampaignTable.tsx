import React, { useState } from 'react';
import { 
  CalculatedRow, 
  PhaseRow, 
  TierConfig, 
  TierSummary,
  CellItem,
  CostCategoryId,
  ALL_COST_CATEGORY_IDS,
  COST_CATEGORY_DEFINITIONS
} from '../types';
import { formatCurrency } from '../utils/calculator';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  AlertTriangle, 
  Info, 
  HelpCircle, 
  Layers, 
  ChevronDown, 
  ChevronUp,
  Calculator,
  ListFilter,
  Copy,
  ClipboardPaste,
  CopyPlus,
  ArrowUp,
  ArrowDown,
  X,
  Sliders
} from 'lucide-react';
import { ItemizationModal } from './ItemizationModal';
import { CostFieldsSelector } from './CostFieldsSelector';

interface ItemizeTarget {
  rowId: string;
  phaseName: string;
  fieldKey: string;
  fieldLabel: string;
  unitType: 'currency' | 'number' | 'hours';
  currentValue: number;
  initialItems: CellItem[];
}

interface CampaignTableProps {
  calculatedRows: CalculatedRow[];
  tiers: TierConfig[];
  tierSummaries: TierSummary[];
  selectedTiers: number[];
  activeCostCategories: CostCategoryId[];
  onToggleCostCategory: (categoryId: CostCategoryId) => void;
  onSelectAllCostCategories: () => void;
  onSelectPresetCostCategories?: (presetCategoryIds: CostCategoryId[]) => void;
  onEditRow: (row: PhaseRow) => void;
  onDeleteRow: (id: string) => void;
  onAddRow: (tierNumber: number) => void;
  onAddTier: () => void;
  onUpdateRowField: (id: string, field: keyof PhaseRow, value: any) => void;
  onUpdateCellItemization: (id: string, fieldKey: string, items: CellItem[] | null, totalValue: number) => void;
  onOpenFormulaModal: () => void;
  copiedRow: PhaseRow | null;
  onCopyRow: (row: PhaseRow) => void;
  onClearCopiedRow: () => void;
  onPasteRow: (targetTierNumber: number) => void;
  onDuplicateRow: (row: PhaseRow) => void;
  onMoveRow: (rowId: string, direction: 'up' | 'down') => void;
}

export const CampaignTable: React.FC<CampaignTableProps> = ({
  calculatedRows,
  tiers,
  tierSummaries,
  selectedTiers,
  activeCostCategories,
  onToggleCostCategory,
  onSelectAllCostCategories,
  onSelectPresetCostCategories,
  onEditRow,
  onDeleteRow,
  onAddRow,
  onAddTier,
  onUpdateRowField,
  onUpdateCellItemization,
  onOpenFormulaModal,
  copiedRow,
  onCopyRow,
  onClearCopiedRow,
  onPasteRow,
  onDuplicateRow,
  onMoveRow,
}) => {
  const [showFormulaBanner, setShowFormulaBanner] = useState<boolean>(true);
  const [collapsedTiers, setCollapsedTiers] = useState<Record<number, boolean>>({});
  const [activeItemizeTarget, setActiveItemizeTarget] = useState<ItemizeTarget | null>(null);

  const toggleTierCollapse = (tierNum: number) => {
    setCollapsedTiers(prev => ({ ...prev, [tierNum]: !prev[tierNum] }));
  };

  const filteredTiers = selectedTiers.length > 0 
    ? tiers.filter(t => selectedTiers.includes(t.tierNumber))
    : tiers;

  // Active category flags
  const showRadio = activeCostCategories.includes('radiopharmaceuticals');
  const showAnimals = activeCostCategories.includes('animalModels');
  const showPreclinicalImaging = activeCostCategories.includes('preclinicalImaging') || activeCostCategories.includes('imaging' as any);
  const showClinicalImaging = activeCostCategories.includes('clinicalImaging');
  const showBio = activeCostCategories.includes('biodistribution');
  const showInVitro = activeCostCategories.includes('inVitro');
  const showOthers = activeCostCategories.includes('others');

  // Dynamic table colSpan for Tier section headers
  const dynamicColSpan = 2 // Actions + Phase Name
    + (showRadio ? 7 : 0)
    + (showAnimals ? 4 : 0)
    + (showPreclinicalImaging ? 8 : 0)
    + (showClinicalImaging ? 8 : 0)
    + (showBio ? 5 : 0)
    + (showInVitro ? 7 : 0)
    + (showOthers ? 2 : 0)
    + 1 // Phase Notes
    + 1; // Phase Total

  // Computed totals for visible rows & active cost categories
  const visibleCalculatedRows = calculatedRows.filter(r => 
    selectedTiers.length === 0 || selectedTiers.includes(r.row.tier)
  );

  const totalBatches = visibleCalculatedRows.reduce((s, r) => s + (r.row.numBatches || 0), 0);
  const totalFacilityHours = visibleCalculatedRows.reduce((s, r) => s + ((r.row.radiopharmTaskTimeHoursPerBatch || 0) * (r.row.numBatches || 0)), 0);
  const totalRadioCost = visibleCalculatedRows.reduce((s, r) => s + (showRadio ? r.radiopharmaceuticalsTotal : 0), 0);

  const totalAnimals = visibleCalculatedRows.reduce((s, r) => s + (r.row.numAnimals || 0), 0);
  const totalAnimalCost = visibleCalculatedRows.reduce((s, r) => s + (showAnimals ? r.animalModelsTotal : 0), 0);

  const totalScans = visibleCalculatedRows.reduce((s, r) => s + (r.row.numScans || 0), 0);
  const totalScanHours = visibleCalculatedRows.reduce((s, r) => s + ((r.row.scanTimeHoursPerScan || 0) * (r.row.numScans || 0)), 0);
  const totalPreclinicalImagingCost = visibleCalculatedRows.reduce((s, r) => s + (showPreclinicalImaging ? r.preclinicalImagingTotal : 0), 0);

  const totalClinicalScans = visibleCalculatedRows.reduce((s, r) => s + (r.row.numClinicalScans || 0), 0);
  const totalClinicalScanHours = visibleCalculatedRows.reduce((s, r) => s + ((r.row.clinicalScanTimeHoursPerScan || 0) * (r.row.numClinicalScans || 0)), 0);
  const totalClinicalImagingCost = visibleCalculatedRows.reduce((s, r) => s + (showClinicalImaging ? r.clinicalImagingTotal : 0), 0);

  const totalBio = visibleCalculatedRows.reduce((s, r) => s + (r.row.numBiodistributions || 0), 0);
  const totalBioCost = visibleCalculatedRows.reduce((s, r) => s + (showBio ? r.biodistributionTotal : 0), 0);

  const totalInVitroTests = visibleCalculatedRows.reduce((s, r) => s + (r.row.numInVitroTests || 0), 0);
  const totalInVitroCost = visibleCalculatedRows.reduce((s, r) => s + (showInVitro ? r.inVitroTotal : 0), 0);

  const totalOthersCost = visibleCalculatedRows.reduce((s, r) => s + (showOthers ? r.othersTotal : 0), 0);
  const grandTotalCost = visibleCalculatedRows.reduce((s, r) => s + r.totalRowCost, 0);

  // Helper component to render an input cell with itemization badge & modal launcher
  const renderItemizableCell = (
    row: PhaseRow,
    fieldKey: keyof PhaseRow,
    fieldLabel: string,
    unitType: 'currency' | 'number' | 'hours',
    value: number,
    options?: {
      min?: number;
      max?: number;
      step?: string;
      inputWidth?: string;
      customInputClass?: string;
    }
  ) => {
    const items = row.itemizations?.[fieldKey as string] || [];
    const isItemized = items.length > 0;

    const handleOpenItemize = (e: React.MouseEvent) => {
      e.stopPropagation();
      setActiveItemizeTarget({
        rowId: row.id,
        phaseName: row.phase,
        fieldKey: fieldKey as string,
        fieldLabel,
        unitType,
        currentValue: value,
        initialItems: items,
      });
    };

    return (
      <div className="group/cell relative flex items-center justify-end w-full">
        {unitType === 'currency' && (
          <span className="text-[10px] text-slate-400 select-none mr-0.5">$</span>
        )}
        
        <input
          type="number"
          min={options?.min}
          max={options?.max}
          step={options?.step}
          value={value === 0 ? '' : value}
          onChange={e => onUpdateRowField(row.id, fieldKey, Number(e.target.value))}
          className={`${options?.inputWidth || 'w-14'} text-right bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded p-0.5 text-xs font-mono font-medium transition ${
            isItemized ? 'text-indigo-900 font-extrabold bg-indigo-50/80 ring-1 ring-indigo-300' : 'text-slate-700'
          } ${options?.customInputClass || ''}`}
          title={isItemized ? `Itemized (${items.length} items). Click list icon to view/edit components.` : `Direct input cell. Click list icon to itemize.`}
        />

        {/* Itemization Icon Button / Active Count Badge */}
        <button
          type="button"
          onClick={handleOpenItemize}
          className={`ml-1 p-0.5 rounded transition ${
            isItemized
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs'
              : 'opacity-0 group-hover/cell:opacity-100 hover:bg-slate-200 text-slate-400 hover:text-indigo-600'
          }`}
          title={isItemized ? `Itemized with ${items.length} item(s). Click to view breakdown.` : `Itemize ${fieldLabel}`}
        >
          {isItemized ? (
            <span className="flex items-center space-x-0.5 text-[9px] font-bold px-1 py-0.2">
              <ListFilter className="w-2.5 h-2.5 inline" />
              <span>{items.length}</span>
            </span>
          ) : (
            <ListFilter className="w-3 h-3" />
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="mb-8">
      {/* 1. SMALL SECTION JUST ABOVE MATRIX TABLE: COST FIELDS SELECTOR */}
      <CostFieldsSelector
        activeCategories={activeCostCategories}
        onToggleCategory={onToggleCostCategory}
        onSelectAll={onSelectAllCostCategories}
        onSelectPreset={onSelectPresetCostCategories}
      />

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* Table Toolbar Header */}
        <div className="p-4 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight">Campaign Parametric Matrix</h2>
              <span className="text-[10px] uppercase font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded-full">
                v1.0 Parametric Formula Model
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {activeCostCategories.length} active cost module{activeCostCategories.length === 1 ? '' : 's'}: {
                activeCostCategories.map(c => COST_CATEGORY_DEFINITIONS[c]?.shortLabel).join(', ') || 'None selected'
              }
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={onOpenFormulaModal}
              className="px-3 py-1.5 bg-indigo-900/60 hover:bg-indigo-900 text-indigo-200 text-xs font-semibold rounded-lg border border-indigo-700/50 transition flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-300" />
              <span>Formula Reference</span>
            </button>

            <button
              onClick={onAddTier}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold rounded-lg border border-emerald-500/30 transition flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>+ Add New Tier</span>
            </button>

            <button
              onClick={() => onAddRow(selectedTiers.length > 0 ? selectedTiers[0] : 1)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Phase</span>
            </button>
          </div>
        </div>

        {/* Copied Phase Clipboard Notification Banner */}
        {copiedRow && (
          <div className="bg-indigo-950 text-white px-4 py-2.5 flex items-center justify-between text-xs font-medium border-b border-indigo-800 shadow-inner">
            <div className="flex items-center gap-2">
              <ClipboardPaste className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>
                Copied Phase: <strong className="text-emerald-300 font-bold">{copiedRow.phase}</strong> (Tier {copiedRow.tier}).
                Click <strong className="text-emerald-300 font-bold">"Paste Phase"</strong> on any Tier header below to insert a copy.
              </span>
            </div>
            <button
              onClick={onClearCopiedRow}
              className="text-slate-300 hover:text-white flex items-center gap-1 font-bold text-[11px] bg-indigo-800 hover:bg-indigo-700 px-2.5 py-1 rounded transition border border-indigo-700"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Clipboard</span>
            </button>
          </div>
        )}

        {/* PARAMETRIC MATRIX TABLE */}
        <div className="overflow-auto max-h-[calc(100vh-220px)] min-h-[350px] border-b border-slate-200 relative">
          <table className="w-full text-left border-collapse text-xs">
            
            {/* TOP SECTION SUPER HEADERS */}
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-2.5 text-center bg-slate-100 min-w-[135px] border-r border-b border-slate-300 sticky top-0 left-0 z-40" colSpan={1}>
                  Actions
                </th>
                <th className="p-2.5 sticky top-0 left-[135px] bg-slate-100 z-40 min-w-[180px] border-r border-b border-slate-300" colSpan={1}>
                  Campaign Phase
                </th>

                {/* 1. RADIOPHARMACEUTICALS (7 cols) */}
                {showRadio && (
                  <th className="p-2.5 text-center bg-indigo-100 text-indigo-950 border-r border-b border-indigo-200 sticky top-0 z-30" colSpan={7}>
                    1. Radiopharmaceuticals
                  </th>
                )}

                {/* 2. ANIMAL MODELS (4 cols) */}
                {showAnimals && (
                  <th className="p-2.5 text-center bg-purple-100 text-purple-950 border-r border-b border-purple-200 sticky top-0 z-30" colSpan={4}>
                    2. Animal models
                  </th>
                )}

                {/* 3. PRECLINICAL IMAGING (8 cols) */}
                {showPreclinicalImaging && (
                  <th className="p-2.5 text-center bg-amber-100 text-amber-950 border-r border-b border-amber-200 sticky top-0 z-30" colSpan={8}>
                    3. Preclinical Imaging
                  </th>
                )}

                {/* 4. CLINICAL IMAGING (8 cols) */}
                {showClinicalImaging && (
                  <th className="p-2.5 text-center bg-sky-100 text-sky-950 border-r border-b border-sky-200 sticky top-0 z-30" colSpan={8}>
                    4. Clinical Imaging
                  </th>
                )}

                {/* 5. BIODISTRIBUTION (5 cols) */}
                {showBio && (
                  <th className="p-2.5 text-center bg-emerald-100 text-emerald-950 border-r border-b border-emerald-200 sticky top-0 z-30" colSpan={5}>
                    5. Biodistribution
                  </th>
                )}

                {/* 6. IN VITRO (7 cols) */}
                {showInVitro && (
                  <th className="p-2.5 text-center bg-teal-100 text-teal-950 border-r border-b border-teal-200 sticky top-0 z-30" colSpan={7}>
                    6. In Vitro
                  </th>
                )}

                {/* 7. OTHERS (2 cols) */}
                {showOthers && (
                  <th className="p-2.5 text-center bg-slate-200 text-slate-900 border-r border-b border-slate-300 sticky top-0 z-30" colSpan={2}>
                    7. Others
                  </th>
                )}

                {/* PHASE NOTES (1 col) */}
                <th className="p-2.5 text-center bg-slate-100 text-slate-800 border-r border-b border-slate-300 min-w-[130px] sticky top-0 z-30" colSpan={1}>
                  Phase Notes
                </th>

                {/* TOTAL PHASE COST */}
                <th className="p-2.5 text-center bg-slate-900 text-white min-w-[130px] border-b border-slate-800 sticky top-0 z-30" colSpan={1}>
                  Phase Total ($)
                </th>
              </tr>

              {/* SECONDARY COLUMN SUBFIELD HEADERS */}
              <tr className="bg-slate-50 text-slate-600 text-[10px] font-semibold">
                <th className="p-2 text-center bg-slate-100 sticky top-[36px] left-0 z-40 border-r border-b border-slate-300 min-w-[135px]">
                  Actions
                </th>
                <th className="p-2 sticky top-[36px] left-[135px] bg-slate-100 z-40 border-r border-b border-slate-300 font-bold text-slate-800">
                  Phase Name & Description
                </th>

                {/* Radio subfields */}
                {showRadio && (
                  <>
                    <th className="p-2 text-right bg-indigo-50 border-b border-indigo-200 sticky top-[36px] z-30">Isotope, $/b</th>
                    <th className="p-2 text-right bg-indigo-50 border-b border-indigo-200 sticky top-[36px] z-30">Consumables, $/b</th>
                    <th className="p-2 text-right bg-indigo-50 border-b border-indigo-200 sticky top-[36px] z-30">Reagents, $/b</th>
                    <th className="p-2 text-center bg-indigo-100 font-bold text-indigo-900 border-x border-b border-indigo-200 sticky top-[36px] z-30">Batches, n_b</th>
                    <th className="p-2 text-right bg-indigo-50 border-b border-indigo-200 sticky top-[36px] z-30">Facility, $/h</th>
                    <th className="p-2 text-right bg-indigo-50 border-b border-indigo-200 sticky top-[36px] z-30">Task time, h/b</th>
                    <th className="p-2 text-right bg-indigo-100 font-bold text-indigo-950 border-r border-b border-indigo-200 sticky top-[36px] z-30">Radio Total ($)</th>
                  </>
                )}

                {/* Animal subfields */}
                {showAnimals && (
                  <>
                    <th className="p-2 text-center bg-purple-100 font-bold text-purple-900 border-x border-b border-purple-200 sticky top-[36px] z-30">Animals, n_a</th>
                    <th className="p-2 text-right bg-purple-50 border-b border-purple-200 sticky top-[36px] z-30">Animals, $/a</th>
                    <th className="p-2 text-right bg-purple-50 border-b border-purple-200 sticky top-[36px] z-30">Housing, $/a</th>
                    <th className="p-2 text-right bg-purple-100 font-bold text-purple-950 border-r border-b border-purple-200 sticky top-[36px] z-30">Animal Total ($)</th>
                  </>
                )}

                {/* Preclinical Imaging subfields */}
                {showPreclinicalImaging && (
                  <>
                    <th className="p-2 text-right bg-amber-50 border-b border-amber-200 sticky top-[36px] z-30">Consumables, $/s</th>
                    <th className="p-2 text-right bg-amber-50 border-b border-amber-200 sticky top-[36px] z-30">Reagents, $/s</th>
                    <th className="p-2 text-center bg-amber-100 font-bold text-amber-900 border-x border-b border-amber-200 sticky top-[36px] z-30">Scans, n_s</th>
                    <th className="p-2 text-right bg-amber-50 border-b border-amber-200 sticky top-[36px] z-30">Scan cost, $/h</th>
                    <th className="p-2 text-right bg-amber-50 border-b border-amber-200 sticky top-[36px] z-30">Scan time, h/s</th>
                    <th className="p-2 text-right bg-amber-50 border-b border-amber-200 sticky top-[36px] z-30">Image analysis, h/s</th>
                    <th className="p-2 text-right bg-amber-50 border-b border-amber-200 sticky top-[36px] z-30">Image analysis, $/h</th>
                    <th className="p-2 text-right bg-amber-100 font-bold text-amber-950 border-r border-b border-amber-200 sticky top-[36px] z-30">Preclin Img Total ($)</th>
                  </>
                )}

                {/* Clinical Imaging subfields */}
                {showClinicalImaging && (
                  <>
                    <th className="p-2 text-right bg-sky-50 border-b border-sky-200 sticky top-[36px] z-30">Consumables, $/cs</th>
                    <th className="p-2 text-right bg-sky-50 border-b border-sky-200 sticky top-[36px] z-30">Reagents, $/cs</th>
                    <th className="p-2 text-center bg-sky-100 font-bold text-sky-900 border-x border-b border-sky-200 sticky top-[36px] z-30">Scans, n_cs</th>
                    <th className="p-2 text-right bg-sky-50 border-b border-sky-200 sticky top-[36px] z-30">Scan cost, $/h</th>
                    <th className="p-2 text-right bg-sky-50 border-b border-sky-200 sticky top-[36px] z-30">Scan time, h/cs</th>
                    <th className="p-2 text-right bg-sky-50 border-b border-sky-200 sticky top-[36px] z-30">Image analysis, h/cs</th>
                    <th className="p-2 text-right bg-sky-50 border-b border-sky-200 sticky top-[36px] z-30">Image analysis, $/h</th>
                    <th className="p-2 text-right bg-sky-100 font-bold text-sky-950 border-r border-b border-sky-200 sticky top-[36px] z-30">Clin Img Total ($)</th>
                  </>
                )}

                {/* Biodistribution subfields */}
                {showBio && (
                  <>
                    <th className="p-2 text-right bg-emerald-50 border-b border-emerald-200 sticky top-[36px] z-30">Consumables, $/bio</th>
                    <th className="p-2 text-right bg-emerald-50 border-b border-emerald-200 sticky top-[36px] z-30">Reagents, $/bio</th>
                    <th className="p-2 text-center bg-emerald-100 font-bold text-emerald-900 border-x border-b border-emerald-200 sticky top-[36px] z-30">Biodist., n_bio</th>
                    <th className="p-2 text-right bg-emerald-50 border-b border-emerald-200 sticky top-[36px] z-30">Bio Cost, $/n_bio</th>
                    <th className="p-2 text-right bg-emerald-100 font-bold text-emerald-950 border-r border-b border-emerald-200 sticky top-[36px] z-30">Bio Total ($)</th>
                  </>
                )}

                {/* In Vitro subfields */}
                {showInVitro && (
                  <>
                    <th className="p-2 text-right bg-teal-50 border-b border-teal-200 sticky top-[36px] z-30">Cell line, $</th>
                    <th className="p-2 text-right bg-teal-50 border-b border-teal-200 sticky top-[36px] z-30">Consumables, $/t</th>
                    <th className="p-2 text-right bg-teal-50 border-b border-teal-200 sticky top-[36px] z-30">Reagents, $/t</th>
                    <th className="p-2 text-center bg-teal-100 font-bold text-teal-900 border-x border-b border-teal-200 sticky top-[36px] z-30">Tests, n_t</th>
                    <th className="p-2 text-right bg-teal-50 border-b border-teal-200 sticky top-[36px] z-30">Testing, h/t</th>
                    <th className="p-2 text-right bg-teal-50 border-b border-teal-200 sticky top-[36px] z-30">Testing cost, $/h</th>
                    <th className="p-2 text-right bg-teal-100 font-bold text-teal-950 border-r border-b border-teal-200 sticky top-[36px] z-30">In Vitro Total ($)</th>
                  </>
                )}

                {/* Others subfields */}
                {showOthers && (
                  <>
                    <th className="p-2 text-right bg-slate-100 font-bold border-b border-slate-300 sticky top-[36px] z-30">Cost, $</th>
                    <th className="p-2 text-left bg-slate-100 border-r border-b border-slate-300 sticky top-[36px] z-30">Note (Others)</th>
                  </>
                )}

                {/* Phase Notes */}
                <th className="p-2 text-left bg-slate-50 border-r border-b border-slate-300 font-bold sticky top-[36px] z-30">Phase Notes</th>

                {/* Total */}
                <th className="p-2 text-right bg-slate-800 font-extrabold text-white border-b border-slate-900 sticky top-[36px] z-30">∑ Phase Total</th>
              </tr>
            </thead>

            {/* TABLE BODY GROUPED BY TIER */}
            <tbody>
              {filteredTiers.length === 0 ? (
                <tr>
                  <td colSpan={dynamicColSpan} className="p-12 text-center bg-slate-50 border-b border-slate-200">
                    <div className="flex flex-col items-center justify-center gap-2.5 max-w-sm mx-auto">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full">
                        <Layers className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">No tiers or phases in the matrix</h4>
                      <p className="text-xs text-slate-500">
                        Matrix is currently blank. Add a campaign tier or import a saved report to begin estimating.
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={onAddTier}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Add New Tier</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTiers.map(tier => {
                  const tierSummary = tierSummaries.find(ts => ts.tierNumber === tier.tierNumber);
                const tierCalculatedRows = calculatedRows.filter(r => r.row.tier === tier.tierNumber);
                const isCollapsed = collapsedTiers[tier.tierNumber];

                return (
                  <React.Fragment key={tier.tierNumber}>
                    
                    {/* TIER HEADER ROW */}
                    <tr className="bg-slate-800 text-white border-y border-slate-700 font-bold">
                      <td colSpan={dynamicColSpan} className="p-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleTierCollapse(tier.tierNumber)}
                              className="p-1 rounded bg-slate-700 hover:bg-slate-600 transition text-slate-200"
                            >
                              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                            </button>
                            
                            <span className="text-sm font-extrabold text-indigo-300 tracking-wide">
                              Tier {tier.tierNumber}: {tier.name}
                            </span>
                            
                            <span className="text-xs text-slate-300 font-normal border-l border-slate-600 pl-3">
                              {tier.subtitle}
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5 text-xs font-mono">
                            <span className="bg-slate-700 text-slate-200 px-2.5 py-1 rounded border border-slate-600">
                              Added: <strong className="text-emerald-400">{formatCurrency(tierSummary?.addedCost || 0)}</strong>
                            </span>
                            <span className="bg-indigo-950 text-indigo-200 px-2.5 py-1 rounded border border-indigo-800">
                              Cumulated: <strong className="text-white">{formatCurrency(tierSummary?.cumulativeTotal || 0)}</strong>
                            </span>

                            {copiedRow && (
                              <button
                                onClick={() => onPasteRow(tier.tierNumber)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-sans text-xs px-2.5 py-1 rounded transition flex items-center gap-1 shadow-xs"
                                title={`Paste copied phase "${copiedRow.phase}" into Tier ${tier.tierNumber}`}
                              >
                                <ClipboardPaste className="w-3.5 h-3.5" />
                                <span>Paste Phase</span>
                              </button>
                            )}

                            <button
                              onClick={() => onAddRow(tier.tierNumber)}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-sans text-xs px-2.5 py-1 rounded transition flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Phase</span>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* PHASE ROWS WITHIN TIER */}
                    {!isCollapsed && tierCalculatedRows.map((c, rowIdx) => {
                      const row = c.row;

                      return (
                        <tr key={row.id} className={`border-b border-slate-200 hover:bg-slate-50/80 transition ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                          
                          {/* EXTREME LEFT ACTIONS COLUMN */}
                          <td className="p-1 text-center sticky left-0 bg-white z-20 border-r border-slate-200 shadow-2xs min-w-[135px]">
                            <div className="flex items-center justify-center space-x-0.5">
                              <button
                                onClick={() => onMoveRow(row.id, 'up')}
                                disabled={rowIdx === 0}
                                title="Move phase up within Tier"
                                className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-25 rounded hover:bg-slate-100 transition"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onMoveRow(row.id, 'down')}
                                disabled={rowIdx === tierCalculatedRows.length - 1}
                                title="Move phase down within Tier"
                                className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-25 rounded hover:bg-slate-100 transition"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onCopyRow(row)}
                                title="Copy phase to clipboard buffer"
                                className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-50 transition"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDuplicateRow(row)}
                                title="Duplicate phase in this Tier"
                                className="p-1 text-slate-400 hover:text-emerald-600 rounded hover:bg-emerald-50 transition"
                              >
                                <CopyPlus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onEditRow(row)}
                                title="Edit Phase Details Modal"
                                className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-50 transition"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteRow(row.id)}
                                title="Delete Phase"
                                className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                          {/* PHASE NAME & DESC */}
                          <td className="p-2.5 sticky left-[135px] bg-white z-10 border-r border-slate-200 font-medium text-slate-900 shadow-2xs">
                            <div className="font-bold text-slate-900">{row.phase}</div>
                            {row.description && (
                              <div className="text-[10px] text-slate-500 line-clamp-1">{row.description}</div>
                            )}
                          </td>

                          {/* 1. RADIOPHARMACEUTICALS */}
                          {showRadio && (
                            <>
                              <td className="p-1.5 text-right font-mono text-slate-700">
                                {renderItemizableCell(row, 'isotopeCostPerBatch', 'Isotope ($/b)', 'currency', row.isotopeCostPerBatch)}
                              </td>
                              <td className="p-1.5 text-right font-mono text-slate-700">
                                {renderItemizableCell(row, 'radiopharmConsumablesPerBatch', 'Consumables ($/b)', 'currency', row.radiopharmConsumablesPerBatch)}
                              </td>
                              <td className="p-1.5 text-right font-mono text-slate-700">
                                {renderItemizableCell(row, 'radiopharmReagentsPerBatch', 'Reagents ($/b)', 'currency', row.radiopharmReagentsPerBatch)}
                              </td>
                              <td className="p-1.5 text-center font-mono font-bold text-indigo-900 bg-indigo-50/40 border-x border-indigo-100">
                                {renderItemizableCell(row, 'numBatches', 'Batches (n_b)', 'number', row.numBatches, { min: 0, inputWidth: 'w-12', customInputClass: 'text-center font-bold text-indigo-900 bg-white border border-indigo-300' })}
                              </td>
                              <td className="p-1.5 text-right font-mono text-slate-700">
                                {renderItemizableCell(row, 'radiopharmFacilityCostPerHour', 'Facility ($/h)', 'currency', row.radiopharmFacilityCostPerHour)}
                              </td>
                              <td className="p-1.5 text-right font-mono text-slate-700">
                                {renderItemizableCell(row, 'radiopharmTaskTimeHoursPerBatch', 'Task time (h/b)', 'hours', row.radiopharmTaskTimeHoursPerBatch)}
                              </td>
                              <td className="p-2 text-right font-mono font-bold text-indigo-950 bg-indigo-100/60 border-r border-indigo-200">
                                {formatCurrency(c.radiopharmaceuticalsTotal)}
                              </td>
                            </>
                          )}

                          {/* 2. ANIMAL MODELS */}
                          {showAnimals && (
                            <>
                              <td className={`p-1.5 text-center font-mono font-bold border-x border-purple-200 relative ${
                                c.unaccountedAnimals 
                                  ? 'bg-rose-100 text-rose-900' 
                                  : c.scansLessThanAnimals 
                                  ? 'bg-amber-100 text-amber-900' 
                                  : 'bg-purple-50/40 text-purple-900'
                              }`}>
                                <div className="flex items-center justify-center gap-1">
                                  {renderItemizableCell(row, 'numAnimals', 'Animals (n_a)', 'number', row.numAnimals, { min: 0, inputWidth: 'w-12', customInputClass: 'text-center font-bold text-purple-900 bg-white border border-purple-300' })}
                                  {c.unaccountedAnimals && (
                                    <span title={`STRONG WARNING: ${c.unaccountedCount} animals have no scan or biodistribution!`} className="cursor-help text-rose-600 font-extrabold">
                                      ⚠️
                                    </span>
                                  )}
                                  {c.scansLessThanAnimals && !c.unaccountedAnimals && (
                                    <span title={`LIGHT WARNING: Scans (${row.numScans}) < Animals (${row.numAnimals}). Covered by biodistribution (${row.numBiodistributions}).`} className="cursor-help text-amber-600 font-bold">
                                      ⚡
                                    </span>
                                  )}
                                </div>
                                {c.unaccountedAnimals && (
                                  <div className="text-[9px] font-sans font-bold text-rose-700 line-clamp-1">
                                    {c.unaccountedCount} unmapped
                                  </div>
                                )}
                              </td>
                              <td className="p-1.5 text-right font-mono text-slate-700">
                                {renderItemizableCell(row, 'animalCostEach', 'Animal Cost ($/a)', 'currency', row.animalCostEach)}
                              </td>
                              <td className="p-1.5 text-right font-mono text-slate-700">
                                {renderItemizableCell(row, 'housingCostEach', 'Housing ($/a)', 'currency', row.housingCostEach)}
                              </td>
                              <td className="p-2 text-right font-mono font-bold text-purple-950 bg-purple-100/60 border-r border-purple-200">
                                {formatCurrency(c.animalModelsTotal)}
                              </td>
                            </>
                          )}

                          {/* 3. PRECLINICAL IMAGING */}
                          {showPreclinicalImaging && (
                            <>
                              <td className="p-1.5 text-right font-mono text-slate-700">
                                {renderItemizableCell(row, 'imagingConsumablesPerScan', 'Consumables ($/s)', 'currency', row.imagingConsumablesPerScan)}
                              </td>
                              <td className="p-1.5 text-right font-mono text-slate-700">
                                {renderItemizableCell(row, 'imagingReagentsPerScan', 'Reagents ($/s)', 'currency', row.imagingReagentsPerScan)}
                              </td>
                              <td className="p-1.5 text-center font-mono font-bold text-amber-900 bg-amber-50/40 border-x border-amber-100">
                                {renderItemizableCell(row, 'numScans', 'Scans (n_s)', 'number', row.numScans, { min: 0, max: row.numAnimals, inputWidth: 'w-12', customInputClass: 'text-center font-bold text-amber-900 bg-white border border-amber-300' })}
                              </td>
                              <td className="p-1.5 text-right font-mono text-slate-700">
                                {renderItemizableCell(row, 'scanCostPerHour', 'Scan cost ($/h)', 'currency', row.scanCostPerHour)}
                              </td>
                              <td className="p-1.5 text-right font-mono text-slate-700">
                                {renderItemizableCell(row, 'scanTimeHoursPerScan', 'Scan time (h/s)', 'hours', row.scanTimeHoursPerScan)}
                              </td>
                              <td className="p-1.5 text-right font-mono text-slate-700">
                                {renderItemizableCell(row, 'imageAnalysisHoursPerScan', 'Image analysis (h/s)', 'hours', row.imageAnalysisHoursPerScan)}
                              </td>
                              <td className="p-1.5 text-right font-mono text-slate-700">
                                {renderItemizableCell(row, 'imageAnalysisCostPerHour', 'Image analysis ($/h)', 'currency', row.imageAnalysisCostPerHour)}
                              </td>
                              <td className="p-2 text-right font-mono font-bold text-amber-950 bg-amber-100/60 border-r border-amber-200">
                                {formatCurrency(c.preclinicalImagingTotal)}
                              </td>
                            </>
                          )}

                          {/* 4. CLINICAL IMAGING */}
                          {showClinicalImaging && (
                            <>
                              <td className="p-1.5 text-right font-mono text-slate-700">
                                {renderItemizableCell(row, 'clinicalImagingConsumablesPerScan', 'Consumables ($/cs)', 'currency', row.clinicalImagingConsumablesPerScan)}
                              </td>
                              <td className="p-1.5 text-right font-mono text-slate-700">
                                {renderItemizableCell(row, 'clinicalImagingReagentsPerScan', 'Reagents ($/cs)', 'currency', row.clinicalImagingReagentsPerScan)}
                              </td>
                              <td className="p-1.5 text-center font-mono font-bold text-sky-900 bg-sky-50/40 border-x border-sky-100">
                                {renderItemizableCell(row, 'numClinicalScans', 'Scans (n_cs)', 'number', row.numClinicalScans, { min: 0, inputWidth: 'w-12', customInputClass: 'text-center font-bold text-sky-900 bg-white border border-sky-300' })}
                              </td>
                              <td className="p-1.5 text-right font-mono text-slate-700">
                                {renderItemizableCell(row, 'clinicalScanCostPerHour', 'Scan cost ($/h)', 'currency', row.clinicalScanCostPerHour)}
                              </td>
                              <td className="p-1.5 text-right font-mono text-slate-700">
                                {renderItemizableCell(row, 'clinicalScanTimeHoursPerScan', 'Scan time (h/cs)', 'hours', row.clinicalScanTimeHoursPerScan)}
                              </td>
                              <td className="p-1.5 text-right font-mono text-slate-700">
                                {renderItemizableCell(row, 'clinicalImageAnalysisHoursPerScan', 'Image analysis (h/cs)', 'hours', row.clinicalImageAnalysisHoursPerScan)}
                              </td>
                              <td className="p-1.5 text-right font-mono text-slate-700">
                                {renderItemizableCell(row, 'clinicalImageAnalysisCostPerHour', 'Image analysis ($/h)', 'currency', row.clinicalImageAnalysisCostPerHour)}
                              </td>
                              <td className="p-2 text-right font-mono font-bold text-sky-950 bg-sky-100/60 border-r border-sky-200">
                                {formatCurrency(c.clinicalImagingTotal)}
                              </td>
                            </>
                          )}

                          {/* 5. BIODISTRIBUTION */}
                          {showBio && (
                            <>
                              <td className="p-1.5 text-right font-mono text-slate-700">
                                {renderItemizableCell(row, 'bioConsumablesPerBio', 'Consumables ($/bio)', 'currency', row.bioConsumablesPerBio)}
                              </td>
                              <td className="p-1.5 text-right font-mono text-slate-700">
                                {renderItemizableCell(row, 'bioReagentsPerBio', 'Reagents ($/bio)', 'currency', row.bioReagentsPerBio)}
                              </td>
                              <td className="p-1.5 text-center font-mono font-bold text-emerald-900 bg-emerald-50/40 border-x border-emerald-100">
                                {renderItemizableCell(row, 'numBiodistributions', 'Biodist. (n_bio)', 'number', row.numBiodistributions, { min: 0, max: Math.max(0, row.numAnimals - row.numScans), inputWidth: 'w-12', customInputClass: 'text-center font-bold text-emerald-900 bg-white border border-emerald-300' })}
                              </td>
                              <td className="p-1.5 text-right font-mono text-slate-700">
                                {renderItemizableCell(row, 'bioCostPerUnit', 'Bio cost ($/unit)', 'currency', row.bioCostPerUnit)}
                              </td>
                              <td className="p-2 text-right font-mono font-bold text-emerald-950 bg-emerald-100/60 border-r border-emerald-200">
                                {formatCurrency(c.biodistributionTotal)}
                              </td>
                            </>
                          )}

                          {/* 6. IN VITRO */}
                          {showInVitro && (
                            <>
                              <td className="p-1.5 text-right font-mono text-slate-700">
                                {renderItemizableCell(row, 'cellLineCost', 'Cell line ($)', 'currency', row.cellLineCost)}
                              </td>
                              <td className="p-1.5 text-right font-mono text-slate-700">
                                {renderItemizableCell(row, 'inVitroConsumablesPerTest', 'Consumables ($/t)', 'currency', row.inVitroConsumablesPerTest)}
                              </td>
                              <td className="p-1.5 text-right font-mono text-slate-700">
                                {renderItemizableCell(row, 'inVitroReagentsPerTest', 'Reagents ($/t)', 'currency', row.inVitroReagentsPerTest)}
                              </td>
                              <td className="p-1.5 text-center font-mono font-bold text-teal-900 bg-teal-50/40 border-x border-teal-100">
                                {renderItemizableCell(row, 'numInVitroTests', 'Tests (n_t)', 'number', row.numInVitroTests, { min: 0, inputWidth: 'w-12', customInputClass: 'text-center font-bold text-teal-900 bg-white border border-teal-300' })}
                              </td>
                              <td className="p-1.5 text-right font-mono text-slate-700">
                                {renderItemizableCell(row, 'inVitroTestingHoursPerTest', 'Testing (h/t)', 'hours', row.inVitroTestingHoursPerTest)}
                              </td>
                              <td className="p-1.5 text-right font-mono text-slate-700">
                                {renderItemizableCell(row, 'inVitroTestingCostPerHour', 'Testing cost ($/h)', 'currency', row.inVitroTestingCostPerHour)}
                              </td>
                              <td className="p-2 text-right font-mono font-bold text-teal-950 bg-teal-100/60 border-r border-teal-200">
                                {formatCurrency(c.inVitroTotal)}
                              </td>
                            </>
                          )}

                          {/* 7. OTHERS */}
                          {showOthers && (
                            <>
                              <td className="p-1.5 text-right font-mono text-slate-700">
                                {renderItemizableCell(row, 'othersCost', 'Others Cost ($)', 'currency', row.othersCost)}
                              </td>
                              <td className="p-1.5 text-left text-slate-700 border-r border-slate-200">
                                <input
                                  type="text"
                                  value={row.othersNotes || ''}
                                  onChange={e => onUpdateRowField(row.id, 'othersNotes', e.target.value)}
                                  placeholder="e.g. cold competitor"
                                  className="w-28 text-xs bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded p-0.5"
                                />
                              </td>
                            </>
                          )}

                          {/* PHASE NOTES */}
                          <td className="p-1.5 text-left text-slate-700 border-r border-slate-200">
                            <input
                              type="text"
                              value={row.phaseNotes || row.notes || ''}
                              onChange={e => {
                                onUpdateRowField(row.id, 'phaseNotes', e.target.value);
                                onUpdateRowField(row.id, 'notes', e.target.value);
                              }}
                              placeholder="Phase notes..."
                              className="w-32 text-xs bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-indigo-500 rounded p-0.5"
                            />
                          </td>

                          {/* MASTER ROW TOTAL */}
                          <td className="p-2 text-right font-mono font-black text-slate-900 bg-slate-100 text-sm">
                            {formatCurrency(c.totalRowCost)}
                          </td>

                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              }))}
            </tbody>

            {/* TABLE FOOTER SUMMARY ROW */}
            <tfoot>
              <tr className="bg-slate-900 text-white font-bold border-t-2 border-slate-700 sticky bottom-0 z-30 shadow-lg text-xs">
                <td className="p-2 text-center sticky left-0 bg-slate-900 z-30 border-r border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">TOTAL</span>
                </td>
                <td className="p-2 sticky left-[135px] bg-slate-900 z-30 border-r border-slate-800">
                  <div className="font-extrabold text-indigo-300 text-xs uppercase tracking-wide">
                    Summary Totals
                  </div>
                  <div className="text-[10px] text-slate-400 font-normal">
                    {visibleCalculatedRows.length} phase{visibleCalculatedRows.length === 1 ? '' : 's'} across {filteredTiers.length} tier{filteredTiers.length === 1 ? '' : 's'}
                  </div>
                </td>

                {/* 1. RADIOPHARMACEUTICALS */}
                {showRadio && (
                  <>
                    <td className="p-2 text-right font-mono text-slate-500">-</td>
                    <td className="p-2 text-right font-mono text-slate-500">-</td>
                    <td className="p-2 text-right font-mono text-slate-500">-</td>
                    <td className="p-2 text-center font-mono font-bold text-indigo-200 bg-indigo-950/60 border-x border-indigo-900">
                      {totalBatches}
                    </td>
                    <td className="p-2 text-right font-mono text-slate-500">-</td>
                    <td className="p-2 text-right font-mono text-slate-300">
                      {totalFacilityHours}h
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-indigo-300 bg-indigo-900/80 border-r border-indigo-800">
                      {formatCurrency(totalRadioCost)}
                    </td>
                  </>
                )}

                {/* 2. ANIMAL MODELS */}
                {showAnimals && (
                  <>
                    <td className="p-2 text-center font-mono font-bold text-purple-200 bg-purple-950/60 border-x border-purple-900">
                      {totalAnimals}
                    </td>
                    <td className="p-2 text-right font-mono text-slate-500">-</td>
                    <td className="p-2 text-right font-mono text-slate-500">-</td>
                    <td className="p-2 text-right font-mono font-bold text-purple-300 bg-purple-900/80 border-r border-purple-800">
                      {formatCurrency(totalAnimalCost)}
                    </td>
                  </>
                )}

                {/* 3. PRECLINICAL IMAGING */}
                {showPreclinicalImaging && (
                  <>
                    <td className="p-2 text-right font-mono text-slate-500">-</td>
                    <td className="p-2 text-right font-mono text-slate-500">-</td>
                    <td className="p-2 text-center font-mono font-bold text-amber-200 bg-amber-950/60 border-x border-amber-900">
                      {totalScans}
                    </td>
                    <td className="p-2 text-right font-mono text-slate-500">-</td>
                    <td className="p-2 text-right font-mono text-slate-300">
                      {totalScanHours}h
                    </td>
                    <td className="p-2 text-right font-mono text-slate-500">-</td>
                    <td className="p-2 text-right font-mono text-slate-500">-</td>
                    <td className="p-2 text-right font-mono font-bold text-amber-300 bg-amber-900/80 border-r border-amber-800">
                      {formatCurrency(totalPreclinicalImagingCost)}
                    </td>
                  </>
                )}

                {/* 4. CLINICAL IMAGING */}
                {showClinicalImaging && (
                  <>
                    <td className="p-2 text-right font-mono text-slate-500">-</td>
                    <td className="p-2 text-right font-mono text-slate-500">-</td>
                    <td className="p-2 text-center font-mono font-bold text-sky-200 bg-sky-950/60 border-x border-sky-900">
                      {totalClinicalScans}
                    </td>
                    <td className="p-2 text-right font-mono text-slate-500">-</td>
                    <td className="p-2 text-right font-mono text-slate-300">
                      {totalClinicalScanHours}h
                    </td>
                    <td className="p-2 text-right font-mono text-slate-500">-</td>
                    <td className="p-2 text-right font-mono text-slate-500">-</td>
                    <td className="p-2 text-right font-mono font-bold text-sky-300 bg-sky-900/80 border-r border-sky-800">
                      {formatCurrency(totalClinicalImagingCost)}
                    </td>
                  </>
                )}

                {/* 5. BIODISTRIBUTION */}
                {showBio && (
                  <>
                    <td className="p-2 text-right font-mono text-slate-500">-</td>
                    <td className="p-2 text-right font-mono text-slate-500">-</td>
                    <td className="p-2 text-center font-mono font-bold text-emerald-200 bg-emerald-950/60 border-x border-emerald-900">
                      {totalBio}
                    </td>
                    <td className="p-2 text-right font-mono text-slate-500">-</td>
                    <td className="p-2 text-right font-mono font-bold text-emerald-300 bg-emerald-900/80 border-r border-emerald-800">
                      {formatCurrency(totalBioCost)}
                    </td>
                  </>
                )}

                {/* 6. IN VITRO */}
                {showInVitro && (
                  <>
                    <td className="p-2 text-right font-mono text-slate-500">-</td>
                    <td className="p-2 text-right font-mono text-slate-500">-</td>
                    <td className="p-2 text-right font-mono text-slate-500">-</td>
                    <td className="p-2 text-center font-mono font-bold text-teal-200 bg-teal-950/60 border-x border-teal-900">
                      {totalInVitroTests}
                    </td>
                    <td className="p-2 text-right font-mono text-slate-500">-</td>
                    <td className="p-2 text-right font-mono text-slate-500">-</td>
                    <td className="p-2 text-right font-mono font-bold text-teal-300 bg-teal-900/80 border-r border-teal-800">
                      {formatCurrency(totalInVitroCost)}
                    </td>
                  </>
                )}

                {/* 7. OTHERS */}
                {showOthers && (
                  <>
                    <td className="p-2 text-right font-mono font-bold text-slate-300 bg-slate-800/80">
                      {formatCurrency(totalOthersCost)}
                    </td>
                    <td className="p-2 text-slate-500 border-r border-slate-800">-</td>
                  </>
                )}

                {/* PHASE NOTES */}
                <td className="p-2 text-slate-500 border-r border-slate-800"></td>

                {/* GRAND TOTAL */}
                <td className="p-2.5 text-right font-mono font-black text-emerald-400 bg-slate-950 text-sm border-l border-slate-800">
                  {formatCurrency(grandTotalCost)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* CELL ITEMIZATION POPUP MODAL */}
        {activeItemizeTarget && (
          <ItemizationModal
            isOpen={!!activeItemizeTarget}
            onClose={() => setActiveItemizeTarget(null)}
            phaseName={activeItemizeTarget.phaseName}
            fieldLabel={activeItemizeTarget.fieldLabel}
            unitType={activeItemizeTarget.unitType}
            initialItems={activeItemizeTarget.initialItems}
            currentValue={activeItemizeTarget.currentValue}
            onSave={(items, totalValue) => {
              onUpdateCellItemization(
                activeItemizeTarget.rowId,
                activeItemizeTarget.fieldKey,
                items,
                totalValue
              );
            }}
          />
        )}

      </div>
    </div>
  );
};
