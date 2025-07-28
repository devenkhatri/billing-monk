'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { RevenueChart } from '@/components/charts/revenue-chart';
import { InvoiceStatusChart } from '@/components/charts/invoice-status-chart';
import { 
  PlusIcon, 
  CalendarIcon, 
  UserGroupIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { DashboardMetrics } from '@/types';
import { format } from 'date-fns';
import Link from 'next/link';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' });

  const fetchDashboardData = async (dateFrom?: string, dateTo?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      
      const response = await fetch(`/api/dashboard?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.data);
        setError(null);
      } else {
        setError(data.error.message);
      }
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDateRangeChange = (dateFrom: string, dateTo: string) => {
    setDateRange({ from: dateFrom, to: dateTo });
    fetchDashboardData(dateFrom, dateTo);
  };

  // Generate chart data from metrics
  const generateRevenueChartData = () => {
    if (!metrics) return [];
    
    // For demo purposes, generate last 6 months of data
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: format(date, 'MMM yyyy'),
        revenue: Math.random() * 10000 + 5000, // Mock data
        invoices: Math.floor(Math.random() * 20) + 10
      });
    }
    return months;
  };

  const generateInvoiceStatusData = () => {
    if (!metrics) return [];
    
    return [
      { status: 'paid', count: metrics.paidInvoices, amount: metrics.paidAmount },
      { status: 'sent', count: metrics.totalInvoices - metrics.paidInvoices - metrics.overdueInvoices, amount: metrics.outstandingAmount },
      { status: 'overdue', count: metrics.overdueInvoices, amount: metrics.overdueAmount },
    ].filter(item => item.count > 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading dashboard</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <div className="mt-6">
          <Button onClick={() => fetchDashboardData()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center space-x-3">
          <DateRangePicker onDateRangeChange={handleDateRangeChange} />
          <Link href="/invoices">
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent>
            <div className="flex items-center">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
                <p className="text-2xl font-bold text-green-600">
                  ${metrics?.totalRevenue.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {dateRange.from && dateRange.to 
                    ? `${dateRange.from} to ${dateRange.to}`
                    : 'All time'
                  }
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <div className="flex items-center">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-500">Outstanding</h3>
                <p className="text-2xl font-bold text-orange-600">
                  ${metrics?.outstandingAmount.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {metrics?.totalInvoices || 0} total invoices
                </p>
              </div>
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <ClockIcon className="w-4 h-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <div className="flex items-center">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-500">Overdue</h3>
                <p className="text-2xl font-bold text-red-600">
                  ${metrics?.overdueAmount.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {metrics?.overdueInvoices || 0} overdue invoices
                </p>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <div className="flex items-center">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-500">Active Clients</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {metrics?.activeClients || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  of {metrics?.totalClients || 0} total clients
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <UserGroupIcon className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Revenue Trend</h2>
              <ArrowTrendingUpIcon className="h-5 w-5 text-gray-400" />
            </div>
            <RevenueChart data={generateRevenueChartData()} />
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Invoice Status</h2>
              <DocumentTextIcon className="h-5 w-5 text-gray-400" />
            </div>
            <InvoiceStatusChart data={generateInvoiceStatusData()} />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
            </div>
            <div className="space-y-2">
              <Link href="/invoices">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              </Link>
              <Link href="/clients">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <UserGroupIcon className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              </Link>
              <Link href="/payments">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => window.open('/api/cron/recurring-invoices', '_blank')}
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Generate Recurring Invoices
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
            {metrics?.recentActivity && metrics.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {metrics.recentActivity.slice(0, 8).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {activity.type === 'invoice_created' && (
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <DocumentTextIcon className="w-4 h-4 text-blue-600" />
                        </div>
                      )}
                      {activity.type === 'payment_received' && (
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
                        </div>
                      )}
                      {activity.type === 'client_added' && (
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <UserGroupIcon className="w-4 h-4 text-purple-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(activity.timestamp), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating your first invoice.</p>
                <div className="mt-6">
                  <Link href="/invoices">
                    <Button>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create Invoice
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}