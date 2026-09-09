import { PhaseRow, CellItem } from '../types';

export interface FieldMetadata {
  key: keyof PhaseRow;
  label: string;
  category: string;
  unitType: 'currency' | 'number' | 'hours';
}

export const FIELD_METADATA: Record<string, FieldMetadata> = {
  isotopeCostPerBatch: { key: 'isotopeCostPerBatch', label: 'Isotope Cost ($/b)', category: 'Radiopharmaceuticals', unitType: 'currency' },
  radiopharmConsumablesPerBatch: { key: 'radiopharmConsumablesPerBatch', label: 'Radiopharm Consumables ($/b)', category: 'Radiopharmaceuticals', unitType: 'currency' },
  radiopharmReagentsPerBatch: { key: 'radiopharmReagentsPerBatch', label: 'Radiopharm Reagents ($/b)', category: 'Radiopharmaceuticals', unitType: 'currency' },
  numBatches: { key: 'numBatches', label: 'Production Batches (n_b)', category: 'Radiopharmaceuticals', unitType: 'number' },
  radiopharmFacilityCostPerHour: { key: 'radiopharmFacilityCostPerHour', label: 'Facility Rate ($/h)', category: 'Radiopharmaceuticals', unitType: 'currency' },
  radiopharmTaskTimeHoursPerBatch: { key: 'radiopharmTaskTimeHoursPerBatch', label: 'Task Duration (h/b)', category: 'Radiopharmaceuticals', unitType: 'hours' },

  numAnimals: { key: 'numAnimals', label: 'Animal Quantity (n_a)', category: 'Animal Models', unitType: 'number' },
  animalCostEach: { key: 'animalCostEach', label: 'Animal Purchase Cost ($/a)', category: 'Animal Models', unitType: 'currency' },
  housingCostEach: { key: 'housingCostEach', label: 'Housing Cost ($/a)', category: 'Animal Models', unitType: 'currency' },

  imagingConsumablesPerScan: { key: 'imagingConsumablesPerScan', label: 'Imaging Consumables ($/s)', category: 'Imaging', unitType: 'currency' },
  imagingReagentsPerScan: { key: 'imagingReagentsPerScan', label: 'Imaging Reagents ($/s)', category: 'Imaging', unitType: 'currency' },
  numScans: { key: 'numScans', label: 'Scan Quantity (n_s)', category: 'Imaging', unitType: 'number' },
  scanCostPerHour: { key: 'scanCostPerHour', label: 'Scan Rate ($/h)', category: 'Imaging', unitType: 'currency' },
  scanTimeHoursPerScan: { key: 'scanTimeHoursPerScan', label: 'Scan Duration (h/s)', category: 'Imaging', unitType: 'hours' },
  imageAnalysisHoursPerScan: { key: 'imageAnalysisHoursPerScan', label: 'Image Analysis Duration (h/s)', category: 'Imaging', unitType: 'hours' },
  imageAnalysisCostPerHour: { key: 'imageAnalysisCostPerHour', label: 'Image Analysis Rate ($/h)', category: 'Imaging', unitType: 'currency' },

  bioConsumablesPerBio: { key: 'bioConsumablesPerBio', label: 'Biodistribution Consumables ($/bio)', category: 'Biodistribution', unitType: 'currency' },
  bioReagentsPerBio: { key: 'bioReagentsPerBio', label: 'Biodistribution Reagents ($/bio)', category: 'Biodistribution', unitType: 'currency' },
  numBiodistributions: { key: 'numBiodistributions', label: 'Biodistribution Quantity (n_bio)', category: 'Biodistribution', unitType: 'number' },
  bioCostPerUnit: { key: 'bioCostPerUnit', label: 'Biodistribution Unit Cost ($/unit)', category: 'Biodistribution', unitType: 'currency' },

  cellLineCost: { key: 'cellLineCost', label: 'Cell Line Cost ($)', category: 'In Vitro', unitType: 'currency' },
  inVitroConsumablesPerTest: { key: 'inVitroConsumablesPerTest', label: 'In Vitro Consumables ($/t)', category: 'In Vitro', unitType: 'currency' },
  inVitroReagentsPerTest: { key: 'inVitroReagentsPerTest', label: 'In Vitro Reagents ($/t)', category: 'In Vitro', unitType: 'currency' },
  numInVitroTests: { key: 'numInVitroTests', label: 'In Vitro Tests (n_t)', category: 'In Vitro', unitType: 'number' },
  inVitroTestingHoursPerTest: { key: 'inVitroTestingHoursPerTest', label: 'In Vitro Testing Duration (h/t)', category: 'In Vitro', unitType: 'hours' },
  inVitroTestingCostPerHour: { key: 'inVitroTestingCostPerHour', label: 'In Vitro Testing Rate ($/h)', category: 'In Vitro', unitType: 'currency' },

  othersCost: { key: 'othersCost', label: 'Other Direct Costs ($)', category: 'Others', unitType: 'currency' },
};

export function getFieldMetadata(fieldKey: string): FieldMetadata {
  return FIELD_METADATA[fieldKey] || {
    key: fieldKey as keyof PhaseRow,
    label: fieldKey,
    category: 'General',
    unitType: 'currency',
  };
}

export interface ExtractedItemization {
  phaseId: string;
  tier: number;
  phaseName: string;
  fieldKey: string;
  fieldLabel: string;
  category: string;
  unitType: 'currency' | 'number' | 'hours';
  items: CellItem[];
  totalValue: number;
}

export function extractAllItemizations(rows: PhaseRow[]): ExtractedItemization[] {
  const result: ExtractedItemization[] = [];

  rows.forEach(row => {
    if (!row.itemizations) return;
    Object.entries(row.itemizations).forEach(([fieldKey, items]) => {
      if (items && items.length > 0) {
        const meta = getFieldMetadata(fieldKey);
        const totalValue = items.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
        result.push({
          phaseId: row.id,
          tier: row.tier,
          phaseName: row.phase,
          fieldKey,
          fieldLabel: meta.label,
          category: meta.category,
          unitType: meta.unitType,
          items,
          totalValue,
        });
      }
    });
  });

  return result;
}
