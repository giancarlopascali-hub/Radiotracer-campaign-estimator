import React from 'react';
import { Plus, AlertTriangle, Edit2, ArrowLeft, ArrowRight as ArrowRightIcon, Trash2, CheckSquare, Filter } from 'lucide-react';
import { TierConfig, TierSummary, CostCategoryId, ALL_COST_CATEGORY_IDS } from '../types';
import { formatCurrency } from '../utils/calculator';

interface TierComparisonProps {
  tierSummaries: TierSummary[];
  tiers: TierConfig[];
  selectedTiers: number[];
  activeCostCategories?: CostCategoryId[];
  onToggleTier: (tierNumber: number) => void;
  onClearTierFilter: () => void;
  onAddTier: () => void;
  onEditTier: (tier: TierConfig) => void;
  onMoveTier: (tierNumber: number, direction: 'up' | 'down') => void;
  onDeleteTier?: (tierNumber: number) => void;
}

export const TierComparison: React.FC<TierComparisonProps> = ({
  tierSummaries,
  tiers,
  selectedTiers,
  activeCostCategories = ALL_COST_CATEGORY_IDS,
  onToggleTier,
  onClearTierFilter,
  onAddTier,
  onEditTier,
  onMoveTier,
  onDeleteTier,
}) => {
  const isFiltering = selectedTiers.length > 0;
  const isCategoryFiltered = activeCostCategories.length < ALL_COST_CATEGORY_IDS.length;

  const showRadio = activeCostCategories.includes('radiopharmaceuticals');
  const showAnimals = activeCostCategories.includes('animalModels');
  const showPreclinicalImaging = activeCostCategories.includes('preclinicalImaging') || activeCostCategories.includes('imaging' as any);
  const showClinicalImaging = activeCostCategories.includes('clinicalImaging');
  const showBio = activeCostCategories.includes('biodistribution');
  const showInVitro = activeCostCategories.includes('inVitro');
  const showOthers = activeCostCategories.includes('others');

  const hasAnyOperationalMetrics = showRadio || showAnimals || showPreclinicalImaging || showClinicalImaging || showBio || (showInVitro && tierSummaries.some(t => t.totalInVitroTests > 0));

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Campaign Package Tiers</span>
              <span className="text-xs font-normal text-slate-500">
                (Cumulative budget structure)
              </span>
            </h2>
            {isCategoryFiltered && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                <Filter className="w-3 h-3 text-amber-600" />
                <span>Filtered ({activeCostCategories.length}/{ALL_COST_CATEGORY_IDS.length} Cost Fields)</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Click package cards to toggle filter selection (multi-select supported).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isFiltering && (
            <button
              onClick={onClearTierFilter}
              className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2.5 py-1.5 rounded-lg font-semibold transition"
            >
              Reset Filter (Showing {selectedTiers.length} of {tierSummaries.length})
            </button>
          )}

          <button
            onClick={onAddTier}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Tier</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tierSummaries.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-white border border-dashed border-slate-300 rounded-xl text-slate-500 shadow-xs">
            <p className="text-sm font-semibold text-slate-700">No package tiers configured.</p>
            <p className="text-xs text-slate-400 mt-1 mb-3">Click below or use the matrix table to add your first campaign tier.</p>
            <button
              onClick={onAddTier}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Tier</span>
            </button>
          </div>
        ) : (
          tierSummaries.map((tier, index) => {
            const isSelected = selectedTiers.includes(tier.tierNumber);
          const isFirstInList = index === 0;
          const isLastInList = index === tierSummaries.length - 1;
          const tierConfig = tiers.find(t => t.tierNumber === tier.tierNumber) || {
            tierNumber: tier.tierNumber,
            name: tier.name,
            subtitle: tier.subtitle
          };

          let accentBorder = "border-slate-200 hover:border-blue-400";
          let badgeBg = "bg-blue-50 text-blue-800 border-blue-200";
          let totalColor = "text-blue-700";

          if (tier.tierNumber === 2) {
            accentBorder = "border-slate-200 hover:border-purple-400";
            badgeBg = "bg-purple-50 text-purple-800 border-purple-200";
            totalColor = "text-purple-700";
          } else if (tier.tierNumber >= 3) {
            accentBorder = "border-slate-200 hover:border-amber-400";
            badgeBg = "bg-amber-50 text-amber-800 border-amber-200";
            totalColor = "text-amber-700";
          }

          return (
            <div
              key={tier.tierNumber}
              onClick={() => onToggleTier(tier.tierNumber)}
              className={`bg-white rounded-xl p-5 border transition cursor-pointer relative flex flex-col justify-between shadow-xs ${accentBorder} ${
                isSelected ? 'ring-2 ring-indigo-600 border-indigo-600 bg-indigo-50/30' : isFiltering ? 'opacity-70 hover:opacity-100' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${badgeBg}`}>
                    Tier {tier.tierNumber}: {tier.name}
                  </span>

                  {/* Tier Action Controls: Reorder, Edit & Delete */}
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => onMoveTier(tier.tierNumber, 'up')}
                      disabled={isFirstInList}
                      title="Move Tier Left/Up"
                      className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400 rounded hover:bg-slate-100 transition"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onMoveTier(tier.tierNumber, 'down')}
                      disabled={isLastInList}
                      title="Move Tier Right/Down"
                      className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400 rounded hover:bg-slate-100 transition"
                    >
                      <ArrowRightIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onEditTier(tierConfig)}
                      title="Edit Tier Name & Details"
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {onDeleteTier && tiers.length > 1 && (
                      <button
                        onClick={() => onDeleteTier(tier.tierNumber)}
                        title="Delete Tier"
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 mb-4 font-medium">
                  {tier.subtitle}
                </p>

                {/* Cumulated Price */}
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Cumulated Package Budget</span>
                    {isCategoryFiltered && (
                      <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        active scope
                      </span>
                    )}
                  </div>
                  <div className={`text-2xl font-extrabold ${totalColor} tracking-tight mt-0.5`}>
                    {formatCurrency(tier.cumulativeTotal)}
                  </div>
                  {index > 0 && (
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <span>Added cost for this tier:</span>
                      <span className="font-semibold text-slate-800">+{formatCurrency(tier.addedCost)}</span>
                    </div>
                  )}
                </div>

                {/* Operational Totals (Filtered to active cost categories) */}
                <div className="space-y-1.5 text-xs text-slate-700 border-t border-slate-100 pt-3">
                  {showRadio && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">RT Batches (n_b):</span>
                        <span className="font-semibold text-slate-900">{tier.totalBatches} batches</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">RT Facility Time:</span>
                        <span className="font-semibold text-slate-900">{tier.totalFacilityHours} hours</span>
                      </div>
                    </>
                  )}

                  {showAnimals && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Animals (n_a):</span>
                      <span className="font-semibold text-slate-900">{tier.totalAnimals} animals</span>
                    </div>
                  )}

                  {showPreclinicalImaging && showBio && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Preclin. Scans (n_s) / Bio:</span>
                      <span className="font-semibold text-slate-900">
                        {tier.totalScans} scans ({tier.totalScanningHours || 0}h) / {tier.totalBiodistributions} bio
                      </span>
                    </div>
                  )}
                  {showPreclinicalImaging && !showBio && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Preclin. Scans (n_s):</span>
                      <span className="font-semibold text-slate-900">
                        {tier.totalScans} scans ({tier.totalScanningHours || 0}h)
                      </span>
                    </div>
                  )}
                  {showClinicalImaging && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Clinical Scans (n_cs):</span>
                      <span className="font-semibold text-slate-900">
                        {tier.totalClinicalScans || 0} scans ({tier.totalClinicalScanningHours || 0}h)
                      </span>
                    </div>
                  )}
                  {!showPreclinicalImaging && showBio && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Biodistribution (n_bio):</span>
                      <span className="font-semibold text-slate-900">{tier.totalBiodistributions} bio</span>
                    </div>
                  )}

                  {showInVitro && tier.totalInVitroTests > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">In Vitro Tests (n_t):</span>
                      <span className="font-semibold text-slate-900">{tier.totalInVitroTests} tests</span>
                    </div>
                  )}

                  {!hasAnyOperationalMetrics && showOthers && (
                    <div className="flex justify-between text-slate-500 italic">
                      <span>Category Scope:</span>
                      <span className="font-semibold text-slate-700 not-italic">Direct / Other Costs</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Warning Notice if Animal Imbalance (only if Animal Models and Preclinical Imaging/Bio are active) */}
              {showAnimals && (showPreclinicalImaging || showBio) && tier.warningCount > 0 && (
                <div className="mt-3 p-1.5 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{tier.warningCount} phase(s) require animal mapping check</span>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-medium text-slate-500 flex items-center justify-between">
                <span>Includes {tier.phaseCount} campaign phases</span>
                <span className={`text-[11px] font-bold flex items-center gap-1 ${isSelected ? 'text-indigo-700' : 'text-slate-400'}`}>
                  {isSelected && <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />}
                  {isSelected ? 'Selected' : 'Click to select'}
                </span>
              </div>
            </div>
          );
        }))}
      </div>
    </div>
  );
};

