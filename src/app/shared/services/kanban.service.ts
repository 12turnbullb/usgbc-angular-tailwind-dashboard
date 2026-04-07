import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export type TaskStatus = 'todo' | 'in-progress' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
}

export interface KanbanColumn {
  name: string;
  status: TaskStatus;
}

export const PRIORITY_COLORS: Record<TaskPriority, { bg: string; text: string }> = {
  low:    { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
  medium: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400' },
  high:   { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
};

const SEED_TASKS: Task[] = [
  { id: '1', title: 'Research competitors', description: 'Analyze top 5 competitor dashboards', priority: 'high', status: 'todo' },
  { id: '2', title: 'Design wireframes', description: 'Create low-fidelity wireframes for main views', priority: 'medium', status: 'todo' },
  { id: '3', title: 'Set up CI pipeline', description: 'Configure GitHub Actions for build and test', priority: 'high', status: 'in-progress' },
  { id: '4', title: 'Implement auth flow', description: 'Add login and registration pages', priority: 'medium', status: 'in-progress' },
  { id: '5', title: 'Write API docs', description: 'Document REST endpoints with examples', priority: 'low', status: 'done' },
  { id: '6', title: 'Fix header alignment', description: 'Resolve responsive layout issue in header', priority: 'low', status: 'done' },
];

@Injectable({ providedIn: 'root' })
export class KanbanService {
  private tasksSubject = new BehaviorSubject<Task[]>(SEED_TASKS);
  tasks$: Observable<Task[]> = this.tasksSubject.asObservable();

  private nextId = SEED_TASKS.length + 1;

  getTasksByStatus(status: TaskStatus): Observable<Task[]> {
    return this.tasks$.pipe(
      map(tasks => tasks.filter(t => t.status === status))
    );
  }

  addTask(task: Omit<Task, 'id'>): void {
    const id = String(this.nextId++);
    const current = this.tasksSubject.getValue();
    this.tasksSubject.next([...current, { ...task, id }]);
  }

  updateTask(task: Task): void {
    const current = this.tasksSubject.getValue();
    const index = current.findIndex(t => t.id === task.id);
    if (index === -1) return;
    const updated = [...current];
    updated[index] = { ...task };
    this.tasksSubject.next(updated);
  }

  moveTask(taskId: string, targetStatus: TaskStatus): void {
    const current = this.tasksSubject.getValue();
    const index = current.findIndex(t => t.id === taskId);
    if (index === -1) return;
    if (current[index].status === targetStatus) return;
    const updated = [...current];
    updated[index] = { ...updated[index], status: targetStatus };
    this.tasksSubject.next(updated);
  }

  reorderTask(taskId: string, direction: 'up' | 'down'): void {
    const current = this.tasksSubject.getValue();
    const taskIndex = current.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const task = current[taskIndex];
    const sameStatusIndices = current
      .map((t, i) => ({ task: t, index: i }))
      .filter(entry => entry.task.status === task.status);

    const posInGroup = sameStatusIndices.findIndex(entry => entry.index === taskIndex);
    const swapPosInGroup = direction === 'up' ? posInGroup - 1 : posInGroup + 1;

    if (swapPosInGroup < 0 || swapPosInGroup >= sameStatusIndices.length) return;

    const swapIndex = sameStatusIndices[swapPosInGroup].index;
    const updated = [...current];
    [updated[taskIndex], updated[swapIndex]] = [updated[swapIndex], updated[taskIndex]];
    this.tasksSubject.next(updated);
  }
}
