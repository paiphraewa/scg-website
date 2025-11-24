// app/api/company-incorporation/cayman/beneficial-ownership/route.ts

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

    const { onboardingId, jurisdiction, data } = await req.json();

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

    // Build declaration payload including signature meta
    const declaration = {
      entityName: data.entityName,
      incorporationNumber: data.incorporationNumber,
      entityType: data.entityType,
      category: data.category,
      declarationText: data.declarationText,
      signer: data.signer,
      completedByName: data.completedByName || null,

      // Signature meta identical to BVI
      signature: data.signature || null,
      signatureType: data.signatureType || null,
      signatureFileName: data.signatureFileName || null,
      signatureDataUrl: data.signatureDataUrl || null,
      signed: data.signed || false,
      signedAt:
        data.signedAt ||
        (data.signed ? new Date().toISOString() : null),
    };

    // Save to prisma
    await prisma.companyIncorporation.update({
      where: { onboardingId },
      data: {
        caymanBoDeclaration: declaration,
        status: "draft",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Cayman BO Declaration Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
