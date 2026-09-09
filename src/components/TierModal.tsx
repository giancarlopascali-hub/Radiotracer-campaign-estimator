import React, { useState, useEffect } from 'react';
import { X, Layers, Plus } from 'lucide-react';
import { TierConfig } from '../types';

interface TierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTier: (tier: TierConfig) => void;
  existingTiers: TierConfig[];
  initialTier?: TierConfig | null;
}

export const TierModal: React.FC<TierModalProps> = ({
  isOpen,
  onClose,
  onSaveTier,
  existingTiers,
  initialTier,
}) => {
  const [tierNumber, setTierNumber] = useState<number>(1);
  const [name, setName] = useState<string>('');
  const [subtitle, setSubtitle] = useState<string>('');

  useEffect(() => {
    if (initialTier) {
      setTierNumber(initialTier.tierNumber);
      setName(initialTier.name);
      setSubtitle(initialTier.subtitle);
    } else {
      const maxTierNum = existingTiers.reduce((max, t) => Math.max(max, t.tierNumber), 0);
      setTierNumber(maxTierNum + 1);
      setName(`Tier ${maxTierNum + 1} Package`);
      setSubtitle('Additional campaign phase objectives & study scope');
    }
  }, [initialTier, existingTiers, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSaveTier({
      tierNumber: Number(tierNumber),
      name: name.trim(),
      subtitle: subtitle.trim() || 'Custom campaign tier package'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl p-6 text-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span>{initialTier ? 'Edit Campaign Tier' : 'Add New Campaign Tier'}</span>
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Tier Level Number *</label>
            <input
              type="number"
              min={1}
              required
              value={tierNumber}
              onChange={e => setTierNumber(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-0.5">Defines the sequence order (e.g. 1 = Basic, 2 = Mid, 3 = Top, 4 = Advanced...)</p>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Tier Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Tier 4: Clinical Translation Prep"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Subtitle / Objective</label>
            <input
              type="text"
              value={subtitle}
              onChange={e => setSubtitle(e.target.value)}
              placeholder="e.g. + Pre-clinical toxicology & GLP dosimetry study"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Save Tier</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
