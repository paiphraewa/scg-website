// components/searchable-country-select.tsx
"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { countries } from "@/lib/countries";

export function SearchableCountrySelect({
  label,
  value,
  onChange,
  disabled = false,
  placeholder = "Select a country",
  showPhoneCode = false,
  hideLabel = false,
  className = "",
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filtered = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.code.toLowerCase().includes(query.toLowerCase()) ||
      (c.phoneCode && c.phoneCode.toLowerCase().includes(query.toLowerCase()))
  );

  const selected = showPhoneCode
    ? countries.find((c) => c.phoneCode === value)
    : countries.find((c) => c.name === value);

  return (
    <div className={`space-y-2 relative ${className}`}>
      {!hideLabel && <Label className="text-white">{label}</Label>}

      {/* MAIN SELECT BUTTON */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen((o) => !o)}
        disabled={disabled}
        className="
          relative flex h-10 w-full items-center rounded-md 
          border border-gray-700 bg-gray-900 text-white
          px-3 py-2 text-sm
          hover:bg-gray-800
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
          disabled:cursor-not-allowed disabled:opacity-50
        "
      >
        <span className="flex-1 text-left truncate">
          {selected
            ? showPhoneCode
              ? `${selected.name} (${selected.phoneCode})`
              : selected.name
            : placeholder}
        </span>
      </button>

      {/* DROPDOWN */}
      {isOpen && (
        <div
          className="
            absolute z-50 mt-1 w-full 
            rounded-md border border-gray-700 
            bg-gray-900 shadow-lg
          "
        >
          {/* SEARCH INPUT */}
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="
              w-full bg-gray-800 text-white 
              placeholder-gray-400
              border-b border-gray-700
              px-3 py-2 text-sm 
              outline-none
            "
            placeholder="Search..."
          />

          {/* LIST */}
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-400">
                No matches
              </div>
            )}

            {filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  if (showPhoneCode) {
                    onChange(c.phoneCode, {
                      phoneCode: c.phoneCode,
                      phoneLength: c.phoneLength,
                    });
                  } else {
                    onChange(c.name);
                  }
                  setIsOpen(false);
                  setQuery("");
                }}
                className="
                  flex w-full items-center justify-between 
                  px-3 py-2 text-left text-sm 
                  text-white
                  hover:bg-gray-800
                "
              >
                <span>{c.name}</span>
                {showPhoneCode && (
                  <span className="text-xs text-gray-400">
                    {c.phoneCode}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
