import { PhaseRow, TierConfig, TracerPreset } from '../types';

export const DEFAULT_TIERS: TierConfig[] = [
  {
    tierNumber: 1,
    name: 'Basic Package',
    subtitle: 'Radiochemistry Development & Initial Standard Animal In Vivo Studies'
  },
  {
    tierNumber: 2,
    name: 'Mid Tier Package',
    subtitle: 'Extended Biodistribution & Receptor Binding Specificity Characterization'
  },
  {
    tierNumber: 3,
    name: 'Top Tier Package',
    subtitle: 'Radiometabolites Extraction Method Protocol & Advanced In Vivo Analysis'
  }
];

export const FALLYPRIDE_DEFAULT_ROWS: PhaseRow[] = [
  {
    id: 'row-1',
    tier: 1,
    phase: 'Project specific chemicals',
    description: 'Precursor & reference standard synthesis chemicals',
    isotopeCostPerBatch: 0,
    radiopharmConsumablesPerBatch: 0,
    radiopharmReagentsPerBatch: 5000,
    numBatches: 1,
    radiopharmFacilityCostPerHour: 50,
    radiopharmTaskTimeHoursPerBatch: 0,

    numAnimals: 0,
    animalCostEach: 0,
    housingCostEach: 0,

    imagingConsumablesPerScan: 0,
    imagingReagentsPerScan: 0,
    numScans: 0,
    scanCostPerHour: 150,
    scanTimeHoursPerScan: 0,
    imageAnalysisHoursPerScan: 0,
    imageAnalysisCostPerHour: 50,

    clinicalImagingConsumablesPerScan: 0,
    clinicalImagingReagentsPerScan: 0,
    numClinicalScans: 0,
    clinicalScanCostPerHour: 250,
    clinicalScanTimeHoursPerScan: 0,
    clinicalImageAnalysisHoursPerScan: 0,
    clinicalImageAnalysisCostPerHour: 75,

    bioConsumablesPerBio: 0,
    bioReagentsPerBio: 0,
    numBiodistributions: 0,
    bioCostPerUnit: 0,

    cellLineCost: 0,
    inVitroConsumablesPerTest: 0,
    inVitroReagentsPerTest: 0,
    numInVitroTests: 0,
    inVitroTestingHoursPerTest: 0,
    inVitroTestingCostPerHour: 50,

    othersCost: 0,
    othersNotes: '',
    phaseNotes: 'One-off precursor purchase',
    notes: 'One-off precursor purchase'
  },
  {
    id: 'row-2',
    tier: 1,
    phase: 'Radiochemistry Development',
    description: 'Optimization of automated radiolabelling protocol',
    isotopeCostPerBatch: 700,
    radiopharmConsumablesPerBatch: 150,
    radiopharmReagentsPerBatch: 150,
    numBatches: 7,
    radiopharmFacilityCostPerHour: 50,
    radiopharmTaskTimeHoursPerBatch: 6,

    numAnimals: 0,
    animalCostEach: 0,
    housingCostEach: 0,

    imagingConsumablesPerScan: 0,
    imagingReagentsPerScan: 0,
    numScans: 0,
    scanCostPerHour: 150,
    scanTimeHoursPerScan: 0,
    imageAnalysisHoursPerScan: 0,
    imageAnalysisCostPerHour: 50,

    clinicalImagingConsumablesPerScan: 0,
    clinicalImagingReagentsPerScan: 0,
    numClinicalScans: 0,
    clinicalScanCostPerHour: 250,
    clinicalScanTimeHoursPerScan: 0,
    clinicalImageAnalysisHoursPerScan: 0,
    clinicalImageAnalysisCostPerHour: 75,

    bioConsumablesPerBio: 0,
    bioReagentsPerBio: 0,
    numBiodistributions: 0,
    bioCostPerUnit: 0,

    cellLineCost: 0,
    inVitroConsumablesPerTest: 0,
    inVitroReagentsPerTest: 0,
    numInVitroTests: 0,
    inVitroTestingHoursPerTest: 0,
    inVitroTestingCostPerHour: 50,

    othersCost: 0,
    othersNotes: '',
    phaseNotes: 'Method optimization & yield validation',
    notes: 'Method optimization & yield validation'
  },
  {
    id: 'row-3',
    tier: 1,
    phase: '1st Campaign - Standard animal imaging',
    description: '6 animals scanned, baseline PET brain binding',
    isotopeCostPerBatch: 700,
    radiopharmConsumablesPerBatch: 150,
    radiopharmReagentsPerBatch: 150,
    numBatches: 6,
    radiopharmFacilityCostPerHour: 50,
    radiopharmTaskTimeHoursPerBatch: 3,

    numAnimals: 6,
    animalCostEach: 35,
    housingCostEach: 15,

    imagingConsumablesPerScan: 20,
    imagingReagentsPerScan: 30,
    numScans: 6, // n_s = n_a
    scanCostPerHour: 150,
    scanTimeHoursPerScan: 3,
    imageAnalysisHoursPerScan: 0,
    imageAnalysisCostPerHour: 50,

    clinicalImagingConsumablesPerScan: 0,
    clinicalImagingReagentsPerScan: 0,
    numClinicalScans: 0,
    clinicalScanCostPerHour: 250,
    clinicalScanTimeHoursPerScan: 0,
    clinicalImageAnalysisHoursPerScan: 0,
    clinicalImageAnalysisCostPerHour: 75,

    bioConsumablesPerBio: 0,
    bioReagentsPerBio: 0,
    numBiodistributions: 0, // n_bio = 0
    bioCostPerUnit: 0,

    cellLineCost: 0,
    inVitroConsumablesPerTest: 0,
    inVitroReagentsPerTest: 0,
    numInVitroTests: 0,
    inVitroTestingHoursPerTest: 0,
    inVitroTestingCostPerHour: 50,

    othersCost: 0,
    othersNotes: '',
    phaseNotes: 'Baseline PET brain binding in 6 mice',
    notes: 'Baseline PET brain binding in 6 mice'
  },
  {
    id: 'row-4',
    tier: 1,
    phase: '1st Campaign - Standard biodistribution',
    description: '4 animals, ex vivo tissue uptake analysis at 1 timepoint',
    isotopeCostPerBatch: 700,
    radiopharmConsumablesPerBatch: 150,
    radiopharmReagentsPerBatch: 150,
    numBatches: 4,
    radiopharmFacilityCostPerHour: 50,
    radiopharmTaskTimeHoursPerBatch: 3,

    numAnimals: 4,
    animalCostEach: 35,
    housingCostEach: 15,

    imagingConsumablesPerScan: 0,
    imagingReagentsPerScan: 0,
    numScans: 0, // n_s = 0
    scanCostPerHour: 150,
    scanTimeHoursPerScan: 0,
    imageAnalysisHoursPerScan: 0,
    imageAnalysisCostPerHour: 50,

    clinicalImagingConsumablesPerScan: 0,
    clinicalImagingReagentsPerScan: 0,
    numClinicalScans: 0,
    clinicalScanCostPerHour: 250,
    clinicalScanTimeHoursPerScan: 0,
    clinicalImageAnalysisHoursPerScan: 0,
    clinicalImageAnalysisCostPerHour: 75,

    bioConsumablesPerBio: 50,
    bioReagentsPerBio: 50,
    numBiodistributions: 4, // n_bio = n_a - n_s = 4
    bioCostPerUnit: 25,

    cellLineCost: 0,
    inVitroConsumablesPerTest: 0,
    inVitroReagentsPerTest: 0,
    numInVitroTests: 0,
    inVitroTestingHoursPerTest: 0,
    inVitroTestingCostPerHour: 50,

    othersCost: 0,
    othersNotes: '',
    phaseNotes: 'Ex vivo tissue uptake analysis',
    notes: 'Ex vivo tissue uptake analysis'
  },
  {
    id: 'row-5',
    tier: 2,
    phase: '2nd Campaign - Additional biodistribution',
    description: '8 animals, 2 additional tissue clearance time points',
    isotopeCostPerBatch: 700,
    radiopharmConsumablesPerBatch: 150,
    radiopharmReagentsPerBatch: 150,
    numBatches: 8,
    radiopharmFacilityCostPerHour: 50,
    radiopharmTaskTimeHoursPerBatch: 3,

    numAnimals: 8,
    animalCostEach: 35,
    housingCostEach: 15,

    imagingConsumablesPerScan: 0,
    imagingReagentsPerScan: 0,
    numScans: 0,
    scanCostPerHour: 150,
    scanTimeHoursPerScan: 0,
    imageAnalysisHoursPerScan: 0,
    imageAnalysisCostPerHour: 50,

    clinicalImagingConsumablesPerScan: 0,
    clinicalImagingReagentsPerScan: 0,
    numClinicalScans: 0,
    clinicalScanCostPerHour: 250,
    clinicalScanTimeHoursPerScan: 0,
    clinicalImageAnalysisHoursPerScan: 0,
    clinicalImageAnalysisCostPerHour: 75,

    bioConsumablesPerBio: 50,
    bioReagentsPerBio: 50,
    numBiodistributions: 8, // n_bio = n_a - n_s = 8
    bioCostPerUnit: 25,

    cellLineCost: 0,
    inVitroConsumablesPerTest: 0,
    inVitroReagentsPerTest: 0,
    numInVitroTests: 0,
    inVitroTestingHoursPerTest: 0,
    inVitroTestingCostPerHour: 50,

    othersCost: 0,
    othersNotes: '',
    phaseNotes: '2 additional clearance time points',
    notes: '2 additional clearance time points'
  },
  {
    id: 'row-6',
    tier: 2,
    phase: '2nd Campaign - Specificity characterisation',
    description: '12 animals, blocking & competition binding assays',
    isotopeCostPerBatch: 700,
    radiopharmConsumablesPerBatch: 150,
    radiopharmReagentsPerBatch: 150,
    numBatches: 12,
    radiopharmFacilityCostPerHour: 50,
    radiopharmTaskTimeHoursPerBatch: 3,

    numAnimals: 12,
    animalCostEach: 35,
    housingCostEach: 15,

    imagingConsumablesPerScan: 20,
    imagingReagentsPerScan: 30,
    numScans: 12, // n_s = n_a
    scanCostPerHour: 150,
    scanTimeHoursPerScan: 3,
    imageAnalysisHoursPerScan: 0,
    imageAnalysisCostPerHour: 50,

    clinicalImagingConsumablesPerScan: 0,
    clinicalImagingReagentsPerScan: 0,
    numClinicalScans: 0,
    clinicalScanCostPerHour: 250,
    clinicalScanTimeHoursPerScan: 0,
    clinicalImageAnalysisHoursPerScan: 0,
    clinicalImageAnalysisCostPerHour: 75,

    bioConsumablesPerBio: 0,
    bioReagentsPerBio: 0,
    numBiodistributions: 0,
    bioCostPerUnit: 0,

    cellLineCost: 0,
    inVitroConsumablesPerTest: 0,
    inVitroReagentsPerTest: 0,
    numInVitroTests: 0,
    inVitroTestingHoursPerTest: 0,
    inVitroTestingCostPerHour: 50,

    othersCost: 500, // cold competitor purchase
    othersNotes: 'Cold competitor purchase',
    phaseNotes: 'D2/D3 specificity with cold competitor',
    notes: 'D2/D3 specificity with cold competitor'
  },
  {
    id: 'row-7',
    tier: 3,
    phase: '3rd Campaign - Radiometabolites method dev',
    description: 'Method development for plasma/tissue radiometabolite HPLC',
    isotopeCostPerBatch: 700,
    radiopharmConsumablesPerBatch: 150,
    radiopharmReagentsPerBatch: 150,
    numBatches: 7,
    radiopharmFacilityCostPerHour: 50,
    radiopharmTaskTimeHoursPerBatch: 6,

    numAnimals: 0,
    animalCostEach: 0,
    housingCostEach: 0,

    imagingConsumablesPerScan: 0,
    imagingReagentsPerScan: 0,
    numScans: 0,
    scanCostPerHour: 150,
    scanTimeHoursPerScan: 0,
    imageAnalysisHoursPerScan: 0,
    imageAnalysisCostPerHour: 50,

    clinicalImagingConsumablesPerScan: 0,
    clinicalImagingReagentsPerScan: 0,
    numClinicalScans: 0,
    clinicalScanCostPerHour: 250,
    clinicalScanTimeHoursPerScan: 0,
    clinicalImageAnalysisHoursPerScan: 0,
    clinicalImageAnalysisCostPerHour: 75,

    bioConsumablesPerBio: 0,
    bioReagentsPerBio: 0,
    numBiodistributions: 0,
    bioCostPerUnit: 0,

    cellLineCost: 0,
    inVitroConsumablesPerTest: 0,
    inVitroReagentsPerTest: 0,
    numInVitroTests: 0,
    inVitroTestingHoursPerTest: 0,
    inVitroTestingCostPerHour: 50,

    othersCost: 1200,
    othersNotes: 'HPLC column & plasma extraction setup',
    phaseNotes: 'Plasma extraction method development',
    notes: 'Plasma extraction method development'
  },
  {
    id: 'row-8',
    tier: 3,
    phase: '3rd Campaign - Radiometabolites analysis',
    description: '4 animals, in vivo metabolism fraction measurement',
    isotopeCostPerBatch: 700,
    radiopharmConsumablesPerBatch: 150,
    radiopharmReagentsPerBatch: 150,
    numBatches: 4,
    radiopharmFacilityCostPerHour: 50,
    radiopharmTaskTimeHoursPerBatch: 3,

    numAnimals: 4,
    animalCostEach: 35,
    housingCostEach: 15,

    imagingConsumablesPerScan: 0,
    imagingReagentsPerScan: 0,
    numScans: 0,
    scanCostPerHour: 150,
    scanTimeHoursPerScan: 0,
    imageAnalysisHoursPerScan: 0,
    imageAnalysisCostPerHour: 50,

    clinicalImagingConsumablesPerScan: 0,
    clinicalImagingReagentsPerScan: 0,
    numClinicalScans: 0,
    clinicalScanCostPerHour: 250,
    clinicalScanTimeHoursPerScan: 0,
    clinicalImageAnalysisHoursPerScan: 0,
    clinicalImageAnalysisCostPerHour: 75,

    bioConsumablesPerBio: 60,
    bioReagentsPerBio: 60,
    numBiodistributions: 4, // n_bio = 4
    bioCostPerUnit: 40,

    cellLineCost: 0,
    inVitroConsumablesPerTest: 0,
    inVitroReagentsPerTest: 0,
    numInVitroTests: 0,
    inVitroTestingHoursPerTest: 0,
    inVitroTestingCostPerHour: 50,

    othersCost: 0,
    othersNotes: '',
    phaseNotes: 'In vivo metabolism fraction calculation',
    notes: 'In vivo metabolism fraction calculation'
  }
];

export const TRACER_PRESETS: TracerPreset[] = [
  {
    id: 'fallypride',
    name: '[18F]Fallypride',
    halfLife: '109.7 min (Fluorine-18)',
    targetType: 'Dopamine D2/D3 Receptors',
    defaultTiers: DEFAULT_TIERS,
    defaultRows: FALLYPRIDE_DEFAULT_ROWS
  },
  {
    id: 'fdg',
    name: '[18F]FDG',
    halfLife: '109.7 min (Fluorine-18)',
    targetType: 'Glucose Metabolism',
    defaultTiers: DEFAULT_TIERS,
    defaultRows: FALLYPRIDE_DEFAULT_ROWS.map(r => ({
      ...r,
      isotopeCostPerBatch: 500,
      radiopharmReagentsPerBatch: r.phase.includes('chemicals') ? 2500 : 100
    }))
  },
  {
    id: 'raclopride',
    name: '[11C]Raclopride',
    halfLife: '20.4 min (Carbon-11)',
    targetType: 'Dopamine D2 Receptors (Short half-life)',
    defaultTiers: DEFAULT_TIERS,
    defaultRows: FALLYPRIDE_DEFAULT_ROWS.map(r => ({
      ...r,
      isotopeCostPerBatch: 950,
      radiopharmTaskTimeHoursPerBatch: r.radiopharmTaskTimeHoursPerBatch > 0 ? r.radiopharmTaskTimeHoursPerBatch + 1 : 0
    }))
  }
];
