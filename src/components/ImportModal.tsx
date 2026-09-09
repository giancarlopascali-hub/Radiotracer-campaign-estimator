import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertTriangle, Layers, ListChecks, Sparkles, FileSpreadsheet, FileCode } from 'lucide-react';
import { parseReportFile, ImportedCampaignData } from '../utils/importer';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (importedData: ImportedCampaignData) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ImportedCampaignData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setSelectedFile(null);
    setParseResult(null);
    setErrorMsg(null);
    setIsProcessing(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const processFile = (file: File) => {
    setSelectedFile(file);
    setErrorMsg(null);
    setParseResult(null);
    setIsProcessing(true);

    const isExcel = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');
    const reader = new FileReader();

    reader.onload = async (e) => {
      const content = e.target?.result;
      if (!content) {
        setErrorMsg('Failed to read file content.');
        setIsProcessing(false);
        return;
      }

      try {
        const res = await parseReportFile(content, file.name);
        if (res.success && res.data) {
          setParseResult(res.data);
        } else {
          setErrorMsg(res.error || 'Failed to parse report file.');
        }
      } catch (err: any) {
        setErrorMsg('Error parsing report file: ' + (err.message || 'Unknown error'));
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setErrorMsg('An error occurred while reading the file.');
      setIsProcessing(false);
    };

    if (isExcel) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (!parseResult) return;
    onImportSuccess(parseResult);
    handleClose();
  };

  const getItemizationCount = () => {
    if (!parseResult) return 0;
    let count = 0;
    parseResult.rows.forEach(r => {
      if (r.itemizations) {
        Object.values(r.itemizations).forEach(items => {
          if (Array.isArray(items)) {
            count += items.length;
          }
        });
      }
    });
    return count;
  };

  const getFileIcon = () => {
    if (!selectedFile) return <Upload className="w-8 h-8 text-indigo-500" />;
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') return <FileSpreadsheet className="w-8 h-8 text-emerald-600" />;
    if (ext === 'doc' || ext === 'docx') return <FileText className="w-8 h-8 text-blue-600" />;
    return <FileCode className="w-8 h-8 text-indigo-600" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        
        {/* MODAL HEADER */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Import Campaign Report</h2>
              <p className="text-xs text-slate-500">Restore estimation matrix from Excel (.xlsx), CSV, Word (.doc) or HTML report</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 space-y-4 overflow-y-auto">
          
          {/* DRAG & DROP ZONE */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/80 scale-[1.01]'
                : parseResult
                ? 'border-emerald-300 bg-emerald-50/40'
                : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/30'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv,.doc,.docx,.html,.htm,.txt"
              className="hidden"
            />

            <div className="p-3 bg-white rounded-full shadow-xs border border-slate-200">
              {getFileIcon()}
            </div>

            <div>
              <p className="text-xs sm:text-sm font-semibold text-slate-800">
                {selectedFile ? selectedFile.name : 'Click to select or drag & drop campaign report'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Supports <strong className="text-slate-700">.xlsx</strong>, <strong className="text-slate-700">.csv</strong>, <strong className="text-slate-700">.doc</strong>, or <strong className="text-slate-700">.html</strong> exported by this estimator
              </p>
            </div>

            {selectedFile && (
              <span className="inline-flex items-center text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </span>
            )}
          </div>

          {/* PROCESSING SPINNER */}
          {isProcessing && (
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center space-x-3 text-indigo-800 text-xs font-medium">
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Reading and parsing report structure...</span>
            </div>
          )}

          {/* ERROR BOX */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2.5 text-rose-800 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Import Error:</strong>
                <p className="mt-0.5 text-rose-700">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* PARSED PREVIEW PANEL */}
          {parseResult && (
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-950">Valid Campaign Report Identified</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  {parseResult.source === 'embedded_metadata' ? '100% Loss-Free Metadata' : 'Parsed Structure'}
                </span>
              </div>

              {/* REPORT DETAILS GRID */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100 shadow-2xs">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Tracer Name</span>
                  <strong className="text-slate-900 text-sm">{parseResult.tracerName}</strong>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-emerald-100 shadow-2xs">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Campaign Scope</span>
                  <strong className="text-slate-900 text-sm">{parseResult.tiers.length} Tiers defined</strong>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-emerald-100 shadow-2xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Phases Count</span>
                    <strong className="text-slate-900 text-sm">{parseResult.rows.length} Phases</strong>
                  </div>
                  <Layers className="w-4 h-4 text-indigo-500 opacity-60" />
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-emerald-100 shadow-2xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Itemized Sub-costs</span>
                    <strong className="text-slate-900 text-sm">{getItemizationCount()} Items</strong>
                  </div>
                  <ListChecks className="w-4 h-4 text-emerald-500 opacity-60" />
                </div>
              </div>

              <p className="text-[11px] text-emerald-800">
                Restoring this report will update your workspace matrix so you can seamlessly continue editing and finalizing the estimate.
              </p>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            type="button"
            disabled={!parseResult}
            onClick={handleConfirmImport}
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Restore & Load Estimate</span>
          </button>
        </div>

      </div>
    </div>
  );
};
