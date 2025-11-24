// app/api/company-incorporation/cayman/entity-instruction/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { onboardingId, jurisdiction, data } = body;

    if (!onboardingId) {
      return NextResponse.json({ error: "Missing onboardingId" }, { status: 400 });
    }

    if (jurisdiction !== "CAYMAN") {
      return NextResponse.json({ error: "Invalid jurisdiction" }, { status: 400 });
    }

    const hdr = headers();
    const userAgent = hdr.get("user-agent") || "";
    const ipAddress =
      hdr.get("x-forwarded-for") ||
      hdr.get("x-real-ip") ||
      "Unknown";

    // ---- Update draft or mark as completed ----
    const updated = await prisma.companyIncorporation.update({
      where: { id: onboardingId },
      data: {
        caymanEntityInstruction: data,
        signature: data.signature || null,
        signatureType: data.signatureType || null,
        signatureFileName: data.signatureFileName || null,
        signedAt: data.signed ? new Date().toISOString() : null,
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({ success: true, updated });
  } catch (err: any) {
    console.error("CAYMAN ENTITY INSTRUCTION ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
