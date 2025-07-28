'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PaymentFormData, PaymentMethod, Invoice } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from './form-field';
import { Alert } from '@/components/ui/alert';

const paymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  paymentMethod: z.enum(['cash', 'check', 'credit_card', 'bank_transfer', 'paypal', 'other']),
  notes: z.string().optional()
});

interface PaymentFormProps {
  invoice?: Invoice;
  invoices?: Invoice[];
  onSubmit: (data: PaymentFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const paymentMethodOptions = [
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'other', label: 'Other' }
];

export function PaymentForm({ invoice, invoices = [], onSubmit, onCancel, isLoading = false }: PaymentFormProps) {
  const [error, setError] = useState<string>('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | undefined>(invoice);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      invoiceId: invoice?.id || '',
      amount: invoice?.balance || 0,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash' as PaymentMethod,
      notes: ''
    }
  });

  const watchedInvoiceId = watch('invoiceId');

  // Update selected invoice when invoice ID changes
  const handleInvoiceChange = (invoiceId: string | number) => {
    const invoiceIdStr = String(invoiceId);
    const newSelectedInvoice = invoices.find(inv => inv.id === invoiceIdStr);
    setSelectedInvoice(newSelectedInvoice);
    setValue('invoiceId', invoiceIdStr);
    
    // Auto-fill amount with remaining balance
    if (newSelectedInvoice) {
      setValue('amount', newSelectedInvoice.balance);
    }
  };

  const handleFormSubmit = async (data: PaymentFormData) => {
    try {
      setError('');
      
      // Validate payment amount doesn't exceed balance
      if (selectedInvoice && data.amount > selectedInvoice.balance) {
        setError(`Payment amount cannot exceed the outstanding balance of $${selectedInvoice.balance.toFixed(2)}`);
        return;
      }

      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment');
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {!invoice && (
        <FormField
          label="Invoice"
          error={errors.invoiceId?.message}
          required
        >
          <Select
            value={watchedInvoiceId}
            onChange={handleInvoiceChange}
            disabled={isLoading}
            placeholder="Select an invoice"
            options={[
              { value: '', label: 'Select an invoice' },
              ...invoices
                .filter(inv => inv.balance > 0) // Only show invoices with outstanding balance
                .map(inv => ({
                  value: inv.id,
                  label: `${inv.invoiceNumber} - ${inv.clientId} (Balance: $${inv.balance.toFixed(2)})`
                }))
            ]}
          />
        </FormField>
      )}

      {selectedInvoice && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Invoice Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Invoice Number:</span>
              <span className="ml-2 font-medium">{selectedInvoice.invoiceNumber}</span>
            </div>
            <div>
              <span className="text-gray-600">Total Amount:</span>
              <span className="ml-2 font-medium">${selectedInvoice.total.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-600">Paid Amount:</span>
              <span className="ml-2 font-medium">${selectedInvoice.paidAmount.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-600">Outstanding Balance:</span>
              <span className="ml-2 font-medium text-red-600">${selectedInvoice.balance.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      <FormField
        label="Payment Amount"
        error={errors.amount?.message}
        required
      >
        <Input
          type="number"
          step="0.01"
          min="0.01"
          max={selectedInvoice?.balance}
          {...register('amount', { valueAsNumber: true })}
          disabled={isLoading}
        />
      </FormField>

      <FormField
        label="Payment Date"
        error={errors.paymentDate?.message}
        required
      >
        <Input
          type="date"
          {...register('paymentDate')}
          disabled={isLoading}
        />
      </FormField>

      <FormField
        label="Payment Method"
        error={errors.paymentMethod?.message}
        required
      >
        <Select
          value={watch('paymentMethod')}
          onChange={(value) => setValue('paymentMethod', value as PaymentMethod)}
          disabled={isLoading}
          options={paymentMethodOptions}
        />
      </FormField>

      <FormField
        label="Notes"
        error={errors.notes?.message}
      >
        <Textarea
          {...register('notes')}
          disabled={isLoading}
          rows={3}
          placeholder="Optional notes about this payment..."
        />
      </FormField>

      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !selectedInvoice}
        >
          {isLoading ? 'Recording...' : 'Record Payment'}
        </Button>
      </div>
    </form>
  );
}