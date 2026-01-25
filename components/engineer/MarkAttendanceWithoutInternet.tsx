'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Worker {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  is_present: boolean;
}

export default function MarkAttendanceWithoutInternet() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch workers from user_roles table only when component mounts
  useEffect(() => {
    let mounted = true;
    
    async function fetchWorkers() {
      if (!mounted) return;
      
      try {
        // Fetch all users with worker role
        const response = await fetch('/api/admin/create-worker');
        if (response.ok && mounted) {
          const data = await response.json();
          // Filter only workers and format for our component
          const workerUsers = data.filter((user: any) => 
            user.role === 'worker' || user.role === 'construction_worker'
          ).map((user: any) => ({
            id: user.id,
            name: user.full_name || user.email.split('@')[0],
            email: user.email,
            phone_number: user.phone || 'N/A',
            is_present: false
          }));
          setWorkers(workerUsers);
        } else if (mounted) {
          console.error('Failed to fetch workers');
          // Fallback to mock data if API fails
          setWorkers([
            {
              id: 'w1',
              name: 'John Doe',
              email: 'john@example.com',
              phone_number: '+1234567890',
              is_present: false
            },
            {
              id: 'w2',
              name: 'Jane Smith',
              email: 'jane@example.com',
              phone_number: '+1234567891',
              is_present: false
            }
          ]);
        }
      } catch (error) {
        if (mounted) {
          console.error('Error fetching workers:', error);
          // Fallback to mock data
          setWorkers([
            {
              id: 'w1',
              name: 'John Doe',
              email: 'john@example.com',
              phone_number: '+1234567890',
              is_present: false
            },
            {
              id: 'w2',
              name: 'Jane Smith',
              email: 'jane@example.com',
              phone_number: '+1234567891',
              is_present: false
            }
          ]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchWorkers();
    
    return () => {
      mounted = false;
    };
  }, []);

  const toggleWorkerAttendance = (workerId: string) => {
    setWorkers(prev =>
      prev.map(worker =>
        worker.id === workerId
          ? { ...worker, is_present: !worker.is_present }
          : worker
      )
    );
  };

  const selectAllWorkers = () => {
    setWorkers(prev =>
      prev.map(worker => ({ ...worker, is_present: true }))
    );
  };

  const clearAllWorkers = () => {
    setWorkers(prev =>
      prev.map(worker => ({ ...worker, is_present: false }))
    );
  };

  const saveAttendance = async () => {
    setSaving(true);
    
    try {
      const presentWorkerIds = workers
        .filter(worker => worker.is_present)
        .map(worker => worker.id);

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'save_manual_attendance',
          presentWorkerIds,
          date: new Date().toISOString().split('T')[0]
        }),
      });

      if (response.ok) {
        alert(`Attendance saved successfully! ${presentWorkerIds.length} workers marked present.`);
      } else {
        const errorData = await response.json();
        alert(`Failed to save attendance: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Failed to save attendance. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = workers.filter(worker => worker.is_present).length;
  const totalCount = workers.length;

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Manual Attendance (Offline Mode)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">Loading workers list...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Manual Attendance (Offline Mode)</span>
          <span className="text-sm font-normal bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
            {presentCount}/{totalCount} present
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Control Buttons */}
        <div className="flex space-x-2 mb-4">
          <Button
            onClick={selectAllWorkers}
            variant="outline"
            size="sm"
            className="text-green-600 border-green-300 hover:bg-green-50"
          >
            Select All
          </Button>
          <Button
            onClick={clearAllWorkers}
            variant="outline"
            size="sm"
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            Clear All
          </Button>
        </div>

        {/* Workers List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {workers.map((worker) => (
            <div
              key={worker.id}
              className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                worker.is_present
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
              onClick={() => toggleWorkerAttendance(worker.id)}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  worker.is_present
                    ? 'bg-green-500 border-green-500'
                    : 'border-gray-300'
                }`}>
                  {worker.is_present && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{worker.name}</h4>
                  <p className="text-sm text-gray-600">{worker.email}</p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {worker.phone_number}
              </div>
            </div>
          ))}
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t">
          <Button
            onClick={saveAttendance}
            disabled={saving || presentCount === 0}
            className="w-full"
          >
            {saving ? 'Saving Attendance...' : `Save Attendance (${presentCount} workers)`}
          </Button>
          
          {presentCount === 0 && (
            <p className="text-sm text-gray-500 text-center mt-2">
              Select at least one worker to save attendance
            </p>
          )}
        </div>

        {/* Info */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Offline Mode:</strong> Use this when workers don't have internet access. 
            You can manually mark attendance for workers who are physically present at the site.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}