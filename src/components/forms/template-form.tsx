'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { templateFormSchema, type TemplateFormData } from '@/lib/validations';
import { Template } from '@/types';
import { FormField } from './form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface TemplateFormProps {
  template?: Template;
  onSubmit: (data: TemplateFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TemplateForm({ 
  template, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: TemplateFormProps) {
  const [subtotal, setSubtotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [total, setTotal] = useState(0);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: template ? {
      name: template.name,
      description: template.description || '',
      lineItems: template.lineItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.rate
      })),
      taxRate: template.taxRate,
      notes: template.notes || '',
      isActive: template.isActive
    } : {
      name: '',
      description: '',
      lineItems: [{ description: '', quantity: 1, rate: 0 }],
      taxRate: 0,
      notes: '',
      isActive: true
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lineItems'
  });

  const watchedLineItems = watch('lineItems');
  const watchedTaxRate = watch('taxRate');

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

  const addLineItem = () => {
    append({ description: '', quantity: 1, rate: 0 });
  };

  const removeLineItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Template Name"
          error={errors.name?.message}
          required
        >
          <Input
            {...register('name')}
            placeholder="e.g., Web Development Services"
            error={errors.name?.message}
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

      <FormField
        label="Description"
        error={errors.description?.message}
      >
        <Input
          {...register('description')}
          placeholder="Brief description of this template"
          error={errors.description?.message}
        />
      </FormField>

      {/* Line Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Line Items</h3>
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

      {/* Notes */}
      <FormField
        label="Notes"
        error={errors.notes?.message}
      >
        <textarea
          {...register('notes')}
          rows={3}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Default notes for invoices using this template..."
        />
      </FormField>

      {/* Active Status */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="isActive"
          {...register('isActive')}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="isActive" className="ml-2 block text-sm font-medium text-gray-700">
          Template is active (available for use in invoices)
        </label>
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
          {template ? 'Update Template' : 'Create Template'}
        </Button>
      </div>
    </form>
  );
}