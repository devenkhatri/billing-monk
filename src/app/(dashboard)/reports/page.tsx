'use client';

import { useState } from 'react';

import { ReportFilters, ReportFilters as ReportFiltersType } from '@/components/reports/report-filters';
import { RevenueReportComponent } from '@/components/reports/revenue-report';
import { ClientReportComponent } from '@/components/reports/client-report';
import { InvoiceStatusReportComponent } from '@/components/reports/invoice-status-report';

type ReportType = 'revenue' | 'client' | 'invoice-status';

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>('revenue');
  const [filters, setFilters] = useState<ReportFiltersType>({});

  const reportTabs = [
    { id: 'revenue' as ReportType, label: 'Revenue Report', description: 'Monthly revenue breakdown' },
    { id: 'client' as ReportType, label: 'Client Report', description: 'Client performance analysis' },
    { id: 'invoice-status' as ReportType, label: 'Invoice Status', description: 'Invoice status summary' }
  ];

  const handleFiltersChange = (newFilters: ReportFiltersType) => {
    setFilters(newFilters);
  };

  const renderActiveReport = () => {
    switch (activeReport) {
      case 'revenue':
        return <RevenueReportComponent filters={filters} />;
      case 'client':
        return <ClientReportComponent filters={filters} />;
      case 'invoice-status':
        return <InvoiceStatusReportComponent filters={filters} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reports</h1>
        <p className="text-gray-600">
          Generate and analyze business reports with filtering and export capabilities
        </p>
      </div>

      {/* Report Type Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {reportTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeReport === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div>
                <div>{tab.label}</div>
                <div className="text-xs text-gray-400 mt-1">{tab.description}</div>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Report Filters */}
      <ReportFilters 
        reportType={activeReport} 
        onFiltersChange={handleFiltersChange} 
      />

      {/* Active Report Content */}
      <div className="bg-gray-50 min-h-[400px] p-6 rounded-lg">
        {renderActiveReport()}
      </div>
    </div>
  );
}