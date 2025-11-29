// app/company-incorporation/hongkong/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { HongKongIncorporationForm } from "@/components/hongkong-incorporation-form";

export default function HongKongIncorporationPage() {
  const params = useSearchParams();

  const onboardingId = params.get("onboardingId");
  const jurisdiction = params.get("jurisdiction") || "hongkong";

  // If onboardingId missing, show fallback
  if (!onboardingId) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-semibold mb-3">
          Missing onboarding ID
        </h2>
        <p className="text-muted-foreground">
          Please start again from the beginning.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <HongKongIncorporationForm
        onboardingId={onboardingId}
        jurisdiction={jurisdiction}
      />
    </div>
  );
}
