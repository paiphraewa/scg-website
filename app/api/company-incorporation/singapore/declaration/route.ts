// app/api/company-incorporation/singapore/declaration/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { onboardingId, jurisdiction, data } = await req.json();

    if (!onboardingId) {
      return NextResponse.json(
        { error: "Missing onboardingId" },
        { status: 400 }
      );
    }

    // Ensure the record exists
    const incorporation = await prisma.companyIncorporation.findUnique({
      where: { onboardingId },
      select: { onboardingId: true, jurisdiction: true }
    });

    if (!incorporation) {
      return NextResponse.json(
        { error: "Incorporation not found" },
        { status: 404 }
      );
    }

    // Save Singapore declaration JSON
    await prisma.companyIncorporation.update({
      where: { onboardingId },
      data: {
        singaporeDeclaration: data
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[sg-declaration]", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
