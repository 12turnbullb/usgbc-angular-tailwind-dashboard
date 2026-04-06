import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';

export type TaskStatus = 'todo' | 'inprogress' | 'done';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
}

export interface Column {
  id: TaskStatus;
  name: string;
  tasks: Task[];
}

const MOCK_TASKS: Task[] = [
  { id: '1', title: 'Research competitors', description: 'Analyze top 5 competitor dashboards', priority: 'High', status: 'todo' },
  { id: '2', title: 'Design wireframes', description: 'Create low-fidelity wireframes for main pages', priority: 'Medium', status: 'todo' },
  { id: '3', title: 'Set up CI pipeline', description: 'Configure GitHub Actions for build and test', priority: 'High', status: 'inprogress' },
  { id: '4', title: 'Implement auth module', description: 'Add login and registration flows', priority: 'Medium', status: 'inprogress' },
  { id: '5', title: 'Write API docs', description: 'Document REST endpoints with examples', priority: 'Low', status: 'done' },
  { id: '6', title: 'Fix header styling', description: 'Resolve dark mode issues in the header', priority: 'Low', status: 'done' },
];

@Injectable({ providedIn: 'root' })
export class KanbanService {
  private tasksSubject = new BehaviorSubject<Task[]>(MOCK_TASKS);
  tasks$ = this.tasksSubject.asObservable();

  columns$: Observable<Map<TaskStatus, Task[]>> = this.tasks$.pipe(
    map(tasks => {
      const columns = new Map<TaskStatus, Task[]>();
      columns.set('todo', tasks.filter(t => t.status === 'todo'));
      columns.set('inprogress', tasks.filter(t => t.status === 'inprogress'));
      columns.set('done', tasks.filter(t => t.status === 'done'));
      return columns;
    })
  );

  addTask(task: Omit<Task, 'id'>): void {
    const newTask: Task = { ...task, id: Date.now().toString() };
    this.tasksSubject.next([...this.tasksSubject.value, newTask]);
  }

  updateTask(task: Task): void {
    const tasks = this.tasksSubject.value.map(t => t.id === task.id ? task : t);
    this.tasksSubject.next(tasks);
  }

  moveTask(taskId: string, targetStatus: TaskStatus): void {
    const tasks = this.tasksSubject.value.map(t =>
      t.id === taskId ? { ...t, status: targetStatus } : t
    );
    this.tasksSubject.next(tasks);
  }

  reorderTask(taskId: string, direction: 'up' | 'down'): void {
    const tasks = [...this.tasksSubject.value];
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const sameTasks = tasks.filter(t => t.status === task.status);
    const idx = sameTasks.findIndex(t => t.id === taskId);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;

    if (swapIdx < 0 || swapIdx >= sameTasks.length) return;

    const globalIdx = tasks.indexOf(sameTasks[idx]);
    const globalSwapIdx = tasks.indexOf(sameTasks[swapIdx]);
    [tasks[globalIdx], tasks[globalSwapIdx]] = [tasks[globalSwapIdx], tasks[globalIdx]];

    this.tasksSubject.next(tasks);
  }

  getTasksByStatus(status: TaskStatus): Task[] {
    return this.tasksSubject.value.filter(t => t.status === status);
  }
}
