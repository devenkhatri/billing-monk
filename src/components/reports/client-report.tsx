'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/ui/table';
import { LoadingState } from '@/components/ui/loading';
import { ClientReport } from '@/types';
import { ReportFilters } from './report-filters';

interface ClientReportProps {
  filters: ReportFilters;
}

export function ClientReportComponent({ filters }: ClientReportProps) {
  const [data, setData] = useState<ClientReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClientReport();
  }, [filters]);

  const fetchClientReport = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        type: 'client',
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
        ...(filters.clientId && { clientId: filters.clientId })
      });

      const response = await fetch(`/api/reports?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch client report');
      }
    } catch (error) {
      console.error('Error fetching client report:', error);
      setError('Failed to fetch client report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams({
        type: 'client',
        format: 'csv',
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
        ...(filters.clientId && { clientId: filters.clientId })
      });

      const response = await fetch(`/api/reports/export?${params}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `client-report-${new Date().toISOString().split('T')[0]}.csv`;
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
        type: 'client',
        format: 'pdf',
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
        ...(filters.clientId && { clientId: filters.clientId })
      });

      const response = await fetch(`/api/reports/export?${params}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `client-report-${new Date().toISOString().split('T')[0]}.pdf`;
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

  const getPaymentStatusColor = (outstandingAmount: number) => {
    if (outstandingAmount === 0) return 'text-green-600';
    if (outstandingAmount > 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const totalInvoiced = data.reduce((sum, item) => sum + item.totalInvoiced, 0);
  const totalPaid = data.reduce((sum, item) => sum + item.totalPaid, 0);
  const totalOutstanding = data.reduce((sum, item) => sum + item.outstandingAmount, 0);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchClientReport}>Retry</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Client Report</h2>
          <p className="text-sm text-gray-600 mt-1">
            Client performance breakdown with payment status
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
          <p className="text-gray-600">No client data found for the selected period.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800">Total Invoiced</h3>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalInvoiced)}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-800">Total Paid</h3>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(totalPaid)}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-red-800">Outstanding</h3>
              <p className="text-2xl font-bold text-red-900">{formatCurrency(totalOutstanding)}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-purple-800">Active Clients</h3>
              <p className="text-2xl font-bold text-purple-900">{data.length}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <Table>
              <thead>
                <tr>
                  <th className="text-left">Client</th>
                  <th className="text-right">Total Invoiced</th>
                  <th className="text-right">Total Paid</th>
                  <th className="text-right">Outstanding</th>
                  <th className="text-right">Invoices</th>
                  <th className="text-right">Payment Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => {
                  const paymentRate = item.totalInvoiced > 0 
                    ? (item.totalPaid / item.totalInvoiced) * 100 
                    : 0;
                  
                  return (
                    <tr key={item.clientId}>
                      <td className="font-medium">{item.clientName}</td>
                      <td className="text-right">{formatCurrency(item.totalInvoiced)}</td>
                      <td className="text-right">{formatCurrency(item.totalPaid)}</td>
                      <td className={`text-right ${getPaymentStatusColor(item.outstandingAmount)}`}>
                        {formatCurrency(item.outstandingAmount)}
                      </td>
                      <td className="text-right">{item.invoiceCount}</td>
                      <td className="text-right">
                        <span className={`font-medium ${
                          paymentRate >= 100 ? 'text-green-600' :
                          paymentRate >= 75 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {paymentRate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}