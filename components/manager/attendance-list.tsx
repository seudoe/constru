"use client";

import { useState, useMemo, useEffect } from "react";
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

export function AttendanceList() {
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

  return (
    <Card className="p-6 transition-all duration-500 hover:shadow-xl animate-slide-in-up">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">
          Daily Attendance Management
        </h2>
        <Users className="w-4 h-4 text-muted-foreground" />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading attendance data...</span>
        </div>
      )}

      {!loading && (
        <>
          {/* Date Navigation */}
          <div className="mb-6 pb-6 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-3">
              Select Date
            </p>
            <div className="flex items-center justify-between bg-secondary/30 rounded-lg p-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('prev')}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-8 text-sm font-medium text-center border-none bg-transparent"
                />
                {selectedDate === today && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                    Today
                  </span>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('next')}
                className="h-8 w-8 p-0"
                disabled={selectedDate >= today}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Summary Statistics */}
          {totalRecords > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-6 p-4 bg-secondary/20 rounded-lg border border-border/50">
              <div className="text-center">
                <p className="text-xs text-muted-foreground font-medium">Total Workers</p>
                <p className="text-lg font-semibold text-foreground">
                  {totalRecords}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground font-medium">Present</p>
                <p className="text-lg font-semibold text-emerald-600">
                  {presentCount}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground font-medium">Absent</p>
                <p className="text-lg font-semibold text-red-600">{absentCount}</p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="space-y-3 mb-6 pb-6 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase">
              Filter Workers
            </p>
            <div className="space-y-2">
              <Input
                placeholder="Search worker name..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="h-8 text-sm"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Attendance Records */}
          {filteredRecords.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors border border-border/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate text-sm">
                      {record.name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {record.email}
                    </p>
                    {record.hasRequest && (
                      <p className="text-xs text-blue-600 mt-1">
                        Request Status: {record.request?.status}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full font-semibold text-xs whitespace-nowrap ${
                        record.status === "present"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {record.status === "present" ? "Present" : "Absent"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="w-10 h-10 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">
                No workers found for selected date and filters
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Selected Date: {selectedDate}
              </p>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
