import { useEffect, useCallback } from 'react';
import { ActivityCache } from './activityCache.js';

/** React hook for cross-tab storage synchronization.
 *  Listens for `storage` events matching the given keys, invalidates
 *  the ActivityCache, and invokes the provided callback.
 *  @param {string[]} storageKeys - localStorage keys to watch.
 *  @param {() => void} [onDataChange] - optional callback after invalidation.
 *  @returns {() => void} - imperative refresh function. */
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
