'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

import { Select } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Client } from '@/types';

interface ReportFiltersProps {
  onFiltersChange: (filters: ReportFilters) => void;
  reportType: 'revenue' | 'client' | 'invoice-status';
}

export interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  clientId?: string;
}

export function ReportFilters({ onFiltersChange, reportType }: ReportFiltersProps) {
  const [filters, setFilters] = useState<ReportFilters>({});
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (reportType === 'client') {
      fetchClients();
    }
  }, [reportType]);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/clients');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setClients(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateRangeChange = (dateFrom?: string, dateTo?: string) => {
    const newFilters = { ...filters, dateFrom, dateTo };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClientChange = (value: string | number) => {
    const clientId = String(value);
    const newFilters = { ...filters, clientId: clientId || undefined };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {};
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date Range
          </label>
          <DateRangePicker
            onDateRangeChange={handleDateRangeChange}
            dateFrom={filters.dateFrom}
            dateTo={filters.dateTo}
          />
        </div>

        {reportType === 'client' && (
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client
            </label>
            <Select
              value={filters.clientId || ''}
              onChange={handleClientChange}
              disabled={isLoading}
              options={[
                { value: '', label: 'All Clients' },
                ...clients.map(client => ({
                  value: client.id,
                  label: client.name
                }))
              ]}
              placeholder="All Clients"
            />
          </div>
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClearFilters}
            className="whitespace-nowrap"
          >
            Clear Filters
          </Button>
        </div>
      </div>
    </div>
  );
}