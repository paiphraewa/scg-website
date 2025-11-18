// app/api/incorporation/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Slug -> token used in DB
const slugToToken: Record<string, "BVI" | "CAYMAN" | "PANAMA" | "HONGKONG" | "SINGAPORE"> = {
  bvi: "BVI",
  cayman: "CAYMAN",
  panama: "PANAMA",
  hongkong: "HONGKONG",
  singapore: "SINGAPORE",
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const jurisdictionSlug = (searchParams.get("jurisdiction") || "bvi").toLowerCase();
    const jurisdictionToken = slugToToken[jurisdictionSlug] || "BVI";

    // 1) Create a new ClientOnboarding for this user
    const onboarding = await prisma.clientOnboarding.create({
      data: {
        userId: session.user.id,
        status: "PENDING",
      },
    });

    // 2) Create matching CompanyIncorporation row (generic, works for BVI + Panama)
    await prisma.companyIncorporation.create({
      data: {
        onboardingId: onboarding.id,
        jurisdiction: jurisdictionToken,
        // All JSON fields are optional in your schema now
        status: "draft",
      },
    });

    return NextResponse.json({
      ok: true,
      onboardingId: onboarding.id,
      jurisdiction: jurisdictionToken,
    });
  } catch (err) {
    console.error("Error in /api/incorporation/start:", err);
    return NextResponse.json(
      { error: "Failed to start incorporation" },
      { status: 500 }
    );
  }
}
