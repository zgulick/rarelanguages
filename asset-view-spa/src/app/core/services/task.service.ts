import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, delay } from 'rxjs/operators';
import { 
  Task, 
  TaskSummary, 
  TaskStatus, 
  TaskPriority, 
  TaskFilter, 
  TaskSort 
} from '../../models';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly API_URL = '/api/tasks';

  private mockTasks: Task[] = [
    {
      id: '1',
      processId: '1',
      assetId: '1',
      name: 'Exterior Building Inspection',
      description: 'Inspect exterior walls, windows, and roof condition',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      assignedTo: 'John Smith',
      dueDate: new Date('2024-12-25'),
      createdDate: new Date('2024-12-10'),
      updatedDate: new Date('2024-12-15'),
      tags: ['inspection', 'exterior', 'urgent'],
      attachments: [],
      estimatedHours: 4
    },
    {
      id: '2',
      processId: '1',
      assetId: '1',
      name: 'Interior Safety Check',
      description: 'Check fire safety equipment and emergency exits',
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.HIGH,
      assignedTo: 'Jane Doe',
      dueDate: new Date('2024-12-20'),
      completedDate: new Date('2024-12-18'),
      createdDate: new Date('2024-12-05'),
      updatedDate: new Date('2024-12-18'),
      tags: ['inspection', 'safety', 'interior'],
      attachments: [],
      estimatedHours: 2,
      actualHours: 1.5
    },
    {
      id: '3',
      processId: '2',
      assetId: '1',
      name: 'HVAC System Maintenance',
      description: 'Annual HVAC system cleaning and maintenance',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      assignedTo: 'Mike Johnson',
      dueDate: new Date('2025-01-10'),
      createdDate: new Date('2024-12-01'),
      updatedDate: new Date('2024-12-01'),
      tags: ['maintenance', 'hvac', 'annual'],
      attachments: [],
      estimatedHours: 6
    },
    {
      id: '4',
      processId: '2',
      assetId: '1',
      name: 'Plumbing System Check',
      description: 'Inspect pipes, faucets, and drainage systems',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      assignedTo: 'Sarah Wilson',
      dueDate: new Date('2025-01-15'),
      createdDate: new Date('2024-12-08'),
      updatedDate: new Date('2024-12-08'),
      tags: ['maintenance', 'plumbing'],
      attachments: [],
      estimatedHours: 3
    },
    {
      id: '5',
      processId: '3',
      assetId: '1',
      name: 'Fire Safety Compliance Review',
      description: 'Review and update fire safety documentation',
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.HIGH,
      assignedTo: 'Robert Brown',
      dueDate: new Date('2024-11-30'),
      completedDate: new Date('2024-11-28'),
      createdDate: new Date('2024-11-01'),
      updatedDate: new Date('2024-11-28'),
      tags: ['compliance', 'fire-safety', 'documentation'],
      attachments: [],
      estimatedHours: 4,
      actualHours: 3.5
    },
    {
      id: '6',
      processId: '4',
      assetId: '1',
      name: 'Tenant Satisfaction Survey',
      description: 'Conduct quarterly tenant satisfaction survey',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.LOW,
      assignedTo: 'Emily Davis',
      dueDate: new Date('2024-12-31'),
      createdDate: new Date('2024-12-01'),
      updatedDate: new Date('2024-12-10'),
      tags: ['tenant', 'survey', 'quarterly'],
      attachments: [],
      estimatedHours: 2
    }
  ];

  constructor(private http: HttpClient) {}

  getTasksByProcessId(processId: string, filter?: TaskFilter, sort?: TaskSort): Observable<TaskSummary[]> {
    return of(this.mockTasks).pipe(
      delay(400),
      map(tasks => {
        let filteredTasks = tasks.filter(task => task.processId === processId);

        if (filter) {
          filteredTasks = this.applyFilter(filteredTasks, filter);
        }

        if (sort) {
          filteredTasks = this.applySort(filteredTasks, sort);
        }

        return filteredTasks.map(this.mapToTaskSummary);
      })
    );
  }

  getTaskById(taskId: string): Observable<Task | null> {
    return of(this.mockTasks).pipe(
      delay(300),
      map(tasks => tasks.find(t => t.id === taskId) || null)
    );
  }

  updateTask(task: Task): Observable<Task> {
    return of(task).pipe(
      delay(500),
      map(updatedTask => {
        const index = this.mockTasks.findIndex(t => t.id === updatedTask.id);
        if (index !== -1) {
          this.mockTasks[index] = { ...updatedTask, updatedDate: new Date() };
          return this.mockTasks[index];
        }
        return updatedTask;
      })
    );
  }

  updateTaskStatus(taskId: string, status: TaskStatus): Observable<Task> {
    return of(this.mockTasks.find(t => t.id === taskId)!).pipe(
      delay(300),
      map(task => {
        const updatedTask = { 
          ...task, 
          status, 
          updatedDate: new Date(),
          completedDate: status === TaskStatus.COMPLETED ? new Date() : undefined
        };
        
        const index = this.mockTasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
          this.mockTasks[index] = updatedTask;
        }
        
        return updatedTask;
      })
    );
  }

  getTaskStatistics(processId?: string): Observable<TaskStatistics> {
    return of(this.mockTasks).pipe(
      delay(200),
      map(tasks => {
        const filteredTasks = processId 
          ? tasks.filter(task => task.processId === processId)
          : tasks;

        return {
          total: filteredTasks.length,
          completed: filteredTasks.filter(t => t.status === TaskStatus.COMPLETED).length,
          inProgress: filteredTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
          todo: filteredTasks.filter(t => t.status === TaskStatus.TODO).length,
          overdue: filteredTasks.filter(t => 
            t.dueDate && new Date() > t.dueDate && t.status !== TaskStatus.COMPLETED
          ).length
        };
      })
    );
  }

  private applyFilter(tasks: Task[], filter: TaskFilter): Task[] {
    return tasks.filter(task => {
      if (filter.status && task.status !== filter.status) return false;
      if (filter.priority && task.priority !== filter.priority) return false;
      if (filter.assignedTo && task.assignedTo !== filter.assignedTo) return false;
      if (filter.dueDateFrom && task.dueDate && task.dueDate < filter.dueDateFrom) return false;
      if (filter.dueDateTo && task.dueDate && task.dueDate > filter.dueDateTo) return false;
      if (filter.tags && filter.tags.length > 0) {
        const hasMatchingTag = filter.tags.some(tag => task.tags.includes(tag));
        if (!hasMatchingTag) return false;
      }
      return true;
    });
  }

  private applySort(tasks: Task[], sort: TaskSort): Task[] {
    return tasks.sort((a, b) => {
      const aValue = a[sort.field];
      const bValue = b[sort.field];
      
      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;
      
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;
      
      return sort.direction === 'desc' ? -comparison : comparison;
    });
  }

  private mapToTaskSummary(task: Task): TaskSummary {
    return {
      id: task.id,
      processId: task.processId,
      name: task.name,
      status: task.status,
      priority: task.priority,
      assignedTo: task.assignedTo,
      dueDate: task.dueDate,
      tags: task.tags
    };
  }
}

export interface TaskStatistics {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
  overdue: number;
}