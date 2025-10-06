import React from 'react';

interface InputProps {
  type?: string;
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function Input({ 
  type = 'text', 
  placeholder = '', 
  className = '', 
  value,
  onChange 
}: InputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      className={`border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      value={value}
      onChange={onChange}
    />
  );
}