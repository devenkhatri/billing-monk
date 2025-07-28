'use client';

import { useState, useEffect } from 'react';
import { Payment, Invoice, Client, PaymentFormData } from '@/types';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Alert } from '@/components/ui/alert';
import { PaymentForm } from '@/components/forms/payment-form';
import { PaymentTable } from '@/components/tables/payment-table';
import { Loading } from '@/components/ui/loading';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Fetch all data in parallel
      const [paymentsRes, invoicesRes, clientsRes] = await Promise.all([
        fetch('/api/payments'),
        fetch('/api/invoices'),
        fetch('/api/clients')
      ]);

      if (!paymentsRes.ok || !invoicesRes.ok || !clientsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [paymentsData, invoicesData, clientsData] = await Promise.all([
        paymentsRes.json(),
        invoicesRes.json(),
        clientsRes.json()
      ]);

      setPayments(paymentsData.data || []);
      setInvoices(invoicesData.data || []);
      setClients(clientsData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPayment = async (data: PaymentFormData) => {
    try {
      setIsSubmitting(true);
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

      // Add the new payment to the list
      setPayments(prev => [result.data, ...prev]);
      setShowAddModal(false);

      // Refresh invoices to get updated balances
      const invoicesRes = await fetch('/api/invoices');
      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        setInvoices(invoicesData.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment');
      throw err; // Re-throw to let the form handle it
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to delete this payment? This will update the invoice balance.')) {
      return;
    }

    try {
      setError('');

      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to delete payment');
      }

      // Remove payment from list
      setPayments(prev => prev.filter(p => p.id !== paymentId));

      // Refresh invoices to get updated balances
      const invoicesRes = await fetch('/api/invoices');
      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        setInvoices(invoicesData.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete payment');
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  // Filter invoices to only show those with outstanding balance for the form
  const unpaidInvoices = invoices.filter(invoice => invoice.balance > 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1">
            Track and manage invoice payments
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          Record Payment
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          {error}
        </Alert>
      )}

      <PaymentTable
        payments={payments}
        invoices={invoices}
        clients={clients}
        onDeletePayment={handleDeletePayment}
      />

      {/* Add Payment Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Record Payment"
        size="lg"
      >
        <PaymentForm
          invoices={unpaidInvoices}
          onSubmit={handleAddPayment}
          onCancel={() => setShowAddModal(false)}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
}