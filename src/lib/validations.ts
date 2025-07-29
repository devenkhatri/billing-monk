import { z } from 'zod';

// Base validation schemas
export const addressSchema = z.object({
  street: z.string().min(1, 'Street address is required').max(200, 'Street address too long'),
  city: z.string().min(1, 'City is required').max(100, 'City name too long'),
  state: z.string().min(1, 'State is required').max(100, 'State name too long'),
  zipCode: z.string().min(1, 'PIN code is required').max(20, 'PIN code too long'),
  country: z.string().min(1, 'Country is required').max(100, 'Country name too long'),
});

// Client validation schemas
export const clientFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email address').max(255, 'Email too long'),
  phone: z.string().max(20, 'Phone number too long').optional().or(z.literal('')),
  street: z.string().min(1, 'Street address is required').max(200, 'Street address too long'),
  city: z.string().min(1, 'City is required').max(100, 'City name too long'),
  state: z.string().min(1, 'State is required').max(100, 'State name too long'),
  zipCode: z.string().min(1, 'PIN code is required').max(20, 'PIN code too long'),
  country: z.string().min(1, 'Country is required').max(100, 'Country name too long'),
});

export const clientSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(20).optional(),
  address: addressSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Line item validation schemas
export const lineItemFormSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0').max(999999, 'Quantity too large'),
  rate: z.number().min(0, 'Rate must be greater than or equal to 0').max(999999, 'Rate too large'),
});

export const lineItemSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1).max(500),
  quantity: z.number().min(0.01),
  rate: z.number().min(0),
  amount: z.number().min(0),
});

// Recurring schedule validation schema
export const recurringScheduleSchema = z.object({
  frequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']),
  interval: z.number().min(1, 'Interval must be at least 1').max(12, 'Interval too large'),
  startDate: z.date(),
  endDate: z.date().optional(),
  nextInvoiceDate: z.date(),
  isActive: z.boolean(),
});

// Recurring schedule form validation schema (for form input)
export const recurringScheduleFormSchema = z.object({
  frequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']),
  interval: z.number().min(1, 'Interval must be at least 1').max(12, 'Interval too large'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional().or(z.literal('')),
});

// Invoice validation schemas
export const invoiceFormSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  templateId: z.string().optional(),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  lineItems: z.array(lineItemFormSchema).min(1, 'At least one line item is required'),
  taxRate: z.number().min(0, 'GST rate cannot be negative').max(100, 'GST rate cannot exceed 100%'),
  notes: z.string().max(1000, 'Notes too long').optional().or(z.literal('')),
  isRecurring: z.boolean(),
  recurringSchedule: recurringScheduleFormSchema.optional(),
}).refine((data) => {
  if (data.isRecurring && !data.recurringSchedule) {
    return false;
  }
  return true;
}, {
  message: 'Recurring schedule is required for recurring invoices',
  path: ['recurringSchedule'],
}).refine((data) => {
  const issueDate = new Date(data.issueDate);
  const dueDate = new Date(data.dueDate);
  return dueDate >= issueDate;
}, {
  message: 'Due date must be on or after issue date',
  path: ['dueDate'],
}).refine((data) => {
  if (data.isRecurring && data.recurringSchedule) {
    const startDate = new Date(data.recurringSchedule.startDate);
    const endDate = data.recurringSchedule.endDate ? new Date(data.recurringSchedule.endDate) : null;
    
    if (endDate && endDate <= startDate) {
      return false;
    }
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['recurringSchedule', 'endDate'],
});

export const invoiceSchema = z.object({
  id: z.string().uuid(),
  invoiceNumber: z.string().min(1),
  clientId: z.string().uuid(),
  templateId: z.string().uuid().optional(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
  issueDate: z.date(),
  dueDate: z.date(),
  lineItems: z.array(lineItemSchema),
  subtotal: z.number().min(0),
  taxRate: z.number().min(0).max(100),
  taxAmount: z.number().min(0),
  total: z.number().min(0),
  paidAmount: z.number().min(0),
  balance: z.number(),
  notes: z.string().max(1000).optional(),
  isRecurring: z.boolean(),
  recurringSchedule: recurringScheduleSchema.optional(),
  sentDate: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Payment validation schemas
export const paymentFormSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0').max(999999, 'Amount too large'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  paymentMethod: z.enum(['cash', 'check', 'credit_card', 'bank_transfer', 'paypal', 'other'], {
    message: 'Please select a valid payment method',
  }),
  notes: z.string().max(500, 'Notes too long').optional().or(z.literal('')),
});

export const paymentSchema = z.object({
  id: z.string().uuid(),
  invoiceId: z.string().uuid(),
  amount: z.number().min(0.01),
  paymentDate: z.date(),
  paymentMethod: z.enum(['cash', 'check', 'credit_card', 'bank_transfer', 'paypal', 'other']),
  notes: z.string().max(500).optional(),
  createdAt: z.date(),
});

// Template validation schemas
export const templateFormSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(100, 'Template name too long'),
  description: z.string().max(500, 'Description too long').optional().or(z.literal('')),
  lineItems: z.array(lineItemFormSchema).min(1, 'At least one line item is required'),
  taxRate: z.number().min(0, 'GST rate cannot be negative').max(100, 'GST rate cannot exceed 100%'),
  notes: z.string().max(1000, 'Notes too long').optional().or(z.literal('')),
  isActive: z.boolean(),
});

export const templateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  lineItems: z.array(z.object({
    description: z.string().min(1).max(500),
    quantity: z.number().min(0.01),
    rate: z.number().min(0),
  })),
  taxRate: z.number().min(0).max(100),
  notes: z.string().max(1000).optional(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Company settings validation schemas
export const companySettingsFormSchema = z.object({
  name: z.string().min(1, 'Company name is required').max(100, 'Company name too long'),
  email: z.string().email('Invalid email address').max(255, 'Email too long'),
  phone: z.string().max(20, 'Phone number too long').optional().or(z.literal('')),
  street: z.string().min(1, 'Street address is required').max(200, 'Street address too long'),
  city: z.string().min(1, 'City is required').max(100, 'City name too long'),
  state: z.string().min(1, 'State is required').max(100, 'State name too long'),
  zipCode: z.string().min(1, 'PIN code is required').max(20, 'PIN code too long'),
  country: z.string().min(1, 'Country is required').max(100, 'Country name too long'),
  logo: z.string().optional().or(z.literal('')),
  taxRate: z.coerce.number().min(0, 'GST rate cannot be negative').max(100, 'GST rate cannot exceed 100%'),
  paymentTerms: z.coerce.number().min(1, 'Payment terms must be at least 1 day').max(365, 'Payment terms too long'),
  invoiceTemplate: z.string().min(1, 'Invoice template is required'),
  currency: z.string().min(1, 'Currency is required').max(10, 'Currency code too long'),
  dateFormat: z.string().min(1, 'Date format is required'),
  timeZone: z.string().min(1, 'Time zone is required'),
});

export const companySettingsSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(20).optional(),
  address: addressSchema,
  logo: z.string().url().optional(),
  taxRate: z.number().min(0).max(100),
  paymentTerms: z.number().min(1).max(365),
  invoiceTemplate: z.string().min(1),
  currency: z.string().min(1).max(10),
  dateFormat: z.string().min(1),
  timeZone: z.string().min(1),
});

// App settings validation schemas
export const appSettingsFormSchema = z.object({
  googleSheetsId: z.string().optional().or(z.literal('')),
  autoBackup: z.boolean(),
  backupFrequency: z.enum(['daily', 'weekly', 'monthly']),
});

export const appSettingsSchema = z.object({
  googleSheetsId: z.string().optional(),
  isSetupComplete: z.boolean(),
  lastBackup: z.date().optional(),
  autoBackup: z.boolean(),
  backupFrequency: z.enum(['daily', 'weekly', 'monthly']),
});

// API validation schemas
export const paginationSchema = z.object({
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const clientFiltersSchema = z.object({
  search: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
});

export const invoiceFiltersSchema = z.object({
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
  clientId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
});

export const paymentFiltersSchema = z.object({
  invoiceId: z.string().uuid().optional(),
  paymentMethod: z.enum(['cash', 'check', 'credit_card', 'bank_transfer', 'paypal', 'other']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

// Utility validation functions
export const validateEmail = (email: string): boolean => {
  return z.string().email().safeParse(email).success;
};

export const validateUUID = (id: string): boolean => {
  return z.string().uuid().safeParse(id).success;
};

export const validateDate = (date: string): boolean => {
  return !isNaN(Date.parse(date));
};

export const validatePositiveNumber = (num: number): boolean => {
  return z.number().positive().safeParse(num).success;
};

// Type exports for form data
export type ClientFormData = z.infer<typeof clientFormSchema>;
export type LineItemFormData = z.infer<typeof lineItemFormSchema>;
export type InvoiceFormData = z.infer<typeof invoiceFormSchema>;
export type PaymentFormData = z.infer<typeof paymentFormSchema>;
export type TemplateFormData = z.infer<typeof templateFormSchema>;
export type CompanySettingsFormData = z.infer<typeof companySettingsFormSchema>;
export type AppSettingsFormData = z.infer<typeof appSettingsFormSchema>;

// Type exports for API filters
export type PaginationParams = z.infer<typeof paginationSchema>;
export type ClientFilters = z.infer<typeof clientFiltersSchema>;
export type InvoiceFilters = z.infer<typeof invoiceFiltersSchema>;
export type PaymentFilters = z.infer<typeof paymentFiltersSchema>;