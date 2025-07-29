'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Project, ApiResponse } from '@/types';
import { 
  FolderIcon, 
  CalendarIcon, 
  ClockIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { formatDate, formatCurrency } from '@/lib/utils';
import { cachedFetch } from '@/lib/cache';
import Link from 'next/link';

import React from 'react';

function ProjectOverviewWidgetComponent() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const data: ApiResponse<Project[]> = await cachedFetch('/api/projects', undefined, 2 * 60 * 1000); // 2 minute cache
      
      if (data.success) {
        // Convert date strings to Date objects
        const projectsWithDates = data.data.map(project => ({
          ...project,
          startDate: new Date(project.startDate),
          endDate: project.endDate ? new Date(project.endDate) : undefined,
          createdAt: new Date(project.createdAt),
          updatedAt: new Date(project.updatedAt)
        }));
        setProjects(projectsWithDates);
        setError(null);
      } else {
        setError(data.error.message);
      }
    } catch (err) {
      setError('Failed to fetch projects');
      console.error('Projects fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const { activeProjects, overdueProjects, completedProjects } = useMemo(() => {
    const active = projects.filter(project => project.isActive);
    const overdue = active.filter(project => {
      if (!project.endDate) return false;
      return new Date() > project.endDate;
    });
    const completed = projects.filter(p => p.status === 'completed');
    
    return {
      activeProjects: active,
      overdueProjects: overdue,
      completedProjects: completed
    };
  }, [projects]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'on-hold':
        return 'text-yellow-600 bg-yellow-100';
      case 'completed':
        return 'text-blue-600 bg-blue-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'on-hold':
        return 'On Hold';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Project Overview</h2>
            <FolderIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="animate-pulse space-y-3">
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
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Project Overview</h2>
            <FolderIcon className="h-5 w-5 text-gray-400" />
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
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Project Overview</h2>
          <FolderIcon className="h-5 w-5 text-gray-400" />
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{activeProjects.length}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {completedProjects.length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{overdueProjects.length}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Overdue</div>
          </div>
        </div>

        {/* Recent Active Projects */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent Active Projects</h3>
          {activeProjects.slice(0, 4).map((project) => {
            const isOverdue = project.endDate && new Date() > project.endDate;
            const daysUntilDeadline = project.endDate 
              ? Math.ceil((project.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              : null;

            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {project.name}
                      </h4>
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                        {getStatusLabel(project.status)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1">
                      {project.endDate && (
                        <div className={`flex items-center text-xs ${isOverdue ? 'text-red-600' : 'text-gray-500 dark:text-gray-400'}`}>
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {isOverdue ? 'Overdue' : `${daysUntilDeadline} days left`}
                        </div>
                      )}
                      {project.budget && (
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <span>{formatCurrency(project.budget)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                </div>
              </Link>
            );
          })}
        </div>

        {activeProjects.length === 0 && (
          <div className="text-center py-6">
            <FolderIcon className="mx-auto h-8 w-8 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No active projects</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating your first project.</p>
            <div className="mt-4">
              <Link href="/projects">
                <Button size="sm">Create Project</Button>
              </Link>
            </div>
          </div>
        )}

        {activeProjects.length > 4 && (
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

export const ProjectOverviewWidget = React.memo(ProjectOverviewWidgetComponent);