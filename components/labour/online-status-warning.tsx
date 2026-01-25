'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface OnlineStatusWarningProps {
  onStatusChange: (isOnline: boolean) => void;
}

export default function OnlineStatusWarning({ onStatusChange }: OnlineStatusWarningProps) {
  const [isOnline, setIsOnline] = useState(true); // Default to true for demo
  const { t } = useTranslation();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      onStatusChange(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      onStatusChange(false);
    };

    // Check if we're in browser environment
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      onStatusChange(navigator.onLine);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    } else {
      // Server-side default
      onStatusChange(true);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, [onStatusChange]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{t('online_status')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'
            }`} />
          <div>
            <p className={`font-medium ${isOnline ? 'text-green-700' : 'text-red-700'
              }`}>
              {isOnline ? t('online') : t('offline')}
            </p>
            <p className="text-sm text-gray-600">
              {isOnline
                ? t('near_site')
                : t('must_be_online')
              }
            </p>
          </div>
        </div>

        {!isOnline && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm font-medium">⚠️ Warning</p>
            <p className="text-red-600 text-sm mt-1">
              You are currently offline. Please check your internet connection to mark attendance.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}