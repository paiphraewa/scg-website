"use client";

import PanamaBoardOfDirectorsForm from "@/components/panama-board-of-directors-form";
import { useSearchParams } from "next/navigation";

export default function PanamaBoardOfDirectorsPage() {
  const params = useSearchParams();
  const onboardingId = params.get("onboardingId") || "";
  const jurisdiction = params.get("jurisdiction") || "panama";

  if (!onboardingId) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold mb-4">Missing onboardingId</h2>
        <p>Please start again.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10">
      <PanamaBoardOfDirectorsForm
        onboardingId={onboardingId}
        jurisdiction={jurisdiction}
      />
    </div>
  );
}
