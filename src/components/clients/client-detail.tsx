'use client';

import { useState, useEffect } from 'react';
import { Client, Invoice } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { LoadingState } from '@/components/ui/loading';
import { Alert } from '@/components/ui/alert';

interface ClientDetailProps {
  client: Client;
  onEdit: () => void;
  onClose: () => void;
}

export function ClientDetail({ client, onEdit, onClose }: ClientDetailProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClientInvoices();
  }, [client.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchClientInvoices = async () => {
    try {
      setIsLoadingInvoices(true);
      setError(null);
      
      const response = await fetch(`/api/invoices?clientId=${client.id}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setInvoices(data.data);
      } else {
        // For now, set empty array since invoices API is not fully implemented
        setInvoices([]);
      }
    } catch (err) {
      // For now, set empty array since invoices API is not fully implemented
      setInvoices([]);
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status as keyof typeof statusColors] || statusColors.draft}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };



  // Calculate client statistics
  const totalInvoiced = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const totalPaid = invoices.reduce((sum, invoice) => sum + invoice.paidAmount, 0);
  const totalOutstanding = invoices.reduce((sum, invoice) => sum + invoice.balance, 0);
  const overdueInvoices = invoices.filter(invoice => 
    invoice.status === 'overdue' || 
    (invoice.status === 'sent' && new Date(invoice.dueDate) < new Date())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{client.name}</h2>
          <p className="text-gray-600 mt-1">Client Details</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={onEdit}>
            Edit Client
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Client Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-gray-900">{client.email}</p>
            </div>
            {client.phone && (
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="text-gray-900">{client.phone}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-500">Created</label>
              <p className="text-gray-900">
                {new Date(client.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
          <div className="text-gray-900">
            <p>{client.address.street}</p>
            <p>{client.address.city}, {client.address.state} {client.address.zipCode}</p>
            <p>{client.address.country}</p>
          </div>
        </Card>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
            <p className="text-sm text-gray-600">Total Invoices</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalInvoiced)}</p>
            <p className="text-sm text-gray-600">Total Invoiced</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
            <p className="text-sm text-gray-600">Total Paid</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalOutstanding)}</p>
            <p className="text-sm text-gray-600">Outstanding</p>
          </div>
        </Card>
      </div>

      {/* Invoices */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Invoices</h3>
          {overdueInvoices.length > 0 && (
            <Alert variant="warning" className="text-sm">
              {overdueInvoices.length} overdue invoice{overdueInvoices.length !== 1 ? 's' : ''}
            </Alert>
          )}
        </div>

        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        {isLoadingInvoices ? (
          <LoadingState />
        ) : invoices.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No invoices found for this client</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <div className="font-medium text-gray-900">{invoice.invoiceNumber}</div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(invoice.status)}
                  </TableCell>
                  <TableCell>
                    <div className="text-gray-600">
                      {new Date(invoice.issueDate).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-gray-600">
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-gray-900">
                      {formatCurrency(invoice.total)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={`font-medium ${invoice.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(invoice.balance)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}