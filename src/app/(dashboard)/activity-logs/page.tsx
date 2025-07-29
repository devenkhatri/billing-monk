'use client';

import React from 'react';
import { ActivityLogTable } from '@/components/activity/activity-log-table';

export default function ActivityLogsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
          <p className="text-gray-600">
            Track all activities and changes in your application
          </p>
        </div>
      </div>

      <ActivityLogTable showFilters={true} maxHeight="calc(100vh - 200px)" />
    </div>
  );
}