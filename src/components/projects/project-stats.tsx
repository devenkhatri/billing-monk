'use client';

import { Project, Task } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  CalendarIcon, 
  ClockIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface ProjectStatsProps {
  project: Project;
  tasks: Task[];
}

export function ProjectStats({ project, tasks }: ProjectStatsProps) {
  // Calculate task statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
  const overdueTasks = tasks.filter(task => {
    if (!task.dueDate || task.status === 'completed' || task.status === 'cancelled') {
      return false;
    }
    return new Date() > task.dueDate;
  }).length;

  // Calculate time statistics
  const totalHours = tasks.reduce((sum, task) => sum + task.actualHours, 0);
  const estimatedHours = tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
  const billableHours = tasks.reduce((sum, task) => sum + task.billableHours, 0);

  // Calculate progress percentage
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate project duration
  const today = new Date();
  const startDate = project.startDate;
  const endDate = project.endDate || today;
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const remainingDays = project.endDate ? Math.ceil((project.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;

  // Calculate estimated revenue (if hourly rate is available)
  const estimatedRevenue = project.hourlyRate ? billableHours * project.hourlyRate : 0;

  const stats = [
    {
      title: 'Project Progress',
      value: `${progressPercentage}%`,
      subtitle: `${completedTasks} of ${totalTasks} tasks completed`,
      icon: ChartBarIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Time Tracked',
      value: `${totalHours.toFixed(1)}h`,
      subtitle: estimatedHours > 0 ? `${estimatedHours}h estimated` : 'No estimate',
      icon: ClockIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Billable Hours',
      value: `${billableHours.toFixed(1)}h`,
      subtitle: project.hourlyRate ? formatCurrency(estimatedRevenue) : 'No rate set',
      icon: CurrencyDollarIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Project Timeline',
      value: remainingDays !== null ? (remainingDays > 0 ? `${remainingDays} days left` : 'Overdue') : 'No end date',
      subtitle: `Started ${formatDate(startDate)}`,
      icon: CalendarIcon,
      color: remainingDays !== null && remainingDays < 0 ? 'text-red-600' : 'text-orange-600',
      bgColor: remainingDays !== null && remainingDays < 0 ? 'bg-red-50' : 'bg-orange-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.subtitle}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Task Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700">Completed</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{completedTasks}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700">In Progress</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{inProgressTasks}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-400 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700">To Do</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {tasks.filter(task => task.status === 'todo').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700">Review</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {tasks.filter(task => task.status === 'review').length}
              </span>
            </div>
            {overdueTasks > 0 && (
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="w-4 h-4 text-red-500 mr-2" />
                  <span className="text-sm text-red-700 font-medium">Overdue</span>
                </div>
                <span className="text-sm font-medium text-red-900">{overdueTasks}</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Project Progress</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Overall Completion</span>
                <span>{progressPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>

            {estimatedHours > 0 && (
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Time Progress</span>
                  <span>{Math.round((totalHours / estimatedHours) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((totalHours / estimatedHours) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{totalHours.toFixed(1)}h tracked</span>
                  <span>{estimatedHours}h estimated</span>
                </div>
              </div>
            )}

            {project.endDate && (
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Timeline Progress</span>
                  <span>{Math.round((elapsedDays / totalDays) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      remainingDays && remainingDays < 0 ? 'bg-red-600' : 'bg-orange-600'
                    }`}
                    style={{ width: `${Math.min((elapsedDays / totalDays) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{elapsedDays} days elapsed</span>
                  <span>{totalDays} days total</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Project Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-600">Status</p>
            <p className={`text-sm font-semibold ${
              project.isActive ? 'text-green-600' : 'text-gray-600'
            }`}>
              {project.isActive ? 'Active' : 'Inactive'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Start Date</p>
            <p className="text-sm text-gray-900">{formatDate(project.startDate)}</p>
          </div>
          {project.endDate && (
            <div>
              <p className="text-sm font-medium text-gray-600">End Date</p>
              <p className="text-sm text-gray-900">{formatDate(project.endDate)}</p>
            </div>
          )}
          {project.hourlyRate && (
            <div>
              <p className="text-sm font-medium text-gray-600">Hourly Rate</p>
              <p className="text-sm text-gray-900">{formatCurrency(project.hourlyRate)}/hour</p>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-600">Created</p>
            <p className="text-sm text-gray-900">{formatDate(project.createdAt)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Last Updated</p>
            <p className="text-sm text-gray-900">{formatDate(project.updatedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}