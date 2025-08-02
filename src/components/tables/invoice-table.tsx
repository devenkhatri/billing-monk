'use client';

import { useState } from 'react';
import { Invoice, Client, InvoiceStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { StorageStatusIndicator } from '@/components/ui/storage-status-indicator';
import { useStorageStatus } from '@/lib/hooks/use-storage-status';
import { 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  PaperAirplaneIcon,
  XCircleIcon,
  DocumentArrowDownIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface InvoiceTableProps {
  invoices: Invoice[];
  clients: Client[];
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoice: Invoice) => void;
  onView: (invoice: Invoice) => void;
  onStatusChange?: (invoice: Invoice, status: InvoiceStatus) => void;
  onDownloadPDF?: (invoice: Invoice) => void;
  isLoading?: boolean;
}

interface Filters {
  status: InvoiceStatus | '';
  clientId: string;
  search: string;
  dateFrom: string;
  dateTo: string;
}

export function InvoiceTable({ 
  invoices, 
  clients, 
  onEdit, 
  onDelete, 
  onView,
  onStatusChange,
  onDownloadPDF,
  isLoading = false 
}: InvoiceTableProps) {
  const [filters, setFilters] = useState<Filters>({
    status: '',
    clientId: '',
    search: '',
    dateFrom: '',
    dateTo: ''
  });
  const [sortBy, setSortBy] = useState<'invoiceNumber' | 'issueDate' | 'dueDate' | 'total'>('issueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [retryingUpload, setRetryingUpload] = useState<string | null>(null);
  const [bulkRetrying, setBulkRetrying] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkRetryResult, setBulkRetryResult] = useState<{
    successful: number;
    failed: number;
    total: number;
  } | null>(null);

  // Get storage statuses for all invoices
  const invoiceIds = invoices.map(invoice => invoice.id);
  const { storageStatuses, retryUpload, bulkRetryUpload } = useStorageStatus(invoiceIds);

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    if (filters.status && invoice.status !== filters.status) return false;
    if (filters.clientId && invoice.clientId !== filters.clientId) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const client = clients.find(c => c.id === invoice.clientId);
      const clientName = client?.name.toLowerCase() || '';
      const invoiceNumber = invoice.invoiceNumber.toLowerCase();
      
      if (!clientName.includes(searchLower) && !invoiceNumber.includes(searchLower)) {
        return false;
      }
    }
    if (filters.dateFrom && invoice.issueDate < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && invoice.issueDate > new Date(filters.dateTo)) return false;
    
    return true;
  });

  // Sort invoices
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    let aValue: string | number | Date;
    let bValue: string | number | Date;

    switch (sortBy) {
      case 'invoiceNumber':
        aValue = a.invoiceNumber;
        bValue = b.invoiceNumber;
        break;
      case 'issueDate':
        aValue = a.issueDate;
        bValue = b.issueDate;
        break;
      case 'dueDate':
        aValue = a.dueDate;
        bValue = b.dueDate;
        break;
      case 'total':
        aValue = a.total;
        bValue = b.total;
        break;
      default:
        aValue = a.issueDate;
        bValue = b.issueDate;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown Client';
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
    switch (status) {
      case 'draft':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case 'sent':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'paid':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'overdue':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'cancelled':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleRetryUpload = async (invoiceId: string) => {
    try {
      setRetryingUpload(invoiceId);
      await retryUpload(invoiceId);
    } catch (error) {
      console.error('Failed to retry upload:', error);
      // Error is already handled by the hook
    } finally {
      setRetryingUpload(null);
    }
  };

  const handleBulkRetryUpload = async () => {
    const failedInvoiceIds = Array.from(selectedInvoices).filter(invoiceId => 
      storageStatuses[invoiceId]?.status === 'failed'
    );

    if (failedInvoiceIds.length === 0) {
      return;
    }

    try {
      setBulkRetrying(true);
      const result = await bulkRetryUpload(failedInvoiceIds);
      
      // Clear selection after successful bulk retry
      setSelectedInvoices(new Set());
      setShowBulkActions(false);
      
      // Show result summary
      setBulkRetryResult(result.summary);
      
      // Clear result message after 5 seconds
      setTimeout(() => setBulkRetryResult(null), 5000);
    } catch (error) {
      console.error('Failed to bulk retry uploads:', error);
      // Error is already handled by the hook
    } finally {
      setBulkRetrying(false);
    }
  };

  const handleSelectInvoice = (invoiceId: string, checked: boolean) => {
    const newSelection = new Set(selectedInvoices);
    if (checked) {
      newSelection.add(invoiceId);
    } else {
      newSelection.delete(invoiceId);
    }
    setSelectedInvoices(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const failedInvoiceIds = sortedInvoices
        .filter(invoice => storageStatuses[invoice.id]?.status === 'failed')
        .map(invoice => invoice.id);
      setSelectedInvoices(new Set(failedInvoiceIds));
    } else {
      setSelectedInvoices(new Set());
    }
  };

  // Get failed invoices for bulk actions
  const failedInvoices = sortedInvoices.filter(invoice => 
    storageStatuses[invoice.id]?.status === 'failed'
  );
  const selectedFailedCount = Array.from(selectedInvoices).filter(invoiceId => 
    storageStatuses[invoiceId]?.status === 'failed'
  ).length;

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const clientOptions = [
    { value: '', label: 'All Clients' },
    ...clients.map(client => ({
      value: client.id,
      label: client.name
    }))
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <h3 className="text-sm font-medium text-gray-900">Filters & Search</h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setFilters({
              status: '',
              clientId: '',
              search: '',
              dateFrom: '',
              dateTo: ''
            })}
            className="text-gray-500 hover:text-gray-700"
          >
            Clear All
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <Select
              value={filters.status}
              onChange={(value) => setFilters(prev => ({ ...prev, status: value as InvoiceStatus | '' }))}
              options={statusOptions}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <Select
              value={filters.clientId}
              onChange={(value) => setFilters(prev => ({ ...prev, clientId: value as string }))}
              options={clientOptions}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Invoice # or client..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Bulk Retry Result */}
      {bulkRetryResult && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">
                Bulk retry completed: <span className="font-medium">{bulkRetryResult.successful} successful</span>
                {bulkRetryResult.failed > 0 && (
                  <span>, <span className="font-medium">{bulkRetryResult.failed} failed</span></span>
                )}
                {' '}out of {bulkRetryResult.total} total
              </p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  onClick={() => setBulkRetryResult(null)}
                  className="inline-flex bg-blue-50 rounded-md p-1.5 text-blue-500 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-50 focus:ring-blue-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {failedInvoices.length > 0 && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedFailedCount === failedInvoices.length && failedInvoices.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  Select all failed uploads ({failedInvoices.length})
                </span>
              </div>
              {selectedFailedCount > 0 && (
                <span className="text-sm text-blue-600 font-medium">
                  {selectedFailedCount} selected
                </span>
              )}
            </div>
            
            {selectedFailedCount > 0 && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedInvoices(new Set());
                    setShowBulkActions(false);
                  }}
                  disabled={bulkRetrying}
                >
                  Clear Selection
                </Button>
                <Button
                  onClick={handleBulkRetryUpload}
                  disabled={bulkRetrying}
                  size="sm"
                >
                  <ArrowPathIcon className={`h-4 w-4 mr-2 ${bulkRetrying ? 'animate-spin' : ''}`} />
                  {bulkRetrying ? 'Retrying...' : `Retry ${selectedFailedCount} Upload${selectedFailedCount > 1 ? 's' : ''}`}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {failedInvoices.length > 0 && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedFailedCount === failedInvoices.length && failedInvoices.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                )}
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('invoiceNumber')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Invoice #</span>
                    {sortBy === 'invoiceNumber' && (
                      <span className="text-blue-500">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('issueDate')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Issue Date</span>
                    {sortBy === 'issueDate' && (
                      <span className="text-blue-500">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('dueDate')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Due Date</span>
                    {sortBy === 'dueDate' && (
                      <span className="text-blue-500">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('total')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Total</span>
                    {sortBy === 'total' && (
                      <span className="text-blue-500">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Storage
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={failedInvoices.length > 0 ? 10 : 9} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2">Loading invoices...</span>
                    </div>
                  </td>
                </tr>
              ) : sortedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={failedInvoices.length > 0 ? 10 : 9} className="px-6 py-12 text-center text-gray-500">
                    No invoices found matching your criteria.
                  </td>
                </tr>
              ) : (
                sortedInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    {failedInvoices.length > 0 && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        {storageStatuses[invoice.id]?.status === 'failed' ? (
                          <input
                            type="checkbox"
                            checked={selectedInvoices.has(invoice.id)}
                            onChange={(e) => handleSelectInvoice(invoice.id, e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        ) : (
                          <div className="h-4 w-4"></div>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getClientName(invoice.clientId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(invoice.status)}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(invoice.issueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(invoice.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={invoice.balance > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                        {formatCurrency(invoice.balance)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <StorageStatusIndicator 
                          status={storageStatuses[invoice.id]} 
                          size="sm"
                        />
                        {storageStatuses[invoice.id]?.status === 'failed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRetryUpload(invoice.id)}
                            disabled={retryingUpload === invoice.id}
                            className="text-blue-600 hover:text-blue-700 p-1"
                            title="Retry upload to Google Drive"
                          >
                            <ArrowPathIcon className={`h-3 w-3 ${retryingUpload === invoice.id ? 'animate-spin' : ''}`} />
                          </Button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(invoice)}
                          className="text-blue-600 hover:text-blue-700"
                          title="View Invoice"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        
                        {onDownloadPDF && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDownloadPDF(invoice)}
                            className="text-purple-600 hover:text-purple-700"
                            title="Download PDF"
                          >
                            <DocumentArrowDownIcon className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {/* Status change buttons */}
                        {onStatusChange && (
                          <>
                            {invoice.status === 'draft' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onStatusChange(invoice, 'sent')}
                                className="text-green-600 hover:text-green-700"
                                title="Mark as Sent"
                              >
                                <PaperAirplaneIcon className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {(invoice.status === 'sent' || invoice.status === 'overdue') && invoice.balance > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onStatusChange(invoice, 'paid')}
                                className="text-green-600 hover:text-green-700"
                                title="Mark as Paid"
                              >
                                <CheckCircleIcon className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {invoice.status !== 'cancelled' && invoice.status !== 'paid' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onStatusChange(invoice, 'cancelled')}
                                className="text-red-600 hover:text-red-700"
                                title="Cancel Invoice"
                              >
                                <XCircleIcon className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(invoice)}
                          className="text-gray-600 hover:text-gray-700"
                          title="Edit Invoice"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(invoice)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete Invoice"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      {!isLoading && sortedInvoices.length > 0 && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Invoices:</span>
              <span className="ml-2 font-medium">{sortedInvoices.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Total Amount:</span>
              <span className="ml-2 font-medium">
                {formatCurrency(sortedInvoices.reduce((sum, inv) => sum + inv.total, 0))}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Total Paid:</span>
              <span className="ml-2 font-medium text-green-600">
                {formatCurrency(sortedInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0))}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Outstanding:</span>
              <span className="ml-2 font-medium text-red-600">
                {formatCurrency(sortedInvoices.reduce((sum, inv) => sum + inv.balance, 0))}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}