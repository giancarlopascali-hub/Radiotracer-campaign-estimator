import React from 'react';
import { 
  CostCategoryId, 
  ALL_COST_CATEGORY_IDS, 
  COST_CATEGORY_DEFINITIONS 
} from '../types';
import { CheckSquare, Square, Sliders, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';

interface CostFieldsSelectorProps {
  activeCategories: CostCategoryId[];
  onToggleCategory: (categoryId: CostCategoryId) => void;
  onSelectAll: () => void;
  onSelectPreset?: (presetCategoryIds: CostCategoryId[]) => void;
}

export const CostFieldsSelector: React.FC<CostFieldsSelectorProps> = ({
  activeCategories,
  onToggleCategory,
  onSelectAll,
}) => {
  const allSelected = activeCategories.length === ALL_COST_CATEGORY_IDS.length;
  const countSelected = activeCategories.length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs mb-4">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Active Matrix Cost Fields</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                allSelected 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}>
                {countSelected} of {ALL_COST_CATEGORY_IDS.length} Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Check or uncheck fields to customize the matrix table columns. Deselected fields are preserved and can be re-enabled dynamically.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={onSelectAll}
            disabled={allSelected}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border transition flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Select All ({ALL_COST_CATEGORY_IDS.length})</span>
          </button>
        </div>
      </div>

      {/* 7 Category Tick Boxes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5">
        {ALL_COST_CATEGORY_IDS.map((catId) => {
          const def = COST_CATEGORY_DEFINITIONS[catId];
          const isChecked = activeCategories.includes(catId);

          return (
            <label
              key={catId}
              onClick={(e) => {
                // Label wraps input, prevent double triggers
                e.preventDefault();
                onToggleCategory(catId);
              }}
              className={`flex flex-col justify-between p-2.5 rounded-lg border text-left cursor-pointer transition select-none ${
                isChecked
                  ? `${def.activeBg} ${def.borderColor} ring-1 ${def.borderColor} shadow-2xs`
                  : 'bg-slate-50/70 border-slate-200 opacity-60 hover:opacity-100 hover:bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="shrink-0 mt-0.5">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <span className={`text-xs font-bold ${isChecked ? 'text-slate-900' : 'text-slate-600'}`}>
                    {def.label}
                  </span>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                  isChecked ? `${def.badgeBg} ${def.badgeText}` : 'bg-slate-200 text-slate-500'
                }`}>
                  {def.colSpan} cols
                </span>
              </div>

              <p className="text-[10px] text-slate-500 mt-1.5 line-clamp-2 leading-tight pl-6">
                {def.description}
              </p>
            </label>
          );
        })}
      </div>
    </div>
  );
};
