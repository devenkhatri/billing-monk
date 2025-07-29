'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Task, ApiResponse } from '@/types';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  ArrowRightIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';
import { formatDate } from '@/lib/utils';
import { cachedFetch } from '@/lib/cache';
import Link from 'next/link';

import React from 'react';

function TaskSummaryWidgetComponent() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const data: ApiResponse<Task[]> = await cachedFetch('/api/tasks', undefined, 2 * 60 * 1000); // 2 minute cache
      
      if (data.success) {
        // Convert date strings to Date objects
        const tasksWithDates = data.data.map(task => ({
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt)
        }));
        setTasks(tasksWithDates);
        setError(null);
      } else {
        setError(data.error.message);
      }
    } catch (err) {
      setError('Failed to fetch tasks');
      console.error('Tasks fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Calculate task statistics - memoized to prevent recalculation on every render
  const taskStats = useMemo(() => {
    const todo = tasks.filter(task => task.status === 'todo');
    const inProgress = tasks.filter(task => task.status === 'in-progress');
    const review = tasks.filter(task => task.status === 'review');
    const completed = tasks.filter(task => task.status === 'completed');
    const overdue = tasks.filter(task => {
      if (!task.dueDate || task.status === 'completed' || task.status === 'cancelled') {
        return false;
      }
      return new Date() > task.dueDate;
    });

    return {
      todoTasks: todo,
      inProgressTasks: inProgress,
      reviewTasks: review,
      completedTasks: completed,
      overdueTasks: overdue
    };
  }, [tasks]);

  const { todoTasks, inProgressTasks, reviewTasks, completedTasks, overdueTasks } = taskStats;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
      case 'in-progress':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300';
      case 'review':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
      case 'completed':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'todo':
        return 'To Do';
      case 'in-progress':
        return 'In Progress';
      case 'review':
        return 'Review';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Task Summary</h2>
            <CheckCircleIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="animate-pulse space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Task Summary</h2>
            <CheckCircleIcon className="h-5 w-5 text-gray-400" />
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
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Task Summary</h2>
          <CheckCircleIcon className="h-5 w-5 text-gray-400" />
        </div>

        {/* Task Status Grid */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-lg font-bold text-gray-600 dark:text-gray-300">{todoTasks.length}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">To Do</div>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{inProgressTasks.length}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">In Progress</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{reviewTasks.length}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Review</div>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">{completedTasks.length}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Done</div>
          </div>
        </div>

        {/* Overdue Tasks Alert */}
        {overdueTasks.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-4 w-4 text-red-600 mr-2" />
              <span className="text-sm font-medium text-red-800 dark:text-red-200">
                {overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Recent Tasks */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent Tasks</h3>
          {tasks
            .filter(task => task.status !== 'completed')
            .sort((a, b) => {
              // Sort by priority (urgent first) then by due date
              const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
              const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 4;
              const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 4;
              
              if (aPriority !== bPriority) return aPriority - bPriority;
              
              if (a.dueDate && b.dueDate) {
                return a.dueDate.getTime() - b.dueDate.getTime();
              }
              if (a.dueDate) return -1;
              if (b.dueDate) return 1;
              return 0;
            })
            .slice(0, 5)
            .map((task) => {
              const isOverdue = task.dueDate && new Date() > task.dueDate;
              
              return (
                <Link key={task.id} href={`/tasks/${task.id}`}>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {task.title}
                        </h4>
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                          {getStatusLabel(task.status)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority.toUpperCase()}
                        </div>
                        {task.dueDate && (
                          <div className={`flex items-center text-xs ${isOverdue ? 'text-red-600' : 'text-gray-500 dark:text-gray-400'}`}>
                            <ClockIcon className="h-3 w-3 mr-1" />
                            {isOverdue ? 'Overdue' : formatDate(task.dueDate)}
                          </div>
                        )}
                        {task.assignedTo && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {task.assignedTo}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {task.status === 'in-progress' ? (
                        <PauseIcon className="h-4 w-4 text-blue-500" />
                      ) : (
                        <PlayIcon className="h-4 w-4 text-gray-400" />
                      )}
                      <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </Link>
              );
            })}
        </div>

        {tasks.length === 0 && (
          <div className="text-center py-6">
            <CheckCircleIcon className="mx-auto h-8 w-8 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No tasks yet</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create your first task to get started.</p>
            <div className="mt-4">
              <Link href="/tasks">
                <Button size="sm">Create Task</Button>
              </Link>
            </div>
          </div>
        )}

        {tasks.length > 5 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link href="/tasks">
              <Button variant="outline" size="sm" className="w-full">
                View All Tasks
                <ArrowRightIcon className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const TaskSummaryWidget = React.memo(TaskSummaryWidgetComponent);