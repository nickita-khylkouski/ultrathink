import { TextareaHTMLAttributes, forwardRef, useId } from 'react';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, helperText, className = '', id: providedId, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = providedId || generatedId;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-primary mb-1">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`w-full px-3 py-2 bg-panel text-primary border border-primary rounded focus:outline-none focus:ring-2 focus:ring-secondary transition-all ${
            error ? 'border-danger focus:ring-danger' : ''
          } ${className}`}
          {...props}
        />
        {helperText && !error && (
          <p id={helperId} className="mt-1 text-xs text-gray-500">{helperText}</p>
        )}
        {error && (
          <p id={errorId} className="mt-1 text-xs text-danger" role="alert">{error}</p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
