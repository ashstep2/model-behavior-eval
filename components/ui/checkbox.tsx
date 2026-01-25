'use client';

import { forwardRef, InputHTMLAttributes } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', label, description, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).slice(2, 9)}`;

    return (
      <div className={`flex items-start gap-3 ${className}`}>
        <div className="flex h-5 items-center">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className="h-4 w-4 cursor-pointer rounded border-gray-300 text-black focus:ring-1 focus:ring-black focus:ring-offset-2"
            {...props}
          />
        </div>
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label
                htmlFor={checkboxId}
                className="cursor-pointer text-sm font-medium text-black"
              >
                {label}
              </label>
            )}
            {description && (
              <span className="text-sm text-gray-500">{description}</span>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
