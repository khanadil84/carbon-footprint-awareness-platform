# ADR-003: ES6 Classes for Error Hierarchy

## Status
Accepted

## Context
Initial error types (`ValidationError`, `StorageError`) were implemented as arrow function factories:
```js
export const ValidationError = (message) => new AppError(message, 'VALIDATION_ERROR');
```
This caused `TypeError: ValidationError is not a constructor` in Node ESM when used with `throw new ValidationError(msg)` — the standard pattern expected by callers and try/catch handlers.

## Decision
Use ES6 `class extends` for the full error hierarchy:

```js
export class AppError extends Error { ... }
export class ValidationError extends AppError { ... }
export class StorageError extends AppError { ... }
export class ConsistencyError extends AppError { ... }
export class NotFoundError extends AppError { ... }
```

## Consequences
- `throw new ValidationError(msg)` works correctly in all module systems
- `instanceof` checks work correctly (`error instanceof ValidationError`)
- Stack traces include the correct constructor name
- Consistent with Node.js built-in error classes
