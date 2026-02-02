'use client';

import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  touched?: boolean;
}

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, helperText, touched, className = '', ...props }, ref) => {
    const hasError = touched && error;
    const inputId = props.id || props.name || `input-${Math.random()}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full px-4 py-3 rounded-xl bg-gray-50 border text-gray-900
              transition-all duration-200 outline-none
              ${hasError
                ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 bg-red-50'
                : 'border-gray-200 focus:bg-white focus:border-[#2FA3E3] focus:ring-4 focus:ring-[#2FA3E3]/10'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
              ${className}
            `}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={
              hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />

          {hasError && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <AlertCircle size={20} className="text-red-500" />
            </div>
          )}
        </div>

        {hasError ? (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-sm text-red-600 flex items-center gap-1 animate-slide-in-left"
            role="alert"
          >
            <AlertCircle size={14} />
            {error}
          </p>
        ) : helperText ? (
          <p
            id={`${inputId}-helper`}
            className="mt-1.5 text-sm text-gray-500"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

export default FormField;
