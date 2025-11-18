"use client";

import PanamaBeneficialOwnerForm from "@/components/panama-beneficial-owner-form";
import { useSearchParams } from "next/navigation";

export default function PanamaBeneficialOwnerPage() {
  const params = useSearchParams();

  const onboardingId = params.get("onboardingId");
  const jurisdiction = params.get("jurisdiction") || "panama";
  const requiresNomineeDirector =
    params.get("requiresNomineeDirector") === "yes";

  if (!onboardingId) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold mb-4">Missing onboardingId</h2>
        <p>Please start again from the beginning.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10">
      <PanamaBeneficialOwnerForm
        onboardingId={onboardingId}
        jurisdiction={jurisdiction}
        requiresNomineeDirector={requiresNomineeDirector}
      />
    </div>
  );
}
