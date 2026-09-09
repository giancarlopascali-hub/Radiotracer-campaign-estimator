import React from 'react';
import { Layers, Clock, ShieldCheck, DollarSign, AlertTriangle } from 'lucide-react';
import { TierSummary, CostCategorySummary } from '../types';
import { formatCurrency } from '../utils/calculator';

interface SummaryCardsProps {
  tierSummaries: TierSummary[];
  categoryBreakdown: CostCategorySummary;
  activeTierFilter: number | null;
  setActiveTierFilter: (tier: number | null) => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  tierSummaries,
  categoryBreakdown,
  activeTierFilter,
  setActiveTierFilter,
}) => {
  const topTier = tierSummaries[tierSummaries.length - 1] || {
    cumulativeTotal: 0,
    totalBatches: 0,
    totalFacilityHours: 0,
    totalAnimals: 0,
    totalScans: 0,
    totalBiodistributions: 0,
    totalScanningHours: 0
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* Card 1: Total Campaign Budget */}
      <div 
        onClick={() => setActiveTierFilter(null)}
        className={`bg-white border rounded-xl p-4 transition cursor-pointer relative overflow-hidden shadow-xs ${
          activeTierFilter === null 
            ? 'border-indigo-600 ring-2 ring-indigo-500/20' 
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Grand Total Campaign Budget</span>
          <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <DollarSign className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 flex items-baseline">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {formatCurrency(topTier.cumulativeTotal)}
          </span>
          <span className="ml-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            {tierSummaries.length} Tiers
          </span>
        </div>
        <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2 font-mono">
          <span>{topTier.totalBatches} RT Batches</span>
          <span>•</span>
          <span>{topTier.totalAnimals} Animals</span>
          <span>•</span>
          <span>{topTier.totalScans} Scans ({topTier.totalScanningHours}h)</span>
          <span>•</span>
          <span>{topTier.totalBiodistributions} Bio</span>
        </div>
      </div>

      {/* Dynamic Tier Cards (e.g. Tier 1 & Tier 2 preview) */}
      {tierSummaries.slice(0, 2).map((tier) => {
        const isSelected = activeTierFilter === tier.tierNumber;

        return (
          <div 
            key={tier.tierNumber}
            onClick={() => setActiveTierFilter(isSelected ? null : tier.tierNumber)}
            className={`bg-white border rounded-xl p-4 transition cursor-pointer relative shadow-xs ${
              isSelected 
                ? 'border-indigo-600 ring-2 ring-indigo-500/20' 
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
                Tier {tier.tierNumber}: {tier.name}
              </span>
              <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {formatCurrency(tier.cumulativeTotal)}
              </span>
              {tier.warningCount > 0 && (
                <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  <span>{tier.warningCount} Alerts</span>
                </span>
              )}
            </div>
            <p className="mt-3 text-xs text-slate-500 border-t border-slate-100 pt-2 truncate">
              {tier.subtitle}
            </p>
          </div>
        );
      })}

      {/* Card 4: Operational Facility Hours */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">RT Facility Time & Scanner Hours</span>
          <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
            <Clock className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div>
            <div className="text-xs text-slate-500 font-medium">RT Facility Time</div>
            <div className="text-lg font-bold text-slate-900">{topTier.totalFacilityHours} h</div>
            <div className="text-[10px] text-slate-400">Radiochemistry lab</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Scan Time</div>
            <div className="text-lg font-bold text-slate-900">{topTier.totalScanningHours} h</div>
            <div className="text-[10px] text-slate-400">PET instrument ({topTier.totalScans} scans)</div>
          </div>
        </div>
      </div>

    </div>
  );
};
