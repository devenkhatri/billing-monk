'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Project, Task, ApiResponse } from '@/types';
import { 
  ChartBarIcon, 
  FolderIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { formatDate, formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface ProjectProgress {
  project: Project;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  progressPercentage: number;
  totalHours: number;
  estimatedHours: number;
  isOverdue: boolean;
  daysRemaining: number | null;
}

export function ProjectProgressWidget() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsResponse, tasksResponse] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/tasks')
      ]);
      
      const projectsData: ApiResponse<Project[]> = await projectsResponse.json();
      const tasksData: ApiResponse<Task[]> = await tasksResponse.json();
      
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
      setError('Failed to fetch project progress data');
      console.error('Project progress fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateProjectProgress = (): ProjectProgress[] => {
    return projects
      .filter(project => project.isActive)
      .map(project => {
        const projectTasks = tasks.filter(task => task.projectId === project.id);
        const totalTasks = projectTasks.length;
        const completedTasks = projectTasks.filter(task => task.status === 'completed').length;
        const inProgressTasks = projectTasks.filter(task => task.status === 'in-progress').length;
        const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        const totalHours = projectTasks.reduce((sum, task) => sum + task.actualHours, 0);
        const estimatedHours = projectTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
        
        const now = new Date();
        const isOverdue = project.endDate ? now > project.endDate : false;
        const daysRemaining = project.endDate 
          ? Math.ceil((project.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null;

        return {
          project,
          totalTasks,
          completedTasks,
          inProgressTasks,
          progressPercentage,
          totalHours,
          estimatedHours,
          isOverdue,
          daysRemaining
        };
      })
      .sort((a, b) => {
        // Sort by overdue first, then by progress percentage (lowest first)
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        return a.progressPercentage - b.progressPercentage;
      });
  };

  const projectProgress = calculateProjectProgress();
  const activeProjects = projectProgress.length;
  const overdueProjects = projectProgress.filter(p => p.isOverdue).length;
  const averageProgress = activeProjects > 0 
    ? Math.round(projectProgress.reduce((sum, p) => sum + p.progressPercentage, 0) / activeProjects)
    : 0;

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    if (percentage >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      case 'on-hold':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
      case 'completed':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Project Progress</h2>
            <ChartBarIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="animate-pulse space-y-3">
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Project Progress</h2>
            <ChartBarIcon className="h-5 w-5 text-gray-400" />
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
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Project Progress</h2>
          <ChartBarIcon className="h-5 w-5 text-gray-400" />
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{activeProjects}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Active</div>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">{averageProgress}%</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Avg Progress</div>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-lg font-bold text-red-600 dark:text-red-400">{overdueProjects}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Overdue</div>
          </div>
        </div>

        {/* Project Progress List */}
        <div className="space-y-4">
          {projectProgress.slice(0, 4).map((progress) => (
            <Link key={progress.project.id} href={`/projects/${progress.project.id}`}>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <FolderIcon className="h-4 w-4 text-gray-400" />
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {progress.project.name}
                    </h4>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(progress.project.status)}`}>
                      {progress.project.status}
                    </span>
                    {progress.isOverdue && (
                      <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{progress.progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress.progressPercentage)}`}
                      style={{ width: `${progress.progressPercentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Project Details */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <span>{progress.completedTasks}/{progress.totalTasks} tasks</span>
                    </div>
                    {progress.totalHours > 0 && (
                      <div className="flex items-center">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        <span>{progress.totalHours.toFixed(1)}h logged</span>
                      </div>
                    )}
                    {progress.project.budget && (
                      <div className="flex items-center">
                        <span>{formatCurrency(progress.project.budget)} budget</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {progress.project.endDate && (
                      <div className={`flex items-center ${progress.isOverdue ? 'text-red-600' : ''}`}>
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        {progress.isOverdue 
                          ? `${Math.abs(progress.daysRemaining!)} days overdue`
                          : progress.daysRemaining === 0 
                            ? 'Due today'
                            : progress.daysRemaining === 1
                              ? 'Due tomorrow'
                              : `${progress.daysRemaining} days left`
                        }
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {projectProgress.length === 0 && (
          <div className="text-center py-6">
            <FolderIcon className="mx-auto h-8 w-8 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No active projects</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create a project to start tracking progress.</p>
            <div className="mt-4">
              <Link href="/projects">
                <Button size="sm">Create Project</Button>
              </Link>
            </div>
          </div>
        )}

        {projectProgress.length > 4 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link href="/projects">
              <Button variant="outline" size="sm" className="w-full">
                View All Projects
                <ArrowRightIcon className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}