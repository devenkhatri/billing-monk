'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { invoiceFormSchema, type InvoiceFormData } from '@/lib/validations';
import { Client, Invoice, Template, ApiResponse } from '@/types';
import { FormField } from './form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { PlusIcon, TrashIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';

interface InvoiceFormProps {
  clients: Client[];
  invoice?: Invoice;
  onSubmit: (data: InvoiceFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function InvoiceForm({ 
  clients, 
  invoice, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: InvoiceFormProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [subtotal, setSubtotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [total, setTotal] = useState(0);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: invoice ? {
      clientId: invoice.clientId,
      templateId: invoice.templateId || '',
      issueDate: invoice.issueDate.toISOString().split('T')[0],
      dueDate: invoice.dueDate.toISOString().split('T')[0],
      lineItems: invoice.lineItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.rate
      })),
      taxRate: invoice.taxRate,
      notes: invoice.notes || '',
      isRecurring: invoice.isRecurring,
      recurringSchedule: invoice.recurringSchedule ? {
        frequency: invoice.recurringSchedule.frequency,
        interval: invoice.recurringSchedule.interval,
        startDate: invoice.recurringSchedule.startDate.toISOString().split('T')[0],
        endDate: invoice.recurringSchedule.endDate?.toISOString().split('T')[0] || ''
      } : undefined
    } : {
      clientId: '',
      templateId: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      lineItems: [{ description: '', quantity: 1, rate: 0 }],
      taxRate: 0,
      notes: '',
      isRecurring: false
    }
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'lineItems'
  });

  const watchedLineItems = watch('lineItems');
  const watchedTaxRate = watch('taxRate');
  const watchedTemplateId = watch('templateId');
  const watchedIsRecurring = watch('isRecurring');

  // Load templates on component mount
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const response = await fetch('/api/templates');
        const data: ApiResponse<Template[]> = await response.json();
        
        if (data.success) {
          setTemplates(data.data.filter(template => template.isActive));
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, []);

  // Calculate totals whenever line items or tax rate changes
  useEffect(() => {
    const newSubtotal = watchedLineItems.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      return sum + (quantity * rate);
    }, 0);

    const newTaxAmount = newSubtotal * (Number(watchedTaxRate) / 100);
    const newTotal = newSubtotal + newTaxAmount;

    setSubtotal(newSubtotal);
    setTaxAmount(newTaxAmount);
    setTotal(newTotal);
  }, [watchedLineItems, watchedTaxRate]);

  // Handle template selection
  useEffect(() => {
    if (watchedTemplateId && templates.length > 0) {
      const selectedTemplate = templates.find(t => t.id === watchedTemplateId);
      if (selectedTemplate) {
        // Replace line items with template line items
        const templateLineItems = selectedTemplate.lineItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate
        }));
        
        replace(templateLineItems);
        setValue('taxRate', selectedTemplate.taxRate);
        setValue('notes', selectedTemplate.notes || '');
      }
    }
  }, [watchedTemplateId, templates, replace, setValue]);

  const clientOptions = clients.map(client => ({
    value: client.id,
    label: `${client.name} (${client.email})`
  }));

  const templateOptions = [
    { value: '', label: 'No template' },
    ...templates.map(template => ({
      value: template.id,
      label: template.name
    }))
  ];

  const addLineItem = () => {
    append({ description: '', quantity: 1, rate: 0 });
  };

  const removeLineItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'Enter':
            event.preventDefault();
            handleSubmit(onSubmit)();
            break;
          case 'n':
            event.preventDefault();
            addLineItem();
            break;
          case 'Escape':
            event.preventDefault();
            onCancel();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit, onSubmit, onCancel]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Client"
          error={errors.clientId?.message}
          required
        >
          <Select
            value={watch('clientId')}
            onChange={(value) => setValue('clientId', value as string)}
            options={clientOptions}
            placeholder="Select a client"
            error={!!errors.clientId}
          />
        </FormField>

        <FormField
          label="Template"
          error={errors.templateId?.message}
        >
          <Select
            value={watch('templateId') || ''}
            onChange={(value) => setValue('templateId', value as string)}
            options={templateOptions}
            placeholder={loadingTemplates ? "Loading templates..." : "Select a template (optional)"}
            disabled={loadingTemplates}
            error={!!errors.templateId}
          />
        </FormField>

        <FormField
          label="Issue Date"
          error={errors.issueDate?.message}
          required
        >
          <Input
            type="date"
            {...register('issueDate')}
            error={errors.issueDate?.message}
          />
        </FormField>

        <FormField
          label="Due Date"
          error={errors.dueDate?.message}
          required
        >
          <Input
            type="date"
            {...register('dueDate')}
            error={errors.dueDate?.message}
          />
        </FormField>

        <FormField
          label="Tax Rate (%)"
          error={errors.taxRate?.message}
        >
          <Input
            type="number"
            step="0.01"
            min="0"
            max="100"
            {...register('taxRate', { valueAsNumber: true })}
            error={errors.taxRate?.message}
          />
        </FormField>
      </div>

      {/* Line Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Line Items</h3>
          <div className="flex space-x-2">
            {watchedTemplateId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const selectedTemplate = templates.find(t => t.id === watchedTemplateId);
                  if (selectedTemplate) {
                    const templateLineItems = selectedTemplate.lineItems.map(item => ({
                      description: item.description,
                      quantity: item.quantity,
                      rate: item.rate
                    }));
                    replace(templateLineItems);
                  }
                }}
              >
                <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                Apply Template
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLineItem}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>

        {errors.lineItems && (
          <p className="text-sm text-red-600">{errors.lineItems.message}</p>
        )}

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-12 gap-3 items-start">
              <div className="col-span-5">
                <FormField
                  label={index === 0 ? "Description" : ""}
                  error={errors.lineItems?.[index]?.description?.message}
                >
                  <Input
                    {...register(`lineItems.${index}.description`)}
                    placeholder="Item description"
                    error={errors.lineItems?.[index]?.description?.message}
                  />
                </FormField>
              </div>

              <div className="col-span-2">
                <FormField
                  label={index === 0 ? "Quantity" : ""}
                  error={errors.lineItems?.[index]?.quantity?.message}
                >
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    {...register(`lineItems.${index}.quantity`, { valueAsNumber: true })}
                    placeholder="1"
                    error={errors.lineItems?.[index]?.quantity?.message}
                  />
                </FormField>
              </div>

              <div className="col-span-2">
                <FormField
                  label={index === 0 ? "Rate" : ""}
                  error={errors.lineItems?.[index]?.rate?.message}
                >
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register(`lineItems.${index}.rate`, { valueAsNumber: true })}
                    placeholder="0.00"
                    error={errors.lineItems?.[index]?.rate?.message}
                  />
                </FormField>
              </div>

              <div className="col-span-2">
                <FormField label={index === 0 ? "Amount" : ""}>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900 font-medium">
                    ${((watchedLineItems[index]?.quantity || 0) * (watchedLineItems[index]?.rate || 0)).toFixed(2)}
                  </div>
                </FormField>
              </div>

              <div className="col-span-1 flex justify-center">
                {index === 0 && <div className="text-sm font-medium text-gray-700 py-2">Action</div>}
                {index > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLineItem(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="border-t pt-4">
        <div className="flex justify-end">
          <div className="w-64 space-y-2 bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax ({watchedTaxRate.toFixed(1)}%):</span>
              <span className="font-medium">${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold border-t border-gray-300 pt-2">
              <span>Total:</span>
              <span className="text-blue-600">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recurring Invoice Settings */}
      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isRecurring"
            {...register('isRecurring')}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isRecurring" className="ml-2 block text-sm font-medium text-gray-700">
            Make this a recurring invoice
          </label>
        </div>

        {watchedIsRecurring && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
            <h4 className="text-sm font-medium text-blue-900">Recurring Schedule</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Frequency"
                error={errors.recurringSchedule?.frequency?.message}
                required
              >
                <Select
                  value={watch('recurringSchedule.frequency') || ''}
                  onChange={(value) => setValue('recurringSchedule.frequency', value as 'weekly' | 'monthly' | 'quarterly' | 'yearly')}
                  options={[
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'quarterly', label: 'Quarterly' },
                    { value: 'yearly', label: 'Yearly' }
                  ]}
                  placeholder="Select frequency"
                  error={!!errors.recurringSchedule?.frequency}
                />
              </FormField>

              <FormField
                label="Interval"
                error={errors.recurringSchedule?.interval?.message}
                required
              >
                <Input
                  type="number"
                  min="1"
                  max="12"
                  {...register('recurringSchedule.interval', { valueAsNumber: true })}
                  placeholder="1"
                  error={errors.recurringSchedule?.interval?.message}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Every {watch('recurringSchedule.interval') || 1} {watch('recurringSchedule.frequency') || 'period'}(s)
                </p>
              </FormField>

              <FormField
                label="Start Date"
                error={errors.recurringSchedule?.startDate?.message}
                required
              >
                <Input
                  type="date"
                  {...register('recurringSchedule.startDate')}
                  error={errors.recurringSchedule?.startDate?.message}
                />
              </FormField>

              <FormField
                label="End Date (Optional)"
                error={errors.recurringSchedule?.endDate?.message}
              >
                <Input
                  type="date"
                  {...register('recurringSchedule.endDate')}
                  error={errors.recurringSchedule?.endDate?.message}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for indefinite recurring
                </p>
              </FormField>
            </div>

            <div className="bg-blue-100 p-3 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Recurring invoices will be automatically generated based on this schedule. 
                You can manage and modify recurring invoices from the invoices list.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <FormField
        label="Notes"
        error={errors.notes?.message}
      >
        <textarea
          {...register('notes')}
          rows={3}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Additional notes or terms..."
        />
      </FormField>

      {/* Keyboard shortcuts hint */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
        <strong>Keyboard shortcuts:</strong> Ctrl/Cmd + Enter (Save), Ctrl/Cmd + N (Add item), Escape (Cancel)
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
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
          loading={isLoading}
        >
          {invoice ? 'Update Invoice' : 'Create Invoice'}
        </Button>
      </div>
    </form>
  );
}