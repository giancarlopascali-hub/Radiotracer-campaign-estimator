import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, FileCode, FileText, ListFilter, Sliders } from 'lucide-react';
import { CalculatedRow, TierConfig, TierSummary, CostCategoryId, ALL_COST_CATEGORY_IDS, COST_CATEGORY_DEFINITIONS } from '../types';
import { formatCurrency } from '../utils/calculator';
import { exportToExcel, exportToCsv, exportToHtml, exportToWord, ExportOptions } from '../utils/exportGenerators';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracerName: string;
  calculatedRows: CalculatedRow[];
  tiers: TierConfig[];
  tierSummaries: TierSummary[];
  activeCostCategories?: CostCategoryId[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  tracerName,
  calculatedRows,
  tiers,
  tierSummaries,
  activeCostCategories = ALL_COST_CATEGORY_IDS,
}) => {
  const [format, setFormat] = useState<'excel' | 'html' | 'word'>('excel');
  const [selectedTiers, setSelectedTiers] = useState<number[]>(() => tiers.map(t => t.tierNumber));
  const [includeSummarizedMatrix, setIncludeSummarizedMatrix] = useState<boolean>(true);
  const [includeCategoryTables, setIncludeCategoryTables] = useState<boolean>(true);
  const [includeSingleWideTable, setIncludeSingleWideTable] = useState<boolean>(false);
  const [includeItemized, setIncludeItemized] = useState<boolean>(true);
  const [includeCharts, setIncludeCharts] = useState<boolean>(true);

  const [isExporting, setIsExporting] = useState<boolean>(false);

  if (!isOpen) return null;

  const isAllSelected = selectedTiers.length === tiers.length && tiers.length > 0;
  const isNoneSelected = selectedTiers.length === 0;

  const handleToggleTier = (tierNum: number) => {
    setSelectedTiers(prev =>
      prev.includes(tierNum)
        ? prev.filter(t => t !== tierNum)
        : [...prev, tierNum]
    );
  };

  const handleSelectAllTiers = () => {
    if (isAllSelected) {
      setSelectedTiers([]);
    } else {
      setSelectedTiers(tiers.map(t => t.tierNumber));
    }
  };

  const handleExport = async () => {
    if (selectedTiers.length === 0) return;

    setIsExporting(true);
    try {
      const options: ExportOptions = {
        format,
        tracerName,
        calculatedRows,
        tiers,
        tierSummaries,
        selectedTiers,
        activeCostCategories,
        includeSummarizedMatrix,
        includeCategoryTables,
        includeSingleWideTable,
        includeItemized,
        includeCharts
      };

      if (format === 'excel') {
        await exportToExcel(options);
      } else if (format === 'html') {
        exportToHtml(options);
      } else if (format === 'word') {
        exportToWord(options);
      }
      onClose();
    } catch (err) {
      console.error('Export failed:', err);
      alert('An error occurred during export. Please check browser console.');
    } finally {
      setIsExporting(false);
    }
  };

  const isFiltered = activeCostCategories.length < ALL_COST_CATEGORY_IDS.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-800">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Download className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">Export Campaign Report</h3>
              <p className="text-xs text-slate-500">Configure file format, scope, and filtered fields</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 text-xs flex-1">
          
          {/* Active Filter Notice */}
          {isFiltered && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
              <Sliders className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-amber-900 block text-xs">Cost Category Filter Active</span>
                <span className="text-[11px] text-amber-800 block mt-0.5">
                  Export will strictly include the {activeCostCategories.length} currently active categories ({activeCostCategories.map(c => COST_CATEGORY_DEFINITIONS[c].shortLabel).join(', ')}). Excluded categories are omitted from columns and formulas.
                </span>
              </div>
            </div>
          )}

          {/* Step 1: Select Format */}
          <div>
            <label className="block font-bold text-slate-800 mb-2">1. Select File Export Format</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormat('excel')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  format === 'excel'
                    ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <FileSpreadsheet className={`w-5 h-5 ${format === 'excel' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div className="mt-2 font-bold text-xs">Excel (.xlsx)</div>
                <div className="text-[10px] text-slate-500">Live dynamic formulas</div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('word')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  format === 'word'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-950 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <FileText className={`w-5 h-5 ${format === 'word' ? 'text-blue-600' : 'text-slate-400'}`} />
                <div className="mt-2 font-bold text-xs">Word Document</div>
                <div className="text-[10px] text-slate-500">Editable .doc report</div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('html')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  format === 'html'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <FileCode className={`w-5 h-5 ${format === 'html' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <div className="mt-2 font-bold text-xs">HTML Report</div>
                <div className="text-[10px] text-slate-500">Standalone webpage</div>
              </button>
            </div>
          </div>

          {/* Step 2: Select Tier Scope */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-slate-800">2. Select Campaign Tiers to Export</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTiers(tiers.map(t => t.tierNumber))}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedTiers([])}
                  className="text-[11px] text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <label className="flex items-center space-x-2.5 p-1.5 rounded hover:bg-white cursor-pointer border-b border-slate-200 pb-2 mb-1">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAllTiers}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-bold text-slate-900">All Tiers ({tiers.length} Total)</span>
              </label>

              {tiers.map(t => {
                const summary = tierSummaries.find(ts => ts.tierNumber === t.tierNumber);
                const isChecked = selectedTiers.includes(t.tierNumber);
                return (
                  <label key={t.tierNumber} className="flex items-center justify-between p-1.5 rounded hover:bg-white cursor-pointer">
                    <div className="flex items-center space-x-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleTier(t.tierNumber)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className={`font-semibold ${isChecked ? 'text-slate-900' : 'text-slate-500'}`}>
                        Tier {t.tierNumber}: {t.name}
                      </span>
                    </div>
                    <span className="font-mono text-slate-600 text-[11px]">
                      {summary ? formatCurrency(summary.cumulativeTotal) : ''}
                    </span>
                  </label>
                );
              })}
            </div>
            {isNoneSelected && (
              <p className="text-[11px] text-rose-600 font-semibold mt-1">
                * Please select at least one tier to export.
              </p>
            )}
          </div>

          {/* Step 3: Options for Report Sections & Itemization */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">3. Options & Included Sections</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
              {format !== 'excel' && (
                <>
                  <label className="flex items-start space-x-2.5 cursor-pointer bg-slate-50 p-2.5 rounded-lg border border-slate-200 hover:bg-white hover:border-slate-300 transition">
                    <input
                      type="checkbox"
                      checked={includeSummarizedMatrix}
                      onChange={e => setIncludeSummarizedMatrix(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">Summarized Matrix Table</span>
                      <span className="text-[10px] text-slate-500 block leading-tight">Batch/animal/scan counts & category subtotals</span>
                    </div>
                  </label>

                  <label className="flex items-start space-x-2.5 cursor-pointer bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-200 hover:bg-white hover:border-indigo-300 transition">
                    <input
                      type="checkbox"
                      checked={includeCategoryTables}
                      onChange={e => setIncludeCategoryTables(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 mt-0.5"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-indigo-900 block text-xs">Category Split Tables</span>
                        <span className="text-[9px] bg-indigo-100 text-indigo-700 font-semibold px-1 rounded">Fits Margins</span>
                      </div>
                      <span className="text-[10px] text-indigo-700/80 block leading-tight">Domain sub-tables formatted to landscape page width</span>
                    </div>
                  </label>
                </>
              )}

              <label className="flex items-start space-x-2.5 cursor-pointer bg-slate-50 p-2.5 rounded-lg border border-slate-200 hover:bg-white hover:border-slate-300 transition">
                <input
                  type="checkbox"
                  checked={includeItemized}
                  onChange={e => setIncludeItemized(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 mt-0.5"
                />
                <div>
                  <span className="font-bold text-indigo-900 flex items-center gap-1 text-xs">
                    <ListFilter className="w-3 h-3 text-indigo-600" />
                    Itemized Line Item Breakdown
                  </span>
                  <span className="text-[10px] text-slate-500 block leading-tight">
                    {format === 'excel' ? 'Added as secondary worksheet tab' : 'Granular constituent sub-components list'}
                  </span>
                </div>
              </label>

              {format !== 'excel' && (
                <label className="flex items-start space-x-2.5 cursor-pointer bg-slate-50 p-2.5 rounded-lg border border-slate-200 hover:bg-white hover:border-slate-300 transition">
                  <input
                    type="checkbox"
                    checked={includeCharts}
                    onChange={e => setIncludeCharts(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block text-xs">Tier Packages Summary</span>
                    <span className="text-[10px] text-slate-500 block leading-tight">Cumulative milestone cards & scope lists</span>
                  </div>
                </label>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium rounded-lg transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isExporting || isNoneSelected}
            onClick={handleExport}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg shadow-sm transition flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating {format.toUpperCase()}...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export {format.toUpperCase()} Report</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
