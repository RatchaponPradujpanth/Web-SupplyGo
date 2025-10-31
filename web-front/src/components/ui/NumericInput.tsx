'use client';

import React from 'react';

interface NumericInputProps {
  label?: string;
  value: number | string;
  min?: number;
  max?: number;
  placeholder?: string;
  onChange: (val: number | string) => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
}

export default function NumericInput({
  label,
  value,
  min,
  max,
  placeholder,
  onChange,
  icon,
  disabled = false,
  className = '',
  inputClassName = '',
  labelClassName = ''
}: NumericInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    
    // อนุญาตให้เป็นค่าว่างหรือตัวเลขเท่านั้น
    if (val === '') {
      onChange('');
    } else if (/^\d+$/.test(val)) {
      const numVal = Number(val);
      // ตรวจสอบ max (ถ้ามี)
      if (max === undefined || numVal <= max) {
        onChange(numVal);
      }
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // ล้างค่า 0 เมื่อ focus
    if (!disabled && Number(value) === 0) {
      onChange('');
    } else if (!disabled) {
      e.target.select();
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // ถ้าเป็นค่าว่าง ให้กลับเป็น min หรือ 0
    if (!disabled && e.target.value === '') {
      onChange(min ?? 0);
    }
  };

  // Default styles ที่สามารถ override ได้
  const defaultInputStyles = 'border border-gray-300 p-3 w-full rounded-lg transition duration-150 ease-in-out focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500';
  const defaultLabelStyles = 'block mb-2 text-sm font-medium text-gray-700 flex items-center gap-2';

  return (
    <div className={className}>
      {label && (
        <label className={labelClassName || defaultLabelStyles}>
          {icon && <span className="text-gray-400">{icon}</span>}
          {label}
        </label>
      )}
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        min={min}
        max={max}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={inputClassName || defaultInputStyles}
      />
    </div>
  );
}
