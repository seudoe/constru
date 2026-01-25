'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase-browser';

interface AttendanceMarkerProps {
  isOnline: boolean;
}

export default function AttendanceMarker({ isOnline }: AttendanceMarkerProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isNearSite, setIsNearSite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const { t } = useTranslation();

  // Demo construction site location (you can change this later)
  const SITE_LOCATION = { lat: 19.213585, lng: 72.865429 }; // Mumbai coordinates
  const ALLOWED_RADIUS = 100; // meters (increased for demo purposes)

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const getCurrentLocation = () => {
    setIsLoading(true);

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setLocation(userLocation);

        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          SITE_LOCATION.lat,
          SITE_LOCATION.lng
        );

        setIsNearSite(distance <= ALLOWED_RADIUS);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setIsLoading(false);
      }
    );
  };

  const markAttendance = async () => {
    if (!isOnline) {
      alert(t('must_be_online'));
      return;
    }

    if (!location) {
      alert('Unable to get your location. Please enable location services.');
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert('Please log in to request attendance.');
        return;
      }

      // Create attendance request
      const requestData = {
        worker_id: user.id,
        worker_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Worker',
        worker_email: user.email || 'worker@example.com',
        location_lat: location.lat,
        location_lng: location.lng,
        is_within_zone: isNearSite
      };

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_request',
          ...requestData
        }),
      });

      if (response.ok) {
        setAttendanceMarked(true);
        alert(t('attendance_submitted'));
      } else {
        const errorData = await response.json();
        alert(`Failed to submit attendance request: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error creating attendance request:', error);
      alert('Failed to submit attendance request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{t('request_attendance')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{t('location_status')}:</span>
            <span className={`text-sm font-medium ${isNearSite ? 'text-green-600' : 'text-red-600'
              }`}>
              {isLoading ? t('checking') : isNearSite ? t('near_site') : t('away_from_site')}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{t('online_status')}:</span>
            <span className={`text-sm font-medium ${isOnline ? 'text-green-600' : 'text-red-600'
              }`}>
              {isOnline ? t('online') : t('offline')}
            </span>
          </div>
        </div>

        {attendanceMarked ? (
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-green-700 font-medium">✓ {t('attendance_submitted')}</p>
            <p className="text-green-600 text-sm mt-1">{t('go_to_approve')}</p>
          </div>
        ) : (
          <Button
            onClick={markAttendance}
            disabled={!isOnline || !location || isLoading}
            className="w-full"
          >
            {isLoading
              ? t('submitting')
              : t('request_attendance')
            }
          </Button>
        )}

        {(!isOnline || !location) && !attendanceMarked && (
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <p className="text-yellow-700 text-sm">
              {!isOnline && (t('must_be_online') + ' ')}
              {!location && t('getting_location')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}