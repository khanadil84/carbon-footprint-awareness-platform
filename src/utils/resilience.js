const ERROR_CATEGORIES = {
  STORAGE: 'STORAGE',
  VALIDATION: 'VALIDATION',
  CONSISTENCY: 'CONSISTENCY',
  NOT_FOUND: 'NOT_FOUND',
  UNKNOWN: 'UNKNOWN'
};

const isRetryableCategory = (cat) => cat === ERROR_CATEGORIES.STORAGE || cat === ERROR_CATEGORIES.CONSISTENCY;

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
  constructor(message, opts = {}) { super(message, { code: 'STORAGE_FAILURE', category: ERROR_CATEGORIES.STORAGE, retryable: true, ...opts }); this.name = 'StorageError'; }
}
class ValidationError extends AppError {
  constructor(message, opts = {}) { super(message, { code: 'VALIDATION_FAILURE', category: ERROR_CATEGORIES.VALIDATION, retryable: false, ...opts }); this.name = 'ValidationError'; }
}
class ConsistencyError extends AppError {
  constructor(message, opts = {}) { super(message, { code: 'CONSISTENCY_FAILURE', category: ERROR_CATEGORIES.CONSISTENCY, retryable: true, ...opts }); this.name = 'ConsistencyError'; }
}
class NotFoundError extends AppError {
  constructor(message, opts = {}) { super(message, { code: 'NOT_FOUND', category: ERROR_CATEGORIES.NOT_FOUND, retryable: false, ...opts }); this.name = 'NotFoundError'; }
}

export { StorageError, ValidationError, ConsistencyError, NotFoundError };

export const isAppError = (e) => e instanceof AppError;

export const invariant = (condition, message, ErrorClass = AppError) => {
  if (!condition) throw new ErrorClass(message);
};

export const retry = async (fn, { maxAttempts = 3, baseDelay = 100, maxDelay = 3000, onRetry = null } = {}) => {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (e) {
      lastError = e;
      if (!isRetryableCategory(e.category) && !e.retryable) throw e;
      if (attempt === maxAttempts) break;
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      if (onRetry) onRetry(e, attempt, delay);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastError;
};

export const withFallback = (fn, fallback) => {
  try {
    const result = fn();
    return result !== undefined ? result : (typeof fallback === 'function' ? fallback() : fallback);
  } catch {
    return typeof fallback === 'function' ? fallback() : fallback;
  }
};

export const withRecovery = (fn, recoveryFn) => {
  try {
    return fn();
  } catch (e) {
    return recoveryFn(e);
  }
};
