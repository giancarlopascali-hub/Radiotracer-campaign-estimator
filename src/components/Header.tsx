import React from 'react';
import { Download, Upload, Sparkles, Mail, FileX } from 'lucide-react';
import { TRACER_PRESETS } from '../data/defaultData';

interface HeaderProps {
  tracerName: string;
  setTracerName: (name: string) => void;
  selectedPresetId: string;
  onSelectPreset: (presetId: string) => void;
  onLoadExample: () => void;
  onBlankMatrix: () => void;
  onOpenExportModal: () => void;
  onOpenImportModal: () => void;
}

// Custom SVG component representing a chemical molecule with 1 radioactive atom
const RadioactiveMoleculeIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Chemical Bonds */}
    <line x1="30" y1="65" x2="50" y2="35" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <line x1="50" y1="35" x2="75" y2="60" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <line x1="30" y1="65" x2="75" y2="60" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <line x1="50" y1="35" x2="50" y2="15" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    
    {/* Non-radioactive Atom Nodes */}
    <circle cx="30" cy="65" r="8" fill="#6366f1" />
    <circle cx="50" cy="15" r="6" fill="#38bdf8" />
    <circle cx="75" cy="60" r="7" fill="#818cf8" />

    {/* Radioactive Central Atom Node */}
    <circle cx="50" cy="35" r="14" fill="#f59e0b" />
    <circle cx="50" cy="35" r="7" fill="#fef08a" />
    {/* Trefoil Radiation Blades */}
    <path d="M50 25 A10 10 0 0 1 58.6 30 L50 35 Z" fill="#000" />
    <path d="M41.3 40 A10 10 0 0 1 41.3 30 L50 35 Z" fill="#000" />
    <path d="M58.6 40 A10 10 0 0 1 50 45 L50 35 Z" fill="#000" />
    {/* Radiation Ring */}
    <circle cx="50" cy="35" r="19" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" />
  </svg>
);

export const Header: React.FC<HeaderProps> = ({
  tracerName,
  setTracerName,
  selectedPresetId,
  onSelectPreset,
  onLoadExample,
  onBlankMatrix,
  onOpenExportModal,
  onOpenImportModal,
}) => {
  const handleReportIssue = () => {
    window.location.href = 'mailto:g.pascali@unsw.edu.au?subject=Radiotracer%20Campaign%20Estimator%20Feedback';
  };

  return (
    <header className="bg-white border-b border-slate-200 text-slate-900 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Title & Radiotracer Badge & Authorship */}
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-200 flex items-center justify-center shrink-0 shadow-xs">
              <RadioactiveMoleculeIcon className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  Radiotracer Campaign Cost Estimator
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  By Giancarlo Pascali
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Parametric cost breakdown model for radiochemistry, imaging, biodistribution & metabolite campaigns
              </p>
            </div>
          </div>

          {/* Tracer Preset & Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Tracer Name Input / Preset Select */}
            <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 px-2 font-medium">Tracer:</span>
              <select
                value={selectedPresetId}
                onChange={(e) => onSelectPreset(e.target.value)}
                className="bg-white text-slate-800 text-xs font-semibold rounded px-2 py-1.5 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {TRACER_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
                <option value="custom">Custom Tracer...</option>
              </select>
              {selectedPresetId === 'custom' && (
                <input
                  type="text"
                  value={tracerName}
                  onChange={(e) => setTracerName(e.target.value)}
                  placeholder="e.g. [18F]FDG"
                  className="ml-2 bg-white text-slate-900 text-xs rounded px-2 py-1.5 border border-slate-300 w-28 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              )}
            </div>

            {/* Example Button */}
            <button
              onClick={onLoadExample}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-300 hover:border-indigo-300 shadow-xs transition cursor-pointer"
              title="Load example campaign parameters ([18F]Fallypride model)"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Example</span>
            </button>

            {/* Blank Button */}
            <button
              onClick={onBlankMatrix}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-300 hover:border-rose-300 shadow-xs transition cursor-pointer"
              title="Completely delete all tiers, phases, summaries and analysis to start with a blank matrix"
            >
              <FileX className="w-3.5 h-3.5 text-rose-500" />
              <span>Blank</span>
            </button>

            {/* Report Issue / Comment Button */}
            <button
              onClick={handleReportIssue}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 shadow-xs transition cursor-pointer"
              title="Send an email to g.pascali@unsw.edu.au"
            >
              <Mail className="w-3.5 h-3.5 text-indigo-600" />
              <span>Report Issue / Comment</span>
            </button>

            {/* Import Report Button */}
            <button
              onClick={onOpenImportModal}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition cursor-pointer"
              title="Import a CSV, Word (.doc) or HTML report generated by this webapp to continue estimation"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Report</span>
            </button>

            {/* Export Modal Button */}
            <button
              onClick={onOpenExportModal}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Report</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};


