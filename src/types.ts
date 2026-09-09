export type CostCategoryId = 
  | 'radiopharmaceuticals'
  | 'animalModels'
  | 'preclinicalImaging'
  | 'clinicalImaging'
  | 'biodistribution'
  | 'inVitro'
  | 'others';

export interface CostCategoryDefinition {
  id: CostCategoryId;
  label: string;
  shortLabel: string;
  number: number;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  activeBg: string;
  themeColor: string;
  description: string;
  colSpan: number;
  subfieldsSummary: string;
}

export const ALL_COST_CATEGORY_IDS: CostCategoryId[] = [
  'radiopharmaceuticals',
  'animalModels',
  'preclinicalImaging',
  'clinicalImaging',
  'biodistribution',
  'inVitro',
  'others',
];

export const COST_CATEGORY_DEFINITIONS: Record<CostCategoryId, CostCategoryDefinition> = {
  radiopharmaceuticals: {
    id: 'radiopharmaceuticals',
    label: '1. Radiopharmaceuticals',
    shortLabel: 'Radiopharm',
    number: 1,
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-900',
    borderColor: 'border-indigo-300',
    activeBg: 'bg-indigo-50/80',
    themeColor: '#6366f1',
    description: 'Isotopes, consumables, reagents, batches, facility rates & synthesis task times',
    colSpan: 7,
    subfieldsSummary: '7 columns (Isotope, Consumables, Reagents, Batches, Facility $/h, Task time, Subtotal)',
  },
  animalModels: {
    id: 'animalModels',
    label: '2. Animal models',
    shortLabel: 'Animals',
    number: 2,
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-900',
    borderColor: 'border-purple-300',
    activeBg: 'bg-purple-50/80',
    themeColor: '#a855f7',
    description: 'Animal cohort quantities (n_a), acquisition costs & daily housing rates',
    colSpan: 4,
    subfieldsSummary: '4 columns (Animals n_a, Animal $/a, Housing $/a, Subtotal)',
  },
  preclinicalImaging: {
    id: 'preclinicalImaging',
    label: '3. Preclinical Imaging',
    shortLabel: 'Preclin Img',
    number: 3,
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
    borderColor: 'border-amber-300',
    activeBg: 'bg-amber-50/80',
    themeColor: '#f59e0b',
    description: 'Animal cohort scans (n_s), scan consumables, reagents, scanner rates & image analysis',
    colSpan: 8,
    subfieldsSummary: '8 columns (Consumables, Reagents, Scans n_s, Scan $/h, Scan time, Analysis h, Analysis $/h, Subtotal)',
  },
  clinicalImaging: {
    id: 'clinicalImaging',
    label: '4. Clinical Imaging',
    shortLabel: 'Clin Img',
    number: 4,
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-950',
    borderColor: 'border-sky-300',
    activeBg: 'bg-sky-50/80',
    themeColor: '#0284c7',
    description: 'Human clinical scans (n_cs), consumables, reagents, clinical scanner rates & image analysis',
    colSpan: 8,
    subfieldsSummary: '8 columns (Consumables $/cs, Reagents $/cs, Scans n_cs, Scan $/h, Scan time h/cs, Analysis h/cs, Analysis $/h, Subtotal)',
  },
  biodistribution: {
    id: 'biodistribution',
    label: '5. Biodistribution',
    shortLabel: 'Biodistribution',
    number: 5,
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-900',
    borderColor: 'border-emerald-300',
    activeBg: 'bg-emerald-50/80',
    themeColor: '#10b981',
    description: 'Organ harvest timepoints (n_bio), tissue reagents, processing consumables & unit costs',
    colSpan: 5,
    subfieldsSummary: '5 columns (Consumables, Reagents, Biodist. n_bio, Bio Cost $/u, Subtotal)',
  },
  inVitro: {
    id: 'inVitro',
    label: '6. In Vitro',
    shortLabel: 'In Vitro',
    number: 6,
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-900',
    borderColor: 'border-teal-300',
    activeBg: 'bg-teal-50/80',
    themeColor: '#14b8a6',
    description: 'Cell line purchases, binding assays (n_t), test consumables & testing labor rates',
    colSpan: 7,
    subfieldsSummary: '7 columns (Cell line $, Consumables, Reagents, Tests n_t, Testing h, Testing $/h, Subtotal)',
  },
  others: {
    id: 'others',
    label: '7. Others',
    shortLabel: 'Others',
    number: 7,
    badgeBg: 'bg-slate-200',
    badgeText: 'text-slate-800',
    borderColor: 'border-slate-300',
    activeBg: 'bg-slate-100',
    themeColor: '#64748b',
    description: 'Other direct consumables, custom vendor services & itemized specifications',
    colSpan: 2,
    subfieldsSummary: '2 columns (Cost $, Note Others)',
  },
};

export interface CellItem {
  id: string;
  name: string;
  value: number;
}

export type CellItemizations = Record<string, CellItem[]>;

export interface PhaseRow {
  id: string;
  tier: number; // Tier sequence ID / number (1, 2, 3, 4...)
  phase: string;
  description: string;

  // 1. Radiopharmaceuticals ("b" = batch, "h" = hours)
  isotopeCostPerBatch: number;             // "Isotope, $/b"
  radiopharmConsumablesPerBatch: number;   // "Consumables, $/b"
  radiopharmReagentsPerBatch: number;      // "Reagents, $/b"
  numBatches: number;                      // "Batches, n_b"
  radiopharmFacilityCostPerHour: number;   // "Facility, $/h"
  radiopharmTaskTimeHoursPerBatch: number; // "Task time, h/b"

  // 2. Animal models ("a" = animal)
  numAnimals: number;                      // "Animals, n_a"
  animalCostEach: number;                  // "Animals, $/a"
  housingCostEach: number;                 // "Housing, $/a"

  // 3. Preclinical Imaging ("s" = scan)
  imagingConsumablesPerScan: number;       // "Consumables, $/s"
  imagingReagentsPerScan: number;          // "Reagents, $/s"
  numScans: number;                        // "Scans, n_s" (n_s <= n_a)
  scanCostPerHour: number;                 // "Scan cost, $/h"
  scanTimeHoursPerScan: number;            // "Scan time, h/s"
  imageAnalysisHoursPerScan: number;       // "Image analysis, h/s"
  imageAnalysisCostPerHour: number;        // "Image analysis, $/h"

  // 4. Clinical Imaging ("cs" = clinical scan)
  clinicalImagingConsumablesPerScan: number;       // "Consumables, $/cs"
  clinicalImagingReagentsPerScan: number;          // "Reagents, $/cs"
  numClinicalScans: number;                        // "Scans, n_cs" (no animal warning)
  clinicalScanCostPerHour: number;                 // "Scan cost, $/h"
  clinicalScanTimeHoursPerScan: number;            // "Scan time, h/cs"
  clinicalImageAnalysisHoursPerScan: number;       // "Image analysis, h/cs"
  clinicalImageAnalysisCostPerHour: number;        // "Image analysis, $/h"

  // 5. Biodistribution ("bio" = biodistribution)
  bioConsumablesPerBio: number;            // "Consumables, $/bio"
  bioReagentsPerBio: number;               // "Reagents, $/bio"
  numBiodistributions: number;             // "Biodistributions, n_bio" (n_bio <= n_a - n_s)
  bioCostPerUnit: number;                  // "Biodistribution cost, $/n_bio"

  // 6. In Vitro ("t" = test)
  cellLineCost: number;                    // "Cell line, $"
  inVitroConsumablesPerTest: number;       // "Consumables, $/t"
  inVitroReagentsPerTest: number;          // "Reagents, $/t"
  numInVitroTests: number;                 // "Tests, n_t"
  inVitroTestingHoursPerTest: number;      // "Testing, h/t"
  inVitroTestingCostPerHour: number;       // "Testing cost, $/h"

  // 7. Others
  othersCost: number;                      // "Cost, $"
  othersNotes?: string;                    // "Note (Others)" - specifically for Others cost
  phaseNotes?: string;                     // "Phase Notes" - for the entire campaign phase
  notes?: string;                          // Legacy fallback alias

  // Itemized breakdowns for any numeric cell field
  itemizations?: CellItemizations;
}

export interface CalculatedRow {
  row: PhaseRow;

  // 7 Section Total Costs
  radiopharmaceuticalsTotal: number;
  animalModelsTotal: number;
  preclinicalImagingTotal: number;
  imagingTotal: number; // legacy alias for preclinicalImagingTotal
  clinicalImagingTotal: number;
  biodistributionTotal: number;
  inVitroTotal: number;
  othersTotal: number;

  // Master Phase Cost
  totalRowCost: number;

  // Animal vs Imaging/Biodistribution Warnings
  scansLessThanAnimals: boolean; // n_s < n_a -> light warning (amber)
  unaccountedAnimals: boolean;   // (n_s + n_bio) < n_a -> strong warning (red/rose)
  unaccountedCount: number;      // n_a - (n_s + n_bio)
}

export interface CostCategorySummary {
  radiopharmaceuticals: number;
  animalModels: number;
  preclinicalImaging: number;
  imaging?: number; // legacy alias
  clinicalImaging: number;
  biodistribution: number;
  inVitro: number;
  others: number;
  grandTotal: number;
}

export interface TierConfig {
  tierNumber: number;
  name: string;
  subtitle: string;
}

export interface TierSummary {
  tierNumber: number;
  name: string;
  subtitle: string;
  addedCost: number;
  cumulativeTotal: number;
  totalBatches: number;
  totalFacilityHours: number;
  totalAnimals: number;
  totalScans: number;
  totalClinicalScans?: number;
  totalScanningHours?: number;
  totalClinicalScanningHours?: number;
  totalBiodistributions: number;
  totalInVitroTests: number;
  phaseCount: number;
  warningCount: number;
}

export interface TracerPreset {
  id: string;
  name: string;
  halfLife: string;
  targetType: string;
  defaultTiers: TierConfig[];
  defaultRows: PhaseRow[];
}
