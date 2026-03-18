'use client';

import React, { useState, useCallback } from 'react';
import { useInactivityTimeout } from '@/app/hooks/useInactivityTimeout';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface InactivityProviderProps {
  children: React.ReactNode;
}

export function InactivityProvider({ children }: InactivityProviderProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(5 * 60);


  const excludedPaths = ['/pos'];

  const handleWarning = useCallback(() => {
    setShowWarning(true);
    setRemainingTime(5 * 60);
  }, []);

  const { handleLogout } = useInactivityTimeout(handleWarning, excludedPaths);

  const handleContinueSession = () => {
    setShowWarning(false);
  };

  const handleLogoutNow = () => {
    handleLogout();
    setShowWarning(false);
  };

  
  React.useEffect(() => {
    if (!showWarning) return;

    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
      
          handleLogoutNow();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showWarning]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {children}

      <AlertDialog open={showWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Session Inactivity Warning</AlertDialogTitle>
            <AlertDialogDescription>
              Due to inactivity for 25 minutes, your session will expire in{' '}
              <span className="font-semibold text-red-500">
                {formatTime(remainingTime)}
              </span>
              . Do you want to continue your session?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-4">
            <AlertDialogCancel onClick={handleContinueSession}>
              Continue Session
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleLogoutNow} className="bg-red-600 hover:bg-red-700">
              Logout Now
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
