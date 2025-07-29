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
      <div className=\"p-6\">\n        <div className=\"animate-pulse space-y-4\">\n          {[...Array(5)].map((_, i) => (\n            <div key={i} className=\"h-12 bg-gray-200 rounded\"></div>\n          ))}\n        </div>\n      </div>\n    );\n  }\n\n  if (timeEntries.length === 0) {\n    return (\n      <div className=\"p-6 text-center\">\n        <div className=\"text-gray-500\">\n          <ClockIcon className=\"mx-auto h-12 w-12 text-gray-400\" />\n          <h3 className=\"mt-2 text-sm font-medium text-gray-900\">No time entries</h3>\n          <p className=\"mt-1 text-sm text-gray-500\">\n            Start tracking time to see entries here.\n          </p>\n        </div>\n      </div>\n    );\n  }\n\n  return (\n    <div className=\"overflow-x-auto\">\n      <table className=\"min-w-full divide-y divide-gray-200\">\n        <thead className=\"bg-gray-50\">\n          <tr>\n            <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">\n              Date & Time\n            </th>\n            <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">\n              Duration\n            </th>\n            <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">\n              Description\n            </th>\n            <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">\n              Billable\n            </th>\n            <th className=\"px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider\">\n              Actions\n            </th>\n          </tr>\n        </thead>\n        <tbody className=\"bg-white divide-y divide-gray-200\">\n          {timeEntries.map((entry) => (\n            <tr key={entry.id} className=\"hover:bg-gray-50\">\n              <td className=\"px-6 py-4 whitespace-nowrap\">\n                <div className=\"text-sm text-gray-900\">\n                  {formatDateTime(entry.startTime)}\n                </div>\n                {entry.endTime && (\n                  <div className=\"text-sm text-gray-500\">\n                    to {formatDateTime(entry.endTime)}\n                  </div>\n                )}\n              </td>\n              <td className=\"px-6 py-4 whitespace-nowrap\">\n                <div className=\"flex items-center\">\n                  <ClockIcon className=\"h-4 w-4 text-gray-400 mr-2\" />\n                  <span className=\"text-sm font-medium text-gray-900\">\n                    {formatTime(entry.duration)}\n                  </span>\n                </div>\n                <div className=\"text-xs text-gray-500\">\n                  {(entry.duration / 3600).toFixed(2)} hours\n                </div>\n              </td>\n              <td className=\"px-6 py-4\">\n                <div className=\"text-sm text-gray-900 max-w-xs\">\n                  {entry.description || '-'}\n                </div>\n              </td>\n              <td className=\"px-6 py-4 whitespace-nowrap\">\n                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${\n                  entry.isBillable \n                    ? 'bg-green-100 text-green-800' \n                    : 'bg-gray-100 text-gray-800'\n                }`}>\n                  {entry.isBillable ? 'Billable' : 'Non-billable'}\n                </span>\n              </td>\n              <td className=\"px-6 py-4 whitespace-nowrap text-right text-sm font-medium\">\n                <div className=\"flex justify-end space-x-2\">\n                  <Button\n                    variant=\"ghost\"\n                    size=\"sm\"\n                    onClick={() => onEdit(entry)}\n                    className=\"text-blue-600 hover:text-blue-700\"\n                  >\n                    <PencilIcon className=\"h-4 w-4\" />\n                  </Button>\n                  <Button\n                    variant=\"ghost\"\n                    size=\"sm\"\n                    onClick={() => onDelete(entry)}\n                    className=\"text-red-600 hover:text-red-700\"\n                  >\n                    <TrashIcon className=\"h-4 w-4\" />\n                  </Button>\n                </div>\n              </td>\n            </tr>\n          ))}\n        </tbody>\n      </table>\n      \n      {/* Summary */}\n      <div className=\"bg-gray-50 px-6 py-3 border-t\">\n        <div className=\"flex justify-between text-sm\">\n          <span className=\"font-medium text-gray-700\">Total Entries: {timeEntries.length}</span>\n          <div className=\"space-x-4\">\n            <span className=\"text-gray-600\">\n              Total Time: {formatTime(timeEntries.reduce((sum, entry) => sum + entry.duration, 0))}\n            </span>\n            <span className=\"text-green-600 font-medium\">\n              Billable: {formatTime(timeEntries.filter(entry => entry.isBillable).reduce((sum, entry) => sum + entry.duration, 0))}\n            </span>\n          </div>\n        </div>\n      </div>\n    </div>\n  );\n}