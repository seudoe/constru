"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Grip, Plus, Trash2, Loader2, AlertTriangle, Shield, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase-browser";
import { useTranslation } from "react-i18next";

interface Labour {
  id: number;
  name: string;
  email: string;
  user_id: string;
}

interface Contractor {
  id: number;
  name: string;
  current_rating: number;
}

interface OtpRequest {
  id: number;
  labour_id: number;
  otp_code: string;
  is_verified: boolean;
  labours: {
    id: number;
    name: string;
    email: string;
  };
}

interface TaskAssignment {
  id: number;
  assignee_type: 'labour' | 'contractor';
  assignee_id: number;
  labours?: {
    id: number;
    name: string;
    email: string;
  };
  contractors?: {
    id: number;
    name: string;
  };
}

interface Task {
  id: number;
  description: string;
  state: "not started" | "in progress" | "completed";
  priority: number;
  task_type?: "normal" | "hazardous";
  require_otp?: boolean;
  otp_required?: boolean; // Legacy field
  otp_authorized?: boolean;
  task_assignments?: TaskAssignment[];
  otp_requests?: OtpRequest[];
}

interface DragState {
  taskId: string | null;
  sourceColumn: string | null;
}

export function KanbanBoardIntegrated() {
  const { t } = useTranslation();

  const columns = [
    { id: "not started", title: t("to_do") },
    { id: "in progress", title: t("in_progress") },
    { id: "completed", title: t("done") },
  ];

  const [tasks, setTasks] = useState<Task[]>([]);
  const [labours, setLabours] = useState<Labour[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [drag, setDrag] = useState<DragState>({
    taskId: null,
    sourceColumn: null,
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [newTask, setNewTask] = useState<{
    description: string;
    priority: number;
    state: "not started" | "in progress" | "completed";
    task_type: "normal" | "hazardous";
    require_otp: boolean;
    assigned_labours: number[];
    assigned_contractors: number[];
  }>({
    description: "",
    priority: 3,
    state: "not started",
    task_type: "normal",
    require_otp: false,
    assigned_labours: [],
    assigned_contractors: [],
  });

  const [otpInputs, setOtpInputs] = useState<Record<number, Record<number, string>>>({});
  const [selectedLabourForOtp, setSelectedLabourForOtp] = useState<Record<number, number | null>>({});
  const [otpInputValue, setOtpInputValue] = useState<Record<number, string>>({});

  const supabase = createClient();

  useEffect(() => {
    fetchTasks();
    fetchLabours();
    fetchContractors();

    // Real-time subscription
    const channel = supabase
      .channel('kanban-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kanban_tasks' },
        (payload) => {
          console.log('Real-time change received:', payload);
          fetchTasks(); // Refresh tasks on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchTasks() {
    try {
      const response = await fetch("/api/kanban");
      const data = await response.json();
      if (Array.isArray(data)) {
        setTasks(data);
      } else {
        throw new Error("Invalid response");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(t("failed_to_load_tasks"));
    } finally {
      setLoading(false);
    }
  }

  async function fetchLabours() {
    try {
      const response = await fetch("/api/labours");
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setLabours(data);
        }
      }
    } catch (error) {
      console.warn("Failed to fetch labours (feature may not be available):", error);
    }
  }

  async function fetchContractors() {
    try {
      const response = await fetch("/api/contractors/rate");
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setContractors(data);
        }
      }
    } catch (error) {
      console.warn("Failed to fetch contractors:", error);
    }
  }

  async function handleCreateTask() {
    if (!newTask.description.trim()) {
      alert(t("field_required"));
      return;
    }

    if ((newTask.task_type as string) === "hazardous" && newTask.require_otp && newTask.assigned_labours.length === 0) {
      alert(t("assign_labours")); // Using t() for "Please assign..." if available, or just t("assign_labours") which resolves to "Assign Labours". A better key would be ideal, but falling back to existing.
      return;
    }

    setActionLoading(true);
    setErrorMessage(null);

    try {
      console.log("Creating task with data:", newTask);

      const response = await fetch("/api/kanban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Create task error:", errorData);
        throw new Error(errorData.error || `Create failed with status ${response.status}`);
      }

      await fetchTasks();
      setNewTask({
        description: "",
        priority: 3,
        state: "not started",
        task_type: "normal",
        require_otp: false,
        assigned_labours: [],
        assigned_contractors: [],
      });
      setIsCreateOpen(false);

      alert(t("task_created_successfully"));
    } catch (error) {
      console.error("Task creation error:", error);
      const errorMessage = error instanceof Error ? error.message : t("failed_to_create_task");
      alert(errorMessage);
      setErrorMessage(errorMessage);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleVerifyOtp(taskId: number) {
    const selectedLabourId = selectedLabourForOtp[taskId];
    const otpCode = otpInputValue[taskId];

    if (!selectedLabourId) {
      alert(t("select_labour"));
      return;
    }

    if (!otpCode || otpCode.length !== 6) {
      alert(t("enter_otp"));
      return;
    }

    try {
      const response = await fetch("/api/kanban", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: taskId,
          verify_otp: {
            labour_id: selectedLabourId,
            otp_code: otpCode,
          },
        }),
      });

      if (!response.ok) {
        let errorMessage = "OTP verification failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("OTP verification successful:", result);

      // Clear the inputs
      setSelectedLabourForOtp(prev => ({ ...prev, [taskId]: null }));
      setOtpInputValue(prev => ({ ...prev, [taskId]: "" }));

      await fetchTasks();
      alert(t("otp_verified_successfully"));
    } catch (error) {
      console.error("OTP verification error:", error);
      const errorMessage = error instanceof Error ? error.message : t("invalid_otp");
      alert(errorMessage);
    }
  }

  const handleOtpInputChange = (taskId: number, value: string) => {
    // Only allow numeric input and limit to 6 digits
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setOtpInputValue(prev => ({ ...prev, [taskId]: numericValue }));
  };

  const handleLabourSelection = (taskId: number, labourId: string) => {
    setSelectedLabourForOtp(prev => ({ ...prev, [taskId]: parseInt(labourId) }));
  };

  const toggleLabourAssignment = (labourId: number) => {
    setNewTask(prev => ({
      ...prev,
      assigned_labours: prev.assigned_labours.includes(labourId)
        ? prev.assigned_labours.filter(id => id !== labourId)
        : [...prev.assigned_labours, labourId],
    }));
  };

  const toggleContractorAssignment = (contractorId: number) => {
    setNewTask(prev => ({
      ...prev,
      assigned_contractors: prev.assigned_contractors.includes(contractorId)
        ? prev.assigned_contractors.filter(id => id !== contractorId)
        : [...prev.assigned_contractors, contractorId],
    }));
  };

  async function handleDeleteTask(id: number) {
    if (!confirm(t("are_you_sure_delete_task"))) return;

    setActionLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/kanban?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Delete failed");
      await fetchTasks();
      alert(t("task_deleted"));
    } catch (error) {
      console.error(error);
      alert(t("failed_to_delete_task"));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDrop(targetColumn: string) {
    if (!drag.taskId || drag.sourceColumn === targetColumn) {
      setDrag({ taskId: null, sourceColumn: null });
      return;
    }

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((task) =>
        task.id.toString() === drag.taskId
          ? { ...task, state: targetColumn as Task["state"] }
          : task
      )
    );

    try {
      const response = await fetch("/api/kanban", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: parseInt(drag.taskId),
          state: targetColumn,
        }),
      });

      if (!response.ok) throw new Error("Update failed");
    } catch (error) {
      console.error(error);
      alert(t("failed_to_move_task"));
      await fetchTasks();
    }

    setDrag({ taskId: null, sourceColumn: null });
  }

  const handleDragStart = (
    e: React.DragEvent,
    taskId: number,
    column: string
  ) => {
    setDrag({ taskId: taskId.toString(), sourceColumn: column });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnd = () => {
    setDrag({ taskId: null, sourceColumn: null });
  };

  const getTasksForColumn = (columnId: string) =>
    tasks
      .filter((task) => task.state === columnId)
      .sort((a, b) => a.priority - b.priority);

  const getPriorityColor = (priority: number) => {
    if (priority <= 2) return "bg-red-50 text-red-700 border-red-200";
    if (priority <= 3) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-green-50 text-green-700 border-green-200";
  };

  const getPriorityLabel = (priority: number) => {
    if (priority === 1) return t("critical");
    if (priority === 2) return t("high");
    if (priority === 3) return t("medium");
    if (priority === 4) return t("low");
    return t("minimal");
  };

  if (loading) {
    return (
      <Card className="glass p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="card-premium animate-slide-up">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-700">
              {t("task_management")}
            </h2>
          </div>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="btn-premium"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("new_task")}
          </Button>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 shadow-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((column) => {
            const columnTasks = getTasksForColumn(column.id);
            return (
              <div
                key={column.id}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(column.id)}
                className="bg-muted/50 backdrop-blur-sm rounded-2xl p-4 min-h-[500px] border border-white/10 shadow-inner flex flex-col gap-4"
              >
                <div className="flex items-center justify-between px-2">
                  <h3 className="font-bold text-foreground/80 text-sm uppercase tracking-wider">
                    {column.title}
                  </h3>
                  <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs font-medium text-foreground/60 shadow-sm">
                    {columnTasks.length}
                  </span>
                </div>

                <div className="flex-1 space-y-3">
                  {columnTasks.map((task) => {
                    const unverifiedOtps = task.otp_requests?.filter(otp => !otp.is_verified) || [];
                    const hasUnverifiedOtps = unverifiedOtps.length > 0;
                    const isHazardous = task.task_type === "hazardous";
                    const isAuthorized = task.otp_authorized === true;

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) =>
                          handleDragStart(e, task.id, column.id)
                        }
                        onDragEnd={handleDragEnd}
                        className={cn(
                          "p-4 rounded-xl cursor-move transition-all duration-300 bg-white border border-border/50 hover:shadow-lg hover:border-primary/20 relative group overflow-hidden",
                          drag.taskId === task.id.toString()
                            ? "opacity-50 scale-95 ring-2 ring-primary ring-offset-2"
                            : "animate-scale-in"
                        )}
                      >
                        {/* Gradient overlap for drag visual */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent pointer-events-none" />

                        {/* Task Type and Authorization Badges */}
                        <div className="absolute top-3 right-3 flex gap-1 z-10">
                          {isHazardous && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm">
                              <AlertTriangle className="w-3 h-3" />
                              {t("hazardous").toUpperCase()}
                            </div>
                          )}
                          {isAuthorized && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm">
                              <Shield className="w-3 h-3" />
                              AUTH
                            </div>
                          )}
                        </div>

                        <div className="flex gap-3 items-start relative z-10">
                          <Grip className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-1 cursor-grab active:cursor-grabbing" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground text-sm leading-snug pr-16 mb-2">
                              {task.description}
                            </p>

                            {/* Assigned Workers */}
                            {task.task_assignments && task.task_assignments.length > 0 && (
                              <div className="mb-3">
                                <div className="flex flex-wrap gap-1.5">
                                  {task.task_assignments.map((assignment) => (
                                    <span
                                      key={assignment.id}
                                      className={cn(
                                        "px-2 py-0.5 rounded text-[10px] font-medium border shadow-sm",
                                        assignment.assignee_type === 'labour'
                                          ? "bg-blue-50 text-blue-700 border-blue-100"
                                          : "bg-purple-50 text-purple-700 border-purple-100"
                                      )}
                                    >
                                      {assignment.assignee_type === 'labour'
                                        ? assignment.labours?.name || 'Unknown Labour'
                                        : assignment.contractors?.name || 'Unknown Contractor'}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* OTP Verification Section */}
                            {hasUnverifiedOtps && (
                              <div className="mt-2 p-2.5 bg-yellow-50/80 backdrop-blur-sm border border-yellow-200 rounded-lg animate-pulse-glow">
                                <div className="text-xs font-bold text-yellow-800 mb-2 flex items-center gap-1">
                                  <Shield className="w-3 h-3" />
                                  {t("otp_verification_required")}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Select
                                    value={selectedLabourForOtp[task.id]?.toString() || ""}
                                    onValueChange={(value) => handleLabourSelection(task.id, value)}
                                  >
                                    <SelectTrigger className="h-8 text-xs flex-1 bg-white border-yellow-300 focus:ring-yellow-400">
                                      <SelectValue placeholder={t("select_labour")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {unverifiedOtps.map((otpRequest) => (
                                        <SelectItem
                                          key={otpRequest.labour_id}
                                          value={otpRequest.labour_id.toString()}
                                        >
                                          {otpRequest.labours?.email || 'Unknown'}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    type="text"
                                    placeholder={t("enter_otp")}
                                    value={otpInputValue[task.id] || ""}
                                    onChange={(e) => handleOtpInputChange(task.id, e.target.value)}
                                    className="h-8 text-xs w-20 bg-white border-yellow-300 focus-visible:ring-yellow-400 text-center tracking-widest"
                                    maxLength={6}
                                  />
                                  <Button
                                    size="sm"
                                    className="h-8 w-8 px-0 bg-yellow-600 hover:bg-yellow-700 text-white"
                                    onClick={() => handleVerifyOtp(task.id)}
                                    disabled={!selectedLabourForOtp[task.id] || !otpInputValue[task.id] || otpInputValue[task.id].length !== 6}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
                              <span
                                className={cn(
                                  "inline-block text-[10px] font-bold px-2 py-0.5 rounded border shadow-sm",
                                  getPriorityColor(task.priority)
                                )}
                              >
                                {getPriorityLabel(task.priority)}
                              </span>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"
                                onClick={() => handleDeleteTask(task.id)}
                                disabled={actionLoading}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {columnTasks.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 border-2 border-dashed border-border/50 rounded-xl p-8">
                      <p className="text-sm font-medium">No tasks</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Task Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/80 backdrop-blur-2xl border border-white/40 shadow-2xl p-0 gap-0">
          <DialogHeader className="px-6 py-6 border-b border-black/5 bg-white/40">
            <DialogTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-600">
              {t("create_task")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 px-6 py-6">
            <div>
              <Label htmlFor="description" className="text-foreground/80 font-semibold">{t("task_description")} *</Label>
              <Input
                id="description"
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
                placeholder={t("task_description")}
                className="mt-2 h-14 text-lg bg-white border-border/60 hover:border-primary/40 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 transition-all rounded-xl shadow-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label htmlFor="task_type" className="text-foreground/80 font-semibold">{t("task_type")}</Label>
                <Select
                  value={newTask.task_type}
                  onValueChange={(value) =>
                    setNewTask({ ...newTask, task_type: value as "normal" | "hazardous", require_otp: value === "normal" ? false : newTask.require_otp })
                  }
                >
                  <SelectTrigger className="mt-1.5 h-10 bg-white border-input/50 focus:ring-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">{t("normal")}</SelectItem>
                    <SelectItem value="hazardous">{t("hazardous")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority" className="text-foreground/80 font-semibold">{t("priority")}</Label>
                <Select
                  value={newTask.priority.toString()}
                  onValueChange={(value) =>
                    setNewTask({ ...newTask, priority: parseInt(value) })
                  }
                >
                  <SelectTrigger className="mt-1.5 h-10 bg-white border-input/50 focus:ring-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{t("critical")}</SelectItem>
                    <SelectItem value="2">{t("high")}</SelectItem>
                    <SelectItem value="3">{t("medium")}</SelectItem>
                    <SelectItem value="4">{t("low")}</SelectItem>
                    <SelectItem value="5">{t("minimal")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(newTask.task_type as string) === "hazardous" && (
              <div className="flex items-start space-x-4 p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm animate-scale-in">
                <div className="p-2 bg-red-100 rounded-full shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-red-900 mb-1">Hazardous Task Safety Protocol</h4>
                  <p className="text-xs text-red-700 mb-2">Requires explicit OTP verification from assigned workers before starting.</p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="require_otp"
                      checked={newTask.require_otp}
                      onChange={(e) =>
                        setNewTask({ ...newTask, require_otp: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-red-300 text-red-600 focus:ring-red-500 cursor-pointer"
                    />
                    <Label htmlFor="require_otp" className="text-sm font-medium text-red-800 cursor-pointer select-none">
                      {t("require_otp")}
                    </Label>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-foreground/80 font-semibold flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-700 p-1 rounded-md"><Clock className="w-3.5 h-3.5" /></span>
                  {t("assign_labours")}
                </Label>
                <div className="h-48 overflow-y-auto border border-border/40 rounded-xl p-3 space-y-2 bg-white/40 shadow-inner">
                  {labours.map((labour) => (
                    <div
                      key={labour.id}
                      onClick={() => toggleLabourAssignment(labour.id)}
                      className={cn(
                        "flex items-center space-x-3 p-2.5 rounded-lg border transition-all cursor-pointer group",
                        newTask.assigned_labours.includes(labour.id)
                          ? "bg-blue-50/80 border-blue-200 shadow-sm"
                          : "bg-white/60 border-transparent hover:bg-white hover:shadow-sm"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                        newTask.assigned_labours.includes(labour.id) ? "bg-blue-600 border-blue-600" : "border-gray-400 group-hover:border-blue-400"
                      )}>
                        {newTask.assigned_labours.includes(labour.id) && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground/90">{labour.name}</p>
                        <p className="text-[10px] text-muted-foreground">{labour.email}</p>
                      </div>
                    </div>
                  ))}
                  {labours.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-60">
                      <p className="text-sm">{t("no_labours_available")}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-foreground/80 font-semibold flex items-center gap-2">
                  <span className="bg-purple-100 text-purple-700 p-1 rounded-md"><Grip className="w-3.5 h-3.5" /></span>
                  {t("assign_contractors")}
                </Label>
                <div className="h-48 overflow-y-auto border border-border/40 rounded-xl p-3 space-y-2 bg-white/40 shadow-inner">
                  {contractors.map((contractor) => (
                    <div
                      key={contractor.id}
                      onClick={() => toggleContractorAssignment(contractor.id)}
                      className={cn(
                        "flex items-center space-x-3 p-2.5 rounded-lg border transition-all cursor-pointer group",
                        newTask.assigned_contractors.includes(contractor.id)
                          ? "bg-purple-50/80 border-purple-200 shadow-sm"
                          : "bg-white/60 border-transparent hover:bg-white hover:shadow-sm"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                        newTask.assigned_contractors.includes(contractor.id) ? "bg-purple-600 border-purple-600" : "border-gray-400 group-hover:border-purple-400"
                      )}>
                        {newTask.assigned_contractors.includes(contractor.id) && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground/90">{contractor.name}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <span className="text-amber-500">★</span> {contractor.current_rating?.toFixed(1) || 'N/A'} Rating
                        </p>
                      </div>
                    </div>
                  ))}
                  {contractors.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-60">
                      <p className="text-sm">{t("no_contractors_available")}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="flex-1 h-11 border-input/50 bg-white/50 hover:bg-white/80"
                disabled={actionLoading}
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={handleCreateTask}
                className="flex-1 h-11 btn-premium"
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {actionLoading ? t("creating") : t("create_task")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}