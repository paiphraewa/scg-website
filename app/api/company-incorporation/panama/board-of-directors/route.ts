import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { onboardingId, directors } = body

    if (!onboardingId) {
      return NextResponse.json({ error: "Missing onboardingId" }, { status: 400 })
    }

    const result = await prisma.companyIncorporation.upsert({
      where: { onboardingId },

      create: {
        jurisdiction: "PANAMA",
        panamaDirectors: directors,

        onboarding: {
          connect: { id: onboardingId }
        }
      },

      update: {
        jurisdiction: "PANAMA",
        panamaDirectors: directors,
      },
    })

    return NextResponse.json({ ok: true, result })
  } catch (err) {
    console.error("PANAMA DIRECTORS ERROR:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
