'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Calendar, Clock, CheckCircle, Circle, Tag, Filter, ArrowUpDown, Edit, Trash2, List, Grid, X } from 'lucide-react';
import useSWR from 'swr';
import { Suspense, useState, useEffect } from 'react';
import { TaskModal } from '@/components/task-modal';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function TasksSkeleton() {
  return (
    <div className="space-y-4">
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TasksList() {
  const { data: tasks, error: tasksError, mutate } = useSWR<any[]>('/api/tasks', fetcher);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'title'>('dueDate');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'detailed' | 'simple'>(() => {
    // Load from localStorage on initial render
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tasks-view-mode');
      return (saved === 'simple' || saved === 'detailed') ? saved : 'detailed';
    }
    return 'detailed';
  });
  const [isSimpleAddOpen, setIsSimpleAddOpen] = useState(false);
  const [simpleTaskTitle, setSimpleTaskTitle] = useState('');

  // Persist view mode to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tasks-view-mode', viewMode);
    }
  }, [viewMode]);

  const handleSaveTask = async (taskData: any) => {
    try {
      const isEditing = editingTask && editingTask.id;
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? '/api/tasks' : '/api/tasks';
      
      // Add the task ID for editing
      const requestData = isEditing ? { ...taskData, id: editingTask.id } : taskData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(isEditing ? 'Failed to update task' : 'Failed to create task');
      }

      // Refresh the tasks list
      await mutate();
    } catch (error) {
      console.error('Error saving task:', error);
      throw error;
    }
  };

  const handleToggleComplete = async (taskId: number, currentCompleted: number) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: taskId,
          completed: !currentCompleted,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task completion');
      }

      // Refresh the tasks list
      await mutate();
    } catch (error) {
      console.error('Error updating task completion', error);
    }
  };

  const handleDeleteTask = async (taskId: number, taskTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${taskTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks?id=${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      // Refresh the tasks list
      await mutate();
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task. Please try again.');
    }
  };

  const openAddModal = () => {
    setEditingTask(null);
    if (viewMode === 'simple') {
      setIsSimpleAddOpen(true);
    } else {
      setIsModalOpen(true);
    }
  };

  const openEditModal = (task: any) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleSimpleAddTask = async () => {
    if (!simpleTaskTitle.trim()) return;

    try {
      const taskData = {
        title: simpleTaskTitle,
        description: '',
        dueDate: null,
        priority: 'medium',
        tags: '',
        color: '#000000',
      };

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      setSimpleTaskTitle('');
      setIsSimpleAddOpen(false);
      await mutate();
    } catch (error) {
      console.error('Error adding simple task:', error);
      alert('Failed to add task. Please try again.');
    }
  };

  if (tasksError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Error loading tasks. Please try again.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'high': 'bg-red-100 text-red-800 border border-red-200',
      'medium': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      'low': 'bg-green-100 text-green-800 border border-green-200',
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  const isOverdue = (dueDate: string) => {
    const today = new Date();
    const taskDate = new Date(dueDate);
    return taskDate < today;
  };

  const isToday = (dueDate: string) => {
    const today = new Date();
    const taskDate = new Date(dueDate);
    return today.toDateString() === taskDate.toDateString();
  };

  const parseTags = (tagsString: string) => {
    try {
      return JSON.parse(tagsString) || [];
    } catch {
      return [];
    }
  };

  // Filter and sort tasks
  const filterAndSortTasks = () => {
    if (!tasks) return [];
    
    let filteredTasks = tasks;
    
    // Apply filter
    if (filter === 'completed') {
      filteredTasks = tasks.filter(task => task.completed === 1);
    } else if (filter === 'pending') {
      filteredTasks = tasks.filter(task => task.completed === 0);
    }
    
    // Apply sorting
    return filteredTasks.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          const dateA = new Date(a.dueDate);
          const dateB = new Date(b.dueDate);
          return dateA.getTime() - dateB.getTime();
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          return priorityB - priorityA; // High priority first
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  };

  const sortedTasks = filterAndSortTasks();
  const completedCount = tasks ? tasks.filter(task => task.completed === 1).length : 0;
  const pendingCount = tasks ? tasks.filter(task => task.completed === 0).length : 0;
  const totalCount = tasks ? tasks.length : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">
            {totalCount} total • {completedCount} completed • {pendingCount} pending
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'detailed' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('detailed')}
              className="h-8"
            >
              <Grid className="h-4 w-4 mr-1" />
              Detailed
            </Button>
            <Button
              variant={viewMode === 'simple' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('simple')}
              className="h-8"
            >
              <List className="h-4 w-4 mr-1" />
              Simple
            </Button>
          </div>
          <Button onClick={openAddModal}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Filters and Sorting - Only show in detailed view */}
      {viewMode === 'detailed' && (
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All ({totalCount})
            </Button>
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('pending')}
            >
              Pending ({pendingCount})
            </Button>
            <Button
              variant={filter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('completed')}
            >
              Completed ({completedCount})
            </Button>
          </div>

          <div className="flex items-center space-x-2 ml-auto">
            <ArrowUpDown className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'dueDate' | 'priority' | 'title')}
              className="text-sm border border-gray-300 rounded-md px-2 py-1"
            >
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
              <option value="title">Title</option>
            </select>
          </div>
        </div>
      )}

      {viewMode === 'simple' ? (
        // Simple To-Do List View
        <div className="space-y-4">
          {/* Simple Add Task Form */}
          {isSimpleAddOpen && (
            <Card className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Add Task</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsSimpleAddOpen(false);
                      setSimpleTaskTitle('');
                      setSimpleTaskDueDate('');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <Input
                    placeholder="Task title..."
                    value={simpleTaskTitle}
                    onChange={(e) => setSimpleTaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSimpleAddTask();
                      }
                    }}
                    className="mb-2"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSimpleAddTask} size="sm" disabled={!simpleTaskTitle.trim()}>
                      Add
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsSimpleAddOpen(false);
                        setSimpleTaskTitle('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Simple Task List */}
          {!isSimpleAddOpen && (
            <Button
              variant="outline"
              onClick={() => setIsSimpleAddOpen(true)}
              className="w-full mb-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          )}

          {!sortedTasks || sortedTasks.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12">
                <div className="text-center">
                  <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
                  <p className="text-gray-500 mb-6">Add your first task to get started.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {sortedTasks.map((task) => {
                const taskDate = new Date(task.dueDate);
                const isTaskOverdue = isOverdue(task.dueDate);
                const isTaskToday = isToday(task.dueDate);
                
                return (
                  <Card
                    key={task.id}
                    className={`p-4 hover:shadow-md transition-shadow ${
                      task.completed ? 'opacity-60' : ''
                    } ${isTaskOverdue && !task.completed ? 'border-red-200 bg-red-50/50' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleComplete(task.id, task.completed)}
                        className="h-6 w-6 p-0 mt-0.5 flex-shrink-0"
                        title={task.completed ? 'Mark Incomplete' : 'Mark Complete'}
                      >
                        {task.completed ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400" />
                        )}
                      </Button>
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`text-sm font-medium ${
                            task.completed
                              ? 'line-through text-gray-500'
                              : 'text-gray-900'
                          }`}
                        >
                          {task.title}
                        </h3>
                        {task.description && !task.completed && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(task)}
                          className="h-8 w-8 p-0"
                          title="Edit Task"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTask(task.id, task.title)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete Task"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : !sortedTasks || sortedTasks.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'all' ? 'No tasks yet' : `No ${filter} tasks`}
              </h3>
              <p className="text-gray-500 mb-6">
                {filter === 'all' 
                  ? 'Create your first task to get started with task management.'
                  : `No ${filter} tasks found.`
                }
              </p>
              {filter === 'all' && (
                <Button onClick={openAddModal}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Task
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Color
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedTasks.map((task) => {
                  const taskDate = new Date(task.dueDate);
                  const isTaskOverdue = isOverdue(task.dueDate);
                  const isTaskToday = isToday(task.dueDate);
                  const tags = parseTags(task.tags);
                  
                  return (
                    <tr 
                      key={task.id} 
                      className={`hover:bg-gray-50 ${
                        task.completed ? 'opacity-75' : ''
                      } ${isTaskOverdue && !task.completed ? 'bg-red-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleToggleComplete(task.id, task.completed)}
                            className="h-6 w-6 p-0 mr-3"
                            title={task.completed ? 'Mark Incomplete' : 'Mark Complete'}
                          >
                            {task.completed ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Circle className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className={`text-sm font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                {task.title}
                              </h3>
                              {isTaskToday && !task.completed && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                  Today
                                </span>
                              )}
                              {isTaskOverdue && !task.completed && (
                                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                                  Overdue
                                </span>
                              )}
                            </div>
                            {task.description && (
                              <p className={`text-xs ${task.completed ? 'text-gray-400' : 'text-gray-500'} mt-1 max-w-xs truncate`}>
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>{formatDate(task.dueDate)}</span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-xs text-gray-500">{formatTime(task.dueDate)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {task.color ? (
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-4 h-4 rounded-full border-2 border-gray-300"
                              style={{ backgroundColor: task.color }}
                            />
                            <span className="text-xs text-gray-600 font-medium">Color assigned</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">No color</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {tags.slice(0, 3).map((tag: string, index: number) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                            {tags.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                +{tags.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">No tags</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          task.completed 
                            ? 'bg-green-100 text-green-800' 
                            : isTaskOverdue 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {task.completed ? 'Completed' : isTaskOverdue ? 'Overdue' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openEditModal(task)}
                            className="h-8 w-8 p-0"
                            title="Edit Task"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteTask(task.id, task.title)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete Task"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <TaskModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSaveTask}
        mode={editingTask ? 'edit' : 'add'}
        initialData={editingTask}
      />
    </div>
  );
}

export default function TasksPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <Suspense fallback={<TasksSkeleton />}>
        <TasksList />
      </Suspense>
    </section>
  );
} 