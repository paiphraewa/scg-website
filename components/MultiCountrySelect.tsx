"use client"

import { useState } from "react"
import { countries } from "@/lib/countries"

export default function MultiCountrySelect({ value = [], onChange }) {
  const [search, setSearch] = useState("")

  const filtered = countries.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (country) => {
    if (value.includes(country)) {
      onChange(value.filter((c) => c !== country))
    } else {
      onChange([...value, country])
    }
  }

  return (
    <div className="border rounded p-2 space-y-2">
        <input
        className="w-full border border-gray-300 p-2 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Search country..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        />

      <div className="max-h-40 overflow-y-auto space-y-1 bg-white border border-gray-200 rounded-md">
        {filtered.map((c) => (
        <div
            key={c.code}
            onClick={() => toggle(c.name)}
            className={`cursor-pointer px-2 py-1 text-sm rounded ${
                value.includes(c.name)
                ? "bg-slate-200 text-slate-900"
                : "bg-white text-slate-900 hover:bg-slate-100"
            }`}
        >
            {c.name}
        </div>
        ))}
      </div>

    <div className="pt-2 space-y-2">
    <div className="font-semibold">Selected:</div>

    {value.length === 0 && (
        <p className="text-sm text-gray-500">None</p>
    )}

    <div className="flex flex-wrap gap-2">
        {value.map((country) => (
        <div
            key={country}
            className="flex items-center gap-2 bg-slate-100 text-slate-900 px-2 py-1 rounded-md text-sm"
        >
            {country}
            <button
            onClick={() =>
                onChange(value.filter((c) => c !== country))
            }
            className="text-slate-500 hover:text-red-600 font-bold"
            >
            ×
            </button>
        </div>
        ))}
    </div>
    </div>
    </div>
  )
}
