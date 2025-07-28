'use client';

import { useState, useEffect } from 'react';
import { Payment, PaymentMethod } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PaymentHistoryProps {
  invoiceId: string;
  onAddPayment?: () => void;
  onDeletePayment?: (paymentId: string) => void;
  showAddButton?: boolean;
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Cash',
  check: 'Check',
  credit_card: 'Credit Card',
  bank_transfer: 'Bank Transfer',
  paypal: 'PayPal',
  other: 'Other'
};

export function PaymentHistory({ 
  invoiceId, 
  onAddPayment, 
  onDeletePayment, 
  showAddButton = true 
}: PaymentHistoryProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string>('');

  useEffect(() => {
    fetchPayments();
  }, [invoiceId]);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await fetch(`/api/payments?invoiceId=${invoiceId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch payments');
      }
      
      setPayments(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to delete this payment? This will update the invoice balance.')) {
      return;
    }

    try {
      setDeletingId(paymentId);
      setError('');
      
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to delete payment');
      }
      
      // Remove payment from local state
      setPayments(prev => prev.filter(p => p.id !== paymentId));
      
      // Call parent callback if provided
      if (onDeletePayment) {
        onDeletePayment(paymentId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete payment');
    } finally {
      setDeletingId('');
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </Card>
    );
  }

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
        {showAddButton && onAddPayment && (
          <Button onClick={onAddPayment} size="sm">
            Add Payment
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {payments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No payments recorded for this invoice.</p>
          {showAddButton && onAddPayment && (
            <Button onClick={onAddPayment} className="mt-4">
              Record First Payment
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="mb-4 p-3 bg-green-50 rounded-lg">
            <div className="text-sm text-green-700">
              Total Paid: <span className="font-semibold">{formatCurrency(totalPaid)}</span>
            </div>
          </div>

          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(payment.amount)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatDate(payment.paymentDate)}
                      </div>
                      <div className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {paymentMethodLabels[payment.paymentMethod]}
                      </div>
                    </div>
                    
                    {payment.notes && (
                      <div className="text-sm text-gray-600 mt-2">
                        <span className="font-medium">Notes:</span> {payment.notes}
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 mt-2">
                      Recorded on {formatDate(payment.createdAt)}
                    </div>
                  </div>

                  {onDeletePayment && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePayment(payment.id)}
                      disabled={deletingId === payment.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {deletingId === payment.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}