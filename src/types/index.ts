// Core data types for the Invoice Ninja clone application
import { DefaultSession } from 'next-auth'

// NextAuth session extension
declare module 'next-auth' {
  interface Session extends DefaultSession {
    accessToken?: string
    error?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    accessTokenExpires?: number
    error?: string
  }
}

// Address interface for reusability
export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Client interface
export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address: Address;
  createdAt: Date;
  updatedAt: Date;
}

// Line item interface
export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

// Invoice status enum
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

// Payment method enum
export type PaymentMethod = 'cash' | 'check' | 'credit_card' | 'bank_transfer' | 'paypal' | 'other';

// Invoice interface
export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  templateId?: string;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  lineItems: LineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  balance: number;
  notes?: string;
  isRecurring: boolean;
  recurringSchedule?: RecurringSchedule;
  sentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Recurring schedule interface
export interface RecurringSchedule {
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  interval: number; // e.g., every 2 months
  startDate: Date;
  endDate?: Date;
  nextInvoiceDate: Date;
  isActive: boolean;
}

// Payment interface
export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: Date;
}

// Template interface
export interface Template {
  id: string;
  name: string;
  description?: string;
  lineItems: Omit<LineItem, 'id'>[];
  taxRate: number;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Company settings interface
export interface CompanySettings {
  name: string;
  email: string;
  phone?: string;
  address: Address;
  logo?: string;
  taxRate: number;
  paymentTerms: number; // days
  invoiceTemplate: string;
  currency: string;
  dateFormat: string;
  timeZone: string;
}

// Application settings interface
export interface AppSettings {
  googleSheetsId?: string;
  isSetupComplete: boolean;
  lastBackup?: Date;
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
}

// API Response types
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    field?: string; // For field-specific validation errors
  };
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

// Filter types
export interface ClientFilters {
  search?: string;
  country?: string;
  state?: string;
}

export interface InvoiceFilters {
  status?: InvoiceStatus;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface PaymentFilters {
  invoiceId?: string;
  paymentMethod?: PaymentMethod;
  dateFrom?: string;
  dateTo?: string;
}

// Google Sheets specific types
export interface SheetsRange {
  range: string;
  values: string[][];
}

export interface SheetsError {
  code: number;
  message: string;
  status: string;
}

// Form data types
export interface ClientFormData {
  name: string;
  email: string;
  phone?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface LineItemFormData {
  description: string;
  quantity: number;
  rate: number;
}

export interface RecurringScheduleFormData {
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  interval: number;
  startDate: string;
  endDate?: string;
}

export interface InvoiceFormData {
  clientId: string;
  templateId?: string;
  issueDate: string;
  dueDate: string;
  lineItems: LineItemFormData[];
  taxRate: number;
  notes?: string;
  isRecurring: boolean;
  recurringSchedule?: RecurringScheduleFormData;
}

export interface PaymentFormData {
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface TemplateFormData {
  name: string;
  description?: string;
  lineItems: LineItemFormData[];
  taxRate: number;
  notes?: string;
  isActive: boolean;
}

export interface CompanySettingsFormData {
  name: string;
  email: string;
  phone?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  logo?: string;
  taxRate: number;
  paymentTerms: number;
  invoiceTemplate: string;
  currency: string;
  dateFormat: string;
  timeZone: string;
}

export interface AppSettingsFormData {
  googleSheetsId?: string;
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
}

// Utility types for API operations
export type CreateClientData = Omit<Client, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateClientData = Partial<CreateClientData>;

export type CreateInvoiceData = Omit<Invoice, 'id' | 'invoiceNumber' | 'paidAmount' | 'balance' | 'sentDate' | 'createdAt' | 'updatedAt'>;
export type UpdateInvoiceData = Partial<Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>>;

export type CreatePaymentData = Omit<Payment, 'id' | 'createdAt'>;
export type UpdatePaymentData = Partial<Omit<Payment, 'id' | 'invoiceId' | 'createdAt'>>;

export type CreateTemplateData = Omit<Template, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTemplateData = Partial<CreateTemplateData>;

// Dashboard analytics types
export interface DashboardMetrics {
  totalRevenue: number;
  outstandingAmount: number;
  paidAmount: number;
  overdueAmount: number;
  totalClients: number;
  activeClients: number;
  totalInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'invoice_created' | 'invoice_sent' | 'payment_received' | 'client_added';
  description: string;
  timestamp: Date;
  relatedId?: string;
}

// Report types
export interface RevenueReport {
  period: string;
  revenue: number;
  invoiceCount: number;
  clientCount: number;
}

export interface ClientReport {
  clientId: string;
  clientName: string;
  totalInvoiced: number;
  totalPaid: number;
  outstandingAmount: number;
  invoiceCount: number;
}

export interface InvoiceStatusReport {
  status: InvoiceStatus;
  count: number;
  totalAmount: number;
}

// Form validation error types
export interface FormErrors {
  [key: string]: string | string[] | FormErrors;
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface AsyncState<T> extends LoadingState {
  data?: T;
}

// Search and sort types
export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface SearchConfig {
  query: string;
  fields: string[];
}