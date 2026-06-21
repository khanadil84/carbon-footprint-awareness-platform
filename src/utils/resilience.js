const ERROR_CATEGORIES = {
  STORAGE: 'STORAGE',
  VALIDATION: 'VALIDATION',
  UNKNOWN: 'UNKNOWN'
};

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

export { StorageError, ValidationError };
