"use client";

import { useState, useEffect, useCallback } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  onSearch?: (value: string) => void;
};

export default function SearchInput({
  value: externalValue,
  onChange,
  placeholder = "Search...",
  debounceMs = 300,
  onSearch,
}: Props) {
  const [internalValue, setInternalValue] = useState(externalValue);

  // Handle clear button click
  const handleClear = useCallback(() => {
    setInternalValue("");
    onChange("");
  }, [onChange]);

  // Handle Enter key press
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(internalValue);
    }
  }, [onSearch, internalValue]);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (internalValue !== externalValue) {
        onChange(internalValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [internalValue, onChange, debounceMs, externalValue]);

  return (
    <div className="relative w-full md:w-1/3">
      <input
        type="text"
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
      />
      {internalValue && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      )}
    </div>
  );
}