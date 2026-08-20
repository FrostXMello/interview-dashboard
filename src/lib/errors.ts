/**
 * Structured application errors for auth/data/sync paths.
 * Do not surface raw database messages to end users.
 */

export type AppErrorCode =
  | 'SUCCESS'
  | 'OFFLINE'
  | 'AUTHENTICATION_FAILURE'
  | 'AUTHORIZATION_FAILURE'
  | 'VALIDATION_FAILURE'
  | 'NETWORK_FAILURE'
  | 'DATABASE_FAILURE'
  | 'CONFLICT'
  | 'UNKNOWN';

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly cause?: unknown;
  readonly userMessage: string;

  constructor(code: AppErrorCode, message: string, options?: { cause?: unknown; userMessage?: string }) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.cause = options?.cause;
    this.userMessage = options?.userMessage ?? defaultUserMessage(code);
  }
}

function defaultUserMessage(code: AppErrorCode): string {
  switch (code) {
    case 'OFFLINE':
      return 'You are offline. Changes are saved locally in demo mode only.';
    case 'AUTHENTICATION_FAILURE':
      return 'Sign-in failed. Check your credentials and try again.';
    case 'AUTHORIZATION_FAILURE':
      return 'You do not have permission to perform this action.';
    case 'VALIDATION_FAILURE':
      return 'Some of the submitted data is invalid.';
    case 'NETWORK_FAILURE':
      return 'Network error. Please try again.';
    case 'DATABASE_FAILURE':
      return 'Could not save or load data. Please try again later.';
    case 'CONFLICT':
      return 'This record was updated elsewhere. Refresh and try again.';
    default:
      return 'Something went wrong.';
  }
}

export type OperationResult<T> =
  | { ok: true; data: T; code: 'SUCCESS' }
  | { ok: false; error: AppError; code: AppErrorCode };

export function success<T>(data: T): OperationResult<T> {
  return { ok: true, data, code: 'SUCCESS' };
}

export function failure<T = never>(error: AppError): OperationResult<T> {
  return { ok: false, error, code: error.code };
}

/** True when Auth has no current user — this is not a failed login attempt. */
export function isMissingAuthSession(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const name = 'name' in err ? String((err as { name?: unknown }).name || '') : '';
  const code = 'code' in err ? String((err as { code?: unknown }).code || '') : '';
  const message = 'message' in err ? String((err as { message?: unknown }).message || '') : '';
  return (
    name === 'AuthSessionMissingError' ||
    code === 'AuthSessionMissingError' ||
    /auth session missing/i.test(message)
  );
}

export function toAppError(err: unknown, fallback: AppErrorCode = 'UNKNOWN'): AppError {
  if (err instanceof AppError) return err;

  if (err && typeof err === 'object' && 'message' in err) {
    const message = String((err as { message?: unknown }).message ?? 'Unknown error');
    const status = 'status' in err ? Number((err as { status?: unknown }).status) : undefined;
    const code = 'code' in err ? String((err as { code?: unknown }).code) : '';

    if (isMissingAuthSession(err)) {
      return new AppError('AUTHENTICATION_FAILURE', message, {
        cause: err,
        userMessage: 'Sign in to continue.'
      });
    }
    if (status === 401 || code === 'PGRST301' || /invalid (jwt|token)|jwt expired|invalid login credentials/i.test(message)) {
      return new AppError('AUTHENTICATION_FAILURE', message, { cause: err });
    }
    if (status === 403 || code === '42501' || /permission|policy|rls/i.test(message)) {
      return new AppError('AUTHORIZATION_FAILURE', message, { cause: err });
    }
    if (status === 409 || code === '23505') {
      return new AppError('CONFLICT', message, { cause: err });
    }
    if (/fetch|network|Failed to fetch/i.test(message)) {
      return new AppError('NETWORK_FAILURE', message, { cause: err });
    }
    return new AppError(fallback === 'UNKNOWN' ? 'DATABASE_FAILURE' : fallback, message, { cause: err });
  }

  return new AppError(fallback, 'Unexpected error', { cause: err });
}
