'use client';

import { Task, Project, Client, TimeEntry } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';
import { 
  CalendarIcon, 
  ClockIcon, 
  UserIcon,
  TagIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface TaskDetailProps {
  task: Task;
  project: Project;
  client: Client;
  timeEntries: TimeEntry[];
}

export function TaskDetail({ task, project, client, timeEntries }: TaskDetailProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'review':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = () => {
    if (!task.dueDate || task.status === 'completed' || task.status === 'cancelled') {
      return false;
    }
    return new Date() > task.dueDate;
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
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  // Calculate time statistics
  const totalTimeEntries = timeEntries.length;
  const totalBillableTime = timeEntries
    .filter(entry => entry.isBillable)
    .reduce((sum, entry) => sum + entry.duration, 0);
  const totalNonBillableTime = timeEntries
    .filter(entry => !entry.isBillable)
    .reduce((sum, entry) => sum + entry.duration, 0);

  return (
    <div className="space-y-6">
      {/* Task Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {task.title}
              {isOverdue() && (
                <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                  Overdue
                </span>
              )}
            </h1>
            {task.description && (
              <p className="text-gray-700 mb-4">{task.description}</p>
            )}
          </div>
          <div className="flex space-x-2">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
              {getStatusLabel(task.status)}
            </span>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
              {getPriorityLabel(task.priority)}
            </span>
          </div>
        </div>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {task.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
              >
                <TagIcon className="w-3 h-3 mr-1" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Task Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Project & Client Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Project Details</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Project</p>
              <p className="text-sm text-gray-900">{project.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Client</p>
              <p className="text-sm text-gray-900">{client.name}</p>
            </div>
            {project.hourlyRate && (
              <div>
                <p className="text-sm font-medium text-gray-600">Project Rate</p>
                <p className="text-sm text-gray-900">{formatCurrency(project.hourlyRate)}/hour</p>
              </div>
            )}
          </div>
        </div>

        {/* Task Assignment & Timeline */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Assignment & Timeline</h3>
          <div className="space-y-3">
            {task.assignedTo && (
              <div className="flex items-center">
                <UserIcon className="w-4 h-4 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Assigned To</p>
                  <p className="text-sm text-gray-900">{task.assignedTo}</p>
                </div>
              </div>
            )}
            {task.dueDate && (
              <div className="flex items-center">
                <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Due Date</p>
                  <p className={`text-sm ${isOverdue() ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                    {formatDate(task.dueDate)}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center">
              <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-600">Created</p>
                <p className="text-sm text-gray-900">{formatDate(task.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Time & Billing */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Time & Billing</h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <ClockIcon className="w-4 h-4 text-gray-400 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-600">Time Tracked</p>
                <p className="text-sm text-gray-900">
                  {task.actualHours.toFixed(1)}h
                  {task.estimatedHours && (
                    <span className="text-gray-500"> / {task.estimatedHours}h estimated</span>
                  )}
                </p>
              </div>
            </div>
            {task.isBillable && (
              <div className="flex items-center">
                <CurrencyDollarIcon className="w-4 h-4 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Billable Hours</p>
                  <p className="text-sm text-green-600 font-medium">{task.billableHours.toFixed(1)}h</p>
                </div>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-600">Billable Status</p>
              <p className={`text-sm font-medium ${task.isBillable ? 'text-green-600' : 'text-gray-600'}`}>
                {task.isBillable ? 'Billable' : 'Non-billable'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Time Entries Summary */}
      {timeEntries.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Time Tracking Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{totalTimeEntries}</p>
              <p className="text-sm text-gray-600">Total Entries</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{(totalBillableTime / 3600).toFixed(1)}h</p>
              <p className="text-sm text-gray-600">Billable Time</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">{(totalNonBillableTime / 3600).toFixed(1)}h</p>
              <p className="text-sm text-gray-600">Non-billable Time</p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      {task.estimatedHours && task.estimatedHours > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Progress</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Time Progress</span>
              <span>{Math.round((task.actualHours / task.estimatedHours) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  task.actualHours > task.estimatedHours ? 'bg-red-600' : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min((task.actualHours / task.estimatedHours) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{task.actualHours.toFixed(1)}h tracked</span>
              <span>{task.estimatedHours}h estimated</span>
            </div>
            {task.actualHours > task.estimatedHours && (
              <p className="text-xs text-red-600 font-medium">
                Task is {(task.actualHours - task.estimatedHours).toFixed(1)}h over estimate
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}