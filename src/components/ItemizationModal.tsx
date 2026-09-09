import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ListFilter, Check, RotateCcw } from 'lucide-react';
import { CellItem } from '../types';
import { formatCurrency } from '../utils/calculator';

interface ItemizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  phaseName: string;
  fieldLabel: string;
  unitType: 'currency' | 'number' | 'hours';
  initialItems: CellItem[];
  currentValue: number;
  onSave: (items: CellItem[] | null, totalValue: number) => void;
}

export const ItemizationModal: React.FC<ItemizationModalProps> = ({
  isOpen,
  onClose,
  phaseName,
  fieldLabel,
  unitType,
  initialItems,
  currentValue,
  onSave,
}) => {
  const [items, setItems] = useState<CellItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (initialItems && initialItems.length > 0) {
        setItems(initialItems.map(item => ({ ...item })));
      } else {
        // Default 1 row with current cell value or 0
        setItems([
          {
            id: 'item-1',
            name: 'Item 1',
            value: currentValue || 0,
          },
        ]);
      }
    }
  }, [isOpen, initialItems, currentValue]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    const nextIdx = items.length + 1;
    setItems([
      ...items,
      {
        id: `item-${Date.now()}-${nextIdx}`,
        name: `Item ${nextIdx}`,
        value: 0,
      },
    ]);
  };

  const handleUpdateItem = (id: string, field: 'name' | 'value', val: string | number) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          return { ...item, [field]: val };
        }
        return item;
      })
    );
  };

  const handleDeleteItem = (id: string) => {
    if (items.length <= 1) {
      // Don't leave empty list, reset the single row
      setItems([{ id: 'item-1', name: 'Item 1', value: 0 }]);
      return;
    }
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleClearItemization = () => {
    onSave(null, currentValue);
    onClose();
  };

  // Compute live total
  const calculatedTotal = items.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  const handleSave = () => {
    // Filter out completely empty items if any, but ensure at least valid list
    const validItems = items.map(it => ({
      id: it.id,
      name: it.name.trim() || 'Item',
      value: Number(it.value) || 0,
    }));
    onSave(validItems, calculatedTotal);
    onClose();
  };

  const getSecondColumnHeader = () => {
    switch (unitType) {
      case 'currency':
        return 'Cost ($)';
      case 'hours':
        return 'Duration (h)';
      case 'number':
      default:
        return 'Quantity (n)';
    }
  };

  const formatValueDisplay = (val: number) => {
    if (unitType === 'currency') return formatCurrency(val);
    if (unitType === 'hours') return `${val} hrs`;
    return `${val}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-400/30">
              <ListFilter className="w-4 h-4" />
            </span>
            <div>
              <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">{phaseName}</div>
              <h3 className="text-sm font-bold text-white">Itemize: {fieldLabel}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          
          <div className="flex items-center justify-between text-slate-600">
            <p>
              Specify individual components for <span className="font-semibold text-slate-900">{fieldLabel}</span>. The sum will automatically update the cell value in the matrix.
            </p>
          </div>

          {/* 2-Column Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                  <th className="p-2.5 w-12 text-center">#</th>
                  <th className="p-2.5">Item Description</th>
                  <th className="p-2.5 w-36 text-right">{getSecondColumnHeader()}</th>
                  <th className="p-2.5 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-2 text-center font-mono text-slate-400 text-[10px]">
                      {idx + 1}
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={e => handleUpdateItem(item.id, 'name', e.target.value)}
                        placeholder="Item name (e.g. Reagent kit A)"
                        className="w-full px-2 py-1 text-slate-800 bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded font-medium focus:ring-1 focus:ring-indigo-500 outline-hidden transition"
                      />
                    </td>
                    <td className="p-2">
                      <div className="flex items-center justify-end">
                        {unitType === 'currency' && (
                          <span className="text-slate-400 font-mono text-[11px] mr-1">$</span>
                        )}
                        <input
                          type="number"
                          step={unitType === 'hours' ? '0.1' : '1'}
                          min="0"
                          value={item.value === 0 ? '' : item.value}
                          onChange={e => handleUpdateItem(item.id, 'value', Number(e.target.value))}
                          placeholder="0"
                          className="w-28 px-2 py-1 text-right font-mono text-slate-900 font-semibold bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded focus:ring-1 focus:ring-indigo-500 outline-hidden transition"
                        />
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Table Footer Actions */}
            <div className="p-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Row</span>
              </button>

              {initialItems && initialItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearItemization}
                  className="inline-flex items-center space-x-1 text-[11px] font-medium text-rose-600 hover:text-rose-700 hover:underline px-2 py-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Remove Itemization</span>
                </button>
              )}
            </div>
          </div>

          {/* Computed Summary Bar */}
          <div className="p-3 bg-indigo-950 text-white rounded-xl flex items-center justify-between shadow-inner">
            <div>
              <div className="text-[10px] text-indigo-300 uppercase tracking-wider font-semibold">Calculated Cell Total</div>
              <div className="text-xs text-indigo-200 font-medium">({items.length} itemized component{items.length === 1 ? '' : 's'})</div>
            </div>
            <div className="text-base font-extrabold font-mono text-emerald-400">
              {formatValueDisplay(calculatedTotal)}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-medium border border-slate-300 rounded-lg transition"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs transition flex items-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Apply Total & Save</span>
          </button>
        </div>

      </div>
    </div>
  );
};
