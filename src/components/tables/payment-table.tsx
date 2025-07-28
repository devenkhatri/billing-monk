'use client';

import { useState } from 'react';
import { Payment, PaymentMethod, PaymentFilters } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PaymentTableProps {
  payments: Payment[];
  invoices: { id: string; invoiceNumber: string; clientId: string }[];
  clients: { id: string; name: string }[];
  onDeletePayment?: (paymentId: string) => void;
  isLoading?: boolean;
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Cash',
  check: 'Check',
  credit_card: 'Credit Card',
  bank_transfer: 'Bank Transfer',
  paypal: 'PayPal',
  other: 'Other'
};

export function PaymentTable({ 
  payments, 
  invoices, 
  clients, 
  onDeletePayment, 
  isLoading = false 
}: PaymentTableProps) {
  const [filters, setFilters] = useState<PaymentFilters>({});
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Payment;
    direction: 'asc' | 'desc';
  }>({ key: 'paymentDate', direction: 'desc' });

  // Helper function to get client name by invoice ID
  const getClientNameByInvoiceId = (invoiceId: string): string => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return 'Unknown';
    
    const client = clients.find(c => c.id === invoice.clientId);
    return client?.name || 'Unknown Client';
  };

  // Helper function to get invoice number
  const getInvoiceNumber = (invoiceId: string): string => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    return invoice?.invoiceNumber || 'Unknown';
  };

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    if (filters.invoiceId && payment.invoiceId !== filters.invoiceId) {
      return false;
    }
    
    if (filters.paymentMethod && payment.paymentMethod !== filters.paymentMethod) {
      return false;
    }
    
    if (filters.dateFrom) {
      const paymentDate = new Date(payment.paymentDate);
      const fromDate = new Date(filters.dateFrom);
      if (paymentDate < fromDate) {
        return false;
      }
    }
    
    if (filters.dateTo) {
      const paymentDate = new Date(payment.paymentDate);
      const toDate = new Date(filters.dateTo);
      if (paymentDate > toDate) {
        return false;
      }
    }
    
    return true;
  });

  // Sort payments
  const sortedPayments = [...filteredPayments].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    // Handle undefined values
    if (aValue === undefined && bValue === undefined) return 0;
    if (aValue === undefined) return sortConfig.direction === 'asc' ? 1 : -1;
    if (bValue === undefined) return sortConfig.direction === 'asc' ? -1 : 1;
    
    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const handleSort = (key: keyof Payment) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (key: keyof PaymentFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invoice
            </label>
            <Select
              value={filters.invoiceId || ''}
              onChange={(value) => handleFilterChange('invoiceId', String(value))}
              options={[
                { value: '', label: 'All Invoices' },
                ...invoices.map(invoice => ({
                  value: invoice.id,
                  label: invoice.invoiceNumber
                }))
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <Select
              value={filters.paymentMethod || ''}
              onChange={(value) => handleFilterChange('paymentMethod', String(value))}
              options={[
                { value: '', label: 'All Methods' },
                ...Object.entries(paymentMethodLabels).map(([value, label]) => ({
                  value,
                  label
                }))
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <Input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <Input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={clearFilters} size="sm">
            Clear Filters
          </Button>
          <div className="text-sm text-gray-600">
            Showing {filteredPayments.length} of {payments.length} payments
            {filteredPayments.length > 0 && (
              <span className="ml-2 font-semibold">
                Total: {formatCurrency(totalAmount)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('paymentDate')}
              >
                Date
                {sortConfig.key === 'paymentDate' && (
                  <span className="ml-1">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('amount')}
              >
                Amount
                {sortConfig.key === 'amount' && (
                  <span className="ml-1">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notes
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedPayments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  {payments.length === 0 ? 'No payments found' : 'No payments match the current filters'}
                </td>
              </tr>
            ) : (
              sortedPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(payment.paymentDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getInvoiceNumber(payment.invoiceId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getClientNameByInvoiceId(payment.invoiceId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {paymentMethodLabels[payment.paymentMethod]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {payment.notes || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {onDeletePayment && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDeletePayment(payment.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
}