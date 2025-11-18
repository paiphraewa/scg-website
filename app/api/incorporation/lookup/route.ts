// app/api/incorporation/lookup/route.ts
export const dynamic = "force-dynamic";   
export const runtime = "nodejs";          

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const slugToToken: Record<string, "BVI" | "CAYMAN" | "PANAMA" | "HONGKONG" | "SINGAPORE"> = {
  bvi: "BVI",
  cayman: "CAYMAN",
  panama: "PANAMA",
  hongkong: "HONGKONG",
  singapore: "SINGAPORE",
};

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ found: false, reason: "Unauthenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const jurisdictionSlug = (searchParams.get("jurisdiction") || "bvi").toLowerCase();
    const jurisdictionToken = slugToToken[jurisdictionSlug] || "BVI";

    const incorporation = await prisma.companyIncorporation.findFirst({
      where: {
        jurisdiction: jurisdictionToken,
        status: "draft",
        onboarding: { userId: session.user.id },
      },
      orderBy: { createdAt: "desc" },
      include: { onboarding: true },
    });

    if (!incorporation) return NextResponse.json({ found: false });

    return NextResponse.json({
      found: true,
      status: incorporation.status,
      onboardingId: incorporation.onboardingId,
      token: incorporation.jurisdiction,
    });
  } catch (err) {
    console.error("Error in /api/incorporation/lookup:", err);
    return NextResponse.json(
      { found: false, error: "Lookup failed" },
      { status: 500 }
    );
  }
}
