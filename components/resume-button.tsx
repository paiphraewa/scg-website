'use client'

import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import * as React from 'react'

/**
 * Props:
 *  - defaultJurisdiction: slug like 'bvi' | 'cayman' | 'hongkong' | 'singapore' | 'panama'
 *  - showPicker: if true, renders a <select> so user can pick a jurisdiction to resume/start
 */
export function ResumeButton({
  defaultJurisdiction = 'bvi',
  showPicker = false,
}: {
  defaultJurisdiction?: string
  showPicker?: boolean
}) {
  const { data: session } = useSession()
  const [jurisdiction, setJurisdiction] = React.useState(defaultJurisdiction)

  // If user isn’t logged in, hide the button (or render a login link if you prefer)
  if (!session) return null

  return (
    <form action="/resume" method="post" className="flex items-center gap-2">
      {showPicker && (
        <select
          name="preferredJurisdiction"
          value={jurisdiction}
          onChange={e => setJurisdiction(e.target.value)}
          className="border rounded-md px-2 py-1"
        >
          <option value="bvi">British Virgin Islands (BVI)</option>
          <option value="cayman">Cayman Islands</option>
          <option value="hongkong">Hong Kong</option>
          <option value="singapore">Singapore</option>
          <option value="panama">Panama</option>
        </select>
      )}

      {!showPicker && (
        <input type="hidden" name="preferredJurisdiction" value={jurisdiction} />
      )}

      <Button type="submit" variant="outline">Resume Application</Button>
    </form>
  )
}
