// app/api/company-incorporation/cayman/due-diligence/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { onboardingId, data } = await req.json();

    if (!onboardingId) {
      return NextResponse.json(
        { error: "Missing onboardingId" },
        { status: 400 }
      );
    }

    // Check ownership
    const ob = await prisma.clientOnboarding.findUnique({
      where: { id: onboardingId },
      select: { userId: true },
    });

    if (!ob || ob.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Save as JSON
    await prisma.companyIncorporation.update({
      where: { onboardingId },
      data: {
        caymanDueDiligence: data,
        signature: data.signature || null,
        signatureType: data.signatureType || null,
        signatureFileName: data.signatureFileName || null,
        signedAt: data.signed ? new Date().toISOString() : null,

        status: "draft",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Cayman Due Diligence Error:", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
