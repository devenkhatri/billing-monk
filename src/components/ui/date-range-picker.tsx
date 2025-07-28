'use client';

import { useState } from 'react';
import { Button } from './button';
import { CalendarIcon } from '@heroicons/react/24/outline';

interface DateRangePickerProps {
  onDateRangeChange: (dateFrom: string, dateTo: string) => void;
  className?: string;
}

export function DateRangePicker({ onDateRangeChange, className = '' }: DateRangePickerProps) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleApply = () => {
    if (dateFrom && dateTo) {
      onDateRangeChange(dateFrom, dateTo);
      setIsOpen(false);
    }
  };

  const handlePreset = (preset: string) => {
    const today = new Date();
    let from: Date | null = null;
    let to: Date = today;

    switch (preset) {
      case 'today':
        from = today;
        break;
      case 'yesterday':
        from = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        to = from;
        break;
      case 'last7days':
        from = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last30days':
        from = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'thisMonth':
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'lastMonth':
        from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        to = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'thisYear':
        from = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        return;
    }

    if (!from) return;

    const fromStr = from.toISOString().split('T')[0] || '';
    const toStr = to.toISOString().split('T')[0] || '';
    
    if (fromStr && toStr) {
      setDateFrom(fromStr);
      setDateTo(toStr);
      onDateRangeChange(fromStr, toStr);
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    setDateFrom('');
    setDateTo('');
    onDateRangeChange('', '');
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2"
      >
        <CalendarIcon className="h-4 w-4" />
        <span>
          {dateFrom && dateTo 
            ? `${dateFrom} to ${dateTo}`
            : 'Select date range'
          }
        </span>
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Select</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreset('today')}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreset('yesterday')}
                >
                  Yesterday
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreset('last7days')}
                >
                  Last 7 days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreset('last30days')}
                >
                  Last 30 days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreset('thisMonth')}
                >
                  This month
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreset('lastMonth')}
                >
                  Last month
                </Button>
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
              >
                Clear
              </Button>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleApply}
                  disabled={!dateFrom || !dateTo}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}