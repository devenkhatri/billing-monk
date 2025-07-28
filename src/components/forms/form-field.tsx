import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface FormFieldProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

const FormField = ({ 
  label, 
  error, 
  helperText, 
  required, 
  children, 
  className 
}: FormFieldProps) => {
  return (
    <div className={clsx('space-y-1', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export { FormField };