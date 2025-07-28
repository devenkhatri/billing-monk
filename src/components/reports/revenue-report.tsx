'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/ui/table';
import { LoadingState } from '@/components/ui/loading';
import { RevenueReport } from '@/types';
import { ReportFilters } from './report-filters';

interface RevenueReportProps {
  filters: ReportFilters;
}

export function RevenueReportComponent({ filters }: RevenueReportProps) {
  const [data, setData] = useState<RevenueReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRevenueReport();
  }, [filters]);

  const fetchRevenueReport = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        type: 'revenue',
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo })
      });

      const response = await fetch(`/api/reports?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch revenue report');
      }
    } catch (error) {
      console.error('Error fetching revenue report:', error);
      setError('Failed to fetch revenue report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams({
        type: 'revenue',
        format: 'csv',
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo })
      });

      const response = await fetch(`/api/reports/export?${params}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `revenue-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Failed to export CSV');
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  const handleExportPDF = async () => {
    try {
      const params = new URLSearchParams({
        type: 'revenue',
        format: 'pdf',
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo })
      });

      const response = await fetch(`/api/reports/export?${params}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `revenue-report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Failed to export PDF');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPeriod = (period: string) => {
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year || '0'), parseInt(month || '0') - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalInvoices = data.reduce((sum, item) => sum + item.invoiceCount, 0);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchRevenueReport}>Retry</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Revenue Report</h2>
          <p className="text-sm text-gray-600 mt-1">
            Monthly revenue breakdown with invoice and client counts
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline">
            Export CSV
          </Button>
          <Button onClick={handleExportPDF} variant="outline">
            Export PDF
          </Button>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No revenue data found for the selected period.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800">Total Revenue</h3>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-800">Total Invoices</h3>
              <p className="text-2xl font-bold text-green-900">{totalInvoices}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-purple-800">Avg Revenue/Month</h3>
              <p className="text-2xl font-bold text-purple-900">
                {formatCurrency(data.length > 0 ? totalRevenue / data.length : 0)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <Table>
              <thead>
                <tr>
                  <th className="text-left">Period</th>
                  <th className="text-right">Revenue</th>
                  <th className="text-right">Invoices</th>
                  <th className="text-right">Clients</th>
                  <th className="text-right">Avg per Invoice</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.period}>
                    <td className="font-medium">{formatPeriod(item.period)}</td>
                    <td className="text-right">{formatCurrency(item.revenue)}</td>
                    <td className="text-right">{item.invoiceCount}</td>
                    <td className="text-right">{item.clientCount}</td>
                    <td className="text-right">
                      {formatCurrency(item.invoiceCount > 0 ? item.revenue / item.invoiceCount : 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}