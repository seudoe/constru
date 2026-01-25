"use client"

import React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Grip, Plus, Trash2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface Task {
  id: string
  title: string
  description: string
  state: "not started" | "in progress" | "completed"
  priority: number
}

const mockTasks: Task[] = [
  {
    id: "1",
    title: "Review Site Safety",
    description: "Conduct safety audit at Site A",
    state: "not started",
    priority: 1,
  },
  {
    id: "2",
    title: "Update Progress Report",
    description: "Complete daily progress documentation",
    state: "in progress",
    priority: 2,
  },
  {
    id: "3",
    title: "Approve Material Order",
    description: "Review and approve supplier invoices",
    state: "not started",
    priority: 1,
  },
  {
    id: "4",
    title: "Team Meeting",
    description: "Weekly coordination meeting with site leads",
    state: "in progress",
    priority: 3,
  },
  {
    id: "5",
    title: "Equipment Maintenance",
    description: "Schedule crane inspection",
    state: "not started",
    priority: 2,
  },
  {
    id: "6",
    title: "Budget Review",
    description: "Analyze current project expenditure",
    state: "completed",
    priority: 4,
  },
  {
    id: "7",
    title: "Worker Training",
    description: "Conduct safety training session",
    state: "completed",
    priority: 5,
  },
  {
    id: "8",
    title: "Quality Check",
    description: "Inspect concrete quality",
    state: "in progress",
    priority: 2,
  },
  {
    id: "9",
    title: "Vendor Coordination",
    description: "Finalize delivery schedule",
    state: "not started",
    priority: 3,
  },
  {
    id: "10",
    title: "Site Cleanup",
    description: "Daily site cleanup and waste management",
    state: "completed",
    priority: 5,
  },
]

const columns = [
  { id: "not started", title: "To Do" },
  { id: "in progress", title: "In Progress" },
  { id: "completed", title: "Done" },
]

interface DragState {
  taskId: string | null
  sourceColumn: string | null
}

export function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks)
  const [drag, setDrag] = useState<DragState>({ taskId: null, sourceColumn: null })
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: 2,
  })

  // Generate unique ID using timestamp and random number
  const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  const handleAddTask = () => {
    if (!formData.title.trim()) return

    const newTask: Task = {
      id: generateId(),
      title: formData.title,
      description: formData.description,
      state: "not started",
      priority: formData.priority,
    }

    setTasks([...tasks, newTask])
    setFormData({ title: "", description: "", priority: 2 })
    setShowForm(false)
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter((task) => task.id !== taskId))
  }

  const handleDragStart = (e: React.DragEvent, taskId: string, column: string) => {
    setDrag({ taskId, sourceColumn: column })
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, targetColumn: string) => {
    e.preventDefault()
    if (drag.taskId && drag.sourceColumn !== targetColumn) {
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === drag.taskId
            ? { ...task, state: targetColumn as "not started" | "in progress" | "completed" }
            : task
        )
      )
    }
    setDrag({ taskId: null, sourceColumn: null })
  }

  const handleDragEnd = () => {
    setDrag({ taskId: null, sourceColumn: null })
  }

  const getTasksForColumn = (columnId: string) => {
    return tasks
      .filter((task) => task.state === columnId)
      .sort((a, b) => a.priority - b.priority)
  }

  const getPriorityColor = (priority: number) => {
    if (priority <= 2) return "bg-red-100 text-red-700"
    if (priority <= 3) return "bg-amber-100 text-amber-700"
    return "bg-green-100 text-green-700"
  }

  const getPriorityLabel = (priority: number) => {
    if (priority === 1) return "Critical"
    if (priority === 2) return "High"
    if (priority === 3) return "Medium"
    if (priority === 4) return "Low"
    return "Minimal"
  }

  return (
    <Card className="p-6 transition-all duration-500 hover:shadow-xl animate-slide-in-up" style={{ animationDelay: "100ms" }}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-foreground">Task Management</h2>
        <Button
          onClick={() => setShowForm(!showForm)}
          size="sm"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </Button>
      </div>

      {/* Add Task Form */}
      {showForm && (
        <Card className="p-4 mb-6 bg-muted/20 border border-border">
          <div className="space-y-3">
            <Input
              placeholder="Task title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="text-sm"
            />
            <Textarea
              placeholder="Task description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="text-sm resize-none h-20"
            />
            <div className="flex gap-2 items-center">
              <label className="text-sm font-medium">Priority:</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                className="px-3 py-1 text-sm border border-border rounded-md bg-card"
              >
                <option value={1}>Critical</option>
                <option value={2}>High</option>
                <option value={3}>Medium</option>
                <option value={4}>Low</option>
                <option value={5}>Minimal</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddTask}
              >
                Add Task
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((column) => {
          const columnTasks = getTasksForColumn(column.id)
          return (
            <div
              key={column.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
              className="bg-muted/30 rounded-lg p-4 min-h-125 border border-border/50"
            >
              <h3 className="font-semibold text-foreground mb-4 text-sm">
                {column.title} ({columnTasks.length})
              </h3>

              <div className="space-y-3">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id, column.id)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "p-3 rounded-lg cursor-move transition-all duration-200 bg-card border border-border hover:shadow-md group",
                      drag.taskId === task.id ? "opacity-50 shadow-lg" : ""
                    )}
                  >
                    <div className="flex gap-2 items-start">
                      <Grip className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm leading-snug">{task.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                        <span
                          className={cn(
                            "inline-block text-[10px] font-semibold mt-2 px-2 py-0.5 rounded",
                            getPriorityColor(task.priority)
                          )}
                        >
                          {getPriorityLabel(task.priority)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
