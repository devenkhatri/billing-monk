'use client';

import { useState } from 'react';
import { Invoice, Client, PaymentFormData } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Alert } from '@/components/ui/alert';
import { PaymentForm } from '@/components/forms/payment-form';
import { PaymentHistory } from '@/components/payments/payment-history';
import { formatCurrency, formatDate } from '@/lib/utils';

interface InvoiceDetailProps {
  invoice: Invoice;
  client: Client;
  onClose: () => void;
  onInvoiceUpdate?: (invoice: Invoice) => void;
}

export function InvoiceDetail({ invoice, client, onClose, onInvoiceUpdate }: InvoiceDetailProps) {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string>('');
  const [currentInvoice, setCurrentInvoice] = useState<Invoice>(invoice);

  const handleAddPayment = async (data: PaymentFormData) => {
    try {
      setIsSubmittingPayment(true);
      setError('');

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to record payment');
      }

      // Refresh invoice data to get updated balance
      const invoiceResponse = await fetch(`/api/invoices/${invoice.id}`);
      if (invoiceResponse.ok) {
        const invoiceData = await invoiceResponse.json();
        setCurrentInvoice(invoiceData.data);
        
        // Notify parent component of the update
        if (onInvoiceUpdate) {
          onInvoiceUpdate(invoiceData.data);
        }
      }

      setShowPaymentForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment');
      throw err; // Re-throw to let the form handle it
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    try {
      setError('');

      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to delete payment');
      }

      // Refresh invoice data to get updated balance
      const invoiceResponse = await fetch(`/api/invoices/${invoice.id}`);
      if (invoiceResponse.ok) {
        const invoiceData = await invoiceResponse.json();
        setCurrentInvoice(invoiceData.data);
        
        // Notify parent component of the update
        if (onInvoiceUpdate) {
          onInvoiceUpdate(invoiceData.data);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete payment');
    }
  };

  const handleGeneratePDF = async () => {
    try {
      setIsGeneratingPDF(true);
      setError('');

      const response = await fetch(`/api/invoices/${currentInvoice.id}/pdf`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to generate PDF');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${currentInvoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleSendInvoice = async () => {
    try {
      setIsSending(true);
      setError('');

      const response = await fetch(`/api/invoices/${currentInvoice.id}/send`, {
        method: 'POST'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to send invoice');
      }

      // Update the current invoice with the new status
      setCurrentInvoice(result.data);
      
      // Notify parent component of the update
      if (onInvoiceUpdate) {
        onInvoiceUpdate(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invoice');
    } finally {
      setIsSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
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

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Invoice Header */}
      <Card className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Invoice {currentInvoice.invoiceNumber}
            </h2>
            <div className="mt-2">
              <span className={getStatusBadge(currentInvoice.status)}>
                {currentInvoice.status.charAt(0).toUpperCase() + currentInvoice.status.slice(1)}
              </span>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handlePreview}
              disabled={isGeneratingPDF || isSending}
            >
              Preview
            </Button>
            <Button
              variant="outline"
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF || isSending}
            >
              {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
            </Button>
            {currentInvoice.status === 'draft' && (
              <Button
                onClick={handleSendInvoice}
                disabled={isGeneratingPDF || isSending}
              >
                {isSending ? 'Sending...' : 'Send Invoice'}
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Bill To</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="font-medium text-gray-900">{client.name}</div>
              <div>{client.email}</div>
              {client.phone && <div>{client.phone}</div>}
              <div>
                {client.address.street}<br />
                {client.address.city}, {client.address.state} {client.address.zipCode}<br />
                {client.address.country}
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Invoice Details</h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Issue Date:</span>
                <span className="font-medium">{formatDate(currentInvoice.issueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Due Date:</span>
                <span className="font-medium">{formatDate(currentInvoice.dueDate)}</span>
              </div>
              {currentInvoice.sentDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Sent Date:</span>
                  <span className="font-medium">{formatDate(currentInvoice.sentDate)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Line Items */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Line Items</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-sm font-medium text-gray-600">Description</th>
                <th className="text-right py-2 text-sm font-medium text-gray-600">Qty</th>
                <th className="text-right py-2 text-sm font-medium text-gray-600">Rate</th>
                <th className="text-right py-2 text-sm font-medium text-gray-600">Amount</th>
              </tr>
            </thead>
            <tbody>
              {currentInvoice.lineItems.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-3 text-sm text-gray-900">{item.description}</td>
                  <td className="py-3 text-sm text-gray-900 text-right">{item.quantity}</td>
                  <td className="py-3 text-sm text-gray-900 text-right">{formatCurrency(item.rate)}</td>
                  <td className="py-3 text-sm text-gray-900 text-right">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-6 flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">{formatCurrency(currentInvoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax ({currentInvoice.taxRate}%):</span>
              <span className="font-medium">{formatCurrency(currentInvoice.taxAmount)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
              <span>Total:</span>
              <span>{formatCurrency(currentInvoice.total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Paid:</span>
              <span className="font-medium text-green-600">{formatCurrency(currentInvoice.paidAmount)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold">
              <span>Balance:</span>
              <span className={currentInvoice.balance > 0 ? 'text-red-600' : 'text-green-600'}>
                {formatCurrency(currentInvoice.balance)}
              </span>
            </div>
          </div>
        </div>

        {currentInvoice.notes && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Notes</h4>
            <p className="text-sm text-gray-600">{currentInvoice.notes}</p>
          </div>
        )}
      </Card>

      {/* Payment History */}
      <PaymentHistory
        invoiceId={currentInvoice.id}
        onAddPayment={() => setShowPaymentForm(true)}
        onDeletePayment={handleDeletePayment}
        showAddButton={currentInvoice.balance > 0}
      />

      {/* Payment Form Modal */}
      <Modal
        isOpen={showPaymentForm}
        onClose={() => setShowPaymentForm(false)}
        title="Record Payment"
        size="lg"
      >
        <PaymentForm
          invoice={currentInvoice}
          onSubmit={handleAddPayment}
          onCancel={() => setShowPaymentForm(false)}
          isLoading={isSubmittingPayment}
        />
      </Modal>

      {/* Invoice Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title={`Invoice ${currentInvoice.invoiceNumber} Preview`}
        size="xl"
      >
        <div className="h-96 overflow-auto">
          <iframe
            src={`/api/invoices/${currentInvoice.id}/preview`}
            className="w-full h-full border-0"
            title="Invoice Preview"
          />
        </div>
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={() => setShowPreview(false)}>
            Close
          </Button>
          <Button
            onClick={handleGeneratePDF}
            disabled={isGeneratingPDF}
          >
            {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}