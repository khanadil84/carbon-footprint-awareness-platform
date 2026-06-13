export const SECURITY_EVENTS = {
  STORAGE_READ_FAILURE: 'security:storage:read_failure',
  STORAGE_WRITE_FAILURE: 'security:storage:write_failure',
  STORAGE_CORRUPTION: 'security:storage:corruption',
  STORAGE_RECOVERY: 'security:storage:recovery',
  VALIDATION_FAILURE: 'security:validation:failure',
  SCHEMA_MISMATCH: 'security:schema:mismatch',
  AUTH_LOGIN: 'security:auth:login',
  AUTH_LOGOUT: 'security:auth:logout',
  AUTH_SESSION_EXPIRED: 'security:auth:session_expired',
  AUTH_INVALID_TOKEN: 'security:auth:invalid_token',
  INPUT_SANITIZED: 'security:input:sanitized',
  CSV_INJECTION_BLOCKED: 'security:export:csv_injection_blocked',
  CROSS_TAB_SYNC: 'security:storage:cross_tab_sync'
};

export const STORAGE_INTEGRITY = {
  MAX_CORRUPTION_RETRIES: 3,
  RECOVERY_ATTEMPT: 'recovery_attempt',
  RECOVERY_SUCCESS: 'recovery_success',
  RECOVERY_FAILURE: 'recovery_failure'
};

export const SCHEMA_VERSIONS = {
  ACTIVITIES: 1,
  SETTINGS: 1,
  GOAL: 1,
  ACHIEVEMENTS: 1,
  USER: 1
};

export const TRUST_BOUNDARIES = {
  CLIENT_STORAGE: 'client:localStorage',
  CLIENT_RENDER: 'client:DOM',
  CLIENT_NETWORK: 'client:network',
  AUTH_PROVIDER: 'auth:provider',
  THIRD_PARTY_CDN: 'third_party:cdn'
};

export const DATA_CLASSIFICATION = {
  PUBLIC: 'public',
  INTERNAL: 'internal',
  SENSITIVE: 'sensitive',
  CRITICAL: 'critical'
};
