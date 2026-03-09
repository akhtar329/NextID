// app/component/ui/select.tsx
"use client";

import React from "react";

export interface SelectOption<T> {
  value: T;
  label: string;
}

interface SelectProps<T> {
  label: string;
  value: T;
  onChange: (val: T) => void;
  options: SelectOption<T>[];
  required?: boolean;
}

export default function Select<T>({
  label,
  value,
  onChange,
  options,
  required = false,
}: SelectProps<T>) {
  return (
    <div className="flex flex-col">
      <label className="mb-1 text-sm font-medium text-gray-700">{label}</label>
      <select
        value={value as any}
        onChange={(e) => {
          const val = e.target.value;
          const option = options.find((o) => String(o.value) === val);
          if (option) onChange(option.value);
        }}
        required={required}
        className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">Select {label}</option>
        {options
          .filter((opt) => opt.value !== undefined && opt.value !== null) // ✅ filter undefined/null
          .map((opt) => (
            <option key={String(opt.value)} value={String(opt.value)}>
              {opt.label}
            </option>
          ))}
      </select>
    </div>
  );
}
