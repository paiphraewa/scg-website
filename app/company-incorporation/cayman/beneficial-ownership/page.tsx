// app/company-incorporation/cayman/beneficial-ownership/page.tsx

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CaymanBoDeclarationForm, {
  CaymanBoDeclarationData,
} from "@/components/cayman-bo-declaration-form";

export default async function CaymanBoDeclarationPage({
  searchParams,
}: {
  searchParams: { onboardingId?: string; jurisdiction?: string };
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(
      "/login?callbackUrl=/company-incorporation/cayman/beneficial-ownership"
    );
  }

  const onboardingId = searchParams.onboardingId;
  if (!onboardingId) redirect("/incorporate/cayman");

  const incorporation = await prisma.companyIncorporation.findUnique({
    where: { onboardingId },
  });

  if (!incorporation) redirect("/incorporate/cayman");

  const initialData =
    (incorporation.caymanBoDeclaration as unknown as CaymanBoDeclarationData) ??
    ({} as CaymanBoDeclarationData);

  return (
    <CaymanBoDeclarationForm
      onboardingId={onboardingId}
      jurisdiction="CAYMAN"
      initialData={initialData}
    />
  );
}
