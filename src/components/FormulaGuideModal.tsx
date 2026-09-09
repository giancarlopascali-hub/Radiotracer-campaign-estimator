import React from 'react';
import { X, Calculator, Info, CheckCircle2, AlertTriangle } from 'lucide-react';

interface FormulaGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FormulaGuideModal: React.FC<FormulaGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Calculator className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Campaign Parametric Matrix - Mathematical Formulas Guide
              </h3>
              <p className="text-xs text-slate-500">
                v1.0 Version showing explicit mathematical sum formulas for all 5 core fields
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          
          {/* Section 1: Radiopharmaceuticals */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between font-bold text-indigo-950 text-sm">
              <span>1. Field "Radiopharmaceuticals"</span>
              <span className="font-mono text-xs bg-indigo-100 px-2 py-0.5 rounded border border-indigo-300">
                Variables: b = batch, h = hours
              </span>
            </div>
            <p className="text-slate-700">Subfields: Isotope ($/b), Consumables ($/b), Reagents ($/b), Batches (n_b), Facility ($/h), Task time (h/b)</p>
            <div className="p-2.5 bg-white font-mono text-xs rounded border border-indigo-200 font-bold text-indigo-900">
              Total = n_b × [ (Isotope + Consumables + Reagents) + (Facility $/h × Task time h/b) ]
            </div>
          </div>

          {/* Section 2: Animal models */}
          <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between font-bold text-purple-950 text-sm">
              <span>2. Field "Animal models"</span>
              <span className="font-mono text-xs bg-purple-100 px-2 py-0.5 rounded border border-purple-300">
                Variables: a = animal
              </span>
            </div>
            <p className="text-slate-700">Subfields: Animals (n_a), Animals ($/a), Housing ($/a)</p>
            <div className="p-2.5 bg-white font-mono text-xs rounded border border-purple-200 font-bold text-purple-900">
              Total = n_a × (Animals $/a + Housing $/a)
            </div>
          </div>

          {/* Section 3: Imaging */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between font-bold text-amber-950 text-sm">
              <span>3. Field "Imaging"</span>
              <span className="font-mono text-xs bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                Variables: s = scan, h = hours
              </span>
            </div>
            <p className="text-slate-700">Subfields: Consumables ($/s), Reagents ($/s), Scans (n_s), Scan cost ($/h), Scan time (h/s), Image analysis (h/s), Image analysis ($/h)</p>
            <div className="p-2.5 bg-white font-mono text-xs rounded border border-amber-200 font-bold text-amber-900">
              Total = n_s × [ (Consumables + Reagents) + (Scan cost $/h × Scan time h/s) + (Image analysis $/h × Image analysis h/s) ]
            </div>
            <div className="p-2 bg-amber-100/80 rounded border border-amber-300 text-amber-950 text-[11px] font-semibold flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Rule:</strong> n_s defaults to n_a. User can modify it, but n_s ≤ n_a. If n_a = n_s + n_bio, no warning is generated.
              </span>
            </div>
          </div>

          {/* Section 4: Biodistribution */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between font-bold text-emerald-950 text-sm">
              <span>4. Field "Biodistribution"</span>
              <span className="font-mono text-xs bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                Variables: bio = biodistribution
              </span>
            </div>
            <p className="text-slate-700">Subfields: Consumables ($/bio), Reagents ($/bio), Biodistributions (n_bio), Biodistribution cost ($/n_bio)</p>
            <div className="p-2.5 bg-white font-mono text-xs rounded border border-emerald-200 font-bold text-emerald-900">
              Total = n_bio × (Consumables $/bio + Reagents $/bio + Bio cost $/n_bio)
            </div>
            <div className="p-2 bg-emerald-100/80 rounded border border-emerald-300 text-emerald-950 text-[11px] font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                <strong>Rule:</strong> n_bio defaults to (n_a - n_s). User can modify it, but n_bio ≤ (n_a - n_s). If (n_s + n_bio) &lt; n_a, n_a is flagged with a <strong>strong warning color</strong> (unmapped animals).
              </span>
            </div>
          </div>

          {/* Section 5: In Vitro */}
          <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between font-bold text-teal-950 text-sm">
              <span>5. Field "In Vitro"</span>
              <span className="font-mono text-xs bg-teal-100 px-2 py-0.5 rounded border border-teal-300">
                Variables: t = test, h = hours
              </span>
            </div>
            <p className="text-slate-700">Subfields: Cell line ($), Consumables ($/t), Reagents ($/t), Tests (n_t), Testing (h/t), Testing cost ($/h)</p>
            <div className="p-2.5 bg-white font-mono text-xs rounded border border-teal-200 font-bold text-teal-900">
              Total = Cell line $ + n_t × [ (Consumables + Reagents) + (Testing cost $/h × Testing h/t) ]
            </div>
          </div>

          {/* Section 6: Others & Master Phase Total */}
          <div className="p-3.5 bg-slate-100 border border-slate-300 rounded-xl space-y-1.5">
            <div className="font-bold text-slate-900 text-sm">6. Field "Others" & Master Phase Total</div>
            <p className="text-slate-700">Subfields: Cost ($), Note (Others), Phase Notes</p>
            <div className="p-2.5 bg-slate-900 font-mono text-xs text-white rounded font-bold">
              Phase Total = Radiopharmaceuticals + Animal models + Imaging + Biodistribution + In Vitro + Others
            </div>
          </div>

          {/* Tier & Grand Totals */}
          <div className="p-3.5 bg-indigo-950 text-white rounded-xl space-y-1">
            <div className="font-bold text-indigo-200 text-sm">Tier Subtotals & Campaign Grand Total</div>
            <div className="font-mono text-xs space-y-1">
              <p>• Tier Subtotal = ∑ (Phase Totals in Tier)</p>
              <p>• Tier Cumulated Total = Tier 1 Subtotal + ... + Current Tier Subtotal</p>
              <p>• Grand Total Budget = ∑ (All Tier Subtotals)</p>
            </div>
          </div>

        </div>

        <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs transition"
          >
            Close Reference
          </button>
        </div>
      </div>
    </div>
  );
};
