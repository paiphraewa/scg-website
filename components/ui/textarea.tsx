import React from 'react';

interface TextareaProps {
  placeholder?: string;
  className?: string;
  rows?: number;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export function Textarea({ 
  placeholder = '', 
  className = '', 
  rows = 4,
  value,
  onChange 
}: TextareaProps) {
  return (
    <textarea
      placeholder={placeholder}
      rows={rows}
      className={`border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      value={value}
      onChange={onChange}
    />
  );
}