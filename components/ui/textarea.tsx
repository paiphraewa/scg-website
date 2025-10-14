import React from 'react';

interface TextareaProps {
  id?: string;
  placeholder?: string;
  className?: string;
  rows?: number;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
}

export function Textarea({ 
  id,
  placeholder = '', 
  className = '', 
  rows = 4,
  value,
  onChange,
  required
}: TextareaProps) {
  return (
    <textarea
      id={id}
      placeholder={placeholder}
      rows={rows}
      className={`border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      value={value}
      onChange={onChange}
      required={required}
    />
  );
}