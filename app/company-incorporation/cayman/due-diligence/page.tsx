// app/company-incorporation/cayman/due-diligence/page.tsx

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CaymanDueDiligenceForm, {
  CaymanDueDiligenceData,
} from "@/components/cayman-due-diligence-form";

interface PageProps {
  searchParams?: {
    onboardingId?: string;
    jurisdiction?: string;
  };
}

export default async function CaymanDueDiligencePage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(
      "/login?callbackUrl=/company-incorporation/cayman/due-diligence"
    );
  }

  const onboardingId = searchParams?.onboardingId;
  if (!onboardingId) {
    redirect("/incorporate/cayman");
  }

  const incorporation = await prisma.companyIncorporation.findUnique({
    where: { onboardingId },
  });

  if (!incorporation) {
    redirect("/incorporate/cayman");
  }

  const initialData =
    (incorporation.caymanDueDiligence as unknown as CaymanDueDiligenceData) ??
    ({} as CaymanDueDiligenceData);

  return (
    <CaymanDueDiligenceForm
      onboardingId={onboardingId}
      jurisdiction="cayman"
      initialData={initialData}
    />
  );
}
