import { PhaseRow, CalculatedRow, CostCategorySummary, TierConfig, TierSummary, CostCategoryId } from '../types';

/**
 * Calculates all derived values and 6 section cost components for a single phase row:
 * 
 * 1. Radiopharmaceuticals Total:
 *    = numBatches * [ (Isotope + Consumables + Reagents) + (Facility $/h * Task time h/b) ]
 * 
 * 2. Animal Models Total:
 *    = numAnimals * (Animal Cost $/a + Housing Cost $/a)
 * 
 * 3. Imaging Total:
 *    = numScans * [ (Consumables $/s + Reagents $/s) + (Scan Cost $/h * Scan Time h/s) + (Image Analysis $/h * Image Analysis h/s) ]
 *    Rules:
 *      - numScans (n_s) <= numAnimals (n_a)
 *      - If n_s < n_a -> Light Warning (scansLessThanAnimals = true)
 * 
 * 4. Biodistribution Total:
 *    = numBiodistributions * (Consumables $/bio + Reagents $/bio + Bio Cost $/n_bio)
 *    Rules:
 *      - numBiodistributions (n_bio) <= (numAnimals - numScans)
 *      - If (n_s + n_bio) < n_a -> Strong Warning (unaccountedAnimals = true)
 * 
 * 5. In Vitro Total:
 *    = Cell Line ($) + numInVitroTests * [ (Consumables $/t + Reagents $/t) + (Testing Cost $/h * Testing h/t) ]
 * 
 * 6. Others Total:
 *    = othersCost
 * 
 * Master Phase Row Total:
 *    = Sum of subtotals for all active/selected cost categories
 */
export function calculateRowCosts(row: PhaseRow, activeCategories?: CostCategoryId[]): CalculatedRow {
  // 1. Radiopharmaceuticals
  const batchMaterialCost = (row.isotopeCostPerBatch || 0) + 
                            (row.radiopharmConsumablesPerBatch || 0) + 
                            (row.radiopharmReagentsPerBatch || 0);
  const facilityTimeCostPerBatch = (row.radiopharmFacilityCostPerHour || 0) * (row.radiopharmTaskTimeHoursPerBatch || 0);
  const radiopharmaceuticalsTotal = (row.numBatches || 0) * (batchMaterialCost + facilityTimeCostPerBatch);

  // 2. Animal models
  const costPerAnimal = (row.animalCostEach || 0) + (row.housingCostEach || 0);
  const animalModelsTotal = (row.numAnimals || 0) * costPerAnimal;

  // 3. Preclinical Imaging
  const scanMaterialCost = (row.imagingConsumablesPerScan || 0) + (row.imagingReagentsPerScan || 0);
  const scanFacilityCost = (row.scanCostPerHour || 0) * (row.scanTimeHoursPerScan || 0);
  const imageAnalysisCost = (row.imageAnalysisCostPerHour || 0) * (row.imageAnalysisHoursPerScan || 0);
  const preclinicalImagingTotal = (row.numScans || 0) * (scanMaterialCost + scanFacilityCost + imageAnalysisCost);
  const imagingTotal = preclinicalImagingTotal; // legacy alias

  // 4. Clinical Imaging (no animal involvement)
  const clinicalScanMaterialCost = (row.clinicalImagingConsumablesPerScan || 0) + (row.clinicalImagingReagentsPerScan || 0);
  const clinicalScanFacilityCost = (row.clinicalScanCostPerHour || 0) * (row.clinicalScanTimeHoursPerScan || 0);
  const clinicalImageAnalysisCost = (row.clinicalImageAnalysisCostPerHour || 0) * (row.clinicalImageAnalysisHoursPerScan || 0);
  const clinicalImagingTotal = (row.numClinicalScans || 0) * (clinicalScanMaterialCost + clinicalScanFacilityCost + clinicalImageAnalysisCost);

  // 5. Biodistribution
  const bioUnitCost = (row.bioConsumablesPerBio || 0) + (row.bioReagentsPerBio || 0) + (row.bioCostPerUnit || 0);
  const biodistributionTotal = (row.numBiodistributions || 0) * bioUnitCost;

  // 6. In Vitro
  const inVitroMaterialCost = (row.inVitroConsumablesPerTest || 0) + (row.inVitroReagentsPerTest || 0);
  const inVitroTestingCost = (row.inVitroTestingCostPerHour || 0) * (row.inVitroTestingHoursPerTest || 0);
  const inVitroTotal = (row.cellLineCost || 0) + ((row.numInVitroTests || 0) * (inVitroMaterialCost + inVitroTestingCost));

  // 7. Others
  const othersTotal = (row.othersCost || 0);

  // Total Row Cost based on active cost categories
  const isCatActive = (id: CostCategoryId) => !activeCategories || activeCategories.includes(id) || (id === 'preclinicalImaging' && (activeCategories as any).includes('imaging'));

  let totalRowCost = 0;
  if (isCatActive('radiopharmaceuticals')) totalRowCost += radiopharmaceuticalsTotal;
  if (isCatActive('animalModels')) totalRowCost += animalModelsTotal;
  if (isCatActive('preclinicalImaging')) totalRowCost += preclinicalImagingTotal;
  if (isCatActive('clinicalImaging')) totalRowCost += clinicalImagingTotal;
  if (isCatActive('biodistribution')) totalRowCost += biodistributionTotal;
  if (isCatActive('inVitro')) totalRowCost += inVitroTotal;
  if (isCatActive('others')) totalRowCost += othersTotal;

  // Animal balance & Warning logic (only active when preclinical animal/imaging categories are active)
  // Scans, n_cs are clinical and have NO warning calculation as animals are not involved.
  const n_a = row.numAnimals || 0;
  const n_s = row.numScans || 0;
  const n_bio = row.numBiodistributions || 0;

  const hasAnimals = isCatActive('animalModels');
  const hasScansOrBio = isCatActive('preclinicalImaging') || isCatActive('biodistribution');

  const isAllAccounted = n_a === 0 || (n_s + n_bio) >= n_a;

  const unaccountedAnimals = hasAnimals && hasScansOrBio && !isAllAccounted;
  const scansLessThanAnimals = hasAnimals && isCatActive('preclinicalImaging') && !isAllAccounted && n_s < n_a;
  const unaccountedCount = Math.max(0, n_a - (n_s + n_bio));

  return {
    row,
    radiopharmaceuticalsTotal,
    animalModelsTotal,
    preclinicalImagingTotal,
    imagingTotal,
    clinicalImagingTotal,
    biodistributionTotal,
    inVitroTotal,
    othersTotal,
    totalRowCost,
    scansLessThanAnimals,
    unaccountedAnimals,
    unaccountedCount
  };
}

/**
 * Computes cost category breakdown across all calculated rows (filtered by active categories)
 */
export function calculateCategoryBreakdown(
  calculatedRows: CalculatedRow[],
  activeCategories?: CostCategoryId[]
): CostCategorySummary {
  const isCatActive = (id: CostCategoryId) => !activeCategories || activeCategories.includes(id) || (id === 'preclinicalImaging' && (activeCategories as any).includes('imaging'));

  return calculatedRows.reduce(
    (acc, c) => {
      const radio = isCatActive('radiopharmaceuticals') ? c.radiopharmaceuticalsTotal : 0;
      const animals = isCatActive('animalModels') ? c.animalModelsTotal : 0;
      const preclinImg = isCatActive('preclinicalImaging') ? c.preclinicalImagingTotal : 0;
      const clinImg = isCatActive('clinicalImaging') ? c.clinicalImagingTotal : 0;
      const bio = isCatActive('biodistribution') ? c.biodistributionTotal : 0;
      const invitro = isCatActive('inVitro') ? c.inVitroTotal : 0;
      const oth = isCatActive('others') ? c.othersTotal : 0;
      const rowSum = radio + animals + preclinImg + clinImg + bio + invitro + oth;

      return {
        radiopharmaceuticals: acc.radiopharmaceuticals + radio,
        animalModels: acc.animalModels + animals,
        preclinicalImaging: acc.preclinicalImaging + preclinImg,
        imaging: acc.imaging !== undefined ? acc.imaging + preclinImg : preclinImg,
        clinicalImaging: acc.clinicalImaging + clinImg,
        biodistribution: acc.biodistribution + bio,
        inVitro: acc.inVitro + invitro,
        others: acc.others + oth,
        grandTotal: acc.grandTotal + rowSum
      };
    },
    {
      radiopharmaceuticals: 0,
      animalModels: 0,
      preclinicalImaging: 0,
      imaging: 0,
      clinicalImaging: 0,
      biodistribution: 0,
      inVitro: 0,
      others: 0,
      grandTotal: 0
    }
  );
}

/**
 * Computes cumulative campaign tier summaries dynamically based on TierConfig[]
 */
export function calculateTierSummaries(calculatedRows: CalculatedRow[], tiers: TierConfig[]): TierSummary[] {
  // Sort tiers by tierNumber
  const sortedTiers = [...tiers].sort((a, b) => a.tierNumber - b.tierNumber);

  return sortedTiers.map(t => {
    // Cumulative rows: all phases in tiers <= current tier level
    const cumulativeRows = calculatedRows.filter(r => r.row.tier <= t.tierNumber);
    // Tier-specific rows: phases in this tier
    const tierRows = calculatedRows.filter(r => r.row.tier === t.tierNumber);

    const addedCost = tierRows.reduce((s, r) => s + r.totalRowCost, 0);
    const cumulativeTotal = cumulativeRows.reduce((s, r) => s + r.totalRowCost, 0);

    const totalBatches = cumulativeRows.reduce((s, r) => s + (r.row.numBatches || 0), 0);
    const totalFacilityHours = cumulativeRows.reduce((s, r) => s + ((r.row.radiopharmTaskTimeHoursPerBatch || 0) * (r.row.numBatches || 0)), 0);
    const totalAnimals = cumulativeRows.reduce((s, r) => s + (r.row.numAnimals || 0), 0);
    const totalScans = cumulativeRows.reduce((s, r) => s + (r.row.numScans || 0), 0);
    const totalClinicalScans = cumulativeRows.reduce((s, r) => s + (r.row.numClinicalScans || 0), 0);
    const totalScanningHours = cumulativeRows.reduce((s, r) => s + ((r.row.scanTimeHoursPerScan || 0) * (r.row.numScans || 0)), 0);
    const totalClinicalScanningHours = cumulativeRows.reduce((s, r) => s + ((r.row.clinicalScanTimeHoursPerScan || 0) * (r.row.numClinicalScans || 0)), 0);
    const totalBiodistributions = cumulativeRows.reduce((s, r) => s + (r.row.numBiodistributions || 0), 0);
    const totalInVitroTests = cumulativeRows.reduce((s, r) => s + (r.row.numInVitroTests || 0), 0);
    const warningCount = cumulativeRows.filter(r => r.unaccountedAnimals || r.scansLessThanAnimals).length;

    return {
      tierNumber: t.tierNumber,
      name: t.name,
      subtitle: t.subtitle,
      addedCost,
      cumulativeTotal,
      totalBatches,
      totalFacilityHours,
      totalAnimals,
      totalScans,
      totalClinicalScans,
      totalScanningHours,
      totalClinicalScanningHours,
      totalBiodistributions,
      totalInVitroTests,
      phaseCount: cumulativeRows.length,
      warningCount
    };
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
}
