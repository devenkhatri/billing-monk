'use client';

import React, { useState, useEffect } from 'react';
import { ActivityLog, ActivityLogFilters } from '@/types';
import { activityLogsApi } from '@/lib/api-client';
import { formatDistanceToNow } from 'date-fns';

interface ActivityLogTableProps {
  filters?: ActivityLogFilters;
  showFilters?: boolean;
  maxHeight?: string;
}

export function ActivityLogTable({ 
  filters: initialFilters, 
  showFilters = true,
  maxHeight = '400px'
}: ActivityLogTableProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ActivityLogFilters>(initialFilters || {});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    hasMore: false
  });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await activityLogsApi.getAll(filters, {
        page: pagination.page,
        limit: pagination.limit
      });

      setLogs(response.logs);
      setPagination(prev => ({
        ...prev,
        total: response.total,
        hasMore: response.hasMore
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters, pagination.page]);

  const handleFilterChange = (key: keyof ActivityLogFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({});
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getActivityIcon = (type: ActivityLog['type']) => {
    const iconMap = {
      invoice_created: '📄',
      invoice_updated: '✏️',
      invoice_sent: '📧',
      invoice_paid: '💰',
      invoice_cancelled: '❌',
      payment_received: '💳',
      payment_updated: '✏️',
      payment_deleted: '🗑️',
      client_added: '👤',
      client_updated: '✏️',
      client_deleted: '🗑️',
      project_created: '📁',
      project_updated: '✏️',
      project_completed: '✅',
      project_deleted: '🗑️',
      task_created: '📝',
      task_updated: '✏️',
      task_completed: '✅',
      task_deleted: '🗑️',
      time_entry_created: '⏰',
      time_entry_updated: '✏️',
      time_entry_deleted: '🗑️',
      template_created: '📋',
      template_updated: '✏️',
      template_deleted: '🗑️',
      settings_updated: '⚙️'
    };
    return iconMap[type] || '📝';
  };

  const getEntityTypeColor = (entityType?: string) => {
    const colorMap = {
      invoice: 'bg-blue-100 text-blue-800',
      payment: 'bg-green-100 text-green-800',
      client: 'bg-purple-100 text-purple-800',
      project: 'bg-orange-100 text-orange-800',
      task: 'bg-yellow-100 text-yellow-800',
      time_entry: 'bg-indigo-100 text-indigo-800',
      template: 'bg-pink-100 text-pink-800',
      settings: 'bg-gray-100 text-gray-800'
    };
    return colorMap[entityType as keyof typeof colorMap] || 'bg-gray-100 text-gray-800';
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading activity logs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Activity Type
              </label>
              <select
                value={filters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="invoice_created">Invoice Created</option>
                <option value="invoice_updated">Invoice Updated</option>
                <option value="invoice_sent">Invoice Sent</option>
                <option value="invoice_paid">Invoice Paid</option>
                <option value="payment_received">Payment Received</option>
                <option value="client_added">Client Added</option>
                <option value="project_created">Project Created</option>
                <option value="task_created">Task Created</option>
                <option value="time_entry_created">Time Entry Created</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entity Type
              </label>
              <select
                value={filters.entityType || ''}
                onChange={(e) => handleFilterChange('entityType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Entities</option>
                <option value="invoice">Invoices</option>
                <option value="payment">Payments</option>
                <option value="client">Clients</option>
                <option value="project">Projects</option>
                <option value="task">Tasks</option>
                <option value="time_entry">Time Entries</option>
                <option value="template">Templates</option>
                <option value="settings">Settings</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date From
              </label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date To
              </label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder="Search description..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Filters
            </button>
            <div className="text-sm text-gray-600">
              {pagination.total} total activities
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      <div 
        className="bg-white border border-gray-200 rounded-lg overflow-hidden"
        style={{ maxHeight }}
      >
        <div className="overflow-y-auto" style={{ maxHeight }}>
          {logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No activity logs found
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {logs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{getActivityIcon(log.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-medium text-gray-900">
                          {log.description}
                        </p>
                        {log.entityType && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEntityTypeColor(log.entityType)}`}>
                            {log.entityType}
                          </span>
                        )}
                        {log.amount && (
                          <span className="text-sm font-medium text-green-600">
                            ${log.amount.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{formatDistanceToNow(log.timestamp, { addSuffix: true })}</span>
                        {log.userEmail && (
                          <span>by {log.userEmail}</span>
                        )}
                        {log.entityName && (
                          <span>• {log.entityName}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {pagination.hasMore && (
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={loading}
              className="w-full px-4 py-2 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}