import { useEffect, useCallback } from 'react';
import { ActivityCache } from './activityCache.js';

export const useStorageSync = (storageKeys, onDataChange) => {
  const refreshFromStorage = useCallback(() => {
    ActivityCache.invalidate();
    if (onDataChange) onDataChange();
  }, [onDataChange]);

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (storageKeys.includes(event.key)) {
        refreshFromStorage();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [storageKeys, refreshFromStorage]);

  return refreshFromStorage;
};
