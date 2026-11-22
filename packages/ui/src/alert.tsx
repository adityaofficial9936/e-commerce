import * as React from 'react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  onDismiss?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  className = '',
  variant = 'info',
  title,
  onDismiss,
  children,
  ...props
}) => {
  const variantStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };

  const titleStyles = {
    info: 'text-blue-900',
    success: 'text-green-900',
    warning: 'text-amber-900',
    error: 'text-red-900',
  };

  return (
    <div
      role="alert"
      className={`rounded-lg border p-4 text-sm transition-all ${variantStyles[variant]} ${className}`}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {title && <h5 className={`font-semibold mb-1 ${titleStyles[variant]}`}>{title}</h5>}
          <div>{children}</div>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="ml-3 -mr-1 -mt-1 p-1 rounded-md opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Dismiss alert"
          >
            &times;
          </button>
        )}
      </div>
    </div>
  );
};
