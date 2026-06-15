const ERROR_CATEGORIES = {
  STORAGE: 'STORAGE',
  VALIDATION: 'VALIDATION',
  CONSISTENCY: 'CONSISTENCY',
  NOT_FOUND: 'NOT_FOUND',
  UNKNOWN: 'UNKNOWN'
};

const isRetryableCategory = (category) =>
  category === ERROR_CATEGORIES.STORAGE || category === ERROR_CATEGORIES.CONSISTENCY;

export class AppError extends Error {
  constructor(message, { code = 'UNKNOWN', category = ERROR_CATEGORIES.UNKNOWN, retryable = false, cause = null } = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.category = category;
    this.retryable = retryable;
    this.cause = cause;
    this.timestamp = Date.now();
  }
}

class StorageError extends AppError {
  constructor(message, opts = {}) {
    super(message, { code: 'STORAGE_FAILURE', category: ERROR_CATEGORIES.STORAGE, retryable: true, ...opts });
    this.name = 'StorageError';
  }
}

class ValidationError extends AppError {
  constructor(message, opts = {}) {
    super(message, { code: 'VALIDATION_FAILURE', category: ERROR_CATEGORIES.VALIDATION, retryable: false, ...opts });
    this.name = 'ValidationError';
  }
}

class ConsistencyError extends AppError {
  constructor(message, opts = {}) {
    super(message, { code: 'CONSISTENCY_FAILURE', category: ERROR_CATEGORIES.CONSISTENCY, retryable: true, ...opts });
    this.name = 'ConsistencyError';
  }
}

class NotFoundError extends AppError {
  constructor(message, opts = {}) {
    super(message, { code: 'NOT_FOUND', category: ERROR_CATEGORIES.NOT_FOUND, retryable: false, ...opts });
    this.name = 'NotFoundError';
  }
}

export { StorageError, ValidationError, ConsistencyError, NotFoundError };

export const isAppError = (error) => error instanceof AppError;

export const retry = async (operation, { maxAttempts = 3, baseDelay = 100, maxDelay = 3000, onRetry = null } = {}) => {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      if (!isRetryableCategory(error.category) && !error.retryable) throw error;
      if (attempt === maxAttempts) break;
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      if (onRetry) onRetry(error, attempt, delay);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
};

export const withFallback = (operation, fallback) => {
  try {
    const result = operation();
    return result !== undefined ? result : (typeof fallback === 'function' ? fallback() : fallback);
  } catch {
    return typeof fallback === 'function' ? fallback() : fallback;
  }
};

export const withRecovery = (operation, recovery) => {
  try {
    return operation();
  } catch (error) {
    return recovery(error);
  }
};
