'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { RevenueChart } from '@/components/charts/revenue-chart';
import { InvoiceStatusChart } from '@/components/charts/invoice-status-chart';
import dynamic from 'next/dynamic';
import { SkeletonCard } from '@/components/ui/skeleton';

// Lazy load dashboard widgets for better performance
const ProjectOverviewWidget = dynamic(
  () => import('@/components/dashboard/project-overview-widget').then(mod => ({ default: mod.ProjectOverviewWidget })),
  { loading: () => <SkeletonCard /> }
);

const TaskSummaryWidget = dynamic(
  () => import('@/components/dashboard/task-summary-widget').then(mod => ({ default: mod.TaskSummaryWidget })),
  { loading: () => <SkeletonCard /> }
);

const TimeTrackingWidget = dynamic(
  () => import('@/components/dashboard/time-tracking-widget').then(mod => ({ default: mod.TimeTrackingWidget })),
  { loading: () => <SkeletonCard /> }
);

const UpcomingDeadlinesWidget = dynamic(
  () => import('@/components/dashboard/upcoming-deadlines-widget').then(mod => ({ default: mod.UpcomingDeadlinesWidget })),
  { loading: () => <SkeletonCard /> }
);

const ProjectProgressWidget = dynamic(
  () => import('@/components/dashboard/project-progress-widget').then(mod => ({ default: mod.ProjectProgressWidget })),
  { loading: () => <SkeletonCard /> }
);
import { 
  PlusIcon, 
  CalendarIcon, 
  UserGroupIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  FolderIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { DashboardMetrics } from '@/types';
import { format } from 'date-fns';
import { cachedFetch } from '@/lib/cache';
import { measurePerformance } from '@/lib/performance';
import Link from 'next/link';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' });

  const fetchDashboardData = useCallback(async (dateFrom?: string, dateTo?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      
      const data = await measurePerformance(
        'Dashboard Data Fetch',
        () => cachedFetch(`/api/dashboard?${params.toString()}`, undefined, 1 * 60 * 1000)
      );
      
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
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDateRangeChange = useCallback((dateFrom?: string, dateTo?: string) => {
    if (dateFrom && dateTo) {
      setDateRange({ from: dateFrom, to: dateTo });
      fetchDashboardData(dateFrom, dateTo);
    } else {
      setDateRange({ from: '', to: '' });
      fetchDashboardData();
    }
  }, [fetchDashboardData]);

  // Generate chart data from metrics - memoized to prevent unnecessary recalculations
  const revenueChartData = useMemo(() => {
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
  }, [metrics]);

  const invoiceStatusData = useMemo(() => {
    if (!metrics) return [];
    
    return [
      { status: 'paid', count: metrics.paidInvoices, amount: metrics.paidAmount },
      { status: 'sent', count: metrics.totalInvoices - metrics.paidInvoices - metrics.overdueInvoices, amount: metrics.outstandingAmount },
      { status: 'overdue', count: metrics.overdueInvoices, amount: metrics.overdueAmount },
    ].filter(item => item.count > 0);
  }, [metrics]);

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
            <RevenueChart data={revenueChartData} />
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Invoice Status</h2>
              <DocumentTextIcon className="h-5 w-5 text-gray-400" />
            </div>
            <InvoiceStatusChart data={invoiceStatusData} />
          </CardContent>
        </Card>
      </div>

      {/* Project and Task Management Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        <ProjectOverviewWidget />
        <TaskSummaryWidget />
        <TimeTrackingWidget />
      </div>

      {/* Additional Project and Task Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <UpcomingDeadlinesWidget />
        <ProjectProgressWidget />
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Quick Actions</h2>
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
              <Link href="/projects">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <FolderIcon className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </Link>
              <Link href="/tasks">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Create Task
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
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Recent Activity</h2>
            {metrics?.recentActivity && metrics.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {metrics.recentActivity.slice(0, 12).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {(activity.type === 'invoice_created' || activity.type === 'invoice_updated') && (
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <DocumentTextIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                      )}
                      {activity.type === 'invoice_paid' && (
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                          <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                      )}
                      {(activity.type === 'payment_received' || activity.type === 'payment_updated') && (
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                          <CurrencyDollarIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                      )}
                      {(activity.type === 'client_added' || activity.type === 'client_updated') && (
                        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                          <UserGroupIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                      )}
                      {(activity.type === 'project_created' || activity.type === 'project_updated') && (
                        <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                          <FolderIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                      )}
                      {activity.type === 'project_completed' && (
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                          <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                      )}
                      {(activity.type === 'task_created' || activity.type === 'task_updated') && (
                        <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                          <CheckCircleIcon className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                        </div>
                      )}
                      {activity.type === 'task_completed' && (
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                          <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                      )}
                      {(activity.type === 'time_entry_created' || activity.type === 'time_entry_updated') && (
                        <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                          <ClockIcon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        </div>
                      )}
                      {(activity.type === 'template_created' || activity.type === 'template_updated') && (
                        <div className="w-8 h-8 bg-pink-100 dark:bg-pink-900 rounded-full flex items-center justify-center">
                          <DocumentTextIcon className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                        </div>
                      )}
                      {activity.type === 'settings_updated' && (
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center">
                          <ExclamationTriangleIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-gray-100">{activity.description}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(activity.timestamp), 'MMM d, yyyy h:mm a')}
                        </p>
                        {activity.amount && (
                          <span className="text-xs font-medium text-green-600 dark:text-green-400">
                            ${activity.amount.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No recent activity</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating your first invoice.</p>
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