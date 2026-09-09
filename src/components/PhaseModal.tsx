import React, { useState, useEffect } from 'react';
import { X, Plus, Save, Info, AlertTriangle, ListFilter, Filter } from 'lucide-react';
import { PhaseRow, TierConfig, CellItem, CostCategoryId, ALL_COST_CATEGORY_IDS } from '../types';
import { calculateRowCosts, formatCurrency } from '../utils/calculator';
import { ItemizationModal } from './ItemizationModal';

interface PhaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRow: (row: PhaseRow) => void;
  tiers: TierConfig[];
  initialRow?: PhaseRow | null;
  defaultTierNumber?: number;
  activeCostCategories?: CostCategoryId[];
}

interface ItemizeTarget {
  fieldKey: keyof PhaseRow;
  fieldLabel: string;
  unitType: 'currency' | 'number' | 'hours';
  currentValue: number;
  initialItems: CellItem[];
}

export const PhaseModal: React.FC<PhaseModalProps> = ({
  isOpen,
  onClose,
  onSaveRow,
  tiers,
  initialRow,
  defaultTierNumber = 1,
  activeCostCategories = ALL_COST_CATEGORY_IDS,
}) => {
  const [activeItemizeTarget, setActiveItemizeTarget] = useState<ItemizeTarget | null>(null);

  const showRadio = activeCostCategories.includes('radiopharmaceuticals');
  const showAnimals = activeCostCategories.includes('animalModels');
  const showPreclinicalImaging = activeCostCategories.includes('preclinicalImaging') || activeCostCategories.includes('imaging' as any);
  const showClinicalImaging = activeCostCategories.includes('clinicalImaging');
  const showBio = activeCostCategories.includes('biodistribution');
  const showInVitro = activeCostCategories.includes('inVitro');
  const showOthers = activeCostCategories.includes('others');

  const [formData, setFormData] = useState<PhaseRow>({
    id: '',
    tier: defaultTierNumber,
    phase: '',
    description: '',

    isotopeCostPerBatch: 0,
    radiopharmConsumablesPerBatch: 0,
    radiopharmReagentsPerBatch: 0,
    numBatches: 0,
    radiopharmFacilityCostPerHour: 0,
    radiopharmTaskTimeHoursPerBatch: 0,

    numAnimals: 0,
    animalCostEach: 0,
    housingCostEach: 0,

    imagingConsumablesPerScan: 0,
    imagingReagentsPerScan: 0,
    numScans: 0,
    scanCostPerHour: 0,
    scanTimeHoursPerScan: 0,
    imageAnalysisHoursPerScan: 0,
    imageAnalysisCostPerHour: 0,

    clinicalImagingConsumablesPerScan: 0,
    clinicalImagingReagentsPerScan: 0,
    numClinicalScans: 0,
    clinicalScanCostPerHour: 0,
    clinicalScanTimeHoursPerScan: 0,
    clinicalImageAnalysisHoursPerScan: 0,
    clinicalImageAnalysisCostPerHour: 0,

    bioConsumablesPerBio: 0,
    bioReagentsPerBio: 0,
    numBiodistributions: 0,
    bioCostPerUnit: 0,

    cellLineCost: 0,
    inVitroConsumablesPerTest: 0,
    inVitroReagentsPerTest: 0,
    numInVitroTests: 0,
    inVitroTestingHoursPerTest: 0,
    inVitroTestingCostPerHour: 0,

    othersCost: 0,
    othersNotes: '',
    phaseNotes: '',
    notes: '',
  });

  useEffect(() => {
    if (initialRow) {
      setFormData(initialRow);
    } else {
      setFormData({
        id: `row-${Date.now()}`,
        tier: defaultTierNumber,
        phase: '',
        description: '',

        isotopeCostPerBatch: 0,
        radiopharmConsumablesPerBatch: 0,
        radiopharmReagentsPerBatch: 0,
        numBatches: 0,
        radiopharmFacilityCostPerHour: 0,
        radiopharmTaskTimeHoursPerBatch: 0,

        numAnimals: 0,
        animalCostEach: 0,
        housingCostEach: 0,

        imagingConsumablesPerScan: 0,
        imagingReagentsPerScan: 0,
        numScans: 0,
        scanCostPerHour: 0,
        scanTimeHoursPerScan: 0,
        imageAnalysisHoursPerScan: 0,
        imageAnalysisCostPerHour: 0,

        clinicalImagingConsumablesPerScan: 0,
        clinicalImagingReagentsPerScan: 0,
        numClinicalScans: 0,
        clinicalScanCostPerHour: 0,
        clinicalScanTimeHoursPerScan: 0,
        clinicalImageAnalysisHoursPerScan: 0,
        clinicalImageAnalysisCostPerHour: 0,

        bioConsumablesPerBio: 0,
        bioReagentsPerBio: 0,
        numBiodistributions: 0,
        bioCostPerUnit: 0,

        cellLineCost: 0,
        inVitroConsumablesPerTest: 0,
        inVitroReagentsPerTest: 0,
        numInVitroTests: 0,
        inVitroTestingHoursPerTest: 0,
        inVitroTestingCostPerHour: 0,

        othersCost: 0,
        othersNotes: '',
        phaseNotes: '',
        notes: '',
      });
    }
  }, [initialRow, defaultTierNumber, isOpen]);

  if (!isOpen) return null;

  // Real-time calculation Preview respecting activeCostCategories
  const calculated = calculateRowCosts(formData, activeCostCategories);

  const handleNumAnimalsChange = (val: number) => {
    const n_a = Math.max(0, val);
    let n_s = formData.numScans;
    if (n_s > n_a) n_s = n_a;

    const maxBio = Math.max(0, n_a - n_s);
    let n_bio = formData.numBiodistributions;
    if (n_bio > maxBio) n_bio = maxBio;

    setFormData(prev => ({
      ...prev,
      numAnimals: n_a,
      numScans: n_s,
      numBiodistributions: n_bio
    }));
  };

  const handleNumScansChange = (val: number) => {
    const n_a = formData.numAnimals;
    const n_s = Math.min(n_a, Math.max(0, val)); // n_s <= n_a constraint
    const maxBio = Math.max(0, n_a - n_s);
    let n_bio = formData.numBiodistributions;
    if (n_bio > maxBio) n_bio = maxBio;

    setFormData(prev => ({
      ...prev,
      numScans: n_s,
      numBiodistributions: n_bio
    }));
  };

  const handleNumBioChange = (val: number) => {
    const n_a = formData.numAnimals;
    const n_s = formData.numScans;
    const maxBio = Math.max(0, n_a - n_s);
    const n_bio = Math.min(maxBio, Math.max(0, val)); // n_bio <= (n_a - n_s) constraint

    setFormData(prev => ({
      ...prev,
      numBiodistributions: n_bio
    }));
  };

  const handleOpenItemize = (
    fieldKey: keyof PhaseRow,
    fieldLabel: string,
    unitType: 'currency' | 'number' | 'hours',
    currentValue: number
  ) => {
    const items = formData.itemizations?.[fieldKey as string] || [];
    setActiveItemizeTarget({
      fieldKey,
      fieldLabel,
      unitType,
      currentValue,
      initialItems: items,
    });
  };

  const handleSaveItemization = (items: CellItem[] | null, totalValue: number) => {
    if (!activeItemizeTarget) return;
    const key = activeItemizeTarget.fieldKey;

    setFormData(prev => {
      const nextItemizations = { ...(prev.itemizations || {}) };
      if (items && items.length > 0) {
        nextItemizations[key as string] = items;
      } else {
        delete nextItemizations[key as string];
      }

      return {
        ...prev,
        [key]: totalValue,
        itemizations: Object.keys(nextItemizations).length > 0 ? nextItemizations : undefined,
      };
    });

    if (key === 'numAnimals') {
      handleNumAnimalsChange(totalValue);
    } else if (key === 'numScans') {
      handleNumScansChange(totalValue);
    } else if (key === 'numBiodistributions') {
      handleNumBioChange(totalValue);
    }

    setActiveItemizeTarget(null);
  };

  const renderInputField = (
    fieldKey: keyof PhaseRow,
    label: string,
    unitType: 'currency' | 'number' | 'hours',
    value: number,
    onChange: (val: number) => void,
    options?: {
      min?: number;
      max?: number;
      bold?: boolean;
    }
  ) => {
    const items = formData.itemizations?.[fieldKey as string] || [];
    const isItemized = items.length > 0;

    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className={`block text-[11px] ${options?.bold ? 'text-slate-900 font-bold' : 'text-slate-600 font-medium'}`}>
            {label}
          </label>
          <button
            type="button"
            onClick={() => handleOpenItemize(fieldKey, label, unitType, value)}
            className={`px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1 transition ${
              isItemized
                ? 'bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-2xs'
                : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'
            }`}
            title={isItemized ? `Itemized with ${items.length} items. Click to edit breakdown.` : `Itemize ${label}`}
          >
            <ListFilter className="w-2.5 h-2.5" />
            <span>{isItemized ? `${items.length} itemized` : 'Itemize'}</span>
          </button>
        </div>

        <div className="relative flex items-center">
          {unitType === 'currency' && (
            <span className="absolute left-2 text-slate-400 text-[10px] font-mono select-none">$</span>
          )}
          <input
            type="number"
            min={options?.min}
            max={options?.max}
            value={value === 0 ? '' : value}
            onChange={e => onChange(Number(e.target.value))}
            className={`w-full border rounded p-1.5 text-xs font-mono transition ${
              unitType === 'currency' ? 'pl-5' : ''
            } ${
              isItemized
                ? 'bg-indigo-50/90 border-indigo-400 font-extrabold text-indigo-950 ring-1 ring-indigo-300'
                : options?.bold
                ? 'bg-white font-bold text-slate-900 border-slate-300'
                : 'bg-white text-slate-900 border-slate-300'
            }`}
          />
        </div>
        {isItemized && (
          <span className="text-[9px] text-indigo-600 font-semibold mt-0.5 block line-clamp-1">
            Sum of {items.length} itemized component{items.length === 1 ? '' : 's'}
          </span>
        )}
      </div>
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phase.trim()) return;
    onSaveRow(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 text-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              {initialRow ? <Save className="w-5 h-5 text-indigo-600" /> : <Plus className="w-5 h-5 text-emerald-600" />}
              <span>{initialRow ? 'Edit Campaign Phase' : 'Add New Campaign Phase'}</span>
            </h3>
            {activeCostCategories.length < ALL_COST_CATEGORY_IDS.length && (
              <p className="text-[11px] text-amber-700 font-medium mt-0.5 flex items-center gap-1">
                <Filter className="w-3 h-3 text-amber-600" />
                <span>Showing {activeCostCategories.length} active cost field{activeCostCategories.length === 1 ? '' : 's'} based on your dashboard selection.</span>
              </p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-5 text-xs">
          
          {/* Phase Name & Tier Level */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">Phase / Stage Name *</label>
              <input
                type="text"
                required
                value={formData.phase}
                onChange={e => setFormData({ ...formData, phase: e.target.value })}
                placeholder="e.g. 1st Campaign - Standard animal imaging"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Campaign Tier *</label>
              <select
                value={formData.tier}
                onChange={e => setFormData({ ...formData, tier: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
              >
                {tiers.length === 0 ? (
                  <option value={1}>Tier 1 (New Tier)</option>
                ) : (
                  tiers.map(t => (
                    <option key={t.tierNumber} value={t.tierNumber}>
                      Tier {t.tierNumber}: {t.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Description / Objective</label>
            <input
              type="text"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. 6 animals, baseline PET brain uptake assay"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* SECTION 1: Radiopharmaceuticals */}
          {showRadio && (
            <div className="p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between border-b border-indigo-200/60 pb-2 mb-2">
                <span className="font-bold text-indigo-950 text-xs uppercase tracking-wide block">1. Radiopharmaceuticals</span>
                <span className="text-[11px] font-mono text-indigo-700 font-semibold bg-white px-2 py-0.5 rounded border border-indigo-200">
                  Total = ${calculated.radiopharmaceuticalsTotal.toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                {renderInputField('isotopeCostPerBatch', 'Isotope ($/b)', 'currency', formData.isotopeCostPerBatch, val => setFormData({ ...formData, isotopeCostPerBatch: val }))}
                {renderInputField('radiopharmConsumablesPerBatch', 'Consumables ($/b)', 'currency', formData.radiopharmConsumablesPerBatch, val => setFormData({ ...formData, radiopharmConsumablesPerBatch: val }))}
                {renderInputField('radiopharmReagentsPerBatch', 'Reagents ($/b)', 'currency', formData.radiopharmReagentsPerBatch, val => setFormData({ ...formData, radiopharmReagentsPerBatch: val }))}
                {renderInputField('numBatches', 'Batches (n_b)', 'number', formData.numBatches, val => setFormData({ ...formData, numBatches: val }), { min: 0, bold: true })}
                {renderInputField('radiopharmFacilityCostPerHour', 'Facility ($/h)', 'currency', formData.radiopharmFacilityCostPerHour, val => setFormData({ ...formData, radiopharmFacilityCostPerHour: val }))}
                {renderInputField('radiopharmTaskTimeHoursPerBatch', 'Task time (h/b)', 'hours', formData.radiopharmTaskTimeHoursPerBatch, val => setFormData({ ...formData, radiopharmTaskTimeHoursPerBatch: val }))}
              </div>
              <p className="text-[10px] text-slate-500 italic mt-1">
                Formula: n_b × [ (Isotope + Consumables + Reagents) + (Facility $/h × Task time h/b) ]
              </p>
            </div>
          )}

          {/* SECTION 2: Animal Models */}
          {showAnimals && (
            <div className="p-3.5 bg-purple-50/60 border border-purple-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between border-b border-purple-200/60 pb-2 mb-2">
                <span className="font-bold text-purple-950 text-xs uppercase tracking-wide block">2. Animal Models</span>
                <span className="text-[11px] font-mono text-purple-700 font-semibold bg-white px-2 py-0.5 rounded border border-purple-200">
                  Total = ${calculated.animalModelsTotal.toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {renderInputField('numAnimals', 'Animals (n_a)', 'number', formData.numAnimals, handleNumAnimalsChange, { min: 0, bold: true })}
                {renderInputField('animalCostEach', 'Animals ($/a)', 'currency', formData.animalCostEach, val => setFormData({ ...formData, animalCostEach: val }))}
                {renderInputField('housingCostEach', 'Housing ($/a)', 'currency', formData.housingCostEach, val => setFormData({ ...formData, housingCostEach: val }))}
              </div>
              <p className="text-[10px] text-slate-500 italic mt-1">
                Formula: n_a × (Animals $/a + Housing $/a)
              </p>
            </div>
          )}

          {/* SECTION 3: Preclinical Imaging */}
          {showPreclinicalImaging && (
            <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between border-b border-amber-200/60 pb-2 mb-2">
                <span className="font-bold text-amber-950 text-xs uppercase tracking-wide block">3. Preclinical Imaging</span>
                <span className="text-[11px] font-mono text-amber-700 font-semibold bg-white px-2 py-0.5 rounded border border-amber-200">
                  Total = ${calculated.preclinicalImagingTotal.toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2.5">
                {renderInputField('imagingConsumablesPerScan', 'Consumables ($/s)', 'currency', formData.imagingConsumablesPerScan, val => setFormData({ ...formData, imagingConsumablesPerScan: val }))}
                {renderInputField('imagingReagentsPerScan', 'Reagents ($/s)', 'currency', formData.imagingReagentsPerScan, val => setFormData({ ...formData, imagingReagentsPerScan: val }))}
                {renderInputField('numScans', 'Scans (n_s)', 'number', formData.numScans, handleNumScansChange, { min: 0, max: formData.numAnimals, bold: true })}
                {renderInputField('scanCostPerHour', 'Scan cost ($/h)', 'currency', formData.scanCostPerHour, val => setFormData({ ...formData, scanCostPerHour: val }))}
                {renderInputField('scanTimeHoursPerScan', 'Scan time (h/s)', 'hours', formData.scanTimeHoursPerScan, val => setFormData({ ...formData, scanTimeHoursPerScan: val }))}
                {renderInputField('imageAnalysisHoursPerScan', 'Image analysis (h/s)', 'hours', formData.imageAnalysisHoursPerScan, val => setFormData({ ...formData, imageAnalysisHoursPerScan: val }))}
                {renderInputField('imageAnalysisCostPerHour', 'Image analysis ($/h)', 'currency', formData.imageAnalysisCostPerHour, val => setFormData({ ...formData, imageAnalysisCostPerHour: val }))}
              </div>
              <p className="text-[10px] text-slate-500 italic mt-1">
                Formula: n_s × [ (Consumables + Reagents) + (Scan cost $/h × Scan time h/s) + (Image analysis $/h × Image analysis h/s) ] • Constraint: n_s ≤ n_a ({formData.numAnimals})
              </p>
            </div>
          )}

          {/* SECTION 4: Clinical Imaging */}
          {showClinicalImaging && (
            <div className="p-3.5 bg-sky-50/60 border border-sky-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between border-b border-sky-200/60 pb-2 mb-2">
                <span className="font-bold text-sky-950 text-xs uppercase tracking-wide block">4. Clinical Imaging</span>
                <span className="text-[11px] font-mono text-sky-700 font-semibold bg-white px-2 py-0.5 rounded border border-sky-200">
                  Total = ${calculated.clinicalImagingTotal.toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2.5">
                {renderInputField('clinicalImagingConsumablesPerScan', 'Consumables ($/cs)', 'currency', formData.clinicalImagingConsumablesPerScan, val => setFormData({ ...formData, clinicalImagingConsumablesPerScan: val }))}
                {renderInputField('clinicalImagingReagentsPerScan', 'Reagents ($/cs)', 'currency', formData.clinicalImagingReagentsPerScan, val => setFormData({ ...formData, clinicalImagingReagentsPerScan: val }))}
                {renderInputField('numClinicalScans', 'Scans (n_cs)', 'number', formData.numClinicalScans, val => setFormData({ ...formData, numClinicalScans: Math.max(0, val) }), { min: 0, bold: true })}
                {renderInputField('clinicalScanCostPerHour', 'Scan cost ($/h)', 'currency', formData.clinicalScanCostPerHour, val => setFormData({ ...formData, clinicalScanCostPerHour: val }))}
                {renderInputField('clinicalScanTimeHoursPerScan', 'Scan time (h/cs)', 'hours', formData.clinicalScanTimeHoursPerScan, val => setFormData({ ...formData, clinicalScanTimeHoursPerScan: val }))}
                {renderInputField('clinicalImageAnalysisHoursPerScan', 'Image analysis (h/cs)', 'hours', formData.clinicalImageAnalysisHoursPerScan, val => setFormData({ ...formData, clinicalImageAnalysisHoursPerScan: val }))}
                {renderInputField('clinicalImageAnalysisCostPerHour', 'Image analysis ($/h)', 'currency', formData.clinicalImageAnalysisCostPerHour, val => setFormData({ ...formData, clinicalImageAnalysisCostPerHour: val }))}
              </div>
              <p className="text-[10px] text-slate-500 italic mt-1">
                Formula: n_cs × [ (Consumables + Reagents) + (Scan cost $/h × Scan time h/cs) + (Image analysis $/h × Image analysis h/cs) ]
              </p>
            </div>
          )}

          {/* SECTION 5: Biodistribution */}
          {showBio && (
            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2 mb-2">
                <span className="font-bold text-emerald-950 text-xs uppercase tracking-wide block">5. Biodistribution</span>
                <span className="text-[11px] font-mono text-emerald-700 font-semibold bg-white px-2 py-0.5 rounded border border-emerald-200">
                  Total = ${calculated.biodistributionTotal.toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {renderInputField('bioConsumablesPerBio', 'Consumables ($/bio)', 'currency', formData.bioConsumablesPerBio, val => setFormData({ ...formData, bioConsumablesPerBio: val }))}
                {renderInputField('bioReagentsPerBio', 'Reagents ($/bio)', 'currency', formData.bioReagentsPerBio, val => setFormData({ ...formData, bioReagentsPerBio: val }))}
                {renderInputField('numBiodistributions', 'Biodist. (n_bio)', 'number', formData.numBiodistributions, handleNumBioChange, { min: 0, max: Math.max(0, formData.numAnimals - formData.numScans), bold: true })}
                {renderInputField('bioCostPerUnit', 'Bio Cost ($/n_bio)', 'currency', formData.bioCostPerUnit, val => setFormData({ ...formData, bioCostPerUnit: val }))}
              </div>
              <p className="text-[10px] text-slate-500 italic mt-1">
                Formula: n_bio × (Consumables + Reagents + Cost $/bio) • Constraint: n_bio ≤ (n_a - n_s) = ({Math.max(0, formData.numAnimals - formData.numScans)})
              </p>
            </div>
          )}

          {/* SECTION 6: In Vitro */}
          {showInVitro && (
            <div className="p-3.5 bg-teal-50/60 border border-teal-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between border-b border-teal-200/60 pb-2 mb-2">
                <span className="font-bold text-teal-950 text-xs uppercase tracking-wide block">6. In Vitro</span>
                <span className="text-[11px] font-mono text-teal-700 font-semibold bg-white px-2 py-0.5 rounded border border-teal-200">
                  Total = ${calculated.inVitroTotal.toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                {renderInputField('cellLineCost', 'Cell line ($)', 'currency', formData.cellLineCost, val => setFormData({ ...formData, cellLineCost: val }))}
                {renderInputField('inVitroConsumablesPerTest', 'Consumables ($/t)', 'currency', formData.inVitroConsumablesPerTest, val => setFormData({ ...formData, inVitroConsumablesPerTest: val }))}
                {renderInputField('inVitroReagentsPerTest', 'Reagents ($/t)', 'currency', formData.inVitroReagentsPerTest, val => setFormData({ ...formData, inVitroReagentsPerTest: val }))}
                {renderInputField('numInVitroTests', 'Tests (n_t)', 'number', formData.numInVitroTests, val => setFormData({ ...formData, numInVitroTests: Math.max(0, val) }), { min: 0, bold: true })}
                {renderInputField('inVitroTestingHoursPerTest', 'Testing (h/t)', 'hours', formData.inVitroTestingHoursPerTest, val => setFormData({ ...formData, inVitroTestingHoursPerTest: val }))}
                {renderInputField('inVitroTestingCostPerHour', 'Testing cost ($/h)', 'currency', formData.inVitroTestingCostPerHour, val => setFormData({ ...formData, inVitroTestingCostPerHour: val }))}
              </div>
              <p className="text-[10px] text-slate-500 italic mt-1">
                Formula: Cell line $ + n_t × [ (Consumables + Reagents) + (Testing cost $/h × Testing h/t) ]
              </p>
            </div>
          )}

          {/* SECTION 7: Others */}
          {showOthers && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="font-bold text-slate-800 text-xs uppercase tracking-wide block">7. Others</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {renderInputField('othersCost', 'Others Cost ($)', 'currency', formData.othersCost, val => setFormData({ ...formData, othersCost: val }))}
                <div className="sm:col-span-2">
                  <label className="text-slate-600 font-medium block mb-1 text-[11px]">Note (Others)</label>
                  <input
                    type="text"
                    value={formData.othersNotes || ''}
                    onChange={e => setFormData({ ...formData, othersNotes: e.target.value })}
                    placeholder="Note specifically for 'Others' (e.g. cold competitor, HPLC setup)"
                    className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* OVERALL PHASE NOTES */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wide block">Phase Notes</span>
            <div>
              <input
                type="text"
                value={formData.phaseNotes || formData.notes || ''}
                onChange={e => setFormData({ ...formData, phaseNotes: e.target.value, notes: e.target.value })}
                placeholder="Overall notes for this campaign phase (e.g. IACUC approval status)"
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-900"
              />
            </div>
          </div>

          {/* Animal Warning Status Box */}
          {showAnimals && (showPreclinicalImaging || showBio) && calculated.unaccountedAnimals && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>
                <strong>Strong Warning:</strong> {calculated.unaccountedCount} animals are not accounted for in Preclinical PET Scans ({formData.numScans}) or Biodistribution ({formData.numBiodistributions}). Total animals = {formData.numAnimals}.
              </span>
            </div>
          )}

          {showAnimals && (showPreclinicalImaging || showBio) && calculated.scansLessThanAnimals && !calculated.unaccountedAnimals && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-800 text-xs">
              <Info className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                <strong>Notice:</strong> Preclinical scanned animals ({formData.numScans}) is less than total animals ({formData.numAnimals}). Biodistribution covers remaining {formData.numBiodistributions} animals.
              </span>
            </div>
          )}

          {/* Total Row Cost Bar */}
          <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-slate-300 block">Master Computed Phase Total Cost</span>
                {activeCostCategories.length < ALL_COST_CATEGORY_IDS.length && (
                  <span className="text-[10px] text-amber-400 bg-amber-950/80 border border-amber-800 px-1.5 py-0.2 rounded font-semibold">
                    {activeCostCategories.length}/7 fields active
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                = {[
                  showRadio && `Radiopharm (${formatCurrency(calculated.radiopharmaceuticalsTotal)})`,
                  showAnimals && `Animal (${formatCurrency(calculated.animalModelsTotal)})`,
                  showPreclinicalImaging && `Preclin. Imaging (${formatCurrency(calculated.preclinicalImagingTotal)})`,
                  showClinicalImaging && `Clin. Imaging (${formatCurrency(calculated.clinicalImagingTotal)})`,
                  showBio && `Bio (${formatCurrency(calculated.biodistributionTotal)})`,
                  showInVitro && `In Vitro (${formatCurrency(calculated.inVitroTotal)})`,
                  showOthers && `Others (${formatCurrency(calculated.othersTotal)})`,
                ].filter(Boolean).join(' + ') || 'No active cost categories'}
              </span>
            </div>
            <div className="text-xl font-extrabold text-emerald-400">
              {formatCurrency(calculated.totalRowCost)}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs transition cursor-pointer"
            >
              Save Phase
            </button>
          </div>
        </form>

        {/* ITEMIZATION OVERLAY MODAL */}
        {activeItemizeTarget && (
          <ItemizationModal
            isOpen={!!activeItemizeTarget}
            onClose={() => setActiveItemizeTarget(null)}
            phaseName={formData.phase || 'New Phase'}
            fieldLabel={activeItemizeTarget.fieldLabel}
            unitType={activeItemizeTarget.unitType}
            initialItems={activeItemizeTarget.initialItems}
            currentValue={activeItemizeTarget.currentValue}
            onSave={handleSaveItemization}
          />
        )}

      </div>
    </div>
  );
};
