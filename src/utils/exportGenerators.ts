import ExcelJS from 'exceljs';
import { CalculatedRow, TierConfig, TierSummary, CostCategoryId, ALL_COST_CATEGORY_IDS, COST_CATEGORY_DEFINITIONS } from '../types';
import { formatCurrency, calculateCategoryBreakdown } from './calculator';
import { extractAllItemizations } from './itemization';

// Mapping between category name in FIELD_METADATA and CostCategoryId
const CATEGORY_NAME_TO_ID: Record<string, CostCategoryId> = {
  'Radiopharmaceuticals': 'radiopharmaceuticals',
  'Animal Models': 'animalModels',
  'Preclinical Imaging': 'preclinicalImaging',
  'Clinical Imaging': 'clinicalImaging',
  'Imaging': 'preclinicalImaging',
  'Biodistribution': 'biodistribution',
  'In Vitro': 'inVitro',
  'Others': 'others'
};

// Helper to convert 1-based index to Excel column letter (e.g. 1 -> A, 27 -> AA)
export function getColumnLetter(colIndex: number): string {
  let temp: number;
  let letter = '';
  while (colIndex > 0) {
    temp = (colIndex - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    colIndex = (colIndex - temp - 1) / 26;
  }
  return letter;
}

export interface ExcelColumnDefinition {
  header: string;
  subHeader?: string;
  category: string;
  isCurrency?: boolean;
  isCount?: boolean;
  isDecimal?: boolean;
  minWidth?: number;
  maxWidth?: number;
  getValue: (c: CalculatedRow) => number | string;
  getFormula?: (c: CalculatedRow, rowIdx: number, colMap: Record<string, string>) => string;
  getTotalFormula?: (colLetter: string, startRow: number, endRow: number) => string;
  totalType?: 'sum' | 'count' | 'none';
  headerColor?: string;
}

export interface ExportOptions {
  format: 'excel' | 'html' | 'word';
  tracerName: string;
  calculatedRows: CalculatedRow[];
  tiers: TierConfig[];
  tierSummaries: TierSummary[];
  selectedTiers: number[];
  activeCostCategories: CostCategoryId[];
  includeSummarizedMatrix: boolean;
  includeCategoryTables: boolean;
  includeSingleWideTable: boolean;
  includeItemized: boolean;
  includeCharts: boolean;
}

// ---------------------------------------------------------------------------
// 1. NATIVE EXCEL (.XLSX) EXPORT WITH DYNAMIC COLUMNS & FORMULAS
// ---------------------------------------------------------------------------
export async function exportToExcel(options: ExportOptions): Promise<void> {
  const {
    tracerName,
    calculatedRows,
    tiers,
    selectedTiers,
    activeCostCategories,
    includeItemized
  } = options;

  const isCatActive = (id: CostCategoryId) => activeCostCategories.includes(id) || (id === 'preclinicalImaging' && activeCostCategories.includes('imaging' as any));

  const filteredRows = calculatedRows.filter(c => selectedTiers.includes(c.row.tier));
  const sanitizeName = (tracerName.trim() || 'Radiotracer').replace(/[^a-zA-Z0-9_-]/g, '_');
  const isAllTiers = selectedTiers.length === tiers.length;
  const tierLabel = isAllTiers
    ? `All_Tiers_1-${tiers.length}`
    : `Tiers_${selectedTiers.sort((a, b) => a - b).join('_')}`;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Radiotracer Campaign Budget Estimator';
  workbook.lastModifiedBy = 'Radiotracer Campaign Estimator';
  workbook.created = new Date();
  workbook.modified = new Date();

  const sheet = workbook.addWorksheet('Campaign Budget Model', {
    views: [{ showGridLines: true }]
  });

  const columns: ExcelColumnDefinition[] = [];

  // Core identifiers
  columns.push({
    header: 'Tier',
    category: 'info',
    minWidth: 8,
    maxWidth: 10,
    totalType: 'none',
    getValue: c => `Tier ${c.row.tier}`
  });
  columns.push({
    header: 'Phase Name',
    category: 'info',
    minWidth: 18,
    maxWidth: 28,
    totalType: 'none',
    getValue: c => c.row.phase
  });
  columns.push({
    header: 'Description',
    category: 'info',
    minWidth: 18,
    maxWidth: 32,
    totalType: 'none',
    getValue: c => c.row.description || ''
  });

  // Category 1: Radiopharmaceuticals
  if (isCatActive('radiopharmaceuticals')) {
    columns.push(
      { header: 'Isotope ($/b)', category: 'radio', isCurrency: true, minWidth: 11, maxWidth: 14, totalType: 'none', getValue: c => c.row.isotopeCostPerBatch },
      { header: 'Radio Consumables ($/b)', category: 'radio', isCurrency: true, minWidth: 13, maxWidth: 16, totalType: 'none', getValue: c => c.row.radiopharmConsumablesPerBatch },
      { header: 'Radio Reagents ($/b)', category: 'radio', isCurrency: true, minWidth: 12, maxWidth: 15, totalType: 'none', getValue: c => c.row.radiopharmReagentsPerBatch },
      { header: 'Batches (n_b)', category: 'radio', isCount: true, minWidth: 10, maxWidth: 12, totalType: 'sum', getValue: c => c.row.numBatches },
      { header: 'RT Facility ($/h)', category: 'radio', isCurrency: true, minWidth: 12, maxWidth: 14, totalType: 'none', getValue: c => c.row.radiopharmFacilityCostPerHour },
      { header: 'Task Time (h/b)', category: 'radio', isDecimal: true, minWidth: 11, maxWidth: 13, totalType: 'none', getValue: c => c.row.radiopharmTaskTimeHoursPerBatch },
      {
        header: 'Radio Subtotal ($)',
        category: 'radio',
        isCurrency: true,
        minWidth: 14,
        maxWidth: 18,
        totalType: 'sum',
        headerColor: 'FF3730A3',
        getValue: c => c.radiopharmaceuticalsTotal,
        getFormula: (c, rowIdx, colMap) => {
          const b = colMap['Batches (n_b)'] + rowIdx;
          const iso = colMap['Isotope ($/b)'] + rowIdx;
          const con = colMap['Radio Consumables ($/b)'] + rowIdx;
          const rea = colMap['Radio Reagents ($/b)'] + rowIdx;
          const fac = colMap['RT Facility ($/h)'] + rowIdx;
          const tt = colMap['Task Time (h/b)'] + rowIdx;
          return `${b}*((${iso}+${con}+${rea})+(${fac}*${tt}))`;
        }
      }
    );
  }

  // Category 2: Animal Models
  if (isCatActive('animalModels')) {
    columns.push(
      { header: 'Animals (n_a)', category: 'animal', isCount: true, minWidth: 10, maxWidth: 12, totalType: 'sum', getValue: c => c.row.numAnimals },
      { header: 'Animal Cost ($/a)', category: 'animal', isCurrency: true, minWidth: 12, maxWidth: 14, totalType: 'none', getValue: c => c.row.animalCostEach },
      { header: 'Housing ($/a)', category: 'animal', isCurrency: true, minWidth: 11, maxWidth: 13, totalType: 'none', getValue: c => c.row.housingCostEach },
      {
        header: 'Animal Subtotal ($)',
        category: 'animal',
        isCurrency: true,
        minWidth: 14,
        maxWidth: 18,
        totalType: 'sum',
        headerColor: 'FF065F46',
        getValue: c => c.animalModelsTotal,
        getFormula: (c, rowIdx, colMap) => {
          const a = colMap['Animals (n_a)'] + rowIdx;
          const ac = colMap['Animal Cost ($/a)'] + rowIdx;
          const hc = colMap['Housing ($/a)'] + rowIdx;
          return `${a}*(${ac}+${hc})`;
        }
      }
    );
  }

  // Category 3: Preclinical Imaging Scans
  if (isCatActive('preclinicalImaging')) {
    columns.push(
      { header: 'Img Consumables ($/s)', category: 'preclinicalImaging', isCurrency: true, minWidth: 13, maxWidth: 16, totalType: 'none', getValue: c => c.row.imagingConsumablesPerScan },
      { header: 'Img Reagents ($/s)', category: 'preclinicalImaging', isCurrency: true, minWidth: 12, maxWidth: 15, totalType: 'none', getValue: c => c.row.imagingReagentsPerScan },
      { header: 'Scans (n_s)', category: 'preclinicalImaging', isCount: true, minWidth: 10, maxWidth: 12, totalType: 'sum', getValue: c => c.row.numScans },
      { header: 'Scan Cost ($/h)', category: 'preclinicalImaging', isCurrency: true, minWidth: 12, maxWidth: 14, totalType: 'none', getValue: c => c.row.scanCostPerHour },
      { header: 'Scan Time (h/s)', category: 'preclinicalImaging', isDecimal: true, minWidth: 11, maxWidth: 13, totalType: 'none', getValue: c => c.row.scanTimeHoursPerScan },
      { header: 'Analysis Time (h/s)', category: 'preclinicalImaging', isDecimal: true, minWidth: 12, maxWidth: 14, totalType: 'none', getValue: c => c.row.imageAnalysisHoursPerScan },
      { header: 'Analysis Cost ($/h)', category: 'preclinicalImaging', isCurrency: true, minWidth: 12, maxWidth: 14, totalType: 'none', getValue: c => c.row.imageAnalysisCostPerHour },
      {
        header: 'Preclinical Imaging Subtotal ($)',
        category: 'preclinicalImaging',
        isCurrency: true,
        minWidth: 14,
        maxWidth: 18,
        totalType: 'sum',
        headerColor: 'FF075985',
        getValue: c => c.preclinicalImagingTotal,
        getFormula: (c, rowIdx, colMap) => {
          const s = colMap['Scans (n_s)'] + rowIdx;
          const con = colMap['Img Consumables ($/s)'] + rowIdx;
          const rea = colMap['Img Reagents ($/s)'] + rowIdx;
          const sc = colMap['Scan Cost ($/h)'] + rowIdx;
          const st = colMap['Scan Time (h/s)'] + rowIdx;
          const at = colMap['Analysis Time (h/s)'] + rowIdx;
          const ac = colMap['Analysis Cost ($/h)'] + rowIdx;
          return `${s}*((${con}+${rea})+(${sc}*${st})+(${at}*${ac}))`;
        }
      }
    );
  }

  // Category 4: Clinical Imaging Scans
  if (isCatActive('clinicalImaging')) {
    columns.push(
      { header: 'Clin Consumables ($/cs)', category: 'clinicalImaging', isCurrency: true, minWidth: 13, maxWidth: 16, totalType: 'none', getValue: c => c.row.clinicalImagingConsumablesPerScan },
      { header: 'Clin Reagents ($/cs)', category: 'clinicalImaging', isCurrency: true, minWidth: 12, maxWidth: 15, totalType: 'none', getValue: c => c.row.clinicalImagingReagentsPerScan },
      { header: 'Clin Scans (n_cs)', category: 'clinicalImaging', isCount: true, minWidth: 10, maxWidth: 12, totalType: 'sum', getValue: c => c.row.numClinicalScans },
      { header: 'Clin Scan Cost ($/h)', category: 'clinicalImaging', isCurrency: true, minWidth: 12, maxWidth: 14, totalType: 'none', getValue: c => c.row.clinicalScanCostPerHour },
      { header: 'Clin Scan Time (h/cs)', category: 'clinicalImaging', isDecimal: true, minWidth: 11, maxWidth: 13, totalType: 'none', getValue: c => c.row.clinicalScanTimeHoursPerScan },
      { header: 'Clin Analysis Time (h/cs)', category: 'clinicalImaging', isDecimal: true, minWidth: 12, maxWidth: 14, totalType: 'none', getValue: c => c.row.clinicalImageAnalysisHoursPerScan },
      { header: 'Clin Analysis Cost ($/h)', category: 'clinicalImaging', isCurrency: true, minWidth: 12, maxWidth: 14, totalType: 'none', getValue: c => c.row.clinicalImageAnalysisCostPerHour },
      {
        header: 'Clinical Imaging Subtotal ($)',
        category: 'clinicalImaging',
        isCurrency: true,
        minWidth: 14,
        maxWidth: 18,
        totalType: 'sum',
        headerColor: 'FF0284C7',
        getValue: c => c.clinicalImagingTotal,
        getFormula: (c, rowIdx, colMap) => {
          const cs = colMap['Clin Scans (n_cs)'] + rowIdx;
          const con = colMap['Clin Consumables ($/cs)'] + rowIdx;
          const rea = colMap['Clin Reagents ($/cs)'] + rowIdx;
          const sc = colMap['Clin Scan Cost ($/h)'] + rowIdx;
          const st = colMap['Clin Scan Time (h/cs)'] + rowIdx;
          const at = colMap['Clin Analysis Time (h/cs)'] + rowIdx;
          const ac = colMap['Clin Analysis Cost ($/h)'] + rowIdx;
          return `${cs}*((${con}+${rea})+(${sc}*${st})+(${at}*${ac}))`;
        }
      }
    );
  }

  // Category 5: Biodistribution
  if (isCatActive('biodistribution')) {
    columns.push(
      { header: 'Bio Consumables ($/bio)', category: 'bio', isCurrency: true, minWidth: 13, maxWidth: 16, totalType: 'none', getValue: c => c.row.bioConsumablesPerBio },
      { header: 'Bio Reagents ($/bio)', category: 'bio', isCurrency: true, minWidth: 12, maxWidth: 15, totalType: 'none', getValue: c => c.row.bioReagentsPerBio },
      { header: 'Bio Studies (n_bio)', category: 'bio', isCount: true, minWidth: 11, maxWidth: 13, totalType: 'sum', getValue: c => c.row.numBiodistributions },
      { header: 'Bio Cost ($/bio)', category: 'bio', isCurrency: true, minWidth: 12, maxWidth: 14, totalType: 'none', getValue: c => c.row.bioCostPerUnit },
      {
        header: 'Bio Subtotal ($)',
        category: 'bio',
        isCurrency: true,
        minWidth: 14,
        maxWidth: 18,
        totalType: 'sum',
        headerColor: 'FF92400E',
        getValue: c => c.biodistributionTotal,
        getFormula: (c, rowIdx, colMap) => {
          const b = colMap['Bio Studies (n_bio)'] + rowIdx;
          const con = colMap['Bio Consumables ($/bio)'] + rowIdx;
          const rea = colMap['Bio Reagents ($/bio)'] + rowIdx;
          const u = colMap['Bio Cost ($/bio)'] + rowIdx;
          return `${b}*(${con}+${rea}+${u})`;
        }
      }
    );
  }

  // Category 6: In Vitro
  if (isCatActive('inVitro')) {
    columns.push(
      { header: 'Cell Line ($)', category: 'invitro', isCurrency: true, minWidth: 11, maxWidth: 13, totalType: 'none', getValue: c => c.row.cellLineCost },
      { header: 'In Vitro Consumables ($/t)', category: 'invitro', isCurrency: true, minWidth: 13, maxWidth: 16, totalType: 'none', getValue: c => c.row.inVitroConsumablesPerTest },
      { header: 'In Vitro Reagents ($/t)', category: 'invitro', isCurrency: true, minWidth: 12, maxWidth: 15, totalType: 'none', getValue: c => c.row.inVitroReagentsPerTest },
      { header: 'In Vitro Tests (n_t)', category: 'invitro', isCount: true, minWidth: 11, maxWidth: 13, totalType: 'sum', getValue: c => c.row.numInVitroTests },
      { header: 'Testing Hours (h/t)', category: 'invitro', isDecimal: true, minWidth: 11, maxWidth: 13, totalType: 'none', getValue: c => c.row.inVitroTestingHoursPerTest },
      { header: 'Testing Cost ($/h)', category: 'invitro', isCurrency: true, minWidth: 12, maxWidth: 14, totalType: 'none', getValue: c => c.row.inVitroTestingCostPerHour },
      {
        header: 'In Vitro Subtotal ($)',
        category: 'invitro',
        isCurrency: true,
        minWidth: 14,
        maxWidth: 18,
        totalType: 'sum',
        headerColor: 'FF86198F',
        getValue: c => c.inVitroTotal,
        getFormula: (c, rowIdx, colMap) => {
          const cl = colMap['Cell Line ($)'] + rowIdx;
          const t = colMap['In Vitro Tests (n_t)'] + rowIdx;
          const con = colMap['In Vitro Consumables ($/t)'] + rowIdx;
          const rea = colMap['In Vitro Reagents ($/t)'] + rowIdx;
          const th = colMap['Testing Hours (h/t)'] + rowIdx;
          const tc = colMap['Testing Cost ($/h)'] + rowIdx;
          return `${cl}+(${t}*((${con}+${rea})+(${th}*${tc})))`;
        }
      }
    );
  }

  // Category 7: Others
  if (isCatActive('others')) {
    columns.push(
      {
        header: 'Others Cost ($)',
        category: 'others',
        isCurrency: true,
        minWidth: 12,
        maxWidth: 15,
        totalType: 'sum',
        headerColor: 'FF475569',
        getValue: c => c.row.othersCost
      },
      {
        header: 'Others Description',
        category: 'others',
        minWidth: 14,
        maxWidth: 24,
        totalType: 'none',
        getValue: c => c.row.othersNotes || ''
      }
    );
  }

  // End Columns
  columns.push({
    header: 'Phase Notes',
    category: 'info',
    minWidth: 14,
    maxWidth: 28,
    totalType: 'none',
    getValue: c => c.row.phaseNotes || c.row.notes || ''
  });

  columns.push({
    header: 'Total Phase Cost ($)',
    category: 'total',
    isCurrency: true,
    minWidth: 16,
    maxWidth: 20,
    totalType: 'sum',
    headerColor: 'FF047857',
    getValue: c => c.totalRowCost,
    getFormula: (c, rowIdx, colMap) => {
      const activeSubtotals: string[] = [];
      if (colMap['Radio Subtotal ($)']) activeSubtotals.push(colMap['Radio Subtotal ($)'] + rowIdx);
      if (colMap['Animal Subtotal ($)']) activeSubtotals.push(colMap['Animal Subtotal ($)'] + rowIdx);
      if (colMap['Preclinical Imaging Subtotal ($)']) activeSubtotals.push(colMap['Preclinical Imaging Subtotal ($)'] + rowIdx);
      if (colMap['Clinical Imaging Subtotal ($)']) activeSubtotals.push(colMap['Clinical Imaging Subtotal ($)'] + rowIdx);
      if (colMap['Bio Subtotal ($)']) activeSubtotals.push(colMap['Bio Subtotal ($)'] + rowIdx);
      if (colMap['In Vitro Subtotal ($)']) activeSubtotals.push(colMap['In Vitro Subtotal ($)'] + rowIdx);
      if (colMap['Others Cost ($)']) activeSubtotals.push(colMap['Others Cost ($)'] + rowIdx);
      return activeSubtotals.length > 0 ? activeSubtotals.join('+') : '0';
    }
  });

  const totalColumnsCount = columns.length;
  const colLetterMap: Record<string, string> = {};
  columns.forEach((c, idx) => {
    colLetterMap[c.header] = getColumnLetter(idx + 1);
  });

  // Title Block
  sheet.mergeCells(`A1:${getColumnLetter(Math.min(totalColumnsCount, 8))}1`);
  const titleCell = sheet.getCell('A1');
  titleCell.value = `${tracerName.toUpperCase()} — RADIOTRACER CAMPAIGN BUDGET`;
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF0F172A' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
  sheet.getRow(1).height = 28;

  sheet.mergeCells(`A2:${getColumnLetter(Math.min(totalColumnsCount, 8))}2`);
  const subCell = sheet.getCell('A2');
  subCell.value = `Export Scope: ${isAllTiers ? 'All Tiers' : tierLabel.replace(/_/g, ' ')} | Generated: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} | Dynamic Formula Calculations Active`;
  subCell.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF64748B' } };
  sheet.getRow(2).height = 18;

  // Filter Notification Banner
  if (activeCostCategories.length < ALL_COST_CATEGORY_IDS.length) {
    sheet.mergeCells(`A3:${getColumnLetter(Math.min(totalColumnsCount, 8))}3`);
    const filterCell = sheet.getCell('A3');
    const activeNames = activeCostCategories.map(c => COST_CATEGORY_DEFINITIONS[c].shortLabel).join(', ');
    filterCell.value = `FILTERED EXPORT: Active Categories [ ${activeNames} ]`;
    filterCell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF92400E' } };
    filterCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
    sheet.getRow(3).height = 20;
  }

  // Header Row (Row 5)
  const headerRowIdx = 5;
  const headerRow = sheet.getRow(headerRowIdx);
  headerRow.height = 32;

  const headerFills: Record<string, string> = {
    info: 'FF1E293B',
    radio: 'FF3730A3',
    animal: 'FF065F46',
    imaging: 'FF075985',
    bio: 'FF92400E',
    invitro: 'FF86198F',
    others: 'FF475569',
    total: 'FF065F46'
  };

  columns.forEach((colDef, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = colDef.header;
    const bgArgb = colDef.headerColor || headerFills[colDef.category] || 'FF1E293B';
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
    cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = {
      vertical: 'middle',
      horizontal: colDef.isCurrency || colDef.isCount || colDef.isDecimal ? 'right' : 'center',
      wrapText: true
    };
    cell.border = {
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      right: { style: 'thin', color: { argb: 'FF475569' } }
    };
  });

  // Formatting patterns
  const currFmt = '$#,##0;($#,##0);"-"';
  const countFmt = '#,##0;(#,##0);"-"';
  const decFmt = '0.0;(-0.0);"-"';

  // Data Rows
  let rowIndex = 6;
  const startRow = rowIndex;

  filteredRows.forEach((c, itemIdx) => {
    const r = sheet.getRow(rowIndex);
    const isEven = itemIdx % 2 === 0;
    const rowBg = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    columns.forEach((colDef, colIdx) => {
      const cell = r.getCell(colIdx + 1);
      if (colDef.getFormula) {
        cell.value = {
          formula: colDef.getFormula(c, rowIndex, colLetterMap),
          result: typeof colDef.getValue(c) === 'number' ? Number(colDef.getValue(c)) : 0
        };
      } else {
        cell.value = colDef.getValue(c);
      }

      if (colDef.isCurrency) {
        cell.numFmt = currFmt;
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else if (colDef.isCount) {
        cell.numFmt = countFmt;
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else if (colDef.isDecimal) {
        cell.numFmt = decFmt;
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }

      cell.font = {
        name: 'Calibri',
        size: 9.5,
        bold: colDef.category === 'total' || colDef.header.includes('Subtotal'),
        color: colDef.category === 'total' ? { argb: 'FF065F46' } : { argb: 'FF0F172A' }
      };

      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
          argb: colDef.category === 'total' ? (isEven ? 'FFECFDF5' : 'FFD1FAE5') : rowBg
        }
      };

      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    });

    r.height = 20;
    rowIndex++;
  });

  const lastDataRow = rowIndex - 1;

  // Totals Row
  const totalsRowIndex = rowIndex;
  const totalsRow = sheet.getRow(totalsRowIndex);
  totalsRow.height = 24;

  totalsRow.getCell(1).value = 'TOTALS';
  sheet.mergeCells(`A${totalsRowIndex}:C${totalsRowIndex}`);
  totalsRow.getCell(1).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  totalsRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
  totalsRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };

  columns.forEach((colDef, colIdx) => {
    const cellIdx = colIdx + 1;
    if (cellIdx <= 3) return;

    const cell = totalsRow.getCell(cellIdx);
    const letter = getColumnLetter(cellIdx);

    if (colDef.totalType === 'sum') {
      const sumFormula = `SUM(${letter}${startRow}:${letter}${lastDataRow})`;
      const sumVal = filteredRows.reduce((acc, row) => acc + (Number(colDef.getValue(row)) || 0), 0);
      cell.value = {
        formula: sumFormula,
        result: sumVal
      };

      if (colDef.isCurrency) {
        cell.numFmt = currFmt;
      } else if (colDef.isCount) {
        cell.numFmt = countFmt;
      } else if (colDef.isDecimal) {
        cell.numFmt = decFmt;
      }

      cell.alignment = { vertical: 'middle', horizontal: 'right' };
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colDef.category === 'total' ? 'FFBBF7D0' : 'FFF1F5F9' }
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF0F172A' } },
        bottom: { style: 'double', color: { argb: 'FF0F172A' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };
    } else {
      cell.value = '';
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF0F172A' } },
        bottom: { style: 'double', color: { argb: 'FF0F172A' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };
    }
  });

  rowIndex += 2;

  // Category Breakdown Summary Block
  const catHeaderRow = sheet.getRow(rowIndex);
  catHeaderRow.getCell(2).value = 'CORE SECTION CATEGORY BREAKDOWN';
  catHeaderRow.getCell(2).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  catHeaderRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };

  catHeaderRow.getCell(3).value = 'TOTAL COST';
  catHeaderRow.getCell(3).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  catHeaderRow.getCell(3).alignment = { horizontal: 'right' };
  catHeaderRow.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };

  catHeaderRow.getCell(4).value = 'SHARE (%)';
  catHeaderRow.getCell(4).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  catHeaderRow.getCell(4).alignment = { horizontal: 'right' };
  catHeaderRow.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  catHeaderRow.height = 22;

  const totalCostColLetter = colLetterMap['Total Phase Cost ($)'] || 'Z';
  const grandTotalRef = `${totalCostColLetter}${totalsRowIndex}`;

  const categoryConfigs = [
    { id: 'radiopharmaceuticals', name: '1. Radiopharmaceuticals (Isotope, Consumables, Reagents, RT Facility)', subCol: 'Radio Subtotal ($)' },
    { id: 'animalModels', name: '2. Animal Models (Animals, Housing)', subCol: 'Animal Subtotal ($)' },
    { id: 'imaging', name: '3. Imaging (Consumables, Reagents, Scan Facility, Analysis)', subCol: 'Imaging Subtotal ($)' },
    { id: 'biodistribution', name: '4. Biodistribution (Consumables, Reagents, Processing)', subCol: 'Bio Subtotal ($)' },
    { id: 'inVitro', name: '5. In Vitro (Cell line, Consumables, Reagents, Testing)', subCol: 'In Vitro Subtotal ($)' },
    { id: 'others', name: '6. Others / Miscellaneous', subCol: 'Others Cost ($)' }
  ];

  categoryConfigs.forEach(cfg => {
    if (!isCatActive(cfg.id as CostCategoryId)) return;
    rowIndex++;
    const catRow = sheet.getRow(rowIndex);
    catRow.height = 19;
    catRow.getCell(2).value = cfg.name;
    catRow.getCell(2).font = { name: 'Calibri', size: 9.5, color: { argb: 'FF1E293B' } };

    const targetSubLetter = colLetterMap[cfg.subCol];
    if (targetSubLetter) {
      catRow.getCell(3).value = {
        formula: `${targetSubLetter}${totalsRowIndex}`,
        result: 0
      };
    } else {
      catRow.getCell(3).value = 0;
    }
    catRow.getCell(3).numFmt = currFmt;
    catRow.getCell(3).font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF0F172A' } };
    catRow.getCell(3).alignment = { horizontal: 'right' };

    catRow.getCell(4).value = {
      formula: `IF(${grandTotalRef}>0, C${rowIndex}/${grandTotalRef}, 0)`,
      result: 0
    };
    catRow.getCell(4).numFmt = '0.0%';
    catRow.getCell(4).font = { name: 'Calibri', size: 9.5, color: { argb: 'FF64748B' } };
    catRow.getCell(4).alignment = { horizontal: 'right' };

    [2, 3, 4].forEach(colIdx => {
      catRow.getCell(colIdx).border = {
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    });
  });

  // Category Grand Total Row
  rowIndex++;
  const catGrandRow = sheet.getRow(rowIndex);
  catGrandRow.height = 22;
  catGrandRow.getCell(2).value = 'GRAND TOTAL CAMPAIGN BUDGET';
  catGrandRow.getCell(2).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };

  catGrandRow.getCell(3).value = {
    formula: grandTotalRef,
    result: 0
  };
  catGrandRow.getCell(3).numFmt = currFmt;
  catGrandRow.getCell(4).value = 1.0;
  catGrandRow.getCell(4).numFmt = '0.0%';

  [2, 3, 4].forEach(colIdx => {
    const cell = catGrandRow.getCell(colIdx);
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF10B981' } },
      bottom: { style: 'double', color: { argb: 'FF10B981' } }
    };
  });

  // Itemization Breakdown Sheet
  if (includeItemized) {
    const extractedItems = extractAllItemizations(filteredRows.map(c => c.row))
      .filter(group => {
        const catId = CATEGORY_NAME_TO_ID[group.category];
        return catId ? isCatActive(catId) : true;
      });

    if (extractedItems.length > 0) {
      const itemSheet = workbook.addWorksheet('Itemization Breakdown');

      itemSheet.mergeCells('A1:F1');
      const itemTitle = itemSheet.getCell('A1');
      itemTitle.value = 'ITEMIZATION LINE ITEM BREAKDOWN';
      itemTitle.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF312E81' } };

      const itemHeaders = ['Tier', 'Phase Name', 'Category', 'Parameter Field', 'Itemized Elements Breakdown', 'Total Parameter Value'];
      const itemHeaderRow = itemSheet.getRow(3);
      itemHeaderRow.values = itemHeaders;
      itemHeaderRow.height = 24;
      itemHeaderRow.eachCell(cell => {
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4338CA' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      let itemRowIdx = 4;
      extractedItems.forEach(group => {
        const symbol = group.unitType === 'currency' ? '$' : '';
        const unitSuffix = group.unitType === 'hours' ? ' h' : '';
        const itemsFormatted = group.items
          .map(item => `${item.name || 'Item'}: ${symbol}${item.value.toLocaleString()}${unitSuffix}`)
          .join('; ');

        const r = itemSheet.getRow(itemRowIdx);
        r.getCell(1).value = `Tier ${group.tier}`;
        r.getCell(2).value = group.phaseName;
        r.getCell(3).value = group.category;
        r.getCell(4).value = group.fieldLabel;
        r.getCell(5).value = itemsFormatted;
        r.getCell(6).value = group.totalValue;

        if (group.unitType === 'currency') {
          r.getCell(6).numFmt = currFmt;
        } else if (group.unitType === 'hours') {
          r.getCell(6).numFmt = '0.0" h"';
        } else {
          r.getCell(6).numFmt = '#,##0';
        }

        r.eachCell(cell => {
          cell.border = {
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } }
          };
        });
        itemRowIdx++;
      });

      itemSheet.columns = [
        { width: 10 },
        { width: 25 },
        { width: 22 },
        { width: 28 },
        { width: 45 },
        { width: 20 }
      ];
    }
  }

  // Embed JSON metadata for lossless import
  rowIndex += 2;
  const metaRow = sheet.getRow(rowIndex);
  metaRow.getCell(1).value = `# RADIOTRACER_APPLET_STATE: ${JSON.stringify({
    version: 1,
    app: 'RadiotracerCampaignEstimator',
    timestamp: new Date().toISOString(),
    tracerName,
    tiers,
    rows: calculatedRows.map(c => c.row),
    activeCostCategories
  })}`;
  metaRow.getCell(1).font = { name: 'Calibri', size: 8, color: { argb: 'FF94A3B8' } };

  // Auto-fit column widths snug to content
  for (let colIdx = 1; colIdx <= totalColumnsCount; colIdx++) {
    const colDef = columns[colIdx - 1];
    const col = sheet.getColumn(colIdx);
    let maxContentLen = 0;

    const headerVal = String(colDef.header || '');
    const headerLines = headerVal.split(/[\s/]+/);
    let maxHeaderWordLen = 0;
    headerLines.forEach(word => {
      if (word.length > maxHeaderWordLen) maxHeaderWordLen = word.length;
    });

    for (let r = startRow; r <= lastDataRow; r++) {
      const cell = sheet.getRow(r).getCell(colIdx);
      let valStr = '';
      const rawVal = cell.value as any;
      if (rawVal !== null && rawVal !== undefined) {
        if (typeof rawVal === 'object' && 'result' in rawVal) {
          valStr = String(rawVal.result || '');
        } else {
          valStr = String(rawVal);
        }
        if (typeof rawVal === 'number' || (typeof rawVal === 'object' && typeof rawVal?.result === 'number')) {
          const num = typeof rawVal === 'number' ? rawVal : Number(rawVal?.result || 0);
          valStr = `${Math.round(num).toLocaleString()}`;
        }
      }
      if (valStr.length > maxContentLen) {
        maxContentLen = valStr.length;
      }
    }

    const defaultMin = colDef.minWidth || 7;
    const defaultMax = colDef.maxWidth || (colIdx === 2 || colIdx === 3 ? 24 : 14);

    let computedWidth = Math.max(maxContentLen + 1.8, maxHeaderWordLen + 1.2, defaultMin);
    if (computedWidth > defaultMax) {
      computedWidth = defaultMax;
    }

    col.width = Math.round(computedWidth * 10) / 10;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeName}_Campaign_${tierLabel}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

// ---------------------------------------------------------------------------
// 2. CSV EXPORT WITH DYNAMIC FILTERING & EMBEDDED METADATA
// ---------------------------------------------------------------------------
export function exportToCsv(options: ExportOptions): void {
  const {
    tracerName,
    calculatedRows,
    tiers,
    selectedTiers,
    activeCostCategories,
    includeItemized
  } = options;

  const isCatActive = (id: CostCategoryId) => activeCostCategories.includes(id);
  const filteredRows = calculatedRows.filter(c => selectedTiers.includes(c.row.tier));
  const sanitizeName = (tracerName.trim() || 'Radiotracer').replace(/[^a-zA-Z0-9_-]/g, '_');
  const isAllTiers = selectedTiers.length === tiers.length;
  const tierLabel = isAllTiers
    ? `All_Tiers_1-${tiers.length}`
    : `Tiers_${selectedTiers.sort((a, b) => a - b).join('_')}`;

  const exportStatePayload = {
    version: 1,
    app: 'RadiotracerCampaignEstimator',
    timestamp: new Date().toISOString(),
    tracerName,
    tiers,
    rows: calculatedRows.map(c => c.row),
    activeCostCategories
  };
  const stateJson = JSON.stringify(exportStatePayload);

  // Headers
  const csvHeaders: string[] = ['Tier Level', 'Phase Name', 'Description'];
  if (isCatActive('radiopharmaceuticals')) {
    csvHeaders.push('Isotope ($/b)', 'Radio Consumables ($/b)', 'Radio Reagents ($/b)', 'Batches (n_b)', 'RT Facility ($/h)', 'Task Time (h/b)', 'Radio Total ($)');
  }
  if (isCatActive('animalModels')) {
    csvHeaders.push('Animals (n_a)', 'Animal Cost ($/a)', 'Housing ($/a)', 'Animal Total ($)');
  }
  if (isCatActive('preclinicalImaging')) {
    csvHeaders.push('Preclin Consumables ($/s)', 'Preclin Reagents ($/s)', 'Preclin Scans (n_s)', 'Scan Cost ($/h)', 'Scan Time (h/s)', 'Image Analysis (h/s)', 'Image Analysis ($/h)', 'Preclinical Imaging Total ($)');
  }
  if (isCatActive('clinicalImaging')) {
    csvHeaders.push('Clin Consumables ($/cs)', 'Clin Reagents ($/cs)', 'Clin Scans (n_cs)', 'Clin Scan Cost ($/h)', 'Clin Scan Time (h/cs)', 'Clin Image Analysis (h/cs)', 'Clin Image Analysis ($/h)', 'Clinical Imaging Total ($)');
  }
  if (isCatActive('biodistribution')) {
    csvHeaders.push('Bio Consumables ($/bio)', 'Bio Reagents ($/bio)', 'Biodistributions (n_bio)', 'Bio Cost ($/bio)', 'Biodistribution Total ($)');
  }
  if (isCatActive('inVitro')) {
    csvHeaders.push('Cell Line ($)', 'In Vitro Consumables ($/t)', 'In Vitro Reagents ($/t)', 'In Vitro Tests (n_t)', 'Testing Hours (h/t)', 'Testing Cost ($/h)', 'In Vitro Total ($)');
  }
  if (isCatActive('others')) {
    csvHeaders.push('Others Cost ($)', 'Others Notes');
  }
  csvHeaders.push('Phase Notes', 'Total Phase Cost ($)');

  // Rows
  const csvRows = filteredRows.map(c => {
    const rowVals: (string | number)[] = [
      c.row.tier,
      `"${c.row.phase.replace(/"/g, '""')}"`,
      `"${(c.row.description || '').replace(/"/g, '""')}"`
    ];

    if (isCatActive('radiopharmaceuticals')) {
      rowVals.push(
        c.row.isotopeCostPerBatch,
        c.row.radiopharmConsumablesPerBatch,
        c.row.radiopharmReagentsPerBatch,
        c.row.numBatches,
        c.row.radiopharmFacilityCostPerHour,
        c.row.radiopharmTaskTimeHoursPerBatch,
        c.radiopharmaceuticalsTotal
      );
    }
    if (isCatActive('animalModels')) {
      rowVals.push(
        c.row.numAnimals,
        c.row.animalCostEach,
        c.row.housingCostEach,
        c.animalModelsTotal
      );
    }
    if (isCatActive('preclinicalImaging')) {
      rowVals.push(
        c.row.imagingConsumablesPerScan,
        c.row.imagingReagentsPerScan,
        c.row.numScans,
        c.row.scanCostPerHour,
        c.row.scanTimeHoursPerScan,
        c.row.imageAnalysisHoursPerScan,
        c.row.imageAnalysisCostPerHour,
        c.preclinicalImagingTotal
      );
    }
    if (isCatActive('clinicalImaging')) {
      rowVals.push(
        c.row.clinicalImagingConsumablesPerScan,
        c.row.clinicalImagingReagentsPerScan,
        c.row.numClinicalScans,
        c.row.clinicalScanCostPerHour,
        c.row.clinicalScanTimeHoursPerScan,
        c.row.clinicalImageAnalysisHoursPerScan,
        c.row.clinicalImageAnalysisCostPerHour,
        c.clinicalImagingTotal
      );
    }
    if (isCatActive('biodistribution')) {
      rowVals.push(
        c.row.bioConsumablesPerBio,
        c.row.bioReagentsPerBio,
        c.row.numBiodistributions,
        c.row.bioCostPerUnit,
        c.biodistributionTotal
      );
    }
    if (isCatActive('inVitro')) {
      rowVals.push(
        c.row.cellLineCost,
        c.row.inVitroConsumablesPerTest,
        c.row.inVitroReagentsPerTest,
        c.row.numInVitroTests,
        c.row.inVitroTestingHoursPerTest,
        c.row.inVitroTestingCostPerHour,
        c.inVitroTotal
      );
    }
    if (isCatActive('others')) {
      rowVals.push(
        c.row.othersCost,
        `"${(c.row.othersNotes || '').replace(/"/g, '""')}"`
      );
    }
    rowVals.push(
      `"${(c.row.phaseNotes || c.row.notes || '').replace(/"/g, '""')}"`,
      c.totalRowCost
    );
    return rowVals;
  });

  let csvContentString = [csvHeaders.join(','), ...csvRows.map(e => e.join(','))].join('\n');

  // Core Category Breakdown in CSV
  const cat = calculateCategoryBreakdown(filteredRows, activeCostCategories);
  const getCsvPct = (val: number) => cat.grandTotal > 0 ? ((val / cat.grandTotal) * 100).toFixed(1) + '%' : '0.0%';

  csvContentString += '\n\n"=== CORE SECTION COST & PERCENTAGE ANALYTICS ==="\n';
  csvContentString += '"Core Section Category","Total Cost ($)","Share (% of Total Budget)"\n';
  if (isCatActive('radiopharmaceuticals')) {
    csvContentString += `"1. Radiopharmaceuticals (Isotope, Consumables, Reagents, RT Facility)","${cat.radiopharmaceuticals}","${getCsvPct(cat.radiopharmaceuticals)}"\n`;
  }
  if (isCatActive('animalModels')) {
    csvContentString += `"2. Animal Models (Animals, Housing)","${cat.animalModels}","${getCsvPct(cat.animalModels)}"\n`;
  }
  if (isCatActive('preclinicalImaging')) {
    csvContentString += `"3. Preclinical Imaging (Consumables, Reagents, Scan Facility, Analysis)","${cat.preclinicalImaging}","${getCsvPct(cat.preclinicalImaging)}"\n`;
  }
  if (isCatActive('clinicalImaging')) {
    csvContentString += `"4. Clinical Imaging (Consumables, Reagents, Scan Facility, Analysis)","${cat.clinicalImaging}","${getCsvPct(cat.clinicalImaging)}"\n`;
  }
  if (isCatActive('biodistribution')) {
    csvContentString += `"5. Biodistribution (Consumables, Reagents, Processing)","${cat.biodistribution}","${getCsvPct(cat.biodistribution)}"\n`;
  }
  if (isCatActive('inVitro')) {
    csvContentString += `"6. In Vitro (Cell line, Consumables, Reagents, Testing)","${cat.inVitro}","${getCsvPct(cat.inVitro)}"\n`;
  }
  if (isCatActive('others')) {
    csvContentString += `"7. Others / Miscellaneous","${cat.others}","${getCsvPct(cat.others)}"\n`;
  }
  csvContentString += `"GRAND TOTAL CAMPAIGN BUDGET","${cat.grandTotal}","100.0%"\n`;

  if (includeItemized) {
    const extractedItems = extractAllItemizations(filteredRows.map(c => c.row))
      .filter(group => {
        const catId = CATEGORY_NAME_TO_ID[group.category];
        return catId ? isCatActive(catId) : true;
      });

    if (extractedItems.length > 0) {
      const itemHeader = [
        '\n\n"=== ITEMIZATION LINE ITEM BREAKDOWN ==="',
        '"Tier","Phase","Category","Parameter Field","Itemized Elements Breakdown","Total Parameter Value"'
      ].join('\n');

      const itemRows = extractedItems.map(group => {
        const symbol = group.unitType === 'currency' ? '$' : '';
        const unitSuffix = group.unitType === 'hours' ? ' h' : '';
        const itemsFormatted = group.items
          .map(item => `${item.name || 'Item'}: ${symbol}${item.value.toLocaleString()}${unitSuffix}`)
          .join('; ');

        return [
          group.tier,
          `"${group.phaseName.replace(/"/g, '""')}"`,
          `"${group.category.replace(/"/g, '""')}"`,
          `"${group.fieldLabel.replace(/"/g, '""')}"`,
          `"${itemsFormatted.replace(/"/g, '""')}"`,
          symbol ? `"${symbol}${group.totalValue.toLocaleString()}${unitSuffix}"` : `${group.totalValue}${unitSuffix}`
        ].join(',');
      });

      csvContentString += itemHeader + '\n' + itemRows.join('\n');
    }
  }

  csvContentString += `\n\n# RADIOTRACER_APPLET_STATE: ${stateJson}`;

  const blob = new Blob(["\uFEFF" + csvContentString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${sanitizeName}_Campaign_${tierLabel}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

// ---------------------------------------------------------------------------
// 3. HTML & WORD REPORT GENERATION (CSS STYLES & RICH TEMPLATES)
// ---------------------------------------------------------------------------
export function getReportStyles(): string {
  return `
    * { box-sizing: border-box; }
    @page {
      size: 11in 8.5in;
      mso-page-orientation: landscape;
      margin: 0.5in 0.5in 0.5in 0.5in;
    }
    @page SectionLandscape {
      size: 11in 8.5in;
      mso-page-orientation: landscape;
      margin: 0.5in 0.5in 0.5in 0.5in;
    }
    div.SectionLandscape { page: SectionLandscape; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      line-height: 1.4;
      background: #ffffff;
      margin: 0;
      padding: 16px;
      font-size: 11px;
    }

    h1, h2, h3, h4, p { margin: 0 0 6px 0; }
    
    .report-header {
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 12px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .report-title {
      font-size: 20px;
      font-weight: 800;
      color: #1e3a8a;
      letter-spacing: -0.02em;
    }
    .report-subtitle {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge-primary { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
    .badge-filter { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }

    .summary-grid {
      display: table;
      width: 100%;
      margin-bottom: 16px;
      border-spacing: 8px;
    }
    .summary-card {
      display: table-cell;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
      vertical-align: top;
      width: 25%;
    }
    .summary-label {
      font-size: 9px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    .summary-value {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
    }
    .summary-sub {
      font-size: 9.5px;
      color: #64748b;
      margin-top: 2px;
    }

    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: #1e293b;
      border-left: 4px solid #3b82f6;
      padding-left: 8px;
      margin: 18px 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 10px;
      table-layout: fixed;
    }
    th, td {
      padding: 5px 6px;
      border: 1px solid #e2e8f0;
      text-align: left;
      vertical-align: middle;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    th {
      background: #1e293b;
      color: #ffffff;
      font-weight: 700;
      font-size: 9.5px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .th-radio { background: #3730a3; }
    .th-animal { background: #065f46; }
    .th-imaging { background: #075985; }
    .th-bio { background: #92400e; }
    .th-invitro { background: #86198f; }
    .th-others { background: #475569; }
    .th-total { background: #047857; }

    tr:nth-child(even) td { background: #f8fafc; }
    tr.totals-row td {
      background: #f1f5f9;
      font-weight: 700;
      border-top: 2px solid #0f172a;
      border-bottom: 2px solid #0f172a;
      color: #0f172a;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .font-bold { font-weight: 700; }
    .text-emerald { color: #047857; }
    .text-indigo { color: #4338ca; }
    .bg-emerald-subtle { background: #ecfdf5 !important; }

    .progress-bar-bg {
      background: #e2e8f0;
      border-radius: 4px;
      height: 6px;
      width: 100%;
      overflow: hidden;
      display: inline-block;
      vertical-align: middle;
    }
    .progress-bar-fill {
      background: #3b82f6;
      height: 100%;
    }

    .tier-cards-container {
      display: table;
      width: 100%;
      border-spacing: 8px;
      margin-bottom: 16px;
    }
    .tier-card {
      display: table-cell;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 12px;
      background: #ffffff;
      vertical-align: top;
    }
    .tier-card-header {
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 6px;
      margin-bottom: 6px;
    }
    .tier-name { font-size: 12px; font-weight: 800; color: #1e293b; }
    .tier-budget { font-size: 16px; font-weight: 800; color: #047857; }
    .tier-metrics { font-size: 9.5px; color: #475569; margin-top: 4px; line-height: 1.5; }

    .page-break { page-break-after: always; }
  `;
}

export function generateHtmlBody(options: ExportOptions): string {
  const {
    tracerName,
    calculatedRows,
    tiers,
    tierSummaries,
    selectedTiers,
    activeCostCategories,
    includeSummarizedMatrix,
    includeCategoryTables,
    includeItemized,
    includeCharts
  } = options;

  const isCatActive = (id: CostCategoryId) => activeCostCategories.includes(id);
  const filteredRows = calculatedRows.filter(c => selectedTiers.includes(c.row.tier));
  const isAllTiers = selectedTiers.length === tiers.length;
  const tierScopeLabel = isAllTiers ? 'All Tiers (1 to ' + tiers.length + ')' : 'Tiers: ' + selectedTiers.join(', ');

  const totalBatches = filteredRows.reduce((s, r) => s + (r.row.numBatches || 0), 0);
  const totalFacilityHours = filteredRows.reduce((s, r) => s + ((r.row.radiopharmTaskTimeHoursPerBatch || 0) * (r.row.numBatches || 0)), 0);
  const totalAnimals = filteredRows.reduce((s, r) => s + (r.row.numAnimals || 0), 0);
  const totalScans = filteredRows.reduce((s, r) => s + (r.row.numScans || 0), 0);
  const totalScanHours = filteredRows.reduce((s, r) => s + ((r.row.scanTimeHoursPerScan || 0) * (r.row.numScans || 0)), 0);
  const totalClinicalScans = filteredRows.reduce((s, r) => s + (r.row.numClinicalScans || 0), 0);
  const totalClinicalScanHours = filteredRows.reduce((s, r) => s + ((r.row.clinicalScanTimeHoursPerScan || 0) * (r.row.numClinicalScans || 0)), 0);
  const totalBio = filteredRows.reduce((s, r) => s + (r.row.numBiodistributions || 0), 0);
  const totalInVitro = filteredRows.reduce((s, r) => s + (r.row.numInVitroTests || 0), 0);

  const cat = calculateCategoryBreakdown(filteredRows, activeCostCategories);
  const grandTotal = cat.grandTotal;

  let body = '';

  // 1. Report Header
  body += `
    <div class="report-header">
      <div>
        <div class="report-title">${tracerName || 'Radiotracer'} — Campaign Budget & Resource Estimation Report</div>
        <div class="report-subtitle">
          Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          &nbsp;|&nbsp; Scope: <strong>${tierScopeLabel}</strong>
        </div>
      </div>
      <div>
        <span class="badge badge-primary">CONFIDENTIAL ESTIMATE</span>
        ${activeCostCategories.length < ALL_COST_CATEGORY_IDS.length ? '<span class="badge badge-filter" style="margin-left: 4px;">FILTERED CATEGORIES</span>' : ''}
      </div>
    </div>
  `;

  // 2. Executive KPI Cards
  body += `
    <div class="summary-grid">
      <div class="summary-card" style="border-left: 4px solid #10b981; background: #f0fdf4;">
        <div class="summary-label">Grand Total Budget</div>
        <div class="summary-value" style="color: #047857;">${formatCurrency(grandTotal)}</div>
        <div class="summary-sub">${filteredRows.length} Campaign Phases included</div>
      </div>
      <div class="summary-card" style="border-left: 4px solid #6366f1;">
        <div class="summary-label">Radiopharm (RT) Operations</div>
        <div class="summary-value">${totalBatches} <span style="font-size: 12px; font-weight: normal;">batches</span></div>
        <div class="summary-sub"><strong>${totalFacilityHours} h</strong> RT Facility Time</div>
      </div>
      <div class="summary-card" style="border-left: 4px solid #0ea5e9;">
        <div class="summary-label">Preclinical & Clinical Imaging</div>
        <div class="summary-value">${totalScans + totalClinicalScans} <span style="font-size: 12px; font-weight: normal;">total scans</span></div>
        <div class="summary-sub">${totalAnimals} animals | ${totalScans} preclin (${totalScanHours}h) | ${totalClinicalScans} clin (${totalClinicalScanHours}h)</div>
      </div>
      <div class="summary-card" style="border-left: 4px solid #f59e0b;">
        <div class="summary-label">Bio & In Vitro Assays</div>
        <div class="summary-value">${totalBio} <span style="font-size: 12px; font-weight: normal;">bio studies</span></div>
        <div class="summary-sub">${totalInVitro} in vitro tests</div>
      </div>
    </div>
  `;

  // 3. Tier Packages Summary (if requested)
  if (includeCharts) {
    body += `<div class="section-title">1. Tier Package Milestones & Scope Breakdown</div>`;
    body += `<div class="tier-cards-container">`;
    selectedTiers.forEach(tierNum => {
      const summary = tierSummaries.find(t => t.tierNumber === tierNum);
      const tierConfig = tiers.find(t => t.tierNumber === tierNum);
      if (!summary || !tierConfig) return;

      const tierPhases = filteredRows.filter(r => r.row.tier === tierNum);
      body += `
        <div class="tier-card">
          <div class="tier-card-header">
            <div class="tier-name">Tier ${tierNum}: ${tierConfig.name}</div>
            <div style="font-size: 9.5px; color: #64748b;">${tierConfig.subtitle}</div>
          </div>
          <div class="tier-budget">${formatCurrency(summary.cumulativeTotal)}</div>
          <div style="font-size: 9px; color: #64748b;">Cumulative campaign investment</div>
          <div class="tier-metrics">
            <div>• <strong>RT Batches:</strong> ${summary.totalBatches} | <strong>RT Facility:</strong> ${summary.totalFacilityHours} h</div>
            <div>• <strong>Animals:</strong> ${summary.totalAnimals} | <strong>Preclin Scans:</strong> ${summary.totalScans} (${summary.totalScanningHours || 0}h)</div>
            <div>• <strong>Clin Scans:</strong> ${summary.totalClinicalScans || 0} (${summary.totalClinicalScanningHours || 0}h) | <strong>Bio:</strong> ${summary.totalBiodistributions}</div>
            <div>• <strong>In Vitro:</strong> ${summary.totalInVitroTests}</div>
            <div style="margin-top: 4px; color: #334155;"><strong>Phases (${tierPhases.length}):</strong> ${tierPhases.map(p => p.row.phase).join(', ')}</div>
          </div>
        </div>
      `;
    });
    body += `</div>`;
  }

  // 4. Section 2: Core Category Analytics Table
  const getSharePct = (cost: number) => grandTotal > 0 ? ((cost / grandTotal) * 100).toFixed(1) : '0.0';

  body += `<div class="section-title">2. Core Section Cost & Percentage Analytics</div>`;
  body += `
    <table>
      <thead>
        <tr>
          <th style="width: 40%;">Core Budget Category</th>
          <th style="width: 20%;" class="text-right">Total Section Cost ($)</th>
          <th style="width: 15%;" class="text-right">Share of Budget (%)</th>
          <th style="width: 25%;">Visual Budget Allocation</th>
        </tr>
      </thead>
      <tbody>
  `;

  const categoryList = [
    { id: 'radiopharmaceuticals', name: '1. Radiopharmaceuticals (Isotopes, Consumables, Reagents, RT Facility)', cost: cat.radiopharmaceuticals, color: '#3730a3' },
    { id: 'animalModels', name: '2. Animal Models (Animals, Housing)', cost: cat.animalModels, color: '#065f46' },
    { id: 'preclinicalImaging', name: '3. Preclinical Imaging (Consumables, Reagents, Scan Facility, Analysis)', cost: cat.preclinicalImaging, color: '#075985' },
    { id: 'clinicalImaging', name: '4. Clinical Imaging (Consumables, Reagents, Scan Facility, Analysis)', cost: cat.clinicalImaging, color: '#0284c7' },
    { id: 'biodistribution', name: '5. Biodistribution (Consumables, Reagents, Processing)', cost: cat.biodistribution, color: '#92400e' },
    { id: 'inVitro', name: '6. In Vitro (Cell line, Consumables, Reagents, Testing)', cost: cat.inVitro, color: '#86198f' },
    { id: 'others', name: '7. Others / Miscellaneous', cost: cat.others, color: '#475569' }
  ];

  categoryList.forEach(item => {
    if (!isCatActive(item.id as CostCategoryId)) return;
    const pct = getSharePct(item.cost);
    body += `
      <tr>
        <td><strong>${item.name}</strong></td>
        <td class="text-right font-mono font-bold">${formatCurrency(item.cost)}</td>
        <td class="text-right font-mono">${pct}%</td>
        <td>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${pct}%; background-color: ${item.color};"></div>
          </div>
        </td>
      </tr>
    `;
  });

  body += `
      <tr class="totals-row bg-emerald-subtle">
        <td><strong>GRAND TOTAL CAMPAIGN BUDGET</strong></td>
        <td class="text-right font-mono font-bold text-emerald" style="font-size: 11px;">${formatCurrency(grandTotal)}</td>
        <td class="text-right font-mono font-bold text-emerald">100.0%</td>
        <td><div class="progress-bar-bg"><div class="progress-bar-fill" style="width: 100%; background: #047857;"></div></div></td>
      </tr>
    </tbody>
    </table>
  `;

  // 5. Section 3: Domain Category Split Tables (if requested)
  if (includeCategoryTables) {
    body += `<div class="section-title">3. Domain Category Split Tables</div>`;

    if (isCatActive('radiopharmaceuticals')) {
      body += `
        <h4 style="color: #3730a3; margin: 10px 0 4px 0;">3.1 Radiopharmaceuticals (Isotopes, Consumables, Reagents, RT Facility Rates & Batches)</h4>
        <table>
          <thead>
            <tr>
              <th style="width: 8%;">Tier</th>
              <th style="width: 22%;">Phase Name</th>
              <th style="width: 12%;" class="text-right th-radio">Isotope ($/b)</th>
              <th style="width: 12%;" class="text-right th-radio">Consumables ($/b)</th>
              <th style="width: 12%;" class="text-right th-radio">Reagents ($/b)</th>
              <th style="width: 10%;" class="text-right th-radio">Batches (n_b)</th>
              <th style="width: 12%;" class="text-right th-radio">RT Facility ($/h)</th>
              <th style="width: 12%;" class="text-right th-radio">Task Time (h/b)</th>
              <th style="width: 14%;" class="text-right th-radio">Radio Total ($)</th>
            </tr>
          </thead>
          <tbody>
      `;
      filteredRows.forEach(c => {
        body += `
          <tr>
            <td class="text-center">Tier ${c.row.tier}</td>
            <td><strong>${c.row.phase}</strong></td>
            <td class="text-right font-mono">${formatCurrency(c.row.isotopeCostPerBatch)}</td>
            <td class="text-right font-mono">${formatCurrency(c.row.radiopharmConsumablesPerBatch)}</td>
            <td class="text-right font-mono">${formatCurrency(c.row.radiopharmReagentsPerBatch)}</td>
            <td class="text-right font-mono font-bold">${c.row.numBatches}</td>
            <td class="text-right font-mono">${formatCurrency(c.row.radiopharmFacilityCostPerHour)}</td>
            <td class="text-right font-mono">${c.row.radiopharmTaskTimeHoursPerBatch} h</td>
            <td class="text-right font-mono font-bold text-indigo">${formatCurrency(c.radiopharmaceuticalsTotal)}</td>
          </tr>
        `;
      });
      body += `
          <tr class="totals-row">
            <td colspan="5"><strong>RADIOPHARMACEUTICALS SUBTOTALS</strong></td>
            <td class="text-right font-mono font-bold">${totalBatches}</td>
            <td colspan="2" class="text-right font-mono">${totalFacilityHours} total hours</td>
            <td class="text-right font-mono font-bold text-indigo">${formatCurrency(cat.radiopharmaceuticals)}</td>
          </tr>
        </tbody>
        </table>
      `;
    }

    if (isCatActive('animalModels')) {
      body += `
        <h4 style="color: #065f46; margin: 10px 0 4px 0;">3.2 Animal Models (Subjects & Housing)</h4>
        <table>
          <thead>
            <tr>
              <th style="width: 8%;">Tier</th>
              <th style="width: 25%;">Phase Name</th>
              <th style="width: 15%;" class="text-right th-animal">Animals (n_a)</th>
              <th style="width: 18%;" class="text-right th-animal">Animal Purchase ($/a)</th>
              <th style="width: 18%;" class="text-right th-animal">Housing Cost ($/a)</th>
              <th style="width: 16%;" class="text-right th-animal">Animal Subtotal ($)</th>
            </tr>
          </thead>
          <tbody>
      `;
      filteredRows.forEach(c => {
        body += `
          <tr>
            <td class="text-center">Tier ${c.row.tier}</td>
            <td><strong>${c.row.phase}</strong></td>
            <td class="text-right font-mono font-bold">${c.row.numAnimals}</td>
            <td class="text-right font-mono">${formatCurrency(c.row.animalCostEach)}</td>
            <td class="text-right font-mono">${formatCurrency(c.row.housingCostEach)}</td>
            <td class="text-right font-mono font-bold" style="color: #065f46;">${formatCurrency(c.animalModelsTotal)}</td>
          </tr>
        `;
      });
      body += `
          <tr class="totals-row">
            <td colspan="2"><strong>ANIMAL MODELS SUBTOTALS</strong></td>
            <td class="text-right font-mono font-bold">${totalAnimals}</td>
            <td colspan="2"></td>
            <td class="text-right font-mono font-bold" style="color: #065f46;">${formatCurrency(cat.animalModels)}</td>
          </tr>
        </tbody>
        </table>
      `;
    }

    if (isCatActive('preclinicalImaging')) {
      body += `
        <h4 style="color: #075985; margin: 10px 0 4px 0;">3.3 Preclinical In Vivo Imaging Scans & Image Analysis</h4>
        <table>
          <thead>
            <tr>
              <th style="width: 8%;">Tier</th>
              <th style="width: 20%;">Phase Name</th>
              <th style="width: 10%;" class="text-right th-imaging">Consumables ($/s)</th>
              <th style="width: 10%;" class="text-right th-imaging">Reagents ($/s)</th>
              <th style="width: 9%;" class="text-right th-imaging">Scans (n_s)</th>
              <th style="width: 10%;" class="text-right th-imaging">Scan Cost ($/h)</th>
              <th style="width: 9%;" class="text-right th-imaging">Scan Time (h/s)</th>
              <th style="width: 10%;" class="text-right th-imaging">Analysis (h/s)</th>
              <th style="width: 10%;" class="text-right th-imaging">Analysis ($/h)</th>
              <th style="width: 12%;" class="text-right th-imaging">Preclin. Total ($)</th>
            </tr>
          </thead>
          <tbody>
      `;
      filteredRows.forEach(c => {
        body += `
          <tr>
            <td class="text-center">Tier ${c.row.tier}</td>
            <td><strong>${c.row.phase}</strong></td>
            <td class="text-right font-mono">${formatCurrency(c.row.imagingConsumablesPerScan)}</td>
            <td class="text-right font-mono">${formatCurrency(c.row.imagingReagentsPerScan)}</td>
            <td class="text-right font-mono font-bold">${c.row.numScans}</td>
            <td class="text-right font-mono">${formatCurrency(c.row.scanCostPerHour)}</td>
            <td class="text-right font-mono">${c.row.scanTimeHoursPerScan} h</td>
            <td class="text-right font-mono">${c.row.imageAnalysisHoursPerScan} h</td>
            <td class="text-right font-mono">${formatCurrency(c.row.imageAnalysisCostPerHour)}</td>
            <td class="text-right font-mono font-bold" style="color: #075985;">${formatCurrency(c.preclinicalImagingTotal)}</td>
          </tr>
        `;
      });
      body += `
          <tr class="totals-row">
            <td colspan="4"><strong>PRECLINICAL IMAGING SUBTOTALS</strong></td>
            <td class="text-right font-mono font-bold">${totalScans}</td>
            <td colspan="4" class="text-right font-mono">${totalScanHours} total scanner hours</td>
            <td class="text-right font-mono font-bold" style="color: #075985;">${formatCurrency(cat.preclinicalImaging)}</td>
          </tr>
        </tbody>
        </table>
      `;
    }

    if (isCatActive('clinicalImaging')) {
      body += `
        <h4 style="color: #0284c7; margin: 10px 0 4px 0;">3.4 Clinical Imaging Scans & Analysis</h4>
        <table>
          <thead>
            <tr>
              <th style="width: 8%;">Tier</th>
              <th style="width: 20%;">Phase Name</th>
              <th style="width: 10%;" class="text-right th-imaging">Consumables ($/cs)</th>
              <th style="width: 10%;" class="text-right th-imaging">Reagents ($/cs)</th>
              <th style="width: 9%;" class="text-right th-imaging">Scans (n_cs)</th>
              <th style="width: 10%;" class="text-right th-imaging">Scan Cost ($/h)</th>
              <th style="width: 9%;" class="text-right th-imaging">Scan Time (h/cs)</th>
              <th style="width: 10%;" class="text-right th-imaging">Analysis (h/cs)</th>
              <th style="width: 10%;" class="text-right th-imaging">Analysis ($/h)</th>
              <th style="width: 12%;" class="text-right th-imaging">Clinical Total ($)</th>
            </tr>
          </thead>
          <tbody>
      `;
      filteredRows.forEach(c => {
        body += `
          <tr>
            <td class="text-center">Tier ${c.row.tier}</td>
            <td><strong>${c.row.phase}</strong></td>
            <td class="text-right font-mono">${formatCurrency(c.row.clinicalImagingConsumablesPerScan)}</td>
            <td class="text-right font-mono">${formatCurrency(c.row.clinicalImagingReagentsPerScan)}</td>
            <td class="text-right font-mono font-bold">${c.row.numClinicalScans}</td>
            <td class="text-right font-mono">${formatCurrency(c.row.clinicalScanCostPerHour)}</td>
            <td class="text-right font-mono">${c.row.clinicalScanTimeHoursPerScan} h</td>
            <td class="text-right font-mono">${c.row.clinicalImageAnalysisHoursPerScan} h</td>
            <td class="text-right font-mono">${formatCurrency(c.row.clinicalImageAnalysisCostPerHour)}</td>
            <td class="text-right font-mono font-bold" style="color: #0284c7;">${formatCurrency(c.clinicalImagingTotal)}</td>
          </tr>
        `;
      });
      body += `
          <tr class="totals-row">
            <td colspan="4"><strong>CLINICAL IMAGING SUBTOTALS</strong></td>
            <td class="text-right font-mono font-bold">${totalClinicalScans}</td>
            <td colspan="4" class="text-right font-mono">${totalClinicalScanHours} total scanner hours</td>
            <td class="text-right font-mono font-bold" style="color: #0284c7;">${formatCurrency(cat.clinicalImaging)}</td>
          </tr>
        </tbody>
        </table>
      `;
    }

    if (isCatActive('biodistribution')) {
      body += `
        <h4 style="color: #92400e; margin: 10px 0 4px 0;">3.5 Ex Vivo Biodistribution Studies</h4>
        <table>
          <thead>
            <tr>
              <th style="width: 8%;">Tier</th>
              <th style="width: 25%;">Phase Name</th>
              <th style="width: 16%;" class="text-right th-bio">Consumables ($/bio)</th>
              <th style="width: 16%;" class="text-right th-bio">Reagents ($/bio)</th>
              <th style="width: 12%;" class="text-right th-bio">Studies (n_bio)</th>
              <th style="width: 16%;" class="text-right th-bio">Unit Cost ($/bio)</th>
              <th style="width: 16%;" class="text-right th-bio">Bio Total ($)</th>
            </tr>
          </thead>
          <tbody>
      `;
      filteredRows.forEach(c => {
        body += `
          <tr>
            <td class="text-center">Tier ${c.row.tier}</td>
            <td><strong>${c.row.phase}</strong></td>
            <td class="text-right font-mono">${formatCurrency(c.row.bioConsumablesPerBio)}</td>
            <td class="text-right font-mono">${formatCurrency(c.row.bioReagentsPerBio)}</td>
            <td class="text-right font-mono font-bold">${c.row.numBiodistributions}</td>
            <td class="text-right font-mono">${formatCurrency(c.row.bioCostPerUnit)}</td>
            <td class="text-right font-mono font-bold" style="color: #92400e;">${formatCurrency(c.biodistributionTotal)}</td>
          </tr>
        `;
      });
      body += `
          <tr class="totals-row">
            <td colspan="4"><strong>BIODISTRIBUTION SUBTOTALS</strong></td>
            <td class="text-right font-mono font-bold">${totalBio}</td>
            <td></td>
            <td class="text-right font-mono font-bold" style="color: #92400e;">${formatCurrency(cat.biodistribution)}</td>
          </tr>
        </tbody>
        </table>
      `;
    }

    if (isCatActive('inVitro')) {
      body += `
        <h4 style="color: #86198f; margin: 10px 0 4px 0;">3.6 In Vitro Binding & Assay Studies</h4>
        <table>
          <thead>
            <tr>
              <th style="width: 8%;">Tier</th>
              <th style="width: 22%;">Phase Name</th>
              <th style="width: 13%;" class="text-right th-invitro">Cell Line ($)</th>
              <th style="width: 13%;" class="text-right th-invitro">Consumables ($/t)</th>
              <th style="width: 13%;" class="text-right th-invitro">Reagents ($/t)</th>
              <th style="width: 11%;" class="text-right th-invitro">Tests (n_t)</th>
              <th style="width: 14%;" class="text-right th-invitro">In Vitro Total ($)</th>
            </tr>
          </thead>
          <tbody>
      `;
      filteredRows.forEach(c => {
        body += `
          <tr>
            <td class="text-center">Tier ${c.row.tier}</td>
            <td><strong>${c.row.phase}</strong></td>
            <td class="text-right font-mono">${formatCurrency(c.row.cellLineCost)}</td>
            <td class="text-right font-mono">${formatCurrency(c.row.inVitroConsumablesPerTest)}</td>
            <td class="text-right font-mono">${formatCurrency(c.row.inVitroReagentsPerTest)}</td>
            <td class="text-right font-mono font-bold">${c.row.numInVitroTests}</td>
            <td class="text-right font-mono font-bold" style="color: #86198f;">${formatCurrency(c.inVitroTotal)}</td>
          </tr>
        `;
      });
      body += `
          <tr class="totals-row">
            <td colspan="5"><strong>IN VITRO ASSAYS SUBTOTALS</strong></td>
            <td class="text-right font-mono font-bold">${totalInVitro}</td>
            <td class="text-right font-mono font-bold" style="color: #86198f;">${formatCurrency(cat.inVitro)}</td>
          </tr>
        </tbody>
        </table>
      `;
    }

    if (isCatActive('others')) {
      body += `
        <h4 style="color: #475569; margin: 10px 0 4px 0;">3.7 Other Specialized & Miscellaneous Costs</h4>
        <table>
          <thead>
            <tr>
              <th style="width: 8%;">Tier</th>
              <th style="width: 25%;">Phase Name</th>
              <th style="width: 45%;">Cost Description & Itemized Notes</th>
              <th style="width: 22%;" class="text-right th-others">Others Cost ($)</th>
            </tr>
          </thead>
          <tbody>
      `;
      filteredRows.forEach(c => {
        body += `
          <tr>
            <td class="text-center">Tier ${c.row.tier}</td>
            <td><strong>${c.row.phase}</strong></td>
            <td>${c.row.othersNotes || '—'}</td>
            <td class="text-right font-mono font-bold">${formatCurrency(c.row.othersCost)}</td>
          </tr>
        `;
      });
      body += `
          <tr class="totals-row">
            <td colspan="3"><strong>OTHERS SUBTOTAL</strong></td>
            <td class="text-right font-mono font-bold">${formatCurrency(cat.others)}</td>
          </tr>
        </tbody>
        </table>
      `;
    }
  }

  // 6. Section 4: Summarized Matrix Table (if requested)
  if (includeSummarizedMatrix) {
    body += `<div class="section-title">4. Summarized Campaign Matrix Table</div>`;
    body += `
      <table>
        <thead>
          <tr>
            <th style="width: 6%;">Tier</th>
            <th style="width: 18%;">Phase Name</th>
            ${isCatActive('radiopharmaceuticals') ? '<th style="width: 10%;" class="text-right th-radio">Radio Total ($)</th>' : ''}
            ${isCatActive('animalModels') ? '<th style="width: 10%;" class="text-right th-animal">Animal Total ($)</th>' : ''}
            ${isCatActive('preclinicalImaging') ? '<th style="width: 10%;" class="text-right th-imaging">Preclin Img ($)</th>' : ''}
            ${isCatActive('clinicalImaging') ? '<th style="width: 10%;" class="text-right th-imaging">Clin Img ($)</th>' : ''}
            ${isCatActive('biodistribution') ? '<th style="width: 10%;" class="text-right th-bio">Bio Total ($)</th>' : ''}
            ${isCatActive('inVitro') ? '<th style="width: 10%;" class="text-right th-invitro">In Vitro Total ($)</th>' : ''}
            ${isCatActive('others') ? '<th style="width: 10%;" class="text-right th-others">Others ($)</th>' : ''}
            <th style="width: 14%;" class="text-right th-total">Phase Total ($)</th>
          </tr>
        </thead>
        <tbody>
    `;

    filteredRows.forEach(c => {
      body += `
        <tr>
          <td class="text-center">Tier ${c.row.tier}</td>
          <td><strong>${c.row.phase}</strong></td>
          ${isCatActive('radiopharmaceuticals') ? `<td class="text-right font-mono">${formatCurrency(c.radiopharmaceuticalsTotal)}</td>` : ''}
          ${isCatActive('animalModels') ? `<td class="text-right font-mono">${formatCurrency(c.animalModelsTotal)}</td>` : ''}
          ${isCatActive('preclinicalImaging') ? `<td class="text-right font-mono">${formatCurrency(c.preclinicalImagingTotal)}</td>` : ''}
          ${isCatActive('clinicalImaging') ? `<td class="text-right font-mono">${formatCurrency(c.clinicalImagingTotal)}</td>` : ''}
          ${isCatActive('biodistribution') ? `<td class="text-right font-mono">${formatCurrency(c.biodistributionTotal)}</td>` : ''}
          ${isCatActive('inVitro') ? `<td class="text-right font-mono">${formatCurrency(c.inVitroTotal)}</td>` : ''}
          ${isCatActive('others') ? `<td class="text-right font-mono">${formatCurrency(c.row.othersCost)}</td>` : ''}
          <td class="text-right font-mono font-bold text-emerald">${formatCurrency(c.totalRowCost)}</td>
        </tr>
      `;
    });

    body += `
        <tr class="totals-row bg-emerald-subtle">
          <td colspan="2"><strong>TOTALS</strong></td>
          ${isCatActive('radiopharmaceuticals') ? `<td class="text-right font-mono font-bold">${formatCurrency(cat.radiopharmaceuticals)}</td>` : ''}
          ${isCatActive('animalModels') ? `<td class="text-right font-mono font-bold">${formatCurrency(cat.animalModels)}</td>` : ''}
          ${isCatActive('preclinicalImaging') ? `<td class="text-right font-mono font-bold">${formatCurrency(cat.preclinicalImaging)}</td>` : ''}
          ${isCatActive('clinicalImaging') ? `<td class="text-right font-mono font-bold">${formatCurrency(cat.clinicalImaging)}</td>` : ''}
          ${isCatActive('biodistribution') ? `<td class="text-right font-mono font-bold">${formatCurrency(cat.biodistribution)}</td>` : ''}
          ${isCatActive('inVitro') ? `<td class="text-right font-mono font-bold">${formatCurrency(cat.inVitro)}</td>` : ''}
          ${isCatActive('others') ? `<td class="text-right font-mono font-bold">${formatCurrency(cat.others)}</td>` : ''}
          <td class="text-right font-mono font-bold text-emerald" style="font-size: 11px;">${formatCurrency(grandTotal)}</td>
        </tr>
      </tbody>
      </table>
    `;
  }

  // 7. Section 5: Itemized Line Item Breakdown (if requested)
  if (includeItemized) {
    const extractedItems = extractAllItemizations(filteredRows.map(c => c.row))
      .filter(group => {
        const catId = CATEGORY_NAME_TO_ID[group.category];
        return catId ? isCatActive(catId) : true;
      });

    if (extractedItems.length > 0) {
      body += `<div class="section-title">5. Itemized Line Item Breakdown</div>`;
      body += `
        <table>
          <thead>
            <tr>
              <th style="width: 7%;">Tier</th>
              <th style="width: 18%;">Phase Name</th>
              <th style="width: 15%;">Category</th>
              <th style="width: 18%;">Parameter Field</th>
              <th style="width: 28%;">Itemized Elements Breakdown</th>
              <th style="width: 14%;" class="text-right">Total Parameter Value</th>
            </tr>
          </thead>
          <tbody>
      `;

      extractedItems.forEach(group => {
        const symbol = group.unitType === 'currency' ? '$' : '';
        const unitSuffix = group.unitType === 'hours' ? ' h' : '';
        const itemsFormatted = group.items
          .map(item => `<strong>${item.name || 'Item'}</strong>: ${symbol}${item.value.toLocaleString()}${unitSuffix}`)
          .join('; ');

        body += `
          <tr>
            <td class="text-center">Tier ${group.tier}</td>
            <td><strong>${group.phaseName}</strong></td>
            <td>${group.category}</td>
            <td>${group.fieldLabel}</td>
            <td>${itemsFormatted}</td>
            <td class="text-right font-mono font-bold">${symbol}${group.totalValue.toLocaleString()}${unitSuffix}</td>
          </tr>
        `;
      });

      body += `
          </tbody>
        </table>
      `;
    }
  }

  return body;
}

export function generateHtmlDocument(options: ExportOptions): string {
  const { tracerName } = options;
  const stateJson = JSON.stringify({
    version: 1,
    app: 'RadiotracerCampaignEstimator',
    timestamp: new Date().toISOString(),
    tracerName,
    tiers: options.tiers,
    rows: options.calculatedRows.map(c => c.row),
    activeCostCategories: options.activeCostCategories
  });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${tracerName} - Campaign Budget Report</title>
  <style>
    ${getReportStyles()}
  </style>
  <script id="radiotracer-applet-state" type="application/json">${stateJson}</script>
  <!-- RADIOTRACER_APPLET_STATE: ${stateJson} -->
</head>
<body>
  <div class="SectionLandscape">
    ${generateHtmlBody(options)}
  </div>
</body>
</html>`;
}

export function exportToHtml(options: ExportOptions): void {
  const sanitizeName = (options.tracerName.trim() || 'Radiotracer').replace(/[^a-zA-Z0-9_-]/g, '_');
  const isAllTiers = options.selectedTiers.length === options.tiers.length;
  const tierLabel = isAllTiers ? `All_Tiers_1-${options.tiers.length}` : `Tiers_${options.selectedTiers.sort((a, b) => a - b).join('_')}`;

  const htmlDoc = generateHtmlDocument(options);
  const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeName}_Report_${tierLabel}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export function exportToWord(options: ExportOptions): void {
  const { tracerName, tiers, selectedTiers } = options;
  const sanitizeName = (tracerName.trim() || 'Radiotracer').replace(/[^a-zA-Z0-9_-]/g, '_');
  const isAllTiers = selectedTiers.length === tiers.length;
  const tierLabel = isAllTiers ? `All_Tiers_1-${tiers.length}` : `Tiers_${selectedTiers.sort((a, b) => a - b).join('_')}`;

  const bodyContent = generateHtmlBody(options);
  const stateJson = JSON.stringify({
    version: 1,
    app: 'RadiotracerCampaignEstimator',
    timestamp: new Date().toISOString(),
    tracerName,
    tiers: options.tiers,
    rows: options.calculatedRows.map(c => c.row),
    activeCostCategories: options.activeCostCategories
  });

  const wordDocument = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>${tracerName} - Campaign Budget Report</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    ${getReportStyles()}
  </style>
  <script id="radiotracer-applet-state" type="application/json">${stateJson}</script>
  <!-- RADIOTRACER_APPLET_STATE: ${stateJson} -->
</head>
<body style="tab-interval:.5in">
  <div class="SectionLandscape">
    ${bodyContent}
  </div>
</body>
</html>`;

  const blob = new Blob(['\ufeff' + wordDocument], { type: 'application/msword;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeName}_Campaign_${tierLabel}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
