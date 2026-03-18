'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; 
const WARNING_TIME = 25 * 60 * 1000; 

export function useInactivityTimeout(onWarning?: () => void, excludedPaths: string[] = []) {
  const router = useRouter();
  const pathname = usePathname();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(0);

  const isPathExcluded = excludedPaths.some((path) => pathname.startsWith(path));

  const handleLogout = () => {
   
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminDetail');

 
    router.push('/auth/login');
  };

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token || isPathExcluded) {
      return;
    }


    lastActivityRef.current = Date.now();

    const resetInactivityTimer = () => {
      lastActivityRef.current = Date.now();

      
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      warningTimeoutRef.current = setTimeout(() => {
        if (onWarning) {
          onWarning();
        }
      }, WARNING_TIME);

      
      timeoutRef.current = setTimeout(() => {
        handleLogout();
      }, INACTIVITY_TIMEOUT);
    };

    resetInactivityTimer();

    const activityEvents = [
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    const handleActivity = () => {
      resetInactivityTimer();
    };

  
    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity);
    });

 
    return () => {
   
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });

  
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [router, isPathExcluded]);

  return {
    handleLogout,
  };
}
