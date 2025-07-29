'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Task, Project, ApiResponse } from '@/types';
import { 
  CalendarIcon, 
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ClockIcon,
  FolderIcon
} from '@heroicons/react/24/outline';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

interface DeadlineItem {
  id: string;
  title: string;
  type: 'task' | 'project';
  dueDate: Date;
  priority?: string;
  status: string;
  projectName?: string;
  isOverdue: boolean;
  daysUntilDue: number;
}

export function UpcomingDeadlinesWidget() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksResponse, projectsResponse] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/projects')
      ]);
      
      const tasksData: ApiResponse<Task[]> = await tasksResponse.json();
      const projectsData: ApiResponse<Project[]> = await projectsResponse.json();
      
      if (tasksData.success) {
        const tasksWithDates = tasksData.data.map(task => ({
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt)
        }));
        setTasks(tasksWithDates);
      }

      if (projectsData.success) {
        const projectsWithDates = projectsData.data.map(project => ({
          ...project,
          startDate: new Date(project.startDate),
          endDate: project.endDate ? new Date(project.endDate) : undefined,
          createdAt: new Date(project.createdAt),
          updatedAt: new Date(project.updatedAt)
        }));
        setProjects(projectsWithDates);
      }

      setError(null);
    } catch (err) {
      setError('Failed to fetch deadline data');
      console.error('Deadlines fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Combine tasks and projects with deadlines
  const getDeadlineItems = (): DeadlineItem[] => {
    const items: DeadlineItem[] = [];
    const now = new Date();

    // Add tasks with due dates
    tasks
      .filter(task => task.dueDate && task.status !== 'completed' && task.status !== 'cancelled')
      .forEach(task => {
        const daysUntilDue = Math.ceil((task.dueDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const project = projects.find(p => p.id === task.projectId);
        
        items.push({
          id: task.id,
          title: task.title,
          type: 'task',
          dueDate: task.dueDate!,
          priority: task.priority,
          status: task.status,
          projectName: project?.name,
          isOverdue: daysUntilDue < 0,
          daysUntilDue
        });
      });

    // Add projects with end dates
    projects
      .filter(project => project.endDate && project.isActive && project.status !== 'completed')
      .forEach(project => {
        const daysUntilDue = Math.ceil((project.endDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        items.push({
          id: project.id,
          title: project.name,
          type: 'project',
          dueDate: project.endDate!,
          status: project.status,
          isOverdue: daysUntilDue < 0,
          daysUntilDue
        });
      });

    // Sort by due date (overdue first, then by proximity)
    return items.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return a.dueDate.getTime() - b.dueDate.getTime();
    });
  };

  const deadlineItems = getDeadlineItems();
  const overdueItems = deadlineItems.filter(item => item.isOverdue);
  const upcomingItems = deadlineItems.filter(item => !item.isOverdue && item.daysUntilDue <= 7);

  const getPriorityColor = (priority?: string) => {
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

  const getDeadlineColor = (item: DeadlineItem) => {
    if (item.isOverdue) return 'text-red-600';
    if (item.daysUntilDue <= 1) return 'text-red-600';
    if (item.daysUntilDue <= 3) return 'text-orange-600';
    if (item.daysUntilDue <= 7) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const formatDeadlineText = (item: DeadlineItem) => {
    if (item.isOverdue) {
      const daysOverdue = Math.abs(item.daysUntilDue);
      return `${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`;
    }
    if (item.daysUntilDue === 0) return 'Due today';
    if (item.daysUntilDue === 1) return 'Due tomorrow';
    return `Due in ${item.daysUntilDue} days`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Upcoming Deadlines</h2>
            <CalendarIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="animate-pulse space-y-3">
            {[...Array(4)].map((_, i) => (
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
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Upcoming Deadlines</h2>
            <CalendarIcon className="h-5 w-5 text-gray-400" />
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
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Upcoming Deadlines</h2>
          <CalendarIcon className="h-5 w-5 text-gray-400" />
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-lg font-bold text-red-600 dark:text-red-400">{overdueItems.length}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Overdue</div>
          </div>
          <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{upcomingItems.length}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Due This Week</div>
          </div>
        </div>

        {/* Deadline Items */}
        <div className="space-y-3">
          {deadlineItems.slice(0, 6).map((item) => (
            <Link 
              key={`${item.type}-${item.id}`} 
              href={item.type === 'task' ? `/tasks/${item.id}` : `/projects/${item.id}`}
            >
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    {item.type === 'task' ? (
                      <ClockIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    ) : (
                      <FolderIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    )}
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {item.title}
                    </h4>
                    {item.priority && (
                      <span className={`text-xs font-medium ${getPriorityColor(item.priority)}`}>
                        {item.priority.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 mt-1">
                    <div className={`text-xs font-medium ${getDeadlineColor(item)}`}>
                      {formatDeadlineText(item)}
                    </div>
                    {item.projectName && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {item.projectName}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(item.dueDate)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {item.isOverdue && (
                    <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                  )}
                  <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {deadlineItems.length === 0 && (
          <div className="text-center py-6">
            <CalendarIcon className="mx-auto h-8 w-8 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No upcoming deadlines</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">All caught up! No tasks or projects due soon.</p>
          </div>
        )}

        {deadlineItems.length > 6 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-2">
              <Link href="/tasks">
                <Button variant="outline" size="sm" className="w-full">
                  View Tasks
                </Button>
              </Link>
              <Link href="/projects">
                <Button variant="outline" size="sm" className="w-full">
                  View Projects
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}