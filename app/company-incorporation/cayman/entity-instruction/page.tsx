// app/company-incorporation/cayman/entity-instruction/page.tsx

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

import CaymanEntityInstructionForm from "@/components/cayman-entity-instruction-form";

import type { CaymanEntityInstructionData } from "@/components/cayman-entity-instruction-form";

export default async function CaymanEntityInstructionPage({ searchParams }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(
      "/login?callbackUrl=/company-incorporation/cayman/entity-instruction"
    );
  }

  const onboardingId = searchParams.onboardingId;
  if (!onboardingId) redirect("/incorporate/cayman");

  // Load incorporation record (draft or existing)
  const incorporation = await prisma.companyIncorporation.findUnique({
    where: { onboardingId },
  });

  if (!incorporation) redirect("/incorporate/cayman");

  const initialData: CaymanEntityInstructionData =
    (incorporation.caymanEntityInstruction as unknown as CaymanEntityInstructionData) ??
    ({} as CaymanEntityInstructionData);

  return (
    <div className="min-h-screen w-full bg-[#0A1B2B] py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <CaymanEntityInstructionForm
          onboardingId={onboardingId}
          jurisdiction="CAYMAN"
          initialData={initialData}
        />
      </div>
    </div>
  );
}
