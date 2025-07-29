'use client';

import { TimeEntry } from '@/types';
import { Button } from '@/components/ui/button';
import { PencilIcon, TrashIcon, ClockIcon } from '@heroicons/react/24/outline';
import { formatDate } from '@/lib/utils';

interface TimeEntryTableProps {
  timeEntries: TimeEntry[];
  onEdit: (timeEntry: TimeEntry) => void;
  onDelete: (timeEntry: TimeEntry) => void;
  showTaskColumn?: boolean;
  isLoading?: boolean;
}

export function TimeEntryTable({ 
  timeEntries, 
  onEdit, 
  onDelete, 
  showTaskColumn = true,
  isLoading = false 
}: TimeEntryTableProps) {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (timeEntries.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No time entries</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start tracking time to see entries here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date & Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Duration
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Billable
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {timeEntries.map((entry) => (
            <tr key={entry.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {formatDateTime(entry.startTime)}
                </div>
                {entry.endTime && (
                  <div className="text-sm text-gray-500">
                    to {formatDateTime(entry.endTime)}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-900">
                    {formatTime(entry.duration)}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {(entry.duration / 3600).toFixed(2)} hours
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900 max-w-xs">
                  {entry.description || '-'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  entry.isBillable 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {entry.isBillable ? 'Billable' : 'Non-billable'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(entry)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(entry)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Summary */}
      <div className="bg-gray-50 px-6 py-3 border-t">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-gray-700">Total Entries: {timeEntries.length}</span>
          <div className="space-x-4">
            <span className="text-gray-600">
              Total Time: {formatTime(timeEntries.reduce((sum, entry) => sum + entry.duration, 0))}
            </span>
            <span className="text-green-600 font-medium">
              Billable: {formatTime(timeEntries.filter(entry => entry.isBillable).reduce((sum, entry) => sum + entry.duration, 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}