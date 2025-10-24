'use client'

import * as React from 'react'
import { JURISDICTIONS } from '@/lib/jurisdictions'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export function JurisdictionPicker() {
  const [selected, setSelected] = React.useState<string>('bvi')
  const router = useRouter()

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
      <select
        aria-label="Choose jurisdiction"
        className="border rounded-md px-3 py-2"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
      >
        {JURISDICTIONS.map(j => (
          <option key={j.slug} value={j.slug}>{j.label}</option>
        ))}
      </select>

      {/* Start flow in the chosen jurisdiction */}
      <Button onClick={() => router.push(`/incorporate/${selected}`)}>
        Start Company
      </Button>

      {/* Resume flow in the chosen (or most recent) jurisdiction */}
      <form action="/resume" method="post">
        <input type="hidden" name="preferredJurisdiction" value={selected} />
        <Button type="submit" variant="outline">
          Resume Application
        </Button>
      </form>
    </div>
  )
}
