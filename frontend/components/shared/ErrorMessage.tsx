import { AlertCircle, X } from 'lucide-react';
import { ApiError } from '@/types/api';

interface ErrorMessageProps {
  error: ApiError | Error | string;
  onDismiss?: () => void;
}

export function ErrorMessage({ error, onDismiss }: ErrorMessageProps) {
  const message = typeof error === 'string'
    ? error
    : 'message' in error
      ? error.message
      : 'An unknown error occurred';

  const details = typeof error === 'object' && 'details' in error
    ? error.details
    : undefined;

  return (
    <div className="bg-red-900/20 border-l-4 border-danger p-4 rounded">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-danger mt-0.5" />
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-danger">
            {message}
          </p>
          {details && (
            <p className="mt-1 text-xs text-red-400">
              {details}
            </p>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-auto text-danger hover:text-red-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
