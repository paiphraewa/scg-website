import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { onboardingId, data } = body

    if (!onboardingId) {
      return NextResponse.json({ error: "Missing onboardingId" }, { status: 400 })
    }

    const result = await prisma.companyIncorporation.upsert({
      where: { onboardingId },

      create: {
        jurisdiction: "PANAMA",
        panamaBeneficialOwner: data,

        onboarding: {
          connect: { id: onboardingId }
        }
      },

      update: {
        jurisdiction: "PANAMA",
        panamaBeneficialOwner: data,
      },
    })

    return NextResponse.json({ ok: true, result })
  } catch (err) {
    console.error("PANAMA BENEFICIAL OWNER ERROR:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
