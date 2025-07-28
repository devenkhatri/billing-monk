'use client';

import { useState, useEffect } from 'react';
import { Invoice, Client, ApiResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { LoadingState } from '@/components/ui/loading';
import { useNotifications } from '@/lib/notification-context';
import { 
  PlayIcon, 
  PauseIcon, 
  PlusIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface RecurringInvoiceListProps {
  clients: Client[];
}

export function RecurringInvoiceList({ clients }: RecurringInvoiceListProps) {
  const [recurringInvoices, setRecurringInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchRecurringInvoices();
  }, []);

  const fetchRecurringInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/invoices/recurring');
      const data: ApiResponse<Invoice[]> = await response.json();
      
      if (data.success) {
        setRecurringInvoices(data.data);
      } else {
        setError(data.error.message);
      }
    } catch (err) {
      setError('Failed to fetch recurring invoices');
      console.error('Error fetching recurring invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRecurringInvoice = async (id: string, isActive: boolean) => {
    try {
      setActionLoading(id);
      
      const response = await fetch(`/api/invoices/recurring/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });
      
      const data: ApiResponse<Invoice> = await response.json();
      
      if (data.success) {
        setRecurringInvoices(prev => 
          prev.map(invoice => 
            invoice.id === id ? data.data : invoice
          )
        );
        addNotification({
          type: 'success',
          title: 'Recurring invoice updated',
          message: `Recurring invoice has been ${isActive ? 'activated' : 'paused'}`
        });
      } else {
        setError(data.error.message);
      }
    } catch (err) {
      setError('Failed to update recurring invoice');
      console.error('Error updating recurring invoice:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const generateInvoiceNow = async (id: string) => {
    try {
      setActionLoading(id);
      
      const response = await fetch(`/api/invoices/recurring/${id}`, {
        method: 'POST',
      });
      
      const data: ApiResponse<Invoice> = await response.json();
      
      if (data.success) {
        // Refresh the list to update next invoice dates
        await fetchRecurringInvoices();
        setError(null);
        addNotification({
          type: 'success',
          title: 'Invoice generated',
          message: `New invoice ${data.data.invoiceNumber} has been generated`
        });
      } else {
        setError(data.error.message);
      }
    } catch (err) {
      setError('Failed to generate invoice');
      console.error('Error generating invoice:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const generateAllDueInvoices = async () => {
    try {
      setActionLoading('generate-all');
      
      const response = await fetch('/api/invoices/recurring', {
        method: 'POST',
      });
      
      const data: ApiResponse<{ generated: Invoice[]; count: number }> = await response.json();
      
      if (data.success) {
        // Refresh the list to update next invoice dates
        await fetchRecurringInvoices();
        setError(null);
        addNotification({
          type: 'success',
          title: 'Invoices generated',
          message: `${data.data.count} recurring invoices have been generated`
        });
      } else {
        setError(data.error.message);
      }
    } catch (err) {
      setError('Failed to generate due invoices');
      console.error('Error generating due invoices:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown Client';
  };

  const formatFrequency = (frequency: string, interval: number) => {
    const frequencyMap = {
      weekly: 'week',
      monthly: 'month',
      quarterly: 'quarter',
      yearly: 'year'
    };
    
    const unit = frequencyMap[frequency as keyof typeof frequencyMap] || frequency;
    return interval === 1 ? `Every ${unit}` : `Every ${interval} ${unit}s`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  const isOverdue = (nextDate: Date) => {
    return new Date(nextDate) <= new Date();
  };

  if (loading) {
    return <LoadingState message="Loading recurring invoices..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Recurring Invoices</h2>
        <Button
          onClick={generateAllDueInvoices}
          loading={actionLoading === 'generate-all'}
          className="bg-green-600 hover:bg-green-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Generate Due Invoices
        </Button>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {recurringInvoices.length === 0 ? (
        <Card className="p-8 text-center">
          <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Recurring Invoices</h3>
          <p className="text-gray-500 mb-4">
            Create invoices with recurring schedules to see them here.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {recurringInvoices.map((invoice) => (
            <Card key={invoice.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {invoice.invoiceNumber}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      invoice.recurringSchedule?.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {invoice.recurringSchedule?.isActive ? 'Active' : 'Paused'}
                    </span>
                    {invoice.recurringSchedule && isOverdue(invoice.recurringSchedule.nextInvoiceDate) && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Due Now
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <UserIcon className="h-4 w-4 mr-2" />
                      <span>{getClientName(invoice.clientId)}</span>
                    </div>
                    
                    {invoice.recurringSchedule && (
                      <>
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-2" />
                          <span>
                            {formatFrequency(
                              invoice.recurringSchedule.frequency,
                              invoice.recurringSchedule.interval
                            )}
                          </span>
                        </div>
                        
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          <span>Next: {formatDate(invoice.recurringSchedule.nextInvoiceDate)}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-lg font-semibold text-gray-900">
                      ${invoice.total.toFixed(2)}
                    </div>
                    
                    {invoice.recurringSchedule?.endDate && (
                      <div className="text-sm text-gray-500">
                        Ends: {formatDate(invoice.recurringSchedule.endDate)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateInvoiceNow(invoice.id)}
                    loading={actionLoading === invoice.id}
                    disabled={!!actionLoading}
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Generate Now
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleRecurringInvoice(
                      invoice.id, 
                      !invoice.recurringSchedule?.isActive
                    )}
                    loading={actionLoading === invoice.id}
                    disabled={!!actionLoading}
                  >
                    {invoice.recurringSchedule?.isActive ? (
                      <>
                        <PauseIcon className="h-4 w-4 mr-1" />
                        Pause
                      </>
                    ) : (
                      <>
                        <PlayIcon className="h-4 w-4 mr-1" />
                        Resume
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}