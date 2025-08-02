import { render, screen } from '@testing-library/react';
import { StorageStatusIndicator } from '@/components/ui/storage-status-indicator';
import { InvoiceStorageStatus } from '@/types';

// Mock the icons
jest.mock('@heroicons/react/24/outline', () => ({
  CloudArrowUpIcon: () => <div data-testid="cloud-icon" />,
  CheckCircleIcon: () => <div data-testid="check-icon" />,
  ExclamationTriangleIcon: () => <div data-testid="warning-icon" />,
  XCircleIcon: () => <div data-testid="x-icon" />,
  ClockIcon: () => <div data-testid="clock-icon" />
}));

describe('StorageStatusIndicator', () => {
  it('renders disabled status when no status provided', () => {
    render(<StorageStatusIndicator />);
    
    const indicator = screen.getByTestId('x-icon');
    expect(indicator).toBeInTheDocument();
  });

  it('renders stored status correctly', () => {
    const status: InvoiceStorageStatus = {
      invoiceId: 'test-invoice',
      status: 'stored',
      retryCount: 0,
      uploadedAt: new Date('2024-01-01')
    };

    render(<StorageStatusIndicator status={status} showLabel />);
    
    expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    expect(screen.getByText('Stored')).toBeInTheDocument();
  });

  it('renders pending status correctly', () => {
    const status: InvoiceStorageStatus = {
      invoiceId: 'test-invoice',
      status: 'pending',
      retryCount: 0
    };

    render(<StorageStatusIndicator status={status} showLabel />);
    
    expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders failed status correctly', () => {
    const status: InvoiceStorageStatus = {
      invoiceId: 'test-invoice',
      status: 'failed',
      retryCount: 2,
      errorMessage: 'Upload failed',
      lastAttempt: new Date('2024-01-01')
    };

    render(<StorageStatusIndicator status={status} showLabel />);
    
    expect(screen.getByTestId('warning-icon')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('renders disabled status correctly', () => {
    const status: InvoiceStorageStatus = {
      invoiceId: 'test-invoice',
      status: 'disabled',
      retryCount: 0
    };

    render(<StorageStatusIndicator status={status} showLabel />);
    
    expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('applies correct size classes', () => {
    const status: InvoiceStorageStatus = {
      invoiceId: 'test-invoice',
      status: 'stored',
      retryCount: 0
    };

    const { rerender } = render(<StorageStatusIndicator status={status} size="sm" />);
    expect(document.querySelector('.w-5')).toBeInTheDocument();

    rerender(<StorageStatusIndicator status={status} size="lg" />);
    expect(document.querySelector('.w-8')).toBeInTheDocument();
  });
});