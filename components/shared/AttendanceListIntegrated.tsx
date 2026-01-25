"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Calendar, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

interface AttendanceRequest {
  id: string;
  worker_id: string;
  worker_name: string;
  worker_email: string;
  request_date: string;
  request_time: string;
  location_lat: number;
  location_lng: number;
  is_within_zone: boolean;
  status: 'pending' | 'approved' | 'rejected';
}

interface DailyAttendance {
  id: string;
  attendance_date: string;
  present_worker_ids: string[];
  total_workers_present: number;
  marked_by: string;
  marked_at: string;
}

interface WorkerInfo {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export function AttendanceListIntegrated() {
  const [attendanceRequests, setAttendanceRequests] = useState<AttendanceRequest[]>([]);
  const [dailyAttendance, setDailyAttendance] = useState<DailyAttendance[]>([]);
  const [workers, setWorkers] = useState<WorkerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameFilter, setNameFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);

      // Fetch attendance requests
      const requestsResponse = await fetch("/api/attendance?type=requests");
      const requestsData = await requestsResponse.json();
      if (Array.isArray(requestsData)) {
        setAttendanceRequests(requestsData);
      }

      // Fetch daily attendance
      const dailyResponse = await fetch("/api/attendance?type=daily");
      const dailyData = await dailyResponse.json();
      if (Array.isArray(dailyData)) {
        setDailyAttendance(dailyData);
      }

      // Get unique workers from requests
      const uniqueWorkers = requestsData.reduce((acc: WorkerInfo[], request: AttendanceRequest) => {
        if (!acc.find(w => w.id === request.worker_id)) {
          acc.push({
            id: request.worker_id,
            name: request.worker_name,
            email: request.worker_email,
            role: 'Worker'
          });
        }
        return acc;
      }, []);
      setWorkers(uniqueWorkers);

    } catch (error) {
      console.error("Error fetching attendance data:", error);
    } finally {
      setLoading(false);
    }
  }

  // Get today's date string for filtering
  const today = new Date().toISOString().split("T")[0];

  // Navigate between dates
  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    if (direction === 'prev') {
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    setSelectedDate(currentDate.toISOString().split("T")[0]);
  };

  // Get attendance data for selected date
  const selectedDateAttendance = useMemo(() => {
    // Get daily attendance record for selected date
    const dailyRecord = dailyAttendance.find(d => d.attendance_date === selectedDate);

    // Get all workers and their status for the selected date
    const workersWithStatus = workers.map(worker => {
      const isPresent = dailyRecord?.present_worker_ids.includes(worker.id) || false;
      const request = attendanceRequests.find(r =>
        r.worker_id === worker.id &&
        r.request_date === selectedDate
      );

      return {
        id: worker.id,
        name: worker.name,
        email: worker.email,
        role: worker.role || 'Worker',
        status: isPresent ? 'present' : 'absent',
        request: request || null,
        hasRequest: !!request
      };
    });

    return workersWithStatus;
  }, [selectedDate, dailyAttendance, workers, attendanceRequests]);

  // Apply filters to records
  const filteredRecords = useMemo(() => {
    return selectedDateAttendance.filter((record) => {
      const nameMatch = record.name.toLowerCase().includes(nameFilter.toLowerCase());
      const statusMatch = statusFilter === "all" || record.status === statusFilter;
      return nameMatch && statusMatch;
    });
  }, [nameFilter, statusFilter, selectedDateAttendance]);

  // Get summary statistics
  const presentCount = filteredRecords.filter(r => r.status === "present").length;
  const absentCount = filteredRecords.filter(r => r.status === "absent").length;
  const totalRecords = filteredRecords.length;

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading attendance data...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="card-premium animate-slide-up h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-700">
          Daily Attendance
        </h2>
        <div className="p-2 bg-orange-100 rounded-lg">
          <Users className="w-5 h-5 text-orange-600" />
        </div>
      </div>

      {/* Date Navigation */}
      <div className="mb-6 pb-6 border-b border-border/20">
        <p className="text-xs font-semibold text-muted-foreground uppercase mb-3 tracking-wider">
          Select Date
        </p>
        <div className="flex items-center justify-between bg-card rounded-xl p-3 border shadow-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateDate('prev')}
            className="h-8 w-8 p-0 hover:bg-white/60"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-orange-600" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-8 text-sm font-medium text-center border-none bg-transparent focus:ring-0 w-32"
            />
            {selectedDate === today && (
              <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border border-orange-200">
                Today
              </span>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateDate('next')}
            className="h-8 w-8 p-0 hover:bg-white/60"
            disabled={selectedDate >= today}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary Statistics */}
      {totalRecords > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="text-center p-3 rounded-xl bg-orange-50/50 border border-orange-100">
            <p className="text-xs text-orange-800/70 font-semibold uppercase mb-1">Total</p>
            <p className="text-xl font-bold text-orange-900">
              {totalRecords}
            </p>
          </div>
          <div className="text-center p-3 rounded-xl bg-green-50/50 border border-green-100">
            <p className="text-xs text-green-800/70 font-semibold uppercase mb-1">Present</p>
            <p className="text-xl font-bold text-green-700">
              {presentCount}
            </p>
          </div>
          <div className="text-center p-3 rounded-xl bg-red-50/50 border border-red-100">
            <p className="text-xs text-red-800/70 font-semibold uppercase mb-1">Absent</p>
            <p className="text-xl font-bold text-red-700">{absentCount}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3 mb-6">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Filter Workers
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Search..."
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="h-9 text-sm bg-white border-input focus:bg-white transition-all pl-8"
            />
            <Users className="w-3.5 h-3.5 absolute left-2.5 top-3 text-muted-foreground" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-sm w-[110px] bg-white border-input">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Attendance Records */}
      {filteredRecords.length > 0 ? (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
          {filteredRecords.map((record) => (
            <div
              key={record.id}
              className="glass-hover flex items-center justify-between p-3 rounded-xl border border-transparent transition-all group"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate text-sm group-hover:text-orange-900 transition-colors">
                  {record.name}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-muted-foreground text-xs truncate">
                    {record.email}
                  </p>
                  {record.hasRequest && (
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">
                      {record.request?.status}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center pl-3">
                <span
                  className={`px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wide border ${record.status === "present"
                    ? "bg-green-100 text-green-700 border-green-200"
                    : "bg-red-50 text-red-600 border-red-100"
                    }`}
                >
                  {record.status === "present" ? "Present" : "Absent"}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-dashed border-border/50 bg-white/20">
          <div className="p-3 bg-white/50 rounded-full mb-3">
            <Calendar className="w-6 h-6 text-muted-foreground/60" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            No records found
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Try adjusting filters or date
          </p>
        </div>
      )}
    </div>
  );
}