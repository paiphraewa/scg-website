import React from 'react';

interface SelectProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
}

export function Select({ children, value, onValueChange, defaultValue }: SelectProps) {
  return (
    <div className="select-container">
      {children}
    </div>
  );
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export function SelectTrigger({ children, className = '' }: SelectTriggerProps) {
  return (
    <div className={`select-trigger ${className}`}>
      {children}
    </div>
  );
}

interface SelectValueProps {
  placeholder?: string;
  children?: React.ReactNode;
}

export function SelectValue({ placeholder, children }: SelectValueProps) {
  return (
    <span className="select-value">
      {children || placeholder}
    </span>
  );
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

export function SelectContent({ children, className = '' }: SelectContentProps) {
  return (
    <div className={`select-content ${className}`}>
      {children}
    </div>
  );
}

interface SelectItemProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

export function SelectItem({ children, value, className = '' }: SelectItemProps) {
  return (
    <div className={`select-item ${className}`} data-value={value}>
      {children}
    </div>
  );
}