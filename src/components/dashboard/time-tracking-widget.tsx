'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TimeEntry, Task, ApiResponse } from '@/types';
import { 
  ClockIcon, 
  PlayIcon, 
  StopIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { formatDate, formatCurrency } from '@/lib/utils';
import { cachedFetch } from '@/lib/cache';
import Link from 'next/link';

function TimeTrackingWidgetComponent() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [timeEntriesData, tasksData] = await Promise.all([
        cachedFetch<ApiResponse<TimeEntry[]>>('/api/time-entries', undefined, 2 * 60 * 1000),
        cachedFetch<ApiResponse<Task[]>>('/api/tasks', undefined, 2 * 60 * 1000)
      ]);
      
      if (timeEntriesData.success) {
        // Convert date strings to Date objects
        const entriesWithDates = timeEntriesData.data.map(entry => ({
          ...entry,
          startTime: new Date(entry.startTime),
          endTime: entry.endTime ? new Date(entry.endTime) : null,
          createdAt: new Date(entry.createdAt),
          updatedAt: new Date(entry.updatedAt)
        }));
        setTimeEntries(entriesWithDates);
      }

      if (tasksData.success) {
        const tasksWithDates = tasksData.data.map(task => ({
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt)
        }));
        setTasks(tasksWithDates);
      }

      setError(null);
    } catch (err) {
      setError('Failed to fetch time tracking data');
      console.error('Time tracking fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Calculate today's time
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEntries = timeEntries.filter(entry => 
    entry.startTime >= todayStart
  );
  const todayTotal = todayEntries.reduce((sum, entry) => sum + entry.duration, 0);
  const todayBillable = todayEntries
    .filter(entry => entry.isBillable)
    .reduce((sum, entry) => sum + entry.duration, 0);

  // Calculate this week's time
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEntries = timeEntries.filter(entry => 
    entry.startTime >= weekStart
  );
  const weekTotal = weekEntries.reduce((sum, entry) => sum + entry.duration, 0);
  const weekBillable = weekEntries
    .filter(entry => entry.isBillable)
    .reduce((sum, entry) => sum + entry.duration, 0);

  // Get task name for time entry
  const getTaskName = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    return task?.title || 'Unknown Task';
  };

  // Recent time entries (last 5)
  const recentEntries = timeEntries
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Time Tracking</h2>
            <ClockIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="animate-pulse space-y-3">
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Time Tracking</h2>
            <ClockIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="text-center py-4">
            <ExclamationTriangleIcon className="mx-auto h-8 w-8 text-red-500" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Time Tracking</h2>
          <ClockIcon className="h-5 w-5 text-gray-400" />
        </div>

        {/* Time Summary Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {formatDuration(todayTotal)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Today</div>
              </div>
              <ClockIcon className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {formatDuration(todayBillable)} billable
            </div>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {formatDuration(weekTotal)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">This Week</div>
              </div>
              <ClockIcon className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 mt-1">
              {formatDuration(weekBillable)} billable
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex space-x-2 mb-6">
          <Link href="/tasks" className="flex-1">
            <Button size="sm" className="w-full">
              <PlayIcon className="h-4 w-4 mr-2" />
              Start Timer
            </Button>
          </Link>
          <Link href="/tasks" className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <ClockIcon className="h-4 w-4 mr-2" />
              Log Time
            </Button>
          </Link>
        </div>

        {/* Recent Time Entries */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent Entries</h3>
          {recentEntries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {getTaskName(entry.taskId)}
                  </h4>
                  {entry.isBillable && (
                    <CurrencyDollarIcon className="h-3 w-3 text-green-500" />
                  )}
                </div>
                <div className="flex items-center space-x-4 mt-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDuration(entry.duration)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(entry.startTime)}
                  </div>
                  {entry.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-32">
                      {entry.description}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatDuration(entry.duration)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {timeEntries.length === 0 && (
          <div className="text-center py-6">
            <ClockIcon className="mx-auto h-8 w-8 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No time entries yet</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Start tracking time on your tasks.</p>
            <div className="mt-4">
              <Link href="/tasks">
                <Button size="sm">
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Start Timer
                </Button>
              </Link>
            </div>
          </div>
        )}

        {timeEntries.length > 5 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link href="/tasks">
              <Button variant="outline" size="sm" className="w-full">
                View All Time Entries
                <ArrowRightIcon className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const TimeTrackingWidget = React.memo(TimeTrackingWidgetComponent);