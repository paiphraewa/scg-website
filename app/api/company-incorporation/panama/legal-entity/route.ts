// app/api/company-incorporation/panama/legal-entity/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET  /api/company-incorporation/panama/legal-entity?onboardingId=...
 * -> returns the saved panamaLegalEntity JSON (if any)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const onboardingId = searchParams.get("onboardingId");

    if (!onboardingId) {
      return NextResponse.json(
        { ok: false, error: "Missing onboardingId" },
        { status: 400 }
      );
    }

    const inc = await prisma.companyIncorporation.findUnique({
      where: { onboardingId },
      include: {
        onboarding: true,
      },
    });

    // Check ownership
    if (!inc || inc.onboarding.userId !== session.user.id) {
      return NextResponse.json(
        { ok: false, error: "Not found or forbidden" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: inc.panamaLegalEntity ?? null,
    });
  } catch (err) {
    console.error("[panama/legal-entity] GET error:", err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/company-incorporation/panama/legal-entity
 * Body: { onboardingId: string, formType?: string, data: any }
 * -> upserts CompanyIncorporation.panamaLegalEntity
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    const onboardingId = body?.onboardingId as string | undefined;
    const data = body?.data;

    if (!onboardingId || !data) {
      return NextResponse.json(
        { ok: false, error: "Missing onboardingId or data" },
        { status: 400 }
      );
    }

    // Verify the onboarding belongs to this user
    const onboarding = await prisma.clientOnboarding.findUnique({
      where: { id: onboardingId },
      select: { userId: true },
    });

    if (!onboarding || onboarding.userId !== session.user.id) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Update the CompanyIncorporation row
    const updated = await prisma.companyIncorporation.update({
      where: { onboardingId },
      data: {
        panamaLegalEntity: data,
        // keep status as "draft" here; you'll flip to "paid" via mark-paid
      },
    });

    return NextResponse.json({ ok: true, id: updated.id });
  } catch (err) {
    console.error("[panama/legal-entity] POST error:", err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
