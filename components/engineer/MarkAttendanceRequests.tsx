'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

export default function MarkAttendanceRequests() {
  const [requests, setRequests] = useState<AttendanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch attendance requests from API only when component mounts
  useEffect(() => {
    let mounted = true;
    
    async function fetchRequests() {
      if (!mounted) return;
      
      try {
        console.log('Fetching attendance requests...');
        const response = await fetch('/api/attendance?type=requests');
        console.log('Response status:', response.status);
        
        if (response.ok && mounted) {
          const data = await response.json();
          console.log('Fetched attendance requests:', data);
          setRequests(data);
        } else if (mounted) {
          const errorText = await response.text();
          console.error('Failed to fetch attendance requests:', response.status, errorText);
        }
      } catch (error) {
        if (mounted) {
          console.error('Error fetching attendance requests:', error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchRequests();
    
    return () => {
      mounted = false;
    };
  }, []);

  const refreshRequests = async () => {
    setLoading(true);
    try {
      console.log('Refreshing attendance requests...');
      const response = await fetch('/api/attendance?type=requests');
      console.log('Refresh response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Refreshed attendance requests:', data);
        setRequests(data);
      } else {
        const errorText = await response.text();
        console.error('Failed to refresh attendance requests:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error refreshing attendance requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string, workerId: string, isWithinZone: boolean) => {
    if (!isWithinZone) {
      alert('Cannot approve attendance - worker is not within the designated zone.');
      return;
    }

    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'approve_request',
          requestId,
          workerId,
          isWithinZone
        }),
      });

      if (response.ok) {
        setRequests(prev => 
          prev.map(req => 
            req.id === requestId 
              ? { ...req, status: 'approved' as const }
              : req
          )
        );
        alert('Attendance approved successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to approve attendance: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error approving attendance:', error);
      alert('Failed to approve attendance. Please try again.');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reject_request',
          requestId
        }),
      });

      if (response.ok) {
        setRequests(prev => 
          prev.map(req => 
            req.id === requestId 
              ? { ...req, status: 'rejected' as const }
              : req
          )
        );
        alert('Attendance request rejected.');
      } else {
        const errorData = await response.json();
        alert(`Failed to reject attendance: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error rejecting attendance:', error);
      alert('Failed to reject attendance. Please try again.');
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(`2024-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingRequests = requests.filter(req => req.status === 'pending');

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Attendance Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">Loading attendance requests...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Attendance Requests</span>
          <div className="flex items-center gap-2">
            <Button
              onClick={refreshRequests}
              disabled={loading}
              size="sm"
              variant="outline"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
            <span className="text-sm font-normal bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {pendingRequests.length} pending
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
          <strong>Debug Info:</strong> Total requests: {requests.length}, Pending: {pendingRequests.length}
          {requests.length > 0 && (
            <div className="mt-1">
              Latest request: {JSON.stringify(requests[0], null, 2)}
            </div>
          )}
        </div>
        
        {pendingRequests.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No pending attendance requests</p>
            {requests.length > 0 && (
              <p className="text-xs text-gray-400 mt-2">
                ({requests.length} total requests found, but none are pending)
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className={`flex items-center justify-between p-4 border rounded-lg ${
                  request.is_within_zone 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h4 className="font-medium text-gray-900">{request.worker_name}</h4>
                      <p className="text-sm text-gray-600">{request.worker_email}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      <p>Time: {formatTime(request.request_time)}</p>
                      <p className={`font-medium ${
                        request.is_within_zone ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {request.is_within_zone ? '✓ Within Zone' : '✗ Outside Zone'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleApproveRequest(request.id, request.worker_id, request.is_within_zone)}
                    disabled={!request.is_within_zone}
                    size="sm"
                    className={`${
                      request.is_within_zone 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleRejectRequest(request.id)}
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}