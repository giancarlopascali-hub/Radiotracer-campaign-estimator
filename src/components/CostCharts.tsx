import React, { useState } from 'react';
import { CalculatedRow, CostCategorySummary, TierSummary, CostCategoryId, ALL_COST_CATEGORY_IDS } from '../types';
import { formatCurrency } from '../utils/calculator';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { PieChart as PieIcon, BarChart3, TrendingUp } from 'lucide-react';

interface CostChartsProps {
  calculatedRows: CalculatedRow[];
  categoryBreakdown: CostCategorySummary;
  tierSummaries: TierSummary[];
  activeCostCategories?: CostCategoryId[];
}

const CATEGORY_COLORS: Record<CostCategoryId, string> = {
  radiopharmaceuticals: '#6366f1', // Indigo
  animalModels: '#a855f7',         // Purple
  preclinicalImaging: '#f59e0b',   // Amber
  clinicalImaging: '#0284c7',      // Sky
  biodistribution: '#10b981',      // Emerald
  inVitro: '#14b8a6',              // Teal
  others: '#64748b',               // Slate
};

export const CostCharts: React.FC<CostChartsProps> = ({
  calculatedRows,
  categoryBreakdown,
  tierSummaries,
  activeCostCategories = ALL_COST_CATEGORY_IDS
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'phases' | 'tiers'>('categories');

  const isCatActive = (id: CostCategoryId) => activeCostCategories.includes(id);

  // 1. Data for Category Pie Chart (Filtered to active categories with value > 0)
  const rawCategoryData = [
    { id: 'radiopharmaceuticals' as CostCategoryId, name: '1. Radiopharmaceuticals', value: categoryBreakdown.radiopharmaceuticals, color: CATEGORY_COLORS.radiopharmaceuticals },
    { id: 'animalModels' as CostCategoryId, name: '2. Animal models', value: categoryBreakdown.animalModels, color: CATEGORY_COLORS.animalModels },
    { id: 'preclinicalImaging' as CostCategoryId, name: '3. Preclinical Imaging', value: categoryBreakdown.preclinicalImaging, color: CATEGORY_COLORS.preclinicalImaging },
    { id: 'clinicalImaging' as CostCategoryId, name: '4. Clinical Imaging', value: categoryBreakdown.clinicalImaging, color: CATEGORY_COLORS.clinicalImaging },
    { id: 'biodistribution' as CostCategoryId, name: '5. Biodistribution', value: categoryBreakdown.biodistribution, color: CATEGORY_COLORS.biodistribution },
    { id: 'inVitro' as CostCategoryId, name: '6. In Vitro', value: categoryBreakdown.inVitro, color: CATEGORY_COLORS.inVitro },
    { id: 'others' as CostCategoryId, name: '7. Others', value: categoryBreakdown.others, color: CATEGORY_COLORS.others },
  ];

  const categoryData = rawCategoryData
    .filter(item => isCatActive(item.id))
    .filter(item => item.value > 0);

  // 2. Data for Phase Stacked Bar Chart (only active categories)
  const phaseBarData = calculatedRows.map((c) => {
    const rowData: any = {
      name: c.row.phase.length > 20 ? c.row.phase.slice(0, 18) + '...' : c.row.phase,
      fullName: c.row.phase,
      Total: c.totalRowCost
    };
    if (isCatActive('radiopharmaceuticals')) rowData['Radiopharmaceuticals'] = c.radiopharmaceuticalsTotal;
    if (isCatActive('animalModels')) rowData['Animal models'] = c.animalModelsTotal;
    if (isCatActive('preclinicalImaging')) rowData['Preclinical Imaging'] = c.preclinicalImagingTotal;
    if (isCatActive('clinicalImaging')) rowData['Clinical Imaging'] = c.clinicalImagingTotal;
    if (isCatActive('biodistribution')) rowData['Biodistribution'] = c.biodistributionTotal;
    if (isCatActive('inVitro')) rowData['In Vitro'] = c.inVitroTotal;
    if (isCatActive('others')) rowData['Others'] = c.othersTotal;
    return rowData;
  });

  // 3. Data for Cumulative Tier Comparison
  const tierData = tierSummaries.map((t) => ({
    name: `Tier ${t.tierNumber}: ${t.name}`,
    'Tier Added Cost': t.addedCost,
    'Cumulated Budget': t.cumulativeTotal,
    Animals: t.totalAnimals,
    Batches: t.totalBatches,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-xl text-xs text-slate-900 z-50">
          <p className="font-bold text-slate-800 mb-1">{label || payload[0].name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5" style={{ color: entry.color || entry.fill }}>
              <span>{entry.name}:</span>
              <span className="font-bold">{formatCurrency(entry.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 mb-8 shadow-xs">
      
      {/* Chart Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <span>Cost Distribution & Visual Analytics</span>
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {activeCostCategories.length} Active Field{activeCostCategories.length === 1 ? '' : 's'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Visual distribution dynamically filtered to currently selected cost fields
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'categories'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Category Breakdown</span>
          </button>
          <button
            onClick={() => setActiveTab('phases')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'phases'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Phase Breakdown</span>
          </button>
          <button
            onClick={() => setActiveTab('tiers')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'tiers'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Tier Accumulation</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Category Breakdown */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {categoryData.length > 0 ? (
            <>
              {/* Pie Chart */}
              <div className="lg:col-span-6 h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={110}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category Metrics Legend Grid */}
              <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {rawCategoryData.filter(item => isCatActive(item.id)).map((cat, idx) => {
                  const pct = categoryBreakdown.grandTotal > 0 
                    ? Math.round((cat.value / categoryBreakdown.grandTotal) * 100) 
                    : 0;
                  return (
                    <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="text-xs text-slate-700 font-bold truncate">{cat.name}</span>
                      </div>
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="text-base font-extrabold text-slate-900">{formatCurrency(cat.value)}</span>
                        <span className="text-xs text-slate-500 font-semibold bg-white px-1.5 py-0.5 rounded border border-slate-200">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="lg:col-span-12 py-12 text-center text-slate-400">
              <p className="text-sm font-medium">No cost data for the currently active categories.</p>
              <p className="text-xs text-slate-500 mt-1">Select cost fields above or enter batch/test parameters.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Phase Breakdown */}
      {activeTab === 'phases' && (
        <div className="h-[380px] w-full flex items-center justify-center">
          {phaseBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={phaseBarData} margin={{ top: 10, right: 30, left: 20, bottom: 75 }}>
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={11} 
                  angle={-25} 
                  textAnchor="end" 
                  interval={0} 
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickFormatter={(val) => `$${val / 1000}k`} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" wrapperStyle={{ fontSize: '11px', paddingBottom: '16px' }} />
                {isCatActive('radiopharmaceuticals') && <Bar dataKey="Radiopharmaceuticals" stackId="a" fill={CATEGORY_COLORS.radiopharmaceuticals} />}
                {isCatActive('animalModels') && <Bar dataKey="Animal models" stackId="a" fill={CATEGORY_COLORS.animalModels} />}
                {isCatActive('preclinicalImaging') && <Bar dataKey="Preclinical Imaging" stackId="a" fill={CATEGORY_COLORS.preclinicalImaging} />}
                {isCatActive('clinicalImaging') && <Bar dataKey="Clinical Imaging" stackId="a" fill={CATEGORY_COLORS.clinicalImaging} />}
                {isCatActive('biodistribution') && <Bar dataKey="Biodistribution" stackId="a" fill={CATEGORY_COLORS.biodistribution} />}
                {isCatActive('inVitro') && <Bar dataKey="In Vitro" stackId="a" fill={CATEGORY_COLORS.inVitro} />}
                {isCatActive('others') && <Bar dataKey="Others" stackId="a" fill={CATEGORY_COLORS.others} />}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-medium">No phases available for phase breakdown.</p>
              <p className="text-xs text-slate-500 mt-1">Add phases to the campaign matrix to view cost distribution charts.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Tier Accumulation */}
      {activeTab === 'tiers' && (
        <div className="h-[350px] w-full flex items-center justify-center">
          {tierData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tierData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `$${val / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Tier Added Cost" fill="#6366f1" radius={[4, 4, 0, 0]} name="Added Cost for Tier ($)" />
                <Bar dataKey="Cumulated Budget" fill="#10b981" radius={[4, 4, 0, 0]} name="Cumulated Total Budget ($)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-medium">No tiers available for tier accumulation.</p>
              <p className="text-xs text-slate-500 mt-1">Add campaign tiers to display cumulative budget accumulation.</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

