// app/pricing/page.tsx
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers, cookies } from 'next/headers'

/**
 * Server action: mark incorporation as paid via API call
 */
async function markPaid(onboardingId: string) {
  'use server'

  // Optional local auth check
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  // Absolute origin for API request
  const origin =
    process.env.NEXT_PUBLIC_BASE_URL ??
    headers().get('origin') ??
    'http://localhost:3000'

  // Forward session cookies so API route can verify the user
  const cookieHeader = cookies().toString()

  // Call API
  const res = await fetch(`${origin}/api/incorporation/mark-paid`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ onboardingId }),
    cache: 'no-store',
  })

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`Payment failed: ${err}`)
  }

  // On success → go to onboarding form
  redirect(`/client-register?onboardingId=${onboardingId}&jurisdiction=BVI`)
}

/**
 * Page component
 */
export default async function Pricing({
  searchParams,
}: {
  searchParams: { onboardingId?: string }
}) {
  const session = await auth()
  if (!session) redirect('/login?callbackUrl=/pricing')

  const onboardingId = searchParams.onboardingId
  if (!onboardingId) redirect('/incorporate/bvi')

  // Server action wrapper for <form>
  async function pay() {
    'use server'
    return markPaid(onboardingId)
  }

  return (
    <form
      action={pay}
      className="max-w-xl mx-auto p-8 space-y-6 border rounded-lg shadow-sm mt-10"
    >
      <h1 className="text-2xl font-bold text-center">Choose your BVI Package</h1>

      <div className="rounded-lg border p-4">
        <p className="font-medium">Standard Incorporation</p>
        <p className="text-sm text-muted-foreground">
          Includes registered office &amp; first-year maintenance
        </p>
        <p className="mt-2 text-xl font-semibold">$1,200 USD</p>
      </div>

      <button type="submit" className="btn btn-primary w-full mt-4">
        Pay now (mock)
      </button>

      <p className="text-xs text-muted-foreground text-center">
        This is a mock payment page for testing only.
      </p>
    </form>
  )
}
