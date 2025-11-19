// app/api/incorporation/start-orders/route.ts

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ensurePendingOrder } from "@/lib/orders";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { onboardingId, jurisdiction, companyNames } = await req.json();

    if (!onboardingId || !jurisdiction) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Create/find the pending order
    const order = await ensurePendingOrder({
      userId: session.user.id,
      userEmail: session.user.email!,
      onboardingId,
      jurisdiction,
      companyNames,
      pricingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?onboardingId=${onboardingId}`,
    });

    // Always return pricingUrl
    return NextResponse.json({
      ok: true,
      pricingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?onboardingId=${onboardingId}`,
    });

  } catch (err) {
    console.error("[start-order]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
