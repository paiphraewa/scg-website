// components/ui/input.tsx - FIXED VERSION
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // This extends all native input props automatically
}

export function Input({ 
  type = 'text', 
  placeholder = '', 
  className = '', 
  value,
  onChange,
  name, // Added name attribute
  id, // Added id attribute
  required, // Added required attribute
  disabled, // Added disabled attribute
  ...props // This captures all other native input props
}: InputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      className={`border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      value={value}
      onChange={onChange}
      name={name} // Crucial: Add name attribute
      id={id} // Crucial: Add id attribute  
      required={required}
      disabled={disabled}
      {...props} // Spread all other props
    />
  );
}